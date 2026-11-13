import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCw,
  Trash2,
  Lock,
  Unlock,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MasterSlide, MasterSlideObject, SlideThemeConfig, ShapeKind, SlideInkStroke } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';
import { SlideAnimationService } from '../services/SlideAnimationService';
import {
  SlideShapeSvg,
  SlideChartVisual,
  PLACEHOLDER_STRINGS,
} from '../services/SlideShapeRenderer';

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
  showNotesDrawer?: boolean;
  onToggleNotesDrawer?: () => void;

  // Inking (Draw tab)
  drawTool?: 'select' | 'pen' | 'highlighter' | 'eraser';
  penColor?: string;
  penWidth?: number;
  onAddInkStroke?: (stroke: SlideInkStroke) => void;
  onEraseInkStroke?: (strokeId: string) => void;

  // Animation Painter
  animPainterSource?: MasterSlideObject['animation'] | null;
  onApplyPainterAnimation?: (targetObjectId: string) => void;
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
  showNotesDrawer = false,
  onToggleNotesDrawer,
  drawTool = 'select',
  penColor = '#111827',
  penWidth = 2,
  onAddInkStroke,
  onEraseInkStroke,
  animPainterSource = null,
  onApplyPainterAnimation,
}: MasterSlidesCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [initialObjDim, setInitialObjDim] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [transitionPlaying, setTransitionPlaying] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const themes = SlideTemplates.getThemes();
  const currentTheme = themes.find((t) => t.id === slide.bgTheme) || themes[0];
  const isDarkTheme =
    slide.bgTheme.includes('dark') ||
    slide.bgTheme.includes('black') ||
    slide.bgTheme.includes('berlin') ||
    slide.bgTheme.includes('neon');

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

  // Helper to convert client coordinates to 0-100% canvas coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (drawTool === 'pen' || drawTool === 'highlighter') {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (coords) {
        setCurrentStroke([coords]);
      }
      return;
    }
    if (drawTool === 'select') {
      onSelectObject(null);
    }
  };

  // Object drag start
  const handleObjectMouseDown = (e: React.MouseEvent, obj: MasterSlideObject) => {
    e.stopPropagation();
    if (animPainterSource) {
      onApplyPainterAnimation?.(obj.id);
      return;
    }
    if (drawTool && drawTool !== 'select') return;
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

  // Rotation start
  const handleRotateStart = (e: React.MouseEvent, obj: MasterSlideObject) => {
    e.stopPropagation();
    if (obj.isLocked) return;
    setIsRotating(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // 0. Active inking stroke
    if (currentStroke && (drawTool === 'pen' || drawTool === 'highlighter')) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (coords) {
        setCurrentStroke((prev) => (prev ? [...prev, coords] : [coords]));
      }
      return;
    }

    if (!selectedObjectId || !dragStartPos || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    // 1. Drag move
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

    // 2. Resize
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
      return;
    }

    // 3. Rotate
    if (isRotating) {
      const obj = slide.objects.find((o) => o.id === selectedObjectId);
      if (obj) {
        const objCenterX = rect.left + (rect.width * (obj.x + obj.width / 2)) / 100;
        const objCenterY = rect.top + (rect.height * (obj.y + obj.height / 2)) / 100;
        const angleRad = Math.atan2(e.clientY - objCenterY, e.clientX - objCenterX);
        let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);
        if (angleDeg < 0) angleDeg += 360;
        onUpdateObject(selectedObjectId, {
          format: { ...(obj.format || {}), rotation: angleDeg },
        });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (currentStroke && currentStroke.length > 1 && (drawTool === 'pen' || drawTool === 'highlighter')) {
      onAddInkStroke?.({
        id: `ink_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        points: currentStroke,
        color: penColor || '#111827',
        width: penWidth || 2,
        isHighlighter: drawTool === 'highlighter',
      });
      setCurrentStroke(null);
    } else {
      setCurrentStroke(null);
    }
    setIsDragging(false);
    setIsResizing(null);
    setIsRotating(false);
    setDragStartPos(null);
    setInitialObjDim(null);
  };

  // Animated objects list for ordering badge
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
      className="flex-1 flex flex-col items-center justify-between bg-[#e6e6e6] dark:bg-[#1f242d] overflow-hidden relative select-none"
      onClick={() => onSelectObject(null)}
      onContextMenu={(e) => onContextMenu(e)}
    >
      {/* Inject animation keyframes */}
      <style>{SlideAnimationService.getAnimationKeyframesCss()}</style>

      {/* ── PowerPoint Top Horizontal Ruler ──────────────────────── */}
      {showRulers && (
        <div className="w-full h-5 border-b border-black/15 dark:border-white/10 bg-[#f3f2f1] dark:bg-slate-900 text-[8px] font-mono text-muted-foreground flex items-center justify-between px-6 pointer-events-none shrink-0 z-10">
          <span>0 in</span>
          <span>1.5</span>
          <span>3.0</span>
          <span>4.5</span>
          <span>6.0</span>
          <span>7.5</span>
          <span>9.0</span>
          <span>10.5</span>
          <span>12.0</span>
          <span>13.33 in (16:9)</span>
        </div>
      )}

      {/* ── Slide Canvas Desk Area ───────────────────────────────── */}
      <div className="flex-1 w-full flex items-center justify-center p-4 sm:p-8 overflow-auto">
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          style={{
            aspectRatio: '16/9',
            maxWidth: '1120px',
            width: '100%',
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'center center',
            cursor: drawTool === 'pen' || drawTool === 'highlighter' ? 'crosshair' : drawTool === 'eraser' ? 'cell' : 'default',
            ...transitionStyle,
          }}
          className={`relative rounded-sm overflow-hidden border border-black/15 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-transform duration-150 ${
            currentTheme.bgGradient
          } ${
            showGrid
              ? 'bg-[radial-gradient(#88888840_1px,transparent_1px)] [background-size:20px_20px]'
              : ''
          }`}
        >
          {/* ── PowerPoint Inking & Drawing Layer (Draw Tab) ── */}
          <svg
            className={`absolute inset-0 w-full h-full ${
              drawTool && drawTool !== 'select'
                ? 'pointer-events-auto z-30'
                : 'pointer-events-none z-20'
            }`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="pptGalaxyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Committed Ink Strokes */}
            {(slide.inkStrokes || []).map((stroke) => {
              if (!stroke.points || stroke.points.length < 2) return null;
              const d = stroke.points.reduce(
                (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                ''
              );
              const isGalaxy = stroke.color.includes('galaxy');
              return (
                <path
                  key={stroke.id}
                  d={d}
                  fill="none"
                  stroke={isGalaxy ? 'url(#pptGalaxyGradient)' : stroke.color}
                  strokeWidth={stroke.width * 0.35}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={stroke.isHighlighter ? 0.45 : 1}
                  className={drawTool === 'eraser' ? 'pointer-events-auto cursor-pointer hover:opacity-20' : ''}
                  onClick={(e) => {
                    if (drawTool === 'eraser') {
                      e.stopPropagation();
                      onEraseInkStroke?.(stroke.id);
                    }
                  }}
                />
              );
            })}

            {/* In-progress Active Stroke */}
            {currentStroke && currentStroke.length > 1 && (
              <path
                d={currentStroke.reduce(
                  (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                  ''
                )}
                fill="none"
                stroke={penColor === 'galaxy' ? 'url(#pptGalaxyGradient)' : penColor}
                strokeWidth={(penWidth || 2) * 0.35}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={drawTool === 'highlighter' ? 0.45 : 1}
              />
            )}
          </svg>

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
            const isPlaceholder = PLACEHOLDER_STRINGS.has(obj.content);

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
                  transform: f.rotation ? `rotate(${f.rotation}deg)` : undefined,
                  cursor: obj.isLocked ? 'default' : 'move',
                  ...animStyle,
                }}
                className={`group transition-shadow ${
                  isSelected
                    ? 'ring-1 ring-[#B7472A] border border-[#B7472A] shadow-md'
                    : 'hover:ring-1 hover:ring-black/25 dark:hover:ring-white/30'
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

                {/* 1. TEXT OBJECT (WYSIWYG Click-to-edit with placeholder support) */}
                {obj.type === 'text' && (
                  <div
                    contentEditable={!obj.isLocked}
                    suppressContentEditableWarning
                    onFocus={(e) => {
                      if (isPlaceholder) {
                        e.currentTarget.innerText = '';
                        onUpdateObject(obj.id, { content: '' });
                      }
                    }}
                    onInput={(e) => {
                      onUpdateObject(obj.id, { content: e.currentTarget.innerText });
                    }}
                    onBlur={(e) => {
                      const text = e.currentTarget.innerText.trim();
                      if (!text) {
                        // Restore layout placeholder if user cleared it completely
                        const fallback =
                          obj.name?.toLowerCase().includes('subtitle') || obj.y > 40
                            ? 'Click to add subtitle'
                            : 'Click to add title';
                        e.currentTarget.innerText = fallback;
                        onUpdateObject(obj.id, { content: fallback });
                      } else {
                        onUpdateObject(obj.id, { content: text });
                      }
                    }}
                    style={{
                      fontSize: `${f.fontSize || 20}px`,
                      fontWeight: f.bold ? 700 : 400,
                      fontStyle: f.italic ? 'italic' : 'normal',
                      textDecoration: f.underline
                        ? 'underline'
                        : f.strikethrough
                        ? 'line-through'
                        : 'none',
                      color: isPlaceholder
                        ? currentTheme.subtextColor || '#71717a'
                        : f.textColor || currentTheme.textColor,
                      opacity: isPlaceholder ? 0.65 : 1,
                      backgroundColor: f.fillColor || 'transparent',
                      textAlign: f.align || 'left',
                      fontFamily: f.fontFamily || currentTheme.fontFamily,
                      borderRadius: `${f.borderRadius || 0}px`,
                      border: f.strokeWidth
                        ? `${f.strokeWidth}px solid ${f.strokeColor || '#ffffff30'}`
                        : 'none',
                      justifyContent:
                        f.verticalAlign === 'middle'
                          ? 'center'
                          : f.verticalAlign === 'bottom'
                          ? 'flex-end'
                          : 'flex-start',
                      letterSpacing: f.letterSpacing ? `${f.letterSpacing}px` : undefined,
                      textShadow: f.shadow ? '1px 1px 2px rgba(0,0,0,0.5)' : undefined,
                    }}
                    className="w-full h-full p-2 outline-none leading-snug flex flex-col whitespace-pre-wrap select-text cursor-text"
                  >
                    {obj.content}
                  </div>
                )}

                {/* 2. SHAPE OBJECT (SVG vector geometry with inside-text support) */}
                {obj.type === 'shape' && (
                  <div className="relative w-full h-full">
                    <SlideShapeSvg
                      shapeKind={obj.shapeKind}
                      fillColor={f.fillColor || currentTheme.accentColor}
                      strokeColor={f.strokeColor || 'transparent'}
                      strokeWidth={f.strokeWidth || 0}
                      strokeStyle={f.strokeStyle || 'solid'}
                      borderRadius={f.borderRadius}
                    />
                    {/* Centered editable text inside shape */}
                    <div
                      contentEditable={!obj.isLocked}
                      suppressContentEditableWarning
                      onInput={(e) => {
                        onUpdateObject(obj.id, { content: e.currentTarget.innerText });
                      }}
                      style={{
                        color: f.textColor || '#ffffff',
                        fontSize: `${f.fontSize || 14}px`,
                        fontWeight: f.bold ? 700 : 500,
                        fontStyle: f.italic ? 'italic' : 'normal',
                        textAlign: f.align || 'center',
                        fontFamily: f.fontFamily || currentTheme.fontFamily,
                      }}
                      className="absolute inset-0 flex items-center justify-center p-3 outline-none select-text cursor-text text-center break-words"
                    >
                      {obj.content}
                    </div>
                  </div>
                )}

                {/* 3. IMAGE OBJECT */}
                {obj.type === 'image' && (
                  <img
                    src={obj.content}
                    alt={obj.altText || 'Slide visual'}
                    style={{
                      borderRadius: `${f.borderRadius || 4}px`,
                      border: f.strokeWidth
                        ? `${f.strokeWidth}px solid ${f.strokeColor || '#ffffff'}`
                        : 'none',
                    }}
                    className="w-full h-full object-contain pointer-events-none select-none shadow-xs"
                  />
                )}

                {/* 4. TABLE OBJECT */}
                {obj.type === 'table' && obj.tableData && (
                  <div className="w-full h-full overflow-auto bg-white/95 dark:bg-slate-900/95 rounded border border-black/15 dark:border-white/15 p-1 shadow-sm">
                    <table className="w-full h-full border-collapse text-[11px]">
                      <tbody>
                        {obj.tableData.cells.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={`border-b border-black/10 dark:border-white/10 last:border-b-0 ${
                              rIdx === 0
                                ? 'bg-[#156082] text-white font-bold'
                                : rIdx % 2 === 1
                                ? 'bg-black/[0.02] dark:bg-white/[0.02]'
                                : ''
                            }`}
                          >
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
                                className="p-2 border-r border-black/10 dark:border-white/10 last:border-r-0 outline-none"
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
                  <SlideChartVisual
                    chartData={obj.chartData}
                    accentColor={currentTheme.accentColor}
                    isDarkTheme={isDarkTheme}
                  />
                )}

                {/* 6. BUTTON / PILL OBJECT */}
                {obj.type === 'button' && (
                  <div
                    contentEditable={!obj.isLocked}
                    suppressContentEditableWarning
                    onInput={(e) => onUpdateObject(obj.id, { content: e.currentTarget.innerText })}
                    style={{
                      backgroundColor: f.fillColor || currentTheme.accentColor,
                      borderRadius: `${f.borderRadius || 9999}px`,
                      color: f.textColor || '#ffffff',
                      fontSize: `${f.fontSize || 14}px`,
                    }}
                    className="w-full h-full flex items-center justify-center font-bold tracking-wider uppercase shadow-md p-2 outline-none cursor-text select-text text-center"
                  >
                    {obj.content || 'ACTION BUTTON'}
                  </div>
                )}

                {/* ── PowerPoint 8-Point Selection Handles + Rotation Stem ── */}
                {isSelected && !obj.isLocked && (
                  <>
                    {/* Rotation Handle Stem & Anchor */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-40">
                      <div
                        onMouseDown={(e) => handleRotateStart(e, obj)}
                        className="w-4 h-4 rounded-full bg-white border-2 border-[#B7472A] shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                        title="Rotate Object"
                      >
                        <RotateCw className="h-2.5 w-2.5 text-[#B7472A]" />
                      </div>
                      <div className="w-[1px] h-2 bg-[#B7472A]" />
                    </div>

                    {/* Sizing Handles */}
                    {/* NW */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'nw', obj)}
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#B7472A] rounded-full cursor-nwse-resize z-40 shadow-xs"
                    />
                    {/* N */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'n', obj)}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#B7472A] rounded-full cursor-ns-resize z-40 shadow-xs"
                    />
                    {/* NE */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'ne', obj)}
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#B7472A] rounded-full cursor-nesw-resize z-40 shadow-xs"
                    />
                    {/* E */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'e', obj)}
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-[#B7472A] rounded-full cursor-ew-resize z-40 shadow-xs"
                    />
                    {/* SE */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'se', obj)}
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#B7472A] rounded-full cursor-nwse-resize z-40 shadow-xs"
                    />
                    {/* S */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 's', obj)}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#B7472A] rounded-full cursor-ns-resize z-40 shadow-xs"
                    />
                    {/* SW */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'sw', obj)}
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#B7472A] rounded-full cursor-nesw-resize z-40 shadow-xs"
                    />
                    {/* W */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'w', obj)}
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-[#B7472A] rounded-full cursor-ew-resize z-40 shadow-xs"
                    />

                    {/* Quick Delete Floating Mini Button */}
                    <div className="absolute -top-8 right-0 flex items-center gap-1 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 shadow-md rounded p-0.5 z-40">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteObject(obj.id);
                        }}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
      </div>

      {/* ── PowerPoint Bottom Speaker Notes Drawer ───────────────── */}
      <div className="w-full border-t border-black/10 dark:border-border/80 bg-[#f7f6f5] dark:bg-slate-900 shrink-0 select-none transition-all">
        <div
          onClick={onToggleNotesDrawer}
          className="h-7 px-4 flex items-center justify-between cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-[11px] font-semibold text-foreground/80"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-[#B7472A]" />
            <span>Click to add notes</span>
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
            {showNotesDrawer ? (
              <>
                Hide Notes <ChevronDown className="h-3 w-3" />
              </>
            ) : (
              <>
                Expand Notes <ChevronUp className="h-3 w-3" />
              </>
            )}
          </span>
        </div>

        {showNotesDrawer && (
          <div className="p-3 border-t border-black/[0.06] dark:border-white/10 bg-white dark:bg-slate-950">
            <textarea
              value={speakerNotes}
              onChange={(e) => onChangeSpeakerNotes(e.target.value)}
              placeholder="Click to add notes and speaker talking points..."
              rows={3}
              className="w-full text-xs font-sans rounded border border-black/15 dark:border-white/15 p-2 bg-transparent focus:border-[#B7472A] focus:outline-none resize-none leading-relaxed text-foreground placeholder:text-muted-foreground/60"
            />
          </div>
        )}
      </div>
    </div>
  );
}
