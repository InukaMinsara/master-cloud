import React from 'react';
import {
  X,
  FileText,
  Folder,
  Download,
  Share2,
  Trash2,
  Star,
  Clock,
  Calendar,
  HardDrive,
  MessageSquare,
  History,
  Send,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import { useFileStore } from '@/stores/fileStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { usePreviewStore } from '@/stores/previewStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatBytes, formatDateTime, formatDateRelative, getFileCategory } from '@/lib/utils';
import { api } from '@/services/api';
import { CommentRecord, FileVersionRecord } from '@/types/database';

export function FileDetailsSidebar() {
  const { activeDetailsItem, setActiveDetailsItem, toggleStar, deleteItem, files } = useFileStore();
  const { setShareModalItem, setVersionHistoryModalFile } = useUIStore();
  const { user } = useAuthStore();
  const { openPreview } = usePreviewStore();

  const [activeTab, setActiveTab] = React.useState<'details' | 'comments' | 'versions'>('details');
  const [comments, setComments] = React.useState<CommentRecord[]>([]);
  const [versions, setVersions] = React.useState<FileVersionRecord[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);

  const isFolder = Boolean(activeDetailsItem && ('item_count' in activeDetailsItem || (activeDetailsItem as any).isFolder));
  const file = !isFolder && activeDetailsItem ? (activeDetailsItem as any) : null;

  // Load comments & versions whenever active file changes
  React.useEffect(() => {
    if (file?.id) {
      api.getComments(file.id).then(setComments).catch(() => {});
      api.getFileVersions(file.id).then(setVersions).catch(() => {});
    }
  }, [file?.id]);

  if (!activeDetailsItem) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !newComment.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const added = await api.addComment(file.id, newComment.trim());
      setComments(prev => [...prev, added]);
      setNewComment('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await api.deleteComment(commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleDownload = async () => {
    if (file) {
      await api.downloadFile(file);
    }
  };

  return (
    <aside className="w-80 border-l border-border bg-card/80 backdrop-blur-xl flex flex-col h-full z-20 transition-all select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/60">
        <div className="flex items-center gap-2 truncate">
          {isFolder ? (
            <Folder className="h-5 w-5 text-primary shrink-0" />
          ) : (
            <FileText className="h-5 w-5 text-blue-500 shrink-0" />
          )}
          <span className="font-semibold text-xs text-foreground truncate">
            {activeDetailsItem.name}
          </span>
        </div>
        <button
          onClick={() => setActiveDetailsItem(null)}
          className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60 px-4 pt-1">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Details
        </button>
        {!isFolder && (
          <>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'comments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Comments</span>
              {comments.length > 0 && (
                <span className="h-4 w-4 rounded-full bg-secondary text-[10px] flex items-center justify-center font-bold">
                  {comments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'versions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Versions
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'details' && (
          <>
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              {!isFolder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPreview(file, files)}
                  className="rounded-xl h-9 text-xs"
                >
                  Preview
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="rounded-xl h-9 text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareModalItem({ item: activeDetailsItem, isFolder })}
                className="rounded-xl h-9 text-xs"
              >
                <Share2 className="h-3.5 w-3.5 mr-1" /> Share
              </Button>
            </div>

            {/* Properties List */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Properties
              </h5>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium text-foreground">
                    {isFolder ? 'Folder' : file?.extension ? file.extension.toUpperCase() + ' File' : 'Unknown'}
                  </span>
                </div>

                {!isFolder && file && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium text-foreground">{formatBytes(file.size_bytes)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-medium text-foreground">
                    {activeDetailsItem.owner?.display_name || 'Me'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modified</span>
                  <span className="font-medium text-foreground">
                    {formatDateRelative(activeDetailsItem.updated_at)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium text-foreground">
                    {formatDateTime(activeDetailsItem.created_at)}
                  </span>
                </div>

                {!isFolder && file?.checksum && (
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-muted-foreground">SHA-256 Checksum</span>
                    <span className="font-mono text-[10px] text-foreground bg-secondary/80 p-1.5 rounded-lg break-all">
                      {file.checksum}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Danger zone actions */}
            <div className="pt-4 border-t border-border/60">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteItem(activeDetailsItem.id, isFolder)}
                className="w-full rounded-xl text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Move to Trash
              </Button>
            </div>
          </>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="flex flex-col h-full justify-between">
            <div className="space-y-3 overflow-y-auto max-h-80">
              {comments.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No comments yet. Start a collaboration discussion below.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-secondary/50 border border-border/40 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">
                        {c.user?.display_name || 'Collaborator'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateRelative(c.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground">{c.content}</p>
                    {c.user_id === user?.id && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-[10px] text-destructive hover:underline pt-1"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* New Comment Input */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-border/60 flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="h-9 text-xs rounded-xl"
              />
              <Button type="submit" size="iconSm" variant="default" className="h-9 w-9 rounded-xl shrink-0">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        )}

        {/* Version History Tab */}
        {activeTab === 'versions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Revision History
              </h5>
              <Badge variant="info" className="text-[10px]">
                {versions.length} version{versions.length === 1 ? '' : 's'}
              </Badge>
            </div>

            <div className="space-y-2">
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  className="p-3 rounded-xl border border-border/80 bg-secondary/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">
                      Version {ver.version_number}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateRelative(ver.created_at)}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatBytes(ver.size_bytes)} {ver.notes && `• ${ver.notes}`}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => api.restoreFileVersion(file.id, ver.id)}
                    className="h-7 text-[11px] rounded-lg w-full mt-1"
                  >
                    Restore this version
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
