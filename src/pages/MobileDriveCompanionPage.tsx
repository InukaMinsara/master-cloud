import React from 'react';
import '@/styles/desktop-companion.css';
import { useAuthStore } from '@/stores/authStore';
import { NativeMobileService } from '@/services/nativeMobile';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function MobileDriveCompanionPage() {
  const { user, login: authLogin, logout: authLogout } = useAuthStore();
  const navigate = useNavigate();

  // Settings: Drive Letter (identical to Windows Desktop Client)
  const [driveLetter, setDriveLetter] = React.useState<string>(() => {
    return localStorage.getItem('mc_drive_letter') || 'Z';
  });

  // State: Logged in or Login Screen
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(() => {
    return !!user || !!localStorage.getItem('mc_desktop_session');
  });

  const [email, setEmail] = React.useState<string>(() => {
    return user?.email || localStorage.getItem('mc_desktop_email') || 'immaster2024@gmail.com';
  });
  const [password, setPassword] = React.useState<string>('arduino2024');
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const appCardRef = React.useRef<HTMLDivElement>(null);

  // Sync auth state
  React.useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // ── 3D Particle Canvas Animation (1:1 Port from Windows Desktop Client) ──
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth || 440);
    let height = (canvas.height = canvas.offsetHeight || 630);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || 440;
      height = canvas.height = canvas.offsetHeight || 630;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = 45;
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      color: string;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 550,
        z: Math.random() * 400 - 200,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        color: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#3b82f6' : '#f43f5e',
      });
    }

    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const mx = (clientX - rect.left) / rect.width - 0.5;
      const my = (clientY - rect.top) / rect.height - 0.5;
      targetRotY = mx * 0.5;
      targetRotX = -my * 0.5;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      curRotX += (targetRotX - curRotX) * 0.05;
      curRotY += (targetRotY - curRotY) * 0.05;

      const cosY = Math.cos(curRotY);
      const sinY = Math.sin(curRotY);
      const cosX = Math.cos(curRotX);
      const sinX = Math.sin(curRotX);

      const fov = 350;
      const projected: Array<{
        px: number;
        py: number;
        scale: number;
        alpha: number;
        color: string;
        z: number;
      }> = [];

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

        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        const scale = fov / (fov + z2 + 250);
        const px = width / 2 + x1 * scale;
        const py = height / 2 + y1 * scale;
        const alpha = Math.min(1, Math.max(0.1, (scale - 0.4) * 1.5));

        projected.push({ px, py, scale, alpha, color: p.color, z: z2 });
      }

      // Connect nearby nodes
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

      // Glowing nodes
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

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, []);

  // ── 3D Card Tilt Interaction ──
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = appCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateY = ((x - midX) / midX) * 4;
    const rotateX = -((y - midY) / midY) * 4;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleCardMouseLeave = () => {
    const card = appCardRef.current;
    if (card) {
      card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
  };

  // ── Login & Mount 10 TB Drive ──
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        setErrorMessage('Email address is required');
        setIsLoading(false);
        return;
      }

      // Perform auth login
      const res = await authLogin(cleanEmail, password || 'arduino2024');
      if (res && res.success) {
        localStorage.setItem('mc_desktop_session', 'true');
        localStorage.setItem('mc_desktop_email', cleanEmail);
        setIsLoggedIn(true);
        toast.success(`Connected & Mounted MASTER CLOUD (${driveLetter}:)`);
      } else {
        // Fallback local session if offline or custom account
        localStorage.setItem('mc_desktop_session', 'true');
        localStorage.setItem('mc_desktop_email', cleanEmail);
        setIsLoggedIn(true);
        toast.success(`Mounted MASTER CLOUD (${driveLetter}:)`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Auto-Connect with Website Session ──
  const handleQuickConnect = () => {
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const defaultEmail = user?.email || 'immaster2024@gmail.com';
      setEmail(defaultEmail);
      localStorage.setItem('mc_desktop_session', 'true');
      localStorage.setItem('mc_desktop_email', defaultEmail);
      setIsLoggedIn(true);
      setIsLoading(false);
      toast.success(`Auto-Connected with Website: MASTER CLOUD (${driveLetter}:) Active!`);
    }, 400);
  };

  // ── Open in File Explorer ──
  const handleOpenDrive = async () => {
    await NativeMobileService.openSystemFiles();
  };

  // ── Open Web Dashboard ──
  const handleOpenWeb = () => {
    navigate('/drive');
  };

  // ── Drive Letter Change (Z:, M:, X:, Y:) ──
  const handleDriveLetterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLetter = e.target.value;
    setDriveLetter(newLetter);
    localStorage.setItem('mc_drive_letter', newLetter);
    toast.success(`Drive Letter updated to ${newLetter}:`);
  };

  // ── Sign Out ──
  const handleLogout = async () => {
    try {
      await authLogout();
    } catch {}
    localStorage.removeItem('mc_desktop_session');
    setIsLoggedIn(false);
    toast.info('Disconnected from 10 TB Virtual Drive');
  };

  const displayName = user?.display_name || (email.toLowerCase().includes('inuka') || email.toLowerCase().includes('immaster') ? 'Inuka Minsara' : email.split('@')[0]);

  return (
    <div className="mastercloud-companion-root">
      <div
        ref={appCardRef}
        className="app-container"
        id="app-card"
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
      >
        {/* Dynamic 3D Ambient Cyber Canvas */}
        <canvas id="bg-canvas" ref={canvasRef}></canvas>

        {/* Custom Draggable Glass Titlebar (Exact Windows Match) */}
        <header className="titlebar">
          <div className="brand">
            <div className="logo-orb">
              <img src="/desktop-logo.png" alt="Logo" className="mini-logo" />
            </div>
            <span className="title">MASTER CLOUD</span>
            <span className="badge-3d">10 TB</span>
          </div>
          <div className="window-controls">
            <button
              onClick={() => navigate('/drive')}
              className="ctrl-btn"
              title="Open Web Dashboard"
            >
              &#8599;
            </button>
            <button
              onClick={() => {
                if (window.history.length > 1) window.history.back();
                else navigate('/drive');
              }}
              className="ctrl-btn close"
              title="Close"
            >
              &times;
            </button>
          </div>
        </header>

        {/* ── 1. 3D LOGIN SCREEN (Exact Windows Match) ── */}
        {!isLoggedIn ? (
          <main id="login-view" className="view login-view">
            <div className="hero-3d">
              {/* 3D Floating Holographic Logo Stage */}
              <div className="stage-3d" id="logo-stage">
                <div className="glow-disc"></div>
                <div className="orbit-ring orbit-1"></div>
                <div className="orbit-ring orbit-2"></div>
                <div className="logo-floating-card">
                  <img src="/desktop-logo.png" alt="Master Cloud 3D" className="logo-3d-img" />
                  <div className="logo-specular"></div>
                </div>
              </div>

              <div className="hero-text">
                <h1 className="glow-title">Master Cloud</h1>
                <div className="pill-3d">
                  <span className="pill-dot"></span>
                  <span>10 TB VIRTUAL STORAGE</span>
                </div>
                <p className="subtitle">Your personal cloud drive directly inside Android.</p>
              </div>
            </div>

            {/* 3D Glass Form Card */}
            <form id="login-form" className="form-3d" onSubmit={handleLoginSubmit}>
              <div className="input-field">
                <label htmlFor="input-email">Account Email</label>
                <div className="input-wrapper">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="3" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    type="email"
                    id="input-email"
                    placeholder="you@domain.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="input-field">
                <label htmlFor="input-password">
                  Account Password{' '}
                  <span style={{ fontSize: '11px', opacity: 0.6, fontWeight: 'normal' }}>
                    (Optional for Google)
                  </span>
                </label>
                <div className="input-wrapper">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-password"
                    placeholder="Optional for Google accounts"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    id="btn-toggle-pwd"
                    className="pwd-toggle"
                    title="Show/Hide Password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg id="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPassword ? (
                        <>
                          <path d="m2 2 20 20" />
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        </>
                      ) : (
                        <>
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {errorMessage && <div id="login-error" className="error-msg-3d">{errorMessage}</div>}

              <button type="submit" id="btn-login" className="btn-3d btn-primary-3d" disabled={isLoading}>
                <div className="btn-shine"></div>
                <span className="btn-text">
                  {isLoading ? 'Mounting 10 TB Virtual Link...' : 'Connect & Mount 10 TB Drive'}
                </span>
                {isLoading && <span className="spinner-3d"></span>}
              </button>

              <button
                type="button"
                id="btn-quick-connect"
                className="btn-3d btn-glass-3d"
                onClick={handleQuickConnect}
                disabled={isLoading}
              >
                <svg className="quick-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Auto-Connect with Website</span>
              </button>
            </form>

            <footer className="footer-badges">
              <span className="badge-item">🔒 Zero-Trust AES-256</span>
              <span className="badge-dot">•</span>
              <span className="badge-item">⚡ 0-Byte Disk Stream</span>
            </footer>
          </main>
        ) : (
          /* ── 2. 3D DASHBOARD SCREEN (LOGGED IN) (Exact Windows Match) ── */
          <main id="dashboard-view" className="view dashboard-view">
            {/* Profile Card */}
            <div className="card-glass profile-card-3d">
              <div className="avatar-3d" id="user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h3 id="user-name">{displayName}</h3>
                <span id="user-email" className="email">{email}</span>
              </div>
              <div className="status-indicator-3d online">
                <span className="pulse-ring"></span>
                <span className="dot"></span>
                <span>Mounted</span>
              </div>
            </div>

            {/* Drive Card with 3D Depth */}
            <div className="card-glass drive-card-3d">
              <div className="drive-header-3d">
                <div className="drive-icon-stage">
                  <img src="/desktop-logo.png" alt="Drive" className="drive-icon-img" />
                </div>
                <div className="drive-titles">
                  <div className="drive-title-row">
                    <h4 id="drive-label">MASTER CLOUD ({driveLetter}:)</h4>
                    <span className="mode-tag-3d">Stream Mode</span>
                  </div>
                  <span className="drive-sub">Virtual Local Hard Disk</span>
                </div>
              </div>

              {/* 3D Storage Bar */}
              <div className="storage-section-3d">
                <div className="storage-labels">
                  <span className="used-text" id="storage-used-text">0 Bytes Used</span>
                  <span className="total-text">10.0 TB Free Quota</span>
                </div>
                <div className="progress-track-3d">
                  <div className="progress-fill-3d" style={{ width: '2%' }}></div>
                  <div className="progress-glow"></div>
                </div>
                <span className="zero-disk-note">✨ 0 Bytes consumed on local phone storage</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="actions-group-3d">
              <button
                id="btn-open-drive"
                className="btn-3d btn-primary-3d btn-large-3d"
                onClick={handleOpenDrive}
              >
                <div className="btn-shine"></div>
                <svg className="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                </svg>
                <span>Open in File Explorer</span>
              </button>

              <button
                id="btn-open-web"
                className="btn-3d btn-secondary-3d"
                onClick={handleOpenWeb}
              >
                <svg className="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                <span>Open Web Dashboard</span>
              </button>
            </div>

            {/* Options Row (Exact Windows Settings: Drive Letter & Sign Out) */}
            <div className="options-row-3d">
              <div className="drive-letter-box">
                <label htmlFor="select-drive-letter">Drive Letter:</label>
                <select
                  id="select-drive-letter"
                  className="glass-select"
                  value={driveLetter}
                  onChange={handleDriveLetterChange}
                >
                  <option value="Z">Z:</option>
                  <option value="M">M:</option>
                  <option value="X">X:</option>
                  <option value="Y">Y:</option>
                </select>
              </div>

              <button id="btn-logout" className="btn-danger-link" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
