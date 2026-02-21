const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ServiceManager = require('./services/ServiceManager');

let mainWindow;
let serviceManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'RAG Control Panel',
    backgroundColor: '#1e1e1e'
  });

  mainWindow.loadFile('renderer.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
  serviceManager = new ServiceManager(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      setupIpcHandlers();
      serviceManager = new ServiceManager(mainWindow);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    serviceManager.stopAll();
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serviceManager) {
    serviceManager.stopAll();
  }
});

function setupIpcHandlers() {
  ipcMain.handle('service:start', async (event, serviceName) => {
    serviceManager.addLog(serviceName, `[MAIN] IPC handler: service:start for ${serviceName}`, 'info');
    serviceManager.addLog(serviceName, `[MAIN] Calling serviceManager.start('${serviceName}')`, 'info');
    
    try {
      const result = await serviceManager.start(serviceName);
      serviceManager.addLog(serviceName, `[MAIN] serviceManager.start returned: ${JSON.stringify(result)}`, 'info');
      return result;
    } catch (error) {
      serviceManager.addLog(serviceName, `[MAIN ERROR] serviceManager.start failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('service:stop', async (event, serviceName) => {
    serviceManager.addLog(serviceName, `[MAIN] IPC handler: service:stop for ${serviceName}`, 'info');
    
    try {
      const result = await serviceManager.stop(serviceName);
      serviceManager.addLog(serviceName, `[MAIN] serviceManager.stop returned: ${JSON.stringify(result)}`, 'info');
      return result;
    } catch (error) {
      serviceManager.addLog(serviceName, `[MAIN ERROR] serviceManager.stop failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('service:forceStop', async (event, serviceName) => {
    serviceManager.addLog(serviceName, `[MAIN] IPC handler: service:forceStop for ${serviceName}`, 'info');
    
    try {
      const result = await serviceManager.forceStop(serviceName);
      serviceManager.addLog(serviceName, `[MAIN] serviceManager.forceStop returned: ${JSON.stringify(result)}`, 'info');
      return result;
    } catch (error) {
      serviceManager.addLog(serviceName, `[MAIN ERROR] serviceManager.forceStop failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('service:status', async (event, serviceName) => {
    return serviceManager.getStatus(serviceName);
  });

  ipcMain.handle('service:statusAll', async () => {
    return serviceManager.getAllStatus();
  });

  ipcMain.handle('service:clearLogs', async (event, serviceName) => {
    return serviceManager.clearLogs(serviceName);
  });

  ipcMain.handle('service:checkPort', async (event, serviceName) => {
    return await serviceManager.checkPort(serviceName);
  });

  ipcMain.handle('service:cleanupPort', async (event, port) => {
    return await serviceManager.killProcessOnPort(port);
  });

  ipcMain.handle('settings:get', async () => {
    return getSettings();
  });

  ipcMain.handle('settings:save', async (event, settings) => {
    return saveSettings(settings);
  });

  ipcMain.handle('settings:reset', async () => {
    return resetSettings();
  });

  ipcMain.handle('settings:browseFolder', async () => {
    return await browseFolder();
  });

  ipcMain.handle('rag:utility', async (event, command) => {
    return await runRagUtility(command);
  });
}

async function browseFolder() {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Knowledge Base Folder',
      defaultPath: path.join(__dirname, '..')
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false };
    }
    
    const selectedPath = result.filePaths[0];
    const relativePath = path.relative(path.join(__dirname, 'rag'), selectedPath);
    
    return { success: true, path: relativePath };
  } catch (error) {
    console.error('Error browsing folder:', error);
    return { success: false, error: error.message };
  }
}

async function runRagUtility(command) {
  return new Promise((resolve) => {
    const ragPath = path.join(__dirname, 'rag');
    const proc = spawn('npm', ['run', command], {
      cwd: ragPath,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: output + errorOutput });
      } else {
        resolve({ success: false, error: `Exit code ${code}`, output: output + errorOutput });
      }
    });

    proc.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
  });
}

function getSettings() {
  try {
    const envPath = path.join(__dirname, 'rag', '.env');
    if (!fs.existsSync(envPath)) {
      return getDefaultSettings();
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const settings = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) {
        settings[match[1]] = match[2];
      }
    });
    return settings;
  } catch (error) {
    console.error('Error reading settings:', error);
    return getDefaultSettings();
  }
}

function saveSettings(settings) {
  try {
    const envPath = path.join(__dirname, 'rag', '.env');
    let envContent = '';
    envContent += '# ========================================\n';
    envContent += '# Senior Dev Mind — RAG Configuration\n';
    envContent += '# ========================================\n\n';
    envContent += '# --- Qdrant ---\n';
    envContent += `QDRANT_URL=${settings.QDRANT_URL || ''}\n`;
    envContent += `QDRANT_API_KEY=${settings.QDRANT_API_KEY || ''}\n`;
    envContent += `QDRANT_COLLECTION=${settings.QDRANT_COLLECTION || 'senior_dev_mind'}\n`;
    envContent += `VECTOR_SIZE=768\n\n`;
    envContent += '# --- Embedding Provider ---\n';
    envContent += `EMBEDDING_PROVIDER=${settings.EMBEDDING_PROVIDER || 'ollama'}\n`;
    envContent += `GEMINI_API_KEY=${settings.GEMINI_API_KEY || ''}\n\n`;
    envContent += '# --- HuggingFace (Free Semantic Embeddings) ---\n';
    envContent += `HUGGINGFACE_API_KEY=${settings.HUGGINGFACE_API_KEY || 'hf_free'}\n`;
    envContent += `HUGGINGFACE_MODEL=sentence-transformers/all-MiniLM-L6-v2\n\n`;
    envContent += '# --- Ollama (Local) ---\n';
    envContent += `OLLAMA_URL=${settings.OLLAMA_URL || 'http://localhost:11434'}\n`;
    envContent += `OLLAMA_EMBED_MODEL=${settings.OLLAMA_EMBED_MODEL || 'nomic-embed-text'}\n\n`;
    envContent += '# --- Groq (Cloud Fallback) ---\n';
    envContent += `GROQ_API_KEY=${settings.GROQ_API_KEY || ''}\n\n`;
    envContent += '# --- Knowledge Base Source ---\n';
    envContent += `KNOWLEDGE_BASE_PATH=${settings.KNOWLEDGE_BASE_PATH || '../.agent'}\n\n`;
    envContent += '# --- Server ---\n';
    envContent += `RAG_SERVER_PORT=${settings.RAG_SERVER_PORT || '6444'}\n`;
    fs.writeFileSync(envPath, envContent, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error: error.message };
  }
}

function resetSettings() {
  try {
    const settings = getDefaultSettings();
    return saveSettings(settings);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getDefaultSettings() {
  return {
    QDRANT_URL: 'http://localhost:6333',
    QDRANT_API_KEY: '',
    QDRANT_COLLECTION: 'senior_dev_mind',
    EMBEDDING_PROVIDER: 'ollama',
    GEMINI_API_KEY: '',
    HUGGINGFACE_API_KEY: 'hf_free',
    OLLAMA_URL: 'http://localhost:11434',
    OLLAMA_EMBED_MODEL: 'nomic-embed-text',
    GROQ_API_KEY: '',
    KNOWLEDGE_BASE_PATH: '../.agent',
    RAG_SERVER_PORT: '6444'
  };
}
