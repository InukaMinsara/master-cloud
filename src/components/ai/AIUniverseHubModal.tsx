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
} from 'lucide-react';
import {
  AI_CATEGORIES,
  AI_UNIVERSE_MODELS,
  AIModelItem,
  AICategoryItem,
} from '@/services/ai/aiUniverseData';
import { toast } from 'sonner';

interface AIUniverseHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategoryId?: string;
}

export const AIUniverseHubModal: React.FC<AIUniverseHubModalProps> = ({
  isOpen,
  onClose,
  initialCategoryId = 'all',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRunningModel, setActiveRunningModel] = useState<AIModelItem | null>(null);
  const [isMethod2DrawerOpen, setIsMethod2DrawerOpen] = useState<boolean>(false);
  const [customSpaceUrl, setCustomSpaceUrl] = useState<string>('');

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

  // Load custom private space URL for Method 2 if set
  const getActiveModelSpaceUrl = (model: AIModelItem): string => {
    if (typeof window !== 'undefined' && model.customSpaceUrlKey) {
      const saved = localStorage.getItem(model.customSpaceUrlKey);
      if (saved && saved.trim()) return saved.trim();
    }
    return model.spaceUrl;
  };

  const handleLaunchModel = (model: AIModelItem) => {
    setActiveRunningModel(model);
    if (model.customSpaceUrlKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(model.customSpaceUrlKey) || '';
      setCustomSpaceUrl(saved);
    } else {
      setCustomSpaceUrl('');
    }
  };

  const handleSaveCustomSpaceUrl = () => {
    if (!activeRunningModel || !activeRunningModel.customSpaceUrlKey) return;
    if (customSpaceUrl.trim()) {
      localStorage.setItem(activeRunningModel.customSpaceUrlKey, customSpaceUrl.trim());
      toast.success('Private Space URL saved! Master Cloud will now run your dedicated copy.');
    } else {
      localStorage.removeItem(activeRunningModel.customSpaceUrlKey);
      toast.info('Reverted to public Cloud ZeroGPU cluster.');
    }
    setIsMethod2DrawerOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border/80 w-full max-w-7xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
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
                      MASTER AI UNIVERSE
                    </h2>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      34 Categories · 102 Models
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground hidden sm:block">
                    100% Free NVIDIA A100 ZeroGPU Clusters · 0 MB Laptop Download · Zero VRAM Strain
                  </p>
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

                {/* Method 2 Private Duplicate Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsMethod2DrawerOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer"
                  title="Configure Method 2: Custom Duplicated Space URL"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Method 2 Private Settings</span>
                </button>

                <a
                  href={getActiveModelSpaceUrl(activeRunningModel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  title="Open in new browser tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
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
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer ml-1"
              title="Close Universe Hub"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ─── MAIN CONTENT VIEW ─── */}
        {activeRunningModel ? (
          /* RUNNER VIEW: EMBEDDED CLOUD STUDIO */
          <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
            {/* Method 2 Drawer Overlay */}
            {isMethod2DrawerOpen && (
              <div className="absolute top-0 right-0 w-full sm:w-96 bg-card border-l border-border/80 shadow-2xl z-40 p-5 space-y-4 animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <h4 className="font-extrabold text-sm text-foreground">Method 2: Private Space</h4>
                  </div>
                  <button
                    onClick={() => setIsMethod2DrawerOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    By default, Master Cloud connects to the verified high-speed Cloud ZeroGPU cluster.
                  </p>
                  <p>
                    If you duplicated this Space into your personal Hugging Face account, paste your custom private URL below to run your dedicated instance:
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    1-Click Duplicate Link:
                  </span>
                  <a
                    href={`https://huggingface.co/spaces/${activeRunningModel.spaceId}?duplicate=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs font-bold text-purple-300 hover:text-purple-200 hover:underline"
                  >
                    <span>Duplicate {activeRunningModel.name}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Custom Space URL:
                  </label>
                  <input
                    type="url"
                    value={customSpaceUrl}
                    onChange={(e) => setCustomSpaceUrl(e.target.value)}
                    placeholder="https://yourname-spacename.hf.space"
                    className="w-full bg-background rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 border border-border/80 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Leave blank to use the official free ZeroGPU cluster.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveCustomSpaceUrl}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save &amp; Reload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMethod2DrawerOpen(false)}
                    className="py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Embedded Cloud Iframe */}
            <div className="flex-1 w-full h-full relative">
              <iframe
                key={getActiveModelSpaceUrl(activeRunningModel)}
                src={getActiveModelSpaceUrl(activeRunningModel)}
                title={activeRunningModel.name}
                className="w-full h-full border-0 bg-background"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                allow="camera; microphone; clipboard-write; display-capture"
              />
            </div>
          </div>
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
                          0 MB Download
                        </span>
                        <span>{model.hardware}</span>
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
    </div>
  );
};
