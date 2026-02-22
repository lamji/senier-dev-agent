/**
 * Senior Dev Mind — Ingestion Pipeline
 * Chunks knowledge base → Embeds → Upserts to Qdrant
 *
 * Usage: npm run ingest
 */
import { CONFIG, validateConfig } from './config.mjs';
import { chunkKnowledgeBase } from './chunker.mjs';
import { embed } from './embedder.mjs';
import { ensureCollection, upsertPoints, getStats } from './qdrant.mjs';

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   🧠 Senior Dev Mind — RAG Ingestion     ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');

  // 1. Validate config
  validateConfig();
  console.log(`📋 Provider: ${CONFIG.embeddingProvider}`);
  console.log(`📋 Qdrant:   ${CONFIG.qdrantUrl}`);
  console.log(`📋 Source:   ${CONFIG.knowledgeBasePath}`);
  console.log('');

  // 2. Ensure collection exists
  await ensureCollection();
  console.log('');

  // 3. Chunk the knowledge base
  const chunks = await chunkKnowledgeBase();
  console.log('');

  if (chunks.length === 0) {
    console.log('⚠️  No chunks to ingest. Check your knowledge base path.');
    return;
  }

  // 4. Embed each chunk
  console.log(`🔮 Embedding ${chunks.length} chunks (this may take a moment)...`);
  const points = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      process.stdout.write(`\r   Embedding ${i + 1}/${chunks.length}...`);
      const vector = await embed(chunk.content);
      points.push({
        id: i + 1, // Qdrant requires integer IDs
        vector,
        payload: {
          content: chunk.content,
          ...chunk.metadata,
        },
      });
      success++;
    } catch (err) {
      console.error(`\n   ❌ Failed to embed chunk "${chunk.metadata.section}" from ${chunk.metadata.source_file}: ${err.message}`);
      failed++;
    }
  }
  console.log(`\n   ✅ Embedded: ${success} | ❌ Failed: ${failed}`);
  console.log('');

  // 5. Upsert to Qdrant
  if (points.length > 0) {
    console.log(`📤 Upserting ${points.length} points to Qdrant...`);
    await upsertPoints(points);
    console.log('');
  }

  // 6. Show stats
  const stats = await getStats();
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   📊 Ingestion Complete                   ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║   Collection: ${CONFIG.collection}`);
  console.log(`║   Points:     ${stats.points_count}`);
  console.log(`║   Vectors:    ${CONFIG.vectorSize}-dim`);
  console.log(`║   Status:     ${stats.status}`);
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');

  // 7. Print chunk summary
  console.log('📋 Chunk Summary by Category:');
  const categoryCounts = {};
  for (const p of points) {
    const cat = p.payload.category || 'unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`   ${cat}: ${count} chunks`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('💥 Ingestion failed:', err.message);
  process.exit(1);
});
