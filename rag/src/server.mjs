/**
 * Senior Dev Mind — HTTP Server (Agent-Compatible)
 * Exposes the RAG search as an HTTP API that any LLM agent can call.
 * Compatible with: Ollama, Groq, Roo Code, Antigravity, custom agents.
 *
 * Endpoints:
 *   POST /search       — Semantic search with filters
 *   POST /search/text  — Search by raw text (auto-embeds)
 *   GET  /health       — Health check
 *   GET  /stats        — Collection statistics
 *
 * Usage: npm run serve
 */
import express from 'express';
import { CONFIG, validateConfig } from './config.mjs';
import { embed } from './embedder.mjs';
import { search, getStats, ensureCollection } from './qdrant.mjs';

const app = express();
app.use(express.json());

// ─── CORS (allow all for local dev) ──────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── Health Check ────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const stats = await getStats();
    res.json({
      status: 'ok',
      collection: CONFIG.collection,
      pointsCount: stats.points_count,
      vectorSize: CONFIG.vectorSize,
      embeddingProvider: CONFIG.embeddingProvider,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── Stats ───────────────────────────────────────────────
app.get('/stats', async (req, res) => {
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

// ─── Search by Text (auto-embed) ─────────────────────────
app.post('/search/text', async (req, res) => {
  try {
    const { query, limit = 5, category, tags, priority, scoreThreshold } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query (string) is required' });
    }

    // Embed the query
    const vector = await embed(query);

    // Search
    const results = await search(vector, {
      limit,
      category,
      tags,
      priority,
      scoreThreshold,
    });

    // Format response
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
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Search by Vector (pre-embedded) ─────────────────────
app.post('/search', async (req, res) => {
  try {
    const { vector, limit = 5, category, tags, priority, scoreThreshold } = req.body;

    if (!vector || !Array.isArray(vector)) {
      return res.status(400).json({ error: 'vector (number[]) is required' });
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
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Retrieve context for LLM prompt injection ──────────
app.post('/context', async (req, res) => {
  try {
    const { task, limit = 3, category, tags } = req.body;

    if (!task || typeof task !== 'string') {
      return res.status(400).json({ error: 'task (string) is required' });
    }

    const vector = await embed(task);
    const results = await search(vector, { limit, category, tags });

    // Format as a single context string for LLM injection
    const contextBlocks = results.map((r, i) => {
      const meta = `[Source: ${r.payload.source_file} | Section: ${r.payload.section} | Priority: ${r.payload.priority}]`;
      return `--- Rule ${i + 1} (${(r.score * 100).toFixed(0)}% match) ---\n${meta}\n${r.payload.content}`;
    });

    const contextString = contextBlocks.join('\n\n');

    res.json({
      task,
      rulesApplied: results.length,
      context: contextString,
      sources: results.map((r) => ({
        file: r.payload.source_file,
        section: r.payload.section,
        score: r.score,
      })),
    });
  } catch (err) {
    console.error('Context error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ────────────────────────────────────────
async function main() {
  validateConfig();

  // Verify collection exists
  try {
    await getStats();
  } catch {
    console.log('⚠️  Collection not found. Run "npm run ingest" first.');
    console.log('   Starting server anyway (search will fail until ingested).');
  }

  app.listen(CONFIG.serverPort, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   🧠 Senior Dev Mind — RAG Server        ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log(`║   URL:        http://localhost:${CONFIG.serverPort}      ║`);
    console.log(`║   Collection: ${CONFIG.collection.padEnd(25)}║`);
    console.log(`║   Provider:   ${CONFIG.embeddingProvider.padEnd(25)}║`);
    console.log('╠═══════════════════════════════════════════╣');
    console.log('║   Endpoints:                              ║');
    console.log('║   POST /search/text  (query by text)      ║');
    console.log('║   POST /search       (query by vector)    ║');
    console.log('║   POST /context      (LLM context inject) ║');
    console.log('║   GET  /health       (health check)       ║');
    console.log('║   GET  /stats        (collection stats)   ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('');
  });
}

main().catch((err) => {
  console.error('💥 Server failed to start:', err.message);
  process.exit(1);
});
