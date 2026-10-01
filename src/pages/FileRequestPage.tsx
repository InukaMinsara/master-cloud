import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderInput,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Shield,
} from 'lucide-react';
import { api } from '@/services/api';
import { FileRequestRecord } from '@/types/database';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export function FileRequestPage() {
  const { token } = useParams<{ token: string }>();

  const [request, setRequest] = React.useState<FileRequestRecord | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Uploading state
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [uploadedFiles, setUploadedFiles] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    api.getFileRequestByToken(token)
      .then((data) => {
        if (!data) {
          setError('This file request link is invalid or has expired.');
        } else {
          setRequest(data);
        }
      })
      .catch(() => setError('Failed to load file request.'))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !request) return;

    setIsUploading(true);
    setProgress(10);

    const filesArray = Array.from(fileList);
    try {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];

        // Check max size
        if (request.max_file_size_bytes && file.size > request.max_file_size_bytes) {
          toast.error(`File "${file.name}" exceeds maximum allowed size of ${formatBytes(request.max_file_size_bytes)}`);
          continue;
        }

        await api.uploadFile(file, request.target_folder_id, (p) => {
          setProgress(Math.round(((i + p / 100) / filesArray.length) * 100));
        });

        setUploadedFiles(prev => [...prev, file.name]);
      }
      toast.success('Files successfully uploaded to requester!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setProgress(100);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src="/cloud-logo.svg" alt="Master Cloud" className="h-12 w-12 animate-pulse" />
          <span className="text-xs text-muted-foreground">Loading file request portal...</span>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <div className="h-16 w-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">File Request Expired</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-6">{error}</p>
        <Link to="/">
          <Button variant="outline" className="rounded-xl text-xs">Return to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Brand Header */}
      <header className="flex h-16 items-center justify-between px-6 border-b border-border/60 bg-card/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img src="/cloud-logo.svg" alt="Master Cloud" className="h-8 w-8" />
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            MASTER CLOUD
          </span>
        </div>
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> Secure Guest Drop
        </span>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl p-8 rounded-3xl border border-border/80 bg-card shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FolderInput className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{request.title}</h2>
              {request.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{request.description}</p>
              )}
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border hover:border-primary/80 rounded-3xl bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer text-center group"
          >
            <div className="h-16 w-16 rounded-2xl bg-card flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-md mb-3">
              <Upload className="h-8 w-8" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Click to upload or drag files here</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum file size: {formatBytes(request.max_file_size_bytes || 524288000)}
            </p>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Progress Indicator */}
          {isUploading && (
            <div className="space-y-2 p-4 rounded-2xl bg-secondary/50 border border-border">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Uploading to recipient...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Completed Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Uploaded Successfully ({uploadedFiles.length})
              </h5>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {uploadedFiles.map((name, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/60">
        MASTER CLOUD Encrypted Transmission • Zero-Knowledge Architecture
      </footer>
    </div>
  );
}
