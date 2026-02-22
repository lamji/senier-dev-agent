/**
 * Akrizu Knowledge Engine — HTTP Server
 * Exposes RAG search, OpenAI-compatible Gateway, and Admin Dashboard.
 */
import express from "express";
import path from "path";
import { CONFIG, validateConfig } from "./config.mjs";
import { getStats } from "./qdrant.mjs";
import { requestLogger } from "./middleware/logger.mjs";
import * as contextController from "./controllers/contextController.mjs";
import * as searchController from "./controllers/searchController.mjs";
import * as memoryController from "./controllers/memoryController.mjs";
import * as statsController from "./controllers/statsController.mjs";
import * as gatewayController from "./controllers/gatewayController.mjs";
import * as settingsController from "./controllers/settingsController.mjs";

const app = express();

// ─── Middleware ──────────────────────────────────────────
app.use(requestLogger);
app.use(express.json());
app.use(express.static(path.resolve(process.cwd(), "public")));

// CORS (allow all for local dev)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// JSON Error Handling Middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error("Malformed JSON Request:", err.message);
    return res.status(400).json({ error: "Malformed JSON", details: err.message });
  }
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

// Settings Management
app.get("/api/settings", settingsController.getSettings);
app.post("/api/settings", settingsController.updateSettings);

// AI Gateway Proxy (The Akrizu Engine)
// Mimics OpenAI API for Roo Code / Kilo integration
app.get("/v1/models", gatewayController.listModels);
app.post("/v1/chat/completions", gatewayController.handleChatCompletion);

// UI Helper: Get models list
app.get("/api/models", gatewayController.listModels);

// ─── Start Server ────────────────────────────────────────
async function main() {
  validateConfig();

  // Verify collection exists (non-blocking)
  try {
    await getStats();
  } catch (err) {
    console.log('⚠️  Collection not found. Run "npm run ingest" first.');
  }

  const server = app.listen(CONFIG.serverPort, () => {
    console.log("");
    console.log("╔════════════════════════════════════════════════╗");
    console.log("║   🧠 Akrizu Knowledge Engine — Running         ║");
    console.log("╠════════════════════════════════════════════════╣");
    console.log(`║   Dashboard:  http://localhost:${CONFIG.serverPort}         ║`);
    console.log(`║   Gateway:    http://localhost:${CONFIG.serverPort}/v1      ║`);
    console.log(`║   Status:     Ready (Self-Hosted)              ║`);
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
