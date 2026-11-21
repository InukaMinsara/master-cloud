/**
 * vite-plugin-ai-proxy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER CLOUD — UNIFIED SERVER-SIDE AI ENVIRONMENT PROXY
 * Securely proxies Groq, xKiro, Pollinations, and ComfyUI without exposing
 * secrets to client bundles. Provides unified chat completions, SenseNova
 * U1.5 Lite image generation, and aggregated free model discovery.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export interface ServerAiConfig {
  groqEndpoint: string;
  groqApiKey: string;
  xkiroEndpoint: string;
  xkiroApiKey: string;
  pollinationsEndpoint: string;
  pollinationsApiKey: string;
  comfyUiEndpoint: string;
  comfyUiApiKey: string;
  experientialEndpoint: string;
  experientialApiKey: string;
  unorouterEndpoint: string;
  unorouterApiKey: string;
  abhibotsEndpoint: string;
  abhibotsApiKey: string;
  apmixEndpoint: string;
  apmixApiKey: string;
  openrouterEndpoint: string;
  openrouterApiKey: string;
  nvidiaEndpoint: string;
  nvidiaGenaiEndpoint: string;
  nvidiaApiKey: string;
}

export function loadEnvLocal(rootDir: string): ServerAiConfig {
  const config: ServerAiConfig = {
    groqEndpoint: 'https://api.groq.com/openai/v1',
    groqApiKey: '',
    xkiroEndpoint: 'https://api.xkiro.com/v1',
    xkiroApiKey: '',
    pollinationsEndpoint: 'https://gen.pollinations.ai',
    pollinationsApiKey: '',
    comfyUiEndpoint: 'http://127.0.0.1:8188',
    comfyUiApiKey: '',
    experientialEndpoint: 'https://api.experientiallabs.ai/v1',
    experientialApiKey: '',
    unorouterEndpoint: 'https://api.unorouter.com/v1',
    unorouterApiKey: '',
    abhibotsEndpoint: 'https://opus.abhibots.com/v1',
    abhibotsApiKey: '',
    apmixEndpoint: 'https://api.apmix.ai/v1',
    apmixApiKey: '',
    openrouterEndpoint: 'https://openrouter.ai/api/v1',
    openrouterApiKey: '',
    nvidiaEndpoint: 'https://integrate.api.nvidia.com/v1',
    nvidiaGenaiEndpoint: 'https://ai.api.nvidia.com/v1',
    nvidiaApiKey: '',
  };

  const candidateFiles = ['.env.local', '.env'];

  for (const file of candidateFiles) {
    const fullPath = path.resolve(rootDir, file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx <= 0) continue;
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }

          if (key === 'GROQ_API_ENDPOINT' && val) config.groqEndpoint = val.replace(/\/+$/, '');
          if (key === 'GROQ_API_KEY' && val) config.groqApiKey = val;
          if (key === 'XKIRO_API_ENDPOINT' && val) config.xkiroEndpoint = val.replace(/\/+$/, '');
          if (key === 'XKIRO_API_KEY' && val) config.xkiroApiKey = val;
          if (key === 'POLLINATIONS_API_ENDPOINT' && val) config.pollinationsEndpoint = val.replace(/\/+$/, '');
          if (key === 'POLLINATIONS_API_KEY' && val) config.pollinationsApiKey = val;
          if (key === 'COMFYUI_LOCAL_ENDPOINT' && val) config.comfyUiEndpoint = val.replace(/\/+$/, '');
          if (key === 'COMFYUI_LOCAL_API_KEY' && val) config.comfyUiApiKey = val;
          if (key === 'EXPERIENTIAL_LABS_API_ENDPOINT' && val) config.experientialEndpoint = val.replace(/\/+$/, '');
          if (key === 'EXPERIENTIAL_LABS_API_KEY' && val) config.experientialApiKey = val;
          if (key === 'UNOROUTER_API_ENDPOINT' && val) config.unorouterEndpoint = val.replace(/\/+$/, '');
          if (key === 'UNOROUTER_API_KEY' && val) config.unorouterApiKey = val;
          if (key === 'ABHIBOTS_API_ENDPOINT' && val) config.abhibotsEndpoint = val.replace(/\/+$/, '');
          if (key === 'ABHIBOTS_API_KEY' && val) config.abhibotsApiKey = val;
          if (key === 'APMIX_API_ENDPOINT' && val) config.apmixEndpoint = val.replace(/\/+$/, '');
          if (key === 'APMIX_API_KEY' && val) config.apmixApiKey = val;
          if (key === 'OPENROUTER_API_ENDPOINT' && val) config.openrouterEndpoint = val.replace(/\/+$/, '');
          if (key === 'OPENROUTER_API_KEY' && val) config.openrouterApiKey = val;
          if (key === 'NVIDIA_API_ENDPOINT' && val) config.nvidiaEndpoint = val.replace(/\/+$/, '');
          if (key === 'NVIDIA_GENAI_ENDPOINT' && val) config.nvidiaGenaiEndpoint = val.replace(/\/+$/, '');
          if (key === 'NVIDIA_API_KEY' && val) config.nvidiaApiKey = val;
        }
      } catch (err) {
        console.warn(`[AI Proxy] Failed to parse ${file}:`, err);
      }
    }
  }

  // System environment fallback
  if (process.env.GROQ_API_ENDPOINT) config.groqEndpoint = process.env.GROQ_API_ENDPOINT.replace(/\/+$/, '');
  if (process.env.GROQ_API_KEY) config.groqApiKey = process.env.GROQ_API_KEY;
  if (process.env.XKIRO_API_ENDPOINT) config.xkiroEndpoint = process.env.XKIRO_API_ENDPOINT.replace(/\/+$/, '');
  if (process.env.XKIRO_API_KEY) config.xkiroApiKey = process.env.XKIRO_API_KEY;
  if (process.env.POLLINATIONS_API_ENDPOINT) config.pollinationsEndpoint = process.env.POLLINATIONS_API_ENDPOINT.replace(/\/+$/, '');
  if (process.env.POLLINATIONS_API_KEY) config.pollinationsApiKey = process.env.POLLINATIONS_API_KEY;
  if (process.env.COMFYUI_LOCAL_ENDPOINT) config.comfyUiEndpoint = process.env.COMFYUI_LOCAL_ENDPOINT.replace(/\/+$/, '');
  if (process.env.COMFYUI_LOCAL_API_KEY) config.comfyUiApiKey = process.env.COMFYUI_LOCAL_API_KEY;
  if (process.env.EXPERIENTIAL_LABS_API_ENDPOINT) config.experientialEndpoint = process.env.EXPERIENTIAL_LABS_API_ENDPOINT.replace(/\/+$/, '');
  if (process.env.EXPERIENTIAL_LABS_API_KEY) config.experientialApiKey = process.env.EXPERIENTIAL_LABS_API_KEY;
  if (process.env.UNOROUTER_API_ENDPOINT) config.unorouterEndpoint = process.env.UNOROUTER_API_ENDPOINT.replace(/\/+$/, '');
  if (process.env.UNOROUTER_API_KEY) config.unorouterApiKey = process.env.UNOROUTER_API_KEY;
  if (process.env.ABHIBOTS_API_ENDPOINT) config.abhibotsEndpoint = process.env.ABHIBOTS_API_ENDPOINT.replace(/\/+$/, '');
  if (process.env.ABHIBOTS_API_KEY) config.abhibotsApiKey = process.env.ABHIBOTS_API_KEY;
  if (process.env.APMIX_API_ENDPOINT) config.apmixEndpoint = process.env.APMIX_API_ENDPOINT.replace(/\/+$/, '');
  if (process.env.APMIX_API_KEY) config.apmixApiKey = process.env.APMIX_API_KEY;
  if (process.env.OPENROUTER_API_ENDPOINT) config.openrouterEndpoint = process.env.OPENROUTER_API_ENDPOINT.replace(/\/+$/, '');
  if (process.env.OPENROUTER_API_KEY) config.openrouterApiKey = process.env.OPENROUTER_API_KEY;
  if (process.env.NVIDIA_API_ENDPOINT) config.nvidiaEndpoint = process.env.NVIDIA_API_ENDPOINT.replace(/\/+$/, '');
  if (process.env.NVIDIA_GENAI_ENDPOINT) config.nvidiaGenaiEndpoint = process.env.NVIDIA_GENAI_ENDPOINT.replace(/\/+$/, '');
  if (process.env.NVIDIA_API_KEY) config.nvidiaApiKey = process.env.NVIDIA_API_KEY;

  return config;
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function getRawBodyBuffer(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

/**
 * Strips provider prefixes, :free tags, vendor IDs, and formats clean display names.
 * Ensures ZERO provider branding in the user interface.
 */
