import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Download,
  Trash2,
  RefreshCw,
  Shield,
  Key,
  Plus,
  Check,
  Database,
  Pin,
  Upload,
  FlaskConical,
  AlertTriangle,
  Activity,
  Lock,
  Sparkles,
  Globe,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { puterAiService, PuterUser, VERIFIED_FREE_CHAT_MODELS } from '@/services/ai/puterAiService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AiModelDescriptor,
  AiProviderDescriptor,
  ProviderProtocol,
  modelRegistry,
} from '@/services/ai/modelRegistry';
import {
  LocalHardwareProfile,
  LocalInferenceSettings,
  PullProgressEvent,
  localBrainManager,
} from '@/services/ai/localBrain';
import {
  CloudPrivacyPolicy,
  cloudBrainManager,
} from '@/services/ai/cloudBrain';
import {
  LongTermMemoryEntry,
  conversationMemory,
} from '@/services/ai/conversationMemory';
import {
  LOCAL_BRAIN_V21_EVAL_SUITE,
  LOCAL_BRAIN_V22_EVAL_SUITE,
  ModelBenchmarkSummary,
  evaluationEngine,
} from '@/services/ai/evaluationEngine';
import { originalBrainController } from '@/services/ai/originalBrainController';
import { resourceManager } from '@/services/resourceManager';

