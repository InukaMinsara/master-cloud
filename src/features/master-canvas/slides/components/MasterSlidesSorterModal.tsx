import React, { useState } from 'react';
import {
  X,
  Grid,
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
} from 'lucide-react';
import { MasterSlide } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';

interface MasterSlidesSorterModalProps {
  slides: MasterSlide[];
  activeSlideIndex: number;
  onClose: () => void;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (index: number, direction: 'left' | 'right') => void;
  onToggleHideSlide: (index: number) => void;
}

export function MasterSlidesSorterModal({
  slides,
  activeSlideIndex,
  onClose,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onToggleHideSlide,
}: MasterSlidesSorterModalProps) {
  const [columns, setColumns] = useState<3 | 4 | 5>(4);
  const themes = SlideTemplates.getThemes();

  const handleOpenSlide = (index: number) => {
    onSelectSlide(index);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-6xl h-[85vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Grid className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                Slide Sorter Studio
                <span className="text-xs font-normal text-muted-foreground">
                  ({slides.length} slides total)
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Reorganize, duplicate, hide, and manage your presentation structure.
              </p>
            </div>
          </div>

          {/* Column selector & Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
              <span className="text-[10px] text-muted-foreground font-medium px-1">Grid:</span>
              {([3, 4, 5] as const).map((col) => (
                <button
                  key={col}
                  onClick={() => setColumns(col)}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-colors ${
                    columns === col ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {col} cols
                </button>
              ))}
            </div>

            <button
              onClick={onAddSlide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Slide</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sorter Grid Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className={`grid gap-6 ${
              columns === 3 ? 'grid-cols-3' : columns === 4 ? 'grid-cols-4' : 'grid-cols-5'
            }`}
          >
            {slides.map((slide, idx) => {
              const isSelected = activeSlideIndex === idx;
              const themeConfig = themes.find((t) => t.id === slide.bgTheme) || themes[0];
              const titleObj = slide.objects.find(
                (o) => o.type === 'text' && (o.format?.fontSize || 0) >= 20
              ) || slide.objects.find((o) => o.type === 'text');

              return (
                <div
                  key={slide.id}
                  onClick={() => onSelectSlide(idx)}
                  onDoubleClick={() => handleOpenSlide(idx)}
                  className={`group relative flex flex-col rounded-2xl border p-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/30 shadow-xl bg-accent/30 scale-[1.02]'
                      : 'border-border/70 hover:border-border hover:shadow-md bg-card/40'
                  } ${slide.isHidden ? 'opacity-50' : ''}`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                    <span className="font-mono font-bold text-foreground">#{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveSlide(idx, 'left');
                        }}
                        disabled={idx === 0}
                        className="p-1 hover:text-foreground disabled:opacity-30 rounded hover:bg-accent"
                        title="Move Left"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveSlide(idx, 'right');
                        }}
                        disabled={idx === slides.length - 1}
                        className="p-1 hover:text-foreground disabled:opacity-30 rounded hover:bg-accent"
                        title="Move Right"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleHideSlide(idx);
                        }}
                        className="p-1 hover:text-foreground rounded hover:bg-accent"
                        title={slide.isHidden ? 'Unhide' : 'Hide'}
                      >
                        {slide.isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateSlide(idx);
                        }}
                        className="p-1 hover:text-foreground rounded hover:bg-accent"
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSlide(idx);
                        }}
                        disabled={slides.length <= 1}
                        className="p-1 hover:text-destructive disabled:opacity-30 rounded hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail Card */}
                  <div
                    className={`w-full aspect-video rounded-xl ${themeConfig.bgGradient} p-4 flex flex-col justify-between overflow-hidden border border-white/10 shadow-sm relative`}
                  >
                    <div className="text-center truncate my-auto">
                      <p
                        style={{ color: themeConfig.textColor, fontFamily: themeConfig.fontFamily }}
                        className="text-xs font-bold truncate"
                      >
                        {titleObj?.content || slide.title || 'Untitled Slide'}
                      </p>
                      <span className="text-[9px] opacity-60 text-slate-300 block mt-1">
                        {slide.objects.length} elements &bull; {slide.layout}
                      </span>
                    </div>

                    {slide.isHidden && (
                      <div className="absolute top-2 right-2 bg-amber-500/90 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        HIDDEN
                      </div>
                    )}
                  </div>

                  {/* Open in Editor Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenSlide(idx);
                    }}
                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold rounded-lg bg-accent/60 hover:bg-accent text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Open in Editor</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
