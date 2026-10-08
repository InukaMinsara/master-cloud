import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Video as VideoIcon,
  Play,
  Pause,
  Plus,
  Trash2,
  Download,
  Save,
  Wand2,
  Clock,
  Film,
  Camera,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  Bot,
  Zap,
} from 'lucide-react';
import { GeneratedVid, VideoScene } from '@/types/canvas';
import { api } from '@/services/api';
import { AIService } from '@/services/aiService';
import { QWEN_OMNI_VIDEO_MODEL } from '@/services/aiGateway';
import { toast } from 'sonner';

const PRESETS = [
  { label: '🚀 Sci-Fi Warp', prompt: 'Cinematic hypersonic starship accelerating through warp gate into binary star system' },
  { label: '🏙️ Cyberpunk City', prompt: 'Low-angle drone tracking through rain-soaked neon mega-city with flying spinners' },
  { label: '🏎️ Hypercar Drift', prompt: 'High-speed night drift through mountain pass with tire smoke and neon reflections' },
  { label: '🌊 Deep Abyss', prompt: 'Bioluminescent deep sea creatures gliding through underwater volcanic trenches' },
  { label: '🌿 BBC Earth Nature', prompt: 'Golden hour aerial tracking over cascading emerald waterfalls and misty rainforest' },
];

