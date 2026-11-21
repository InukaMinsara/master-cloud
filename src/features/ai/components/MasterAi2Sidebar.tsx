/**
 * src/features/ai/components/MasterAi2Sidebar.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — ENTERPRISE CONVERSATION SIDEBAR & WORKBENCH
 * Comprehensive features:
 * - "+ New Chat" with instant focus
 * - Folder Management: Create, rename, delete folders, and filter chats by folder
 * - Bulk Selection Mode: Multi-select chats for bulk delete, archive, or export
 * - Time-based grouping: Today / Yesterday / Previous 7 Days / Older / Pinned
 * - Search across titles and message bodies with instant filtering
 * - Date and Sort filter controls (Newest / Oldest)
 * - Chat Item actions: Duplicate Chat, Branch, Pin, Rename, Archive, Move to Folder, Delete
 * - Expandable Archive drawer
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
  Folder,
  FolderPlus,
  Copy,
  CheckSquare,
  Square,
  Layers,
  ArrowUpDown,
  Download,
  MoreVertical,
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
  const duplicateConversation = useAiChatStore((s) => s.duplicateConversation);
  const archiveConversation = useAiChatStore((s) => s.archiveConversation);
  const restoreConversation = useAiChatStore((s) => s.restoreConversation);
  const branchConversation = useAiChatStore((s) => s.branchConversation);

  // Folder state
  const folders = useAiChatStore((s) => s.folders);
  const activeFolderId = useAiChatStore((s) => s.activeFolderId);
  const createFolder = useAiChatStore((s) => s.createFolder);
  const deleteFolder = useAiChatStore((s) => s.deleteFolder);
  const setActiveFolderId = useAiChatStore((s) => s.setActiveFolderId);
  const setConversationFolder = useAiChatStore((s) => s.setConversationFolder);

  // Bulk actions state
  const isBulkMode = useAiChatStore((s) => s.isBulkMode);
  const selectedConversationIds = useAiChatStore((s) => s.selectedConversationIds);
  const toggleBulkMode = useAiChatStore((s) => s.toggleBulkMode);
  const toggleSelectConversation = useAiChatStore((s) => s.toggleSelectConversation);
  const selectAllConversations = useAiChatStore((s) => s.selectAllConversations);
  const clearSelectedConversations = useAiChatStore((s) => s.clearSelectedConversations);
  const bulkDeleteConversations = useAiChatStore((s) => s.bulkDeleteConversations);
  const bulkArchiveConversations = useAiChatStore((s) => s.bulkArchiveConversations);
  const bulkExportConversations = useAiChatStore((s) => s.bulkExportConversations);

  // Sort and filter state
  const selectedSortOrder = useAiChatStore((s) => s.selectedSortOrder);
  const setSelectedSortOrder = useAiChatStore((s) => s.setSelectedSortOrder);

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const user = useAuthStore((s) => s.user);

  // Filter conversations by search and folder
  const filteredConvs = useMemo(() => {
    let list = [...conversations];

    // Filter by active folder
    if (activeFolderId) {
      list = list.filter((c) => c.folderId === activeFolderId);
    }

    // Filter by search query (title or message body)
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((c) => {
        const titleMatch = c.title.toLowerCase().includes(q);
        const messageMatch = c.messages.some((m) => m.content && m.content.toLowerCase().includes(q));
        return titleMatch || messageMatch;
      });
    }

    // Sort order
    list.sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.createdAt || 0;
      return selectedSortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [conversations, activeFolderId, search, selectedSortOrder]);

  // Group conversations
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

  const handleSelect = (id: string) => {
    if (isBulkMode) {
      toggleSelectConversation(id);
      return;
    }
    selectConversation(id);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      toggleSidebar();
    }
  };

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

  const handleDuplicate = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    const newId = duplicateConversation(convId);
    toast.success('Duplicated conversation!');
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
    toast.success('Folder created.');
  };

  if (!isSidebarOpen) return null;

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
              CHAT ONLY
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

      {/* Action Row: New Chat & Bulk Mode Toggle */}
      <div className="p-3 flex items-center gap-2">
        <button
          type="button"
          onClick={newConversation}
          className="flex-1 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        <button
          type="button"
          onClick={toggleBulkMode}
          className={`h-9 px-2.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer flex items-center justify-center ${
            isBulkMode
              ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
              : 'bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title={isBulkMode ? 'Exit Bulk Actions Mode' : 'Enter Multi-Select Bulk Mode'}
        >
          <CheckSquare className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input & Sort Order Toggle */}
      <div className="px-3 pb-2 space-y-2">
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

        {/* Filter bar: Sort toggle */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
          <span>Sort by:</span>
          <button
            type="button"
            onClick={() =>
              setSelectedSortOrder(selectedSortOrder === 'newest' ? 'oldest' : 'newest')
            }
            className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3 h-3 text-orange-400" />
            <span className="capitalize">{selectedSortOrder}</span>
          </button>
        </div>
      </div>

      {/* Folders Accordion */}
      <div className="px-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pb-1">
          <button
            type="button"
            onClick={() => setIsFoldersOpen(!isFoldersOpen)}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            {isFoldersOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Folders ({folders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
            title="Create Folder"
          >
            <FolderPlus className="w-3 h-3 text-amber-400" />
          </button>
        </div>

        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="mt-1 flex items-center gap-1">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="flex-1 h-7 px-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <button
              type="submit"
              className="h-7 px-2 rounded-lg bg-amber-500 text-black font-bold text-xs"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {isFoldersOpen && (
          <div className="mt-1 space-y-0.5">
            <button
              type="button"
              onClick={() => setActiveFolderId(null)}
              className={`w-full text-left px-2 py-1 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                activeFolderId === null
                  ? 'bg-white/[0.08] text-white font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span>All Chats</span>
              <span className="text-[10px] font-mono text-zinc-500">{conversations.length}</span>
            </button>
            {folders.map((f) => {
              const count = conversations.filter((c) => c.folderId === f.id).length;
              return (
                <div
                  key={f.id}
                  onClick={() => setActiveFolderId(f.id)}
                  className={`group w-full text-left px-2 py-1 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    activeFolderId === f.id
                      ? 'bg-amber-500/15 text-amber-300 font-medium'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="truncate">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-zinc-500">{count}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFolder(f.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                folders={folders}
                isActive={conv.id === activeConversationId}
                isBulkMode={isBulkMode}
                isSelected={selectedConversationIds.includes(conv.id)}
                isEditing={editingId === conv.id}
                isConfirmingDelete={confirmDeleteId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => handleSelect(conv.id)}
                onToggleSelect={() => toggleSelectConversation(conv.id)}
                onPromptDelete={(e) => handlePromptDelete(e, conv.id)}
                onExecuteDelete={() => handleExecuteDelete(conv.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onDuplicate={(e) => handleDuplicate(e, conv.id)}
                onArchive={(e) => handleArchive(e, conv.id)}
                onBranch={(e) => handleBranch(e, conv.id)}
                onMoveToFolder={(folderId) => setConversationFolder(conv.id, folderId)}
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
                folders={folders}
                isActive={conv.id === activeConversationId}
                isBulkMode={isBulkMode}
                isSelected={selectedConversationIds.includes(conv.id)}
                isEditing={editingId === conv.id}
                isConfirmingDelete={confirmDeleteId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => handleSelect(conv.id)}
                onToggleSelect={() => toggleSelectConversation(conv.id)}
                onPromptDelete={(e) => handlePromptDelete(e, conv.id)}
                onExecuteDelete={() => handleExecuteDelete(conv.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onDuplicate={(e) => handleDuplicate(e, conv.id)}
                onArchive={(e) => handleArchive(e, conv.id)}
                onBranch={(e) => handleBranch(e, conv.id)}
                onMoveToFolder={(folderId) => setConversationFolder(conv.id, folderId)}
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
                folders={folders}
                isActive={conv.id === activeConversationId}
                isBulkMode={isBulkMode}
                isSelected={selectedConversationIds.includes(conv.id)}
                isEditing={editingId === conv.id}
                isConfirmingDelete={confirmDeleteId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => handleSelect(conv.id)}
                onToggleSelect={() => toggleSelectConversation(conv.id)}
                onPromptDelete={(e) => handlePromptDelete(e, conv.id)}
                onExecuteDelete={() => handleExecuteDelete(conv.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onDuplicate={(e) => handleDuplicate(e, conv.id)}
                onArchive={(e) => handleArchive(e, conv.id)}
                onBranch={(e) => handleBranch(e, conv.id)}
                onMoveToFolder={(folderId) => setConversationFolder(conv.id, folderId)}
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
                folders={folders}
                isActive={conv.id === activeConversationId}
                isBulkMode={isBulkMode}
                isSelected={selectedConversationIds.includes(conv.id)}
                isEditing={editingId === conv.id}
                isConfirmingDelete={confirmDeleteId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => handleSelect(conv.id)}
                onToggleSelect={() => toggleSelectConversation(conv.id)}
                onPromptDelete={(e) => handlePromptDelete(e, conv.id)}
                onExecuteDelete={() => handleExecuteDelete(conv.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onDuplicate={(e) => handleDuplicate(e, conv.id)}
                onArchive={(e) => handleArchive(e, conv.id)}
                onBranch={(e) => handleBranch(e, conv.id)}
                onMoveToFolder={(folderId) => setConversationFolder(conv.id, folderId)}
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
                folders={folders}
                isActive={conv.id === activeConversationId}
                isBulkMode={isBulkMode}
                isSelected={selectedConversationIds.includes(conv.id)}
                isEditing={editingId === conv.id}
                isConfirmingDelete={confirmDeleteId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => handleSelect(conv.id)}
                onToggleSelect={() => toggleSelectConversation(conv.id)}
                onPromptDelete={(e) => handlePromptDelete(e, conv.id)}
                onExecuteDelete={() => handleExecuteDelete(conv.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onTogglePin={() => togglePinConversation(conv.id)}
                onDuplicate={(e) => handleDuplicate(e, conv.id)}
                onArchive={(e) => handleArchive(e, conv.id)}
                onBranch={(e) => handleBranch(e, conv.id)}
                onMoveToFolder={(folderId) => setConversationFolder(conv.id, folderId)}
                onStartRename={(e) => handleStartRename(e, conv.id, conv.title)}
                onSaveRename={() => handleSaveRename(conv.id)}
                onCancelRename={() => setEditingId(null)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
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
                    onClick={() => handleSelect(conv.id)}
                    className="group w-full px-2 py-1.5 rounded-lg text-xs flex items-center justify-between text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] cursor-pointer"
                  >
                    <span className="truncate max-w-[150px]">{conv.title}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleRestore(e, conv.id)}
                        className="p-1 rounded text-zinc-400 hover:text-emerald-400 hover:bg-white/[0.1] cursor-pointer"
                        title="Restore chat to active history"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      </button>
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

      {/* Floating Bulk Actions Bar (when bulk mode is active) */}
      {isBulkMode && (
        <div className="p-2.5 bg-orange-950/40 border-t border-orange-500/30 flex items-center justify-between text-xs">
          <span className="font-mono text-orange-300">
            {selectedConversationIds.length} selected
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={selectAllConversations}
              className="px-2 py-1 rounded bg-white/[0.08] text-zinc-200 hover:text-white text-[10px]"
            >
              All
            </button>
            <button
              type="button"
              onClick={bulkArchiveConversations}
              disabled={selectedConversationIds.length === 0}
              className="p-1 rounded hover:bg-amber-500/20 text-amber-300 disabled:opacity-40"
              title="Archive selected"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => bulkExportConversations('markdown')}
              disabled={selectedConversationIds.length === 0}
              className="p-1 rounded hover:bg-cyan-500/20 text-cyan-300 disabled:opacity-40"
              title="Export selected as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={bulkDeleteConversations}
              disabled={selectedConversationIds.length === 0}
              className="p-1 rounded hover:bg-red-500/20 text-red-400 disabled:opacity-40"
              title="Delete selected"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleBulkMode}
              className="p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
  folders: any[];
  isActive: boolean;
  isBulkMode: boolean;
  isSelected: boolean;
  isEditing: boolean;
  isConfirmingDelete: boolean;
  editTitle: string;
  setEditTitle: (s: string) => void;
  onSelect: () => void;
  onToggleSelect: () => void;
  onPromptDelete: (e: React.MouseEvent) => void;
  onExecuteDelete: () => void;
  onCancelDelete: () => void;
  onTogglePin: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void;
  onBranch: (e: React.MouseEvent) => void;
  onMoveToFolder: (folderId: string | null) => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
}

function ConversationItem({
  conv,
  folders,
  isActive,
  isBulkMode,
  isSelected,
  isEditing,
  isConfirmingDelete,
  editTitle,
  setEditTitle,
  onSelect,
  onToggleSelect,
  onPromptDelete,
  onExecuteDelete,
  onCancelDelete,
  onTogglePin,
  onDuplicate,
  onArchive,
  onBranch,
  onMoveToFolder,
  onStartRename,
  onSaveRename,
  onCancelRename,
}: ItemProps) {
  const [showFolderMenu, setShowFolderMenu] = useState(false);

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
        isSelected
          ? 'bg-orange-500/25 border border-orange-500/40 text-white font-semibold'
          : isActive
            ? 'bg-orange-500/15 text-white font-semibold border border-orange-500/30 shadow-sm'
            : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        {isBulkMode ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className="text-orange-400 cursor-pointer"
          >
            {isSelected ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5 text-zinc-600" />
            )}
          </button>
        ) : (
          <MessageSquare
            className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-orange-400' : 'text-zinc-500'}`}
          />
        )}
        <span className="truncate">{conv.title}</span>
      </div>

      {/* Action Controls on Hover */}
      {!isBulkMode && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Duplicate Chat (#64) */}
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 rounded text-zinc-500 hover:text-emerald-400 hover:bg-white/[0.1] cursor-pointer"
            title="Duplicate chat"
          >
            <Copy className="w-3 h-3" />
          </button>

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

          {/* Move to Folder */}
          {folders.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFolderMenu(!showFolderMenu);
                }}
                className="p-1 rounded text-zinc-500 hover:text-amber-400 hover:bg-white/[0.1] cursor-pointer"
                title="Move to Folder"
              >
                <Folder className="w-3 h-3" />
              </button>

              {showFolderMenu && (
                <div
                  className="absolute right-0 bottom-full mb-1 w-36 rounded-xl bg-zinc-950 border border-white/10 shadow-2xl p-1 z-50 space-y-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onMoveToFolder(null);
                      setShowFolderMenu(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                  >
                    No Folder
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        onMoveToFolder(f.id);
                        setShowFolderMenu(false);
                      }}
                      className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-200 hover:text-white hover:bg-white/[0.08] truncate"
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
      )}
    </div>
  );
}
