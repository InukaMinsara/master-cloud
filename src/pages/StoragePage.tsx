import React from 'react';
import {
  PieChart,
  HardDrive,
  Image,
  Video,
  FileText,
  Code,
  Archive,
  Trash2,
  Sparkles,
  Check,
  Shield,
  Zap,
  Server,
  Lock,
} from 'lucide-react';
import { api } from '@/services/api';
import { formatBytes } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/uiStore';

export function StoragePage() {
  const { setSmartCleanupModalOpen } = useUIStore();
  const [breakdown, setBreakdown] = React.useState(() => api.getStorageBreakdown());
  const [cleanupSuggestions, setCleanupSuggestions] = React.useState(() => api.getStorageCleanupSuggestions());

  React.useEffect(() => {
    setBreakdown(api.getStorageBreakdown());
    setCleanupSuggestions(api.getStorageCleanupSuggestions());
  }, []);

  const categories = [
    { label: 'Documents', bytes: breakdown.documentsBytes, icon: FileText, color: 'bg-blue-500' },
    { label: 'Images', bytes: breakdown.imagesBytes, icon: Image, color: 'bg-emerald-500' },
    { label: 'Videos', bytes: breakdown.videosBytes, icon: Video, color: 'bg-purple-500' },
    { label: 'Code & Scripts', bytes: breakdown.codeBytes, icon: Code, color: 'bg-amber-500' },
    { label: 'Other Formats', bytes: breakdown.otherBytes, icon: Archive, color: 'bg-indigo-500' },
    { label: 'Trash Bin', bytes: breakdown.trashBytes, icon: Trash2, color: 'bg-rose-500' },
  ];

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold text-foreground">Storage & Quota Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time telemetry of your cloud storage footprint, distribution, and cleanup opportunities.
          </p>
        </div>

        <Button
          onClick={() => setSmartCleanupModalOpen(true)}
          variant="gradient"
          size="sm"
          className="rounded-xl text-xs font-semibold gap-1.5"
        >
          <Sparkles className="h-4 w-4" />
          Smart Cleanup Optimizer
        </Button>
      </div>

      {/* Main Quota Overview Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Space Allocation
            </span>
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
                {formatBytes(breakdown.usedStorage)}
              </h3>
              <span className="text-sm font-medium text-muted-foreground">
                of {formatBytes(breakdown.totalQuota)} ({breakdown.percentageUsed}% used)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Available Quota</span>
              <span className="text-sm font-bold text-emerald-500">
                {formatBytes(breakdown.availableStorage)} Free
              </span>
            </div>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="space-y-2">
          <Progress value={breakdown.percentageUsed} className="h-3 rounded-full" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>0 GB</span>
            <span>{formatBytes(breakdown.totalQuota)}</span>
          </div>
        </div>

        {/* Storage Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {categories.map((c) => {
            const Icon = c.icon;
            const pct = breakdown.usedStorage > 0 ? Math.round((c.bytes / breakdown.usedStorage) * 100) : 0;
            return (
              <div key={c.label} className="p-3.5 rounded-2xl border border-border/60 bg-secondary/30 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
                  <span className="text-xs font-semibold text-foreground truncate">{c.label}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{formatBytes(c.bytes)}</h4>
                  <span className="text-[10px] text-muted-foreground">{pct}% of usage</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Largest Files Table */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground">Largest Assets</h4>
        <div className="rounded-2xl border border-border/80 overflow-hidden bg-card">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3 hidden sm:table-cell">Extension</th>
                <th className="px-4 py-3 hidden md:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {cleanupSuggestions.largeFiles.map((file) => (
                <tr key={file.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground truncate max-w-xs">{file.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">{formatBytes(file.size_bytes)}</td>
                  <td className="px-4 py-3 uppercase text-muted-foreground hidden sm:table-cell font-mono">{file.extension}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{new Date(file.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10 TB Free Storage Policy & Enterprise Infrastructure */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <div>
          <h4 className="text-sm font-bold text-foreground">Cloud Storage Architecture & Policy</h4>
          <p className="text-xs text-muted-foreground">Every registered user receives a permanent 10 TB high-performance cloud allocation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl border border-border bg-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-foreground">10 TB Permanent Free Storage</h5>
                <Badge variant="success" className="text-[10px] mt-0.5">Active for All Users</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every account is provisioned with 10,995,116,277,760 bytes of zero-throttle cloud storage. No paid tiers, no upgrades, and no subscriptions.
            </p>
          </div>

          <div className="p-5 rounded-3xl border border-border bg-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-foreground">Enterprise Security & Isolation</h5>
                <Badge variant="outline" className="text-[10px] mt-0.5">AES-256 & RLS</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Protected by PostgreSQL Row-Level Security, zero-knowledge directory compartmentalization, and SHA-256 data integrity checksums on every asset.
            </p>
          </div>

          <div className="p-5 rounded-3xl border border-border bg-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-foreground">High-Throughput Chunking</h5>
                <Badge variant="outline" className="text-[10px] mt-0.5">Resumable Transfers</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chunked parallel upload engine with auto-pause, retry diagnostics, and live telemetry supporting large media files and datasets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
