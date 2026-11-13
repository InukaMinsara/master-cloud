import React from 'react';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { MasterSlide, MasterSlideObject, SlideThemeConfig } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';
import { buildSlideLayoutObjects } from '../services/SlideShapeRenderer';

interface MasterSlidesDesignerPanelProps {
  slide: MasterSlide;
  onApplyRedesign: (updatedObjects: MasterSlideObject[], newThemeId?: string) => void;
  onClose: () => void;
}

export function MasterSlidesDesignerPanel({
  slide,
  onApplyRedesign,
  onClose,
}: MasterSlidesDesignerPanelProps) {
  const themes = SlideTemplates.getThemes();
  const currentTheme = themes.find((t) => t.id === slide.bgTheme) || themes[0];
  const titleText =
    slide.objects.find((o) => o.type === 'text' && (o.name?.toLowerCase().includes('title') || (o.format?.fontSize || 0) >= 28))
      ?.content || slide.title || 'Slide Title';

  const designerIdeas = [
    {
      id: 'modern-two-col',
      title: 'Split Executive Columns',
      description: 'Side-by-side structured cards with accent headers.',
      themeId: currentTheme.id,
      build: () => buildSlideLayoutObjects('two-columns', currentTheme),
    },
    {
      id: 'big-stat-spotlight',
      title: 'KPI Spotlight',
      description: 'Prominent metric spotlight with supporting takeaway.',
      themeId: 'widescreen-cyan',
      build: () => {
        const theme = themes.find((t) => t.id === 'widescreen-cyan') || currentTheme;
        return buildSlideLayoutObjects('big-stat', theme);
      },
    },
    {
      id: 'quote-card',
      title: 'Editorial Quotation',
      description: 'Elegant serif typography with large quotation marks.',
      themeId: 'gallery-classic',
      build: () => {
        const theme = themes.find((t) => t.id === 'gallery-classic') || currentTheme;
        return buildSlideLayoutObjects('quote', theme);
      },
    },
    {
      id: 'section-divider',
      title: 'Bold Section Divider',
      description: 'High-contrast divider with accent bar and large heading.',
      themeId: 'berlin-amber',
      build: () => {
        const theme = themes.find((t) => t.id === 'berlin-amber') || currentTheme;
        return buildSlideLayoutObjects('section-header', theme);
      },
    },
    {
      id: 'visual-caption',
      title: 'Content with Caption',
      description: 'Structured visual frame with left headline and caption.',
      themeId: 'aptos-office',
      build: () => {
        const theme = themes.find((t) => t.id === 'aptos-office') || currentTheme;
        return buildSlideLayoutObjects('image-text', theme);
      },
    },
  ];

  return (
    <div className="w-72 border-l border-black/10 dark:border-border/80 bg-white dark:bg-slate-900 flex flex-col shrink-0 select-none shadow-xl z-20 animate-in slide-in-from-right duration-150">
      {/* Designer Header */}
      <div className="h-11 px-3 border-b border-black/10 dark:border-border flex items-center justify-between bg-[#f7f6f5] dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#B7472A]" />
          <span className="text-xs font-bold text-foreground">Designer</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-black/10 text-muted-foreground hover:text-foreground"
          title="Close Designer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 text-[11px] text-muted-foreground border-b border-black/5 dark:border-white/5">
        PowerPoint Designer creates intelligent slide layouts based on your content. Click an idea to apply.
      </div>

      {/* Ideas List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {designerIdeas.map((idea) => {
          const theme = themes.find((t) => t.id === idea.themeId) || currentTheme;
          return (
            <button
              key={idea.id}
              type="button"
              onClick={() => onApplyRedesign(idea.build(), idea.themeId)}
              className="w-full text-left p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:border-[#B7472A] hover:shadow-md transition-all group bg-card"
            >
              {/* Mini Preview Box */}
              <div
                className={`w-full aspect-video rounded-lg ${theme.bgGradient} p-2 border border-black/10 mb-2 flex flex-col justify-between shadow-2xs group-hover:scale-[1.02] transition-transform`}
              >
                <div
                  className="h-2 w-16 rounded-xs"
                  style={{ backgroundColor: theme.accentColor }}
                />
                <div className="space-y-1">
                  <div
                    className="h-1.5 w-24 rounded-2xs"
                    style={{ backgroundColor: theme.textColor, opacity: 0.8 }}
                  />
                  <div
                    className="h-1.5 w-16 rounded-2xs"
                    style={{ backgroundColor: theme.subtextColor, opacity: 0.5 }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground group-hover:text-[#B7472A] transition-colors">
                  {idea.title}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-[#B7472A] transition-colors" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{idea.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
