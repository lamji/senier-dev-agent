const services = ['ollama', 'ragServer', 'syncWatcher'];
let activeTerminal = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  addStartupLogs();
  loadInitialStatus();
  setupRealtimeUpdates();
  checkPortsOnStartup();
});

function addStartupLogs() {
  const timestamp = new Date().toLocaleTimeString();
  addLogToTerminal('ollama', '=== RAG Control Panel Started ===', 'info');
  addLogToTerminal('ragServer', '=== RAG Control Panel Started ===', 'info');
  addLogToTerminal('syncWatcher', '=== RAG Control Panel Started ===', 'info');
}

function initializeEventListeners() {
  document.querySelectorAll('[data-action="start"]').forEach(btn => {
    btn.addEventListener('click', handleStart);
  });

  document.querySelectorAll('[data-action="stop"]').forEach(btn => {
    btn.addEventListener('click', handleStop);
  });

  document.querySelectorAll('[data-action="force"]').forEach(btn => {
    btn.addEventListener('click', handleForceStop);
  });

  document.getElementById('killAll').addEventListener('click', handleKillAll);
  document.getElementById('clearActiveTerminal').addEventListener('click', handleClearActiveTerminal);
  document.getElementById('closeKillOutput').addEventListener('click', () => {
    document.getElementById('killAllOutput').style.display = 'none';
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
  });

  document.getElementById('openSettings').addEventListener('click', openSettings);
  document.getElementById('closeSettings').addEventListener('click', closeSettings);
  document.getElementById('settingsOverlay').addEventListener('click', closeSettings);
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
  document.getElementById('browseKnowledgeBase').addEventListener('click', browseKnowledgeBase);
  
  document.getElementById('ragUtilitySelect').addEventListener('change', (e) => {
    document.getElementById('runRagUtility').disabled = !e.target.value;
  });
  document.getElementById('runRagUtility').addEventListener('click', runRagUtility);
  document.getElementById('closeRagUtility').addEventListener('click', () => {
    document.getElementById('ragUtilityTerminal').style.display = 'none';
  });
}

async function handleStart(e) {
  const serviceName = e.currentTarget.dataset.service;
  const btn = e.currentTarget;
  
  addLogToTerminal(serviceName, `[UI] Button clicked for ${serviceName}`, 'info');
  
  // Cleanup before starting RAG server
  if (serviceName === 'ragServer') {
    addLogToTerminal(serviceName, `[UI] 🔧 Cleaning up port 6444 before starting...`, 'info');
    try {
      await window.electronAPI.cleanupPort(6444);
      addLogToTerminal(serviceName, `[UI] ✅ Port cleanup completed`, 'info');
    } catch (error) {
      addLogToTerminal(serviceName, `[UI] ⚠️ Port cleanup warning: ${error.message}`, 'info');
    }
  }
  
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> Starting...';
  
  addLogToTerminal(serviceName, `[UI] ▶ Starting ${serviceName}...`, 'info');
  addLogToTerminal(serviceName, `[UI] Calling IPC: window.electronAPI.startService('${serviceName}')`, 'info');
  
  try {
    const result = await window.electronAPI.startService(serviceName);
    addLogToTerminal(serviceName, `[IPC] Response received: ${JSON.stringify(result)}`, 'info');
    
    if (!result.success) {
      addLogToTerminal(serviceName, `[ERROR] ✗ Failed to start: ${result.error}`, 'error');
    } else {
      addLogToTerminal(serviceName, `[SUCCESS] ✓ Start command sent successfully`, 'success');
    }
  } catch (error) {
    addLogToTerminal(serviceName, `[ERROR] ✗ IPC Error: ${error.message}`, 'error');
  } finally {
    updateServiceButtons(serviceName);
  }
}

