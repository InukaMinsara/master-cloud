import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cloud,
  HardDrive,
  Upload,
  FolderPlus,
  FileText,
  Sparkles,
  Clock,
  Star,
  Users,
  Activity,
  CheckCircle2,
  Laptop,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Presentation,
  CheckSquare,
  Palette,
  BookOpen,
  Trash2,
  ShieldCheck,
  Zap,
  Layers,
  Download,
  ArrowUpRight,
  Film,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useFileStore } from '@/stores/fileStore';
import { useUploadStore } from '@/stores/uploadStore';
import { useUIStore } from '@/stores/uiStore';
import { api } from '@/services/api';
import { formatBytes, formatDateRelative } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileCard } from '@/components/files/FileCard';
import { FolderCard } from '@/components/files/FolderCard';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { files, folders, fetchItems, currentFolderId } = useFileStore();
  const { addFiles } = useUploadStore();
  const { setNewFolderModalOpen } = useUIStore();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'starred' | 'shared'>('recent');

  const [breakdown, setBreakdown] = useState(() => api.getStorageBreakdown());
  const totalQuota = breakdown.totalQuota;
  const usedBytes = breakdown.usedStorage;
  const availableBytes = Math.max(0, totalQuota - usedBytes);
  const usagePercentage = Math.min(100, Math.max(0.01, (usedBytes / totalQuota) * 100));

  useEffect(() => {
    fetchItems();
    const updateStats = () => setBreakdown(api.getStorageBreakdown());
    window.addEventListener('mc_storage_updated', updateStats);
    const interval = setInterval(updateStats, 3000);
    return () => {
      window.removeEventListener('mc_storage_updated', updateStats);
      clearInterval(interval);
    };
  }, [fetchItems]);

  const recentFiles = files.filter(f => !f.deleted_at).slice(0, 6);
  const starredFiles = files.filter(f => f.is_starred && !f.deleted_at);
  const recentFolders = folders.filter(f => !f.deleted_at).slice(0, 4);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files, currentFolderId);
    }
  };

  const quickShortcuts = [
    { label: 'My Drive', path: '/drive', icon: HardDrive, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Shared with me', path: '/shared', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Media Library', path: '/media', icon: Film, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Recent Files', path: '/recent', icon: Clock, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Starred Files', path: '/starred', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Trash Bin', path: '/trash', icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 select-none bg-background text-foreground">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* ─── 1. TOP WELCOME & HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Welcome back, {user?.display_name || user?.email?.split('@')[0] || 'User'} 👋
            </h1>
            <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30">
              10 TB Free
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Here is your intelligent cloud overview, storage telemetry, and quick workspace actions.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl gap-2 font-bold text-xs"
          >
            <Upload className="h-4 w-4 text-primary" />
            Upload Files
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/drive')}
            className="rounded-xl gap-2 font-bold text-xs shadow-md shadow-primary/20"
          >
            <HardDrive className="h-4 w-4" />
            Open My Drive
          </Button>
        </div>
      </div>

      {/* ─── 2. STORAGE CARD & SYSTEM STATUS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Card (2 cols on large) */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">10 TB Permanent Free Storage</h2>
                <p className="text-xs text-muted-foreground">Zero subscription fees • Zero upgrade limits</p>
              </div>
            </div>
            <Link to="/storage" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                {formatBytes(usedBytes)} used <span className="text-muted-foreground">of 10.00 TB</span>
              </span>
              <span className="font-mono text-xs font-bold text-primary">
                {formatBytes(availableBytes)} available ({usagePercentage.toFixed(2)}%)
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2.5 rounded-full bg-secondary" />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/60">
            <div className="p-3 rounded-2xl bg-secondary/50 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Total Files</span>
              <p className="text-base font-black text-foreground">{files.filter(f => !f.deleted_at).length}</p>
            </div>
            <div className="p-3 rounded-2xl bg-secondary/50 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Folders</span>
              <p className="text-base font-black text-foreground">{folders.filter(f => !f.deleted_at).length}</p>
            </div>
            <div className="p-3 rounded-2xl bg-secondary/50 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Starred</span>
              <p className="text-base font-black text-foreground">{starredFiles.length}</p>
            </div>
          </div>
        </div>

        {/* System & Sync Status Card */}
        <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                System Status
              </span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-foreground">Cloud Storage</span>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                  Connected
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-purple-500" />
                  <span className="font-semibold text-foreground">Windows Drive (Z:)</span>
                </div>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                  Stream Mode
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-foreground">Sync Engine</span>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                  Nominal
                </Badge>
              </div>
            </div>
          </div>

          <Link
            to="/download"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-2xl bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download Windows Client
          </Link>
        </div>
      </div>

      {/* ─── 3. QUICK WORKSPACE ACTIONS ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Quick Workspace Actions
          </h2>
          <Link to="/drive" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            Browse Drive <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickShortcuts.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.label}
                onClick={() => navigate(c.path)}
                className="p-3.5 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all text-left flex flex-col justify-between group"
              >
                <div className={`h-9 w-9 rounded-xl ${c.bg} ${c.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground truncate">{c.label}</span>
                <span className="text-[10px] text-muted-foreground">Open &rarr;</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 4. RECENT FOLDERS ─── */}
      {recentFolders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Folders
            </h2>
            <Link to="/drive" className="text-xs font-bold text-primary hover:underline">
              Go to My Drive
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {recentFolders.map((f) => (
              <FolderCard key={f.id} folder={f} />
            ))}
          </div>
        </div>
      )}

      {/* ─── 5. RECENT / STARRED / SHARED TABS ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'recent' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <Clock className="h-3.5 w-3.5 inline-block mr-1.5" />
              Recently Opened
            </button>
            <button
              onClick={() => setActiveTab('starred')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'starred' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <Star className="h-3.5 w-3.5 inline-block mr-1.5" />
              Starred ({starredFiles.length})
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'shared' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <Users className="h-3.5 w-3.5 inline-block mr-1.5" />
              Shared with Me
            </button>
          </div>

          <Link to="/drive" className="text-xs font-bold text-primary hover:underline">
            View All Files ({files.filter(f => !f.deleted_at).length})
          </Link>
        </div>

        {/* Tab Content */}
        {activeTab === 'recent' && (
          <div>
            {recentFiles.length === 0 ? (
              <div className="text-center py-12 rounded-3xl border border-dashed border-border/80 bg-card/40 space-y-3">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs font-semibold text-muted-foreground">No recent files opened yet</p>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl text-xs">
                  Upload your first file
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {recentFiles.map((f) => (
                  <FileCard key={f.id} file={f} allFiles={recentFiles} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'starred' && (
          <div>
            {starredFiles.length === 0 ? (
              <div className="text-center py-12 rounded-3xl border border-dashed border-border/80 bg-card/40 space-y-3">
                <Star className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs font-semibold text-muted-foreground">No starred files yet</p>
                <p className="text-[11px] text-muted-foreground">Star important files to quickly access them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {starredFiles.map((f) => (
                  <FileCard key={f.id} file={f} allFiles={starredFiles} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'shared' && (
          <div className="text-center py-12 rounded-3xl border border-dashed border-border/80 bg-card/40 space-y-3">
            <Users className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">No shared files currently</p>
            <p className="text-[11px] text-muted-foreground">Items shared with you by other collaborators will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
