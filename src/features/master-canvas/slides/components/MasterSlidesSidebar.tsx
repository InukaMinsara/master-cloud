import React from 'react';
import {
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Layout,
  Layers,
  Sparkles,
  Grid,
} from 'lucide-react';
import { MasterSlide, SlideLayoutKind, SlideThemeConfig } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';

interface MasterSlidesSidebarProps {
  slides: MasterSlide[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: (layout?: SlideLayoutKind) => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (index: number, direction: 'up' | 'down') => void;
  onToggleHideSlide: (index: number) => void;
  onOpenSorter: () => void;
  onOpenTemplates: () => void;
}

export function MasterSlidesSidebar({
  slides,
  activeSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onToggleHideSlide,
  onOpenSorter,
  onOpenTemplates,
}: MasterSlidesSidebarProps) {
  const themes = SlideTemplates.getThemes();

  return (
    <div className="w-64 border-r border-border/70 bg-card/40 flex flex-col shrink-0 select-none">
      {/* Sidebar Header & Quick Actions */}
      <div className="p-3 border-b border-border/60 flex items-center justify-between bg-card/60">
        <div className="flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Slides ({slides.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSorter}
            className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Slide Sorter View"
          >
            <Grid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onOpenTemplates}
            className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Template Gallery"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          </button>
          <button
            onClick={() => onAddSlide('title-content')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors shadow-sm"
            title="Add New Slide"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Slide</span>
          </button>
        </div>
      </div>

      {/* Slide Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {slides.map((slide, idx) => {
          const isSelected = activeSlideIndex === idx;
          const themeConfig = themes.find((t) => t.id === slide.bgTheme) || themes[0];
          const titleObj = slide.objects.find(
            (o) => o.type === 'text' && (o.format?.fontSize || 0) >= 24
          ) || slide.objects.find((o) => o.type === 'text');

          return (
            <div
              key={slide.id}
              onClick={() => onSelectSlide(idx)}
              className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 shadow-md bg-accent/40'
                  : 'border-border/60 hover:border-border hover:bg-accent/20'
              } ${slide.isHidden ? 'opacity-50' : ''}`}
            >
              {/* Header Bar per slide */}
              <div className="flex items-center justify-between mb-1.5 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={`${isSelected ? 'text-primary font-black' : ''}`}>#{idx + 1}</span>
                  <span className="capitalize px-1.5 py-0.2 rounded bg-muted/60 text-[9px] font-medium truncate max-w-[80px]">
                    {slide.layout}
                  </span>
                  {slide.isHidden && (
                    <span className="text-[9px] text-amber-500 flex items-center gap-0.5">
                      <EyeOff className="h-2.5 w-2.5" /> Hidden
                    </span>
                  )}
                </div>

                {/* Hover Quick Action Buttons */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(idx, 'up');
                    }}
                    disabled={idx === 0}
                    className="p-0.5 hover:text-foreground disabled:opacity-30 rounded hover:bg-accent"
                    title="Move Slide Up"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(idx, 'down');
                    }}
                    disabled={idx === slides.length - 1}
                    className="p-0.5 hover:text-foreground disabled:opacity-30 rounded hover:bg-accent"
                    title="Move Slide Down"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleHideSlide(idx);
                    }}
                    className="p-0.5 hover:text-foreground rounded hover:bg-accent"
                    title={slide.isHidden ? 'Unhide Slide' : 'Hide Slide'}
                  >
                    {slide.isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSlide(idx);
                    }}
                    className="p-0.5 hover:text-foreground rounded hover:bg-accent"
                    title="Duplicate Slide"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSlide(idx);
                    }}
                    disabled={slides.length <= 1}
                    className="p-0.5 hover:text-destructive disabled:opacity-30 rounded hover:bg-destructive/10"
                    title="Delete Slide"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Realistic Mini Slide Thumbnail */}
              <div
                className={`w-full aspect-video rounded-lg ${themeConfig.bgGradient} p-2 flex flex-col justify-between overflow-hidden border border-white/10 shadow-sm relative`}
              >
                <div className="truncate text-center">
                  <p
                    style={{ color: themeConfig.textColor, fontFamily: themeConfig.fontFamily }}
                    className="text-[10px] font-bold truncate"
                  >
                    {titleObj?.content || slide.title || 'Untitled Slide'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[7px] opacity-40 px-1">
                  <span className="truncate max-w-[80px]">{slide.objects.length} elements</span>
                  <span>{themeConfig.name.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-border/60 bg-card/60 text-[10px] text-muted-foreground flex items-center justify-between">
        <span>Master Slides v2.0</span>
        <span className="font-semibold text-emerald-500">10 TB Cloud Free</span>
      </div>
    </div>
  );
}
