import React from 'react';
import { Clock } from 'lucide-react';
import { api } from '@/services/api';
import { FileItem } from '@/types/file';
import { FileCard } from '@/components/files/FileCard';
import { useFileStore } from '@/stores/fileStore';

export function RecentPage() {
  const { files: storeFiles, searchQuery, starVersion } = useFileStore();
  const [recentFiles, setRecentFiles] = React.useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    api.getRecentItems(24)
      .then(setRecentFiles)
      .finally(() => setIsLoading(false));
  }, [storeFiles, starVersion]);

  const displayedFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return recentFiles;
    const q = searchQuery.toLowerCase().trim();
    return recentFiles.filter(f => f.name.toLowerCase().includes(q) || f.extension.toLowerCase().includes(q));
  }, [recentFiles, searchQuery]);

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold text-foreground">Recent Files</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Files accessed, edited, or uploaded recently across your workspace.
          </p>
        </div>
      </div>

      {displayedFiles.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1 my-16 text-center">
          <div className="h-16 w-16 rounded-3xl bg-secondary/80 flex items-center justify-center text-muted-foreground mb-3">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {searchQuery ? `No files matching "${searchQuery}"` : 'No recent activity'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {searchQuery ? 'Try checking your spelling or clearing the search query.' : 'Files you interact with will automatically be listed here for fast access.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {displayedFiles.map((file) => (
            <FileCard key={file.id} file={file} allFiles={displayedFiles} />
          ))}
        </div>
      )}
    </div>
  );
}
