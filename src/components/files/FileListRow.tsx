import React from 'react';
import {
  Folder,
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
  History,
  Info,
  Check,
  Eye,
} from 'lucide-react';
import { FileItem, FolderItem } from '@/types/file';
import { formatBytes, formatDateRelative, getFileCategory } from '@/lib/utils';
import { useFileStore } from '@/stores/fileStore';
import { useUIStore } from '@/stores/uiStore';
import { usePreviewStore } from '@/stores/previewStore';
import { api } from '@/services/api';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { UserAvatar } from '@/components/common/UserAvatar';
import { toast } from 'sonner';

interface FileListRowProps {
  item: (FileItem & { isFolder?: false }) | (FolderItem & { isFolder: true });
  allFiles: FileItem[];
}

export function FileListRow({ item, allFiles }: FileListRowProps) {
  const isFolder = 'item_count' in item || (item as any).isFolder === true;
  const file = isFolder ? null : (item as FileItem);
  const folder = isFolder ? (item as FolderItem) : null;

  const {
    selectedItemIds,
    selectItem,
    toggleStar,
    deleteItem,
    setCurrentFolderId,
    setActiveDetailsItem,
    copyFile,
    files,
    folders,
  } = useFileStore();

  const { setShareModalItem, setVersionHistoryModalFile } = useUIStore();
  const { openPreview } = usePreviewStore();
  const { openContextMenu } = useContextMenuStore();

  const isSelected = selectedItemIds.includes(item.id);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: isFolder ? 'folder' : 'file',
      targetFile: file || undefined,
      targetFolder: folder || undefined,
    });
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      e.stopPropagation();
      selectItem(item.id, true);
    } else {
      selectItem(item.id, false);
      if (isFolder && folder) {
        setCurrentFolderId(folder.id);
      } else if (file) {
        openPreview(file, allFiles);
      }
    }
  };

  const handleOpenItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder && folder) {
      setCurrentFolderId(folder.id);
    } else if (file) {
      openPreview(file, allFiles);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isFolder && folder) {
        await api.downloadFolder(folder, files, folders);
      } else if (file) {
        await api.downloadFile(file);
      }
    } catch (err: any) {
      toast.error(`Download failed: ${err.message || 'Error'}`);
    }
  };

  const getIcon = () => {
    if (isFolder) {
      return (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${folder?.color || '#3b82f6'}15`, color: folder?.color || '#3b82f6' }}
        >
          <Folder className="h-4 w-4 fill-current" />
        </div>
      );
    }
    const cat = getFileCategory(file!.mime_type, file!.extension);
    switch (cat) {
      case 'image':
        return <Image className="h-4 w-4 text-blue-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'audio':
        return <Music className="h-4 w-4 text-rose-500" />;
      case 'code':
        return <Code className="h-4 w-4 text-emerald-500" />;
      case 'archive':
        return <Archive className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <tr
      onClick={handleRowClick}
      onContextMenu={handleContextMenu}
      className={`group border-b border-border/50 text-xs transition-colors select-none cursor-pointer ${
        isSelected
          ? 'bg-primary/10 hover:bg-primary/15'
          : 'hover:bg-accent/50'
      }`}
    >
      {/* Checkbox column */}
      <td className="w-10 px-3 py-3">
        <div
          onClick={(e) => {
            e.stopPropagation();
            selectItem(item.id, true);
          }}
          className={`flex h-4 w-4 items-center justify-center rounded-md border transition-all ${
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:border-primary'
          }`}
        >
          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
        </div>
      </td>

      {/* Name and Icon column */}
      <td className="px-3 py-3">
        <div
          onClick={handleOpenItem}
          className="flex items-center gap-3 cursor-pointer group-hover:text-primary transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/80 shrink-0">
            {getIcon()}
          </div>
          <span className="font-semibold text-foreground truncate max-w-md group-hover:underline">
            {item.name}
          </span>
        </div>
      </td>

      {/* Owner column */}
      <td className="px-3 py-3 hidden md:table-cell text-muted-foreground">
        <div className="flex items-center gap-2">
          <UserAvatar
            user={item.owner}
            name={item.owner?.display_name || 'Me'}
            size="xs"
          />
          <span className="truncate">{item.owner?.display_name || 'Me'}</span>
        </div>
      </td>

      {/* Last Modified */}
      <td className="px-3 py-3 hidden sm:table-cell text-muted-foreground">
        {formatDateRelative(item.updated_at)}
      </td>

      {/* Size / Items */}
      <td className="px-3 py-3 text-muted-foreground">
        {isFolder ? `${folder?.item_count ?? 0} items` : formatBytes(file?.size_bytes || 0)}
      </td>

      {/* Quick Actions, Star and Menu */}
      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {!isFolder && file && (
            <button
              onClick={handleOpenItem}
              className="rounded-lg p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-accent transition-all"
              title="Preview file"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStar(item.id, isFolder);
            }}
            className={`rounded-lg p-1 transition-colors ${
              item.is_starred
                ? 'text-amber-500'
                : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-500'
            }`}
          >
            <Star className={`h-4 w-4 ${item.is_starred ? 'fill-amber-500' : ''}`} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <button
                className="rounded-lg p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="right" className="w-48">
              {!isFolder && file && (
                <DropdownMenuItem onClick={handleOpenItem}>
                  <Eye className="h-4 w-4 mr-2 text-primary" /> Preview
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2 text-emerald-500" /> Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShareModalItem({ item, isFolder })}>
                <Share2 className="h-4 w-4 mr-2 text-blue-500" /> Share & Link
              </DropdownMenuItem>
              {!isFolder && file && (
                <>
                  <DropdownMenuItem onClick={() => setVersionHistoryModalFile(file)}>
                    <History className="h-4 w-4 mr-2 text-purple-500" /> Version History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyFile(file.id)}>
                    <Copy className="h-4 w-4 mr-2" /> Make a copy
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => setActiveDetailsItem(item)}>
                <Info className="h-4 w-4 mr-2" /> Details & Activity
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteItem(item.id, isFolder)} destructive>
                <Trash2 className="h-4 w-4 mr-2" /> Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
