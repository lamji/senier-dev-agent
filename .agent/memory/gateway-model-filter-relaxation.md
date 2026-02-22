# Gateway Model Filter Relaxation
**Category**: Infrastructure / AI Gateway
**Date**: 2026-02-22

## Problem
The RAG gateway was hard-coded to only whitelist `llama3.2`, `phi3`, and `starcoder`. When the user had other models in their WSL/Ollama environment (like `qwen` or `llama3`), they were being filtered out and not appearing in the dashboard dropdown.

## Senior Dev Solution
Relaxed the filtering logic in `gatewayController.mjs` to include a broader set of capable coding and general models (`mistral`, `deepseek`, `phi`, `starcoder`, etc.).

```javascript
// gatewayController.mjs
const getFilteredModels = (models) => {
    return models.filter(m => {
        const name = (m.id || "").toLowerCase();
        // Focus on coding and generally capable models
        return name.includes("coder") || 
               name.includes("qwen") || 
               name.includes("llama") || 
               name.includes("phi") || 
               name.includes("starcoder") || 
               name.includes("mistral") || 
               name.includes("deepseek");
    });
};
```

## Technical Analysis
- **Dynamic Visibility**: This approach balances model quality with environment flexibility. It prevents the UI from being cluttered with tiny utility models while ensuring the user's main local models are always accessible for RAG tasks.
