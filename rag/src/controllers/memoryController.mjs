import { saveMemory } from "../memory.mjs";

export const postMemorySave = async (req, res) => {
  try {
    const { task, summary, tags = [] } = req.body;

    if (!task || typeof task !== "string") {
      return res.status(400).json({ error: "task (string) is required" });
    }
    if (!summary) {
      return res
        .status(400)
        .json({ error: "summary (string or string[]) is required" });
    }

    await saveMemory(task, summary, tags);

    res.json({
      status: "ok",
      message: `Memory saved and ingested for: "${task}"`,
      task,
      summary,
      tags,
    });
  } catch (err) {
    console.error("Memory save error:", err);
    res.status(500).json({ error: err.message });
  }
};
