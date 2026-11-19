/**
 * src/features/ai/components/MasterAi2Header.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI 2.0 — APPLICATION HEADER
 * Windows 11 Fluent design header with model picker, title rename,
 * chat export, and Groq Key Vault indicator.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  Menu,
  Key,
  Download,
  Trash2,
  Check,
  Edit2,
  Zap,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { groqService } from '../services/groqService';
import { getGroqModelInfo } from '../services/groqModels';
import { toast } from 'sonner';

export function MasterAi2Header() {
  const toggleSidebar = useAiChatStore((s) => s.toggleSidebar);
  const selectedModelId = useAiChatStore((s) => s.selectedModelId);
  const setIsKeyModalOpen = useAiChatStore((s) => s.setIsKeyModalOpen);
  const clearActiveConversation = useAiChatStore((s) => s.clearActiveConversation);
  const renameConversation = useAiChatStore((s) => s.renameConversation);
  const getActiveConversation = useAiChatStore((s) => s.getActiveConversation);

  const activeConv = getActiveConversation();
  const activeModel = getGroqModelInfo(selectedModelId);
  const hasKey = groqService.hasApiKey();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

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

  const handleExportMarkdown = () => {
    if (!activeConv || activeConv.messages.length === 0) {
      toast.info('No messages to export.');
      return;
    }

    let md = `# ${activeConv.title}\n*Exported from Master AI 2.0 on ${new Date().toLocaleString()}*\n\n---\n\n`;
    for (const msg of activeConv.messages) {
      const roleName = msg.role === 'user' ? '👤 User' : `🤖 Master AI 2.0 (${msg.modelUsed || 'Groq'})`;
      const time = new Date(msg.timestamp).toLocaleTimeString();
      md += `### ${roleName} [${time}]\n\n${msg.content}\n\n---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConv.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_chat.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Conversation exported as Markdown (.md)!');
  };

  return (
    <header className="h-14 px-4 border-b border-white/[0.06] bg-zinc-950/70 backdrop-blur-xl flex items-center justify-between select-none z-20">
      {/* Left: Sidebar Toggle & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Toggle Sidebar"
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
              className="p-1.5 rounded-lg bg-orange-500 text-white"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={handleStartRename}
            className="group flex items-center gap-1.5 cursor-pointer max-w-[200px] sm:max-w-xs truncate"
          >
            <span className="text-xs sm:text-sm font-bold text-white truncate">
              {activeConv?.title || 'New Conversation'}
            </span>
            <Edit2 className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Active Model Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300">
          <Zap className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-semibold">{activeModel.name}</span>
        </div>

        {/* Key Vault Trigger */}
        <button
          type="button"
          onClick={() => setIsKeyModalOpen(true)}
          className={`h-8 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            hasKey
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20 animate-pulse'
          }`}
          title={hasKey ? 'Groq Key Active' : 'Enter Groq Key'}
        >
          <div className={`h-2 w-2 rounded-full ${hasKey ? 'bg-emerald-400' : 'bg-orange-400'}`} />
          <Key className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{hasKey ? 'Groq Active' : 'Set Key'}</span>
        </button>

        {/* Export Markdown */}
        <button
          type="button"
          onClick={handleExportMarkdown}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Export chat as Markdown"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Clear Chat */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Clear all messages in this conversation?')) {
              clearActiveConversation();
              toast.info('Conversation cleared.');
            }
          }}
          className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          title="Clear messages"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
