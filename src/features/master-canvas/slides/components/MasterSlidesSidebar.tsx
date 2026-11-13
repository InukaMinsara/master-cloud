import React, { useState } from 'react';
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
  ChevronRight,
} from 'lucide-react';
import { MasterSlide, SlideLayoutKind, SlideThemeConfig } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';
import { SlideShapeSvg } from '../services/SlideShapeRenderer';
import { POWERPOINT_LAYOUTS } from '../services/SlideShapeRenderer';

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
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const themes = SlideTemplates.getThemes();

  return (
    <div className="w-56 sm:w-60 border-r border-black/10 dark:border-border/80 bg-[#f7f6f5] dark:bg-slate-900/90 flex flex-col shrink-0 select-none">
      {/* ── 1. PowerPoint Left Pane Header ───────────────────────── */}
      <div className="h-10 px-2.5 border-b border-black/[0.08] dark:border-border flex items-center justify-between bg-[#f0edea] dark:bg-slate-900">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers className="h-3.5 w-3.5 text-[#B7472A] shrink-0" />
          <span className="text-[11px] font-bold text-foreground/80 tracking-tight truncate">
            Slides ({slides.length})
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenSorter}
            className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            title="Slide Sorter"
          >
            <Grid className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenTemplates}
            className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            title="Templates Gallery"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </button>

          {/* New Slide Button with Layout dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onAddSlide('title-content')}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#B7472A] hover:bg-[#9c3a20] text-white text-[11px] font-semibold transition-colors shadow-2xs"
              title="Add New Slide (Title and Content)"
            >
              <Plus className="h-3 w-3 stroke-[3]" />
              <span>Slide</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Real Slide Thumbnail Strip ───────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2.5 scrollbar-thin">
        {slides.map((slide, idx) => {
          const isSelected = activeSlideIndex === idx;
          const themeConfig = themes.find((t) => t.id === slide.bgTheme) || themes[0];
          const isDarkTheme =
            slide.bgTheme.includes('dark') ||
            slide.bgTheme.includes('black') ||
            slide.bgTheme.includes('berlin') ||
            slide.bgTheme.includes('neon');

          return (
            <div
              key={slide.id}
              onClick={() => onSelectSlide(idx)}
              className={`group flex items-start gap-1.5 p-1 rounded-md transition-all cursor-pointer ${
                isSelected
                  ? 'bg-black/[0.04] dark:bg-white/[0.06]'
                  : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
              }`}
            >
              {/* Slide Number (PowerPoint Left Margin Number) */}
              <div className="w-5 pt-1 text-right text-[10px] font-bold shrink-0">
                <span
                  className={
                    isSelected
                      ? 'text-[#B7472A] font-black'
                      : 'text-muted-foreground/80 font-semibold'
                  }
                >
                  {idx + 1}
                </span>
                {slide.isHidden && (
                  <EyeOff className="h-2.5 w-2.5 text-amber-500 ml-auto mt-0.5" />
                )}
              </div>

              {/* 16:9 Realistic Live Slide Miniature */}
              <div className="flex-1 min-w-0">
                <div
                  className={`relative w-full aspect-video rounded overflow-hidden border transition-all shadow-xs ${
                    isSelected
                      ? 'border-[#B7472A] ring-2 ring-[#B7472A]/40 shadow-sm'
                      : 'border-black/15 dark:border-white/10 group-hover:border-black/30 dark:group-hover:border-white/20'
                  } ${themeConfig.bgGradient} ${slide.isHidden ? 'opacity-40 grayscale' : ''}`}
                >
                  {/* Live Render of Objects scaled down */}
                  {slide.objects.map((obj) => {
                    if (obj.isHidden) return null;
                    const f = obj.format || {};

                    return (
                      <div
                        key={obj.id}
                        style={{
                          position: 'absolute',
                          left: `${obj.x}%`,
                          top: `${obj.y}%`,
                          width: `${obj.width}%`,
                          height: `${obj.height}%`,
                          zIndex: obj.zIndex,
                          transform: f.rotation ? `rotate(${f.rotation}deg)` : undefined,
                        }}
                        className="overflow-hidden pointer-events-none select-none"
                      >
                        {/* 1. TEXT MINIATURE */}
                        {obj.type === 'text' && (
                          <div
                            style={{
                              color: f.textColor || themeConfig.textColor,
                              textAlign: f.align || 'left',
                              fontFamily: f.fontFamily || themeConfig.fontFamily,
                              fontWeight: f.bold ? 700 : 400,
                              lineHeight: 1.1,
                            }}
                            className="w-full h-full text-[6.5px] leading-tight overflow-hidden break-words px-0.5"
                          >
                            {obj.content.slice(0, 75)}
                          </div>
                        )}

                        {/* 2. SHAPE MINIATURE */}
                        {obj.type === 'shape' && (
                          <SlideShapeSvg
                            shapeKind={obj.shapeKind}
                            fillColor={f.fillColor || themeConfig.accentColor}
                            strokeColor={f.strokeColor}
                            strokeWidth={f.strokeWidth ? 1 : 0}
                            borderRadius={f.borderRadius}
                          />
                        )}

                        {/* 3. IMAGE MINIATURE */}
                        {obj.type === 'image' && (
                          <img
                            src={obj.content}
                            alt=""
                            className="w-full h-full object-cover rounded-xs"
                          />
                        )}

                        {/* 4. TABLE MINIATURE */}
                        {obj.type === 'table' && (
                          <div className="w-full h-full border border-black/20 dark:border-white/20 bg-black/5 rounded-xs grid grid-cols-3 grid-rows-3 gap-px p-0.5">
                            {Array.from({ length: 9 }).map((_, i) => (
                              <div
                                key={i}
                                className={`rounded-2xs ${
                                  i < 3 ? 'bg-[#156082]/40' : 'bg-black/10 dark:bg-white/10'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* 5. CHART MINIATURE */}
                        {obj.type === 'chart' && (
                          <div className="w-full h-full flex items-end gap-0.5 p-0.5 border-b border-black/20">
                            <div className="flex-1 h-[40%] bg-[#156082] rounded-t-2xs" />
                            <div className="flex-1 h-[75%] bg-[#E97132] rounded-t-2xs" />
                            <div className="flex-1 h-[95%] bg-[#196B24] rounded-t-2xs" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty Slide Layout Hint if no objects */}
                  {slide.objects.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center text-[7px] text-muted-foreground/60">
                      Blank Slide
                    </div>
                  )}
                </div>

                {/* Bottom Meta & Hover Controls Bar */}
                <div className="flex items-center justify-between pt-1 px-0.5 text-[9px] text-muted-foreground">
                  <span className="capitalize truncate max-w-[85px] font-medium opacity-80">
                    {slide.layout.replace('-', ' ')}
                  </span>

                  {/* Thumbnail Quick Actions */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveSlide(idx, 'up');
                      }}
                      disabled={idx === 0}
                      className="p-0.5 hover:text-foreground disabled:opacity-20 rounded"
                      title="Move Up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveSlide(idx, 'down');
                      }}
                      disabled={idx === slides.length - 1}
                      className="p-0.5 hover:text-foreground disabled:opacity-20 rounded"
                      title="Move Down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateSlide(idx);
                      }}
                      className="p-0.5 hover:text-foreground rounded"
                      title="Duplicate Slide"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(idx);
                      }}
                      disabled={slides.length <= 1}
                      className="p-0.5 hover:text-destructive disabled:opacity-20 rounded"
                      title="Delete Slide"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. Footer Status ───────────────────────────────────────── */}
      <div className="h-7 px-3 border-t border-black/[0.08] dark:border-border text-[10px] text-muted-foreground flex items-center justify-between bg-[#f0edea] dark:bg-slate-900">
        <span className="font-medium text-foreground/80">PowerPoint 365</span>
        <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
          10 TB Cloud Free
        </span>
      </div>
    </div>
  );
}
