import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FileItem } from '@/types/file';
import { CanvasSlideData } from '@/types/canvas';
import {
  MasterPresentationData,
  MasterSlide,
  MasterSlideObject,
  SlideAspect,
  SlideLayoutKind,
  SlideThemeId,
  ShapeKind,
  TransitionType,
  AnimationType,
} from './types';
import { SlideTemplates } from './services/SlideTemplates';
import { SlideExportService } from './services/SlideExportService';
import { MasterSlidesSidebar } from './components/MasterSlidesSidebar';
import { MasterSlidesToolbar } from './components/MasterSlidesToolbar';
import { MasterSlidesCanvas } from './components/MasterSlidesCanvas';
import { MasterSlidesPresentationMode } from './components/MasterSlidesPresentationMode';
import { MasterSlidesPresenterView } from './components/MasterSlidesPresenterView';
import { MasterSlidesSorterModal } from './components/MasterSlidesSorterModal';
import { MasterSlidesThemesModal } from './components/MasterSlidesThemesModal';
import { MasterSlidesTemplatesModal } from './components/MasterSlidesTemplatesModal';
import { MasterSlidesCommandPalette } from './components/MasterSlidesCommandPalette';
import { MasterSlidesContextMenu } from './components/MasterSlidesContextMenu';

interface MasterSlidesEditorProps {
  initialFile?: FileItem | null;
  initialData?: CanvasSlideData | MasterPresentationData | null;
  onSave?: (data: any) => Promise<void>;
}

