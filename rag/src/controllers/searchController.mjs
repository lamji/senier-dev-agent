import { search } from "../qdrant.mjs";
import { embed } from "../embedder.mjs";

export const searchText = async (req, res) => {
  try {
    const {
      query,
      limit = 5,
      category,
      tags,
      priority,
      scoreThreshold,
    } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query (string) is required" });
    }

    const vector = await embed(query);

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
      query,
      resultsCount: formatted.length,
      results: formatted,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const searchVector = async (req, res) => {
  try {
    const {
      vector,
      limit = 5,
      category,
      tags,
      priority,
      scoreThreshold,
    } = req.body;

    if (!vector || !Array.isArray(vector)) {
      return res.status(400).json({ error: "vector (number[]) is required" });
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
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
};
