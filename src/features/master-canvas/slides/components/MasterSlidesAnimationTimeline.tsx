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
} from 'lucide-react';
import { MasterSlide, MasterSlideObject, AnimationType } from '../types';

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
  // Extract all animated objects on this slide
  const animatedObjects = slide.objects.filter(
    (o) => o.animation && o.animation.type !== 'none'
  );

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

  const handleRemoveAnim = (objId: string) => {
    onUpdateObject(objId, {
      animation: { type: 'none', trigger: 'on-click' },
    });
  };

  return (
    <div className="w-80 border-l border-border bg-card/90 backdrop-blur-md flex flex-col shrink-0 select-none overflow-hidden animate-in slide-in-from-right-4 duration-150">
      {/* Header */}
      <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-card/60">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Animation Pane ({animatedObjects.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPreviewSequence}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-all"
            title="Play All Animations"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Play</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Animation Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {animatedObjects.length > 0 ? (
          animatedObjects.map((obj, idx) => {
            const isSelected = selectedObjectId === obj.id;
            const anim = obj.animation!;
            const objName =
              obj.name ||
              (obj.type === 'text' ? obj.content.slice(0, 18) : `${obj.type.toUpperCase()}`);

            return (
              <div
                key={obj.id}
                onClick={() => onSelectObject(obj.id)}
                className={`p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 ring-1 ring-amber-500/50 bg-amber-500/10 shadow-md'
                    : 'border-border/70 hover:border-border bg-card/60'
                }`}
              >
                {/* Top Info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-foreground truncate max-w-[120px]">
                      {objName}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAnim(obj.id);
                    }}
                    className="p-1 hover:text-destructive rounded hover:bg-destructive/10 text-muted-foreground"
                    title="Remove Animation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Animation Type & Trigger Row */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5 font-medium">
                      Effect:
                    </label>
                    <select
                      value={anim.type}
                      onChange={(e) =>
                        handleUpdateAnim(obj.id, { type: e.target.value as AnimationType })
                      }
                      className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="fade-in">Fade In</option>
                      <option value="slide-up">Slide Up</option>
                      <option value="slide-down">Slide Down</option>
                      <option value="slide-left">Slide Left</option>
                      <option value="slide-right">Slide Right</option>
                      <option value="zoom-in">Zoom In</option>
                      <option value="bounce">Bounce In</option>
                      <option value="flip">3D Flip</option>
                      <option value="spin">Spin In</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5 font-medium">
                      Trigger:
                    </label>
                    <select
                      value={anim.trigger || 'on-click'}
                      onChange={(e) =>
                        handleUpdateAnim(obj.id, {
                          trigger: e.target.value as 'on-click' | 'after-previous' | 'with-previous',
                        })
                      }
                      className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="on-click">On Click (Step)</option>
                      <option value="after-previous">After Previous</option>
                      <option value="with-previous">With Previous</option>
                    </select>
                  </div>
                </div>

                {/* Duration & Delay sliders */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center justify-between bg-muted/40 px-2 py-1 rounded-lg border border-border">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-mono font-bold text-foreground">
                      {((anim.durationMs || 500) / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-muted/40 px-2 py-1 rounded-lg border border-border">
                    <span className="text-muted-foreground">Delay:</span>
                    <span className="font-mono font-bold text-foreground">
                      {((anim.delayMs || 0) / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
            <Sparkles className="h-6 w-6 text-muted-foreground/40 mx-auto" />
            <p>No animated objects on this slide.</p>
            <p className="text-[11px] text-muted-foreground/70">
              Select any object and use the Animations tab to add entrance or emphasis effects.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
