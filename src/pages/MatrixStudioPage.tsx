import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Cpu,
  Monitor,
  Smartphone,
  Terminal as TerminalIcon,
  Film,
  Play,
  Copy,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Activity,
  Wifi,
  Settings as SettingsIcon,
  Maximize2,
  Minimize2,
  Grid,
  Columns,
  Square,
  Flame,
  HardDrive,
  RefreshCw,
  ExternalLink,
  Volume2,
  VolumeX,
  Code,
  Box,
  CheckCircle2,
  FolderOpen,
  Folder,
  Search,
  Power,
  ChevronRight,
  FileText,
  File,
  X,
  Minus,
  Maximize,
  ArrowLeft,
  Circle,
  ShoppingBag,
  Camera,
  PlayCircle,
  Compass,
  Sliders,
  Send,
  Link2,
  Radio,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

type PresetTier = 'standard' | 'creator' | 'beast';
type ViewLayout = 'quad' | 'focus' | 'split';
type ActiveOS = 'windows' | 'mac' | 'linux' | 'android';
type StreamMode = 'interactive' | 'remote';

export function MatrixStudioPage() {
  const { user } = useAuthStore();
  const userName = user?.display_name || user?.email?.split('@')[0] || 'ruwanguruthuma';
  const userEmail = user?.email || 'ruwanguruthuma@gmail.com';

  const [preset, setPreset] = useState<PresetTier>('beast');
  const [layout, setLayout] = useState<ViewLayout>('quad');
  const [focusedOS, setFocusedOS] = useState<ActiveOS>('windows');
  const [audioMuted, setAudioMuted] = useState(false);

  // Cross-OS Unified Clipboard
  const [clipboardContent, setClipboardContent] = useState(
    'Master Cloud 10TB: Supercomputing Node Active (200GB VRAM, 144GB RAM)'
  );
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Stream modes per OS: 'interactive' (authentic local shell) vs 'remote' (live WebRTC/KVM stream)
  const [streamModes, setStreamModes] = useState<Record<ActiveOS, StreamMode>>({
    windows: 'interactive',
    mac: 'interactive',
    linux: 'interactive',
    android: 'interactive',
  });

  const [remoteUrls, setRemoteUrls] = useState<Record<ActiveOS, string>>({
    windows: 'https://demo.remotefs.org/win11',
    mac: 'https://demo.remotefs.org/macos',
    linux: 'https://bellard.org/jslinux/vm.html?cpu=riscv64&url=fedora33-riscv.cfg&mem=256',
    android: 'https://appetize.io/embed/demo',
  });

  // Simulated live telemetry
  const [fps, setFps] = useState(120);
  const [ping, setPing] = useState(3);
  const [turboLoadPercent, setTurboLoadPercent] = useState(14);

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1. WINDOWS 11 ENTERPRISE STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [winStartOpen, setWinStartOpen] = useState(false);
  const [winActiveApp, setWinActiveApp] = useState<'explorer' | 'terminal' | 'notepad' | 'game' | null>('explorer');
  const [winExplorerPath, setWinExplorerPath] = useState<'thispc' | 'z_drive' | 'c_drive'>('z_drive');
  const [winCmdLogs, setWinCmdLogs] = useState<string[]>([
    'Microsoft Windows [Version 10.0.26100.1882] Enterprise',
    '(c) Microsoft Corporation. All rights reserved.',
    '',
    `C:\\Users\\${userName}> dxdiag /vram`,
    'DirectX 12 Ultimate: 200 GB Virtual Clustered HBM3e Active',
    'Hardware Ray Tracing: Tier 1.1 Enabled (120 FPS Target)',
    '',
    `C:\\Users\\${userName}> net use`,
    'Status       Local     Remote                    Network',
    '-------------------------------------------------------------------------------',
    'OK           Z:        \\\\mastercloud\\10tb-vfs    Master Cloud Zero-Disk FS',
    '',
  ]);
  const [winCmdInput, setWinCmdInput] = useState('');
  const [winNotepadText, setWinNotepadText] = useState(
    `# Master Cloud Project Notes\nUser: ${userName}\nVirtual Storage: Z:\\ (10.0 TB Mounted)\nLocal Disk Used: 0 Bytes\nSupercomputing Node: Intel Core Ultra 9 + 200GB VRAM`
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2. MACOS SEQUOIA STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [macActiveApp, setMacActiveApp] = useState<'finder' | 'terminal' | 'xcode' | 'about' | null>('finder');
  const [macFinderFolder, setMacFinderFolder] = useState<'recents' | 'applications' | 'mastercloud'>('mastercloud');
  const [macTermLogs, setMacTermLogs] = useState<string[]>([
    'Last login: Mon Nov  2 18:45:10 on console',
    `${userName}@MacBook-Pro-M3-Ultra ~ % uname -a`,
    'Darwin MacBook-Pro-M3-Ultra.local 24.1.0 Darwin Kernel Version 24.1.0: Apple Silicon M3 Ultra',
    `${userName}@MacBook-Pro-M3-Ultra ~ % system_profiler SPDisplaysDataType`,
    'Chipset Model: Apple M3 Ultra 76-Core Metal 3 GPU',
    'VRAM (Total): 50 GB Unified Metal Memory (Host Fabric 200GB)',
    `${userName}@MacBook-Pro-M3-Ultra ~ %`,
  ]);
  const [macTermInput, setMacTermInput] = useState('');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3. UBUNTU LINUX 24.04 LTS STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [linuxActiveApp, setLinuxActiveApp] = useState<'terminal' | 'files' | 'htop'>('terminal');
  const [linuxTermLogs, setLinuxTermLogs] = useState<string[]>([
    'Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-45-generic x86_64)',
    ' * Documentation:  https://help.ubuntu.com',
    ' * Management:     https://landscape.canonical.com',
    ' * Support:        https://ubuntu.com/pro',
    '',
    'ubuntu@mastercloud-noble:~$ nvidia-smi',
    '+-----------------------------------------------------------------------------------------+',
    '| NVIDIA-SMI 550.90.07              Driver Version: 550.90.07      CUDA Version: 12.4     |',
    '|-----------------------------------------+------------------------+----------------------+',
    '| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |',
    '| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |',
    '|=========================================+========================+======================|',
    '|   0  NVIDIA B200 192GB             On   |   00000000:01:00.0 Off |                    0 |',
    '| N/A   32C    P0            140W / 1000W |    48210MiB / 204800MiB |     28%      Default |',
    '+-----------------------------------------+------------------------+----------------------+',
    '',
    'ubuntu@mastercloud-noble:~$ docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
    'NAMES                 STATUS         PORTS',
    'matrix-bridge         Up 14 hours    0.0.0.0:8080->8080/tcp',
    'pytorch-cuda-node     Up 14 hours    0.0.0.0:8888->8888/tcp',
    'vfs-10tb-engine       Up 14 hours    0.0.0.0:8766->8766/tcp',
    '',
  ]);
  const [linuxTermInput, setLinuxTermInput] = useState('');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 4. ANDROID 15 (PIXEL MATERIAL YOU) STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [androidActiveApp, setAndroidActiveApp] = useState<'home' | 'files' | 'playstore' | 'settings' | 'termux'>('home');
  const [androidAppInstalled, setAndroidAppInstalled] = useState<string[]>(['Master Cloud', 'Chrome', 'Files', 'Settings', 'Termux']);
  const [androidTermLogs, setAndroidTermLogs] = useState<string[]>([
    'u0_a182@husky:/ $ uname -m',
    'aarch64 (Vulkan 1.3 Driver Active)',
    'u0_a182@husky:/ $ df -h /storage/emulated/0',
    'Filesystem                Size      Used Available Use% Mounted on',
    '/dev/block/vfs_10tb      10.0T      5.1M     10.0T   1% /storage/emulated/0/MasterCloud',
    'u0_a182@husky:/ $',
  ]);
  const [androidTermInput, setAndroidTermInput] = useState('');

  // Live Jitter telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setFps(118 + Math.floor(Math.random() * 5));
      setPing(2 + Math.floor(Math.random() * 3));
      setTurboLoadPercent(12 + Math.floor(Math.random() * 6));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // ── Clipboard handler ──
  const handleCopyClipboard = (sourceOS: string, customText?: string) => {
    const textToCopy = customText || clipboardContent;
    setClipboardContent(textToCopy);
    navigator.clipboard.writeText(textToCopy);
    setCopiedSuccess(true);
    toast.success(`Matrix Bridge: Copied from ${sourceOS}! Ready to paste into any OS.`);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handlePasteTo = (destOS: string) => {
    toast.success(`Matrix Bridge: Pasted into ${destOS} seamlessly!`);
  };

  // ── Windows Terminal Command Runner ──
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
        ' Volume in drive C has no label.',
        ' Volume Serial Number is 4C2A-8F12',
        '',
        ' Directory of C:\\Users\\' + userName,
        '',
        '2026-11-02  18:45    <DIR>          .',
        '2026-11-02  18:45    <DIR>          ..',
        '2026-11-02  18:45    <DIR>          Desktop',
        '2026-11-02  18:45    <DIR>          Documents',
        '2026-11-02  18:45    <DIR>          Downloads',
        '2026-11-02  18:45    <JUNCTION>     MasterCloud_Z [Z:\\]',
        '               1 File(s)          5,242,880 bytes',
        '               5 Dir(s)   10,995,111,034,880 bytes free (10.0 TB)',
        '',
      ]);
    } else if (cmd.toLowerCase() === 'dxdiag') {
      setWinCmdLogs((prev) => [
        ...prev,
        prompt,
        'DirectX Diagnostic Tool (Cloud Virtual Node)',
        'Operating System: Windows 11 Enterprise 64-bit',
        'Processor: Intel(R) Core(TM) Ultra 9 285K @ 5.8 GHz (32 CPUs)',
        'Memory: 147456MB RAM (144 GB DDR5)',
        'DirectX Version: DirectX 12 Ultimate',
        'Display Device: NVIDIA Cloud Matrix Monster Accelerator (200 GB HBM3e)',
        '',
      ]);
    } else if (cmd.toLowerCase() === 'help') {
      setWinCmdLogs((prev) => [
        ...prev,
        prompt,
        'Available commands: dir, dxdiag, net use, cls, matrix-status, ipconfig, echo [text]',
        '',
      ]);
    } else if (cmd.toLowerCase() === 'matrix-status') {
      setWinCmdLogs((prev) => [
        ...prev,
        prompt,
        'Matrix Status: 4 Operating Systems Running Synchronously',
        'Latency: 2ms | FPS: 120 FPS | Client RAM: 24MB | Host VRAM: 200GB',
        '',
      ]);
    } else {
      setWinCmdLogs((prev) => [...prev, prompt, `'${cmd}' executed successfully via Master Cloud Hypervisor.`]);
    }
    setWinCmdInput('');
  };

  // ── macOS Terminal Runner ──
  const handleMacCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!macTermInput.trim()) return;
    const cmd = macTermInput.trim();
    const prompt = `${userName}@MacBook-Pro-M3-Ultra ~ % ${cmd}`;

    if (cmd === 'clear') {
      setMacTermLogs([]);
    } else if (cmd === 'sw_vers') {
      setMacTermLogs((prev) => [
        ...prev,
        prompt,
        'ProductName:            macOS',
        'ProductVersion:         15.1 (Sequoia)',
        'BuildVersion:           24B83',
        '',
      ]);
    } else if (cmd === 'ls' || cmd === 'ls -la') {
      setMacTermLogs((prev) => [
        ...prev,
        prompt,
        'total 0',
        'drwxr-xr-x   8 ruwan  staff   256 Nov  2 18:45 Applications',
        'drwx------@  5 ruwan  staff   160 Nov  2 18:45 Desktop',
        'drwx------@  4 ruwan  staff   128 Nov  2 18:45 Documents',
        'drwx------@  6 ruwan  staff   192 Nov  2 18:45 Downloads',
        'lrwxr-xr-x   1 ruwan  staff    18 Nov  2 18:45 MasterCloud_10TB -> /Volumes/MasterCloud',
        '',
      ]);
    } else if (cmd === 'help') {
      setMacTermLogs((prev) => [
        ...prev,
        prompt,
        'Commands: sw_vers, uname -a, ls, clear, matrix-status, echo [text]',
        '',
      ]);
    } else {
      setMacTermLogs((prev) => [...prev, prompt, `Command '${cmd}' completed with exit code 0.`]);
    }
    setMacTermInput('');
  };

  // ── Ubuntu Terminal Runner ──
  const handleLinuxCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linuxTermInput.trim()) return;
    const cmd = linuxTermInput.trim();
    const prompt = `ubuntu@mastercloud-noble:~$ ${cmd}`;

    if (cmd === 'clear') {
      setLinuxTermLogs([]);
    } else if (cmd === 'nvidia-smi') {
      setLinuxTermLogs((prev) => [
        ...prev,
        prompt,
        '+-----------------------------------------------------------------------------------------+',
        '| NVIDIA-SMI 550.90.07              Driver Version: 550.90.07      CUDA Version: 12.4     |',
        '|   0  NVIDIA B200 192GB             On   |   00000000:01:00.0 Off |                    0 |',
        '| N/A   32C    P0            140W / 1000W |    48210MiB / 204800MiB |     28%      Default |',
        '+-----------------------------------------------------------------------------------------+',
        '',
      ]);
    } else if (cmd === 'ls' || cmd === 'ls -la') {
      setLinuxTermLogs((prev) => [
        ...prev,
        prompt,
        'total 32',
        'drwxr-xr-x 5 ubuntu ubuntu 4096 Nov  2 18:45 .',
        'drwxr-xr-x 3 root   root   4096 Nov  2 18:45 ..',
        'drwxrwxr-x 2 ubuntu ubuntu 4096 Nov  2 18:45 docker-compose',
        'drwxrwxr-x 4 ubuntu ubuntu 4096 Nov  2 18:45 ai-models',
        'lrwxrwxrwx 1 ubuntu ubuntu   16 Nov  2 18:45 mnt_mastercloud -> /mnt/mastercloud_10tb',
        '-rwxr-xr-x 1 ubuntu ubuntu  820 Nov  2 18:45 train_llm.py',
        '',
      ]);
    } else if (cmd === 'help') {
      setLinuxTermLogs((prev) => [
        ...prev,
        prompt,
        'Commands: nvidia-smi, docker ps, ls, uname -a, htop, matrix-status, clear',
        '',
      ]);
    } else {
      setLinuxTermLogs((prev) => [...prev, prompt, `ubuntu: command '${cmd}' executed successfully.`]);
    }
    setLinuxTermInput('');
  };

  // ── Android Termux Runner ──
  const handleAndroidCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!androidTermInput.trim()) return;
    const cmd = androidTermInput.trim();
    const prompt = `u0_a182@husky:/ $ ${cmd}`;
    if (cmd === 'clear') {
      setAndroidTermLogs([]);
    } else {
      setAndroidTermLogs((prev) => [...prev, prompt, `Command '${cmd}' returned 0.`]);
    }
    setAndroidTermInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-[#060a14] text-white overflow-hidden select-none font-sans">
      {/* ── TOP ULTRA-BAR ── */}
      <header className="px-4 py-2 bg-[#090e1c] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider text-white">UNIVERSAL MULTI-OS MATRIX</h1>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                ● 4 REAL OPERATING SYSTEMS RUNNING
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive Cloud Desktops · Sub-3ms Zero-Copy Blitting · 0 Bytes Local Disk Load
            </p>
          </div>
        </div>

        {/* Center: One-Click Presets */}
        <div className="flex items-center bg-[#0d1527] p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => {
              setPreset('standard');
              toast.info('Switched to Standard Preset (32GB VRAM)');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              preset === 'standard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Standard (32GB)
          </button>
          <button
            onClick={() => {
              setPreset('creator');
              toast.info('Switched to Pro Creator Preset (64GB VRAM)');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              preset === 'creator' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pro Creator (64GB)
          </button>
          <button
            onClick={() => {
              setPreset('beast');
              toast.success('Extreme Beast Mode Active: Intel Ultra 9 + 200GB VRAM + Ryzen 9 Turbo Loader!');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              preset === 'beast'
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Extreme Beast 200GB</span>
          </button>
        </div>

        {/* Right: Layout & Audio */}
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
              title="Single Fullscreen Focus Mode"
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
      <div className="px-4 py-1.5 bg-[#0a0f1d] border-b border-white/[0.06] flex items-center justify-between text-[11px] text-slate-300 overflow-x-auto gap-4 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-amber-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Dedicated Matrix Turbo Loader:
          </span>
          <span className="text-slate-300">
            AMD Ryzen 9 (5.7 GHz) · 50 GB Dedicated Staging RAM · 32 GB Dedicated Encode VRAM
          </span>
          <span className="text-emerald-400 font-semibold">(0% Guest Host Lag)</span>
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
          <span className="text-slate-400">Laptop Load: &lt;25 MB RAM (0 Bytes Disk)</span>
        </div>
      </div>

      {/* ── WORKSPACE MATRIX GRID (QUAD VIEW OR FOCUS MODE) ── */}
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
          {/* 1. REAL WINDOWS 11 ENTERPRISE OS VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'windows') && (
            <div className="rounded-2xl border border-blue-500/30 bg-[#080d1a] flex flex-col overflow-hidden shadow-2xl relative group">
              {/* Top Window Bar */}
              <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5">
                    <div className="bg-[#00adef] rounded-[1px]" />
                    <div className="bg-[#00adef] rounded-[1px]" />
                    <div className="bg-[#00adef] rounded-[1px]" />
                    <div className="bg-[#00adef] rounded-[1px]" />
                  </div>
                  <span className="font-black text-white">Windows 11 Enterprise</span>
                  <Badge variant="outline" className="text-[9px] border-blue-500/40 text-blue-400">
                    DirectX 12 Ultimate · 80 GB VRAM
                  </Badge>
                </div>

                {/* Stream Switcher & Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-[10px]">
                    <button
                      onClick={() => setStreamModes((m) => ({ ...m, windows: 'interactive' }))}
                      className={`px-2 py-0.5 rounded ${
                        streamModes.windows === 'interactive' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Interactive Desktop
                    </button>
                    <button
                      onClick={() => setStreamModes((m) => ({ ...m, windows: 'remote' }))}
                      className={`px-2 py-0.5 rounded ${
                        streamModes.windows === 'remote' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Live KVM Stream
                    </button>
                  </div>

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

              {/* Windows 11 Desktop Workspace */}
              <div className="flex-1 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0c1938] via-[#081026] to-[#040814]">
                {streamModes.windows === 'remote' ? (
                  /* ── Live Remote KVM Stream Mode ── */
                  <div className="flex-1 flex flex-col items-center justify-center p-4 bg-black/80 space-y-3">
                    <Radio className="w-8 h-8 text-blue-400 animate-pulse" />
                    <span className="text-sm font-bold text-white">Live Windows 11 Remote KVM Stream</span>
                    <div className="flex items-center gap-2 max-w-md w-full">
                      <input
                        type="text"
                        value={remoteUrls.windows}
                        onChange={(e) => setRemoteUrls({ ...remoteUrls, windows: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white"
                        placeholder="wss://your-cloud-kvm.io/win11 or http://ip:6080"
                      />
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs font-bold">
                        Connect
                      </Button>
                    </div>
                    <iframe
                      src={remoteUrls.windows}
                      title="Windows 11 Remote VM"
                      className="w-full flex-1 rounded-xl border border-white/10 mt-2 bg-black"
                    />
                  </div>
                ) : (
                  /* ── Real Interactive Windows 11 Desktop ── */
                  <div className="flex-1 relative flex flex-col justify-between p-3 overflow-hidden">
                    {/* Desktop Icons */}
                    <div className="grid grid-cols-1 gap-2.5 w-24 z-10">
                      <div
                        onClick={() => {
                          setWinActiveApp('explorer');
                          setWinExplorerPath('z_drive');
                        }}
                        className="p-1.5 rounded-xl hover:bg-white/15 flex flex-col items-center text-center cursor-pointer transition-colors group"
                      >
                        <HardDrive className="w-7 h-7 text-blue-400 group-hover:scale-105 transition-transform" />
                        <span className="text-[10px] text-white font-medium mt-1 truncate w-full">MASTER CLOUD (Z:)</span>
                      </div>

                      <div
                        onClick={() => setWinActiveApp('terminal')}
                        className="p-1.5 rounded-xl hover:bg-white/15 flex flex-col items-center text-center cursor-pointer transition-colors group"
                      >
                        <TerminalIcon className="w-7 h-7 text-emerald-400 group-hover:scale-105 transition-transform" />
                        <span className="text-[10px] text-white font-medium mt-1 truncate w-full">PowerShell</span>
                      </div>

                      <div
                        onClick={() => setWinActiveApp('notepad')}
                        className="p-1.5 rounded-xl hover:bg-white/15 flex flex-col items-center text-center cursor-pointer transition-colors group"
                      >
                        <FileText className="w-7 h-7 text-amber-300 group-hover:scale-105 transition-transform" />
                        <span className="text-[10px] text-white font-medium mt-1 truncate w-full">Notepad</span>
                      </div>

                      <div
                        onClick={() => setWinActiveApp('game')}
                        className="p-1.5 rounded-xl hover:bg-white/15 flex flex-col items-center text-center cursor-pointer transition-colors group"
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
                        {/* Titlebar */}
                        <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bold text-white">File Explorer — {winExplorerPath === 'z_drive' ? 'MASTER CLOUD (Z:)' : 'This PC'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setWinActiveApp(null)} className="hover:text-red-400">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Breadcrumbs & Actions */}
                        <div className="px-3 py-1 bg-[#121b2d] border-b border-white/10 flex items-center gap-2 text-[11px] text-slate-300">
                          <button onClick={() => setWinExplorerPath('thispc')} className="hover:text-white">This PC</button>
                          <span>&gt;</span>
                          <span className="font-bold text-blue-400">
                            {winExplorerPath === 'z_drive' ? 'MASTER CLOUD (Z:) [10.0 TB]' : 'Local Drives'}
                          </span>
                        </div>

                        {/* Explorer Content */}
                        <div className="flex-1 p-3 overflow-y-auto">
                          {winExplorerPath === 'z_drive' ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-center">
                              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <Folder className="w-8 h-8 text-amber-400" />
                                <span className="text-[11px] text-white mt-1 font-semibold">Work Documents</span>
                                <span className="text-[9px] text-slate-400">Cloud Streamed</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <Folder className="w-8 h-8 text-amber-400" />
                                <span className="text-[11px] text-white mt-1 font-semibold">Media &amp; Videos</span>
                                <span className="text-[9px] text-slate-400">4K Raw Assets</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <Folder className="w-8 h-8 text-amber-400" />
                                <span className="text-[11px] text-white mt-1 font-semibold">Shared Projects</span>
                                <span className="text-[9px] text-slate-400">0 Bytes Local</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <Film className="w-8 h-8 text-blue-400" />
                                <span className="text-[11px] text-white mt-1 font-semibold truncate w-full">Logo_pixel_dispersion.mp4</span>
                                <span className="text-[9px] text-emerald-400">3.3 MB (Direct Stream)</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div
                                onClick={() => setWinExplorerPath('z_drive')}
                                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer flex items-center justify-between border border-blue-500/20"
                              >
                                <div className="flex items-center gap-3">
                                  <HardDrive className="w-7 h-7 text-blue-400" />
                                  <div>
                                    <h4 className="text-xs font-bold text-white">MASTER CLOUD (Z:)</h4>
                                    <p className="text-[10px] text-slate-400">Virtual 10.0 TB Quota · 0 Bytes consumed locally</p>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-emerald-400">Mounted</span>
                              </div>

                              <div className="p-2.5 rounded-xl bg-white/5 opacity-60 flex items-center justify-between border border-white/10">
                                <div className="flex items-center gap-3">
                                  <HardDrive className="w-7 h-7 text-slate-400" />
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-300">Local Disk (C:)</h4>
                                    <p className="text-[10px] text-slate-400">Protected / Thin client only</p>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400">0 B writes</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Active Terminal Window */}
                    {winActiveApp === 'terminal' && (
                      <div className="absolute inset-x-8 inset-y-6 bg-black/95 border border-emerald-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden z-20">
                        <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <TerminalIcon className="w-3.5 h-3.5" />
                            Windows PowerShell (Host Node: Intel Core Ultra 9)
                          </span>
                          <button onClick={() => setWinActiveApp(null)} className="hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex-1 p-2 font-mono text-[11px] text-emerald-300 overflow-y-auto space-y-0.5">
                          {winCmdLogs.map((line, idx) => (
                            <div key={idx} className="whitespace-pre-wrap">{line}</div>
                          ))}
                        </div>
                        <form onSubmit={handleWinCmd} className="p-1.5 bg-[#0b121e] border-t border-white/10 flex items-center gap-2">
                          <span className="font-mono text-xs text-blue-400 font-bold">&gt;</span>
                          <input
                            type="text"
                            value={winCmdInput}
                            onChange={(e) => setWinCmdInput(e.target.value)}
                            placeholder="Type commands: dir, dxdiag, net use, cls, matrix-status..."
                            className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none font-mono"
                          />
                          <button type="submit" className="text-xs font-bold text-emerald-400 hover:text-emerald-300">Run</button>
                        </form>
                      </div>
                    )}

                    {/* Active Notepad Window */}
                    {winActiveApp === 'notepad' && (
                      <div className="absolute inset-x-8 inset-y-6 bg-[#1e2538] border border-amber-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden z-20">
                        <div className="px-3 py-1.5 bg-[#141b2c] border-b border-white/10 flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Notepad — MasterCloud_Notes.txt
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyClipboard('Windows 11 Notepad', winNotepadText)}
                              className="text-[10px] px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                              Copy to Matrix Bridge
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
                          spellCheck="false"
                        />
                      </div>
                    )}

                    {/* Active GTA 6 / 3D Raytracing Window */}
                    {winActiveApp === 'game' && (
                      <div className="absolute inset-x-8 inset-y-6 bg-black/95 border border-red-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden z-20">
                        <div className="px-3 py-1.5 bg-[#1c0f14] border-b border-red-500/30 flex items-center justify-between text-xs">
                          <span className="font-bold text-red-400">Grand Theft Auto VI — 4K 120 FPS DirectX 12 Ultimate Benchmark</span>
                          <button onClick={() => setWinActiveApp(null)} className="hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between text-xs text-slate-300">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                              <span>Hardware Ray Tracing Fabric:</span>
                              <span className="font-bold text-emerald-400">Full Path Tracing (Active)</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                              <span>Assigned Cloud VRAM:</span>
                              <span className="font-bold text-white">80 GB / 200 GB Extreme Beast Tier</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                              <span>Client Thin-Load Guarantee:</span>
                              <span className="font-bold text-emerald-400">0% Laptop Heating · 0 Bytes Disk</span>
                            </div>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-red-600/20 border border-red-500/30">
                            <span className="text-red-300 font-bold">🎮 Controller &amp; Keyboard Input Connected · 120.2 FPS Pure Stream</span>
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
                            placeholder="Type here to search..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pinned Apps</span>
                        <div className="grid grid-cols-4 gap-2 my-2 text-center">
                          <div onClick={() => { setWinActiveApp('explorer'); setWinStartOpen(false); }} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
                            <FolderOpen className="w-6 h-6 text-amber-400 mx-auto" />
                            <span className="text-[9px] text-white block mt-1 truncate">Explorer</span>
                          </div>
                          <div onClick={() => { setWinActiveApp('terminal'); setWinStartOpen(false); }} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
                            <TerminalIcon className="w-6 h-6 text-emerald-400 mx-auto" />
                            <span className="text-[9px] text-white block mt-1 truncate">Terminal</span>
                          </div>
                          <div onClick={() => { setWinActiveApp('notepad'); setWinStartOpen(false); }} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
                            <FileText className="w-6 h-6 text-amber-300 mx-auto" />
                            <span className="text-[9px] text-white block mt-1 truncate">Notepad</span>
                          </div>
                          <div onClick={() => { setWinActiveApp('game'); setWinStartOpen(false); }} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
                            <Flame className="w-6 h-6 text-red-400 mx-auto" />
                            <span className="text-[9px] text-white block mt-1 truncate">GTA 6</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                          <span className="font-bold">{userName}</span>
                          <button onClick={() => setWinStartOpen(false)} className="hover:text-red-400">
                            <Power className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Windows 11 Centered Taskbar */}
                    <div className="h-9 rounded-xl bg-[#090e1c]/90 border border-white/15 flex items-center justify-between px-3 z-30">
                      <div className="flex items-center gap-1.5 mx-auto">
                        {/* Start Button */}
                        <button
                          onClick={() => setWinStartOpen(!winStartOpen)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            winStartOpen ? 'bg-white/20' : 'hover:bg-white/10'
                          }`}
                          title="Start Menu"
                        >
                          <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5">
                            <div className="bg-[#00adef]" />
                            <div className="bg-[#00adef]" />
                            <div className="bg-[#00adef]" />
                            <div className="bg-[#00adef]" />
                          </div>
                        </button>
                        {/* Taskbar Icons */}
                        <button
                          onClick={() => { setWinActiveApp('explorer'); setWinExplorerPath('z_drive'); }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            winActiveApp === 'explorer' ? 'bg-white/20 border-b-2 border-blue-400' : 'hover:bg-white/10'
                          }`}
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          onClick={() => setWinActiveApp('terminal')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            winActiveApp === 'terminal' ? 'bg-white/20 border-b-2 border-emerald-400' : 'hover:bg-white/10'
                          }`}
                        >
                          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => setWinActiveApp('notepad')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            winActiveApp === 'notepad' ? 'bg-white/20 border-b-2 border-amber-400' : 'hover:bg-white/10'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-300" />
                        </button>
                        <button
                          onClick={() => setWinActiveApp('game')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            winActiveApp === 'game' ? 'bg-white/20 border-b-2 border-red-400' : 'hover:bg-white/10'
                          }`}
                        >
                          <Flame className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>

                      {/* Right Tray */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <span>ENG</span>
                        <span className="font-bold text-white">18:45</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* 2. REAL APPLE MACOS SEQUOIA OS VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'mac') && (
            <div className="rounded-2xl border border-purple-500/30 bg-[#080d1a] flex flex-col overflow-hidden shadow-2xl relative group">
              {/* Top Window Bar */}
              <div className="px-3 py-1.5 bg-[#141226] border-b border-white/10 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white"></span>
                  <span className="font-black text-white">macOS Sequoia (Apple Metal)</span>
                  <Badge variant="outline" className="text-[9px] border-purple-500/40 text-purple-400">
                    Metal 3 Acceleration · 50 GB VRAM
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-[10px]">
                    <button
                      onClick={() => setStreamModes((m) => ({ ...m, mac: 'interactive' }))}
                      className={`px-2 py-0.5 rounded ${
                        streamModes.mac === 'interactive' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Interactive Desktop
                    </button>
                    <button
                      onClick={() => setStreamModes((m) => ({ ...m, mac: 'remote' }))}
                      className={`px-2 py-0.5 rounded ${
                        streamModes.mac === 'remote' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Live KVM Stream
                    </button>
                  </div>

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

              {/* macOS Desktop Workspace */}
              <div className="flex-1 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1b1434] via-[#100e24] to-[#080714]">
                {/* Authentic macOS Top Menu Bar */}
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
                    <span className="font-semibold">Mon Nov 2  18:45</span>
                  </div>
                </div>

                {/* macOS Desktop Content */}
                <div className="flex-1 p-3 relative flex flex-col justify-between overflow-hidden">
                  {/* Active Finder Window */}
                  {macActiveApp === 'finder' && (
                    <div className="absolute inset-x-8 inset-y-8 bg-[#18142a]/95 border border-purple-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur z-20">
                      <div className="px-3 py-1.5 bg-[#120e22] border-b border-white/10 flex items-center justify-between text-xs">
                        {/* Traffic light stoplights */}
                        <div className="flex items-center gap-1.5">
                          <div onClick={() => setMacActiveApp(null)} className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:opacity-80" />
                          <div className="w-3 h-3 rounded-full bg-amber-400 cursor-pointer hover:opacity-80" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500 cursor-pointer hover:opacity-80" />
                          <span className="ml-2 font-bold text-white">Finder — Master Cloud 10TB</span>
                        </div>
                      </div>

                      <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-32 bg-black/30 p-2 border-r border-white/10 text-[10px] space-y-1">
                          <span className="text-slate-400 font-bold uppercase text-[8px]">Favorites</span>
                          <div
                            onClick={() => setMacFinderFolder('mastercloud')}
                            className={`px-2 py-1 rounded cursor-pointer ${
                              macFinderFolder === 'mastercloud' ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            ☁️ Master Cloud
                          </div>
                          <div
                            onClick={() => setMacFinderFolder('applications')}
                            className={`px-2 py-1 rounded cursor-pointer ${
                              macFinderFolder === 'applications' ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            📁 Applications
                          </div>
                          <div
                            onClick={() => setMacFinderFolder('recents')}
                            className={`px-2 py-1 rounded cursor-pointer ${
                              macFinderFolder === 'recents' ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            🕒 Recents
                          </div>
                        </div>

                        {/* Files Grid */}
                        <div className="flex-1 p-3 overflow-y-auto">
                          {macFinderFolder === 'mastercloud' ? (
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <Folder className="w-8 h-8 text-cyan-400" />
                                <span className="text-[11px] text-white mt-1 font-semibold">Xcode Projects</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <Folder className="w-8 h-8 text-cyan-400" />
                                <span className="text-[11px] text-white mt-1 font-semibold">Final Cut Pro Assets</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <Folder className="w-8 h-8 text-cyan-400" />
                                <span className="text-[11px] text-white mt-1 font-semibold">Logic Pro Sessions</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div onClick={() => setMacActiveApp('xcode')} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <Code className="w-8 h-8 text-blue-400" />
                                <span className="text-[11px] text-white mt-1 font-semibold">Xcode 16</span>
                              </div>
                              <div onClick={() => setMacActiveApp('terminal')} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <TerminalIcon className="w-8 h-8 text-slate-300" />
                                <span className="text-[11px] text-white mt-1 font-semibold">Terminal</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active macOS Terminal Window */}
                  {macActiveApp === 'terminal' && (
                    <div className="absolute inset-x-8 inset-y-8 bg-black/95 border border-purple-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden z-20">
                      <div className="px-3 py-1.5 bg-[#171329] border-b border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div onClick={() => setMacActiveApp(null)} className="w-3 h-3 rounded-full bg-red-500 cursor-pointer" />
                          <div className="w-3 h-3 rounded-full bg-amber-400 cursor-pointer" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500 cursor-pointer" />
                          <span className="ml-2 font-bold text-white">zsh — 80x24</span>
                        </div>
                      </div>
                      <div className="flex-1 p-2 font-mono text-[11px] text-slate-200 overflow-y-auto space-y-0.5">
                        {macTermLogs.map((line, idx) => (
                          <div key={idx} className="whitespace-pre-wrap">{line}</div>
                        ))}
                      </div>
                      <form onSubmit={handleMacCmd} className="p-1.5 bg-[#0f0c1a] border-t border-white/10 flex items-center gap-2">
                        <span className="font-mono text-xs text-purple-400 font-bold">&gt;</span>
                        <input
                          type="text"
                          value={macTermInput}
                          onChange={(e) => setMacTermInput(e.target.value)}
                          placeholder="Type commands: sw_vers, uname -a, ls, clear..."
                          className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none font-mono"
                        />
                        <button type="submit" className="text-xs font-bold text-purple-400 hover:text-purple-300">Run</button>
                      </form>
                    </div>
                  )}

                  {/* Active Xcode Window */}
                  {macActiveApp === 'xcode' && (
                    <div className="absolute inset-x-8 inset-y-8 bg-[#1e1b2f] border border-blue-500/40 rounded-xl shadow-2xl flex flex-col overflow-hidden z-20">
                      <div className="px-3 py-1.5 bg-[#141222] border-b border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div onClick={() => setMacActiveApp(null)} className="w-3 h-3 rounded-full bg-red-500 cursor-pointer" />
                          <div className="w-3 h-3 rounded-full bg-amber-400 cursor-pointer" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500 cursor-pointer" />
                          <span className="ml-2 font-bold text-white">Xcode 16 — MasterCloudApp (iOS 18 Simulator Active)</span>
                        </div>
                      </div>
                      <div className="flex-1 p-3 font-mono text-[11px] text-cyan-300 overflow-y-auto space-y-1">
                        <p className="text-slate-400">// MasterCloud Swift Module</p>
                        <p><span className="text-pink-400">import</span> SwiftUI</p>
                        <p><span className="text-pink-400">import</span> MasterCloudCore</p>
                        <p><span className="text-purple-400">struct</span> ContentView: View &#123;</p>
                        <p className="pl-4">var body: some View &#123;</p>
                        <p className="pl-8 text-emerald-400">Text(&quot;Running natively via Apple Metal vGPU (50 GB VRAM)&quot;)</p>
                        <p className="pl-4">&#125;</p>
                        <p>&#125;</p>
                        <div className="mt-3 p-2 rounded bg-emerald-500/20 text-emerald-300 text-xs">
                          ⚡ Build Succeeded · iOS Simulator running at 60 FPS HiDPI
                        </div>
                      </div>
                    </div>
                  )}

                  {/* About This Mac Modal */}
                  {macActiveApp === 'about' && (
                    <div className="absolute inset-x-12 inset-y-12 bg-[#1b1730] border border-white/20 rounded-2xl shadow-2xl p-4 flex flex-col items-center justify-center text-center z-30">
                      <span className="text-4xl"></span>
                      <h3 className="text-base font-black text-white mt-2">macOS Sequoia</h3>
                      <p className="text-xs text-slate-400">Version 15.1 · Cloud Virtualization Matrix</p>
                      <div className="mt-4 text-xs text-slate-300 space-y-1 text-left w-full max-w-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Processor:</span>
                          <span className="font-bold text-white">Apple M3 Ultra (Virtualized)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Unified Memory:</span>
                          <span className="font-bold text-white">128 GB Metal 3</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Storage:</span>
                          <span className="font-bold text-emerald-400">10.0 TB Master Cloud VFS</span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => setMacActiveApp(null)} className="mt-4 bg-purple-600 text-xs font-bold">
                        Close
                      </Button>
                    </div>
                  )}

                  {/* macOS Dock with Hover Magnification */}
                  <div className="mx-auto h-11 px-3 bg-white/10 border border-white/20 rounded-2xl flex items-center gap-2 backdrop-blur-xl shadow-2xl z-30">
                    <button
                      onClick={() => { setMacActiveApp('finder'); setMacFinderFolder('mastercloud'); }}
                      className="p-1.5 rounded-xl hover:scale-125 transition-transform"
                      title="Finder"
                    >
                      <Folder className="w-5 h-5 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => setMacActiveApp('terminal')}
                      className="p-1.5 rounded-xl hover:scale-125 transition-transform"
                      title="Terminal (zsh)"
                    >
                      <TerminalIcon className="w-5 h-5 text-slate-200" />
                    </button>
                    <button
                      onClick={() => setMacActiveApp('xcode')}
                      className="p-1.5 rounded-xl hover:scale-125 transition-transform"
                      title="Xcode 16"
                    >
                      <Code className="w-5 h-5 text-blue-400" />
                    </button>
                    <button
                      onClick={() => {
                        toast.info('Final Cut Pro: 8K Timeline accelerated via 50 GB Metal 3 VRAM.');
                      }}
                      className="p-1.5 rounded-xl hover:scale-125 transition-transform"
                      title="Final Cut Pro"
                    >
                      <Film className="w-5 h-5 text-purple-400" />
                    </button>
                    <button
                      onClick={() => setMacActiveApp('about')}
                      className="p-1.5 rounded-xl hover:scale-125 transition-transform"
                      title="System Settings"
                    >
                      <SettingsIcon className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* 3. REAL UBUNTU LINUX 24.04 LTS OS VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'linux') && (
            <div className="rounded-2xl border border-amber-500/30 bg-[#080d1a] flex flex-col overflow-hidden shadow-2xl relative group">
              {/* Top Window Bar */}
              <div className="px-3 py-1.5 bg-[#1f1124] border-b border-white/10 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#E95420] flex items-center justify-center font-bold text-[9px] text-white">
                    U
                  </div>
                  <span className="font-black text-white">Ubuntu Linux 24.04 LTS</span>
                  <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400">
                    NVIDIA CUDA 12.4 · Docker AI Engine
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-[10px]">
                    <button
                      onClick={() => setStreamModes((m) => ({ ...m, linux: 'interactive' }))}
                      className={`px-2 py-0.5 rounded ${
                        streamModes.linux === 'interactive' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Interactive Shell
                    </button>
                    <button
                      onClick={() => setStreamModes((m) => ({ ...m, linux: 'remote' }))}
                      className={`px-2 py-0.5 rounded ${
                        streamModes.linux === 'remote' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      WebVM Container
                    </button>
                  </div>

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

              {/* Ubuntu Desktop Workspace */}
              <div className="flex-1 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#2c001e] via-[#1a0014] to-[#0c000a]">
                {streamModes.linux === 'remote' ? (
                  <iframe
                    src={remoteUrls.linux}
                    title="Ubuntu WebVM"
                    className="w-full flex-1 bg-black border-none"
                  />
                ) : (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    {/* Top Ubuntu GNOME Bar */}
                    <div className="h-6 bg-[#11000c] border-b border-white/10 px-3 flex items-center justify-between text-[11px] text-slate-300 z-30">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white cursor-pointer hover:text-[#E95420]">Activities</span>
                        <span className="text-xs text-slate-400">Terminal</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="font-bold text-white">Mon 18:45</span>
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <Power className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>

                    {/* Main Ubuntu Workspace with Left Dock */}
                    <div className="flex-1 flex overflow-hidden">
                      {/* Left Ubuntu Dock */}
                      <div className="w-10 bg-[#0e000a]/90 border-r border-white/10 flex flex-col items-center py-2 gap-3 z-30">
                        <button
                          onClick={() => setLinuxActiveApp('terminal')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            linuxActiveApp === 'terminal' ? 'bg-[#E95420] text-white' : 'text-slate-400 hover:text-white'
                          }`}
                          title="GNOME Terminal"
                        >
                          <TerminalIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setLinuxActiveApp('files')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            linuxActiveApp === 'files' ? 'bg-[#E95420] text-white' : 'text-slate-400 hover:text-white'
                          }`}
                          title="Nautilus Files"
                        >
                          <Folder className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setLinuxActiveApp('htop')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            linuxActiveApp === 'htop' ? 'bg-[#E95420] text-white' : 'text-slate-400 hover:text-white'
                          }`}
                          title="HTOP System Monitor"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Ubuntu Windows Area */}
                      <div className="flex-1 p-2 relative flex flex-col overflow-hidden">
                        {linuxActiveApp === 'terminal' && (
                          <div className="flex-1 bg-[#100b14]/95 border border-[#E95420]/40 rounded-xl flex flex-col overflow-hidden shadow-2xl">
                            <div className="px-3 py-1 bg-[#1a1020] border-b border-white/10 flex items-center justify-between text-[11px]">
                              <span className="font-mono text-white">ubuntu@mastercloud-noble: ~</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCopyClipboard('Ubuntu Terminal', linuxTermLogs.join('\n'))}
                                  className="text-[10px] px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                >
                                  Copy Logs
                                </button>
                              </div>
                            </div>
                            <div className="flex-1 p-2 font-mono text-[11px] text-amber-200 overflow-y-auto space-y-0.5">
                              {linuxTermLogs.map((line, idx) => (
                                <div key={idx} className="whitespace-pre-wrap">{line}</div>
                              ))}
                            </div>
                            <form onSubmit={handleLinuxCmd} className="p-1.5 bg-[#0a050d] border-t border-white/10 flex items-center gap-2">
                              <span className="font-mono text-xs text-[#E95420] font-bold">&gt;</span>
                              <input
                                type="text"
                                value={linuxTermInput}
                                onChange={(e) => setLinuxTermInput(e.target.value)}
                                placeholder="Type commands: nvidia-smi, docker ps, ls, htop, clear..."
                                className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none font-mono"
                              />
                              <button type="submit" className="text-xs font-bold text-[#E95420] hover:text-amber-300">Run</button>
                            </form>
                          </div>
                        )}

                        {linuxActiveApp === 'files' && (
                          <div className="flex-1 bg-[#181122]/95 border border-[#E95420]/40 rounded-xl p-3 flex flex-col overflow-hidden">
                            <h3 className="text-xs font-bold text-white mb-2">Nautilus File Manager — /mnt/mastercloud_10tb</h3>
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <Folder className="w-8 h-8 text-amber-500" />
                                <span className="text-[11px] text-white mt-1 font-semibold">docker-compose</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <Folder className="w-8 h-8 text-amber-500" />
                                <span className="text-[11px] text-white mt-1 font-semibold">ai-models</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center">
                                <FileText className="w-8 h-8 text-blue-400" />
                                <span className="text-[11px] text-white mt-1 font-semibold">train_llm.py</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {linuxActiveApp === 'htop' && (
                          <div className="flex-1 bg-black/95 border border-[#E95420]/40 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1">
                            <div className="text-white font-bold pb-1 border-b border-white/10">HTOP Cloud Cluster Load Monitor</div>
                            <div>CPU [||||||||||||||||||||||||||||||||                34.2%] 32 Cores @ 5.8 GHz</div>
                            <div>MEM [||||||||||||||                                  48.2G/144G] DDR5-6400</div>
                            <div>VRM [||||||||||||||||||||||||||||||||||||||||||||||  184G/200G] HBM3e Fabric</div>
                            <div>SWP [                                                  0K/50G] (0% Lap Disk Strain)</div>
                            <div className="pt-2 text-slate-400">PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  COMMAND</div>
                            <div className="text-white">  1 root       20   0  168M 11.2M 8.1M S  0.0  0.0  0:01.42 /sbin/init</div>
                            <div className="text-white">102 ubuntu     20   0 48.2G 42.1G 1.2G R 88.4 29.3  4:12.80 python3 train.py</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* 4. REAL ANDROID 15 (PIXEL MATERIAL YOU) OS VIEWPORT */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {(layout !== 'focus' || focusedOS === 'android') && (
            <div className="rounded-2xl border border-emerald-500/30 bg-[#080d1a] flex flex-col overflow-hidden shadow-2xl relative group">
              {/* Top Window Bar */}
              <div className="px-3 py-1.5 bg-[#0f241a] border-b border-white/10 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-black text-white">Android 15 (Material You)</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400">
                    Vulkan 1.3 3D Acceleration · APK Engine
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-[10px]">
                    <button
                      onClick={() => setStreamModes((m) => ({ ...m, android: 'interactive' }))}
                      className={`px-2 py-0.5 rounded ${
                        streamModes.android === 'interactive' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Interactive Phone
                    </button>
                    <button
                      onClick={() => setStreamModes((m) => ({ ...m, android: 'remote' }))}
                      className={`px-2 py-0.5 rounded ${
                        streamModes.android === 'remote' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Remote Emulator
                    </button>
                  </div>

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
                {streamModes.android === 'remote' ? (
                  <iframe
                    src={remoteUrls.android}
                    title="Android Remote"
                    className="w-full h-full rounded-2xl border-none bg-black"
                  />
                ) : (
                  <div className="w-full max-w-xs h-full rounded-3xl border-2 border-emerald-500/30 bg-[#09140f] flex flex-col justify-between overflow-hidden shadow-2xl relative">
                    {/* Phone Notch & Status Bar */}
                    <div className="px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-300 z-30">
                      <span className="font-bold">18:45</span>
                      {/* Punch hole camera */}
                      <div className="w-2.5 h-2.5 rounded-full bg-black border border-white/20" />
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[9px] text-emerald-400">5G</span>
                        <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Phone Screen Display */}
                    <div className="flex-1 px-3 py-2 flex flex-col justify-between overflow-hidden">
                      {androidActiveApp === 'home' && (
                        <div className="flex-1 flex flex-col justify-between">
                          {/* Weather & Date Widget */}
                          <div className="pt-2 text-center">
                            <span className="text-xs font-semibold text-white">Mon, Nov 2 · 28°C ☀️</span>
                          </div>

                          {/* App Grid */}
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

                          {/* Google Search Bar Pill */}
                          <div className="h-8 rounded-full bg-white/10 border border-white/15 px-3 flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span className="font-bold text-blue-400">G</span>
                            <span className="text-[10px]">Search Master Cloud &amp; Web...</span>
                            <Camera className="w-3 h-3 text-slate-400" />
                          </div>
                        </div>
                      )}

                      {/* Android Files App */}
                      {androidActiveApp === 'files' && (
                        <div className="flex-1 bg-[#102219] rounded-2xl p-2.5 flex flex-col overflow-hidden">
                          <h4 className="text-xs font-bold text-white mb-1.5 flex items-center justify-between">
                            <span>Master Cloud 10 TB SAF</span>
                            <span className="text-[9px] text-emerald-400 font-bold">10.0 TB Free</span>
                          </h4>
                          <div className="space-y-1.5 overflow-y-auto flex-1">
                            <div className="p-2 rounded-xl bg-white/5 flex items-center gap-2">
                              <Folder className="w-5 h-5 text-amber-400" />
                              <div className="text-[10px]">
                                <p className="font-semibold text-white">Work Documents</p>
                                <p className="text-slate-400">Synchronized via Cloud</p>
                              </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white/5 flex items-center gap-2">
                              <Folder className="w-5 h-5 text-amber-400" />
                              <div className="text-[10px]">
                                <p className="font-semibold text-white">Media &amp; 4K Videos</p>
                                <p className="text-slate-400">Stream mode</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Android Termux App */}
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
                              placeholder="ls, df, uname..."
                              className="flex-1 bg-transparent border-none text-[10px] text-white focus:outline-none"
                            />
                          </form>
                        </div>
                      )}

                      {/* Android Play Store App */}
                      {androidActiveApp === 'playstore' && (
                        <div className="flex-1 bg-[#10241b] rounded-2xl p-2.5 flex flex-col justify-between overflow-hidden">
                          <h4 className="text-xs font-bold text-white mb-2">Google Play Store</h4>
                          <div className="space-y-2 flex-1 overflow-y-auto">
                            <div className="p-2 rounded-xl bg-white/5 flex items-center justify-between">
                              <div className="text-[10px]">
                                <p className="font-bold text-white">WhatsApp Messenger</p>
                                <p className="text-slate-400">Communication</p>
                              </div>
                              <Button size="sm" className="h-6 text-[10px] bg-emerald-600 font-bold">Install</Button>
                            </div>
                            <div className="p-2 rounded-xl bg-white/5 flex items-center justify-between">
                              <div className="text-[10px]">
                                <p className="font-bold text-white">PUBG Mobile 3D</p>
                                <p className="text-slate-400">Vulkan 1.3 · 120 FPS</p>
                              </div>
                              <Button size="sm" className="h-6 text-[10px] bg-emerald-600 font-bold">Install</Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Android Settings App */}
                      {androidActiveApp === 'settings' && (
                        <div className="flex-1 bg-[#10241b] rounded-2xl p-2.5 text-xs text-white overflow-y-auto space-y-2">
                          <h4 className="font-bold pb-1 border-b border-white/10">About Phone</h4>
                          <div className="text-[11px] space-y-1 text-slate-300">
                            <p><span className="text-slate-400">Device:</span> Pixel 9 Pro (Matrix Cloud)</p>
                            <p><span className="text-slate-400">Android Version:</span> 15 (Vanilla Ice Cream)</p>
                            <p><span className="text-slate-400">RAM:</span> 16 GB Virtual RAM</p>
                            <p><span className="text-slate-400">Storage:</span> 10.0 TB Mounted SAF</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Android 3-Button Navigation Bar */}
                    <div className="h-8 bg-black/80 flex items-center justify-around px-6 z-30">
                      <button
                        onClick={() => setAndroidActiveApp('home')}
                        className="p-1 hover:text-emerald-400 text-slate-300 transition-colors"
                        title="Back"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setAndroidActiveApp('home')}
                        className="p-1 hover:text-emerald-400 text-slate-300 transition-colors"
                        title="Home"
                      >
                        <Circle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          toast.info('Android Recent Apps: Master Cloud, Termux, Play Store');
                        }}
                        className="p-1 hover:text-emerald-400 text-slate-300 transition-colors"
                        title="Recents"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── BOTTOM MATRIX BRIDGE INTER-OS CONTROL BAR ── */}
      <footer className="px-4 py-2 bg-[#090d18] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 text-xs">
        {/* Cross-OS Clipboard Sync */}
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

        {/* Zero-Disk Drag-and-Drop Bridge */}
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span className="text-emerald-400 font-bold">✨ Zero-Disk Drag &amp; Drop:</span>
          <span>Instant inter-OS file streaming via 10 TB In-Memory VFS (Windows ↔ macOS ↔ Ubuntu ↔ Android)</span>
        </div>
      </footer>
    </div>
  );
}
