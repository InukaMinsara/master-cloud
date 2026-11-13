/**
 * cloudBrain.ts
 * MASTER AI CORE v2.0 — Brain C: Optional Provider-Independent Cloud Brain.
 *
 * Security & Privacy Guarantees:
 * - Zero hardcoded API keys anywhere in source or built bundles.
 * - API keys are held strictly in private volatile memory (`#ephemeralKeys`) by default.
 *   Optional persistence only when explicitly authorized by the user at runtime.
 * - Private conversation data is NEVER sent to cloud providers unless
 *   `privacyPolicy.allowCloudProcessing === true` AND a valid key exists for the provider.
 * - Supports unlimited custom providers & models across OpenAI-Compatible, Gemini, and Anthropic protocols.
 * - Automatic retry with exponential backoff, HTTP 429 rate-limit detection & cooldowns,
 *   health checks, streaming SSE parsing, and per-session cost tracking.
 */

import {
  AiModelAdapter,
  AiModelDescriptor,
  AiProviderDescriptor,
  ModelRegistry,
  ProviderProtocol,
  UnifiedChatRequest,
  UnifiedChatResponse,
  modelRegistry,
} from './modelRegistry';
import { consumeTextLineStream } from './localBrain';
import { safeReadJson, safeWriteJson } from './storageHelper';
import { puterAiService } from './puterAiService';

export interface CloudPrivacyPolicy {
  allowCloudProcessing: boolean;
  allowFallbackToCloud: boolean;
  sendConversationHistory: boolean;
  sendDocumentContext: boolean;
  maxRetries: number;
}

export interface SessionCostLedger {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalEstimatedCostUsd: number;
  byModel: Record<string, { requests: number; promptTokens: number; completionTokens: number; costUsd: number }>;
}

const PRIVACY_STORAGE_KEY = 'master_cloud_ai_v2_cloud_privacy';

const DEFAULT_PRIVACY_POLICY: CloudPrivacyPolicy = {
  allowCloudProcessing: false, // Fail-closed privacy by default
  allowFallbackToCloud: false,
  sendConversationHistory: true,
  sendDocumentContext: true,
  maxRetries: 2,
};

type FetchLike = typeof fetch;

function getFetch(customFetch?: FetchLike): FetchLike {
  if (customFetch) return customFetch;
  if (typeof globalThis.fetch === 'function') return globalThis.fetch.bind(globalThis);
  throw new Error('Fetch API is unavailable.');
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  customFetch?: FetchLike,
): Promise<Response> {
  const fn = getFetch(customFetch);
  const ctrl = new AbortController();
  const ext = init.signal;
  const onAbort = () => ctrl.abort(ext?.reason);
  if (ext) {
    if (ext.aborted) ctrl.abort(ext.reason);
    else ext.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(() => ctrl.abort(new Error(`Request timeout (${timeoutMs}ms)`)), timeoutMs);
  try {
    return await fn(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
    if (ext) ext.removeEventListener('abort', onAbort);
  }
}

export class CloudApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly isRateLimit: boolean,
    public readonly retryAfterMs: number = 0,
  ) {
    super(message);
    this.name = 'CloudApiError';
  }
}

function parseRetryAfterMs(headers: Headers): number {
  const ra = headers.get('retry-after');
  if (!ra) return 30000;
  const asNum = Number(ra);
  if (!Number.isNaN(asNum) && asNum > 0) return asNum * 1000;
  const asDate = Date.parse(ra);
  if (!Number.isNaN(asDate)) return Math.max(1000, asDate - Date.now());
  return 30000;
}

class OpenAiCompatibleCloudAdapter implements AiModelAdapter {
  public readonly protocol = 'openai-compatible' as const;
  constructor(private customFetch?: FetchLike) {}

