import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { videoQualityEnhancer } from '@/services/videoQualityEnhancer';

interface VideoQualityCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function VideoQualityCanvas({ videoRef }: VideoQualityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const qualitySettings = useVideoPlayerStore((s) => s.qualitySettings);
  const setQualitySplitPosition = useVideoPlayerStore((s) => s.setQualitySplitPosition);

  // Split-screen drag handler
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!qualitySettings.splitScreen) return;
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = ((e.clientX - rect.left) / rect.width) * 100;
    setQualitySplitPosition(pos);
  }, [qualitySettings.splitScreen, setQualitySplitPosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !qualitySettings.splitScreen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = ((e.clientX - rect.left) / rect.width) * 100;
    setQualitySplitPosition(pos);
  }, [qualitySettings.splitScreen, setQualitySplitPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  }, []);

  // Real-time render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !qualitySettings.enabled) return;

    videoQualityEnhancer.init(canvas);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      const video = videoRef.current;
      if (video && !video.paused && video.readyState >= 2) {
        videoQualityEnhancer.render(video, qualitySettings);
      } else if (video && video.readyState >= 2) {
        // Still render paused frames for live adjustment
        videoQualityEnhancer.render(video, qualitySettings);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [qualitySettings, videoRef]);

  if (!qualitySettings.enabled) {
    return null;
  }

  const splitPos = qualitySettings.splitPosition || 50;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute inset-0 w-full h-full pointer-events-auto select-none ${
        qualitySettings.splitScreen ? 'cursor-ew-resize' : 'pointer-events-none'
      }`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Split-screen Before/After UI Overlays */}
      {qualitySettings.splitScreen && (
        <>
          {/* Draggable Divider Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] pointer-events-none"
            style={{ left: `${splitPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-cyan-500 text-black shadow-lg flex items-center justify-center text-[10px] font-black border-2 border-white select-none">
              ↔
            </div>
          </div>

          {/* Left Label: Original */}
          <div
            className="absolute top-4 left-4 z-10 pointer-events-none px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white/80 tracking-wider shadow-lg"
          >
            ORIGINAL
          </div>

          {/* Right Label: Enhanced */}
          <div
            className="absolute top-4 right-4 z-10 pointer-events-none px-2.5 py-1 rounded-lg bg-cyan-500/25 backdrop-blur-md border border-cyan-400/40 text-[10px] font-bold text-cyan-300 tracking-wider shadow-lg flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>4K ENHANCED</span>
          </div>
        </>
      )}
    </div>
  );
}
