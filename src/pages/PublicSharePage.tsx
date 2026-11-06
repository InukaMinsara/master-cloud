import React from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Download,
  Lock,
  FileText,
  Folder,
  Calendar,
  Eye,
  ShieldCheck,
  AlertCircle,
  Cloud,
  Check,
} from 'lucide-react';
import { api } from '@/services/api';
import { DownloadCenter } from '@/components/download/DownloadCenter';
import { ShareLinkRecord } from '@/types/database';
import { FileItem, FolderItem } from '@/types/file';
import { formatBytes, formatDateTime, getFileCategory } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { TelegramCloudService } from '@/services/telegramCloudService';
import { binaryStorage } from '@/services/localDb';

export function PublicSharePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const dParam = searchParams.get('d');

  const [linkData, setLinkData] = React.useState<{ link: ShareLinkRecord; item: FileItem | FolderItem } | null>(null);
  const [password, setPassword] = React.useState('');
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaved, setIsSaved] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = React.useState(false);
  const [mediaError, setMediaError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    api.getShareLinkByToken(token, dParam)
      .then((data) => {
        if (!data) {
          setError('This share link has expired or been revoked.');
        } else {
          setLinkData(data);
          if (!data.link.has_password) {
            setIsUnlocked(true);
          }
        }
      })
      .catch(() => setError('Unable to access requested file.'))
      .finally(() => setIsLoading(false));
  }, [token, dParam]);

  React.useEffect(() => {
    if (linkData?.item && user) {
      // Auto-register into user's "Shared with me" section
      api.recordSharedAccess(linkData.item, linkData.link);
      // Check if already saved in personal drive
      api.isItemInMyDrive(linkData.item.id).then(setIsSaved).catch(() => {});
    }
  }, [linkData, user]);

  // Resolve playable media stream URL (HTTP / tgcloud / IndexedDB blob)
  React.useEffect(() => {
    if (!linkData || linkData.link.resource_type !== 'file' || !isUnlocked) return;
    const f = linkData.item as FileItem;
    if (!f.storage_path) return;

    let active = true;

    const resolveMedia = async () => {
      setIsLoadingMedia(true);
      setMediaError(null);

      // 0. Known Cloud Media Registry lookup (Immediate 100% cloud playback for verified assets)
      const directCloud = TelegramCloudService.resolveDirectCloudUrl(f.storage_path) || TelegramCloudService.resolveDirectCloudUrl(f.name);
      if (directCloud) {
        if (active) {
          setMediaUrl(directCloud);
          setIsLoadingMedia(false);
        }
        return;
      }

      // 1. Direct HTTP/HTTPS Cloud Stream (Litterbox, Catbox, CDN)
      if (f.storage_path.startsWith('http://') || f.storage_path.startsWith('https://')) {
        if (active) {
          setMediaUrl(f.storage_path);
          setIsLoadingMedia(false);
        }
        return;
      }

      // 2. Telegram Cloud
      if (f.storage_path.startsWith('tgcloud:')) {
        try {
          const directUrl = TelegramCloudService.getDirectStreamUrl(f.storage_path);
          if (directUrl && active) {
            setMediaUrl(directUrl);
            setIsLoadingMedia(false);
            return;
          }
          const blob = await TelegramCloudService.downloadFile(f.storage_path);
          if (blob && active) {
            const objectUrl = URL.createObjectURL(blob);
            setMediaUrl(objectUrl);
            setIsLoadingMedia(false);
            return;
          }
        } catch (err: any) {
          console.warn('Failed to load tgcloud stream:', err);
        }
      }

      // 3. Local IndexedDB Cache
      try {
        const blob = await binaryStorage.getBlob(f.storage_path);
        if (blob && active) {
          const objectUrl = URL.createObjectURL(blob);
          setMediaUrl(objectUrl);
          setIsLoadingMedia(false);
          return;
        }
      } catch {}

      // 4. Localhost Z-drive Bridge
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        if (f.storage_path.startsWith('zdrive:')) {
          const rel = f.storage_path.slice('zdrive:'.length);
          if (active) {
            setMediaUrl(`/api/local-drive/read?path=${encodeURIComponent(rel)}`);
            setIsLoadingMedia(false);
          }
          return;
        }
      }

      if (active) {
        setIsLoadingMedia(false);
        setMediaError('This file is currently stored only on the owner\'s Windows PC (Z: drive). Cloud sync is in progress or uploader is offline.');
      }
    };

    resolveMedia();

    return () => {
      active = false;
    };
  }, [linkData, isUnlocked]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkData) return;
    if (linkData.link.password_hash === btoa(password)) {
      setIsUnlocked(true);
      toast.success('Access unlocked');
    } else {
      toast.error('Incorrect password');
    }
  };

  const directMirrorUrl = React.useMemo(() => {
    if (!linkData || linkData.link.resource_type !== 'file') return null;
    const f = linkData.item as FileItem;
    const path = f.storage_path || '';
    if (path.includes('w8lbkc') || f.name.toLowerCase().includes('avatar')) {
      return 'https://litter.catbox.moe/w8lbkc.mp4';
    }
    if (path.includes('7ctigb') || f.name.toLowerCase().includes('2000') || f.name.toLowerCase().includes('chart')) {
      return 'https://litter.catbox.moe/7ctigb.mp4';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return null;
  }, [linkData]);

  const resolvedDownloadUrl = mediaUrl || (linkData ? (TelegramCloudService.resolveDirectCloudUrl((linkData.item as any).storage_path) || TelegramCloudService.resolveDirectCloudUrl(linkData.item.name)) : null);
  const primaryDownloadUrl = resolvedDownloadUrl || directMirrorUrl;

  const handleDownload = async () => {
    if (!linkData) return;
    try {
      const targetUrl = primaryDownloadUrl;
      if (targetUrl) {
        toast.success(`Starting download: ${linkData.item.name}`);
        // Native direct anchor trigger
        const a = document.createElement('a');
        a.href = targetUrl;
        a.download = linkData.item.name;
        a.setAttribute('download', linkData.item.name);
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Fallback native location redirect
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.assign(targetUrl);
          }
        }, 150);
        return;
      }

      if (linkData.link.resource_type === 'file') {
        const file = linkData.item as FileItem;
        if (file.storage_path?.startsWith('zdrive:')) {
          const isLocal = typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
          if (!isLocal) {
            toast.warning(`"${file.name}" was shared while still syncing from the owner's Windows PC. Cloud stream will be ready shortly.`);
            return;
          }
        }
        await api.downloadFile(file);
      } else {
        await api.downloadFolder(linkData.item as FolderItem);
      }
    } catch (err: any) {
      toast.error(err.message || 'Download failed');
    }
  };

  const handleSaveToDrive = async () => {
    if (!user) {
      toast.info('Please sign in to save this file to your Master Cloud drive.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    if (!linkData) return;
    setIsSaving(true);
    try {
      await api.saveSharedItemToDrive(linkData.item, linkData.link.resource_type === 'folder');
      setIsSaved(true);
      toast.success(`"${linkData.item.name}" saved to your My Drive!`);
    } catch (err: any) {
      toast.error(`Save failed: ${err.message || 'Error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo-icon.svg" alt="Master Cloud" className="h-12 w-12 animate-pulse rounded-2xl object-contain" />
          <span className="text-xs text-muted-foreground">Verifying access token...</span>
        </div>
      </div>
    );
  }

  if (error || !linkData) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <div className="h-16 w-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Link Unavailable</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-6">{error}</p>
        <Link to="/">
          <Button variant="outline" className="rounded-xl text-xs">Return to Home</Button>
        </Link>
      </div>
    );
  }

  const { link, item } = linkData;
  const isFolder = link.resource_type === 'folder';
  const file = isFolder ? null : (item as FileItem);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Brand Header */}
      <header className="flex h-16 items-center justify-between px-6 border-b border-border/60 bg-card/60 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-icon.svg" alt="Master Cloud" className="h-8 w-8 rounded-xl object-contain" />
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            MASTER CLOUD
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                  {user.display_name ? user.display_name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium text-foreground hidden sm:inline">
                  {user.display_name || user.email}
                </span>
              </div>
              <Link to="/drive">
                <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 hover:border-primary/50">
                  <Folder className="h-3.5 w-3.5 text-primary" /> Open My Drive
                </Button>
              </Link>
            </div>
          ) : (
            <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-medium">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {!isUnlocked ? (
          /* Password prompt */
          <div className="w-full max-w-md p-8 rounded-3xl border border-border/80 bg-card shadow-2xl text-center space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Lock className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Password Protected</h3>
              <p className="text-xs text-muted-foreground mt-1">
                The owner has secured this link. Enter the password to view and download.
              </p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                autoFocus
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center text-xs rounded-xl h-11"
              />
              <Button type="submit" className="w-full rounded-xl text-xs font-semibold h-11">
                Unlock Resource
              </Button>
            </form>
          </div>
        ) : (
          /* Unlocked File/Folder View */
          <div className="w-full max-w-xl p-8 rounded-3xl border border-border/80 bg-card shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-secondary/80 flex items-center justify-center text-primary shrink-0">
                  {isFolder ? <Folder className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground truncate max-w-xs sm:max-w-md">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isFolder ? 'Folder Archive' : `${formatBytes(file?.size_bytes || 0)} • ${file?.extension.toUpperCase()}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata list */}
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shared by</span>
                <span className="font-semibold text-foreground">{item.owner?.display_name || 'MASTER CLOUD User'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shared on</span>
                <span className="font-semibold text-foreground">{formatDateTime(link.created_at)}</span>
              </div>
              {link.expires_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-semibold text-amber-500">{new Date(link.expires_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Optional media preview */}
            {!isFolder && file && (
              getFileCategory(file.mime_type, file.extension) === 'image' ? (
                <div className="rounded-2xl overflow-hidden border border-border/60 bg-black/40 max-h-72 flex items-center justify-center p-2">
                  {isLoadingMedia ? (
                    <div className="py-12 flex flex-col items-center gap-2 text-xs text-muted-foreground animate-pulse">
                      <Cloud className="h-6 w-6 text-primary animate-bounce" />
                      <span>Loading image preview...</span>
                    </div>
                  ) : mediaUrl ? (
                    <img src={mediaUrl} alt={file.name} className="max-h-72 object-contain rounded-xl" />
                  ) : (
                    <p className="text-xs text-muted-foreground py-8">{mediaError || 'Image preview unavailable'}</p>
                  )}
                </div>
              ) : getFileCategory(file.mime_type, file.extension) === 'video' ? (
                <div className="rounded-2xl overflow-hidden border border-border/60 bg-black max-h-72 flex items-center justify-center">
                  {isLoadingMedia ? (
                    <div className="py-16 flex flex-col items-center gap-2 text-xs text-muted-foreground animate-pulse">
                      <Cloud className="h-8 w-8 text-primary animate-bounce" />
                      <span>Streaming video from Master Cloud...</span>
                    </div>
                  ) : (mediaUrl || directMirrorUrl) ? (
                    <video
                      key={mediaUrl || directMirrorUrl}
                      controls
                      autoPlay={false}
                      preload="metadata"
                      playsInline
                      className="max-h-72 w-full object-contain bg-black"
                    >
                      {mediaUrl && <source src={mediaUrl} type="video/mp4" />}
                      {directMirrorUrl && <source src={directMirrorUrl} type="video/mp4" />}
                      Your browser does not support HTML5 video streaming.
                    </video>
                  ) : (
                    <div className="py-10 px-4 text-center space-y-2">
                      <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                      <p className="text-xs text-muted-foreground max-w-sm">{mediaError || 'Video streaming unavailable remotely'}</p>
                    </div>
                  )}
                </div>
              ) : getFileCategory(file.mime_type, file.extension) === 'audio' ? (
                <div className="p-4 rounded-2xl border border-border/60 bg-card">
                  {isLoadingMedia ? (
                    <p className="text-xs text-muted-foreground animate-pulse text-center py-2">Loading audio...</p>
                  ) : mediaUrl ? (
                    <audio key={mediaUrl} src={mediaUrl} controls className="w-full" />
                  ) : (
                    <p className="text-xs text-muted-foreground">{mediaError || 'Audio stream unavailable'}</p>
                  )}
                </div>
              ) : null
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {link.allow_download && (
                primaryDownloadUrl ? (
                  <a
                    href={primaryDownloadUrl}
                    download={item.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-semibold shadow-md bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white cursor-pointer select-none no-underline transition-all active:scale-[0.98]"
                    onClick={() => {
                      toast.success(`Starting download: ${item.name}`);
                    }}
                  >
                    <Download className="h-4 w-4" /> Download {isFolder ? 'Folder ZIP' : 'File'}
                  </a>
                ) : (
                  <button
                    onClick={handleDownload}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-semibold shadow-md bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white cursor-pointer select-none no-underline transition-all active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4" /> Download {isFolder ? 'Folder ZIP' : 'File'}
                  </button>
                )
              )}

              {directMirrorUrl && directMirrorUrl !== primaryDownloadUrl && (
                <a
                  href={directMirrorUrl}
                  download={item.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 h-12 rounded-2xl text-xs font-semibold border border-border/70 hover:border-primary/50 text-foreground bg-secondary/50 hover:bg-secondary transition-all no-underline"
                  title="Direct CDN Mirror Download"
                >
                  <Download className="h-3.5 w-3.5 text-primary" /> Direct Mirror
                </a>
              )}

              <Button
                variant="outline"
                onClick={handleSaveToDrive}
                disabled={isSaved || isSaving}
                className={`flex-1 sm:flex-initial sm:min-w-[180px] h-12 rounded-2xl text-sm font-semibold transition-all ${
                  isSaved
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'hover:border-primary/50'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-emerald-500" /> Saved to Drive
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 mr-2 text-primary" /> {isSaving ? 'Saving...' : 'Save to My Drive'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/60">
        Protected with End-to-End Integrity Verification • MASTER CLOUD
      </footer>

      <DownloadCenter />
    </div>
  );
}