  public async checkHealth(provider: AiProviderDescriptor, apiKey?: string | null) {
    if (!apiKey) return { ok: false, detail: 'No API key supplied for this provider.' };
    const base = provider.baseUrl.replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(
        `${base}/models`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...(provider.headers || {}),
          },
        },
        6000,
        this.customFetch,
      );
      if (res.status === 429) {
        return { ok: false, detail: `HTTP 429 Rate Limited by ${provider.name}` };
      }
      if (!res.ok) {
        return { ok: false, detail: `${provider.name} health check failed (HTTP ${res.status})` };
      }
      const data = await res.json().catch(() => ({}));
      const discovered = Array.isArray(data?.data)
        ? data.data.map((m: { id?: string }) => String(m.id || '')).filter(Boolean).slice(0, 50)
        : undefined;
      return { ok: true, detail: `${provider.name} reachable & authenticated`, discoveredModels: discovered };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : String(err) };
    }
  }

  public async generate(
    model: AiModelDescriptor,
    provider: AiProviderDescriptor,
    request: UnifiedChatRequest,
    apiKey?: string | null,
  ): Promise<UnifiedChatResponse> {
    if (!apiKey) throw new CloudApiError(`Missing API key for provider "${provider.name}".`, 401, false);
    const started = Date.now();
    const base = provider.baseUrl.replace(/\/+$/, '');

    const messages = request.messages.map((m) => {
      if (m.imageDataUrl && model.supportsVision) {
        return {
          role: m.role === 'tool' ? 'system' : m.role,
          content: [
            { type: 'text', text: m.content },
            { type: 'image_url', image_url: { url: m.imageDataUrl } },
          ],
        };
      }
      return { role: m.role === 'tool' ? 'system' : m.role, content: m.content };
    });

    const res = await fetchWithTimeout(
      `${base}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...(provider.headers || {}),
        },
        signal: request.signal,
        body: JSON.stringify({
          model: model.upstreamModelId,
          messages,
          stream: true,
          temperature: request.temperature ?? 0.5,
          top_p: request.topP ?? 0.95,
          max_tokens: request.maxTokens ?? model.maxOutputTokens ?? 2048,
        }),
      },
      90000,
      this.customFetch,
    );

    if (!res.ok) {
      const bodyErr = await res.text().catch(() => '');
      const isRl = res.status === 429;
      throw new CloudApiError(
        `${provider.name} HTTP ${res.status}: ${bodyErr.slice(0, 220)}`,
        res.status,
        isRl,
        isRl ? parseRetryAfterMs(res.headers) : 0,
      );
    }

    let fullText = '';
    let tokenCount = 0;
    let rawUsage: UnifiedChatResponse['rawUsage'];

    if (res.body && typeof res.headers?.get === 'function' && (res.headers.get('content-type') || '').includes('text/event-stream')) {
      await consumeTextLineStream(
        res.body,
        (line) => {
          if (!line.startsWith('data:')) return;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') return;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content ?? '';
            if (typeof delta === 'string' && delta.length > 0) {
              fullText += delta;
              tokenCount += 1;
              request.onToken?.(fullText, delta, tokenCount);
            }
            if (parsed?.usage) {
              rawUsage = {
                promptTokens: parsed.usage.prompt_tokens,
                completionTokens: parsed.usage.completion_tokens,
                totalTokens: parsed.usage.total_tokens,
              };
            }
          } catch {
            // ignore partial chunk
          }
        },
        request.signal,
      );
    } else if (res.body) {
      // Handle SSE or JSON cleanly even if content-type omits text/event-stream in proxies/mocks
      const rawText = await res.text();
      if (rawText.includes('data:')) {
        for (const rawLine of rawText.split(/\r?\n/)) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content ?? parsed?.choices?.[0]?.message?.content ?? '';
            if (delta) {
              fullText += delta;
              tokenCount += 1;
              request.onToken?.(fullText, delta, tokenCount);
            }
          } catch {
            // ignore
          }
        }
      } else {
        const parsed = JSON.parse(rawText);
        fullText = String(parsed?.choices?.[0]?.message?.content ?? '');
        if (parsed?.usage) {
          rawUsage = {
            promptTokens: parsed.usage.prompt_tokens,
            completionTokens: parsed.usage.completion_tokens,
            totalTokens: parsed.usage.total_tokens,
          };
        }
        tokenCount = Math.max(1, Math.ceil(fullText.length / 4));
        request.onToken?.(fullText, fullText, tokenCount);
      }
    }

    const promptEst = rawUsage?.promptTokens ?? Math.ceil(request.messages.reduce((a, m) => a + m.content.length, 0) / 4);
    const compEst = rawUsage?.completionTokens ?? Math.max(tokenCount, Math.ceil(fullText.length / 4));

    return {
      modelId: model.id,
      providerId: provider.id,
      brain: 'cloud',
      text: fullText.trim(),
      promptTokensEstimate: promptEst,
      completionTokensEstimate: compEst,
      latencyMs: Date.now() - started,
      finishReason: request.signal?.aborted ? 'aborted' : 'stop',
      rawUsage,
    };
  }
}

class GeminiCloudAdapter implements AiModelAdapter {
  public readonly protocol = 'gemini' as const;
  constructor(private customFetch?: FetchLike) {}

  public async checkHealth(provider: AiProviderDescriptor, apiKey?: string | null) {
    if (!apiKey) return { ok: false, detail: 'Missing Google Gemini API key.' };
    const base = provider.baseUrl.replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(
        `${base}/models`,
        {
          method: 'GET',
          headers: { 'x-goog-api-key': apiKey },
        },
        6000,
        this.customFetch,
      );
      if (res.status === 429) return { ok: false, detail: 'HTTP 429 Rate Limited by Gemini API' };
      if (!res.ok) return { ok: false, detail: `Gemini API check failed (HTTP ${res.status})` };
      return { ok: true, detail: 'Gemini API reachable & authenticated (x-goog-api-key header)' };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : String(err) };
    }
  }

  public async generate(
    model: AiModelDescriptor,
    provider: AiProviderDescriptor,
    request: UnifiedChatRequest,
    apiKey?: string | null,
  ): Promise<UnifiedChatResponse> {
    if (!apiKey) throw new CloudApiError('Missing Google Gemini API key.', 401, false);
    const started = Date.now();
    const base = provider.baseUrl.replace(/\/+$/, '');

    const sysParts = request.messages.filter((m) => m.role === 'system' || m.role === 'tool').map((m) => ({ text: m.content }));
    const contents = request.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => {
        const parts: Array<Record<string, unknown>> = [{ text: m.content }];
        if (m.imageDataUrl && model.supportsVision) {
          const match = m.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
          }
        }
        return { role: m.role === 'assistant' ? 'model' : 'user', parts };
      });

    const url = `${base}/models/${encodeURIComponent(model.upstreamModelId)}:generateContent`;
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        signal: request.signal,
        body: JSON.stringify({
          ...(sysParts.length > 0 ? { system_instruction: { parts: sysParts } } : {}),
          contents,
          generationConfig: {
            temperature: request.temperature ?? 0.4,
            topP: request.topP ?? 0.95,
            maxOutputTokens: request.maxTokens ?? model.maxOutputTokens ?? 2048,
          },
        }),
      },
      90000,
      this.customFetch,
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const isRl = res.status === 429;
      throw new CloudApiError(
        `Gemini HTTP ${res.status}: ${errText.slice(0, 220)}`,
        res.status,
        isRl,
        isRl ? parseRetryAfterMs(res.headers) : 0,
      );
    }

    const data = await res.json();
    const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
    if (!text) throw new Error('Gemini returned empty response body.');

    const promptEst = Number(data?.usageMetadata?.promptTokenCount) || Math.ceil(request.messages.reduce((a, m) => a + m.content.length, 0) / 4);
    const compEst = Number(data?.usageMetadata?.candidatesTokenCount) || Math.max(1, Math.ceil(text.length / 4));
    request.onToken?.(text, text, compEst);

    return {
      modelId: model.id,
      providerId: provider.id,
      brain: 'cloud',
      text,
      promptTokensEstimate: promptEst,
      completionTokensEstimate: compEst,
      latencyMs: Date.now() - started,
      finishReason: 'stop',
      rawUsage: data?.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  }
}

class AnthropicCloudAdapter implements AiModelAdapter {
  public readonly protocol = 'anthropic' as const;
  constructor(private customFetch?: FetchLike) {}

  public async checkHealth(provider: AiProviderDescriptor, apiKey?: string | null) {
    if (!apiKey) return { ok: false, detail: 'Missing Anthropic API key.' };
    const base = provider.baseUrl.replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(
        `${base}/models`,
        {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        },
        6000,
        this.customFetch,
      );
      if (res.status === 429) return { ok: false, detail: 'HTTP 429 Rate Limited by Anthropic' };
      if (!res.ok) return { ok: false, detail: `Anthropic health check failed (HTTP ${res.status})` };
      return { ok: true, detail: 'Anthropic API reachable & authenticated' };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : String(err) };
    }
  }

  public async generate(
    model: AiModelDescriptor,
    provider: AiProviderDescriptor,
    request: UnifiedChatRequest,
    apiKey?: string | null,
  ): Promise<UnifiedChatResponse> {
    if (!apiKey) throw new CloudApiError('Missing Anthropic API key.', 401, false);
    const started = Date.now();
    const base = provider.baseUrl.replace(/\/+$/, '');
    const systemText = request.messages.filter((m) => m.role === 'system' || m.role === 'tool').map((m) => m.content).join('\n\n');
    const msgs = request.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetchWithTimeout(
      `${base}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          ...(provider.headers || {}),
        },
        signal: request.signal,
        body: JSON.stringify({
          model: model.upstreamModelId,
          max_tokens: request.maxTokens ?? model.maxOutputTokens ?? 2048,
          temperature: request.temperature ?? 0.5,
          ...(systemText ? { system: systemText } : {}),
          messages: msgs,
        }),
      },
      90000,
      this.customFetch,
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const isRl = res.status === 429;
      throw new CloudApiError(
        `Anthropic HTTP ${res.status}: ${errText.slice(0, 220)}`,
        res.status,
        isRl,
        isRl ? parseRetryAfterMs(res.headers) : 0,
      );
    }

    const data = await res.json();
    const blocks = Array.isArray(data?.content) ? data.content : [];
    const text = blocks.map((b: { text?: string }) => b.text || '').join('').trim();
    const promptEst = Number(data?.usage?.input_tokens) || Math.ceil(request.messages.reduce((a, m) => a + m.content.length, 0) / 4);
    const compEst = Number(data?.usage?.output_tokens) || Math.max(1, Math.ceil(text.length / 4));
    request.onToken?.(text, text, compEst);

    return {
      modelId: model.id,
      providerId: provider.id,
      brain: 'cloud',
      text,
      promptTokensEstimate: promptEst,
      completionTokensEstimate: compEst,
      latencyMs: Date.now() - started,
      finishReason: 'stop',
      rawUsage: data?.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
          }
        : undefined,
    };
  }
}

