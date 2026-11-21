/**
 * src/features/ai/services/groqService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — OFFICIAL GROQ PROVIDER LAYER
 * High-speed LPU inference engine connecting through the server environment proxy.
 *
 * Guarantees:
 * - Credentials reside exclusively in .env.local on the server
 * - Real-time SSE streaming reader with zero token lag
 * - Dynamic token-per-second live telemetry calculation
 * - Dynamic Groq model discovery via /api/ai/groq/models
 * - Reconciliation with official Free-Tier Eligibility Registry
 * - Whisper Large v3 audio transcription for subtitles & voice via /api/ai/groq/transcriptions
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  AiTokenMetrics,
  GroqChatOptions,
  GroqChatResult,
  GroqModelInfo,
  GroqTranscriptionResult,
} from '../types/aiTypes';
import {
  DEFAULT_GROQ_MODEL,
  GROQ_AUDIO_MODELS,
  VERIFIED_GROQ_MODELS,
  reconcileLiveGroqModels,
} from './groqModels';
import { aiVaultService } from './aiVaultService';

class GroqService {
  private discoveredModels: GroqModelInfo[] | null = null;
  private lastDiscoveryTimestamp = 0;

  /**
   * Returns whether Groq is configured and active in the server environment (.env.local).
   */
  public hasApiKey(): boolean {
    return aiVaultService.hasGroqKey();
  }

  /**
   * Compatibility adapter: returns status string if key is configured in .env.local.
   */
  public getApiKey(): string {
    return this.hasApiKey() ? 'env_configured' : '';
  }

  /**
   * Compatibility adapter: under environment-only architecture, keys are in .env.local.
   */
  public setApiKey(_key: string): void {
    // Stored exclusively in server environment (.env.local)
  }

  /**
   * Retrieves the configured Groq endpoint.
   */
  public getEndpoint(): string {
    return aiVaultService.getGroqEndpoint();
  }

  /**
   * Tests connectivity to Groq via the server-side environment proxy.
   */
  public async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string; modelCount?: number }> {
    const start = performance.now();
    try {
      const res = await fetch('/api/ai/groq/models', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(7000),
      });

      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const count = Array.isArray(data?.data) ? data.data.length : undefined;
        return { ok: true, latencyMs: latency, modelCount: count };
      }

      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${res.status}: Groq unavailable in .env.local`;
      return { ok: false, latencyMs: latency, error: msg };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        error: err?.message || 'Server proxy connection failed.',
      };
    }
  }

  /**
   * Dynamically discovers active Groq models for the connected account via /api/ai/groq/models.
   * Compares against the official Free-Tier Eligibility Registry.
   */
  public async discoverActiveModels(forceRefresh = false): Promise<GroqModelInfo[]> {
    if (!forceRefresh && this.discoveredModels && this.discoveredModels.length > 0) {
      return this.discoveredModels;
    }

    try {
      const res = await fetch('/api/ai/groq/models', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return VERIFIED_GROQ_MODELS;
      }

      const json = await res.json();
      if (Array.isArray(json?.data)) {
        const live = json.data.map((m: any) => ({ id: m.id, active: m.active }));
        const reconciled = reconcileLiveGroqModels(live);
        this.discoveredModels = reconciled;
        this.lastDiscoveryTimestamp = Date.now();
        return reconciled;
      }
    } catch (e) {
      console.warn('[GroqService] Dynamic model discovery via proxy failed, using baseline registry:', e);
    }

    return VERIFIED_GROQ_MODELS;
  }

  /**
   * Streams chat completions from Groq via Server-Sent Events (SSE) through the backend proxy.
   * Calculates live tokens/second telemetry on every chunk.
   */
  public async streamChat(options: GroqChatOptions): Promise<GroqChatResult> {
    const model = options.model || DEFAULT_GROQ_MODEL;
    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    let accumulated = '';
    let buffer = '';
    let estimatedTokens = 0;

    const executeRequest = async (attempt: number): Promise<Response> => {
      try {
        const res = await fetch('/api/ai/groq/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: options.signal,
          body: JSON.stringify({
            model,
            messages: options.messages,
            stream: true,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 1800,
          }),
        });

        if (res.status === 429 && attempt < 3) {
          // Exponential backoff retry for rate limits
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return executeRequest(attempt + 1);
        }

        return res;
      } catch (err) {
        if (attempt < 2 && !options.signal?.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          return executeRequest(attempt + 1);
        }
        throw err;
      }
    };

    const res = await executeRequest(0);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.error?.message || `Groq API Error (${res.status}): Please ensure GROQ_API_KEY is configured in .env.local`;
      throw new Error(errMsg);
    }

    if (!res.body) {
      throw new Error('Groq response stream is empty.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done || options.signal?.aborted) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '').trim();
        if (!payload || payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload);
          const chunk = parsed?.choices?.[0]?.delta?.content || '';
          if (chunk) {
            if (firstTokenTime === null) {
              firstTokenTime = performance.now();
            }
            accumulated += chunk;
            // Token estimation heuristic (~3.8 chars per token in English/code)
            estimatedTokens += Math.max(1, Math.ceil(chunk.length / 3.8));

            const elapsedSec = (performance.now() - (firstTokenTime || startTime)) / 1000;
            const currentTokSec = elapsedSec > 0.05 ? Math.round(estimatedTokens / elapsedSec) : 0;

            const liveMetrics: AiTokenMetrics = {
              completionTokens: estimatedTokens,
              totalTokens: estimatedTokens,
              tokensPerSec: currentTokSec,
              latencyMs: Math.round(performance.now() - startTime),
              firstTokenMs: firstTokenTime ? Math.round(firstTokenTime - startTime) : undefined,
            };

            options.onChunk?.(chunk, accumulated);
            options.onMetrics?.(liveMetrics);
          }
        } catch {
          // Ignore partial SSE JSON line
        }
      }
    }

    const totalElapsedSec = (performance.now() - (firstTokenTime || startTime)) / 1000;
    const finalTokSec = totalElapsedSec > 0.1 ? Math.round(estimatedTokens / totalElapsedSec) : 0;

    const finalMetrics: AiTokenMetrics = {
      completionTokens: estimatedTokens,
      totalTokens: estimatedTokens,
      tokensPerSec: finalTokSec,
      latencyMs: Math.round(performance.now() - startTime),
      firstTokenMs: firstTokenTime ? Math.round(firstTokenTime - startTime) : undefined,
    };

    return {
      text: accumulated,
      modelUsed: model,
      metrics: finalMetrics,
    };
  }

  /**
   * Fast non-streaming completion for utility tasks (Smart Rename, Titles).
   */
  public async completeChat(
    prompt: string,
    options: {
      model?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    const model = options.model || 'llama-3.1-8b-instant';
    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const res = await fetch('/api/ai/groq/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 1024,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `Groq completion failed (${res.status})`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || '';
  }

  /**
   * Speech-to-Text audio transcription via Groq Whisper Large v3.
   */
  public async transcribeAudio(
    audioBlob: Blob,
    filename: string = 'recording.webm',
    model: string = GROQ_AUDIO_MODELS.whisperTurbo
  ): Promise<GroqTranscriptionResult> {
    const formData = new FormData();
    formData.append('file', audioBlob, filename);
    formData.append('model', model);
    formData.append('response_format', 'verbose_json');

    const res = await fetch('/api/ai/groq/transcriptions', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `Groq transcription failed (${res.status})`);
    }

    const data = await res.json();
    return {
      text: data.text || '',
      language: data.language,
      duration: data.duration,
    };
  }
}

export const groqService = new GroqService();
