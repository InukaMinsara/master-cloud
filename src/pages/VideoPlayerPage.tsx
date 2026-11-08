import React from 'react';
import { Film, Upload, FileVideo, Info, Keyboard, X, HardDrive, Sparkles, BarChart3, FolderSync, Brain } from 'lucide-react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { VideoPlayer } from '@/components/video-player/VideoPlayer';
import { VideoDropZone } from '@/components/video-player/VideoDropZone';
import { MediaLibraryModal } from '@/components/video-player/panels/MediaLibraryModal';
import { PlaybackAnalyticsModal } from '@/components/video-player/panels/PlaybackAnalyticsModal';
import { MediaOrganizerModal } from '@/components/video-player/panels/MediaOrganizerModal';
import { MasterAiModal } from '@/components/video-player/panels/MasterAiModal';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const SUPPORTED_FORMATS = [
  { ext: 'MP4', note: 'H.264 / AAC / AV1' },
  { ext: 'WebM', note: 'VP8 / VP9 / Opus' },
  { ext: 'MOV', note: 'QuickTime / H.264' },
  { ext: 'MKV', note: 'Matroska' },
  { ext: 'AVI', note: 'Standard Containers' },
  { ext: 'OGG', note: 'Theora / Vorbis' },
];

const KEYBOARD_SHORTCUTS = [
  { keys: 'Space / K', action: 'Play / Pause' },
  { keys: 'F', action: 'Fullscreen' },
  { keys: 'M', action: 'Mute / Unmute' },
  { keys: '← → / J L', action: 'Seek ±10s' },
  { keys: '↑ ↓', action: 'Volume ±10%' },
  { keys: '0–9', action: 'Seek 0%–90%' },
  { keys: '< >', action: 'Speed Down / Up' },
  { keys: 'C', action: 'Subtitle Studio' },
  { keys: 'U', action: 'Subtitle Editor & STT' },
  { keys: 'E', action: 'Audio Studio & EQ' },
  { keys: 'Q', action: 'Playback Queue' },
  { keys: 'B', action: 'Bookmarks' },
  { keys: 'T', action: 'Video Intelligence' },
  { keys: 'X', action: 'Smart Scene Detection' },
  { keys: 'Y', action: 'Playback Analytics' },
  { keys: 'O', action: 'Media Organizer' },
  { keys: 'S', action: 'Screenshot Frame' },
  { keys: '[ ]', action: 'Set Loop A / B' },
  { keys: '\\', action: 'Clear A-B Loop' },
  { keys: 'N / P', action: 'Next / Prev Video' },
  { keys: 'I', action: 'Mini Player / PiP' },
];

const VIDEO_ACCEPT = 'video/*,.mp4,.webm,.mov,.avi,.mkv,.ogg,.ogv,.m4v,.3gp,.flv,.wmv,.ts,.m2ts';

export function VideoPlayerPage() {
  const videoSrc = useVideoPlayerStore((s) => s.videoSrc);
  const fileName = useVideoPlayerStore((s) => s.fileName);
  const fileSize = useVideoPlayerStore((s) => s.fileSize);
  const isControlsVisible = useVideoPlayerStore((s) => s.isControlsVisible);
  const activePanel = useVideoPlayerStore((s) => s.activePanel);
  const loadVideo = useVideoPlayerStore((s) => s.loadVideo);
  const closeVideo = useVideoPlayerStore((s) => s.closeVideo);
  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        loadVideo(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [loadVideo],
  );

  const openFilePicker = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ── Hidden file input (shared) ──
  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={VIDEO_ACCEPT}
      className="hidden"
      onChange={handleFileSelect}
    />
  );

  // ═══════════════════════════════════════════════
  //  VIDEO LOADED → Full-size player
  // ═══════════════════════════════════════════════
  if (videoSrc) {
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 bg-black relative select-none">
        {hiddenInput}

        {/* ── Floating header bar (auto-hides with controls) ── */}
        <div
          className={`absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-2.5
            bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-sm
            transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <FileVideo className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="text-sm font-semibold text-white truncate">{fileName}</span>
          {fileSize != null && fileSize > 0 && (
            <span className="text-xs text-white/50 font-mono shrink-0 flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {formatBytes(fileSize)}
            </span>
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={closeVideo}
            className="h-7 px-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg gap-1 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </Button>
        </div>

        {/* ── Player ── */}
        <VideoPlayer />
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  //  NO VIDEO → Welcome / Drop Zone / Library
  // ═══════════════════════════════════════════════
  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 select-none relative">
      {hiddenInput}

      <div className="flex flex-col items-center justify-center flex-1 max-w-3xl mx-auto w-full py-8 gap-7">
        {/* ── Branding ── */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/5">
            <Film className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            MASTER CLOUD Media Studio
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Professional browser video player with Smart Timeline, 10-Band Equalizer, Subtitle Studio, Bookmarks, and Local Media Library.
          </p>
        </div>

        {/* ── Drop Zone ── */}
        <VideoDropZone onFileSelect={loadVideo} />

        {/* ── Action Buttons ── */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Button
            variant="gradient"
            size="lg"
            onClick={openFilePicker}
            className="rounded-xl gap-2 font-semibold shadow-lg shadow-blue-500/10"
          >
            <Upload className="h-4 w-4" />
            Open Video File
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setActivePanel('intelligence')}
            className="rounded-xl gap-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            <Brain className="h-4 w-4" />
            Master AI
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setActivePanel('library')}
            className="rounded-xl gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Film className="h-4 w-4" />
            Media Library 2.0
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setActivePanel('analytics')}
            className="rounded-xl gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setActivePanel('organizer')}
            className="rounded-xl gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <FolderSync className="h-4 w-4" />
            Organizer
          </Button>
        </div>

        {/* ── Supported Formats ── */}
        <div className="w-full rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Info className="h-4 w-4 text-cyan-400" />
            Supported Formats & Browser Decoders
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_FORMATS.map(({ ext, note }) => (
              <div
                key={ext}
                className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-border/40 px-3 py-2"
              >
                <FileVideo className="h-3.5 w-3.5 text-cyan-400/70 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground">{ext}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">{note}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
            All media decoding is executed entirely locally inside your browser sandbox. No user videos are ever uploaded to remote servers.
          </p>
        </div>

        {/* ── Keyboard Shortcuts ── */}
        <div className="w-full rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Keyboard className="h-4 w-4 text-blue-400" />
            Phase 2 Pro Keyboard Controls
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {KEYBOARD_SHORTCUTS.map(({ keys, action }) => (
              <div
                key={keys}
                className="flex items-center gap-2 rounded-xl bg-white/5 border border-border/40 px-2.5 py-2"
              >
                <kbd className="text-[10px] font-mono font-bold text-cyan-300 bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10 shrink-0">
                  {keys}
                </kbd>
                <span className="text-[11px] text-muted-foreground truncate">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals opened from Welcome screen */}
      {activePanel === 'intelligence' && <MasterAiModal />}
      {activePanel === 'library' && <MediaLibraryModal />}
      {activePanel === 'analytics' && <PlaybackAnalyticsModal />}
      {activePanel === 'organizer' && <MediaOrganizerModal />}
    </div>
  );
}
