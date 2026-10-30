import React from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Download,
  Lock,
  FileText,
  Folder,
  Calendar,
  Eye,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/services/api';
import { DownloadCenter } from '@/components/download/DownloadCenter';
import { ShareLinkRecord } from '@/types/database';
import { FileItem, FolderItem } from '@/types/file';
import { formatBytes, formatDateTime, getFileCategory } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const dParam = searchParams.get('d');

  const [linkData, setLinkData] = React.useState<{ link: ShareLinkRecord; item: FileItem | FolderItem } | null>(null);
  const [password, setPassword] = React.useState('');
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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

  const handleDownload = async () => {
    if (!linkData) return;
    if (linkData.link.resource_type === 'file') {
      await api.downloadFile(linkData.item as FileItem);
    } else {
      await api.downloadFolder(linkData.item as FolderItem);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src="/cloud-logo.svg" alt="Master Cloud" className="h-12 w-12 animate-pulse" />
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
          <img src="/cloud-logo.svg" alt="Master Cloud" className="h-8 w-8" />
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            MASTER CLOUD
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="outline" size="sm" className="rounded-xl text-xs">
              Sign In
            </Button>
          </Link>
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
            {!isFolder && file && file.storage_path && (
              getFileCategory(file.mime_type, file.extension) === 'image' ? (
                <div className="rounded-2xl overflow-hidden border border-border/60 bg-black/40 max-h-72 flex items-center justify-center">
                  <img src={file.storage_path} alt={file.name} className="max-h-72 object-contain" />
                </div>
              ) : getFileCategory(file.mime_type, file.extension) === 'video' ? (
                <div className="rounded-2xl overflow-hidden border border-border/60 bg-black max-h-72 flex items-center justify-center">
                  <video src={file.storage_path} controls playsInline className="max-h-72 w-full object-contain" />
                </div>
              ) : getFileCategory(file.mime_type, file.extension) === 'audio' ? (
                <div className="p-4 rounded-2xl border border-border/60 bg-card">
                  <audio src={file.storage_path} controls className="w-full" />
                </div>
              ) : null
            )}

            {/* Actions */}
            <div className="pt-2">
              {link.allow_download ? (
                <Button
                  variant="gradient"
                  onClick={handleDownload}
                  className="w-full h-12 rounded-2xl text-sm font-semibold"
                >
                  <Download className="h-4 w-4 mr-2" /> Download {isFolder ? 'Folder ZIP' : 'File'}
                </Button>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  The owner has restricted direct downloads for this public link.
                </p>
              )}
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
