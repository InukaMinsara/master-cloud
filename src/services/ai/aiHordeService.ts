/**
 * aiHordeService.ts
 * Master Cloud — Distributed Community Cloud GPU Service (AI Horde).
 *
 * Provides 100% free, 24/7 image generation (Stable Diffusion / SDXL) and text models
 * powered by volunteer GPUs worldwide via the official AI Horde decentralized REST API.
 * Zero credit card, zero user fees, anonymous API key supported.
 */

export interface HordePerformanceStats {
  workerCount: number;
  textWorkerCount: number;
  threadCount: number;
  textThreadCount: number;
  queuedRequests: number;
  queuedTextRequests: number;
  pastMinuteTokens: number;
  online: boolean;
  lastUpdated: string;
}

export interface HordeImageOptions {
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  model?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:2';
  onStatusUpdate?: (status: { state: string; waitTimeSeconds: number; queuePosition: number }) => void;
}

export interface HordeImageResult {
  url: string;
  seed: string;
  workerName?: string;
  workerId?: string;
  model: string;
  prompt: string;
  source: 'ai-horde-cloud-gpu';
}

export interface HordeTextOptions {
  maxLength?: number;
  temperature?: number;
  topP?: number;
  model?: string;
  onStatusUpdate?: (status: { state: string; waitTimeSeconds: number }) => void;
}

const HORDE_BASE_URL = 'https://aihorde.net/api/v2';
const ANONYMOUS_KEY = '0000000000';
const CLIENT_AGENT = 'MasterCloud:2.0:inukaminsara@github.com';
const STORAGE_KEY_HORDE_API = 'master_cloud_ai_horde_api_key';

class AIHordeService {
  private activeApiKey: string = ANONYMOUS_KEY;
  private cachedStats: HordePerformanceStats | null = null;
  private lastStatsFetch = 0;

  constructor() {
    this.loadApiKey();
  }

