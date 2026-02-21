# 🧠 Senior Dev Mind — Complete Integration Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Agent Integration](#agent-integration)
   - [Antigravity (Gemini)](#1-antigravity-gemini)
   - [Cursor AI](#2-cursor-ai)
   - [Windsurf (Codeium)](#3-windsurf-codeium)
   - [Groq (Cloud LLM)](#4-groq-cloud-llm)
   - [Local Ollama](#5-local-ollama)
   - [Roo Code](#6-roo-code)
3. [Knowledge Lifecycle](#knowledge-lifecycle)
4. [Sync & Re-Ingest](#sync--re-ingest)
5. [API Reference](#api-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR KNOWLEDGE BASE                       │
│  .agent/rules/*.md  │  .agent/workflows/*.md                │
│  .agent/template/**/*.md  │  feature_memory.md               │
│  .logs.md  │  .corrections  │  .templates                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                    npm run ingest (or npm run sync)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   QDRANT (localhost:6333)                     │
│              Collection: senior_dev_mind                     │
│              107+ vectors, 768-dim, cosine                   │
│              Indexed: category, tags, priority               │
└────────────────────────┬────────────────────────────────────┘
                         │
                  RAG Server (localhost:6444)
                         │
          ┌──────────────┼──────────────────┐
          │              │                  │
     ┌────┴───┐    ┌─────┴─────┐     ┌─────┴──────┐
     │Antigrav│    │  Cursor   │     │ Windsurf   │
     │  ity   │    │    AI     │     │ (Codeium)  │
     └────────┘    └───────────┘     └────────────┘
          │              │                  │
     ┌────┴───┐    ┌─────┴─────┐     ┌─────┴──────┐
     │  Groq  │    │  Ollama   │     │  Roo Code  │
     │ (API)  │    │  (Local)  │     │            │
     └────────┘    └───────────┘     └────────────┘
```

---

## Agent Integration

### 1. Antigravity (Gemini)

**How it works**: Antigravity has its own Knowledge Item (KI) system that persists across conversations. You have two options:

**Option A: Use Antigravity's built-in KI system (Recommended)**

Antigravity already reads your `.agent/` directory and can access rules/workflows via its internal tools. The RAG server **supplements** this by providing semantic search when Antigravity needs to find specific rules.

**Option B: Manual context injection via workflow**

Add this to your `.agent/workflows/senior-dev-rules.md`:

```markdown
## 0. Pre-Execution: RAG Context Load
Before starting any task, query the RAG server to load relevant rules:
1. The RAG server must be running at http://localhost:6444
2. Send the USER's task description to POST /context
3. Use the returned rules as additional context for your session
```

**Usage in conversation**:
```
@senior-dev-rules Create a booking API endpoint
```
Antigravity will read the workflow, and if the RAG server is running, can query it for relevant rules.

---

### 2. Cursor AI

Cursor supports custom system prompts via `.cursorrules` or project-level instructions.

**Step 1: Create `.cursorrules` at project root**

```markdown
# Senior Dev Mind — RAG-Enhanced Rules

You are a Senior Fullstack Developer following strict MVVM patterns.

## Before Every Task:
1. Query the RAG server for relevant rules:
   POST http://localhost:6444/context
   Body: { "task": "<user's request>", "limit": 5 }

2. Apply ALL retrieved rules strictly.
3. If the RAG server is unreachable, follow these core rules:
   - Strict MVVM: UI in presentations/, reusable UI in components/, logic in lib/
   - Max 300 lines per file
   - Fragment JSX into sub-components/, hooks into sub-helpers/
   - No ad-hoc styles, use design system
   - Update .logs.md after every task (APPEND ONLY)
```

**Step 2: Add MCP tool (Cursor 0.45+)**

If Cursor supports MCP tools, add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "senior-dev-mind": {
      "url": "http://localhost:6444"
    }
  }
}
```

---

### 3. Windsurf (Codeium)

Windsurf uses `.windsurfrules` for project-level instructions.

**Step 1: Create `.windsurfrules` at project root**

```markdown
# Senior Dev Mind — RAG Integration

Before implementing any feature or fix:

1. Query: POST http://localhost:6444/search/text
   Body: { "query": "<description of what you're building>", "limit": 5 }

2. Read the results and apply all matched rules/patterns.

3. Core Rules (always apply):
   - MVVM: View (index.tsx) → ViewModel (useFeature.ts) → Model (useApiFeature.ts)
   - Max 300 lines per file
   - Sub-components/ for fragmented JSX
   - Sub-helpers/ for fragmented logic
   - Append to .logs.md after every significant task
   - Never modify existing business logic for new features — create new files
```

---

### 4. Groq (Cloud LLM)

Use the RAG server's `/context` endpoint to inject rules into Groq prompts programmatically:

```javascript
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. Get relevant rules from RAG
const ragResponse = await fetch('http://localhost:6444/context', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: "Create a booking API endpoint",
    limit: 5
  })
});
const { context } = await ragResponse.json();

// 2. Inject into Groq prompt
const completion = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [
    {
      role: 'system',
      content: `You are a Senior Fullstack Developer. Follow these rules strictly:\n\n${context}`
    },
    {
      role: 'user',
      content: 'Create a booking API endpoint with validation'
    }
  ]
});
```

---

### 5. Local Ollama

Same pattern as Groq but using Ollama's API:

```javascript
// 1. Get context from RAG
const ragRes = await fetch('http://localhost:6444/context', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ task: "debugging a booking issue", limit: 3 })
});
const { context } = await ragRes.json();

// 2. Send to Ollama with rules injected
const ollamaRes = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen3:8b',
    messages: [
      { role: 'system', content: `Follow these rules:\n\n${context}` },
      { role: 'user', content: 'Fix the booking API error' }
    ]
  })
});
```

---

### 6. Roo Code

If Roo Code supports custom tools, add RAG search as a tool:

```json
{
  "name": "search_senior_dev_mind",
  "description": "Search the Senior Dev Mind knowledge base for relevant coding rules, workflows, and templates",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "What to search for" },
      "category": { "type": "string", "enum": ["rule", "workflow", "template", "memory"] },
      "limit": { "type": "number", "default": 5 }
    },
    "required": ["query"]
  }
}
```

Tool implementation hits: `POST http://localhost:6444/search/text`

---

## Knowledge Lifecycle

### What Changes Over Time

| Item | Location | How Often | Impact |
|------|----------|-----------|--------|
| Coding rules | `.agent/rules/*.md` | Rare (monthly) | High — affects all dev work |
| Workflows | `.agent/workflows/*.md` | Occasional | Medium — process changes |
| Templates | `.agent/template/**/*.md` | After every feature | High — new patterns for AI |
| `.logs.md` | Root `.logs.md` | Every task | Low — historical reference |
| `.corrections` | Root `.corrections` | On mistakes | Medium — prevents regression |
| `.templates` | Root `.templates` | After features | Low — lookup index |
| `feature_memory.md` | `.agent/feature_memory.md` | After analysis | Medium — architecture docs |

### When to Re-Ingest

| Trigger | Command | What Happens |
|---------|---------|--------------|
| Added a new rule file | `npm run sync -- --file rules/new-rule.md` | Embeds just that file |
| Updated an existing rule | `npm run sync -- --file rules/coding-standard.md` | Deletes old chunks, re-embeds |
| Added a new template | `npm run sync -- --file template/event-gallery/readme.md` | Adds to collection |
| Many changes at once | `npm run sync` | Full rebuild of everything |
| Continuous development | `npm run sync:watch` | Auto-detects and re-ingests on save |
| After major refactor | `npm run reset && npm run ingest` | Nuclear option: wipe and rebuild |

### Recommended Workflow

```
# During active development (run in a terminal and forget):
npm run sync:watch

# After adding a new rule:
# 1. Create the rule in .agent/rules/my-new-rule.md
# 2. Re-ingest it:
npm run sync -- --file rules/my-new-rule.md

# After completing a feature (template creation):
# 1. Create template in .agent/template/my-feature/
# 2. Full sync:
npm run sync

# Weekly maintenance:
npm run reset && npm run ingest
```

---

## Sync & Re-Ingest

### Commands

| Command | Description |
|---------|-------------|
| `npm run sync` | Full re-ingest: delete all, re-chunk, re-embed, re-upsert |
| `npm run sync:watch` | File watcher: auto re-ingests on `.md` file changes |
| `npm run sync -- --file <path>` | Re-ingest a single file (relative to `.agent/`) |
| `npm run ingest` | First-time ingestion (create collection + ingest) |
| `npm run reset` | Delete collection + recreate (no data) |

### What Gets Synced

Everything inside `.agent/`:
```
.agent/
├── rules/           → category: "rule"    (48 chunks)
│   ├── coding-standard.md
│   ├── mvp-protocol.md
│   ├── project-structure.md
│   ├── scalability-protocol.md
│   ├── security-standards.md
│   ├── template-lookup.md
│   └── troubleshooting.md
├── workflows/       → category: "workflow" (20 chunks)
│   ├── senior-dev-rules.md
│   ├── create-feature.md
│   ├── mvp-workflows.md
│   └── trace-logs-explain-fix.md
├── template/        → category: "template" (37 chunks)
│   ├── event-admin/
│   ├── event-booking/
│   ├── event-hero/
│   └── event-login/
└── feature_memory.md → category: "memory"  (2 chunks)
```

### Adding .logs.md and .templates to RAG

To also include root-level files (`.logs.md`, `.corrections`, `.templates`) in the RAG:

1. Copy or symlink them into `.agent/`:
```powershell
# Create symlinks (run once)
New-Item -ItemType SymbolicLink -Path ".agent\logs-mirror.md" -Target "..\..\.logs.md"
New-Item -ItemType SymbolicLink -Path ".agent\corrections-mirror.md" -Target "..\..\.corrections"
New-Item -ItemType SymbolicLink -Path ".agent\templates-mirror.md" -Target "..\..\.templates"
```

2. Or modify the `KNOWLEDGE_BASE_PATH` in `.env` to include the root:
```env
# Change to scan the entire workspace root
KNOWLEDGE_BASE_PATH=..
```
⚠️ **Warning**: This will also scan `book-me-event/` and other project folders. Only do this if you want everything indexed.

---

## API Reference

### `POST /context` — LLM Context Injection (Most Important)

**Purpose**: Given a task description, returns formatted rules/context ready to inject into any LLM prompt.

```bash
curl -X POST http://localhost:6444/context \
  -H "Content-Type: application/json" \
  -d '{"task": "Create REST endpoint for bookings", "limit": 3}'
```

**Response**:
```json
{
  "task": "Create REST endpoint for bookings",
  "rulesApplied": 3,
  "context": "--- Rule 1 (71% match) ---\n[Source: template/event-booking/readme.md]...",
  "sources": [
    { "file": "template/event-booking/readme.md", "section": "Overview", "score": 0.71 }
  ]
}
```

### `POST /search/text` — Natural Language Search

```bash
curl -X POST http://localhost:6444/search/text \
  -H "Content-Type: application/json" \
  -d '{"query": "MVVM structure", "limit": 5, "category": "rule"}'
```

### `GET /health` — Health Check

```bash
curl http://localhost:6444/health
```

### `GET /stats` — Collection Statistics

```bash
curl http://localhost:6444/stats
```

---

## Startup Checklist (Daily)

```bash
# Terminal 1: Start Qdrant (WSL)
wsl -- ./qdrant

# Terminal 2: Start RAG server
cd rag && npm run serve

# Terminal 3 (optional): Watch for changes
cd rag && npm run sync:watch

# Terminal 4: Your dev server
cd book-me-event/ai-template && npm run dev
```

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│  🧠 Senior Dev Mind — Quick Reference       │
├─────────────────────────────────────────────┤
│  Qdrant:     http://localhost:6333          │
│  RAG Server: http://localhost:6444          │
│  Ollama:     http://localhost:11434         │
│                                             │
│  npm run status   → Check everything        │
│  npm run ingest   → First-time setup        │
│  npm run serve    → Start RAG server        │
│  npm run sync     → Rebuild knowledge       │
│  npm run sync:watch → Auto-rebuild on save  │
│  npm run query -- "text"  → CLI search      │
└─────────────────────────────────────────────┘
```
