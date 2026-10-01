import React from 'react';
import {
  Download,
  Trash2,
  X,
  Star,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import { useFileStore } from '@/stores/fileStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function FileActionBar() {
  const {
    selectedItemIds,
    clearSelection,
    selectAll,
    bulkDownload,
    bulkDelete,
    files,
    folders,
  } = useFileStore();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  if (selectedItemIds.length === 0) return null;

  const totalSelected = selectedItemIds.length;

  const handleDeleteConfirm = async () => {
    await bulkDelete();
    setConfirmDeleteOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur-xl px-4 py-2.5 shadow-2xl shadow-black/20 animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center gap-2 pr-2 border-r border-border/60">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
            {totalSelected}
          </span>
          <span className="text-xs font-semibold text-foreground hidden sm:inline">
            selected
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={selectAll}
          className="rounded-xl h-8 text-xs font-medium"
        >
          <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
          Select All
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={bulkDownload}
          className="rounded-xl h-8 text-xs font-medium"
        >
          <Download className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
          Download
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmDeleteOpen(true)}
          className="rounded-xl h-8 text-xs font-medium"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Trash
        </Button>

        <div className="pl-1 border-l border-border/60">
          <button
            onClick={clearSelection}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Deselect all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Confirmation modal for destructive bulk deletion */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Move {totalSelected} items to Trash?</DialogTitle>
          </div>
          <DialogDescription>
            Selected files and folders will be moved to the Trash. You can restore them anytime within 30 days.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteConfirm}>
            Move to Trash
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
