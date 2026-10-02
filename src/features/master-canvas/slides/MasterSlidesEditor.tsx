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
  SlideMaster,
  SlideComment,
} from './types';
import { SlideTemplates } from './services/SlideTemplates';
import { SlideExportService } from './services/SlideExportService';
import { SlideSyncService, SyncState } from './services/SlideSyncService';
import { SlideImportService } from './services/SlideImportService';
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
import { MasterSlidesLayersPanel } from './components/MasterSlidesLayersPanel';
import { MasterSlidesAnimationTimeline } from './components/MasterSlidesAnimationTimeline';
import { MasterSlidesCommentsPanel } from './components/MasterSlidesCommentsPanel';
import { MasterSlidesHealthModal } from './components/MasterSlidesHealthModal';
import { MasterSlidesVersionHistoryModal } from './components/MasterSlidesVersionHistoryModal';
import { MasterSlidesMasterView } from './components/MasterSlidesMasterView';
import { MasterSlidesHandoutModal } from './components/MasterSlidesHandoutModal';
import { MasterSlidesIntegrationsModal } from './components/MasterSlidesIntegrationsModal';

interface MasterSlidesEditorProps {
  initialFile?: FileItem | null;
  initialData?: CanvasSlideData | MasterPresentationData | null;
  onSave?: (data: any) => Promise<void>;
}

