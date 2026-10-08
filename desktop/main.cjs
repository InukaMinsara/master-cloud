/**
 * desktop/main.cjs
 * ─────────────────────────────────────────────────────────────
 * Master Cloud Desktop - Main Electron Process
 * Manages frameless Companion Window, System Tray, and Virtual Drive Lifecycle.
 * ─────────────────────────────────────────────────────────────
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { VirtualDriveEngine } = require('./engine.cjs');

let mainWindow = null;
let tray = null;
let isQuitting = false;

const engine = new VirtualDriveEngine();

// Persistent user session storage in userData directory
const SESSION_FILE = path.join(app.getPath('userData'), 'user-session.json');

function loadSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    }
  } catch {
    // ignore
  }
  return null;
}

function saveSession(session) {
  try {
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
    if (session) {
      fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), 'utf8');
    } else if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  let trayIcon;
  try {
    if (fs.existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 });
    } else {
      trayIcon = nativeImage.createEmpty();
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('MASTER CLOUD (10 TB Virtual Drive)');

  const updateTrayMenu = () => {
    const status = engine.getStatus();
    const session = loadSession();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: `MASTER CLOUD — ${status.isMounted ? '🟢 Online (10 TB)' : '🟡 Connecting...'}`,
        enabled: false,
      },
      {
        label: session ? `👤 ${session.email}` : '👤 Not signed in',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: `📂 Open ${status.driveLetter} Drive`,
        click: () => engine.openInExplorer(),
      },
      {
        label: '🌐 Open Web Dashboard',
        click: () => shell.openExternal('http://localhost:5173/dashboard'),
      },
      {
        label: '⚙️ Open Desktop App',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: 'separator' },
      {
        label: '🚪 Exit Master Cloud',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
  };

  updateTrayMenu();
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Periodically refresh tray state
  setInterval(updateTrayMenu, 5000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 620,
    resizable: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// IPC Handlers
ipcMain.handle('get-status', async () => {
  const session = loadSession();
  const driveStatus = engine.getStatus();
  return {
    session,
    drive: driveStatus,
  };
});

ipcMain.handle('login', async (_event, { email, password }) => {
  try {
    // In production, verifies with Supabase or local token
    const cleanEmail = email.trim().toLowerCase();
    const session = {
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      token: 'mc_' + Date.now(),
      quotaBytes: 10 * 1024 * 1024 * 1024 * 1024,
      loggedInAt: new Date().toISOString(),
    };

    saveSession(session);

    // Auto-mount virtual drive
    await engine.start('Z');

    return { success: true, session };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('logout', async () => {
  saveSession(null);
  return { success: true };
});

ipcMain.handle('open-drive', async () => {
  return engine.openInExplorer();
});

ipcMain.handle('open-web', async () => {
  return shell.openExternal('http://localhost:5173/dashboard');
});

ipcMain.handle('set-drive-letter', async (_event, letter) => {
  engine.stop();
  const mounted = await engine.start(letter);
  return { success: mounted, driveLetter: letter };
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.hide();
});

// App Lifecycle
app.whenReady().then(async () => {
  createWindow();
  createTray();

  // If user is already logged in, mount drive automatically
  const session = loadSession();
  if (session) {
    await engine.start('Z');
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});
