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
  Smartphone,
  Laptop,
  FolderOpen,
  Copy,
  ExternalLink,
  QrCode,
  Download,
} from 'lucide-react';
import { api } from '@/services/api';
import { formatBytes } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/uiStore';
import { NativeMobileService } from '@/services/nativeMobile';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

function AppleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 170" fill="currentColor" className={className}>
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.73-7.8-12.08-14.15-6.66-9.67-11.87-20.91-15.63-33.72-3.76-12.81-5.64-24.84-5.64-36.08 0-14.74 3.73-26.79 11.19-36.14 7.46-9.35 16.94-14.17 28.44-14.46 4.79 0 10.15 1.25 16.08 3.76 5.93 2.5 9.77 3.82 11.51 3.94 1.52-.12 5.58-1.5 12.18-4.14 6.6-2.63 12.09-3.78 16.48-3.46 12.75.87 22.84 5.72 30.29 14.54-11.13 6.74-16.59 16.08-16.39 28.02.2 9.54 3.82 17.5 10.87 23.88 7.05 6.38 15.35 10.05 24.9 11.01-2.17 6.74-4.78 13.48-7.83 20.22zM119.22 31.84c0-7.17 2.61-13.91 7.83-20.22 5.22-6.3 11.63-10.43 19.24-12.38.33 2.06.49 4.12.49 6.18 0 7.39-2.72 14.35-8.15 20.87-5.44 6.52-12.18 10.53-20.22 12.03-.43-2.17-.65-4.34-.65-6.47z" />
    </svg>
  );
}

export function StoragePage() {
  const { setSmartCleanupModalOpen } = useUIStore();
  const [breakdown, setBreakdown] = React.useState(() => api.getStorageBreakdown());
  const [cleanupSuggestions, setCleanupSuggestions] = React.useState(() => api.getStorageCleanupSuggestions());
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const webdavUrl = typeof window !== 'undefined'
    ? `http://${window.location.hostname}:8766`
    : 'http://192.168.1.164:8766';

  function copyWebdav() {
    navigator.clipboard.writeText(webdavUrl);
    setCopiedUrl(true);
    toast.success('Apple Files / WebDAV Server URL copied!');
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  React.useEffect(() => {
    const refresh = () => {
      setBreakdown(api.getStorageBreakdown());
      setCleanupSuggestions(api.getStorageCleanupSuggestions());
    };
    refresh();
    window.addEventListener('mc_storage_updated', refresh);
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener('mc_storage_updated', refresh);
      clearInterval(interval);
    };
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

      {/* ── Virtual Storage Mounting for Windows, iPhone & Android ── */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <div>
          <h4 className="text-sm font-bold text-foreground">Mount 10 TB Virtual Storage on Your Devices</h4>
          <p className="text-xs text-muted-foreground">Transform your 10 TB cloud into real local storage on Windows, iPhone, and Android with 0-byte device memory usage.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CARD 1: Apple iPhone & iPad */}
          <div className="p-5 rounded-3xl border-2 border-purple-500/30 bg-card hover:border-purple-500/60 transition-all space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400">
                  <AppleIcon className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-foreground">Apple iPhone &amp; iPad</h5>
                  <Badge className="text-[10px] bg-purple-600 text-white mt-0.5">Files App Mount</Badge>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-500">10.0 TB</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mounts directly into your iPhone's native <b>"Files" (ගොනු) App</b> beside iCloud Drive. Save and stream files with zero iPhone memory used.
            </p>
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/70 flex items-center justify-between text-[11px] font-mono">
              <span className="truncate mr-2 text-foreground">{webdavUrl}</span>
              <button
                onClick={copyWebdav}
                className="text-primary hover:underline flex items-center gap-1 font-semibold shrink-0"
              >
                {copiedUrl ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copiedUrl ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="text-[11px] text-muted-foreground space-y-1">
              <div>1. Open iPhone <b>Files</b> App → tap <b>...</b></div>
              <div>2. Tap <b>"Connect to Server"</b> &amp; paste URL</div>
              <div>3. Connect as <b>Guest</b> → 10 TB storage appears!</div>
            </div>
          </div>

          {/* CARD 2: Windows Virtual Drive (Z:) */}
          <div className="p-5 rounded-3xl border-2 border-blue-500/30 bg-card hover:border-blue-500/60 transition-all space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-foreground">Windows PC Explorer</h5>
                  <Badge className="text-[10px] bg-blue-600 text-white mt-0.5">Z: Drive Mount</Badge>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-500">10.0 TB</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mounts as an NVMe virtual drive in Windows File Explorer (Z:). Open and stream gigabytes of files on demand with 0 bytes on your C: drive.
            </p>
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/70 text-[11px] font-mono text-muted-foreground flex justify-between">
              <span>Drive: <b className="text-foreground">MASTER CLOUD (Z:)</b></span>
              <span className="text-emerald-500 font-bold">Stream Mode</span>
            </div>
            <Link to="/download">
              <Button variant="outline" size="sm" className="w-full text-xs font-bold gap-1.5 mt-2">
                <Laptop className="h-3.5 w-3.5 text-blue-500" />
                Get Windows Client
              </Button>
            </Link>
          </div>

          {/* CARD 3: Android Smartphone 10 TB Virtual Local Drive (SAF) */}
          <div className="p-5 rounded-3xl border-2 border-emerald-500/40 bg-card hover:border-emerald-500/70 transition-all space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-500">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-foreground">Android Virtual Drive</h5>
                  <Badge className="text-[10px] bg-emerald-600 text-white mt-0.5">SAF Storage Provider</Badge>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-500">10.0 TB</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mounts as a real local storage drive directly inside <b>Files by Google</b> and <b>Samsung My Files</b> via Android SAF. Access 10 TB from WhatsApp, Gallery, and Camera with 0-byte phone memory footprint!
            </p>
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/70 text-[11px] font-mono text-muted-foreground flex justify-between">
              <span>Drive: <b className="text-foreground">MASTER CLOUD (10 TB)</b></span>
              <span className="text-emerald-500 font-bold">Stream Mode</span>
            </div>
            
            <div className="space-y-2 pt-1">
              <Button
                onClick={() => NativeMobileService.openSystemFiles()}
                className="w-full text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Open in Android Files App
              </Button>

              <Link to="/download" className="block">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <Download className="h-3.5 w-3.5 text-emerald-500" />
                  Get Android APK (10 TB Drive)
                </Button>
              </Link>
            </div>
          </div>
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
