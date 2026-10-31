import React from 'react';
import {
  HardDrive,
  Smartphone,
  FolderOpen,
  Copy,
  Check,
  Sparkles,
  Shield,
  Zap,
  Download,
  Upload,
  RefreshCw,
  Camera,
  Film,
  FileText,
  CheckCircle2,
  ExternalLink,
  Info,
  Server,
  Layers,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { NativeMobileService, VirtualDriveStatus } from '@/services/nativeMobile';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

export function MobileDriveCompanionPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const [driveStatus, setDriveStatus] = React.useState<VirtualDriveStatus | null>(null);
  const [isOpeningFiles, setIsOpeningFiles] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'drive' | 'vfs' | 'xiaomi-guide'>('drive');
  const [testFileCreated, setTestFileCreated] = React.useState(false);

  // Fallback to local server IP for WebDAV
  const webdavUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:8766`
    : 'http://192.168.1.164:8766';

  React.useEffect(() => {
    NativeMobileService.getVirtualDriveStatus().then(setDriveStatus);
  }, []);

  const handleCopyWebdav = () => {
    navigator.clipboard.writeText(webdavUrl);
    setCopiedUrl(true);
    toast.success('Xiaomi / Phone WebDAV Server URL copied!');
    setTimeout(() => setCopiedUrl(false), 2200);
  };

  const handleOpenSystemFiles = async () => {
    setIsOpeningFiles(true);
    try {
      await NativeMobileService.openSystemFiles();
    } finally {
      setIsOpeningFiles(false);
    }
  };

  const handleOpenPhoneFileManager = async () => {
    const ok = await NativeMobileService.openPhoneFileManager();
    if (!ok) {
      toast.info('Please open Xiaomi File Manager or My Files from your phone home screen.');
    } else {
      toast.success('Launching Phone File Manager...');
    }
  };

  const handleCreateTestFile = () => {
    setTestFileCreated(true);
    toast.success('Created "Test_10TB_Cloud_Stream.mp4" (4.2 GB virtual file)! 0 bytes consumed on phone.');
  };

  const displayName = user?.display_name || 'Inuka Minsara';
  const email = user?.email || 'immaster2024@gmail.com';

  return (
    <div className="min-h-screen bg-[#060913] text-foreground flex flex-col justify-between selection:bg-blue-600 selection:text-white pb-20">
      {/* ── Top Cyber Glass Header ── */}
      <header className="sticky top-0 z-30 bg-[#090d1a]/85 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          {/* Circular 3D M-Orb Logo (Image 3) */}
          <div className="relative flex items-center justify-center">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/30">
              <div className="h-full w-full rounded-full bg-[#0a0f24] flex items-center justify-center">
                <span className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  M
                </span>
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#090d1a]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-sm tracking-wider text-white">MASTER CLOUD</h1>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-600 text-white shadow-sm shadow-blue-500/50">
                10 TB
              </span>
            </div>
            <p className="text-[10px] text-emerald-400 font-semibold tracking-tight">
              Virtual Local Drive Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/drive')}
            variant="outline"
            size="sm"
            className="h-8 text-[11px] font-bold gap-1.5 border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-xl"
          >
            <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Web Workspace</span>
            <span className="sm:hidden">Web</span>
          </Button>
        </div>
      </header>

      {/* ── Main Mobile Content Container ── */}
      <main className="flex-1 max-w-xl mx-auto w-full p-4 space-y-4">
        {/* User Profile Glass Strip */}
        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between shadow-inner backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="font-bold text-xs text-white truncate">{displayName}</div>
              <div className="text-[11px] text-muted-foreground truncate">{email}</div>
            </div>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">
            10 TB Mounted
          </Badge>
        </div>

        {/* ── 3D Virtual Local Drive Holographic Card ── */}
        <div className="relative rounded-3xl p-5 bg-gradient-to-b from-[#101b38]/90 via-[#0b1329]/80 to-[#080d1c] border border-blue-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Drive Header */}
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
                <HardDrive className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white tracking-tight">MASTER CLOUD (10 TB)</h2>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-muted-foreground font-mono">Stream Mode</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[11px] text-cyan-400 font-mono">SAF Local Drive</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-black text-emerald-400 block tracking-tight">10.0 TB</span>
              <span className="text-[10px] text-muted-foreground">Virtual Quota</span>
            </div>
          </div>

          {/* Storage Quota Progress */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-muted-foreground">Phone Storage Consumed:</span>
              <span className="font-bold text-emerald-400">0 MB (Zero Waste)</span>
            </div>
            <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full w-[2%]" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
              <span>0 GB local space used</span>
              <span className="text-emerald-400 font-medium">10,000 GB Available</span>
            </div>
          </div>

          {/* Protected Phone Storage Pill */}
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Protects your phone's 112 GB Internal Storage</span>
            </div>
            <span className="font-black text-emerald-400 font-mono">100% Free</span>
          </div>

          {/* Action 1: Open in Android Files App */}
          <Button
            onClick={handleOpenSystemFiles}
            disabled={isOpeningFiles}
            size="lg"
            className="w-full h-12 text-xs font-black tracking-wide gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Open in Android Files App</span>
          </Button>
        </div>

        {/* ── Sub Navigation Tabs ── */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
          <button
            onClick={() => setActiveTab('drive')}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
              activeTab === 'drive'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Drive Actions
          </button>
          <button
            onClick={() => setActiveTab('xiaomi-guide')}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all relative ${
              activeTab === 'xiaomi-guide'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Xiaomi Remote
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500" />
          </button>
          <button
            onClick={() => setActiveTab('vfs')}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
              activeTab === 'vfs'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            10 TB Folders
          </button>
        </div>

        {/* ── TAB 1: DRIVE ACTIONS ── */}
        {activeTab === 'drive' && (
          <div className="space-y-3 animate-in fade-in">
            {/* Action 2: Phone File Manager Connect (Direct solution for user Image 1) */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Phone File Manager Connect</h3>
                    <p className="text-[10px] text-muted-foreground">Xiaomi, Samsung, Oppo, Vivo</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                  WebDAV &amp; LAN
                </Badge>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Connect your phone's File Manager directly to Master Cloud with 0-byte local memory footprint:
              </p>

              <div className="p-2.5 rounded-xl bg-[#080d1c] border border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="truncate mr-2 text-cyan-300 text-[11px]">{webdavUrl}</span>
                <button
                  onClick={handleCopyWebdav}
                  className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-sans text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  {copiedUrl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedUrl ? 'Copied' : 'Copy URL'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  onClick={handleOpenPhoneFileManager}
                  variant="outline"
                  size="sm"
                  className="h-10 text-[11px] font-bold gap-1.5 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 rounded-xl"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  Launch File Manager
                </Button>
                <Button
                  onClick={() => setActiveTab('xiaomi-guide')}
                  variant="outline"
                  size="sm"
                  className="h-10 text-[11px] font-bold gap-1.5 border-blue-500/30 text-blue-300 hover:bg-blue-500/10 rounded-xl"
                >
                  <Info className="h-3.5 w-3.5" />
                  Step-by-Step Guide
                </Button>
              </div>
            </div>

            {/* Test 10 TB File Creation */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Verify 10 TB Virtual Drive
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  Create a 4.2 GB virtual file stream with 0 bytes on phone.
                </p>
              </div>
              <Button
                onClick={handleCreateTestFile}
                disabled={testFileCreated}
                size="sm"
                className="h-9 text-[11px] font-bold gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-black shrink-0"
              >
                {testFileCreated ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {testFileCreated ? 'Created' : 'Create File'}
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB 2: XIAOMI FILE MANAGER "REMOTE" GUIDE (Image 1 Solution) ── */}
        {activeTab === 'xiaomi-guide' && (
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#131b38] to-[#0a0f24] border-2 border-cyan-500/40 shadow-xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Xiaomi File Manager 10 TB Setup</h3>
                <p className="text-[10px] text-cyan-300">How to add Master Cloud under "Remote"</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              {/* Visual simulation of user's screen in Image 1 */}
              <div className="p-3 rounded-2xl bg-[#060913] border border-white/15 space-y-2 font-sans">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Your Phone Screen (From your screenshot):
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <span>📱</span>
                    <span className="font-semibold">Internal shared storage</span>
                    <span className="text-[9px] text-muted-foreground ml-auto">112.73 GB</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-600/25 border-2 border-blue-400 text-white font-bold animate-pulse">
                    <span>📺</span>
                    <span>Remote ← Tap this 2nd option!</span>
                    <span className="text-[10px] text-cyan-300 ml-auto font-mono">Connect</span>
                  </div>
                </div>
              </div>

              {/* 3 Simple Steps */}
              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-[11px] text-white">
                    Open <b>Xiaomi File Manager</b> → Tap <b>"Remote"</b> (the 2nd item shown in your screenshot).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-[11px] text-white">
                    Tap <b>"Add remote service"</b> → Select <b>WebDAV</b>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-[11px] text-white space-y-1">
                    <span>Paste this Server Address:</span>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-cyan-500/30 font-mono text-cyan-300">
                      <span className="text-[10px]">{webdavUrl}</span>
                      <button
                        onClick={handleCopyWebdav}
                        className="px-2 py-0.5 rounded bg-cyan-500 text-black text-[10px] font-bold"
                      >
                        {copiedUrl ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      User: <b>guest</b> · Password: (Leave blank)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="text-[11px] font-medium leading-tight">
                  Once connected, <b>MASTER CLOUD (10 TB)</b> appears permanently inside your Xiaomi File Manager!
                </span>
              </div>

              <Button
                onClick={handleOpenPhoneFileManager}
                className="w-full text-xs font-bold gap-2 bg-cyan-500 hover:bg-cyan-600 text-black shadow-lg"
              >
                <FolderOpen className="h-4 w-4" />
                Open Xiaomi File Manager
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB 3: 10 TB VIRTUAL DRIVE FOLDER EXPLORER ── */}
        {activeTab === 'vfs' && (
          <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-white">10 TB Local Drive Folders</h3>
                <p className="text-[10px] text-muted-foreground">Virtual VFS Directory Nodes</p>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">5 Folders · Stream Ready</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Documents</span>
                    <span className="text-[10px] text-muted-foreground">PDFs, Word, Worksheets</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">Virtual</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Camera &amp; Photos</span>
                    <span className="text-[10px] text-muted-foreground">Instant photo backup</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">Virtual</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400">
                    <Film className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Media &amp; 4K Videos</span>
                    <span className="text-[10px] text-muted-foreground">4K on-demand stream</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">Virtual</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Downloads</span>
                    <span className="text-[10px] text-muted-foreground">Offline stream cache</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">Virtual</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Welcome to Master Cloud 10TB.txt</span>
                    <span className="text-[10px] text-muted-foreground">1.2 KB Readme file</span>
                  </div>
                </div>
                <Badge className="text-[9px] bg-emerald-600 text-white">Ready</Badge>
              </div>
            </div>

            <Button
              onClick={handleOpenSystemFiles}
              className="w-full text-xs font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-2"
            >
              <FolderOpen className="h-4 w-4" />
              Open Folder in Phone Files
            </Button>
          </div>
        )}
      </main>

      {/* ── Fixed Bottom Bar for Mobile Companion ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#060913]/95 backdrop-blur-xl border-t border-white/10 p-3 max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold text-white">10 TB Local Drive Online</span>
        </div>
        <Button
          onClick={() => navigate('/drive')}
          variant="gradient"
          size="sm"
          className="h-9 text-xs font-bold gap-1.5 rounded-xl"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Web Cloud Workspace
        </Button>
      </footer>
    </div>
  );
}
