import React, { useState, useRef, useEffect } from 'react';
import { MasterSlide, MasterSlideObject, SlideThemeConfig } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';
import { SlideAnimationService } from '../services/SlideAnimationService';
import { Move, RotateCw, Trash2, Lock, Unlock, MessageSquare, Sparkles } from 'lucide-react';

interface MasterSlidesCanvasProps {
  slide: MasterSlide;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (id: string, updates: Partial<MasterSlideObject>) => void;
  onDeleteObject: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, objId?: string) => void;
  speakerNotes: string;
  onChangeSpeakerNotes: (notes: string) => void;
  previewTransitionTrigger?: number;
  previewAnimationObjectId?: string | null;
}

export function MasterSlidesCanvas({
  slide,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  onDeleteObject,
  onContextMenu,
  speakerNotes,
  onChangeSpeakerNotes,
  previewTransitionTrigger = 0,
  previewAnimationObjectId = null,
}: MasterSlidesCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [transitionPlaying, setTransitionPlaying] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const themes = SlideTemplates.getThemes();
  const currentTheme = themes.find((t) => t.id === slide.bgTheme) || themes[0];

  // Trigger transition animation on slide switch or preview trigger
  useEffect(() => {
    if (slide.transition && slide.transition.type !== 'none') {
      setTransitionPlaying(true);
      const timer = setTimeout(() => {
        setTransitionPlaying(false);
      }, (slide.transition.durationSeconds || 0.5) * 1000 + 100);
      return () => clearTimeout(timer);
    }
  }, [slide.id, previewTransitionTrigger, slide.transition?.type, slide.transition?.durationSeconds]);

  const handleObjectMouseDown = (e: React.MouseEvent, obj: MasterSlideObject) => {
    e.stopPropagation();
    if (obj.isLocked) return;
    onSelectObject(obj.id);
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedObjectId || !dragStartPos || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - dragStartPos.x) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStartPos.y) / rect.height) * 100;

    const obj = slide.objects.find((o) => o.id === selectedObjectId);
    if (obj) {
      onUpdateObject(selectedObjectId, {
        x: Math.max(0, Math.min(100 - obj.width, obj.x + deltaXPercent)),
        y: Math.max(0, Math.min(100 - obj.height, obj.y + deltaYPercent)),
      });
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragStartPos(null);
  };

  // List of animated objects for step numbering
  const animatedObjects = slide.objects.filter((o) => o.animation && o.animation.type !== 'none');

  const transitionStyle = transitionPlaying && slide.transition?.type && slide.transition.type !== 'none'
    ? SlideAnimationService.getSlideTransitionStyle(slide.transition.type, slide.transition.durationSeconds || 0.5)
    : {};

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/40 overflow-hidden relative select-none"
      onClick={() => onSelectObject(null)}
      onContextMenu={(e) => onContextMenu(e)}
    >
      {/* Inject animation keyframes */}
      <style>{SlideAnimationService.getAnimationKeyframesCss()}</style>

      {/* 16:9 Slide Canvas Frame */}
      <div
        ref={canvasRef}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        style={{
          aspectRatio: '16/9',
          maxWidth: '1100px',
          width: '100%',
          ...transitionStyle,
        }}
        className={`relative rounded-2xl shadow-2xl overflow-hidden border border-border/80 ${currentTheme.bgGradient}`}
      >
        {/* Render Slide Objects */}
        {slide.objects.map((obj) => {
          const isSelected = obj.id === selectedObjectId;
          const f = obj.format || {};
          const isAnimPreview = previewAnimationObjectId === obj.id;
          const animStyle = isAnimPreview && obj.animation && obj.animation.type !== 'none'
            ? SlideAnimationService.getObjectAnimationStyle(
                obj.animation.type,
                (obj.animation.durationMs || 500) / 1000,
                0
              )
            : {};

          const animIndex = animatedObjects.findIndex((o) => o.id === obj.id);

          return (
            <div
              key={obj.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj.id);
              }}
              onMouseDown={(e) => handleObjectMouseDown(e, obj)}
              onContextMenu={(e) => {
                e.stopPropagation();
                onContextMenu(e, obj.id);
              }}
              style={{
                position: 'absolute',
                left: `${obj.x}%`,
                top: `${obj.y}%`,
                width: `${obj.width}%`,
                height: `${obj.height}%`,
                zIndex: obj.zIndex,
                transform: f.rotation ? `rotate(${f.rotation}deg)` : 'none',
                cursor: obj.isLocked ? 'default' : 'move',
                ...animStyle,
              }}
              className={`group transition-shadow ${
                isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-slate-900 shadow-xl' : ''
              }`}
            >
              {/* Animation Badge in Edit Mode */}
              {animIndex !== -1 && (
                <div
                  className="absolute -top-3 -left-3 flex items-center gap-0.5 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-lg z-30 pointer-events-none"
                  title={`Animation: ${obj.animation?.type} (${obj.animation?.trigger})`}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>{animIndex + 1}</span>
                </div>
              )}

              {/* Object Renderers */}
              {obj.type === 'text' && (
                <div
                  contentEditable={!obj.isLocked}
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateObject(obj.id, { content: e.currentTarget.innerText })}
                  style={{
                    fontSize: `${f.fontSize || 20}px`,
                    fontWeight: f.bold ? 'bold' : 'normal',
                    fontStyle: f.italic ? 'italic' : 'normal',
                    textDecoration: f.underline ? 'underline' : 'none',
                    color: f.textColor || currentTheme.textColor,
                    textAlign: f.align || 'left',
                    fontFamily: f.fontFamily || currentTheme.fontFamily,
                  }}
                  className="w-full h-full p-2 outline-none leading-relaxed flex flex-col justify-center whitespace-pre-wrap"
                >
                  {obj.content}
                </div>
              )}

              {obj.type === 'shape' && (
                <div
                  style={{
                    backgroundColor: f.fillColor || currentTheme.accentColor,
                    border: `${f.strokeWidth || 0}px solid ${f.strokeColor || 'transparent'}`,
                    borderRadius: `${f.borderRadius || 8}px`,
                    color: f.textColor || '#ffffff',
                  }}
                  className="w-full h-full flex items-center justify-center p-4 font-bold text-center shadow-md"
                >
                  {obj.content}
                </div>
              )}

              {obj.type === 'image' && (
                <img
                  src={obj.content}
                  alt="Slide object"
                  style={{ borderRadius: `${f.borderRadius || 8}px` }}
                  className="w-full h-full object-contain pointer-events-none"
                />
              )}

              {obj.type === 'button' && (
                <div
                  style={{
                    backgroundColor: f.fillColor || currentTheme.accentColor,
                    borderRadius: `${f.borderRadius || 9999}px`,
                    color: f.textColor || '#ffffff',
                  }}
                  className="w-full h-full flex items-center justify-center font-black tracking-wider uppercase shadow-lg text-xs"
                >
                  {obj.content || 'ACTION BUTTON'}
                </div>
              )}

              {/* Selection Action Badges */}
              {isSelected && !obj.isLocked && (
                <div className="absolute -top-7 right-0 flex items-center gap-1 bg-card border border-border shadow-md rounded-lg p-0.5 z-30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteObject(obj.id);
                    }}
                    className="p-1 rounded text-destructive hover:bg-destructive/10"
                    title="Delete object"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Speaker Notes Floating Bottom Drawer */}
      <div className="w-full max-w-5xl mt-3 flex flex-col rounded-xl border border-border/80 bg-card/90 backdrop-blur-md shadow-lg overflow-hidden transition-all">
        <div
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-accent/40 text-xs font-semibold text-foreground select-none"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span>Speaker Presenter Notes</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{showNotes ? 'Hide Notes' : 'Click to View / Edit Notes'}</span>
        </div>

        {showNotes && (
          <div className="p-3 border-t border-border/60">
            <textarea
              value={speakerNotes}
              onChange={(e) => onChangeSpeakerNotes(e.target.value)}
              placeholder="Type private speaker cues and talking points for this slide here..."
              rows={3}
              className="w-full text-xs rounded-lg bg-background border border-border p-2 focus:ring-1 focus:ring-primary focus:outline-none resize-none leading-relaxed"
            />
          </div>
        )}
      </div>
    </div>
  );
}
