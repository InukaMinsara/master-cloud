import React, { useState, useEffect } from 'react';
import {
  Layers,
  Cpu,
  Monitor,
  Smartphone,
  Terminal,
  Film,
  Play,
  Copy,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Activity,
  Wifi,
  Settings,
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
  Code,
  Box,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type PresetTier = 'standard' | 'creator' | 'beast';
type ViewLayout = 'quad' | 'focus' | 'split';
type ActiveOS = 'windows' | 'mac' | 'linux' | 'android';

export function MatrixStudioPage() {
  const [preset, setPreset] = useState<PresetTier>('beast');
  const [layout, setLayout] = useState<ViewLayout>('quad');
  const [focusedOS, setFocusedOS] = useState<ActiveOS>('windows');
  const [audioMuted, setAudioMuted] = useState(false);
  const [clipboardContent, setClipboardContent] = useState('const matrix = new UniversalMultiOSMatrix({ vram: 200, ram: 144 });');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Simulated live telemetry
  const [fps, setFps] = useState(120);
  const [ping, setPing] = useState(3);
  const [turboLoadPercent, setTurboLoadPercent] = useState(14);
  const [activeTab, setActiveTab] = useState<'matrix' | 'telemetry' | 'bridge'>('matrix');

  // Linux simulated interactive terminal
  const [termLogs, setTermLogs] = useState<string[]>([
    'ubuntu@mastercloud-matrix:~$ nvidia-smi --query-gpu=memory.total,memory.used --format=csv',
    'memory.total [MiB], memory.used [MiB]',
    '51200 MiB, 18420 MiB (NVIDIA CUDA 12.4 Active)',
    'ubuntu@mastercloud-matrix:~$ python3 -m torch.distributed.launch train_llm.py --vram 50GB',
    '[PyTorch] Allocated 48.2 GB unified tensor memory on Node 0...',
    '[Docker] 8 containers running: postgres, redis, api-gateway, tensor-engine...',
  ]);
  const [termInput, setTermInput] = useState('');

  // Jitter telemetry slightly for authentic real-time cloud feeling
  useEffect(() => {
    const timer = setInterval(() => {
      setFps(118 + Math.floor(Math.random() * 5));
      setPing(2 + Math.floor(Math.random() * 3));
      setTurboLoadPercent(12 + Math.floor(Math.random() * 6));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleCopyClipboard = (sourceOS: string) => {
    navigator.clipboard.writeText(clipboardContent);
    setCopiedSuccess(true);
    toast.success(`Matrix Bridge: Copied from ${sourceOS}! Ready to paste in any OS.`);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termInput.trim()) return;
    const cmd = termInput.trim();
    setTermLogs((prev) => [...prev, `ubuntu@mastercloud-matrix:~$ ${cmd}`]);
    if (cmd === 'clear') {
      setTermLogs([]);
    } else if (cmd === 'help') {
      setTermLogs((prev) => [...prev, 'Available commands: nvidia-smi, docker ps, uname -a, matrix-status, clear']);
    } else if (cmd === 'matrix-status') {
      setTermLogs((prev) => [
        ...prev,
        '--- Universal Multi-OS Matrix Status ---',
        'Primary Node: Intel Core Ultra 9 @ 5.8 GHz (32 Threads)',
        'Host RAM: 144 GB DDR5-6400 (Allocated: Win 48GB, Mac 40GB, Lnx 40GB, And 16GB)',
        'Host VRAM: 200 GB HBM3e (DirectX 12 / Metal / CUDA / Vulkan)',
        'Turbo Loader: AMD Ryzen 9 + 50 GB RAM + 32 GB Dedicated Encode VRAM (Active)',
        'Client Footprint: 24.6 MB RAM | 1.8% CPU | 0 Bytes Local Disk',
      ]);
    } else {
      setTermLogs((prev) => [...prev, `Executed: ${cmd} (Success in 2.1ms via Master Cloud KVM)`]);
    }
    setTermInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#060913] text-white overflow-hidden select-none font-sans">
      {/* ── TOP CONTROL BAR ── */}
      <header className="px-4 py-2.5 bg-[#090d18]/90 border-b border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Layers className="w-full h-full text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider text-white">UNIVERSAL MULTI-OS MATRIX</h1>
              <Badge className="text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-black border-none shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                232 GB VRAM CLUSTER
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse" />
                Live Cloud Supercomputer
              </span>
              <span>•</span>
              <span>Ping: {ping}ms</span>
              <span>•</span>
              <span>FPS: {fps}</span>
              <span>•</span>
              <span className="text-emerald-400">Client Footprint: 0 Bytes Disk · 25MB RAM</span>
            </div>
          </div>
        </div>

        {/* Center: One-Click Presets */}
        <div className="flex items-center gap-1.5 bg-[#0e1627] p-1 rounded-2xl border border-white/10 shadow-inner">
          <button
            onClick={() => setPreset('standard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              preset === 'standard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Standard (32GB)
          </button>
          <button
            onClick={() => setPreset('creator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              preset === 'creator'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pro Creator (64GB)
          </button>
          <button
            onClick={() => setPreset('beast')}
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

        {/* Right: Layout Switcher & Audio */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0e1627] p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setLayout('quad')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                layout === 'quad' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Quad 2x2 View"
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
              title="Single Focus Mode"
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
            AMD Ryzen 9 (5.7 GHz) · 50 GB High-Speed Staging RAM · 32 GB Dedicated Encode VRAM
          </span>
          <span className="text-emerald-400 font-semibold">(0% Host Resource Strain)</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-slate-400">Total Supercomputing Fabric:</span>
          <span className="font-black text-white">194 GB RAM</span>
          <span>•</span>
          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            232 GB VRAM
          </span>
          <span>•</span>
          <span className="text-slate-400">Master Cloud 10 TB VFS</span>
        </div>
      </div>

      {/* ── WORKSPACE MATRIX GRID (QUAD VIEW) ── */}
      <main className="flex-1 p-2 overflow-hidden relative">
        {layout === 'quad' && (
          <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-2 h-full w-full">
            {/* 1. WINDOWS 11 ENTERPRISE VIEWPORT */}
            <div className="rounded-2xl border border-blue-500/30 bg-[#0c1322] flex flex-col overflow-hidden shadow-lg relative group">
              {/* Header */}
              <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs">
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
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="text-emerald-400 font-bold">{fps} FPS</span>
                  <button onClick={() => { setLayout('focus'); setFocusedOS('windows'); }} className="p-1 hover:text-white">
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Windows Desktop Screen */}
              <div className="flex-1 p-3 bg-gradient-to-b from-[#0a1124] to-[#040814] relative flex flex-col justify-between">
                {/* Desktop Icons */}
                <div className="grid grid-cols-4 gap-3 max-w-sm">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500/40 flex items-center justify-center font-black text-red-400 text-xs shadow-inner">
                      GTA VI
                    </div>
                    <span className="text-[10px] text-slate-200 mt-1 font-semibold truncate w-full">GTA 6 (4K 120)</span>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center cursor-pointer hover:bg-white/10 transition-colors">
                    <HardDrive className="w-8 h-8 text-blue-400" />
                    <span className="text-[10px] text-slate-200 mt-1 font-semibold truncate w-full">Z:\ (10 TB Drive)</span>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center cursor-pointer hover:bg-white/10 transition-colors">
                    <Box className="w-8 h-8 text-purple-400" />
                    <span className="text-[10px] text-slate-200 mt-1 font-semibold truncate w-full">AutoCAD 3D</span>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center cursor-pointer hover:bg-white/10 transition-colors">
                    <Film className="w-8 h-8 text-amber-400" />
                    <span className="text-[10px] text-slate-200 mt-1 font-semibold truncate w-full">Premiere Pro</span>
                  </div>
                </div>

                {/* Simulated Running Window */}
                <div className="p-3 rounded-xl bg-black/60 border border-blue-500/30 backdrop-blur shadow-2xl my-auto">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[10px]">
                    <span className="font-bold text-blue-400">DirectX 12 Ultimate Benchmark &amp; Ray Tracing</span>
                    <span className="text-emerald-400 font-bold">120.4 FPS · 4K UHD</span>
                  </div>
                  <div className="pt-2 text-[11px] text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dedicated GPU VRAM:</span>
                      <span className="font-bold text-white">80 GB / 80 GB Clustered HBM3e</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Allocated Host RAM:</span>
                      <span className="font-bold text-white">48 GB DDR5-6400</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Storage Pipeline:</span>
                      <span className="font-bold text-emerald-400">0 Bytes on Client Laptop (100% Cloud VFS)</span>
                    </div>
                  </div>
                </div>

                {/* Windows 11 Taskbar */}
                <div className="h-8 rounded-xl bg-[#090e1c]/90 border border-white/10 flex items-center justify-between px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5 cursor-pointer">
                      <div className="bg-[#00adef]" />
                      <div className="bg-[#00adef]" />
                      <div className="bg-[#00adef]" />
                      <div className="bg-[#00adef]" />
                    </div>
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400 cursor-pointer" />
                    <Monitor className="w-3.5 h-3.5 text-blue-400 cursor-pointer" />
                  </div>
                  <span className="text-[10px] text-slate-400">Windows 11 Enterprise (Master Cloud)</span>
                </div>
              </div>
            </div>

            {/* 2. APPLE MACOS SONOMA / SEQUOIA VIEWPORT */}
            <div className="rounded-2xl border border-purple-500/30 bg-[#0c1322] flex flex-col overflow-hidden shadow-lg relative group">
              {/* Header */}
              <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white"></span>
                  <span className="font-black text-white">macOS Sequoia (Apple Metal)</span>
                  <Badge variant="outline" className="text-[9px] border-purple-500/40 text-purple-400">
                    Metal 3 Acceleration · 50 GB VRAM
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="text-emerald-400 font-bold">60 FPS HiDPI</span>
                  <button onClick={() => { setLayout('focus'); setFocusedOS('mac'); }} className="p-1 hover:text-white">
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* macOS Screen */}
              <div className="flex-1 p-3 bg-gradient-to-b from-[#130d24] to-[#070512] relative flex flex-col justify-between">
                {/* macOS Menu bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-300 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">Xcode</span>
                    <span className="text-slate-400">File</span>
                    <span className="text-slate-400">Edit</span>
                    <span className="text-slate-400">Product</span>
                    <span className="text-slate-400">Debug</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Final Cut Pro 8K Engine Ready</span>
                </div>

                {/* macOS Xcode & Simulator Window */}
                <div className="p-3 rounded-xl bg-black/60 border border-purple-500/30 backdrop-blur shadow-2xl my-auto space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-purple-400 ml-1">Xcode Pro 16 · iOS Simulator (iPhone 16 Pro)</span>
                    </div>
                    <span className="text-emerald-400 font-bold">Build Succeeded (0.4s)</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 font-mono text-[10px] text-purple-300 space-y-0.5">
                    <div>import SwiftUI</div>
                    <div>struct ContentView: View &#123; var body: some View &#123; Text("Master Cloud 10 TB") &#125; &#125;</div>
                    <div className="text-slate-400">// Rendering with Apple Metal 3 hardware passthrough (50 GB VRAM)</div>
                  </div>
                </div>

                {/* macOS Dock */}
                <div className="h-8 self-center px-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center gap-3">
                  <div className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center font-bold text-[9px] shadow">Finder</div>
                  <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-[9px] shadow">Xcode</div>
                  <div className="w-5 h-5 rounded-md bg-purple-600 flex items-center justify-center font-bold text-[9px] shadow">FCP</div>
                  <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center font-bold text-[9px] shadow">Terminal</div>
                </div>
              </div>
            </div>

            {/* 3. UBUNTU 24.04 LTS (AI & DOCKER CLUSTER) */}
            <div className="rounded-2xl border border-orange-500/30 bg-[#0c1322] flex flex-col overflow-hidden shadow-lg relative group">
              {/* Header */}
              <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#e95420]" />
                  <span className="font-black text-white">Ubuntu 24.04 LTS (AI &amp; Docker)</span>
                  <Badge variant="outline" className="text-[9px] border-orange-500/40 text-orange-400">
                    CUDA 12.4 · 50 GB VRAM · 40 GB RAM
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="text-emerald-400 font-bold">PyTorch Active</span>
                  <button onClick={() => { setLayout('focus'); setFocusedOS('linux'); }} className="p-1 hover:text-white">
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Linux Terminal View */}
              <div className="flex-1 p-3 bg-[#0a0a0f] font-mono text-[11px] flex flex-col justify-between overflow-hidden">
                <div className="space-y-1 overflow-y-auto max-h-48 text-slate-300">
                  {termLogs.map((log, idx) => (
                    <div key={idx} className={log.startsWith('ubuntu@') ? 'text-amber-400 font-bold' : ''}>
                      {log}
                    </div>
                  ))}
                </div>

                {/* Interactive CLI Input */}
                <form onSubmit={handleRunCommand} className="flex items-center gap-1 pt-2 border-t border-white/10">
                  <span className="text-amber-400 font-bold text-xs">ubuntu@matrix:~$</span>
                  <input
                    type="text"
                    value={termInput}
                    onChange={(e) => setTermInput(e.target.value)}
                    placeholder="Type 'matrix-status', 'nvidia-smi', or any command..."
                    className="flex-1 bg-transparent text-white focus:outline-none text-xs"
                  />
                </form>
              </div>
            </div>

            {/* 4. ANDROID 15 (NATIVE VULKAN MOBILE) */}
            <div className="rounded-2xl border border-emerald-500/30 bg-[#0c1322] flex flex-col overflow-hidden shadow-lg relative group">
              {/* Header */}
              <div className="px-3 py-1.5 bg-[#0f172a] border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-black text-white">Android 15 (Native Mobile)</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400">
                    Vulkan 1.3 · 20 GB VRAM · 16 GB RAM
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="text-emerald-400 font-bold">120Hz Mobile</span>
                  <button onClick={() => { setLayout('focus'); setFocusedOS('android'); }} className="p-1 hover:text-white">
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Android Phone View */}
              <div className="flex-1 p-3 bg-gradient-to-b from-[#081a14] to-[#040d0a] flex items-center justify-center">
                <div className="w-48 h-full rounded-2xl border-2 border-white/20 bg-slate-950 p-2 flex flex-col justify-between shadow-2xl relative">
                  {/* Notch / Status */}
                  <div className="flex items-center justify-between text-[9px] text-slate-400 px-1">
                    <span>12:00</span>
                    <div className="w-12 h-2.5 rounded-full bg-black border border-white/10" />
                    <div className="flex items-center gap-1">
                      <Wifi className="w-2.5 h-2.5" />
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Android App Grid */}
                  <div className="grid grid-cols-3 gap-2 my-auto px-1 text-center">
                    <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">MC</div>
                      <span className="text-[8px] text-slate-200 mt-1">10 TB SAF</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                      <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">3D</div>
                      <span className="text-[8px] text-slate-200 mt-1">Genshin</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                      <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">APK</div>
                      <span className="text-[8px] text-slate-200 mt-1">Apps</span>
                    </div>
                  </div>

                  {/* Android Bottom Navigation */}
                  <div className="flex items-center justify-around py-1 border-t border-white/10 text-slate-400">
                    <span className="text-[10px]">◀</span>
                    <span className="text-[10px]">●</span>
                    <span className="text-[10px]">■</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOCUS VIEW OR SPLIT VIEW MODES */}
        {layout !== 'quad' && (
          <div className="flex items-center justify-center h-full text-center p-6 space-y-3">
            <div>
              <h2 className="text-lg font-bold text-white">Focused Mode: {focusedOS.toUpperCase()}</h2>
              <p className="text-xs text-slate-400 mt-1">Click Quad View (top right) to view all 4 OS viewports simultaneously.</p>
              <Button onClick={() => setLayout('quad')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-xs font-bold">
                Return to Quad 2x2 Matrix
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ── BOTTOM MATRIX BRIDGE INTER-OS CONTROL BAR ── */}
      <footer className="px-4 py-2 bg-[#090d18] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 text-xs">
        {/* Cross-OS Clipboard Sync */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            Cross-OS Clipboard:
          </span>
          <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 truncate max-w-xs">
            {clipboardContent}
          </div>
          <button
            onClick={() => handleCopyClipboard('Universal Matrix')}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1"
          >
            {copiedSuccess ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
            <span>Sync &amp; Paste</span>
          </button>
        </div>

        {/* Zero-Disk Drag-and-Drop Bridge */}
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span className="text-emerald-400 font-bold">✨ Zero-Disk Drag &amp; Drop:</span>
          <span>Instant inter-OS file streaming via 10 TB In-Memory VFS</span>
        </div>
      </footer>
    </div>
  );
}
