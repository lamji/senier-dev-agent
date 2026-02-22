/**
 * Senior Dev Mind — HTTP Server (Agent-Compatible)
 * Exposes the RAG search as an HTTP API that any LLM agent can call.
 */
import express from "express";
import { CONFIG, validateConfig } from "./config.mjs";
import { getStats } from "./qdrant.mjs";
import { requestLogger } from "./middleware/logger.mjs";
import * as contextController from "./controllers/contextController.mjs";
import * as searchController from "./controllers/searchController.mjs";
import * as memoryController from "./controllers/memoryController.mjs";
import * as statsController from "./controllers/statsController.mjs";

const app = express();

// ─── Middleware ──────────────────────────────────────────
app.use(requestLogger);
app.use(express.json());

// CORS (allow all for local dev)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─── Endpoints ───────────────────────────────────────────

// Stats & Health
app.get("/health", statsController.getHealth);
app.get("/stats", statsController.getStatsHandler);
app.get("/rules", statsController.getRules);

// Context Retrieval
app.get("/context/smart", contextController.getSmartContext);
app.get("/context/compressed", contextController.getCompressedContext);
app.get("/context", contextController.getContext);
app.post("/context", contextController.postContext);

// Search
app.post("/search/text", searchController.searchText);
app.post("/search", searchController.searchVector);

// Memory
app.post("/memory/save", memoryController.postMemorySave);


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

  const server = app.listen(CONFIG.serverPort, () => {
    console.log("");
    console.log("╔════════════════════════════════════════════════╗");
    console.log("║   🧠 Senior Dev Mind — RAG Server             ║");
    console.log("╠════════════════════════════════════════════════╣");
    console.log(`║   URL:        http://localhost:${CONFIG.serverPort}         ║`);
    console.log(`║   Collection: ${CONFIG.collection.padEnd(30)}║`);
    console.log(`║   Provider:   ${CONFIG.embeddingProvider.padEnd(30)}║`);
    console.log(`║   Status:     ${collectionStatus.padEnd(30)}║`);
    console.log("╠════════════════════════════════════════════════╣");
    console.log("║   Endpoints:                                   ║");
    console.log("║   POST /memory/save              (save convo)  ║");
    console.log("║   GET  /context/compressed?task= (Groq compress)║");
    console.log("║   POST /search/text              (text query)  ║");
    console.log("║   GET  /context/smart?task=      (smart router)║");
    console.log("╚════════════════════════════════════════════════╝\n");
  });

  server.on('error', (err) => {
    console.error("💥 Server error:", err.message);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("💥 Server failed to start:", err.message);
  process.exit(1);
});
