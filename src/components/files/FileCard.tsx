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
  Edit2,
  Copy,
  Info,
  History,
  Check,
} from 'lucide-react';
import { FileItem } from '@/types/file';
import { formatBytes, formatDateRelative, getFileCategory } from '@/lib/utils';
import { useFileStore } from '@/stores/fileStore';
import { useUIStore } from '@/stores/uiStore';
import { usePreviewStore } from '@/stores/previewStore';
import { api } from '@/services/api';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';

import { useContextMenuStore } from '@/stores/contextMenuStore';

interface FileCardProps {
  file: FileItem;
  allFiles: FileItem[];
}

export function FileCard({ file, allFiles }: FileCardProps) {
  const { openContextMenu } = useContextMenuStore();
  const { selectedItemIds, selectItem, toggleStar, deleteItem, copyFile, setActiveDetailsItem } = useFileStore();
  const { setShareModalItem, setVersionHistoryModalFile } = useUIStore();
  const { openPreview } = usePreviewStore();

  const isSelected = selectedItemIds.includes(file.id);
  const category = getFileCategory(file.mime_type, file.extension);

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

  const handleDoubleClick = () => {
    openPreview(file, allFiles);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectItem(file.id, e.ctrlKey || e.metaKey || e.shiftKey);
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
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 select-none cursor-pointer ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary'
          : 'border-border/80 bg-card hover:border-border hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5'
      }`}
    >
      {/* Top action row: Checkbox, Star, Menu */}
      <div className="flex items-center justify-between gap-1 mb-3">
        <div
          onClick={handleSelect}
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
              <DropdownMenuItem onClick={() => openPreview(file, allFiles)}>
                <Info className="h-4 w-4 mr-2 text-primary" /> Preview
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
      <div className="flex flex-col items-center justify-center py-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/60 group-hover:scale-105 transition-transform duration-200">
          {getCategoryIcon()}
        </div>
      </div>

      {/* Bottom metadata */}
      <div className="mt-2 space-y-1">
        <h4 className="text-xs font-semibold text-foreground truncate" title={file.name}>
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
