/**
 * src/components/ai/MasterAiCommandPalette.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — FLUENT COMMAND PALETTE (Ctrl + K)
 * Windows 11 Fluent Design / Acrylic Quick Search & Action Hub.
 * Features:
 * - Instant keyboard navigation (Arrow keys + Enter)
 * - Switch AI Models
 * - Switch AI Studio tools & capabilities
 * - Jump between chat sessions
 * - Quick Actions (New Chat, Toggle 8K Mode, Web Search, Export, Clear)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Shirt,
  Code2,
  FolderOpen,
  Globe,
  Share2,
  Trash2,
  Plus,
  ArrowRight,
  BrainCircuit,
  Cpu,
  Layers,
  X,
} from 'lucide-react';
import { AIChatSession } from '@/services/aiService';
import { MASTER_AI_MODELS } from './MasterAiHeader';
import { MasterAiToolMode } from './MasterAiSidebar';

interface MasterAiCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: AIChatSession[];
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onSelectModel: (modelId: string) => void;
  onSelectToolMode: (mode: MasterAiToolMode) => void;
  autoGptEnhance: boolean;
  onToggleAutoGptEnhance: () => void;
  isWebSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onExportMarkdown: () => void;
  onOpenGpuModal: () => void;
  onOpenTryOn: () => void;
  onOpenFilePicker: () => void;
  onClearChat: () => void;
}

interface PaletteItem {
  id: string;
  category: 'Actions' | 'Models' | 'Studios' | 'Chats';
  title: string;
  subtitle?: string;
  shortcut?: string;
  icon: React.ElementType;
  iconColor?: string;
  onSelect: () => void;
}

export const MasterAiCommandPalette: React.FC<MasterAiCommandPaletteProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onNewChat,
  onSelectModel,
  onSelectToolMode,
  autoGptEnhance,
  onToggleAutoGptEnhance,
  isWebSearchEnabled,
  onToggleWebSearch,
  onExportMarkdown,
  onOpenGpuModal,
  onOpenTryOn,
  onOpenFilePicker,
  onClearChat,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Construct all searchable items
  const allItems: PaletteItem[] = [
    // Actions
    {
      id: 'action-new-chat',
      category: 'Actions',
      title: 'New Conversation',
      subtitle: 'Start a fresh conversation thread',
      shortcut: 'Ctrl+N',
      icon: Plus,
      iconColor: 'text-cyan-400 bg-cyan-500/10',
      onSelect: () => {
        onNewChat();
        onClose();
      },
    },
    {
      id: 'action-toggle-8k',
      category: 'Actions',
      title: autoGptEnhance ? 'Disable 8K Mode' : 'Enable [⚡ 8K Mode: ON]',
      subtitle: 'DALL-E 3 grade prompt auto-expansion with GPT-4o-Mini',
      icon: Zap,
      iconColor: 'text-amber-400 bg-amber-500/10',
      onSelect: () => {
        onToggleAutoGptEnhance();
        onClose();
      },
    },
    {
      id: 'action-toggle-web',
      category: 'Actions',
      title: isWebSearchEnabled ? 'Turn OFF Web Search' : 'Turn ON Web Search',
      subtitle: 'Real-time live web grounding & citations',
      icon: Globe,
      iconColor: 'text-blue-400 bg-blue-500/10',
      onSelect: () => {
        onToggleWebSearch();
        onClose();
      },
    },
    {
      id: 'action-export-md',
      category: 'Actions',
      title: 'Export Chat as Markdown',
      subtitle: 'Download formatted transcript (.md) with media',
      icon: Share2,
      iconColor: 'text-purple-400 bg-purple-500/10',
      onSelect: () => {
        onExportMarkdown();
        onClose();
      },
    },
    {
      id: 'action-dedicated-gpu',
      category: 'Actions',
      title: 'Master Dedicated GPU Backend (Option A)',
      subtitle: 'Connect private Google Colab / Server Tesla T4 GPU',
      icon: Cpu,
      iconColor: 'text-emerald-400 bg-emerald-500/10',
      onSelect: () => {
        onOpenGpuModal();
        onClose();
      },
    },
    {
      id: 'action-clear-chat',
      category: 'Actions',
      title: 'Clear Current Conversation',
      subtitle: 'Wipe messages in current session',
      icon: Trash2,
      iconColor: 'text-rose-400 bg-rose-500/10',
      onSelect: () => {
        onClearChat();
        onClose();
      },
    },

    // Models
    ...MASTER_AI_MODELS.map((model) => ({
      id: `model-${model.id}`,
      category: 'Models' as const,
      title: `Switch Model: ${model.name}`,
      subtitle: `${model.tag} · ${model.speed} · ${model.description}`,
      icon: Sparkles,
      iconColor: 'text-cyan-400 bg-cyan-500/10',
      onSelect: () => {
        onSelectModel(model.id);
        onClose();
      },
    })),

    // Studios
    {
      id: 'studio-image',
      category: 'Studios',
      title: '4K Photorealistic Art Studio',
      subtitle: 'Raw 4K image generation with zero watermarks',
      icon: ImageIcon,
      iconColor: 'text-pink-400 bg-pink-500/10',
      onSelect: () => {
        onSelectToolMode('image');
        onClose();
      },
    },
    {
      id: 'studio-tryon',
      category: 'Studios',
      title: 'Virtual Fashion Try-On Studio',
      subtitle: '100% Headless IDM-VTON clothing composite',
      icon: Shirt,
      iconColor: 'text-indigo-400 bg-indigo-500/10',
      onSelect: () => {
        onOpenTryOn();
        onClose();
      },
    },
    {
      id: 'studio-code',
      category: 'Studios',
      title: 'Full-Stack Code Architect',
      subtitle: 'Code generation, debugging, and UI design',
      icon: Code2,
      iconColor: 'text-cyan-400 bg-cyan-500/10',
      onSelect: () => {
        onSelectToolMode('code');
        onClose();
      },
    },
    {
      id: 'studio-file',
      category: 'Studios',
      title: 'Drive Document Intelligence',
      subtitle: 'Attach and analyze PC or Master Cloud Drive files',
      icon: FolderOpen,
      iconColor: 'text-amber-400 bg-amber-500/10',
      onSelect: () => {
        onOpenFilePicker();
        onClose();
      },
    },

    // Chats
    ...sessions.map((s) => ({
      id: `chat-${s.id}`,
      category: 'Chats' as const,
      title: s.title,
      subtitle: `${s.messages.length} messages · ${new Date(s.updatedAt).toLocaleDateString()}`,
      icon: BrainCircuit,
      iconColor: 'text-zinc-400 bg-white/[0.04]',
      onSelect: () => {
        onSelectSession(s.id);
        onClose();
      },
    })),
  ];

  // Filter items based on query
  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems.slice(0, 14);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) current.onSelect();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-[12vh] p-4 select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-zinc-950/95 border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Subtle Ambient Top Rim Glow */}
        <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
          <Search className="h-4 w-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, model, studio, or search conversation history..."
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-foreground placeholder:text-zinc-500 font-medium"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-zinc-500 hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground font-mono">
              No directives or chats found matching "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group px-3 py-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent border border-cyan-500/30 text-white'
                      : 'hover:bg-white/[0.04] text-zinc-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                        item.iconColor || 'text-cyan-400 bg-cyan-500/10'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs truncate text-foreground">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/[0.05] text-zinc-400">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <kbd className="hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      className={`h-3.5 w-3.5 transition-transform ${
                        isSelected
                          ? 'text-cyan-400 translate-x-0.5'
                          : 'text-zinc-600 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-cyan-400">Master AI Universal Palette</span>
        </div>
      </div>
    </div>
  );
};
