import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  HardDrive,
  FileCheck,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SyncEngine, SyncJournalItem, SyncEngineStats, ConflictPolicy } from '@/services/syncEngine';
import { formatBytes } from '@/lib/utils';
import { toast } from 'sonner';

export function SyncCenterPage() {
  const [stats, setStats] = useState<SyncEngineStats>(() => SyncEngine.getStats());
  const [journal, setJournal] = useState<SyncJournalItem[]>(() => SyncEngine.getJournal());
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const unsubscribe = SyncEngine.subscribe((newStats, newJournal) => {
      setStats(newStats);
      setJournal(newJournal);
    });
    return unsubscribe;
  }, []);

  const handleTogglePause = () => {
    if (stats.isPaused) {
      SyncEngine.resumeSync();
      toast.success('Sync engine resumed.');
    } else {
      SyncEngine.pauseSync();
      toast.warning('Sync engine paused.');
    }
  };

  const handleRetryFailed = () => {
    SyncEngine.retryFailed();
    toast.success('Retrying failed sync operations.');
  };

  const handleClearCompleted = () => {
    SyncEngine.clearCompleted();
    toast.success('Completed transactions cleared from view.');
  };

  const handleResolveConflict = (id: string, policy: ConflictPolicy) => {
    SyncEngine.resolveConflict(id, policy);
    toast.success(`Conflict resolved using "${policy.replace('_', ' ')}" strategy.`);
  };

  const filteredJournal = journal.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto bg-background p-6 sm:p-10 space-y-8 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Master Cloud Sync Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Sync Center & Journal
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time synchronization queue, journal recovery, and autonomous conflict resolution.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePause}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              stats.isPaused
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
            }`}
          >
            {stats.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            <span>{stats.isPaused ? 'Resume Sync' : 'Pause Sync'}</span>
          </button>

          {stats.failedCount > 0 && (
            <button
              onClick={handleRetryFailed}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry ({stats.failedCount})</span>
            </button>
          )}

          <button
            onClick={handleClearCompleted}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/70 hover:bg-accent text-xs font-semibold transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Completed</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border/70 rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Engine Status</span>
            {stats.isPaused ? (
              <span className="h-2 w-2 rounded-full bg-amber-500" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <p className="text-xl font-black text-foreground">
            {stats.isPaused ? 'Paused' : stats.isSyncing ? 'Syncing...' : 'Idle & Live'}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {stats.isSyncing ? `${formatBytes(stats.speedBps)}/s speed` : 'Zero latency standby'}
          </span>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Queue In-Flight</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-foreground">
            {stats.queuedCount + stats.processingCount}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {stats.processingCount} active transfers
          </span>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Completed Today</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-500">
            {stats.completedCount}
          </p>
          <span className="text-[10px] text-muted-foreground">Verified checksum SHA-256</span>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Conflicts & Errors</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className={`text-xl font-black ${stats.conflictCount > 0 ? 'text-amber-500' : 'text-foreground'}`}>
            {stats.conflictCount + stats.failedCount}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {stats.conflictCount} pending resolution
          </span>
        </div>
      </div>

      {/* Sync Queue / Journal Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Sync Journal Operations ({filteredJournal.length})
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs bg-muted/60 p-1 rounded-xl border border-border/60">
            {['all', 'queued', 'processing', 'completed', 'conflict', 'failed'].map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${
                  filterStatus === f
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border/50">
            {filteredJournal.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No sync operations matching filter.
              </div>
            ) : (
              filteredJournal.map(item => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-accent/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : item.status === 'PROCESSING'
                          ? 'bg-blue-500/15 text-blue-500 animate-pulse'
                          : item.status === 'CONFLICT'
                          ? 'bg-amber-500/15 text-amber-500'
                          : item.status === 'FAILED'
                          ? 'bg-destructive/15 text-destructive'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.op.slice(0, 3)}
                    </div>

                    <div className="truncate">
                      <p className="font-bold text-xs text-foreground truncate max-w-md">
                        {item.path}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span className="font-mono font-semibold uppercase">{item.op}</span>
                        {item.sizeBytes > 0 && <span>• {formatBytes(item.sizeBytes)}</span>}
                        <span>• Queued {new Date(item.queuedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {item.status === 'CONFLICT' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleResolveConflict(item.id, 'server_wins')}
                          className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold"
                        >
                          Keep Cloud
                        </button>
                        <button
                          onClick={() => handleResolveConflict(item.id, 'client_wins')}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-bold"
                        >
                          Keep Local
                        </button>
                        <button
                          onClick={() => handleResolveConflict(item.id, 'fork_both')}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-bold"
                        >
                          Keep Both
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : item.status === 'PROCESSING'
                            ? 'bg-blue-500/15 text-blue-500'
                            : item.status === 'FAILED'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
