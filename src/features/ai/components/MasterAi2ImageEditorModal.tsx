/**
 * src/features/ai/components/MasterAi2ImageEditorModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — DEDICATED IMAGE STUDIO & EDITOR WINDOW
 * Full-screen high-precision canvas editing suite:
 * - Zoom & pan controls (in, out, 100%, fit)
 * - Undo and Redo state history stack
 * - Interactive Crop tool with aspect-ratio presets (Free, 1:1, 16:9, 9:16, 4:3, 3:2)
 * - 90° rotation and horizontal/vertical flipping
 * - Live canvas adjustments: Brightness, Contrast, Saturation, Sharpness
 * - Aesthetic filter presets (Vivid, Cyberpunk, Monochrome, Warm, Cool, Vintage)
 * - Direct "Save to Master Cloud" Drive integration via masterCloudImageSaveService
 * - Direct PNG download & "Save Edited Copy to Chat"
 * - Clear disclosure regarding SenseNova text-to-image vs img2img capabilities
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Sliders,
  Sparkles,
  Download,
  CloudUpload,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo2,
  Redo2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Palette,
  Wand2,
  ArrowRight,
} from 'lucide-react';
import { masterCloudImageSaveService } from '../services/masterCloudImageSaveService';
import { fluxImageService } from '../services/fluxImageService';
import { toast } from 'sonner';

interface ImageEditorModalProps {
  isOpen: boolean;
  imageUrl: string;
  prompt: string;
  onClose: () => void;
  onSaveToChat?: (newImageUrl: string, prompt: string) => void;
}

type FilterPreset = 'none' | 'vivid' | 'cyberpunk' | 'mono' | 'warm' | 'cool' | 'vintage';

export function MasterAi2ImageEditorModal({
  isOpen,
  imageUrl,
  prompt,
  onClose,
  onSaveToChat,
}: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas Image & History State
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Zoom & Viewport
  const [zoom, setZoom] = useState<number>(1);

  // Adjustments
  const [brightness, setBrightness] = useState<number>(0); // -100 to 100
  const [contrast, setContrast] = useState<number>(0); // -100 to 100
  const [saturation, setSaturation] = useState<number>(0); // -100 to 100
  const [sharpness, setSharpness] = useState<number>(0); // 0 to 100
  const [activeFilter, setActiveFilter] = useState<FilterPreset>('none');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'ai-edit' | 'adjust' | 'filters' | 'transform' | 'crop'>('ai-edit');

  // AI Prompt Edit State (FLUX.2-klein-4b in Image Editing mode)
  const [aiEditPrompt, setAiEditPrompt] = useState<string>('');
  const [isApplyingAiEdit, setIsApplyingAiEdit] = useState<boolean>(false);
  const [aiEditError, setAiEditError] = useState<string | null>(null);
  const [aiEditLimitation, setAiEditLimitation] = useState<string | null>(null);
  const [editedResultUrl, setEditedResultUrl] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState<boolean>(false);

  // Crop State
  const [cropAspectRatio, setCropAspectRatio] = useState<'free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:2'>('free');

  // Save State
  const [isSavingToCloud, setIsSavingToCloud] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [savedToCloud, setSavedToCloud] = useState<boolean>(false);

  // Load and initialize the image on canvas
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    setIsLoadingImage(true);
    setLoadError(null);
    setHistory([]);
    setHistoryIndex(-1);
    setZoom(1);
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSharpness(0);
    setActiveFilter('none');
    setSavedToCloud(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Route through CORS-safe proxy if external
    const isBlob = imageUrl.startsWith('blob:') || imageUrl.startsWith('data:');
    img.src = isBlob ? imageUrl : `/api/ai/image/proxy?url=${encodeURIComponent(imageUrl)}`;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      setHistory([initialData]);
      setHistoryIndex(0);
      setIsLoadingImage(false);
    };

    img.onerror = () => {
      setIsLoadingImage(false);
      setLoadError('Could not load image into editor. Verify network connectivity.');
    };
  }, [isOpen, imageUrl]);

  // Push new state to history
  const pushState = useCallback((newData: ImageData) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newData];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetData = history[targetIndex];
      const canvas = canvasRef.current;
      if (canvas && targetData) {
        canvas.width = targetData.width;
        canvas.height = targetData.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx?.putImageData(targetData, 0, 0);
        setHistoryIndex(targetIndex);
      }
    }
  }, [historyIndex, history]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetData = history[targetIndex];
      const canvas = canvasRef.current;
      if (canvas && targetData) {
        canvas.width = targetData.width;
        canvas.height = targetData.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx?.putImageData(targetData, 0, 0);
        setHistoryIndex(targetIndex);
      }
    }
  }, [historyIndex, history]);

  // AI Natural Language Image Editing (FLUX.2-klein-4b in Image Editing mode)
  const handleApplyAiEdit = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || aiEditPrompt).trim();
    if (!promptToUse) {
      toast.warning('Please enter an editing instruction.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Canvas image not available');
      return;
    }

    setIsApplyingAiEdit(true);
    setAiEditError(null);
    setAiEditLimitation(null);

    try {
      const currentDataUri = canvas.toDataURL('image/png');
      toast.info('Dispatching editing request to NVIDIA FLUX.2-klein-4b...');

      const result = await fluxImageService.editImage({
        prompt: promptToUse,
        image: currentDataUri,
      });

      setEditedResultUrl(result.imageUrl);
      setShowComparison(true);
      toast.success('FLUX.2 Image Editing completed!');
    } catch (err: any) {
      const msg = err?.message || 'FLUX.2 Image Editing failed';
      setAiEditError(msg);
      if (msg.includes('Preview API Limitation') || msg.includes('example_id')) {
        setAiEditLimitation(msg);
      }
      toast.error(msg);
    } finally {
      setIsApplyingAiEdit(false);
    }
  };

  const handleApplyEditedResultToCanvas = () => {
    if (!editedResultUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = editedResultUrl;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const newImgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      pushState(newImgData);
      setShowComparison(false);
      toast.success('Applied AI edited result to canvas (Undo/Redo supported)');
    };
    img.onerror = () => {
      toast.error('Failed to load edited image onto canvas');
    };
  };

  // Rotate 90 degrees (clockwise or counter-clockwise)
  const handleRotate = (clockwise = true) => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex < 0) return;

    const currentData = history[historyIndex];
    const offscreen = document.createElement('canvas');
    offscreen.width = currentData.width;
    offscreen.height = currentData.height;
    const offCtx = offscreen.getContext('2d');
    offCtx?.putImageData(currentData, 0, 0);

    canvas.width = currentData.height;
    canvas.height = currentData.width;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((clockwise ? 90 : -90) * (Math.PI / 180));
    ctx.drawImage(offscreen, -offscreen.width / 2, -offscreen.height / 2);
    ctx.restore();

    const rotatedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    pushState(rotatedData);
    toast.success(clockwise ? 'Rotated 90° clockwise' : 'Rotated 90° counter-clockwise');
  };

  // Flip Horizontal or Vertical
  const handleFlip = (horizontal = true) => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex < 0) return;

    const currentData = history[historyIndex];
    const offscreen = document.createElement('canvas');
    offscreen.width = currentData.width;
    offscreen.height = currentData.height;
    const offCtx = offscreen.getContext('2d');
    offCtx?.putImageData(currentData, 0, 0);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    if (horizontal) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();

    const flippedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    pushState(flippedData);
    toast.success(horizontal ? 'Flipped horizontally' : 'Flipped vertically');
  };

  // Apply Adjustments (Brightness, Contrast, Saturation, Sharpness, Filters)
  const applyAdjustments = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex < 0) return;

    const baseData = history[historyIndex];
    const offscreen = document.createElement('canvas');
    offscreen.width = baseData.width;
    offscreen.height = baseData.height;
    const offCtx = offscreen.getContext('2d');
    offCtx?.putImageData(baseData, 0, 0);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Build CSS filter string
    const bVal = 100 + brightness;
    const cVal = 100 + contrast;
    const sVal = 100 + saturation;
    let extraFilters = '';

    if (activeFilter === 'vivid') extraFilters = 'saturate(140%) contrast(110%)';
    else if (activeFilter === 'cyberpunk') extraFilters = 'hue-rotate(290deg) contrast(125%) saturate(130%)';
    else if (activeFilter === 'mono') extraFilters = 'grayscale(100%) contrast(115%)';
    else if (activeFilter === 'warm') extraFilters = 'sepia(30%) saturate(120%)';
    else if (activeFilter === 'cool') extraFilters = 'hue-rotate(180deg) saturate(90%)';
    else if (activeFilter === 'vintage') extraFilters = 'sepia(50%) contrast(90%) brightness(105%)';

    ctx.filter = `brightness(${bVal}%) contrast(${cVal}%) saturate(${sVal}%) ${extraFilters}`.trim();
    ctx.drawImage(offscreen, 0, 0);
    ctx.filter = 'none';

    // Optional unsharp mask (sharpness pass)
    if (sharpness > 0) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      const w = canvas.width;
      const h = canvas.height;
      const factor = (sharpness / 100) * 0.6;

      // Simple 3x3 unsharp kernel
      const copy = new Uint8ClampedArray(d);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            const up = ((y - 1) * w + x) * 4 + c;
            const down = ((y + 1) * w + x) * 4 + c;
            const left = (y * w + (x - 1)) * 4 + c;
            const right = (y * w + (x + 1)) * 4 + c;
            const current = idx + c;

            const blurred = (copy[up] + copy[down] + copy[left] + copy[right]) * 0.25;
            const sharpVal = copy[current] + (copy[current] - blurred) * factor;
            d[current] = Math.min(255, Math.max(0, sharpVal));
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const adjustedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    pushState(adjustedData);
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSharpness(0);
    setActiveFilter('none');
    toast.success('Adjustments applied successfully!');
  }, [history, historyIndex, brightness, contrast, saturation, sharpness, activeFilter, pushState]);

  // Crop Center by Aspect Ratio
  const handleApplyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex < 0) return;

    const currentData = history[historyIndex];
    let targetRatio = currentData.width / currentData.height;

    if (cropAspectRatio === '1:1') targetRatio = 1;
    else if (cropAspectRatio === '16:9') targetRatio = 16 / 9;
    else if (cropAspectRatio === '9:16') targetRatio = 9 / 16;
    else if (cropAspectRatio === '4:3') targetRatio = 4 / 3;
    else if (cropAspectRatio === '3:2') targetRatio = 3 / 2;
    else {
      toast.info('Select a specific aspect ratio preset to crop.');
      return;
    }

    let cropW = currentData.width;
    let cropH = currentData.height;

    if (cropW / cropH > targetRatio) {
      cropW = Math.round(cropH * targetRatio);
    } else {
      cropH = Math.round(cropW / targetRatio);
    }

    const startX = Math.round((currentData.width - cropW) / 2);
    const startY = Math.round((currentData.height - cropH) / 2);

    const offscreen = document.createElement('canvas');
    offscreen.width = currentData.width;
    offscreen.height = currentData.height;
    const offCtx = offscreen.getContext('2d');
    offCtx?.putImageData(currentData, 0, 0);

    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(offscreen, startX, startY, cropW, cropH, 0, 0, cropW, cropH);

    const croppedData = ctx.getImageData(0, 0, cropW, cropH);
    pushState(croppedData);
    toast.success(`Cropped to ${cropAspectRatio} (${cropW}×${cropH}px)`);
  };

  // Download Edited Image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanPrompt = prompt.slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `edited_${cleanPrompt}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded edited image!');
    }, 'image/png');
  };

  // Save directly to Master Cloud Drive
  const handleSaveToCloud = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isSavingToCloud || savedToCloud) return;

    setIsSavingToCloud(true);
    setUploadProgress(10);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsSavingToCloud(false);
        toast.error('Could not export canvas bytes.');
        return;
      }

      try {
        setUploadProgress(40);
        const result = await masterCloudImageSaveService.saveToMasterCloud({
          blob,
          prompt: `Edited_${prompt}`,
          onProgress: (p) => setUploadProgress(Math.max(40, p)),
        });

        setSavedToCloud(true);
        setUploadProgress(100);
        toast.success(`Saved "${result.fileName}" to Master Cloud Drive folder "${result.folderName}"!`);
      } catch (err: any) {
        toast.error(`Cloud save error: ${err?.message || 'Could not save file'}`);
      } finally {
        setIsSavingToCloud(false);
      }
    }, 'image/png');
  };

  // Save as Edited Copy to Chat
  const handleSaveToChat = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSaveToChat?.(dataUrl, `[Edited Image]: ${prompt}`);
    toast.success('Inserted edited image into chat timeline!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col select-none animate-in fade-in duration-200">
      {/* Studio Header */}
      <header className="h-14 px-4 border-b border-white/[0.08] bg-zinc-950/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Master AI Image Studio</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
                {canvasRef.current ? `${canvasRef.current.width} × ${canvasRef.current.height}` : 'Loading...'}
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400 truncate max-w-sm sm:max-w-md">
              &ldquo;{prompt}&rdquo;
            </p>
          </div>
        </div>

        {/* Viewport Zoom & History Controls */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Undo last edit (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Redo edit (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.25, Number((z - 0.25).toFixed(2))))}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-zinc-300 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Reset Zoom to 100%"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Center Stage */}
        <div
          ref={containerRef}
          className="flex-1 bg-zinc-950/90 overflow-auto flex items-center justify-center p-8 relative"
        >
          {isLoadingImage ? (
            <div className="flex flex-col items-center gap-3 text-zinc-400 font-mono text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              <span>Initializing studio canvas...</span>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-3 text-red-400 max-w-sm text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm font-semibold">{loadError}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white/[0.08] text-white text-xs"
              >
                Close Studio
              </button>
            </div>
          ) : (
            <div
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="transition-transform duration-100 shadow-2xl rounded-lg overflow-hidden border border-white/10"
            >
              <canvas ref={canvasRef} className="block max-w-none" />
            </div>
          )}
        </div>

        {/* Right Tools & Adjustment Sidebar */}
        <div className="w-84 sm:w-96 border-l border-white/[0.08] bg-zinc-950/70 backdrop-blur-xl flex flex-col">
          {/* Tool Category Tabs */}
          <div className="p-2 border-b border-white/[0.08] grid grid-cols-5 gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('ai-edit')}
              className={`py-1.5 rounded-lg font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'ai-edit'
                  ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/40 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px]">AI Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('adjust')}
              className={`py-1.5 rounded-lg font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'adjust'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-[10px]">Tuning</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('filters')}
              className={`py-1.5 rounded-lg font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'filters'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="text-[10px]">Filters</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transform')}
              className={`py-1.5 rounded-lg font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'transform'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="text-[10px]">Transform</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('crop')}
              className={`py-1.5 rounded-lg font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'crop'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span className="text-[10px]">Crop</span>
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* 0. AI NATURAL LANGUAGE EDIT TAB (FLUX.2-klein-4b) */}
            {activeTab === 'ai-edit' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-300">
                      FLUX.2 Image Editing
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
                    NVIDIA NIM
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 block font-medium">
                    Natural Language Editing Prompt
                  </label>
                  <textarea
                    value={aiEditPrompt}
                    onChange={(e) => setAiEditPrompt(e.target.value)}
                    placeholder="Describe how to modify this image (e.g., 'Change background to a golden sunset beach', 'Remove unwanted object', 'Apply cyberpunk aesthetic')..."
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Quick Preset Editing Prompts */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-zinc-500">Quick Transform Presets</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '🌅 Sunset beach background',
                      '🌆 Cyberpunk neon city',
                      '✨ Cinematic studio lighting',
                      '🎨 Japanese anime illustration',
                      '🌿 Lush enchanted forest',
                      '🖼️ Oil painting aesthetic',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          const clean = chip.replace(/^[^a-zA-Z0-9]+/, '').trim();
                          setAiEditPrompt(clean);
                        }}
                        className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-zinc-300 border border-white/10 transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply AI Edit Button */}
                <button
                  type="button"
                  onClick={() => handleApplyAiEdit()}
                  disabled={isApplyingAiEdit || !aiEditPrompt.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-opacity cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  {isApplyingAiEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing with FLUX.2-klein-4b...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Apply AI Transformation</span>
                    </>
                  )}
                </button>

                {/* API Limitation Notice if reported by NVIDIA NIM */}
                {aiEditLimitation && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>NVIDIA Preview API Notice</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      {aiEditLimitation}
                    </p>
                  </div>
                )}

                {/* Edited Result & Before/After Comparison Card */}
                {editedResultUrl && (
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">Edited Result (FLUX.2)</span>
                      <button
                        type="button"
                        onClick={() => setShowComparison(!showComparison)}
                        className="text-[10px] text-orange-400 hover:underline cursor-pointer"
                      >
                        {showComparison ? 'Hide Before/After' : 'View Comparison'}
                      </button>
                    </div>

                    {/* Side-by-side or Preview */}
                    {showComparison ? (
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-zinc-400">
                        <div>
                          <div className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40 mb-1">
                            <img src={imageUrl} alt="Before" className="w-full h-full object-cover" />
                          </div>
                          <span>Original</span>
                        </div>
                        <div>
                          <div className="aspect-square rounded-lg overflow-hidden border border-orange-500/40 bg-black/40 mb-1">
                            <img src={editedResultUrl} alt="After" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-orange-300 font-semibold">FLUX.2 Edited</span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg overflow-hidden border border-orange-500/30 bg-black/40">
                        <img src={editedResultUrl} alt="Edited preview" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Actions for Edited Result */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleApplyEditedResultToCanvas}
                        className="py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Load this result onto the canvas so you can make further edits or undo"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply to Canvas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSaveToChat?.(editedResultUrl, aiEditPrompt || 'FLUX.2 Edited Image')}
                        className="py-1.5 px-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Send to Chat</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 1. TUNING TAB */}
            {activeTab === 'adjust' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Adjustments</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBrightness(0);
                      setContrast(0);
                      setSaturation(0);
                      setSharpness(0);
                    }}
                    className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                {/* Brightness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Brightness</span>
                    <span className="text-white">{brightness > 0 ? `+${brightness}` : brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Contrast</span>
                    <span className="text-white">{contrast > 0 ? `+${contrast}` : contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Saturation</span>
                    <span className="text-white">{saturation > 0 ? `+${saturation}` : saturation}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* Sharpness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Sharpness</span>
                    <span className="text-white">+{sharpness}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sharpness}
                    onChange={(e) => setSharpness(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={applyAdjustments}
                  className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer mt-2"
                >
                  Apply Color Adjustments
                </button>
              </div>
            )}

            {/* 2. FILTERS TAB */}
            {activeTab === 'filters' && (
              <div className="space-y-3">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                  Preset Filters
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'none', label: 'Original' },
                      { id: 'vivid', label: 'Vivid Clarity' },
                      { id: 'cyberpunk', label: 'Cyberpunk' },
                      { id: 'mono', label: 'Monochrome' },
                      { id: 'warm', label: 'Warm Glow' },
                      { id: 'cool', label: 'Cool Nordic' },
                      { id: 'vintage', label: 'Vintage Film' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFilter(f.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        activeFilter === f.id
                          ? 'bg-orange-500/20 border-orange-500/50 text-white font-bold'
                          : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={applyAdjustments}
                  className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer mt-2"
                >
                  Apply Selected Filter
                </button>
              </div>
            )}

            {/* 3. TRANSFORM TAB */}
            {activeTab === 'transform' && (
              <div className="space-y-4">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                  Rotation & Reflection
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRotate(true)}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-200 text-xs font-medium flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCw className="w-4 h-4 text-orange-400" />
                    <span>Rotate +90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRotate(false)}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-200 text-xs font-medium flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-orange-400" />
                    <span>Rotate -90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFlip(true)}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-200 text-xs font-medium flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FlipHorizontal className="w-4 h-4 text-cyan-400" />
                    <span>Flip Horizontal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFlip(false)}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-200 text-xs font-medium flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FlipVertical className="w-4 h-4 text-cyan-400" />
                    <span>Flip Vertical</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. CROP TAB */}
            {activeTab === 'crop' && (
              <div className="space-y-4">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                  Target Aspect Ratio
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['free', '1:1', '16:9', '9:16', '4:3', '3:2'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setCropAspectRatio(ratio)}
                      className={`p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                        cropAspectRatio === ratio
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-bold'
                          : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {ratio.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleApplyCrop}
                  disabled={cropAspectRatio === 'free'}
                  className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-colors cursor-pointer mt-2"
                >
                  Apply Aspect Ratio Crop
                </button>
              </div>
            )}

            {/* SenseNova Architecture Note */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5 text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5 font-bold text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>SenseNova Architecture Note</span>
              </div>
              <p className="leading-relaxed">
                SenseNova U1.5 Lite generates visual assets from natural language. Prompt-directed
                inpainting is unsupported by the SenseNova diffusion pipeline; all cropping, rotation,
                filters, and enhancements run in real-time lossless 32-bit canvas memory.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/[0.08] space-y-2 bg-zinc-950/90">
            {/* Save to Master Cloud */}
            <button
              type="button"
              onClick={handleSaveToCloud}
              disabled={isSavingToCloud || savedToCloud}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                savedToCloud
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
              }`}
            >
              {isSavingToCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Cloud ({uploadProgress}%)...</span>
                </>
              ) : savedToCloud ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved to Master Cloud Drive</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>Save to Master Cloud Drive</span>
                </>
              )}
            </button>

            {/* Direct PNG Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Edited PNG</span>
            </button>

            {/* Insert back into Chat */}
            {onSaveToChat && (
              <button
                type="button"
                onClick={handleSaveToChat}
                className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-orange-400" />
                <span>Save Edited Copy to Chat</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