// ============================================================================
// PANEL A: LOCAL BRAIN B MANAGER (Hardware, Ollama Pull/Remove, Custom GGUF)
// ============================================================================
export function LocalBrainManagerPanel() {
  const [hardware, setHardware] = useState<LocalHardwareProfile | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [localModels, setLocalModels] = useState<AiModelDescriptor[]>(() =>
    modelRegistry.listModels({ localOnly: true }),
  );
  const [ollamaUrl, setOllamaUrl] = useState(
    () => modelRegistry.getProvider('ollama')?.baseUrl || 'http://127.0.0.1:11434',
  );
  const [localOpenAiUrl, setLocalOpenAiUrl] = useState(
    () => modelRegistry.getProvider('local-openai')?.baseUrl || 'http://127.0.0.1:1234/v1',
  );
  const [pullModelTag, setPullModelTag] = useState('qwen2.5:3b-instruct-q4_K_M');
  const [pullProgress, setPullProgress] = useState<PullProgressEvent | null>(null);
  const [isPulling, setIsPulling] = useState(false);

  // Custom Local Model Registration Form
  const [customLocalId, setCustomLocalId] = useState('');
  const [customLocalName, setCustomLocalName] = useState('');
  const [customLocalProvider, setCustomLocalProvider] = useState<'ollama' | 'local-openai'>('ollama');
  const [inferSettings, setInferSettings] = useState<LocalInferenceSettings>(() =>
    localBrainManager.getInferenceSettings(),
  );

  const patchInferSettings = (patch: Partial<LocalInferenceSettings>) => {
    const next = localBrainManager.updateInferenceSettings(patch);
    setInferSettings(next);
  };

  const refreshAll = async () => {
    setIsScanning(true);
    try {
      modelRegistry.updateProvider('ollama', { baseUrl: ollamaUrl.trim() });
      modelRegistry.updateProvider('local-openai', { baseUrl: localOpenAiUrl.trim() });
      const hw = await localBrainManager.detectHardwareCapabilities();
      setHardware(hw);
      setLocalModels(modelRegistry.listModels({ localOnly: true }));
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    refreshAll();
    const unsub = modelRegistry.subscribe(() => {
      setLocalModels(modelRegistry.listModels({ localOnly: true }));
    });
    return unsub;
  }, []);

  const handlePull = async (tagToPull: string) => {
    const clean = tagToPull.trim();
    if (!clean || isPulling) return;
    setIsPulling(true);
    setPullProgress({ status: `Connecting to Ollama for ${clean}...` });
    const res = await localBrainManager.pullOllamaModel(clean, 'ollama', (ev) => {
      setPullProgress(ev);
    });
    setIsPulling(false);
    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setLocalModels(modelRegistry.listModels({ localOnly: true }));
  };

  const handleRemove = async (model: AiModelDescriptor) => {
    const res = await localBrainManager.removeOllamaModel(model.id, model.providerId);
    if (res.ok) toast.success(res.message);
    else toast.error(res.message);
    setLocalModels(modelRegistry.listModels({ localOnly: true }));
  };

  const handleAddCustomLocal = () => {
    if (!customLocalId.trim()) {
      toast.error('Enter the local model identifier (e.g. mistral:7b-instruct-q4_K_M or local GGUF name).');
      return;
    }
    const created = localBrainManager.registerCustomLocalModel({
      upstreamModelId: customLocalId.trim(),
      name: customLocalName.trim() || customLocalId.trim(),
      providerId: customLocalProvider,
    });
    setCustomLocalId('');
    setCustomLocalName('');
    toast.success(`Registered "${created.name}". Run Discovery to check runtime status.`);
    refreshAll();
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-400" />
            Brain B — Powerful Local Open-Weight Engine (Zero API Keys)
          </h3>
          <p className="text-xs text-white/50">
            Dynamically discovers local Ollama / llama.cpp / LM Studio runtimes &amp; MASTER AI Original ONNX weights.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isScanning}
          onClick={refreshAll}
          className="text-xs rounded-xl gap-1.5 border-teal-500/30 text-teal-300 hover:bg-teal-500/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Probing Runtimes...' : 'Discover Local Runtimes'}
        </Button>
      </div>

      {/* Hardware & Runtime Telemetry */}
      {hardware && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-white/45">Host Compute &amp; RAM</div>
            <div className="font-bold text-white mt-0.5 truncate" title={hardware.cpuModel || ''}>
              {hardware.cpuCores} Threads
            </div>
            <div className="text-[10px] text-white/55 font-mono truncate">
              {hardware.totalRamGb
                ? `${hardware.freeRamGb ?? '?'} / ${hardware.totalRamGb} GB RAM`
                : `Hint: ${hardware.deviceMemoryGb ? `${hardware.deviceMemoryGb} GB` : 'OS Managed'}`}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-white/45">GPU / CUDA Probe</div>
            <div className={`font-bold mt-0.5 ${hardware.cudaVerified ? 'text-emerald-300' : hardware.gpuName || hardware.webgpuSupported ? 'text-amber-300' : 'text-white/70'}`}>
              {hardware.cudaVerified
                ? 'CUDA Verified'
                : hardware.gpuName
                  ? hardware.gpuVramTotalMb
                    ? `GPU (${hardware.gpuVramTotalMb} MiB)`
                    : 'WebGPU / Driver'
                  : 'CPU / WASM'}
            </div>
            <div className="text-[10px] text-white/50 truncate" title={hardware.cudaVerificationDetail}>
              {hardware.gpuName || hardware.webgpuAdapterName || 'CPU fallback'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-white/45">Ollama Daemon</div>
            <div className={`font-bold mt-0.5 ${hardware.runtimes.ollama.online ? 'text-emerald-300' : 'text-rose-300/80'}`}>
              {hardware.runtimes.ollama.online
                ? `Online (${hardware.runtimes.ollama.modelCount} installed)`
                : 'Offline / Not Running'}
            </div>
            <div className="text-[10px] text-white/45 truncate font-mono">{hardware.runtimes.ollama.endpoint}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-white/45">Loaded In Memory</div>
            <div className={`font-bold mt-0.5 ${hardware.loadedModels.length > 0 ? 'text-teal-300' : 'text-white/60'}`}>
              {hardware.loadedModels.length > 0
                ? `${hardware.loadedModels.length} Active (${hardware.loadedModels.reduce((s, m) => s + m.sizeVramMb, 0)} MiB VRAM)`
                : hardware.runtimes.localOpenAi.online
                  ? `OpenAI API (${hardware.runtimes.localOpenAi.modelCount})`
                  : '0 Resident Models'}
            </div>
            <div className="text-[10px] text-white/45 truncate font-mono">
              Backend: {hardware.executionBackendRecommendation}
            </div>
          </div>
        </div>
      )}

      {/* Honest Offline Warning or Resident VRAM Monitor */}
      {hardware && !hardware.runtimes.ollama.online && !hardware.runtimes.localOpenAi.online && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200/90 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>External Local LLM Runtime Offline:</strong> Start Ollama (<code className="font-mono">ollama serve</code>) or LM Studio/llama.cpp to run Brain B open-weight models. Original Brain deterministic tools remain 100% available offline without API keys.
          </div>
        </div>
      )}

      {hardware && hardware.loadedModels.length > 0 && (
        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 space-y-1.5">
          <div className="text-[11px] font-bold text-teal-200">Currently Loaded in Memory (/api/ps)</div>
          <div className="flex flex-wrap gap-2">
            {hardware.loadedModels.map((proc) => (
              <div key={proc.name} className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[10px] font-mono text-white">
                <span>{proc.name} · {proc.sizeVramMb} MiB VRAM / {proc.sizeMb} MiB RAM</span>
                <button
                  onClick={async () => {
                    const res = await localBrainManager.unloadOllamaModel(proc.name);
                    if (res.ok) toast.success(res.message);
                    else toast.error(res.message);
                    refreshAll();
                  }}
                  className="text-rose-300 hover:underline font-sans"
                >
                  Unload
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hardware-Aware Inference Settings */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs font-bold text-white">Hardware &amp; Inference Settings (Brain B)</div>
          <label className="flex items-center gap-1.5 text-[11px] text-white/75 cursor-pointer">
            <input
              type="checkbox"
              checked={inferSettings.singleHeavyModelGuard}
              onChange={(e) => patchInferSettings({ singleHeavyModelGuard: e.target.checked })}
              className="accent-teal-400"
            />
            Single Heavy Model Guard (prevents 6 GB VRAM OOM)
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
          <label className="text-white/60">
            Compute Mode
            <select
              value={inferSettings.computeMode}
              onChange={(e) => patchInferSettings({ computeMode: e.target.value as 'auto' | 'gpu' | 'cpu' })}
              className="mt-0.5 w-full px-2 py-1 rounded-lg bg-black/50 border border-white/15 text-white outline-none"
            >
              <option value="auto">Auto (GPU/CPU)</option>
              <option value="gpu">Prefer GPU</option>
              <option value="cpu">Force CPU (0 GPU)</option>
            </select>
          </label>
          <label className="text-white/60">
            GPU Layers
            <input
              type="number"
              value={inferSettings.gpuLayers}
              onChange={(e) => patchInferSettings({ gpuLayers: Number(e.target.value) })}
              className="mt-0.5 w-full px-2 py-1 rounded-lg bg-black/50 border border-white/15 text-white font-mono outline-none"
              title="-1 = Auto, 0 = CPU only, or explicit layer count"
            />
          </label>
          <label className="text-white/60">
            CPU Threads
            <input
              type="number"
              min={0}
              max={32}
              value={inferSettings.cpuThreads}
              onChange={(e) => patchInferSettings({ cpuThreads: Math.max(0, Number(e.target.value) || 0) })}
              className="mt-0.5 w-full px-2 py-1 rounded-lg bg-black/50 border border-white/15 text-white font-mono outline-none"
              title="0 = Auto"
            />
          </label>
          <label className="text-white/60">
            Context (num_ctx)
            <select
              value={inferSettings.contextWindowTokens}
              onChange={(e) => patchInferSettings({ contextWindowTokens: Number(e.target.value) })}
              className="mt-0.5 w-full px-2 py-1 rounded-lg bg-black/50 border border-white/15 text-white font-mono outline-none"
            >
              <option value={2048}>2,048</option>
              <option value={4096}>4,096</option>
              <option value={8192}>8,192</option>
              <option value={16384}>16,384</option>
            </select>
          </label>
          <label className="text-white/60">
            Keep-Alive
            <select
              value={inferSettings.keepAlive}
              onChange={(e) => patchInferSettings({ keepAlive: e.target.value as '0' | '2m' | '5m' | '15m' })}
              className="mt-0.5 w-full px-2 py-1 rounded-lg bg-black/50 border border-white/15 text-white font-mono outline-none"
            >
              <option value="0">0 (Unload Immediately)</option>
              <option value="2m">2 minutes</option>
              <option value="5m">5 minutes</option>
              <option value="15m">15 minutes</option>
            </select>
          </label>
        </div>
      </div>

      {/* Local Endpoint Config + Pull Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
        <div className="space-y-2">
          <div className="text-xs font-bold text-white">Runtime Endpoints</div>
          <div className="space-y-1.5 text-[11px]">
            <label className="block text-white/60">
              Ollama Base URL
              <input
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="mt-0.5 w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-white font-mono outline-none focus:border-teal-400"
              />
            </label>
            <label className="block text-white/60">
              Local OpenAI (llama.cpp / LM Studio) URL
              <input
                value={localOpenAiUrl}
                onChange={(e) => setLocalOpenAiUrl(e.target.value)}
                className="mt-0.5 w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-white font-mono outline-none focus:border-teal-400"
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-white">Download Open-Weight Model (Ollama Pull)</div>
          <div className="flex gap-1.5">
            <input
              value={pullModelTag}
              onChange={(e) => setPullModelTag(e.target.value)}
              placeholder="e.g. qwen2.5:3b-instruct-q4_K_M"
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[11px] text-white font-mono outline-none focus:border-teal-400"
            />
            <Button
              size="sm"
              disabled={isPulling}
              onClick={() => handlePull(pullModelTag)}
              className="h-8 text-xs rounded-lg gap-1 bg-teal-600 hover:bg-teal-500 text-white"
            >
              <Download className="w-3.5 h-3.5" /> Pull
            </Button>
          </div>
          {pullProgress && (
            <div className="p-2 rounded-lg bg-black/40 border border-teal-500/30 text-[10px] font-mono text-teal-200">
              {pullProgress.status} {pullProgress.percent !== undefined ? `(${pullProgress.percent}%)` : ''}
            </div>
          )}
          <div className="flex gap-1.5 flex-wrap pt-1">
            <input
              value={customLocalId}
              onChange={(e) => setCustomLocalId(e.target.value)}
              placeholder="Custom ID (e.g. aya-expanse:8b)"
              className="flex-1 min-w-[140px] px-2 py-1 rounded-lg bg-black/50 border border-white/15 text-[10px] text-white font-mono outline-none"
            />
            <select
              value={customLocalProvider}
              onChange={(e) => setCustomLocalProvider(e.target.value as 'ollama' | 'local-openai')}
              className="px-2 py-1 rounded-lg bg-black/60 border border-white/15 text-[10px] text-white outline-none"
            >
              <option value="ollama">Ollama</option>
              <option value="local-openai">Local OpenAI</option>
            </select>
            <Button size="sm" variant="outline" onClick={handleAddCustomLocal} className="h-7 text-[10px] rounded-lg gap-1 border-white/20">
              <Plus className="w-3 h-3" /> Add Custom
            </Button>
          </div>
        </div>
      </div>

      {/* Registered Local Models List */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-white/80">Registered Original &amp; Local Models ({localModels.length})</div>
        <div className="grid grid-cols-1 gap-2">
          {localModels.map((m) => {
            const fit = hardware
              ? localBrainManager.evaluateHardwareFit(m, hardware)
              : { fits: true, targetBackend: 'cpu' as const, reason: '' };
            const isReady = m.availability === 'ready';
            const isActiveLocal = inferSettings.activeLocalModelId === m.id;
            return (
              <div
                key={m.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 flex-wrap ${
                  isActiveLocal ? 'bg-teal-500/10 border-teal-500/35' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">{m.name}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        isReady
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                      }`}
                    >
                      {isReady ? 'Installed · Ready' : m.availability}
                    </span>
                    {m.currentlyLoaded && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Loaded ({m.vramUsedMb || '?'} MiB VRAM)
                      </span>
                    )}
                    {isActiveLocal && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-teal-500/25 text-teal-200 border border-teal-400/40">
                        Active Brain B
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-white/45">
                      {m.parameterCountLabel} · {m.quantization} · {m.diskSizeMb ? `${(m.diskSizeMb / 1024).toFixed(1)} GB disk · ` : ''}{m.contextCapacityTokens.toLocaleString()} ctx · {fit.targetBackend}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/55">
                    {m.availabilityDetail} {fit.reason ? `· ${fit.reason}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isReady && m.brain === 'local' && (
                    <Button
                      size="sm"
                      variant={isActiveLocal ? 'default' : 'outline'}
                      onClick={() => {
                        patchInferSettings({ activeLocalModelId: isActiveLocal ? null : m.id });
                        toast.success(isActiveLocal ? 'Reverted to Auto local model selection.' : `Active Brain B set to ${m.name}`);
                      }}
                      className="h-7 text-[11px] rounded-lg gap-1"
                    >
                      <Check className="w-3 h-3" /> {isActiveLocal ? 'Active' : 'Set Active'}
                    </Button>
                  )}
                  {m.providerId === 'ollama' && !isReady && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPulling}
                      onClick={() => handlePull(m.upstreamModelId)}
                      className="h-7 text-[11px] rounded-lg gap-1 border-teal-500/30 text-teal-300"
                    >
                      <Download className="w-3 h-3" /> Install
                    </Button>
                  )}
                  {(m.providerId === 'ollama' && isReady) || !m.isBuiltIn ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(m)}
                      className="h-7 text-[11px] rounded-lg gap-1 text-rose-300 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PANEL B: PUTER.JS UNIFIED AI GATEWAY & FREE MODEL REGISTRY (ZERO-KEY CLOUD)
// ============================================================================
export function CloudAndRegistryPanel() {
  const [puterUser, setPuterUser] = useState<PuterUser | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFree, setOnlyFree] = useState(true);
  const [catalogModels, setCatalogModels] = useState<any[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [activeModel, setActiveModel] = useState<string>(VERIFIED_FREE_CHAT_MODELS[0].id);

  const checkAuth = async () => {
    const signedIn = await puterAiService.isSignedIn();
    setIsSignedIn(signedIn);
    if (signedIn) {
      const u = await puterAiService.getUser();
      setPuterUser(u);
    } else {
      setPuterUser(null);
    }
  };

  const loadCatalog = async () => {
    setIsLoadingCatalog(true);
    try {
      const models = await puterAiService.listAvailableModels();
      setCatalogModels(models);
    } catch (err) {
      console.warn('Catalog load error:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    checkAuth();
    loadCatalog();
  }, []);

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      await puterAiService.signIn(true);
      await checkAuth();
      toast.success('Successfully connected to Puter.js unified gateway!');
    } catch (err: any) {
      toast.error(err?.message || 'Puter sign in cancelled or failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await puterAiService.signOut();
      await checkAuth();
      toast.info('Signed out of Puter session. Continuing as anonymous guest.');
    } catch (err: any) {
      toast.error('Sign out failed');
    }
  };

  const filteredCatalog = catalogModels.filter((m) => {
    const matchesSearch =
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.provider?.toLowerCase().includes(searchQuery.toLowerCase());
    if (onlyFree) {
      return matchesSearch && m.isFree;
    }
    return matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          Puter.js Unified AI Integration Platform (Zero-Key Cloud)
        </h3>
        <p className="text-xs text-white/50">
          All external cloud AI APIs are securely routed through Puter.js. No developer API keys, no risk of key leaks, 100% free verified models prioritized.
        </p>
      </div>

      {/* Puter Gateway Status Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-cyan-950/20 to-purple-950/30 border border-cyan-500/30 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                Puter.js Central AI Gateway
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
                  $0 Developer Cost
                </span>
              </div>
              <div className="text-[11px] text-white/60">
                {isSignedIn
                  ? `Signed in as ${puterUser?.username || puterUser?.email || 'Puter User'}`
                  : 'Operating in Keyless Guest Mode (Anonymous sessions supported)'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSignOut}
                className="h-8 text-xs rounded-xl border-white/20 text-white hover:bg-white/10 gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={isAuthLoading}
                onClick={handleSignIn}
                className="h-8 text-xs rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold gap-1.5 shadow-lg shadow-cyan-900/30"
              >
                <UserCheck className="w-3.5 h-3.5" /> {isAuthLoading ? 'Connecting...' : 'Connect Puter Account'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px]">
          <div className="p-2 rounded-xl bg-black/40 border border-white/10">
            <div className="text-[10px] text-white/45">Chat Engine</div>
            <div className="font-semibold text-cyan-300">puter.ai.chat()</div>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-white/10">
            <div className="text-[10px] text-white/45">Image Engine</div>
            <div className="font-semibold text-purple-300">puter.ai.txt2img()</div>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-white/10">
            <div className="text-[10px] text-white/45">Video Engine</div>
            <div className="font-semibold text-blue-300">puter.ai.txt2vid()</div>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-white/10">
            <div className="text-[10px] text-white/45">Audio Engine</div>
            <div className="font-semibold text-emerald-300">txt2speech / speech2txt</div>
          </div>
        </div>
      </div>

      {/* Verified Free Models Showcase */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Verified Free Models Chain (Auto-Fallback Ready)
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">100% Free End-User Access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VERIFIED_FREE_CHAT_MODELS.map((m) => {
            const isSelected = activeModel === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setActiveModel(m.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 text-white'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold truncate">{m.name}</div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono shrink-0">
                    FREE
                  </span>
                </div>
                <div className="text-[10px] text-white/45 font-mono truncate mt-0.5">{m.id}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Puter Dynamic Model Catalog */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            Live Puter Catalog ({filteredCatalog.length} models)
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-white/80 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyFree}
                onChange={(e) => setOnlyFree(e.target.checked)}
                className="accent-emerald-400"
              />
              100% Free Models Only
            </label>
            <Button
              size="sm"
              variant="outline"
              disabled={isLoadingCatalog}
              onClick={loadCatalog}
              className="h-7 text-[10px] rounded-lg gap-1 border-white/15"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingCatalog ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search 900+ models by name, provider, or ID..."
          className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
        />

        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {filteredCatalog.slice(0, 30).map((m) => (
            <div
              key={m.id}
              className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white/90 truncate flex items-center gap-2">
                  {m.name}
                  {m.isFree ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      FREE
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white/50 font-mono">
                      User Allowance
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-white/40 font-mono truncate">{m.id}</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setActiveModel(m.id);
                  toast.success(`Selected ${m.name}`);
                }}
                className="h-7 text-[10px] rounded-lg shrink-0 text-cyan-300 hover:bg-cyan-500/20"
              >
                Select
              </Button>
            </div>
          ))}
          {filteredCatalog.length === 0 && (
            <div className="text-center py-6 text-white/40 text-xs">
              No models matching your query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PANEL C: PERSISTENT LONG-TERM SEMANTIC MEMORY MANAGER
// ============================================================================
export function LongTermMemoryPanel() {
  const [search, setSearch] = useState('');
  const [memories, setMemories] = useState<LongTermMemoryEntry[]>(() =>
    conversationMemory.listLongTermMemories(),
  );
  const [newContent, setNewContent] = useState('');

  const reload = (q = search) => {
    setMemories(conversationMemory.listLongTermMemories(q));
  };

  const handleAdd = () => {
    const clean = newContent.trim();
    if (!clean) return;
    const res = conversationMemory.addLongTermMemory({
      content: clean,
      category: 'explicit_note',
      provenance: 'user_explicit_pin',
      pinned: true,
    });
    setNewContent('');
    reload();
    toast.success(
      res.added
        ? 'Added pinned Long-Term Memory entry.'
        : 'Merged with duplicate existing memory instead of duplicating.',
    );
  };

  const handleExportBundle = () => {
    const json = conversationMemory.exportMemoryBundleJson();
    resourceManager.downloadFile(`master_ai_memory_${Date.now()}.json`, json, 'application/json');
    toast.success('Exported full Sessions + Long-Term Memory bundle (.json).');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const res = conversationMemory.importMemoryBundleJson(String(reader.result || ''), 'merge');
        reload();
        toast.success(`Imported ${res.sessionsImported} sessions and ${res.memoriesImported} unique memories.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Invalid memory bundle JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-fuchsia-400" />
            Persistent Long-Term Semantic Memory
          </h3>
          <p className="text-xs text-white/50">
            Stored locally with TF-IDF semantic retrieval &amp; duplicate filtering. Distinct from model weights &amp; newly generated text.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={handleExportBundle} className="h-7 text-[11px] rounded-lg gap-1 border-cyan-500/30 text-cyan-300">
            <Download className="w-3 h-3" /> Export JSON
          </Button>
          <label className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] text-white cursor-pointer">
            <Upload className="w-3 h-3" /> Import
            <input type="file" accept=".json" className="hidden" onChange={handleImportFile} />
          </label>
        </div>
      </div>

      {/* Add Explicit Memory + Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="flex gap-1.5">
          <input
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Add explicit preference or fact to remember..."
            className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white outline-none focus:border-fuchsia-400"
          />
          <Button size="sm" onClick={handleAdd} className="rounded-xl text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> Save
          </Button>
        </div>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reload(e.target.value);
          }}
          placeholder="Semantic search across remembered facts..."
          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white outline-none focus:border-cyan-400"
        />
      </div>

      {/* Memories List */}
      {memories.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-white/50">
          No long-term memories stored yet. Explicit preferences ("Remember that...") or pinned notes appear here.
        </div>
      ) : (
        <div className="space-y-2">
          {memories.map((m) => (
            <div key={m.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                    {m.provenance}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                    {m.category} · importance {m.importanceScore.toFixed(2)}
                  </span>
                  {m.pinned && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Pinned
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/90 leading-relaxed">{m.content}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    conversationMemory.pinLongTermMemory(m.id, !m.pinned);
                    reload();
                  }}
                  className={`p-1.5 rounded-lg border text-xs ${
                    m.pinned ? 'bg-amber-500/20 border-amber-400/40 text-amber-300' : 'border-white/10 text-white/50 hover:text-white'
                  }`}
                  title={m.pinned ? 'Unpin' : 'Pin'}
                >
                  <Pin className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    conversationMemory.deleteLongTermMemory(m.id);
                    reload();
                    toast.info('Memory entry deleted.');
                  }}
                  className="p-1.5 rounded-lg border border-white/10 text-rose-300/70 hover:text-rose-300 hover:bg-rose-500/10"
                  title="Delete memory"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {memories.length > 0 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              conversationMemory.clearLongTermMemories();
              reload();
              toast.info('Cleared all long-term memories.');
            }}
            className="text-xs text-rose-300 hover:bg-rose-500/10 gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Long-Term Memories
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PANEL D: SELF-EVALUATION & MULTI-MODEL BENCHMARK LAB
// ============================================================================
export function EvaluationLabPanel() {
  const [models, setModels] = useState<AiModelDescriptor[]>(() => modelRegistry.listModels({ onlyReady: true }));
  const [selectedModelId, setSelectedModelId] = useState<string>('master-ai-v2-orchestrator');
  const [suiteMode, setSuiteMode] = useState<'quick6' | 'v21_full11' | 'v22_full11'>('v22_full11');
  const [runs, setRuns] = useState<ModelBenchmarkSummary[]>(() => evaluationEngine.listBenchmarkRuns());
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setModels(modelRegistry.listModels({ onlyReady: true }));
    return modelRegistry.subscribe(() => setModels(modelRegistry.listModels({ onlyReady: true })));
  }, []);

  const handleRunEval = async () => {
    const model = modelRegistry.getModel(selectedModelId);
    if (!model) return;
    setIsRunning(true);
    try {
      const targetCases =
        suiteMode === 'v22_full11'
          ? LOCAL_BRAIN_V22_EVAL_SUITE
          : suiteMode === 'v21_full11'
            ? LOCAL_BRAIN_V21_EVAL_SUITE
            : evaluationEngine.listDatasetCases();
      const summary = await evaluationEngine.runBenchmarkForModel(
        model,
        async (testCase) => {
          const seededIds: string[] = [];
          if (testCase.seedMemoryFacts?.length) {
            for (const f of testCase.seedMemoryFacts) {
              const saved = conversationMemory.rememberFact({
                category: f.category,
                content: f.content,
                source: 'system_detected',
              });
              if (saved) seededIds.push(saved.id);
            }
          }
          try {
            const t0 = Date.now();
            const res = await originalBrainController.processQuery({
              query: testCase.prompt,
              history: testCase.seedHistory?.map((h, i) => ({
                id: `seed_${i}`,
                sender: h.role === 'user' ? ('user' as const) : ('ai' as const),
                text: h.content,
                timestamp: Date.now() - 1000 * (10 - i),
              })),
              manualModelId: model.id,
              offlineOnly: model.isLocal,
              languageMode: testCase.language,
              pureNeuralOnly: model.id === 'master-ai-v1-onnx',
            });
            return {
              text: res.text,
              latencyMs: Date.now() - t0,
              tokensPerSecond: res.tokensPerSecond,
            };
          } finally {
            for (const sid of seededIds) conversationMemory.forgetFact(sid);
          }
        },
        targetCases,
      );
      setRuns(evaluationEngine.listBenchmarkRuns());
      toast.success(
        `Benchmark finished for "${model.name}": ${summary.casesPassed}/${summary.casesAttempted} passed.`,
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-lime-400" />
            Self-Evaluation &amp; Multi-Model Benchmark Lab
          </h3>
          <p className="text-xs text-white/50">
            Measures real outputs on held-out English, Sinhala, Mixed, Math &amp; Refusal safety suites (never alters weights automatically).
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            disabled={runs.length === 0}
            onClick={() => {
              resourceManager.downloadFile(
                `master_ai_eval_report_${Date.now()}.json`,
                evaluationEngine.exportBenchmarkReportJson(),
                'application/json',
              );
            }}
            className="h-7 text-[11px] rounded-lg gap-1 border-white/20"
          >
            <Download className="w-3 h-3" /> Export Report
          </Button>
        </div>
      </div>

      {/* Benchmark Launcher */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 flex-wrap">
        <select
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white outline-none"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} [{m.brain.toUpperCase()} · {m.availability}]
            </option>
          ))}
        </select>
        <select
          value={suiteMode}
          onChange={(e) => setSuiteMode(e.target.value as 'quick6' | 'v21_full11' | 'v22_full11')}
          className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white outline-none"
        >
          <option value="v22_full11">11-Case Real Intelligence v2.2 Suite</option>
          <option value="v21_full11">11-Case Local Brain v2.1 Suite</option>
          <option value="quick6">6-Case Core + Custom Suite</option>
        </select>
        <Button size="sm" disabled={isRunning} onClick={handleRunEval} className="rounded-xl gap-1.5 text-xs">
          <FlaskConical className="w-3.5 h-3.5" />
          {isRunning
            ? 'Running Held-Out Suite...'
            : `Run ${
                suiteMode === 'v22_full11'
                  ? LOCAL_BRAIN_V22_EVAL_SUITE.length
                  : suiteMode === 'v21_full11'
                    ? LOCAL_BRAIN_V21_EVAL_SUITE.length
                    : evaluationEngine.listDatasetCases().length
              }-Case Eval`}
        </Button>
      </div>

      {/* Results History */}
      {runs.length === 0 ? (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/55 text-center">
          No benchmark runs recorded yet. Select any ready model above and run the live held-out suite.
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div key={run.runId} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-xs font-bold text-white">{run.modelName}</span>
                  <span className="ml-2 text-[10px] font-mono text-white/45">
                    {new Date(run.ranAt).toLocaleString()} · Avg {run.avgLatencyMs}ms{run.avgTokensPerSecond ? ` · ${run.avgTokensPerSecond} tok/s` : ''}
                  </span>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    run.passRate >= 0.8
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : run.passRate >= 0.5
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {run.casesPassed}/{run.casesAttempted} ({Math.round(run.passRate * 100)}%)
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div className="p-2 rounded-lg bg-black/40">
                  <div className="text-white/40">English/Code</div>
                  <div className="font-mono font-bold text-white">{Math.round(run.englishPassRate * 100)}%</div>
                </div>
                <div className="p-2 rounded-lg bg-black/40">
                  <div className="text-white/40">Sinhala/Mixed</div>
                  <div className="font-mono font-bold text-cyan-300">{Math.round(run.sinhalaPassRate * 100)}%</div>
                </div>
                <div className="p-2 rounded-lg bg-black/40">
                  <div className="text-white/40">Math Exact</div>
                  <div className="font-mono font-bold text-emerald-300">{Math.round(run.mathAccuracyRate * 100)}%</div>
                </div>
                <div className="p-2 rounded-lg bg-black/40">
                  <div className="text-white/40">Refusal Safety</div>
                  <div className="font-mono font-bold text-lime-300">{Math.round(run.refusalSafetyRate * 100)}%</div>
                </div>
              </div>

              <div className="space-y-1">
                {run.outcomes.map((o) => (
                  <div
                    key={o.caseId}
                    className="flex items-start justify-between gap-2 text-[10px] p-1.5 rounded-lg bg-black/30"
                  >
                    <div className="flex items-center gap-1.5">
                      {o.passed ? (
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                      )}
                      <span className="text-white/85 font-medium">{o.title}</span>
                    </div>
                    <span className="text-white/45 font-mono truncate max-w-[260px]" title={o.notes}>
                      {o.failureCategory !== 'none' ? o.failureCategory : o.notes}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
