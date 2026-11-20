/**
 * src/features/ai/components/MasterAi2Header.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — APPLICATION HEADER
 * Windows 11 Fluent header with multi-provider model indicator, title inline editor,
 * multi-format conversation export (MD, JSON, TXT), keyboard shortcuts modal,
 * and real-time service health indicator pill.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Download,
  Trash2,
  Check,
  Edit2,
  Zap,
  Sparkles,
  Keyboard,
  ChevronDown,
  FileCode,
  FileText,
  Copy,
  Activity,
  Globe,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { healthMonitor } from '@/services/healthMonitor';
import { MasterAi2KeyboardShortcutsModal } from './MasterAi2KeyboardShortcutsModal';
import { toast } from 'sonner';

export function MasterAi2Header() {
  const toggleSidebar = useAiChatStore((s) => s.toggleSidebar);
  const selectedModelId = useAiChatStore((s) => s.selectedModelId);
  const unifiedModels = useAiChatStore((s) => s.unifiedModels);
  const isWebSearchEnabled = useAiChatStore((s) => s.isWebSearchEnabled);
  const toggleWebSearch = useAiChatStore((s) => s.toggleWebSearch);
  const clearActiveConversation = useAiChatStore((s) => s.clearActiveConversation);
  const renameConversation = useAiChatStore((s) => s.renameConversation);
  const exportConversation = useAiChatStore((s) => s.exportConversation);
  const activeConv = useAiChatStore(
    (s) => s.conversations.find((c) => c.id === s.activeConversationId) || s.conversations[0]
  );
  const matchedModel = unifiedModels.find((m) => m.id === selectedModelId);
  const activeModelDisplayName = matchedModel?.name || (selectedModelId.split('/').pop()?.replace(/-/g, ' ') || 'Master AI');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [serviceHealth, setServiceHealth] = useState<'healthy' | 'degraded' | 'offline'>('healthy');

  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Monitor health periodically
  useEffect(() => {
    const check = async () => {
      const results = await healthMonitor.checkAllServices();
      const groqOk = results.groq.status === 'healthy';
      const polOk = results.pollinations.status === 'healthy';
      if (groqOk && polOk) setServiceHealth('healthy');
      else if (groqOk || polOk) setServiceHealth('degraded');
      else setServiceHealth('offline');
    };
    check();
    const interval = setInterval(check, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartRename = () => {
    setTitleDraft(activeConv?.title || 'New Conversation');
    setIsEditingTitle(true);
  };

  const handleSaveRename = () => {
    if (activeConv && titleDraft.trim()) {
      renameConversation(activeConv.id, titleDraft.trim());
    }
    setIsEditingTitle(false);
  };

  const handleDownloadExport = (format: 'markdown' | 'json' | 'text') => {
    if (!activeConv || activeConv.messages.length === 0) {
      toast.info('No messages to export.');
      return;
    }

    const exportedContent = exportConversation(format);
    const mimeTypes = {
      markdown: 'text/markdown;charset=utf-8',
      json: 'application/json;charset=utf-8',
      text: 'text/plain;charset=utf-8',
    };
    const extensions = {
      markdown: 'md',
      json: 'json',
      text: 'txt',
    };

    const blob = new Blob([exportedContent], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = activeConv.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${cleanTitle}_${Date.now()}.${extensions[format]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
    toast.success(`Exported conversation as .${extensions[format]}`);
  };

  const handleCopyTranscript = async () => {
    if (!activeConv || activeConv.messages.length === 0) {
      toast.info('No messages to copy.');
      return;
    }
    const text = exportConversation('text');
    try {
      await navigator.clipboard.writeText(text);
      setIsExportMenuOpen(false);
      toast.success('Conversation transcript copied to clipboard!');
    } catch {
      toast.error('Could not copy transcript.');
    }
  };

  return (
    <>
      <header className="h-14 px-4 border-b border-white/[0.06] bg-zinc-950/70 backdrop-blur-xl flex items-center justify-between select-none z-20">
        {/* Left: Sidebar Toggle & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Toggle Sidebar (Ctrl+B)"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Conversation Title Inline Editor */}
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                autoFocus
                className="h-8 px-2.5 rounded-lg bg-zinc-900 border border-orange-500/50 text-xs font-semibold text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveRename}
                className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={handleStartRename}
              className="group flex items-center gap-2 cursor-pointer py-1 px-2 rounded-lg hover:bg-white/[0.04] transition-colors min-w-0"
              title="Click to rename"
            >
              <h1 className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                {activeConv?.title || 'New Conversation'}
              </h1>
              <Edit2 className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100" />
            </div>
          )}
        </div>

        {/* Right Controls: Model Badge & Vault Indicator & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Model Indicator Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-medium text-white">{activeModelDisplayName}</span>
          </div>

          {/* Web Search Grounding Toggle */}
          <button
            type="button"
            onClick={toggleWebSearch}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-mono ${
              isWebSearchEnabled
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]'
            }`}
            title={isWebSearchEnabled ? 'Live Web Intelligence: Enabled' : 'Enable Live Web Search Grounding'}
          >
            <Globe className={`w-4 h-4 ${isWebSearchEnabled ? 'text-cyan-400 animate-pulse' : 'text-zinc-400'}`} />
            <span className="hidden md:inline text-[11px] font-sans">
              {isWebSearchEnabled ? 'Web Active' : 'Web'}
            </span>
          </button>

          {/* Master AI Service Health Indicator Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-medium border select-none cursor-pointer ${
              serviceHealth === 'healthy'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : serviceHealth === 'degraded'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
            title="Master AI Neural Engine Status"
            onClick={() => toast.info('Master AI: Fully operational with unified multi-engine intelligence.')}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                serviceHealth === 'healthy'
                  ? 'bg-emerald-400 animate-pulse'
                  : serviceHealth === 'degraded'
                  ? 'bg-amber-400'
                  : 'bg-red-500'
              }`}
            />
            <span className="hidden md:inline capitalize">{serviceHealth === 'healthy' ? 'Online' : serviceHealth}</span>
          </div>

          {/* Keyboard Shortcuts Trigger */}
          <button
            type="button"
            onClick={() => setIsShortcutsModalOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Keyboard Shortcuts (Ctrl+/)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center gap-1"
              title="Export conversation"
            >
              <Download className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleDownloadExport('markdown')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span className="font-medium">Markdown (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadExport('json')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium">Structured JSON (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadExport('text')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span className="font-medium">Plain Text (.txt)</span>
                </button>
                <div className="h-[1px] bg-white/[0.06] my-1" />
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium">Copy Transcript</span>
                </button>
              </div>
            )}
          </div>

          {/* Clear Messages */}
          <button
            type="button"
            onClick={() => {
              if (activeConv && activeConv.messages.length > 0) {
                if (window.confirm('Clear all messages in this conversation?')) {
                  clearActiveConversation();
                  toast.info('Conversation messages cleared.');
                }
              }
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Clear messages"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Keyboard Shortcuts Dialog */}
      <MasterAi2KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </>
  );
}
