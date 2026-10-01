import React from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  FileText,
  Music,
  Video as VideoIcon,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import { usePreviewStore } from '@/stores/previewStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { formatBytes, formatDateRelative, getFileCategory } from '@/lib/utils';
import { api } from '@/services/api';

export function FilePreviewModal() {
  const { activeFile, isOpen, closePreview, nextFile, prevFile, fileList } = usePreviewStore();
  const { setShareModalItem } = useUIStore();

  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [textContent, setTextContent] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  // Keyboard navigation: Escape, Left Arrow, Right Arrow
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') closePreview();
      if (e.key === 'ArrowRight') nextFile();
      if (e.key === 'ArrowLeft') prevFile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePreview, nextFile, prevFile]);

  // Load preview data whenever activeFile changes
  React.useEffect(() => {
    if (!activeFile) {
      setBlobUrl(null);
      setTextContent(null);
      return;
    }

    setZoom(1);
    setRotation(0);
    setIsLoading(true);

    const loadData = async () => {
      try {
        const blob = await api.getFileBlob(activeFile.storage_path);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);

          const category = getFileCategory(activeFile.mime_type, activeFile.extension);
          if (category === 'code' || category === 'document' || activeFile.extension === 'txt' || activeFile.extension === 'json' || activeFile.extension === 'yaml' || activeFile.extension === 'csv') {
            const text = await blob.text();
            setTextContent(text);
          }
        } else {
          setBlobUrl(null);
          setTextContent(null);
        }
      } catch (err) {
        console.error('Failed to load preview blob:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [activeFile?.id]);

  if (!isOpen || !activeFile) return null;

  const category = getFileCategory(activeFile.mime_type, activeFile.extension);
  const currentIndex = fileList.findIndex(f => f.id === activeFile.id);

  const handleDownload = async () => {
    await api.downloadFile(activeFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3 truncate max-w-md">
          <span className="font-semibold text-sm truncate">{activeFile.name}</span>
          <span className="text-xs text-white/50 hidden sm:inline">
            ({formatBytes(activeFile.size_bytes)})
          </span>
          {fileList.length > 1 && (
            <span className="text-xs text-white/40 hidden md:inline">
              {currentIndex + 1} of {fileList.length}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {category === 'image' && (
            <>
              <button
                onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                className="p-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
                className="p-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                title="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="border-white/20 bg-white/5 text-white hover:bg-white/20 h-9 text-xs rounded-xl"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareModalItem({ item: activeFile, isFolder: false })}
            className="border-white/20 bg-white/5 text-white hover:bg-white/20 h-9 text-xs rounded-xl hidden sm:flex"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share
          </Button>

          <button
            onClick={closePreview}
            className="p-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors ml-2"
            title="Close preview (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Workspace */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* Next / Previous cycling arrows */}
        {fileList.length > 1 && (
          <>
            <button
              onClick={prevFile}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-md"
              title="Previous file (Left arrow)"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextFile}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-md"
              title="Next file (Right arrow)"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Content Viewer according to category */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <span className="text-xs text-white/60">Loading asset...</span>
          </div>
        ) : category === 'image' ? (
          <div className="overflow-auto max-h-full max-w-full flex items-center justify-center">
            <img
              src={blobUrl || `https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200`}
              alt={activeFile.name}
              className="max-h-[80vh] max-w-[85vw] object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            />
          </div>
        ) : category === 'video' ? (
          <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/10">
            {blobUrl ? (
              <video src={blobUrl} controls autoPlay className="h-full w-full" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <VideoIcon className="h-12 w-12 text-purple-400" />
                <h4 className="text-base font-semibold">{activeFile.name}</h4>
                <p className="text-xs text-white/60">Video ready for direct streaming playback.</p>
                <Button variant="default" onClick={handleDownload} className="mt-2 text-xs">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download Video
                </Button>
              </div>
            )}
          </div>
        ) : category === 'audio' ? (
          <div className="w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 flex flex-col items-center gap-6 shadow-2xl">
            <div className="h-24 w-24 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Music className="h-12 w-12" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold truncate max-w-xs">{activeFile.name}</h4>
              <p className="text-xs text-white/60">{formatBytes(activeFile.size_bytes)}</p>
            </div>
            <audio src={blobUrl || undefined} controls autoPlay className="w-full rounded-xl" />
          </div>
        ) : textContent !== null ? (
          <div className="w-full max-w-4xl h-[75vh] rounded-2xl bg-card text-foreground border border-border overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/80 border-b border-border text-xs text-muted-foreground font-mono">
              <span>{activeFile.name}</span>
              <span>{activeFile.extension.toUpperCase()}</span>
            </div>
            <pre className="flex-1 p-4 font-mono text-xs overflow-auto bg-secondary/20 whitespace-pre-wrap select-text">
              {textContent}
            </pre>
          </div>
        ) : (
          /* Unsupported file fallback: Clean metadata and download option */
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
            <div className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center text-white/80 mb-4">
              <FileText className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 truncate max-w-xs">{activeFile.name}</h3>
            <p className="text-xs text-white/60 mb-6">
              Preview is not supported for this file format ({activeFile.extension.toUpperCase()}). You can download the file to inspect it.
            </p>
            <Button variant="default" onClick={handleDownload} className="rounded-xl px-6">
              <Download className="h-4 w-4 mr-2" /> Download File ({formatBytes(activeFile.size_bytes)})
            </Button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex h-12 items-center justify-between px-6 border-t border-white/10 bg-black/40 text-xs text-white/50">
        <span>Uploaded {formatDateRelative(activeFile.created_at)}</span>
        <span>MASTER CLOUD High-Fidelity Asset Viewer</span>
      </div>
    </div>
  );
}
