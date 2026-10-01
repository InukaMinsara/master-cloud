import React from 'react';
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  Upload,
  FolderPlus,
  FolderOpen,
  FolderInput,
  Sparkles,
} from 'lucide-react';
import { useFileStore, getFilteredDriveItems } from '@/stores/fileStore';
import { useUIStore } from '@/stores/uiStore';
import { useUploadStore } from '@/stores/uploadStore';
import { Breadcrumbs } from '@/components/files/Breadcrumbs';
import { FileCard } from '@/components/files/FileCard';
import { FolderCard } from '@/components/files/FolderCard';
import { FileListRow } from '@/components/files/FileListRow';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown';
import { useContextMenuStore } from '@/stores/contextMenuStore';

export function DrivePage() {
  const { openContextMenu } = useContextMenuStore();
  const {
    currentFolderId,
    viewMode,
    setViewMode,
    sortField,
    sortOrder,
    setSort,
    fetchItems,
    isLoading,
    files: rawFiles,
    folders: rawFolders,
    searchQuery,
    categoryFilter,
  } = useFileStore();

  const { setNewFolderModalOpen, setFileRequestModalOpen } = useUIStore();
  const { addFiles } = useUploadStore();

  const [isDropOver, setIsDropOver] = React.useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    // Only open empty area context menu if click didn't come from an interactive button
    e.preventDefault();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'empty',
    });
  };

  const fileItems = React.useMemo(() => {
    return getFilteredDriveItems({
      files: rawFiles,
      folders: rawFolders,
      searchQuery,
      categoryFilter,
      sortField,
      sortOrder,
    } as any);
  }, [rawFiles, rawFolders, searchQuery, categoryFilter, sortField, sortOrder]);

  React.useEffect(() => {
    fetchItems();
  }, [currentFolderId, fetchItems]);

  // Drag and drop into page dropzone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDropOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDropOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files, currentFolderId);
    }
  };

  const { folders, files } = fileItems;
  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
      className="relative flex flex-col flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8"
    >
      {/* Drop overlay */}
      {isDropOver && (
        <div className="absolute inset-4 z-40 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <Upload className="h-16 w-16 text-primary animate-bounce mb-3" />
          <h3 className="text-xl font-bold text-foreground">Drop files to upload</h3>
          <p className="text-xs text-muted-foreground mt-1">Upload directly into this folder</p>
        </div>
      )}

      {/* Top Bar: Breadcrumbs & View/Sort Switchers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
        <Breadcrumbs />

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* File Request button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFileRequestModalOpen(true)}
            className="rounded-xl h-8 text-xs font-medium"
            title="Create an upload link for guests"
          >
            <FolderInput className="h-3.5 w-3.5 mr-1 text-primary" />
            <span className="hidden sm:inline">Request Files</span>
          </Button>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs font-medium">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <span className="capitalize">{sortField.replace('_', ' ')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="right" className="w-44">
              <DropdownMenuItem onClick={() => setSort('name', 'asc')}>
                Name (A to Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('name', 'desc')}>
                Name (Z to A)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('updated_at', 'desc')}>
                Last modified
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('size_bytes', 'desc')}>
                File size
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-border bg-secondary/40 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isEmpty && !isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1 my-16 text-center">
          <div className="h-20 w-20 rounded-3xl bg-secondary/80 flex items-center justify-center text-muted-foreground mb-4">
            <FolderOpen className="h-10 w-10 text-primary/60" />
          </div>
          <h3 className="text-base font-bold text-foreground">This folder is empty</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-6">
            Drag and drop files here to upload, or create a new subfolder to organize your workspace.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setNewFolderModalOpen(true)} variant="outline" className="rounded-xl text-xs">
              <FolderPlus className="h-4 w-4 mr-1.5 text-primary" /> New Folder
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-6 pt-4">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Folders ({folders.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {folders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Files ({files.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {files.map((file) => (
                  <FileCard key={file.id} file={file} allFiles={files} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="mt-4 rounded-2xl border border-border/80 overflow-hidden bg-card">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="w-10 px-3 py-3" />
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3 hidden md:table-cell">Owner</th>
                <th className="px-3 py-3 hidden sm:table-cell">Last modified</th>
                <th className="px-3 py-3">File size</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {folders.map((folder) => (
                <FileListRow
                  key={folder.id}
                  item={{ ...folder, isFolder: true }}
                  allFiles={files}
                />
              ))}
              {files.map((file) => (
                <FileListRow
                  key={file.id}
                  item={file}
                  allFiles={files}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
