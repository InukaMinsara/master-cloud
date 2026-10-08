import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Download,
  Share2,
  Copy,
  Star,
  Info,
  History,
  Trash2,
  FolderPlus,
  Upload,
  Archive,
  FileText,
  Video,
  RefreshCw,
  CheckCheck,
  PieChart,
  Edit2,
  Link,
  FolderOpen,
} from 'lucide-react';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useFileStore } from '@/stores/fileStore';
import { useUIStore } from '@/stores/uiStore';
import { usePreviewStore } from '@/stores/previewStore';
import { useUploadStore } from '@/stores/uploadStore';
import { DownloadService } from '@/services/downloadService';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function ContextMenu() {
  const navigate = useNavigate();
  const menuRef = React.useRef<HTMLDivElement>(null);

  const { isOpen, x, y, type, targetFile, targetFolder, closeContextMenu } = useContextMenuStore();
  const {
    files,
    folders,
    currentFolderId,
    setCurrentFolderId,
    toggleStar,
    deleteItem,
    copyFile,
    setActiveDetailsItem,
    selectAll,
    fetchItems,
    renameItem,
  } = useFileStore();

  const { setNewFolderModalOpen, setShareModalItem, setVersionHistoryModalFile } = useUIStore();
  const { openPreview } = usePreviewStore();
  const { addFiles } = useUploadStore();

  const [adjustedPos, setAdjustedPos] = React.useState({ x: 0, y: 0 });

  // Viewport boundary adjustment
  React.useLayoutEffect(() => {
    if (!isOpen) return;

    const menuEl = menuRef.current;
    const menuWidth = menuEl ? menuEl.offsetWidth : 240;
    const menuHeight = menuEl ? menuEl.offsetHeight : 340;

    let posX = x;
    let posY = y;

    if (posX + menuWidth > window.innerWidth - 12) {
      posX = Math.max(12, window.innerWidth - menuWidth - 12);
    }
    if (posY + menuHeight > window.innerHeight - 12) {
      posY = Math.max(12, window.innerHeight - menuHeight - 12);
    }

    setAdjustedPos({ x: posX, y: posY });
  }, [isOpen, x, y]);

  // Click outside and ESC key listener
  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu();
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('scroll', closeContextMenu, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('scroll', closeContextMenu, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeContextMenu]);

  if (!isOpen) return null;

  // File context actions
  const handleFilePreview = () => {
    if (targetFile) openPreview(targetFile, files);
    closeContextMenu();
  };

  const handleFileDownload = async () => {
    if (targetFile) {
      toast.info(`Preparing download for ${targetFile.name}...`);
      await api.downloadFile(targetFile);
    }
    closeContextMenu();
  };

  const handleFileShare = () => {
    if (targetFile) setShareModalItem({ item: targetFile, isFolder: false });
    closeContextMenu();
  };

  const handleCopyLink = () => {
    if (targetFile) {
      const shareUrl = `${window.location.origin}/file/${targetFile.id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('File link copied to clipboard');
    } else if (targetFolder) {
      const shareUrl = `${window.location.origin}/folder/${targetFolder.id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Folder link copied to clipboard');
    }
    closeContextMenu();
  };

  const handleFileStar = async () => {
    if (targetFile) {
      await toggleStar(targetFile.id, false);
      toast.success(targetFile.is_starred ? 'Removed from Starred' : 'Added to Starred');
    }
    closeContextMenu();
  };

  const handleFileDetails = () => {
    if (targetFile) setActiveDetailsItem(targetFile);
    closeContextMenu();
  };

  const handleFileVersions = () => {
    if (targetFile) setVersionHistoryModalFile(targetFile);
    closeContextMenu();
  };

  const handleFileDuplicate = async () => {
    if (targetFile) {
      await copyFile(targetFile.id);
      toast.success(`Duplicate of "${targetFile.name}" created`);
    }
    closeContextMenu();
  };

  const handleFileRename = async () => {
    if (targetFile) {
      const newName = prompt('Enter new file name:', targetFile.name);
      if (newName && newName.trim() && newName.trim() !== targetFile.name) {
        await renameItem(targetFile.id, false, newName.trim());
        toast.success('File renamed');
      }
    }
    closeContextMenu();
  };

  const handleFileTrash = async () => {
    if (targetFile) {
      await deleteItem(targetFile.id, false);
      toast.success(`"${targetFile.name}" moved to Trash`);
    }
    closeContextMenu();
  };


  // Folder actions
  const handleFolderOpen = () => {
    if (targetFolder) setCurrentFolderId(targetFolder.id);
    closeContextMenu();
  };

  const handleFolderShare = () => {
    if (targetFolder) setShareModalItem({ item: targetFolder, isFolder: true });
    closeContextMenu();
  };

  const handleFolderDownloadZip = async () => {
    if (targetFolder) {
      toast.info(`Compressing folder "${targetFolder.name}"...`);
      await api.downloadFolder(targetFolder, files, folders);
      toast.success(`Archive of "${targetFolder.name}" downloaded`);
    }
    closeContextMenu();
  };

  const handleFolderStar = async () => {
    if (targetFolder) {
      await toggleStar(targetFolder.id, true);
      toast.success(targetFolder.is_starred ? 'Removed from Starred' : 'Added to Starred');
    }
    closeContextMenu();
  };

  const handleFolderDetails = () => {
    if (targetFolder) setActiveDetailsItem(targetFolder);
    closeContextMenu();
  };

  const handleFolderTrash = async () => {
    if (targetFolder) {
      await deleteItem(targetFolder.id, true);
      toast.success(`Folder "${targetFolder.name}" moved to Trash`);
    }
    closeContextMenu();
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${adjustedPos.x}px`,
        top: `${adjustedPos.y}px`,
        zIndex: 9999,
      }}
      className="min-w-[220px] max-w-[280px] rounded-2xl border border-border/80 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 select-none text-popover-foreground text-xs"
    >
      {/* 1. FILE CONTEXT MENU */}
      {type === 'file' && targetFile && (
        <div className="space-y-0.5">
          <div className="px-2.5 py-1.5 border-b border-border/60 mb-1 flex items-center gap-2">
            <span className="font-bold text-foreground truncate max-w-[190px]">{targetFile.name}</span>
          </div>

          <button
            onClick={handleFilePreview}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Eye className="h-4 w-4 text-blue-500" />
            <span>Preview File</span>
          </button>

          <button
            onClick={handleFileDownload}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Download className="h-4 w-4 text-emerald-500" />
            <span>Download</span>
          </button>

          <button
            onClick={handleFileShare}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Share2 className="h-4 w-4 text-purple-500" />
            <span>Share & Permissions</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Link className="h-4 w-4 text-muted-foreground" />
            <span>Copy Link</span>
          </button>

          <div className="my-1 border-t border-border/60" />

          <button
            onClick={handleFileRename}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Edit2 className="h-4 w-4 text-muted-foreground" />
            <span>Rename</span>
          </button>

          <button
            onClick={handleFileDuplicate}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Copy className="h-4 w-4 text-muted-foreground" />
            <span>Duplicate File</span>
          </button>

          <button
            onClick={handleFileStar}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Star className={`h-4 w-4 ${targetFile.is_starred ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
            <span>{targetFile.is_starred ? 'Remove Star' : 'Add to Starred'}</span>
          </button>

          <button
            onClick={handleFileVersions}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <History className="h-4 w-4 text-muted-foreground" />
            <span>Version History</span>
          </button>

          <button
            onClick={handleFileDetails}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Info className="h-4 w-4 text-muted-foreground" />
            <span>File Details</span>
          </button>

          <div className="my-1 border-t border-border/60" />

          <button
            onClick={handleFileTrash}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-destructive/15 text-destructive text-left transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Move to Trash</span>
          </button>
        </div>
      )}

      {/* 2. FOLDER CONTEXT MENU */}
      {type === 'folder' && targetFolder && (
        <div className="space-y-0.5">
          <div className="px-2.5 py-1.5 border-b border-border/60 mb-1 flex items-center gap-2">
            <span className="font-bold text-foreground truncate max-w-[190px]">{targetFolder.name}</span>
          </div>

          <button
            onClick={handleFolderOpen}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <FolderOpen className="h-4 w-4 text-primary" />
            <span>Open Folder</span>
          </button>

          <button
            onClick={() => {
              setNewFolderModalOpen(true);
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <FolderPlus className="h-4 w-4 text-blue-500" />
            <span>New Subfolder</span>
          </button>

          <button
            onClick={handleFolderShare}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Share2 className="h-4 w-4 text-purple-500" />
            <span>Share Folder</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Link className="h-4 w-4 text-muted-foreground" />
            <span>Copy Link</span>
          </button>

          <button
            onClick={handleFolderDownloadZip}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Archive className="h-4 w-4 text-amber-500" />
            <span>Download as ZIP</span>
          </button>

          <div className="my-1 border-t border-border/60" />

          <button
            onClick={handleFolderStar}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Star className={`h-4 w-4 ${targetFolder.is_starred ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
            <span>{targetFolder.is_starred ? 'Remove Star' : 'Add to Starred'}</span>
          </button>

          <button
            onClick={handleFolderDetails}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <Info className="h-4 w-4 text-muted-foreground" />
            <span>Folder Details</span>
          </button>

          <div className="my-1 border-t border-border/60" />

          <button
            onClick={handleFolderTrash}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-destructive/15 text-destructive text-left transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Move to Trash</span>
          </button>
        </div>
      )}

      {/* 3. EMPTY AREA CONTEXT MENU */}
      {type === 'empty' && (
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Create & Workspace
          </div>

          <button
            onClick={() => {
              setNewFolderModalOpen(true);
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <FolderPlus className="h-4 w-4 text-blue-500" />
            <span>New Folder</span>
          </button>

          <div className="my-1 border-t border-border/60" />

          <button
            onClick={() => {
              fetchItems();
              toast.success('Workspace refreshed');
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span>Refresh Workspace</span>
          </button>

          <button
            onClick={() => {
              selectAll();
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
            <span>Select All Items</span>
          </button>

          <button
            onClick={() => {
              navigate('/storage');
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          >
            <PieChart className="h-4 w-4 text-blue-500" />
            <span>Storage & Quota Analytics</span>
          </button>
        </div>
      )}
    </div>
  );
}
