import React, { useState } from 'react';
import {
  Volume2,
  Sliders,
  RotateCcw,
  X,
  Sparkles,
  Check,
} from 'lucide-react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { EQ_FREQUENCIES, AUDIO_PRESETS } from '@/services/audioStudioEngine';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function formatFrequency(freq: number): string {
  if (freq >= 1000) return `${freq / 1000}kHz`;
  return `${freq}Hz`;
}

function formatGain(gain: number): string {
  if (gain > 0) return `+${gain}dB`;
  return `${gain}dB`;
}

function formatPan(pan: number): string {
  if (pan === 0) return 'Center';
  if (pan < 0) return `L ${Math.round(Math.abs(pan) * 100)}%`;
  return `R ${Math.round(pan * 100)}%`;
}

export function AudioStudioModal() {
  const [eqView, setEqView] = useState<'vertical' | 'horizontal'>('vertical');

  const eqGains = useVideoPlayerStore((s) => s.eqGains);
  const eqPreset = useVideoPlayerStore((s) => s.eqPreset);
  const stereoPan = useVideoPlayerStore((s) => s.stereoPan);
  const audioDelay = useVideoPlayerStore((s) => s.audioDelay);
  const bassGain = useVideoPlayerStore((s) => s.bassGain);
  const trebleGain = useVideoPlayerStore((s) => s.trebleGain);

  const setEqBand = useVideoPlayerStore((s) => s.setEqBand);
  const setEqPreset = useVideoPlayerStore((s) => s.setEqPreset);
  const setStereoPan = useVideoPlayerStore((s) => s.setStereoPan);
  const setAudioDelay = useVideoPlayerStore((s) => s.setAudioDelay);
  const setBassGain = useVideoPlayerStore((s) => s.setBassGain);
  const setTrebleGain = useVideoPlayerStore((s) => s.setTrebleGain);
  const resetAudioStudio = useVideoPlayerStore((s) => s.resetAudioStudio);
  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);

  const handleReset = () => {
    resetAudioStudio();
    toast.success('Audio studio settings reset to flat');
  };

  const handlePresetSelect = (presetKey: string) => {
    setEqPreset(presetKey);
    const presetName = AUDIO_PRESETS[presetKey]?.name || presetKey;
    toast.success(`Preset applied: ${presetName}`);
  };

  const audioDelayMs = Math.round(audioDelay * 1000);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setActivePanel('none');
        }
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-xl text-white max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Audio Studio & 10-Band EQ
              </h3>
              <p className="text-xs text-white/50">
                Studio-grade equalizer, tone shaping, stereo balance and audio delay
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs gap-1.5 border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
            <button
              onClick={() => setActivePanel('none')}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. Presets Grid */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Equalizer Presets</span>
            </div>
            {eqPreset === 'custom' && (
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                Custom Tuning
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(AUDIO_PRESETS).map(([key, preset]) => {
              const isActive = eqPreset === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200 shadow-[0_0_16px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                      : 'border-white/5 bg-white/[0.03] text-white/80 hover:bg-white/[0.08] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold truncate">{preset.name}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-white/40 line-clamp-1 mt-0.5">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 10-Band Equalizer */}
        <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>10-Band Graphic Equalizer</span>
              <span className="text-[10px] font-normal text-white/40">(-12dB to +12dB)</span>
            </div>
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 text-[10px]">
              <button
                onClick={() => setEqView('vertical')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  eqView === 'vertical'
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Mixer Rack
              </button>
              <button
                onClick={() => setEqView('horizontal')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  eqView === 'horizontal'
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Sliders
              </button>
            </div>
          </div>

          {eqView === 'vertical' ? (
            /* Vertical 10-Band Channel Strip */
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2 pt-2 pb-1">
              {EQ_FREQUENCIES.map((freq, index) => {
                const gain = eqGains[index] ?? 0;
                return (
                  <div
                    key={freq}
                    className="flex flex-col items-center gap-2 p-1.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    {/* Value Badge */}
                    <span
                      className={`text-[10px] font-mono font-semibold px-1 py-0.5 rounded min-w-[36px] text-center border ${
                        gain > 0
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : gain < 0
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-white/5 text-white/40 border-white/5'
                      }`}
                    >
                      {formatGain(gain)}
                    </span>

                    {/* Vertical Slider Track Container */}
                    <div className="relative flex items-center justify-center h-32 w-full py-1">
                      {/* 0dB Reference Center Line */}
                      <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-px bg-white/20 pointer-events-none" />

                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={1}
                        value={gain}
                        onChange={(e) => setEqBand(index, Number(e.target.value))}
                        className="h-28 w-2 accent-cyan-400 cursor-pointer appearance-none bg-white/10 rounded-full"
                        style={{
                          WebkitAppearance: 'slider-vertical',
                        } as any}
                        aria-label={`${formatFrequency(freq)} band`}
                      />
                    </div>

                    {/* Frequency Label */}
                    <span className="text-[10px] font-medium text-white/70 truncate">
                      {formatFrequency(freq)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Horizontal Slider List */
            <div className="space-y-2 pt-1">
              {EQ_FREQUENCIES.map((freq, index) => {
                const gain = eqGains[index] ?? 0;
                return (
                  <div
                    key={freq}
                    className="flex items-center gap-3 p-2 rounded-lg bg-black/40 border border-white/5"
                  >
                    <span className="w-14 text-xs font-medium text-white/70">
                      {formatFrequency(freq)}
                    </span>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={gain}
                      onChange={(e) => setEqBand(index, Number(e.target.value))}
                      className="flex-1 accent-cyan-400 cursor-pointer h-1.5"
                    />
                    <span
                      className={`w-14 text-right text-xs font-mono font-semibold px-1.5 py-0.5 rounded border ${
                        gain > 0
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : gain < 0
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-white/5 text-white/40 border-white/5'
                      }`}
                    >
                      {formatGain(gain)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Tone Shaping & Spatial Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Quick Tone Controls: Bass & Treble */}
          <div className="space-y-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80">Tone Controls</span>
              <button
                onClick={() => {
                  setBassGain(0);
                  setTrebleGain(0);
                }}
                className="text-[10px] text-white/40 hover:text-white/80 transition-colors"
              >
                Reset Tone
              </button>
            </div>

            {/* Bass Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Bass (Low Shelf 100Hz)</span>
                <span
                  className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                    bassGain > 0
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      : bassGain < 0
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-white/5 text-white/40 border-white/5'
                  }`}
                >
                  {formatGain(bassGain)}
                </span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={bassGain}
                onChange={(e) => setBassGain(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5"
              />
            </div>

            {/* Treble Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Treble (High Shelf 10kHz)</span>
                <span
                  className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                    trebleGain > 0
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      : trebleGain < 0
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-white/5 text-white/40 border-white/5'
                  }`}
                >
                  {formatGain(trebleGain)}
                </span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={trebleGain}
                onChange={(e) => setTrebleGain(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5"
              />
            </div>
          </div>

          {/* Spatial & Sync: Balance & Audio Delay */}
          <div className="space-y-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80">Spatial & Sync</span>
              <button
                onClick={() => {
                  setStereoPan(0);
                  setAudioDelay(0);
                }}
                className="text-[10px] text-white/40 hover:text-white/80 transition-colors"
              >
                Reset Spatial
              </button>
            </div>

            {/* Stereo Pan Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Stereo Balance</span>
                <span className="font-mono text-[11px] font-semibold text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  {formatPan(stereoPan)}
                </span>
              </div>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={stereoPan}
                onChange={(e) => setStereoPan(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5"
              />
              <div className="flex items-center justify-between text-[10px] text-white/40 px-0.5">
                <span>Left</span>
                <span>Center</span>
                <span>Right</span>
              </div>
            </div>

            {/* Audio Delay Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">A/V Sync Delay</span>
                <span className="font-mono text-[11px] font-semibold text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  {audioDelayMs}ms
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={500}
                step={10}
                value={audioDelayMs}
                onChange={(e) => setAudioDelay(Number(e.target.value) / 1000)}
                className="w-full accent-cyan-400 cursor-pointer h-1.5"
              />
              <div className="flex items-center justify-between text-[10px] text-white/40 px-0.5">
                <span>0ms (Default)</span>
                <span>250ms</span>
                <span>500ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
