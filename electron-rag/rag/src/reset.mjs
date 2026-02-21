/**
 * Senior Dev Mind — Reset / Recreate Collection
 * Deletes and recreates the collection. Use with caution.
 *
 * Usage: npm run reset
 */
import { CONFIG, validateConfig } from './config.mjs';
import { deleteCollection, ensureCollection, getStats } from './qdrant.mjs';

async function main() {
  validateConfig();

  console.log('');
  console.log('⚠️  Senior Dev Mind — RESET');
  console.log(`   This will delete collection "${CONFIG.collection}" and all its data.`);
  console.log('');

  try {
    console.log(`🗑️  Deleting collection "${CONFIG.collection}"...`);
    await deleteCollection();
    console.log('   ✅ Deleted');
  } catch (err) {
    console.log(`   ⚠️  ${err.message} (may not exist yet)`);
  }

  console.log('');
  console.log('🏗️  Recreating collection...');
  await ensureCollection();

  const stats = await getStats();
  console.log('');
  console.log(`✅ Collection "${CONFIG.collection}" reset successfully`);
  console.log(`   Points: ${stats.points_count}`);
  console.log(`   Status: ${stats.status}`);
  console.log('');
  console.log('💡 Run "npm run ingest" to re-populate the knowledge base.');
  console.log('');
}

main().catch((err) => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});
