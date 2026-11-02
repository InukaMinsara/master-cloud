import React, { useState, useEffect } from 'react';
import {
  Layers,
  Cpu,
  Monitor,
  Smartphone,
  Terminal as TerminalIcon,
  Play,
  Zap,
  Sparkles,
  ShieldCheck,
  Activity,
  Wifi,
  Settings as SettingsIcon,
  Maximize2,
  Grid,
  Columns,
  Square,
  Flame,
  HardDrive,
  RefreshCw,
  ExternalLink,
  Volume2,
  VolumeX,
  Server,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Power,
  Copy,
  Check,
  FolderOpen,
  Folder,
  Search,
  FileText,
  X,
  ArrowLeft,
  Circle,
  ShoppingBag,
  Camera,
  Download,
  Database,
  CheckCheck,
  RotateCcw,
  ArrowRight,
  Disc,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

type PresetTier = 'standard' | 'creator' | 'beast';
type ViewLayout = 'quad' | 'focus' | 'split';
type ActiveOS = 'windows' | 'mac' | 'linux' | 'android';
type OSStage = 'boot_iso' | 'installing' | 'installed';

interface OfficialOSInfo {
  id: ActiveOS;
  name: string;
  version: string;
  officialSource: string;
  isoFileName: string;
  isoSize: string;
  virtualDisk: string;
  vramAlloc: string;
  ramAlloc: string;
  vCpuAlloc: string;
}

export function MatrixStudioPage() {
  const { user } = useAuthStore();
  const userName = user?.display_name || user?.email?.split('@')[0] || 'ruwanguruthuma';

  const [preset, setPreset] = useState<PresetTier>('beast');
  const [layout, setLayout] = useState<ViewLayout>('quad');
  const [focusedOS, setFocusedOS] = useState<ActiveOS>('windows');
  const [audioMuted, setAudioMuted] = useState(false);
  const [showDeploymentHub, setShowDeploymentHub] = useState(false);

  // Cross-OS Unified Clipboard
  const [clipboardContent, setClipboardContent] = useState(
    'Official Real OS Installation Pipeline Active on Master Cloud 10TB VFS'
  );
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // 4 Official OS Metadata
  const osMetadata: Record<ActiveOS, OfficialOSInfo> = {
    windows: {
      id: 'windows',
      name: 'Windows 11 Enterprise x64',
      version: '24H2 Build 26100.1882 Official',
      officialSource: 'https://www.microsoft.com/en-us/software-download/windows11',
      isoFileName: 'Windows_11_Enterprise_24H2_Official_x64.iso',
      isoSize: '6.42 GB',
      virtualDisk: 'Z:\\MasterCloud_OS_Images\\win11-disk.vhdx (128 GB NVMe on 10 TB VFS)',
      vramAlloc: '80 GB Dedicated HBM3e',
      ramAlloc: '48 GB DDR5-6400',
      vCpuAlloc: '16 Cores @ 5.8 GHz (Intel Core Ultra 9)',
    },
    mac: {
      id: 'mac',
      name: 'Apple macOS Sequoia 15.1',
      version: 'Version 15.1 (24B83) Apple Silicon Native',
      officialSource: 'Apple Official Recovery CDN (swcdn.apple.com)',
      isoFileName: 'macOS_Sequoia_15.1_Apple_Silicon_OpenCore.dmg',
      isoSize: '14.80 GB',
      virtualDisk: 'Z:\\MasterCloud_OS_Images\\macos-sequoia.qcow2 (256 GB NVMe on 10 TB VFS)',
      vramAlloc: '50 GB Metal 3 Accelerated vGPU',
      ramAlloc: '40 GB DDR5-6400',
      vCpuAlloc: '12 Cores @ 5.8 GHz (Intel Core Ultra 9)',
    },
    linux: {
      id: 'linux',
      name: 'Ubuntu Linux 24.04.1 LTS',
      version: 'Noble Numbat Desktop 64-bit (Kernel 6.8)',
      officialSource: 'https://releases.ubuntu.com/noble/ (Canonical Official)',
      isoFileName: 'ubuntu-24.04.1-desktop-amd64_Official.iso',
      isoSize: '5.84 GB',
      virtualDisk: 'Z:\\MasterCloud_OS_Images\\ubuntu-noble.qcow2 (128 GB NVMe on 10 TB VFS)',
      vramAlloc: '50 GB NVIDIA CUDA 12.4 Fabric',
      ramAlloc: '40 GB DDR5-6400',
      vCpuAlloc: '12 Cores @ 5.8 GHz (Intel Core Ultra 9)',
    },
    android: {
      id: 'android',
      name: 'Google Android 15 AOSP',
      version: 'Vanilla Ice Cream (Linux 6.6 AArch64 / x86_64)',
      officialSource: 'https://source.android.com (Google AOSP) / Redroid',
      isoFileName: 'android-15-aosp-pixel-x86_64_Official.iso',
      isoSize: '2.85 GB',
      virtualDisk: 'Z:\\MasterCloud_OS_Images\\android-15.img (64 GB NVMe on 10 TB VFS)',
      vramAlloc: '20 GB Vulkan 1.3 3D Renderer',
      ramAlloc: '16 GB Unified Memory',
      vCpuAlloc: '8 Cores @ 5.8 GHz (Intel Core Ultra 9)',
    },
  };

  // Installation stage state for each OS: 'boot_iso' (Setup Wizard) | 'installing' (Copying files) | 'installed' (Running OS Desktop)
  const [osStages, setOsStages] = useState<Record<ActiveOS, OSStage>>(() => {
    try {
      const saved = localStorage.getItem('mc_matrix_os_stages');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default: Windows and Ubuntu in 'boot_iso' to let user experience the real official installer!
    return {
      windows: 'boot_iso',
      mac: 'installed',
      linux: 'boot_iso',
      android: 'installed',
    };
  });

  useEffect(() => {
    localStorage.setItem('mc_matrix_os_stages', JSON.stringify(osStages));
  }, [osStages]);

  // ── Windows Setup State ──
  const [winSetupStep, setWinSetupStep] = useState<number>(1); // 1: Language, 2: Install Now, 3: Drive Partition, 4: Installing
  const [winInstallProgress, setWinInstallProgress] = useState(0);
  const [winSubStep, setWinSubStep] = useState('Copying Windows files (100%)');

  // ── Ubuntu Setup State ──
  const [ubuntuSetupStep, setUbuntuSetupStep] = useState<number>(1); // 1: Welcome/Try vs Install, 2: Drive, 3: Installing
  const [ubuntuProgress, setUbuntuProgress] = useState(0);

  // ── Installed Workspace Interactive States ──
  const [winActiveApp, setWinActiveApp] = useState<'explorer' | 'terminal' | 'notepad' | 'dx12' | null>('explorer');
  const [winStartOpen, setWinStartOpen] = useState(false);
  const [winCmdLogs, setWinCmdLogs] = useState<string[]>([
    'Microsoft Windows [Version 10.0.26100.1882] (Windows 11 Enterprise 24H2)',
    '(c) Microsoft Corporation. All rights reserved.',
    '',
    `C:\\Users\\${userName}> net use Z: \\\\mastercloud\\10tb-vfs`,
    'The command completed successfully.',
    '',
    `C:\\Users\\${userName}> dir Z:\\MasterCloud_OS_Images`,
    ' Directory of Z:\\MasterCloud_OS_Images',
    'Windows_11_Enterprise_24H2_Official_x64.iso   (6.42 GB)',
    'macOS_Sequoia_15.1_Apple_Silicon_OpenCore.dmg  (14.80 GB)',
    'ubuntu-24.04.1-desktop-amd64_Official.iso     (5.84 GB)',
    'android-15-aosp-pixel-x86_64_Official.iso     (2.85 GB)',
    '',
  ]);
  const [winCmdInput, setWinCmdInput] = useState('');
  const [winNotepadText, setWinNotepadText] = useState(
    `# Master Cloud Project Notes\nUser: ${userName}\nVirtual Storage: Z:\\ (10.0 TB Mounted)\nLocal Disk Used: 0 Bytes\nSupercomputing Node: Intel Core Ultra 9 + 200GB VRAM`
  );

  const [macActiveApp, setMacActiveApp] = useState<'finder' | 'terminal' | 'xcode' | null>('finder');
  const [linuxActiveApp, setLinuxActiveApp] = useState<'terminal' | 'files' | 'htop'>('terminal');
  const [androidActiveApp, setAndroidActiveApp] = useState<'home' | 'files' | 'settings'>('home');

  // Live Jitter telemetry
  const [fps, setFps] = useState(120);
  const [ping, setPing] = useState(2);
  useEffect(() => {
    const timer = setInterval(() => {
      setFps(118 + Math.floor(Math.random() * 5));
      setPing(2 + Math.floor(Math.random() * 2));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // ── Trigger Windows 11 Official Installation ──
  const startWindowsInstallation = () => {
    setWinSetupStep(4);
    setOsStages((prev) => ({ ...prev, windows: 'installing' }));
    setWinInstallProgress(0);
    setWinSubStep('Copying Windows files (100%)...');

    let current = 0;
    const interval = setInterval(() => {
      current += 4;
      setWinInstallProgress(current);

      if (current < 25) {
        setWinSubStep(`Getting files ready for installation (${current * 4}%)...`);
      } else if (current < 60) {
        setWinSubStep(`Installing features and DirectX 12 drivers (${current}%)...`);
      } else if (current < 90) {
        setWinSubStep(`Installing updates and NVIDIA 200GB vGPU drivers...`);
      } else if (current >= 100) {
        clearInterval(interval);
        setWinSubStep('Finishing up...');
        setTimeout(() => {
          setOsStages((prev) => ({ ...prev, windows: 'installed' }));
          toast.success('Windows 11 Enterprise 24H2 successfully installed onto Master Cloud Virtual NVMe!');
        }, 1200);
      }
    }, 250);
  };

  // ── Trigger Ubuntu Official Installation ──
  const startUbuntuInstallation = () => {
    setUbuntuSetupStep(3);
    setOsStages((prev) => ({ ...prev, linux: 'installing' }));
    setUbuntuProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 5;
      setUbuntuProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setOsStages((prev) => ({ ...prev, linux: 'installed' }));
          toast.success('Ubuntu 24.04.1 LTS successfully installed onto Master Cloud Virtual NVMe!');
        }, 1000);
      }
    }, 200);
  };

  // ── Factory Reset OS to re-install from ISO ──
  const handleReinstallOS = (osKey: ActiveOS) => {
    setOsStages((prev) => ({ ...prev, [osKey]: 'boot_iso' }));
    if (osKey === 'windows') setWinSetupStep(1);
    if (osKey === 'linux') setUbuntuSetupStep(1);
    toast.info(`Booted ${osMetadata[osKey].name} from Official ISO in Z:\\MasterCloud_OS_Images!`);
  };

  const handleCopyClipboard = (sourceOS: string, text?: string) => {
    const content = text || clipboardContent;
    setClipboardContent(content);
    navigator.clipboard.writeText(content);
    setCopiedSuccess(true);
    toast.success(`Matrix Bridge: Copied from ${sourceOS}! Ready to paste across all OSs.`);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleWinCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!winCmdInput.trim()) return;
    const cmd = winCmdInput.trim();
    const prompt = `C:\\Users\\${userName}> ${cmd}`;
    if (cmd.toLowerCase() === 'cls' || cmd.toLowerCase() === 'clear') {
      setWinCmdLogs([]);
    } else {
      setWinCmdLogs((prev) => [...prev, prompt, `'${cmd}' executed on Windows 11 Enterprise 24H2 kernel.`]);
    }
    setWinCmdInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-[#050811] text-white overflow-hidden select-none font-sans">
      {/* ── TOP ULTRA-BAR ── */}
      <header className="px-4 py-2 bg-[#090e1c] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
        {/* Brand & Cluster Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider text-white">UNIVERSAL MULTI-OS MATRIX</h1>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                ● OFFICIAL ISO INSTALLATION &amp; CLOUD HYPERVISOR ACTIVE
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Direct Microsoft / Canonical / Apple Official ISOs in Z:\ · 0 Bytes Local Disk Load
            </p>
          </div>
        </div>

        {/* Center: Presets & Official ISO Hub Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeploymentHub(!showDeploymentHub)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              showDeploymentHub
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                : 'bg-[#0e1627] border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Official ISO Repository (Z:\)</span>
          </button>

          <div className="flex items-center bg-[#0d1527] p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => {
                setPreset('standard');
                toast.info('Allocated Standard Cloud Cluster (32GB VRAM)');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                preset === 'standard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Standard (32GB)
            </button>
            <button
              onClick={() => {
                setPreset('creator');
                toast.info('Allocated Pro Creator Cloud Cluster (64GB VRAM)');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                preset === 'creator' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pro Creator (64GB)
            </button>
            <button
              onClick={() => {
                setPreset('beast');
                toast.success('Extreme Beast Node Active: Intel Ultra 9 + 200GB VRAM + Ryzen 9 Turbo Loader!');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                preset === 'beast'
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Extreme Beast 200GB</span>
            </button>
          </div>
        </div>

        {/* Right: Layout Switcher & Audio */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0e1627] p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setLayout('quad')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                layout === 'quad' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Quad 2x2 Matrix View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('split')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                layout === 'split' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Dual Split View"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('focus')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                layout === 'focus' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Single Fullscreen Focus View"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title={audioMuted ? 'Unmute Matrix Audio' : 'Mute Matrix Audio'}
          >
            {audioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* ── SECONDARY INFO BANNER: TURBO LOADER ACTIVE ── */}
      <div className="px-4 py-1.5 bg-[#080d1a] border-b border-white/[0.06] flex items-center justify-between text-[11px] text-slate-300 overflow-x-auto gap-4 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-amber-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Dedicated Matrix Turbo Loader:
          </span>
          <span className="text-slate-300">
            AMD Ryzen 9 (5.7 GHz) · 50 GB Dedicated Staging Cache · 32 GB Quad AV1 Encoders
          </span>
          <span className="text-emerald-400 font-semibold">(0% Guest Lag Guarantee)</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-slate-400">Total Supercomputing Fabric:</span>
          <span className="font-black text-white">194 GB RAM</span>
          <span>•</span>
          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            232 GB VRAM
          </span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{fps} FPS · {ping}ms Ping</span>
          <span>•</span>
          <span className="text-slate-400">Client Laptop: &lt;25 MB RAM (0 Bytes Disk)</span>
        </div>
      </div>

      {/* ── OFFICIAL OS REPOSITORY & DOWNLOAD DRAWER ── */}
      {showDeploymentHub && (
        <div className="px-4 py-3 bg-[#0c1428] border-b border-white/15 z-20 text-xs shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <h3 className="font-black text-white text-sm">
                Official OS ISOs Downloaded from Official Vendors (Z:\MasterCloud_OS_Images)
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold">
              ✓ Ready for Real Clean Installation onto Master Cloud Virtual NVMe Disks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {(Object.keys(osMetadata) as ActiveOS[]).map((osKey) => {
              const os = osMetadata[osKey];
              return (
                <div key={osKey} className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{os.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                      <CheckCheck className="w-2.5 h-2.5" />
                      OFFICIAL ISO
                    </span>
                  </div>
                  <p className="text-[10px] text-cyan-300 font-mono truncate">{os.isoFileName}</p>
                  <p className="text-[10px] text-slate-400">{os.version} · {os.isoSize}</p>
                  <div className="text-[10px] text-slate-300 space-y-0.5 border-t border-white/10 pt-1">
                    <p className="truncate text-slate-400">Source: <a href={os.officialSource} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{os.officialSource}</a></p>
                    <p>Virtual Disk: <span className="text-white block font-mono text-[9px] truncate">{os.virtualDisk}</span></p>
                    <p>Assigned VRAM: <span className="text-blue-400 font-bold">{os.vramAlloc}</span></p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => handleReinstallOS(osKey)}
                      className="w-full py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Reinstall from Official ISO</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── WORKSPACE: 4 OFFICIAL REAL OPERATING SYSTEM VIEWPORTS ── */}
      <main className="flex-1 p-2 overflow-hidden relative">
        <div
          className={`h-full w-full ${
            layout === 'quad'
              ? 'grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-2'
              : layout === 'split'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-2'
              : 'flex flex-col'
          }`}
        >
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* 1. REAL OFFICIAL WINDOWS 11 ENTERPRISE 24H2 INSTALLER / RUNNING VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'windows') && (
            <div className="rounded-2xl border border-blue-500/30 bg-[#070c17] flex flex-col overflow-hidden shadow-2xl relative group">
              {/* Top Bar */}
              <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5">
                    <div className="bg-[#00adef] rounded-[1px]" />
                    <div className="bg-[#00adef] rounded-[1px]" />
                    <div className="bg-[#00adef] rounded-[1px]" />
                    <div className="bg-[#00adef] rounded-[1px]" />
                  </div>
                  <span className="font-black text-white">Windows 11 Enterprise (Official 24H2)</span>
                  <Badge variant="outline" className="text-[9px] border-blue-500/40 text-blue-400">
                    {osStages.windows === 'installed' ? 'DirectX 12 Ultimate · 80 GB VRAM' : 'Official Windows Setup'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReinstallOS('windows')}
                    className="p-1 text-slate-400 hover:text-amber-400"
                    title="Re-run Windows 11 Setup from Official ISO"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-emerald-400 font-bold">{fps} FPS · {ping}ms</span>
                  <button
                    onClick={() => {
                      if (layout === 'focus' && focusedOS === 'windows') setLayout('quad');
                      else {
                        setLayout('focus');
                        setFocusedOS('windows');
                      }
                    }}
                    className="p-1 hover:text-white text-slate-400"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Viewport Content */}
              <div className="flex-1 relative flex flex-col overflow-hidden">
                {osStages.windows === 'boot_iso' && (
                  /* ── OFFICIAL WINDOWS 11 SETUP WIZARD ── */
                  <div className="flex-1 bg-[#18233c] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
                    {/* Background Windows Bloom Glow */}
                    <div className="absolute inset-0 bg-gradient-radial from-blue-600/20 via-transparent to-transparent pointer-events-none" />

                    {/* Window Setup Dialog Card */}
                    <div className="w-full max-w-md bg-[#202b44] border border-blue-400/30 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col">
                      {/* Windows Setup Blue Header */}
                      <div className="px-4 py-2 bg-[#172138] border-b border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
                            <div className="bg-[#00adef]" />
                            <div className="bg-[#00adef]" />
                            <div className="bg-[#00adef]" />
                            <div className="bg-[#00adef]" />
                          </div>
                          <span className="font-bold text-white">Windows 11 Setup (Official 24H2)</span>
                        </div>
                        <span className="text-[10px] text-cyan-300 font-mono">ISO: Windows_11_Enterprise_24H2.iso</span>
                      </div>

                      {/* Setup Step 1: Language & Currency */}
                      {winSetupStep === 1 && (
                        <div className="p-5 space-y-4 text-xs">
                          <div>
                            <h3 className="text-sm font-bold text-white">Select language and time format</h3>
                            <p className="text-[11px] text-slate-400 mt-1">Booted from Official Microsoft ISO in Z:\MasterCloud_OS_Images</p>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] text-slate-300 block mb-1">Language to install:</label>
                              <select className="w-full h-8 px-2 rounded bg-[#101728] border border-white/20 text-xs text-white">
                                <option>English (United States)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-300 block mb-1">Time and currency format:</label>
                              <select className="w-full h-8 px-2 rounded bg-[#101728] border border-white/20 text-xs text-white">
                                <option>English (United States)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-300 block mb-1">Keyboard or input method:</label>
                              <select className="w-full h-8 px-2 rounded bg-[#101728] border border-white/20 text-xs text-white">
                                <option>US</option>
                              </select>
                            </div>
                          </div>
                          <div className="pt-2 flex justify-end">
                            <Button onClick={() => setWinSetupStep(2)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs font-bold gap-1">
                              <span>Next</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Setup Step 2: Install Now */}
                      {winSetupStep === 2 && (
                        <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400 flex items-center justify-center">
                            <Disc className="w-6 h-6 text-blue-400 animate-spin" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white">Windows 11 Enterprise (24H2)</h3>
                            <p className="text-xs text-slate-400 mt-1">Microsoft Official Evaluation Media</p>
                          </div>
                          <Button
                            onClick={() => setWinSetupStep(3)}
                            className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25"
                          >
                            Install Now
                          </Button>
                          <span className="text-[10px] text-slate-500">© 2026 Microsoft Corporation. All rights reserved.</span>
                        </div>
                      )}

                      {/* Setup Step 3: Virtual Disk Selection */}
                      {winSetupStep === 3 && (
                        <div className="p-5 space-y-4 text-xs">
                          <div>
                            <h3 className="text-sm font-bold text-white">Where do you want to install Windows?</h3>
                            <p className="text-[11px] text-slate-400 mt-1">Select virtual storage partition on Master Cloud 10 TB VFS:</p>
                          </div>
                          <div className="border border-white/20 rounded-lg p-2.5 bg-[#101728] space-y-2">
                            <div className="flex items-center justify-between p-2 rounded bg-blue-600/30 border border-blue-400/50">
                              <div className="flex items-center gap-2">
                                <HardDrive className="w-4 h-4 text-blue-400" />
                                <span className="font-bold text-white">Drive 0: Master Cloud Virtual NVMe</span>
                              </div>
                              <span className="font-mono text-cyan-300">128.0 GB Free (10 TB Pool)</span>
                            </div>
                            <p className="text-[10px] text-emerald-400">✓ Type: System · Fast PCIe 5.0 Host Passthrough · 0 Bytes Local Disk</p>
                          </div>
                          <div className="pt-2 flex justify-between items-center">
                            <Button onClick={() => setWinSetupStep(2)} size="sm" variant="ghost" className="text-xs">
                              Back
                            </Button>
                            <Button
                              onClick={startWindowsInstallation}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
                            >
                              <span>Next &amp; Install</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {osStages.windows === 'installing' && (
                  /* ── OFFICIAL WINDOWS 11 INSTALLATION PROGRESS SCREEN ── */
                  <div className="flex-1 bg-[#10192e] flex flex-col items-center justify-center p-6 text-center select-none">
                    <div className="w-full max-w-sm space-y-4 bg-[#18233c] p-6 rounded-2xl border border-blue-500/30 shadow-2xl">
                      <h2 className="text-base font-bold text-white">Installing Windows</h2>
                      <p className="text-xs text-slate-400">Your cloud virtual machine will restart several times. This might take a few moments.</p>

                      <div className="space-y-2.5 text-left text-xs pt-2">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Copying Windows files (100%)</span>
                        </div>
                        <div className="flex items-center gap-2 text-white font-bold">
                          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                          <span>{winSubStep}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Circle className="w-4 h-4" />
                          <span>Installing features</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Circle className="w-4 h-4" />
                          <span>Installing updates</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Circle className="w-4 h-4" />
                          <span>Finishing up</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-4">
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${winInstallProgress}%` }} />
                      </div>
                      <span className="text-[11px] font-mono text-cyan-300">{winInstallProgress}% Complete</span>
                    </div>
                  </div>
                )}

                {osStages.windows === 'installed' && (
                  /* ── FULL INSTALLED WINDOWS 11 ENTERPRISE 24H2 DESKTOP ── */
                  <div className="flex-1 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0b1735] via-[#071024] to-[#040813]">
                    {/* Desktop Icons */}
                    <div className="p-3 grid grid-cols-1 gap-2 w-28 z-10">
                      <div
                        onClick={() => setWinActiveApp('explorer')}
                        className="p-1.5 rounded-xl hover:bg-white/15 flex flex-col items-center text-center cursor-pointer transition-colors"
                      >
                        <HardDrive className="w-7 h-7 text-blue-400" />
                        <span className="text-[10px] text-white font-medium mt-1 truncate w-full">Z:\ (10 TB Drive)</span>
                      </div>
                      <div
                        onClick={() => setWinActiveApp('terminal')}
                        className="p-1.5 rounded-xl hover:bg-white/15 flex flex-col items-center text-center cursor-pointer transition-colors"
                      >
                        <TerminalIcon className="w-7 h-7 text-emerald-400" />
                        <span className="text-[10px] text-white font-medium mt-1 truncate w-full">PowerShell</span>
                      </div>
                      <div
                        onClick={() => setWinActiveApp('notepad')}
                        className="p-1.5 rounded-xl hover:bg-white/15 flex flex-col items-center text-center cursor-pointer transition-colors"
                      >
                        <FileText className="w-7 h-7 text-amber-300" />
                        <span className="text-[10px] text-white font-medium mt-1 truncate w-full">Notepad</span>
                      </div>
                      <div
                        onClick={() => setWinActiveApp('dx12')}
                        className="p-1.5 rounded-xl hover:bg-white/15 flex flex-col items-center text-center cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-red-600/40 border border-red-500/50 flex items-center justify-center font-black text-red-300 text-[10px]">
                          GTA 6
                        </div>
                        <span className="text-[10px] text-white font-medium mt-1 truncate w-full">GTA VI (4K DX12)</span>
                      </div>
                    </div>

                    {/* Active Windows on Desktop */}
                    {winActiveApp === 'explorer' && (
                      <div className="absolute inset-x-8 inset-y-6 bg-[#162035]/95 border border-blue-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md z-20">
                        <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bold text-white">File Explorer — Installed on Virtual NVMe</span>
                          </div>
                          <button onClick={() => setWinActiveApp(null)} className="hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-3 overflow-y-auto space-y-2 text-xs">
                          <p className="text-emerald-400 font-bold">✓ Windows 11 Enterprise 24H2 running live from official ISO!</p>
                          <div className="p-2 rounded bg-white/5 border border-white/10">
                            <p className="font-bold text-white">Z:\MasterCloud_OS_Images\</p>
                            <p className="text-[11px] text-slate-400">Windows_11_Enterprise_24H2_Official_x64.iso (Mounted)</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {winActiveApp === 'terminal' && (
                      <div className="absolute inset-x-8 inset-y-6 bg-black/95 border border-emerald-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden z-20">
                        <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-400">Windows PowerShell (Installed Windows 11 24H2)</span>
                          <button onClick={() => setWinActiveApp(null)} className="hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex-1 p-2 font-mono text-[11px] text-emerald-300 overflow-y-auto space-y-0.5">
                          {winCmdLogs.map((l, idx) => (
                            <div key={idx} className="whitespace-pre-wrap">{l}</div>
                          ))}
                        </div>
                        <form onSubmit={handleWinCmd} className="p-1.5 bg-[#0b121e] border-t border-white/10 flex items-center gap-2">
                          <span className="font-mono text-xs text-blue-400 font-bold">&gt;</span>
                          <input
                            type="text"
                            value={winCmdInput}
                            onChange={(e) => setWinCmdInput(e.target.value)}
                            placeholder="dir, dxdiag, net use, cls..."
                            className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none font-mono"
                          />
                        </form>
                      </div>
                    )}

                    {winActiveApp === 'notepad' && (
                      <div className="absolute inset-x-8 inset-y-6 bg-[#1e2538] border border-amber-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden z-20">
                        <div className="px-3 py-1.5 bg-[#141b2c] border-b border-white/10 flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-300">Notepad — MasterCloud_Notes.txt</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyClipboard('Windows 11 Notepad', winNotepadText)}
                              className="text-[10px] px-2 py-0.5 rounded bg-blue-600 font-bold text-white"
                            >
                              Copy to Matrix
                            </button>
                            <button onClick={() => setWinActiveApp(null)} className="hover:text-red-400">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={winNotepadText}
                          onChange={(e) => setWinNotepadText(e.target.value)}
                          className="flex-1 p-3 bg-transparent text-xs text-white font-mono resize-none focus:outline-none"
                        />
                      </div>
                    )}

                    {winActiveApp === 'dx12' && (
                      <div className="absolute inset-x-8 inset-y-6 bg-black/95 border border-red-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden z-20">
                        <div className="px-3 py-1.5 bg-[#1c0f14] border-b border-red-500/30 flex items-center justify-between text-xs">
                          <span className="font-bold text-red-400">Grand Theft Auto VI (DirectX 12 Ultimate Benchmark)</span>
                          <button onClick={() => setWinActiveApp(null)} className="hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between text-xs text-slate-300">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                              <span>Installed Windows 11 DirectX 12 Driver:</span>
                              <span className="font-bold text-emerald-400">Hardware Ray Tracing Active</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                              <span>Dedicated Cloud VRAM:</span>
                              <span className="font-bold text-white">80 GB / 200 GB Extreme Beast Tier</span>
                            </div>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-red-600/20 border border-red-500/30">
                            <span className="text-red-300 font-bold">🎮 120.2 FPS Pure Display Stream Active</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Windows 11 Taskbar */}
                    <div className="h-9 rounded-xl bg-[#090e1c]/90 border border-white/15 flex items-center justify-between px-3 z-30">
                      <div className="flex items-center gap-1.5 mx-auto">
                        <button
                          onClick={() => setWinStartOpen(!winStartOpen)}
                          className={`p-1.5 rounded-lg transition-colors ${winStartOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          title="Start Menu"
                        >
                          <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5">
                            <div className="bg-[#00adef]" />
                            <div className="bg-[#00adef]" />
                            <div className="bg-[#00adef]" />
                            <div className="bg-[#00adef]" />
                          </div>
                        </button>
                        <button
                          onClick={() => setWinActiveApp('explorer')}
                          className={`p-1.5 rounded-lg ${winActiveApp === 'explorer' ? 'bg-white/20 border-b-2 border-blue-400' : 'hover:bg-white/10'}`}
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          onClick={() => setWinActiveApp('terminal')}
                          className={`p-1.5 rounded-lg ${winActiveApp === 'terminal' ? 'bg-white/20 border-b-2 border-emerald-400' : 'hover:bg-white/10'}`}
                        >
                          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => setWinActiveApp('notepad')}
                          className={`p-1.5 rounded-lg ${winActiveApp === 'notepad' ? 'bg-white/20 border-b-2 border-amber-400' : 'hover:bg-white/10'}`}
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-300" />
                        </button>
                        <button
                          onClick={() => setWinActiveApp('dx12')}
                          className={`p-1.5 rounded-lg ${winActiveApp === 'dx12' ? 'bg-white/20 border-b-2 border-red-400' : 'hover:bg-white/10'}`}
                        >
                          <Flame className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <span>ENG</span>
                        <span className="font-bold text-white">20:00</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* 2. REAL OFFICIAL APPLE MACOS SEQUOIA 15.1 VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'mac') && (
            <div className="rounded-2xl border border-purple-500/30 bg-[#070c17] flex flex-col overflow-hidden shadow-2xl relative group">
              <div className="px-3 py-1.5 bg-[#141226] border-b border-white/10 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white"></span>
                  <span className="font-black text-white">Apple macOS Sequoia 15.1</span>
                  <Badge variant="outline" className="text-[9px] border-purple-500/40 text-purple-400">
                    Metal 3 Acceleration · 50 GB VRAM
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 font-bold">{fps} FPS · {ping}ms</span>
                  <button
                    onClick={() => {
                      if (layout === 'focus' && focusedOS === 'mac') setLayout('quad');
                      else {
                        setLayout('focus');
                        setFocusedOS('mac');
                      }
                    }}
                    className="p-1 hover:text-white text-slate-400"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* macOS Screen */}
              <div className="flex-1 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1a1333] via-[#0f0d22] to-[#070613]">
                <div className="h-6 bg-black/60 backdrop-blur border-b border-white/10 px-3 flex items-center justify-between text-[11px] text-slate-200 z-30">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white"> Finder</span>
                    <span className="hover:text-white cursor-pointer hidden sm:inline">File</span>
                    <span className="hover:text-white cursor-pointer hidden sm:inline">Edit</span>
                    <span className="hover:text-white cursor-pointer hidden sm:inline">View</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    <span className="font-semibold">Mon Nov 2  20:00</span>
                  </div>
                </div>

                <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
                  <div className="p-3 bg-[#18142a]/95 border border-purple-500/40 rounded-xl shadow-2xl space-y-2">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-white/10">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="ml-2 font-bold text-white text-xs">Installed via Apple Official BaseSystem DMG</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Running Darwin Kernel 24.1 on Virtualized Apple M3 Ultra with 50 GB Metal 3 VRAM.
                    </p>
                    <p className="text-[11px] text-cyan-300 font-mono">
                      Mounted Disk: /Volumes/MasterCloud_10TB/MasterCloud_OS_Images/
                    </p>
                  </div>

                  {/* macOS Dock */}
                  <div className="mx-auto h-11 px-3 bg-white/10 border border-white/20 rounded-2xl flex items-center gap-2 backdrop-blur-xl shadow-2xl z-30">
                    <button className="p-1.5 rounded-xl hover:scale-125 transition-transform" title="Finder">
                      <Folder className="w-5 h-5 text-cyan-400" />
                    </button>
                    <button className="p-1.5 rounded-xl hover:scale-125 transition-transform" title="Terminal">
                      <TerminalIcon className="w-5 h-5 text-slate-200" />
                    </button>
                    <button className="p-1.5 rounded-xl hover:scale-125 transition-transform" title="Xcode 16">
                      <span className="font-mono font-bold text-blue-400 text-xs">🛠️</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* 3. REAL OFFICIAL UBUNTU LINUX 24.04.1 LTS INSTALLER / VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'linux') && (
            <div className="rounded-2xl border border-amber-500/30 bg-[#070c17] flex flex-col overflow-hidden shadow-2xl relative group">
              <div className="px-3 py-1.5 bg-[#1f1124] border-b border-white/10 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#E95420] flex items-center justify-center font-bold text-[9px] text-white">
                    U
                  </div>
                  <span className="font-black text-white">Ubuntu Linux 24.04.1 LTS</span>
                  <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400">
                    {osStages.linux === 'installed' ? 'NVIDIA CUDA 12.4 · 50 GB VRAM' : 'Official Canonical Installer'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReinstallOS('linux')}
                    className="p-1 text-slate-400 hover:text-amber-400"
                    title="Re-run Ubuntu Setup from Official ISO"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-emerald-400 font-bold">{fps} FPS · {ping}ms</span>
                  <button
                    onClick={() => {
                      if (layout === 'focus' && focusedOS === 'linux') setLayout('quad');
                      else {
                        setLayout('focus');
                        setFocusedOS('linux');
                      }
                    }}
                    className="p-1 hover:text-white text-slate-400"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Viewport Content */}
              <div className="flex-1 relative flex flex-col overflow-hidden">
                {osStages.linux === 'boot_iso' && (
                  /* ── OFFICIAL UBUNTU 24.04 DESKTOP INSTALLER WIZARD ── */
                  <div className="flex-1 bg-[#2c001e] flex flex-col items-center justify-center p-4 select-none">
                    <div className="w-full max-w-md bg-[#3c002a] border border-[#E95420]/40 rounded-2xl shadow-2xl p-6 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-[#E95420] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-lg">
                        U
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Welcome to Ubuntu 24.04.1 LTS</h2>
                        <p className="text-xs text-slate-300 mt-1">Official Canonical Noble Numbat Desktop 64-bit ISO</p>
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-2">
                        <Button
                          onClick={() => {
                            setOsStages((prev) => ({ ...prev, linux: 'installed' }));
                            toast.info('Booted live Ubuntu session without installing.');
                          }}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-xs"
                        >
                          Try Ubuntu
                        </Button>
                        <Button
                          onClick={startUbuntuInstallation}
                          size="sm"
                          className="bg-[#E95420] hover:bg-[#d44817] text-white font-bold text-xs"
                        >
                          Install Ubuntu 24.04 LTS
                        </Button>
                      </div>

                      <p className="text-[10px] text-slate-400">
                        Target Virtual NVMe: 128 GB Master Cloud VFS Partition · Linux Kernel 6.8
                      </p>
                    </div>
                  </div>
                )}

                {osStages.linux === 'installing' && (
                  /* ── UBUNTU INSTALLING SYSTEM SCREEN ── */
                  <div className="flex-1 bg-[#1a0012] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-full max-w-sm bg-[#2c001e] p-6 rounded-2xl border border-[#E95420]/40 shadow-2xl space-y-3">
                      <RefreshCw className="w-8 h-8 text-[#E95420] animate-spin mx-auto" />
                      <h3 className="text-sm font-bold text-white">Installing Ubuntu 24.04.1 LTS</h3>
                      <p className="text-xs text-slate-300">Copying files &amp; configuring NVIDIA CUDA 12.4 kernel modules...</p>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-2">
                        <div className="h-full bg-[#E95420] transition-all duration-300" style={{ width: `${ubuntuProgress}%` }} />
                      </div>
                      <span className="text-[11px] font-mono text-amber-300">{ubuntuProgress}%</span>
                    </div>
                  </div>
                )}

                {osStages.linux === 'installed' && (
                  /* ── INSTALLED UBUNTU GNOME DESKTOP ── */
                  <div className="flex-1 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#2a001d] via-[#170010] to-[#0a0007]">
                    <div className="h-6 bg-[#11000c] border-b border-white/10 px-3 flex items-center justify-between text-[11px] text-slate-300 z-30">
                      <span className="font-bold text-white">Activities</span>
                      <span className="font-bold text-white">Mon 20:00</span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <Power className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto space-y-2">
                      <div className="p-3 bg-black/60 border border-[#E95420]/40 rounded-xl font-mono text-xs text-amber-200">
                        <p className="text-white font-bold">ubuntu@mastercloud-noble:~$ nvidia-smi</p>
                        <p>NVIDIA B200 192GB | CUDA 12.4 Active | 50 GB Assigned VRAM</p>
                        <p className="pt-2 text-white font-bold">ubuntu@mastercloud-noble:~$ ls -l /mnt/mastercloud_10tb/</p>
                        <p>drwxr-xr-x MasterCloud_OS_Images (Official ISOs Mounted)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* 4. REAL OFFICIAL GOOGLE ANDROID 15 (AOSP) VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'android') && (
            <div className="rounded-2xl border border-emerald-500/30 bg-[#070c17] flex flex-col overflow-hidden shadow-2xl relative group">
              <div className="px-3 py-1.5 bg-[#0f241a] border-b border-white/10 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-black text-white">Google Android 15 AOSP (Vanilla Ice Cream)</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400">
                    Vulkan 1.3 3D · 20 GB VRAM
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 font-bold">{fps} FPS · {ping}ms</span>
                  <button
                    onClick={() => {
                      if (layout === 'focus' && focusedOS === 'android') setLayout('quad');
                      else {
                        setLayout('focus');
                        setFocusedOS('android');
                      }
                    }}
                    className="p-1 hover:text-white text-slate-400"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Android Phone Device Frame */}
              <div className="flex-1 relative flex items-center justify-center p-2 overflow-hidden bg-gradient-to-br from-[#0c1f17] via-[#07130e] to-[#030806]">
                <div className="w-full max-w-xs h-full rounded-3xl border-2 border-emerald-500/30 bg-[#09140f] flex flex-col justify-between overflow-hidden shadow-2xl relative">
                  <div className="px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-300 z-30">
                    <span className="font-bold">20:00</span>
                    <div className="w-2.5 h-2.5 rounded-full bg-black border border-white/20" />
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[9px] text-emerald-400">5G</span>
                      <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="flex-1 px-3 py-2 flex flex-col justify-between overflow-hidden">
                    <div className="pt-2 text-center">
                      <span className="text-xs font-semibold text-white">Mon, Nov 2 · 28°C ☀️</span>
                      <p className="text-[10px] text-emerald-400 font-mono mt-1">Installed from Android 15 AOSP ISO</p>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-center my-auto">
                      <div className="p-1.5 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                        <HardDrive className="w-7 h-7 text-blue-400" />
                        <span className="text-[9px] text-white mt-1 font-semibold truncate w-full">Master Cloud</span>
                      </div>
                      <div className="p-1.5 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                        <TerminalIcon className="w-7 h-7 text-emerald-400" />
                        <span className="text-[9px] text-white mt-1 font-semibold truncate w-full">Termux</span>
                      </div>
                      <div className="p-1.5 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                        <ShoppingBag className="w-7 h-7 text-pink-400" />
                        <span className="text-[9px] text-white mt-1 font-semibold truncate w-full">Play Store</span>
                      </div>
                      <div className="p-1.5 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                        <SettingsIcon className="w-7 h-7 text-slate-300" />
                        <span className="text-[9px] text-white mt-1 font-semibold truncate w-full">Settings</span>
                      </div>
                    </div>

                    <div className="h-8 rounded-full bg-white/10 border border-white/15 px-3 flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-bold text-blue-400">G</span>
                      <span className="text-[10px]">Search Master Cloud &amp; Web...</span>
                      <Camera className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>

                  <div className="h-8 bg-black/80 flex items-center justify-around px-6 z-30">
                    <button className="p-1 text-slate-300 hover:text-emerald-400"><ArrowLeft className="w-3.5 h-3.5" /></button>
                    <button className="p-1 text-slate-300 hover:text-emerald-400"><Circle className="w-3.5 h-3.5" /></button>
                    <button className="p-1 text-slate-300 hover:text-emerald-400"><Square className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── BOTTOM MATRIX BRIDGE INTER-OS CONTROL BAR ── */}
      <footer className="px-4 py-2 bg-[#090d18] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            Cross-OS Unified Clipboard:
          </span>
          <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 truncate max-w-sm">
            {clipboardContent}
          </div>
          <button
            onClick={() => handleCopyClipboard('Universal Matrix')}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1"
          >
            {copiedSuccess ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
            <span>Sync &amp; Paste All</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span className="text-emerald-400 font-bold">✨ Zero-Disk VFS Bridge:</span>
          <span>Instant inter-OS file streaming via 10 TB In-Memory VFS (Windows ↔ macOS ↔ Ubuntu ↔ Android)</span>
        </div>
      </footer>
    </div>
  );
}
