import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Zap,
  ShieldCheck,
  HardDrive,
  Cloud,
  RefreshCw,
  Gauge,
  Activity,
  Sparkles,
  Flame,
  Layers,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatBytes } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  MasterRamService,
  MasterRamStats,
  MasterRamMode,
  MasterRamBenchmarkResult,
  WindowsVmInfo,
} from '@/services/masterRamService';

export function MasterRamHub() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<MasterRamStats | null>(null);
  const [vmInfo, setVmInfo] = useState<WindowsVmInfo | null>(null);
  const [benchmark, setBenchmark] = useState<MasterRamBenchmarkResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isBalancing, setIsBalancing] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isApplyingVm, setIsApplyingVm] = useState(false);
  const [isInstallingAdminTask, setIsInstallingAdminTask] = useState(false);
  const [disableMemCompression, setDisableMemCompression] = useState(true);
  const [selectedDrive, setSelectedDrive] = useState('C:');
  const [selectedPagefileMB, setSelectedPagefileMB] = useState(16384);

  const loadStats = useCallback(async () => {
    MasterRamService.setUserEmail(user?.email);
    const data = await MasterRamService.getStats();
    setStats(data);
    if (data.lastBenchmark) {
      setBenchmark(data.lastBenchmark);
    }
  }, [user?.email]);

  const loadVmInfo = useCallback(async () => {
    const info = await MasterRamService.getWindowsVmInfo();
    setVmInfo(info);
    if (info.disks && info.disks.length > 0) {
      // Prioritize physical SSD D: (larger secondary partition) or C:, never cloud mounts
      const preferred =
        info.disks.find((d) => d.DeviceID.toUpperCase() === 'D:') ||
        info.disks.find((d) => d.DeviceID.toUpperCase() === 'C:') ||
        info.disks[0];
      if (preferred?.DeviceID) setSelectedDrive(preferred.DeviceID);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadVmInfo();
    const timer = setInterval(loadStats, 2500);
    return () => clearInterval(timer);
  }, [loadStats, loadVmInfo]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    await loadVmInfo();
    setIsRefreshing(false);
  };

  const handleModeChange = async (mode: MasterRamMode) => {
    setIsSwitching(true);
    const ok = await MasterRamService.setConfig({ mode });
    if (ok) {
      toast.success(`Master RAM switched to ${mode.replace('_', ' ').toUpperCase()}`);
      await loadStats();
    } else {
      toast.error('Start the local Master RAM Engine (npm run ram:start) to switch daemon modes.');
    }
    setIsSwitching(false);
  };

  const handleToggle = async (
    key: 'prefetchEnabled' | 'autoTrimEnabled' | 'bgBalanceEnabled' | 'demoteBgPriority' | 'cloudVaultEnabled',
    label: string
  ) => {
    if (!stats) return;
    const nextVal = !stats[key];
    const ok = await MasterRamService.setConfig({ [key]: nextVal });
    if (ok) {
      toast.success(`${label} ${nextVal ? 'Enabled' : 'Disabled'}`);
      await loadStats();
    } else {
      toast.error('Local Master RAM Engine is offline.');
    }
  };

  const handleTargetPctChange = async (pct: number) => {
    const ok = await MasterRamService.setConfig({ targetMemoryLoadPct: pct, bgBalanceEnabled: true });
    if (ok) {
      toast.success(`Background App Balancer target set to <= ${pct}% physical RAM`);
      await loadStats();
    } else {
      toast.error('Local Master RAM Engine is offline.');
    }
  };

  const handleBalance = async (elevateAdmin = false) => {
    setIsBalancing(true);
    const targetPct = stats?.targetMemoryLoadPct ?? 30;
    const res = await MasterRamService.balanceHostRam({
      targetPct,
      demoteBg: stats?.demoteBgPriority ?? true,
      aggressive: true,
      elevateAdmin,
    });
    if (res.ok) {
      const freedMB = ((res.physicalReclaimedBytes || 0) / (1024 * 1024)).toFixed(1);
      toast.success(
        `BG Balance: ${res.memoryLoadBefore ?? '?'}% -> ${res.memoryLoadAfter ?? '?'}% (${res.trimmedProcesses || 0} trimmed, ${res.demotedProcesses || 0} demoted, ${freedMB} MB freed)`
      );
      await loadStats();
    } else {
      toast.error(res.error || 'Background balance failed.');
    }
    setIsBalancing(false);
  };

  const handleOptimize = async (aggressive = false) => {
    setIsOptimizing(true);
    const res = await MasterRamService.optimizeHostRam(aggressive);
    if (res.ok) {
      const trimmedMB = ((res.workingSetTrimmedBytes || 0) / (1024 * 1024)).toFixed(1);
      const freedMB = ((res.physicalReclaimedBytes || 0) / (1024 * 1024)).toFixed(1);
      toast.success(
        `Optimized ${res.trimmedProcesses || 0} background processes (~${trimmedMB} MB trimmed, ${freedMB} MB physical RAM freed).`
      );
      await loadStats();
    } else {
      toast.error(res.error || 'Failed to run native RAM optimizer.');
    }
    setIsOptimizing(false);
  };

  const handleBenchmark = async () => {
    setIsBenchmarking(true);
    const result = await MasterRamService.runBenchmark();
    if (result) {
      setBenchmark(result);
      toast.success(
        `Real Hardware Benchmark Complete: L1 Read ${result.l1ReadMBps} MB/s (${result.l1AvgLatencyUs} us)`
      );
      await loadStats();
    } else {
      toast.error('Benchmark failed.');
    }
    setIsBenchmarking(false);
  };

  const handleToggleAdminTask = async () => {
    if (!stats?.daemonConnected) return;
    setIsInstallingAdminTask(true);
    if (stats.adminTaskInstalled) {
      const res = await MasterRamService.uninstallAdminBalancerTask();
      if (res.ok) toast.success('Always-On Admin Balancer task removed.');
      else toast.error(res.error || 'Could not remove Admin Balancer task.');
    } else {
      const res = await MasterRamService.installAdminBalancerTask(stats.targetMemoryLoadPct ?? 30);
      if (res.ok && res.installed) {
        toast.success(res.note || 'Always-On Admin Balancer active! Silent SeDebug + Standby/Modified flush enabled.');
      } else {
        toast.error(res.error || res.note || 'UAC cancelled or failed.');
      }
    }
    await loadStats();
    setIsInstallingAdminTask(false);
  };

  const handleApplyWindowsVm = async () => {
    setIsApplyingVm(true);
    const res = await MasterRamService.applyWindowsPagefile(
      selectedDrive,
      selectedPagefileMB,
      disableMemCompression
    );
    if (res.ok) {
      toast.success(res.note || 'Windows Virtual Memory & SSD Pagefile configured!');
      await loadVmInfo();
      await loadStats();
    } else {
      toast.error(res.error || res.note || 'Could not apply Windows Virtual Memory settings.');
    }
    setIsApplyingVm(false);
  };

  const committed = stats?.user.committedBytes || 0;
  const quota = stats?.user.quotaBytes || 500 * 1024 * 1024 * 1024;
  const quotaPercent = Math.min(100, Math.max(committed > 0 ? 1 : 0, (committed / quota) * 100));

  const physTotal = stats?.host.memory.totalPhysicalBytes || 1;
  const physUsed = stats?.host.memory.usedPhysicalBytes || 0;
  const physLoad = stats?.host.memory.memoryLoadPercent || 0;
  const commitTotal = stats?.host.memory.totalCommitBytes || 1;
  const commitUsed = stats?.host.memory.usedCommitBytes || 0;

  return (
    <div className="w-full rounded-2xl bg-[#070b16] border border-indigo-500/25 shadow-2xl p-4 sm:p-6 text-white space-y-6 font-sans">
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.45)]">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                MASTER RAM — 4-TIER HYBRID ENGINE
              </h2>
              {stats?.daemonConnected ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                  ● ENGINE ONLINE (PORT 9060)
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold">
                  ● BROWSER STANDALONE
                </Badge>
              )}
              {stats?.win32NativeAvailable && (
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] font-bold">
                  WIN32 NATIVE ACTIVE
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              500 GB Per-User Virtual RAM Space • L1 Zero-Copy + L2 Zstd + L3 SSD Prefetch + L4 Cloud Vault
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => handleOptimize(false)}
            disabled={isOptimizing || !stats?.daemonConnected}
            size="sm"
            className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            {isOptimizing ? 'Optimizing...' : 'Boost Host RAM'}
          </Button>
          <Button
            onClick={handleBenchmark}
            disabled={isBenchmarking}
            size="sm"
            variant="outline"
            className="h-8 rounded-xl border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold gap-1.5"
          >
            <Gauge className="w-3.5 h-3.5" />
            {isBenchmarking ? 'Benchmarking...' : 'Speed Benchmark'}
          </Button>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Offline instructions banner when daemon is not running */}
      {stats && !stats.daemonConnected && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Running in browser-only L0 mode. Start the local Master RAM Engine with{' '}
              <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono">
                npm run ram:start
              </code>{' '}
              to unlock real Win32 RAM boosting, Zstd L2 pool, SSD swap prefetching, and 500 GB quota!
            </span>
          </div>
        </div>
      )}

      {/* ── 500 GB USER ALLOCATION + REAL HOST RAM GAUGES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User 500 GB Virtual RAM Allocation */}
        <div className="p-4 rounded-xl bg-[#0c1324] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              User Dedicated 500 GB Virtual RAM
            </span>
            <span className="text-xs font-mono font-bold text-indigo-300">
              {formatBytes(committed)} / 500.0 GB
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-white/5 border border-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${quotaPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <div className="text-slate-400">T1 Hot RAM</div>
              <div className="font-mono font-bold text-emerald-400">
                {formatBytes(stats?.user.tiers.l1HotRamBytes || 0)}
              </div>
              <div className="text-[10px] text-slate-500">{stats?.user.tiers.l1Pages || 0} pages</div>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <div className="text-slate-400">T2 Zstd RAM</div>
              <div className="font-mono font-bold text-cyan-400">
                {formatBytes(stats?.user.tiers.l2CompressedRamBytes || 0)}
              </div>
              <div className="text-[10px] text-slate-500">
                {stats?.performance.compressionRatio || 1}x ratio
              </div>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <div className="text-slate-400">T3 SSD Swap</div>
              <div className="font-mono font-bold text-blue-400">
                {formatBytes(stats?.user.tiers.l3SsdSwapBytes || 0)}
              </div>
              <div className="text-[10px] text-slate-500">
                Prefetch: {stats?.performance.prefetchHits || 0} hits
              </div>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <div className="text-slate-400">T4 Cloud Vault</div>
              <div className="font-mono font-bold text-violet-400">
                {formatBytes(stats?.user.tiers.l4CloudVaultBytes || 0)}
              </div>
              <div className="text-[10px] text-slate-500">{stats?.user.tiers.l4Pages || 0} cold pages</div>
            </div>
          </div>
        </div>

        {/* Real Host Hardware RAM & Windows Commit Limit */}
        <div className="p-4 rounded-xl bg-[#0c1324] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              Real Host PC Physical RAM &amp; Commit
            </span>
            <span className="text-xs font-mono font-bold text-emerald-300">
              {physLoad}% Used • Engine RSS: {stats?.host.daemonRssMB || 0} MB
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Physical DDR RAM:</span>
              <span className="font-mono text-white">
                {formatBytes(physUsed)} / {formatBytes(physTotal)} ({formatBytes(stats?.host.memory.availPhysicalBytes || 0)} free)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  physLoad > 85 ? 'bg-red-500' : physLoad > 70 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, physLoad)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Windows Commit Limit (RAM + Pagefile):</span>
              <span className="font-mono text-cyan-300">
                {formatBytes(commitUsed)} / {formatBytes(commitTotal)}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((commitUsed / commitTotal) * 100))}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
            <span>
              RAM Hit Rate:{' '}
              <strong className="text-emerald-400">{stats?.performance.ramTierHitRatePct ?? 100}%</strong>{' '}
              (L1: {stats?.performance.l1Hits || 0}, L2: {stats?.performance.l2Hits || 0}, L0:{' '}
              {stats?.performance.l0ClientHits || 0})
            </span>
            <span>
              Last Latency:{' '}
              <strong className="text-cyan-300">{stats?.performance.lastReadLatencyUs ?? 0} us</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── MODE SELECTOR & ENGINE CONTROLS ── */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Adaptive Host Memory Profile (Potato-Safe Budgets)
          </span>
          <span className="text-[11px] text-slate-400">
            L1 Budget: <strong className="text-white">{formatBytes(stats?.budgets.l1BudgetBytes || 0)}</strong> • L2 Budget:{' '}
            <strong className="text-white">{formatBytes(stats?.budgets.l2BudgetBytes || 0)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleModeChange('extreme_speed')}
            disabled={isSwitching}
            className={`p-3.5 rounded-xl border text-left transition-all space-y-1.5 ${
              stats?.mode === 'extreme_speed'
                ? 'bg-indigo-600/20 border-indigo-400 text-white shadow-[0_0_16px_rgba(99,102,241,0.3)]'
                : 'bg-[#0c1324] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-300">
                <Flame className="w-3.5 h-3.5" />
                Extreme Speed (4-Tier)
              </span>
              {stats?.mode === 'extreme_speed' && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
            </div>
            <p className="text-[11px] text-slate-300">
              Max L1+L2 RAM slabs, 4-page predictive stride prefetcher &amp; native Win32 foreground boost.
            </p>
          </button>

          <button
            onClick={() => handleModeChange('balanced')}
            disabled={isSwitching}
            className={`p-3.5 rounded-xl border text-left transition-all space-y-1.5 ${
              stats?.mode === 'balanced'
                ? 'bg-cyan-600/20 border-cyan-400 text-white shadow-[0_0_16px_rgba(6,182,212,0.25)]'
                : 'bg-[#0c1324] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5" />
                Balanced Smart Tiering
              </span>
              {stats?.mode === 'balanced' && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
            </div>
            <p className="text-[11px] text-slate-300">
              Adaptive RAM ceiling with Zstd compression and 2-page lookahead prefetching.
            </p>
          </button>

          <button
            onClick={() => handleModeChange('ultra_potato')}
            disabled={isSwitching}
            className={`p-3.5 rounded-xl border text-left transition-all space-y-1.5 ${
              stats?.mode === 'ultra_potato'
                ? 'bg-emerald-600/20 border-emerald-400 text-white shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                : 'bg-[#0c1324] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Ultra-Potato Guard (2–4 GB)
              </span>
              {stats?.mode === 'ultra_potato' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-300">
              Caps L1+L2 to 24 MB &amp; aggressively trims idle background apps above 76% RAM load.
            </p>
          </button>
        </div>

        {/* Feature Toggles */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleToggle('prefetchEnabled', 'Predictive Stride Prefetcher')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              stats?.prefetchEnabled
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            Predictive Prefetch: {stats?.prefetchEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => handleToggle('autoTrimEnabled', 'Auto Background Trimmer')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              stats?.autoTrimEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            Auto-Trim Guard: {stats?.autoTrimEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => handleToggle('cloudVaultEnabled', 'L4 Remote Cloud Offload')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              stats?.cloudVaultEnabled
                ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            L4 Cloud Offload: {stats?.cloudVaultEnabled ? 'ON' : 'LOCAL VAULT'}
          </button>
          {stats?.daemonConnected && (
            <button
              onClick={() => handleOptimize(true)}
              disabled={isOptimizing}
              className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold"
              title="Trims idle working sets and attempts Standby List purge (requires Admin for standby purge)"
            >
              Deep Standby Purge
            </button>
          )}
        </div>

        {/* ── EXTREME BACKGROUND APP BALANCER (TARGET <= 30% CAP) ── */}
        <div className="p-4 rounded-xl bg-[#0c1324] border border-emerald-500/25 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                Extreme Background App Balancer (Target Cap: &le; {stats?.targetMemoryLoadPct ?? 30}% Physical RAM)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically trims background working sets &amp; demotes idle apps to Below-Normal CPU priority while keeping your active app boosted.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => handleBalance(false)}
                disabled={isBalancing || !stats?.daemonConnected}
                size="sm"
                className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                {isBalancing ? 'Balancing...' : 'Balance Now'}
              </Button>
              <Button
                onClick={handleToggleAdminTask}
                disabled={isInstallingAdminTask || !stats?.daemonConnected}
                size="sm"
                variant="outline"
                className={`h-8 rounded-lg text-xs font-bold gap-1.5 ${
                  stats?.adminTaskInstalled
                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                    : 'border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25'
                }`}
                title="1x UAC setup so auto-balancer silently flushes svchost, Modified & Standby lists without repeated UAC prompts"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {isInstallingAdminTask
                  ? 'Updating...'
                  : stats?.adminTaskInstalled
                  ? 'Always-On Admin: ON ✓'
                  : 'Enable Always-On Admin (1x UAC)'}
              </Button>
              <Button
                onClick={() => handleBalance(true)}
                disabled={isBalancing || !stats?.daemonConnected}
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold gap-1.5"
                title="Requests Windows UAC Elevation to also flush Modified & Standby Page Lists"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Deep Admin Balance (UAC)
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Target RAM Cap:</span>
            {[
              { pct: 30, label: '30% Extreme (~70% Free)' },
              { pct: 50, label: '50% Balanced' },
              { pct: 75, label: '75% Safe Guard' },
            ].map((preset) => (
              <button
                key={preset.pct}
                onClick={() => handleTargetPctChange(preset.pct)}
                disabled={!stats?.daemonConnected}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                  (stats?.targetMemoryLoadPct ?? 30) === preset.pct
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}

            <button
              onClick={() => handleToggle('bgBalanceEnabled', 'Auto BG Balancer')}
              className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ml-auto ${
                stats?.bgBalanceEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              Auto Balancer: {stats?.bgBalanceEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => handleToggle('demoteBgPriority', 'Background Priority Demote')}
              className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                stats?.demoteBgPriority
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              Demote Idle CPU: {stats?.demoteBgPriority ? 'ON' : 'OFF'}
            </button>
          </div>

          {stats?.lastBalanceResult && (
            <div className="px-3 py-2 rounded-lg bg-black/35 border border-white/10 text-[11px] flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-300">
                Last Balance:{' '}
                <strong className="text-white">{stats.lastBalanceResult.memoryLoadBefore ?? physLoad}%</strong>{' '}
                &rarr;{' '}
                <strong className="text-emerald-400">{stats.lastBalanceResult.memoryLoadAfter ?? physLoad}%</strong>{' '}
                • Trimmed: <strong>{stats.lastBalanceResult.trimmedProcesses ?? 0}</strong> apps (
                {((stats.lastBalanceResult.workingSetTrimmedBytes || 0) / (1024 * 1024)).toFixed(0)} MB) • Demoted:{' '}
                <strong>{stats.lastBalanceResult.demotedProcesses ?? 0}</strong> • Freed:{' '}
                <strong className="text-cyan-300">
                  {((stats.lastBalanceResult.physicalReclaimedBytes || 0) / (1024 * 1024)).toFixed(1)} MB
                </strong>
              </span>
              {stats.lastBalanceResult.targetReached === false && (
                <span className="text-amber-300/90 text-[10px]">
                  Protected OS kernel + active foreground app floor is above {stats.lastBalanceResult.targetPct ?? 30}%. All safe background bloat trimmed.
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── REAL HARDWARE BENCHMARK RESULTS ── */}
      {benchmark && (
        <div className="p-4 rounded-xl bg-[#0c1324] border border-cyan-500/25 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" />
              Measured Real Hardware Speed ({benchmark.testedMB} MB Working Set • {benchmark.codec})
            </span>
            <span className="text-[10px] text-slate-400">
              {new Date(benchmark.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {benchmark.ddrReadGBps != null && (
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-950/80 to-black/60 border border-indigo-400/30">
                <div className="text-[10px] text-indigo-300 font-semibold">
                  Native DDR Bus ({benchmark.ddrThreads || 1}T)
                </div>
                <div className="text-base font-black text-white font-mono">
                  {benchmark.ddrReadGBps} GB/s
                </div>
                <div className="text-[10px] text-slate-400">
                  Copy: {benchmark.ddrCopyGBps} GB/s • {benchmark.ddrPageLatencyNs} ns/page
                </div>
              </div>
            )}
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[10px] text-slate-400">L1 Physical RAM Read</div>
              <div className="text-base font-black text-emerald-400 font-mono">{benchmark.l1ReadMBps} MB/s</div>
              <div className="text-[10px] text-slate-500">Write: {benchmark.l1WriteMBps} MB/s</div>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[10px] text-slate-400">
                L2 Multi-Core Zstd ({benchmark.l2ParallelWorkers || 1}T)
              </div>
              <div className="text-base font-black text-cyan-300 font-mono">
                {benchmark.l2ParallelDecompressMBps || benchmark.l2DecompressMBps} MB/s
              </div>
              <div className="text-[10px] text-slate-500">
                1T: {benchmark.l2DecompressMBps} MB/s • {benchmark.l2CompressionRatio}x
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[10px] text-slate-400">L3 Local Swap Read</div>
              <div className="text-base font-black text-blue-400 font-mono">{benchmark.l3SsdReadMBps} MB/s</div>
              <div className="text-[10px] text-slate-500">Write: {benchmark.l3SsdWriteMBps} MB/s</div>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[10px] text-slate-400">Kernel SHM &amp; L1 Latency</div>
              <div className="text-base font-black text-violet-300 font-mono">{benchmark.l1AvgLatencyUs} us</div>
              <div className="text-[10px] text-emerald-400">
                {benchmark.shmVerified ? 'Win32 SHM Section OK' : '64 KB page timing'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WINDOWS VIRTUAL MEMORY & TOP PROCESSES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Windows MemoryCompression & Pagefile Setup */}
        <div className="p-4 rounded-xl bg-[#0c1324] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-blue-400" />
              Windows OS Virtual Memory &amp; Compression
            </span>
            {vmInfo?.mm && (
              <Badge
                className={
                  vmInfo.mm.MemoryCompression
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]'
                }
              >
                {vmInfo.mm.MemoryCompression ? 'MemoryCompression ON' : 'MemoryCompression OFF'}
              </Badge>
            )}
          </div>

          {vmInfo?.pagefiles && vmInfo.pagefiles.length > 0 ? (
            <div className="space-y-1.5 text-[11px]">
              {vmInfo.pagefiles.map((pf) => (
                <div
                  key={pf.Name}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/5"
                >
                  <span className="font-mono text-slate-200">{pf.Name}</span>
                  <span className="font-mono text-cyan-300">
                    {pf.CurrentUsage} MB used / {pf.AllocatedBaseSize} MB allocated
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              {stats?.daemonConnected
                ? 'Reading Windows pagefile configuration...'
                : 'Connect local Master RAM Engine to inspect and optimize Windows pagefile.sys & MemoryCompression.'}
            </p>
          )}

          {stats?.daemonConnected && vmInfo?.supported && (() => {
            const currentDisk = (vmInfo.disks || []).find((d) => d.DeviceID === selectedDrive);
            const freeGB = currentDisk ? (currentDisk.FreeSpace || 0) / (1024 * 1024 * 1024) : 20;
            const safePresets = [
              { mb: 8192, label: '8 GB SSD Pagefile' },
              { mb: 16384, label: '16 GB SSD Pagefile' },
              ...(freeGB >= 28 ? [{ mb: 24576, label: '24 GB SSD Pagefile' }] : []),
              ...(freeGB >= 38 ? [{ mb: 32768, label: '32 GB SSD Pagefile' }] : []),
              ...(freeGB >= 75 ? [{ mb: 65536, label: '64 GB SSD Pagefile' }] : []),
            ];

            return (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedDrive}
                    onChange={(e) => {
                      const nextDrive = e.target.value;
                      setSelectedDrive(nextDrive);
                      const d = (vmInfo.disks || []).find((x) => x.DeviceID === nextDrive);
                      const nextFreeGB = d ? (d.FreeSpace || 0) / (1024 * 1024 * 1024) : 20;
                      if (selectedPagefileMB > (nextFreeGB - 2) * 1024) {
                        setSelectedPagefileMB(nextFreeGB >= 38 ? 32768 : 16384);
                      }
                    }}
                    className="h-8 px-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                  >
                    {(vmInfo.disks || [{ DeviceID: 'D:', FreeSpace: 0, FileSystem: 'NTFS' }]).map((d) => (
                      <option key={d.DeviceID} value={d.DeviceID}>
                        Drive {d.DeviceID} ({formatBytes(d.FreeSpace || 0)} free • {d.FileSystem || 'NTFS'})
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedPagefileMB}
                    onChange={(e) => setSelectedPagefileMB(Number(e.target.value))}
                    className="h-8 px-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                  >
                    {safePresets.map((p) => (
                      <option key={p.mb} value={p.mb}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleApplyWindowsVm}
                    disabled={isApplyingVm}
                    size="sm"
                    className="h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isApplyingVm ? 'Applying...' : 'Apply OS Virtual RAM'}
                  </Button>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-cyan-200/90 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={disableMemCompression}
                    onChange={(e) => setDisableMemCompression(e.target.checked)}
                    className="rounded border-white/20 bg-black/40 accent-emerald-500"
                  />
                  <span>
                    SSD Direct Offload (Disable Windows <code>MemoryCompression</code> so trimmed RAM pages go to SSD Pagefile instead of occupying ~1.9 GB inside physical RAM — reboot required)
                  </span>
                </label>
                <p className="text-[10px] text-slate-400">
                  ℹ️ Windows OS kernel swap requires a local physical NTFS partition (<strong className="text-slate-200">C:</strong> or <strong className="text-slate-200">D:</strong>). Cloud drives (Z: / I:) are excluded to prevent OS blue-screens.
                </p>
              </div>
            );
          })()}
        </div>

        {/* Top RAM Processes with Foreground App Lock */}
        <div className="p-4 rounded-xl bg-[#0c1324] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Top Host Processes (Foreground Protected)
            </span>
            <span className="text-[10px] text-slate-400">
              {stats?.host.processCount || 0} active processes
            </span>
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto pr-1 text-[11px]">
            {(stats?.host.topProcesses || []).slice(0, 6).map((p) => (
              <div
                key={p.pid}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-slate-200 truncate">{p.name}</span>
                  {p.isForeground && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold shrink-0">
                      ACTIVE
                    </span>
                  )}
                </div>
                <span className="font-mono text-slate-300 shrink-0">
                  {formatBytes(p.workingSetBytes)}
                </span>
              </div>
            ))}
            {(!stats?.host.topProcesses || stats.host.topProcesses.length === 0) && (
              <p className="text-slate-500 py-4 text-center">
                Process telemetry appears when local Master RAM Engine is active.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
