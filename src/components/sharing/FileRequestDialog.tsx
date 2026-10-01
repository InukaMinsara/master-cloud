import React from 'react';
import { FolderInput, Copy, Check, QrCode } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useFileStore } from '@/stores/fileStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function FileRequestDialog() {
  const { fileRequestModalOpen, setFileRequestModalOpen } = useUIStore();
  const { currentFolderId, folders } = useFileStore();

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [createdUrl, setCreatedUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const currentFolder = folders.find(f => f.id === currentFolderId);
  const folderName = currentFolder ? currentFolder.name : 'My Drive';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const req = await api.createFileRequest({
        targetFolderId: currentFolderId || 'folder-1',
        title: title.trim(),
        description: description.trim() || undefined,
        maxFileSizeBytes: 524288000, // 500 MB
      });

      const url = `${window.location.origin}/request/${req.token}`;
      setCreatedUrl(url);
      toast.success('File Request link created!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create request');
    }
  };

  const handleCopy = () => {
    if (createdUrl) {
      navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setFileRequestModalOpen(false);
    setCreatedUrl(null);
    setTitle('');
    setDescription('');
  };

  return (
    <Dialog open={fileRequestModalOpen} onOpenChange={handleClose} className="max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <FolderInput className="h-5 w-5 text-primary" />
          <DialogTitle>Request Files</DialogTitle>
        </div>
        <DialogDescription>
          Anyone with this link can upload files directly into <span className="font-semibold text-foreground">"{folderName}"</span>. They cannot see other files in this folder.
        </DialogDescription>
      </DialogHeader>

      {!createdUrl ? (
        <form onSubmit={handleCreate} className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Request Title *</label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Tax Documents, Wedding Photos..."
              className="text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Instructions (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add instructions or requirements for uploaders..."
              className="w-full text-xs rounded-xl border border-input bg-background/50 p-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Create Request Link</Button>
          </DialogFooter>
        </form>
      ) : (
        <div className="space-y-4 py-3">
          <div className="p-3 rounded-2xl bg-secondary/60 border border-border space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Shareable Upload Link
            </span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={createdUrl}
                className="bg-transparent text-xs font-mono text-foreground truncate w-full select-all focus:outline-none"
              />
              <Button size="sm" variant="default" onClick={handleCopy} className="rounded-xl h-8 text-xs shrink-0">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </div>
      )}
    </Dialog>
  );
}
