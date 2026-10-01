import React from 'react';
import { History, Download, RotateCcw, ShieldCheck, Clock } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useFileStore } from '@/stores/fileStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { FileVersionRecord } from '@/types/database';
import { formatBytes, formatDateTime, formatDateRelative } from '@/lib/utils';
import { toast } from 'sonner';

export function VersionHistoryDialog() {
  const { versionHistoryModalFile, setVersionHistoryModalFile } = useUIStore();
  const { fetchItems } = useFileStore();
  const [versions, setVersions] = React.useState<FileVersionRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const file = versionHistoryModalFile;
  const isOpen = Boolean(file);

  React.useEffect(() => {
    if (file?.id) {
      setIsLoading(true);
      api.getFileVersions(file.id)
        .then(setVersions)
        .finally(() => setIsLoading(false));
    }
  }, [file?.id]);

  if (!isOpen || !file) return null;

  const handleRestore = async (versionId: string, versionNumber: number) => {
    try {
      await api.restoreFileVersion(file.id, versionId);
      toast.success(`Restored to Version ${versionNumber}`);
      await fetchItems();
      setVersionHistoryModalFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore version');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setVersionHistoryModalFile(null)} className="max-w-xl">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-purple-500" />
          <DialogTitle>Version History</DialogTitle>
        </div>
        <DialogDescription>
          Previous revisions of <span className="font-semibold text-foreground">"{file.name}"</span>. Restoring will make that revision current without deleting your history.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-80 overflow-y-auto space-y-2 py-3">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Loading revisions...</div>
        ) : versions.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">No prior revisions recorded.</div>
        ) : (
          versions.map((ver, idx) => {
            const isCurrent = idx === 0;
            return (
              <div
                key={ver.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-secondary/30 hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">
                      Version {ver.version_number}
                    </span>
                    {isCurrent && (
                      <Badge variant="default" className="text-[10px] py-0">
                        Current Version
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateRelative(ver.created_at)}
                  </span>
                </div>

                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3">
                  <span>{formatBytes(ver.size_bytes)}</span>
                  {ver.notes && <span>• {ver.notes}</span>}
                </div>

                {ver.checksum && (
                  <div className="mt-1 text-[10px] font-mono text-muted-foreground truncate">
                    SHA: {ver.checksum}
                  </div>
                )}

                {!isCurrent && (
                  <div className="mt-3 pt-2 border-t border-border/40 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(ver.id, ver.version_number)}
                      className="rounded-xl h-8 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5" /> Restore This Version
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Dialog>
  );
}
