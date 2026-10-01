import React from 'react';
import {
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Pause,
  Play,
  FileText,
  Clock,
} from 'lucide-react';
import { useUploadStore } from '@/stores/uploadStore';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/utils';

export function UploadCenter() {
  const { queue, isOpen, setIsOpen, cancelUpload, retryUpload, clearCompleted } = useUploadStore();
  const [isMinimized, setIsMinimized] = React.useState(false);

  if (!isOpen || queue.length === 0) return null;

  const totalFiles = queue.length;
  const completedCount = queue.filter(q => q.status === 'completed').length;
  const activeCount = queue.filter(q => q.status === 'uploading' || q.status === 'queued').length;
  const hasError = queue.some(q => q.status === 'error');

  const overallProgress = Math.round(
    queue.reduce((acc, item) => acc + item.progress, 0) / (totalFiles || 1)
  );

  return (
    <div className="fixed bottom-5 right-5 z-50 w-96 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/80 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground">
              {activeCount > 0 ? `Uploading ${activeCount} item${activeCount > 1 ? 's' : ''}` : `Uploads Complete (${completedCount}/${totalFiles})`}
            </h4>
            <p className="text-[10px] text-muted-foreground">
              {activeCount > 0 ? `${overallProgress}% overall` : 'All transfers finished'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {completedCount > 0 && activeCount === 0 && (
            <button
              onClick={clearCompleted}
              className="text-[11px] text-primary hover:underline px-2 py-1"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Item List */}
      {!isMinimized && (
        <div className="max-h-72 overflow-y-auto divide-y divide-border/40 p-2 space-y-1">
          {queue.map((item) => (
            <div key={item.id} className="p-2.5 rounded-xl hover:bg-accent/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground truncate">{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.status === 'completed' && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  {item.status === 'error' && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <button
                        onClick={() => retryUpload(item.id)}
                        className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="Retry upload"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {(item.status === 'uploading' || item.status === 'queued') && (
                    <button
                      onClick={() => cancelUpload(item.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Cancel upload"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress and speed info */}
              <div className="mt-2 space-y-1">
                <Progress value={item.progress} className="h-1.5" />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {formatBytes(item.bytesUploaded)} / {formatBytes(item.size)}
                  </span>
                  <span>
                    {item.status === 'uploading' && item.speedBytesPerSec > 0
                      ? `${formatBytes(item.speedBytesPerSec)}/s • ${item.progress}%`
                      : item.status === 'completed'
                      ? 'Completed'
                      : item.status === 'error'
                      ? item.errorMessage || 'Failed'
                      : item.status === 'cancelled'
                      ? 'Cancelled'
                      : 'Queued'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
