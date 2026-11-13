import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  RotateCcw,
  Trash2,
  CornerDownRight,
  User,
  X,
  Plus,
} from 'lucide-react';
import { SlideComment, SlideCommentReply } from '../types';

interface MasterSlidesCommentsPanelProps {
  slideId: string;
  slideIndex: number;
  comments: SlideComment[];
  selectedObjectId: string | null;
  onAddComment: (text: string, targetObjectId?: string) => void;
  onAddReply: (commentId: string, text: string) => void;
  onToggleResolve: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onClose: () => void;
}

export function MasterSlidesCommentsPanel({
  slideId,
  slideIndex,
  comments,
  selectedObjectId,
  onAddComment,
  onAddReply,
  onToggleResolve,
  onDeleteComment,
  onClose,
}: MasterSlidesCommentsPanelProps) {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const slideComments = comments.filter((c) => c.slideId === slideId);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText.trim(), selectedObjectId || undefined);
    setNewCommentText('');
  };

  const handlePostReply = (commentId: string) => {
    const text = replyTextMap[commentId]?.trim();
    if (!text) return;
    onAddReply(commentId, text);
    setReplyTextMap((prev) => ({ ...prev, [commentId]: '' }));
    setActiveReplyId(null);
  };

  return (
    <div className="w-80 border-l border-border bg-card/90 backdrop-blur-md flex flex-col shrink-0 select-none overflow-hidden animate-in slide-in-from-right-4 duration-150">
      {/* Header */}
      <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-card/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Comments &bull; Slide #{slideIndex + 1}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* New Comment Box */}
      <form onSubmit={handlePostComment} className="p-3 border-b border-border bg-card/40">
        <div className="flex flex-col gap-2">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={
              selectedObjectId
                ? 'Add comment on selected object...'
                : `Add comment on Slide #${slideIndex + 1}...`
            }
            rows={2}
            className="w-full text-xs bg-background border border-border rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-primary text-foreground resize-none leading-relaxed placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {selectedObjectId ? 'Attached to element' : 'Attached to slide'}
            </span>
            <button
              type="submit"
              disabled={!newCommentText.trim()}
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors disabled:opacity-30 shadow-sm"
            >
              <Send className="h-3 w-3" />
              <span>Comment</span>
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {slideComments.length > 0 ? (
          slideComments.map((c) => (
            <div
              key={c.id}
              className={`p-3 rounded-2xl border text-xs transition-all ${
                c.resolved
                  ? 'border-border/40 bg-muted/20 opacity-70'
                  : 'border-border bg-card/60 shadow-sm'
              }`}
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center">
                    {c.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-foreground text-xs">{c.author}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleResolve(c.id)}
                    className={`p-1 rounded hover:bg-accent ${
                      c.resolved ? 'text-emerald-500' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={c.resolved ? 'Reopen comment' : 'Resolve comment'}
                  >
                    {c.resolved ? <RotateCcw className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => onDeleteComment(c.id)}
                    className="p-1 hover:text-destructive rounded hover:bg-destructive/10 text-muted-foreground"
                    title="Delete thread"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Comment Body */}
              <p className="text-foreground leading-relaxed pl-6 whitespace-pre-wrap">{c.text}</p>

              {/* Replies */}
              {c.replies && c.replies.length > 0 && (
                <div className="mt-2.5 pl-6 space-y-2 border-l-2 border-border/80 ml-2">
                  {c.replies.map((r) => (
                    <div key={r.id} className="text-[11px]">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-foreground">{r.author}</span>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-tight">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              <div className="mt-2.5 pl-6 pt-1 border-t border-border/40">
                {activeReplyId === c.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={replyTextMap[c.id] || ''}
                      onChange={(e) =>
                        setReplyTextMap((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePostReply(c.id);
                        else if (e.key === 'Escape') setActiveReplyId(null);
                      }}
                      placeholder="Write a reply..."
                      className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                    <button
                      onClick={() => handlePostReply(c.id)}
                      className="p-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveReplyId(c.id)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                  >
                    <CornerDownRight className="h-3 w-3" />
                    <span>Reply</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
            <MessageSquare className="h-6 w-6 text-muted-foreground/40 mx-auto" />
            <p>No comments on this slide yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
