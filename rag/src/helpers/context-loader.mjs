import { scrollByFile } from "../qdrant.mjs";
import { isMvpTask, isDebugTask, isCreateTask, isAdminTask } from "./detectors.mjs";

/**
 * Loads standard context chunks based on the task description.
 */
export async function loadStandardChunks(task) {
  const seniorChunks = await scrollByFile("workflows/senior-dev-rules.md");
  const mvpChunks = isMvpTask(task) ? await scrollByFile("rules/mvp-workflows.md") : [];
  const debugChunks = isDebugTask(task) ? [
    ...(await scrollByFile("rules/trace-logs-explain-fix.md")),
    ...(await scrollByFile("rules/troubleshooting.md")),
  ] : [];
  const createChunks = isCreateTask(task) ? await scrollByFile("rules/create-feature.md") : [];
  const adminChunks = isAdminTask(task) ? await scrollByFile("npm-packages/admin-ui-1.md") : [];

  return { seniorChunks, mvpChunks, debugChunks, createChunks, adminChunks };
}

/**
 * Deduplicates task-specific results against standard chunks.
 */
export function deduplicateResults(taskResults) {
  return taskResults.filter(r => {
    const file = r.payload.source_file;
    return file !== "workflows/senior-dev-rules.md" &&
           file !== "rules/mvp-workflows.md" &&
           file !== "rules/trace-logs-explain-fix.md" &&
           file !== "rules/troubleshooting.md" &&
           file !== "rules/create-feature.md" &&
           file !== "npm-packages/admin-ui-1.md";
  });
}

/**
 * Formats a list of chunks into a string block.
 */
export function formatBlocks(chunks, title, startIndex = 0) {
  return chunks.map((p, i) => {
    const meta = `[Source: ${p.payload.source_file} | Section: ${p.payload.section} | Priority: ${p.payload.priority}]`;
    return `=== ${title} Rule ${startIndex + i + 1} ===\n${meta}\n${p.payload.content}`;
  });
}

/**
 * Formats a list of chunks into a simple [File > Section] string.
 */
export function formatRaw(chunks) {
  return chunks.map(p => `[${p.payload.source_file} > ${p.payload.section}]\n${p.payload.content}`).join("\n\n");
}
