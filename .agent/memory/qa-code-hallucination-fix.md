# Code Hallucination Prevention on Q&A
**Category**: AI Gateway / Persona Enforcement
**Date**: 2026-02-22

## Problem
When a user asked a simple question (e.g., "do we have npm package for admin ui?"), the AI was fetching the RAG context (which included the file `admin-ui-1.md`) but then hallucinating Javascript code to modify `context-loader.mjs` to include that file, instead of just answering the question. This occurred because the prompt demanded "ONLY THE ANSWER OR CODE" and the AI (as a "Senior Web Developer") assumed every user interaction required a coding solution.

## Senior Dev Solution
1. **Prompt Refinement**: Added a specific `Q&A vs CODE` rule to `system-promts.md`.
```markdown
3. **Q&A vs CODE**: If the user asks a simple question (e.g., "do we have X?"), answer it directly in 1-2 sentences. DO NOT WRITE CODE or fabricate file modifications unless the user explicitly asks you to implement or fix something.
```
2. **Context Cleanup**: Removed legacy, hardcoded deduplication checks for `.agent/npm-packages/*` from `context-loader.mjs` that were inadvertently seeding the AI with `adminChunks` boilerplate.

## Technical Analysis
- **Intent Boundary**: By explicitly splitting the behavior between Q&A inquiries and implementation feature requests, we stop the LLM from aggressively trying to "solve" everything with a code block.
- **Verification**: Simulating the exact query `"ao we have npm package for admin ui?"` now yields the correct, dry factual response: `"Yes, we have an npm package for admin UI, specifically 'npm-packages/admin-ui-1.md'."` without any fabricated code blocks.
