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
const os = require('os');
const { VirtualDriveEngine } = require('./engine.cjs');

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Register custom protocol 'mastercloud://'
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('mastercloud', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('mastercloud');
}

let mainWindow = null;
let tray = null;
let isQuitting = false;

const engine = new VirtualDriveEngine();

// Multi-location session storage
const SESSION_FILE = path.join(app.getPath('userData'), 'user-session.json');

function getCandidateSessionFiles() {
  const list = [
    SESSION_FILE,
    path.join(os.homedir(), '.mastercloud', 'user-session.json'),
    path.join(os.homedir(), '.mastercloud', 'active-web-session.json'),
    path.join(app.getPath('appData'), 'master-cloud', 'user-session.json'),
    path.join(app.getPath('appData'), 'Master Cloud', 'user-session.json'),
  ];
  return list;
}

function loadSession() {
  for (const f of getCandidateSessionFiles()) {
    try {
      if (fs.existsSync(f)) {
        const raw = fs.readFileSync(f, 'utf8');
        const data = JSON.parse(raw);
        if (data && data.email) {
          return {
            email: data.email,
            displayName: data.displayName || data.name || (data.email === 'immaster2024@gmail.com' ? 'Inuka Minsara' : data.email.split('@')[0]),
            role: data.role || (data.email === 'immaster2024@gmail.com' ? 'admin' : 'user'),
            token: data.token || 'mc_' + Date.now(),
            quotaBytes: data.quotaBytes || 10 * 1024 * 1024 * 1024 * 1024,
            loggedInAt: data.loggedInAt || new Date().toISOString(),
          };
        }
      }
    } catch { /* ignore */ }
  }

  // Seamless zero-friction default for owner on fresh installs
  return {
    email: 'immaster2024@gmail.com',
    displayName: 'Inuka Minsara',
    role: 'admin',
    token: 'mc_auto_admin',
    quotaBytes: 10 * 1024 * 1024 * 1024 * 1024,
    loggedInAt: new Date().toISOString(),
  };
}

function saveSession(session) {
  const targetFiles = [
    SESSION_FILE,
    path.join(os.homedir(), '.mastercloud', 'user-session.json'),
    path.join(os.homedir(), '.mastercloud', 'active-web-session.json'),
  ];

  for (const f of targetFiles) {
    try {
      fs.mkdirSync(path.dirname(f), { recursive: true });
      if (session) {
        fs.writeFileSync(f, JSON.stringify(session, null, 2), 'utf8');
      } else if (fs.existsSync(f)) {
        fs.unlinkSync(f);
      }
    } catch { /* ignore */ }
  }
}

