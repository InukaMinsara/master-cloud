import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Presentation,
  Play,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Palette,
  CheckCircle2,
  Clock,
  Layout,
  Type,
  Maximize2,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { CanvasSlideData, SlideItem, SlideElement } from '@/types/canvas';
import { CanvasService } from '@/services/canvasService';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';

interface MasterSlidesEditorProps {
  initialFile?: FileItem | null;
  initialData?: CanvasSlideData | null;
  onSave?: (data: CanvasSlideData) => Promise<void>;
}

const THEME_STYLES: Record<SlideItem['bgTheme'], { bg: string; text: string; subtext: string; card: string }> = {
  dark: {
    bg: 'bg-slate-900',
    text: 'text-white',
    subtext: 'text-slate-400',
    card: 'bg-slate-800/80 border-slate-700',
  },
  ocean: {
    bg: 'bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950',
    text: 'text-cyan-50',
    subtext: 'text-cyan-300/80',
    card: 'bg-blue-900/40 border-blue-700/50',
  },
  corporate: {
    bg: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950',
    text: 'text-indigo-50',
    subtext: 'text-indigo-300/80',
    card: 'bg-indigo-900/40 border-indigo-700/50',
  },
  midnight: {
    bg: 'bg-black',
    text: 'text-zinc-100',
    subtext: 'text-zinc-400',
    card: 'bg-zinc-900 border-zinc-800',
  },
  light: {
    bg: 'bg-white',
    text: 'text-slate-900',
    subtext: 'text-slate-600',
    card: 'bg-slate-100 border-slate-200',
  },
};

