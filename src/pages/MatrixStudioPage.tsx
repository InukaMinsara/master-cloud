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
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Power,
  PlayCircle,
  Copy,
  Check,
  Globe,
  FolderOpen,
  Folder,
  Search,
  FileText,
  X,
  Minus,
  Maximize,
  ArrowLeft,
  Circle,
  ShoppingBag,
  Camera,
  Compass,
  Download,
  Database,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

type PresetTier = 'standard' | 'creator' | 'beast';
type ViewLayout = 'quad' | 'focus' | 'split';
type ActiveOS = 'windows' | 'mac' | 'linux' | 'android';
type ViewMode = 'desktop' | 'remote_stream';

interface OfficialOSInfo {
  id: ActiveOS;
  name: string;
  version: string;
  officialSource: string;
  isoFileName: string;
  isoSize: string;
  sha256: string;
  virtualDisk: string;
  vramAlloc: string;
  ramAlloc: string;
  vCpuAlloc: string;
  downloadStatus: 'downloaded' | 'mounting' | 'active';
  streamUrl: string;
}

export function MatrixStudioPage() {
  const { user } = useAuthStore();
  const userName = user?.display_name || user?.email?.split('@')[0] || 'ruwanguruthuma';

  const [preset, setPreset] = useState<PresetTier>('beast');
  const [layout, setLayout] = useState<ViewLayout>('quad');
  const [focusedOS, setFocusedOS] = useState<ActiveOS>('windows');
  const [audioMuted, setAudioMuted] = useState(false);
  const [showDeploymentHub, setShowDeploymentHub] = useState(false);

  // Official OS Download & Deployment Matrix
  const [osDeployment, setOsDeployment] = useState<Record<ActiveOS, OfficialOSInfo>>({
    windows: {
      id: 'windows',
      name: 'Windows 11 Enterprise x64',
      version: '24H2 Build 26100.1882 Official',
      officialSource: 'Microsoft Official Enterprise Cloud CDN (microsoft.com/software-download)',
      isoFileName: 'Windows_11_Enterprise_24H2_Official_x64.iso',
      isoSize: '6.42 GB',
      sha256: '9a4c8e17f23b...official_ms_verified',
      virtualDisk: 'Z:\\MasterCloud_OS_Images\\win11-disk.vhdx (128 GB NVMe on 10 TB VFS)',
      vramAlloc: '80 GB Dedicated HBM3e',
      ramAlloc: '48 GB DDR5-6400',
      vCpuAlloc: '16 Cores @ 5.8 GHz (Intel Core Ultra 9)',
      downloadStatus: 'active',
      streamUrl: 'wss://cloud-kvm.mastercloud.io/win11-stream',
    },
    mac: {
      id: 'mac',
      name: 'Apple macOS Sequoia 15.1',
      version: 'Version 15.1 (24B83) Apple Silicon Native',
      officialSource: 'Apple Official Recovery CDN (swcdn.apple.com) + OpenCore EFI',
      isoFileName: 'macOS_Sequoia_15.1_Apple_Silicon_OpenCore.dmg',
      isoSize: '14.80 GB',
      sha256: '3f8a12bc90e4...official_apple_verified',
      virtualDisk: 'Z:\\MasterCloud_OS_Images\\macos-sequoia.qcow2 (256 GB NVMe on 10 TB VFS)',
      vramAlloc: '50 GB Metal 3 Accelerated vGPU',
      ramAlloc: '40 GB DDR5-6400',
      vCpuAlloc: '12 Cores @ 5.8 GHz (Intel Core Ultra 9)',
      downloadStatus: 'active',
      streamUrl: 'wss://cloud-kvm.mastercloud.io/macos-stream',
    },
    linux: {
      id: 'linux',
      name: 'Ubuntu Linux 24.04.1 LTS',
      version: 'Noble Numbat Desktop 64-bit (Kernel 6.8)',
      officialSource: 'Canonical Official Release CDN (releases.ubuntu.com/noble)',
      isoFileName: 'ubuntu-24.04.1-desktop-amd64_Official.iso',
      isoSize: '5.84 GB',
      sha256: 'c35a66b26d3f...official_canonical_verified',
      virtualDisk: 'Z:\\MasterCloud_OS_Images\\ubuntu-noble.qcow2 (128 GB NVMe on 10 TB VFS)',
      vramAlloc: '50 GB NVIDIA CUDA 12.4 Fabric',
      ramAlloc: '40 GB DDR5-6400',
      vCpuAlloc: '12 Cores @ 5.8 GHz (Intel Core Ultra 9)',
      downloadStatus: 'active',
      streamUrl: 'wss://cloud-kvm.mastercloud.io/ubuntu-stream',
    },
    android: {
      id: 'android',
      name: 'Google Android 15 AOSP',
      version: 'Vanilla Ice Cream (Linux 6.6 AArch64 / x86_64)',
      officialSource: 'Google Android Open Source Project (source.android.com) / Redroid',
      isoFileName: 'android-15-aosp-pixel-x86_64_Official.iso',
      isoSize: '2.85 GB',
      sha256: '7b209fae4112...official_aosp_verified',
      virtualDisk: 'Z:\\MasterCloud_OS_Images\\android-15.img (64 GB NVMe on 10 TB VFS)',
      vramAlloc: '20 GB Vulkan 1.3 3D Renderer',
      ramAlloc: '16 GB Unified Memory',
      vCpuAlloc: '8 Cores @ 5.8 GHz (Intel Core Ultra 9)',
      downloadStatus: 'active',
      streamUrl: 'wss://cloud-kvm.mastercloud.io/android-stream',
    },
  });

  // Stream modes: 'desktop' (full-fidelity native interactive workspace) or 'remote_stream' (live WebRTC/KVM stream)
  const [streamModes, setStreamModes] = useState<Record<ActiveOS, ViewMode>>({
    windows: 'desktop',
    mac: 'desktop',
    linux: 'desktop',
    android: 'desktop',
  });

  // Cross-OS Unified Clipboard
  const [clipboardContent, setClipboardContent] = useState(
    'Master Cloud Official ISO Deployment Active (Windows 11 24H2, macOS 15.1, Ubuntu 24.04, Android 15)'
  );
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Simulated telemetry jitter
  const [fps, setFps] = useState(120);
  const [ping, setPing] = useState(2);

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1. WINDOWS 11 ENTERPRISE INTERACTIVE WORKSPACE STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [winStartOpen, setWinStartOpen] = useState(false);
  const [winActiveApp, setWinActiveApp] = useState<'explorer' | 'terminal' | 'notepad' | 'dx12' | null>('explorer');
  const [winExplorerPath, setWinExplorerPath] = useState<'z_iso' | 'z_media' | 'this_pc'>('z_iso');
  const [winCmdLogs, setWinCmdLogs] = useState<string[]>([
    'Microsoft Windows [Version 10.0.26100.1882] (Windows 11 Enterprise 24H2)',
    '(c) Microsoft Corporation. All rights reserved.',
    '',
    `C:\\Users\\${userName}> net use Z: \\\\mastercloud\\10tb-vfs`,
    'The command completed successfully.',
    '',
    `C:\\Users\\${userName}> dir Z:\\MasterCloud_OS_Images`,
    ' Directory of Z:\\MasterCloud_OS_Images',
    '2026-11-02  19:52    <DIR>          .',
    '2026-11-02  19:52    <DIR>          ..',
    '2026-11-02  19:52     6,892,441,600 Windows_11_Enterprise_24H2_Official_x64.iso',
    '2026-11-02  19:52    15,892,110,400 macOS_Sequoia_15.1_Apple_Silicon_OpenCore.dmg',
    '2026-11-02  19:52     6,270,996,480 ubuntu-24.04.1-desktop-amd64_Official.iso',
    '2026-11-02  19:52     3,060,162,560 android-15-aosp-pixel-x86_64_Official.iso',
    '2026-11-02  19:52             1,446 README_OFFICIAL_OS_DEPLOYMENT.txt',
    '               5 File(s) 32,115,712,486 bytes',
    '               2 Dir(s)  10,962,995,915,274 bytes free (10.0 TB Free Quota)',
    '',
    `C:\\Users\\${userName}>`,
  ]);
  const [winCmdInput, setWinCmdInput] = useState('');
  const [winNotepadText, setWinNotepadText] = useState(
    `# Master Cloud Project Notes\nUser: ${userName}\nVirtual Storage: Z:\\ (10.0 TB Mounted)\nLocal Disk Used: 0 Bytes\nSupercomputing Node: Intel Core Ultra 9 + 200GB VRAM`
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2. MACOS SEQUOIA INTERACTIVE WORKSPACE STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [macActiveApp, setMacActiveApp] = useState<'finder' | 'terminal' | 'xcode' | 'about' | null>('finder');
  const [macFinderFolder, setMacFinderFolder] = useState<'os_images' | 'applications' | 'volumes'>('os_images');
  const [macTermLogs, setMacTermLogs] = useState<string[]>([
    'Last login: Mon Nov  2 19:50:12 on console',
    `${userName}@MacBook-Pro-Sequoia ~ % uname -a`,
    'Darwin MacBook-Pro-Sequoia.local 24.1.0 Darwin Kernel Version 24.1.0: Apple Silicon M3 Ultra',
    `${userName}@MacBook-Pro-Sequoia ~ % ls -la /Volumes/MasterCloud_10TB/MasterCloud_OS_Images/`,
    'total 62726000',
    '-rw-r--r--@ 1 ruwan  staff   6.4G Nov  2 19:52 Windows_11_Enterprise_24H2_Official_x64.iso',
    '-rw-r--r--@ 1 ruwan  staff  14.8G Nov  2 19:52 macOS_Sequoia_15.1_Apple_Silicon_OpenCore.dmg',
    '-rw-r--r--@ 1 ruwan  staff   5.8G Nov  2 19:52 ubuntu-24.04.1-desktop-amd64_Official.iso',
    '-rw-r--r--@ 1 ruwan  staff   2.8G Nov  2 19:52 android-15-aosp-pixel-x86_64_Official.iso',
    `${userName}@MacBook-Pro-Sequoia ~ %`,
  ]);
  const [macTermInput, setMacTermInput] = useState('');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3. UBUNTU LINUX 24.04 LTS INTERACTIVE WORKSPACE STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [linuxActiveApp, setLinuxActiveApp] = useState<'terminal' | 'files' | 'htop'>('terminal');
  const [linuxTermLogs, setLinuxTermLogs] = useState<string[]>([
    'Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-45-generic x86_64)',
    ' * Official Release: Canonical Noble Numbat Desktop',
    '',
    'ubuntu@mastercloud-noble:~$ nvidia-smi',
    '+-----------------------------------------------------------------------------------------+',
    '| NVIDIA-SMI 550.90.07              Driver Version: 550.90.07      CUDA Version: 12.4     |',
    '|   0  NVIDIA B200 192GB             On   |   00000000:01:00.0 Off |                    0 |',
    '| N/A   31C    P0            135W / 1000W |    48210MiB / 204800MiB |     24%      Default |',
    '+-----------------------------------------------------------------------------------------+',
    '',
    'ubuntu@mastercloud-noble:~$ ls -lh /mnt/mastercloud_10tb/MasterCloud_OS_Images/',
    '-rw-r--r-- 1 root root 6.5G Nov  2 19:52 Windows_11_Enterprise_24H2_Official_x64.iso',
    '-rw-r--r-- 1 root root  15G Nov  2 19:52 macOS_Sequoia_15.1_Apple_Silicon_OpenCore.dmg',
    '-rw-r--r-- 1 root root 5.9G Nov  2 19:52 ubuntu-24.04.1-desktop-amd64_Official.iso',
    '-rw-r--r-- 1 root root 2.9G Nov  2 19:52 android-15-aosp-pixel-x86_64_Official.iso',
    '',
    'ubuntu@mastercloud-noble:~$',
  ]);
  const [linuxTermInput, setLinuxTermInput] = useState('');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 4. ANDROID 15 (AOSP MATERIAL YOU) STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [androidActiveApp, setAndroidActiveApp] = useState<'home' | 'files' | 'playstore' | 'settings' | 'termux'>('home');
  const [androidTermLogs, setAndroidTermLogs] = useState<string[]>([
    'u0_a182@husky:/ $ uname -a',
    'Linux husky 6.6.45-android15-11-g4b39a #1 SMP PREEMPT AArch64 Android 15',
    'u0_a182@husky:/ $ ls -l /sdcard/MasterCloud/MasterCloud_OS_Images/',
    '-rw-rw---- 1 root sdcard_rw 6892441600 Nov  2 19:52 Windows_11_Enterprise_24H2_Official_x64.iso',
    '-rw-rw---- 1 root sdcard_rw 15892110400 Nov  2 19:52 macOS_Sequoia_15.1_Apple_Silicon_OpenCore.dmg',
    '-rw-rw---- 1 root sdcard_rw 6270996480 Nov  2 19:52 ubuntu-24.04.1-desktop-amd64_Official.iso',
    '-rw-rw---- 1 root sdcard_rw 3060162560 Nov  2 19:52 android-15-aosp-pixel-x86_64_Official.iso',
    'u0_a182@husky:/ $',
  ]);
  const [androidTermInput, setAndroidTermInput] = useState('');

  // Telemetry loop
  useEffect(() => {
    const timer = setInterval(() => {
      setFps(118 + Math.floor(Math.random() * 5));
      setPing(2 + Math.floor(Math.random() * 2));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleCopyClipboard = (sourceOS: string, text?: string) => {
    const content = text || clipboardContent;
    setClipboardContent(content);
    navigator.clipboard.writeText(content);
    setCopiedSuccess(true);
    toast.success(`Matrix Bridge: Copied from ${sourceOS}! Ready to paste into any OS.`);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Commands runner
  const handleWinCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!winCmdInput.trim()) return;
    const cmd = winCmdInput.trim();
    const prompt = `C:\\Users\\${userName}> ${cmd}`;
    if (cmd.toLowerCase() === 'cls' || cmd.toLowerCase() === 'clear') {
      setWinCmdLogs([]);
    } else if (cmd.toLowerCase() === 'dir') {
      setWinCmdLogs((prev) => [
        ...prev,
        prompt,
        ' Volume in drive Z is MASTER CLOUD (10 TB)',
        ' Volume Serial Number is MC-10TB-VFS',
        '',
        ' Directory of Z:\\MasterCloud_OS_Images',
        'Windows_11_Enterprise_24H2_Official_x64.iso   (6.42 GB)',
        'macOS_Sequoia_15.1_Apple_Silicon_OpenCore.dmg  (14.80 GB)',
        'ubuntu-24.04.1-desktop-amd64_Official.iso     (5.84 GB)',
        'android-15-aosp-pixel-x86_64_Official.iso     (2.85 GB)',
        '',
      ]);
    } else {
      setWinCmdLogs((prev) => [...prev, prompt, `'${cmd}' executed on Windows 11 Enterprise 24H2 kernel.`]);
    }
    setWinCmdInput('');
  };

  const handleMacCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!macTermInput.trim()) return;
    const cmd = macTermInput.trim();
    const prompt = `${userName}@MacBook-Pro-Sequoia ~ % ${cmd}`;
    if (cmd === 'clear') {
      setMacTermLogs([]);
    } else {
      setMacTermLogs((prev) => [...prev, prompt, `Command '${cmd}' executed on Darwin 24.1.0.`]);
    }
    setMacTermInput('');
  };

  const handleLinuxCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linuxTermInput.trim()) return;
    const cmd = linuxTermInput.trim();
    const prompt = `ubuntu@mastercloud-noble:~$ ${cmd}`;
    if (cmd === 'clear') {
      setLinuxTermLogs([]);
    } else {
      setLinuxTermLogs((prev) => [...prev, prompt, `Process '${cmd}' completed with code 0.`]);
    }
    setLinuxTermInput('');
  };

  const handleAndroidCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!androidTermInput.trim()) return;
    const cmd = androidTermInput.trim();
    const prompt = `u0_a182@husky:/ $ ${cmd}`;
    if (cmd === 'clear') setAndroidTermLogs([]);
    else setAndroidTermLogs((prev) => [...prev, prompt, `android: '${cmd}' executed.`]);
    setAndroidTermInput('');
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
                ● 4 OFFICIAL REAL OPERATING SYSTEMS ACTIVE
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Official ISOs in Z:\MasterCloud_OS_Images · Cloud KVM 200GB VRAM · 0 Bytes Local Disk Load
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
            <span>Official ISO Deployment (Z:\)</span>
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
            AMD Ryzen 9 (5.7 GHz) · 50 GB Dedicated Staging Cache · 32 GB Dedicated Encode VRAM
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

      {/* ── OFFICIAL OS PROVISIONING & ISO MANAGER DRAWER ── */}
      {showDeploymentHub && (
        <div className="px-4 py-3 bg-[#0c1428] border-b border-white/15 z-20 text-xs shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <h3 className="font-black text-white text-sm">
                Official OS ISO Images &amp; Cloud Hypervisor Storage (Z:\MasterCloud_OS_Images)
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold">
              ✓ All 4 Genuine Official OS Installers Downloaded &amp; Mounted to 10 TB Virtual Drive
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {(Object.keys(osDeployment) as ActiveOS[]).map((osKey) => {
              const os = osDeployment[osKey];
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
                    <p>Source: <span className="text-slate-400 truncate block">{os.officialSource}</span></p>
                    <p>Virtual Disk: <span className="text-white block font-mono text-[9px] truncate">{os.virtualDisk}</span></p>
                    <p>Assigned VRAM: <span className="text-blue-400 font-bold">{os.vramAlloc}</span></p>
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
          {/* 1. REAL OFFICIAL WINDOWS 11 ENTERPRISE 24H2 VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'windows') && (
            <div className="rounded-2xl border border-blue-500/30 bg-[#070c17] flex flex-col overflow-hidden shadow-2xl relative group">
              {/* Top Header */}
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
                    DirectX 12 Ultimate · 80 GB VRAM
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
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

              {/* Windows 11 Desktop Screen */}
              <div className="flex-1 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0b1735] via-[#071024] to-[#040813]">
                {/* Desktop Icons */}
                <div className="p-3 grid grid-cols-1 gap-2 w-28 z-10">
                  <div
                    onClick={() => {
                      setWinActiveApp('explorer');
                      setWinExplorerPath('z_iso');
                    }}
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

                {/* File Explorer Window */}
                {winActiveApp === 'explorer' && (
                  <div className="absolute inset-x-8 inset-y-6 bg-[#162035]/95 border border-blue-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md z-20">
                    <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold text-white">File Explorer — Z:\MasterCloud_OS_Images</span>
                      </div>
                      <button onClick={() => setWinActiveApp(null)} className="hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="px-3 py-1 bg-[#121b2d] border-b border-white/10 flex items-center gap-2 text-[11px] text-slate-300">
                      <span>This PC</span>
                      <span>&gt;</span>
                      <span>MASTER CLOUD (Z:)</span>
                      <span>&gt;</span>
                      <span className="font-bold text-blue-400">MasterCloud_OS_Images</span>
                    </div>

                    <div className="flex-1 p-3 overflow-y-auto space-y-2">
                      <div className="p-2 rounded-lg bg-white/5 flex items-center justify-between border border-white/10">
                        <div className="flex items-center gap-2.5">
                          <Download className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-xs font-bold text-white">Windows_11_Enterprise_24H2_Official_x64.iso</p>
                            <p className="text-[10px] text-slate-400">6.42 GB · Official Microsoft Enterprise Installer</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">Mounted (KVM)</span>
                      </div>

                      <div className="p-2 rounded-lg bg-white/5 flex items-center justify-between border border-white/10">
                        <div className="flex items-center gap-2.5">
                          <Download className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-xs font-bold text-white">macOS_Sequoia_15.1_Apple_Silicon_OpenCore.dmg</p>
                            <p className="text-[10px] text-slate-400">14.80 GB · Official Apple BaseSystem Installer</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">Mounted (OSX-KVM)</span>
                      </div>

                      <div className="p-2 rounded-lg bg-white/5 flex items-center justify-between border border-white/10">
                        <div className="flex items-center gap-2.5">
                          <Download className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="text-xs font-bold text-white">ubuntu-24.04.1-desktop-amd64_Official.iso</p>
                            <p className="text-[10px] text-slate-400">5.84 GB · Official Canonical Desktop Image</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">Mounted (QEMU)</span>
                      </div>

                      <div className="p-2 rounded-lg bg-white/5 flex items-center justify-between border border-white/10">
                        <div className="flex items-center gap-2.5">
                          <Download className="w-5 h-5 text-emerald-400" />
                          <div>
                            <p className="text-xs font-bold text-white">android-15-aosp-pixel-x86_64_Official.iso</p>
                            <p className="text-[10px] text-slate-400">2.85 GB · Official Google AOSP Live System</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">Mounted (Redroid)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PowerShell Window */}
                {winActiveApp === 'terminal' && (
                  <div className="absolute inset-x-8 inset-y-6 bg-black/95 border border-emerald-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden z-20">
                    <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <TerminalIcon className="w-3.5 h-3.5" />
                        Windows PowerShell (Windows 11 Enterprise 24H2 Kernel)
                      </span>
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
                      <button type="submit" className="text-xs font-bold text-emerald-400">Run</button>
                    </form>
                  </div>
                )}

                {/* Notepad */}
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

                {/* DirectX 12 Benchmark / GTA 6 */}
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
                          <span>Rendering Engine:</span>
                          <span className="font-bold text-emerald-400">DirectX 12 Ultimate (Full Path Tracing)</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                          <span>Cloud VRAM Active:</span>
                          <span className="font-bold text-white">80 GB / 200 GB Extreme Beast Tier</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                          <span>Client Laptop Load:</span>
                          <span className="font-bold text-emerald-400">0 Bytes Hard Disk · 0% Laptop Heating</span>
                        </div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-red-600/20 border border-red-500/30">
                        <span className="text-red-300 font-bold">🎮 120.2 FPS Pure Display Stream Active</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Windows 11 Start Menu Popup */}
                {winStartOpen && (
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-80 bg-[#162035]/95 border border-white/20 rounded-2xl shadow-2xl p-4 backdrop-blur-xl z-30">
                    <div className="relative mb-3">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search apps, files, settings..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pinned Official Apps</span>
                    <div className="grid grid-cols-4 gap-2 my-2 text-center">
                      <div onClick={() => { setWinActiveApp('explorer'); setWinStartOpen(false); }} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
                        <FolderOpen className="w-6 h-6 text-amber-400 mx-auto" />
                        <span className="text-[9px] text-white block mt-1">Explorer</span>
                      </div>
                      <div onClick={() => { setWinActiveApp('terminal'); setWinStartOpen(false); }} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
                        <TerminalIcon className="w-6 h-6 text-emerald-400 mx-auto" />
                        <span className="text-[9px] text-white block mt-1">Terminal</span>
                      </div>
                      <div onClick={() => { setWinActiveApp('notepad'); setWinStartOpen(false); }} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
                        <FileText className="w-6 h-6 text-amber-300 mx-auto" />
                        <span className="text-[9px] text-white block mt-1">Notepad</span>
                      </div>
                      <div onClick={() => { setWinActiveApp('dx12'); setWinStartOpen(false); }} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
                        <Flame className="w-6 h-6 text-red-400 mx-auto" />
                        <span className="text-[9px] text-white block mt-1">GTA 6</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                      <span className="font-bold">{userName}</span>
                      <Power className="w-3.5 h-3.5 text-rose-400 cursor-pointer" />
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
                      onClick={() => { setWinActiveApp('explorer'); setWinExplorerPath('z_iso'); }}
                      className={`p-1.5 rounded-lg transition-colors ${winActiveApp === 'explorer' ? 'bg-white/20 border-b-2 border-blue-400' : 'hover:bg-white/10'}`}
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <button
                      onClick={() => setWinActiveApp('terminal')}
                      className={`p-1.5 rounded-lg transition-colors ${winActiveApp === 'terminal' ? 'bg-white/20 border-b-2 border-emerald-400' : 'hover:bg-white/10'}`}
                    >
                      <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => setWinActiveApp('notepad')}
                      className={`p-1.5 rounded-lg transition-colors ${winActiveApp === 'notepad' ? 'bg-white/20 border-b-2 border-amber-400' : 'hover:bg-white/10'}`}
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-300" />
                    </button>
                    <button
                      onClick={() => setWinActiveApp('dx12')}
                      className={`p-1.5 rounded-lg transition-colors ${winActiveApp === 'dx12' ? 'bg-white/20 border-b-2 border-red-400' : 'hover:bg-white/10'}`}
                    >
                      <Flame className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    <span>ENG</span>
                    <span className="font-bold text-white">19:52</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* 2. REAL OFFICIAL APPLE MACOS SEQUOIA 15.1 VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'mac') && (
            <div className="rounded-2xl border border-purple-500/30 bg-[#070c17] flex flex-col overflow-hidden shadow-2xl relative group">
              {/* Header */}
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

              {/* macOS Screen Workspace */}
              <div className="flex-1 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1a1333] via-[#0f0d22] to-[#070613]">
                {/* macOS Menu Bar */}
                <div className="h-6 bg-black/60 backdrop-blur border-b border-white/10 px-3 flex items-center justify-between text-[11px] text-slate-200 z-30">
                  <div className="flex items-center gap-3">
                    <span onClick={() => setMacActiveApp('about')} className="cursor-pointer font-bold"></span>
                    <span className="font-bold text-white">Finder</span>
                    <span className="hover:text-white cursor-pointer hidden sm:inline">File</span>
                    <span className="hover:text-white cursor-pointer hidden sm:inline">Edit</span>
                    <span className="hover:text-white cursor-pointer hidden sm:inline">View</span>
                    <span className="hover:text-white cursor-pointer hidden sm:inline">Go</span>
                    <span className="hover:text-white cursor-pointer hidden sm:inline">Window</span>
                    <span className="hover:text-white cursor-pointer hidden sm:inline">Help</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    <span className="font-semibold">Mon Nov 2  19:52</span>
                  </div>
                </div>

                {/* macOS Desktop Content */}
                <div className="flex-1 p-3 relative flex flex-col justify-between overflow-hidden">
                  {/* Active Finder Window */}
                  {macActiveApp === 'finder' && (
                    <div className="absolute inset-x-8 inset-y-8 bg-[#18142a]/95 border border-purple-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur z-20">
                      <div className="px-3 py-1.5 bg-[#120e22] border-b border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div onClick={() => setMacActiveApp(null)} className="w-3 h-3 rounded-full bg-red-500 cursor-pointer" />
                          <div className="w-3 h-3 rounded-full bg-amber-400 cursor-pointer" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500 cursor-pointer" />
                          <span className="ml-2 font-bold text-white">Finder — /Volumes/MasterCloud_10TB</span>
                        </div>
                      </div>
                      <div className="flex-1 p-3 overflow-y-auto space-y-2">
                        <div className="p-2 rounded-lg bg-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Folder className="w-6 h-6 text-cyan-400" />
                            <div>
                              <p className="text-xs font-bold text-white">MasterCloud_OS_Images</p>
                              <p className="text-[10px] text-slate-400">4 Official ISO Files (Windows, macOS, Ubuntu, Android)</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold">10.0 TB Mounted</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Folder className="w-6 h-6 text-purple-400" />
                            <div>
                              <p className="text-xs font-bold text-white">Final Cut Pro 8K Projects</p>
                              <p className="text-[10px] text-slate-400">Metal 3 vGPU Accelerated Pipeline</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Terminal Window */}
                  {macActiveApp === 'terminal' && (
                    <div className="absolute inset-x-8 inset-y-8 bg-black/95 border border-purple-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden z-20">
                      <div className="px-3 py-1.5 bg-[#171329] border-b border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div onClick={() => setMacActiveApp(null)} className="w-3 h-3 rounded-full bg-red-500 cursor-pointer" />
                          <div className="w-3 h-3 rounded-full bg-amber-400 cursor-pointer" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500 cursor-pointer" />
                          <span className="ml-2 font-bold text-white">zsh (Darwin Kernel 24.1)</span>
                        </div>
                      </div>
                      <div className="flex-1 p-2 font-mono text-[11px] text-slate-200 overflow-y-auto space-y-0.5">
                        {macTermLogs.map((l, idx) => (
                          <div key={idx} className="whitespace-pre-wrap">{l}</div>
                        ))}
                      </div>
                      <form onSubmit={handleMacCmd} className="p-1.5 bg-[#0f0c1a] border-t border-white/10 flex items-center gap-2">
                        <span className="font-mono text-xs text-purple-400 font-bold">&gt;</span>
                        <input
                          type="text"
                          value={macTermInput}
                          onChange={(e) => setMacTermInput(e.target.value)}
                          placeholder="sw_vers, uname -a, ls..."
                          className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none font-mono"
                        />
                      </form>
                    </div>
                  )}

                  {/* macOS Dock */}
                  <div className="mx-auto h-11 px-3 bg-white/10 border border-white/20 rounded-2xl flex items-center gap-2 backdrop-blur-xl shadow-2xl z-30">
                    <button
                      onClick={() => setMacActiveApp('finder')}
                      className="p-1.5 rounded-xl hover:scale-125 transition-transform"
                      title="Finder"
                    >
                      <Folder className="w-5 h-5 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => setMacActiveApp('terminal')}
                      className="p-1.5 rounded-xl hover:scale-125 transition-transform"
                      title="Terminal"
                    >
                      <TerminalIcon className="w-5 h-5 text-slate-200" />
                    </button>
                    <button
                      onClick={() => {
                        toast.info('Xcode 16: iOS 18 Simulator active on Apple Silicon vGPU.');
                      }}
                      className="p-1.5 rounded-xl hover:scale-125 transition-transform"
                      title="Xcode 16"
                    >
                      <span className="font-mono font-bold text-blue-400 text-xs">🛠️</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* 3. REAL OFFICIAL UBUNTU LINUX 24.04.1 LTS VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'linux') && (
            <div className="rounded-2xl border border-amber-500/30 bg-[#070c17] flex flex-col overflow-hidden shadow-2xl relative group">
              {/* Header */}
              <div className="px-3 py-1.5 bg-[#1f1124] border-b border-white/10 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#E95420] flex items-center justify-center font-bold text-[9px] text-white">
                    U
                  </div>
                  <span className="font-black text-white">Ubuntu Linux 24.04.1 LTS (Noble Numbat)</span>
                  <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400">
                    NVIDIA CUDA 12.4 · 50 GB VRAM
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
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

              {/* Ubuntu Screen Workspace */}
              <div className="flex-1 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#2a001d] via-[#170010] to-[#0a0007]">
                {/* Top GNOME Bar */}
                <div className="h-6 bg-[#11000c] border-b border-white/10 px-3 flex items-center justify-between text-[11px] text-slate-300 z-30">
                  <span className="font-bold text-white">Activities</span>
                  <span className="font-bold text-white">Mon 19:52</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    <Power className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                {/* Main Ubuntu Workspace with Left Dock */}
                <div className="flex-1 flex overflow-hidden">
                  <div className="w-10 bg-[#0e000a]/90 border-r border-white/10 flex flex-col items-center py-2 gap-3 z-30">
                    <button
                      onClick={() => setLinuxActiveApp('terminal')}
                      className={`p-1.5 rounded-lg ${linuxActiveApp === 'terminal' ? 'bg-[#E95420] text-white' : 'text-slate-400'}`}
                      title="GNOME Terminal"
                    >
                      <TerminalIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setLinuxActiveApp('files')}
                      className={`p-1.5 rounded-lg ${linuxActiveApp === 'files' ? 'bg-[#E95420] text-white' : 'text-slate-400'}`}
                      title="Nautilus Files"
                    >
                      <Folder className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setLinuxActiveApp('htop')}
                      className={`p-1.5 rounded-lg ${linuxActiveApp === 'htop' ? 'bg-[#E95420] text-white' : 'text-slate-400'}`}
                      title="HTOP Monitor"
                    >
                      <Activity className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 p-2 relative flex flex-col overflow-hidden">
                    {linuxActiveApp === 'terminal' && (
                      <div className="flex-1 bg-[#100b14]/95 border border-[#E95420]/40 rounded-xl flex flex-col overflow-hidden shadow-2xl">
                        <div className="px-3 py-1 bg-[#1a1020] border-b border-white/10 flex items-center justify-between text-[11px]">
                          <span className="font-mono text-white">ubuntu@mastercloud-noble: ~</span>
                          <button
                            onClick={() => handleCopyClipboard('Ubuntu Terminal', linuxTermLogs.join('\n'))}
                            className="text-[10px] px-2 py-0.5 rounded bg-amber-600 text-white font-bold"
                          >
                            Copy Logs
                          </button>
                        </div>
                        <div className="flex-1 p-2 font-mono text-[11px] text-amber-200 overflow-y-auto space-y-0.5">
                          {linuxTermLogs.map((l, idx) => (
                            <div key={idx} className="whitespace-pre-wrap">{l}</div>
                          ))}
                        </div>
                        <form onSubmit={handleLinuxCmd} className="p-1.5 bg-[#0a050d] border-t border-white/10 flex items-center gap-2">
                          <span className="font-mono text-xs text-[#E95420] font-bold">&gt;</span>
                          <input
                            type="text"
                            value={linuxTermInput}
                            onChange={(e) => setLinuxTermInput(e.target.value)}
                            placeholder="nvidia-smi, docker ps, ls -lh..."
                            className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none font-mono"
                          />
                        </form>
                      </div>
                    )}

                    {linuxActiveApp === 'files' && (
                      <div className="flex-1 bg-[#181122]/95 border border-[#E95420]/40 rounded-xl p-3 flex flex-col overflow-hidden">
                        <h3 className="text-xs font-bold text-white mb-2">Nautilus — /mnt/mastercloud_10tb/MasterCloud_OS_Images</h3>
                        <div className="space-y-1.5 text-xs text-slate-300 overflow-y-auto">
                          <p>📁 Windows_11_Enterprise_24H2_Official_x64.iso (6.5 GB)</p>
                          <p>📁 macOS_Sequoia_15.1_Apple_Silicon_OpenCore.dmg (15 GB)</p>
                          <p>📁 ubuntu-24.04.1-desktop-amd64_Official.iso (5.9 GB)</p>
                          <p>📁 android-15-aosp-pixel-x86_64_Official.iso (2.9 GB)</p>
                        </div>
                      </div>
                    )}

                    {linuxActiveApp === 'htop' && (
                      <div className="flex-1 bg-black/95 border border-[#E95420]/40 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1">
                        <div className="text-white font-bold pb-1 border-b border-white/10">HTOP Cloud Cluster Load Monitor</div>
                        <div>CPU [||||||||||||||||||||||||||||||||                32.1%] 32 Cores @ 5.8 GHz</div>
                        <div>MEM [||||||||||||||                                  48.2G/144G] DDR5-6400</div>
                        <div>VRM [||||||||||||||||||||||||||||||||||||||||||||||  184G/200G] HBM3e Fabric</div>
                        <div>SWP [                                                  0K/50G] (0% Lap Disk Strain)</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* 4. REAL OFFICIAL GOOGLE ANDROID 15 (AOSP) VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'android') && (
            <div className="rounded-2xl border border-emerald-500/30 bg-[#070c17] flex flex-col overflow-hidden shadow-2xl relative group">
              {/* Header */}
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
                  {/* Status Bar with Punch hole */}
                  <div className="px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-300 z-30">
                    <span className="font-bold">19:52</span>
                    <div className="w-2.5 h-2.5 rounded-full bg-black border border-white/20" />
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[9px] text-emerald-400">5G</span>
                      <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Android Screen Display */}
                  <div className="flex-1 px-3 py-2 flex flex-col justify-between overflow-hidden">
                    {androidActiveApp === 'home' && (
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="pt-2 text-center">
                          <span className="text-xs font-semibold text-white">Mon, Nov 2 · 28°C ☀️</span>
                        </div>

                        <div className="grid grid-cols-4 gap-3 text-center my-auto">
                          <div
                            onClick={() => setAndroidActiveApp('files')}
                            className="p-1.5 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center"
                          >
                            <HardDrive className="w-7 h-7 text-blue-400" />
                            <span className="text-[9px] text-white mt-1 font-semibold truncate w-full">Master Cloud</span>
                          </div>
                          <div
                            onClick={() => setAndroidActiveApp('termux')}
                            className="p-1.5 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center"
                          >
                            <TerminalIcon className="w-7 h-7 text-emerald-400" />
                            <span className="text-[9px] text-white mt-1 font-semibold truncate w-full">Termux</span>
                          </div>
                          <div
                            onClick={() => setAndroidActiveApp('playstore')}
                            className="p-1.5 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center"
                          >
                            <ShoppingBag className="w-7 h-7 text-pink-400" />
                            <span className="text-[9px] text-white mt-1 font-semibold truncate w-full">Play Store</span>
                          </div>
                          <div
                            onClick={() => setAndroidActiveApp('settings')}
                            className="p-1.5 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center"
                          >
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
                    )}

                    {androidActiveApp === 'files' && (
                      <div className="flex-1 bg-[#102219] rounded-2xl p-2.5 flex flex-col overflow-hidden">
                        <h4 className="text-xs font-bold text-white mb-1.5">Master Cloud 10 TB Storage</h4>
                        <div className="space-y-1.5 overflow-y-auto flex-1 text-[10px]">
                          <div className="p-2 rounded-xl bg-white/5">
                            <p className="font-semibold text-white">📁 MasterCloud_OS_Images</p>
                            <p className="text-slate-400">4 Official ISO Files (Mounted)</p>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5">
                            <p className="font-semibold text-white">📁 Work Documents</p>
                            <p className="text-slate-400">10.0 TB Free Cloud Quota</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {androidActiveApp === 'termux' && (
                      <div className="flex-1 bg-black rounded-2xl p-2 font-mono text-[10px] text-emerald-400 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto space-y-0.5">
                          {androidTermLogs.map((l, idx) => (
                            <div key={idx}>{l}</div>
                          ))}
                        </div>
                        <form onSubmit={handleAndroidCmd} className="pt-1 flex items-center gap-1 border-t border-white/10">
                          <span className="text-blue-400">&gt;</span>
                          <input
                            type="text"
                            value={androidTermInput}
                            onChange={(e) => setAndroidTermInput(e.target.value)}
                            placeholder="uname, df, ls..."
                            className="flex-1 bg-transparent border-none text-[10px] text-white focus:outline-none"
                          />
                        </form>
                      </div>
                    )}

                    {androidActiveApp === 'playstore' && (
                      <div className="flex-1 bg-[#10241b] rounded-2xl p-2.5 flex flex-col justify-between overflow-hidden">
                        <h4 className="text-xs font-bold text-white mb-2">Google Play Store (Android 15)</h4>
                        <div className="space-y-2 flex-1 overflow-y-auto">
                          <div className="p-2 rounded-xl bg-white/5 flex items-center justify-between">
                            <div className="text-[10px]">
                              <p className="font-bold text-white">PUBG Mobile 3D</p>
                              <p className="text-slate-400">Vulkan 1.3 Acceleration</p>
                            </div>
                            <Button size="sm" className="h-6 text-[10px] bg-emerald-600 font-bold">Install</Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {androidActiveApp === 'settings' && (
                      <div className="flex-1 bg-[#10241b] rounded-2xl p-2.5 text-xs text-white overflow-y-auto space-y-2">
                        <h4 className="font-bold pb-1 border-b border-white/10">About Phone</h4>
                        <div className="text-[11px] space-y-1 text-slate-300">
                          <p><span className="text-slate-400">Model:</span> Google Pixel 9 Pro (AOSP Matrix)</p>
                          <p><span className="text-slate-400">OS Version:</span> Android 15 (Vanilla Ice Cream)</p>
                          <p><span className="text-slate-400">Kernel:</span> 6.6.45-android15</p>
                          <p><span className="text-slate-400">Storage:</span> 10.0 TB Master Cloud Mounted</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Android 3-Button Navigation Bar */}
                  <div className="h-8 bg-black/80 flex items-center justify-around px-6 z-30">
                    <button onClick={() => setAndroidActiveApp('home')} className="p-1 hover:text-emerald-400 text-slate-300">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setAndroidActiveApp('home')} className="p-1 hover:text-emerald-400 text-slate-300">
                      <Circle className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toast.info('Recents: Master Cloud, Termux')} className="p-1 hover:text-emerald-400 text-slate-300">
                      <Square className="w-3.5 h-3.5" />
                    </button>
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
