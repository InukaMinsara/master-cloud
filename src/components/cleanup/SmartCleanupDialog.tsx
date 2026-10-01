import React from 'react';
import {
  Sparkles,
  Trash2,
  Copy,
  Clock,
  HardDrive,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useFileStore } from '@/stores/fileStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { formatBytes } from '@/lib/utils';
import { FileItem, DuplicateFileGroup } from '@/types/file';
import { toast } from 'sonner';

export function SmartCleanupDialog() {
  const { smartCleanupModalOpen, setSmartCleanupModalOpen } = useUIStore();
  const { fetchItems } = useFileStore();

  const [suggestions, setSuggestions] = React.useState(() => api.getStorageCleanupSuggestions());
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [activeTab, setActiveTab] = React.useState<'large' | 'duplicates' | 'old' | 'trash'>('large');

  React.useEffect(() => {
    if (smartCleanupModalOpen) {
      setSuggestions(api.getStorageCleanupSuggestions());
      setSelectedIds([]);
    }
  }, [smartCleanupModalOpen]);

  if (!smartCleanupModalOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCleanSelected = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await api.softDeleteFile(id);
    }
    toast.success(`Moved ${selectedIds.length} files to Trash`);
    setSuggestions(api.getStorageCleanupSuggestions());
    setSelectedIds([]);
    await fetchItems();
  };

  const handleEmptyTrash = async () => {
    await api.emptyTrash();
    toast.success('Trash emptied');
    setSuggestions(api.getStorageCleanupSuggestions());
    await fetchItems();
  };

  return (
    <Dialog open={smartCleanupModalOpen} onOpenChange={setSmartCleanupModalOpen} className="max-w-2xl">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Sparkles className="h-4 w-4" />
          </div>
          <DialogTitle>Smart Storage Optimizer</DialogTitle>
        </div>
        <DialogDescription>
          Deterministic rules detect large assets, old archives, duplicate checksums, and purgeable trash. Nothing is deleted without your confirmation.
        </DialogDescription>
      </DialogHeader>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab('large')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'large' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <HardDrive className="h-3.5 w-3.5" /> Large Files ({suggestions.largeFiles.length})
        </button>
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'duplicates' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Copy className="h-3.5 w-3.5" /> Duplicates ({suggestions.duplicateGroups.length})
        </button>
        <button
          onClick={() => setActiveTab('old')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'old' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Clock className="h-3.5 w-3.5" /> Inactive ({suggestions.oldFiles.length})
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'trash' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" /> Trash ({formatBytes(suggestions.trashBytes)})
        </button>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto space-y-2 py-1">
        {activeTab === 'large' && (
          suggestions.largeFiles.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No unusually large files detected.</div>
          ) : (
            suggestions.largeFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => toggleSelect(file.id)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedIds.includes(file.id) ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30 hover:border-border/80'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(file.id)}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <div className="truncate">
                    <span className="text-xs font-semibold text-foreground truncate block">{file.name}</span>
                    <span className="text-[11px] text-muted-foreground">{formatBytes(file.size_bytes)}</span>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'duplicates' && (
          suggestions.duplicateGroups.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No duplicate checksums discovered.</div>
          ) : (
            suggestions.duplicateGroups.map((group) => (
              <div key={group.checksum} className="p-3 rounded-xl border border-border bg-secondary/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="truncate">{group.name}</span>
                  <span className="text-muted-foreground font-mono text-[11px]">{formatBytes(group.size)} each</span>
                </div>
                <div className="space-y-1">
                  {group.files.map((f, i) => (
                    <div key={f.id} className="flex items-center justify-between text-[11px] pl-3">
                      <span>Copy #{i + 1} ({new Date(f.created_at).toLocaleDateString()})</span>
                      <button
                        onClick={() => api.softDeleteFile(f.id).then(() => setSuggestions(api.getStorageCleanupSuggestions()))}
                        className="text-destructive hover:underline"
                      >
                        Delete copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'old' && (
          suggestions.oldFiles.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No dormant files found.</div>
          ) : (
            suggestions.oldFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => toggleSelect(file.id)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedIds.includes(file.id) ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(file.id)}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <div className="truncate">
                    <span className="text-xs font-semibold text-foreground truncate block">{file.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      Unmodified since {new Date(file.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'trash' && (
          <div className="p-6 text-center space-y-4">
            <Trash2 className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-foreground">Trash contains {suggestions.trashCount} items</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Occupying {formatBytes(suggestions.trashBytes)} of your quota.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleEmptyTrash}
              disabled={suggestions.trashCount === 0}
              className="rounded-xl text-xs"
            >
              Permanently Empty Trash
            </Button>
          </div>
        )}
      </div>

      <DialogFooter>
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} item{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSmartCleanupModalOpen(false)}>
              Close
            </Button>
            {selectedIds.length > 0 && (
              <Button variant="destructive" onClick={handleCleanSelected}>
                Move Selected to Trash
              </Button>
            )}
          </div>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
