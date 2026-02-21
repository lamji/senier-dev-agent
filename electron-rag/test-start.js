const { spawn } = require('child_process');
const path = require('path');

// Simulate ServiceManager behavior without Electron
class TestServiceManager {
  constructor() {
    this.logs = [];
  }

  addLog(serviceName, message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message: message.trim(), type };
    this.logs.push(logEntry);
    console.log(`[${timestamp}] [${serviceName.toUpperCase()}] ${message}`);
  }

  async isPortInUse(port) {
    return new Promise((resolve) => {
      const { spawn } = require('child_process');
      const findCmd = spawn('powershell', ['-Command', `(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).Count -gt 0`]);
      let output = '';
      findCmd.stdout.on('data', (data) => output += data.toString().trim());
      findCmd.on('close', () => resolve(output === 'True'));
      findCmd.on('error', () => resolve(false));
    });
  }

  async startOllama() {
    this.addLog('ollama', '[OLLAMA] startOllama() called');
    this.addLog('ollama', '[OLLAMA] Starting Ollama in WSL...');
    
    const cmd = 'wsl';
    const args = ['-e', 'bash', '-c', 'OLLAMA_HOST=0.0.0.0:11434 ollama serve'];
    this.addLog('ollama', `[OLLAMA] Spawning: ${cmd} ${args.join(' ')}`);
    
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    this.addLog('ollama', `[OLLAMA] Process spawned with PID: ${proc.pid}`);
    
    let hasOutput = false;
    proc.stdout.on('data', (data) => {
      hasOutput = true;
      this.addLog('ollama', `[OLLAMA STDOUT] Received ${data.length} bytes`);
      console.log(data.toString().trim());
    });
    
    proc.stderr.on('data', (data) => {
      hasOutput = true;
      this.addLog('ollama', `[OLLAMA STDERR] Received ${data.length} bytes`);
      console.log(data.toString().trim());
    });
    
    proc.on('error', (error) => {
      this.addLog('ollama', `[OLLAMA ERROR] Process error: ${error.message}`);
    });
    
    proc.on('exit', (code, signal) => {
      this.addLog('ollama', `[OLLAMA EXIT] Process exited: code=${code}, signal=${signal}, hasOutput=${hasOutput}`);
    });
    
    this.addLog('ollama', '[OLLAMA] Waiting 2 seconds for startup...');
    await this.sleep(2000);
    this.addLog('ollama', '[OLLAMA] Ollama started successfully');
    return proc;
  }

  async startRagServer() {
    const ragPath = path.join(__dirname, 'rag');
    this.addLog('ragServer', 'Starting RAG Server...');
    this.addLog('ragServer', `Working directory: ${ragPath}`);
    
    const proc = spawn('node', ['src/server.mjs'], {
      cwd: ragPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env, NODE_NO_WARNINGS: '1', FORCE_COLOR: '0' }
    });
    
    this.addLog('ragServer', `[RAG] Process spawned with PID: ${proc.pid}`);
    let hasOutput = false;
    
    proc.stdout.on('data', (data) => {
      hasOutput = true;
      console.log(data.toString().trim());
    });
    
    proc.stderr.on('data', (data) => {
      hasOutput = true;
      console.error(data.toString().trim());
    });
    
    proc.on('error', (error) => {
      this.addLog('ragServer', `[RAG ERROR] Process error: ${error.message}`);
    });
    
    proc.on('exit', (code, signal) => {
      this.addLog('ragServer', `[RAG EXIT] Process exited: code=${code}, signal=${signal}, hasOutput=${hasOutput}`);
    });
    
    // Health check using Node http
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
    
    // Wait longer initially for server to fully bind to port
    await this.sleep(2000);
    
    let healthy = false;
    for (let i = 0; i < 10; i++) {
      await this.sleep(500);
      const portOpen = await this.isPortInUse(6444);
      if (portOpen) {
        const res = await checkHealth();
        this.addLog('ragServer', `[HEALTH] Attempt ${i + 1}: status ${res.status || '0'} ${res.error ? '- ' + res.error : ''}`);
        if (res.ok) {
          healthy = true;
          break;
        }
      } else {
        this.addLog('ragServer', `[HEALTH] Attempt ${i + 1}: port 6444 not open yet`);
      }
    }
    
    if (healthy) {
      this.addLog('ragServer', 'RAG Server started on port 6444');
    } else {
      this.addLog('ragServer', 'RAG Server failed to start (port 6444 still closed or unhealthy)');
      if (proc.pid) proc.kill();
      throw new Error('RAG Server did not open port 6444');
    }
    
    return proc;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async killProcessOnPort(port) {
    const { spawn } = require('child_process');
    
    // First, kill any process on the port
    await new Promise((resolve) => {
      const findCmd = spawn('powershell', ['-Command', `$conn = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue; if ($conn) { $pid = $conn.OwningProcess; Write-Host "Killing PID $pid on port ${port}"; Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } else { Write-Host "No process on port ${port}" }`]);
      
      findCmd.stdout.on('data', (data) => {
        console.log(`[CLEANUP] ${data.toString().trim()}`);
      });
      
      findCmd.on('close', () => {
        resolve();
      });
      
      findCmd.on('error', () => {
        resolve();
      });
    });
    
    // Wait for port to be released (up to 5 seconds)
    console.log(`[CLEANUP] Waiting for port ${port} to be released...`);
    for (let i = 0; i < 10; i++) {
      await this.sleep(500);
      const stillInUse = await this.isPortInUse(port);
      if (!stillInUse) {
        console.log(`[CLEANUP] Port ${port} is now free`);
        return;
      }
      console.log(`[CLEANUP] Port ${port} still in use, waiting... (${i + 1}/10)`);
    }
    
    console.log(`[CLEANUP] Warning: Port ${port} may still be in use after cleanup`);
  }
}

