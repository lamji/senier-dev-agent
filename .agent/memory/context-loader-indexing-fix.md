# Technical Knowledge: Context Loader Indexing Fix
**Category**: RAG / File Indexing
**Date**: 2026-02-22

## Problem
Certain critical knowledge files (e.g., `.agent/npm-packages/index.md`) were being skipped by the automatic context loader because they weren't explicitly whitelisted or categorized in a way that the semantic search prioritized.

## Senior Dev Solution
Hard-code a "Category Entry-Point" whitelist in the context loader helper. This ensures that when a specific task type (like `admin` or `package`) is detected, the "Brain" or "Catalog" file for that category is always injected into the context.

### Implementation
```javascript
// akrizu-knowledge/src/helpers/context-loader.mjs

export async function loadStandardChunks(task) {
  // ... check task type
  const adminChunks = isAdminTask(task) ? [
    ...(await scrollByFile("npm-packages/index.md")),    // Catalog Injection
    ...(await scrollByFile("npm-packages/admin-ui-1.md")), // SDK Injection
  ] : [];

  return { ..., adminChunks, ... };
}
```

## Technical Analysis
- **Determinism**: Unlike purely semantic search, hard-coding category entry-points provides a deterministic "starting point" for the LLM.
- **Deduplication**: The loader must run a deduplication pass after injecting both standard and semantic chunks to avoid prompt bloat.
- **Scaling**: As categories grow, the whitelist should move from hard-coded arrays to a `category-mapping.json` for better maintainability.
