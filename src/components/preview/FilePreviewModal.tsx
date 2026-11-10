import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Music,
  Video as VideoIcon,
  FileSpreadsheet,
  Presentation,
  Copy,
  Check,
  ExternalLink,
  Code,
  Sparkles,
  Layers,
  Zap,
  SlidersHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { VgpuService } from '@/services/vgpuService';
import { usePreviewStore, PreviewQuality, QUALITY_OPTIONS } from '@/stores/previewStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBytes, formatDateRelative, getFileCategory } from '@/lib/utils';
import { api } from '@/services/api';
import { TelegramCloudService } from '@/services/telegramCloudService';
import { VideoPosterService } from '@/services/videoPosterService';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0) {
    return `${hrs}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function FilePreviewModal() {
  const navigate = useNavigate();
  const {
    activeFile,
    isOpen,
    closePreview,
    nextFile,
    prevFile,
    fileList,
    previewQuality,
    setPreviewQuality,
  } = usePreviewStore();
  const { setShareModalItem } = useUIStore();

  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [displayImageUrl, setDisplayImageUrl] = React.useState<string | null>(null);
  const [scaledDims, setScaledDims] = React.useState<{
    width: number;
    height: number;
    origWidth: number;
    origHeight: number;
  } | null>(null);
  const [textContent, setTextContent] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [mediaError, setMediaError] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState<number>(1);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const videoContainerRef = React.useRef<HTMLDivElement>(null);

  const handleMediaError = async () => {
    if (activeFile && !mediaError) {
      setMediaError(true);
      try {
        const blob = await api.getFileBlob(activeFile.storage_path);
        if (blob) {
          const freshUrl = URL.createObjectURL(blob);
          setBlobUrl(freshUrl);
        }
      } catch {}
    }
  };

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
    setMediaError(false);

    const loadData = async () => {
      try {
        VgpuService.acceleratePreview(activeFile);
        const category = getFileCategory(activeFile.mime_type, activeFile.extension);
        const ext = activeFile.extension.toLowerCase();

        // 0. Known Cloud Media Direct Stream & Proxy (Instant 0ms verified stream)
        const directCloud = TelegramCloudService.resolveDirectCloudUrl(activeFile.storage_path) ||
          TelegramCloudService.resolveDirectCloudUrl(activeFile.name);
        if (directCloud) {
          if (
            category === 'video' ||
            category === 'audio' ||
            category === 'image' ||
            ext === 'pdf' ||
            activeFile.mime_type.includes('pdf')
          ) {
            setBlobUrl(directCloud);
            setIsLoading(false);
            return;
          }
        }

        // 0.1 Ultra-Fast Zero-Delay Instant Direct Stream for HTTP / HTTPS (Catbox, Cloud URLs)
        if (activeFile.storage_path?.startsWith('http://') || activeFile.storage_path?.startsWith('https://')) {
          if (
            category === 'video' ||
            category === 'audio' ||
            category === 'image' ||
            ext === 'pdf' ||
            activeFile.mime_type.includes('pdf')
          ) {
            setBlobUrl(activeFile.storage_path);
            setIsLoading(false);
            return;
          }
          if (
            category === 'code' ||
            category === 'document' ||
            ['txt', 'json', 'yaml', 'yml', 'csv', 'md', 'xml'].includes(ext)
          ) {
            try {
              const res = await fetch(activeFile.storage_path);
              const text = await res.text();
              setTextContent(text);
              setIsLoading(false);
              return;
            } catch (e) {
              console.warn('Direct HTTP text fetch failed, falling back:', e);
            }
          }
        }

        // 1. Instant Zero-Delay Direct Stream for Z: drive / Local Disk media (when running locally)
        if (activeFile.storage_path?.startsWith('zdrive:')) {
          const rel = activeFile.storage_path.slice('zdrive:'.length);
          const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
          if (isLocal) {
            const directStreamUrl = `/api/local-drive/read?path=${encodeURIComponent(rel)}`;

            if (
              category === 'video' ||
              category === 'audio' ||
              category === 'image' ||
              ext === 'pdf' ||
              activeFile.mime_type.includes('pdf')
            ) {
              setBlobUrl(directStreamUrl);
              setIsLoading(false);
              return;
            }
          }
        }

        // 2. Direct stream for Telegram Cloud / Multi-CDN single chunks
        if (activeFile.storage_path?.startsWith('tgcloud:')) {
          const directStreamUrl = TelegramCloudService.getDirectStreamUrl(activeFile.storage_path);
          if (
            directStreamUrl &&
            (category === 'video' ||
              category === 'audio' ||
              category === 'image' ||
              ext === 'pdf' ||
              activeFile.mime_type.includes('pdf'))
          ) {
            setBlobUrl(directStreamUrl);
            setIsLoading(false);
            return;
          }
        }

        // 3. Unified Blob Loader (Cached from IndexedDB or downloaded from cloud)
        const blob = await api.getFileBlob(activeFile.storage_path);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);

          // If text, code, csv, spreadsheet, or doc format, read text representation
          if (
            category === 'code' ||
            category === 'document' ||
            ['txt', 'json', 'yaml', 'yml', 'csv', 'md', 'xml', 'xlsx', 'xls', 'msheet', 'docx', 'doc', 'mdoc', 'pptx', 'mslide'].includes(ext)
          ) {
            try {
              const text = await blob.text();
              setTextContent(text);
            } catch {
              setTextContent(null);
            }
          } else {
            setTextContent(null);
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
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [activeFile?.id]);

  const ext = activeFile?.extension.toLowerCase() || '';
  const category = activeFile ? getFileCategory(activeFile.mime_type, activeFile.extension) : 'other';
  const currentIndex = activeFile ? fileList.findIndex((f) => f.id === activeFile.id) : -1;

  // Handle Dynamic Image Resolution Scaling & Canvas Quality Adaptation
  React.useEffect(() => {
    if (!blobUrl || category !== 'image') {
      setDisplayImageUrl(blobUrl);
      setScaledDims(null);
      return;
    }

    if (previewQuality === 'original') {
      setDisplayImageUrl(blobUrl);
      const img = new Image();
      img.src = blobUrl;
      img.onload = () => {
        setScaledDims({
          width: img.naturalWidth,
          height: img.naturalHeight,
          origWidth: img.naturalWidth,
          origHeight: img.naturalHeight,
        });
      };
      return;
    }

    let active = true;
    let generatedObjectUrl: string | null = null;
    const img = new Image();
    if (blobUrl.startsWith('http://') || blobUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (!active) return;
      const opt = QUALITY_OPTIONS.find((q) => q.id === previewQuality) || QUALITY_OPTIONS[0];
      const origW = img.naturalWidth;
      const origH = img.naturalHeight;
      // Direct true scale multiplier on dimensions
      const targetW = Math.max(32, Math.round(origW * opt.scale));
      const targetH = Math.max(32, Math.round(origH * opt.scale));

      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = previewQuality !== '360p';
          ctx.imageSmoothingQuality = previewQuality === '360p' ? 'low' : 'medium';
          ctx.drawImage(img, 0, 0, targetW, targetH);
          canvas.toBlob(
            (blob) => {
              if (!active || !blob) return;
              generatedObjectUrl = URL.createObjectURL(blob);
              setDisplayImageUrl(generatedObjectUrl);
              setScaledDims({
                width: targetW,
                height: targetH,
                origWidth: origW,
                origHeight: origH,
              });
            },
            'image/jpeg',
            opt.jpegQuality
          );
        }
      } catch (err) {
        console.warn('Canvas scaling fallback to original:', err);
        if (active) setDisplayImageUrl(blobUrl);
      }
    };

    img.onerror = () => {
      if (active) setDisplayImageUrl(blobUrl);
    };

    img.src = blobUrl;

    return () => {
      active = false;
      if (generatedObjectUrl) {
        URL.revokeObjectURL(generatedObjectUrl);
      }
    };
  }, [blobUrl, previewQuality, category]);

  // Real-time Canvas Video Quality Resampler
  React.useEffect(() => {
    if (category !== 'video' || previewQuality === 'original' || !blobUrl) return;

    let animId: number;
    const renderVideo = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        const opt = QUALITY_OPTIONS.find((q) => q.id === previewQuality) || QUALITY_OPTIONS[0];
        const targetW = Math.max(160, Math.round(video.videoWidth * opt.scale));
        const targetH = Math.max(90, Math.round(video.videoHeight * opt.scale));

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = previewQuality !== '360p';
          ctx.imageSmoothingQuality = previewQuality === '360p' ? 'low' : 'medium';
          ctx.drawImage(video, 0, 0, targetW, targetH);
        }
      }
      animId = requestAnimationFrame(renderVideo);
    };

    animId = requestAnimationFrame(renderVideo);
    return () => cancelAnimationFrame(animId);
  }, [category, previewQuality, blobUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsPlaying(!videoRef.current.paused);
      if (playbackRate !== 1) {
        videoRef.current.playbackRate = playbackRate;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    toast.success(`Video speed set to ${speed}x`);
  };

  const handleQualityChange = (q: PreviewQuality) => {
    setPreviewQuality(q);
    const opt = QUALITY_OPTIONS.find((o) => o.id === q);
    if (opt) {
      toast.success(`Preview quality: ${opt.label}`);
    }
  };

  const currentQualityOption = QUALITY_OPTIONS.find((q) => q.id === previewQuality) || QUALITY_OPTIONS[0];

  const handleDownload = async () => {
    if (activeFile) await api.downloadFile(activeFile);
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setIsCopied(true);
      toast.success('Text copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };


  // Determine specific document sub-type
  const isSpreadsheet = ['xlsx', 'xls', 'csv', 'msheet', 'mexcel'].includes(ext);
  const isDoc = ['docx', 'doc', 'mdoc', 'mword'].includes(ext);
  const isPresentation = ['pptx', 'ppt', 'mslide'].includes(ext);
  const isCodeOrText = category === 'code' || ['txt', 'md', 'json', 'yaml', 'yml', 'xml', 'log', 'sh', 'sql', 'js', 'ts', 'tsx'].includes(ext);

  // Parse CSV/spreadsheet rows if available - called unconditionally
  const parsedRows = React.useMemo(() => {
    if (!isSpreadsheet || !textContent) return [];
    return textContent
      .trim()
      .split('\n')
      .slice(0, 50)
      .map((row) => row.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')));
  }, [isSpreadsheet, textContent]);

  if (!isOpen || !activeFile) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white select-none animate-in fade-in duration-200">
      {/* ─── Top Header Bar ─── */}
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-black/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 truncate max-w-md">
          <span className="font-semibold text-sm truncate">{activeFile.name}</span>
          <Badge variant="outline" className="text-[10px] uppercase font-bold text-white/70 border-white/20">
            {ext || 'FILE'}
          </Badge>
          <span className="text-xs text-white/50 hidden sm:inline">
            ({formatBytes(activeFile.size_bytes)})
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hidden sm:inline-flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" /> 50x vGPU
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
                onClick={() => setZoom((prev) => Math.min(prev + 0.25, 3))}
                className="p-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.5))}
                className="p-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                title="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </>
          )}

          {(category === 'image' || category === 'video') && (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all shadow-sm"
                  title="Change preview resolution and quality"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="hidden sm:inline text-white/70">Quality:</span>
                  <span className="text-cyan-300 font-bold">{currentQualityOption.badge}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="right" className="min-w-[240px] bg-zinc-900/95 border-white/15 text-white">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  Select {category === 'image' ? 'Image' : 'Video'} Quality
                </div>
                {QUALITY_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.id}
                    onClick={() => handleQualityChange(opt.id)}
                    className={`flex items-center justify-between py-2 text-xs cursor-pointer ${
                      previewQuality === opt.id
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-[10px] text-white/50">{opt.desc}</span>
                    </div>
                    {previewQuality === opt.id && <Check className="h-4 w-4 text-cyan-400 ml-2 shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}


          {isDoc && (
            <Button
              size="sm"
              onClick={() => {
                closePreview();
                navigate(`/canvas/docs/${activeFile.id}`);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-9 text-xs rounded-xl shadow-lg shadow-blue-500/20"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Open in Docs
            </Button>
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

      {/* ─── Main Preview Workspace ─── */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden min-h-0">
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

        {/* Content Viewer according to category & file type */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-white/20 border-t-primary" />
            <span className="text-xs text-white/70 font-medium">Fetching real asset preview...</span>
          </div>
        ) : category === 'image' ? (
          /* ── 1. IMAGE VIEWER WITH LIVE QUALITY SELECTOR ── */
          <div className="relative flex flex-col items-center justify-center max-h-full max-w-full">
            <div className="overflow-auto max-h-[72vh] max-w-[85vw] flex items-center justify-center">
              {displayImageUrl ? (
                <img
                  src={displayImageUrl}
                  alt={activeFile.name}
                  loading="eager"
                  decoding="async"
                  onError={handleMediaError}
                  className="object-contain rounded-xl shadow-2xl transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    imageRendering: previewQuality === '360p' ? 'pixelated' : 'auto',
                    aspectRatio:
                      scaledDims?.origWidth && scaledDims?.origHeight
                        ? `${scaledDims.origWidth} / ${scaledDims.origHeight}`
                        : undefined,
                    maxHeight: '72vh',
                    maxWidth: '85vw',
                    width: scaledDims?.origWidth ? `${Math.min(scaledDims.origWidth, 1000)}px` : 'auto',
                    height: 'auto',
                  }}
                />
              ) : (
                <div className="p-8 text-center bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-white/60 text-sm">Image preview unavailable</span>
                </div>
              )}
            </div>

            {/* Floating Live Quality Bar for Instant 1-Click Selection */}
            {displayImageUrl && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl z-20">
                <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-white/60">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Quality:</span>
                </div>
                {QUALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleQualityChange(opt.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      previewQuality === opt.id
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 scale-105'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    title={`${opt.label} - ${opt.desc}`}
                  >
                    {opt.badge}
                  </button>
                ))}
                {scaledDims && (
                  <div className="text-[10px] text-cyan-300/90 font-mono px-2 py-0.5 rounded-lg bg-cyan-950/40 border border-cyan-800/30 hidden sm:inline-flex items-center gap-1">
                    <span>{scaledDims.width} × {scaledDims.height}</span>
                    {scaledDims.origWidth !== scaledDims.width && (
                      <span className="text-white/40">({Math.round((scaledDims.width / scaledDims.origWidth) * 100)}%)</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (ext === 'pdf' || activeFile.mime_type.includes('pdf')) && blobUrl ? (
          /* ── 2. PDF VIEWER ── */
          <div className="w-full max-w-5xl h-[80vh] rounded-2xl bg-white overflow-hidden shadow-2xl flex flex-col border border-white/10">
            <iframe
              src={blobUrl}
              title={activeFile.name}
              className="w-full h-full border-none"
            />
          </div>
        ) : category === 'video' ? (
          /* ── 3. VIDEO VIEWER WITH REAL-TIME RESOLUTION DOWNMIXER ── */
          <div className="relative flex flex-col items-center justify-center max-w-full">
            <div
              ref={videoContainerRef}
              className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative flex items-center justify-center border border-white/10 group select-none"
            >
              {blobUrl ? (
                <>
                  {/* Native Video (shown in full hardware acceleration with zero-latency poster) */}
                  <video
                    ref={videoRef}
                    key={blobUrl}
                    src={blobUrl}
                    poster={activeFile ? VideoPosterService.getVideoPoster(activeFile.name, activeFile.size_bytes) : undefined}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    onError={handleMediaError}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    className="h-full w-full object-contain"
                  />

                  {/* Real-time Dynamic Canvas Resampler (renders genuine downscaled resolution & compression) */}
                  {previewQuality !== 'original' && (
                    <canvas
                      ref={canvasRef}
                      onClick={togglePlay}
                      className="h-full w-full object-contain cursor-pointer"
                      style={{
                        imageRendering: previewQuality === '360p' ? 'pixelated' : 'auto',
                      }}
                    />
                  )}

                  {/* Big Play Overlay Button */}
                  {!isPlaying && (
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/35 z-10 hover:bg-black/45 transition-colors"
                      title="Play"
                    >
                      <div className="h-16 w-16 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-xl shadow-cyan-500/40 hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 ml-1 fill-black" />
                      </div>
                    </button>
                  )}

                  {/* Sleek Custom Media Controls Overlay */}
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Scrubbable Timeline Progress */}
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        step={0.1}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2 transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-white">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          title={isPlaying ? 'Pause' : 'Play'}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={toggleMute}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            title={isMuted ? 'Unmute' : 'Mute'}
                          >
                            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                          />
                        </div>

                        <span className="text-[11px] font-mono text-white/70">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Current Real Resolution Badge */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {currentQualityOption.badge}
                        </span>

                        {/* Speed Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger className="cursor-pointer">
                            <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                              {playbackRate}x
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="right" className="bg-zinc-900/95 border-white/15 min-w-[100px] text-white">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleSpeedChange(s)}
                                className={playbackRate === s ? 'text-cyan-400 font-bold' : 'text-white/80'}
                              >
                                {s}x Speed
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                          onClick={toggleFullscreen}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          title="Fullscreen"
                        >
                          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center p-8 bg-white/5 rounded-3xl max-w-md border border-white/10">
                  <div className="h-16 w-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <VideoIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{activeFile.name}</h4>
                    <p className="text-xs text-white/60 mt-1">High-definition video ready for playback & download.</p>
                  </div>
                  <Button variant="default" onClick={handleDownload} className="rounded-xl text-xs gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Download Video ({formatBytes(activeFile.size_bytes)})
                  </Button>
                </div>
              )}
            </div>

            {/* Video Quality & Playback Speed Floating Control Bar */}
            {blobUrl && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 p-1.5 bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl z-20">
                {/* Quality Switcher */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-white/60">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Quality:</span>
                  </div>
                  {QUALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleQualityChange(opt.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                        previewQuality === opt.id
                          ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 scale-105'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      title={`${opt.label} - ${opt.desc}`}
                    >
                      {opt.badge}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-white/20 hidden md:block" />

                <div className="text-[10px] font-bold text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-950/40 border border-cyan-800/30 hidden lg:flex items-center gap-1">
                  <Zap className="h-3 w-3 text-cyan-400" />
                  <span>
                    {previewQuality === 'original'
                      ? '100% Native Uncompressed Stream'
                      : `Hardware Resampled: ${Math.round(currentQualityOption.scale * 100)}% (${currentQualityOption.desc})`}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : category === 'audio' ? (
          /* ── 4. AUDIO VIEWER ── */
          <div className="w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 flex flex-col items-center gap-6 shadow-2xl">
            <div className="h-24 w-24 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-lg shadow-rose-500/10">
              <Music className="h-12 w-12 animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold truncate max-w-xs">{activeFile.name}</h4>
              <p className="text-xs text-white/60">{formatBytes(activeFile.size_bytes)} • High-Fidelity Audio</p>
            </div>
            {blobUrl ? (
              <audio src={blobUrl} controls autoPlay preload="auto" onError={handleMediaError} className="w-full rounded-xl" />
            ) : (
              <Button variant="default" onClick={handleDownload} className="rounded-xl text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download Audio
              </Button>
            )}
          </div>
        ) : isSpreadsheet && parsedRows.length > 0 ? (
          /* ── 5. EXCEL / SPREADSHEET VIEWER ── */
          <div className="w-full max-w-5xl h-[78vh] rounded-2xl bg-card text-foreground border border-border overflow-hidden flex flex-col shadow-2xl">
            {/* Sheet Top Ribbon */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-600/15 border-b border-border text-xs text-foreground font-semibold">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                <span>Master Sheets Interactive Grid Preview</span>
                <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                  {parsedRows.length} rows previewed
                </Badge>
              </div>
            </div>

            {/* Grid Table */}
            <div className="flex-1 overflow-auto bg-background p-2">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-2 border-r border-border text-muted-foreground w-10 text-center font-mono">#</th>
                    {parsedRows[0]?.map((col, idx) => (
                      <th
                        key={idx}
                        className="p-2 border-r border-border text-left font-bold text-foreground bg-secondary/40 font-mono"
                      >
                        {col || String.fromCharCode(65 + idx)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(1).map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-2 border-r border-border text-center text-muted-foreground font-mono bg-secondary/20">
                        {rowIdx + 1}
                      </td>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="p-2 border-r border-border truncate max-w-xs font-mono">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : isDoc && textContent ? (
          /* ── 6. WORD / DOCUMENT VIEWER ── */
          <div className="w-full max-w-3xl h-[78vh] rounded-2xl bg-card text-foreground border border-border overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600/15 border-b border-border text-xs text-foreground font-semibold">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span>Master Docs Reader View</span>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 sm:p-12 bg-background/50 leading-relaxed font-sans text-sm text-foreground space-y-4">
              <h2 className="text-xl font-bold tracking-tight pb-2 border-b border-border">{activeFile.name}</h2>
              <div className="whitespace-pre-wrap select-text">{textContent}</div>
            </div>
          </div>
        ) : isCodeOrText && textContent !== null ? (
          /* ── 7. CODE & TEXT VIEWER WITH LINE NUMBERS ── */
          <div className="w-full max-w-4xl h-[78vh] rounded-2xl bg-card text-foreground border border-border overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/80 border-b border-border text-xs text-muted-foreground font-mono">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                <span className="font-bold text-foreground">{activeFile.name}</span>
                <Badge variant="outline" className="text-[10px]">{ext.toUpperCase()}</Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyText}
                className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
              </Button>
            </div>
            <pre className="flex-1 p-4 font-mono text-xs overflow-auto bg-secondary/20 whitespace-pre-wrap select-text leading-5">
              {textContent}
            </pre>
          </div>
        ) : (
          /* ── 8. GENERIC HIGH-FIDELITY FILE CARD ── */
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl space-y-4">
            <div className="h-20 w-20 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shadow-lg">
              <FileText className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white truncate max-w-xs">{activeFile.name}</h3>
              <p className="text-xs text-white/60 mt-1">
                Format: <span className="font-semibold text-white/90 uppercase">{ext || 'Standard'}</span> ({formatBytes(activeFile.size_bytes)})
              </p>
              <p className="text-xs text-white/50 mt-2">
                Securely stored in your Master Cloud 10 TB storage vault. Download to access full binary content.
              </p>
            </div>
            <Button variant="default" onClick={handleDownload} className="rounded-xl px-6 text-xs font-bold gap-2">
              <Download className="h-4 w-4" /> Download File ({formatBytes(activeFile.size_bytes)})
            </Button>
          </div>
        )}
      </div>

      {/* ─── Footer Info ─── */}
      <div className="flex h-12 items-center justify-between px-6 border-t border-white/10 bg-black/50 text-xs text-white/50 shrink-0">
        <span>Uploaded {formatDateRelative(activeFile.created_at)}</span>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>MASTER CLOUD 10 TB Ultra Asset Viewer</span>
        </div>
      </div>
    </div>
  );
}