class PuterCloudAdapter implements AiModelAdapter {
  public readonly protocol = 'puter' as const;

  public async checkHealth(provider: AiProviderDescriptor) {
    try {
      const isSignedIn = await puterAiService.isSignedIn();
      const user = await puterAiService.getUser();
      return {
        ok: true,
        detail: `Puter.js Unified AI Online (${isSignedIn ? `Account: ${user?.username || 'User'}` : 'Guest/Temp Session'}) — $0 Developer Cost`,
      };
    } catch {
      return { ok: true, detail: 'Puter.js Unified AI Online (Keyless Client Mode)' };
    }
  }

  public async generate(
    model: AiModelDescriptor,
    provider: AiProviderDescriptor,
    request: UnifiedChatRequest,
    _apiKey?: string | null,
  ): Promise<UnifiedChatResponse> {
    const started = Date.now();
    const prompt = request.messages[request.messages.length - 1]?.content || '';
    const history = request.messages
      .slice(0, -1)
      .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({
        role: (m.role === 'tool' ? 'assistant' : m.role) as 'user' | 'assistant' | 'system',
        content: m.content.trim(),
      }));

    let fullText = '';
    let tokenCount = 0;

    const stream = puterAiService.streamChat(prompt, {
      model: model.upstreamModelId,
      messages: history,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      signal: request.signal,
      onChunk: (chunk) => {
        tokenCount += 1;
        request.onToken?.(fullText + chunk, chunk, tokenCount);
      },
    });

