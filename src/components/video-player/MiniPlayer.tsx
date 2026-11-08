import React from 'react';
import {
  Play,
  Pause,
  Maximize2,
  X,
  Volume2,
  VolumeX,
  PictureInPicture,
} from 'lucide-react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';

export function MiniPlayer({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  const videoSrc = useVideoPlayerStore((s) => s.videoSrc);
  const fileName = useVideoPlayerStore((s) => s.fileName);
  const isPlaying = useVideoPlayerStore((s) => s.isPlaying);
  const currentTime = useVideoPlayerStore((s) => s.currentTime);
  const duration = useVideoPlayerStore((s) => s.duration);
  const isMuted = useVideoPlayerStore((s) => s.isMuted);
  const isMiniPlayer = useVideoPlayerStore((s) => s.isMiniPlayer);

  const setMiniPlayer = useVideoPlayerStore((s) => s.setMiniPlayer);
  const toggleMute = useVideoPlayerStore((s) => s.toggleMute);
  const setPlaying = useVideoPlayerStore((s) => s.setPlaying);
  const closeVideo = useVideoPlayerStore((s) => s.closeVideo);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isMiniPlayer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch {
          // ignore CORS tainted stream
        }
      }
      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isMiniPlayer, videoRef]);

  if (!isMiniPlayer || !videoSrc) return null;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl overflow-hidden text-white flex flex-col animate-in slide-in-from-bottom-5 duration-200 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-1.5 truncate">
          <PictureInPicture className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold text-white truncate max-w-[190px]">
            {fileName || 'Playing Video'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMiniPlayer(false)}
            className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Restore Full Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setMiniPlayer(false);
              closeVideo();
            }}
            className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Playback"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Video Mirror Area */}
      <div className="relative aspect-video bg-black flex items-center justify-center group cursor-pointer overflow-hidden" onClick={togglePlay}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg">
            {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 ml-0.5 fill-black" />}
          </div>
        </div>
      </div>

      {/* Mini Progress */}
      <div className="w-full h-1 bg-white/10">
        <div className="h-full bg-cyan-400 transition-all duration-100" style={{ width: `${percent}%` }} />
      </div>

      {/* Mini Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={() => setMiniPlayer(false)}
          className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
        >
          Expand Player
        </button>
      </div>
    </div>
  );
}
