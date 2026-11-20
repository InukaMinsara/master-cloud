/**
 * src/features/ai/components/MasterAi2ImageCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — INTEGRATED IN-CHAT IMAGE CARD
 * Displays generated & edited images directly inside the conversation stream.
 *
 * Full feature set:
 * - High-resolution responsive preview
 * - Full-screen lightbox trigger
 * - Direct "Save to Master Cloud" Drive integration (api.uploadFile)
 * - Local file download & copy to clipboard
 * - Regenerate & Generate variation controls
 * - Edit in Chat shortcut (loads image into composer reference)
 * - AI Background Removal (Upscale & isolate subject)
 * - Super-resolution Upscaling 2x
 * - Deep metadata inspector drawer (Seed, Dimensions, Duration, Provider)
 * - Provider & Model metadata pill with Free-tier badge
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  Maximize2,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  CloudUpload,
  Edit3,
  Layers,
  Loader2,
  Info,
  Crop,
  ArrowUpRight,
} from 'lucide-react';
import { AiImageDetails } from '../types/aiTypes';
import { useAiChatStore } from '../stores/aiChatStore';
import { pollinationsService } from '../services/pollinationsService';
import { useFileStore } from '@/stores/fileStore';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface ImageCardProps {
  details?: AiImageDetails;
  isGenerating?: boolean;
  promptText?: string;
  onRegenerate?: () => void;
  onEditImage?: (imageUrl: string, prompt: string) => void;
  onVariation?: (details: AiImageDetails) => void;
  onRemoveBackground?: (imageUrl: string) => void;
  onUpscale?: (imageUrl: string) => void;
}

export function MasterAi2ImageCard({
  details,
  isGenerating = false,
  promptText,
  onRegenerate,
  onEditImage,
  onVariation,
  onRemoveBackground,
  onUpscale,
}: ImageCardProps) {
  const [copied, setCopied] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [isSavedToDrive, setIsSavedToDrive] = useState(Boolean(details?.savedToDriveId));
  const [showMetadata, setShowMetadata] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);

  const setLightboxImage = useAiChatStore((s) => s.setLightboxImage);
  const fetchDriveItems = useFileStore((s) => s.fetchItems);

  if (isGenerating || !details) {
    return (
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Synthesizing Visual Art...</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">
                SenseNova U1.5 Lite
              </span>
            </div>
            <p className="text-xs text-zinc-400 line-clamp-1 italic mt-0.5">
              &ldquo;{promptText || 'Synthesizing visual representation...'}&rdquo;
            </p>
          </div>
        </div>

        {/* Shimmer Placeholder Box */}
        <div className="w-full aspect-square rounded-xl bg-zinc-900/60 border border-white/[0.04] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer" />
          <div className="text-center space-y-2 z-10 px-4">
            <Sparkles className="w-8 h-8 text-orange-400/60 mx-auto animate-pulse" />
            <div className="text-xs text-zinc-500 font-mono">
              Running diffusion inference on neural canvas...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(details.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanName = details.prompt.slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `master_ai_${cleanName}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Image downloaded successfully.');
    } catch {
      toast.error('Failed to download image.');
    }
  };

  const handleCopy = async () => {
    try {
      const res = await fetch(details.url);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || 'image/png']: blob }),
      ]);
      setCopied(true);
      toast.success('Image copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy image URL
      navigator.clipboard.writeText(details.url);
      setCopied(true);
      toast.success('Image URL copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToDrive = async () => {
    if (isSavedToDrive || isSavingToDrive) return;
    setIsSavingToDrive(true);
    try {
      const res = await fetch(details.url);
      const blob = await res.blob();
      const cleanName = details.prompt.slice(0, 28).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `AI_${cleanName}_${Date.now()}.png`;
      const fileObj = new File([blob], filename, { type: blob.type || 'image/png' });

      await api.uploadFile(fileObj, null);
      setIsSavedToDrive(true);
      toast.success(`Saved "${filename}" directly to your Master Cloud Drive!`);
      fetchDriveItems().catch(() => {});
    } catch (err: any) {
      toast.error(`Drive upload error: ${err?.message || 'Could not save to Cloud'}`);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleBgRemove = () => {
    if (onRemoveBackground) {
      onRemoveBackground(details.url);
    } else if (onEditImage) {
      onEditImage(details.url, 'Remove background and isolate subject on clean neutral backdrop');
    }
  };

  const handleUpscale = () => {
    if (onUpscale) {
      onUpscale(details.url);
    } else if (onEditImage) {
      onEditImage(details.url, 'Upscale this image to 2x resolution with hyper-crisp fine details and texture enhancement');
    }
  };

  return (
    <div className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-zinc-950/80 backdrop-blur-md overflow-hidden shadow-xl animate-in fade-in duration-300">
      {/* Header Info Bar */}
      <div className="px-3.5 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            {details.isEdited ? 'Edited Image' : 'Generated Image'}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[160px]">
            · SenseNova U1.5 Lite
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Free Tier
          </span>
          {details.generationTimeMs && (
            <span className="text-[10px] font-mono text-zinc-400">
              {(details.generationTimeMs / 1000).toFixed(1)}s
            </span>
          )}
          {/* Metadata Toggle */}
          <button
            type="button"
            onClick={() => setShowMetadata(!showMetadata)}
            className={`p-1 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer ${
              showMetadata ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/[0.06]'
            }`}
            title="Inspect generation metadata"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image Preview Container */}
      <div className="relative group bg-black/60 overflow-hidden flex items-center justify-center">
        <img
          src={details.url}
          alt={details.prompt}
          loading="lazy"
          className="w-full max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Hover Quick Overlay Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={() =>
              setLightboxImage({
                url: details.url,
                prompt: details.prompt,
                title: details.modelTitle || details.modelId,
              })
            }
            className="p-2 rounded-xl bg-black/70 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-lg cursor-pointer transition-transform active:scale-95"
            title="View Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Deep Metadata Drawer (Expanded) */}
      {showMetadata && (
        <div className="px-3.5 py-2.5 bg-black/40 border-b border-white/[0.06] text-[11px] font-mono grid grid-cols-2 gap-2 text-zinc-300 animate-in fade-in duration-150">
          <div><span className="text-zinc-500">Dimensions:</span> {details.width} × {details.height}</div>
          <div><span className="text-zinc-500">Seed:</span> {details.seed}</div>
          <div><span className="text-zinc-500">Aspect Ratio:</span> {details.aspectRatio || '1:1'}</div>
          <div><span className="text-zinc-500">Engine:</span> SenseNova Neural Canvas</div>
          <div className="col-span-2 truncate"><span className="text-zinc-500">Model:</span> SenseNova U1.5 Lite</div>
        </div>
      )}

      {/* Prompt Caption & Dimensions */}
      <div className="p-3.5 space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-zinc-200 leading-relaxed font-sans font-medium line-clamp-3">
            &ldquo;{details.prompt}&rdquo;
          </p>
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
            <span>{details.width} × {details.height}</span>
            <span>·</span>
            <span>Seed: {details.seed}</span>
            <span>·</span>
            <span className="capitalize">{details.provider}</span>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Save to Master Cloud Drive */}
            <button
              type="button"
              onClick={handleSaveToDrive}
              disabled={isSavedToDrive || isSavingToDrive}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSavedToDrive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}
              title="Save directly into Master Cloud Drive"
            >
              {isSavingToDrive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isSavedToDrive ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              <span>{isSavedToDrive ? 'Saved to Drive' : 'Save to Cloud'}</span>
            </button>

            {/* Edit in Chat */}
            {onEditImage && (
              <button
                type="button"
                onClick={() => onEditImage(details.url, details.prompt)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-xs font-medium cursor-pointer transition-colors"
                title="Edit this image with instructions"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Edit Image</span>
              </button>
            )}

            {/* Variation */}
            {onVariation && (
              <button
                type="button"
                onClick={() => onVariation(details)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-xs font-medium cursor-pointer transition-colors"
                title="Generate creative variation"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Variation</span>
              </button>
            )}

            {/* Remove Background Action */}
            <button
              type="button"
              onClick={handleBgRemove}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-xs font-medium cursor-pointer transition-colors"
              title="Remove background & isolate subject"
            >
              <Crop className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Cutout</span>
            </button>

            {/* Upscale 2x Action */}
            <button
              type="button"
              onClick={handleUpscale}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-xs font-medium cursor-pointer transition-colors"
              title="Super-resolution upscale to 2x"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Upscale 2x</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Copy image or URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Download PNG"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Regenerate Button */}
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Regenerate this prompt"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