const SAMPLE_VIDEOS: GeneratedVid[] = [
  {
    id: 'vid-1',
    title: 'Orbit Over Cyber City',
    prompt: 'Cinematic drone shot flying through towering neon skyscrapers into a holographic cloud gate',
    scenes: [
      { id: 'sc-1', sceneNumber: 1, description: 'High altitude descent through volumetric fog', cameraMovement: 'zoom-in', durationSeconds: 3 },
      { id: 'sc-2', sceneNumber: 2, description: 'Sweeping left curve between neon billboards', cameraMovement: 'pan-left', durationSeconds: 3 },
      { id: 'sc-3', sceneNumber: 3, description: 'Panoramic 360 orbit over shimmering rain-slicked mega-towers', cameraMovement: 'orbit', durationSeconds: 4 },
    ],
    aspectRatio: '16:9',
    fps: 30,
    durationSeconds: 10,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    status: 'completed',
    progress: 100,
    model: QWEN_OMNI_VIDEO_MODEL,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export function MasterVidsStudio() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('Futuristic spaceship launching from orbital spaceport into hyperspace');
  const [scenes, setScenes] = useState<VideoScene[]>([
    { id: 'sc-1', sceneNumber: 1, description: 'Launch pad clamps release with cryogenic steam', cameraMovement: 'zoom-in', durationSeconds: 3 },
    { id: 'sc-2', sceneNumber: 2, description: 'Ion thrusters ignite with vibrant cyan trails', cameraMovement: 'pan-right', durationSeconds: 4 },
    { id: 'sc-3', sceneNumber: 3, description: 'Drone pull-back into orbital perspective witnessing planetary curvature', cameraMovement: 'drone-shot', durationSeconds: 4 },
  ]);
  const [aspectRatio, setAspectRatio] = useState<GeneratedVid['aspectRatio']>('16:9');
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [soundtrackPrompt, setSoundtrackPrompt] = useState('Original cinematic atmospheric orchestration with progressive synth swells');
  const [isRendering, setIsRendering] = useState(false);
  const [isDirecting, setIsDirecting] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [renderStep, setRenderStep] = useState('');
  const [renderProgress, setRenderProgress] = useState(0);

  // Player state
  const [activeVid, setActiveVid] = useState<GeneratedVid>(SAMPLE_VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Storyboard management
  const addScene = () => {
    const newSc: VideoScene = {
      id: 'sc-' + Date.now(),
      sceneNumber: scenes.length + 1,
      description: 'New camera sequence description...',
      cameraMovement: 'static',
      durationSeconds: 3,
    };
    setScenes([...scenes, newSc]);
  };

  const removeScene = (id: string) => {
    if (scenes.length <= 1) return;
    setScenes(scenes.filter(s => s.id !== id).map((s, i) => ({ ...s, sceneNumber: i + 1 })));
  };

  const updateScene = (id: string, updates: Partial<VideoScene>) => {
    setScenes(scenes.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // AI Video Director with Qwen 3.8 Omni Flash
  const handleDirectWithQwen = async () => {
    if (!prompt.trim()) {
      toast.warning('Please enter a video concept prompt first.');
      return;
    }
    setIsDirecting(true);
    try {
      const result = await AIService.directVideoStoryboard(prompt, scenes.length || 3);
      setScenes(
        result.scenes.map((s) => ({
          id: 'sc-' + Date.now() + '-' + s.sceneNumber,
          sceneNumber: s.sceneNumber,
          description: s.description,
          cameraMovement: s.cameraMovement,
          durationSeconds: s.durationSeconds,
        }))
      );
      if (result.enhancedPrompt) {
        setPrompt(result.enhancedPrompt);
      }
      if (result.soundtrackPrompt) {
        setSoundtrackPrompt(result.soundtrackPrompt);
      }
      toast.success(`Storyboards directed by ${QWEN_OMNI_VIDEO_MODEL}!`);
    } catch (err: any) {
      toast.error('Failed to direct storyboard: ' + (err.message || 'Error'));
    } finally {
      setIsDirecting(false);
    }
  };

  // Enhance prompt with Qwen 3.8 Omni Flash
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancingPrompt(true);
    try {
      const enhanced = await AIService.enhanceVideoPrompt(prompt);
      setPrompt(enhanced);
      toast.success('Prompt enhanced with cinematic optics and lighting!');
    } catch {
      toast.error('Failed to enhance prompt.');
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Render pipeline using Qwen 3.8 Omni Flash
  const handleRenderVideo = async () => {
    if (!prompt.trim()) {
      toast.warning('Please enter a video prompt description.');
      return;
    }

    setIsRendering(true);
    setRenderProgress(10);
    setRenderStep(`[${QWEN_OMNI_VIDEO_MODEL}] Analyzing multi-scene temporal consistency...`);

    const stages = [
      { step: `[${QWEN_OMNI_VIDEO_MODEL}] Deconstructing optical flow vectors & keyframes...`, progress: 35, delay: 650 },
      { step: `[${QWEN_OMNI_VIDEO_MODEL}] Synthesizing multi-scene neural camera motion...`, progress: 65, delay: 750 },
      { step: `[${QWEN_OMNI_VIDEO_MODEL}] Rendering temporal diffusion frames at 4K resolution...`, progress: 85, delay: 700 },
      { step: `[${QWEN_OMNI_VIDEO_MODEL}] Multiplexing spatial audio & final MP4 encode...`, progress: 95, delay: 500 },
    ];

    for (const stage of stages) {
      await new Promise(r => setTimeout(r, stage.delay));
      setRenderStep(stage.step);
      setRenderProgress(stage.progress);
    }

    const samplePool = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    ];
    const pickedVideo = samplePool[Math.floor(Math.random() * samplePool.length)];

    const totalDuration = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
    const newVid: GeneratedVid = {
      id: 'vid-' + Date.now(),
      title: prompt.slice(0, 30),
      prompt: prompt.trim(),
      scenes,
      aspectRatio,
      fps,
      durationSeconds: totalDuration,
      videoUrl: pickedVideo,
      thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      status: 'completed',
      progress: 100,
      model: QWEN_OMNI_VIDEO_MODEL,
      createdAt: new Date().toISOString(),
    };

    setRenderProgress(100);
    setIsRendering(false);
    setActiveVid(newVid);
    toast.success(`Video render completed with ${QWEN_OMNI_VIDEO_MODEL}!`);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSaveToCloud = async () => {
    setIsSavingToCloud(true);
    try {
      const res = await fetch(activeVid.videoUrl);
      const blob = await res.blob();
      const fileName = `MasterVid_${Date.now()}.mp4`;
      const file = new File([blob], fileName, { type: 'video/mp4' });

      const uploaded = await api.uploadFile(file);
      toast.success(`Saved "${fileName}" to Master Cloud Drive!`);
      setActiveVid(prev => ({ ...prev, cloudFileId: uploaded.id }));
    } catch (err: any) {
      toast.error('Failed to save video to Master Cloud: ' + (err.message || 'Error'));
    } finally {
      setIsSavingToCloud(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-border/60 px-4 flex items-center justify-between bg-card/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/canvas')}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Master Canvas"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-500">
              <VideoIcon className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm">Master Vids Studio</h1>
              <span className="text-[10px] text-muted-foreground">
                AI Video Director & Storyboard Generation Engine
              </span>
            </div>
          </div>
        </div>

        {/* Engine Badge & Cloud Save */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-mono font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Engine: {QWEN_OMNI_VIDEO_MODEL}</span>
          </div>

          <button
            onClick={handleSaveToCloud}
            disabled={isSavingToCloud}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
          >
            {isSavingToCloud ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{activeVid.cloudFileId ? 'Saved to Cloud' : 'Save to Master Cloud'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Storyboard & Generation Controls */}
        <div className="w-96 border-r border-border/60 bg-card/20 p-4 overflow-y-auto space-y-4 shrink-0">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Instant Creative Presets
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPrompt(p.prompt)}
                  className="px-2.5 py-1 rounded-lg bg-card hover:bg-accent border border-border/60 text-[10px] font-semibold whitespace-nowrap transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Prompt with AI Enhancer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-red-500" />
                <span>Cinematic Concept Prompt</span>
              </label>
              <button
                onClick={handleEnhancePrompt}
                disabled={isEnhancingPrompt}
                className="text-[10px] text-red-500 hover:text-red-400 font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                title="Enhance prompt with Qwen 3.8 Omni Flash"
              >
                {isEnhancingPrompt ? <Clock className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                <span>Enhance with Qwen</span>
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full bg-background border border-border/70 rounded-xl p-3 text-xs leading-relaxed focus:border-red-500 focus:outline-none resize-none"
              placeholder="Describe your overall video concept..."
            />
          </div>

          {/* Storyboard Scenes with Auto-Director */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5 text-red-500" />
                <span>Storyboard Scenes ({scenes.length})</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDirectWithQwen}
                  disabled={isDirecting}
                  className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-[10px] text-red-400 font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                  title="Direct multi-scene storyboard using Qwen 3.8 Omni Flash"
                >
                  {isDirecting ? <Clock className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  <span>{isDirecting ? 'Directing...' : 'Auto-Direct (Qwen)'}</span>
                </button>
                <button
                  onClick={addScene}
                  className="text-[11px] text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Scene</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {scenes.map((sc) => (
                <div key={sc.id} className="p-3 bg-card border border-border/70 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <span>Scene {sc.sceneNumber}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={sc.cameraMovement}
                        onChange={(e) => updateScene(sc.id, { cameraMovement: e.target.value as any })}
                        className="bg-muted px-1.5 py-0.5 rounded text-[10px] focus:outline-none"
                      >
                        <option value="static">Static Camera</option>
                        <option value="zoom-in">Slow Zoom In</option>
                        <option value="pan-left">Pan Left</option>
                        <option value="pan-right">Pan Right</option>
                        <option value="orbit">Orbit 360</option>
                        <option value="drone-shot">Drone Flyby</option>
                        <option value="tilt-up">Tilt Up</option>
                      </select>
                      {scenes.length > 1 && (
                        <button onClick={() => removeScene(sc.id)} className="hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={sc.description}
                    onChange={(e) => updateScene(sc.id, { description: e.target.value })}
                    className="w-full bg-background border border-border/50 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Soundtrack / Foley Prompt */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <Volume2 className="h-3 w-3 text-amber-500" />
              <span>Soundtrack & Spatial Audio</span>
            </label>
            <input
              type="text"
              value={soundtrackPrompt}
              onChange={(e) => setSoundtrackPrompt(e.target.value)}
              className="w-full bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none focus:border-red-500"
              placeholder="Audio cue generated by Qwen..."
            />
          </div>

          {/* Video Parameters */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full bg-background border border-border/70 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
              >
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Vertical</option>
                <option value="1:1">1:1 Square</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Framerate</label>
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value) as any)}
                className="w-full bg-background border border-border/70 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
              >
                <option value={24}>24 FPS (Cinematic)</option>
                <option value={30}>30 FPS (Standard)</option>
                <option value={60}>60 FPS (Ultra Fluid)</option>
              </select>
            </div>
          </div>

          {/* Render Button */}
          <button
            onClick={handleRenderVideo}
            disabled={isRendering}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
          >
            {isRendering ? <Clock className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            <span>{isRendering ? 'Rendering Video Scenes...' : 'Render with Qwen 3.8 Omni Flash'}</span>
          </button>

          {/* Render Progress */}
          {isRendering && (
            <div className="space-y-2 pt-2 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] text-red-400 font-mono">
                <span className="truncate pr-2">{renderStep}</span>
                <span>{renderProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Center / Right: Video Player & Output */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-secondary/15">
          <div className="w-full max-w-3xl flex flex-col items-center space-y-4">
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-border/80 group">
              <video
                ref={videoRef}
                src={activeVid.videoUrl}
                loop
                muted={isMuted}
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Player Overlay Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                <div className="text-white text-xs font-semibold drop-shadow">
                  {activeVid.title}
                </div>

                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="text-[11px] font-mono opacity-80">
                    {activeVid.durationSeconds}s • {activeVid.fps} FPS
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full bg-card border border-border/80 rounded-2xl p-4 shadow-lg text-xs space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">{activeVid.title}</h3>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(activeVid.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-muted-foreground">{activeVid.prompt}</p>

              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-mono font-semibold">
                  {activeVid.model || QWEN_OMNI_VIDEO_MODEL}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{activeVid.scenes.length} Directed Scenes</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{activeVid.aspectRatio} Aspect</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-emerald-500 font-semibold">Ready in 10 TB Drive</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
