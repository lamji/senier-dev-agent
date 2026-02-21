# Senior Developer Rules — RAG‑Only (Token‑Optimized)

## 🔴 RAG CONTEXT (Minimal)
- Summarize the user task in 5 words or less, then fetch:
  GET http://localhost:6444/context/compressed?task=YOUR_5_WORD_SUMMARY&limit=3
- Inject ONLY the `compressed` field into the prompt.
- If GET fails, fallback ONLY to the specific rule file the user mentions.