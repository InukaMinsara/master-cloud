import React from 'react';
import { Users, FileText, Download, Share2 } from 'lucide-react';
import { api } from '@/services/api';
import { FileItem, FolderItem } from '@/types/file';
import { FileCard } from '@/components/files/FileCard';
import { FolderCard } from '@/components/files/FolderCard';
import { useFileStore } from '@/stores/fileStore';

export function SharedPage() {
  const { searchQuery, starVersion } = useFileStore();
  const [sharedFiles, setSharedFiles] = React.useState<FileItem[]>([]);
  const [sharedFolders, setSharedFolders] = React.useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    api.getSharedWithMe()
      .then(({ files, folders }) => {
        setSharedFiles(files);
        setSharedFolders(folders);
      })
      .finally(() => setIsLoading(false));
  }, [starVersion]);

  const displayedFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return sharedFiles;
    const q = searchQuery.toLowerCase().trim();
    return sharedFiles.filter(f => f.name.toLowerCase().includes(q) || f.extension.toLowerCase().includes(q));
  }, [sharedFiles, searchQuery]);

  const displayedFolders = React.useMemo(() => {
    if (!searchQuery.trim()) return sharedFolders;
    const q = searchQuery.toLowerCase().trim();
    return sharedFolders.filter(f => f.name.toLowerCase().includes(q));
  }, [sharedFolders, searchQuery]);

  const isEmpty = displayedFiles.length === 0 && displayedFolders.length === 0;

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold text-foreground">Shared with me</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Files and folders shared with you by other collaborators.
          </p>
        </div>
      </div>

      {isEmpty && !isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1 my-16 text-center">
          <div className="h-16 w-16 rounded-3xl bg-secondary/80 flex items-center justify-center text-muted-foreground mb-3">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground">No shared files yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            When team members share files or folders with you, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedFolders.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Shared Folders
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
                Shared Files
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
