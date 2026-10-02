import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  PenTool,
  Eraser,
  Trash2,
  Layers,
  CircleDot,
  Maximize2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MasterPresentationData, MasterSlide, SlideThemeConfig } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';

interface MasterSlidesPresentationModeProps {
  presentation: MasterPresentationData;
  initialSlideIndex?: number;
  onClose: () => void;
  onOpenPresenterView?: () => void;
}

export function MasterSlidesPresentationMode({
  presentation,
  initialSlideIndex = 0,
  onClose,
  onOpenPresenterView,
}: MasterSlidesPresentationModeProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
  const [blackScreen, setBlackScreen] = useState(false);
  const [whiteScreen, setWhiteScreen] = useState(false);
  const [laserMode, setLaserMode] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [penMode, setPenMode] = useState(false);
  const [penColor, setPenColor] = useState('#ef4444');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showDock, setShowDock] = useState(true);
  const dockTimeoutRef = useRef<any>(null);

  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const activeSlides = presentation.slides.filter((s) => !s.isHidden);
  const currentSlide: MasterSlide = activeSlides[currentSlideIndex] || activeSlides[0];
  const themes = SlideTemplates.getThemes();
  const currentTheme = themes.find((t) => t.id === currentSlide?.bgTheme) || themes[0];

  // Auto-hide control dock on mouse inactivity
  const handleMouseMove = (e: React.MouseEvent) => {
    if (laserMode) {
      setLaserPos({ x: e.clientX, y: e.clientY });
    }
    setShowDock(true);
    if (dockTimeoutRef.current) clearTimeout(dockTimeoutRef.current);
    dockTimeoutRef.current = setTimeout(() => {
      if (!penMode && !showDrawer) {
        setShowDock(false);
      }
    }, 3500);
  };

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') {
        if (!blackScreen && !whiteScreen) {
          setCurrentSlideIndex((prev) => Math.min(activeSlides.length - 1, prev + 1));
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        if (!blackScreen && !whiteScreen) {
          setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
        }
      } else if (e.key === 'Home') {
        setCurrentSlideIndex(0);
      } else if (e.key === 'End') {
        setCurrentSlideIndex(activeSlides.length - 1);
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'b' || e.key === 'B') {
        setBlackScreen((prev) => !prev);
        setWhiteScreen(false);
      } else if (e.key === 'w' || e.key === 'W') {
        setWhiteScreen((prev) => !prev);
        setBlackScreen(false);
      } else if (e.key === 'l' || e.key === 'L') {
        setLaserMode((prev) => !prev);
        setPenMode(false);
      } else if (e.key === 'p' || e.key === 'P') {
        setPenMode((prev) => !prev);
        setLaserMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlides.length, blackScreen, whiteScreen, onClose]);

  // Setup drawing canvas
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = penColor;
      contextRef.current = ctx;
    }
  }, [penColor]);

  const startDrawing = (e: React.MouseEvent) => {
    if (!penMode || !contextRef.current) return;
    contextRef.current.beginPath();
    contextRef.current.moveTo(e.clientX, e.clientY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !penMode || !contextRef.current) return;
    contextRef.current.lineTo(e.clientX, e.clientY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!penMode || !contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas || !contextRef.current) return;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!currentSlide) return null;

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden ${
        blackScreen ? 'bg-black' : whiteScreen ? 'bg-white' : currentTheme.bgGradient
      }`}
    >
      {/* Black / White Screen Overlays */}
      {blackScreen && (
        <div className="absolute inset-0 bg-black z-40 flex items-center justify-center">
          <p className="text-zinc-600 text-xs font-mono">Press 'B' or ESC to return</p>
        </div>
      )}

      {whiteScreen && (
        <div className="absolute inset-0 bg-white z-40 flex items-center justify-center">
          <p className="text-zinc-400 text-xs font-mono">Press 'W' or ESC to return</p>
        </div>
      )}

      {/* Laser Pointer Glowing Dot */}
      {laserMode && (
        <div
          style={{
            left: `${laserPos.x}px`,
            top: `${laserPos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="fixed pointer-events-none z-50 w-5 h-5 rounded-full bg-rose-500 shadow-[0_0_20px_6px_rgba(244,63,94,0.9)] animate-pulse"
        />
      )}

      {/* Freehand Drawing Overlay Canvas */}
      <canvas
        ref={drawingCanvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className={`fixed inset-0 z-30 ${penMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
      />

      {/* 16:9 Presentation Stage */}
      <div
        style={{
          aspectRatio: presentation.aspectRatio === '4:3' ? '4/3' : '16/9',
          maxWidth: '1440px',
          width: '92%',
          maxHeight: '90vh',
        }}
        className="relative w-full h-full flex flex-col justify-between p-12 transition-all duration-300"
      >
        {/* Render Slide Objects with Transitions */}
        {currentSlide.objects.map((obj) => {
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
                transform: f.rotation ? `rotate(${f.rotation}deg)` : 'none',
              }}
              className="animate-in fade-in zoom-in-95 duration-200"
            >
              {obj.type === 'text' && (
                <div
                  style={{
                    fontSize: `${f.fontSize ? f.fontSize * 1.25 : 24}px`,
                    fontWeight: f.bold ? 'bold' : 'normal',
                    fontStyle: f.italic ? 'italic' : 'normal',
                    textDecoration: f.underline ? 'underline' : 'none',
                    color: f.textColor || currentTheme.textColor,
                    textAlign: f.align || 'left',
                    fontFamily: f.fontFamily || currentTheme.fontFamily,
                  }}
                  className="w-full h-full leading-relaxed whitespace-pre-line"
                >
                  {obj.content}
                </div>
              )}

              {obj.type === 'shape' && (
                <div
                  style={{
                    backgroundColor: f.fillColor || currentTheme.accentColor,
                    border: `${f.strokeWidth || 0}px solid ${f.strokeColor || 'transparent'}`,
                    borderRadius: `${f.borderRadius || 12}px`,
                    color: f.textColor || '#ffffff',
                  }}
                  className="w-full h-full flex items-center justify-center p-4 font-bold text-center shadow-xl"
                >
                  {obj.content}
                </div>
              )}

              {obj.type === 'image' && (
                <img
                  src={obj.content}
                  alt="Presentation visual"
                  style={{ borderRadius: `${f.borderRadius || 12}px` }}
                  className="w-full h-full object-contain"
                />
              )}

              {obj.type === 'button' && (
                <div
                  style={{
                    backgroundColor: f.fillColor || currentTheme.accentColor,
                    borderRadius: `${f.borderRadius || 9999}px`,
                    color: f.textColor || '#ffffff',
                  }}
                  className="w-full h-full flex items-center justify-center font-black tracking-wider uppercase shadow-lg text-sm"
                >
                  {obj.content || 'ACTION'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Auto-Hide Presentation Dock */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 px-4 py-2 rounded-2xl shadow-2xl transition-all duration-300 ${
          showDock ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        {/* Navigation buttons */}
        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentSlideIndex === 0}
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-200 disabled:opacity-30 transition-colors"
          title="Previous Slide (Left Arrow)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-xs font-mono font-bold text-slate-300 px-2">
          {currentSlideIndex + 1} / {activeSlides.length}
        </span>

        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.min(activeSlides.length - 1, prev + 1))}
          disabled={currentSlideIndex === activeSlides.length - 1}
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-200 disabled:opacity-30 transition-colors"
          title="Next Slide (Right Arrow / Space)"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Laser Pointer toggle */}
        <button
          onClick={() => {
            setLaserMode(!laserMode);
            setPenMode(false);
          }}
          className={`p-2 rounded-xl transition-colors ${
            laserMode ? 'bg-rose-500 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Laser Pointer (L)"
        >
          <CircleDot className="h-4 w-4" />
        </button>

        {/* Drawing Pen toggle */}
        <button
          onClick={() => {
            setPenMode(!penMode);
            setLaserMode(false);
          }}
          className={`p-2 rounded-xl transition-colors ${
            penMode ? 'bg-indigo-500 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Pen Annotation (P)"
        >
          <PenTool className="h-4 w-4" />
        </button>

        {penMode && (
          <div className="flex items-center gap-1 pl-1">
            {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff'].map((color) => (
              <button
                key={color}
                onClick={() => setPenColor(color)}
                style={{ backgroundColor: color }}
                className={`w-4 h-4 rounded-full border border-white/40 ${
                  penColor === color ? 'ring-2 ring-white scale-110' : ''
                }`}
              />
            ))}
            <button
              onClick={clearCanvas}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-rose-400 ml-1"
              title="Clear drawings"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Black / White Screen */}
        <button
          onClick={() => {
            setBlackScreen(!blackScreen);
            setWhiteScreen(false);
          }}
          className={`p-2 rounded-xl transition-colors ${
            blackScreen ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Black Screen (B)"
        >
          <Moon className="h-4 w-4" />
        </button>

        {/* Slide Selector Drawer toggle */}
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className={`p-2 rounded-xl transition-colors ${
            showDrawer ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Slide Thumbnails Drawer"
        >
          <Layers className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Close presentation */}
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
          title="Exit Fullscreen (ESC)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Slide Thumbnails Drawer Modal */}
      {showDrawer && (
        <div className="fixed inset-x-0 bottom-24 z-50 max-w-5xl mx-auto bg-slate-900/95 backdrop-blur-2xl border border-slate-700 rounded-3xl p-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Jump to Slide
            </span>
            <button
              onClick={() => setShowDrawer(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {activeSlides.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  setShowDrawer(false);
                }}
                className={`flex-shrink-0 w-36 aspect-video rounded-xl border p-2 cursor-pointer transition-all ${
                  currentSlideIndex === idx
                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-slate-800 shadow-lg scale-105'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/60'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                <p className="text-[10px] font-semibold text-slate-200 truncate mt-1">
                  {s.title || 'Slide ' + (idx + 1)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
