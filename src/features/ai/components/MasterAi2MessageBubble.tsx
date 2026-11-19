/**
 * src/features/ai/components/MasterAi2MessageBubble.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI 2.0 — CONVERSATIONAL MESSAGE BUBBLE
 * Supports user attachments, real-time streaming cursor, live LPU tok/s telemetry,
 * code copying, and prompt regeneration.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { Bot, User, Copy, Check, RotateCcw, FileText, Sparkles, Zap, Edit2, AlertCircle } from 'lucide-react';
import { AiMessage } from '../types/aiTypes';
import { MasterAi2Markdown } from './MasterAi2Markdown';
import { toast } from 'sonner';

interface MessageBubbleProps {
  message: AiMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEdit?: (newText: string) => void;
}

export function MasterAi2MessageBubble({
  message,
  isStreaming = false,
  onRegenerate,
  onEdit,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    setIsEditing(false);
    onEdit?.(editText.trim());
  };

  return (
    <div className={`w-full flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 p-[1px] shadow-md shadow-orange-500/20">
          <div className="w-full h-full rounded-[11px] bg-zinc-950 flex items-center justify-center">
            <Bot className="w-4 h-4 text-orange-400" />
          </div>
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-zinc-800/90 text-white border border-white/[0.08] shadow-sm'
            : 'bg-white/[0.02] text-zinc-100 border border-white/[0.06] shadow-sm'
        }`}
      >
        {/* Assistant Header */}
        {!isUser && (
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.04] text-[11px] text-zinc-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white">Master AI 2.0</span>
              {message.modelUsed && (
                <span className="text-orange-400/90 font-medium">· {message.modelUsed}</span>
              )}
            </div>

            {/* Live Token/Sec Telemetry */}
            {message.metrics && (message.metrics.tokensPerSec || message.metrics.latencyMs) ? (
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                <Zap className="w-3 h-3 text-orange-400" />
                <span>
                  {message.metrics.tokensPerSec ? `${message.metrics.tokensPerSec} tok/s` : ''}
                  {message.metrics.tokensPerSec && message.metrics.latencyMs ? ' · ' : ''}
                  {message.metrics.latencyMs ? `${message.metrics.latencyMs}ms` : ''}
                </span>
              </div>
            ) : null}
          </div>
        )}

        {/* User Attachments */}
        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-zinc-200"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate max-w-[140px]">{att.name}</span>
                <span className="text-[10px] text-zinc-400">({(att.sizeBytes / 1024).toFixed(0)}KB)</span>
              </div>
            ))}
          </div>
        )}

        {/* Message Body */}
        {isUser ? (
          isEditing ? (
            <div className="space-y-2 py-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 rounded-xl bg-zinc-900 border border-white/[0.15] text-xs font-sans text-white focus:outline-none focus:border-orange-500"
                rows={3}
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded-lg hover:bg-white/[0.08] text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 rounded-lg bg-orange-500 text-white font-bold"
                >
                  Save & Resend
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm font-sans leading-relaxed whitespace-pre-wrap">{message.content}</div>
          )
        ) : message.isError ? (
          <div className="flex items-start gap-2 text-red-400 text-xs py-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{message.content}</p>
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry Request</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <MasterAi2Markdown content={message.content} isStreaming={isStreaming} />
        )}

        {/* Action Toolbar on Hover */}
        <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-white/[0.04] text-zinc-400 text-xs opacity-70 hover:opacity-100 transition-opacity">
          {isUser && onEdit && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors"
              title="Edit message"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors"
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {!isUser && onRegenerate && !isStreaming && (
            <button
              type="button"
              onClick={onRegenerate}
              className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors"
              title="Regenerate response"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-zinc-300">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
