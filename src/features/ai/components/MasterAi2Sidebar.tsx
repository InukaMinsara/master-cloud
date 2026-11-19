/**
 * src/features/ai/components/MasterAi2Sidebar.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI 2.0 — SIDEBAR NAVIGATION
 * Windows 11 Fluent design collapsible sidebar with fast conversation search,
 * pinning, renaming, and persistent storage management.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  MessageSquare,
  Key,
  X,
  Zap,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { useAuthStore } from '@/stores/authStore';

export function MasterAi2Sidebar() {
  const isSidebarOpen = useAiChatStore((s) => s.isSidebarOpen);
  const toggleSidebar = useAiChatStore((s) => s.toggleSidebar);
  const conversations = useAiChatStore((s) => s.conversations);
  const activeConversationId = useAiChatStore((s) => s.activeConversationId);
  const newConversation = useAiChatStore((s) => s.newConversation);
  const selectConversation = useAiChatStore((s) => s.selectConversation);
  const deleteConversation = useAiChatStore((s) => s.deleteConversation);
  const renameConversation = useAiChatStore((s) => s.renameConversation);
  const togglePinConversation = useAiChatStore((s) => s.togglePinConversation);
  const setIsVaultModalOpen = useAiChatStore((s) => s.setIsVaultModalOpen);

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const user = useAuthStore((s) => s.user);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedConvs = filtered.filter((c) => c.isPinned);
  const recentConvs = filtered.filter((c) => !c.isPinned);

  const handleStartRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <aside className="w-64 sm:w-72 h-full flex flex-col flex-shrink-0 border-r border-white/[0.06] bg-zinc-950/90 backdrop-blur-2xl select-none z-30 transition-all duration-200">
      {/* Top Header / Brand */}
      <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 p-[1px] shadow-sm">
            <div className="w-full h-full rounded-[7px] bg-zinc-950 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-orange-400" />
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-wide">MASTER AI</span>
            <span className="text-[10px] font-mono text-orange-400 font-bold ml-1.5 px-1 py-0.2 rounded bg-orange-500/10 border border-orange-500/20">
              2.0
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors md:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={newConversation}
          className="w-full h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-3 pb-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-8 pl-8 pr-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/40 transition-colors font-sans"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
        {/* Pinned Section */}
        {pinnedConvs.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Pin className="w-3 h-3 text-orange-400" />
              <span>Pinned</span>
            </div>
            {pinnedConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                isEditing={editingId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => selectConversation(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onStartRename={(e) => handleStartRename(e, conv.id, conv.title)}
                onSaveRename={() => handleSaveRename(conv.id)}
                onCancelRename={() => setEditingId(null)}
              />
            ))}
          </div>
        )}

        {/* Recent Conversations */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            Recent
          </div>
          {recentConvs.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-zinc-500">
              No conversations found.
            </div>
          ) : (
            recentConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                isEditing={editingId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => selectConversation(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onStartRename={(e) => handleStartRename(e, conv.id, conv.title)}
                onSaveRename={() => handleSaveRename(conv.id)}
                onCancelRename={() => setEditingId(null)}
              />
            ))
          )}
        </div>
      </div>

      {/* Sidebar Footer: User Profile & Key Vault */}
      <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 bg-white/[0.02]">
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
            {(user?.display_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <span className="font-medium text-white truncate max-w-[120px]">
            {user?.display_name || user?.email?.split('@')[0] || 'User'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsVaultModalOpen(true)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="AI Provider Vault"
        >
          <Key className="w-4 h-4 text-orange-400" />
        </button>
      </div>
    </aside>
  );
}

interface ItemProps {
  conv: any;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (s: string) => void;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
}

function ConversationItem({
  conv,
  isActive,
  isEditing,
  editTitle,
  setEditTitle,
  onSelect,
  onDelete,
  onTogglePin,
  onStartRename,
  onSaveRename,
  onCancelRename,
}: ItemProps) {
  if (isEditing) {
    return (
      <div className="p-1.5 rounded-xl bg-zinc-900 border border-orange-500/50 flex items-center gap-1">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSaveRename()}
          autoFocus
          className="w-full bg-transparent text-xs text-white px-1.5 py-0.5 focus:outline-none"
        />
        <button
          type="button"
          onClick={onSaveRename}
          className="text-orange-400 hover:text-orange-300 px-1 font-bold text-xs"
        >
          ✓
        </button>
        <button
          type="button"
          onClick={onCancelRename}
          className="text-zinc-500 hover:text-zinc-300 px-1 text-xs"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`group w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
        isActive
          ? 'bg-orange-500/15 text-white font-semibold border border-orange-500/30 shadow-sm'
          : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-orange-400' : 'text-zinc-500'}`} />
        <span className="truncate">{conv.title}</span>
      </div>

      {/* Item Action Buttons on Hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/[0.1]"
          title={conv.isPinned ? 'Unpin' : 'Pin to top'}
        >
          {conv.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
        </button>
        <button
          type="button"
          onClick={onStartRename}
          className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/[0.1]"
          title="Rename"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-white/[0.1]"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
