# Agent Configuration — Akrizu RAG Brain

**MAIN BRAIN**: Akrizu Knowledge RAG (`http://localhost:6444`)

## Overview

All AI agents working in this repository use the Akrizu Knowledge RAG system as their primary knowledge source. This configuration ensures:
- Consistent knowledge retrieval across all agents
- Token-optimized context injection
- Workflow-based entry points for all knowledge access
- Strict file access restrictions to prevent hallucination

---

## 🔴 RAG CONTEXT (Minimal)

Every agent MUST follow this workflow:

1. **Summarize Task**: Reduce user request to 5 words or less
2. **Fetch Context**: `GET http://localhost:6444/context/compressed?task=YOUR_TASK&limit=3`
3. **Inject Context**: Use ONLY the `compressed` field from the response
4. **Fallback**: If RAG fails, use `.agent/workflows/` entry points only

---

## 🚫 FILE ACCESS RESTRICTIONS (HARD BLOCK)

### Blocked Directories
- ❌ `.agent/rules/` - Use RAG instead
- ❌ `.agent/memory/` - Use RAG instead
- ❌ `.agent/template/` - Use RAG instead
- ❌ `.agent/qa/` - Use RAG instead
- ❌ `.agent/npm-packages/` - Use RAG instead

### Allowed Directories
- ✅ `.agent/workflows/` - ONLY entry point for direct file access
- ✅ `akrizu-knowledge/` - RAG server configuration
- ✅ Project source code (for implementation)

---

## 📋 WORKFLOW ENTRY POINTS

All AI agents MUST start with these workflow files:

### Primary Workflows
- **`Akrizu-agent.md`**: Akrizu persona rules and hard rules
- **`senior-dev-rules.md`**: Senior developer standards and best practices

### Additional Workflows
- Add new workflows as needed for specific agent types
- All workflows MUST follow the same RAG-first pattern
- Workflows are the ONLY exception to the `.agent/` file access block

---

## ✅ HARD RULES FOR ALL AGENTS

### 1. RAG First
Always fetch from Akrizu RAG before reading any files. RAG contains:
- All development rules
- Code patterns and templates
- Security standards
- Testing protocols
- Debugging procedures
- Package recommendations

### 2. Workflows Only
When RAG is unavailable, ONLY read `.agent/workflows/` files. Never read:
- `.agent/rules/` directly
- `.agent/memory/` directly
- `.agent/template/` directly
- `.agent/qa/` directly
- `.agent/npm-packages/` directly

### 3. No Direct .agent Access
Strictly forbidden from reading `.agent/` directory except `.agent/workflows/`. This prevents:
- Hallucination from stale files
- Inconsistent knowledge across agents
- Token waste on redundant file reads

### 4. Use read_url_content Tool
For RAG queries, use the internal `read_url_content` tool instead of:
- ❌ `curl` commands
- ❌ `Invoke-RestMethod` (PowerShell)
- ❌ Browser navigation

This keeps the terminal clean and fetches context silently.

### 5. Memory Saving (Post-Task)
Before completing any task, save technical wins to `.agent/memory/`:
- Format: `Topic-Name.md`
- Include: Summary, Problem, Solution (Code), Technical Analysis
- Purpose: Train local models with concrete knowledge
- Frequency: One file per major technical win

### 6. No Browser UI
Forbidden from:
- ❌ Taking screenshots of localhost:6444
- ❌ Navigating to RAG dashboard UI
- ❌ Verifying headers or controls via browser

Use API calls instead.

### 7. Rule Compliance
Before every task, fetch `rule-compliance-guardrail.md` from RAG server to ensure:
- Core persona is maintained
- Persistence rules are followed
- No rules are skipped

---

## 🔧 Agent Setup Instructions

### For Windsurf
1. Create `.windsurfrules` file (see `.windsurfrules` in repo root)
2. Point to Akrizu RAG: `http://localhost:6444`
3. Reference `.agent/workflows/` for fallback

