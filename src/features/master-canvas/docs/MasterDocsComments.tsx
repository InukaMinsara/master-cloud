import React, { useState } from 'react';
import { MessageSquare, Check, Trash2, Send, CornerDownRight, CheckCircle2 } from 'lucide-react';
import { DocComment } from '@/types/canvas';
import { Button } from '@/components/ui/button';
import { formatDateRelative } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface MasterDocsCommentsProps {
  comments: DocComment[];
  selectedText?: string;
  onAddComment: (text: string, selectedText?: string) => void;
  onReplyComment: (commentId: string, text: string) => void;
  onResolveComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function MasterDocsComments({
  comments = [],
  selectedText,
  onAddComment,
  onReplyComment,
  onResolveComment,
  onDeleteComment,
}: MasterDocsCommentsProps) {
  const { user } = useAuthStore();
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText.trim(), selectedText);
    setNewCommentText('');
  };

  const handleSendReply = (commentId: string) => {
    if (!replyText.trim()) return;
    onReplyComment(commentId, replyText.trim());
    setReplyText('');
    setReplyingToId(null);
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/60">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span>Comments &amp; Discussions ({comments.length})</span>
        </div>
      </div>

      {/* New Comment Input Box */}
      <form onSubmit={handleCreateComment} className="p-3 border-b border-border/60 bg-secondary/20 space-y-2">
        {selectedText && (
          <div className="p-2 rounded-xl bg-primary/10 border-l-2 border-primary text-[11px] text-muted-foreground truncate">
            &ldquo;{selectedText}&rdquo;
          </div>
        )}
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment or suggestion..."
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-background p-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newCommentText.trim()}
            className="rounded-xl text-xs h-7 gap-1 font-semibold"
          >
            <Send className="h-3 w-3" />
            Comment
          </Button>
        </div>
      </form>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 space-y-1">
            <MessageSquare className="h-6 w-6 text-muted-foreground/40 mx-auto" />
            <p className="text-xs font-medium text-muted-foreground">No comments yet</p>
            <p className="text-[11px] text-muted-foreground/70">Select text and leave a note for collaborators.</p>
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className={`p-3 rounded-2xl border transition-all space-y-2.5 ${
                c.resolved ? 'bg-secondary/20 border-border/40 opacity-70' : 'bg-card border-border shadow-sm'
              }`}
            >
              {/* Commenter Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {c.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">{c.author}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateRelative(c.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onResolveComment(c.id)}
                    title={c.resolved ? 'Reopen comment' : 'Resolve comment'}
                    className={`p-1 rounded-lg transition-colors ${
                      c.resolved ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteComment(c.id)}
                    title="Delete comment"
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Quoted Text if any */}
              {c.selectedText && (
                <div className="p-1.5 rounded-lg bg-secondary/40 text-[10px] text-muted-foreground border-l border-primary/50 truncate">
                  &ldquo;{c.selectedText}&rdquo;
                </div>
              )}

              {/* Comment Content */}
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{c.text}</p>

              {/* Thread Replies */}
              {c.replies && c.replies.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/40 pl-3">
                  {c.replies.map((rep) => (
                    <div key={rep.id} className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-foreground">{rep.author}</span>
                        <span className="text-[9px] text-muted-foreground">{formatDateRelative(rep.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{rep.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Button or Reply Input */}
              {replyingToId === c.id ? (
                <div className="pt-2 space-y-1.5 border-t border-border/40">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full rounded-xl border border-border bg-background p-1.5 text-[11px] focus:outline-none focus:border-primary"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply(c.id)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReplyingToId(null)}
                      className="rounded-lg text-[10px] h-6 px-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSendReply(c.id)}
                      disabled={!replyText.trim()}
                      className="rounded-lg text-[10px] h-6 px-2.5"
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              ) : (
                !c.resolved && (
                  <button
                    onClick={() => {
                      setReplyingToId(c.id);
                      setReplyText('');
                    }}
                    className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 pt-1"
                  >
                    <CornerDownRight className="h-3 w-3" /> Reply
                  </button>
                )
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
