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
        })
      );
    }

    // ── 2. GET /api/ai/models (Aggregated Dynamic Model Discovery) ───────────
    if (url === '/api/ai/models' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      const unifiedModels: any[] = [];
      const seenIds = new Set<string>();

      // A. Groq Models
      if (envConfig.groqApiKey) {
        try {
          const groqRes = await fetch(`${envConfig.groqEndpoint}/models`, {
            headers: { Authorization: `Bearer ${envConfig.groqApiKey}` },
            signal: AbortSignal.timeout(3500),
          });
          if (groqRes.ok) {
            const data = await groqRes.json();
            if (Array.isArray(data?.data)) {
              for (const m of data.data) {
                const id = m.id;
                if (id.includes('whisper') || id.includes('guard')) continue;
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  let cleanName = id.replace(/^(openai\/|meta-llama\/|groq\/)/, '');
                  cleanName = cleanName
                    .split(/[-_]/)
                    .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(' ');

                  unifiedModels.push({
                    id,
                    name: cleanName,
                    description: `High-velocity conversational neural engine (${id})`,
                    category: id.includes('code') ? 'coding' : id.includes('r1') ? 'reasoning' : 'fast',
                    contextLength: m.context_window || 128000,
                    contextBadge: `${Math.round((m.context_window || 128000) / 1000)}k context`,
                    provider: 'groq',
                    isDefault: id.includes('120b') || id.includes('70b') || id.includes('20b'),
                  });
                }
              }
            }
          }
        } catch {}
      }

      // B. xKiro Models (Free Tier Chat Models Only)
      if (envConfig.xkiroApiKey) {
        try {
          const xkiroRes = await fetch(`${envConfig.xkiroEndpoint}/models`, {
            headers: { Authorization: `Bearer ${envConfig.xkiroApiKey}` },
            signal: AbortSignal.timeout(3500),
          });
          if (xkiroRes.ok) {
            const data = await xkiroRes.json();
            if (Array.isArray(data?.data)) {
              for (const m of data.data) {
                if (m.access_tier === 'free' && m.type === 'model' && m.id !== 'sensenova/sensenova-u1.5-lite') {
                  const id = m.id;
                  if (!seenIds.has(id)) {
                    seenIds.add(id);
                    let cleanName = m.display_name || id.replace(/^(mistralai\/|cohere\/|sensenova\/)/, '');
                    cleanName = cleanName
                      .split(/[-_]/)
                      .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
                      .join(' ');

                    unifiedModels.push({
                      id,
                      name: cleanName,
                      description: `Intelligent multi-domain reasoning model (${id})`,
                      category: id.includes('code') || id.includes('devstral') ? 'coding' : id.includes('reasoning') ? 'reasoning' : id.includes('vision') ? 'vision' : 'general',
                      contextLength: m.context_length || 128000,
                      contextBadge: `${Math.round((m.context_length || 128000) / 1000)}k context`,
                      provider: 'xkiro',
                      isDefault: false,
                    });
                  }
                }
              }
            }
          }
        } catch {}
      }

      // C. Pollinations Models (Free Text Models Only)
      try {
        const polliHeaders: Record<string, string> = { Accept: 'application/json' };
        if (envConfig.pollinationsApiKey) {
          polliHeaders['Authorization'] = `Bearer ${envConfig.pollinationsApiKey}`;
        }
        const polliRes = await fetch(`${envConfig.pollinationsEndpoint}/text/models`, {
          headers: polliHeaders,
          signal: AbortSignal.timeout(3500),
        });
        if (polliRes.ok) {
          const data = await polliRes.json();
          if (Array.isArray(data)) {
            for (const m of data) {
              if (m.category === 'text' && !m.paid_only) {
                const id = m.name;
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  const cleanName = m.title || id.replace(/^(openai\/|meta-llama\/|google\/)/, '');
                  unifiedModels.push({
                    id,
                    name: cleanName,
                    description: m.description || `Adaptive conversational intelligence (${id})`,
                    category: id.includes('code') ? 'coding' : m.reasoning ? 'reasoning' : 'fast',
                    contextLength: m.context_length || 128000,
                    contextBadge: `${Math.round((m.context_length || 128000) / 1000)}k context`,
                    provider: 'pollinations',
                    isDefault: false,
                  });
                }
              }
            }
          }
        }
      } catch {}

      // Fallback if network blocked
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
          }
        );
      }

      return res.end(JSON.stringify({ models: unifiedModels }));
    }

    // ── 3. POST /api/ai/chat (Unified Intelligent Chat Completions Router) ──
    if (url === '/api/ai/chat' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const modelId = body.model || 'openai/gpt-oss-120b';
        const isStreaming = Boolean(body.stream);

        // Routing Decision
        let targetEndpoint = '';
        let authHeader = '';
        let targetProvider = 'groq';

        if (
          modelId.startsWith('mistralai/') ||
          modelId.startsWith('cohere/') ||
          modelId.startsWith('sensenova/') ||
          modelId.startsWith('stealth/')
        ) {
          targetProvider = 'xkiro';
          targetEndpoint = `${envConfig.xkiroEndpoint}/chat/completions`;
          authHeader = `Bearer ${envConfig.xkiroApiKey}`;
        } else if (
          modelId.startsWith('openai/gpt-5') ||
          modelId.startsWith('deepseek/') ||
          modelId.includes('pollinations')
        ) {
          targetProvider = 'pollinations';
          targetEndpoint = `${envConfig.pollinationsEndpoint}/v1/chat/completions`;
          authHeader = envConfig.pollinationsApiKey ? `Bearer ${envConfig.pollinationsApiKey}` : '';
        } else {
          // Default to Groq
          targetProvider = 'groq';
          targetEndpoint = `${envConfig.groqEndpoint}/chat/completions`;
          authHeader = `Bearer ${envConfig.groqApiKey}`;
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (authHeader) headers['Authorization'] = authHeader;

        const upstreamRes = await fetch(targetEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!upstreamRes.ok) {
          const errData = await upstreamRes.json().catch(() => ({}));
          res.statusCode = upstreamRes.status;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(errData));
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

    // ── 4. POST /api/ai/image/generate (SenseNova U1.5 Lite via xKiro ONLY) ──
    if (url === '/api/ai/image/generate' && req.method === 'POST') {
      if (!envConfig.xkiroApiKey) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            error: { message: 'Image generation service offline. Please configure XKIRO_API_KEY in .env.local' },
          })
        );
      }

      try {
        const body = await parseJsonBody(req);
        const prompt = body.prompt ? body.prompt.trim() : 'master asset';
        const size = body.size || '1024x1024';

        // 1. Submit asynchronous job to xKiro official SenseNova endpoint
        const jobSubmitRes = await fetch(`${envConfig.xkiroEndpoint}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${envConfig.xkiroApiKey}`,
          },
          body: JSON.stringify({
            model: 'sensenova/sensenova-u1.5-lite',
            prompt,
            n: 1,
            size,
          }),
        });

        if (!jobSubmitRes.ok) {
          const err = await jobSubmitRes.json().catch(() => ({}));
          res.statusCode = jobSubmitRes.status;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(err));
        }

        const jobCreated = await jobSubmitRes.json();

        // If returned immediately with data url
        if (jobCreated?.data?.[0]?.url) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              url: jobCreated.data[0].url,
              model: 'sensenova/sensenova-u1.5-lite',
              prompt,
            })
          );
        }

        // 2. Poll asynchronous job with exponential backoff
        const jobId = jobCreated.id;
        if (!jobId) {
          throw new Error('No job ID returned from SenseNova engine');
        }

        const deadline = Date.now() + 60000; // 60s timeout
        let waitMs = 1500;
        let finalUrl = '';

        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, waitMs));
          waitMs = Math.min(waitMs * 1.3, 4000);

          const pollRes = await fetch(`${envConfig.xkiroEndpoint}/images/generations/${jobId}`, {
            headers: { Authorization: `Bearer ${envConfig.xkiroApiKey}` },
          });

          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData?.status === 'succeeded' || pollData?.status === 'completed') {
              if (pollData?.data?.[0]?.url) {
                finalUrl = pollData.data[0].url;
                break;
              }
            } else if (pollData?.status === 'failed') {
              throw new Error(pollData?.error?.message || 'SenseNova rendering job failed');
            }
          }
        }

        if (!finalUrl) {
          throw new Error('Image generation timed out after 60 seconds');
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            url: finalUrl,
            model: 'sensenova/sensenova-u1.5-lite',
            prompt,
          })
        );
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: err?.message || 'SenseNova generation failed' } }));
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
