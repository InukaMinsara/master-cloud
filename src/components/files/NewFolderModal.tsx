import React from 'react';
import { FolderPlus } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useFileStore } from '@/stores/fileStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COLOR_PALETTE } from '@/lib/constants';
import { toast } from 'sonner';

export function NewFolderModal() {
  const { newFolderModalOpen, setNewFolderModalOpen } = useUIStore();
  const { createFolder } = useFileStore();

  const [name, setName] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState(COLOR_PALETTE[0].value);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createFolder(name.trim(), selectedColor);
      toast.success(`Folder "${name.trim()}" created`);
      setName('');
      setNewFolderModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={newFolderModalOpen} onOpenChange={setNewFolderModalOpen} className="max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <FolderPlus className="h-5 w-5 text-primary" />
          <DialogTitle>New Folder</DialogTitle>
        </div>
        <DialogDescription>
          Organize your files into structured, nested directories.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Folder Name</label>
          <Input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Invoices, Research 2026..."
            className="text-xs rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Folder Tint Color</label>
          <div className="flex items-center gap-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                className={`h-7 w-7 rounded-full transition-transform ${
                  selectedColor === c.value ? 'scale-110 ring-2 ring-primary ring-offset-2' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setNewFolderModalOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            Create Folder
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
