/**
 * Senior Dev Mind — Status Checker
 * Quick overview of the RAG system health.
 *
 * Usage: npm run status
 */
import { CONFIG, validateConfig } from './config.mjs';
import { getStats } from './qdrant.mjs';

async function main() {
  validateConfig();

  console.log('');
  console.log('🧠 Senior Dev Mind — Status');
  console.log('');

  // Check Qdrant
  try {
    const stats = await getStats();
    console.log(`✅ Qdrant:      ${CONFIG.qdrantUrl}`);
    console.log(`✅ Collection:  ${CONFIG.collection}`);
    console.log(`   Points:      ${stats.points_count}`);
    console.log(`   Segments:    ${stats.segments_count}`);
    console.log(`   Status:      ${stats.status}`);
    console.log(`   Vectors:     ${CONFIG.vectorSize}-dim`);
  } catch (err) {
    console.log(`❌ Qdrant:      ${CONFIG.qdrantUrl} — ${err.message}`);
  }

  // Check Ollama
  try {
    const res = await fetch(`${CONFIG.ollamaUrl}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      const models = data.models?.map((m) => m.name).join(', ') || 'none';
      const hasEmbed = data.models?.some((m) => m.name.includes('nomic-embed')) || false;
      console.log(`✅ Ollama:      ${CONFIG.ollamaUrl}`);
      console.log(`   Models:      ${models}`);
      console.log(`   Embed Ready: ${hasEmbed ? '✅ yes' : '❌ run: ollama pull nomic-embed-text'}`);
    }
  } catch {
    console.log(`⚠️  Ollama:      ${CONFIG.ollamaUrl} — not reachable`);
  }

  // Check Groq key
  if (CONFIG.groqApiKey && CONFIG.groqApiKey !== 'your_groq_api_key_here') {
    console.log(`✅ Groq:        API key configured (${CONFIG.groqApiKey.substring(0, 8)}...)`);
  } else {
    console.log(`⚠️  Groq:        No API key configured`);
  }

  console.log(`📋 Provider:    ${CONFIG.embeddingProvider}`);
  console.log(`📁 Knowledge:   ${CONFIG.knowledgeBasePath}`);
  console.log('');
}

main().catch((err) => {
  console.error('Status check failed:', err.message);
});
