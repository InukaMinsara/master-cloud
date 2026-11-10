import React from 'react';
import {
  Sparkles,
  Zap,
  SplitSquareVertical,
  X,
  RotateCcw,
  Sliders,
  Check,
  Tv,
  Film,
  Layers,
} from 'lucide-react';
import { useVideoPlayerStore, QualityBoostPreset } from '@/stores/videoPlayerStore';

export function QualityBoostModal() {
  const activePanel = useVideoPlayerStore((s) => s.activePanel);
  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);
  const resolution = useVideoPlayerStore((s) => s.resolution);
  const qualitySettings = useVideoPlayerStore((s) => s.qualitySettings);
  const setQualityBoostPreset = useVideoPlayerStore((s) => s.setQualityBoostPreset);
  const updateQualityBoostSettings = useVideoPlayerStore((s) => s.updateQualityBoostSettings);
  const toggleQualitySplitScreen = useVideoPlayerStore((s) => s.toggleQualitySplitScreen);

  if (activePanel !== 'quality') return null;

  const resText = resolution ? `${resolution.width}×${resolution.height}` : '720p HD';
  const targetUpscale =
    resolution && resolution.width >= 1920
      ? '3840×2160 (4K UHD)'
      : resolution && resolution.width >= 1280
      ? '1920×1080 (1080p FHD)'
      : '1920×1080 (Super Res)';

  const PRESETS: {
    id: QualityBoostPreset;
    title: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'off',
      title: 'Off (Native)',
      desc: 'Standard un-enhanced video pass-through',
      icon: <Film className="w-4 h-4" />,
      color: 'border-white/10 hover:border-white/20',
    },
    {
      id: 'sd-to-hd',
      title: 'SD ➔ HD',
      desc: 'For 360p/480p videos: Deblock + Edge repair',
      icon: <Layers className="w-4 h-4" />,
      color: 'border-amber-500/30 hover:border-amber-500/50 bg-amber-500/5',
    },
    {
      id: 'hd-to-fhd',
      title: 'HD ➔ FHD',
      desc: 'For 720p: Contrast Adaptive Sharpening (CAS)',
      icon: <Zap className="w-4 h-4" />,
      color: 'border-cyan-500/30 hover:border-cyan-500/50 bg-cyan-500/5',
    },
    {
      id: 'fhd-to-4k',
      title: '4K Super Resolution',
      desc: '1080p ➔ 4K: Ultra texture peaking & anti-blur',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5',
    },
    {
      id: 'anime',
      title: 'Anime & Line Art',
      desc: 'Sharp contour lines + dynamic color vibrance',
      icon: <Tv className="w-4 h-4" />,
      color: 'border-pink-500/30 hover:border-pink-500/50 bg-pink-500/5',
    },
    {
      id: 'custom',
      title: 'Custom Pro Mode',
      desc: 'Manual tuning across all 5 shader parameters',
      icon: <Sliders className="w-4 h-4" />,
      color: 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/5',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0c1017] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 via-cyan-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30 shadow-md">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Video Quality Boost & Super-Resolution</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  GPU WebGL
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Real-time Contrast Adaptive Sharpening (FSR/CAS), Edge Peaking & Deblocking
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePanel('none')}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Target Upscaling Status Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-black border border-cyan-500/20 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                Upscaling Stream Pipeline
              </span>
              <div className="flex items-center gap-2 mt-0.5 text-sm font-semibold">
                <span className="text-white/70">{resText} Native</span>
                <span className="text-cyan-400">➔</span>
                <span className="text-cyan-300 font-bold">{targetUpscale}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>60 FPS ZERO-LAG</span>
              </span>
            </div>
          </div>

          {/* Split-Screen Before/After View Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2.5">
              <SplitSquareVertical className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-semibold text-white block">
                  Split-Screen Before / After Comparison
                </span>
                <span className="text-[11px] text-white/40">
                  Drag the line on the video canvas to compare original vs enhanced quality
                </span>
              </div>
            </div>
            <button
              onClick={toggleQualitySplitScreen}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                qualitySettings.splitScreen
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
              }`}
            >
              {qualitySettings.splitScreen ? 'Active (Split ON)' : 'Enable Split View'}
            </button>
          </div>

          {/* Preset Selector Grid */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-white/80 block">Select Upscaling Profile</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESETS.map((p) => {
                const isSelected = qualitySettings.preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setQualityBoostPreset(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex items-start gap-3 ${
                      p.color
                    } ${
                      isSelected
                        ? 'ring-2 ring-cyan-400 bg-cyan-500/10 border-cyan-400'
                        : 'bg-white/[0.02]'
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-white/5 text-white/80 shrink-0">
                      {p.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{p.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <span className="text-[10px] text-white/50 block mt-0.5 leading-snug">
                        {p.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shader Sliders */}
          <div className="space-y-3.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80">Fine-Tuning Controls</span>
              <span className="text-[10px] font-mono text-cyan-400">
                {qualitySettings.preset.toUpperCase()} PRESET
              </span>
            </div>

            {/* Sharpness (CAS) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Sharpness (Contrast Adaptive CAS)</span>
                <span className="font-mono text-cyan-300 font-bold">{qualitySettings.sharpness}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={qualitySettings.sharpness}
                onChange={(e) => updateQualityBoostSettings({ sharpness: Number(e.target.value) })}
                className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Edge Peaking */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Edge Peaking & Texture Detail</span>
                <span className="font-mono text-purple-300 font-bold">{qualitySettings.edgePeaking}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={qualitySettings.edgePeaking}
                onChange={(e) => updateQualityBoostSettings({ edgePeaking: Number(e.target.value) })}
                className="w-full accent-purple-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Deblock / Denoise */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Deblock & Denoise (Compression Smoothing)</span>
                <span className="font-mono text-amber-300 font-bold">{qualitySettings.deblock}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={qualitySettings.deblock}
                onChange={(e) => updateQualityBoostSettings({ deblock: Number(e.target.value) })}
                className="w-full accent-amber-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* HDR Contrast */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/70">HDR Dynamic Range & Contrast S-Curve</span>
                <span className="font-mono text-cyan-300 font-bold">{qualitySettings.hdrContrast}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={qualitySettings.hdrContrast}
                onChange={(e) => updateQualityBoostSettings({ hdrContrast: Number(e.target.value) })}
                className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Color Vibrance & Saturation</span>
                <span className="font-mono text-pink-300 font-bold">{qualitySettings.saturation}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={qualitySettings.saturation}
                onChange={(e) => updateQualityBoostSettings({ saturation: Number(e.target.value) })}
                className="w-full accent-pink-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <button
            onClick={() => setQualityBoostPreset('off')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Native</span>
          </button>

          <button
            onClick={() => setActivePanel('none')}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
