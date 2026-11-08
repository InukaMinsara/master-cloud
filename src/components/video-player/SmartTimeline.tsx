import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Flag,
  Repeat,
  X,
  Plus,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { useVideoPlayerStore, TimelineMarker } from '@/stores/videoPlayerStore';
import { thumbnailGenerator } from '@/services/thumbnailGenerator';
import { toast } from 'sonner';

function formatPreciseTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00.0';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
}

export function SmartTimeline({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const wasPlayingRef = useRef(false);

  const videoSrc = useVideoPlayerStore((s) => s.videoSrc);
  const currentTime = useVideoPlayerStore((s) => s.currentTime);
  const duration = useVideoPlayerStore((s) => s.duration);
  const buffered = useVideoPlayerStore((s) => s.buffered);
  const markers = useVideoPlayerStore((s) => s.markers);
  const abRepeat = useVideoPlayerStore((s) => s.abRepeat);

  const setCurrentTime = useVideoPlayerStore((s) => s.setCurrentTime);
  const addMarker = useVideoPlayerStore((s) => s.addMarker);
  const removeMarker = useVideoPlayerStore((s) => s.removeMarker);
  const setPointA = useVideoPlayerStore((s) => s.setPointA);
  const setPointB = useVideoPlayerStore((s) => s.setPointB);
  const clearAbRepeat = useVideoPlayerStore((s) => s.clearAbRepeat);

  // Load thumbnail on hover position change
  useEffect(() => {
    let active = true;
    if (hoverTime === null || !videoSrc || duration <= 0) {
      setThumbnailUrl(null);
      return;
    }

    thumbnailGenerator.getThumbnail(videoSrc, hoverTime, 160, 90).then((url) => {
      if (active) setThumbnailUrl(url);
    });

    return () => {
      active = false;
    };
  }, [hoverTime, videoSrc, duration]);

  const seekTo = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      const clamped = Math.max(0, Math.min(time, duration || 0));
      video.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration, setCurrentTime, videoRef]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const clampedPos = Math.max(0, Math.min(1, pos));
    const targetTime = clampedPos * duration;

    setHoverPosition(clampedPos * 100);
    setHoverTime(targetTime);

    if (isScrubbing) {
      seekTo(targetTime);
    }
  };

  const handleMouseLeave = () => {
    if (!isScrubbing) {
      setHoverPosition(null);
      setHoverTime(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const clampedPos = Math.max(0, Math.min(1, pos));
    const targetTime = clampedPos * duration;

    const video = videoRef.current;
    if (video) {
      wasPlayingRef.current = !video.paused;
      if (!video.paused) video.pause();
    }

    setIsScrubbing(true);
    seekTo(targetTime);

    const onGlobalMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current || duration <= 0) return;
      const r = containerRef.current.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (moveEvent.clientX - r.left) / r.width));
      seekTo(p * duration);
    };

    const onGlobalMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
      if (wasPlayingRef.current && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTime > 0) {
      addMarker(currentTime, `Marker at ${formatPreciseTime(currentTime)}`);
      toast.success('Marker added!');
    }
  };

  // Percentage calculations
  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = buffered;

  // A-B repeat region
  const aPercent = abRepeat.a !== null && duration > 0 ? (abRepeat.a / duration) * 100 : null;
  const bPercent = abRepeat.b !== null && duration > 0 ? (abRepeat.b / duration) * 100 : null;

  return (
    <div className="w-full space-y-1 select-none">
      {/* ─── A-B Repeat & Marker Control Header ─── */}
      <div className="flex items-center justify-between text-[11px] text-white/60 px-0.5">
        <div className="flex items-center gap-1.5">
          {/* Set Point A */}
          <button
            onClick={() => {
              setPointA();
              toast.info(`Point A set at ${formatPreciseTime(currentTime)}`);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
              abRepeat.a !== null
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
            }`}
            title="Set Point A for Loop"
          >
            [A] {abRepeat.a !== null ? formatPreciseTime(abRepeat.a) : 'Set'}
          </button>

          {/* Set Point B */}
          <button
            onClick={() => {
              setPointB();
              toast.info(`Point B set at ${formatPreciseTime(currentTime)}`);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
              abRepeat.b !== null
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
            }`}
            title="Set Point B for Loop"
          >
            [B] {abRepeat.b !== null ? formatPreciseTime(abRepeat.b) : 'Set'}
          </button>

          {/* Clear A-B Loop */}
          {(abRepeat.a !== null || abRepeat.b !== null) && (
            <button
              onClick={() => {
                clearAbRepeat();
                toast.info('A-B Loop cleared');
              }}
              className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors"
              title="Clear A-B Loop"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {abRepeat.active && (
            <span className="text-[10px] text-cyan-300 font-bold animate-pulse hidden sm:inline">
              • A-B Repeat Active
            </span>
          )}
        </div>

        {/* Add custom timeline marker */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              addMarker(currentTime, `Marker at ${formatPreciseTime(currentTime)}`);
              toast.success('Marker added to timeline');
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            title="Add Bookmark Marker (Double-click timeline)"
          >
            <Flag className="w-2.5 h-2.5 text-cyan-400" />
            <span>Add Marker</span>
          </button>
        </div>
      </div>

      {/* ─── Main Seekable Track Container ─── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className="group relative h-6 flex items-center cursor-pointer"
      >
        {/* Floating Thumbnail Preview Popup */}
        {hoverPosition !== null && hoverTime !== null && (
          <div
            className="absolute bottom-7 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 transition-all duration-75"
            style={{ left: `${Math.max(12, Math.min(88, hoverPosition))}%` }}
          >
            <div className="rounded-xl border border-white/20 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-xl flex flex-col items-center space-y-1">
              {thumbnailUrl ? (
                <div className="w-36 h-20 rounded-lg overflow-hidden bg-black/80 border border-white/10">
                  <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-36 h-20 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-[10px] text-white/40">
                  Seeking frame...
                </div>
              )}
              <span className="text-[11px] font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-white/10">
                {formatPreciseTime(hoverTime)}
              </span>
            </div>
            {/* Arrow down */}
            <div className="w-2 h-2 rotate-45 bg-zinc-950 border-r border-b border-white/20 -mt-1" />
          </div>
        )}

        {/* Base Track */}
        <div className="relative w-full h-1 group-hover:h-2 bg-white/20 rounded-full overflow-hidden transition-all duration-150">
          {/* Buffered Track */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />

          {/* A-B Loop Shaded Highlight */}
          {aPercent !== null && bPercent !== null && bPercent > aPercent && (
            <div
              className="absolute top-0 bottom-0 bg-cyan-400/35 border-x border-cyan-400"
              style={{
                left: `${aPercent}%`,
                width: `${bPercent - aPercent}%`,
              }}
            />
          )}

          {/* Played Gradient Track */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            style={{ width: `${playedPercent}%` }}
          />
        </div>

        {/* Timeline Markers */}
        {markers.map((marker) => {
          const mPos = duration > 0 ? (marker.time / duration) * 100 : 0;
          return (
            <div
              key={marker.id}
              onClick={(e) => {
                e.stopPropagation();
                seekTo(marker.time);
                toast.info(`Jumped to: ${marker.label}`);
              }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group/marker"
              style={{ left: `${mPos}%` }}
              title={`${marker.label} (${formatPreciseTime(marker.time)})`}
            >
              <div
                className="w-2 h-3 rounded-full hover:scale-150 transition-transform shadow-md"
                style={{ backgroundColor: marker.color || '#06b6d4' }}
              />
            </div>
          );
        })}

        {/* A-B Point Flags on Track */}
        {aPercent !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-25 pointer-events-none"
            style={{ left: `${aPercent}%` }}
          >
            <div className="w-1.5 h-4 bg-cyan-300 rounded-sm shadow-md" />
          </div>
        )}

        {bPercent !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-25 pointer-events-none"
            style={{ left: `${bPercent}%` }}
          >
            <div className="w-1.5 h-4 bg-cyan-300 rounded-sm shadow-md" />
          </div>
        )}

        {/* Scrubber Playhead Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.6)] group-hover:scale-125 transition-transform duration-100 pointer-events-none z-30"
          style={{ left: `${playedPercent}%` }}
        />
      </div>
    </div>
  );
}
