# Casual Chat RAG Bypass & Persona Leakage Fix
**Category**: AI Gateway / Optimization
**Date**: 2026-02-22

## Problem
When a user sends a casual greeting (e.g., "hi", "hello"), the gateway was still triggering the full RAG pipeline (vector search, chunking, summarization), causing unnecessary latency. Furthermore, passing an empty or minimal RAG context without enforcing the core system persona rules resulted in the AI leaking its internal thought monologue (e.g., "Okay, the user said 'hi'. That's a greeting...").

## Solution (Code)
Implemented a regex-based `isCasualChat` detector. In the gateway, we skip the RAG loading for casual chat but *always* inject the system prompt (Operational Protocols) to enforce the AI persona.

```javascript
// detectors.mjs
export const isCasualChat = (message = "") => {
  const casualRegex = /^(hi|hello|hey|hola|yo|good morning|good afternoon|good evening|how are you|test|ping)(\s|$|[.!?])/i;
  const words = message.trim().split(/\s+/);
  if (words.length <= 3 && casualRegex.test(message.trim())) return true;
  return false;
};

// gatewayController.mjs
const isCasual = isCasualChat(userMessage);

if (useAkrizuAgent && userMessage && typeof userMessage === "string") {
  // 1. RAG Retrieval (Skip if casual)
  if (!isCasual) {
    // ... load standard chunks and perform vector search ...
  }

  // 2. ALWAYS INJECT SYSTEM PROMPT
  // This ensures the AI persona ("No Monologue", "Professional Senior Dev")
  // is strictly enforced even when RAG is bypassed.
  let contextInstruction = `... System prompt goes here ...`;
  
  const systemIndex = messages.findIndex((m) => m.role === "system");
  if (systemIndex !== -1) {
    messages[systemIndex].content = `${contextInstruction}\n\n${messages[systemIndex].content}`;
  } else {
    messages.unshift({ role: "system", content: contextInstruction });
  }
}
```

## Technical Analysis
- **Latency Optimization**: Bypassing vector embedding and search for greetings drastically reduces Time To First Token (TTFT).
- **Steering Integrity**: By decoupling the persona injection from the RAG context loading, we guarantee that the LLM constraints (like avoiding conversational filler and blocking internal thought leakage) are maintained globally across all interactions.
