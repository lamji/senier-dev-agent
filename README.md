# Senior Dev Agent Mind (Infrastructure)

This repository contains the "Brain" and Infrastructure for a Senior Developer AI Agent. It includes strict coding standards, workflows, templates, and a RAG (Retrieval-Augmented Generation) system to enhance AI context and decision-making.

## 🧠 What's Inside

- **`.agent/`**: The core knowledge base (Rules, Workflows, Feature Memory).
- **`rag/`**: A Node.js based RAG engine using Qdrant and Ollama/Groq.
- **`.templates/`**: Footprints of production-ready components.
- **`.logs.md` & `.corrections`**: Persistent tracking of project progress and behavioral adjustments.

---

## 🚀 How to use on your other computer:

To get this "Agent Mind" running on a new machine:

### 1. Clone the repository
```bash
git clone https://github.com/lamji/senier-dev-agent.git
cd senier-dev-agent
```

### 2. Setup RAG Engine
```bash
cd rag
npm install
cp .env.example .env
# Important: Open .env and add your GROQ_API_KEY
```

### 3. Ingest Knowledge
Make sure **Qdrant** (localhost:6333) and **Ollama** are running, then:
```bash
npm run ingest
```

### 4. Serve the Mind
Start the RAG server so your AI agent (Antigravity, Cursor, Windsurf, etc.) can query it:
```bash
npm run serve
```

---

## 🛠️ Infrastructure Overview

### RAG System (Port 6444)
The RAG server provides semantic search over your rules. Instead of pasting 20k tokens into a prompt, the agent queries this server to get only the relevant rules for the current task.

### Coding Standards
- **Strict MVVM**: Functional UI in `presentations/`, Logic in `use[Feature].ts`.
- **Isolation**: New features should never contaminate existing business logic.
- **Fragmentation**: Enforced "300 lines per file" rule ensures high maintainability.

### Persistent Logging
- **Changelog**: All changes are appended to `.logs.md`.
- **Corrections**: Behavioral mistakes are tracked in `.corrections` to prevent regression.

---

## 📜 Commands

| Command | Location | Description |
|---------|----------|-------------|
| `npm run sync:watch` | `/rag` | Auto-sync knowledge base changes to Qdrant |
| `npm run ingest` | `/rag` | Initial/Full re-ingest of knowledge |
| `npm run query -- "q"` | `/rag` | Search the Dev Mind from CLI |
| `powershell ./scripts/task-timer.ps1 start` | Root | Start a task timer |
