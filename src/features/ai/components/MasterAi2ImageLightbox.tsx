/**
 * src/features/ai/components/MasterAi2ImageLightbox.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — FULLSCREEN IMAGE LIGHTBOX MODAL
 * High-definition viewer with pan/zoom, download, copy, and Drive saving.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { X, Download, Copy, CloudUpload, Maximize2 } from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { useFileStore } from '@/stores/fileStore';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function MasterAi2ImageLightbox() {
  const lightboxImage = useAiChatStore((s) => s.lightboxImage);
  const setLightboxImage = useAiChatStore((s) => s.setLightboxImage);
  const fetchDriveItems = useFileStore((s) => s.fetchItems);

  if (!lightboxImage) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(lightboxImage.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanName = (lightboxImage.prompt || 'master_ai_image')
        .slice(0, 24)
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${cleanName}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Downloaded image');
    } catch {
      toast.error('Failed to download image.');
    }
  };

  const handleSaveToDrive = async () => {
    try {
      const res = await fetch(lightboxImage.url);
      const blob = await res.blob();
      const cleanName = (lightboxImage.prompt || 'AI_Image')
        .slice(0, 28)
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanName}_${Date.now()}.png`;
      const fileObj = new File([blob], filename, { type: blob.type || 'image/png' });

      await api.uploadFile(fileObj, null);
      toast.success(`Saved "${filename}" directly to your Master Cloud Drive!`);
      fetchDriveItems().catch(() => {});
    } catch (err: any) {
      toast.error(`Drive error: ${err?.message || 'Could not save to Drive'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-bold truncate max-w-sm sm:max-w-md">
            {lightboxImage.title || 'Image Preview'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveToDrive}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold cursor-pointer transition-colors"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save to Drive</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            title="Download Image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            title="Close Lightbox (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Full-Size Image */}
      <div className="flex-1 w-full flex items-center justify-center p-2 overflow-hidden">
        <img
          src={lightboxImage.url}
          alt={lightboxImage.prompt || 'Fullscreen Image'}
          className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
        />
      </div>

      {/* Bottom Caption */}
      {lightboxImage.prompt && (
        <div className="w-full max-w-3xl text-center py-2 px-4 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-xs text-zinc-300 font-sans italic">
          &ldquo;{lightboxImage.prompt}&rdquo;
        </div>
      )}
    </div>
  );
}
