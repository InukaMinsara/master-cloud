/**
 * src/features/ai/services/groqService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — OFFICIAL GROQ PROVIDER LAYER
 * High-speed LPU inference engine connecting to official Groq API:
 * https://api.groq.com/openai/v1 (or user configured endpoint)
 *
 * Guarantees:
 * - Real-time SSE streaming reader
 * - Dynamic token-per-second live telemetry calculation
 * - Dynamic Groq model discovery via GET /models
 * - Reconciliation with official Free-Tier Eligibility Registry
 * - Whisper Large v3 audio transcription for subtitles & voice
 * - Client-side credential management via unified aiVaultService
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
   * Retrieves the stored Groq API key from unified aiVaultService.
   */
  public getApiKey(): string {
    return aiVaultService.getGroqApiKey();
  }

  /**
   * Securely saves the Groq API key.
   */
  public setApiKey(key: string): void {
    aiVaultService.updateConfig({ groqApiKey: key.trim() });
  }

  /**
   * Retrieves the active Groq endpoint.
   */
  public getEndpoint(): string {
    return aiVaultService.getGroqEndpoint();
  }

  /**
   * Checks whether a valid Groq API key is present.
   */
  public hasApiKey(): boolean {
    return Boolean(this.getApiKey());
  }

  /**
   * Tests API key connectivity and measures real network latency to Groq.
   */
  public async testConnection(
    customKey?: string,
    customEndpoint?: string
  ): Promise<{ ok: boolean; latencyMs: number; error?: string; modelCount?: number }> {
    const key = customKey !== undefined ? customKey.trim() : this.getApiKey();
    const endpoint = (customEndpoint || this.getEndpoint()).replace(/\/+$/, '');

    if (!key) {
      return { ok: false, latencyMs: 0, error: 'No Groq API key provided.' };
    }

    const start = performance.now();
    try {
      const res = await fetch(`${endpoint}/models`, {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(7000),
      });

      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const count = Array.isArray(data?.data) ? data.data.length : undefined;
        aiVaultService.updateConfig({ groqLastConnected: Date.now(), groqLastError: undefined });
        return { ok: true, latencyMs: latency, modelCount: count };
      }

      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${res.status}: Unauthorized or Invalid Key`;
      aiVaultService.updateConfig({ groqLastError: msg });
      return { ok: false, latencyMs: latency, error: msg };
    } catch (err: any) {
      const msg = err?.message || 'Network error connecting to Groq.';
      aiVaultService.updateConfig({ groqLastError: msg });
      return {
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        error: msg,
      };
    }
  }

  /**
   * Dynamically discovers active Groq models for the connected account via GET /models.
   * Compares against the official Free-Tier Eligibility Registry.
   */
  public async discoverActiveModels(forceRefresh = false): Promise<GroqModelInfo[]> {
    if (!forceRefresh && this.discoveredModels && this.discoveredModels.length > 0) {
      return this.discoveredModels;
    }

    const key = this.getApiKey();
    if (!key) {
      return VERIFIED_GROQ_MODELS;
    }

    const endpoint = this.getEndpoint();
    try {
      const res = await fetch(`${endpoint}/models`, {
        headers: { Authorization: `Bearer ${key}` },
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
      console.warn('[GroqService] Dynamic model discovery failed, using baseline registry:', e);
    }

    return VERIFIED_GROQ_MODELS;
  }

  /**
   * Streams chat completions from Groq via Server-Sent Events (SSE).
   * Calculates live tokens/second telemetry on every chunk.
   */
  public async streamChat(options: GroqChatOptions): Promise<GroqChatResult> {
    const key = this.getApiKey();
    if (!key) {
      throw new Error(
        'Groq API Key missing. Please click the Key icon in the header to enter your free Groq API key (console.groq.com/keys).'
      );
    }

    const endpoint = this.getEndpoint();
    const model = options.model || DEFAULT_GROQ_MODEL;
    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    let accumulated = '';
    let buffer = '';
    let estimatedTokens = 0;

    const executeRequest = async (attempt: number): Promise<Response> => {
      try {
        const res = await fetch(`${endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          signal: options.signal,
          body: JSON.stringify({
            model,
            messages: options.messages,
            stream: true,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 4096,
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
      const errMsg = errJson?.error?.message || `Groq API Error (${res.status})`;
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
    const key = this.getApiKey();
    if (!key) {
      throw new Error('Groq API Key missing.');
    }

    const endpoint = this.getEndpoint();
    const model = options.model || 'llama-3.1-8b-instant';
    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 1024,
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
    const key = this.getApiKey();
    if (!key) {
      throw new Error('Groq API Key required for audio transcription.');
    }

    const endpoint = this.getEndpoint();
    const formData = new FormData();
    formData.append('file', audioBlob, filename);
    formData.append('model', model);
    formData.append('response_format', 'verbose_json');

    const res = await fetch(`${endpoint}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
      },
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
