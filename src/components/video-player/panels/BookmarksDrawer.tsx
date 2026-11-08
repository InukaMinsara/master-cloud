import React, { useState } from 'react';
import {
  Bookmark,
  Camera,
  Download,
  Trash2,
  Play,
  X,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { captureVideoFrame, downloadVideoScreenshot } from '@/services/screenshotService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function formatBookmarkTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function BookmarksDrawer({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  const [noteText, setNoteText] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const bookmarks = useVideoPlayerStore((s) => s.bookmarks);
  const currentTime = useVideoPlayerStore((s) => s.currentTime);
  const fileName = useVideoPlayerStore((s) => s.fileName);

  const addBookmark = useVideoPlayerStore((s) => s.addBookmark);
  const removeBookmark = useVideoPlayerStore((s) => s.removeBookmark);
  const setCurrentTime = useVideoPlayerStore((s) => s.setCurrentTime);
  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);

  const handleCaptureAndBookmark = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsCapturing(true);
    try {
      const frameResult = await captureVideoFrame(video);
      const thumbnail = frameResult.success ? frameResult.dataUrl : undefined;

      await addBookmark(
        video.currentTime,
        noteText.trim() || `Bookmark at ${formatBookmarkTime(video.currentTime)}`,
        thumbnail
      );

      setNoteText('');
      toast.success('Bookmark saved with frame thumbnail!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Bookmark failed: ${msg}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownloadScreenshot = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      await downloadVideoScreenshot(video, fileName ? fileName.split('.')[0] : 'frame');
      toast.success('Screenshot downloaded as PNG!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  };

  const jumpToBookmark = (timestamp: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = timestamp;
      setCurrentTime(timestamp);
      toast.info(`Jumped to ${formatBookmarkTime(timestamp)}`);
    }
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 z-40 w-80 sm:w-96 border-l border-white/10 bg-zinc-950/95 backdrop-blur-2xl text-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Bookmarks & Screenshots</h3>
            <span className="text-[11px] text-white/50">{bookmarks.length} saved bookmarks</span>
          </div>
        </div>
        <button
          onClick={() => setActivePanel('none')}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Card */}
      <div className="p-4 border-b border-white/10 space-y-3 bg-white/[0.02]">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>Current Time:</span>
          <span className="font-mono text-cyan-300 font-bold">{formatBookmarkTime(currentTime)}</span>
        </div>

        <input
          type="text"
          placeholder="Add bookmark note / title (optional)..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCaptureAndBookmark();
          }}
          className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
        />

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="gradient"
            size="sm"
            disabled={isCapturing}
            onClick={handleCaptureAndBookmark}
            className="h-8 rounded-xl text-[11px] font-semibold gap-1.5 shadow-blue-500/10"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Add Bookmark</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadScreenshot}
            className="h-8 rounded-xl text-[11px] font-semibold gap-1.5 border-white/15 bg-white/5 hover:bg-white/15 text-white"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Save PNG</span>
          </Button>
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-white/40 space-y-2">
            <Bookmark className="w-8 h-8 opacity-30" />
            <p className="text-xs">No bookmarks saved yet.</p>
            <p className="text-[10px] text-white/30 max-w-[200px]">
              Capture key moments with screenshots and notes to jump back anytime.
            </p>
          </div>
        ) : (
          bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="group relative rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all p-2.5 flex gap-3 cursor-pointer select-none"
              onClick={() => jumpToBookmark(bm.timestamp)}
            >
              {/* Thumbnail */}
              {bm.thumbnailDataUrl ? (
                <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                  <img src={bm.thumbnailDataUrl} alt="Bookmark" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 fill-white text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-20 h-12 rounded-lg bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-cyan-400" />
                </div>
              )}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {formatBookmarkTime(bm.timestamp)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBookmark(bm.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 rounded transition-all"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-white/90 truncate mt-0.5 font-medium">
                  {bm.note || 'Bookmark'}
                </p>
                <span className="text-[10px] text-white/40 block mt-0.5">
                  {new Date(bm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
