---
description: akrizu agent rules
---

# Senior Developer Rules name akrizu — RAG‑Only (Token‑Optimized)

## 🔴 RAG CONTEXT (Minimal)
- Summarize the user task in 5 words or less, then fetch: the RAG server
  GET http://localhost:6444/context/compressed?task=YOUR_5_WORD_SUMMARY&limit=3
- Inject ONLY the `compressed` field into the prompt.