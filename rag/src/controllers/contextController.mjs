import { search } from "../qdrant.mjs";
import { embed } from "../embedder.mjs";
import { summarizeContext } from "../summarizer.mjs";
import { printTerminalLog } from "../helpers/pretty-log.mjs";
import * as loader from "../helpers/context-loader.mjs";

export const getSmartContext = async (req, res) => {
  try {
    const { task, limit = 5 } = req.query;
    if (!task || typeof task !== "string" || task.trim() === "") {
      return res.status(400).json({ error: "task query param is required." });
    }

    const { seniorChunks, mvpChunks, debugChunks, createChunks, adminChunks } = await loader.loadStandardChunks(task);
    const vector = await embed(task.trim());
    const taskResults = await search(vector, { limit: parseInt(limit, 10) });
    const dedupedTaskResults = loader.deduplicateResults(taskResults);

    const seniorBlocks = loader.formatBlocks(seniorChunks, "Senior Dev");
    const mvpBlocks = loader.formatBlocks(mvpChunks, "MVP");
    const debugBlocks = loader.formatBlocks(debugChunks, "Debug");
    const createBlocks = loader.formatBlocks(createChunks, "Create");
    const adminBlocks = loader.formatBlocks(adminChunks, "Admin Package");
    const taskBlocks = dedupedTaskResults.map((r, i) => {
      const meta = `[Source: ${r.payload.source_file} | Section: ${r.payload.section} | Priority: ${r.payload.priority}]`;
      return `--- Task Rule ${i + 1} (${(r.score * 100).toFixed(0)}% match) ---\n${meta}\n${r.payload.content}`;
    });

    res.json({
      task,
      totalRulesApplied: seniorChunks.length + mvpChunks.length + debugChunks.length + createChunks.length + adminChunks.length + dedupedTaskResults.length,
      context: [...seniorBlocks, ...mvpBlocks, ...debugBlocks, ...createBlocks, ...adminBlocks, ...taskBlocks].join("\n\n"),
      sources: {
        seniorDevRules: seniorChunks.map(p => ({ file: p.payload.source_file, section: p.payload.section })),
        mvpRules: mvpChunks.map(p => ({ file: p.payload.source_file, section: p.payload.section })),
        debugRules: debugChunks.map(p => ({ file: p.payload.source_file, section: p.payload.section })),
        createRules: createChunks.map(p => ({ file: p.payload.source_file, section: p.payload.section })),
        adminRules: adminChunks.map(p => ({ file: p.payload.source_file, section: p.payload.section })),
        taskSpecific: dedupedTaskResults.map(r => ({ file: r.payload.source_file, section: r.payload.section, score: parseFloat(r.score.toFixed(4)) })),
      },
    });
  } catch (err) {
    console.error("Context smart error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getCompressedContext = async (req, res) => {
  try {
    const { task, limit = 3 } = req.query;
    if (!task || typeof task !== "string" || task.trim() === "") {
      return res.status(400).json({ error: "task query param is required." });
    }

    const { seniorChunks, mvpChunks, debugChunks, createChunks, adminChunks } = await loader.loadStandardChunks(task);
    const vector = await embed(task.trim());
    const taskResults = await search(vector, { limit: parseInt(limit, 10) });
    const dedupedTaskResults = loader.deduplicateResults(taskResults);

    const fullRaw = [
      loader.formatRaw(seniorChunks),
      loader.formatRaw(mvpChunks),
      loader.formatRaw(debugChunks),
      loader.formatRaw(createChunks),
      loader.formatRaw(adminChunks),
      loader.formatRaw(dedupedTaskResults)
    ].filter(Boolean).join("\n\n");

    const { compressed, skipped, rawTokens, compressedTokens, tokensSaved } = await summarizeContext(fullRaw);

    printTerminalLog({
      timestamp: new Date().toISOString(),
      endpoint: "/context/compressed",
      task,
      rulesApplied: seniorChunks.length + mvpChunks.length + debugChunks.length + createChunks.length + dedupedTaskResults.length,
      topSources: [...seniorChunks, ...mvpChunks, ...debugChunks, ...createChunks, ...adminChunks, ...dedupedTaskResults].map(p => p.payload.source_file).slice(0, 5),
      compressionStats: { rawTokens, compressedTokens, tokensSaved, savingsPercent: rawTokens > 0 ? `${Math.round((tokensSaved / rawTokens) * 100)}%` : "0%" },
      ip: req.headers["x-forwarded-for"] || req.ip || null,
    });

    res.json({
      task,
      compressed,
      compressionStats: { skipped, rawTokens, compressedTokens, tokensSaved, savingsPercent: rawTokens > 0 ? `${Math.round((tokensSaved / rawTokens) * 100)}%` : "0%" },
      sources: {
        seniorDevRules: seniorChunks.map(p => ({ file: p.payload.source_file, section: p.payload.section })),
        taskSpecific: dedupedTaskResults.map(r => ({ file: r.payload.source_file, section: r.payload.section, score: parseFloat(r.score.toFixed(4)) })),
      },
    });
  } catch (err) {
    console.error("Context compressed error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getContext = async (req, res) => {
  try {
    const { task, limit = 5, category, tags } = req.query;
    if (!task || typeof task !== "string" || task.trim() === "") {
      return res.status(400).json({ error: "task query param is required." });
    }

    const parsedTags = tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined;
    const vector = await embed(task.trim());
    const results = await search(vector, { limit: parseInt(limit, 10), category, tags: parsedTags });

    const contextBlocks = results.map((r, i) => {
      const meta = `[Source: ${r.payload.source_file} | Section: ${r.payload.section} | Priority: ${r.payload.priority}]`;
      return `--- Rule ${i + 1} (${(r.score * 100).toFixed(0)}% match) ---\n${meta}\n${r.payload.content}`;
    });

    printTerminalLog({
      timestamp: new Date().toISOString(),
      endpoint: "/context",
      task,
      rulesApplied: results.length,
      topSources: results.map(r => r.payload.source_file).slice(0, 5),
      ip: req.headers["x-forwarded-for"] || req.ip || null,
    });

    res.json({ task, rulesApplied: results.length, context: contextBlocks.join("\n\n") });
  } catch (err) {
    console.error("Context GET error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const postContext = async (req, res) => {
  try {
    const { task, limit = 3, category, tags } = req.body;
    if (!task || typeof task !== "string") return res.status(400).json({ error: "task is required" });

    const vector = await embed(task);
    const results = await search(vector, { limit, category, tags });

    const contextBlocks = results.map((r, i) => {
      const meta = `[Source: ${r.payload.source_file} | Section: ${r.payload.section} | Priority: ${r.payload.priority}]`;
      return `--- Rule ${i + 1} (${(r.score * 100).toFixed(0)}% match) ---\n${meta}\n${r.payload.content}`;
    });

    res.json({ task, rulesApplied: results.length, context: contextBlocks.join("\n\n") });
  } catch (err) {
    console.error("Context error:", err);
    res.status(500).json({ error: err.message });
  }
};
