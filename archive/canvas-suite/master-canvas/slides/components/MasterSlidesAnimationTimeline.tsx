import React from 'react';
import {
  Sparkles,
  Play,
  ChevronUp,
  ChevronDown,
  Trash2,
  Clock,
  Zap,
  MousePointer,
  Layers,
  X,
  Plus,
} from 'lucide-react';
import { MasterSlide, MasterSlideObject, AnimationType } from '../types';
import { SlideAnimationService, AnimationCatalogItem } from '../services/SlideAnimationService';

interface MasterSlidesAnimationTimelineProps {
  slide: MasterSlide;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (id: string, updates: Partial<MasterSlideObject>) => void;
  onPreviewSequence: () => void;
  onClose: () => void;
}

export function MasterSlidesAnimationTimeline({
  slide,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  onPreviewSequence,
  onClose,
}: MasterSlidesAnimationTimelineProps) {
  const catalog = SlideAnimationService.getAnimationCatalog();

  // Extract all animated objects on this slide
  const animatedObjects = slide.objects.filter(
    (o) => o.animation && o.animation.type !== 'none'
  );

  const selectedObject = slide.objects.find((o) => o.id === selectedObjectId);

  const handleUpdateAnim = (
    objId: string,
    updates: Partial<NonNullable<MasterSlideObject['animation']>>
  ) => {
    const obj = slide.objects.find((o) => o.id === objId);
    if (obj?.animation) {
      onUpdateObject(objId, {
        animation: { ...obj.animation, ...updates },
      });
    }
  };

  const handleAddDefaultAnimToSelected = () => {
    if (!selectedObjectId) return;
    onUpdateObject(selectedObjectId, {
      animation: {
        type: 'fly-in-bottom',
        trigger: 'on-click',
        durationMs: 500,
        delayMs: 0,
      },
    });
  };

  const handleRemoveAnim = (objId: string) => {
    onUpdateObject(objId, {
      animation: { type: 'none', trigger: 'on-click' },
    });
  };

  const entranceList = catalog.filter((c) => c.category === 'Entrance');
  const emphasisList = catalog.filter((c) => c.category === 'Emphasis');
  const exitList = catalog.filter((c) => c.category === 'Exit');
  const motionList = catalog.filter((c) => c.category === 'Motion Paths');

  return (
    <div className="w-84 border-l border-black/10 dark:border-border/80 bg-white dark:bg-slate-900 flex flex-col shrink-0 select-none overflow-hidden shadow-xl z-20 animate-in slide-in-from-right duration-150">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="h-11 px-3 border-b border-black/10 dark:border-border flex items-center justify-between bg-[#f7f6f5] dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#B7472A]" />
          <span className="text-xs font-bold text-foreground">
            Animation Pane ({animatedObjects.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPreviewSequence}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#B7472A] hover:bg-[#9c3a20] text-white text-xs font-semibold shadow-2xs transition-all"
            title="Play All Animations"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Play</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10 text-muted-foreground hover:text-foreground"
            title="Close Animation Pane"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Add Animation for Selected Object */}
      {selectedObject && (!selectedObject.animation || selectedObject.animation.type === 'none') && (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
          <span className="text-[11px] text-amber-900 dark:text-amber-200 truncate max-w-[170px]">
            Selected: <b>{selectedObject.name || selectedObject.type}</b>
          </span>
          <button
            type="button"
            onClick={handleAddDefaultAnimToSelected}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#B7472A] text-white text-[10.5px] font-semibold"
          >
            <Plus className="h-3 w-3" />
            <span>Add Effect</span>
          </button>
        </div>
      )}

      {/* ── Animation Timeline List ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {animatedObjects.length > 0 ? (
          animatedObjects.map((obj, idx) => {
            const isSelected = selectedObjectId === obj.id;
            const anim = obj.animation!;
            const itemDef = catalog.find((c) => c.id === anim.type);
            const objName =
              obj.name ||
              (obj.type === 'text' ? obj.content.slice(0, 22) : `${obj.type.toUpperCase()} Element`);

            return (
              <div
                key={obj.id}
                onClick={() => onSelectObject(obj.id)}
                className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#B7472A] ring-1 ring-[#B7472A]/40 bg-[#B7472A]/5 shadow-sm'
                    : 'border-black/10 dark:border-white/10 hover:border-black/20 bg-card'
                }`}
              >
                {/* Header Row: Index Badge + Trigger Icon + Object Name + Delete */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0"
                      style={{ backgroundColor: itemDef?.starColor || '#22c55e' }}
                      title={`${itemDef?.category || 'Animation'} effect`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-bold text-foreground truncate max-w-[160px]">
                      {objName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-muted-foreground font-mono">
                      {itemDef?.category || 'Entrance'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAnim(obj.id);
                      }}
                      className="p-1 hover:text-rose-600 rounded hover:bg-rose-50 text-muted-foreground"
                      title="Remove Animation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Effect Select Dropdown (Comprehensive Categorized) */}
                <div className="mb-2">
                  <label className="text-[10px] text-muted-foreground block mb-0.5 font-medium">
                    Animation Effect:
                  </label>
                  <select
                    value={anim.type}
                    onChange={(e) =>
                      handleUpdateAnim(obj.id, { type: e.target.value as AnimationType })
                    }
                    className="w-full text-[11px] bg-background border border-black/15 dark:border-border rounded px-2 py-1 text-foreground focus:border-[#B7472A] focus:outline-none"
                  >
                    <optgroup label="Entrance (Green)">
                      {entranceList.map((e) => (
                        <option key={e.id} value={e.id}>
                          ★ {e.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Emphasis (Yellow)">
                      {emphasisList.map((e) => (
                        <option key={e.id} value={e.id}>
                          ◈ {e.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Exit (Red)">
                      {exitList.map((e) => (
                        <option key={e.id} value={e.id}>
                          ▼ {e.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Motion Paths (Blue)">
                      {motionList.map((e) => (
                        <option key={e.id} value={e.id}>
                          ➜ {e.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Trigger Row */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5 font-medium">
                      Start:
                    </label>
                    <select
                      value={anim.trigger || 'on-click'}
                      onChange={(e) =>
                        handleUpdateAnim(obj.id, {
                          trigger: e.target.value as 'on-click' | 'after-previous' | 'with-previous',
                        })
                      }
                      className="w-full text-[11px] bg-background border border-black/15 dark:border-border rounded px-1.5 py-1 text-foreground focus:border-[#B7472A] focus:outline-none"
                    >
                      <option value="on-click">On Click</option>
                      <option value="after-previous">After Previous</option>
                      <option value="with-previous">With Previous</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5 font-medium">
                      Duration:
                    </label>
                    <select
                      value={String(anim.durationMs || 500)}
                      onChange={(e) =>
                        handleUpdateAnim(obj.id, { durationMs: parseInt(e.target.value, 10) })
                      }
                      className="w-full text-[11px] bg-background border border-black/15 dark:border-border rounded px-1.5 py-1 text-foreground focus:border-[#B7472A] focus:outline-none"
                    >
                      <option value="250">0.25s (Very Fast)</option>
                      <option value="500">0.50s (Fast)</option>
                      <option value="750">0.75s (Medium)</option>
                      <option value="1000">1.00s (Slow)</option>
                      <option value="1500">1.50s (Very Slow)</option>
                      <option value="2000">2.00s</option>
                    </select>
                  </div>
                </div>

                {/* Delay & Timeline Bar */}
                <div className="flex items-center justify-between text-[10px] bg-black/[0.03] dark:bg-white/[0.04] p-1.5 rounded border border-black/5 dark:border-white/5">
                  <span className="text-muted-foreground">
                    Delay: {((anim.delayMs || 0) / 1000).toFixed(1)}s
                  </span>
                  <div className="flex-1 mx-2 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex items-center">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((anim.durationMs || 500) / 2000) * 100)}%`,
                        backgroundColor: itemDef?.starColor || '#22c55e',
                      }}
                    />
                  </div>
                  <span className="font-mono font-bold">
                    {((anim.durationMs || 500) / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
            <Sparkles className="h-6 w-6 text-muted-foreground/40 mx-auto" />
            <p className="font-semibold text-foreground">No animations on this slide</p>
            <p className="text-[11px] text-muted-foreground/80">
              Select any shape, text box, table, or chart on the slide, then choose an entrance or emphasis effect from the Animations ribbon tab!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
