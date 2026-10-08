import React, { useEffect, useState } from 'react';
import {
  WifiOff,
  HardDrive,
  Pin,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
  Shield,
  FolderOpen,
  DownloadCloud,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { VFSService, VFSDriveStatus, VFSMode } from '@/services/vfsService';
import { useFileStore } from '@/stores/fileStore';
import { formatBytes } from '@/lib/utils';
import { toast } from 'sonner';

export function OfflineCenterPage() {
  const { files, fetchItems } = useFileStore();
  const [status, setStatus] = useState<VFSDriveStatus | null>(null);
  const [pinnedList, setPinnedList] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<VFSMode>('stream');
  const [isClearingCache, setIsClearingCache] = useState(false);

  const loadData = async () => {
    fetchItems();
    const driveStatus = await VFSService.getStatus();
    setStatus(driveStatus);
    setSelectedMode(driveStatus.mountMode);
    setPinnedList(Array.from(VFSService.getPinnedPaths()));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleModeChange = async (mode: VFSMode) => {
    setSelectedMode(mode);
    VFSService.setVFSConfig({ mode });
    toast.success(`Virtual Drive switched to ${mode.toUpperCase()} Mode`);
    loadData();
  };

  const handleUnpin = (path: string) => {
    VFSService.unpin(path);
    setPinnedList(Array.from(VFSService.getPinnedPaths()));
    toast.info(`Unpinned "${path}". Stream mode active.`);
  };

  const handlePin = async (file: any) => {
    const relPath = file.storage_path || file.name;
    const ok = await VFSService.pinForOffline(relPath);
    if (ok) {
      setPinnedList(Array.from(VFSService.getPinnedPaths()));
      toast.success(`Pinned "${file.name}" for full offline access!`);
    } else {
      toast.error('Failed to hydrate file for offline cache.');
    }
  };

  const handleEvictCache = async () => {
    setIsClearingCache(true);
    try {
      const { clearedBytes } = await VFSService.evictCache();
      toast.success(`Cleared ${formatBytes(clearedBytes)} of unpinned cache from D:\\MasterCloudCache`);
      loadData();
    } catch {
      toast.error('Failed to evict cache');
    } finally {
      setIsClearingCache(false);
    }
  };

  const cachePercentage = status ? Math.round((status.usedCacheBytes / status.maxCacheBytes) * 100) : 5;

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto bg-background p-6 sm:p-10 space-y-8 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold mb-2">
            <WifiOff className="h-3.5 w-3.5" />
            <span>Master Cloud Offline Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Offline Center & Cache Manager
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Stream 10 TB with 0-byte local space, or pin essential documents for instant offline access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEvictCache}
            disabled={isClearingCache}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/70 hover:bg-accent text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            <span>{isClearingCache ? 'Evicting...' : 'Prune Unpinned Cache'}</span>
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Virtual Drive Operating Mode
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Stream Mode */}
          <div
            onClick={() => handleModeChange('stream')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
              selectedMode === 'stream'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md'
                : 'border-border/70 bg-card hover:border-border'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
                  <Zap className="h-5 w-5" />
                </div>
                {selectedMode === 'stream' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Active
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm text-foreground">Stream Mode (0 Byte Footprint)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Files live in your 10 TB Cloud. Blocks are hydrated on-demand into RAM and temporary cache. Takes 0 MB permanent disk space.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 text-[11px] font-semibold text-primary">
              Recommended for all devices
            </div>
          </div>

          {/* Smart Hybrid Mode */}
          <div
            onClick={() => handleModeChange('hybrid')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
              selectedMode === 'hybrid'
                ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20 shadow-md'
                : 'border-border/70 bg-card hover:border-border'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold">
                  <Layers className="h-5 w-5" />
                </div>
                {selectedMode === 'hybrid' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                    Active
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm text-foreground">Smart Hybrid Mode</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatically caches hot documents locally on D:\ while streaming videos and archives from the cloud on-demand.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 text-[11px] font-semibold text-indigo-400">
              Balanced speed & storage
            </div>
          </div>

          {/* Mirror Mode */}
          <div
            onClick={() => handleModeChange('mirror')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
              selectedMode === 'mirror'
                ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20 shadow-md'
                : 'border-border/70 bg-card hover:border-border'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
                  <HardDrive className="h-5 w-5" />
                </div>
                {selectedMode === 'mirror' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                    Active
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm text-foreground">Full Mirror Mode</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Keeps a full local copy of your cloud workspace inside D:\MasterCloudDrive for complete offline resilience.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 text-[11px] font-semibold text-emerald-500">
              Requires local disk capacity
            </div>
          </div>
        </div>
      </div>

      {/* Local Cache Gauge */}
      <div className="bg-card border border-border/70 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-foreground">Local Cache Allocation (D:\MasterCloudCache)</h3>
            <p className="text-xs text-muted-foreground">
              Protects Drive C:\ by isolating all temporary stream chunks on Drive D:\ with automated LRU eviction.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-foreground">
            {formatBytes(status?.usedCacheBytes || 0)} / {formatBytes(status?.maxCacheBytes || 20 * 1024 * 1024 * 1024)} ({cachePercentage}%)
          </span>
        </div>

        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(4, cachePercentage)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground pt-2">
          <div>
            <span className="block font-bold text-foreground">Drive Location</span>
            <span className="font-mono text-[11px]">D:\MasterCloudCache</span>
          </div>
          <div>
            <span className="block font-bold text-foreground">Drive C:\ Guard</span>
            <span className="text-emerald-500 font-semibold">Active & Protected</span>
          </div>
          <div>
            <span className="block font-bold text-foreground">Pinned Files</span>
            <span className="font-semibold text-foreground">{pinnedList.length} files</span>
          </div>
          <div>
            <span className="block font-bold text-foreground">Eviction Policy</span>
            <span className="font-semibold text-foreground">LRU (Least Recently Used)</span>
          </div>
        </div>
      </div>

      {/* Pinned Files Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>Pinned for 100% Offline Access ({pinnedList.length})</span>
          </h2>
        </div>

        {pinnedList.length === 0 ? (
          <div className="bg-card border border-border/70 rounded-2xl p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">No files pinned for offline access</p>
            <p className="text-xs text-muted-foreground">
              Select files below or right-click any file in your Drive and choose "Pin for Offline Access".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pinnedList.map(p => (
              <div
                key={p}
                className="bg-card border border-border/70 rounded-2xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                    <Pin className="h-4 w-4 fill-amber-500" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-xs text-foreground truncate">{p.split('/').pop()}</p>
                    <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Cached Locally
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleUnpin(p)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-2 shrink-0"
                  title="Unpin from offline cache"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Pin Selector from Drive */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Available Cloud Files
        </h2>

        <div className="bg-card border border-border/70 rounded-2xl divide-y divide-border/50 max-h-72 overflow-y-auto shadow-sm">
          {files.filter(f => !f.deleted_at).slice(0, 15).map(file => {
            const isFilePinned = VFSService.isPinned(file.storage_path || file.name);
            return (
              <div key={file.id} className="p-3.5 flex items-center justify-between hover:bg-accent/20 transition-colors text-xs">
                <div className="flex items-center gap-3 truncate">
                  <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                    {file.extension}
                  </span>
                  <span className="font-semibold truncate text-foreground">{file.name}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-[11px] text-muted-foreground">{formatBytes(file.size_bytes)}</span>
                  {isFilePinned ? (
                    <span className="text-[10px] font-bold text-emerald-500 px-2 py-1 rounded-full bg-emerald-500/10">
                      Pinned
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePin(file)}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] transition-colors"
                    >
                      Pin Offline
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
