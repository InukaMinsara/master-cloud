import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  MessageSquare,
  ImageIcon,
  Shirt,
  Code2,
  Folder,
  Trash2,
  Pin,
  Edit2,
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
  HardDrive,
  Settings,
  User,
  Zap,
} from 'lucide-react';
import { AIChatSession } from '@/services/aiService';

export type MasterAiToolMode = 'chat' | 'image' | 'tryon' | 'code' | 'file';

interface MasterAiSidebarProps {
  sessions: AIChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeToolMode: MasterAiToolMode;
  onSelectToolMode: (mode: MasterAiToolMode) => void;
  isDedicatedGpuOnline: boolean;
  dedicatedGpuName?: string;
  onOpenGpuModal: () => void;
  userName?: string;
}

export const MasterAiSidebar: React.FC<MasterAiSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  isCollapsed,
  onToggleCollapse,
  activeToolMode,
  onSelectToolMode,
  isDedicatedGpuOnline,
  dedicatedGpuName,
  onOpenGpuModal,
  userName = 'Inuka Minsara',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Filter sessions by search query
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const recentSessions = filteredSessions.filter((s) => !s.isPinned);

  const startEditing = (s: AIChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(s.id);
    setEditingTitle(s.title);
  };

  const saveEditing = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  if (isCollapsed) {
    return (
      <aside className="w-16 h-full border-r border-border/70 bg-card/40 backdrop-blur-2xl flex flex-col items-center py-4 justify-between shrink-0 select-none z-20">
        {/* Top Branding & Expand */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 hover:scale-105 transition-all cursor-pointer"
            title="Expand Master AI Sidebar"
          >
            <Sparkles className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onNewChat}
            className="h-10 w-10 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 flex items-center justify-center transition-all cursor-pointer"
            title="New Conversation (Ctrl+N)"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Studio Tool Icons */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectToolMode('chat')}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeToolMode === 'chat'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title="Chat & Reasoning"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectToolMode('image')}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeToolMode === 'image'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title="4K Image Studio"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectToolMode('tryon')}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeToolMode === 'tryon'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title="Virtual Try-On Studio"
          >
            <Shirt className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectToolMode('code')}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeToolMode === 'code'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title="Code Studio & Runner"
          >
            <Code2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectToolMode('file')}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeToolMode === 'file'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title="Drive File Intelligence"
          >
            <Folder className="h-4 w-4" />
          </button>
        </div>

        {/* Bottom Status & Profile */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onOpenGpuModal}
            className={`h-3 w-3 rounded-full transition-all cursor-pointer ${
              isDedicatedGpuOnline
                ? 'bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse'
                : 'bg-purple-400 ring-2 ring-purple-400/20'
            }`}
            title={
              isDedicatedGpuOnline
                ? `Dedicated GPU: ${dedicatedGpuName || 'Online'}`
                : 'Master Cloud vGPU Active (Click to connect Option A Dedicated Server)'
            }
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 h-full border-r border-border/70 bg-card/45 backdrop-blur-2xl flex flex-col justify-between shrink-0 select-none z-20 transition-all duration-300">
      {/* ─── TOP SECTION: BRAND & NEW CHAT ─── */}
      <div className="p-4 border-b border-border/60 space-y-3.5">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-foreground font-mono">
                  MASTER AI
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  CORE
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                Windows 11 Fluent Workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          type="button"
          onClick={onNewChat}
          className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Conversation</span>
          </div>
          <span className="text-[10px] font-mono opacity-80 bg-white/20 px-1.5 py-0.5 rounded-md">
            Ctrl+N
          </span>
        </button>

        {/* Search Conversations Input */}
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-muted/60 border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-sans"
          />
        </div>
      </div>

      {/* ─── STUDIO CAPABILITY SWITCHER ─── */}
      <div className="px-3 py-2 border-b border-border/60">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1.5 font-mono">
          AI Capabilities
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onSelectToolMode('chat')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeToolMode === 'chat'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
            <span>Chat</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectToolMode('image')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeToolMode === 'image'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-pink-400" />
            <span>4K Art</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectToolMode('tryon')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeToolMode === 'tryon'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Shirt className="h-3.5 w-3.5 text-indigo-400" />
            <span>Try-On</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectToolMode('code')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeToolMode === 'code'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Code</span>
          </button>
        </div>
      </div>

      {/* ─── CONVERSATION HISTORY LIST ─── */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Pinned Chats */}
        {pinnedSessions.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 px-2 text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">
              <Pin className="h-3 w-3" />
              <span>Pinned ({pinnedSessions.length})</span>
            </div>
            {pinnedSessions.map((session) => (
              <ConversationItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                isEditing={editingSessionId === session.id}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                onSelect={() => onSelectSession(session.id)}
                onStartEditing={(e) => startEditing(session, e)}
                onSaveEditing={(e) => saveEditing(session.id, e)}
                onCancelEditing={cancelEditing}
                onTogglePin={(e) => {
                  e.stopPropagation();
                  onTogglePinSession(session.id);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
              />
            ))}
          </div>
        )}

        {/* Recent Chats */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
            Recent Conversations ({recentSessions.length})
          </div>

          {recentSessions.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              {searchQuery ? 'No matching conversations' : 'No recent chats yet. Start one!'}
            </div>
          )}

          {recentSessions.map((session) => (
            <ConversationItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              isEditing={editingSessionId === session.id}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              onSelect={() => onSelectSession(session.id)}
              onStartEditing={(e) => startEditing(session, e)}
              onSaveEditing={(e) => saveEditing(session.id, e)}
              onCancelEditing={cancelEditing}
              onTogglePin={(e) => {
                e.stopPropagation();
                onTogglePinSession(session.id);
              }}
              onDelete={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
            />
          ))}
        </div>
      </div>

      {/* ─── BOTTOM CONTROLS & TELEMETRY ─── */}
      <div className="p-3 border-t border-border/70 bg-card/60 backdrop-blur-md space-y-2.5">
        {/* Dedicated GPU / Supercomputer Badge */}
        <button
          type="button"
          onClick={onOpenGpuModal}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-xs transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <div>
              <span className="font-bold text-foreground block text-[11px]">
                {isDedicatedGpuOnline ? dedicatedGpuName || 'Dedicated GPU' : 'Master Quantum vGPU'}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">
                {isDedicatedGpuOnline ? 'Private Colab Engine · Option A' : '4,096 GB Unified Tensor Fabric'}
              </span>
            </div>
          </div>
          <span
            className={`h-2 w-2 rounded-full ${
              isDedicatedGpuOnline ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'
            }`}
          />
        </button>

        {/* User Profile Mini Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-foreground truncate block">
                {userName}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono truncate block">
                10 TB Vault Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono font-bold border border-emerald-500/30">
              PRO
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

interface ConversationItemProps {
  session: AIChatSession;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  setEditingTitle: (val: string) => void;
  onSelect: () => void;
  onStartEditing: (e: React.MouseEvent) => void;
  onSaveEditing: (e: React.MouseEvent | React.FormEvent) => void;
  onCancelEditing: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  session,
  isActive,
  isEditing,
  editingTitle,
  setEditingTitle,
  onSelect,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  onTogglePin,
  onDelete,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
        isActive
          ? 'bg-purple-600/20 text-purple-200 border border-purple-500/35 shadow-sm'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MessageSquare
          className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-muted-foreground'}`}
        />
        {isEditing ? (
          <form
            onSubmit={onSaveEditing}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 flex-1 min-w-0"
          >
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              autoFocus
              className="w-full bg-background/80 px-2 py-0.5 rounded-lg border border-purple-500 text-xs text-foreground focus:outline-none"
            />
            <button
              type="submit"
              className="p-1 hover:text-emerald-400"
              title="Save"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onCancelEditing}
              className="p-1 hover:text-rose-400"
              title="Cancel"
            >
              <X className="h-3 w-3" />
            </button>
          </form>
        ) : (
          <span className="truncate flex-1 font-medium">{session.title}</span>
        )}
      </div>

      {/* Action Buttons (Visible on hover or active) */}
      {!isEditing && (
        <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-1">
          <button
            type="button"
            onClick={onTogglePin}
            className={`p-1 rounded-md hover:bg-card/80 transition-colors ${
              session.isPinned ? 'text-amber-400' : 'text-muted-foreground hover:text-foreground'
            }`}
            title={session.isPinned ? 'Unpin Chat' : 'Pin Chat'}
          >
            <Pin className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onStartEditing}
            className="p-1 rounded-md hover:bg-card/80 text-muted-foreground hover:text-foreground transition-colors"
            title="Rename Chat"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors"
            title="Delete Chat"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};
