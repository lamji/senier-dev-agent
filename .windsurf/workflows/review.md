---
description: Akrizu Agent Rules — RAG-Only with Workflow Entry Points
---

# Akrizu Agent Rules — RAG‑Only (Token‑Optimized)

**MAIN BRAIN**: Akrizu Knowledge RAG (`http://localhost:6444`)

## 🔴 RAG CONTEXT (Minimal)
- Summarize the user task in 5 words or less
- Fetch: `GET http://localhost:6444/context/compressed?task=YOUR_TASK&limit=3`
- Inject ONLY the `compressed` field into the prompt
- If GET fails, fallback ONLY to `.agent/workflows/` entry points

## 🚫 FILE ACCESS RESTRICTIONS (HARD BLOCK)
- **BLOCKED**: Reading `.agent/rules`, `.agent/memory`, `.agent/template`, `.agent/qa`, `.agent/npm-packages`
- **ALLOWED**: `.agent/workflows/` as the ONLY entry point for AI knowledge
- **ALLOWED**: Reading `akrizu-knowledge/` for RAG server configuration
- **BLOCKED**: Direct file reads for rules, templates, memory, or QA (use RAG instead)

## 📋 WORKFLOW ENTRY POINTS
All AI agents MUST start with `.agent/workflows/` files:
- `Akrizu-agent.md` - Akrizu persona rules
- `senior-dev-rules.md` - Senior developer standards
- Additional workflows as needed

## ✅ HARD RULES
1. **RAG First**: Always fetch from Akrizu RAG before reading files
2. **Workflows Only**: Only read `.agent/workflows/` for direct file access
3. **No .agent Access**: Strictly forbidden from reading `.agent/rules`, `.agent/memory`, `.agent/template`, `.agent/qa`, `.agent/npm-packages`
4. **Use curl/PowerShell**: For RAG queries, use `curl` or `Invoke-RestMethod` (read_url_content blocks localhost)
5. **Memory Saving**: Before task completion, save technical wins to `.agent/memory/` (via RAG workflow)
6. **No Browser UI**: Forbidden from taking screenshots or navigating to localhost:6444 UI
7. **Rule Compliance**: Before every task, fetch `rule-compliance-guardrail.md` from RAG server

## 🛠 RAG Unavailable Recovery
1. Kill any stuck RAG-related processes (RAG server, sync watcher, Ollama) and close terminals running them.
2. Follow `akrizu-knowledge/README.md` to restart the stack. Preferred: run `./scripts/start-rag-stack.bat` from repo root; manual fallback: start the RAG server (`npm run serve` from `rag/`) and the sync watcher (`npm run sync:watch`).
3. Verify health at `http://localhost:6444/health` once restarted.
