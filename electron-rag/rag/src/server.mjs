/**
 * Senior Dev Mind — HTTP Server (Agent-Compatible)
 * Exposes the RAG search as an HTTP API that any LLM agent can call.
 * Compatible with: Ollama, Groq, Roo Code, Antigravity, custom agents.
 *
 * Endpoints:
 *   POST /memory/save     — Auto-append conversation summary to memory + ingest into Qdrant
 *   POST /search          — Semantic search with filters
 *   POST /search/text     — Search by raw text (auto-embeds)
 *   POST /context         — LLM context injection (requires JSON body)
 *   GET  /context         — LLM context injection via query params (?task=...&limit=...&category=...)
 *   GET  /context/smart      — Senior-dev-rules base + semantically routed task chunks
 *   GET  /context/compressed — RAG chunks → Groq summarizer → compact rule injection
 *   GET  /rules           — All rule chunks from Qdrant (no embedding needed)
 *   GET  /health          — Health check
 *   GET  /stats           — Collection statistics
 *
 * Usage: npm run serve
 */
import express from "express";
import { CONFIG, validateConfig } from "./config.mjs";
import { embed } from "./embedder.mjs";
import { search, getStats, scrollAll, scrollByFile } from "./qdrant.mjs";
import { saveMemory } from "./memory.mjs";
import { summarizeContext } from "./summarizer.mjs";
import fs from "fs";
import path from "path";

// Simple keyword detector for MVP-related tasks
const isMvpTask = (task = "") => /\bmvp\b|init-mvp|minimum viable product/i.test(task);

// Simple keyword detector for debugging-related tasks
const isDebugTask = (task = "") =>
  /\b(debug|error|fix|bug|issue|fail|broken|hover)\b/i.test(task);

// Simple keyword detector for creation/build tasks
const isCreateTask = (task = "") =>
  /\b(create|build|add|make|scaffold|implement)\b/i.test(task);

const app = express();

// Ensure logs directory exists and prepare JSONL log file
const LOG_DIR = path.resolve(process.cwd(), "rag/logs");
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (e) {
  // ignore mkdir errors
}
const LOG_FILE = path.join(LOG_DIR, "rag_requests.log");

// Request logging middleware (append JSONL for relevant endpoints)
// Logs minimal metadata so you can audit whether a request reached the RAG server.
app.use((req, res, next) => {
  try {
    const now = new Date().toISOString();
    const ipHeader =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.ip ||
      (req.connection && req.connection.remoteAddress) ||
      "";
    const ip = String(ipHeader).split(",")[0].trim();
    const entry = {
      timestamp: now,
      method: req.method,
      path: req.path,
      query: req.query || {},
      ip,
      userAgent: req.headers["user-agent"] || null,
    };
    // Only persist entries for endpoints likely used by agents / LLMs
    if (/^\/(context|search|memory|rules)/.test(req.path)) {
      // Synchronously append a single JSONL line to keep ordering deterministic for tests
      try {
        fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n", "utf8");
      } catch (writeErr) {
        console.error("RAG logging write error:", writeErr);
      }
    }
  } catch (err) {
    console.error("RAG request logging error:", err);
  }
  next();
});

/**
 * Terminal-style pretty printer for incoming RAG requests.
 *
 * Prints a concise boxed summary to the server terminal so an operator
 * can see when a /context or /context/compressed call was received.
 *
 * Do not include sensitive request bodies here; only metadata and top sources.
 */
function printTerminalLog(entry) {
  try {
    const {
      timestamp = new Date().toISOString(),
      endpoint = "",
      task = "",
      rulesApplied = 0,
      topSources = [],
      compressionStats = null,
      ip = null,
    } = entry;

    const pad = (s = "", width = 70) =>
      (String(s).length > width
        ? String(s).slice(0, width - 3) + "..."
        : String(s)
      ).padEnd(width, " ");

    const width = 70;
    const sep = "─".repeat(width + 2);
    console.log("┌" + sep + "┐");
    console.log("│ " + pad(` RAG SERVER LOG — ${timestamp}`, width) + " │");
    console.log("├" + sep + "┤");
    console.log("│ " + pad(` Endpoint: ${endpoint}`, width) + " │");
    console.log("│ " + pad(` Task: ${task}`, width) + " │");
    console.log("│ " + pad(` Matched rules: ${rulesApplied}`, width) + " │");
    if (topSources && topSources.length) {
      console.log(
        "│ " +
          pad(` Top sources: ${topSources.slice(0, 5).join(", ")}`, width) +
          " │",
      );
    }
    if (compressionStats) {
      const cs = `Compression: raw=${compressionStats.rawTokens} compressed=${compressionStats.compressedTokens} saved=${compressionStats.savingsPercent}`;
      console.log("│ " + pad(cs, width) + " │");
    }
    if (ip) {
      console.log("│ " + pad(` From IP: ${ip}`, width) + " │");
    }
    console.log("└" + sep + "┘\n");
  } catch (err) {
    // Never throw from logger
    console.error("printTerminalLog error:", err);
  }
}

