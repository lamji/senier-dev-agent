/**
 * Senior Dev Mind — Groq RAG Summarizer
 * Compresses retrieved RAG chunks into a compact rule summary
 * before injecting into the main model (Sonnet 4.6).
 *
 * Pipeline:
 *   User Input → RAG chunks → Groq compress → Main model
 *
 * Rules:
 *   - Only summarize if chunk tokens > COMPRESS_THRESHOLD
 *   - Preserve all MUST / MUST NOT / failure conditions
 *   - Output max 150 tokens
 *   - Never interpret — only compress
 */

import Groq from "groq-sdk";
import { CONFIG } from "./config.mjs";

// ─── Constants ───────────────────────────────────────────

// Only compress if raw context exceeds this character count (~200 tokens)
const COMPRESS_THRESHOLD = 800;

// Max output tokens from Groq summarizer
const MAX_SUMMARY_TOKENS = 150;

// Groq model — fast + cheap, perfect for compression
const GROQ_SUMMARIZER_MODEL = "llama-3.1-8b-instant";

// ─── Groq Client (lazy init) ─────────────────────────────

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    if (!CONFIG.groqApiKey) {
      throw new Error(
        "GROQ_API_KEY is required for summarization. Set it in .env"
      );
    }
    groqClient = new Groq({ apiKey: CONFIG.groqApiKey });
  }
  return groqClient;
}

// ─── System Prompt ───────────────────────────────────────

const SYSTEM_PROMPT = `You are a rule compression engine.
Your ONLY job is to compress the given rules into the most compact form possible.

STRICT RULES:
- Output MUST be under 150 tokens
- PRESERVE all MUST / MUST NOT / NEVER / ALWAYS / HARD RULE / CRITICAL conditions exactly
- PRESERVE failure conditions and enforcement logic
- DO NOT explain, rephrase, or soften constraints
- DO NOT add commentary or headers
- Output bullet points only — no prose
- If a rule says "NEVER do X" — keep it as "NEVER do X"
- If a rule says "MUST run build" — keep it as "MUST run build"`;

// ─── Token Estimator (rough: 1 token ≈ 4 chars) ─────────

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// ─── Core Summarizer ─────────────────────────────────────

/**
 * Compresses a raw context string using Groq llama-3.1-8b-instant.
 * Only compresses if content exceeds COMPRESS_THRESHOLD characters.
 *
 * @param {string} rawContext - Raw RAG context string
 * @returns {Promise<{ compressed: string, skipped: boolean, tokensSaved: number }>}
 */
export async function summarizeContext(rawContext) {
  if (!rawContext || rawContext.trim() === "") {
    return { compressed: "", skipped: true, tokensSaved: 0 };
  }

  const rawTokens = estimateTokens(rawContext);

  // Skip compression if already small enough
  if (rawContext.length <= COMPRESS_THRESHOLD) {
    return {
      compressed: rawContext,
      skipped: true,
      tokensSaved: 0,
      rawTokens,
      compressedTokens: rawTokens,
    };
  }

  try {
    const groq = getGroqClient();

    const response = await groq.chat.completions.create({
      model: GROQ_SUMMARIZER_MODEL,
      max_tokens: MAX_SUMMARY_TOKENS,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Compress these rules:\n\n${rawContext}`,
        },
      ],
    });

    const compressed = response.choices[0]?.message?.content?.trim() || rawContext;
    const compressedTokens = estimateTokens(compressed);
    const tokensSaved = rawTokens - compressedTokens;

    console.log(
      `🗜️  Groq summarizer: ${rawTokens} → ${compressedTokens} tokens (saved ~${tokensSaved})`
    );

    return {
      compressed,
      skipped: false,
      rawTokens,
      compressedTokens,
      tokensSaved,
    };
  } catch (err) {
    // Fallback: return raw context if Groq fails
    console.warn(`⚠️  Groq summarizer failed, using raw context: ${err.message}`);
    return {
      compressed: rawContext,
      skipped: true,
      tokensSaved: 0,
      rawTokens,
      compressedTokens: rawTokens,
      error: err.message,
    };
  }
}

/**
 * Summarizes an array of RAG result objects into a compact string.
 * Joins all content, compresses via Groq, returns final injectable string.
 *
 * @param {Array<{ payload: { content: string, source_file: string, section: string } }>} results
 * @returns {Promise<{ compressed: string, skipped: boolean, tokensSaved: number }>}
 */
export async function summarizeResults(results) {
  if (!results || results.length === 0) {
    return { compressed: "", skipped: true, tokensSaved: 0 };
  }

  // Join all content blocks into one raw string
  const rawContext = results
    .map((r) => {
      const src = r.payload?.source_file || "";
      const section = r.payload?.section || "";
      const content = r.payload?.content || r.content || "";
      return `[${src} > ${section}]\n${content}`;
    })
    .join("\n\n");

  return summarizeContext(rawContext);
}