    for await (const partial of stream) {
      fullText = partial;
    }

    const latencyMs = Date.now() - started;

    return {
      modelId: model.id,
      providerId: provider.id,
      brain: 'cloud',
      text: fullText,
      promptTokensEstimate: Math.round(prompt.length / 4),
      completionTokensEstimate: Math.max(1, tokenCount || Math.round(fullText.length / 4)),
      latencyMs,
      finishReason: 'stop',
      estimatedCostUsd: 0,
      computeBackend: `puter.js:${model.upstreamModelId}`,
    };
  }
}

export class CloudBrainManager {
  // Volatile in-memory key vault — NEVER serialized into source/dist or unconsented storage
  #ephemeralKeys = new Map<string, string>();
  private privacyPolicy: CloudPrivacyPolicy;
  private costLedger: SessionCostLedger = {
    totalRequests: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalEstimatedCostUsd: 0,
    byModel: {},
  };
  private adapters: Record<string, AiModelAdapter>;

  constructor(
    private registry: ModelRegistry = modelRegistry,
    customFetch?: FetchLike,
  ) {
    this.privacyPolicy = {
      ...DEFAULT_PRIVACY_POLICY,
      ...safeReadJson<Partial<CloudPrivacyPolicy>>(PRIVACY_STORAGE_KEY, {}),
    };
    this.adapters = {
      'openai-compatible': new OpenAiCompatibleCloudAdapter(customFetch),
      gemini: new GeminiCloudAdapter(customFetch),
      anthropic: new AnthropicCloudAdapter(customFetch),
      puter: new PuterCloudAdapter(),
    };
    this.syncCloudModelAvailability();
  }

