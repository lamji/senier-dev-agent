# RAG Control Panel

XAMPP-style Electron app for managing RAG Stack services (Ollama, RAG Server, Sync Watcher).

## Features

- ✅ Start/Stop individual services with one click
- ✅ Real-time terminal log streaming
- ✅ Service status indicators (running/stopped/starting/stopping)
- ✅ Clear logs functionality
- ✅ Start/Stop all services at once
- ✅ Modern dark UI with gradient buttons
- ✅ Auto-scrolling terminal views

## Installation

```bash
cd electron-rag
npm install
```

## Usage

### Development Mode
```bash
npm start
```

### Build Executable
```bash
npm run build:win
```

The built executable will be in `dist/` folder.

## Services Managed

1. **Ollama Server** (WSL)
   - Port: 11434
   - Command: `OLLAMA_HOST=0.0.0.0:11434 ollama serve`

2. **RAG Server**
   - Port: 6444
   - Command: `npm run serve` (in `../rag` directory)

3. **Sync Watcher**
   - File watcher for auto-ingestion
   - Command: `npm run sync:watch` (in `../rag` directory)

## Architecture

```
electron-rag/
├── main.js              # Electron main process
├── preload.js           # IPC bridge (contextBridge)
├── renderer.html        # UI layout
├── renderer.js          # UI logic
├── styles.css           # Styling
├── services/
│   └── ServiceManager.js # Service lifecycle management
└── package.json
```

## Requirements

- Node.js 18+
- WSL (for Ollama)
- npm dependencies installed in `../rag`

## Troubleshooting

- **Services won't start**: Ensure WSL is running and `../rag` directory exists
- **Logs not showing**: Check that processes have stdout/stderr output
- **Port conflicts**: Stop existing services on ports 11434 and 6444

## License

MIT
