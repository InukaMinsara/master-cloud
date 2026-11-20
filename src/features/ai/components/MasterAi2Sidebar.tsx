/**
 * src/features/ai/components/MasterAi2Sidebar.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — CHATGPT-STYLE PERSISTENT CHAT HISTORY SIDEBAR
 * Full feature set:
 * - "+ New Chat" action
 * - Live search across conversation titles and message bodies
 * - Time-based grouping: Today / Yesterday / Previous 7 Days / Older
 * - Pinned conversations section
 * - 1-click Pin & Unpin toggles
 * - Inline Rename with keyboard shortcuts (Enter to save, Esc to cancel)
 * - Archive and Restore workflow with dedicated expandable archive drawer
 * - Delete with confirmation to prevent accidental loss
 * - Synchronized with Master Cloud backend persistence
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  MessageSquare,
  X,
  Zap,
  GitBranch,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { useAuthStore } from '@/stores/authStore';
import { AiConversation } from '../types/aiTypes';
import { toast } from 'sonner';

interface GroupedConversations {
  pinned: AiConversation[];
  today: AiConversation[];
  yesterday: AiConversation[];
  previous7Days: AiConversation[];
  older: AiConversation[];
  archived: AiConversation[];
}

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
  const archiveConversation = useAiChatStore((s) => s.archiveConversation);
  const restoreConversation = useAiChatStore((s) => s.restoreConversation);
  const branchConversation = useAiChatStore((s) => s.branchConversation);

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const user = useAuthStore((s) => s.user);

  // Filter conversations by search query (matching title or any message content)
  const filteredConvs = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const titleMatch = c.title.toLowerCase().includes(q);
      const messageMatch = c.messages.some((m) => m.content && m.content.toLowerCase().includes(q));
      return titleMatch || messageMatch;
    });
  }, [conversations, search]);

  // Group conversations into Today, Yesterday, Previous 7 Days, Older, Pinned, and Archived
  const grouped = useMemo((): GroupedConversations => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7DaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;

    const res: GroupedConversations = {
      pinned: [],
      today: [],
      yesterday: [],
      previous7Days: [],
      older: [],
      archived: [],
    };

    for (const conv of filteredConvs) {
      if (conv.isArchived) {
        res.archived.push(conv);
        continue;
      }

      if (conv.isPinned) {
        res.pinned.push(conv);
        continue;
      }

      const timestamp = conv.updatedAt || conv.createdAt || Date.now();
      if (timestamp >= startOfToday) {
        res.today.push(conv);
      } else if (timestamp >= startOfYesterday) {
        res.yesterday.push(conv);
      } else if (timestamp >= startOf7DaysAgo) {
        res.previous7Days.push(conv);
      } else {
        res.older.push(conv);
      }
    }

    return res;
  }, [filteredConvs]);

  const handleStartRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
      toast.success('Chat renamed successfully.');
    }
    setEditingId(null);
  };

  const handlePromptDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEditingId(null);
    setConfirmDeleteId(id);
  };

  const handleExecuteDelete = (id: string) => {
    deleteConversation(id);
    setConfirmDeleteId(null);
    toast.success('Conversation deleted.');
  };

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    archiveConversation(id);
    toast.success('Chat moved to archive.');
  };

  const handleRestore = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    restoreConversation(id);
    toast.success('Chat restored to active history.');
  };

  const handleBranch = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    const conv = conversations.find((c) => c.id === convId);
    if (!conv || conv.messages.length === 0) {
      toast.info('Cannot branch an empty conversation.');
      return;
    }
    const lastMsgId = conv.messages[conv.messages.length - 1].id;
    branchConversation(lastMsgId);
    toast.success(`Branched from "${conv.title}"!`);
  };

  if (!isSidebarOpen) {
    return null;
  }

  const hasAnyTimelineConversations =
    grouped.pinned.length > 0 ||
    grouped.today.length > 0 ||
    grouped.yesterday.length > 0 ||
    grouped.previous7Days.length > 0 ||
    grouped.older.length > 0;

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
          className="w-full h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pb-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-8 pl-8 pr-7 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/40 transition-colors font-sans"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
        {/* 1. PINNED CONVERSATIONS */}
        {grouped.pinned.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Pin className="w-3 h-3 text-orange-400" />
              <span>Pinned</span>
            </div>
            {grouped.pinned.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                isEditing={editingId === conv.id}
                isConfirmingDelete={confirmDeleteId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => selectConversation(conv.id)}
                onPromptDelete={(e) => handlePromptDelete(e, conv.id)}
                onExecuteDelete={() => handleExecuteDelete(conv.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onArchive={(e) => handleArchive(e, conv.id)}
                onBranch={(e) => handleBranch(e, conv.id)}
                onStartRename={(e) => handleStartRename(e, conv.id, conv.title)}
                onSaveRename={() => handleSaveRename(conv.id)}
                onCancelRename={() => setEditingId(null)}
              />
            ))}
          </div>
        )}

        {/* 2. TODAY */}
        {grouped.today.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Today
            </div>
            {grouped.today.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                isEditing={editingId === conv.id}
                isConfirmingDelete={confirmDeleteId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => selectConversation(conv.id)}
                onPromptDelete={(e) => handlePromptDelete(e, conv.id)}
                onExecuteDelete={() => handleExecuteDelete(conv.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onArchive={(e) => handleArchive(e, conv.id)}
                onBranch={(e) => handleBranch(e, conv.id)}
                onStartRename={(e) => handleStartRename(e, conv.id, conv.title)}
                onSaveRename={() => handleSaveRename(conv.id)}
                onCancelRename={() => setEditingId(null)}
              />
            ))}
          </div>
        )}

        {/* 3. YESTERDAY */}
        {grouped.yesterday.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Yesterday
            </div>
            {grouped.yesterday.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                isEditing={editingId === conv.id}
                isConfirmingDelete={confirmDeleteId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => selectConversation(conv.id)}
                onPromptDelete={(e) => handlePromptDelete(e, conv.id)}
                onExecuteDelete={() => handleExecuteDelete(conv.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onArchive={(e) => handleArchive(e, conv.id)}
                onBranch={(e) => handleBranch(e, conv.id)}
                onStartRename={(e) => handleStartRename(e, conv.id, conv.title)}
                onSaveRename={() => handleSaveRename(conv.id)}
                onCancelRename={() => setEditingId(null)}
              />
            ))}
          </div>
        )}

        {/* 4. PREVIOUS 7 DAYS */}
        {grouped.previous7Days.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Previous 7 Days
            </div>
            {grouped.previous7Days.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                isEditing={editingId === conv.id}
                isConfirmingDelete={confirmDeleteId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => selectConversation(conv.id)}
                onPromptDelete={(e) => handlePromptDelete(e, conv.id)}
                onExecuteDelete={() => handleExecuteDelete(conv.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onArchive={(e) => handleArchive(e, conv.id)}
                onBranch={(e) => handleBranch(e, conv.id)}
                onStartRename={(e) => handleStartRename(e, conv.id, conv.title)}
                onSaveRename={() => handleSaveRename(conv.id)}
                onCancelRename={() => setEditingId(null)}
              />
            ))}
          </div>
        )}

        {/* 5. OLDER */}
        {grouped.older.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Older
            </div>
            {grouped.older.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                isEditing={editingId === conv.id}
                isConfirmingDelete={confirmDeleteId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => selectConversation(conv.id)}
                onPromptDelete={(e) => handlePromptDelete(e, conv.id)}
                onExecuteDelete={() => handleExecuteDelete(conv.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onArchive={(e) => handleArchive(e, conv.id)}
                onBranch={(e) => handleBranch(e, conv.id)}
                onStartRename={(e) => handleStartRename(e, conv.id, conv.title)}
                onSaveRename={() => handleSaveRename(conv.id)}
                onCancelRename={() => setEditingId(null)}
              />
            ))}
          </div>
        )}

        {/* Empty state for search or timeline */}
        {!hasAnyTimelineConversations && (
          <div className="px-3 py-8 text-center text-xs text-zinc-500 font-sans">
            {search ? (
              <div className="space-y-2">
                <p>No chats matching &ldquo;{search}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-orange-400 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <p>No conversations found. Click &ldquo;New Chat&rdquo; to begin.</p>
            )}
          </div>
        )}

        {/* 6. ARCHIVED CHATS ACCORDION */}
        {grouped.archived.length > 0 && (
          <div className="pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsArchiveOpen(!isArchiveOpen)}
              className="w-full px-2 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] text-[11px] font-mono flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-zinc-400" />
                <span>Archived Chats ({grouped.archived.length})</span>
              </div>
              {isArchiveOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            {isArchiveOpen && (
              <div className="mt-1 space-y-1 pl-1 animate-in fade-in duration-150">
                {grouped.archived.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className="group w-full px-2 py-1.5 rounded-lg text-xs flex items-center justify-between text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] cursor-pointer"
                  >
                    <span className="truncate max-w-[150px]">{conv.title}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Restore */}
                      <button
                        type="button"
                        onClick={(e) => handleRestore(e, conv.id)}
                        className="p-1 rounded text-zinc-400 hover:text-emerald-400 hover:bg-white/[0.1] cursor-pointer"
                        title="Restore chat to active history"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => handlePromptDelete(e, conv.id)}
                        className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-white/[0.1] cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Footer: User Profile & Cloud Sync Indicator */}
      <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 bg-white/[0.02]">
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
            {(user?.display_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <span className="font-medium text-white truncate max-w-[120px]">
            {user?.display_name || user?.email?.split('@')[0] || 'Master Cloud User'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <Check className="w-3 h-3" />
          <span>Synced</span>
        </div>
      </div>
    </aside>
  );
}

interface ItemProps {
  conv: AiConversation;
  isActive: boolean;
  isEditing: boolean;
  isConfirmingDelete: boolean;
  editTitle: string;
  setEditTitle: (s: string) => void;
  onSelect: () => void;
  onPromptDelete: (e: React.MouseEvent) => void;
  onExecuteDelete: () => void;
  onCancelDelete: () => void;
  onTogglePin: () => void;
  onArchive: (e: React.MouseEvent) => void;
  onBranch: (e: React.MouseEvent) => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
}

function ConversationItem({
  conv,
  isActive,
  isEditing,
  isConfirmingDelete,
  editTitle,
  setEditTitle,
  onSelect,
  onPromptDelete,
  onExecuteDelete,
  onCancelDelete,
  onTogglePin,
  onArchive,
  onBranch,
  onStartRename,
  onSaveRename,
  onCancelRename,
}: ItemProps) {
  // Inline Rename Mode
  if (isEditing) {
    return (
      <div className="p-1.5 rounded-xl bg-zinc-900 border border-orange-500/50 flex items-center gap-1 animate-in fade-in">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveRename();
            if (e.key === 'Escape') onCancelRename();
          }}
          autoFocus
          className="w-full bg-transparent text-xs text-white px-1.5 py-0.5 focus:outline-none font-sans"
        />
        <button
          type="button"
          onClick={onSaveRename}
          className="text-orange-400 hover:text-orange-300 p-1 font-bold text-xs cursor-pointer"
          title="Save title (Enter)"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onCancelRename}
          className="text-zinc-500 hover:text-zinc-300 p-1 text-xs cursor-pointer"
          title="Cancel (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Inline Delete Confirmation
  if (isConfirmingDelete) {
    return (
      <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/40 text-xs space-y-1.5 animate-in fade-in">
        <div className="flex items-center gap-1.5 text-red-300 font-semibold text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Delete conversation?</span>
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onCancelDelete}
            className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-[10px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onExecuteDelete}
            className="px-2 py-0.5 rounded-md bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] cursor-pointer"
          >
            Delete
          </button>
        </div>
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

      {/* Action Controls on Hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Branch */}
        <button
          type="button"
          onClick={onBranch}
          className="p-1 rounded text-zinc-500 hover:text-cyan-400 hover:bg-white/[0.1] cursor-pointer"
          title="Branch this conversation"
        >
          <GitBranch className="w-3 h-3" />
        </button>

        {/* Pin / Unpin */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/[0.1] cursor-pointer"
          title={conv.isPinned ? 'Unpin' : 'Pin to top'}
        >
          {conv.isPinned ? <PinOff className="w-3 h-3 text-orange-400" /> : <Pin className="w-3 h-3" />}
        </button>

        {/* Rename */}
        <button
          type="button"
          onClick={onStartRename}
          className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/[0.1] cursor-pointer"
          title="Rename chat"
        >
          <Edit2 className="w-3 h-3" />
        </button>

        {/* Archive */}
        <button
          type="button"
          onClick={onArchive}
          className="p-1 rounded text-zinc-500 hover:text-amber-400 hover:bg-white/[0.1] cursor-pointer"
          title="Archive chat"
        >
          <Archive className="w-3 h-3" />
        </button>

        {/* Delete with Confirmation */}
        <button
          type="button"
          onClick={onPromptDelete}
          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-white/[0.1] cursor-pointer"
          title="Delete chat"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
