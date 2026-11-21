/**
 * src/features/ai/components/MasterAi2Header.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — APPLICATION HEADER & COMMAND STRIP
 * Full suite:
 * - Dynamic Context Window Usage meter (estimated tokens / max context %)
 * - Active Model indicator with Model-Family Logo
 * - 1-Click Comparison Mode Toggle
 * - Prompt Templates Library trigger
 * - Provider Health Dashboard trigger
 * - Generation Settings & Personalization modal trigger
 * - Conversation Share & Export hub trigger
 * - Inline Title editor and Keyboard Shortcuts modal
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Sliders,
  Columns2,
  BookTemplate,
  Share2,
  FileSpreadsheet,
  PieChart,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { MasterAi2KeyboardShortcutsModal } from './MasterAi2KeyboardShortcutsModal';
import { MasterAi2GenerationSettingsModal } from './MasterAi2GenerationSettingsModal';
import { MasterAi2PromptTemplatesModal } from './MasterAi2PromptTemplatesModal';
import { MasterAi2ProviderHealthDrawer } from './MasterAi2ProviderHealthDrawer';
import { MasterAi2ShareModal } from './MasterAi2ShareModal';
import { ModelFamilyLogo } from './ModelFamilyLogo';
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
  const isComparisonMode = useAiChatStore((s) => s.isComparisonMode);
  const setComparisonMode = useAiChatStore((s) => s.setComparisonMode);
  const addUserMessage = useAiChatStore((s) => s.addUserMessage);

  const activeConv = useAiChatStore(
    (s) => s.conversations.find((c) => c.id === s.activeConversationId) || s.conversations[0]
  );
  const matchedModel = unifiedModels.find((m) => m.id === selectedModelId);
  const activeModelDisplayName =
    matchedModel?.name || (selectedModelId.split('/').pop()?.replace(/[-_]/g, ' ') || 'Master AI');

  // Modals state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isHealthDrawerOpen, setIsHealthDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const exportMenuRef = useRef<HTMLDivElement>(null);

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

  // Compute live context-window usage estimate (#53)
  const contextStats = useMemo(() => {
    if (!activeConv || activeConv.messages.length === 0) {
      return { usedTokens: 0, maxTokens: matchedModel?.contextLength || 131072, percent: 0 };
    }
    let totalChars = 0;
    for (const msg of activeConv.messages) {
      totalChars += (msg.content || '').length;
      if (msg.attachments) {
        for (const att of msg.attachments) {
          totalChars += (att.content || '').length || 1000;
        }
      }
    }
    const estimatedTokens = Math.max(1, Math.round(totalChars / 4));
    const maxTokens = matchedModel?.contextLength || 131072;
    const percent = Math.min(100, Math.round((estimatedTokens / maxTokens) * 100));
    return { usedTokens: estimatedTokens, maxTokens, percent };
  }, [activeConv, matchedModel]);

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
        {/* Left: Sidebar Toggle & Title Inline Editor */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Toggle Sidebar (Ctrl+B)"
          >
            <Menu className="w-4 h-4" />
          </button>

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
                className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors cursor-pointer"
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
              <h1 className="text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs">
                {activeConv?.title || 'New Conversation'}
              </h1>
              <Edit2 className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100" />
            </div>
          )}
        </div>

        {/* Right Controls: Model, Context Usage, Comparison, Templates, Health, Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Model Indicator Badge */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300">
            <span className="font-medium text-white">{activeModelDisplayName}</span>
            <ModelFamilyLogo modelId={selectedModelId} size={14} />
          </div>

          {/* Context Window Usage Gauge (#53) */}
          <div
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-zinc-300 cursor-help"
            title={`Context Window: ~${contextStats.usedTokens.toLocaleString()} / ${contextStats.maxTokens.toLocaleString()} tokens (${contextStats.percent}%)`}
          >
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  contextStats.percent > 80
                    ? 'bg-rose-500'
                    : contextStats.percent > 50
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(4, contextStats.percent)}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400">{contextStats.percent}%</span>
          </div>

          {/* Comparison Mode Toggle (#176) */}
          <button
            type="button"
            onClick={() => setComparisonMode(!isComparisonMode)}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-mono ${
              isComparisonMode
                ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 shadow-sm shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]'
            }`}
            title="Toggle Dual-Model Side-by-Side Comparison"
          >
            <Columns2 className={`w-4 h-4 ${isComparisonMode ? 'text-orange-400' : 'text-zinc-400'}`} />
            <span className="hidden xl:inline text-[11px] font-sans">Compare</span>
          </button>

          {/* Prompt Templates Library (#146) */}
          <button
            type="button"
            onClick={() => setIsTemplatesModalOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Prompt Template Library"
          >
            <BookTemplate className="w-4 h-4 text-amber-400" />
          </button>

          {/* Provider Health Dashboard Drawer (#31, #182) */}
          <button
            type="button"
            onClick={() => setIsHealthDrawerOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Multi-Provider Ecosystem Health"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Generation Settings Modal (#41, #51) */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Generation Parameters & System Instructions"
          >
            <Sliders className="w-4 h-4 text-zinc-300" />
          </button>

          {/* Share Conversation Modal (#121) */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Share or Export Conversation"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
          </button>

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
              title="Download chat"
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

      {/* Modals & Drawers */}
      <MasterAi2KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <MasterAi2GenerationSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <MasterAi2PromptTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={(text) => {
          // Send or paste into prompt
          addUserMessage(text, []);
        }}
      />

      <MasterAi2ProviderHealthDrawer
        isOpen={isHealthDrawerOpen}
        onClose={() => setIsHealthDrawerOpen(false)}
      />

      <MasterAi2ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
}