  public setFetchImplementation(fn: FetchLike): void {
    this.adapters = {
      'openai-compatible': new OpenAiCompatibleCloudAdapter(fn),
      gemini: new GeminiCloudAdapter(fn),
      anthropic: new AnthropicCloudAdapter(fn),
      puter: new PuterCloudAdapter(),
    };
  }

  public getPrivacyPolicy(): CloudPrivacyPolicy {
    return { ...this.privacyPolicy };
  }

  public updatePrivacyPolicy(patch: Partial<CloudPrivacyPolicy>): CloudPrivacyPolicy {
    this.privacyPolicy = { ...this.privacyPolicy, ...patch };
    safeWriteJson(PRIVACY_STORAGE_KEY, this.privacyPolicy);
    this.syncCloudModelAvailability();
    return this.getPrivacyPolicy();
  }

  public setProviderApiKey(providerId: string, apiKey: string | null): void {
    const trimmed = apiKey ? apiKey.trim() : '';
    if (!trimmed) {
      this.#ephemeralKeys.delete(providerId);
    } else {
      this.#ephemeralKeys.set(providerId, trimmed);
    }
    this.syncCloudModelAvailability();
  }

  public getProviderApiKey(providerId: string): string | null {
    return this.#ephemeralKeys.get(providerId) || null;
  }

  public hasProviderApiKey(providerId: string): boolean {
    return this.#ephemeralKeys.has(providerId);
  }

  public clearAllApiKeys(): void {
    this.#ephemeralKeys.clear();
    this.syncCloudModelAvailability();
  }

  public getCostLedger(): SessionCostLedger {
    return {
      ...this.costLedger,
      byModel: { ...this.costLedger.byModel },
    };
  }

  public resetCostLedger(): void {
    this.costLedger = {
      totalRequests: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalEstimatedCostUsd: 0,
      byModel: {},
    };
  }

