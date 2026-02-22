/**
 * Senior Dev Mind — Qdrant Client Wrapper
 * Handles collection management and CRUD operations.
 */
import { QdrantClient } from "@qdrant/js-client-rest";
import { CONFIG } from "./config.mjs";

let client = null;

/** Get or create the Qdrant client singleton */
export function getClient() {
  if (!client) {
    const opts = { url: CONFIG.qdrantUrl };
    if (CONFIG.qdrantApiKey) {
      opts.apiKey = CONFIG.qdrantApiKey;
    }
    client = new QdrantClient(opts);
  }
  return client;
}

/**
 * Ensure the collection exists with correct config.
 * Recreates if vector size doesn't match.
 */
export async function ensureCollection() {
  const qdrant = getClient();
  const name = CONFIG.collection;

  try {
    const info = await qdrant.getCollection(name);
    const existingSize = info.config?.params?.vectors?.size;

    if (existingSize !== CONFIG.vectorSize) {
      console.log(
        `⚠️  Collection "${name}" has vector size ${existingSize}, expected ${CONFIG.vectorSize}. Recreating...`,
      );
      await qdrant.deleteCollection(name);
    } else {
      console.log(
        `✅ Collection "${name}" exists (${info.points_count} points, ${CONFIG.vectorSize}-dim)`,
      );
      return info;
    }
  } catch (err) {
    if (!err.message?.includes("not found") && err.status !== 404) {
      // Collection genuinely doesn't exist — create it
      if (
        !err.message?.includes("Not found") &&
        !err.message?.includes("doesn't exist")
      ) {
        throw err;
      }
    }
  }

  // Create collection
  console.log(
    `🏗️  Creating collection "${name}" (${CONFIG.vectorSize}-dim, cosine)...`,
  );
  await qdrant.createCollection(name, {
    vectors: {
      size: CONFIG.vectorSize,
      distance: "Cosine",
    },
    on_disk_payload: true,
  });

  // Create payload indexes for filtering
  console.log("📇 Creating payload indexes...");
  await qdrant.createPayloadIndex(name, {
    field_name: "category",
    field_schema: "keyword",
  });
  await qdrant.createPayloadIndex(name, {
    field_name: "tags",
    field_schema: "keyword",
  });
  await qdrant.createPayloadIndex(name, {
    field_name: "priority",
    field_schema: "keyword",
  });
  await qdrant.createPayloadIndex(name, {
    field_name: "source_file",
    field_schema: "keyword",
  });

  console.log(`✅ Collection "${name}" created with indexes`);
  return await qdrant.getCollection(name);
}

/**
 * Upsert points into the collection.
 * @param {Array<{id: number, vector: number[], payload: object}>} points
 */
export async function upsertPoints(points) {
  const qdrant = getClient();
  const batchSize = 50;

  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    await qdrant.upsert(CONFIG.collection, {
      wait: true,
      points: batch,
    });
    console.log(
      `   📤 Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)}`,
    );
  }
}

/**
 * Search for similar vectors with optional filters.
 * @param {number[]} vector - Query vector
 * @param {object} [options] - Search options
 * @param {number} [options.limit=5] - Max results
 * @param {string} [options.category] - Filter by category
 * @param {string[]} [options.tags] - Filter by tags (any match)
 * @param {string} [options.priority] - Filter by priority
 * @param {number} [options.scoreThreshold] - Min similarity score
 * @returns {Promise<Array>}
 */
export async function search(vector, options = {}) {
  const qdrant = getClient();
  const { limit = 5, category, tags, priority, scoreThreshold = 0.3 } = options;

  // Build filter
  const must = [];
  if (category) {
    must.push({ key: "category", match: { value: category } });
  }
  if (priority) {
    must.push({ key: "priority", match: { value: priority } });
  }

  const should = [];
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      should.push({ key: "tags", match: { value: tag } });
    }
  }

  const filter = {};
  if (must.length > 0) filter.must = must;
  if (should.length > 0) filter.should = should;

  const searchParams = {
    vector,
    limit,
    with_payload: true,
    score_threshold: scoreThreshold,
  };

  if (Object.keys(filter).length > 0) {
    searchParams.filter = filter;
  }

  return qdrant.search(CONFIG.collection, searchParams);
}

/**
 * Get collection stats
 */
export async function getStats() {
  const qdrant = getClient();
  return qdrant.getCollection(CONFIG.collection);
}

/**
 * Scroll all points from the collection (no vector needed).
 * Used for GET /rules endpoint — returns raw chunks without semantic search.
 * @param {object} [options]
 * @param {number} [options.limit=100] - Max records to return
 * @param {string} [options.category] - Optional category filter (rule|workflow|template|memory)
 * @param {string} [options.priority] - Optional priority filter
 * @returns {Promise<Array>}
 */
export async function scrollAll(options = {}) {
  const qdrant = getClient();
  const { limit = 100, category, priority } = options;

  const must = [];
  if (category) must.push({ key: "category", match: { value: category } });
  if (priority) must.push({ key: "priority", match: { value: priority } });

  const filter = must.length > 0 ? { must } : undefined;

  const result = await qdrant.scroll(CONFIG.collection, {
    limit,
    with_payload: true,
    with_vector: false,
    ...(filter && { filter }),
  });

  return result.points;
}

/**
 * Scroll all chunks from a specific source file.
 * Used by GET /context/smart to always inject senior-dev-rules.md as base.
 * @param {string} sourceFile - Relative source file path e.g. "workflows/senior-dev-rules.md"
 * @param {number} [limit=50] - Max records to return
 * @returns {Promise<Array>}
 */
export async function scrollByFile(sourceFile, limit = 50) {
  const qdrant = getClient();

  const result = await qdrant.scroll(CONFIG.collection, {
    limit,
    with_payload: true,
    with_vector: false,
    filter: {
      must: [{ key: "source_file", match: { value: sourceFile } }],
    },
  });

  return result.points;
}

/**
 * Delete the entire collection
 */
export async function deleteCollection() {
  const qdrant = getClient();
  return qdrant.deleteCollection(CONFIG.collection);
}
