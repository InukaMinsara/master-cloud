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
  Video,
  Table,
  FileCode,
  Layers,
  FileSpreadsheet,
  Film,
  Eye,
  X,
} from 'lucide-react';
import { AiImageDetails, AiMessage, AiAttachment } from '../types/aiTypes';
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
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string; type: 'image' | 'video'; keyframes?: any[] } | null>(null);

  const isUser = message.role === 'user';
  const isImageMessage = Boolean(message.imageDetails || message.isGeneratingImage);

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (sec?: number) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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

        {/* User Attachments (Files, Documents, Images & Videos) */}
        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mb-3">
            {message.attachments.map((att) => {
              const ext = att.name.split('.').pop()?.toLowerCase() || '';
              const isPdf = ext === 'pdf';
              const isExcel = ['xlsx', 'xls', 'csv'].includes(ext);
              const isPpt = ['pptx', 'ppt'].includes(ext);
              const isWord = ['docx', 'doc'].includes(ext);
              const isCode = ['js', 'ts', 'py', 'json', 'html', 'css', 'md', 'sql', 'cpp', 'c', 'cs', 'java', 'go', 'rs', 'sh', 'txt'].includes(ext);

              if (att.type === 'image') {
                const imgSrc = att.dataUri || att.url;
                const dims = att.metadata?.dimensions;
                return (
                  <div
                    key={att.id}
                    onClick={() => imgSrc && setPreviewMedia({ url: imgSrc, title: att.name, type: 'image' })}
                    className="group relative flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.12] hover:border-orange-500/40 text-xs text-zinc-200 transition-all cursor-pointer shadow-sm"
                  >
                    {imgSrc ? (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20 shrink-0 bg-black/40">
                        <img
                          src={imgSrc}
                          alt={att.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-orange-400" />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate max-w-[150px] text-zinc-100">{att.name}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <span>{formatSize(att.sizeBytes)}</span>
                        {dims && <span>• {dims.width}×{dims.height}</span>}
                      </div>
                    </div>
                  </div>
                );
              }

              if (att.type === 'video') {
                const firstKeyframe = att.keyframes?.[0]?.dataUri;
                return (
                  <div
                    key={att.id}
                    onClick={() => setPreviewMedia({
                      url: att.url || '',
                      title: att.name,
                      type: 'video',
                      keyframes: att.keyframes,
                    })}
                    className="group relative flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 hover:border-purple-500/50 text-xs text-zinc-200 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-purple-500/40 shrink-0 bg-purple-950/60 flex items-center justify-center">
                      {firstKeyframe ? (
                        <img src={firstKeyframe} alt="Keyframe" className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-5 h-5 text-purple-400" />
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center font-mono text-purple-300 py-0.5">
                        {formatDuration(att.durationSec)}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate max-w-[150px] text-zinc-100">{att.name}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-purple-300">
                        <span>{formatSize(att.sizeBytes)}</span>
                        <span>• {att.keyframes?.length || 0} keyframes</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Document or file cards
              let iconNode = <FileText className="w-4 h-4 text-cyan-400" />;
              let badgeText = formatSize(att.sizeBytes);
              let cardBg = 'bg-white/[0.07] border-white/[0.12]';

              if (isPdf) {
                iconNode = <FileText className="w-4 h-4 text-rose-400" />;
                badgeText = `${formatSize(att.sizeBytes)}${att.pageCount ? ` • ${att.pageCount} pgs` : ''}`;
                cardBg = 'bg-rose-950/20 border-rose-500/25';
              } else if (isExcel) {
                iconNode = <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
                badgeText = `${formatSize(att.sizeBytes)}${att.sheetNames?.length ? ` • ${att.sheetNames.length} sheets` : ''}`;
                cardBg = 'bg-emerald-950/20 border-emerald-500/25';
              } else if (isPpt) {
                iconNode = <Layers className="w-4 h-4 text-amber-400" />;
                badgeText = `${formatSize(att.sizeBytes)}${att.slideCount ? ` • ${att.slideCount} slides` : ''}`;
                cardBg = 'bg-amber-950/20 border-amber-500/25';
              } else if (isWord) {
                iconNode = <FileText className="w-4 h-4 text-blue-400" />;
                badgeText = `${formatSize(att.sizeBytes)} • docx`;
                cardBg = 'bg-blue-950/20 border-blue-500/25';
              } else if (isCode) {
                iconNode = <FileCode className="w-4 h-4 text-indigo-400" />;
                badgeText = `${formatSize(att.sizeBytes)} • ${ext || 'code'}`;
                cardBg = 'bg-indigo-950/20 border-indigo-500/25';
              }

              return (
                <div
                  key={att.id}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs text-zinc-200 ${cardBg}`}
                >
                  <div className="shrink-0">{iconNode}</div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate max-w-[150px] text-zinc-100">{att.name}</span>
                    <span className="text-[10px] text-zinc-400">{badgeText}</span>
                  </div>
                </div>
              );
            })}
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

      {/* Lightbox / Preview Modal for Attached Images or Videos */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-zinc-900 border border-white/20 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-sm font-semibold text-white truncate max-w-[80%]">{previewMedia.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {previewMedia.type === 'image' ? (
              <div className="flex items-center justify-center overflow-auto max-h-[65vh] p-2 bg-black/50 rounded-xl">
                <img
                  src={previewMedia.url}
                  alt={previewMedia.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[65vh] pr-1">
                {previewMedia.keyframes && previewMedia.keyframes.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-purple-400" />
                      <span>Extracted Visual Keyframes ({previewMedia.keyframes.length})</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {previewMedia.keyframes.map((kf: any, idx: number) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-white/15 bg-black group">
                          <img src={kf.dataUri} alt={`Keyframe ${idx + 1}`} className="w-full aspect-video object-cover" />
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 font-mono text-[9px] text-purple-300 font-bold">
                            {formatDuration(kf.timestampSec)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">No keyframes available for this video preview.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
