/**
 * Senior Dev Mind — Query CLI
 * Search the knowledge base from the command line.
 *
 * Usage:
 *   npm run query -- "How should I structure a new feature?"
 *   npm run query -- "booking API" --category rule
 *   npm run query -- "debugging" --tags debugging,backend --limit 10
 */
import { CONFIG, validateConfig } from './config.mjs';
import { embed } from './embedder.mjs';
import { search, getStats } from './qdrant.mjs';

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { query: '', category: null, tags: null, limit: 5, priority: null };

  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category' && args[i + 1]) {
      result.category = args[++i];
    } else if (args[i] === '--tags' && args[i + 1]) {
      result.tags = args[++i].split(',');
    } else if (args[i] === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[++i], 10);
    } else if (args[i] === '--priority' && args[i + 1]) {
      result.priority = args[++i];
    } else {
      positional.push(args[i]);
    }
  }

  result.query = positional.join(' ');
  return result;
}

async function main() {
  validateConfig();
  const args = parseArgs();

  if (!args.query) {
    console.log('');
    console.log('🧠 Senior Dev Mind — Query CLI');
    console.log('');
    console.log('Usage:');
    console.log('  npm run query -- "your question here"');
    console.log('');
    console.log('Options:');
    console.log('  --category <rule|workflow|template|memory>');
    console.log('  --tags <tag1,tag2,...>');
    console.log('  --priority <critical|high|medium|normal>');
    console.log('  --limit <number>  (default: 5)');
    console.log('');
    console.log('Examples:');
    console.log('  npm run query -- "How should I structure MVVM?"');
    console.log('  npm run query -- "booking API" --category rule');
    console.log('  npm run query -- "debugging" --tags debugging --limit 10');
    console.log('');

    // Show stats
    try {
      const stats = await getStats();
      console.log(`📊 Collection: ${CONFIG.collection} | Points: ${stats.points_count}`);
    } catch {
      console.log('⚠️  Collection not found. Run "npm run ingest" first.');
    }
    return;
  }

  console.log('');
  console.log(`🔍 Query: "${args.query}"`);
  if (args.category) console.log(`   📂 Category: ${args.category}`);
  if (args.tags) console.log(`   🏷️  Tags: ${args.tags.join(', ')}`);
  if (args.priority) console.log(`   ⚡ Priority: ${args.priority}`);
  console.log(`   📊 Limit: ${args.limit}`);
  console.log('');

  // Embed query
  console.log('🔮 Embedding query...');
  const vector = await embed(args.query);

  // Search
  console.log('🔎 Searching knowledge base...');
  const results = await search(vector, {
    limit: args.limit,
    category: args.category,
    tags: args.tags,
    priority: args.priority,
  });

  if (results.length === 0) {
    console.log('');
    console.log('❌ No results found. Try a different query or broader filters.');
    return;
  }

  console.log(`✅ Found ${results.length} results:`);
  console.log('');

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const { content, source_file, section, category, tags, priority } = r.payload;
    const score = (r.score * 100).toFixed(1);

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📄 Result #${i + 1}  |  Score: ${score}%  |  ${priority?.toUpperCase()}`);
    console.log(`   📁 ${source_file}  →  ${section}`);
    console.log(`   📂 ${category}  |  🏷️  ${tags?.join(', ') || 'none'}`);
    console.log('');

    // Truncate long content for CLI display
    const preview = content.length > 500
      ? content.substring(0, 500) + '\n   ...(truncated)'
      : content;
    console.log(`   ${preview.split('\n').join('\n   ')}`);
    console.log('');
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Total: ${results.length} results for "${args.query}"`);
  console.log('');
}

main().catch((err) => {
  console.error('💥 Query failed:', err.message);
  process.exit(1);
});
