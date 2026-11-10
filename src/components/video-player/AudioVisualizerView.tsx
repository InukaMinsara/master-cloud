import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Music,
  Disc3,
  Sliders,
  BarChart2,
  Activity,
  Radio,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { audioStudioEngine } from '@/services/audioStudioEngine';

export function AudioVisualizerView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const fileName = useVideoPlayerStore((s) => s.fileName);
  const fileSize = useVideoPlayerStore((s) => s.fileSize);
  const isPlaying = useVideoPlayerStore((s) => s.isPlaying);
  const currentTime = useVideoPlayerStore((s) => s.currentTime);
  const duration = useVideoPlayerStore((s) => s.duration);
  const audioVisualizerMode = useVideoPlayerStore((s) => s.audioVisualizerMode);
  const setAudioVisualizerMode = useVideoPlayerStore((s) => s.setAudioVisualizerMode);
  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);

  // Peak caps smoothing for bars
  const peakCapsRef = useRef<number[]>([]);

  // Format badge detection
  const ext = (fileName || '').split('.').pop()?.toUpperCase() || 'AUDIO';
  const isLossless = ['FLAC', 'WAV', 'ALAC', 'AIFF'].includes(ext);

  // Visualizer mode cycle
  const cycleVisualizerMode = useCallback(() => {
    const modes: ('bars' | 'wave' | 'circle' | 'off')[] = ['bars', 'wave', 'circle', 'off'];
    const nextIdx = (modes.indexOf(audioVisualizerMode) + 1) % modes.length;
    setAudioVisualizerMode(modes[nextIdx]);
  }, [audioVisualizerMode, setAudioVisualizerMode]);

  // Real-time canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioStudioEngine.getAnalyserNode();
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      // Handle canvas resizing for device pixel ratio
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      if (audioVisualizerMode === 'off') {
        return;
      }

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(timeDomainArray);
      } else {
        // Idle gentle waveform simulation when paused
        const idlePulse = Math.sin(Date.now() / 800) * 8;
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.max(0, 10 + Math.sin(i * 0.2 + Date.now() / 1000) * 12 + idlePulse);
          timeDomainArray[i] = 128 + Math.sin(i * 0.3 + Date.now() / 500) * 8;
        }
      }

      // ───────────────────────────────────────────────────────────────────────
      // MODE 1: Neon Spectrum Equalizer Bars
      // ───────────────────────────────────────────────────────────────────────
      if (audioVisualizerMode === 'bars') {
        const barCount = Math.min(48, Math.floor(width / 14));
        const barWidth = Math.max(4, (width - (barCount - 1) * 4) / barCount);
        const maxHeight = height * 0.42;

        if (peakCapsRef.current.length !== barCount) {
          peakCapsRef.current = new Array(barCount).fill(0);
        }

        const gradient = ctx.createLinearGradient(0, height, 0, height - maxHeight);
        gradient.addColorStop(0, '#06b6d4'); // Cyan 500
        gradient.addColorStop(0.5, '#8b5cf6'); // Violet 500
        gradient.addColorStop(1, '#ec4899'); // Pink 500

        for (let i = 0; i < barCount; i++) {
          const binIndex = Math.floor((i / barCount) * (bufferLength * 0.85));
          const val = dataArray[binIndex] || 0;
          const barHeight = Math.max(4, (val / 255) * maxHeight);
          const x = i * (barWidth + 4);
          const y = height - barHeight;

          // Update peak caps
          if (val > (peakCapsRef.current[i] || 0)) {
            peakCapsRef.current[i] = val;
          } else {
            peakCapsRef.current[i] = Math.max(0, (peakCapsRef.current[i] || 0) - 2.5);
          }

          // Main vertical bar with rounded top
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Floating peak cap line
          const peakY = height - (peakCapsRef.current[i] / 255) * maxHeight - 2;
          ctx.fillStyle = '#f472b6';
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 8;
          ctx.fillRect(x, Math.max(2, peakY), barWidth, 2);
          ctx.shadowBlur = 0;

          // Mirror reflection below baseline
          const reflectionHeight = barHeight * 0.25;
          ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
          ctx.fillRect(x, height, barWidth, reflectionHeight);
        }
      }

      // ───────────────────────────────────────────────────────────────────────
      // MODE 2: Liquid Neon Oscilloscope Waveform Line
      // ───────────────────────────────────────────────────────────────────────
      else if (audioVisualizerMode === 'wave') {
        const sliceWidth = width / bufferLength;
        const centerY = height * 0.65;

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#22d3ee';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 14;

        ctx.beginPath();
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeDomainArray[i] / 128.0;
          const y = centerY + (v - 1.0) * (height * 0.28);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, centerY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Secondary ambient glow wave
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.stroke();
      }

      // ───────────────────────────────────────────────────────────────────────
      // MODE 3: Circular Radial Aura around Disc Center
      // ───────────────────────────────────────────────────────────────────────
      else if (audioVisualizerMode === 'circle') {
        const centerX = width / 2;
        const centerY = height * 0.42;
        const baseRadius = Math.min(width, height) * 0.22;
        const rayCount = 48;

        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2;
          const binIndex = Math.floor((i / rayCount) * (bufferLength * 0.8));
          const val = dataArray[binIndex] || 0;
          const rayLength = Math.max(6, (val / 255) * (height * 0.18));

          const x1 = centerX + Math.cos(angle) * baseRadius;
          const y1 = centerY + Math.sin(angle) * baseRadius;
          const x2 = centerX + Math.cos(angle) * (baseRadius + rayLength);
          const y2 = centerY + Math.sin(angle) * (baseRadius + rayLength);

          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, '#06b6d4');
          grad.addColorStop(1, '#a855f7');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [audioVisualizerMode, isPlaying]);

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center select-none overflow-hidden bg-gradient-to-b from-[#080d1a] via-[#05070d] to-[#020306]">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }} />

      {/* Main Center Stage: Spinning Vinyl & Track Info */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 max-w-lg px-6 text-center">
        {/* Vinyl Record Disc */}
        <div className="relative group cursor-pointer" onClick={() => setActivePanel('audio')}>
          {/* Subtle Outer Neon Ring */}
          <div
            className={`absolute -inset-3 rounded-full blur-xl transition-all duration-700 ${
              isPlaying
                ? 'bg-gradient-to-tr from-cyan-500/30 to-purple-500/30 scale-105 opacity-100'
                : 'bg-transparent opacity-0'
            }`}
          />

          {/* Vinyl Body */}
          <div
            className={`
              relative w-44 h-44 sm:w-56 sm:h-56 rounded-full
              bg-gradient-to-tr from-[#12141a] via-[#1a1d26] to-[#0d0f14]
              border-4 border-white/10 shadow-2xl shadow-black
              flex items-center justify-center
              transition-transform duration-700
              ${isPlaying ? 'animate-spin' : ''}
            `}
            style={{ animationDuration: '6s' }}
          >
            {/* Vinyl Grooves Texture */}
            <div className="absolute inset-2 rounded-full border border-white/[0.04]" />
            <div className="absolute inset-5 rounded-full border border-white/[0.05]" />
            <div className="absolute inset-8 rounded-full border border-white/[0.04]" />
            <div className="absolute inset-11 rounded-full border border-white/[0.06]" />
            <div className="absolute inset-14 rounded-full border border-white/[0.03]" />

            {/* Vinyl Specular Light Sheen */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />

            {/* Center Label */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-inner border-2 border-white/20">
              <Disc3 className="w-8 h-8 text-white drop-shadow-md" />
              {/* Center spindle hole */}
              <div className="absolute w-3.5 h-3.5 rounded-full bg-[#05070d] border border-white/40 shadow-inner" />
            </div>
          </div>
        </div>

        {/* Track Title & Metadata Badges */}
        <div className="flex flex-col items-center gap-2 max-w-full">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider uppercase ${
                isLossless
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}
            >
              {isLossless ? `${ext} LOSSLESS` : `${ext} AUDIO`}
            </span>
            {fileSize > 0 && (
              <span className="text-[10px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                {(fileSize / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
            <span className="text-[10px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
              10-Band EQ Active
            </span>
          </div>

          <h2
            className="text-lg sm:text-xl font-bold text-white tracking-tight truncate max-w-full px-2"
            title={fileName || 'Audio Track'}
          >
            {fileName || 'Audio Track'}
          </h2>

          <p className="text-xs text-white/50 flex items-center gap-1.5 font-mono">
            <span>MASTER CLOUD Audio Studio</span>
            <span>•</span>
            <span className="text-cyan-400">Zero Latency Web Audio</span>
          </p>
        </div>

        {/* Interactive Floating Quick-Actions */}
        <div className="flex items-center gap-2 mt-1">
          {/* Visualizer Mode Toggle Button */}
          <button
            onClick={cycleVisualizerMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all shadow-sm"
            title={`Current Visualizer: ${audioVisualizerMode.toUpperCase()} (Click to switch)`}
          >
            {audioVisualizerMode === 'bars' && <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />}
            {audioVisualizerMode === 'wave' && <Activity className="w-3.5 h-3.5 text-purple-400" />}
            {audioVisualizerMode === 'circle' && <Radio className="w-3.5 h-3.5 text-pink-400" />}
            {audioVisualizerMode === 'off' && <EyeOff className="w-3.5 h-3.5 text-white/40" />}
            <span className="capitalize">{audioVisualizerMode} Visualizer</span>
          </button>

          {/* Equalizer Quick Open Button */}
          <button
            onClick={() => setActivePanel('audio')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm shadow-cyan-500/10"
            title="Open 10-Band Equalizer & Studio (E)"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Equalizer (E)</span>
          </button>
        </div>
      </div>

      {/* Real-time Spectrum Canvas (spans across the bottom / center) */}
      <canvas
        ref={canvasRef}
        className="absolute bottom-16 sm:bottom-20 left-0 right-0 w-full h-44 sm:h-56 pointer-events-none z-0"
      />
    </div>
  );
}