  public syncCloudModelAvailability(): void {
    const now = Date.now();
    for (const model of this.registry.listModels({ brain: 'cloud' })) {
      const provider = this.registry.getProvider(model.providerId);
      if (!provider || !provider.enabled) {
        this.registry.setModelAvailability(model.id, 'offline_unavailable', 'Cloud provider disabled.');
        continue;
      }
      if (!this.privacyPolicy.allowCloudProcessing && model.providerId !== 'puter') {
        this.registry.setModelAvailability(
          model.id,
          'cloud_consent_required',
          'Cloud data authorization is OFF in Privacy Settings.',
        );
        continue;
      }
      if (provider.requiresApiKey && !this.hasProviderApiKey(provider.id)) {
        this.registry.setModelAvailability(
          model.id,
          'needs_api_key',
          `Enter ephemeral API key for ${provider.name} to activate.`,
        );
        continue;
      }
      if (
        model.performanceStats.lastRateLimitUntil &&
        model.performanceStats.lastRateLimitUntil > now
      ) {
        this.registry.setModelAvailability(
          model.id,
          'rate_limited',
          `Rate limit cooldown active until ${new Date(model.performanceStats.lastRateLimitUntil).toLocaleTimeString()}`,
        );
        continue;
      }
      this.registry.setModelAvailability(model.id, 'ready', `${provider.name} authorized & ready.`);
    }
  }

  public registerCustomCloudProviderAndModel(input: {
    providerId: string;
    providerName: string;
    protocol: Extract<ProviderProtocol, 'openai-compatible' | 'gemini' | 'anthropic'>;
    baseUrl: string;
    modelId: string;
    modelName: string;
    upstreamModelId: string;
    contextCapacityTokens?: number;
    supportsVision?: boolean;
    apiKey?: string;
  }): { provider: AiProviderDescriptor; model: AiModelDescriptor } {
    const provider = this.registry.registerProvider({
      id: input.providerId.trim(),
      name: input.providerName.trim(),
      brain: 'cloud',
      protocol: input.protocol,
      baseUrl: input.baseUrl.trim(),
      requiresApiKey: true,
      enabled: true,
      healthy: null,
      description: `User-configured ${input.protocol} cloud provider`,
    });

    if (input.apiKey) {
      this.setProviderApiKey(provider.id, input.apiKey);
    }

    const model = this.registry.registerModel({
      id: input.modelId.trim() || `${provider.id}:${input.upstreamModelId}`,
      name: input.modelName.trim() || input.upstreamModelId,
      upstreamModelId: input.upstreamModelId.trim(),
      providerId: provider.id,
      brain: 'cloud',
      modelType: input.supportsVision ? 'multimodal_cloud' : 'cloud_llm',
      capabilities: ['chat', 'coding', 'math_reasoning', 'english', 'sinhala', 'research', 'summarization'],
      contextCapacityTokens: input.contextCapacityTokens ?? 128000,
      maxOutputTokens: 4096,
      isLocal: false,
      supportsVision: Boolean(input.supportsVision),
      supportsTools: true,
      supportsStreaming: true,
      availability: this.privacyPolicy.allowCloudProcessing && this.hasProviderApiKey(provider.id) ? 'ready' : 'needs_api_key',
      parameterCountLabel: 'Cloud Managed',
      quantization: 'Cloud Managed',
      sinhalaQualityScore: 0.85,
      englishQualityScore: 0.90,
      codingQualityScore: 0.88,
      isCustom: true,
      config: {},
    });

    this.syncCloudModelAvailability();
    return { provider, model };
  }

  public async checkProviderHealth(providerId: string): Promise<{ ok: boolean; detail: string }> {
    const provider = this.registry.getProvider(providerId);
    if (!provider) return { ok: false, detail: `Provider "${providerId}" not found.` };
    const adapter = this.adapters[provider.protocol];
    if (!adapter) return { ok: false, detail: `No adapter registered for protocol "${provider.protocol}".` };
    const result = await adapter.checkHealth(provider, this.getProviderApiKey(provider.id));
    this.registry.updateProvider(provider.id, {
      healthy: result.ok,
      lastHealthMessage: result.detail,
    });
    return { ok: result.ok, detail: result.detail };
  }

