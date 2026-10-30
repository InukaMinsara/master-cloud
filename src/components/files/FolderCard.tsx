import React from 'react';
import {
  Folder,
  Star,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Edit2,
  Info,
  Check,
  FolderOpen,
} from 'lucide-react';
import { FolderItem } from '@/types/file';
import { formatDateRelative } from '@/lib/utils';
import { useFileStore } from '@/stores/fileStore';
import { useUIStore } from '@/stores/uiStore';
import { api } from '@/services/api';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';

import { useContextMenuStore } from '@/stores/contextMenuStore';
import { toast } from 'sonner';

interface FolderCardProps {
  folder: FolderItem;
}

export function FolderCard({ folder }: FolderCardProps) {
  const { openContextMenu } = useContextMenuStore();
  const {
    selectedItemIds,
    selectItem,
    toggleStar,
    deleteItem,
    setCurrentFolderId,
    setActiveDetailsItem,
    moveItem,
    files,
    folders,
  } = useFileStore();
  const { setShareModalItem } = useUIStore();
  const [isDragOver, setIsDragOver] = React.useState(false);

  const isSelected = selectedItemIds.includes(folder.id);

  const handleDoubleClick = () => {
    setCurrentFolderId(folder.id);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectItem(folder.id, e.ctrlKey || e.metaKey || e.shiftKey);
  };

  const handleDownloadZip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.downloadFolder(folder, files, folders);
    } catch (err: any) {
      toast.error(`Download failed: ${err.message || 'Error'}`);
    }
  };

  // Drag over target handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedItemId = e.dataTransfer.getData('text/plain');
    if (draggedItemId && draggedItemId !== folder.id) {
      const isDraggedFolder = folders.some(f => f.id === draggedItemId);
      await moveItem(draggedItemId, isDraggedFolder, folder.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'folder',
      targetFolder: folder,
    });
  };

  return (
    <div
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative flex items-center justify-between rounded-2xl border p-3.5 transition-all duration-200 select-none cursor-pointer hover:z-20 [&:has([data-dropdown-open])]:z-30 ${
        isDragOver
          ? 'border-primary ring-2 ring-primary bg-primary/10 scale-[1.02]'
          : isSelected
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary'
          : 'border-border/80 bg-card hover:border-border hover:shadow-md hover:shadow-black/5'
      }`}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          setCurrentFolderId(folder.id);
        }}
        className="flex items-center gap-3 truncate min-w-0 flex-1 cursor-pointer"
      >
        {/* Selection Checkbox */}
        <div
          onClick={handleSelect}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all ${
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:border-primary'
          }`}
        >
          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
        </div>

        {/* Folder Icon with customizable tint */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${folder.color || '#3b82f6'}15`, color: folder.color || '#3b82f6' }}
        >
          <Folder className="h-5 w-5 fill-current" />
        </div>

        {/* Name and Count */}
        <div className="truncate">
          <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors" title={folder.name}>
            {folder.name}
          </h4>
          <p className="text-[11px] text-muted-foreground">
            {folder.item_count ?? 0} item{(folder.item_count ?? 0) === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStar(folder.id, true);
          }}
          className={`rounded-lg p-1 transition-colors ${
            folder.is_starred
              ? 'text-amber-500'
              : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-500'
          }`}
          title={folder.is_starred ? 'Remove star' : 'Star folder'}
        >
          <Star className={`h-4 w-4 ${folder.is_starred ? 'fill-amber-500' : ''}`} />
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
            <DropdownMenuItem onClick={handleDoubleClick}>
              <FolderOpen className="h-4 w-4 mr-2 text-primary" /> Open Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadZip}>
              <Download className="h-4 w-4 mr-2 text-emerald-500" /> Download as ZIP
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShareModalItem({ item: folder, isFolder: true })}>
              <Share2 className="h-4 w-4 mr-2 text-blue-500" /> Share & Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveDetailsItem({ ...folder, isFolder: true })}>
              <Info className="h-4 w-4 mr-2" /> Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => deleteItem(folder.id, true)} destructive>
              <Trash2 className="h-4 w-4 mr-2" /> Move to Trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
