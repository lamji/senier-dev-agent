/**
 * Terminal-style pretty printer for incoming RAG requests.
 *
 * Prints a concise boxed summary to the server terminal so an operator
 * can see when a /context or /context/compressed call was received.
 *
 * Do not include sensitive request bodies here; only metadata and top sources.
 */
export function printTerminalLog(entry) {
  try {
    const {
      timestamp = new Date().toISOString(),
      endpoint = "",
      task = "",
      rulesApplied = 0,
      topSources = [],
      compressionStats = null,
      ip = null,
    } = entry;

    const pad = (s = "", width = 70) =>
      (String(s).length > width
        ? String(s).slice(0, width - 3) + "..."
        : String(s)
      ).padEnd(width, " ");

    const width = 70;
    const sep = "─".repeat(width + 2);
    console.log("┌" + sep + "┐");
    console.log("│ " + pad(` RAG SERVER LOG — ${timestamp}`, width) + " │");
    console.log("├" + sep + "┤");
    console.log("│ " + pad(` Endpoint: ${endpoint}`, width) + " │");
    console.log("│ " + pad(` Task: ${task}`, width) + " │");
    console.log("│ " + pad(` Matched rules: ${rulesApplied}`, width) + " │");
    if (topSources && topSources.length) {
      console.log(
        "│ " +
          pad(` Top sources: ${topSources.slice(0, 5).join(", ")}`, width) +
          " │",
      );
    }
    if (compressionStats) {
      const cs = `Compression: raw=${compressionStats.rawTokens} compressed=${compressionStats.compressedTokens} saved=${compressionStats.savingsPercent}`;
      console.log("│ " + pad(cs, width) + " │");
    }
    if (ip) {
      console.log("│ " + pad(` From IP: ${ip}`, width) + " │");
    }
    console.log("└" + sep + "┘\n");
  } catch (err) {
    // Never throw from logger
    console.error("printTerminalLog error:", err);
  }
}
