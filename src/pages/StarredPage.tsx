import React from 'react';
import { Star } from 'lucide-react';
import { api } from '@/services/api';
import { FileItem, FolderItem } from '@/types/file';
import { FileCard } from '@/components/files/FileCard';
import { FolderCard } from '@/components/files/FolderCard';

import { useFileStore } from '@/stores/fileStore';

export function StarredPage() {
  const { files: storeFiles, folders: storeFolders, searchQuery } = useFileStore();
  const [starredFiles, setStarredFiles] = React.useState<FileItem[]>([]);
  const [starredFolders, setStarredFolders] = React.useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    api.getStarredItems()
      .then(({ files, folders }) => {
        setStarredFiles(files);
        setStarredFolders(folders);
      })
      .finally(() => setIsLoading(false));
  }, [storeFiles, storeFolders]);

  const displayedFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return starredFiles;
    const q = searchQuery.toLowerCase().trim();
    return starredFiles.filter(f => f.name.toLowerCase().includes(q) || f.extension.toLowerCase().includes(q));
  }, [starredFiles, searchQuery]);

  const displayedFolders = React.useMemo(() => {
    if (!searchQuery.trim()) return starredFolders;
    const q = searchQuery.toLowerCase().trim();
    return starredFolders.filter(f => f.name.toLowerCase().includes(q));
  }, [starredFolders, searchQuery]);

  const isEmpty = displayedFiles.length === 0 && displayedFolders.length === 0;

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold text-foreground">Starred Items</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Keep your most important files and folders pinned here for instant access.
          </p>
        </div>
      </div>

      {isEmpty && !isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1 my-16 text-center">
          <div className="h-16 w-16 rounded-3xl bg-secondary/80 flex items-center justify-center text-muted-foreground mb-3">
            <Star className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-base font-bold text-foreground">No starred items yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Click the star icon on any file or folder to pin it here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedFolders.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Starred Folders
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {displayedFolders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))}
              </div>
            </div>
          )}

          {displayedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Starred Files
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {displayedFiles.map((file) => (
                  <FileCard key={file.id} file={file} allFiles={displayedFiles} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
