import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Download,
} from 'lucide-react';
import { useDownloadStore } from '@/stores/downloadStore';
import { useUploadStore } from '@/stores/uploadStore';

/**
 * Google Drive-style vertical zipper badge icon
 */
export function ZipperBadge({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md bg-zinc-400/90 dark:bg-zinc-600 text-white shrink-0 shadow-xs ${className}`}
      aria-label="Archive"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        {/* Alternating zipper teeth matching Google Drive */}
        <rect x="7" y="3" width="2.5" height="1.5" rx="0.5" />
        <rect x="10.5" y="5" width="2.5" height="1.5" rx="0.5" />
        <rect x="7" y="7" width="2.5" height="1.5" rx="0.5" />
        <rect x="10.5" y="9" width="2.5" height="1.5" rx="0.5" />
        <rect x="7" y="11" width="2.5" height="1.5" rx="0.5" />
        <rect x="10.5" y="13" width="2.5" height="1.5" rx="0.5" />
        <rect x="8.5" y="15" width="3" height="3" rx="0.5" />
      </svg>
    </div>
  );
}

export function DownloadCenter() {
  const { items, isOpen, isMinimized, setIsOpen, toggleMinimized, clearCompleted } = useDownloadStore();
  const isUploadOpen = useUploadStore(s => s.isOpen && s.queue.length > 0);

  if (!isOpen || items.length === 0) return null;

  const activeItems = items.filter(i => i.status === 'preparing' || i.status === 'zipping');
  const completedItems = items.filter(i => i.status === 'completed');

  // Title header text
  const headerTitle = activeItems.length > 0
    ? 'Preparing download'
    : 'Download ready';

  return (
    <div
      className={`fixed right-5 z-50 w-80 sm:w-88 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-4 ${
        isUploadOpen ? 'bottom-56' : 'bottom-5'
      }`}
    >
      {/* Header bar matching Google Drive layout */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-50/70 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800/80">
        <h4 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight select-none">
          {headerTitle}
        </h4>

        <div className="flex items-center gap-1">
          {completedItems.length > 0 && activeItems.length === 0 && (
            <button
              onClick={clearCompleted}
              className="text-[11px] font-medium text-primary hover:underline px-2 py-1"
            >
              Clear
            </button>
          )}

          <button
            onClick={toggleMinimized}
            className="rounded-full p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-700/60 transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-700/60 transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Item rows */}
      {!isMinimized && (
        <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-1">
          {items.map((item) => {
            const isFinished = item.status === 'completed';
            const isError = item.status === 'error';

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
              >
                {/* Left Zipper icon or File icon */}
                <div className="shrink-0">
                  {item.isArchive ? (
                    <ZipperBadge />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Download className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Middle details */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {isFinished
                      ? `${item.fileName} • Complete`
                      : isError
                      ? item.errorMessage || 'Failed'
                      : item.itemCount > 1
                      ? `${item.fileName} • ${item.progress}%`
                      : `${item.fileName} • Packaging...`}
                  </p>
                </div>

                {/* Right circular progress spinner or status icon */}
                <div className="shrink-0 flex items-center justify-center">
                  {isFinished ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in zoom-in-75 duration-200" />
                  ) : isError ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <div className="relative h-5 w-5 flex items-center justify-center">
                      {/* SVG circular track and progress */}
                      <svg className="h-5 w-5 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          className="stroke-zinc-200 dark:stroke-zinc-700"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          className="stroke-zinc-500 dark:stroke-zinc-300 transition-all duration-300 ease-out"
                          strokeWidth="3.5"
                          strokeDasharray={88}
                          strokeDashoffset={88 - (88 * Math.max(item.progress, 8)) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Subtle spinning indicator */}
                      <div className="absolute inset-0 border-2 border-transparent border-t-zinc-600/40 dark:border-t-white/40 rounded-full animate-spin pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
