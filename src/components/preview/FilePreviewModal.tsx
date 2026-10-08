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
} from 'lucide-react';
import { usePreviewStore } from '@/stores/previewStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBytes, formatDateRelative, getFileCategory } from '@/lib/utils';
import { api } from '@/services/api';
import { TelegramCloudService } from '@/services/telegramCloudService';
import { toast } from 'sonner';

export function FilePreviewModal() {
  const navigate = useNavigate();
  const { activeFile, isOpen, closePreview, nextFile, prevFile, fileList } = usePreviewStore();
  const { setShareModalItem } = useUIStore();

  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [textContent, setTextContent] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

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
        const category = getFileCategory(activeFile.mime_type, activeFile.extension);
        const ext = activeFile.extension.toLowerCase();

        // 1. Instant Zero-Delay Direct Stream for Z: drive / Local Disk media
        if (activeFile.storage_path?.startsWith('zdrive:')) {
          const rel = activeFile.storage_path.slice('zdrive:'.length);
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
          /* ── 1. IMAGE VIEWER ── */
          <div className="overflow-auto max-h-full max-w-full flex items-center justify-center">
            {blobUrl ? (
              <img
                src={blobUrl}
                alt={activeFile.name}
                className="max-h-[80vh] max-w-[85vw] object-contain rounded-xl shadow-2xl transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              />
            ) : (
              <div className="p-8 text-center bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-white/60 text-sm">Image preview unavailable</span>
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
          /* ── 3. VIDEO VIEWER ── */
          <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/10">
            {blobUrl ? (
              <video
                src={blobUrl}
                controls
                autoPlay
                playsInline
                className="h-full w-full object-contain"
              />
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
              <audio src={blobUrl} controls autoPlay className="w-full rounded-xl" />
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
