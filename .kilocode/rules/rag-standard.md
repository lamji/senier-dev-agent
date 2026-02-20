# Senior Dev Mind — Kilo Code Rules

**STOP.** Do not generate any code, make any plans, or search the file system until you have completed the Mandatory Initial Action below.

## 🔴 MANDATORY INITIAL ACTION: RAG Context Retrieval
For EVERY SINGLE user request, you MUST execute this exact terminal command to get your context. **Do not use your file reading tools to look for rules.**

1. **Execute this command:**
   ```bash
   curl -s -X POST http://localhost:6444/context -H "Content-Type: application/json" -d '{"task": "SUMMARIZE_USER_REQUEST_HERE", "limit": 5}'
   ```
2. **Wait for the terminal output.**
3. **Parse the JSON response.**

If the `curl` command fails or the server is offline, ONLY THEN are you allowed to fall back to reading files in `.agent/rules/`.

---

## 📌 Standard Protocols (Applying Context)
After you have retrieved the RAG context, you must strictly apply the returned rules. The most critical rules are consistently:

- **Strict MVVM**: UI in presentations/, reusable components in components/, logic in use[Feature].ts.
- **300-Line Limit**: No file should ever grow beyond 300 lines. Refactor JSX to `sub-components/` and Hooks to `sub-helpers/` immediately.
- **Log Management**: Always append to `.logs.md`.
- **Task Timer**: Always start the task timer `powershell scripts/task-timer.ps1 start` before working and stop it when finished.
