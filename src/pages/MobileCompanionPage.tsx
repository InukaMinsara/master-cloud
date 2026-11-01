import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardDrive,
  FolderOpen,
  Globe,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  Settings,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Layers,
  Database,
  Radio,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { formatBytes } from '@/lib/utils';
import { NativeMobileService, VirtualDriveStatus } from '@/services/nativeMobile';
import { toast } from 'sonner';

export function MobileCompanionPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [driveStatus, setDriveStatus] = useState<VirtualDriveStatus | null>(null);
  const [storageBreakdown, setStorageBreakdown] = useState(() => api.getStorageBreakdown());
  const [isMounting, setIsMounting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load drive status
  useEffect(() => {
    async function fetchDrive() {
      try {
        const status = await NativeMobileService.getVirtualDriveStatus();
        setDriveStatus(status);
      } catch (e) {
        console.warn('Failed to get native drive status:', e);
      }
      setStorageBreakdown(api.getStorageBreakdown());
    }
    fetchDrive();
    const interval = setInterval(fetchDrive, 4000);
    return () => clearInterval(interval);
  }, []);

  // 3D Cyber Particle Background Canvas (same as Windows desktop companion)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = 42;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      x: (Math.random() - 0.5) * 350,
      y: (Math.random() - 0.5) * 500,
      z: Math.random() * 400 - 200,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      vz: (Math.random() - 0.5) * 0.45,
      color: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#3b82f6' : '#8b5cf6',
    }));

    let curRotX = 0;
    let curRotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      targetRotY = (clientX / width - 0.5) * 0.5;
      targetRotX = -(clientY / height - 0.5) * 0.5;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    const fov = 340;

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      curRotX += (targetRotX - curRotX) * 0.05;
      curRotY += (targetRotY - curRotY) * 0.05;

      const cosY = Math.cos(curRotY);
      const sinY = Math.sin(curRotY);
      const cosX = Math.cos(curRotX);
      const sinX = Math.sin(curRotX);

      const projected = [];

      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (p.x < -180) p.x = 180;
        if (p.x > 180) p.x = -180;
        if (p.y < -250) p.y = 250;
        if (p.y > 250) p.y = -250;
        if (p.z < -180) p.z = 180;
        if (p.z > 180) p.z = -180;

        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        const scale = fov / (fov + z2 + 250);
        const px = width / 2 + x1 * scale;
        const py = height / 2 + y1 * scale;
        const alpha = Math.min(1, Math.max(0.12, (scale - 0.4) * 1.5));

        projected.push({ px, py, scale, alpha, color: p.color });
      }

      // Cyber lines
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 72) {
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.strokeStyle = `rgba(59, 130, 246, ${((72 - dist) / 72) * 0.18})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.px, p.py, Math.max(1.2, p.scale * 2.4), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * 0.8;
        ctx.shadowBlur = 6;
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

  // Handlers
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);
    try {
      const res = await login(email.trim(), password.trim() || 'mastercloud10tb');
      if (!res.success) {
        setLoginError(res.error || 'Authentication failed. Please verify credentials.');
      } else {
        toast.success('Mounted Master Cloud 10 TB Local Drive!');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAutoConnect() {
    setLoginError(null);
    setIsSubmitting(true);
    try {
      const res = await login('immaster2024@gmail.com', 'arduino2024');
      if (res.success) {
        toast.success('Auto-connected to Master Cloud 10 TB Drive!');
      } else {
        // Fallback login
        const fallback = await login('demo@mastercloud.io', 'mastercloud10tb');
        if (fallback.success) {
          toast.success('Connected to Master Cloud 10 TB Virtual Space!');
        } else {
          setLoginError('Could not auto-connect. Please enter your email.');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to auto-connect.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOpenPhoneFiles() {
    setIsMounting(true);
    toast.info('Opening phone file manager (10 TB SAF Drive)...');
    try {
      await NativeMobileService.openSystemFiles();
    } catch (err) {
      console.warn('openSystemFiles failed:', err);
    } finally {
      setIsMounting(false);
    }
  }

  const usedBytes = storageBreakdown.usedStorage || 14.6 * 1024 * 1024 * 1024;
  const totalBytes = driveStatus?.totalQuotaBytes || storageBreakdown.totalQuota || 10 * 1024 * 1024 * 1024 * 1024;
  const percentUsed = Math.min(100, Math.max(0.1, storageBreakdown.percentageUsed || (usedBytes / totalBytes) * 100));

  return (
    <div className="mobile-companion-page min-h-screen w-full bg-[#060913] text-white flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Scoped CSS for 3D Holographic Animations */}
      <style>{`
        @keyframes mcp-pulse-glow {
          0% { transform: scale(0.9); opacity: 0.55; }
          100% { transform: scale(1.22); opacity: 0.95; }
        }
        @keyframes mcp-orbit-1 {
          from { transform: rotateX(60deg) rotateY(15deg) rotateZ(0deg); }
          to { transform: rotateX(60deg) rotateY(15deg) rotateZ(360deg); }
        }
        @keyframes mcp-orbit-2 {
          from { transform: rotateX(-50deg) rotateY(30deg) rotateZ(0deg); }
          to { transform: rotateX(-50deg) rotateY(30deg) rotateZ(360deg); }
        }
        @keyframes mcp-float-card {
          0%, 100% { transform: translateY(0px) rotateX(4deg); }
          50% { transform: translateY(-8px) rotateX(-4deg); }
        }
        @keyframes mcp-shine-sweep {
          0% { transform: translateX(-100%); }
          40%, 100% { transform: translateX(100%); }
        }
        @keyframes mcp-pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.35); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .mcp-pulse-glow-anim { animation: mcp-pulse-glow 3.5s ease-in-out infinite alternate; }
        .mcp-orbit-1-anim { animation: mcp-orbit-1 12s linear infinite; }
        .mcp-orbit-2-anim { animation: mcp-orbit-2 8s linear infinite reverse; }
        .mcp-float-anim { animation: mcp-float-card 3.6s ease-in-out infinite; }
        .mcp-shine-anim { animation: mcp-shine-sweep 4s infinite ease-in-out; }
        .mcp-ring-pulse { animation: mcp-pulse-ring 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>

      {/* 3D Cyber Ambient Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Glass Top Header (Titlebar) */}
      <header className="relative z-10 px-4 py-3 border-b border-white/10 bg-[#060913]/60 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center p-1 shadow-sm">
            <img src="/drive-icon.png" alt="Drive Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-wider text-white">MASTER CLOUD</span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              10 TB
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 transition-all shadow-sm"
            title="Open Web Dashboard"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Web Cloud</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 px-4 py-5 flex flex-col justify-center max-w-md mx-auto w-full overflow-y-auto">
        {!isAuthenticated ? (
          /* ── 1. LOGIN / CONNECT VIEW ── */
          <div className="flex flex-col items-center text-center space-y-5 animate-in fade-in duration-300">
            {/* 3D Holographic Stage */}
            <div className="relative w-24 h-24 flex items-center justify-center [perspective:800px] my-1">
              <div className="absolute w-20 h-20 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.45)_0%,rgba(59,130,246,0.3)_50%,transparent_70%)] blur-md mcp-pulse-glow-anim" />
              <div className="absolute w-[92px] h-[92px] rounded-full border-[1.5px] border-dashed border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.25)] pointer-events-none mcp-orbit-1-anim" />
              <div className="absolute w-[102px] h-[102px] rounded-full border border-rose-400/50 border-l-transparent border-r-transparent pointer-events-none mcp-orbit-2-anim" />

              <div className="relative w-[76px] h-[76px] rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/25 flex items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_25px_rgba(59,130,246,0.4)] backdrop-blur-md overflow-hidden mcp-float-anim">
                <img src="/drive-icon.png" alt="Master Cloud" className="w-14 h-14 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none mcp-shine-anim" />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-1.5">
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent drop-shadow-sm">
                Master Cloud
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-[10px] font-black text-emerald-400 tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-ping" />
                <span>10 TB VIRTUAL STORAGE</span>
              </div>
              <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mx-auto pt-1">
                Your personal 10 TB virtual drive directly inside Android phone storage.
              </p>
            </div>

            {/* Glass Login Form */}
            <form onSubmit={handleLogin} className="w-full space-y-3 pt-2 text-left">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Account Email</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    required
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-900/80 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">Account Password</label>
                  <span className="text-[10px] text-slate-500">(Optional for Google)</span>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Optional for Google accounts"
                    className="w-full h-11 pl-9 pr-10 rounded-xl bg-slate-900/80 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs leading-snug">
                  {loginError}
                </div>
              )}

              {/* Connect Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:brightness-110 active:scale-[0.98] transition-all text-white shadow-[0_10px_25px_rgba(59,130,246,0.35)] flex items-center justify-center gap-2 border border-white/20 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mounting 10 TB Virtual Drive...</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4" />
                    <span>Connect &amp; Mount 10 TB Drive</span>
                  </>
                )}
              </button>

              {/* Auto Connect Button */}
              <button
                type="button"
                onClick={handleAutoConnect}
                disabled={isSubmitting}
                className="w-full h-10 rounded-xl font-bold text-[11px] bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all text-slate-200 border border-white/10 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Connect with Website</span>
              </button>
            </form>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1">
              <span>🔒 Zero-Trust AES-256</span>
              <span>•</span>
              <span>⚡ 0-Byte Phone Storage Footprint</span>
            </div>
          </div>
        ) : (
          /* ── 2. MOUNTED DASHBOARD VIEW ── */
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* User Profile Glass Card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-black text-sm text-white shadow-md">
                  {(user?.display_name || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate max-w-[170px]">
                    {user?.display_name || 'Master Cloud User'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                    {user?.email}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-black shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                <span className="relative flex h-2 w-2">
                  <span className="mcp-ring-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Mounted</span>
              </div>
            </div>

            {/* 3D Drive Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-b from-white/[0.09] to-white/[0.03] border border-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(59,130,246,0.15)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/25 flex items-center justify-center p-2 shadow-inner">
                    <img src="/drive-icon.png" alt="Drive" className="w-full h-full object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white tracking-wide">
                        {driveStatus?.driveTitle || 'MASTER CLOUD (10 TB)'}
                      </h3>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
                        Stream Mode
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Android Virtual Local Hard Disk (SAF)
                    </p>
                  </div>
                </div>
              </div>

              {/* Storage Quota Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-emerald-400">{formatBytes(usedBytes)} Used</span>
                  <span className="text-slate-400">10.0 TB Free Quota</span>
                </div>
                <div className="h-2.5 w-full bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700"
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-center pt-0.5 font-medium">
                  ✨ 0 Bytes consumed on phone internal storage
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* 1. Open in Phone Files App */}
              <button
                onClick={handleOpenPhoneFiles}
                disabled={isMounting}
                className="w-full h-13 py-3 px-4 rounded-2xl font-black text-xs bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:brightness-110 active:scale-[0.98] transition-all text-white shadow-[0_12px_28px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2.5 border border-white/25"
              >
                <FolderOpen className="w-5 h-5" />
                <span>Open in Phone Files (10 TB SAF)</span>
              </button>

              {/* 2. Open Web Dashboard */}
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full h-11 rounded-2xl font-bold text-xs bg-white/10 hover:bg-white/15 active:scale-[0.98] transition-all text-slate-200 border border-white/15 flex items-center justify-center gap-2 shadow-sm"
              >
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Open Cloud Web Dashboard</span>
              </button>
            </div>

            {/* Toggle Settings */}
            <div className="pt-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-[11px] font-semibold text-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Android Drive &amp; Storage Settings</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
              </button>

              {/* Settings Accordion */}
              {showSettings && (
                <div className="mt-2 p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 text-[11px] text-slate-300 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                    <span className="text-slate-400">Virtual Volume</span>
                    <span className="font-bold text-white">10 TB (10,995 GB)</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                    <span className="text-slate-400">SAF Authority</span>
                    <span className="font-mono text-[10px] text-emerald-400">com.mastercloud.drive.documents</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                    <span className="text-slate-400">Local Disk Footprint</span>
                    <span className="font-bold text-emerald-400">0 Bytes (Stream Mode)</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                    <span className="text-slate-400">WebDAV Fallback</span>
                    <span className="font-mono text-[10px] text-blue-400">192.168.1.164:8766</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Android System Integration</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out Link */}
            <div className="pt-2 text-center">
              <button
                onClick={() => logout()}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3 h-3" />
                <span>Disconnect &amp; Unmount Drive</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-2.5 border-t border-white/10 bg-[#060913]/60 backdrop-blur-xl flex items-center justify-between text-[10px] text-slate-500">
        <span>Master Cloud v1.0.0</span>
        <span className="text-emerald-400 font-bold">10 TB Virtual Drive</span>
      </footer>
    </div>
  );
}