app.use(express.json());

// ─── CORS (allow all for local dev) ──────────────────────
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─── Health Check ────────────────────────────────────────
app.get("/health", async (req, res) => {
  try {
    const stats = await getStats();
    res.json({
      status: "ok",
      collection: CONFIG.collection,
      pointsCount: stats.points_count,
      vectorSize: CONFIG.vectorSize,
      embeddingProvider: CONFIG.embeddingProvider,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ─── Stats ───────────────────────────────────────────────
app.get("/stats", async (req, res) => {
  try {
    const stats = await getStats();
    res.json({
      collection: CONFIG.collection,
      pointsCount: stats.points_count,
      status: stats.status,
      vectorSize: CONFIG.vectorSize,
      segmentsCount: stats.segments_count,
      indexedVectorsCount: stats.indexed_vectors_count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /rules — All rule chunks, no embedding needed ───
// Perfect for AI agents with GET-only fetch tools.
// Usage: GET /rules
//        GET /rules?category=rule
//        GET /rules?category=workflow&priority=high&limit=20
app.get("/rules", async (req, res) => {
  try {
    const { category, priority, limit } = req.query;

    const points = await scrollAll({
      limit: limit ? parseInt(limit, 10) : 100,
      category: category || undefined,
      priority: priority || undefined,
    });

    const formatted = points.map((p) => ({
      content: p.payload.content,
      source_file: p.payload.source_file,
      section: p.payload.section,
      category: p.payload.category,
      tags: p.payload.tags,
      priority: p.payload.priority,
    }));

    res.json({
      totalRules: formatted.length,
      filters: {
        category: category || null,
        priority: priority || null,
      },
      rules: formatted,
    });
  } catch (err) {
    console.error("Rules error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /context/smart — Senior-gated semantic router ──
// Always injects senior-dev-rules.md first as the identity backbone.
// Then semantically routes to the most relevant chunks based on the task:
//   "debug/fix/error"     → trace-logs-explain-fix.md + troubleshooting.md
//   "create/build/add"    → create-feature.md
//   "mvp/project/init"    → mvp-workflows.md
//   "push/deploy/git"     → git-push.md
//
// Usage: GET /context/smart?task=debug+login+error&limit=5
app.get("/context/smart", async (req, res) => {
  try {
    const { task, limit = 5 } = req.query;

    if (!task || typeof task !== "string" || task.trim() === "") {
      return res.status(400).json({
        error: "task query param is required.",
        usage: "GET /context/smart?task=debug+login+error&limit=5",
      });
    }

    // Step 1 — Always load senior-dev-rules.md as the identity backbone
    const seniorChunks = await scrollByFile("workflows/senior-dev-rules.md");

    // Step 1b — If MVP-related, load mvp-workflows.md explicitly to guarantee coverage
    const mvpChunks = isMvpTask(task)
      ? await scrollByFile("rules/mvp-workflows.md")
      : [];

    // Step 1c — If debugging-related, load debugging playbooks
    const debugChunks = isDebugTask(task)
      ? [
          ...(await scrollByFile("rules/trace-logs-explain-fix.md")),
          ...(await scrollByFile("rules/troubleshooting.md")),
        ]
      : [];

    // Step 1d — If creation-related, load create-feature protocol
    const createChunks = isCreateTask(task)
      ? await scrollByFile("rules/create-feature.md")
      : [];

    // Step 2 — Embed the task and semantically find the most relevant chunks
    const vector = await embed(task.trim());
    const taskResults = await search(vector, {
      limit: parseInt(limit, 10),
    });

    // Step 3 — Deduplicate: remove any senior-dev-rules hits from task results
    const uniqueTaskResults = taskResults.filter(
      (r) => r.payload.source_file !== "workflows/senior-dev-rules.md",
    );

    // Step 3b — Deduplicate mvp chunks from task results as well
    const removeMvp = uniqueTaskResults.filter(
      (r) => r.payload.source_file !== "rules/mvp-workflows.md",
    );

    // Step 3c — Deduplicate debug chunks from task results
    const removeDebug = removeMvp.filter(
      (r) =>
        r.payload.source_file !== "rules/trace-logs-explain-fix.md" &&
        r.payload.source_file !== "rules/troubleshooting.md",
    );

    // Step 3d — Deduplicate create-feature chunks from task results
    const dedupedTaskResults = removeDebug.filter(
      (r) => r.payload.source_file !== "rules/create-feature.md",
    );

    // Step 4 — Format: senior rules, then explicit MVP rules (if any), then task-specific chunks
    const seniorBlocks = seniorChunks.map((p, i) => {
      const meta = `[Source: ${p.payload.source_file} | Section: ${p.payload.section} | Priority: ${p.payload.priority}]`;
      return `=== Senior Dev Rule ${i + 1} ===\n${meta}\n${p.payload.content}`;
    });

    const mvpBlocks = mvpChunks.map((p, i) => {
      const meta = `[Source: ${p.payload.source_file} | Section: ${p.payload.section} | Priority: ${p.payload.priority}]`;
      return `=== MVP Rule ${i + 1} ===\n${meta}\n${p.payload.content}`;
    });

    const debugBlocks = debugChunks.map((p, i) => {
      const meta = `[Source: ${p.payload.source_file} | Section: ${p.payload.section} | Priority: ${p.payload.priority}]`;
      return `=== Debug Rule ${i + 1} ===\n${meta}\n${p.payload.content}`;
    });

    const createBlocks = createChunks.map((p, i) => {
      const meta = `[Source: ${p.payload.source_file} | Section: ${p.payload.section} | Priority: ${p.payload.priority}]`;
      return `=== Create Rule ${i + 1} ===\n${meta}\n${p.payload.content}`;
    });

    const taskBlocks = dedupedTaskResults.map((r, i) => {
      const meta = `[Source: ${r.payload.source_file} | Section: ${r.payload.section} | Priority: ${r.payload.priority}]`;
      return `--- Task Rule ${i + 1} (${(r.score * 100).toFixed(0)}% match) ---\n${meta}\n${r.payload.content}`;
    });

    res.json({
      task,
      seniorDevRulesApplied: seniorChunks.length,
      taskRulesApplied: uniqueTaskResults.length,
      totalRulesApplied:
        seniorChunks.length + mvpChunks.length + debugChunks.length + createChunks.length +
        dedupedTaskResults.length,
      context: [...seniorBlocks, ...mvpBlocks, ...debugBlocks, ...createBlocks, ...taskBlocks].join("\n\n"),
      sources: {
        seniorDevRules: seniorChunks.map((p) => ({
          file: p.payload.source_file,
          section: p.payload.section,
          priority: p.payload.priority,
        })),
        mvpRules: mvpChunks.map((p) => ({
          file: p.payload.source_file,
          section: p.payload.section,
          priority: p.payload.priority,
        })),
        debugRules: debugChunks.map((p) => ({
          file: p.payload.source_file,
          section: p.payload.section,
          priority: p.payload.priority,
        })),
        createRules: createChunks.map((p) => ({
          file: p.payload.source_file,
          section: p.payload.section,
          priority: p.payload.priority,
        })),
        taskSpecific: dedupedTaskResults.map((r) => ({
          file: r.payload.source_file,
          section: r.payload.section,
          score: parseFloat(r.score.toFixed(4)),
          tags: r.payload.tags,
        })),
      },
    });
  } catch (err) {
    console.error("Context smart error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /context — GET-friendly semantic context lookup ─
// Designed for AI agents (like Claude) whose fetch tools only support GET.
// Embeds the task param and returns semantically relevant rule chunks.
//
// Usage: GET /context?task=create+a+login+page&limit=5
//        GET /context?task=booking+api&limit=5&category=rule
//        GET /context?task=debugging+error&limit=3&tags=debugging,backend
app.get("/context", async (req, res) => {
  try {
    const { task, limit = 5, category, tags } = req.query;

    if (!task || typeof task !== "string" || task.trim() === "") {
      return res.status(400).json({
        error: "task query param is required.",
        usage: "GET /context?task=create+a+login+page&limit=5",
        optionalParams: {
          limit: "number (default: 5)",
          category: "rule | workflow | template | memory",
          tags: "comma-separated e.g. tags=backend,api",
        },
      });
    }

    // Parse comma-separated tags into array
    const parsedTags = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    // Embed the task string → 768-dim vector
    const vector = await embed(task.trim());

    // Semantic search against Qdrant
    const results = await search(vector, {
      limit: parseInt(limit, 10),
      category: category || undefined,
      tags: parsedTags,
    });

    // Format as LLM-injectable context blocks
    const contextBlocks = results.map((r, i) => {
      const meta = `[Source: ${r.payload.source_file} | Section: ${r.payload.section} | Priority: ${r.payload.priority}]`;
      return `--- Rule ${i + 1} (${(r.score * 100).toFixed(0)}% match) ---\n${meta}\n${r.payload.content}`;
    });

    // Print terminal-style log for quick operator visibility
    try {
      printTerminalLog({
        timestamp: new Date().toISOString(),
        endpoint: "/context",
        task,
        rulesApplied: results.length,
        topSources: results.map((r) => r.payload.source_file).slice(0, 5),
        ip: req.headers["x-forwarded-for"] || req.ip || null,
      });
    } catch (e) {
      // ignore logging errors
    }

    res.json({
      task,
      rulesApplied: results.length,
      context: contextBlocks.join("\n\n"),
      sources: results.map((r) => ({
        file: r.payload.source_file,
        section: r.payload.section,
        score: parseFloat(r.score.toFixed(4)),
        tags: r.payload.tags,
      })),
    });
  } catch (err) {
    console.error("Context GET error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Search by Text (auto-embed) ─────────────────────────
app.post("/search/text", async (req, res) => {
  try {
    const {
      query,
      limit = 5,
      category,
      tags,
      priority,
      scoreThreshold,
    } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query (string) is required" });
    }

    const vector = await embed(query);

    const results = await search(vector, {
      limit,
      category,
      tags,
      priority,
      scoreThreshold,
    });

    const formatted = results.map((r) => ({
      score: r.score,
      content: r.payload.content,
      source_file: r.payload.source_file,
      section: r.payload.section,
      category: r.payload.category,
      tags: r.payload.tags,
      priority: r.payload.priority,
    }));

    res.json({
      query,
      resultsCount: formatted.length,
      results: formatted,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Search by Vector (pre-embedded) ─────────────────────
app.post("/search", async (req, res) => {
  try {
    const {
      vector,
      limit = 5,
      category,
      tags,
      priority,
      scoreThreshold,
    } = req.body;

    if (!vector || !Array.isArray(vector)) {
      return res.status(400).json({ error: "vector (number[]) is required" });
    }

    const results = await search(vector, {
      limit,
      category,
      tags,
      priority,
      scoreThreshold,
    });

    const formatted = results.map((r) => ({
      score: r.score,
      content: r.payload.content,
      source_file: r.payload.source_file,
      section: r.payload.section,
      category: r.payload.category,
      tags: r.payload.tags,
      priority: r.payload.priority,
    }));

    res.json({
      resultsCount: formatted.length,
      results: formatted,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /context/compressed — RAG → Groq summarizer ────
// Full pipeline: retrieves relevant chunks via RAG, then compresses
// via Groq llama-3.1-8b-instant before injecting into main model.
//
// Saves ~60-80% tokens compared to raw RAG injection into Sonnet 4.6.
// Compression is skipped if raw context < 800 chars (already small enough).
//
// Usage: GET /context/compressed?task=create+login+page&limit=3
app.get("/context/compressed", async (req, res) => {
  try {
    const { task, limit = 3 } = req.query;

    if (!task || typeof task !== "string" || task.trim() === "") {
      return res.status(400).json({
        error: "task query param is required.",
        usage: "GET /context/compressed?task=create+login+page&limit=3",
      });
    }

    // Step 1 — Always load senior-dev-rules.md as identity backbone
    const seniorChunks = await scrollByFile("workflows/senior-dev-rules.md");

    // Step 1b — If MVP-related, load mvp-workflows.md explicitly to guarantee coverage
    const mvpChunks = isMvpTask(task)
      ? await scrollByFile("rules/mvp-workflows.md")
      : [];

    // Step 1c — If debugging-related, load debugging playbooks
    const debugChunks = isDebugTask(task)
      ? [
          ...(await scrollByFile("rules/trace-logs-explain-fix.md")),
          ...(await scrollByFile("rules/troubleshooting.md")),
        ]
      : [];

    // Step 1d — If creation-related, load create-feature protocol
    const createChunks = isCreateTask(task)
      ? await scrollByFile("rules/create-feature.md")
      : [];

    // Step 2 — Semantic search for task-specific chunks
    const vector = await embed(task.trim());
    const taskResults = await search(vector, {
      limit: parseInt(limit, 10),
    });

    // Step 3 — Deduplicate senior-dev-rules from task results
    const uniqueTaskResults = taskResults.filter(
      (r) => r.payload.source_file !== "workflows/senior-dev-rules.md",
    );

    // Step 3b — Deduplicate mvp-workflows from task results
    const removeMvp = uniqueTaskResults.filter(
      (r) => r.payload.source_file !== "rules/mvp-workflows.md",
    );

    // Step 3c — Deduplicate debug playbooks from task results
    const removeDebug = removeMvp.filter(
      (r) =>
        r.payload.source_file !== "rules/trace-logs-explain-fix.md" &&
        r.payload.source_file !== "rules/troubleshooting.md",
    );

    // Step 3d — Deduplicate create-feature from task results
    const dedupedTaskResults = removeDebug.filter(
      (r) => r.payload.source_file !== "rules/create-feature.md",
    );

    // Step 4 — Build raw context string (senior first, then MVP rules, then debug rules, then create rules, then task-specific)
    const seniorRaw = seniorChunks
      .map(
        (p) =>
          `[${p.payload.source_file} > ${p.payload.section}]\n${p.payload.content}`,
      )
      .join("\n\n");

    const mvpRaw = mvpChunks
      .map(
        (p) => `[${p.payload.source_file} > ${p.payload.section}]\n${p.payload.content}`,
      )
      .join("\n\n");

    const debugRaw = debugChunks
      .map(
        (p) => `[${p.payload.source_file} > ${p.payload.section}]\n${p.payload.content}`,
      )
      .join("\n\n");

    const createRaw = createChunks
      .map(
        (p) => `[${p.payload.source_file} > ${p.payload.section}]\n${p.payload.content}`,
      )
      .join("\n\n");

    const taskRaw = dedupedTaskResults
      .map(
        (r) =>
          `[${r.payload.source_file} > ${r.payload.section}]\n${r.payload.content}`,
      )
      .join("\n\n");

    const fullRaw = [seniorRaw, mvpRaw, debugRaw, createRaw, taskRaw]
      .filter(Boolean)
      .join("\n\n");

    // Step 5 — Compress via Groq (skipped if already small)
    const { compressed, skipped, rawTokens, compressedTokens, tokensSaved } =
      await summarizeContext(fullRaw);

    // Print terminal-style log for quick operator visibility (compressed flow)
    try {
      printTerminalLog({
        timestamp: new Date().toISOString(),
        endpoint: "/context/compressed",
        task,
        rulesApplied:
          seniorChunks.length + mvpChunks.length + debugChunks.length + createChunks.length +
          dedupedTaskResults.length,
        topSources: [
          ...seniorChunks.map((p) => p.payload.source_file),
          ...mvpChunks.map((p) => p.payload.source_file),
          ...debugChunks.map((p) => p.payload.source_file),
          ...createChunks.map((p) => p.payload.source_file),
          ...dedupedTaskResults.map((r) => r.payload.source_file),
        ].slice(0, 5),
        compressionStats: {
          rawTokens,
          compressedTokens,
          tokensSaved,
          savingsPercent:
            rawTokens > 0
              ? `${Math.round((tokensSaved / rawTokens) * 100)}%`
              : "0%",
        },
        ip: req.headers["x-forwarded-for"] || req.ip || null,
      });
    } catch (e) {
      // ignore logging errors
    }

    res.json({
      task,
      compressed,
      compressionStats: {
        skipped,
        rawTokens,
        compressedTokens,
        tokensSaved,
        savingsPercent:
          rawTokens > 0
            ? `${Math.round((tokensSaved / rawTokens) * 100)}%`
            : "0%",
      },
      sources: {
        seniorDevRules: seniorChunks.map((p) => ({
          file: p.payload.source_file,
          section: p.payload.section,
        })),
        mvpRules: mvpChunks.map((p) => ({
          file: p.payload.source_file,
          section: p.payload.section,
        })),
        debugRules: debugChunks.map((p) => ({
          file: p.payload.source_file,
          section: p.payload.section,
        })),
        createRules: createChunks.map((p) => ({
          file: p.payload.source_file,
          section: p.payload.section,
        })),
        taskSpecific: dedupedTaskResults.map((r) => ({
          file: r.payload.source_file,
          section: r.payload.section,
          score: parseFloat(r.score.toFixed(4)),
        })),
      },
    });
  } catch (err) {
    console.error("Context compressed error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /memory/save — Auto-append conversation summary ─
// Appends a structured summary to .agent/memory/conversation-summaries.md
// and immediately ingests it into Qdrant so it's searchable via RAG.
//
// Usage:
//   POST /memory/save
//   { "task": "build login page", "summary": ["used MVVM", "added Zod schema"], "tags": ["auth", "frontend"] }
app.post("/memory/save", async (req, res) => {
  try {
    const { task, summary, tags = [] } = req.body;

    if (!task || typeof task !== "string") {
      return res.status(400).json({ error: "task (string) is required" });
    }
    if (!summary) {
      return res
        .status(400)
        .json({ error: "summary (string or string[]) is required" });
    }

    await saveMemory(task, summary, tags);

    res.json({
      status: "ok",
      message: `Memory saved and ingested for: "${task}"`,
      task,
      summary,
      tags,
    });
  } catch (err) {
    console.error("Memory save error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /context — LLM context injection (body) ───────
app.post("/context", async (req, res) => {
  try {
    const { task, limit = 3, category, tags } = req.body;

    if (!task || typeof task !== "string") {
      return res.status(400).json({ error: "task (string) is required" });
    }

    const vector = await embed(task);
    const results = await search(vector, { limit, category, tags });

    const contextBlocks = results.map((r, i) => {
      const meta = `[Source: ${r.payload.source_file} | Section: ${r.payload.section} | Priority: ${r.payload.priority}]`;
      return `--- Rule ${i + 1} (${(r.score * 100).toFixed(0)}% match) ---\n${meta}\n${r.payload.content}`;
    });

    res.json({
      task,
      rulesApplied: results.length,
      context: contextBlocks.join("\n\n"),
      sources: results.map((r) => ({
        file: r.payload.source_file,
        section: r.payload.section,
        score: r.score,
      })),
    });
  } catch (err) {
    console.error("Context error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ────────────────────────────────────────
async function main() {
  validateConfig();

  // Verify collection exists (non-blocking)
  let collectionStatus = "unknown";
  try {
    await getStats();
    collectionStatus = "ready";
  } catch (err) {
    collectionStatus = "not_found";
    console.log('⚠️  Collection not found. Run "npm run ingest" first.');
    console.log("   Starting server anyway (search will fail until ingested).");
  }

  // Always start the server regardless of collection status
  const server = app.listen(CONFIG.serverPort, () => {
    console.log("");
    console.log("╔════════════════════════════════════════════════╗");
    console.log("║   🧠 Senior Dev Mind — RAG Server             ║");
    console.log("╠════════════════════════════════════════════════╣");
    console.log(
      `║   URL:        http://localhost:${CONFIG.serverPort}         ║`,
    );
    console.log(`║   Collection: ${CONFIG.collection.padEnd(30)}║`);
    console.log(`║   Provider:   ${CONFIG.embeddingProvider.padEnd(30)}║`);
    console.log(`║   Status:     ${collectionStatus.padEnd(30)}║`);
    console.log("╠════════════════════════════════════════════════╣");
    console.log("║   Endpoints:                                   ║");
    console.log(
      "║   POST /memory/save              (save convo summary)      ║",
    );
    console.log(
      "║   GET  /context/compressed?task= (RAG→Groq→main model)     ║",
    );
    console.log("║   POST /search/text        (query by text)           ║");
    console.log("║   POST /search             (query by vector)         ║");
    console.log("║   POST /context            (LLM context - body)      ║");
    console.log("║   GET  /context?task=      (LLM context - params)    ║");
    console.log("║   GET  /context/smart?task=(Senior-gated router)     ║");
    console.log("║   GET  /rules              (all chunks, no embed)    ║");
    console.log("║   GET  /health             (health check)            ║");
    console.log("║   GET  /stats              (collection stats)        ║");
    console.log("╚════════════════════════════════════════════════╝");
    console.log("");
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error("💥 Server error:", err.message);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("💥 Server failed to start:", err.message);
  process.exit(1);
});