function cleanModelDisplayName(rawId: string, rawName?: string): string {
  let name = (rawName || rawId).trim();
  // Strip :free suffix or (free) anywhere in string
  name = name.replace(/:free$/i, '').replace(/\s*\(free\)\s*/gi, ' ').trim();
  // Strip provider colon prefix e.g. 'inclusionAI: ', 'Baidu: ', 'OpenRouter: '
  name = name.replace(/^[A-Za-z0-9\s._-]+:\s+/, '');
  // Strip namespace prefixes e.g. 'inclusionai/', 'baidu/', 'meta-llama/', 'openai/', 'mistralai/', 'liquid/'
  name = name.replace(/^([a-zA-Z0-9._-]+\/)+/, '');
  name = name.trim();
  // If result is empty or ID-like with hyphens/underscores, format cleanly
  if (!rawName || rawName === rawId || name.includes('-') || name.includes('_')) {
    name = name.replace(/[-_]+/g, ' ');
    name = name
      .split(' ')
      .filter(Boolean)
      .map((w) => {
        if (/^(ai|vl|llm|gpt|r1|v[0-9]+|[0-9]+b|[0-9]+k|[0-9]+m)$/i.test(w)) return w.toUpperCase();
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }
  // Remove any residual provider names from display name
  name = name.replace(/\b(Groq|OpenRouter|UnoRouter|xKiro|Abhibots|APmix|Experiential|Nvidia|NVIDIA|NIM)\b/gi, '').trim();
  return name || rawId;
}

function categorizeModel(id: string, name = ''): 'reasoning' | 'coding' | 'fast' | 'general' | 'vision' {
  const target = (id + ' ' + name).toLowerCase();
  if (target.includes('vl') || target.includes('vision') || target.includes('multimodal') || target.includes('pixtral')) {
    return 'vision';
  }
  if (target.includes('code') || target.includes('coder') || target.includes('codestral') || target.includes('devstral') || target.includes('starcoder')) {
    return 'coding';
  }
  if (target.includes('reason') || target.includes('r1') || target.includes('o1') || target.includes('o3') || target.includes('qwq') || target.includes('thought')) {
    return 'reasoning';
  }
  if (target.includes('flash') || target.includes('nano') || target.includes('instant') || target.includes('mini') || target.includes('small') || target.includes('lite') || target.includes('1.7b') || target.includes('3b') || target.includes('8b')) {
    return 'fast';
  }
  return 'general';
}

function isNonChatModel(id: string, name = ''): boolean {
  const target = (id + ' ' + name).toLowerCase();
  return (
    // Audio, speech, TTS
    target.includes('whisper') ||
    target.includes('audio') ||
    target.includes('tts') ||
    target.includes('voice') ||
    target.includes('speech') ||
    target.includes('eleven') ||
    target.includes('aura-') ||
    // Embeddings, reranking, guards
    target.includes('embed') ||
    target.includes('embedding') ||
    target.includes('rerank') ||
    target.includes('guard') ||
    target.includes('safeguard') ||
    target.includes('moderation') ||
    target.includes('prompt-guard') ||
    // Terms-acceptance required models (e.g. CanopyLabs on Groq)
    target.includes('canopylabs') ||
    // Image generation & diffusion checkpoints
    target.includes('image-generation') ||
    target.includes('dall-e') ||
    target.includes('midjourney') ||
    target.includes('flux') ||
    target.includes('sdxl') ||
    target.includes('stable-diffusion') ||
    target.includes('imagen') ||
    target.includes('aihorde') ||
    target.includes('albedo') ||
    target.includes('ampony') ||
    target.includes('pony') ||
    target.includes('reality') ||
    target.includes('counterfeit') ||
    target.includes('anything') ||
    target.includes('diffusion') ||
    target.includes('ckpt') ||
    target.includes('lora') ||
    target.includes('checkpoint') ||
    target.includes('agnes-image') ||
    // Video generation
    target.includes('veo') ||
    target.includes('sora') ||
    // Broken / consent-locked models
    target.includes('glm-4.5-flash:free') ||
    target.includes('liquid/lfm-3-1.7b')
  );
}

let serverModelCache: any[] = [];
let serverModelCacheTime = 0;
const SERVER_MODEL_CACHE_TTL = 60 * 1000; // 60 seconds

export function createAiProxyMiddleware(rootDir: string) {
  return async (req: any, res: any, next: any) => {
    const url = req.url || '';
    if (!url.startsWith('/api/ai/')) {
      return next();
    }

    const envConfig = loadEnvLocal(rootDir);

    // ── 1. GET /api/ai/status ───────────────────────────────────────────────
    if (url === '/api/ai/status' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          groq: {
            available: Boolean(envConfig.groqApiKey),
            hasKey: Boolean(envConfig.groqApiKey),
            endpoint: envConfig.groqEndpoint,
          },
          xkiro: {
            available: Boolean(envConfig.xkiroApiKey),
            hasKey: Boolean(envConfig.xkiroApiKey),
            endpoint: envConfig.xkiroEndpoint,
          },
          pollinations: {
            available: true,
            hasKey: Boolean(envConfig.pollinationsApiKey),
            endpoint: envConfig.pollinationsEndpoint,
          },
          comfyui: {
            available: Boolean(envConfig.comfyUiEndpoint),
            hasKey: Boolean(envConfig.comfyUiApiKey),
            endpoint: envConfig.comfyUiEndpoint,
          },
          experiential: {
            available: Boolean(envConfig.experientialApiKey),
            hasKey: Boolean(envConfig.experientialApiKey),
            endpoint: envConfig.experientialEndpoint,
          },
          unorouter: {
            available: Boolean(envConfig.unorouterApiKey) || true, // UnoRouter also provides public models
            hasKey: Boolean(envConfig.unorouterApiKey),
            endpoint: envConfig.unorouterEndpoint,
          },
          abhibots: {
            available: Boolean(envConfig.abhibotsApiKey),
            hasKey: Boolean(envConfig.abhibotsApiKey),
            endpoint: envConfig.abhibotsEndpoint,
          },
          apmix: {
            available: Boolean(envConfig.apmixApiKey),
            hasKey: Boolean(envConfig.apmixApiKey),
            endpoint: envConfig.apmixEndpoint,
          },
          openrouter: {
            available: Boolean(envConfig.openrouterApiKey) || true, // OpenRouter has free tier accessible
            hasKey: Boolean(envConfig.openrouterApiKey),
            endpoint: envConfig.openrouterEndpoint,
          },
          nvidia: {
            available: Boolean(envConfig.nvidiaApiKey),
            hasKey: Boolean(envConfig.nvidiaApiKey),
            endpoint: envConfig.nvidiaEndpoint,
          },
        })
      );
    }

    // ── 2. GET /api/ai/models (Aggregated Dynamic Model Discovery) ───────────
    if (url.startsWith('/api/ai/models') && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');

      const isForcedRefresh = url.includes('refresh=true');
      const now = Date.now();
      if (!isForcedRefresh && serverModelCache.length > 0 && now - serverModelCacheTime < SERVER_MODEL_CACHE_TTL) {
        return res.end(JSON.stringify({ models: serverModelCache }));
      }

      const unifiedModels: any[] = [];
      const seenIds = new Set<string>();

      // Fetch models from all configured providers in parallel (8s timeout per provider)
      await Promise.allSettled([
        // A. Groq Models (Fast conversational engines)
        (async () => {
          if (!envConfig.groqApiKey) return;
          try {
            const groqRes = await fetch(`${envConfig.groqEndpoint}/models`, {
              headers: { Authorization: `Bearer ${envConfig.groqApiKey}` },
              signal: AbortSignal.timeout(8000),
            });
            if (groqRes.ok) {
              const data = await groqRes.json();
              if (Array.isArray(data?.data)) {
                for (const m of data.data) {
                  const id = m.id;
                  if (isNonChatModel(id)) continue;
                  if (!seenIds.has(id)) {
                    seenIds.add(id);
                    const cleanName = cleanModelDisplayName(id);
                    const cat = categorizeModel(id, cleanName);
                    const ctx = m.context_window || 128000;
                    const ctxBadge = ctx >= 1000000 ? `${Math.round(ctx / 1000000)}M context` : `${Math.round(ctx / 1000)}k context`;

                    unifiedModels.push({
                      id,
                      name: cleanName,
                      description: `High-velocity conversational neural engine (${id})`,
                      category: cat,
                      contextLength: ctx,
                      contextBadge: ctxBadge,
                      provider: 'groq',
                      isDefault: id === 'openai/gpt-oss-120b',
                    });
                  }
                }
              }
            }
          } catch (err: any) {
            console.warn('[AI Proxy] Groq discovery failed:', err?.message || err);
          }

          // Verified resilient fallback for Groq chat models
          if (unifiedModels.filter((m) => m.provider === 'groq').length === 0) {
            const fallbackGroq = [
              { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B High-Velocity', description: 'Flagship reasoning and synthesis model with sub-second response times', category: 'reasoning', contextLength: 131072, contextBadge: '131k context', provider: 'groq', isDefault: true },
              { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B Fast Reasoning', description: 'Lightweight high-throughput reasoning engine', category: 'fast', contextLength: 131072, contextBadge: '131k context', provider: 'groq', isDefault: false },
              { id: 'allam-2-7b', name: 'Allam 2 7B', description: 'Multilingual conversational intelligence and knowledge engine', category: 'general', contextLength: 131072, contextBadge: '131k context', provider: 'groq', isDefault: false },
              { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B', description: 'Advanced conversational comprehension and coding', category: 'reasoning', contextLength: 131072, contextBadge: '131k context', provider: 'groq', isDefault: false },
            ];
            for (const fm of fallbackGroq) {
              if (!seenIds.has(fm.id)) {
                seenIds.add(fm.id);
                unifiedModels.push(fm);
              }
            }
          }
        })(),

        // B. xKiro Models (Free Tier Chat Models Only)
        (async () => {
          if (!envConfig.xkiroApiKey) return;
          try {
            const xkiroRes = await fetch(`${envConfig.xkiroEndpoint}/models`, {
              headers: { Authorization: `Bearer ${envConfig.xkiroApiKey}` },
              signal: AbortSignal.timeout(8000),
            });
            if (xkiroRes.ok) {
              const data = await xkiroRes.json();
              if (Array.isArray(data?.data)) {
                for (const m of data.data) {
                  if (m.access_tier === 'free' && m.type === 'model' && m.id !== 'sensenova/sensenova-u1.5-lite') {
                    const id = m.id;
                    if (isNonChatModel(id, m.display_name)) continue;
                    if (!seenIds.has(id)) {
                      seenIds.add(id);
                      const cleanName = cleanModelDisplayName(id, m.display_name);
                      const cat = categorizeModel(id, cleanName);
                      const ctx = m.context_length || 128000;
                      const ctxBadge = ctx >= 1000000 ? `${Math.round(ctx / 1000000)}M context` : `${Math.round(ctx / 1000)}k context`;

                      unifiedModels.push({
                        id,
                        name: cleanName,
                        description: `Intelligent multi-domain reasoning model (${id})`,
                        category: cat,
                        contextLength: ctx,
                        contextBadge: ctxBadge,
                        provider: 'xkiro',
                        isDefault: false,
                      });
                    }
                  }
                }
              }
            }
          } catch (err: any) {
            console.warn('[AI Proxy] xKiro discovery failed:', err?.message || err);
          }

          // Verified resilient fallback for xKiro chat models
          if (unifiedModels.filter((m) => m.provider === 'xkiro').length === 0) {
            const fallbackXkiro = [
              { id: 'mistralai/ministral-14b', name: 'Ministral 3 14B', description: 'High-speed edge-optimized reasoning and coding model', category: 'fast', contextLength: 256000, contextBadge: '256k context', provider: 'xkiro', isDefault: false },
              { id: 'mistralai/mistral-large-2512', name: 'Mistral Large 2512', description: 'Advanced multilingual comprehension, mathematics, and systems programming', category: 'general', contextLength: 128000, contextBadge: '128k context', provider: 'xkiro', isDefault: false },
              { id: 'mistralai/codestral-2508', name: 'Codestral 2508', description: 'Specialized deep code generation, unit testing, and architectural refactoring', category: 'coding', contextLength: 256000, contextBadge: '256k context', provider: 'xkiro', isDefault: false },
              { id: 'cohere/command-r-plus-08-2024', name: 'Command R+ 2024', description: 'High-precision research analysis, search synthesis, and citation grounding', category: 'general', contextLength: 128000, contextBadge: '128k context', provider: 'xkiro', isDefault: false },
              { id: 'sensenova/sensenova-6.8-flash-lite', name: 'SenseNova 6.8 Flash', description: 'High-context reasoning and structured data extraction', category: 'reasoning', contextLength: 262144, contextBadge: '262k context', provider: 'xkiro', isDefault: false },
            ];
            for (const fm of fallbackXkiro) {
              if (!seenIds.has(fm.id)) {
                seenIds.add(fm.id);
                unifiedModels.push(fm);
              }
            }
          }
        })(),

        // C. Pollinations Models (Free Text Models Only)
        (async () => {
          try {
            const polliHeaders: Record<string, string> = { Accept: 'application/json' };
            if (envConfig.pollinationsApiKey) {
              polliHeaders['Authorization'] = `Bearer ${envConfig.pollinationsApiKey}`;
            }
            const polliRes = await fetch(`${envConfig.pollinationsEndpoint}/text/models`, {
              headers: polliHeaders,
              signal: AbortSignal.timeout(8000),
            });
            if (polliRes.ok) {
              const data = await polliRes.json();
              if (Array.isArray(data)) {
                for (const m of data) {
                  if (m.category === 'text' && !m.paid_only) {
                    const id = m.name;
                    if (isNonChatModel(id, m.title)) continue;
                    if (!seenIds.has(id)) {
                      seenIds.add(id);
                      const cleanName = cleanModelDisplayName(id, m.title);
                      const cat = categorizeModel(id, cleanName);
                      const ctx = m.context_length || 400000;
                      const ctxBadge = ctx >= 1000000 ? `${Math.round(ctx / 1000000)}M context` : `${Math.round(ctx / 1000)}k context`;

                      unifiedModels.push({
                        id,
                        name: cleanName,
                        description: m.description || `Adaptive conversational intelligence (${id})`,
                        category: cat,
                        contextLength: ctx,
                        contextBadge: ctxBadge,
                        provider: 'pollinations',
                        isDefault: false,
                      });
                    }
                  }
                }
              }
            }
          } catch (err: any) {
            console.warn('[AI Proxy] Pollinations discovery failed:', err?.message || err);
          }

          // Verified resilient fallback for Pollinations models if network timed out
          if (unifiedModels.filter((m) => m.provider === 'pollinations').length === 0) {
            const fallbackPolli = [
              { id: 'openai/gpt-5.4-nano', name: 'GPT-5.4 Nano', description: 'Fast everyday conversational intelligence', category: 'fast', contextLength: 400000, contextBadge: '400k context', provider: 'pollinations', isDefault: false },
              { id: 'openai/gpt-6.1-terra', name: 'GPT-6.1 Terra', description: 'Advanced general reasoning and coding', category: 'reasoning', contextLength: 128000, contextBadge: '128k context', provider: 'pollinations', isDefault: false },
              { id: 'minimax/minimax-m3.1-flash', name: 'MiniMax M3.1 Flash', description: 'Lightweight instruction following and synthesis', category: 'fast', contextLength: 128000, contextBadge: '128k context', provider: 'pollinations', isDefault: false },
              { id: 'moonshotai/kimi-k3.1-pro', name: 'Kimi K3.1 Pro', description: 'High context knowledge and multi-step reasoning', category: 'reasoning', contextLength: 128000, contextBadge: '128k context', provider: 'pollinations', isDefault: false },
            ];
            for (const fm of fallbackPolli) {
              if (!seenIds.has(fm.id)) {
                seenIds.add(fm.id);
                unifiedModels.push(fm);
              }
            }
          }
        })(),

        // D. Experiential Labs (Free Chat Models; Exclude Decisions-only & Paid models)
        (async () => {
          if (!envConfig.experientialApiKey) return;
          try {
            const expRes = await fetch(`${envConfig.experientialEndpoint}/models`, {
              headers: { Authorization: `Bearer ${envConfig.experientialApiKey}` },
              signal: AbortSignal.timeout(8000),
            });
            if (expRes.ok) {
              const data = await expRes.json();
              const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : Array.isArray(data) ? data : [];
              for (const m of list) {
                const id = m.id || m.name;
                if (!id) continue;
                if (isNonChatModel(id, m.name || m.description)) continue;
                // Exclude Decisions-only models
                if (/decision|classifier|rule-engine|orchestrat/i.test(id) || /decision/i.test(m.type || '') || /decision/i.test(m.capabilities || '')) continue;
                // Strictly exclude paid models requiring credits or purchase
                const nanoPrice = m.pricing?.input_nano_usd_per_million_tokens;
                if (nanoPrice && nanoPrice > 0) continue;
                if (m.pricing && m.pricing.prompt && m.pricing.prompt !== '0' && m.pricing.prompt !== 0) continue;
                const isFree = m.is_free === true || m.free === true || m.access_tier === 'free' || id.endsWith(':free') || m.tier === 'free';
                if (!isFree) continue;
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  const cleanName = cleanModelDisplayName(id, m.display_name || m.name);
                  const cat = categorizeModel(id, cleanName);
                  const ctx = m.context_length || m.context_window || 128000;
                  const ctxBadge = ctx >= 1000000 ? `${Math.round(ctx / 1000000)}M context` : `${Math.round(ctx / 1000)}k context`;

                  unifiedModels.push({
                    id,
                    name: cleanName,
                    description: m.description || `Specialized high-performance model (${id})`,
                    category: cat,
                    contextLength: ctx,
                    contextBadge: ctxBadge,
                    provider: 'experiential',
                    isDefault: false,
                  });
                }
              }
            }
          } catch (err: any) {
            console.warn('[AI Proxy] Experiential Labs discovery failed:', err?.message || err);
          }
        })(),

        // E. UnoRouter (Dynamic Free Models Discovery; Respect :free or zero pricing)
        (async () => {
          try {
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (envConfig.unorouterApiKey) {
              headers['Authorization'] = `Bearer ${envConfig.unorouterApiKey}`;
            }
            const unoRes = await fetch(`${envConfig.unorouterEndpoint}/models`, {
              headers,
              signal: AbortSignal.timeout(8000),
            });
            if (unoRes.ok) {
              const data = await unoRes.json();
              const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
              let addedCount = 0;
              for (const m of list) {
                const id = m.id;
                if (!id) continue;
                const isFree = id.includes(':free') || m.free === true || m.is_free === true || m.pricing?.prompt === 0;
                if (!isFree) continue;
                if (isNonChatModel(id, m.name)) continue;
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  const cleanName = cleanModelDisplayName(id, m.name);
                  const cat = categorizeModel(id, cleanName);
                  const ctx = m.context_length || m.max_output_tokens || 32000;
                  const ctxBadge = ctx >= 1000000 ? `${Math.round(ctx / 1000000)}M context` : `${Math.round(ctx / 1000)}k context`;

                  unifiedModels.push({
                    id,
                    name: cleanName,
                    description: m.description || `Dynamic low-latency neural model (${id})`,
                    category: cat,
                    contextLength: ctx,
                    contextBadge: ctxBadge,
                    provider: 'unorouter',
                    isDefault: false,
                  });
                  addedCount++;
                  if (addedCount >= 20) break; // Keep top 20 verified models
                }
              }
              console.log(`[AI Proxy] UnoRouter discovered ${addedCount} free chat models`);
            } else {
              console.warn('[AI Proxy] UnoRouter fetch returned HTTP', unoRes.status);
            }
          } catch (err: any) {
            console.warn('[AI Proxy] UnoRouter discovery failed:', err?.message || err);
          }

          // Verified resilient fallback for UnoRouter models
          if (unifiedModels.filter((m) => m.provider === 'unorouter').length === 0) {
            const fallbackUno = [
              { id: 'qwen2.5-vl-72b-instruct:free', name: 'Qwen 2.5 VL 72B Instruct', description: 'Multimodal vision and conversational reasoning engine', category: 'vision', contextLength: 32000, contextBadge: '32k context', provider: 'unorouter', isDefault: false },
              { id: 'codestral-latest:free', name: 'Codestral Latest', description: 'State-of-the-art coding and refactoring intelligence', category: 'coding', contextLength: 256000, contextBadge: '256k context', provider: 'unorouter', isDefault: false },
              { id: 'allam-2-7b:free', name: 'Allam 2 7B', description: 'High-efficiency conversational reasoning engine', category: 'general', contextLength: 128000, contextBadge: '128k context', provider: 'unorouter', isDefault: false },
            ];
            for (const fm of fallbackUno) {
              if (!seenIds.has(fm.id)) {
                seenIds.add(fm.id);
                unifiedModels.push(fm);
              }
            }
          }
        })(),

        // F. Opus Proxy / Abhibots (Free Tier: Claude Models & abhibots-model; Exclude 403 GPT models)
        (async () => {
          if (!envConfig.abhibotsApiKey) return;
          try {
            const abhiRes = await fetch(`${envConfig.abhibotsEndpoint}/models`, {
              headers: { Authorization: `Bearer ${envConfig.abhibotsApiKey}` },
              signal: AbortSignal.timeout(8000),
            });
            if (abhiRes.ok) {
              const data = await abhiRes.json();
              const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : Array.isArray(data) ? data : [];
              for (const m of list) {
                const id = m.id || m.name;
                if (!id) continue;
                // Abhibots free plan strictly allows Claude models and abhibots-model; gpt- models fail with 403
                if (!id.startsWith('claude-') && id !== 'abhibots-model') continue;
                if (isNonChatModel(id, m.name || m.description)) continue;
                const isFree = m.is_free === true || m.free === true || m.pricing?.prompt === 0 || m.access_tier === 'free' || id.endsWith(':free') || m.tier === 'free' || id.startsWith('claude-') || id === 'abhibots-model';
                if (m.pricing && m.pricing.prompt && m.pricing.prompt !== '0' && m.pricing.prompt !== 0) continue;
                if (isFree && !seenIds.has(id)) {
                  seenIds.add(id);
                  const cleanName = cleanModelDisplayName(id, m.display_name || m.name);
                  const cat = categorizeModel(id, cleanName);
                  const ctx = m.context_length || m.context_window || 128000;
                  const ctxBadge = ctx >= 1000000 ? `${Math.round(ctx / 1000000)}M context` : `${Math.round(ctx / 1000)}k context`;

                  unifiedModels.push({
                    id,
                    name: cleanName,
                    description: m.description || `Advanced Opus Proxy reasoning engine (${id})`,
                    category: cat,
                    contextLength: ctx,
                    contextBadge: ctxBadge,
                    provider: 'abhibots',
                    isDefault: false,
                  });
                }
              }
            }
          } catch (err: any) {
            console.warn('[AI Proxy] Abhibots discovery failed:', err?.message || err);
          }

          // Verified resilient fallback for Abhibots free Claude models
          if (unifiedModels.filter((m) => m.provider === 'abhibots').length === 0) {
            const fallbackAbhi = [
              { id: 'claude-fable-5-1', name: 'Claude Fable 5.1', description: 'High-intelligence reasoning and narrative synthesis engine', category: 'reasoning', contextLength: 200000, contextBadge: '200k context', provider: 'abhibots', isDefault: false },
              { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', description: 'Flagship deep reasoning and comprehensive problem solver', category: 'reasoning', contextLength: 200000, contextBadge: '200k context', provider: 'abhibots', isDefault: false },
              { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', description: 'Balanced high-velocity intelligence for analysis and creation', category: 'general', contextLength: 200000, contextBadge: '200k context', provider: 'abhibots', isDefault: false },
              { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', description: 'Ultra-fast lightweight conversational assistant', category: 'fast', contextLength: 200000, contextBadge: '200k context', provider: 'abhibots', isDefault: false },
              { id: 'abhibots-model', name: 'Abhibots Core', description: 'Versatile low-latency assistant engine', category: 'general', contextLength: 128000, contextBadge: '128k context', provider: 'abhibots', isDefault: false },
            ];
            for (const fm of fallbackAbhi) {
              if (!seenIds.has(fm.id)) {
                seenIds.add(fm.id);
                unifiedModels.push(fm);
              }
            }
          }
        })(),

        // G. APmix (Verified Zero-Cost Models Only)
        (async () => {
          if (!envConfig.apmixApiKey) return;
          try {
            const apmixRes = await fetch(`${envConfig.apmixEndpoint}/models`, {
              headers: { Authorization: `Bearer ${envConfig.apmixApiKey}` },
              signal: AbortSignal.timeout(8000),
            });
            if (apmixRes.ok) {
              const data = await apmixRes.json();
              const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : Array.isArray(data) ? data : [];
              for (const m of list) {
                const id = m.id || m.name;
                if (!id) continue;
                if (isNonChatModel(id, m.name || m.description)) continue;
                const isVerifiedFree = m.is_free === true || m.free === true || m.pricing?.prompt === 0 || m.pricing?.prompt === '0' || id.endsWith(':free') || m.tier === 'free';
                if (!isVerifiedFree) continue;
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  const cleanName = cleanModelDisplayName(id, m.display_name || m.name);
                  const cat = categorizeModel(id, cleanName);
                  const ctx = m.context_length || m.context_window || 128000;
                  const ctxBadge = ctx >= 1000000 ? `${Math.round(ctx / 1000000)}M context` : `${Math.round(ctx / 1000)}k context`;

                  unifiedModels.push({
                    id,
                    name: cleanName,
                    description: m.description || `APmix high-efficiency conversational model (${id})`,
                    category: cat,
                    contextLength: ctx,
                    contextBadge: ctxBadge,
                    provider: 'apmix',
                    isDefault: false,
                  });
                }
              }
            }
          } catch (err: any) {
            console.warn('[AI Proxy] APmix discovery failed:', err?.message || err);
          }
        })(),

        // H. OpenRouter (Only Genuinely Free Models e.g. :free or 0 prompt/completion pricing)
        (async () => {
          try {
            const headers: Record<string, string> = {
              Accept: 'application/json',
              'HTTP-Referer': 'https://mastercloud.local',
              'X-Title': 'Master Cloud AI',
            };
            if (envConfig.openrouterApiKey) {
              headers['Authorization'] = `Bearer ${envConfig.openrouterApiKey}`;
            }
            const orRes = await fetch(`${envConfig.openrouterEndpoint}/models`, {
              headers,
              signal: AbortSignal.timeout(8000),
            });
            if (orRes.ok) {
              const data = await orRes.json();
              const list = Array.isArray(data?.data) ? data.data : [];
              let addedCount = 0;
              for (const m of list) {
                const id = m.id;
                if (!id) continue;
                const isZeroCost = id.endsWith(':free') || (m.pricing?.prompt === '0' && m.pricing?.completion === '0');
                if (!isZeroCost) continue;
                if (isNonChatModel(id, m.name) || id.includes('llama-3.3-70b-instruct')) continue;
                if (m.architecture?.output_modalities && !m.architecture.output_modalities.includes('text')) continue;
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  const cleanName = cleanModelDisplayName(id, m.name);
                  const cat = categorizeModel(id, cleanName);
                  const ctx = m.context_length || 128000;
                  const ctxBadge = ctx >= 1000000 ? `${Math.round(ctx / 1000000)}M context` : `${Math.round(ctx / 1000)}k context`;

                  unifiedModels.push({
                    id,
                    name: cleanName,
                    description: m.description || `High-capacity conversational model (${id})`,
                    category: cat,
                    contextLength: ctx,
                    contextBadge: ctxBadge,
                    provider: 'openrouter',
                    isDefault: false,
                  });
                  addedCount++;
                  if (addedCount >= 20) break; // Keep top 20 verified models
                }
              }
              console.log(`[AI Proxy] OpenRouter discovered ${addedCount} free chat models`);
            } else {
              console.warn('[AI Proxy] OpenRouter fetch returned HTTP', orRes.status);
            }
          } catch (err: any) {
            console.warn('[AI Proxy] OpenRouter discovery failed:', err?.message || err);
          }

          // Verified resilient fallback for OpenRouter models
          if (unifiedModels.filter((m) => m.provider === 'openrouter').length === 0) {
            const fallbackOr = [
              { id: 'nvidia/nemotron-3.5-lightning:free', name: 'Nemotron 3.5 Lightning', description: 'Ultra-fast conversational reasoning and code assistant', category: 'fast', contextLength: 131072, contextBadge: '131k context', provider: 'openrouter', isDefault: false },
              { id: 'nvidia/nemotron-3.5-super-vl:free', name: 'Nemotron 3.5 Super VL', description: 'High-speed multimodal vision and chat model', category: 'vision', contextLength: 131072, contextBadge: '131k context', provider: 'openrouter', isDefault: false },
              { id: 'recursive/flint-v1.0:free', name: 'Flint V1.0', description: 'Recursive reasoning and conversational synthesis model', category: 'reasoning', contextLength: 131072, contextBadge: '131k context', provider: 'openrouter', isDefault: false },
              { id: 'particle-ai/particle-1:free', name: 'Particle 1', description: 'Lightweight high-efficiency conversational model', category: 'general', contextLength: 131072, contextBadge: '131k context', provider: 'openrouter', isDefault: false },
            ];
            for (const fm of fallbackOr) {
              if (!seenIds.has(fm.id)) {
                seenIds.add(fm.id);
                unifiedModels.push(fm);
              }
            }
          }
        })(),

        // K. NVIDIA NIM / Build API (Authenticated Dynamic Free Chat Model Discovery)
        (async () => {
          if (!envConfig.nvidiaApiKey) return;
          try {
            const nvRes = await fetch(`${envConfig.nvidiaEndpoint}/models`, {
              headers: {
                Authorization: `Bearer ${envConfig.nvidiaApiKey}`,
                Accept: 'application/json',
              },
              signal: AbortSignal.timeout(8000),
            });
            if (nvRes.ok) {
              const data = await nvRes.json();
              const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : [];
              let addedCount = 0;
              for (const m of list) {
                const id = m.id || m.name;
                if (!id) continue;
                if (isNonChatModel(id, m.name || m.description)) continue;
                // Exclude embeddings, rerank, audio, vision-only parse, guardrails, video detectors, pii, calibrations, safety
                if (/embed|rerank|guard|safety|parse|audio|tts|whisper|ocr|asr|detector|synthetic|pii|calibration|clip/i.test(id)) continue;

                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  const cleanName = cleanModelDisplayName(id, m.name);
                  const cat = categorizeModel(id, cleanName);
                  const ctx = m.context_length || m.context_window || 131072;
                  const ctxBadge = ctx >= 1000000 ? `${Math.round(ctx / 1000000)}M context` : `${Math.round(ctx / 1000)}k context`;

                  const rawDesc = m.description || 'High-throughput conversational intelligence and reasoning engine';
                  const cleanDesc = rawDesc
                    .replace(/\b(Groq|OpenRouter|UnoRouter|xKiro|Abhibots|APmix|Experiential|Nvidia|NVIDIA|NIM)\b/gi, '')
                    .replace(/\s{2,}/g, ' ')
                    .trim() || 'High-throughput conversational engine';

                  unifiedModels.push({
                    id,
                    name: cleanName,
                    description: cleanDesc,
                    category: cat,
                    contextLength: ctx,
                    contextBadge: ctxBadge,
                    provider: 'nvidia',
                    isDefault: false,
                  });
                  addedCount++;
                  if (addedCount >= 30) break;
                }
              }
              console.log(`[AI Proxy] NVIDIA NIM discovered ${addedCount} live chat models`);
            } else {
              console.warn('[AI Proxy] NVIDIA models endpoint returned HTTP', nvRes.status);
            }
          } catch (err: any) {
            console.warn('[AI Proxy] NVIDIA NIM model discovery failed:', err?.message || err);
          }

          // Resilient fallback for vetted NVIDIA Build catalog entries when API key is configured
          if (envConfig.nvidiaApiKey && unifiedModels.filter((m) => m.provider === 'nvidia').length === 0) {
            const vettedCandidates = [
              { id: 'nvidia/nemotron-3.5-bolt-e4b', name: 'Nemotron 3.5 Bolt E4B', description: 'NVIDIA high-speed conversational reasoning and tool-calling engine', category: 'fast', contextLength: 131072, contextBadge: '131k context', provider: 'nvidia', isDefault: false },
              { id: 'nvidia/nemotron-3.5-super-vl-120b-a12b', name: 'Nemotron 3.5 Super VL', description: 'NVIDIA multimodal vision and deep synthesis engine', category: 'vision', contextLength: 131072, contextBadge: '131k context', provider: 'nvidia', isDefault: false },
              { id: 'mistralai/mistral-large-4', name: 'Mistral Large 4', description: 'Frontier multilingual and reasoning architecture', category: 'general', contextLength: 128000, contextBadge: '128k context', provider: 'nvidia', isDefault: false },
              { id: 'moonshotai/kimi-k3.1-pro', name: 'Kimi K3.1 Pro', description: 'Advanced agentic and long-context reasoning model', category: 'reasoning', contextLength: 131072, contextBadge: '131k context', provider: 'nvidia', isDefault: false },
              { id: 'minimaxai/minimax-m3.1-flash', name: 'MiniMax M3.1 Flash', description: 'Fast multimodal Mixture-of-Experts architecture', category: 'fast', contextLength: 131072, contextBadge: '131k context', provider: 'nvidia', isDefault: false },
              { id: 'stepfun-ai/step-5-preview', name: 'Step 5 Preview', description: 'High-capability multi-domain conversational model', category: 'reasoning', contextLength: 131072, contextBadge: '131k context', provider: 'nvidia', isDefault: false },
            ];
            for (const cand of vettedCandidates) {
              if (!seenIds.has(cand.id)) {
                seenIds.add(cand.id);
                unifiedModels.push(cand);
              }
            }
          }
        })(),
      ]);

      // Fallback if offline or all networks blocked
      if (unifiedModels.length === 0) {
        unifiedModels.push(
          {
            id: 'openai/gpt-oss-120b',
            name: 'GPT-OSS 120B High-Velocity',
            description: 'Flagship reasoning and synthesis model',
            category: 'reasoning',
            contextLength: 131072,
            contextBadge: '131k context',
            provider: 'groq',
            isDefault: true,
          },
          {
            id: 'mistralai/mistral-large-2512',
            name: 'Mistral Large 2512',
            description: 'Advanced multilingual comprehension and coding',
            category: 'general',
            contextLength: 128000,
            contextBadge: '128k context',
            provider: 'xkiro',
            isDefault: false,
          },
          {
            id: 'openai/gpt-5.4-nano',
            name: 'GPT-5.4 Nano',
            description: 'Lightning-fast everyday assistance and analysis',
            category: 'fast',
            contextLength: 400000,
            contextBadge: '400k context',
            provider: 'pollinations',
            isDefault: false,
          },
          {
            id: 'qwen2.5-vl-72b-instruct:free',
            name: 'Qwen 2.5 VL 72B Instruct',
            description: 'Multimodal vision and conversational reasoning engine',
            category: 'vision',
            contextLength: 32000,
            contextBadge: '32k context',
            provider: 'unorouter',
            isDefault: false,
          },
          {
            id: 'inclusionai/ling-3.2-flash:free',
            name: 'Ling 3.2 Flash',
            description: 'Massive 1M-context hybrid reasoning model',
            category: 'reasoning',
            contextLength: 1048576,
            contextBadge: '1M context',
            provider: 'openrouter',
            isDefault: false,
          }
        );
      }

      // Update server-side cache
      serverModelCache = unifiedModels;
      serverModelCacheTime = now;

      return res.end(JSON.stringify({ models: unifiedModels }));
    }

    // ── 3. POST /api/ai/chat (Unified Multi-Provider Intelligent Chat Router & Resilience Cascade) ──
    if (url === '/api/ai/chat' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        let modelId = body.model || 'openai/gpt-oss-120b';
        const isStreaming = Boolean(body.stream);

        // Sanitize known deprecated or inaccessible model aliases immediately
        if (modelId === 'llama-3.3-70b-versatile' || modelId === 'llama-3.1-8b-instant') {
          modelId = 'openai/gpt-oss-120b';
        }

        // Routing Decision: Use explicit provider metadata or resolve from model ID
        let targetProvider = body.provider;

        if (!targetProvider) {
          if (
            modelId.startsWith('nvidia/') ||
            modelId === 'stepfun-ai/step-5-preview' ||
            modelId === 'moonshotai/kimi-k3.1-pro' ||
            modelId === 'minimaxai/minimax-m3.1-flash' ||
            (modelId === 'mistralai/mistral-large-4' && envConfig.nvidiaApiKey)
          ) {
            targetProvider = 'nvidia';
          } else if (
            modelId.startsWith('mistralai/') ||
            modelId.startsWith('cohere/') ||
            modelId.startsWith('sensenova/') ||
            modelId.startsWith('stealth/')
          ) {
            targetProvider = 'xkiro';
          } else if (
            modelId.startsWith('openai/gpt-5') ||
            modelId.startsWith('deepseek/') ||
            modelId.includes('pollinations')
          ) {
            targetProvider = 'pollinations';
          } else if (modelId.startsWith('experiential/')) {
            targetProvider = 'experiential';
          } else if (modelId.startsWith('abhibots/')) {
            targetProvider = 'abhibots';
          } else if (modelId.startsWith('apmix/')) {
            targetProvider = 'apmix';
          } else if (modelId.endsWith(':free')) {
            targetProvider = modelId.includes('/') ? 'openrouter' : 'unorouter';
          } else {
            targetProvider = 'groq';
          }
        }

        const buildProviderCall = (prov: string, mId: string, payload: any) => {
          let targetEndpoint = '';
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          const p = { ...payload, model: mId };
          delete p.provider;

          switch (prov) {
            case 'openrouter':
              targetEndpoint = `${envConfig.openrouterEndpoint}/chat/completions`;
              if (envConfig.openrouterApiKey) headers['Authorization'] = `Bearer ${envConfig.openrouterApiKey}`;
              headers['HTTP-Referer'] = 'https://mastercloud.local';
              headers['X-Title'] = 'Master Cloud AI';
              break;

            case 'nvidia':
              targetEndpoint = `${envConfig.nvidiaEndpoint}/chat/completions`;
              if (envConfig.nvidiaApiKey) headers['Authorization'] = `Bearer ${envConfig.nvidiaApiKey}`;
              break;

            case 'unorouter':
              targetEndpoint = `${envConfig.unorouterEndpoint}/chat/completions`;
              if (envConfig.unorouterApiKey) headers['Authorization'] = `Bearer ${envConfig.unorouterApiKey}`;
              break;

            case 'experiential':
              targetEndpoint = `${envConfig.experientialEndpoint}/chat/completions`;
              if (envConfig.experientialApiKey) headers['Authorization'] = `Bearer ${envConfig.experientialApiKey}`;
              break;

            case 'abhibots':
              targetEndpoint = `${envConfig.abhibotsEndpoint}/chat/completions`;
              if (envConfig.abhibotsApiKey) headers['Authorization'] = `Bearer ${envConfig.abhibotsApiKey}`;
              break;

            case 'apmix':
              targetEndpoint = `${envConfig.apmixEndpoint}/chat/completions`;
              if (envConfig.apmixApiKey) headers['Authorization'] = `Bearer ${envConfig.apmixApiKey}`;
              break;

            case 'xkiro':
              targetEndpoint = `${envConfig.xkiroEndpoint}/chat/completions`;
              if (envConfig.xkiroApiKey) headers['Authorization'] = `Bearer ${envConfig.xkiroApiKey}`;
              break;

            case 'pollinations':
              targetEndpoint = `${envConfig.pollinationsEndpoint}/v1/chat/completions`;
              if (envConfig.pollinationsApiKey) headers['Authorization'] = `Bearer ${envConfig.pollinationsApiKey}`;
              if (!p.max_tokens || p.max_tokens < 1024) p.max_tokens = 1024;
              break;

            case 'groq':
            default:
              targetEndpoint = `${envConfig.groqEndpoint}/chat/completions`;
              if (envConfig.groqApiKey) headers['Authorization'] = `Bearer ${envConfig.groqApiKey}`;
              let promptTokens = 0;
              if (Array.isArray(p.messages)) {
                for (const m of p.messages) {
                  let contentLength = 0;
                  if (typeof m.content === 'string') {
                    contentLength = m.content.length;
                  } else if (Array.isArray(m.content)) {
                    for (const part of m.content) {
                      if (part?.type === 'text') contentLength += (part.text?.length || 0);
                      else if (part?.type === 'image_url') contentLength += 1000;
                    }
                  }
                  promptTokens += 3 + Math.ceil(contentLength / 3.5);
                }
              }
              const safeMax = Math.max(1024, Math.min(p.max_tokens || 1800, 7200 - promptTokens));
              p.max_tokens = safeMax;
              break;
          }

          const isReasoning = /reason|r1|o1|o3|qwq|thought|kimi/i.test(mId);
          if (isReasoning && (!p.max_tokens || p.max_tokens < 1536)) {
            p.max_tokens = 1536;
          }

          return { targetEndpoint, headers, payload: p };
        };

        // Execute primary target request
        const primary = buildProviderCall(targetProvider, modelId, body);
        let upstreamRes: Response | null = null;
        let lastErrorData: any = null;

        try {
          upstreamRes = await fetch(primary.targetEndpoint, {
            method: 'POST',
            headers: primary.headers,
            body: JSON.stringify(primary.payload),
            signal: AbortSignal.timeout(30000),
          });
        } catch (fetchErr: any) {
          console.warn(`[AI Proxy] Primary request to ${targetProvider}:${modelId} failed:`, fetchErr?.message || fetchErr);
        }

        // Intelligent Resilience Cascade: If primary failed or returned error HTTP status
        if (!upstreamRes || !upstreamRes.ok) {
          if (upstreamRes) {
            lastErrorData = await upstreamRes.json().catch(() => ({}));
            console.warn(`[AI Proxy] ${targetProvider}:${modelId} returned HTTP ${upstreamRes.status}. Initiating Resilience Cascade...`);
          }

          const hasVisualPayload = Array.isArray(body?.messages) && body.messages.some((m: any) =>
            Array.isArray(m?.content) && m.content.some((part: any) => part?.type === 'image_url')
          );

          const cascadeCandidates = hasVisualPayload
            ? [
                { prov: 'xkiro', model: 'cohere/command-a-vision' },
                { prov: 'pollinations', model: 'openai/gpt-5.4-nano' },
                { prov: 'openrouter', model: 'nvidia/nemotron-3.5-super-vl:free' },
              ].filter((c) => !(c.prov === targetProvider && c.model === modelId))
            : [
                { prov: 'groq', model: 'openai/gpt-oss-120b' },
                { prov: 'groq', model: 'qwen/qwen3.8-27b' },
                { prov: 'xkiro', model: 'mistralai/ministral-14b' },
                { prov: 'xkiro', model: 'mistralai/mistral-large-2512' },
                { prov: 'openrouter', model: 'nvidia/nemotron-3.5-lightning:free' },
                { prov: 'pollinations', model: 'minimax/minimax-m3.1-flash' },
              ].filter((c) => !(c.prov === targetProvider && c.model === modelId));

          for (const cand of cascadeCandidates) {
            try {
              const candCall = buildProviderCall(cand.prov, cand.model, body);
              const candRes = await fetch(candCall.targetEndpoint, {
                method: 'POST',
                headers: candCall.headers,
                body: JSON.stringify(candCall.payload),
                signal: AbortSignal.timeout(18000),
              });
              if (candRes.ok) {
                console.log(`[AI Proxy] Resilience Cascade to ${cand.prov}:${cand.model} succeeded!`);
                upstreamRes = candRes;
                res.setHeader('X-Master-Fallback-Model', cand.model);
                res.setHeader('X-Master-Fallback-Provider', cand.prov);
                break;
              }
            } catch (cErr: any) {
              console.warn(`[AI Proxy] Cascade candidate ${cand.prov}:${cand.model} failed:`, cErr?.message || cErr);
            }
          }
        }

        if (!upstreamRes || !upstreamRes.ok) {
          res.statusCode = upstreamRes ? upstreamRes.status : 502;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(lastErrorData || { error: { message: 'All upstream model providers failed' } }));
        }

        if (upstreamRes.status === 429) {
          const retryAfter = upstreamRes.headers.get('retry-after');
          if (retryAfter) {
            res.setHeader('Retry-After', retryAfter);
          }
        }

        if (isStreaming && upstreamRes.body) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const reader = upstreamRes.body.getReader();
          const pump = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          };
          return pump().catch(() => res.end());
        } else {
          const data = await upstreamRes.json();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(data));
        }
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: err?.message || 'Chat routing failed' } }));
      }
    }

    // ── 4. POST /api/ai/image/generate (FLUX.2 [klein] 4B via NVIDIA NIM) ──
    if (url === '/api/ai/image/generate' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const prompt = body.prompt ? body.prompt.trim() : 'cinematic landscape';
        const size = body.size || '1024x1024';

        if (!envConfig.nvidiaApiKey) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              error: {
                message:
                  'NVIDIA API Key not configured. Please add NVIDIA_API_KEY to your server-side environment (.env.local).',
                code: 'NVIDIA_API_KEY_MISSING',
              },
            })
          );
        }

        const [wStr, hStr] = size.split('x');
        const width = Math.min(1440, Math.max(512, parseInt(wStr, 10) || 1024));
        const height = Math.min(1440, Math.max(512, parseInt(hStr, 10) || 1024));

        const genUrl = `${envConfig.nvidiaGenaiEndpoint}/genai/black-forest-labs/flux.2-klein-4b`;
        const nvRes = await fetch(genUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${envConfig.nvidiaApiKey}`,
          },
          body: JSON.stringify({
            prompt,
            width,
            height,
            steps: 4,
            samples: 1,
          }),
          signal: AbortSignal.timeout(60000),
        });

        if (!nvRes.ok) {
          const errData = await nvRes.json().catch(() => ({}));
          const errMsg =
            errData?.detail ||
            errData?.message ||
            errData?.error?.message ||
            `NVIDIA FLUX generation failed with HTTP ${nvRes.status}`;
          console.error('[AI Proxy] NVIDIA FLUX.2-klein-4b generation failed:', errMsg);
          res.statusCode = nvRes.status;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: { message: errMsg } }));
        }

        const data = await nvRes.json();
        const base64Img = data?.artifacts?.[0]?.base64 || data?.data?.[0]?.b64_json;
        if (!base64Img) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({ error: { message: 'NVIDIA FLUX.2-klein-4b did not return generated image artifacts' } })
          );
        }

        const finalUrl = base64Img.startsWith('data:') ? base64Img : `data:image/png;base64,${base64Img}`;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            url: finalUrl,
            model: 'black-forest-labs/flux.2-klein-4b',
            modelTitle: 'FLUX.2 [klein] 4B',
            prompt,
            width,
            height,
            seed: data?.artifacts?.[0]?.seed || data?.seed || Math.floor(Math.random() * 99999999),
          })
        );
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: err?.message || 'FLUX generation failed' } }));
      }
    }

    // ── 5. POST /api/ai/image/edit (FLUX.2 [klein] 4B Image Editing via NVIDIA NIM) ──
    if (url === '/api/ai/image/edit' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const prompt = body.prompt ? body.prompt.trim() : 'modify image';
        const inputImage = body.image;
        const size = body.size || '1024x1024';

        if (!envConfig.nvidiaApiKey) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              error: {
                message:
                  'NVIDIA API Key not configured. Please add NVIDIA_API_KEY to your server-side environment (.env.local).',
                code: 'NVIDIA_API_KEY_MISSING',
              },
            })
          );
        }

        if (!inputImage) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: { message: 'Original input image is required for image editing' } }));
        }

        const [wStr, hStr] = size.split('x');
        const width = Math.min(1440, Math.max(512, parseInt(wStr, 10) || 1024));
        const height = Math.min(1440, Math.max(512, parseInt(hStr, 10) || 1024));

        const editUrl = `${envConfig.nvidiaGenaiEndpoint}/genai/black-forest-labs/flux.2-klein-4b`;
        const nvRes = await fetch(editUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${envConfig.nvidiaApiKey}`,
          },
          body: JSON.stringify({
            prompt,
            image: inputImage,
          }),
          signal: AbortSignal.timeout(60000),
        });

        if (!nvRes.ok) {
          const errData = await nvRes.json().catch(() => ({}));
          const rawDetail = typeof errData?.detail === 'string' ? errData.detail : (errData?.detail ? JSON.stringify(errData.detail) : '');
          const errMsg =
            rawDetail ||
            errData?.message ||
            errData?.error?.message ||
            `NVIDIA FLUX editing failed with HTTP ${nvRes.status}`;
          console.error('[AI Proxy] NVIDIA FLUX.2-klein-4b image editing failed:', errMsg);
          const isLimitation =
            errMsg.includes('example_id') ||
            errMsg.includes('example') ||
            rawDetail.includes('example_id');

          res.statusCode = nvRes.status;
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              error: {
                message: errMsg,
                details: errData,
                apiLimitation: isLimitation,
                limitationNotice: isLimitation
                  ? 'NVIDIA Preview API Limitation: The hosted preview endpoint for FLUX.2-klein-4b restricts image editing input to predefined example IDs (data:image/png;example_id,...). A self-hosted NVIDIA NIM container deployment is required for arbitrary user image editing.'
                  : undefined,
              },
            })
          );
        }

        const data = await nvRes.json();
        const base64Img = data?.artifacts?.[0]?.base64 || data?.data?.[0]?.b64_json;
        if (!base64Img) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({ error: { message: 'NVIDIA FLUX.2-klein-4b did not return edited image artifacts' } })
          );
        }

        const finalUrl = base64Img.startsWith('data:') ? base64Img : `data:image/png;base64,${base64Img}`;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            url: finalUrl,
            originalUrl: inputImage,
            model: 'black-forest-labs/flux.2-klein-4b',
            modelTitle: 'FLUX.2 [klein] 4B',
            prompt,
            width,
            height,
            seed: data?.artifacts?.[0]?.seed || data?.seed || Math.floor(Math.random() * 99999999),
          })
        );
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: err?.message || 'FLUX editing failed' } }));
      }
    }

    // ── 5. GET /api/ai/search (Lightweight Web Intelligence Proxy) ───────────
    if (url.startsWith('/api/ai/search') && req.method === 'GET') {
      const q = new URL(url, 'http://localhost').searchParams.get('q') || '';
      if (!q.trim()) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ results: [] }));
      }

      try {
        const results: Array<{ title: string; snippet: string; url?: string }> = [];

        // Primary: DuckDuckGo Instant Answer
        try {
          const ddgRes = await fetch(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,
            { signal: AbortSignal.timeout(2500) }
          );
          if (ddgRes.ok) {
            const data = await ddgRes.json();
            if (data.AbstractText) {
              results.push({
                title: data.Heading || q,
                snippet: data.AbstractText,
                url: data.AbstractURL,
              });
            }
            if (Array.isArray(data.RelatedTopics)) {
              for (const topic of data.RelatedTopics.slice(0, 3)) {
                if (topic.Text) {
                  results.push({
                    title: topic.Text.slice(0, 48),
                    snippet: topic.Text,
                    url: topic.FirstURL,
                  });
                }
              }
            }
          }
        } catch {}

        // Fallback or Augment: Wikipedia Knowledge Search
        if (results.length < 2) {
          try {
            const wikiRes = await fetch(
              `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&utf8=&format=json`,
              { signal: AbortSignal.timeout(2500) }
            );
            if (wikiRes.ok) {
              const wikiData = await wikiRes.json();
              const hits = wikiData?.query?.search || [];
              for (const item of hits.slice(0, 3)) {
                const cleanSnippet = (item.snippet || '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"');
                results.push({
                  title: item.title,
                  snippet: cleanSnippet,
                  url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
                });
              }
            }
          } catch {}
        }

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ results }));
      } catch {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ results: [] }));
      }
    }

    // ── Legacy Routes Compatibility ─────────────────────────────────────────
    if (url.startsWith('/api/ai/groq/models') && req.method === 'GET') {
      if (!envConfig.groqApiKey) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: 'Groq API key not set' } }));
      }
      try {
        const groqRes = await fetch(`${envConfig.groqEndpoint}/models`, {
          headers: { Authorization: `Bearer ${envConfig.groqApiKey}` },
        });
        const data = await groqRes.json();
        res.statusCode = groqRes.status;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(data));
      } catch (err: any) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: err?.message } }));
      }
    }

    if (url.startsWith('/api/ai/xkiro/models') && req.method === 'GET') {
      if (!envConfig.xkiroApiKey) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: 'xKiro API key not set' } }));
      }
      try {
        const xkiroRes = await fetch(`${envConfig.xkiroEndpoint}/models`, {
          headers: { Authorization: `Bearer ${envConfig.xkiroApiKey}` },
        });
        const data = await xkiroRes.json();
        res.statusCode = xkiroRes.status;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(data));
      } catch (err: any) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: err?.message } }));
      }
    }

    if (url.startsWith('/api/ai/groq/chat') && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const isStreaming = Boolean(body.stream);

      // Token Safety Clamping for Groq Free Tier (Strict 8,000 TPM limit enforcement)
      let promptTokens = 0;
      if (Array.isArray(body.messages)) {
        for (const m of body.messages) {
          promptTokens += 3 + Math.ceil(((m.content || '') as string).length / 3.5);
        }
      }
      const safeMax = Math.max(512, Math.min(body.max_tokens || 1800, 7200 - promptTokens));
      body.max_tokens = safeMax;

      const groqRes = await fetch(`${envConfig.groqEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${envConfig.groqApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!groqRes.ok) {
        const err = await groqRes.json().catch(() => ({}));
        res.statusCode = groqRes.status;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(err));
      }

      if (isStreaming && groqRes.body) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const reader = groqRes.body.getReader();
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        };
        return pump().catch(() => res.end());
      } else {
        const data = await groqRes.json();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(data));
      }
    }

    if (url.startsWith('/api/ai/groq/transcriptions') && req.method === 'POST') {
      const rawBuffer = await getRawBodyBuffer(req);
      const contentType = req.headers['content-type'] || 'multipart/form-data';
      const groqRes = await fetch(`${envConfig.groqEndpoint}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          Authorization: `Bearer ${envConfig.groqApiKey}`,
        },
        body: rawBuffer,
      });
      const data = await groqRes.text();
      res.statusCode = groqRes.status;
      res.setHeader('Content-Type', groqRes.headers.get('content-type') || 'application/json');
      return res.end(data);
    }

    // CORS-safe Binary Image Proxy for Master Cloud Drive saving, canvas editing, and downloads
    if (url.startsWith('/api/ai/image/proxy')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      }

      try {
        const parsedUrl = new URL(url, 'http://localhost');
        const targetUrl = parsedUrl.searchParams.get('url');

        if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Valid target url parameter is required' }));
        }

        const fetchRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MasterCloud/2.0',
            Accept: 'image/*,*/*',
          },
          signal: AbortSignal.timeout(20000),
        });

        if (!fetchRes.ok) {
          res.statusCode = fetchRes.status;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: `Upstream image fetch failed: ${fetchRes.statusText}` }));
        }

        const contentType = fetchRes.headers.get('content-type') || 'image/png';
        const contentLength = fetchRes.headers.get('content-length');

        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
        if (contentLength) {
          res.setHeader('Content-Length', contentLength);
        }

        const arrayBuffer = await fetchRes.arrayBuffer();
        return res.end(Buffer.from(arrayBuffer));
      } catch (err: any) {
        console.error('[AI Image Proxy] Error fetching target image:', err);
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: err?.message || 'Proxy fetch failed' }));
      }
    }

    // ── Persistent Multi-User Chat History API ──
    if (url.startsWith('/api/ai/history')) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
      }

      const historyBaseDir = path.resolve(rootDir, '.master_cloud_data', 'ai_history');
      if (!fs.existsSync(historyBaseDir)) {
        try {
          fs.mkdirSync(historyBaseDir, { recursive: true });
        } catch {}
      }

      const parsedUrl = new URL(url, 'http://localhost');
      const getSafeUserKey = (rawKey?: string | null) => {
        const clean = (rawKey || 'default_user').trim().toLowerCase();
        return clean.replace(/[^a-zA-Z0-9_-]/g, '_');
      };

      if (req.method === 'GET') {
        const userKey = getSafeUserKey(parsedUrl.searchParams.get('userId'));
        const filePath = path.join(historyBaseDir, `${userKey}.json`);
        if (fs.existsSync(filePath)) {
          try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(data);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, conversations: parsed }));
          } catch (err: any) {
            console.warn('[AI History] Failed to read user history:', err);
          }
        }
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, conversations: [] }));
      }

      if (req.method === 'POST') {
        try {
          const body = await parseJsonBody(req);
          const userKey = getSafeUserKey(body.userId || parsedUrl.searchParams.get('userId'));
          const conversations = Array.isArray(body.conversations) ? body.conversations : [];
          const filePath = path.join(historyBaseDir, `${userKey}.json`);
          const tempPath = `${filePath}.tmp.${Date.now()}`;

          fs.writeFileSync(tempPath, JSON.stringify(conversations, null, 2), 'utf-8');
          fs.renameSync(tempPath, filePath);

          res.statusCode = 200;
          return res.end(JSON.stringify({ success: true, count: conversations.length }));
        } catch (err: any) {
          console.error('[AI History] Failed to write user history:', err);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: err?.message || 'Failed to save chat history' }));
        }
      }

      if (req.method === 'DELETE') {
        try {
          const userKey = getSafeUserKey(parsedUrl.searchParams.get('userId'));
          const convId = parsedUrl.searchParams.get('conversationId');
          const filePath = path.join(historyBaseDir, `${userKey}.json`);

          if (fs.existsSync(filePath)) {
            if (!convId || convId === 'all') {
              fs.unlinkSync(filePath);
            } else {
              const data = fs.readFileSync(filePath, 'utf-8');
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed)) {
                const filtered = parsed.filter((c: any) => c.id !== convId);
                fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
              }
            }
          }
          res.statusCode = 200;
          return res.end(JSON.stringify({ success: true }));
        } catch (err: any) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: err?.message || 'Failed to delete chat history' }));
        }
      }

      res.statusCode = 405;
      return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    }

    if (url.startsWith('/api/ai/pollinations/models') && req.method === 'GET') {
      const polliRes = await fetch(`${envConfig.pollinationsEndpoint}/image/models`);
      const data = await polliRes.json();
      res.statusCode = polliRes.status;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(data));
    }

    if (url.startsWith('/api/ai/pollinations/generate') && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const prompt = body.prompt ? encodeURIComponent(body.prompt.trim()) : 'image';
      const queryParams = new URLSearchParams({
        model: body.model || 'black-forest-labs/flux.1-schnell',
        width: String(body.width || 1024),
        height: String(body.height || 1024),
        nologo: 'true',
      });
      const targetUrl = `${envConfig.pollinationsEndpoint}/image/${prompt}?${queryParams.toString()}`;
      const polliRes = await fetch(targetUrl);
      const arrayBuffer = await polliRes.arrayBuffer();
      res.statusCode = 200;
      res.setHeader('Content-Type', polliRes.headers.get('content-type') || 'image/png');
      return res.end(Buffer.from(arrayBuffer));
    }

    if (url.startsWith('/api/ai/comfyui/status') && req.method === 'GET') {
      const t0 = performance.now();
      try {
        const comfyRes = await fetch(`${envConfig.comfyUiEndpoint}/system_stats`, {
          signal: AbortSignal.timeout(2000),
        });
        const latencyMs = Math.round(performance.now() - t0);
        if (comfyRes.ok) {
          const data = await comfyRes.json().catch(() => ({}));
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ online: true, latencyMs, endpoint: envConfig.comfyUiEndpoint, data }));
        }
      } catch {}
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ online: false, endpoint: envConfig.comfyUiEndpoint }));
    }

    next();
  };
}

export function aiProxyPlugin(): Plugin {
  let rootDir = process.cwd();

  return {
    name: 'vite-plugin-ai-proxy',
    configResolved(config) {
      rootDir = config.root || process.cwd();
    },
    configureServer(server) {
      server.middlewares.use(createAiProxyMiddleware(rootDir));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createAiProxyMiddleware(rootDir));
    },
  };
}
