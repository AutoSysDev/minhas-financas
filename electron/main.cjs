// Monely Finance - Electron main process (CommonJS: package.json tem "type": "module").
// Dev: carrega o Vite em :3001 (rode `npm run dev` antes).
// Prod: sobe o backend empacotado (monely-server.exe) e serve dist/index.html.
const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const BACKEND_PORT = Number(process.env.MONELY_BACKEND_PORT || 5000);
const isDev = !app.isPackaged;
let backendProc = null;
let mainWindow = null;

function backendHealth() {
  return new Promise((resolve) => {
    const req = http.get(
      { host: '127.0.0.1', port: BACKEND_PORT, path: '/health', timeout: 2000 },
      (res) => resolve(res.statusCode === 200),
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(tries = 40) {
  for (let i = 0; i < tries; i++) {
    if (await backendHealth()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function startBackend() {
  if (isDev) return; // em dev o `npm run dev` ja sobe o Flask
  const exeName = process.platform === 'win32' ? 'monely-server.exe' : 'monely-server';
  const exePath = path.join(process.resourcesPath, 'backend', exeName);
  if (!fs.existsSync(exePath)) {
    dialog.showErrorBox(
      'Backend ausente',
      `Não encontrei o backend em:\n${exePath}\nReinstale o aplicativo.`,
    );
    app.quit();
    return;
  }
  const userData = app.getPath('userData');
  try {
    fs.mkdirSync(userData, { recursive: true });
  } catch { /* noop */ }
  backendProc = spawn(exePath, [], {
    env: { ...process.env, MONELY_DATA_DIR: userData, MONELY_BACKEND_PORT: String(BACKEND_PORT) },
    stdio: 'ignore',
    windowsHide: true,
  });
  backendProc.on('error', (err) => {
    dialog.showErrorBox('Falha no backend', `Não foi possível iniciar o servidor local:\n${err.message}`);
    app.quit();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 864,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#0a0e13',
    title: 'Monely Finance',
    icon: isDev ? path.join(__dirname, 'icon.ico') : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3001/#/login');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/login' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  startBackend();
  if (!isDev) {
    const ok = await waitForBackend();
    if (!ok) {
      dialog.showErrorBox(
        'Backend indisponível',
        'O servidor local não respondeu em 20s. O app vai abrir mesmo assim — verifique a instalação.',
      );
    }
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProc) {
    try {
      backendProc.kill();
    } catch { /* noop */ }
    backendProc = null;
  }
});
