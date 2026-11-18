import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  X,
  ExternalLink,
  Laptop,
  Check,
  ChevronRight,
  Sliders,
  Settings,
  Layers,
  Zap,
  Globe,
  ArrowLeft,
  Info,
  Bot,
} from 'lucide-react';
import {
  AI_CATEGORIES,
  AI_UNIVERSE_MODELS,
  AIModelItem,
  AICategoryItem,
  MASTER_HF_OWNER,
  getInukaSpaceUrl,
  resolveModelEmbedUrl,
} from '@/services/ai/aiUniverseData';
import { MasterAiNativeStudio } from './MasterAiNativeStudio';
import { toast } from 'sonner';

interface AIUniverseHubModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialCategoryId?: string;
  inline?: boolean;
  onSwitchToChat?: () => void;
}

export const AIUniverseHubModal: React.FC<AIUniverseHubModalProps> = ({
  isOpen = true,
  onClose = () => {},
  initialCategoryId = 'all',
  inline = false,
  onSwitchToChat,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRunningModel, setActiveRunningModel] = useState<AIModelItem | null>(null);
  const [isMethod2DrawerOpen, setIsMethod2DrawerOpen] = useState<boolean>(false);
  const [customSpaceUrl, setCustomSpaceUrl] = useState<string>('');
  const [routeThroughInukaAccount, setRouteThroughInukaAccount] = useState<boolean>(false);

  // Filter models by category and search query
  const filteredModels = useMemo(() => {
    return AI_UNIVERSE_MODELS.filter((model) => {
      const matchesCategory =
        selectedCategory === 'all' || model.categoryId === selectedCategory;

      if (!searchQuery.trim()) return matchesCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        model.name.toLowerCase().includes(q) ||
        model.description.toLowerCase().includes(q) ||
        model.author.toLowerCase().includes(q) ||
        model.categoryLabel.toLowerCase().includes(q) ||
        model.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Load active space URL (Custom -> inuka1 dedicated -> Official cluster fallback)
  const getActiveModelSpaceUrl = (model: AIModelItem): string => {
    return resolveModelEmbedUrl(model);
  };

  const handleLaunchModel = (model: AIModelItem) => {
    setActiveRunningModel(model);
    setStudioViewMode('native');
    if (typeof window !== 'undefined') {
      const savedCustom = model.customSpaceUrlKey ? localStorage.getItem(model.customSpaceUrlKey) || '' : '';
      setCustomSpaceUrl(savedCustom);

      const inukaKey = `master_hf_engine_${model.id}`;
      const isInukaActive = localStorage.getItem(inukaKey) === 'true';
      setRouteThroughInukaAccount(isInukaActive);
    } else {
      setCustomSpaceUrl('');
      setRouteThroughInukaAccount(false);
    }
  };

  const handleSaveEngineSettings = () => {
    if (!activeRunningModel) return;

    if (typeof window !== 'undefined') {
      // 1. Custom URL
      if (activeRunningModel.customSpaceUrlKey) {
        if (customSpaceUrl.trim()) {
          localStorage.setItem(activeRunningModel.customSpaceUrlKey, customSpaceUrl.trim());
        } else {
          localStorage.removeItem(activeRunningModel.customSpaceUrlKey);
        }
      }

      // 2. inuka1 Dedicated Engine Toggle
      const inukaKey = `master_hf_engine_${activeRunningModel.id}`;
      if (routeThroughInukaAccount) {
        localStorage.setItem(inukaKey, 'true');
        toast.success(`Routed to @${MASTER_HF_OWNER} dedicated Space (${getInukaSpaceUrl(activeRunningModel.spaceId)})`);
      } else {
        localStorage.removeItem(inukaKey);
        toast.info('Using high-availability verified ZeroGPU cluster.');
      }
    }

    setIsMethod2DrawerOpen(false);
  };

  if (!inline && !isOpen) return null;

  const innerHub = (
    <div
      className={`w-full h-full flex flex-col overflow-hidden relative ${
        inline
          ? 'bg-background border-0'
          : 'bg-card border border-border/80 w-full max-w-7xl h-[92vh] rounded-3xl shadow-2xl'
      }`}
    >
      {/* ─── TOP MASTER BAR ─── */}
      <div className="h-16 px-4 sm:px-6 border-b border-border/70 flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-md gap-3">
        <div className="flex items-center gap-3">
          {activeRunningModel ? (
            <button
              type="button"
              onClick={() => {
                setActiveRunningModel(null);
                setIsMethod2DrawerOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to All 102 Models</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                    AI SPACE
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    34 Domains · 102 Bots
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hidden md:inline-flex items-center gap-1">
                    <span>📦 10 TB Vault Mounted</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 hidden lg:inline-flex items-center gap-1">
                    <span>🚀 4-in-1 Unified vGPU</span>
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1.5 font-mono">
                  <span className="text-cyan-300 font-bold">Master Cloud Dedicated Core</span>
                  <span>•</span>
                  <span>10 TB Model Vault Mounted</span>
                  <span>•</span>
                  <span>Master Quantum Unified vGPU (4,096 GB VRAM)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Model Title or Search & Stats */}
        <div className="flex items-center gap-2">
          {activeRunningModel ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-foreground flex items-center justify-end gap-1.5">
                  <span>{activeRunningModel.categoryIcon}</span>
                  <span>{activeRunningModel.name}</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {activeRunningModel.hardware}
                </span>
              </div>

              {/* Native Studio Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline">100% Master Native UI</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 102 models (e.g. FLUX, F5, YOLO)..."
                  className="w-full bg-muted/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-border/60"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {onSwitchToChat && (
                <button
                  type="button"
                  onClick={onSwitchToChat}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="Switch to AI Chat Assistant"
                >
                  <Bot className="h-3.5 w-3.5 text-purple-400" />
                  <span>AI Chat</span>
                </button>
              )}
            </div>
          )}

          {!inline && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer ml-1"
              title="Close AI Space"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

        {/* ─── MAIN CONTENT VIEW (100% NATIVE STUDIO) ─── */}
        {activeRunningModel ? (
          <MasterAiNativeStudio
            model={activeRunningModel}
            onBack={() => setActiveRunningModel(null)}
          />
        ) : (
          /* HUB VIEW: CATEGORY BROWSER & 102 MODEL CARDS */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Category Navigation (34 Categories) */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/70 bg-card/20 flex flex-col shrink-0">
              <div className="p-3 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>All 34 Domains</span>
                <span className="font-mono text-purple-400">102 AI Bots</span>
              </div>

              {/* Scrollable category list */}
              <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto p-2 gap-1 shrink-0 md:shrink flex-nowrap md:flex-wrap">
                {AI_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 md:shrink md:w-full cursor-pointer gap-2 ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base shrink-0">{cat.icon}</span>
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Models Grid View */}
            <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-secondary/5">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-2">
                    <span>
                      {AI_CATEGORIES.find((c) => c.id === selectedCategory)?.icon || '🌌'}
                    </span>
                    <span>
                      {AI_CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'AI Models'}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {AI_CATEGORIES.find((c) => c.id === selectedCategory)?.description ||
                      'Top verified models powered by Cloud ZeroGPU'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono font-bold text-foreground">
                    {filteredModels.length} Models
                  </span>
                  <span>available</span>
                </div>
              </div>

              {/* Models Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                {filteredModels.map((model) => (
                  <div
                    key={model.id}
                    className="group rounded-3xl bg-card border border-border/80 hover:border-purple-500/50 p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all relative overflow-hidden"
                  >
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">{model.categoryIcon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-foreground group-hover:text-purple-300 transition-colors">
                              {model.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            by {model.author}
                          </span>
                        </div>
                      </div>

                      {/* Rank Badge */}
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          model.rank === 1
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : model.rank === 2
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {model.rank === 1 ? '👑 Top 1' : `#${model.rank} Pick`}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground/90 line-clamp-3 leading-relaxed">
                      {model.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {model.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Bottom Specs & Launch Button */}
                    <div className="pt-2 border-t border-border/50 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          10 TB Vault
                        </span>
                        <span className="text-purple-300/90 font-semibold">Unified vGPU</span>
                        <span className="text-cyan-400/90 font-semibold">Master AI Core</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLaunchModel(model)}
                        className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 active:scale-[0.99] transition-all cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Launch Cloud Studio</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredModels.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Search className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">No matching models found</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Try searching with another keyword like "FLUX", "Video", "3D", or clear the filter.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );

  if (inline) {
    return (
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-background relative select-none">
        {innerHub}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      {innerHub}
    </div>
  );
};

export const AISpaceHub = AIUniverseHubModal;
