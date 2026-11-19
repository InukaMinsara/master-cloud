/**
 * src/components/ai/MasterAiHeader.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — FLUENT DESIGN TOP HEADER
 * Windows 11 Fluent Design / Mica / Acrylic glassmorphism aesthetic.
 * Features:
 * - Dynamic Active Chat Title with inline rename
 * - Model selector dropdown (Quantum vGPU, Groq DeepSeek, FLUX.1 Ultra, etc.)
 * - Dedicated GPU (Option A Colab) Status Pill & Launcher
 * - Real-Time Web Grounding Toggle
 * - Export Dropdown (Markdown, Print/PDF, JSON)
 * - Clear Chat confirmation
 * - Mobile / Sidebar Toggle
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  Globe,
  Share2,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
  Zap,
  FileText,
  Download,
  Check,
  Edit2,
  X,
  Code2,
  Image as ImageIcon,
  BrainCircuit,
  Bot,
  Key,
  Server,
} from 'lucide-react';
import { g4fAiService } from '@/services/ai/g4fAiService';

export interface AiModelOption {
  id: string;
  name: string;
  tag: string;
  category: 'cascade' | 'groq' | 'image' | 'code' | 'vision' | 'g4f';
  description: string;
  speed: string;
  isFree: boolean;
}

export const MASTER_AI_MODELS: AiModelOption[] = [
  {
    id: 'quantum-cascade',
    name: 'Master Quantum vGPU',
    tag: 'Auto Cascade',
    category: 'cascade',
    description: 'Autonomous multi-engine: Local G4F → Gemini → Groq → Sovereign.',
    speed: '~140 tok/s',
    isFree: true,
  },
  {
    id: 'g4f-claude-3.5',
    name: 'Anthropic Claude 3.5 Sonnet',
    tag: 'G4F Sovereign',
    category: 'g4f',
    description: 'World-class code architecture & full-stack development via G4F.',
    speed: '~90 tok/s',
    isFree: true,
  },
  {
    id: 'g4f-gpt-4o',
    name: 'OpenAI GPT-4o',
    tag: 'G4F Sovereign',
    category: 'g4f',
    description: 'Industry-standard multimodal reasoning & general intelligence via G4F.',
    speed: '~100 tok/s',
    isFree: true,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Google Gemini 2.0 Flash',
    tag: '1M Context',
    category: 'cascade',
    description: '1,000,000 tokens context, native Sinhala fluency & high-speed reasoning.',
    speed: '~140 tok/s',
    isFree: true,
  },
  {
    id: 'deepseek-r1-groq',
    name: 'DeepSeek R1 Distill',
    tag: 'Groq LPU',
    category: 'groq',
    description: 'o1-grade reasoning chain & extreme math/logic via Groq LPU engine.',
    speed: '~480 tok/s',
    isFree: true,
  },
  {
    id: 'g4f-deepseek',
    name: 'DeepSeek R1 / V3',
    tag: 'G4F Local',
    category: 'g4f',
    description: 'Full DeepSeek reasoning chain without external keys via G4F.',
    speed: '~120 tok/s',
    isFree: true,
  },
  {
    id: 'openai-gpt-4o',
    name: 'OpenAI GPT-4o (Direct/GitHub)',
    tag: 'Multimodal',
    category: 'vision',
    description: 'Direct execution via OpenAI API or GitHub Models PAT Token.',
    speed: '~110 tok/s',
    isFree: true,
  },
  {
    id: 'anthropic-claude-3.5',
    name: 'Anthropic Claude 3.5 (Direct)',
    tag: 'Architecture',
    category: 'code',
    description: 'Direct execution via Anthropic API Key or OpenRouter.',
    speed: '~100 tok/s',
    isFree: true,
  },
  {
    id: 'flux-ultra-image',
    name: 'FLUX.1 Ultra Photoreal',
    tag: 'Raw 4K',
    category: 'image',
    description: '100% Watermark-free, zero-limit DALL-E 3 grade art.',
    speed: 'Instant (2s)',
    isFree: true,
  },
];

interface MasterAiHeaderProps {
  activeSessionTitle: string;
  onRenameTitle: (newTitle: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  isDedicatedGpuOnline: boolean;
  dedicatedGpuName?: string;
  onOpenGpuModal: () => void;
  isWebSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onExportMarkdown: () => void;
  onPrintChat: () => void;
  onClearChat: () => void;
  onOpenKeyVault?: () => void;
}

export const MasterAiHeader: React.FC<MasterAiHeaderProps> = ({
  activeSessionTitle,
  onRenameTitle,
  isSidebarCollapsed,
  onToggleSidebar,
  selectedModelId,
  onSelectModel,
  isDedicatedGpuOnline,
  dedicatedGpuName = 'Colab Tesla T4 vGPU',
  onOpenGpuModal,
  isWebSearchEnabled,
  onToggleWebSearch,
  onExportMarkdown,
  onPrintChat,
  onClearChat,
  onOpenKeyVault,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(activeSessionTitle);
  const [g4fStatus, setG4fStatus] = useState<{ isAlive: boolean; modelCount: number }>({
    isAlive: false,
    modelCount: 0,
  });

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    const checkG4f = () => {
      g4fAiService.checkHealth().then((st) => {
        if (isMounted) {
          setG4fStatus({ isAlive: st.isAlive, modelCount: st.modelCount });
        }
      });
    };
    checkG4f();
    const interval = setInterval(checkG4f, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setTitleDraft(activeSessionTitle);
  }, [activeSessionTitle]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveTitle = () => {
    if (titleDraft.trim()) {
      onRenameTitle(titleDraft.trim());
    } else {
      setTitleDraft(activeSessionTitle);
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setTitleDraft(activeSessionTitle);
    setIsEditingTitle(false);
  };

  const currentModel =
    MASTER_AI_MODELS.find((m) => m.id === selectedModelId) || MASTER_AI_MODELS[0];

  return (
    <header className="h-14 border-b border-white/[0.06] bg-card/35 backdrop-blur-2xl px-3 sm:px-5 flex items-center justify-between shrink-0 z-20 gap-2 select-none">
      {/* ─── LEFT: SIDEBAR TOGGLE & CHAT TITLE ─── */}
      <div className="flex items-center gap-2.5 min-w-0 max-w-[45%]">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-8 w-8 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground flex items-center justify-center transition-all border border-white/[0.06] cursor-pointer shrink-0"
          title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        {/* Dynamic Title with Inline Edit */}
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              ref={titleInputRef}
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') handleCancelTitle();
              }}
              className="h-8 px-2.5 rounded-lg bg-white/[0.08] border border-cyan-500/50 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-400 min-w-[160px] max-w-[280px]"
            />
            <button
              type="button"
              onClick={handleSaveTitle}
              className="h-7 w-7 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex items-center justify-center cursor-pointer transition-colors"
              title="Save title"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancelTitle}
              className="h-7 w-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-muted-foreground flex items-center justify-center cursor-pointer transition-colors"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingTitle(true)}
            className="group flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-white/[0.04] transition-colors truncate"
            title="Click to rename this conversation"
          >
            <h2 className="text-xs sm:text-sm font-bold text-foreground/90 group-hover:text-cyan-300 transition-colors truncate">
              {activeSessionTitle}
            </h2>
            <Edit2 className="h-3 w-3 text-muted-foreground/40 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        )}
      </div>

      {/* ─── CENTER / RIGHT CONTROLS ─── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* MODEL SELECTOR DROPDOWN */}
        <div className="relative" ref={modelDropdownRef}>
          <button
            type="button"
            onClick={() => setIsModelDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/40 text-foreground transition-all cursor-pointer shadow-sm group"
            title="Select AI Model or Engine"
          >
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50" />
            <div className="flex flex-col items-start text-left">
              <span className="text-[11px] font-bold text-foreground leading-none group-hover:text-cyan-300 transition-colors">
                {currentModel.name}
              </span>
              <span className="text-[9px] text-muted-foreground/70 font-mono leading-tight">
                {currentModel.tag} · {currentModel.speed}
              </span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ml-1 ${
                isModelDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isModelDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
              <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-white/[0.06]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Active Intelligence Engine
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  100% Free
                </span>
              </div>

              {MASTER_AI_MODELS.map((model) => {
                const isSelected = model.id === currentModel.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(model.id);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent border border-cyan-500/30 text-white'
                        : 'hover:bg-white/[0.05] text-zinc-300 border border-transparent'
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-white/[0.04] text-muted-foreground'
                      }`}
                    >
                      {model.category === 'cascade' && <Sparkles className="h-4 w-4" />}
                      {model.category === 'groq' && <Zap className="h-4 w-4 text-amber-400" />}
                      {model.category === 'g4f' && <Zap className="h-4 w-4 text-emerald-400" />}
                      {model.category === 'image' && <ImageIcon className="h-4 w-4" />}
                      {model.category === 'code' && <Code2 className="h-4 w-4" />}
                      {model.category === 'vision' && <BrainCircuit className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate text-foreground">
                          {model.name}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/[0.06] text-zinc-400 font-mono">
                          {model.speed}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">
                        {model.description}
                      </p>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-cyan-400 shrink-0 self-center" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* DEDICATED GPU (OPTION A) STATUS PILL */}
        <button
          type="button"
          onClick={onOpenGpuModal}
          className={`hidden md:flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
            isDedicatedGpuOnline
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
              : 'bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 border-white/[0.08]'
          }`}
          title="Master Dedicated GPU Backend (Option A Private Colab/Server FastAPI)"
        >
          <Cpu className={`h-3.5 w-3.5 ${isDedicatedGpuOnline ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
          <span className="text-[11px] font-bold">
            {isDedicatedGpuOnline ? 'Dedicated GPU' : 'Cloud vGPU'}
          </span>
          <span
            className={`text-[9px] font-mono px-1 py-0.2 rounded ${
              isDedicatedGpuOnline
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-white/[0.06] text-zinc-400'
            }`}
          >
            {isDedicatedGpuOnline ? 'Online' : '4,096 GB'}
          </span>
        </button>

        {/* G4F LOCAL ENGINE STATUS PILL */}
        <div
          className={`hidden xl:flex items-center gap-1.5 h-9 px-2.5 rounded-xl border text-xs font-semibold select-none transition-all ${
            g4fStatus.isAlive
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
              : 'bg-white/[0.02] text-zinc-500 border-white/[0.06]'
          }`}
          title={
            g4fStatus.isAlive
              ? `G4F Server Active: ${g4fStatus.modelCount} Sovereign Models on port 1337`
              : 'G4F Server Standby'
          }
        >
          <div
            className={`h-2 w-2 rounded-full ${
              g4fStatus.isAlive ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50' : 'bg-zinc-600'
            }`}
          />
          <Server className="h-3 w-3" />
          <span className="text-[10px] font-bold">
            {g4fStatus.isAlive ? `G4F: ${g4fStatus.modelCount} Models` : 'G4F: Standby'}
          </span>
        </div>

        {/* REAL-TIME WEB SEARCH TOGGLE */}
        <button
          type="button"
          onClick={onToggleWebSearch}
          className={`flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
            isWebSearchEnabled
              ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-500/20'
              : 'bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground border-white/[0.08]'
          }`}
          title={isWebSearchEnabled ? 'Real-Time Web Grounding: ON' : 'Real-Time Web Grounding: OFF'}
        >
          <Globe
            className={`h-3.5 w-3.5 ${isWebSearchEnabled ? 'text-blue-400 animate-spin-slow' : 'text-zinc-500'}`}
          />
          <span className="hidden sm:inline text-[11px] font-bold">
            Web: {isWebSearchEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* PROVIDERS & KEYS VAULT TRIGGER */}
        {onOpenKeyVault && (
          <button
            type="button"
            onClick={onOpenKeyVault}
            className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-muted-foreground hover:text-cyan-300 border border-white/[0.06] hover:border-cyan-500/40 text-xs font-semibold cursor-pointer transition-all"
            title="Configure Claude, GPT, Gemini, and DeepSeek Provider Keys"
          >
            <Key className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline text-[11px] font-bold">Keys</span>
          </button>
        )}

        {/* EXPORT DROPDOWN */}
        <div className="relative" ref={exportDropdownRef}>
          <button
            type="button"
            onClick={() => setIsExportDropdownOpen((prev) => !prev)}
            className="h-9 w-9 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground flex items-center justify-center transition-all border border-white/[0.06] cursor-pointer"
            title="Export conversation"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>

          {isExportDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-white/[0.06]">
                Export Chat History
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsExportDropdownOpen(false);
                  onExportMarkdown();
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.06] text-xs font-semibold text-foreground flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Markdown (.md)</div>
                  <div className="text-[10px] text-muted-foreground">Formatted with media & code</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExportDropdownOpen(false);
                  onPrintChat();
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.06] text-xs font-semibold text-foreground flex items-center gap-2 cursor-pointer transition-colors border-t border-white/[0.06]"
              >
                <Download className="h-4 w-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Print / PDF</div>
                  <div className="text-[10px] text-muted-foreground">Save as clean document</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* CLEAR CHAT BUTTON */}
        <button
          type="button"
          onClick={onClearChat}
          className="h-9 w-9 rounded-xl bg-white/[0.03] hover:bg-rose-500/15 text-muted-foreground hover:text-rose-300 flex items-center justify-center transition-all border border-white/[0.06] hover:border-rose-500/30 cursor-pointer"
          title="Clear chat thread"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
};
