const { spawn } = require('child_process');
const path = require('path');
const kill = require('tree-kill');

class ServiceManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.services = {
      ollama: {
        name: 'Ollama Server',
        process: null,
        status: 'stopped',
        logs: [],
        port: 11434
      },
      ragServer: {
        name: 'RAG Server',
        process: null,
        status: 'stopped',
        logs: [],
        port: 6444
      },
      syncWatcher: {
        name: 'Sync Watcher',
        process: null,
        status: 'stopped',
        logs: [],
        port: null
      }
    };
  }

  streamLogLines(serviceName, data, type) {
    if (!data) return;
    const text = data.toString();
    // Split on newlines but keep empty lines for formatting (like server banners)
    const lines = text.split(/\r?\n/);
    lines.forEach((line) => {
      // Only skip completely empty lines at the end
      if (line || lines.indexOf(line) < lines.length - 1) {
        this.addLog(serviceName, line, type);
      }
    });
  }

  async start(serviceName) {
    this.addLog(serviceName, `[SERVICE] start() called for ${serviceName}`, 'info');
    
    const service = this.services[serviceName];
    if (!service) {
      this.addLog(serviceName, `[SERVICE ERROR] Unknown service: ${serviceName}`, 'error');
      return { success: false, error: 'Unknown service' };
    }

    if (service.status === 'running') {
      this.addLog(serviceName, `[SERVICE] Service already running: ${serviceName}`, 'info');
      return { success: false, error: 'Service already running' };
    }

    try {
      this.addLog(serviceName, `[SERVICE] Updating status to 'starting'`, 'info');
      this.updateStatus(serviceName, 'starting');
      
      this.addLog(serviceName, `[SERVICE] Entering switch statement for ${serviceName}`, 'info');
      switch (serviceName) {
        case 'ollama':
          this.addLog(serviceName, `[SERVICE] Calling startOllama()`, 'info');
          await this.startOllama();
          this.addLog(serviceName, `[SERVICE] startOllama() completed`, 'info');
          break;
        case 'ragServer':
          this.addLog(serviceName, `[SERVICE] Calling startRagServer()`, 'info');
          await this.startRagServer();
          this.addLog(serviceName, `[SERVICE] startRagServer() completed`, 'info');
          break;
        case 'syncWatcher':
          this.addLog(serviceName, `[SERVICE] Calling startSyncWatcher()`, 'info');
          await this.startSyncWatcher();
          this.addLog(serviceName, `[SERVICE] startSyncWatcher() completed`, 'info');
          break;
        default:
          this.addLog(serviceName, `[SERVICE ERROR] No handler for service: ${serviceName}`, 'error');
          throw new Error(`Unknown service: ${serviceName}`);
      }

      this.addLog(serviceName, `[SERVICE] Updating status to 'running'`, 'info');
      this.updateStatus(serviceName, 'running');
      this.addLog(serviceName, `[SERVICE] start() completed successfully for ${serviceName}`, 'info');
      return { success: true };
    } catch (error) {
      this.addLog(serviceName, `[SERVICE ERROR] start() failed: ${error.message}`, 'error');
      this.updateStatus(serviceName, 'stopped');
      this.addLog(serviceName, `[SERVICE ERROR] Full error: ${error.stack}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async stop(serviceName) {
    const service = this.services[serviceName];
    if (!service) {
      return { success: false, error: 'Unknown service' };
    }

    if (service.status === 'stopped') {
      return { success: false, error: 'Service not running' };
    }

    try {
      this.updateStatus(serviceName, 'stopping');

      if (service.process) {
        await this.killProcess(service.process.pid);
        service.process = null;
      }

      this.updateStatus(serviceName, 'stopped');
      this.addLog(serviceName, 'Service stopped', 'info');
      return { success: true };
    } catch (error) {
      this.addLog(serviceName, `ERROR stopping: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async forceStop(serviceName) {
    const service = this.services[serviceName];
    if (!service) {
      return { success: false, error: 'Unknown service' };
    }

    try {
      this.addLog(serviceName, 'Force stopping service...', 'info');
      this.updateStatus(serviceName, 'stopping');

      if (service.process) {
        await this.killProcess(service.process.pid);
        service.process = null;
      }

      if (service.port) {
        await this.killProcessByPort(service.port);
      }

      this.updateStatus(serviceName, 'stopped');
      this.addLog(serviceName, 'Service force stopped', 'success');
      return { success: true };
    } catch (error) {
      this.addLog(serviceName, `ERROR force stopping: ${error.message}`, 'error');
      this.updateStatus(serviceName, 'stopped');
      return { success: false, error: error.message };
    }
  }

  async checkPort(serviceName) {
    const service = this.services[serviceName];
    if (!service || !service.port) {
      return { isRunning: false };
    }

    try {
      const isRunning = await this.isPortInUse(service.port);
      if (isRunning && service.status === 'stopped') {
        service.status = 'running';
      }
      return { isRunning, port: service.port };
    } catch (error) {
      return { isRunning: false, error: error.message };
    }
  }

  killProcess(pid) {
    return new Promise((resolve, reject) => {
      kill(pid, 'SIGTERM', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async killProcessByPort(port) {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
      const findCmd = spawn('cmd', ['/c', `netstat -ano | findstr :${port}`]);
      let output = '';

      findCmd.stdout.on('data', (data) => {
        output += data.toString();
      });

      findCmd.on('close', async () => {
        const lines = output.split('\n');
        const pids = new Set();

        for (const line of lines) {
          const match = line.match(/LISTENING\s+(\d+)/);
          if (match) {
            pids.add(match[1]);
          }
        }

        for (const pid of pids) {
          try {
            await this.killProcess(parseInt(pid));
          } catch (err) {
            // Ignore errors
          }
        }

        resolve();
      });
    });
  }

  async isPortInUse(port) {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
      const findCmd = spawn('powershell', ['-Command', `(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).Count -gt 0`]);
      let output = '';

      findCmd.stdout.on('data', (data) => {
        output += data.toString().trim();
      });

      findCmd.on('close', () => {
        resolve(output === 'True');
      });

      findCmd.on('error', () => {
        resolve(false);
    
    this.addLog(serviceName, `[SERVICE] Entering switch statement for ${serviceName}`, 'info');
    switch (serviceName) {
      case 'ollama':
        this.addLog(serviceName, `[SERVICE] Calling startOllama()`, 'info');
        await this.startOllama();
        this.addLog(serviceName, `[SERVICE] startOllama() completed`, 'info');
        break;
      case 'ragServer':
        this.addLog(serviceName, `[SERVICE] Calling startRagServer()`, 'info');
        await this.startRagServer();
        this.addLog(serviceName, `[SERVICE] startRagServer() completed`, 'info');
        break;
      case 'syncWatcher':
        this.addLog(serviceName, `[SERVICE] Calling startSyncWatcher()`, 'info');
        await this.startSyncWatcher();
        this.addLog(serviceName, `[SERVICE] startSyncWatcher() completed`, 'info');
        break;
      default:
        this.addLog(serviceName, `[SERVICE ERROR] No handler for service: ${serviceName}`, 'error');
        throw new Error(`Unknown service: ${serviceName}`);
    this.addLog('ragServer', 'Starting RAG Server...', 'info');
    this.addLog('ragServer', `Working directory: ${ragPath}`, 'info');
    
    const proc = spawn('node', ['src/server.mjs'], {
      cwd: ragPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env, NODE_NO_WARNINGS: '1', FORCE_COLOR: '0' }
    });

    service.process = proc;
    let hasOutput = false;

    proc.stdout.on('data', (data) => {
      hasOutput = true;
      this.streamLogLines('ragServer', data, 'stdout');
    });

    proc.stderr.on('data', (data) => {
      hasOutput = true;
      this.streamLogLines('ragServer', data, 'stderr');
    });

    proc.on('error', (error) => {
      this.addLog('ragServer', `Spawn error: ${error.message}`, 'error');
      this.addLog('ragServer', `Error code: ${error.code}`, 'error');
      this.updateStatus('ragServer', 'stopped');
    });

    proc.on('exit', (code, signal) => {
      this.addLog('ragServer', `Process exited: code=${code}, signal=${signal}, hasOutput=${hasOutput}`, 'error');
      this.updateStatus('ragServer', 'stopped');
      service.process = null;
    });

    await this.sleep(2500);
    const isUp = await this.isPortInUse(service.port);
    if (isUp) {
      this.addLog('ragServer', 'RAG Server started on port 6444', 'success');
    } else {
      this.addLog('ragServer', 'RAG Server failed to start (port 6444 still closed)', 'error');
      this.updateStatus('ragServer', 'stopped');
      try { if (proc.pid) await this.killProcess(proc.pid); } catch {}
      service.process = null;
      throw new Error('RAG Server did not open port 6444');
    }
  }

  async startSyncWatcher() {
    const service = this.services.syncWatcher;
    const ragPath = path.join(__dirname, '..', 'rag');
    
    this.addLog('syncWatcher', 'Starting Sync Watcher...', 'info');
    this.addLog('syncWatcher', `Watching for changes in ${ragPath}`, 'info');
    
    const proc = spawn('node', ['src/sync.mjs', '--watch'], {
      cwd: ragPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, NODE_NO_WARNINGS: '1', FORCE_COLOR: '0' }
    });

    service.process = proc;

    proc.stdout.on('data', (data) => {
      this.streamLogLines('syncWatcher', data, 'stdout');
    });

    proc.stderr.on('data', (data) => {
      this.streamLogLines('syncWatcher', data, 'stderr');
    });

    proc.on('error', (error) => {
      this.addLog('syncWatcher', `Process error: ${error.message}`, 'error');
      this.updateStatus('syncWatcher', 'stopped');
    });

    proc.on('exit', (code) => {
      this.addLog('syncWatcher', `Process exited with code ${code}`, 'info');
      this.updateStatus('syncWatcher', 'stopped');
      service.process = null;
    });

    await this.sleep(2000);
    if (service.process && !service.process.killed) {
      this.addLog('syncWatcher', 'Sync Watcher started successfully', 'success');
    } else {
      this.addLog('syncWatcher', 'Sync Watcher failed to start', 'error');
      this.updateStatus('syncWatcher', 'stopped');
      throw new Error('Sync Watcher did not stay alive');
    }
  }

  addLog(serviceName, message, type = 'info') {
    const service = this.services[serviceName];
    if (!service) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message: message.trim(),
      type
    };

    service.logs.push(logEntry);
    
    if (service.logs.length > 500) {
      service.logs.shift();
    }

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('service:log', {
        serviceName,
        log: logEntry
      });
    }
  }

  updateStatus(serviceName, status) {
    const service = this.services[serviceName];
    if (!service) return;

    service.status = status;

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('service:status-change', {
        serviceName,
        status
      });
    }
  }

  getStatus(serviceName) {
    const service = this.services[serviceName];
    if (!service) return null;

    return {
      name: service.name,
      status: service.status,
      logs: service.logs.slice(-100),
      port: service.port
    };
  }

  getAllStatus() {
    const result = {};
    for (const [key, service] of Object.entries(this.services)) {
      result[key] = {
        name: service.name,
        status: service.status,
        port: service.port,
        logCount: service.logs.length
      };
    }
    return result;
  }

  clearLogs(serviceName) {
    const service = this.services[serviceName];
    if (!service) return { success: false };

    service.logs = [];
    return { success: true };
  }

  stopAll() {
    for (const serviceName of Object.keys(this.services)) {
      this.stop(serviceName);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ServiceManager;
