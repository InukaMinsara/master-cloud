/**
 * src/services/ai/masterCloudAiEngines.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER CLOUD — 4-ENGINE HEADLESS CLOUD GPU ORCHESTRATOR
 *
 * Provides direct headless compute across 4 free/community GPU tiers:
 * 1. 💎 Hugging Face Headless ZeroGPU (NVIDIA A100 80GB) — Try-On, 3D, Video, Voice, OCR
 * 2. 🌸 Pollinations Raw GPU API — Instant zero-queue 4K FLUX.1 & SDXL Images
 * 3. ⚡ Groq LPU Raw Engine — Ultra-fast LLM Chat, DeepSeek-R1, Code, and Speech
 * 4. 🌐 AI Horde Crowdsourced GPUs — Donated community gaming GPUs worldwide
 *
 * 100% Free · 0 MB Local Download · 0 Local GPU Strain
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { aiHordeService } from './aiHordeService';
import { puterAiService } from './puterAiService';
import { MASTER_HF_OWNER, getInukaSpaceUrl } from './aiUniverseData';

export type MasterGpuEngineId = 'zerogpu' | 'pollinations' | 'groq' | 'aihorde';

export interface GpuEngineInfo {
  id: MasterGpuEngineId;
  name: string;
  badge: string;
  hardware: string;
  description: string;
  icon: string;
}

export const MASTER_GPU_ENGINES: Record<MasterGpuEngineId, GpuEngineInfo> = {
  zerogpu: {
    id: 'zerogpu',
    name: 'ZeroGPU A100',
    badge: 'Enterprise A100',
    hardware: 'NVIDIA A100 (80GB VRAM)',
    description: 'Cloud supercomputers for Virtual Try-On, 3D, Video, Voice & Cutouts',
    icon: '💎',
  },
  pollinations: {
    id: 'pollinations',
    name: 'Pollinations GPU',
    badge: 'Zero-Queue Instant',
    hardware: 'Community Cloud Cluster',
    description: 'Instant 4K FLUX.1 & SDXL image synthesis with no wait times',
    icon: '🌸',
  },
  groq: {
    id: 'groq',
    name: 'Groq LPU Engine',
    badge: '500+ Words/Sec',
    hardware: 'Groq LPU Rack System',
    description: 'Blink-speed LLM reasoning, DeepSeek-R1, coding & transcription',
    icon: '⚡',
  },
  aihorde: {
    id: 'aihorde',
    name: 'AI Horde',
    badge: 'Crowdsourced',
    hardware: 'Donated Global Gaming GPUs',
    description: 'Decentralized volunteer GPU network for open-source AI art',
    icon: '🌐',
  },
};

/**
 * 1. POLLINATIONS RAW GPU ENGINE
 * Instant text-to-image without API keys or wait queues
 */
export interface PollinationsImageOptions {
  prompt: string;
  model?: 'flux' | 'flux-realism' | 'flux-anime' | 'flux-3d' | 'turbo';
  width?: number;
  height?: number;
  seed?: number;
  negativePrompt?: string;
  enhance?: boolean;
}

export async function generatePollinationsImage(options: PollinationsImageOptions): Promise<string> {
  const {
    prompt,
    model = 'flux',
    width = 1024,
    height = 1024,
    seed = Math.floor(Math.random() * 1000000),
    enhance = false,
  } = options;

  const encodedPrompt = encodeURIComponent(prompt);
  // Pollinations API format
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=${enhance}`;

  // Pre-flight check to verify image loads and cache it
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Pollinations GPU returned status ${res.status}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * 2. GROQ LPU RAW ENGINE
 * Ultra-fast LLM execution
 */
export interface GroqChatOptions {
  prompt: string;
  systemPrompt?: string;
  model?: 'llama-3.3-70b-versatile' | 'deepseek-r1-distill-llama-70b' | 'qwen-2.5-coder-32b' | 'gemma2-9b-it';
  temperature?: number;
  maxTokens?: number;
}

export async function generateGroqChat(options: GroqChatOptions): Promise<string> {
  const {
    prompt,
    systemPrompt = 'You are an expert AI assistant built into Master Cloud.',
    model = 'llama-3.3-70b-versatile',
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const groqKey = typeof window !== 'undefined'
    ? localStorage.getItem('master_cloud_groq_api_key') || import.meta.env.VITE_GROQ_API_KEY || ''
    : '';

  if (groqKey && groqKey.trim()) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch (err) {
      console.warn('Groq API error, falling back to Puter/Brain:', err);
    }
  }

  // Fallback to Puter AI free LLM engine
  try {
    const puterResponse = await puterAiService.chat(prompt, {
      model: 'deepseek/deepseek-r1',
    });
    return puterResponse;
  } catch (e) {
    // Secondary fallback
    return `[Master Cloud AI Output]: Processed "${prompt.slice(0, 80)}..."\n\nTo unlock dedicated 500+ w/s Groq LPU speed, add your free Groq API key in Settings.`;
  }
}

/**
 * 3. AI HORDE DONATED GPU ENGINE
 * Crowdsourced volunteer GPUs
 */
export async function generateAiHordeImage(
  prompt: string,
  options?: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
    onStatus?: (msg: string) => void;
  }
): Promise<string> {
  options?.onStatus?.('Submitting to decentralized AI Horde GPU cluster...');
  const result = await aiHordeService.generateImage(prompt, {
    aspectRatio: options?.aspectRatio || '1:1',
    onStatusUpdate: (st) => {
      options?.onStatus?.(
        st.state === 'processing'
          ? 'Rendering on volunteer NVIDIA GPU...'
          : `Waiting in community queue (est. ${st.waitTimeSeconds}s)...`
      );
    },
  });

  return result.url;
}

/**
 * 4. HUGGING FACE ZEROGPU ENGINE
 * Resolves the optimal direct endpoint (inuka1 dedicated space -> official cluster)
 */
export function getZeroGpuEngineUrl(spaceId: string, modelId: string): string {
  if (typeof window !== 'undefined') {
    const isDedicatedInuka = localStorage.getItem(`master_hf_engine_${modelId}`) === 'true';
    if (isDedicatedInuka) {
      return getInukaSpaceUrl(spaceId);
    }
    const custom = localStorage.getItem(`custom_space_url_${modelId}`);
    if (custom && custom.trim()) return custom.trim();
  }
  const repoName = spaceId.includes('/') ? spaceId.split('/')[1] : spaceId;
  const sanitized = repoName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const org = spaceId.includes('/') ? spaceId.split('/')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') : '';
  return org ? `https://${org}-${sanitized}.hf.space` : `https://${sanitized}.hf.space`;
}
