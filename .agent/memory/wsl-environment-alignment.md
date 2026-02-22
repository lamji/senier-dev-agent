# WSL Environment Alignment & Windows Purge
**Category**: Infrastructure / Environment
**Date**: 2026-02-22

## Problem
Mistakenly started Ollama as a Windows process and began a model pull, which conflicted with the existing WSL-based Ollama setup. This "polluted" the Windows environment and ignored the project's architectural requirement for WSL integration.

## Solution (Code)
1. **Purge**: Force killed all Windows `ollama.exe` processes and sub-processes.
2. **Alignment**: Reverted to following the `README.md` protocol:
   - WSL Ollama must bind to `0.0.0.0:11434`.
   - Windows RAG server talks to WSL via Localhost-Forwarding or WSL-IP.

```bash
# Correct WSL Startup (Per README)
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

## Technical Analysis
- **Service Isolation**: Keeping Ollama in WSL ensures all models are centralized in the Linux environment as intended for this project.
- **Connectivity**: Windows-WSL bridge allows the Node.js RAG server to perform embeddings using the WSL daemon, provided the binding is explicitly set to `0.0.0.0`.
