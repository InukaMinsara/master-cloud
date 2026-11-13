import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  Maximize2,
  Tv,
  ZoomIn,
  ZoomOut,
  Layers,
} from 'lucide-react';
import { MasterPresentationData, MasterSlide, SlideThemeConfig } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';

interface MasterSlidesPresenterViewProps {
  presentation: MasterPresentationData;
  initialSlideIndex?: number;
  onClose: () => void;
  onOpenFullscreenPresentation: () => void;
}

export function MasterSlidesPresenterView({
  presentation,
  initialSlideIndex = 0,
  onClose,
  onOpenFullscreenPresentation,
}: MasterSlidesPresenterViewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [notesFontSize, setNotesFontSize] = useState(16);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const activeSlides = presentation.slides.filter((s) => !s.isHidden);
  const currentSlide = activeSlides[currentSlideIndex] || activeSlides[0];
  const nextSlide = activeSlides[currentSlideIndex + 1];

  const themes = SlideTemplates.getThemes();
  const currentTheme = themes.find((t) => t.id === currentSlide?.bgTheme) || themes[0];
  const nextTheme = nextSlide ? themes.find((t) => t.id === nextSlide.bgTheme) || themes[0] : null;

  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Elapsed Presentation Timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        setCurrentSlideIndex((prev) => Math.min(activeSlides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeSlides.length, onClose]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
            <Tv className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{presentation.title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 uppercase tracking-wider">
                Presenter Studio
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenFullscreenPresentation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Fullscreen Audience Mode</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Exit Presenter View"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* LEFT COLUMN: Current Slide (Audience View) & Next Slide Preview */}
        <div className="lg:col-span-7 flex flex-col space-y-4 overflow-hidden">
          {/* Current Slide Big Frame */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Current Slide (Audience Live)
              </span>
              <span className="text-xs font-mono text-slate-400">
                Slide {currentSlideIndex + 1} of {activeSlides.length}
              </span>
            </div>

            {/* Slide Stage */}
            <div
              className={`flex-1 w-full rounded-xl overflow-hidden relative shadow-inner border border-slate-700/60 p-6 flex flex-col justify-between ${currentTheme.bgGradient}`}
            >
              {currentSlide?.objects.map((obj) => {
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
                    }}
                  >
                    {obj.type === 'text' && (
                      <div
                        style={{
                          fontSize: `${f.fontSize || 18}px`,
                          fontWeight: f.bold ? 'bold' : 'normal',
                          color: f.textColor || currentTheme.textColor,
                          textAlign: f.align || 'left',
                        }}
                        className="leading-relaxed whitespace-pre-line"
                      >
                        {obj.content}
                      </div>
                    )}
                    {obj.type === 'shape' && (
                      <div
                        style={{
                          backgroundColor: f.fillColor || currentTheme.accentColor,
                          borderRadius: `${f.borderRadius || 8}px`,
                          color: f.textColor || '#ffffff',
                        }}
                        className="w-full h-full flex items-center justify-center p-2 font-bold text-center text-xs shadow-md"
                      >
                        {obj.content}
                      </div>
                    )}
                    {obj.type === 'image' && (
                      <img src={obj.content} alt="" className="w-full h-full object-contain rounded-lg" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls Row */}
          <div className="h-14 bg-slate-900/90 border border-slate-800 rounded-2xl px-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentSlideIndex === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev Slide</span>
              </button>

              <button
                onClick={() => setCurrentSlideIndex((prev) => Math.min(activeSlides.length - 1, prev + 1))}
                disabled={currentSlideIndex === activeSlides.length - 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold disabled:opacity-30 transition-colors shadow-sm"
              >
                <span>Next Slide</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Navigation: <span className="text-slate-200 font-semibold">[Space]</span> or <span className="text-slate-200 font-semibold">[&rarr;]</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Next Slide Preview, Live Clocks, and Large Speaker Notes */}
        <div className="lg:col-span-5 flex flex-col space-y-4 overflow-hidden">
          {/* Live Clocks Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            {/* Elapsed Timer */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Elapsed Time
                </span>
                <span className="text-2xl font-mono font-black text-amber-400">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
                >
                  {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setElapsedSeconds(0)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Reset timer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Local Clock */}
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Current Time
              </span>
              <span className="text-xl font-mono font-bold text-slate-200">{currentTime}</span>
            </div>
          </div>

          {/* Next Slide Preview */}
          <div className="h-44 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Next Slide Up</span>
              <span>{nextSlide ? `Slide ${currentSlideIndex + 2}` : 'End of Deck'}</span>
            </div>

            <div className="flex-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden p-3 relative">
              {nextSlide ? (
                <div className="w-full text-center">
                  <p className="text-sm font-bold text-slate-200 truncate">
                    {nextSlide.title || 'Next Slide'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {nextSlide.objects.length} elements &bull; {nextSlide.layout}
                  </p>
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-500 italic">
                  End of Presentation Deck
                </span>
              )}
            </div>
          </div>

          {/* Speaker Notes (Prominent & Resizable Text) */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>Speaker Cues &amp; Talking Points</span>
              </div>

              {/* Font Size Scaling */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setNotesFontSize((prev) => Math.max(12, prev - 2))}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Smaller Notes Font"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-400">{notesFontSize}px</span>
                <button
                  onClick={() => setNotesFontSize((prev) => Math.min(28, prev + 2))}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Larger Notes Font"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {currentSlide?.notes ? (
                <p
                  style={{ fontSize: `${notesFontSize}px` }}
                  className="text-slate-200 leading-relaxed whitespace-pre-wrap font-sans"
                >
                  {currentSlide.notes}
                </p>
              ) : (
                <p className="text-xs text-slate-600 italic">
                  No presenter speaker notes entered for this slide.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
