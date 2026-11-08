import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Trash2,
  Edit2,
  Check,
  X,
  Plus,
  Clock,
  Layers,
  Sliders,
  Flag,
  RotateCcw,
} from 'lucide-react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function formatSceneTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
}

export function SceneDetectionModal({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  const [sensitivity, setSensitivity] = useState(35);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [newSceneStart, setNewSceneStart] = useState('');
  const [newSceneLabel, setNewSceneLabel] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const detectedScenes = useVideoPlayerStore((s) => s.detectedScenes);
  const isDetectingScenes = useVideoPlayerStore((s) => s.isDetectingScenes);
  const sceneDetectionProgress = useVideoPlayerStore((s) => s.sceneDetectionProgress);
  const duration = useVideoPlayerStore((s) => s.duration);
  const currentTime = useVideoPlayerStore((s) => s.currentTime);

  const startSceneDetection = useVideoPlayerStore((s) => s.startSceneDetection);
  const cancelSceneDetection = useVideoPlayerStore((s) => s.cancelSceneDetection);
  const applyScenesAsMarkers = useVideoPlayerStore((s) => s.applyScenesAsMarkers);
  const addCustomScene = useVideoPlayerStore((s) => s.addCustomScene);
  const updateSceneLabel = useVideoPlayerStore((s) => s.updateSceneLabel);
  const removeScene = useVideoPlayerStore((s) => s.removeScene);
  const setCurrentTime = useVideoPlayerStore((s) => s.setCurrentTime);
  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);

  const handleStartDetection = async () => {
    try {
      toast.info('Starting Smart Scene Detection…');
      await startSceneDetection(sensitivity);
      toast.success('Scene detection complete!');
    } catch {
      toast.error('Scene detection failed.');
    }
  };

  const handleApplyMarkers = () => {
    applyScenesAsMarkers();
    toast.success(`Converted ${detectedScenes.length} scenes into Timeline Chapter Markers!`);
  };

  const jumpToScene = (start: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = start;
      setCurrentTime(start);
      toast.info(`Jumped to scene: ${formatSceneTime(start)}`);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const startSec = parseFloat(newSceneStart);
    if (isNaN(startSec) || startSec < 0 || startSec > duration) {
      toast.error('Invalid start timestamp.');
      return;
    }
    const label = newSceneLabel.trim() || `Chapter ${detectedScenes.length + 1}`;
    addCustomScene(startSec, duration, label);
    setNewSceneStart('');
    setNewSceneLabel('');
    setIsAddingCustom(false);
    toast.success('Custom chapter added!');
  };

  const handleSaveEdit = (id: string) => {
    if (editLabel.trim()) {
      updateSceneLabel(id, editLabel.trim());
    }
    setEditingId(null);
  };

  return (
    <div
      data-controls="true"
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl text-white max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Smart Scene & Chapter Detection
              </h2>
              <p className="text-xs text-white/50">
                Analyze local frames, detect visual transitions, and generate navigable timeline chapters.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePanel('none')}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detection Controls Bar */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs font-semibold text-white/90">Sensitivity Threshold:</span>
              <input
                type="range"
                min={15}
                max={60}
                value={sensitivity}
                disabled={isDetectingScenes}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="flex-1 vp-range"
              />
              <span className="text-xs font-mono text-cyan-300 w-8 text-right font-bold">
                {sensitivity}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isDetectingScenes ? (
                <Button
                  onClick={cancelSceneDetection}
                  variant="destructive"
                  size="sm"
                  className="rounded-xl h-8 gap-1.5 text-xs font-semibold"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel ({sceneDetectionProgress}%)
                </Button>
              ) : (
                <Button
                  onClick={handleStartDetection}
                  variant="gradient"
                  size="sm"
                  className="rounded-xl h-8 gap-1.5 text-xs font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Detect Scenes
                </Button>
              )}

              {detectedScenes.length > 0 && !isDetectingScenes && (
                <Button
                  onClick={handleApplyMarkers}
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-8 gap-1.5 text-xs font-semibold border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Apply as Markers
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar when scanning */}
          {isDetectingScenes && (
            <div className="space-y-1">
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-200"
                  style={{ width: `${sceneDetectionProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/50 font-mono">
                <span>Analyzing frame luminance & color shifts…</span>
                <span>{sceneDetectionProgress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Scene Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
          {detectedScenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-white/50 space-y-2">
              <Layers className="w-8 h-8 text-white/20" />
              <p className="text-xs">No scenes detected yet.</p>
              <p className="text-[11px] text-white/40 max-w-xs">
                Click &quot;Detect Scenes&quot; to automatically segment the video, or add custom chapter markers manually.
              </p>
            </div>
          ) : (
            detectedScenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="group flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all gap-3"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => jumpToScene(scene.start)}
                  className="relative w-20 h-12 rounded-lg bg-black/60 overflow-hidden shrink-0 border border-white/10 cursor-pointer flex items-center justify-center group-hover:border-cyan-400 transition-colors"
                >
                  {scene.thumbnailDataUrl ? (
                    <img
                      src={scene.thumbnailDataUrl}
                      alt={scene.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Clock className="w-4 h-4 text-white/40" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {editingId === scene.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="bg-black/60 border border-cyan-400 rounded-lg px-2 py-0.5 text-xs text-white outline-none w-full"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(scene.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(scene.id)}
                        className="p-1 rounded text-cyan-400 hover:bg-white/10"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{scene.label}</span>
                      <button
                        onClick={() => {
                          setEditingId(scene.id);
                          setEditLabel(scene.label);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white transition-opacity"
                        title="Edit label"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5 font-mono">
                    <span>
                      {formatSceneTime(scene.start)} ➔ {formatSceneTime(scene.end)}
                    </span>
                    <span>•</span>
                    <span>Duration: {Math.round(scene.end - scene.start)}s</span>
                    {scene.differenceScore !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-cyan-300">Δ {scene.differenceScore}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    onClick={() => jumpToScene(scene.start)}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-lg gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Play
                  </Button>
                  <button
                    onClick={() => removeScene(scene.id)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove scene"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Manual Chapter Addition */}
        <div className="pt-2 border-t border-white/10 shrink-0">
          {isAddingCustom ? (
            <form onSubmit={handleAddCustom} className="flex items-center gap-2 flex-wrap">
              <input
                type="number"
                step="0.1"
                placeholder="Time (sec)"
                value={newSceneStart}
                onChange={(e) => setNewSceneStart(e.target.value)}
                className="w-24 px-2.5 py-1.5 text-xs rounded-xl bg-black/50 border border-white/15 text-white outline-none"
                required
              />
              <input
                type="text"
                placeholder="Chapter name (e.g. Keynote Demo)"
                value={newSceneLabel}
                onChange={(e) => setNewSceneLabel(e.target.value)}
                className="flex-1 min-w-[160px] px-2.5 py-1.5 text-xs rounded-xl bg-black/50 border border-white/15 text-white outline-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewSceneStart(currentTime.toFixed(1));
                }}
                className="h-8 text-xs text-cyan-300 hover:bg-white/10"
              >
                Use Current Time
              </Button>
              <Button type="submit" variant="gradient" size="sm" className="h-8 text-xs font-semibold">
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingCustom(false)}
                className="h-8 text-xs text-white/60"
              >
                Cancel
              </Button>
            </form>
          ) : (
            <button
              onClick={() => {
                setNewSceneStart(currentTime.toFixed(1));
                setIsAddingCustom(true);
              }}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Chapter at {formatSceneTime(currentTime)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