### For Cursor
1. Create `.cursorrules` file (similar to `.windsurfrules`)
2. Use same RAG endpoint
3. Same workflow entry points

### For Other Agents
1. Create agent-specific rules file
2. Follow the same RAG-first pattern
3. Reference `.agent/workflows/` for fallback

---

## 🚀 Starting the RAG Server

Before any agent can work, the RAG server must be running:

```bash
# From repo root
.\scripts\start-rag-stack.bat
```

This starts:
- Ollama (embeddings)
- Qdrant (vector database)
- RAG Server (port 6444)
- Sync Watcher (auto-updates)

---

## 📊 Knowledge Base Structure

The Akrizu RAG system indexes 61 markdown files across 5 categories:

| Category | Files | Purpose |
|----------|-------|---------|
| Rules | 19 | Coding standards, protocols, workflows |
| Memory | 15 | Technical solutions, debugging wins |
| Templates | 16 | UI/UX design patterns, code examples |
| QA | 3 | E2E testing knowledge, test patterns |
| NPM Packages | 2 | Internal package catalog |

**Total**: 394 chunks, 478 vector points in Qdrant

---

## 🔍 Example: Agent Query Flow

### User Request
```
"How do I build an admin dashboard with proper security?"
```

### Agent Workflow
1. **Summarize**: "Build secure admin dashboard" (5 words)
2. **Fetch RAG**: `GET http://localhost:6444/context/compressed?task=Build%20secure%20admin%20dashboard&limit=3`
3. **Response**:
   ```json
   {
     "compressed": "Admin dashboards use glassmorphism design (10px blur, 3xl/2xl corners). Security: AES-256 encryption, bcrypt passwords, PCI DSS compliance. Never store PAN/CVV. Use Zod validation. See: admin-ui-kit.md, security-standards.md, mvp-protocol.md"
   }
   ```
4. **Inject**: Use ONLY the `compressed` field in the prompt
5. **Implement**: Follow the retrieved rules

---

## ⚠️ Common Mistakes to Avoid

### ❌ Mistake 1: Reading `.agent/rules/` Directly
```javascript
// WRONG - Forbidden
const rules = readFileSync('.agent/rules/coding-standard.md');
```

### ✅ Correct: Use RAG
```javascript
// RIGHT - Use RAG
const context = await fetch('http://localhost:6444/context/compressed?task=coding%20standards&limit=3');
```

### ❌ Mistake 2: Using curl for RAG Queries
```bash
# WRONG - Pollutes terminal
curl http://localhost:6444/context/compressed?task=test
```

### ✅ Correct: Use read_url_content Tool
```javascript
// RIGHT - Silent, clean
const context = await read_url_content('http://localhost:6444/context/compressed?task=test');
```

### ❌ Mistake 3: Fallback to `.agent/rules/`
```javascript
// WRONG - Violates access restrictions
if (!ragAvailable) {
  const rules = readFileSync('.agent/rules/mvp-protocol.md');
}
```

### ✅ Correct: Fallback to Workflows Only
```javascript
// RIGHT - Only workflows allowed
if (!ragAvailable) {
  const rules = readFileSync('.agent/workflows/senior-dev-rules.md');
}
```

---

## 🔐 Security & Consistency

This configuration ensures:
- **No Hallucination**: All knowledge comes from RAG, not stale files
- **Consistency**: All agents use the same knowledge source
- **Token Efficiency**: Compressed context reduces prompt bloat
- **Scalability**: New agents inherit the same rules automatically
- **Auditability**: All knowledge is versioned in `.agent/memory/`

---

## 📞 Support

For issues:
1. Check RAG server is running: `http://localhost:6444/health`
2. Verify knowledge base: `npm run status` (from `rag/` directory)
3. Re-ingest if needed: `npm run sync` (from `rag/` directory)
4. Review `.agent/workflows/` for fallback rules

---

**Last Updated**: 2026-02-22  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