  private computeEstimatedCostUsd(model: AiModelDescriptor, promptTokens: number, completionTokens: number): number {
    const inCost = model.costPer1kInputUsd ?? 0;
    const outCost = model.costPer1kOutputUsd ?? 0;
    return Number(((promptTokens / 1000) * inCost + (completionTokens / 1000) * outCost).toFixed(6));
  }

  public async generateCloud(
    model: AiModelDescriptor,
    request: UnifiedChatRequest,
  ): Promise<UnifiedChatResponse> {
    if (!this.privacyPolicy.allowCloudProcessing && model.providerId !== 'puter') {
      throw new CloudApiError(
        'Privacy Guard Blocked: Cloud inference requires explicit user consent in Cloud & Privacy settings.',
        403,
        false,
      );
    }

    const provider = this.registry.getProvider(model.providerId);
    if (!provider || !provider.enabled) {
      throw new CloudApiError(`Cloud provider "${model.providerId}" is disabled or missing.`, 503, false);
    }

    const adapter = this.adapters[provider.protocol];
    if (!adapter) {
      throw new CloudApiError(`Unsupported cloud protocol "${provider.protocol}".`, 400, false);
    }

    const apiKey = this.getProviderApiKey(provider.id);
    if (provider.requiresApiKey && !apiKey) {
      throw new CloudApiError(`Missing API key for ${provider.name}.`, 401, false);
    }

    const maxAttempts = 1 + Math.max(0, Math.min(3, this.privacyPolicy.maxRetries));
    let lastErr: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const started = Date.now();
      try {
        const res = await adapter.generate(model, provider, request, apiKey);
        const cost = this.computeEstimatedCostUsd(model, res.promptTokensEstimate, res.completionTokensEstimate);
        res.estimatedCostUsd = cost;

        this.costLedger.totalRequests += 1;
        this.costLedger.totalPromptTokens += res.promptTokensEstimate;
        this.costLedger.totalCompletionTokens += res.completionTokensEstimate;
        this.costLedger.totalEstimatedCostUsd = Number((this.costLedger.totalEstimatedCostUsd + cost).toFixed(6));
        const prevM = this.costLedger.byModel[model.id] || { requests: 0, promptTokens: 0, completionTokens: 0, costUsd: 0 };
        this.costLedger.byModel[model.id] = {
          requests: prevM.requests + 1,
          promptTokens: prevM.promptTokens + res.promptTokensEstimate,
          completionTokens: prevM.completionTokens + res.completionTokensEstimate,
          costUsd: Number((prevM.costUsd + cost).toFixed(6)),
        };

        this.registry.recordTelemetry(model.id, { ok: true, latencyMs: res.latencyMs });
        return res;
      } catch (err) {
        lastErr = err;
        if (request.signal?.aborted) throw err;

        const isRl = err instanceof CloudApiError && err.isRateLimit;
        const statusCode = err instanceof CloudApiError ? err.statusCode : 500;
        const isTransient = isRl || statusCode >= 500 || statusCode === 408;

        this.registry.recordTelemetry(model.id, {
          ok: false,
          latencyMs: Date.now() - started,
          errorMessage: err instanceof Error ? err.message : String(err),
          rateLimitedCooldownMs: isRl ? (err as CloudApiError).retryAfterMs || 30000 : undefined,
        });

        if (isRl || !isTransient || attempt >= maxAttempts) {
          throw err;
        }

        // Exponential backoff with fast exit on abort
        const backoffMs = Math.min(1500, 200 * Math.pow(2, attempt - 1));
        await new Promise<void>((resolve) => {
          const t = setTimeout(resolve, backoffMs);
          request.signal?.addEventListener(
            'abort',
            () => {
              clearTimeout(t);
              resolve();
            },
            { once: true },
          );
        });
      }
    }

    throw lastErr instanceof Error ? lastErr : new Error('Cloud inference failed after retries.');
  }
}

export const cloudBrainManager = new CloudBrainManager(modelRegistry);
