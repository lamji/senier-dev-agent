# Senior Dev Mind — Agent Instructions
**Target**: Codex, Copilot, and compatible Open Agents.

## 🧠 Dynamic Knowledge Retrieval (RAG)
Before writing code or answering structural questions, you MUST fetch the latest coding standards from the local knowledge base.

1. **Query the RAG**:
   Run the following `curl` command (or use your built-in request functionality) to ask the RAG server for context on your current task:
   ```bash
   curl -s -X POST http://localhost:6444/context -H "Content-Type: application/json" -d '{"task": "DESCRIPTION_OF_YOUR_CURRENT_TASK", "limit": 5}'
   ```

2. **Apply Context**:
   Read the returned JSON `context` field. This context contains the absolute rules for MVVM architecture, file boundaries (300 lines), and template structures.

## 📌 Hard Rules
- **Never bypass MVVM**: UI must be separated from business logic (`use[Feature].ts`).
- **Never exceed file limits**: Create `sub-components/` and `sub-helpers/` folders for large features.
- **Log all actions**: Append your progress and any discovered bugs to `.logs.md`.
