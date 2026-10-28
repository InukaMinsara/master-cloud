import React from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  Code,
  Archive,
  Star,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Copy,
  Info,
  History,
  Check,
  Eye,
  Play,
  Film,
  FileSpreadsheet,
  Presentation,
} from 'lucide-react';
import { FileItem } from '@/types/file';
import { formatBytes, formatDateRelative, getFileCategory } from '@/lib/utils';
import { useFileStore } from '@/stores/fileStore';
import { useUIStore } from '@/stores/uiStore';
import { usePreviewStore } from '@/stores/previewStore';
import { api } from '@/services/api';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { TelegramCloudService } from '@/services/telegramCloudService';

interface FileCardProps {
  file: FileItem;
  allFiles?: FileItem[];
}

/**
 * Resolves a zero-delay direct stream URL synchronously (0.00001s instant preview)
 */
function getDirectStreamUrl(storagePath?: string): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }
  if (storagePath.startsWith('zdrive:')) {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocal) {
      const rel = storagePath.slice('zdrive:'.length);
      return `/api/local-drive/thumbnail?path=${encodeURIComponent(rel)}`;
    }
  }
  if (storagePath.startsWith('tgcloud:')) {
    return TelegramCloudService.getDirectStreamUrl(storagePath);
  }
  return null;
}

