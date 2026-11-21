/**
 * src/features/ai/components/MasterAi2ShareModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — CONVERSATION SHARING & EXPORT HUB
 * Generates secure public share links and multi-format exports (Markdown, JSON, Text).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  FileText,
  FileCode,
  Shield,
  Eye,
  EyeOff,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MasterAi2ShareModal({ isOpen, onClose }: ShareModalProps) {
  const getActiveConversation = useAiChatStore((s) => s.getActiveConversation);
  const exportConversation = useAiChatStore((s) => s.exportConversation);

  const [copiedLink, setCopiedLink] = useState(false);
  const [includeSystemPrompt, setIncludeSystemPrompt] = useState(false);
  const [includeReasoning, setIncludeReasoning] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  const activeConv = getActiveConversation();
  const shareId = activeConv?.shareId || activeConv?.id || 'demo-share';
  const shareUrl = `${window.location.origin}/ai/share/${shareId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      toast.success('Public conversation link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleExport = (format: 'markdown' | 'json' | 'text') => {
    try {
      const data = exportConversation(format);
      const mime = format === 'json' ? 'application/json' : 'text/plain';
      const ext = format === 'markdown' ? 'md' : format;
      const blob = new Blob([data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeConv?.title || 'master_ai_chat'}_${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported conversation as .${ext}`);
    } catch {
      toast.error('Failed to export conversation.');
    }
  };

  if (!isOpen || !activeConv) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Share Conversation
              </h2>
              <p className="text-xs text-zinc-400 truncate max-w-[280px]">
                {activeConv.title || 'Untitled Conversation'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-300 flex items-center justify-between">
              <span>Public Share Link</span>
              <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                <Globe className="w-3 h-3" /> Anyone with link can view
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-orange-500/20"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Privacy & Scope Controls */}
          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Privacy & Content Inclusions
            </h4>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.04] transition-colors">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-white">Include System Instructions</div>
                  <div className="text-[11px] text-zinc-400">
                    Include custom system prompts and persona rules in the shared export.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeSystemPrompt}
                  onChange={(e) => setIncludeSystemPrompt(e.target.checked)}
                  className="rounded border-zinc-700 text-orange-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.04] transition-colors">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-white">Include Reasoning Thought Blocks</div>
                  <div className="text-[11px] text-zinc-400">
                    Render internal thought deliberation (&lt;think&gt; tags) in the shared view.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeReasoning}
                  onChange={(e) => setIncludeReasoning(e.target.checked)}
                  className="rounded border-zinc-700 text-orange-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Offline Export Formats */}
          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Direct File Export
            </h4>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleExport('markdown')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-orange-500/40 text-xs font-medium text-zinc-200 transition-all cursor-pointer group"
              >
                <FileText className="w-5 h-5 text-orange-400 mb-1 group-hover:scale-110 transition-transform" />
                <span>Markdown (.md)</span>
              </button>

              <button
                type="button"
                onClick={() => handleExport('json')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/40 text-xs font-medium text-zinc-200 transition-all cursor-pointer group"
              >
                <FileCode className="w-5 h-5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                <span>JSON (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => handleExport('text')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-emerald-500/40 text-xs font-medium text-zinc-200 transition-all cursor-pointer group"
              >
                <Download className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span>Plain Text (.txt)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
