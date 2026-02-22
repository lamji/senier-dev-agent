/**
 * Senior Dev Mind — Pass-Through RAG Summarizer (Self-Hosted)
 *
 * Previous versions used Groq for compression.
 * In the Akrizu Engine (VPS), we use raw RAG text because local models
 * like Qwen 2.5 and DeepSeek have large context windows.
 */

/**
 * Returns raw context as-is.
 * No longer requires GROQ_API_KEY.
 *
 * @param {string} rawContext - Raw RAG context string
 * @returns {Promise<{ compressed: string, skipped: boolean, tokensSaved: number }>}
 */
export async function summarizeContext(rawContext) {
  if (!rawContext || rawContext.trim() === "") {
    return { compressed: "", skipped: true, tokensSaved: 0 };
  }

  // Akrizu Engine: Always skip compression to maintain 100% local operation
  return {
    compressed: rawContext,
    skipped: true,
    tokensSaved: 0,
    rawTokens: Math.ceil(rawContext.length / 4),
    compressedTokens: Math.ceil(rawContext.length / 4),
  };
}

/**
 * Formats an array of RAG results into a raw readable string.
 *
 * @param {Array<{ payload: { content: string, source_file: string, section: string } }>} results
 * @returns {Promise<{ compressed: string, skipped: boolean, tokensSaved: number }>}
 */
export async function summarizeResults(results) {
  if (!results || results.length === 0) {
    return { compressed: "", skipped: true, tokensSaved: 0 };
  }

  const rawContext = results
    .map((r) => {
      const src = r.payload?.source_file || "";
      const section = r.payload?.section || "";
      const content = r.payload?.content || r.content || "";
      return `[${src} > ${section}]\n${content}`;
    })
    .join("\n\n");

  return summarizeContext(rawContext);
}
