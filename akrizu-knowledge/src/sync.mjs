/**
 * Senior Dev Mind — Auto-Sync / Re-Ingest
 * Watches the knowledge base for changes and re-ingests automatically.
 * Also supports manual re-ingest of specific files or categories.
 *
 * Usage:
 *   npm run sync              — Full re-ingest (delete + rebuild)
 *   npm run sync -- --watch   — Watch for file changes and auto re-ingest
 *   npm run sync -- --file rules/coding-standard.md  — Re-ingest one file
 */
import { watch } from 'fs';
import {  statSync } from 'fs';
import { resolve } from 'path';
import { CONFIG, validateConfig } from './config.mjs';
import { embed } from './embedder.mjs';
import { ensureCollection, upsertPoints, getClient, getStats } from './qdrant.mjs';

// ─── Re-ingest a single file ─────────────────────────────

import { chunkKnowledgeBase } from './chunker.mjs';

async function reingestSingleFile(relativeFilePath) {
  const fullPath = resolve(CONFIG.knowledgeBasePath, relativeFilePath);
  console.log(`\n🔄 Re-ingesting: ${relativeFilePath}`);

  try {
    statSync(fullPath);
  } catch {
    console.log(`   ⚠️  File not found: ${fullPath}`);
    return;
  }

  // Get all existing chunks — we'll re-chunk the whole file
  const allChunks = await chunkKnowledgeBase();
  const fileChunks = allChunks.filter(
    (c) => c.metadata.source_file === relativeFilePath.replace(/\\/g, '/')
  );

  if (fileChunks.length === 0) {
    console.log(`   ⚠️  No chunks found for ${relativeFilePath}`);
    return;
  }

  // Delete old points for this file using scroll + delete
  const qdrant = getClient();
  await qdrant.delete(CONFIG.collection, {
    filter: {
      must: [{ key: 'source_file', match: { value: relativeFilePath.replace(/\\/g, '/') } }],
    },
  });
  console.log(`   🗑️  Deleted old chunks for ${relativeFilePath}`);

  // Get current max ID
  const stats = await getStats();
  const baseId = (stats.points_count || 0) + 1000; // Offset to avoid collisions

  // Embed and upsert new chunks
  const points = [];
  for (let i = 0; i < fileChunks.length; i++) {
    const chunk = fileChunks[i];
    process.stdout.write(`\r   Embedding ${i + 1}/${fileChunks.length}...`);
    try {
      const vector = await embed(chunk.content);
      points.push({
        id: baseId + i,
        vector,
        payload: { content: chunk.content, ...chunk.metadata },
      });
    } catch (err) {
      console.error(`\n   ❌ Failed: ${err.message}`);
    }
  }

  if (points.length > 0) {
    await upsertPoints(points);
    console.log(`\n   ✅ Re-ingested ${points.length} chunks for ${relativeFilePath}`);
  }
}

// ─── Full Re-Ingest ──────────────────────────────────────

async function fullReingest() {
  console.log('\n🔄 Full Re-Ingest — Deleting old data and rebuilding...\n');

  // Delete all points
  const qdrant = getClient();
  try {
    await qdrant.deleteCollection(CONFIG.collection);
    console.log(`🗑️  Deleted collection "${CONFIG.collection}"`);
  } catch {
    console.log(`⚠️  Collection didn't exist yet`);
  }

  await ensureCollection();
  console.log('');

  // Chunk everything
  const chunks = await chunkKnowledgeBase();
  console.log('');

  // Embed
  console.log(`🔮 Embedding ${chunks.length} chunks...`);
  const points = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    process.stdout.write(`\r   Embedding ${i + 1}/${chunks.length}...`);
    try {
      const vector = await embed(chunk.content);
      points.push({
        id: i + 1,
        vector,
        payload: { content: chunk.content, ...chunk.metadata },
      });
    } catch (err) {
      console.error(`\n   ❌ Failed to embed "${chunk.metadata.section}": ${err.message}`);
    }
  }

  console.log(`\n   ✅ Embedded: ${points.length}/${chunks.length}`);

  if (points.length > 0) {
    console.log(`\n📤 Upserting ${points.length} points...`);
    await upsertPoints(points);
  }

  const stats = await getStats();
  console.log(`\n✅ Sync complete — ${stats.points_count} points in "${CONFIG.collection}"\n`);
}

// ─── File Watcher ────────────────────────────────────────

function startWatcher() {
  const basePath = CONFIG.knowledgeBasePath;
  console.log(`\n👁️  Watching for changes in: ${basePath}`);
  console.log('   Press Ctrl+C to stop.\n');

  // Debounce map
  const pending = new Map();

  // Recursive directory watch
  const watcher = watch(basePath, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.md')) return;

    const relPath = filename.replace(/\\/g, '/');

    // Debounce: wait 2s after last change before re-ingesting
    if (pending.has(relPath)) clearTimeout(pending.get(relPath));
    pending.set(
      relPath,
      setTimeout(async () => {
        pending.delete(relPath);
        console.log(`\n📝 Detected change: ${relPath} (${eventType})`);
        try {
          await reingestSingleFile(relPath);
        } catch (err) {
          console.error(`   ❌ Re-ingest failed: ${err.message}`);
        }
      }, 2000)
    );
  });

  // Keep alive
  process.on('SIGINT', () => {
    watcher.close();
    console.log('\n👋 Watcher stopped.');
    process.exit(0);
  });
}

// ─── CLI Entry ───────────────────────────────────────────

async function main() {
  validateConfig();
  const args = process.argv.slice(2);

  if (args.includes('--watch')) {
    // Watch mode
    startWatcher();
  } else if (args.includes('--file')) {
    // Single file mode
    const fileIdx = args.indexOf('--file');
    const filePath = args[fileIdx + 1];
    if (!filePath) {
      console.error('❌ --file requires a relative path (e.g., rules/coding-standard.md)');
      process.exit(1);
    }
    await reingestSingleFile(filePath);
  } else {
    // Full re-ingest
    await fullReingest();
  }
}

main().catch((err) => {
  console.error('💥 Sync failed:', err.message);
  process.exit(1);
});