export function FileCard({ file, allFiles }: FileCardProps) {
  const { openContextMenu } = useContextMenuStore();
  const { files: storeFiles, selectedItemIds, selectItem, toggleStar, deleteItem, copyFile, setActiveDetailsItem } = useFileStore();
  const { setShareModalItem, setVersionHistoryModalFile } = useUIStore();
  const { openPreview } = usePreviewStore();

  const isSelected = selectedItemIds.includes(file.id);
  const category = getFileCategory(file.mime_type, file.extension);
  const ext = (file.extension || '').toLowerCase();

  // Instant 0ms synchronous resolution for direct streaming
  const initialThumbUrl = React.useMemo(() => getDirectStreamUrl(file.storage_path), [file.storage_path]);
  const [thumbUrl, setThumbUrl] = React.useState<string | null>(initialThumbUrl);
  const [thumbError, setThumbError] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    let localBlobUrl: string | null = null;
    setThumbError(false);

    const direct = getDirectStreamUrl(file.storage_path);
    if (direct) {
      setThumbUrl(direct);
      return;
    }

    if (category === 'image' || category === 'video') {
      api.getFileBlob(file.storage_path).then((blob) => {
        if (blob && active && (blob.type.startsWith('image/') || blob.type.startsWith('video/') || blob.size > 0)) {
          localBlobUrl = URL.createObjectURL(blob);
          setThumbUrl(localBlobUrl);
        }
      }).catch(() => {});
    } else {
      setThumbUrl(null);
    }

    return () => {
      active = false;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [file.id, file.storage_path, category]);

  const getHeaderIcon = () => {
    switch (category) {
      case 'video':
        return <Film className="h-4 w-4 text-red-500 shrink-0" />;
      case 'image':
        return <Image className="h-4 w-4 text-red-500 shrink-0" />;
      case 'audio':
        return <Music className="h-4 w-4 text-rose-500 shrink-0" />;
      case 'code':
        return <Code className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'archive':
        return <Archive className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        if (['xlsx', 'xls', 'csv', 'msheet'].includes(ext)) {
          return <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />;
        }
        if (['pptx', 'ppt', 'mslide'].includes(ext)) {
          return <Presentation className="h-4 w-4 text-amber-500 shrink-0" />;
        }
        return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  const handleOpenPreview = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    openPreview(file, allFiles || storeFiles);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      e.stopPropagation();
      selectItem(file.id, true);
    } else {
      selectItem(file.id, false);
      openPreview(file, allFiles || storeFiles);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await api.downloadFile(file);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'file',
      targetFile: file,
    });
  };

  return (
    <div
      onClick={handleCardClick}
      onDoubleClick={handleOpenPreview}
      onContextMenu={handleContextMenu}
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 select-none cursor-pointer overflow-hidden ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary'
          : 'border-border/80 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5'
      }`}
    >
      {/* ─── 1. Header Bar: Icon, File Name, and Actions (Google Drive Style) ─── */}
      <div className="flex items-center justify-between gap-1.5 px-3 pt-2.5 pb-2">
        <div
          onClick={handleOpenPreview}
          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
          title={file.name}
        >
          {getHeaderIcon()}
          <span className="text-xs font-semibold text-foreground truncate select-none hover:text-primary transition-colors">
            {file.name}
          </span>
        </div>

        {/* Action icons: Checkbox, Star, Menu */}
        <div className="flex items-center gap-0.5 shrink-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              selectItem(file.id, true);
            }}
            className={`flex h-4 w-4 items-center justify-center rounded border transition-all cursor-pointer ${
              isSelected
                ? 'border-primary bg-primary text-primary-foreground opacity-100'
                : 'border-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:border-primary'
            }`}
            title="Select file"
          >
            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStar(file.id, false);
            }}
            className={`p-1 rounded-md transition-colors ${
              file.is_starred
                ? 'text-amber-500 opacity-100'
                : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-500'
            }`}
            title={file.is_starred ? 'Remove star' : 'Star file'}
          >
            <Star className={`h-3.5 w-3.5 ${file.is_starred ? 'fill-amber-500' : ''}`} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <button
                className="p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all"
                title="More actions"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="right" className="w-48">
              <DropdownMenuItem onClick={handleOpenPreview}>
                <Eye className="h-4 w-4 mr-2 text-primary" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2 text-emerald-500" /> Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShareModalItem({ item: file, isFolder: false })}>
                <Share2 className="h-4 w-4 mr-2 text-blue-500" /> Share & Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setVersionHistoryModalFile(file)}>
                <History className="h-4 w-4 mr-2 text-purple-500" /> Version History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyFile(file.id)}>
                <Copy className="h-4 w-4 mr-2" /> Make a copy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveDetailsItem(file)}>
                <Info className="h-4 w-4 mr-2" /> Details & Activity
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteItem(file.id, false)} destructive>
                <Trash2 className="h-4 w-4 mr-2" /> Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── 2. Large Preview Container (Google Drive Style: Instant 0.00001s) ─── */}
      <div
        onClick={handleOpenPreview}
        className="px-2.5 pb-2.5 cursor-pointer"
      >
        <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] rounded-xl overflow-hidden bg-secondary/40 dark:bg-muted/30 border border-border/40 flex items-center justify-center transition-all group-hover:border-primary/40 group-hover:shadow-md">
          {category === 'image' ? (
            thumbUrl && !thumbError ? (
              <img
                src={thumbUrl}
                alt={file.name}
                loading="eager"
                decoding="async"
                onError={() => setThumbError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center">
                <Image className="h-10 w-10 text-red-500/80 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{file.extension}</span>
              </div>
            )
          ) : category === 'video' ? (
            thumbUrl && !thumbError ? (
              <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={thumbUrl}
                  alt={file.name}
                  loading="lazy"
                  decoding="async"
                  onError={() => setThumbError(true)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Subtle Google Drive Play badge overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                  <div className="h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform backdrop-blur-sm border border-white/20">
                    <Play className="h-4 w-4 fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-4 text-center bg-secondary/30 w-full h-full">
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Film className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Video</span>
              </div>
            )
          ) : category === 'audio' ? (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center bg-rose-500/5 w-full h-full">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Music className="h-7 w-7" />
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-500/80 uppercase">{file.extension || 'Audio'}</span>
            </div>
          ) : ['xlsx', 'xls', 'csv', 'msheet'].includes(ext) ? (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center bg-emerald-500/5 w-full h-full">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-500/80 uppercase">Spreadsheet</span>
            </div>
          ) : ['pptx', 'ppt', 'mslide'].includes(ext) ? (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center bg-amber-500/5 w-full h-full">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Presentation className="h-7 w-7" />
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-500/80 uppercase">Presentation</span>
            </div>
          ) : category === 'code' ? (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center bg-indigo-500/5 w-full h-full">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code className="h-7 w-7" />
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-500/80 uppercase">{file.extension || 'Code'}</span>
            </div>
          ) : category === 'archive' ? (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center bg-amber-500/5 w-full h-full">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Archive className="h-7 w-7" />
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-500/80 uppercase">{file.extension || 'Archive'}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center bg-blue-500/5 w-full h-full">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7" />
              </div>
              <span className="text-[10px] font-mono font-bold text-blue-500/80 uppercase">{file.extension || 'Document'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── 3. Subtle Bottom Metadata Bar (Size & Modified) ─── */}
      <div className="flex items-center justify-between px-3 pb-2 text-[10px] text-muted-foreground/75">
        <span>{formatBytes(file.size_bytes)}</span>
        <span>{formatDateRelative(file.updated_at)}</span>
      </div>
    </div>
  );
}
