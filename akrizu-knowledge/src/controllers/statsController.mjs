import { getStats, scrollAll } from "../qdrant.mjs";
import { CONFIG } from "../config.mjs";

export const getHealth = async (req, res) => {
  try {
    const stats = await getStats();
    res.json({
      status: "ok",
      collection: CONFIG.collection,
      pointsCount: stats.points_count,
      vectorSize: CONFIG.vectorSize,
      embeddingProvider: CONFIG.embeddingProvider,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const getStatsHandler = async (req, res) => {
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
};

export const getRules = async (req, res) => {
  try {
    const { category, priority, limit } = req.query;

    const points = await scrollAll({
      limit: limit ? parseInt(limit, 10) : 100,
      category: category || undefined,
      priority: priority || undefined,
    });

    const formatted = points.map((p) => ({
      content: p.payload.content,
      source_file: p.payload.source_file,
      section: p.payload.section,
      category: p.payload.category,
      tags: p.payload.tags,
      priority: p.payload.priority,
    }));

    res.json({
      totalRules: formatted.length,
      filters: {
        category: category || null,
        priority: priority || null,
      },
      rules: formatted,
    });
  } catch (err) {
    console.error("Rules error:", err);
    res.status(500).json({ error: err.message });
  }
};
