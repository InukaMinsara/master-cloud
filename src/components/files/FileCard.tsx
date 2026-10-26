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

export function FileCard({ file, allFiles }: FileCardProps) {
  const { openContextMenu } = useContextMenuStore();
  const { files: storeFiles, selectedItemIds, selectItem, toggleStar, deleteItem, copyFile, setActiveDetailsItem } = useFileStore();
  const { setShareModalItem, setVersionHistoryModalFile } = useUIStore();
  const { openPreview } = usePreviewStore();

  const isSelected = selectedItemIds.includes(file.id);
  const category = getFileCategory(file.mime_type, file.extension);
  const [thumbUrl, setThumbUrl] = React.useState<string | null>(null);
  const [thumbError, setThumbError] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    let localBlobUrl: string | null = null;
    setThumbError(false);

    if (category === 'image') {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (file.storage_path?.startsWith('zdrive:')) {
        if (isLocal) {
          const rel = file.storage_path.slice('zdrive:'.length);
          if (active) setThumbUrl(`/api/local-drive/read?path=${encodeURIComponent(rel)}`);
        }
        api.getFileBlob(file.storage_path).then((blob) => {
          if (blob && active && (blob.type.startsWith('image/') || blob.size > 0)) {
            localBlobUrl = URL.createObjectURL(blob);
            setThumbUrl(localBlobUrl);
          }
        }).catch(() => {});
      } else if (file.storage_path?.startsWith('tgcloud:')) {
        const direct = TelegramCloudService.getDirectStreamUrl(file.storage_path);
        if (direct && active) {
          setThumbUrl(direct);
        }
        api.getFileBlob(file.storage_path).then((blob) => {
          if (blob && active && (blob.type.startsWith('image/') || blob.size > 0)) {
            localBlobUrl = URL.createObjectURL(blob);
            setThumbUrl(localBlobUrl);
          }
        }).catch(() => {});
      } else if (file.storage_path?.startsWith('http://') || file.storage_path?.startsWith('https://')) {
        if (active) setThumbUrl(file.storage_path);
      } else {
        api.getFileBlob(file.storage_path).then((blob) => {
          if (blob && active && (blob.type.startsWith('image/') || blob.size > 0)) {
            localBlobUrl = URL.createObjectURL(blob);
            setThumbUrl(localBlobUrl);
          }
        }).catch(() => {});
      }
    } else {
      setThumbUrl(null);
    }

    return () => {
      active = false;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [file.id, file.storage_path, category]);

  const getCategoryIcon = () => {
    switch (category) {
      case 'image':
        return <Image className="h-8 w-8 text-blue-500" />;
      case 'video':
        return <Video className="h-8 w-8 text-purple-500" />;
      case 'audio':
        return <Music className="h-8 w-8 text-rose-500" />;
      case 'code':
        return <Code className="h-8 w-8 text-emerald-500" />;
      case 'archive':
        return <Archive className="h-8 w-8 text-amber-500" />;
      default:
        return <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />;
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
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 select-none cursor-pointer ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary'
          : 'border-border/80 bg-card hover:border-border hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5'
      }`}
    >
      {/* Top action row: Checkbox, Star, Eye Preview, Menu */}
      <div className="flex items-center justify-between gap-1 mb-3">
        <div
          onClick={(e) => {
            e.stopPropagation();
            selectItem(file.id, true);
          }}
          className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-all ${
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:border-primary'
          }`}
        >
          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenPreview}
            className="rounded-lg p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-primary transition-all"
            title="Preview file"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStar(file.id, false);
            }}
            className={`rounded-lg p-1 transition-colors ${
              file.is_starred
                ? 'text-amber-500'
                : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-500'
            }`}
            title={file.is_starred ? 'Remove star' : 'Star file'}
          >
            <Star className={`h-4 w-4 ${file.is_starred ? 'fill-amber-500' : ''}`} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <button
                className="rounded-lg p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all"
                title="More actions"
              >
                <MoreVertical className="h-4 w-4" />
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

      {/* Center file icon or thumbnail */}
      <div
        onClick={handleOpenPreview}
        className="flex flex-col items-center justify-center py-4 cursor-pointer"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/60 group-hover:scale-105 transition-transform duration-200 overflow-hidden shadow-sm">
          {category === 'image' && thumbUrl && !thumbError ? (
            <img
              src={thumbUrl}
              alt={file.name}
              loading="lazy"
              onError={() => setThumbError(true)}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            getCategoryIcon()
          )}
        </div>
      </div>

      {/* Bottom metadata */}
      <div className="mt-2 space-y-1">
        <h4
          onClick={handleOpenPreview}
          className="text-xs font-semibold text-foreground truncate hover:text-primary transition-colors cursor-pointer"
          title={file.name}
        >
          {file.name}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{formatBytes(file.size_bytes)}</span>
          <span>{formatDateRelative(file.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}
