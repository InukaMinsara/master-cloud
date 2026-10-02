import React, { useState, useRef, useEffect } from 'react';
import { MasterSlide, MasterSlideObject, SlideThemeConfig, ShapeKind } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';
import { SlideAnimationService } from '../services/SlideAnimationService';
import {
  Move,
  RotateCw,
  Trash2,
  Lock,
  Unlock,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Plus,
} from 'lucide-react';

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
  zoomLevel?: number;
  showGrid?: boolean;
  showRulers?: boolean;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

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
  zoomLevel = 100,
  showGrid = false,
  showRulers = false,
}: MasterSlidesCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [initialObjDim, setInitialObjDim] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
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

  // Object drag start
  const handleObjectMouseDown = (e: React.MouseEvent, obj: MasterSlideObject) => {
    e.stopPropagation();
    if (obj.isLocked) return;
    onSelectObject(obj.id);
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  // Resize handle start
  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle, obj: MasterSlideObject) => {
    e.stopPropagation();
    if (obj.isLocked) return;
    setIsResizing(handle);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setInitialObjDim({ x: obj.x, y: obj.y, w: obj.width, h: obj.height });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!selectedObjectId || !dragStartPos || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    // 1. Handle Drag Move
    if (isDragging) {
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
      return;
    }

    // 2. Handle Resize
    if (isResizing && initialObjDim) {
      const deltaXPercent = ((e.clientX - dragStartPos.x) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStartPos.y) / rect.height) * 100;

      let newX = initialObjDim.x;
      let newY = initialObjDim.y;
      let newW = initialObjDim.w;
      let newH = initialObjDim.h;

      if (isResizing.includes('e')) newW = Math.max(5, initialObjDim.w + deltaXPercent);
      if (isResizing.includes('s')) newH = Math.max(5, initialObjDim.h + deltaYPercent);
      if (isResizing.includes('w')) {
        const potentialW = initialObjDim.w - deltaXPercent;
        if (potentialW >= 5) {
          newX = initialObjDim.x + deltaXPercent;
          newW = potentialW;
        }
      }
      if (isResizing.includes('n')) {
        const potentialH = initialObjDim.h - deltaYPercent;
        if (potentialH >= 5) {
          newY = initialObjDim.y + deltaYPercent;
          newH = potentialH;
        }
      }

      onUpdateObject(selectedObjectId, {
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
    setDragStartPos(null);
    setInitialObjDim(null);
  };

  // List of animated objects for step numbering
  const animatedObjects = slide.objects.filter((o) => o.animation && o.animation.type !== 'none');

  const transitionStyle =
    transitionPlaying && slide.transition?.type && slide.transition.type !== 'none'
      ? SlideAnimationService.getSlideTransitionStyle(
          slide.transition.type,
          slide.transition.durationSeconds || 0.5
        )
      : {};

  const selectedObject = slide.objects.find((o) => o.id === selectedObjectId);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/40 overflow-hidden relative select-none"
      onClick={() => onSelectObject(null)}
      onContextMenu={(e) => onContextMenu(e)}
    >
      {/* Inject animation keyframes */}
      <style>{SlideAnimationService.getAnimationKeyframesCss()}</style>

      {/* Rulers Overlay */}
      {showRulers && (
        <div className="absolute top-2 left-6 right-6 h-4 flex items-center border-b border-border/80 text-[8px] font-mono text-muted-foreground justify-between pointer-events-none px-4 bg-card/60 rounded">
          <span>0px</span>
          <span>200px</span>
          <span>400px</span>
          <span>600px</span>
          <span>800px</span>
          <span>1000px</span>
          <span>1200px</span>
        </div>
      )}

      {/* 16:9 Slide Canvas Frame */}
      <div
        ref={canvasRef}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        style={{
          aspectRatio: '16/9',
          maxWidth: '1100px',
          width: '100%',
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'center center',
          ...transitionStyle,
        }}
        className={`relative rounded-2xl shadow-2xl overflow-hidden border border-border/80 transition-transform duration-200 ${
          currentTheme.bgGradient
        } ${showGrid ? 'bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:16px_16px]' : ''}`}
      >
        {/* Render Slide Objects */}
        {slide.objects.map((obj) => {
          if (obj.isHidden) return null;
          const isSelected = obj.id === selectedObjectId;
          const f = obj.format || {};
          const isAnimPreview = previewAnimationObjectId === obj.id;
          const animStyle =
            isAnimPreview && obj.animation && obj.animation.type !== 'none'
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
                isSelected
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-slate-900 shadow-xl'
                  : 'hover:ring-1 hover:ring-white/30'
              }`}
            >
              {/* Animation Order Badge */}
              {animIndex !== -1 && (
                <div
                  className="absolute -top-3 -left-3 flex items-center gap-0.5 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-lg z-30 pointer-events-none"
                  title={`Animation: ${obj.animation?.type} (${obj.animation?.trigger})`}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>{animIndex + 1}</span>
                </div>
              )}

              {/* 1. TEXT OBJECT */}
              {obj.type === 'text' && (
                <div
                  contentEditable={!obj.isLocked}
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateObject(obj.id, { content: e.currentTarget.innerText })}
                  style={{
                    fontSize: `${f.fontSize || 20}px`,
                    fontWeight: f.bold ? 'bold' : 'normal',
                    fontStyle: f.italic ? 'italic' : 'normal',
                    textDecoration: f.underline
                      ? 'underline'
                      : f.strikethrough
                      ? 'line-through'
                      : 'none',
                    color: f.textColor || currentTheme.textColor,
                    backgroundColor: f.fillColor || 'transparent',
                    textAlign: f.align || 'left',
                    fontFamily: f.fontFamily || currentTheme.fontFamily,
                    borderRadius: `${f.borderRadius || 0}px`,
                    border: f.strokeWidth ? `${f.strokeWidth}px solid ${f.strokeColor || '#ffffff30'}` : 'none',
                  }}
                  className="w-full h-full p-2 outline-none leading-relaxed flex flex-col justify-center whitespace-pre-wrap"
                >
                  {obj.content}
                </div>
              )}

              {/* 2. SHAPE OBJECT */}
              {obj.type === 'shape' && (
                <div
                  style={{
                    backgroundColor: f.fillColor || currentTheme.accentColor,
                    border: `${f.strokeWidth || 0}px solid ${f.strokeColor || 'transparent'}`,
                    borderRadius:
                      obj.shapeKind === 'circle'
                        ? '9999px'
                        : obj.shapeKind === 'diamond'
                        ? '0px'
                        : `${f.borderRadius || 12}px`,
                    color: f.textColor || '#ffffff',
                    transform: obj.shapeKind === 'diamond' ? 'rotate(45deg)' : 'none',
                  }}
                  className="w-full h-full flex items-center justify-center p-3 font-bold text-center shadow-md text-xs"
                >
                  <span style={{ transform: obj.shapeKind === 'diamond' ? 'rotate(-45deg)' : 'none' }}>
                    {obj.content}
                  </span>
                </div>
              )}

              {/* 3. IMAGE OBJECT */}
              {obj.type === 'image' && (
                <img
                  src={obj.content}
                  alt={obj.altText || 'Slide visual'}
                  style={{ borderRadius: `${f.borderRadius || 8}px` }}
                  className="w-full h-full object-contain pointer-events-none"
                />
              )}

              {/* 4. TABLE OBJECT */}
              {obj.type === 'table' && obj.tableData && (
                <div className="w-full h-full overflow-auto bg-card/80 backdrop-blur-md rounded-xl border border-border p-1 shadow-lg">
                  <table className="w-full h-full border-collapse text-[10px]">
                    <tbody>
                      {obj.tableData.cells.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-border/60 last:border-b-0">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              contentEditable={!obj.isLocked}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const newCells = obj.tableData!.cells.map((r, ri) =>
                                  ri === rIdx
                                    ? r.map((c, ci) => (ci === cIdx ? e.currentTarget.innerText : c))
                                    : r
                                );
                                onUpdateObject(obj.id, {
                                  tableData: { ...obj.tableData!, cells: newCells },
                                });
                              }}
                              className={`p-1.5 border-r border-border/60 last:border-r-0 outline-none ${
                                rIdx === 0 ? 'font-bold bg-primary/20 text-primary' : 'text-foreground'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. CHART OBJECT */}
              {obj.type === 'chart' && obj.chartData && (
                <div className="w-full h-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-xl">
                  <div className="text-[10px] font-bold text-slate-300 truncate mb-2">
                    {obj.chartData.title || obj.content || 'Chart'}
                  </div>
                  <div className="flex-1 flex items-end gap-2 px-2 pb-1 border-b border-slate-700">
                    {obj.chartData.labels.map((label, idx) => {
                      const val = obj.chartData!.values[idx] || 10;
                      const max = Math.max(...obj.chartData!.values, 100);
                      const heightPercent = Math.max(10, (val / max) * 100);

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-gradient-to-t from-primary to-cyan-400 rounded-t-md shadow-sm transition-all"
                          />
                          <span className="text-[8px] font-mono text-slate-400 truncate w-full text-center">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. BUTTON OBJECT */}
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

              {/* 8-Point Resize Handles & Rotation Handle on Selected Object */}
              {isSelected && !obj.isLocked && (
                <>
                  {/* North-West */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'nw', obj)}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-nwse-resize z-40 shadow"
                  />
                  {/* North */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'n', obj)}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-ns-resize z-40 shadow"
                  />
                  {/* North-East */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'ne', obj)}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-nesw-resize z-40 shadow"
                  />
                  {/* East */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'e', obj)}
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-ew-resize z-40 shadow"
                  />
                  {/* South-East */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'se', obj)}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-nwse-resize z-40 shadow"
                  />
                  {/* South */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 's', obj)}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-ns-resize z-40 shadow"
                  />
                  {/* South-West */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'sw', obj)}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-nesw-resize z-40 shadow"
                  />
                  {/* West */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'w', obj)}
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-ew-resize z-40 shadow"
                  />

                  {/* Top Action Quick Bar */}
                  <div className="absolute -top-8 right-0 flex items-center gap-1 bg-card border border-border shadow-md rounded-lg p-0.5 z-30">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteObject(obj.id);
                      }}
                      className="p-1 rounded text-destructive hover:bg-destructive/10"
                      title="Delete element"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Numeric Coordinate HUD */}
      {selectedObject && (
        <div className="absolute bottom-16 right-8 bg-card/90 border border-border rounded-xl px-3 py-1.5 text-[10px] font-mono text-muted-foreground flex items-center gap-3 shadow-lg pointer-events-none">
          <span>X: {selectedObject.x.toFixed(1)}%</span>
          <span>Y: {selectedObject.y.toFixed(1)}%</span>
          <span>W: {selectedObject.width.toFixed(1)}%</span>
          <span>H: {selectedObject.height.toFixed(1)}%</span>
          <span>Z: {selectedObject.zIndex}</span>
        </div>
      )}

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
          <span className="text-[10px] text-muted-foreground">
            {showNotes ? 'Hide Notes' : 'Click to View / Edit Notes'}
          </span>
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
