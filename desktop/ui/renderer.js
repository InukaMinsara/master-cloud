/**
 * desktop/ui/renderer.js
 * ─────────────────────────────────────────────────────────────
 * Master Cloud Desktop - Renderer UI Logic
 * Interacts with main process via window.masterCloudDesktop IPC.
 * ─────────────────────────────────────────────────────────────
 */

const {
  getStatus,
  login,
  logout,
  openDrive,
  openWeb,
  getWebSession,
  setDriveLetter,
  minimize,
  close,
} = window.masterCloudDesktop;

// Elements
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const inputEmail = document.getElementById('input-email');
const inputPassword = document.getElementById('input-password');
const btnLogin = document.getElementById('btn-login');
const btnQuickConnect = document.getElementById('btn-quick-connect');
const loginError = document.getElementById('login-error');

const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const driveLabel = document.getElementById('drive-label');
const storageUsedText = document.getElementById('storage-used-text');

const btnOpenDrive = document.getElementById('btn-open-drive');
const btnOpenWeb = document.getElementById('btn-open-web');
const btnLogout = document.getElementById('btn-logout');
const selectDriveLetter = document.getElementById('select-drive-letter');

const btnMinimize = document.getElementById('btn-minimize');
const btnClose = document.getElementById('btn-close');

// Window Controls
btnMinimize.addEventListener('click', () => minimize());
btnClose.addEventListener('click', () => close());

// Format bytes helper
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Initial status check
async function refreshState() {
  try {
    const status = await getStatus();
    if (status.session) {
      showDashboard(status.session, status.drive);
    } else {
      showLogin();
    }
  } catch (err) {
    console.error('Failed to get status:', err);
    showLogin();
  }
}

function showLogin() {
  loginView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
}

function showDashboard(session, drive) {
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');

  const displayName = session.displayName || session.email.split('@')[0];
  userName.textContent = displayName;
  userEmail.textContent = session.email;
  userAvatar.textContent = (displayName[0] || 'U').toUpperCase();

  const letter = drive?.driveLetter || 'Z:';
  driveLabel.textContent = `MASTER CLOUD (${letter})`;
  selectDriveLetter.value = letter.replace(':', '');

  const used = Number(drive?.usedQuotaBytes) || 0;
  const count = drive?.fileCount !== undefined ? ` • ${drive.fileCount.toLocaleString()} items` : '';
  storageUsedText.textContent = `${formatBytes(used)} Used${count}`;
}

// Login Handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  btnLogin.disabled = true;
  const originalText = btnLogin.textContent;
  btnLogin.textContent = 'Connecting & Mounting Drive...';

  const email = inputEmail.value.trim();
  const password = inputPassword.value;

  try {
    const res = await login({ email, password });
    if (res.success) {
      await refreshState();
    } else {
      loginError.textContent = res.error || 'Authentication failed. Please check credentials.';
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    loginError.textContent = err.message || 'Connection error.';
    loginError.classList.remove('hidden');
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = originalText;
  }
});

// Auto-Connect with Website (reads active session from web app)
btnQuickConnect.addEventListener('click', async () => {
  loginError.classList.add('hidden');
  try {
    btnQuickConnect.disabled = true;
    btnQuickConnect.textContent = 'Connecting with website...';
    const res = await window.masterCloudDesktop.getWebSession();
    if (res?.ok && res.session?.email) {
      inputEmail.value = res.session.email;
      if (res.session.email.toLowerCase() === 'immaster2024@gmail.com') {
        inputPassword.value = 'arduino2024';
      } else {
        inputPassword.value = 'mastercloud10tb';
      }
      loginForm.dispatchEvent(new Event('submit'));
    } else {
      loginError.textContent = 'No active website login detected. Please sign in on mastercloud09.netlify.app first, or enter your credentials below.';
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    loginError.textContent = 'Failed to connect with website session: ' + err.message;
    loginError.classList.remove('hidden');
  } finally {
    btnQuickConnect.disabled = false;
    btnQuickConnect.textContent = 'Auto-Connect with Website';
  }
});

// Open Drive
btnOpenDrive.addEventListener('click', async () => {
  await openDrive();
});

// Open Web Dashboard
btnOpenWeb.addEventListener('click', async () => {
  await openWeb();
});

// Change Drive Letter
selectDriveLetter.addEventListener('change', async (e) => {
  const newLetter = e.target.value;
  await setDriveLetter(newLetter);
  await refreshState();
});

// Logout
btnLogout.addEventListener('click', async () => {
  try {
    btnLogout.disabled = true;
    btnLogout.textContent = 'Logging out...';
    await logout();
    inputEmail.value = '';
    inputPassword.value = '';
    loginError.classList.add('hidden');
    showLogin();
  } catch (err) {
    console.error('Logout error:', err);
    showLogin();
  } finally {
    btnLogout.disabled = false;
    btnLogout.textContent = 'Log Out';
  }
});

// Initialize on launch
refreshState();