export function MasterSlidesEditor({ initialFile, initialData, onSave }: MasterSlidesEditorProps) {
  const navigate = useNavigate();

  // Helper to initialize or normalize data to MasterPresentationData
  const normalizeData = (data: any): MasterPresentationData => {
    if (!data) return SlideTemplates.getPrebuiltDeck();
    if (data.slides && data.slides[0]?.objects) {
      return data as MasterPresentationData;
    }
    // Convert from legacy CanvasSlideData
    if (data.slides && data.slides[0]?.elements) {
      const convertedSlides: MasterSlide[] = data.slides.map((s: any, idx: number) => ({
        id: s.id || `slide-${idx + 1}`,
        title: s.title || `Slide ${idx + 1}`,
        layout: (s.layout as SlideLayoutKind) || 'title-content',
        bgTheme: (s.bgTheme === 'dark' ? 'dark-slate' : s.bgTheme === 'ocean' ? 'dark-slate' : s.bgTheme === 'corporate' ? 'corporate-indigo' : s.bgTheme === 'light' ? 'minimal-light' : 'dark-slate') as SlideThemeId,
        transition: { type: 'fade', durationSeconds: 0.5 },
        objects: (s.elements || []).map((el: any) => ({
          id: el.id,
          type: (el.type === 'title' || el.type === 'text' || el.type === 'bullet' ? 'text' : el.type) as any,
          content: el.content || '',
          x: el.x ?? 10,
          y: el.y ?? 20,
          width: el.width ?? 80,
          height: el.height ?? 20,
          zIndex: 1,
          format: {
            fontSize: el.fontSize || 20,
            bold: el.type === 'title',
            textColor: el.color,
            fillColor: el.bgColor,
          },
        })),
        notes: '',
      }));

      return {
        title: data.title || 'Untitled Presentation',
        version: 1,
        aspectRatio: '16:9',
        activeSlideId: convertedSlides[0]?.id || 'slide-1',
        slides: convertedSlides,
        defaultTheme: 'dark-slate',
        lastSavedAt: new Date().toISOString(),
      };
    }

    return SlideTemplates.getPrebuiltDeck();
  };

  const [presentation, setPresentation] = useState<MasterPresentationData>(() =>
    normalizeData(initialData)
  );
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Live preview triggers for transition and object animation
  const [previewTransitionTrigger, setPreviewTransitionTrigger] = useState(0);
  const [previewAnimationObjectId, setPreviewAnimationObjectId] = useState<string | null>(null);

  // Modals and Presentation views
  const [isPresenting, setIsPresenting] = useState(false);
  const [isPresenterView, setIsPresenterView] = useState(false);
  const [presentationStartIndex, setPresentationStartIndex] = useState(0);
  const [isThemesModalOpen, setIsThemesModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isSorterModalOpen, setIsSorterModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Right-click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    targetObjectId?: string | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    targetObjectId: null,
  });

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<MasterPresentationData[]>([]);
  const [redoStack, setRedoStack] = useState<MasterPresentationData[]>([]);

  // Save State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<any>(null);

  // Push history snapshot before mutating
  const pushHistory = useCallback((currentData: MasterPresentationData) => {
    setUndoStack((prev) => [...prev.slice(-25), currentData]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [presentation, ...prev]);
    setUndoStack((prev) => prev.slice(0, -1));
    setPresentation(previous);
    toast.info('Undo performed');
  }, [undoStack, presentation]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setUndoStack((prev) => [...prev, presentation]);
    setRedoStack((prev) => prev.slice(1));
    setPresentation(next);
    toast.info('Redo performed');
  }, [redoStack, presentation]);

  // Debounced auto-save to Master Cloud
  const triggerAutoSave = (updated: MasterPresentationData) => {
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
          toast.error('Failed to sync presentation to Master Cloud');
        }
      }
    }, 1200);
  };

  const updatePresentationState = (
    updater: (prev: MasterPresentationData) => MasterPresentationData
  ) => {
    pushHistory(presentation);
    setPresentation((prev) => {
      const next = updater(prev);
      triggerAutoSave(next);
      return next;
    });
  };

  const activeSlide: MasterSlide =
    presentation.slides[activeSlideIndex] || presentation.slides[0] || {
      id: 'slide-fallback',
      title: 'Slide 1',
      layout: 'title-content',
      bgTheme: 'dark-slate',
      objects: [],
    };

  const selectedObject: MasterSlideObject | null =
    activeSlide.objects.find((o) => o.id === selectedObjectId) || null;

  // Title update
  const handleUpdateTitle = (title: string) => {
    updatePresentationState((prev) => ({
      ...prev,
      title,
      lastSavedAt: new Date().toISOString(),
    }));
  };

  // Slide CRUD Actions
  const handleAddSlide = (layout: SlideLayoutKind = 'title-content') => {
    const newSlideId = 'slide-' + Date.now();
    const newSlide: MasterSlide = {
      id: newSlideId,
      title: `Slide ${presentation.slides.length + 1}`,
      layout,
      bgTheme: activeSlide.bgTheme || presentation.defaultTheme || 'dark-slate',
      transition: { type: 'fade', durationSeconds: 0.5 },
      objects: [
        {
          id: 'obj-title-' + Date.now(),
          type: 'text',
          content: 'New Slide Heading',
          x: 10,
          y: 12,
          width: 80,
          height: 14,
          zIndex: 1,
          format: { bold: true, fontSize: 32, textColor: '#ffffff' },
          animation: { type: 'fade-in', trigger: 'after-previous', durationMs: 400 },
        },
        {
          id: 'obj-body-' + Date.now(),
          type: 'text',
          content: '• Key strategic objective\n• Supporting analysis\n• Projected timeline and next steps',
          x: 10,
          y: 32,
          width: 80,
          height: 50,
          zIndex: 1,
          format: { fontSize: 18, textColor: '#cbd5e1' },
          animation: { type: 'slide-up', trigger: 'on-click', durationMs: 500 },
        },
      ],
      notes: '',
    };

    updatePresentationState((prev) => {
      const newSlides = [...prev.slides, newSlide];
      return {
        ...prev,
        slides: newSlides,
        activeSlideId: newSlideId,
      };
    });
    setActiveSlideIndex(presentation.slides.length);
    setSelectedObjectId(null);
    toast.success('Slide added');
  };

  const handleDuplicateSlide = (index: number) => {
    const target = presentation.slides[index];
    if (!target) return;

    const clone: MasterSlide = {
      ...target,
      id: 'slide-' + Date.now(),
      title: `${target.title} (Copy)`,
      objects: target.objects.map((obj) => ({
        ...obj,
        id: 'obj-' + Math.random().toString(36).substring(2, 9),
      })),
    };

    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides.splice(index + 1, 0, clone);
      return { ...prev, slides: updatedSlides };
    });
    setActiveSlideIndex(index + 1);
    toast.success('Slide duplicated');
  };

  const handleDeleteSlide = (index: number) => {
    if (presentation.slides.length <= 1) {
      toast.warning('A presentation must contain at least one slide.');
      return;
    }

    updatePresentationState((prev) => {
      const updatedSlides = prev.slides.filter((_, i) => i !== index);
      const newIdx = Math.max(0, Math.min(activeSlideIndex, updatedSlides.length - 1));
      return {
        ...prev,
        slides: updatedSlides,
        activeSlideId: updatedSlides[newIdx]?.id,
      };
    });
    setActiveSlideIndex((prev) => Math.max(0, Math.min(prev, presentation.slides.length - 2)));
    toast.success('Slide deleted');
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down' | 'left' | 'right') => {
    const isForward = direction === 'down' || direction === 'right';
    const targetIdx = isForward ? index + 1 : index - 1;
    if (targetIdx < 0 || targetIdx >= presentation.slides.length) return;

    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      const temp = updatedSlides[index];
      updatedSlides[index] = updatedSlides[targetIdx];
      updatedSlides[targetIdx] = temp;
      return { ...prev, slides: updatedSlides };
    });
    setActiveSlideIndex(targetIdx);
  };

  const handleToggleHideSlide = (index: number) => {
    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[index] = {
        ...updatedSlides[index],
        isHidden: !updatedSlides[index].isHidden,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const handleChangeSlideTheme = (themeId: SlideThemeId) => {
    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        bgTheme: themeId,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const handleApplyThemeAll = (themeId: SlideThemeId) => {
    updatePresentationState((prev) => ({
      ...prev,
      defaultTheme: themeId,
      slides: prev.slides.map((s) => ({ ...s, bgTheme: themeId })),
    }));
    toast.success('Theme applied to all slides');
  };

  const handleChangeSlideLayout = (layout: SlideLayoutKind) => {
    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        layout,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const handleChangeTransition = (type: TransitionType, duration: number, applyAll = false) => {
    updatePresentationState((prev) => {
      if (applyAll) {
        return {
          ...prev,
          slides: prev.slides.map((s) => ({
            ...s,
            transition: { type, durationSeconds: duration },
          })),
        };
      }
      const updatedSlides = [...prev.slides];
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        transition: { type, durationSeconds: duration },
      };
      return { ...prev, slides: updatedSlides };
    });
    setPreviewTransitionTrigger((prev) => prev + 1);
    if (applyAll) toast.success('Transition applied to all slides');
  };

  const handlePreviewTransition = () => {
    setPreviewTransitionTrigger((prev) => prev + 1);
  };

  const handleChangeAnimation = (anim: {
    type: AnimationType;
    trigger: 'on-click' | 'after-previous';
    durationMs?: number;
    delayMs?: number;
  }) => {
    if (selectedObjectId) {
      handleUpdateObject(selectedObjectId, {
        animation: anim,
      });
      setPreviewAnimationObjectId(selectedObjectId);
      setTimeout(() => setPreviewAnimationObjectId(null), (anim.durationMs || 500) + 200);
    }
  };

  const handlePreviewAnimation = () => {
    if (selectedObjectId) {
      setPreviewAnimationObjectId(selectedObjectId);
      const obj = activeSlide.objects.find((o) => o.id === selectedObjectId);
      const dur = (obj?.animation?.durationMs || 500) + 200;
      setTimeout(() => setPreviewAnimationObjectId(null), dur);
    }
  };

  const handleChangeAspect = (aspectRatio: SlideAspect) => {
    updatePresentationState((prev) => ({
      ...prev,
      aspectRatio,
    }));
  };

  // Object CRUD Actions
  const handleAddObject = (type: MasterSlideObject['type'], shapeKind?: ShapeKind) => {
    const newObjId = 'obj-' + Date.now();
    let content = 'New Text';
    let width = 40;
    let height = 20;

    if (type === 'shape') {
      content = shapeKind ? shapeKind.toUpperCase() : 'SHAPE';
      width = 25;
      height = 25;
    } else if (type === 'image') {
      content = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
      width = 50;
      height = 50;
    } else if (type === 'table') {
      content = 'Table Object';
      width = 60;
      height = 40;
    } else if (type === 'chart') {
      content = 'Interactive Chart Data';
      width = 50;
      height = 40;
    } else if (type === 'button') {
      content = 'CLICK TO EXPLORE';
      width = 30;
      height = 10;
    }

    const newObj: MasterSlideObject = {
      id: newObjId,
      type,
      shapeKind,
      content,
      x: 30,
      y: 35,
      width,
      height,
      zIndex: activeSlide.objects.length + 1,
      format: {
        fontSize: type === 'button' ? 14 : 20,
        fillColor: type === 'shape' ? '#3b82f6' : type === 'button' ? '#6366f1' : undefined,
        textColor: '#ffffff',
        borderRadius: type === 'button' ? 9999 : 8,
        align: 'center',
      },
      animation: {
        type: 'fade-in',
        trigger: 'on-click',
        durationMs: 500,
      },
    };

    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        objects: [...updatedSlides[activeSlideIndex].objects, newObj],
      };
      return { ...prev, slides: updatedSlides };
    });
    setSelectedObjectId(newObjId);
    setPreviewAnimationObjectId(newObjId);
    setTimeout(() => setPreviewAnimationObjectId(null), 600);
    toast.success(`Inserted ${type} object`);
  };

  const handleUpdateObject = (id: string, updates: Partial<MasterSlideObject>) => {
    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      const objects = updatedSlides[activeSlideIndex].objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      );
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        objects,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const handleDeleteObject = (id: string) => {
    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      const objects = updatedSlides[activeSlideIndex].objects.filter((obj) => obj.id !== id);
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        objects,
      };
      return { ...prev, slides: updatedSlides };
    });
    if (selectedObjectId === id) setSelectedObjectId(null);
  };

  const handleDuplicateObject = (id: string) => {
    const target = activeSlide.objects.find((o) => o.id === id);
    if (!target) return;

    const clone: MasterSlideObject = {
      ...target,
      id: 'obj-' + Math.random().toString(36).substring(2, 9),
      x: Math.min(80, target.x + 4),
      y: Math.min(80, target.y + 4),
      zIndex: activeSlide.objects.length + 1,
    };

    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        objects: [...updatedSlides[activeSlideIndex].objects, clone],
      };
      return { ...prev, slides: updatedSlides };
    });
    setSelectedObjectId(clone.id);
  };

  const handleBringForward = (id: string) => {
    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      const currentZ = updatedSlides[activeSlideIndex].objects.find((o) => o.id === id)?.zIndex || 1;
      const objects = updatedSlides[activeSlideIndex].objects.map((obj) =>
        obj.id === id ? { ...obj, zIndex: currentZ + 1 } : obj
      );
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        objects,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const handleSendBackward = (id: string) => {
    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      const currentZ = updatedSlides[activeSlideIndex].objects.find((o) => o.id === id)?.zIndex || 1;
      const objects = updatedSlides[activeSlideIndex].objects.map((obj) =>
        obj.id === id ? { ...obj, zIndex: Math.max(1, currentZ - 1) } : obj
      );
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        objects,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const handleToggleLockObject = (id: string) => {
    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      const objects = updatedSlides[activeSlideIndex].objects.map((obj) =>
        obj.id === id ? { ...obj, isLocked: !obj.isLocked } : obj
      );
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        objects,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const handleChangeSpeakerNotes = (notes: string) => {
    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        notes,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  // Export handlers
  const handleExportHtml = () => {
    SlideExportService.exportToHtmlDeck(presentation, `${presentation.title}.html`);
    toast.success('Downloaded interactive HTML presentation deck with transitions & animations');
  };

  const handleExportPdf = () => {
    SlideExportService.printPresentation(presentation);
  };

  const handleExportJson = () => {
    SlideExportService.exportToJson(presentation, `${presentation.title}.json`);
    toast.success('Downloaded raw presentation JSON');
  };

  const handleSaveManual = async () => {
    if (onSave) {
      setSaveStatus('saving');
      try {
        await onSave(presentation);
        setSaveStatus('saved');
        toast.success('Presentation saved to Master Cloud (10 TB Free)');
      } catch (err) {
        setSaveStatus('unsaved');
        toast.error('Failed to save presentation');
      }
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPresenting || isPresenterView) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'F5') {
        e.preventDefault();
        setPresentationStartIndex(e.shiftKey ? activeSlideIndex : 0);
        setIsPresenting(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveManual();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' && selectedObjectId) {
        handleDeleteObject(selectedObjectId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPresenting,
    isPresenterView,
    activeSlideIndex,
    selectedObjectId,
    handleUndo,
    handleRedo,
    handleSaveManual,
  ]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground select-none overflow-hidden font-sans">
      {/* Top Ribbon Toolbar */}
      <MasterSlidesToolbar
        presentation={presentation}
        activeSlide={activeSlide}
        selectedObject={selectedObject}
        saveStatus={saveStatus}
        onUpdateTitle={handleUpdateTitle}
        onAddSlide={handleAddSlide}
        onAddObject={handleAddObject}
        onUpdateSelectedObject={(updates) =>
          selectedObjectId && handleUpdateObject(selectedObjectId, updates)
        }
        onDeleteSelectedObject={() => selectedObjectId && handleDeleteObject(selectedObjectId)}
        onDuplicateSelectedObject={() =>
          selectedObjectId && handleDuplicateObject(selectedObjectId)
        }
        onChangeSlideTheme={handleChangeSlideTheme}
        onChangeSlideLayout={handleChangeSlideLayout}
        onChangeTransition={handleChangeTransition}
        onChangeAnimation={handleChangeAnimation}
        onPreviewTransition={handlePreviewTransition}
        onPreviewAnimation={handlePreviewAnimation}
        onChangeAspect={handleChangeAspect}
        onStartPresentation={(startFromCurrent) => {
          setPresentationStartIndex(startFromCurrent ? activeSlideIndex : 0);
          setIsPresenting(true);
        }}
        onOpenPresenterView={() => setIsPresenterView(true)}
        onOpenThemesModal={() => setIsThemesModalOpen(true)}
        onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
        onOpenSorterModal={() => setIsSorterModalOpen(true)}
        onExportHtml={handleExportHtml}
        onExportPdf={handleExportPdf}
        onExportJson={handleExportJson}
        onSaveManual={handleSaveManual}
        zoomLevel={zoomLevel}
        onChangeZoom={setZoomLevel}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Thumbnails Strip */}
        <MasterSlidesSidebar
          slides={presentation.slides}
          activeSlideIndex={activeSlideIndex}
          onSelectSlide={(idx) => {
            setActiveSlideIndex(idx);
            setSelectedObjectId(null);
          }}
          onAddSlide={handleAddSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onMoveSlide={(idx, dir) => handleMoveSlide(idx, dir)}
          onToggleHideSlide={handleToggleHideSlide}
          onOpenSorter={() => setIsSorterModalOpen(true)}
          onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        />

        {/* Central 16:9 Canvas Stage */}
        <MasterSlidesCanvas
          slide={activeSlide}
          selectedObjectId={selectedObjectId}
          onSelectObject={setSelectedObjectId}
          onUpdateObject={handleUpdateObject}
          onDeleteObject={handleDeleteObject}
          onContextMenu={(e, objId) => {
            e.preventDefault();
            setContextMenu({
              isOpen: true,
              x: e.clientX,
              y: e.clientY,
              targetObjectId: objId || null,
            });
          }}
          speakerNotes={activeSlide.notes || ''}
          onChangeSpeakerNotes={handleChangeSpeakerNotes}
          previewTransitionTrigger={previewTransitionTrigger}
          previewAnimationObjectId={previewAnimationObjectId}
        />
      </div>

      {/* FULLSCREEN AUDIENCE PRESENTATION MODE */}
      {isPresenting && (
        <MasterSlidesPresentationMode
          presentation={presentation}
          initialSlideIndex={presentationStartIndex}
          onClose={() => setIsPresenting(false)}
          onOpenPresenterView={() => {
            setIsPresenting(false);
            setIsPresenterView(true);
          }}
        />
      )}

      {/* DUAL MONITOR PRESENTER STUDIO VIEW */}
      {isPresenterView && (
        <MasterSlidesPresenterView
          presentation={presentation}
          initialSlideIndex={activeSlideIndex}
          onClose={() => setIsPresenterView(false)}
          onOpenFullscreenPresentation={() => {
            setIsPresenterView(false);
            setIsPresenting(true);
          }}
        />
      )}

      {/* SLIDE SORTER MODAL */}
      {isSorterModalOpen && (
        <MasterSlidesSorterModal
          slides={presentation.slides}
          activeSlideIndex={activeSlideIndex}
          onClose={() => setIsSorterModalOpen(false)}
          onSelectSlide={(idx) => {
            setActiveSlideIndex(idx);
            setSelectedObjectId(null);
          }}
          onAddSlide={() => handleAddSlide('title-content')}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onMoveSlide={(idx, dir) => handleMoveSlide(idx, dir)}
          onToggleHideSlide={handleToggleHideSlide}
        />
      )}

      {/* THEMES STUDIO MODAL */}
      {isThemesModalOpen && (
        <MasterSlidesThemesModal
          currentThemeId={activeSlide.bgTheme}
          onClose={() => setIsThemesModalOpen(false)}
          onSelectTheme={(themeId, applyToAll) => {
            if (applyToAll) handleApplyThemeAll(themeId);
            else handleChangeSlideTheme(themeId);
          }}
        />
      )}

      {/* TEMPLATES GALLERY MODAL */}
      {isTemplatesModalOpen && (
        <MasterSlidesTemplatesModal
          onClose={() => setIsTemplatesModalOpen(false)}
          onApplyTemplate={(deck) => {
            updatePresentationState(() => deck);
            setActiveSlideIndex(0);
            setSelectedObjectId(null);
            toast.success(`Loaded template: ${deck.title}`);
          }}
        />
      )}

      {/* QUICK COMMAND PALETTE (CTRL+K) */}
      <MasterSlidesCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onAddSlide={() => handleAddSlide('title-content')}
        onStartPresentation={() => setIsPresenting(true)}
        onOpenPresenterView={() => setIsPresenterView(true)}
        onOpenSorter={() => setIsSorterModalOpen(true)}
        onOpenThemes={() => setIsThemesModalOpen(true)}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onExportHtml={handleExportHtml}
        onExportPdf={handleExportPdf}
        onExportJson={handleExportJson}
        onSaveManual={handleSaveManual}
        onDuplicateSlide={() => handleDuplicateSlide(activeSlideIndex)}
        onDeleteSlide={() => handleDeleteSlide(activeSlideIndex)}
      />

      {/* RIGHT-CLICK CONTEXT MENU */}
      {contextMenu.isOpen && (
        <MasterSlidesContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetObjectId={contextMenu.targetObjectId}
          targetObject={
            contextMenu.targetObjectId
              ? activeSlide.objects.find((o) => o.id === contextMenu.targetObjectId)
              : null
          }
          onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
          onAddSlide={() => handleAddSlide('title-content')}
          onDuplicateSlide={() => handleDuplicateSlide(activeSlideIndex)}
          onDeleteSlide={() => handleDeleteSlide(activeSlideIndex)}
          onDuplicateObject={handleDuplicateObject}
          onDeleteObject={handleDeleteObject}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onToggleLockObject={handleToggleLockObject}
          onStartPresentation={() => setIsPresenting(true)}
          onOpenThemes={() => setIsThemesModalOpen(true)}
          onAddObject={handleAddObject}
        />
      )}
    </div>
  );
}