export function MasterSlidesEditor({ initialFile, initialData, onSave }: MasterSlidesEditorProps) {
  const navigate = useNavigate();

  // Normalize or initialize presentation data
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
        bgTheme: (s.bgTheme === 'dark'
          ? 'dark-slate'
          : s.bgTheme === 'ocean'
          ? 'dark-slate'
          : s.bgTheme === 'corporate'
          ? 'corporate-indigo'
          : s.bgTheme === 'light'
          ? 'minimal-light'
          : 'dark-slate') as SlideThemeId,
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

  // Live preview triggers
  const [previewTransitionTrigger, setPreviewTransitionTrigger] = useState(0);
  const [previewAnimationObjectId, setPreviewAnimationObjectId] = useState<string | null>(null);

  // Modals and Panels state
  const [isPresenting, setIsPresenting] = useState(false);
  const [isPresenterView, setIsPresenterView] = useState(false);
  const [presentationStartIndex, setPresentationStartIndex] = useState(0);
  const [isThemesModalOpen, setIsThemesModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isSorterModalOpen, setIsSorterModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  const [isAnimationPaneOpen, setIsAnimationPaneOpen] = useState(false);
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);
  const [isMasterViewOpen, setIsMasterViewOpen] = useState(false);
  const [isHandoutModalOpen, setIsHandoutModalOpen] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);

  // Canvas visual settings
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);

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

  // Save & Sync State
  const [saveStatus, setSaveStatus] = useState<SyncState>('saved');
  const saveTimeoutRef = useRef<any>(null);

  // Listen to network status
  useEffect(() => {
    const unsubscribe = SlideSyncService.subscribeNetworkStatus((isOnline) => {
      if (!isOnline) {
        setSaveStatus('offline');
        toast.warning('Working in offline mode. Changes are saved locally to cache.');
      } else {
        setSaveStatus('unsaved');
        triggerAutoSave(presentation);
        toast.success('Connection restored. Syncing presentation to Master Cloud...');
      }
    });
    return unsubscribe;
  }, [presentation]);

  // Check for recovery draft on mount
  useEffect(() => {
    const fileId = initialFile?.id || 'current_doc';
    const draft = SlideSyncService.getRecoverableDraft(fileId);
    if (draft && new Date(draft.savedAt).getTime() > new Date(presentation.lastSavedAt).getTime()) {
      toast.info('Found newer unsaved recovery draft from your previous session.', {
        action: {
          label: 'Restore',
          onClick: () => {
            setPresentation(draft.presentation);
            toast.success('Restored previous unsaved session.');
          },
        },
      });
    }
  }, [initialFile]);

  // Push history snapshot before mutating
  const pushHistory = useCallback((currentData: MasterPresentationData) => {
    setUndoStack((prev) => [...prev.slice(-30), currentData]);
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

  // Debounced auto-save to Master Cloud with local offline caching
  const triggerAutoSave = (updated: MasterPresentationData) => {
    // 1. Immediately cache locally for crash resiliency
    const fileId = initialFile?.id || 'current_doc';
    SlideSyncService.saveOfflineDraft(fileId, updated);

    if (!SlideSyncService.isOnline()) {
      setSaveStatus('offline');
      return;
    }

    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (onSave) {
        setSaveStatus('saving');
        try {
          await onSave(updated);
          setSaveStatus('saved');
          SlideSyncService.clearRecoveryDraft(fileId);
        } catch (err) {
          setSaveStatus('unsaved');
          toast.error('Failed to sync presentation to Master Cloud. Cached locally.');
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
    presentation.slides[activeSlideIndex] ||
    presentation.slides[0] || {
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
    trigger: 'on-click' | 'after-previous' | 'with-previous';
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
      name: `${type.toUpperCase()} Element`,
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

  const handleBringToFront = (id: string) => {
    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      const maxZ = Math.max(...updatedSlides[activeSlideIndex].objects.map((o) => o.zIndex || 1), 1);
      const objects = updatedSlides[activeSlideIndex].objects.map((obj) =>
        obj.id === id ? { ...obj, zIndex: maxZ + 1 } : obj
      );
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        objects,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const handleSendToBack = (id: string) => {
    updatePresentationState((prev) => {
      const updatedSlides = [...prev.slides];
      const objects = updatedSlides[activeSlideIndex].objects.map((obj) =>
        obj.id === id ? { ...obj, zIndex: 0 } : obj
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

  // Comments Handlers
  const handleAddComment = (text: string, targetObjectId?: string) => {
    const newComment: SlideComment = {
      id: 'comment-' + Date.now(),
      slideId: activeSlide.id,
      targetObjectId,
      author: 'Lead Presenter',
      text,
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };
    updatePresentationState((prev) => ({
      ...prev,
      comments: [...(prev.comments || []), newComment],
    }));
    toast.success('Comment posted');
  };

  const handleAddCommentReply = (commentId: string, text: string) => {
    updatePresentationState((prev) => {
      const comments = (prev.comments || []).map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: [
                ...c.replies,
                {
                  id: 'reply-' + Date.now(),
                  author: 'Collaborator',
                  text,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : c
      );
      return { ...prev, comments };
    });
  };

  const handleToggleResolveComment = (commentId: string) => {
    updatePresentationState((prev) => {
      const comments = (prev.comments || []).map((c) =>
        c.id === commentId ? { ...c, resolved: !c.resolved } : c
      );
      return { ...prev, comments };
    });
  };

  const handleDeleteComment = (commentId: string) => {
    updatePresentationState((prev) => ({
      ...prev,
      comments: (prev.comments || []).filter((c) => c.id !== commentId),
    }));
  };

  // Version Snapshots Handlers
  const handleCreateSnapshot = (title: string, description: string) => {
    const snapshotItem = {
      id: 'ver-' + Date.now(),
      timestamp: new Date().toISOString(),
      author: 'Master Cloud Engineer',
      title,
      description,
      slideCount: presentation.slides.length,
      snapshotData: JSON.parse(JSON.stringify(presentation)),
    };
    updatePresentationState((prev) => ({
      ...prev,
      versions: [snapshotItem, ...(prev.versions || [])],
    }));
    toast.success(`Saved revision snapshot: ${title}`);
  };

  const handleRestoreVersion = (snapshotData: MasterPresentationData) => {
    pushHistory(presentation);
    setPresentation(snapshotData);
    setActiveSlideIndex(0);
    triggerAutoSave(snapshotData);
    toast.success('Restored previous version revision.');
  };

  // Slide Master Handler
  const handleUpdateMaster = (master: SlideMaster) => {
    updatePresentationState((prev) => ({
      ...prev,
      master,
      defaultTheme: master.bgTheme,
      headerText: master.headerText,
      footerText: master.footerText,
      showSlideNumbers: master.showSlideNumbers,
      slides: prev.slides.map((s) => ({ ...s, bgTheme: master.bgTheme })),
    }));
    toast.success('Applied Slide Master across presentation.');
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
        onOpenMasterView={() => setIsMasterViewOpen(true)}
        onOpenHealthModal={() => setIsHealthModalOpen(true)}
        onOpenVersionHistoryModal={() => setIsVersionHistoryModalOpen(true)}
        onOpenHandoutModal={() => setIsHandoutModalOpen(true)}
        onOpenIntegrationsModal={() => setIsIntegrationsModalOpen(true)}
        onToggleLayersPanel={() => setIsLayersPanelOpen((prev) => !prev)}
        onToggleAnimationPane={() => setIsAnimationPaneOpen((prev) => !prev)}
        onToggleComments={() => setIsCommentsPanelOpen((prev) => !prev)}
        onExportHtml={handleExportHtml}
        onExportPdf={handleExportPdf}
        onExportJson={handleExportJson}
        onSaveManual={handleSaveManual}
        zoomLevel={zoomLevel}
        onChangeZoom={setZoomLevel}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((prev) => !prev)}
        showRulers={showRulers}
        onToggleRulers={() => setShowRulers((prev) => !prev)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
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
          zoomLevel={zoomLevel}
          showGrid={showGrid}
          showRulers={showRulers}
        />

        {/* Right Collapsible Panels */}
        {isLayersPanelOpen && (
          <MasterSlidesLayersPanel
            slide={activeSlide}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onUpdateObject={handleUpdateObject}
            onDeleteObject={handleDeleteObject}
            onDuplicateObject={handleDuplicateObject}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            onClose={() => setIsLayersPanelOpen(false)}
          />
        )}

        {isAnimationPaneOpen && (
          <MasterSlidesAnimationTimeline
            slide={activeSlide}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onUpdateObject={handleUpdateObject}
            onPreviewSequence={handlePreviewTransition}
            onClose={() => setIsAnimationPaneOpen(false)}
          />
        )}

        {isCommentsPanelOpen && (
          <MasterSlidesCommentsPanel
            slideId={activeSlide.id}
            slideIndex={activeSlideIndex}
            comments={presentation.comments || []}
            selectedObjectId={selectedObjectId}
            onAddComment={handleAddComment}
            onAddReply={handleAddCommentReply}
            onToggleResolve={handleToggleResolveComment}
            onDeleteComment={handleDeleteComment}
            onClose={() => setIsCommentsPanelOpen(false)}
          />
        )}
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

      {/* SLIDE MASTER STUDIO VIEW */}
      {isMasterViewOpen && (
        <MasterSlidesMasterView
          presentation={presentation}
          onUpdateMaster={handleUpdateMaster}
          onClose={() => setIsMasterViewOpen(false)}
        />
      )}

      {/* DOCUMENT QUALITY & ACCESSIBILITY INSPECTOR */}
      {isHealthModalOpen && (
        <MasterSlidesHealthModal
          presentation={presentation}
          onClose={() => setIsHealthModalOpen(false)}
          onJumpToSlide={(sIdx, objId) => {
            setActiveSlideIndex(sIdx);
            if (objId) setSelectedObjectId(objId);
          }}
        />
      )}

      {/* VERSION HISTORY & SNAPSHOTS MODAL */}
      {isVersionHistoryModalOpen && (
        <MasterSlidesVersionHistoryModal
          presentation={presentation}
          onClose={() => setIsVersionHistoryModalOpen(false)}
          onCreateSnapshot={handleCreateSnapshot}
          onRestoreVersion={handleRestoreVersion}
        />
      )}

      {/* HANDOUTS & PRINT SETUP MODAL */}
      {isHandoutModalOpen && (
        <MasterSlidesHandoutModal
          presentation={presentation}
          onClose={() => setIsHandoutModalOpen(false)}
        />
      )}

      {/* MASTER CLOUD ECOSYSTEM INTEGRATIONS MODAL */}
      {isIntegrationsModalOpen && (
        <MasterSlidesIntegrationsModal
          onClose={() => setIsIntegrationsModalOpen(false)}
          onInsertObject={(obj) => {
            updatePresentationState((prev) => {
              const updatedSlides = [...prev.slides];
              updatedSlides[activeSlideIndex] = {
                ...updatedSlides[activeSlideIndex],
                objects: [...updatedSlides[activeSlideIndex].objects, obj],
              };
              return { ...prev, slides: updatedSlides };
            });
            setSelectedObjectId(obj.id);
            toast.success(`Embedded live data from ${obj.linkedDataSource?.sourceApp || 'Master Cloud'}`);
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