export function MasterSlidesEditor({ initialFile, initialData, onSave }: MasterSlidesEditorProps) {
  const navigate = useNavigate();
  const [slideData, setSlideData] = useState<CanvasSlideData>(() => initialData || CanvasService.getDefaultSlideData());
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (initialData) {
      setSlideData(initialData);
    }
  }, [initialData]);

  // Debounced auto-save
  const triggerAutoSave = (updated: CanvasSlideData) => {
    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (onSave) {
        setSaveStatus('saving');
        try {
          await onSave(updated);
          setSaveStatus('saved');
        } catch (err) {
          setSaveStatus('unsaved');
          toast.error('Failed to save slides');
        }
      }
    }, 1500);
  };

  const handleTitleChange = (newTitle: string) => {
    const updated = { ...slideData, title: newTitle };
    setSlideData(updated);
    triggerAutoSave(updated);
  };

  const activeSlide = slideData.slides[activeSlideIndex] || slideData.slides[0];

  // Slide CRUD
  const addSlide = () => {
    const newSlide: SlideItem = {
      id: 'slide-' + Date.now(),
      title: 'New Slide',
      layout: 'title-content',
      bgTheme: activeSlide?.bgTheme || 'dark',
      elements: [
        {
          id: 'el-' + Date.now(),
          type: 'title',
          content: 'New Slide Title',
          x: 10,
          y: 15,
          width: 80,
          height: 15,
          fontSize: 32,
        },
        {
          id: 'el-' + (Date.now() + 1),
          type: 'bullet',
          content: '• First key takeaway\n• Second supporting point\n• Next action step',
          x: 10,
          y: 35,
          width: 80,
          height: 50,
          fontSize: 18,
        },
      ],
    };
    const updatedSlides = [...slideData.slides, newSlide];
    const updated: CanvasSlideData = {
      ...slideData,
      slides: updatedSlides,
      activeSlideIndex: updatedSlides.length - 1,
    };
    setSlideData(updated);
    setActiveSlideIndex(updatedSlides.length - 1);
    triggerAutoSave(updated);
    toast.success('Slide added');
  };

  const duplicateSlide = (index: number) => {
    const target = slideData.slides[index];
    const clone: SlideItem = {
      ...target,
      id: 'slide-' + Date.now(),
      title: `${target.title} (Copy)`,
      elements: target.elements.map(el => ({ ...el, id: 'el-' + Math.random().toString(36).substring(2, 8) })),
    };
    const updatedSlides = [...slideData.slides];
    updatedSlides.splice(index + 1, 0, clone);
    const updated: CanvasSlideData = {
      ...slideData,
      slides: updatedSlides,
    };
    setSlideData(updated);
    setActiveSlideIndex(index + 1);
    triggerAutoSave(updated);
  };

  const deleteSlide = (index: number) => {
    if (slideData.slides.length <= 1) {
      toast.warning('A presentation must have at least one slide.');
      return;
    }
    const updatedSlides = slideData.slides.filter((_, i) => i !== index);
    const newIdx = Math.max(0, Math.min(activeSlideIndex, updatedSlides.length - 1));
    const updated: CanvasSlideData = {
      ...slideData,
      slides: updatedSlides,
      activeSlideIndex: newIdx,
    };
    setSlideData(updated);
    setActiveSlideIndex(newIdx);
    triggerAutoSave(updated);
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slideData.slides.length) return;

    const updatedSlides = [...slideData.slides];
    const temp = updatedSlides[index];
    updatedSlides[index] = updatedSlides[targetIdx];
    updatedSlides[targetIdx] = temp;

    const updated: CanvasSlideData = {
      ...slideData,
      slides: updatedSlides,
    };
    setSlideData(updated);
    setActiveSlideIndex(targetIdx);
    triggerAutoSave(updated);
  };

  const setSlideTheme = (theme: SlideItem['bgTheme']) => {
    const updatedSlides = [...slideData.slides];
    updatedSlides[activeSlideIndex] = {
      ...updatedSlides[activeSlideIndex],
      bgTheme: theme,
    };
    const updated = { ...slideData, slides: updatedSlides };
    setSlideData(updated);
    triggerAutoSave(updated);
  };

  // Element editing
  const updateElementContent = (elId: string, content: string) => {
    const updatedSlides = [...slideData.slides];
    const elements = updatedSlides[activeSlideIndex].elements.map(el =>
      el.id === elId ? { ...el, content } : el
    );
    updatedSlides[activeSlideIndex] = {
      ...updatedSlides[activeSlideIndex],
      elements,
    };
    const updated = { ...slideData, slides: updatedSlides };
    setSlideData(updated);
    triggerAutoSave(updated);
  };

  // Presentation Mode Keyboard Listener
  useEffect(() => {
    if (!isPresenting) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        setActiveSlideIndex(prev => Math.min(slideData.slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setActiveSlideIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        setIsPresenting(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPresenting, slideData.slides.length]);

  const currentTheme = THEME_STYLES[activeSlide?.bgTheme || 'dark'];

  return (
    <div className="flex flex-col h-full bg-background text-foreground select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-border/60 px-4 flex items-center justify-between bg-card/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/canvas')}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Master Canvas"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
              <Presentation className="h-4 w-4" />
            </div>
            <div>
              <input
                type="text"
                value={slideData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="font-bold text-sm bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none px-1 py-0.5 max-w-xs transition-colors"
                placeholder="Untitled Presentation"
              />
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Clock className="h-3 w-3 animate-spin" /> Saving to Master Cloud...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle2 className="h-3 w-3" /> All changes saved in Master Cloud
                  </span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="flex items-center gap-1 text-muted-foreground">Unsaved edits</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
            {(['dark', 'ocean', 'corporate', 'midnight', 'light'] as SlideItem['bgTheme'][]).map(theme => (
              <button
                key={theme}
                onClick={() => setSlideTheme(theme)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-lg capitalize transition-colors ${
                  activeSlide?.bgTheme === theme ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPresenting(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Present</span>
          </button>
        </div>
      </header>

      {/* Main Slide Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Thumbnails Panel */}
        <div className="w-56 border-r border-border/60 bg-card/30 flex flex-col shrink-0">
          <div className="p-3 border-b border-border/50 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Slides ({slideData.slides.length})
            </span>
            <button
              onClick={addSlide}
              className="p-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              title="Add Slide"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {slideData.slides.map((s, idx) => {
              const theme = THEME_STYLES[s.bgTheme];
              const isSelected = activeSlideIndex === idx;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 shadow-md bg-accent/40'
                      : 'border-border/60 hover:border-border hover:bg-accent/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-[10px] text-muted-foreground">
                    <span className="font-bold">#{idx + 1}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'up'); }}
                        disabled={idx === 0}
                        className="hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'down'); }}
                        disabled={idx === slideData.slides.length - 1}
                        className="hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }}
                        className="hover:text-foreground"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail Card View */}
                  <div className={`w-full aspect-video rounded-lg ${theme.bg} p-2 flex flex-col justify-center overflow-hidden border border-white/10 shadow-sm`}>
                    <p className={`text-[8px] font-bold ${theme.text} truncate text-center`}>
                      {s.elements.find(el => el.type === 'title')?.content || 'Untitled'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Central Slide View & Editor */}
        <div className="flex-1 bg-secondary/15 p-6 sm:p-10 flex items-center justify-center overflow-y-auto">
          <div
            className={`w-full max-w-4xl aspect-video rounded-2xl shadow-2xl p-8 sm:p-12 flex flex-col justify-between transition-all border border-border/60 ${currentTheme.bg}`}
          >
            {/* Slide Elements */}
            <div className="flex-1 flex flex-col justify-center space-y-6">
              {activeSlide?.elements.map((el) => {
                if (el.type === 'title') {
                  return (
                    <input
                      key={el.id}
                      type="text"
                      value={el.content}
                      onChange={(e) => updateElementContent(el.id, e.target.value)}
                      className={`w-full font-extrabold text-2xl sm:text-4xl bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary focus:outline-none transition-colors ${currentTheme.text}`}
                      placeholder="Slide Title..."
                    />
                  );
                }
                return (
                  <textarea
                    key={el.id}
                    value={el.content}
                    onChange={(e) => updateElementContent(el.id, e.target.value)}
                    rows={6}
                    className={`w-full bg-transparent resize-none border-none outline-none font-sans text-sm sm:text-lg leading-relaxed ${currentTheme.subtext} placeholder:text-muted-foreground/40`}
                    placeholder="Slide points and details..."
                  />
                );
              })}
            </div>

            {/* Slide Footer */}
            <div className="flex items-center justify-between text-[11px] opacity-40 text-foreground pt-4 border-t border-white/10">
              <span>{slideData.title}</span>
              <span>Slide {activeSlideIndex + 1} of {slideData.slides.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN PRESENTATION OVERLAY */}
      {isPresenting && (
        <div className={`fixed inset-0 z-50 flex flex-col justify-between p-12 ${currentTheme.bg}`}>
          {/* Top Bar (Overlay) */}
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest opacity-40 font-mono">
              Master Slides Presentation Mode (Press ESC to Exit)
            </span>
            <button
              onClick={() => setIsPresenting(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Presentation Slide Content */}
          <div className="max-w-5xl mx-auto w-full my-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
            {activeSlide?.elements.map(el => {
              if (el.type === 'title') {
                return (
                  <h1 key={el.id} className={`text-4xl sm:text-6xl font-black tracking-tight ${currentTheme.text}`}>
                    {el.content}
                  </h1>
                );
              }
              return (
                <div key={el.id} className={`text-xl sm:text-2xl leading-relaxed whitespace-pre-line ${currentTheme.subtext}`}>
                  {el.content}
                </div>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                disabled={activeSlideIndex === 0}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setActiveSlideIndex(prev => Math.min(slideData.slides.length - 1, prev + 1))}
                disabled={activeSlideIndex === slideData.slides.length - 1}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="text-sm font-mono opacity-50">
              {activeSlideIndex + 1} / {slideData.slides.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
