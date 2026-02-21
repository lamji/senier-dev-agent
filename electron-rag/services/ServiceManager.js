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
    const lines = text.split(/\r?\n/);
    lines.forEach((line) => {
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

  async startOllama() {
    this.addLog('ollama', `[OLLAMA] startOllama() called`, 'info');
    const service = this.services.ollama;
    
    this.addLog('ollama', '[OLLAMA] Starting Ollama in WSL...', 'info');
    
    const cmd = 'wsl';
    const args = ['-e', 'bash', '-c', 'OLLAMA_HOST=0.0.0.0:11434 ollama serve'];
    this.addLog('ollama', `[OLLAMA] Spawning: ${cmd} ${args.join(' ')}`, 'info');
    
    const proc = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.addLog('ollama', `[OLLAMA] Process spawned with PID: ${proc.pid}`, 'info');
    service.process = proc;
    let hasOutput = false;
    let sawReadyBanner = false;

    proc.stdout.on('data', (data) => {
      hasOutput = true;
      this.addLog('ollama', `[OLLAMA STDOUT] Received ${data.length} bytes`, 'info');
      this.streamLogLines('ollama', data, 'stdout');
    });

    proc.stderr.on('data', (data) => {
      hasOutput = true;
      this.addLog('ollama', `[OLLAMA STDERR] Received ${data.length} bytes`, 'info');
      this.streamLogLines('ollama', data, 'stderr');
    });

    proc.on('error', (error) => {
      this.addLog('ollama', `[OLLAMA ERROR] Process error: ${error.message}`, 'error');
      this.addLog('ollama', `[OLLAMA ERROR] Error code: ${error.code}`, 'error');
      this.updateStatus('ollama', 'stopped');
    });

    proc.on('exit', (code, signal) => {
      this.addLog('ollama', `[OLLAMA EXIT] Process exited: code=${code}, signal=${signal}, hasOutput=${hasOutput}`, 'error');
      this.updateStatus('ollama', 'stopped');
      service.process = null;
    });

    this.addLog('ollama', '[OLLAMA] Waiting 2 seconds for startup...', 'info');
    await this.sleep(2000);
    this.addLog('ollama', '[OLLAMA] Ollama started successfully', 'success');
  }

  async startRagServer() {
    const service = this.services.ragServer;
    const ragPath = path.join(__dirname, '..', 'rag');
    
    this.addLog('ragServer', 'Starting RAG Server...', 'info');
    this.addLog('ragServer', `Working directory: ${ragPath}`, 'info');
    
    // Kill any zombie processes on port 6444 before starting
    this.addLog('ragServer', '[CLEANUP] Checking for zombie processes on port 6444...', 'info');
    await this.killProcessOnPort(6444);
    
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
      const text = data.toString();
      if (/http:\/\/localhost:6444|Listening on/i.test(text)) {
        sawReadyBanner = true;
      }
      this.streamLogLines('ragServer', text, 'stdout');
    });

    proc.stderr.on('data', (data) => {
      hasOutput = true;
      this.streamLogLines('ragServer', data.toString(), 'stderr');
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

    // Poll for port/health up to 10 seconds using Node http (no fetch dependency)
    const http = require('http');
    const checkHealth = () => new Promise((resolve) => {
      const req = http.get('http://localhost:6444/health', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk.toString());
        res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: data }));
      });
      req.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
      req.end();
    });

    // warmup before polling
    await this.sleep(2000);

    let healthy = false;
    for (let i = 0; i < 60; i++) {
      await this.sleep(1000);
      const portOpen = await this.isPortInUse(service.port);
      if (portOpen) {
        const res = await checkHealth();
        this.addLog('ragServer', `[HEALTH] Attempt ${i + 1}: status ${res.status || '0'} ${res.error ? '- ' + res.error : ''}`, res.ok ? 'info' : 'error');
        if (res.ok) {
          healthy = true;
          break;
        }
      } else {
        this.addLog('ragServer', `[HEALTH] Attempt ${i + 1}: port 6444 not open yet`, 'info');
      }
    }

    if (healthy || sawReadyBanner) {
      this.addLog('ragServer', 'RAG Server started on port 6444', 'success');
    } else {
      this.addLog('ragServer', 'RAG Server failed to start (port 6444 still closed or unhealthy)', 'error');
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
      shell: false,
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

    proc.on('exit', (code, signal) => {
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
    
    this.mainWindow.webContents.send('service:log', {
      serviceName,
      log: logEntry
    });
  }

  updateStatus(serviceName, status) {
    const service = this.services[serviceName];
    if (!service) return;
    
    service.status = status;
    
    this.mainWindow.webContents.send('service:status-change', {
      serviceName,
      status
    });
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

  async killProcess(pid) {
    return new Promise((resolve) => {
      kill(pid, 'SIGTERM', (error) => {
        if (error) {
          kill(pid, 'SIGKILL', resolve);
        } else {
          resolve();
        }
      });
    });
  }

  async killProcessOnPort(port) {
    const { spawn } = require('child_process');
    
    // First, kill any process on the port
    await new Promise((resolve) => {
      const findCmd = spawn('powershell', ['-Command', `$conn = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue; if ($conn) { $pid = $conn.OwningProcess; Write-Host "Killing PID $pid on port ${port}"; Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } else { Write-Host "No process on port ${port}" }`]);
      
      findCmd.stdout.on('data', (data) => {
        this.addLog('ragServer', `[CLEANUP] ${data.toString().trim()}`, 'info');
      });
      
      findCmd.on('close', () => {
        resolve();
      });
      
      findCmd.on('error', () => {
        resolve();
      });
    });
    
    // Wait for port to be released (up to 5 seconds)
    this.addLog('ragServer', `[CLEANUP] Waiting for port ${port} to be released...`, 'info');
    for (let i = 0; i < 10; i++) {
      await this.sleep(500);
      const stillInUse = await this.isPortInUse(port);
      if (!stillInUse) {
        this.addLog('ragServer', `[CLEANUP] Port ${port} is now free`, 'info');
        return;
      }
      this.addLog('ragServer', `[CLEANUP] Port ${port} still in use, waiting... (${i + 1}/10)`, 'info');
    }
    
    this.addLog('ragServer', `[CLEANUP] Warning: Port ${port} may still be in use after cleanup`, 'error');
  }

  async killProcessByPort(port) {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
      const killCmd = spawn('powershell', ['-Command', `Get-Process | Where-Object {$_.ProcessName -eq 'node'} | ForEach-Object { $proc = $_; netstat -ano | Select-String ':${port}' | ForEach-Object { if ($_ -match '\\s+(\\d+)$') { $pid = $matches[1]; if ($pid -eq $proc.Id) { Stop-Process -Id $pid -Force } } } }`]);
      killCmd.on('close', resolve);
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
      });
    });
  }

  async checkPort(serviceName) {
    const service = this.services[serviceName];
    if (!service || !service.port) {
      return { isRunning: false, port: null };
    }

    try {
      const isRunning = await this.isPortInUse(service.port);
      
      if (isRunning && service.status !== 'running') {
        this.updateStatus(serviceName, 'running');
      } else if (!isRunning && service.status === 'running') {
        this.updateStatus(serviceName, 'stopped');
      }
      
      return { isRunning, port: service.port };
    } catch (error) {
      return { isRunning: false, port: service.port, error: error.message };
    }
  }

  getStatus(serviceName) {
    const service = this.services[serviceName];
    if (!service) {
      return null;
    }
    
    return {
      name: service.name,
      status: service.status,
      port: service.port,
      logs: [...service.logs]
    };
  }

  getAllStatus() {
    const status = {};
    for (const serviceName in this.services) {
      status[serviceName] = this.getStatus(serviceName);
    }
    return status;
  }

  clearLogs(serviceName) {
    const service = this.services[serviceName];
    if (!service) {
      return { success: false, error: 'Unknown service' };
    }
    
    service.logs = [];
    return { success: true };
  }

  stopAll() {
    for (const serviceName in this.services) {
      if (this.services[serviceName].status === 'running') {
        this.stop(serviceName);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ServiceManager;
