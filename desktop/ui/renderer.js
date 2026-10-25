/**
 * desktop/ui/renderer.js
 * ─────────────────────────────────────────────────────────────
 * Master Cloud Desktop - 3D Cyber UI Engine & IPC Controller
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

// DOM Elements
const appCard = document.getElementById('app-card');
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const inputEmail = document.getElementById('input-email');
const inputPassword = document.getElementById('input-password');
const btnLogin = document.getElementById('btn-login');
const btnQuickConnect = document.getElementById('btn-quick-connect');
const loginError = document.getElementById('login-error');
const btnTogglePwd = document.getElementById('btn-toggle-pwd');
const eyeIcon = document.getElementById('eye-icon');

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

// ── 3D Cyber Canvas Background ──────────────────────────────────────────────
function init3DCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.offsetWidth || 440);
  let height = (canvas.height = canvas.offsetHeight || 630);

  window.addEventListener('resize', () => {
    width = canvas.width = canvas.offsetWidth || 440;
    height = canvas.height = canvas.offsetHeight || 630;
  });

  // Generate 45 3D particles in virtual cube
  const particleCount = 45;
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 550,
      z: Math.random() * 400 - 200,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      vz: (Math.random() - 0.5) * 0.4,
      color: i % 3 === 0 ? '#10b981' : (i % 3 === 1 ? '#3b82f6' : '#f43f5e'),
    });
  }

  let mouseX = 0;
  let mouseY = 0;
  let targetRotX = 0;
  let targetRotY = 0;
  let curRotX = 0;
  let curRotY = 0;

  document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width - 0.5;
    const my = (e.clientY - rect.top) / rect.height - 0.5;
    targetRotY = mx * 0.5;
    targetRotX = -my * 0.5;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Smooth camera inertia
    curRotX += (targetRotX - curRotX) * 0.05;
    curRotY += (targetRotY - curRotY) * 0.05;

    const cosY = Math.cos(curRotY);
    const sinY = Math.sin(curRotY);
    const cosX = Math.cos(curRotX);
    const sinX = Math.sin(curRotX);

    const fov = 350;
    const projected = [];

    // Transform and project particles
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      if (p.x < -200) p.x = 200;
      if (p.x > 200) p.x = -200;
      if (p.y < -280) p.y = 280;
      if (p.y > 280) p.y = -280;
      if (p.z < -200) p.z = 200;
      if (p.z > 200) p.z = -200;

      // Rotate Y
      const x1 = p.x * cosY - p.z * sinY;
      const z1 = p.z * cosY + p.x * sinY;

      // Rotate X
      const y1 = p.y * cosX - z1 * sinX;
      const z2 = z1 * cosX + p.y * sinX;

      const scale = fov / (fov + z2 + 250);
      const px = width / 2 + x1 * scale;
      const py = height / 2 + y1 * scale;
      const alpha = Math.min(1, Math.max(0.1, (scale - 0.4) * 1.5));

      projected.push({ px, py, scale, alpha, color: p.color, z: z2 });
    }

    // Connect nearby nodes with 3D cyber lines
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const p1 = projected[i];
        const p2 = projected[j];
        const dx = p1.px - p2.px;
        const dy = p1.py - p2.py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 75) {
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.strokeStyle = `rgba(59, 130, 246, ${((75 - dist) / 75) * 0.15})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Draw glowing nodes
    for (const p of projected) {
      ctx.beginPath();
      ctx.arc(p.px, p.py, Math.max(1, p.scale * 2.5), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * 0.75;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(render);
  }

  render();
}

// ── 3D Card Tilt Interaction ────────────────────────────────────────────────
function init3DCardTilt() {
  if (!appCard) return;

  appCard.addEventListener('mousemove', (e) => {
    const rect = appCard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateY = ((x - midX) / midX) * 4;
    const rotateX = -((y - midY) / midY) * 4;

    appCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  appCard.addEventListener('mouseleave', () => {
    appCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });
}

// ── Password Visibility Toggle ──────────────────────────────────────────────
if (btnTogglePwd && inputPassword) {
  btnTogglePwd.addEventListener('click', () => {
    const isPwd = inputPassword.type === 'password';
    inputPassword.type = isPwd ? 'text' : 'password';
    if (eyeIcon) {
      eyeIcon.innerHTML = isPwd
        ? '<path d="m2 2 20 20"/><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>'
        : '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
    }
  });
}

// ── State Switching ─────────────────────────────────────────────────────────
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

// ── Login Handler ───────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');

  const spinner = btnLogin.querySelector('.spinner-3d');
  const btnText = btnLogin.querySelector('.btn-text');

  btnLogin.disabled = true;
  if (spinner) spinner.classList.remove('hidden');
  if (btnText) btnText.textContent = 'Mounting 10 TB Virtual Link...';

  const email = inputEmail.value.trim();
  const password = inputPassword.value.trim() || 'mastercloud10tb';

  try {
    const res = await login({ email, password });
    if (res.success) {
      await refreshState();
    } else {
      loginError.textContent = res.error || 'Authentication failed. Please verify credentials.';
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    loginError.textContent = err.message || 'Connection error.';
    loginError.classList.remove('hidden');
  } finally {
    btnLogin.disabled = false;
    if (spinner) spinner.classList.add('hidden');
    if (btnText) btnText.textContent = 'Connect & Mount 10 TB Drive';
  }
});

// ── Quick Connect ───────────────────────────────────────────────────────────
btnQuickConnect.addEventListener('click', async () => {
  loginError.classList.add('hidden');
  try {
    btnQuickConnect.disabled = true;
    btnQuickConnect.querySelector('span').textContent = 'Connecting with website...';
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
      // Open Web app so user can sign in with Google or their email
      await window.masterCloudDesktop.openWeb();
      loginError.textContent = 'Opening Master Cloud website... Please sign in there, or enter your email above to mount Z: directly.';
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    loginError.textContent = 'Failed to connect with website session: ' + err.message;
    loginError.classList.remove('hidden');
  } finally {
    btnQuickConnect.disabled = false;
    btnQuickConnect.querySelector('span').textContent = 'Auto-Connect with Website';
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
    btnLogout.textContent = 'Disconnecting...';
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
    btnLogout.textContent = 'Sign Out';
  }
});

// Initialize on launch
init3DCanvas();
init3DCardTilt();
refreshState();
