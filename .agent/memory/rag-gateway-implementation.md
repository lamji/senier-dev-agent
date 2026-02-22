# Technical Knowledge: RAG Gateway with Groq & Unified Mapping
**Category**: Infrastructure / AI Gateway
**Date**: 2026-02-22

## Problem
Merging multiple AI providers (Ollama, Groq) into a single OpenAI-compatible gateway while enforcing a specific RAG protocol and persona.

## Senior Dev Solution
Implement a proxy controller that identifies the provider based on model names and standardizes the response payload.

### Implementation (Summary)
```javascript
// Identification & Routing
const isGroq = model.startsWith("groq:");
const actualModel = model.replace("groq:", "");

if (isGroq) {
  // Proxy to Groq Cloud (llama-3.1, Mixtral, etc.)
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${CONFIG.groqApiKey}` },
    body: JSON.stringify({ model: actualModel, messages, ...rest })
  });
  // ... return JSON
} else {
  // Proxy to Ollama WSL/Local
  // Map /api/chat format to /v1/chat/completions
  const data = await response.json();
  res.json({
    choices: [{ message: { content: data.message?.content || data.response } }]
  });
}
```

## Technical Analysis
- **Standardization**: By mapping Ollama's response to the OpenAI format, frontend clients (Roo Code, Kilo) work out-of-the-box.
- **Speed**: Groq provides ultra-low latency for testing while local Ollama ensures data privacy.
- **Protocol**: System prompt injection at the gateway level ensures the "Akrizu Engine" behavior is enforced regardless of the base model.
