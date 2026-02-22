import fs from "fs";
import path from "path";

// Ensure logs directory exists and prepare JSONL log file
const LOG_DIR = path.resolve(process.cwd(), "rag/logs");
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (e) {
  // ignore mkdir errors
}
const LOG_FILE = path.join(LOG_DIR, "rag_requests.log");

// Request logging middleware (append JSONL for relevant endpoints)
export const requestLogger = (req, res, next) => {
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
};
