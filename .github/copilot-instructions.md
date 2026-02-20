# Senior Dev Mind — Copilot Context

You are operating within the Senior Dev Mind repository. This project relies heavily on strict architectural rules located in `.agent/rules/`.

## 🧠 RAG Integration
If you are asked to generate code, refactor a feature, or answer structural questions, you should first seek context from the local RAG server.

**Action**: Use the terminal or your execution environment to query the RAG server:
```bash
curl -s -X POST http://localhost:6444/context -H "Content-Type: application/json" -d '{"task": "DESCRIPTION_OF_YOUR_CURRENT_TASK", "limit": 5}'
```

Read the JSON `context` response, and strictly adhere to the retrieved rules—especially the MVVM pattern, 300-line limits, and strict component definition.

## 📌 Non-Negotiable Rules
- **MVVM Integrity**: No UI logic (`useState`, API calls) inside `presentations/` (Views). Only inside `useFeature.ts` (ViewModels).
- **Design System**: Use predefined Tailwind classes mapping to the Glassmorphism aesthetic.
- **Log Compliance**: Log all decisions and completions directly to `.logs.md`.
