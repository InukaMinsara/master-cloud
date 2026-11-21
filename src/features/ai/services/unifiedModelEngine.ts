/**
 * src/features/ai/services/unifiedModelEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI INFINITY — UNIFIED INTELLIGENT MODEL ENGINE
 * Dynamic multi-provider discovery, intelligent routing across Groq, xKiro,
 * and Pollinations, SSE streaming, real-time token metrics, web intelligence,
 * and SenseNova U1.5 Lite image synthesis.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { UnifiedChatModel, AiTokenMetrics, WebSearchResult, GenerationParameters } from '../types/aiTypes';
import { ContextManager } from './contextManager';
import { resolveModelFamily } from '../components/ModelFamilyLogo';
import { ModelCapabilityService } from './modelCapabilityService';

export interface UnifiedStreamOptions {
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string | any[] }>;
  signal?: AbortSignal;
  webSearch?: boolean;
  failover?: boolean;
  generationParameters?: GenerationParameters;
  onChunk?: (chunk: string, accumulated: string) => void;
  onMetrics?: (metrics: AiTokenMetrics) => void;
  onWebSources?: (sources: WebSearchResult[]) => void;
  onFailoverNotification?: (fallbackModel: string, provider: string) => void;
  onAutoModelSelected?: (modelId: string) => void;
}

export interface UnifiedStreamResult {
  text: string;
  modelUsed: string;
  metrics: AiTokenMetrics;
  webSearchResults?: WebSearchResult[];
}

const MODELS_CACHE_KEY = 'master_ai_unified_models_cache_v2';
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

class UnifiedModelEngine {
  private cachedModels: UnifiedChatModel[] = [];
  private lastFetchTime = 0;

  /**
   * Dynamically discovers and caches all eligible free chat models from Groq, xKiro, and Pollinations.
   * Strips all provider branding, ensuring clean presentation.
   */
  public async discoverModels(forceRefresh = false): Promise<UnifiedChatModel[]> {
    const now = Date.now();
    if (!forceRefresh && this.cachedModels.length > 0 && now - this.lastFetchTime < CACHE_TTL_MS) {
      return this.cachedModels;
    }

    try {
      const endpoint = forceRefresh ? '/api/ai/models?refresh=true' : '/api/ai/models';
      const res = await fetch(endpoint, {
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.models) && data.models.length > 0) {
          const enriched = data.models.map((m: any) => ({
            ...m,
            family: resolveModelFamily(m.id),
            capabilities: ModelCapabilityService.getModelCapabilities(m.id, m.category),
          }));
          this.cachedModels = enriched;
          this.lastFetchTime = now;
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(MODELS_CACHE_KEY, JSON.stringify(enriched));
            } catch {}
          }
          return this.cachedModels;
        }
      }
    } catch (e) {
      console.warn('[UnifiedModelEngine] Discovery failed, attempting local cache fallback:', e);
    }

    // Attempt localStorage restore
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(MODELS_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cachedModels = parsed;
            return this.cachedModels;
          }
        }
      } catch {}
    }

    // Built-in default verified chat models
    this.cachedModels = [
      {
        id: 'openai/gpt-oss-120b',
        name: 'GPT-OSS 120B High-Velocity',
        description: 'Flagship reasoning and synthesis model with sub-second response times',
        category: 'reasoning',
        contextLength: 131072,
        contextBadge: '131k context',
        provider: 'groq',
        isDefault: true,
      },
      {
        id: 'mistralai/mistral-large-2512',
        name: 'Mistral Large 2512',
        description: 'Advanced multilingual comprehension, mathematics, and systems programming',
        category: 'general',
        contextLength: 128000,
        contextBadge: '128k context',
        provider: 'xkiro',
        isDefault: false,
      },
      {
        id: 'openai/gpt-5.4-nano',
        name: 'GPT-5.4 Nano',
        description: 'Ultra-fast daily conversational assistance and document analysis',
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
      },
      {
        id: 'mistralai/codestral-2508',
        name: 'Codestral 2508',
        description: 'Specialized deep code generation, unit testing, and architectural refactoring',
        category: 'coding',
        contextLength: 256000,
        contextBadge: '256k context',
        provider: 'xkiro',
        isDefault: false,
      },
      {
        id: 'sensenova/sensenova-6.8-flash-lite',
        name: 'SenseNova 6.8 Flash',
        description: 'High-context reasoning and structured data extraction',
        category: 'reasoning',
        contextLength: 262144,
        contextBadge: '262k context',
        provider: 'xkiro',
        isDefault: false,
      },
      {
        id: 'cohere/command-r-plus-08-2024',
        name: 'Command R+ 2024',
        description: 'High-precision research analysis, search synthesis, and citation grounding',
        category: 'general',
        contextLength: 128000,
        contextBadge: '128k context',
        provider: 'xkiro',
        isDefault: false,
      },
    ];

    return this.cachedModels;
  }

  /**
   * Performs real-time web search to augment conversation context.
   */
  public async searchWeb(query: string): Promise<WebSearchResult[]> {
    try {
      const res = await fetch(`/api/ai/search?q=${encodeURIComponent(query.trim())}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data?.results) ? data.results : [];
      }
    } catch {}
    return [];
  }

  /**
   * Unified streaming chat pipeline with SSE parser and live tok/s telemetry.
   */
  public async streamChat(options: UnifiedStreamOptions): Promise<UnifiedStreamResult> {
    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    let accumulated = '';
    let estimatedTokens = 0;
    let webSources: WebSearchResult[] = [];

    // Optional Web Search Grounding
    if (options.webSearch) {
      const lastUserMsg = [...options.messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        const queryText =
          typeof lastUserMsg.content === 'string'
            ? lastUserMsg.content
            : Array.isArray(lastUserMsg.content)
            ? lastUserMsg.content.find((p: any) => p.type === 'text')?.text || ''
            : '';

        if (queryText) {
          webSources = await this.searchWeb(queryText);
          if (webSources.length > 0) {
            options.onWebSources?.(webSources);
            const searchContext = webSources
              .map((s, idx) => `[Source ${idx + 1}]: ${s.title}\n${s.snippet}`)
              .join('\n\n');

            options.messages.push({
              role: 'system',
              content: `Real-time web search intelligence context:\n${searchContext}\n\nUse these fresh findings when responding.`,
            });
          }
        }
      }
    }

    // Calculate prompt tokens & safe max_tokens ceiling before dispatch
    const promptTokens = ContextManager.estimateMessagesTokens(options.messages);
    const safeMaxTokens = ContextManager.getSafeOutputTokens(options.model, promptTokens);
    const targetModel = this.cachedModels.find((m) => m.id === options.model);
    const targetProvider = targetModel?.provider;

    let res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: options.signal,
      body: JSON.stringify({
        model: options.model,
        provider: targetProvider,
        messages: options.messages,
        max_tokens: options.generationParameters?.maxTokens || safeMaxTokens,
        temperature: options.generationParameters?.temperature,
        top_p: options.generationParameters?.topP,
        frequency_penalty: options.generationParameters?.frequencyPenalty,
        presence_penalty: options.generationParameters?.presencePenalty,
        seed: options.generationParameters?.seed,
        stop: options.generationParameters?.stopSequences,
        stream: options.generationParameters?.stream !== false,
        failover: Boolean(options.failover),
        autoModel: options.model === 'auto',
      }),
    });

    const fallbackModel = res.headers.get('X-Master-Fallback-Model');
    const fallbackProvider = res.headers.get('X-Master-Fallback-Provider');
    if (fallbackModel) {
      options.onFailoverNotification?.(fallbackModel, fallbackProvider || '');
    }
    const autoChosen = res.headers.get('X-Master-Auto-Selected-Model');
    if (autoChosen) {
      options.onAutoModelSelected?.(autoChosen);
    }

    // 429 Rate Limit Intercept with Exponential Backoff Retry (Never silently switch models)
    if (res.status === 429) {
      const errPayload = await res.json().catch(() => ({}));
      const errMsg = errPayload?.error?.message || '';

      // Parse retry-after from message or headers
      const waitMatch = errMsg.match(/try again in ([0-9.]+)s/i);
      const waitSec = waitMatch ? parseFloat(waitMatch[1]) : 2.5;
      const waitMs = Math.min(8000, Math.max(1500, Math.ceil(waitSec * 1000) + 500));

      // Wait for token bucket replenishment
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      if (options.signal?.aborted) throw new Error('Request aborted');

      // Re-compress context to essential system instruction and only latest user turn
      const compressedMessages = [
        options.messages.find((m) => m.role === 'system') || {
          role: 'system' as const,
          content: 'You are Master AI. Provide direct, concise, high-value assistance.',
        },
        ...options.messages.filter((m) => m.role === 'user').slice(-1),
      ];

      const retryPromptTokens = ContextManager.estimateMessagesTokens(compressedMessages);
      const retrySafeMaxTokens = ContextManager.getSafeOutputTokens(options.model, retryPromptTokens);

      res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: options.signal,
        body: JSON.stringify({
          model: options.model,
          provider: targetProvider,
          messages: compressedMessages,
          max_tokens: Math.max(1024, retrySafeMaxTokens),
          stream: true,
        }),
      });

      if (!res.ok) {
        const retryErr = await res.json().catch(() => ({}));
        throw new Error(
          retryErr?.error?.message ||
            errMsg ||
            'Rate limit reached on free tier (8,000 TPM limit). We automatically compressed the context. Please wait a few seconds and click Retry Request, or shorten your prompt.'
        );
      }
    } else if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Inference request failed (HTTP ${res.status})`);
    }

    if (!res.body) {
      throw new Error('Response body stream is empty');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

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
          // Ignore partial SSE JSON
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
      modelUsed: options.model,
      metrics: finalMetrics,
      webSearchResults: webSources.length > 0 ? webSources : undefined,
    };
  }

  /**
   * Image generation is disabled. Prompts route directly to conversational / multimodal chat.
   */
  public detectImageIntent(text: string): { isImage: boolean; prompt: string } {
    return { isImage: false, prompt: text.trim() };
  }
}

export const unifiedModelEngine = new UnifiedModelEngine();
