import React, { useRef } from 'react';
import {
  Captions,
  Upload,
  Sliders,
  Check,
  X,
  Plus,
  Clock,
  Palette,
  Type,
  Layout,
} from 'lucide-react';
import { useVideoPlayerStore, SubtitleSettings } from '@/stores/videoPlayerStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function SubtitleStudioModal() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subtitleTracks = useVideoPlayerStore((s) => s.subtitleTracks);
  const activeSubtitleTrackId = useVideoPlayerStore((s) => s.activeSubtitleTrackId);
  const subtitleOffset = useVideoPlayerStore((s) => s.subtitleOffset);
  const subtitleStyles = useVideoPlayerStore((s) => s.subtitleStyles);

  const loadSubtitleFile = useVideoPlayerStore((s) => s.loadSubtitleFile);
  const setActiveSubtitleTrack = useVideoPlayerStore((s) => s.setActiveSubtitleTrack);
  const setSubtitleOffset = useVideoPlayerStore((s) => s.setSubtitleOffset);
  const updateSubtitleStyles = useVideoPlayerStore((s) => s.updateSubtitleStyles);
  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await loadSubtitleFile(file);
      toast.success(`Loaded subtitles: ${file.name}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl text-white max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Captions className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Subtitle Studio</h3>
              <p className="text-xs text-white/50">Load, sync and customize subtitle tracks</p>
            </div>
          </div>
          <button
            onClick={() => setActivePanel('none')}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Track Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/80">Available Tracks</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-[11px] gap-1.5 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 rounded-lg"
            >
              <Upload className="w-3 h-3" />
              <span>Load SRT / VTT</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".srt,.vtt,text/vtt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl bg-white/5 border border-white/5">
            {/* Off Option */}
            <button
              onClick={() => setActiveSubtitleTrack(null)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                activeSubtitleTrackId === null
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <span>Subtitles Disabled (Off)</span>
              {activeSubtitleTrackId === null && <Check className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Custom Loaded Tracks */}
            {subtitleTracks.map((track) => (
              <button
                key={track.id}
                onClick={() => setActiveSubtitleTrack(track.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                  activeSubtitleTrackId === track.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Captions className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{track.label}</span>
                  <span className="text-[10px] text-white/40">({track.cues.length} cues)</span>
                </div>
                {activeSubtitleTrackId === track.id && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Subtitle Sync Offset */}
        <div className="space-y-2 p-3.5 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Time Synchronization Offset</span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {subtitleOffset > 0 ? `+${subtitleOffset.toFixed(1)}s` : `${subtitleOffset.toFixed(1)}s`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubtitleOffset(Number((subtitleOffset - 0.5).toFixed(1)))}
              className="px-2 py-1 text-xs font-mono rounded bg-white/10 hover:bg-white/20"
            >
              -0.5s
            </button>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.1}
              value={subtitleOffset}
              onChange={(e) => setSubtitleOffset(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400 cursor-pointer h-1.5"
            />
            <button
              onClick={() => setSubtitleOffset(Number((subtitleOffset + 0.5).toFixed(1)))}
              className="px-2 py-1 text-xs font-mono rounded bg-white/10 hover:bg-white/20"
            >
              +0.5s
            </button>
            <button
              onClick={() => setSubtitleOffset(0)}
              className="px-2 py-1 text-[10px] font-bold rounded bg-white/5 hover:bg-white/15 text-white/60"
            >
              Reset
            </button>
          </div>
        </div>

        {/* 3. Subtitle Styling Studio */}
        <div className="space-y-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>Appearance & Position</span>
          </div>

          {/* Font Size */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-white/60">
              <span>Font Size</span>
              <span className="font-mono text-cyan-300">{subtitleStyles.fontSize}px</span>
            </div>
            <input
              type="range"
              min={14}
              max={36}
              step={1}
              value={subtitleStyles.fontSize}
              onChange={(e) => updateSubtitleStyles({ fontSize: parseInt(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer h-1.5"
            />
          </div>

          {/* Background Opacity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-white/60">
              <span>Background Opacity</span>
              <span className="font-mono text-cyan-300">{Math.round(subtitleStyles.backgroundOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={subtitleStyles.backgroundOpacity}
              onChange={(e) => updateSubtitleStyles({ backgroundOpacity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer h-1.5"
            />
          </div>

          {/* Colors */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/60">Text Color:</span>
              <input
                type="color"
                value={subtitleStyles.color}
                onChange={(e) => updateSubtitleStyles({ color: e.target.value })}
                className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/60">Background:</span>
              <input
                type="color"
                value={subtitleStyles.backgroundColor}
                onChange={(e) => updateSubtitleStyles({ backgroundColor: e.target.value })}
                className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
              />
            </div>
          </div>

          {/* Position Selector */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-white/60">Vertical Position</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['bottom', 'middle', 'top'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => updateSubtitleStyles({ position: pos })}
                  className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    subtitleStyles.position === pos
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-white/10 text-white/70 hover:bg-white/15'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="p-3 rounded-xl bg-black/70 border border-white/10 text-center flex items-center justify-center min-h-[60px]">
          <span
            style={{
              fontSize: `${subtitleStyles.fontSize}px`,
              color: subtitleStyles.color,
              backgroundColor: `rgba(0,0,0,${subtitleStyles.backgroundOpacity})`,
              padding: '4px 10px',
              borderRadius: '6px',
            }}
          >
            MASTER CLOUD Subtitle Preview
          </span>
        </div>
      </div>
    </div>
  );
}
