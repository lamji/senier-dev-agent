# Hard Guardrail: No Monologue Policy
**Category**: AI Gateway / Persona Enforcement
**Date**: 2026-02-22

## Problem
Smaller local models (Ollama) and some Groq models were leaking their internal chain-of-thought (CoT) or monologues (e.g., "Okay, the user said 'hi'. I need to respond...") into the chat. This was especially prevalent during casual chat where the lack of RAG context made the model "bored" or confused by empty headers.

## Senior Dev Solution
1. **Prompts**: Refined `system-promts.md` with **STRICT SILENCE** and **STRICTLY MANDATORY** Operational Protocols.
2. **Logic**: Updated `gatewayController.mjs` to dynamically purge the entire RAG section from the system prompt if the `ragContext` is empty. This prevents the model from seeing "empty knowledge slots" which often triggers explanation behavior.

```javascript
// Dynamic Prompt Cleanup
if (!ragContext) {
  rawPrompt = rawPrompt.replace(/### AKRIZU PROJECT KNOWLEDGE \(RAG\)[\s\S]*?---/, "");
  rawPrompt = rawPrompt.replace("---", "");
  contextInstruction = rawPrompt.trim();
} else {
  contextInstruction = rawPrompt.replace("{{RAG_CONTEXT}}", ragContext);
}
```

## Technical Analysis
- **Prompt Engineering**: Modern models use section headers (like `###`) as structural delimiters. Removing empty sections entirely is more effective than telling the model "this section is intentionally empty".
- **Interaction Model**: By enforcing a "Single Line Greeting" for casual context, we align the AI with the professional, high-efficiency persona expected for this project.