// Simulate button clicks
async function simulateStart(serviceName) {
  console.log(`\n=== SIMULATING START: ${serviceName.toUpperCase()} ===`);
  console.log(`[UI] Button clicked for ${serviceName}`);
  
  // Cleanup before starting RAG server
  if (serviceName === 'ragServer') {
    console.log(`[UI] 🔧 Cleaning up port 6444 before starting...`);
    try {
      const manager = new TestServiceManager();
      await manager.killProcessOnPort(6444);
      console.log(`[UI] ✅ Port cleanup completed`);
    } catch (error) {
      console.log(`[UI] ⚠️ Port cleanup warning: ${error.message}`);
    }
  }
  
  console.log(`[UI] ▶ Starting ${serviceName}...`);
  console.log(`[UI] Calling IPC: window.electronAPI.startService('${serviceName}')`);
  console.log(`[MAIN] IPC handler: service:start for ${serviceName}`);
  console.log(`[MAIN] Calling serviceManager.start('${serviceName}')`);
  console.log(`[SERVICE] start() called for ${serviceName}`);
  console.log(`[SERVICE] Updating status to 'starting'`);
  console.log(`[SERVICE] Entering switch statement for ${serviceName}`);
  console.log(`[SERVICE] Calling start${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}()`);
  
  const manager = new TestServiceManager();
  
  try {
    if (serviceName === 'ollama') {
      await manager.startOllama();
    } else if (serviceName === 'ragServer') {
      await manager.startRagServer();
    }
    console.log(`[SERVICE] start${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}() completed`);
    console.log(`[SERVICE] Updating status to 'running'`);
    console.log(`[SERVICE] start() completed successfully for ${serviceName}`);
    console.log(`[MAIN] serviceManager.start returned: {"success":true}`);
    console.log(`[IPC] Response received: {"success":true}`);
    console.log(`[SUCCESS] ✓ Start command sent successfully`);
  } catch (error) {
    console.log(`[SERVICE ERROR] start() failed: ${error.message}`);
    console.log(`[SERVICE ERROR] Full error: ${error.stack}`);
    console.log(`[MAIN] serviceManager.start returned: {"success":false,"error":"${error.message}"}`);
    console.log(`[IPC] Response received: {"success":false,"error":"${error.message}"}`);
    console.log(`[ERROR] ✗ Failed to start: ${error.message}`);
  }
}

// Run simulations
async function runTests() {
  console.log('=== RAG Control Panel Simulation ===\n');
  
  // Test Ollama
  await simulateStart('ollama');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test RAG Server
  await simulateStart('ragServer');
  
  console.log('\n=== Simulation Complete ===');
}

runTests().catch(console.error);