  loadApiKey(): string {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && typeof window.localStorage.getItem === 'function') {
        const saved = window.localStorage.getItem(STORAGE_KEY_HORDE_API);
        if (saved && saved.trim().length > 0) {
          this.activeApiKey = saved.trim();
          return this.activeApiKey;
        }
      }
    } catch {}
    this.activeApiKey = ANONYMOUS_KEY;
    return this.activeApiKey;
  }

  setApiKey(key: string): void {
    this.activeApiKey = key.trim() || ANONYMOUS_KEY;
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        if (key && key.trim() !== ANONYMOUS_KEY) {
          window.localStorage.setItem(STORAGE_KEY_HORDE_API, key.trim());
        } else {
          window.localStorage.removeItem(STORAGE_KEY_HORDE_API);
        }
      }
    } catch {}
  }

  getApiKey(): string {
    return this.activeApiKey;
  }

  /**
   * Fetch real-time cluster telemetry (online worker GPUs and queue counts).
   */
  async getPerformanceStats(): Promise<HordePerformanceStats> {
    const now = Date.now();
    if (this.cachedStats && now - this.lastStatsFetch < 10000) {
      return this.cachedStats;
    }

    try {
      const res = await fetch(`${HORDE_BASE_URL}/status/performance`, {
        headers: {
          'Client-Agent': CLIENT_AGENT,
        },
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      this.cachedStats = {
        workerCount: data.worker_count || 0,
        textWorkerCount: data.text_worker_count || 0,
        threadCount: data.thread_count || 0,
        textThreadCount: data.text_thread_count || 0,
        queuedRequests: data.queued_requests || 0,
        queuedTextRequests: data.queued_text_requests || 0,
        pastMinuteTokens: data.past_minute_tokens || 0,
        online: true,
        lastUpdated: new Date().toISOString(),
      };
      this.lastStatsFetch = now;
      return this.cachedStats;
    } catch {
      return {
        workerCount: 30,
        textWorkerCount: 50,
        threadCount: 32,
        textThreadCount: 110,
        queuedRequests: 0,
        queuedTextRequests: 0,
        pastMinuteTokens: 0,
        online: false,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate an image using distributed volunteer GPUs via AI Horde.
   */
  async generateImage(prompt: string, options: HordeImageOptions = {}): Promise<HordeImageResult> {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) throw new Error('Prompt cannot be empty');

    let width = options.width || 512;
    let height = options.height || 512;

    if (options.aspectRatio) {
      switch (options.aspectRatio) {
        case '16:9':
          width = 640;
          height = 384;
          break;
        case '9:16':
          width = 384;
          height = 640;
          break;
        case '4:3':
          width = 576;
          height = 448;
          break;
        case '3:2':
          width = 576;
          height = 384;
          break;
        default:
          width = 512;
          height = 512;
      }
    }

    const payload = {
      prompt: cleanPrompt,
      params: {
        sampler_name: 'k_euler_a',
        cfg_scale: options.cfgScale || 7.5,
        width,
        height,
        steps: Math.min(30, options.steps || 25),
        n: 1,
        post_processing: ['GFPGAN'],
      },
      models: options.model ? [options.model] : ['stable_diffusion', 'ICBINP - I Can\'t Believe It\'s Not Photography', 'Deliberate', 'Juggernaut XL'],
      censor_nsfw: true,
      r2: true, // Use Cloudflare R2 direct image links when possible
    };

    options.onStatusUpdate?.({ state: 'submitting', waitTimeSeconds: 5, queuePosition: 1 });

    const submitRes = await fetch(`${HORDE_BASE_URL}/generate/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Agent': CLIENT_AGENT,
        'apikey': this.activeApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      throw new Error(`AI Horde submission failed (${submitRes.status}): ${errText}`);
    }

    const submitData = await submitRes.json();
    const taskId = submitData.id;

    if (!taskId) throw new Error('No task ID returned from AI Horde');

    // Poll until completed (Max 90 seconds)
    const startTime = Date.now();
    const maxWaitMs = 90000;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((r) => setTimeout(r, 2500));

      const checkRes = await fetch(`${HORDE_BASE_URL}/generate/check/${taskId}`, {
        headers: { 'Client-Agent': CLIENT_AGENT },
      });

      if (!checkRes.ok) continue;
      const checkData = await checkRes.json();

      options.onStatusUpdate?.({
        state: checkData.processing > 0 ? 'processing_on_gpu' : 'queued_waiting',
        waitTimeSeconds: checkData.wait_time || 0,
        queuePosition: checkData.queue_position || 0,
      });

      if (checkData.done) {
        // Fetch final image
        const statusRes = await fetch(`${HORDE_BASE_URL}/generate/status/${taskId}`, {
          headers: { 'Client-Agent': CLIENT_AGENT },
        });

        if (!statusRes.ok) throw new Error('Failed to retrieve final image from AI Horde');
        const statusData = await statusRes.json();

        if (statusData.generations && statusData.generations.length > 0) {
          const gen = statusData.generations[0];
          return {
            url: gen.img,
            seed: gen.seed,
            workerName: gen.worker_name,
            workerId: gen.worker_id,
            model: gen.model || options.model || 'Stable Diffusion',
            prompt: cleanPrompt,
            source: 'ai-horde-cloud-gpu',
          };
        }
      }

      if (checkData.faulted) {
        throw new Error('AI Horde job faulted or failed on remote worker GPU');
      }
    }

    throw new Error('AI Horde image generation timed out (90s limit reached)');
  }

  /**
   * Generate text using distributed volunteer GPUs.
   */
  async generateText(prompt: string, options: HordeTextOptions = {}): Promise<string> {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) throw new Error('Prompt cannot be empty');

    const payload = {
      prompt: cleanPrompt,
      params: {
        max_context_length: 2048,
        max_length: options.maxLength || 180,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
      },
      models: options.model ? [options.model] : [],
    };

    options.onStatusUpdate?.({ state: 'submitting', waitTimeSeconds: 5 });

    const submitRes = await fetch(`${HORDE_BASE_URL}/generate/text/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Agent': CLIENT_AGENT,
        'apikey': this.activeApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      throw new Error(`AI Horde text submission failed: ${err}`);
    }

    const submitData = await submitRes.json();
    const taskId = submitData.id;

    const startTime = Date.now();
    const maxWaitMs = 60000;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((r) => setTimeout(r, 2000));

      const statusRes = await fetch(`${HORDE_BASE_URL}/generate/text/status/${taskId}`, {
        headers: { 'Client-Agent': CLIENT_AGENT },
      });

      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();

      if (statusData.done && statusData.generations && statusData.generations.length > 0) {
        return statusData.generations[0].text || '';
      }

      options.onStatusUpdate?.({
        state: statusData.processing > 0 ? 'processing' : 'waiting_in_queue',
        waitTimeSeconds: statusData.wait_time || 0,
      });

      if (statusData.faulted) {
        throw new Error('AI Horde text task faulted on remote worker');
      }
    }

    throw new Error('AI Horde text generation timed out');
  }
}

export const aiHordeService = new AIHordeService();
