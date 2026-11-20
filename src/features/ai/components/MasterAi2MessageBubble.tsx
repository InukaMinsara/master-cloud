/**
 * src/features/ai/components/MasterAi2MessageBubble.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — MULTIMODAL MESSAGE BUBBLE
 * Supports user file & image attachments, real-time streaming cursor,
 * live LPU tok/s telemetry, syntax-highlighted markdown, and in-chat image cards.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  Bot,
  Copy,
  Check,
  RotateCcw,
  FileText,
  Sparkles,
  Zap,
  Edit2,
  AlertCircle,
  Globe,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { AiImageDetails, AiMessage } from '../types/aiTypes';
import { MasterAi2Markdown } from './MasterAi2Markdown';
import { MasterAi2ImageCard } from './MasterAi2ImageCard';
import { toast } from 'sonner';

interface MessageBubbleProps {
  message: AiMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEdit?: (newText: string) => void;
  onEditImage?: (imageUrl: string, prompt: string) => void;
  onVariation?: (details: AiImageDetails) => void;
  onRemoveBackground?: (imageUrl: string) => void;
  onUpscale?: (imageUrl: string) => void;
}

export function MasterAi2MessageBubble({
  message,
  isStreaming = false,
  onRegenerate,
  onEdit,
  onEditImage,
  onVariation,
  onRemoveBackground,
  onUpscale,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const isUser = message.role === 'user';
  const isImageMessage = Boolean(message.imageDetails || message.isGeneratingImage);

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
            {isImageMessage ? (
              <Sparkles className="w-4 h-4 text-orange-400" />
            ) : (
              <Bot className="w-4 h-4 text-orange-400" />
            )}
          </div>
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-zinc-800/90 text-white border border-white/[0.08] shadow-sm'
            : isImageMessage
              ? 'bg-transparent border-0 p-0 shadow-none'
              : 'bg-white/[0.02] text-zinc-100 border border-white/[0.06] shadow-sm'
        }`}
      >
        {/* Assistant Header (for text messages) */}
        {!isUser && !isImageMessage && (
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.04] text-[11px] text-zinc-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white">Master AI</span>
              {message.modelUsed && (
                <span className="text-orange-400/90 font-medium">
                  · {message.modelUsed.split('/').pop()?.replace(/[-_]/g, ' ') || message.modelUsed}
                </span>
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

        {/* Web Search Sources Grounding */}
        {!isUser && message.webSearchResults && message.webSearchResults.length > 0 && (
          <div className="mb-2.5">
            <details className="group/sources text-xs font-mono">
              <summary className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 cursor-pointer hover:bg-cyan-500/15 transition-colors select-none">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold">{message.webSearchResults.length} Web Sources Grounded</span>
                <ChevronDown className="w-3 h-3 text-cyan-400 transition-transform group-open/sources:rotate-180" />
              </summary>
              <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-cyan-500/30">
                {message.webSearchResults.map((source, sIdx) => (
                  <div key={sIdx} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-cyan-300 hover:underline flex items-center gap-1"
                      >
                        <span>[{sIdx + 1}] {source.title}</span>
                        <ExternalLink className="w-3 h-3 text-cyan-400 shrink-0" />
                      </a>
                    ) : (
                      <div className="font-bold text-cyan-300">[{sIdx + 1}] {source.title}</div>
                    )}
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{source.snippet}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* User Attachments (Files & Images) */}
        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-zinc-200"
              >
                {att.type === 'image' && att.url ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-6 h-6 object-cover rounded-md border border-white/20"
                    />
                    <span className="truncate max-w-[140px]">{att.name}</span>
                  </div>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate max-w-[140px]">{att.name}</span>
                    <span className="text-[10px] text-zinc-400">({(att.sizeBytes / 1024).toFixed(0)}KB)</span>
                  </>
                )}
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
                  className="px-2.5 py-1 rounded-lg hover:bg-white/[0.08] text-zinc-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 rounded-lg bg-orange-500 text-white font-bold cursor-pointer"
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
        ) : isImageMessage ? (
          <MasterAi2ImageCard
            details={message.imageDetails}
            isGenerating={message.isGeneratingImage}
            promptText={message.content}
            onRegenerate={onRegenerate}
            onEditImage={onEditImage}
            onVariation={onVariation}
            onRemoveBackground={onRemoveBackground}
            onUpscale={onUpscale}
          />
        ) : (
          <MasterAi2Markdown content={message.content} isStreaming={isStreaming} />
        )}

        {/* Action Toolbar on Hover (for text messages) */}
        {!isImageMessage && (
          <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-white/[0.04] text-zinc-400 text-xs opacity-70 hover:opacity-100 transition-opacity">
            {isUser && onEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                title="Edit message"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {!isUser && !message.isError && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                  title="Copy response"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {onRegenerate && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                    title="Regenerate response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
