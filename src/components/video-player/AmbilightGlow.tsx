import React, { useEffect, useRef } from 'react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { audioStudioEngine } from '@/services/audioStudioEngine';

interface AmbilightGlowProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function AmbilightGlow({ videoRef }: AmbilightGlowProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSampleTimeRef = useRef<number>(0);

  const isAmbilightEnabled = useVideoPlayerStore((s) => s.isAmbilightEnabled);
  const isAudioOnly = useVideoPlayerStore((s) => s.isAudioOnly);
  const isPlaying = useVideoPlayerStore((s) => s.isPlaying);

  useEffect(() => {
    if (!isAmbilightEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false, alpha: true });
    if (!ctx) return;

    // Small sampling resolution for ultra-fast 60fps performance
    const sampleW = 32;
    const sampleH = 18;
    canvas.width = sampleW;
    canvas.height = sampleH;

    let hueRotation = 0;

    const renderLoop = (time: number) => {
      animFrameRef.current = requestAnimationFrame(renderLoop);

      // Throttle sampling to ~30-45 FPS for zero GPU contention
      if (time - lastSampleTimeRef.current < 24) return;
      lastSampleTimeRef.current = time;

      if (isAudioOnly) {
        // Audio mode: dynamic reactive aura based on frequency spectrum
        const freqData = new Uint8Array(64);
        audioStudioEngine.getByteFrequencyData(freqData);
        let bassSum = 0;
        let midSum = 0;
        let trebleSum = 0;

        for (let i = 0; i < 8; i++) bassSum += freqData[i] || 0;
        for (let i = 8; i < 32; i++) midSum += freqData[i] || 0;
        for (let i = 32; i < 64; i++) trebleSum += freqData[i] || 0;

        const bassNorm = Math.min(1, (bassSum / 8) / 255);
        const midNorm = Math.min(1, (midSum / 24) / 255);
        const trebleNorm = Math.min(1, (trebleSum / 32) / 255);

        hueRotation = (hueRotation + 0.4) % 360;

        ctx.clearRect(0, 0, sampleW, sampleH);
        const grad = ctx.createRadialGradient(
          sampleW / 2,
          sampleH / 2,
          2,
          sampleW / 2,
          sampleH / 2,
          sampleW * 0.8
        );

        const r = Math.round(100 + bassNorm * 155);
        const g = Math.round(40 + midNorm * 180);
        const b = Math.round(200 + trebleNorm * 55);

        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.55 + bassNorm * 0.35})`);
        grad.addColorStop(0.6, `rgba(${Math.round(r * 0.7)}, ${g}, 255, 0.4)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, sampleW, sampleH);
      } else {
        // Video mode: sample video edges and scene colors
        const video = videoRef.current;
        if (!video || video.readyState < 2 || video.videoWidth === 0) return;

        try {
          ctx.drawImage(video, 0, 0, sampleW, sampleH);
        } catch {
          // Gracefully handle cross-origin or video loading edge case
        }
      }
    };

    renderLoop(0);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isAmbilightEnabled, isAudioOnly, isPlaying, videoRef]);

  if (!isAmbilightEnabled) return null;

  return (
    <div
      aria-hidden="true"
      className="absolute -inset-4 sm:-inset-10 -z-10 pointer-events-none overflow-hidden rounded-3xl transition-opacity duration-500 select-none opacity-80"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover filter blur-[56px] sm:blur-[84px] saturate-[180%] transform scale-110 pointer-events-none"
      />
    </div>
  );
}
