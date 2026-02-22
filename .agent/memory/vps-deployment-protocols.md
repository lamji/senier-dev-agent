# VPS Deployment & Process Management
**Category**: Deployment / DevOps
**Date**: 2026-02-22

## Problem
How to deploy the Akrizu Knowledge RAG stack to a Linux VPS (hosting) and ensure all processes (Gateway, Sync Watcher, Qdrant, Ollama) start automatically and remain resilient.

## Senior Dev Solution
Use native Linux services for infrastructure and PM2 for Node.js application process management.

### Deployment Checklist (VPS)
1. **Infrastructure**: Install Ollama and Qdrant as native systemd services.
2. **Process Management**: Use `pm2` to manage the lifecycle of the Gateway and Sync Watcher.
   ```bash
   # Start and save the gateway
   pm2 start src/server.mjs --name "akrizu-gateway"
   
   # Start and save the sync watcher
   pm2 start src/sync.mjs --name "akrizu-sync" -- --watch
   
   # Ensure persistence on reboot
   pm2 save
   pm2 startup
   ```
3. **Internal Networking**: Point the `.env` to the internal network addresses (e.g., `OLLAMA_URL=http://localhost:11434`).

## Technical Analysis
- **Process Resilience**: PM2 handles automatic restarts if a process crashes, which is critical for the persistent Sync Watcher.
- **Environment Parity**: By using the same entry points (`server.mjs`, `sync.mjs`), the code remains environment-agnostic while the orchestration tools (WSL python script vs PM2) handle the platform-specific execution.