async function handleStop(e) {
  const serviceName = e.currentTarget.dataset.service;
  const btn = e.currentTarget;
  
  addLogToTerminal(serviceName, `[UI] Stop button clicked for ${serviceName}`, 'info');
  
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> Stopping...';
  
  addLogToTerminal(serviceName, `[UI] ■ Stopping ${serviceName}...`, 'info');
  addLogToTerminal(serviceName, `[UI] Calling IPC: window.electronAPI.stopService('${serviceName}')`, 'info');
  
  try {
    const result = await window.electronAPI.stopService(serviceName);
    addLogToTerminal(serviceName, `[IPC] Stop response: ${JSON.stringify(result)}`, 'info');
    
    if (!result.success) {
      addLogToTerminal(serviceName, `[ERROR] ✗ Failed to stop: ${result.error}`, 'error');
    } else {
      addLogToTerminal(serviceName, `[SUCCESS] ✓ Stop command sent successfully`, 'success');
    }
  } catch (error) {
    addLogToTerminal(serviceName, `[ERROR] ✗ IPC Error: ${error.message}`, 'error');
  } finally {
    updateServiceButtons(serviceName);
  }
}

async function handleForceStop(e) {
  const serviceName = e.currentTarget.dataset.service;
  const btn = e.currentTarget;
  
  addLogToTerminal(serviceName, `[UI] Force stop button clicked for ${serviceName}`, 'info');
  
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⚠</span> Force Stopping...';
  
  addLogToTerminal(serviceName, `[UI] ⚠ Force stopping ${serviceName}...`, 'info');
  addLogToTerminal(serviceName, `[UI] Calling IPC: window.electronAPI.forceStop('${serviceName}')`, 'info');
  
  try {
    const result = await window.electronAPI.forceStop(serviceName);
    addLogToTerminal(serviceName, `[IPC] Force stop response: ${JSON.stringify(result)}`, 'info');
    
    if (!result.success) {
      addLogToTerminal(serviceName, `[ERROR] ✗ Failed to force stop: ${result.error}`, 'error');
    } else {
      addLogToTerminal(serviceName, `[SUCCESS] ✓ Force stop completed`, 'success');
    }
  } catch (error) {
    addLogToTerminal(serviceName, `[ERROR] ✗ IPC Error: ${error.message}`, 'error');
  } finally {
    addLogToTerminal(serviceName, `[UI] Force stop process completed for ${serviceName}`, 'info');
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">⚠</span> Force Stop';
    updateServiceButtons(serviceName);
  }
}

