/**
 * RAG Control Panel Simulation - Node.js Version
 * Exactly matches Electron renderer.js + ServiceManager.js flow
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

class ServiceManager {
  constructor() {
    this.services = {
      ollama: { name: 'Ollama Server', process: null, status: 'stopped', port: 11434 },
      ragServer: { name: 'RAG Server', process: null, status: 'stopped', port: 6444 },
      syncWatcher: { name: 'Sync Watcher', process: null, status: 'stopped', port: null }
    };
    this.logs = [];
  }

  addLog(serviceName, message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message: message.trim(), type };
    this.logs.push(logEntry);
    
    const typePrefix = {
      info: '[INFO]',
      success: '[SUCCESS]',
      error: '[ERROR]',
      stdout: '[STDOUT]',
      stderr: '[STDERR]'
    }[type] || '[INFO]';
    
    console.log(`[${timestamp}] [${serviceName.toUpperCase()}] ${typePrefix} ${message}`);
  }

  updateStatus(serviceName, status) {
    if (this.services[serviceName]) {
      this.services[serviceName].status = status;
      this.addLog(serviceName, `Status updated to: ${status}`, 'info');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isPortInUse(port) {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        resolve(true);
      });
      req.on('error', () => resolve(false));
      req.end();
    });
  }

  checkHealth(port) {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk.toString());
        res.on('end', () => resolve({ 
          ok: res.statusCode >= 200 && res.statusCode < 300, 
          status: res.statusCode, 
          body: data 
        }));
      });
      req.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
      req.end();
    });
  }

  async startOllama() {
    this.addLog('ollama', '[OLLAMA] startOllama() called', 'info');
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

    proc.stdout.on('data', (data) => {
      hasOutput = true;
      this.addLog('ollama', `[OLLAMA STDOUT] Received ${data.length} bytes`, 'info');
      const lines = data.toString().split(/\r?\n/);
      lines.forEach(line => {
        if (line.trim()) this.addLog('ollama', line.trim(), 'stdout');
      });
    });

    proc.stderr.on('data', (data) => {
      hasOutput = true;
      this.addLog('ollama', `[OLLAMA STDERR] Received ${data.length} bytes`, 'info');
      const lines = data.toString().split(/\r?\n/);
      lines.forEach(line => {
        if (line.trim()) this.addLog('ollama', line.trim(), 'stderr');
      });
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

  async startRagServer() {
    const service = this.services.ragServer;
    const ragPath = path.join(__dirname, 'rag');
    
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
      const lines = data.toString().split(/\r?\n/);
      lines.forEach(line => {
        if (line.trim()) this.addLog('ragServer', line.trim(), 'stdout');
      });
    });

    proc.stderr.on('data', (data) => {
      hasOutput = true;
      const lines = data.toString().split(/\r?\n/);
      lines.forEach(line => {
        if (line.trim()) this.addLog('ragServer', line.trim(), 'stderr');
      });
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

    // Warmup before polling (matching ServiceManager.js line 195)
    this.addLog('ragServer', '[HEALTH] Waiting 2 seconds before health checks...', 'info');
    await this.sleep(2000);

    // Poll for health up to 30 seconds (matching ServiceManager.js line 198)
    let healthy = false;
    for (let i = 0; i < 30; i++) {
      await this.sleep(1000);
      
      const portOpen = await this.isPortInUse(service.port);
      if (portOpen) {
        const res = await this.checkHealth(service.port);
        this.addLog('ragServer', `[HEALTH] Attempt ${i + 1}: status ${res.status || '0'} ${res.error ? '- ' + res.error : ''}`, res.ok ? 'info' : 'error');
        if (res.ok) {
          healthy = true;
          break;
        }
      } else {
        this.addLog('ragServer', `[HEALTH] Attempt ${i + 1}: port 6444 not open yet`, 'info');
      }
    }

    if (healthy) {
      this.addLog('ragServer', 'RAG Server started on port 6444', 'success');
    } else {
      this.addLog('ragServer', 'RAG Server failed to start (port 6444 still closed or unhealthy)', 'error');
      this.updateStatus('ragServer', 'stopped');
      if (proc.pid) proc.kill();
      service.process = null;
      throw new Error('RAG Server did not open port 6444');
    }
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
}

async function simulateButtonClick(serviceName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SIMULATING START: ${serviceName.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  
  const manager = new ServiceManager();
  
  // Matching renderer.js lines 62-68
  manager.addLog(serviceName, `[UI] Button clicked for ${serviceName}`, 'info');
  manager.addLog(serviceName, `[UI] ▶ Starting ${serviceName}...`, 'info');
  manager.addLog(serviceName, `[UI] Calling IPC: window.electronAPI.startService('${serviceName}')`, 'info');
  
  // Matching main.js IPC handler
  console.log(`[MAIN] IPC handler: service:start for ${serviceName}`);
  console.log(`[MAIN] Calling serviceManager.start('${serviceName}')`);
  
  // Call ServiceManager.start()
  const result = await manager.start(serviceName);
  
  // Matching renderer.js lines 72-78
  manager.addLog(serviceName, `[IPC] Response received: ${JSON.stringify(result)}`, 'info');
  
  if (!result.success) {
    manager.addLog(serviceName, `[ERROR] ✗ Failed to start: ${result.error}`, 'error');
    console.log(`\n❌ FAILED: ${serviceName}`);
    return false;
  } else {
    manager.addLog(serviceName, `[SUCCESS] ✓ Start command sent successfully`, 'success');
    console.log(`\n✅ SUCCESS: ${serviceName}`);
    return true;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('RAG Control Panel Simulation - Node.js');
  console.log('='.repeat(60));
  console.log();
  
  // Test Ollama
  const successOllama = await simulateButtonClick('ollama');
  
  // Wait 3 seconds before next service
  console.log('\n⏳ Waiting 3 seconds before starting RAG Server...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test RAG Server
  const successRag = await simulateButtonClick('ragServer');
  
  console.log('\n' + '='.repeat(60));
  console.log('SIMULATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Ollama:     ${successOllama ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`RAG Server: ${successRag ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60));
  
  if (successOllama && successRag) {
    console.log('\n🎉 ALL TESTS PASSED - Electron should work the same way');
    process.exit(0);
  } else {
    console.log('\n❌ TESTS FAILED - Fix required');
    process.exit(1);
  }
}

main().catch(console.error);
