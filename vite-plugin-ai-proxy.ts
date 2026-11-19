/**
 * vite-plugin-ai-proxy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER CLOUD — SERVER-SIDE AI ENVIRONMENT PROXY
 * Securely reads provider credentials and endpoints from .env.local on the server.
 *
 * Security Guarantees:
 * - Credentials NEVER enter the browser bundle
 * - No VITE_ prefixed secrets
 * - Browser localStorage contains zero API keys
 * - Outbound provider requests are injected with Authorization headers server-side
 * - Operates in both Vite dev server and preview server
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

interface ServerAiConfig {
  pollinationsEndpoint: string;
  pollinationsApiKey: string;
  groqEndpoint: string;
  groqApiKey: string;
  comfyUiEndpoint: string;
  comfyUiApiKey: string;
}

export function loadEnvLocal(rootDir: string): ServerAiConfig {
  const config: ServerAiConfig = {
    pollinationsEndpoint: 'https://gen.pollinations.ai',
    pollinationsApiKey: '',
    groqEndpoint: 'https://api.groq.com/openai/v1',
    groqApiKey: '',
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
          // Strip wrapping quotes
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }

          if (key === 'POLLINATIONS_API_ENDPOINT' && val) config.pollinationsEndpoint = val.replace(/\/+$/, '');
          if (key === 'POLLINATIONS_API_KEY' && val) config.pollinationsApiKey = val;
          if (key === 'GROQ_API_ENDPOINT' && val) config.groqEndpoint = val.replace(/\/+$/, '');
          if (key === 'GROQ_API_KEY' && val) config.groqApiKey = val;
          if (key === 'COMFYUI_LOCAL_ENDPOINT' && val) config.comfyUiEndpoint = val.replace(/\/+$/, '');
          if (key === 'COMFYUI_LOCAL_API_KEY' && val) config.comfyUiApiKey = val;
        }
      } catch (err) {
        console.warn(`[AI Proxy] Failed to parse ${file}:`, err);
      }
    }
  }

  // Also check system process.env for any injected env variables
  if (process.env.POLLINATIONS_API_ENDPOINT) config.pollinationsEndpoint = process.env.POLLINATIONS_API_ENDPOINT.replace(/\/+$/, '');
  if (process.env.POLLINATIONS_API_KEY) config.pollinationsApiKey = process.env.POLLINATIONS_API_KEY;
  if (process.env.GROQ_API_ENDPOINT) config.groqEndpoint = process.env.GROQ_API_ENDPOINT.replace(/\/+$/, '');
  if (process.env.GROQ_API_KEY) config.groqApiKey = process.env.GROQ_API_KEY;
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

    // ── 2. GET /api/ai/groq/models ───────────────────────────────────────────
    if (url.startsWith('/api/ai/groq/models') && req.method === 'GET') {
      if (!envConfig.groqApiKey) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            error: { message: 'Groq provider unavailable. Please set GROQ_API_KEY in .env.local' },
          })
        );
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
        return res.end(JSON.stringify({ error: { message: err?.message || 'Groq connection failed' } }));
      }
    }

    // ── 3. POST /api/ai/groq/chat ───────────────────────────────────────────
    if (url.startsWith('/api/ai/groq/chat') && req.method === 'POST') {
      if (!envConfig.groqApiKey) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            error: { message: 'Groq provider unavailable. Please set GROQ_API_KEY in .env.local' },
          })
        );
      }

      try {
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
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: err?.message || 'Chat completion failed' } }));
      }
    }

    // ── 3.1 POST /api/ai/groq/transcriptions ─────────────────────────────────
    if (url.startsWith('/api/ai/groq/transcriptions') && req.method === 'POST') {
      if (!envConfig.groqApiKey) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            error: { message: 'Groq provider unavailable. Please set GROQ_API_KEY in .env.local' },
          })
        );
      }

      try {
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
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: err?.message || 'Audio transcription failed' } }));
      }
    }

    // ── 4. GET /api/ai/pollinations/models ──────────────────────────────────
    if (url.startsWith('/api/ai/pollinations/models') && req.method === 'GET') {
      try {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (envConfig.pollinationsApiKey) {
          headers['Authorization'] = `Bearer ${envConfig.pollinationsApiKey}`;
        }

        const polliRes = await fetch(`${envConfig.pollinationsEndpoint}/image/models`, {
          method: 'GET',
          headers,
        });
        const data = await polliRes.json();
        res.statusCode = polliRes.status;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(data));
      } catch (err: any) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: err?.message || 'Pollinations connection failed' } }));
      }
    }

    // ── 5. POST /api/ai/pollinations/generate ───────────────────────────────
    if (url.startsWith('/api/ai/pollinations/generate') && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const prompt = body.prompt ? encodeURIComponent(body.prompt.trim()) : 'image';
        const queryParams = new URLSearchParams({
          model: body.model || 'black-forest-labs/flux.1-schnell',
          width: String(body.width || 1024),
          height: String(body.height || 1024),
          seed: String(body.seed || Math.floor(Math.random() * 99999999)),
          nologo: 'true',
        });
        if (body.enhance) queryParams.set('enhance', 'true');

        const targetUrl = `${envConfig.pollinationsEndpoint}/image/${prompt}?${queryParams.toString()}`;
        const headers: Record<string, string> = { Accept: 'image/*' };
        if (envConfig.pollinationsApiKey) {
          headers['Authorization'] = `Bearer ${envConfig.pollinationsApiKey}`;
        }

        const polliRes = await fetch(targetUrl, {
          method: 'GET',
          headers,
        });

        if (!polliRes.ok) {
          const err = await polliRes.text().catch(() => '');
          res.statusCode = polliRes.status;
          res.setHeader('Content-Type', 'application/json');
          return res.end(err || JSON.stringify({ error: { message: `Image generation failed (${polliRes.status})` } }));
        }

        const arrayBuffer = await polliRes.arrayBuffer();
        res.statusCode = 200;
        res.setHeader('Content-Type', polliRes.headers.get('content-type') || 'image/png');
        return res.end(Buffer.from(arrayBuffer));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: err?.message || 'Generation failed' } }));
      }
    }

    // ── 6. POST /api/ai/pollinations/edit ───────────────────────────────────
    if (url.startsWith('/api/ai/pollinations/edit') && req.method === 'POST') {
      try {
        const rawBuffer = await getRawBodyBuffer(req);
        const contentType = req.headers['content-type'] || 'multipart/form-data';

        const headers: Record<string, string> = {
          'Content-Type': contentType,
        };
        if (envConfig.pollinationsApiKey) {
          headers['Authorization'] = `Bearer ${envConfig.pollinationsApiKey}`;
        }

        const polliRes = await fetch(`${envConfig.pollinationsEndpoint}/v1/images/edits`, {
          method: 'POST',
          headers,
          body: rawBuffer,
        });

        const data = await polliRes.text();
        res.statusCode = polliRes.status;
        res.setHeader('Content-Type', polliRes.headers.get('content-type') || 'application/json');
        return res.end(data);
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: err?.message || 'Image editing failed' } }));
      }
    }

    // ── 7. GET /api/ai/comfyui/status ───────────────────────────────────────
    if (url.startsWith('/api/ai/comfyui/status') && req.method === 'GET') {
      const t0 = performance.now();
      try {
        const headers: Record<string, string> = {};
        if (envConfig.comfyUiApiKey) {
          headers['Authorization'] = `Bearer ${envConfig.comfyUiApiKey}`;
        }
        const comfyRes = await fetch(`${envConfig.comfyUiEndpoint}/system_stats`, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(3000),
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