async function handleKillAll() {
  if (!confirm('Force kill all processes? This will terminate all services immediately.')) {
    return;
  }
  
  const outputSection = document.getElementById('killAllOutput');
  const logsDiv = document.getElementById('killAllLogs');
  logsDiv.innerHTML = '';
  outputSection.style.display = 'block';
  
  const btn = document.getElementById('killAll');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> Killing All...';
  
  const addKillLog = (message) => {
    const logLine = document.createElement('div');
    const time = new Date().toLocaleTimeString();
    logLine.textContent = `[${time}] ${message}`;
    logsDiv.appendChild(logLine);
    logsDiv.scrollTop = logsDiv.scrollHeight;
  };
  
  try {
    addKillLog('Starting Kill All operation...');
    
    for (const service of services) {
      addKillLog(`Force stopping ${service}...`);
      const result = await window.electronAPI.forceStop(service);
      if (result.success) {
        addKillLog(`✓ ${service} terminated successfully`);
      } else {
        addKillLog(`✗ ${service} failed: ${result.error}`);
      }
      await sleep(500);
    }
    
    addKillLog('Kill All operation completed.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">⚠</span> Kill All Processes';
  }
}

async function handleClearActiveTerminal() {
  await window.electronAPI.clearLogs(activeTerminal);
  
  const terminal = document.getElementById(`terminal-${activeTerminal}`);
  terminal.innerHTML = '';
  
  const container = document.querySelector(`.terminal-container[data-terminal="${activeTerminal}"]`);
  const logCount = container.querySelector('.log-count');
  logCount.textContent = '0 lines';
}

function handleTabSwitch(e) {
  const terminalName = e.currentTarget.dataset.terminal;
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  e.currentTarget.classList.add('active');
  
  document.querySelectorAll('.terminal-container').forEach(container => {
    container.classList.remove('active');
  });
  
  const targetContainer = document.querySelector(`.terminal-container[data-terminal="${terminalName}"]`);
  if (targetContainer) {
    targetContainer.classList.add('active');
  }
  
  activeTerminal = terminalName;
}

async function loadInitialStatus() {
  for (const service of services) {
    const status = await window.electronAPI.getServiceStatus(service);
    if (status) {
      updateServiceStatus(service, status.status);
      
      if (status.logs && status.logs.length > 0) {
        status.logs.forEach(log => {
          addLogToTerminal(service, log.message, log.type, log.timestamp);
        });
      }
    }
  }
}

function setupRealtimeUpdates() {
  window.electronAPI.onLog((data) => {
    addLogToTerminal(data.serviceName, data.log.message, data.log.type, data.log.timestamp);
  });

  window.electronAPI.onStatusChange((data) => {
    updateServiceStatus(data.serviceName, data.status);
    updateServiceButtons(data.serviceName);
  });
}

function updateServiceStatus(serviceName, status) {
  const row = document.querySelector(`[data-service="${serviceName}"]`);
  if (!row) return;

  const indicator = row.querySelector('.status-indicator');
  const statusText = row.querySelector('.status-text');

  indicator.className = 'status-indicator ' + status;
  statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

async function updateServiceButtons(serviceName) {
  const status = await window.electronAPI.getServiceStatus(serviceName);
  const row = document.querySelector(`[data-service="${serviceName}"]`);
  if (!row) return;

  const startBtn = row.querySelector('[data-action="start"]');
  const stopBtn = row.querySelector('[data-action="stop"]');
  const forceBtn = row.querySelector('[data-action="force"]');

  if (status.status === 'running') {
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="btn-icon">▶</span> Start';
    stopBtn.disabled = false;
    forceBtn.disabled = false;
  } else if (status.status === 'stopped') {
    startBtn.disabled = false;
    startBtn.innerHTML = '<span class="btn-icon">▶</span> Start';
    stopBtn.disabled = true;
    stopBtn.innerHTML = '<span class="btn-icon">■</span> Stop';
    forceBtn.disabled = true;
  } else {
    startBtn.disabled = true;
    stopBtn.disabled = true;
    forceBtn.disabled = true;
  }
}

async function checkPortsOnStartup() {
  // Wait for IPC handlers to be ready
  await sleep(500);
  addLogToTerminal('ollama', 'Scanning port 11434...', 'info');
  addLogToTerminal('ragServer', 'Scanning port 6444...', 'info');
  addLogToTerminal('syncWatcher', 'Checking sync watcher status...', 'info');
  
  for (const service of services) {
    await checkAndUpdatePortStatus(service);
    await sleep(300);
  }
  
  addLogToTerminal('ollama', 'Port scan complete. Ready.', 'info');
  addLogToTerminal('ragServer', 'Port scan complete. Ready.', 'info');
  addLogToTerminal('syncWatcher', 'Status check complete. Ready.', 'info');
}

async function checkAndUpdatePortStatus(serviceName) {
  const result = await window.electronAPI.checkPort(serviceName);
  if (result && result.isRunning) {
    updateServiceStatus(serviceName, 'running');
    addLogToTerminal(serviceName, `✓ RUNNING - Process detected on port ${result.port}`, 'success');
  } else if (result && result.port) {
    addLogToTerminal(serviceName, `○ STOPPED - Port ${result.port} is free`, 'info');
  } else {
    addLogToTerminal(serviceName, `○ STOPPED - No port configured`, 'info');
  }
  updateServiceButtons(serviceName);
}

function addLogToTerminal(serviceName, message, type = 'info', timestamp = null) {
  const targets = [`terminal-${serviceName}`, 'terminal-all'];
  targets.forEach((id) => {
    const terminal = document.getElementById(id);
    if (!terminal) return;

    const logLine = document.createElement('div');
    logLine.className = `log-line log-${type}`;
    
    const time = timestamp || new Date().toLocaleTimeString();
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = `[${time}]`;
    
    const messageSpan = document.createElement('span');
    messageSpan.className = 'log-message';
    messageSpan.textContent = message;
    
    logLine.appendChild(timeSpan);
    logLine.appendChild(messageSpan);
    terminal.appendChild(logLine);
    
    terminal.scrollTop = terminal.scrollHeight;
    
    const container = terminal.closest('.terminal-container');
    if (container) {
      const logCount = container.querySelector('.log-count');
      const count = terminal.children.length;
      logCount.textContent = `${count} line${count !== 1 ? 's' : ''}`;
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function openSettings() {
  const modal = document.getElementById('settingsModal');
  modal.style.display = 'block';
  await loadSettings();
}

function closeSettings() {
  const modal = document.getElementById('settingsModal');
  modal.style.display = 'none';
}

async function loadSettings() {
  const settings = await window.electronAPI.getSettings();
  if (settings) {
    document.getElementById('qdrantUrl').value = settings.QDRANT_URL || '';
    document.getElementById('qdrantApiKey').value = settings.QDRANT_API_KEY || '';
    document.getElementById('qdrantCollection').value = settings.QDRANT_COLLECTION || '';
    document.getElementById('embeddingProvider').value = settings.EMBEDDING_PROVIDER || 'ollama';
    document.getElementById('geminiApiKey').value = settings.GEMINI_API_KEY || '';
    document.getElementById('groqApiKey').value = settings.GROQ_API_KEY || '';
    document.getElementById('huggingfaceApiKey').value = settings.HUGGINGFACE_API_KEY || '';
    document.getElementById('ollamaUrl').value = settings.OLLAMA_URL || '';
    document.getElementById('ollamaEmbedModel').value = settings.OLLAMA_EMBED_MODEL || '';
    document.getElementById('ragServerPort').value = settings.RAG_SERVER_PORT || '';
    document.getElementById('knowledgeBasePath').value = settings.KNOWLEDGE_BASE_PATH || '';
  }
}

async function saveSettings() {
  const settings = {
    QDRANT_URL: document.getElementById('qdrantUrl').value,
    QDRANT_API_KEY: document.getElementById('qdrantApiKey').value,
    QDRANT_COLLECTION: document.getElementById('qdrantCollection').value,
    EMBEDDING_PROVIDER: document.getElementById('embeddingProvider').value,
    GEMINI_API_KEY: document.getElementById('geminiApiKey').value,
    GROQ_API_KEY: document.getElementById('groqApiKey').value,
    HUGGINGFACE_API_KEY: document.getElementById('huggingfaceApiKey').value,
    OLLAMA_URL: document.getElementById('ollamaUrl').value,
    OLLAMA_EMBED_MODEL: document.getElementById('ollamaEmbedModel').value,
    RAG_SERVER_PORT: document.getElementById('ragServerPort').value,
    KNOWLEDGE_BASE_PATH: document.getElementById('knowledgeBasePath').value
  };
  
  const result = await window.electronAPI.saveSettings(settings);
  if (result.success) {
    alert('✓ Settings saved successfully! Restart services for changes to take effect.');
    closeSettings();
  } else {
    alert('✗ Failed to save settings: ' + result.error);
  }
}

async function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    const result = await window.electronAPI.resetSettings();
    if (result.success) {
      await loadSettings();
      alert('✓ Settings reset to defaults');
    }
  }
}

async function browseKnowledgeBase() {
  const result = await window.electronAPI.browseFolder();
  if (result.success && result.path) {
    document.getElementById('knowledgeBasePath').value = result.path;
  }
}

async function runRagUtility() {
  const select = document.getElementById('ragUtilitySelect');
  const command = select.value;
  if (!command) return;
  
  const terminal = document.getElementById('ragUtilityTerminal');
  const logsDiv = document.getElementById('ragUtilityLogs');
  
  terminal.style.display = 'block';
  logsDiv.innerHTML = '';
  
  const addLog = (message, type = 'info') => {
    const logLine = document.createElement('div');
    const time = new Date().toLocaleTimeString();
    logLine.style.marginBottom = '3px';
    if (type === 'error') logLine.style.color = '#e74c3c';
    if (type === 'success') logLine.style.color = '#2ecc71';
    logLine.textContent = `[${time}] ${message}`;
    logsDiv.appendChild(logLine);
    logsDiv.scrollTop = logsDiv.scrollHeight;
  };
  
  const btn = document.getElementById('runRagUtility');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> Running...';
  
  addLog(`Running: npm run ${command}`, 'info');
  
  try {
    const result = await window.electronAPI.runRagUtility(command);
    if (result.success) {
      if (result.output) {
        result.output.split('\n').forEach(line => {
          if (line.trim()) addLog(line, 'info');
        });
      }
      addLog(`✓ Command completed successfully`, 'success');
    } else {
      addLog(`✗ Command failed: ${result.error}`, 'error');
    }
  } catch (error) {
    addLog(`✗ Error: ${error.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">▶</span> Run Command';
  }
}
