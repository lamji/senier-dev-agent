import fetch from "node-fetch";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { CONFIG } from "../config.mjs";
import { embed } from "../embedder.mjs";
import { search } from "../qdrant.mjs";
import * as loader from "../helpers/context-loader.mjs";
import { printTerminalLog } from "../helpers/pretty-log.mjs";
import { summarizeResults } from "../summarizer.mjs";
import { isCasualChat } from "../helpers/detectors.mjs";

/**
 * Handles OpenAI-compatible Chat Completion requests.
 * Injects Akrizu-agent context + RAG results before proxying to Ollama.
 */
export const handleChatCompletion = async (req, res) => {
  try {
    const { messages = [], model, stream = false, useAkrizuAgent = true, ...rest } = req.body;

    // 1. Identification: Get the last message to use as the RAG query
    const userMessage = messages
      .filter((m) => m.role === "user")
      .pop()?.content;

    let ragContext = "";
    let sourcesFound = [];

    // Only apply RAG and Akrizu rules if the toggle is ON
    const isCasual = isCasualChat(userMessage);
    
    if (useAkrizuAgent && userMessage && typeof userMessage === "string") {
      // 1. RAG Retrieval (Skip if casual)
      if (!isCasual) {
        // 1. Summarization: 5 words or less (semantic extraction)
        const taskSummary = userMessage
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 2)
          .slice(0, 5)
          .join(' ');
        
        const { seniorChunks, mvpChunks, debugChunks, createChunks, adminChunks } =
          await loader.loadStandardChunks(userMessage);

        const vector = await embed(userMessage.trim());
        const taskResults = await search(vector, { limit: 10 }); 
        const dedupedTaskResults = loader.deduplicateResults(taskResults);

        const allChunks = [
          ...seniorChunks,
          ...mvpChunks,
          ...debugChunks,
          ...createChunks,
          ...adminChunks,
          ...dedupedTaskResults,
        ];

        // Use the summarizer to follow the "Token-Optimized" requirement
        const { compressed } = await summarizeResults(allChunks);
        ragContext = compressed;

        sourcesFound = allChunks.map((p) => p.payload.source_file);

        printTerminalLog({
          timestamp: new Date().toISOString(),
          endpoint: "/v1/chat/completions",
          task: taskSummary + "...",
          rulesApplied: allChunks.length,
          topSources: sourcesFound.slice(0, 5),
          ip: req.headers["x-forwarded-for"] || req.ip || null,
        });
      }

      // 4. Injection: Read System Prompt from external file
      // Always inject the persona rules (Operational Protocols) to prevent monologue leakage
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const promptPath = join(__dirname, "../system-promts.md");
      let contextInstruction = "";
      try {
        let rawPrompt = readFileSync(promptPath, "utf-8");
        
        // If RAG context is empty (casual chat), remove the RAG section to avoid model confusion
        if (!ragContext) {
          rawPrompt = rawPrompt.replace(/### AKRIZU PROJECT KNOWLEDGE \(RAG\)[\s\S]*?---/, "");
          rawPrompt = rawPrompt.replace("---", "");
          contextInstruction = rawPrompt.trim();
        } else {
          contextInstruction = rawPrompt.replace("{{RAG_CONTEXT}}", ragContext);
        }
      } catch (err) {
        console.error("Failed to load system-promts.md, using minimal fallback", err);
        contextInstruction = `### OPERATIONAL PROTOCOLS (STRICTLY MANDATORY)\nAct as a Senior Web Developer. NO MONOLOGUE. NO CHAIN OF THOUGHT.`;
      }

      // Check if there's already a system message
      const systemIndex = messages.findIndex((m) => m.role === "system");
      if (systemIndex !== -1) {
        messages[systemIndex].content = `${contextInstruction}\n\n${messages[systemIndex].content}`;
      } else {
        messages.unshift({
          role: "system",
          content: contextInstruction,
        });
      }
    }

    // 5. Proxy: Forward to Groq or Ollama
    const modelToUse = model || CONFIG.ollamaEmbedModel || "llama3.2:3b";
    const isGroq = modelToUse.startsWith("groq:") || modelToUse.includes("llama-3.3") || modelToUse.includes("llama-3.1") || modelToUse.includes("mixtral");
    const actualModel = modelToUse.replace("groq:", "");

    console.log(`[Gateway] Routing request - Model: ${actualModel}, Provider: ${isGroq ? 'Groq' : 'Ollama'}, Agent: ${useAkrizuAgent}`);

    if (isGroq && CONFIG.groqApiKey) {
      // Proxy to Groq
      const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
      const groqPayload = {
        model: actualModel,
        messages,
        stream,
        ...rest
      };

      const response = await fetch(groqUrl, {
        method: "POST",
        body: JSON.stringify(groqPayload),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CONFIG.groqApiKey}`
        },
      });

      if (!response.ok) {
        const errData = await response.text();
        console.error(`[Groq Error] ${response.status}: ${errData}`);
        return res.status(response.status).json({ error: "Groq API Error", details: errData });
      }

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        response.body.pipe(res);
      } else {
        const data = await response.json();
        res.json(data);
      }
    } else {
      // Proxy to Ollama
      const ollamaUrl = `${CONFIG.ollamaUrl}/api/chat`;
      const ollamaPayload = {
        model: actualModel,
        messages,
        stream,
        ...rest,
      };

      console.log(`[Ollama Request] ${ollamaUrl} - Payload:`, JSON.stringify(ollamaPayload).slice(0, 100));

      const response = await fetch(ollamaUrl, {
        method: "POST",
        body: JSON.stringify(ollamaPayload),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errData = await response.text();
        console.error(`[Ollama Error] ${response.status}: ${errData}`);
        return res.status(response.status).json({ error: "Ollama API Error", details: errData });
      }

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        response.body.pipe(res);
      } else {
        const data = await response.json();
        // Map Ollama /api/chat format to OpenAI /v1/chat/completions format
        res.json({
          choices: [{
            message: {
              content: data.message?.content || data.response || "No response content."
            }
          }]
        });
      }
    }
  } catch (err) {
    console.error("Gateway Proxy Error:", err);
    res.status(500).json({ error: "Akrizu Gateway Proxy failed", details: err.message });
  }
};

/**
 * Lists available models from Ollama (local) and Groq (cloud).
 */
export const listModels = async (req, res) => {
  try {
    const modelList = [];

    // 1. Fetch from Ollama
    try {
      const ollamaModelsUrl = `${CONFIG.ollamaUrl}/api/tags`;
      const ollamaRes = await fetch(ollamaModelsUrl);
      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        const models = data.models || [];
        const filtered = models
          .filter(m => {
            const name = (m.name || "").toLowerCase();
            if (name.includes("embed")) return false;
            // Focus on coding and generally capable models
            return name.includes("coder") || name.includes("qwen") || name.includes("llama") || name.includes("phi") || name.includes("starcoder") || name.includes("mistral") || name.includes("deepseek");
          })
          .map(m => ({
            id: m.name,
            object: "model",
            created: Date.now(),
            owned_by: "ollama",
            provider: "Ollama (Local)"
          }));
        modelList.push(...filtered);
      }
    } catch (e) { 
      console.warn("Ollama models fetch failed:", e.message); 
    }

    // 2. Fetch from Groq if key exists
    if (CONFIG.groqApiKey) {
      try {
        const groqModelsUrl = "https://api.groq.com/openai/v1/models";
        const groqRes = await fetch(groqModelsUrl, {
          headers: { "Authorization": `Bearer ${CONFIG.groqApiKey}` }
        });
        if (groqRes.ok) {
          const data = await groqRes.json();
          const mapped = data.data
            .filter(m => {
              const id = m.id.toLowerCase();
              // Exclude guard models, preview models, and older versions if better ones exist
              if (id.includes("guard") || id.includes("tool-use") || id.includes("whisper") || id.includes("distil")) return false;
              // Keep models known for coding/fast logic
              return id.includes("llama-3.3") || id.includes("llama-3.1") || id.includes("mixtral") || id.includes("qwen");
            })
            .map(m => ({
              id: `groq:${m.id}`,
              object: "model",
              created: m.created || Date.now(),
              owned_by: "groq",
              provider: "Groq (Cloud)"
            }));
          modelList.push(...mapped);
        }
      } catch (e) { console.warn("Groq models fetch failed"); }
    }

    res.json({
      object: "list",
      data: modelList,
    });
  } catch (err) {
    console.error("Error fetching models:", err);
    res.status(500).json({ error: "Failed to fetch models", details: err.message });
  }
};
