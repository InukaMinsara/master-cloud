/**
 * src/features/ai/components/MasterAi2Header.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — APPLICATION HEADER
 * Windows 11 Fluent header with multi-provider model indicator, title inline editor,
 * chat export, and Provider Vault status button.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  Menu,
  Download,
  Trash2,
  Check,
  Edit2,
  Zap,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { groqService } from '../services/groqService';
import { getGroqModelInfo } from '../services/groqModels';
import { PREFERRED_POLLINATIONS_MODELS } from '../services/pollinationsModels';
import { toast } from 'sonner';

export function MasterAi2Header() {
  const toggleSidebar = useAiChatStore((s) => s.toggleSidebar);
  const selectedModelId = useAiChatStore((s) => s.selectedModelId);
  const activeImageModelId = useAiChatStore((s) => s.activeImageModelId);
  const chatMode = useAiChatStore((s) => s.chatMode);
  const clearActiveConversation = useAiChatStore((s) => s.clearActiveConversation);
  const renameConversation = useAiChatStore((s) => s.renameConversation);
  const getActiveConversation = useAiChatStore((s) => s.getActiveConversation);

  const activeConv = getActiveConversation();
  const activeGroqModel = getGroqModelInfo(selectedModelId);
  const activeImageModel =
    PREFERRED_POLLINATIONS_MODELS.find((m) => m.id === activeImageModelId) ||
    PREFERRED_POLLINATIONS_MODELS[0];

  const hasGroqKey = groqService.hasApiKey();

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

    let md = `# ${activeConv.title}\n*Exported from Master AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
    for (const msg of activeConv.messages) {
      const roleName = msg.role === 'user' ? '👤 User' : `🤖 Master AI (${msg.modelUsed || msg.providerUsed || 'Groq'})`;
      const time = new Date(msg.timestamp).toLocaleTimeString();
      md += `### ${roleName} [${time}]\n\n${msg.content}\n\n`;
      if (msg.imageDetails) {
        md += `![${msg.imageDetails.prompt}](${msg.imageDetails.url})\n\n`;
      }
      md += `---\n\n`;
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
            <h1 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
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
          {chatMode === 'image' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-medium text-white">{activeImageModel.name}</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-medium text-white">{activeGroqModel.name}</span>
            </>
          )}
        </div>

        {/* Server Environment Provider Status Pill */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-medium border select-none ${
            hasGroqKey
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40'
          }`}
          title={hasGroqKey ? 'Groq LPU active (via .env.local)' : 'Groq offline (configure GROQ_API_KEY in .env.local)'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${hasGroqKey ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
          <span className="hidden sm:inline">
            {hasGroqKey ? 'Groq Active' : 'Groq Offline'}
          </span>
        </div>

        {/* Export Chat */}
        <button
          type="button"
          onClick={handleExportMarkdown}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Export chat as Markdown (.md)"
        >
          <Download className="w-4 h-4" />
        </button>

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
  );
}
