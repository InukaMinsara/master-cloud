import React from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';
import { FileItem, FolderItem } from '@/types/file';
import { formatBytes, formatDateRelative } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function TrashPage() {
  const [deletedFiles, setDeletedFiles] = React.useState<FileItem[]>([]);
  const [deletedFolders, setDeletedFolders] = React.useState<FolderItem[]>([]);
  const [emptyDialogOpen, setEmptyDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadTrash = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [files, folders] = await Promise.all([
        api.getFiles(null, true),
        api.getFolders(null, true),
      ]);
      setDeletedFiles(files);
      setDeletedFolders(folders);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestore = async (id: string, isFolder: boolean) => {
    if (isFolder) {
      await api.restoreFolder(id);
    } else {
      await api.restoreFile(id);
    }
    toast.success('Item restored to original location');
    loadTrash();
  };

  const handlePermanentDelete = async (id: string, isFolder: boolean) => {
    if (isFolder) {
      await api.permanentDeleteFolder(id);
    } else {
      await api.permanentDeleteFile(id);
    }
    toast.success('Item permanently deleted');
    loadTrash();
  };

  const handleEmptyTrash = async () => {
    await api.emptyTrash();
    toast.success('Trash emptied');
    setEmptyDialogOpen(false);
    loadTrash();
  };

  const isEmpty = deletedFiles.length === 0 && deletedFolders.length === 0;

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold text-foreground">Trash</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Items in trash are automatically purged after 30 days.
          </p>
        </div>

        {!isEmpty && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setEmptyDialogOpen(true)}
            className="rounded-xl text-xs font-semibold"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Empty Trash
          </Button>
        )}
      </div>

      {isEmpty && !isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1 my-16 text-center">
          <div className="h-16 w-16 rounded-3xl bg-secondary/80 flex items-center justify-center text-muted-foreground mb-3">
            <Trash2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-bold text-foreground">Trash is empty</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Deleted files and folders will appear here until permanently cleared.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 overflow-hidden bg-card">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden sm:table-cell">Deleted Date</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {deletedFolders.map((folder) => (
                <tr key={folder.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground truncate max-w-xs">
                    📁 {folder.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDateRelative(folder.deleted_at || folder.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">Folder</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(folder.id, true)}
                        className="h-7 text-[11px] rounded-lg"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handlePermanentDelete(folder.id, true)}
                        className="h-7 text-[11px] rounded-lg"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {deletedFiles.map((file) => (
                <tr key={file.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground truncate max-w-xs">
                    📄 {file.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDateRelative(file.deleted_at || file.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatBytes(file.size_bytes)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(file.id, false)}
                        className="h-7 text-[11px] rounded-lg"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handlePermanentDelete(file.id, false)}
                        className="h-7 text-[11px] rounded-lg"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty Trash Confirmation Dialog */}
      <Dialog open={emptyDialogOpen} onOpenChange={setEmptyDialogOpen}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Permanently Empty Trash?</DialogTitle>
          </div>
          <DialogDescription>
            All items in Trash will be permanently deleted from database and storage. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEmptyDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleEmptyTrash}>
            Permanently Empty
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
