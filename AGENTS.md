# Senior Dev Mind — Open Agent Rules (RAG‑Only, Token‑Optimized)

## 🔴 RAG CONTEXT (Minimal)
- Summarize the user task in 5 words or less
- Fetch: `GET http://localhost:6444/context/compressed?task=YOUR_TASK&limit=3`
- Inject ONLY the `compressed` field into your prompt
- If GET fails, fallback ONLY to the specific rule file the user mentions