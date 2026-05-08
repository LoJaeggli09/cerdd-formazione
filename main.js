const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const { ipcMain, Notification } = electron;
const path = require('path');
const fs = require('fs');

// In produzione (exe) app.isPackaged è true; in dev è false
const isDev = !app.isPackaged && !process.argv.includes('--production');

// Necessario su Windows per far apparire l'app in primo piano (non come processo in background)
app.setAppUserModelId('com.monitorformazione.app');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const startUrl = isDev
    ? 'http://localhost:3003'
    : path.join(app.getAppPath(), 'build/index.html');

  if (isDev) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'build/index.html'));
  }

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const { protocol } = require('electron');

// Registra protocollo personalizzato per le risorse locali (rimosso per problemi di sicurezza)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
]);

app.on('ready', () => {
  // Protocollo app rimosso per compatibilità
  /*
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.substr(6); // Rimuovi 'app://'
    callback({ path: path.join(__dirname, url) });
  });
  */
  
  createWindow();
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Notifiche push desktop via IPC
ipcMain.on('show-notification', (_event, { title, body }) => {
  if (!Notification.isSupported()) return;
  const notif = new Notification({
    title: title || 'Monitor Formazione',
    body: body || '',
    ...(process.platform === 'win32' && { icon: path.join(__dirname, 'assets', 'icon.ico') }),
  });
  notif.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  notif.show();
});