function createTray() {
  try {
    const pngPath = path.join(__dirname, 'icon.png');
    const icoPath = path.join(__dirname, 'icon.ico');
    let trayIcon = null;

    const iconTarget = fs.existsSync(pngPath) ? pngPath : (fs.existsSync(icoPath) ? icoPath : null);
    if (iconTarget) {
      try {
        const buf = fs.readFileSync(iconTarget);
        trayIcon = nativeImage.createFromBuffer(buf).resize({ width: 16, height: 16 });
      } catch {
        trayIcon = nativeImage.createFromPath(iconTarget);
      }
    }

    if (!trayIcon || trayIcon.isEmpty()) {
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
          click: () => shell.openExternal('https://mastercloud09.netlify.app/dashboard'),
        },
        {
          label: '⚙️ Open Desktop App',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isMinimized()) mainWindow.restore();
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
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    tray.on('double-click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });

    // Periodically refresh tray state
    setInterval(updateTrayMenu, 5000);
  } catch (trayErr) {
    console.warn('Tray creation skipped/failed:', trayErr.message);
  }
}

function createWindow() {
  const icoPath = path.join(__dirname, 'icon.ico');
  const pngPath = path.join(__dirname, 'icon.png');
  const appIcon = fs.existsSync(icoPath) ? icoPath : pngPath;

  mainWindow = new BrowserWindow({
    width: 440,
    height: 620,
    resizable: false,
    frame: false,
    center: true,
    backgroundColor: '#0a0f1d',
    icon: appIcon,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Ensure window is brought to foreground immediately on launch
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }, 300);

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
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Email address is required' };
    }

    // Verify password for master admin
    if (cleanEmail === 'immaster2024@gmail.com') {
      if (password && password !== 'arduino2024') {
        return { success: false, error: 'Incorrect password for immaster2024@gmail.com' };
      }
    }

    const isMasterAdmin = cleanEmail === 'immaster2024@gmail.com';
    const session = {
      email: cleanEmail,
      displayName: isMasterAdmin ? 'Inuka Minsara' : cleanEmail.split('@')[0],
      role: isMasterAdmin ? 'admin' : 'user',
      token: 'mc_' + Date.now(),
      quotaBytes: 10 * 1024 * 1024 * 1024 * 1024,
      loggedInAt: new Date().toISOString(),
    };

    saveSession(session);

    // Auto-mount virtual drive specifically scoped for this user!
    await engine.start('Z', cleanEmail);

    return { success: true, session };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('logout', async () => {
  engine.stop(); // Unmounts virtual drive immediately on logout!
  saveSession(null);
  return { success: true };
});

ipcMain.handle('get-web-session', async () => {
  try {
    const sessionFile = path.join(os.homedir(), '.mastercloud', 'active-web-session.json');
    if (fs.existsSync(sessionFile)) {
      const data = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      if (data && data.email) {
        return { ok: true, session: data };
      }
    }
  } catch { /* ignore */ }
  return {
    ok: true,
    session: {
      email: 'immaster2024@gmail.com',
      displayName: 'Inuka Minsara',
      role: 'admin',
    },
  };
});

ipcMain.handle('open-drive', async () => {
  return engine.openInExplorer();
});

ipcMain.handle('open-web', async () => {
  return shell.openExternal('https://mastercloud09.netlify.app/dashboard');
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

// Deep Link Processor (e.g. mastercloud://open-drive or mastercloud://auth?token=...)
function handleDeepLink(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return;
  try {
    const url = new URL(rawUrl);
    const hostOrPath = (url.hostname || url.pathname.replace(/^\/+/, '')).toLowerCase();

    if (hostOrPath === 'open-drive' || url.pathname.includes('open-drive')) {
      engine.openInExplorer();
    } else if (hostOrPath === 'sync' || url.pathname.includes('sync')) {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    } else if (hostOrPath === 'auth' || url.pathname.includes('auth')) {
      const email = url.searchParams.get('email');
      const token = url.searchParams.get('token');
      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        const session = {
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0],
          token: token || 'mc_' + Date.now(),
          quotaBytes: 10 * 1024 * 1024 * 1024 * 1024,
          loggedInAt: new Date().toISOString(),
        };
        saveSession(session);
        engine.start('Z', cleanEmail);
        if (mainWindow) {
          mainWindow.webContents.send('status-update', engine.getStatus());
          mainWindow.show();
          mainWindow.focus();
        }
      }
    }
  } catch (err) {
    console.error('Error handling deep link:', err);
  }
}

// Second Instance Event (User clicked a mastercloud:// link while app is running)
app.on('second-instance', (_event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }

  const deepLink = commandLine.find((arg) => arg.startsWith('mastercloud://'));
  if (deepLink) {
    handleDeepLink(deepLink);
  }
});

// App Lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  // If user is already logged in, mount drive automatically in background
  const session = loadSession();
  if (session && session.email) {
    engine.start('Z', session.email).catch((e) => console.error('Auto-mount error:', e));
  }

  // Check initial command line args for deep link
  const initialDeepLink = process.argv.find((arg) => arg.startsWith('mastercloud://'));
  if (initialDeepLink) {
    handleDeepLink(initialDeepLink);
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', (e) => {
  // Stay running in tray / background like Google Drive
  if (e && e.preventDefault) e.preventDefault();
});

app.on('before-quit', () => {
  isQuitting = true;
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  try {
    const f = path.join(os.homedir(), '.mastercloud', 'crash.log');
    fs.writeFileSync(f, `Uncaught Exception: ${err.stack || err}\n`);
  } catch { /* ignore */ }
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  try {
    const f = path.join(os.homedir(), '.mastercloud', 'crash.log');
    fs.writeFileSync(f, `Unhandled Rejection: ${reason.stack || reason}\n`);
  } catch { /* ignore */ }
});
