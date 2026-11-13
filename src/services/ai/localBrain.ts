/**
 * localBrain.ts
 * MASTER AI CORE v2.1 — Brain B: Hardware-Aware Local Open-Weight Engine.
 *
 * Capabilities:
 * - Real Ollama HTTP API integration (/api/tags, /api/ps, /api/show, /api/chat, /api/pull, /api/delete)
 *   plus OpenAI-compatible local servers (llama.cpp server, LM Studio, vLLM) and preserved v1.0 ONNX.
 * - Verified hardware telemetry via Electron desktop IPC (OS CPU/RAM + nvidia-smi + CUDA toolkit verification)
 *   and browser WebGPU / WASM probes. Never assumes or fakes CUDA availability.
 * - Pre-flight memory resource guard to unload conflicting heavy models before loading another when VRAM/RAM is bounded.
 * - Configurable GPU/CPU compute mode (`num_gpu`, `num_thread`, `num_ctx`, `keep_alive`).
 * - Structured error taxonomy (`LocalInferenceError`) for unreachable servers, OOM, timeouts, and missing models.
 */

import {
  AiModelAdapter,
  AiModelDescriptor,
  AiProviderDescriptor,
  ModelCapability,
  ModelRegistry,
  UnifiedChatRequest,
  UnifiedChatResponse,
  modelRegistry,
} from './modelRegistry';
import { neuralRuntime } from './neuralRuntime';
import { sharedTokenizerV1 } from './tokenizerV1';
import { safeReadJson, safeWriteJson } from './storageHelper';

export type LocalInferenceErrorCode =
  | 'SERVER_UNREACHABLE'
  | 'MODEL_NOT_FOUND'
  | 'OUT_OF_MEMORY'
  | 'MODEL_LOAD_FAILED'
  | 'CONTEXT_EXCEEDED'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'RUNTIME_ERROR';

export class LocalInferenceError extends Error {
  constructor(
    public readonly code: LocalInferenceErrorCode,
    message: string,
    public readonly retryable: boolean,
    public readonly suggestedFix?: string,
  ) {
    super(message);
    this.name = 'LocalInferenceError';
  }
}

export interface HostHardwareSnapshot {
  cpuModel: string | null;
  cpuCores: number;
  totalRamGb: number | null;
  freeRamGb: number | null;
  gpuName: string | null;
  gpuVramTotalMb: number | null;
  gpuVramFreeMb: number | null;
  nvidiaDriverVersion: string | null;
  cudaVerified: boolean;
  cudaVerificationDetail: string;
  ollamaCliInstalled?: boolean;
  ollamaCliVersion?: string | null;
}

export interface OllamaLoadedProcess {
  name: string;
  sizeMb: number;
  sizeVramMb: number;
  expiresAt?: string;
}

export interface OllamaModelMetadata {
  name: string;
  sizeMb: number;
  quantization?: string;
  parameterSize?: string;
  family?: string;
  contextLength?: number;
}

export interface LocalHardwareProfile {
  detectedAt: string;
  platform: 'browser' | 'electron' | 'node';
  cpuModel: string | null;
  cpuCores: number;
  totalRamGb: number | null;
  freeRamGb: number | null;
  deviceMemoryGb: number | null;
  gpuName: string | null;
  gpuVramTotalMb: number | null;
  gpuVramFreeMb: number | null;
  nvidiaDriverVersion: string | null;
  cudaVerified: boolean;
  cudaVerificationDetail: string;
  webgpuSupported: boolean;
  webgpuAdapterName: string | null;
  wasmSupported: boolean;
  sharedArrayBufferSupported: boolean;
  executionBackendRecommendation: 'ollama-cuda-or-gpu' | 'ollama-cpu' | 'webgpu-onnx' | 'wasm-simd-cpu';
  loadedModels: OllamaLoadedProcess[];
  runtimes: {
    masterV1Onnx: { status: string; executionProvider: string | null };
    ollama: { online: boolean; endpoint: string; modelCount: number; models?: string[]; error?: string };
    localOpenAi: { online: boolean; endpoint: string; modelCount: number; models?: string[]; error?: string };
  };
  notes: string[];
}

export interface LocalInferenceSettings {
  activeLocalModelId: string | null;
  computeMode: 'auto' | 'gpu' | 'cpu';
  gpuLayers: number; // -1 = auto, 0 = CPU only, >0 = explicit layers
  cpuThreads: number; // 0 = auto
  contextWindowTokens: number;
  keepAlive: '0' | '2m' | '5m' | '15m';
  singleHeavyModelGuard: boolean;
  requestTimeoutMs: number;
}

const LOCAL_SETTINGS_STORAGE_KEY = 'master_cloud_ai_v21_local_settings';

export const DEFAULT_LOCAL_INFERENCE_SETTINGS: LocalInferenceSettings = {
  activeLocalModelId: null,
  computeMode: 'auto',
  gpuLayers: -1,
  cpuThreads: 0,
  contextWindowTokens: 4096,
  keepAlive: '5m',
  singleHeavyModelGuard: true,
  requestTimeoutMs: 120000,
};

export interface PullProgressEvent {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
  percent?: number;
}

type FetchLike = typeof fetch;

function getFetch(customFetch?: FetchLike): FetchLike {
  if (customFetch) return customFetch;
  if (typeof globalThis.fetch === 'function') return globalThis.fetch.bind(globalThis);
  throw new LocalInferenceError('RUNTIME_ERROR', 'Fetch API is unavailable in this runtime.', false);
}

export function classifyLocalError(
  err: unknown,
  httpStatus?: number,
  rawBody = '',
  modelLabel = 'local model',
): LocalInferenceError {
  if (err instanceof LocalInferenceError) return err;
  const rawMsg = err instanceof Error ? err.message : String(err || '');
  const combined = `${rawMsg} ${rawBody}`.toLowerCase();

  if (combined.includes('abort') && !combined.includes('timeout')) {
    return new LocalInferenceError('ABORTED', 'Generation was stopped by user.', false);
  }
  if (combined.includes('timeout') || combined.includes('timed out')) {
    return new LocalInferenceError(
      'TIMEOUT',
      `Local inference timed out waiting for "${modelLabel}". Try a smaller quantized model or reduce context length.`,
      true,
      'Increase timeout in Inference Settings or select a lighter quantization (e.g. Q4_K_M / 1.5B–3B).',
    );
  }
  if (
    combined.includes('out of memory') ||
    combined.includes('requires more system memory') ||
    combined.includes('not enough memory') ||
    combined.includes('cudamalloc') ||
    combined.includes('vram')
  ) {
    return new LocalInferenceError(
      'OUT_OF_MEMORY',
      `Insufficient RAM/VRAM to load "${modelLabel}": ${(rawBody || rawMsg).slice(0, 220)}`,
      true,
      'Unload idle models, switch Compute Mode to CPU or fewer GPU layers, or choose a smaller model.',
    );
  }
  if (httpStatus === 404 || (combined.includes('model') && combined.includes('not found'))) {
    return new LocalInferenceError(
      'MODEL_NOT_FOUND',
      `Model "${modelLabel}" is not installed on the local runtime.`,
      false,
      'Install/pull the model in Local Brain Manager or switch Active Model.',
    );
  }
  if (combined.includes('context length') || combined.includes('too many tokens')) {
    return new LocalInferenceError(
      'CONTEXT_EXCEEDED',
      `Prompt exceeded context capacity for "${modelLabel}".`,
      false,
      'Clear old messages or increase Context Window (num_ctx) in Inference Settings.',
    );
  }
  if (
    combined.includes('econnrefused') ||
    combined.includes('fetch failed') ||
    combined.includes('failed to fetch') ||
    combined.includes('networkerror') ||
    combined.includes('unreachable')
  ) {
    return new LocalInferenceError(
      'SERVER_UNREACHABLE',
      `Local runtime daemon is unreachable (${rawMsg || 'connection refused'}).`,
      true,
      'Ensure Ollama (ollama serve) or Local OpenAI server is running on the configured URL.',
    );
  }
  if (combined.includes('load') && (combined.includes('fail') || combined.includes('error'))) {
    return new LocalInferenceError(
      'MODEL_LOAD_FAILED',
      `Failed to load "${modelLabel}": ${(rawBody || rawMsg).slice(0, 220)}`,
      true,
    );
  }

  return new LocalInferenceError(
    'RUNTIME_ERROR',
    `${httpStatus ? `HTTP ${httpStatus}: ` : ''}${(rawBody || rawMsg || 'Unknown local inference error').slice(0, 240)}`,
    Boolean(httpStatus && httpStatus >= 500),
  );
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  customFetch?: FetchLike,
): Promise<Response> {
  const fn = getFetch(customFetch);
  const ctrl = new AbortController();
  const externalSignal = init.signal;
  const onExternalAbort = () => ctrl.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) ctrl.abort(externalSignal.reason);
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }
  const timer = setTimeout(() => ctrl.abort(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  try {
    return await fn(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  }
}

export function inferQuantizationFromTag(name: string): string {
  const m = name.match(/(q[2-8]_[0km](?:_[sml])?|fp16|fp32|bf16|int4|int8)/i);
  return m ? m[1].toUpperCase() : 'GGUF / Auto';
}

export function estimateRamFromDiskMb(diskMb: number | undefined, tag: string): number {
  if (diskMb && diskMb > 0) return Math.round(diskMb * 1.25 + 350);
  const lower = tag.toLowerCase();
  if (lower.includes('0.5b') || lower.includes('1b')) return 1200;
  if (lower.includes('1.5b') || lower.includes('2b')) return 2200;
  if (lower.includes('3b')) return 3200;
  if (lower.includes('7b') || lower.includes('8b')) return 6200;
  if (lower.includes('14b')) return 11000;
  return 3500;
}

export function inferCapabilitiesFromModelName(name: string): ModelCapability[] {
  const lower = name.toLowerCase();
  const caps = new Set<ModelCapability>(['chat', 'english', 'summarization']);
  if (lower.includes('coder') || lower.includes('code') || lower.includes('starcoder') || lower.includes('deepseek')) {
    caps.add('coding');
  }
  if (lower.includes('r1') || lower.includes('math') || lower.includes('reason') || lower.includes('qwen')) {
    caps.add('math_reasoning');
  }
  if (lower.includes('qwen') || lower.includes('gemma') || lower.includes('aya') || lower.includes('llama')) {
    caps.add('sinhala');
    caps.add('research');
  }
  if (lower.includes('vision') || lower.includes('vl') || lower.includes('llava') || lower.includes('moondream')) {
    caps.add('vision');
  }
  if (lower.includes('qwen2.5') || lower.includes('llama3') || lower.includes('mistral') || lower.includes('gemma3')) {
    caps.add('tool_calling');
  }
  return Array.from(caps);
}

/**
 * Parse SSE or NDJSON streams cleanly and invoke callback per non-empty line.
 */
export async function consumeTextLineStream(
  body: ReadableStream<Uint8Array>,
  onLine: (trimmedLine: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) break;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl = buffer.indexOf('\n');
      while (nl !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (line) onLine(line);
        nl = buffer.indexOf('\n');
      }
    }
    const tail = buffer.trim();
    if (tail && !signal?.aborted) onLine(tail);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}

export class OllamaAdapter implements AiModelAdapter {
  public readonly protocol = 'ollama' as const;
  constructor(private customFetch?: FetchLike) {}

  public async checkHealth(provider: AiProviderDescriptor): Promise<{
    ok: boolean;
    detail: string;
    discoveredModels?: string[];
    discoveredModelDetails?: OllamaModelMetadata[];
    loadedModels?: OllamaLoadedProcess[];
  }> {
    const base = provider.baseUrl.replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(`${base}/api/tags`, { method: 'GET' }, 1800, this.customFetch);
      if (!res.ok) {
        return { ok: false, detail: `Ollama returned HTTP ${res.status}` };
      }
      const data = await res.json();
      const rawModels = Array.isArray(data?.models) ? data.models : [];
      const details: OllamaModelMetadata[] = rawModels
        .map((m: {
          name?: string;
          model?: string;
          size?: number;
          details?: { quantization_level?: string; parameter_size?: string; family?: string };
        }): OllamaModelMetadata | null => {
          const name = String(m.name || m.model || '').trim();
          if (!name) return null;
          return {
            name,
            sizeMb: typeof m.size === 'number' ? Math.round(m.size / (1024 * 1024)) : 0,
            quantization: m.details?.quantization_level,
            parameterSize: m.details?.parameter_size,
            family: m.details?.family,
          };
        })
        .filter((x: OllamaModelMetadata | null): x is OllamaModelMetadata => Boolean(x));

      const models = details.map((d) => d.name);

      // Probe /api/ps for currently loaded resident VRAM/RAM models (non-fatal if older Ollama)
      let loadedModels: OllamaLoadedProcess[] = [];
      try {
        const psRes = await fetchWithTimeout(`${base}/api/ps`, { method: 'GET' }, 1200, this.customFetch);
        if (psRes.ok) {
          const psData = await psRes.json();
          if (Array.isArray(psData?.models)) {
            loadedModels = psData.models.map((p: { name?: string; model?: string; size?: number; size_vram?: number; expires_at?: string }) => ({
              name: String(p.name || p.model || ''),
              sizeMb: typeof p.size === 'number' ? Math.round(p.size / (1024 * 1024)) : 0,
              sizeVramMb: typeof p.size_vram === 'number' ? Math.round(p.size_vram / (1024 * 1024)) : 0,
              expiresAt: p.expires_at,
            }));
          }
        }
      } catch {
        // /api/ps optional
      }

      return {
        ok: true,
        detail: `Ollama online at ${base} (${models.length} installed${loadedModels.length ? `, ${loadedModels.length} loaded in memory` : ''})`,
        discoveredModels: models,
        discoveredModelDetails: details,
        loadedModels,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, detail: `Ollama unreachable at ${base} (${msg})` };
    }
  }

  public async inspectModel(
    provider: AiProviderDescriptor,
    modelTag: string,
  ): Promise<{ quantization?: string; parameterSize?: string; family?: string; contextLength?: number } | null> {
    const base = provider.baseUrl.replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(
        `${base}/api/show`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: modelTag }),
        },
        2000,
        this.customFetch,
      );
      if (!res.ok) return null;
      const data = await res.json();
      let ctxLen: number | undefined;
      if (typeof data?.parameters === 'string') {
        const m = data.parameters.match(/num_ctx\s+(\d+)/i);
        if (m) ctxLen = Number(m[1]);
      }
      if (!ctxLen && data?.model_info && typeof data.model_info === 'object') {
        for (const [k, v] of Object.entries(data.model_info)) {
          if (k.endsWith('.context_length') && typeof v === 'number') {
            ctxLen = v;
            break;
          }
        }
      }
      return {
        quantization: data?.details?.quantization_level,
        parameterSize: data?.details?.parameter_size,
        family: data?.details?.family,
        contextLength: ctxLen,
      };
    } catch {
      return null;
    }
  }

  public async unloadModel(provider: AiProviderDescriptor, modelTag: string): Promise<boolean> {
    const base = provider.baseUrl.replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(
        `${base}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modelTag, messages: [], keep_alive: 0 }),
        },
        5000,
        this.customFetch,
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  public async generate(
    model: AiModelDescriptor,
    provider: AiProviderDescriptor,
    request: UnifiedChatRequest,
  ): Promise<UnifiedChatResponse> {
    const started = Date.now();
    const base = provider.baseUrl.replace(/\/+$/, '');
    const promptApprox = Math.ceil(
      request.messages.reduce((acc, m) => acc + m.content.length, 0) / 4,
    );

    const payloadMessages = request.messages.map((m) => ({
      role: m.role === 'tool' ? 'system' : m.role,
      content: m.content,
      ...(m.imageDataUrl && model.supportsVision
        ? { images: [m.imageDataUrl.replace(/^data:[^;]+;base64,/, '')] }
        : {}),
    }));

    const optionsPayload: Record<string, unknown> = {
      temperature: request.temperature ?? 0.6,
      top_p: request.topP ?? 0.9,
      top_k: request.topK ?? 40,
      repeat_penalty: request.repetitionPenalty ?? 1.12,
      num_predict: request.maxTokens ?? model.maxOutputTokens ?? 1024,
    };
    if (request.numCtx && request.numCtx > 0) optionsPayload.num_ctx = request.numCtx;
    if (typeof request.numGpu === 'number' && request.numGpu >= 0) optionsPayload.num_gpu = request.numGpu;
    if (typeof request.numThread === 'number' && request.numThread > 0) optionsPayload.num_thread = request.numThread;

    let res: Response;
    try {
      res = await fetchWithTimeout(
        `${base}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(provider.headers || {}) },
          signal: request.signal,
          body: JSON.stringify({
            model: model.upstreamModelId,
            messages: payloadMessages,
            stream: true,
            ...(request.keepAlive !== undefined ? { keep_alive: request.keepAlive } : {}),
            options: optionsPayload,
          }),
        },
        request.timeoutMs ?? 120000,
        this.customFetch,
      );
    } catch (err) {
      throw classifyLocalError(err, undefined, '', model.upstreamModelId);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw classifyLocalError(new Error(`HTTP ${res.status}`), res.status, errText, model.upstreamModelId);
    }

    let fullText = '';
    let tokenCount = 0;
    let realEvalCount: number | undefined;
    let realPromptEvalCount: number | undefined;
    let realEvalDurationNs: number | undefined;
    let streamError: string | null = null;

    if (res.body) {
      await consumeTextLineStream(
        res.body,
        (line) => {
          let parsed: {
            error?: string;
            message?: { content?: string };
            response?: string;
            done?: boolean;
            eval_count?: number;
            prompt_eval_count?: number;
            eval_duration?: number;
          };
          try {
            parsed = JSON.parse(line);
          } catch {
            return;
          }
          if (parsed?.error) {
            streamError = String(parsed.error);
            return;
          }
          const delta = parsed?.message?.content ?? parsed?.response ?? '';
          if (typeof delta === 'string' && delta.length > 0) {
            fullText += delta;
            tokenCount += 1;
            request.onToken?.(fullText, delta, tokenCount);
          }
          if (parsed?.done) {
            if (typeof parsed.eval_count === 'number') realEvalCount = parsed.eval_count;
            if (typeof parsed.prompt_eval_count === 'number') realPromptEvalCount = parsed.prompt_eval_count;
            if (typeof parsed.eval_duration === 'number') realEvalDurationNs = parsed.eval_duration;
          }
        },
        request.signal,
      );
    } else {
      const data = await res.json();
      if (data?.error) streamError = String(data.error);
      fullText = String(data?.message?.content ?? '');
      tokenCount = Math.max(1, Math.ceil(fullText.length / 4));
      if (typeof data?.eval_count === 'number') realEvalCount = data.eval_count;
      if (typeof data?.prompt_eval_count === 'number') realPromptEvalCount = data.prompt_eval_count;
      if (typeof data?.eval_duration === 'number') realEvalDurationNs = data.eval_duration;
      request.onToken?.(fullText, fullText, tokenCount);
    }

    if (streamError) {
      throw classifyLocalError(new Error(streamError), 500, streamError, model.upstreamModelId);
    }

    const elapsedMs = Math.max(1, Date.now() - started);
    const completionTokens = realEvalCount ?? Math.max(tokenCount, Math.ceil(fullText.length / 4));
    const tokensPerSecond =
      realEvalCount && realEvalDurationNs && realEvalDurationNs > 0
        ? Number(((realEvalCount / realEvalDurationNs) * 1e9).toFixed(1))
        : completionTokens > 0
          ? Number(((completionTokens / elapsedMs) * 1000).toFixed(1))
          : 0;

    return {
      modelId: model.id,
      providerId: provider.id,
      brain: 'local',
      text: fullText.trim(),
      promptTokensEstimate: realPromptEvalCount ?? promptApprox,
      completionTokensEstimate: completionTokens,
      latencyMs: elapsedMs,
      tokensPerSecond,
      computeBackend: request.numGpu === 0 ? 'Ollama CPU (num_gpu=0)' : 'Ollama Auto GPU/CPU',
      finishReason: request.signal?.aborted ? 'aborted' : 'stop',
      estimatedCostUsd: 0,
      rawUsage:
        realEvalCount !== undefined
          ? {
              promptTokens: realPromptEvalCount,
              completionTokens: realEvalCount,
              totalTokens: (realPromptEvalCount || 0) + realEvalCount,
            }
          : undefined,
    };
  }
}

export class LocalOpenAiAdapter implements AiModelAdapter {
  public readonly protocol = 'local-openai' as const;
  constructor(private customFetch?: FetchLike) {}

  public async checkHealth(provider: AiProviderDescriptor): Promise<{
    ok: boolean;
    detail: string;
    discoveredModels?: string[];
  }> {
    const base = provider.baseUrl.replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(`${base}/models`, { method: 'GET' }, 1800, this.customFetch);
      if (!res.ok) {
        return { ok: false, detail: `Local server returned HTTP ${res.status}` };
      }
      const data = await res.json();
      const models = Array.isArray(data?.data)
        ? data.data.map((m: { id?: string }) => String(m.id || '')).filter(Boolean)
        : [];
      return {
        ok: true,
        detail: `Local OpenAI-compatible runtime online (${models.length} model${models.length === 1 ? '' : 's'})`,
        discoveredModels: models,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, detail: `Local runtime unreachable at ${base} (${msg})` };
    }
  }

  public async generate(
    model: AiModelDescriptor,
    provider: AiProviderDescriptor,
    request: UnifiedChatRequest,
  ): Promise<UnifiedChatResponse> {
    const started = Date.now();
    const base = provider.baseUrl.replace(/\/+$/, '');
    const promptApprox = Math.ceil(
      request.messages.reduce((acc, m) => acc + m.content.length, 0) / 4,
    );

    let res: Response;
    try {
      res = await fetchWithTimeout(
        `${base}/chat/completions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(provider.headers || {}) },
          signal: request.signal,
          body: JSON.stringify({
            model: model.upstreamModelId,
            messages: request.messages.map((m) => ({
              role: m.role === 'tool' ? 'system' : m.role,
              content: m.content,
            })),
            stream: true,
            temperature: request.temperature ?? 0.6,
            top_p: request.topP ?? 0.9,
            max_tokens: request.maxTokens ?? model.maxOutputTokens ?? 1024,
          }),
        },
        request.timeoutMs ?? 120000,
        this.customFetch,
      );
    } catch (err) {
      throw classifyLocalError(err, undefined, '', model.upstreamModelId);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw classifyLocalError(new Error(`HTTP ${res.status}`), res.status, errText, model.upstreamModelId);
    }

    let fullText = '';
    let tokenCount = 0;
    if (res.body) {
      await consumeTextLineStream(
        res.body,
        (line) => {
          if (!line.startsWith('data:')) return;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') return;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content ?? parsed?.choices?.[0]?.text ?? '';
            if (typeof delta === 'string' && delta.length > 0) {
              fullText += delta;
              tokenCount += 1;
              request.onToken?.(fullText, delta, tokenCount);
            }
          } catch {
            // ignore
          }
        },
        request.signal,
      );
    } else {
      const data = await res.json();
      fullText = String(data?.choices?.[0]?.message?.content ?? '');
      tokenCount = Math.max(1, Math.ceil(fullText.length / 4));
      request.onToken?.(fullText, fullText, tokenCount);
    }

    const elapsedMs = Math.max(1, Date.now() - started);
    const estTokens = Math.max(tokenCount, Math.ceil(fullText.length / 4));
    return {
      modelId: model.id,
      providerId: provider.id,
      brain: 'local',
      text: fullText.trim(),
      promptTokensEstimate: promptApprox,
      completionTokensEstimate: estTokens,
      latencyMs: elapsedMs,
      tokensPerSecond: Number(((estTokens / elapsedMs) * 1000).toFixed(1)),
      computeBackend: 'Local OpenAI Server',
      finishReason: request.signal?.aborted ? 'aborted' : 'stop',
      estimatedCostUsd: 0,
    };
  }
}

export class LocalBrainManager {
  private ollamaAdapter: OllamaAdapter;
  private localOpenAiAdapter: LocalOpenAiAdapter;
  private customFetch?: FetchLike;
  private settings: LocalInferenceSettings;
  private hostHardwareProbe?: () => Promise<HostHardwareSnapshot | null>;
  private lastHardwareProfile: LocalHardwareProfile | null = null;
  private lastLoadedProcesses: OllamaLoadedProcess[] = [];

  constructor(
    private registry: ModelRegistry = modelRegistry,
    customFetch?: FetchLike,
  ) {
    this.customFetch = customFetch;
    this.ollamaAdapter = new OllamaAdapter(customFetch);
    this.localOpenAiAdapter = new LocalOpenAiAdapter(customFetch);
    const saved = safeReadJson<Partial<LocalInferenceSettings>>(LOCAL_SETTINGS_STORAGE_KEY, {});
    this.settings = { ...DEFAULT_LOCAL_INFERENCE_SETTINGS, ...saved };
  }

  public setFetchImplementation(fn: FetchLike): void {
    this.customFetch = fn;
    this.ollamaAdapter = new OllamaAdapter(fn);
    this.localOpenAiAdapter = new LocalOpenAiAdapter(fn);
  }

  public setHostHardwareProbe(probe: () => Promise<HostHardwareSnapshot | null>): void {
    this.hostHardwareProbe = probe;
  }

  public getInferenceSettings(): LocalInferenceSettings {
    return { ...this.settings };
  }

  public updateInferenceSettings(patch: Partial<LocalInferenceSettings>): LocalInferenceSettings {
    this.settings = { ...this.settings, ...patch };
    safeWriteJson(LOCAL_SETTINGS_STORAGE_KEY, this.settings);
    return this.getInferenceSettings();
  }

  public setActiveLocalModel(modelId: string | null): LocalInferenceSettings {
    return this.updateInferenceSettings({ activeLocalModelId: modelId });
  }

  public getLastHardwareProfile(): LocalHardwareProfile | null {
    return this.lastHardwareProfile;
  }

  public async detectHardwareCapabilities(): Promise<LocalHardwareProfile> {
    const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
    let cpuModel: string | null = null;
    let cpuCores =
      isBrowser && typeof navigator.hardwareConcurrency === 'number'
        ? navigator.hardwareConcurrency
        : 4;
    let totalRamGb: number | null = null;
    let freeRamGb: number | null = null;
    const deviceMemoryGb =
      isBrowser && typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 'number'
        ? (navigator as Navigator & { deviceMemory: number }).deviceMemory
        : null;
    let gpuName: string | null = null;
    let gpuVramTotalMb: number | null = null;
    let gpuVramFreeMb: number | null = null;
    let nvidiaDriverVersion: string | null = null;
    let cudaVerified = false;
    let cudaVerificationDetail = 'CUDA unverified in browser sandbox (connect Desktop bridge or run host probe).';

    // Query Desktop Electron IPC or injected host hardware probe for genuine OS/GPU metrics
    let desktopSnapshot: HostHardwareSnapshot | null = null;
    if (this.hostHardwareProbe) {
      try {
        desktopSnapshot = await this.hostHardwareProbe();
      } catch {
        desktopSnapshot = null;
      }
    } else if (isBrowser) {
      const desktop = (window as Window & {
        masterCloudDesktop?: { getLocalHardwareProfile?: () => Promise<HostHardwareSnapshot> };
      }).masterCloudDesktop;
      if (desktop?.getLocalHardwareProfile) {
        try {
          desktopSnapshot = await desktop.getLocalHardwareProfile();
        } catch {
          desktopSnapshot = null;
        }
      }
    }

    if (desktopSnapshot) {
      cpuModel = desktopSnapshot.cpuModel ?? cpuModel;
      cpuCores = desktopSnapshot.cpuCores || cpuCores;
      totalRamGb = desktopSnapshot.totalRamGb;
      freeRamGb = desktopSnapshot.freeRamGb;
      gpuName = desktopSnapshot.gpuName;
      gpuVramTotalMb = desktopSnapshot.gpuVramTotalMb;
      gpuVramFreeMb = desktopSnapshot.gpuVramFreeMb;
      nvidiaDriverVersion = desktopSnapshot.nvidiaDriverVersion;
      cudaVerified = desktopSnapshot.cudaVerified;
      cudaVerificationDetail = desktopSnapshot.cudaVerificationDetail;
    }

    let webgpuSupported = false;
    let webgpuAdapterName: string | null = null;
    if (isBrowser && 'gpu' in navigator) {
      try {
        const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<{ name?: string; info?: { description?: string; vendor?: string } } | null> } }).gpu;
        const adapter = await gpu?.requestAdapter();
        if (adapter) {
          webgpuSupported = true;
          webgpuAdapterName = adapter.info?.description || adapter.info?.vendor || adapter.name || 'WebGPU Adapter Ready';
          if (!gpuName && webgpuAdapterName) gpuName = webgpuAdapterName;
        }
      } catch {
        webgpuSupported = false;
      }
    }

    const wasmSupported = typeof WebAssembly === 'object';
    const sharedArrayBufferSupported = typeof SharedArrayBuffer === 'function';

    const discovery = await this.discoverLocalRuntimes();
    const onnxStatus = neuralRuntime.getStatus();

    const notes: string[] = [];
    if (!discovery.ollama.online && !discovery.localOpenAi.online) {
      notes.push(
        'No external local LLM daemon detected on 127.0.0.1:11434 (Ollama) or 127.0.0.1:1234. Original Brain deterministic tools & v1.0 ONNX remain active offline.',
      );
    }
    if (gpuVramTotalMb && gpuVramTotalMb <= 6500) {
      notes.push(
        `GPU VRAM is ${gpuVramTotalMb} MiB (e.g. RTX 3050 6GB class): use Q4_K_M 1.5B–3B/7B models and keep Single Heavy Model Guard ON to avoid OOM.`,
      );
    }
    if (!cudaVerified) {
      notes.push(cudaVerificationDetail);
    }

    const backendRec: LocalHardwareProfile['executionBackendRecommendation'] =
      discovery.ollama.online || discovery.localOpenAi.online
        ? gpuVramTotalMb && gpuVramTotalMb >= 3500 && this.settings.computeMode !== 'cpu'
          ? 'ollama-cuda-or-gpu'
          : 'ollama-cpu'
        : webgpuSupported
          ? 'webgpu-onnx'
          : 'wasm-simd-cpu';

    const profile: LocalHardwareProfile = {
      detectedAt: new Date().toISOString(),
      platform: isBrowser
        ? (window as Window & { masterCloudDesktop?: unknown }).masterCloudDesktop
          ? 'electron'
          : 'browser'
        : 'node',
      cpuModel,
      cpuCores,
      totalRamGb,
      freeRamGb,
      deviceMemoryGb,
      gpuName,
      gpuVramTotalMb,
      gpuVramFreeMb,
      nvidiaDriverVersion,
      cudaVerified,
      cudaVerificationDetail,
      webgpuSupported,
      webgpuAdapterName,
      wasmSupported,
      sharedArrayBufferSupported,
      executionBackendRecommendation: backendRec,
      loadedModels: [...this.lastLoadedProcesses],
      runtimes: {
        masterV1Onnx: {
          status: onnxStatus.status,
          executionProvider: onnxStatus.backend,
        },
        ollama: discovery.ollama,
        localOpenAi: discovery.localOpenAi,
      },
      notes,
    };

    this.lastHardwareProfile = profile;
    return profile;
  }

  public evaluateHardwareFit(
    model: AiModelDescriptor,
    hardware: Pick<LocalHardwareProfile, 'deviceMemoryGb' | 'totalRamGb' | 'freeRamGb' | 'gpuVramTotalMb' | 'gpuVramFreeMb' | 'cpuCores'>,
  ): { fits: boolean; targetBackend: 'gpu' | 'hybrid-gpu-cpu' | 'cpu'; reason: string } {
    if (!model.isLocal || (!model.ramRequiredMb && !model.vramRequiredMb && !model.diskSizeMb)) {
      return { fits: true, targetBackend: 'cpu', reason: 'Minimal footprint.' };
    }

    const neededVramMb = model.vramRequiredMb ?? estimateRamFromDiskMb(model.diskSizeMb, model.upstreamModelId);
    const neededRamMb = model.ramRequiredMb ?? estimateRamFromDiskMb(model.diskSizeMb, model.upstreamModelId);
    const hostRamGb = hardware.totalRamGb ?? hardware.deviceMemoryGb;

    if (hardware.gpuVramFreeMb !== null && hardware.gpuVramFreeMb > 0) {
      if (neededVramMb <= hardware.gpuVramFreeMb * 0.9) {
        return {
          fits: true,
          targetBackend: 'gpu',
          reason: `Fits GPU VRAM (~${(neededVramMb / 1024).toFixed(1)} GB <= ${(hardware.gpuVramFreeMb / 1024).toFixed(1)} GB free VRAM).`,
        };
      }
      if (hostRamGb !== null && neededRamMb <= hostRamGb * 1024 * 0.85) {
        return {
          fits: true,
          targetBackend: 'hybrid-gpu-cpu',
          reason: `Exceeds full GPU VRAM (${(hardware.gpuVramFreeMb / 1024).toFixed(1)} GB free); partial GPU/CPU offload recommended.`,
        };
      }
    }

    if (hostRamGb === null) {
      return {
        fits: true,
        targetBackend: 'cpu',
        reason: 'Host RAM unreported by browser; monitor memory for 7B+ weights.',
      };
    }

    const availableMb = (hardware.freeRamGb ?? hostRamGb) * 1024;
    if (neededRamMb > hostRamGb * 1024 * 0.85) {
      return {
        fits: false,
        targetBackend: 'cpu',
        reason: `Requires ~${(neededRamMb / 1024).toFixed(1)} GB RAM vs ${hostRamGb.toFixed(1)} GB host RAM.`,
      };
    }
    if (neededRamMb > availableMb * 0.95) {
      return {
        fits: true,
        targetBackend: 'cpu',
        reason: `Fits total RAM (${hostRamGb.toFixed(1)} GB) but current free RAM is tight (${hardware.freeRamGb?.toFixed(1) ?? '?'} GB).`,
      };
    }

    return {
      fits: true,
      targetBackend: 'cpu',
      reason: `Estimated ~${(neededRamMb / 1024).toFixed(1)} GB fits host resources (${hardware.cpuCores} threads).`,
    };
  }

  public async discoverLocalRuntimes(): Promise<{
    ollama: { online: boolean; endpoint: string; modelCount: number; models: string[]; error?: string };
    localOpenAi: { online: boolean; endpoint: string; modelCount: number; models: string[]; error?: string };
  }> {
    const providers = this.registry.listProviders('local');
    let ollamaResult = { online: false, endpoint: 'http://127.0.0.1:11434', modelCount: 0, models: [] as string[], error: undefined as string | undefined };
    let localOpenAiResult = { online: false, endpoint: 'http://127.0.0.1:1234/v1', modelCount: 0, models: [] as string[], error: undefined as string | undefined };
    this.lastLoadedProcesses = [];

    for (const provider of providers) {
      if (!provider.enabled) continue;
      if (provider.protocol === 'ollama') {
        const health = await this.ollamaAdapter.checkHealth(provider);
        this.registry.updateProvider(provider.id, {
          healthy: health.ok,
          lastHealthMessage: health.detail,
        });
        const found = health.discoveredModels || [];
        if (health.loadedModels?.length) {
          this.lastLoadedProcesses.push(...health.loadedModels);
        }
        ollamaResult = {
          online: health.ok,
          endpoint: provider.baseUrl,
          modelCount: found.length,
          models: found,
          error: health.ok ? undefined : health.detail,
        };
        await this.syncDiscoveredProviderModels(
          provider,
          found,
          health.ok,
          health.detail,
          health.discoveredModelDetails,
          health.loadedModels,
        );
      } else if (provider.protocol === 'local-openai') {
        const health = await this.localOpenAiAdapter.checkHealth(provider);
        this.registry.updateProvider(provider.id, {
          healthy: health.ok,
          lastHealthMessage: health.detail,
        });
        const found = health.discoveredModels || [];
        localOpenAiResult = {
          online: health.ok,
          endpoint: provider.baseUrl,
          modelCount: found.length,
          models: found,
          error: health.ok ? undefined : health.detail,
        };
        await this.syncDiscoveredProviderModels(provider, found, health.ok, health.detail);
      }
    }

    // Update honest v1.0 ONNX readiness
    const onnxState = neuralRuntime.getStatus();
    if (onnxState.status === 'ready') {
      this.registry.setModelAvailability('master-ai-v1-onnx', 'ready', `Loaded via ${onnxState.backend || 'WASM'}`, {
        installed: true,
        currentlyLoaded: true,
      });
    } else if (onnxState.status === 'error') {
      this.registry.setModelAvailability('master-ai-v1-onnx', 'error', onnxState.errorMessage || 'ONNX asset load error', {
        installed: false,
        currentlyLoaded: false,
      });
    }

    return { ollama: ollamaResult, localOpenAi: localOpenAiResult };
  }

  private async syncDiscoveredProviderModels(
    provider: AiProviderDescriptor,
    discoveredIds: string[],
    providerOnline: boolean,
    detail: string,
    tagDetails?: OllamaModelMetadata[],
    loadedList?: OllamaLoadedProcess[],
  ): Promise<void> {
    const discoveredSet = new Set(discoveredIds.map((x) => x.trim()));
    const detailByName = new Map((tagDetails || []).map((d) => [d.name, d]));
    const loadedByName = new Map((loadedList || []).map((p) => [p.name, p]));
    const existingForProvider = this.registry.listModels({ providerId: provider.id });

    for (const model of existingForProvider) {
      const matchedName = discoveredSet.has(model.upstreamModelId)
        ? model.upstreamModelId
        : discoveredSet.has(`${model.upstreamModelId}:latest`)
          ? `${model.upstreamModelId}:latest`
          : null;

      if (!providerOnline) {
        this.registry.setModelAvailability(model.id, 'offline_unavailable', detail, {
          installed: false,
          currentlyLoaded: false,
          vramUsedMb: 0,
        });
      } else if (matchedName) {
        const tagMeta = detailByName.get(matchedName);
        const procMeta = loadedByName.get(matchedName);
        this.registry.setModelAvailability(model.id, 'ready', `Installed & ready on ${provider.name}`, {
          installed: true,
          currentlyLoaded: Boolean(procMeta),
          diskSizeMb: tagMeta?.sizeMb || model.diskSizeMb,
          vramUsedMb: procMeta?.sizeVramMb || 0,
        });
      } else if (model.isBuiltIn) {
        this.registry.setModelAvailability(model.id, 'needs_download', 'Not installed locally yet — pull explicitly to install.', {
          installed: false,
          currentlyLoaded: false,
          vramUsedMb: 0,
        });
      } else {
        this.registry.setModelAvailability(model.id, 'offline_unavailable', 'Not listed by local runtime.', {
          installed: false,
          currentlyLoaded: false,
          vramUsedMb: 0,
        });
      }
    }

    if (providerOnline) {
      for (const upstreamId of discoveredIds) {
        const expectedId = `${provider.id}:${upstreamId}`;
        if (!this.registry.getModel(expectedId) && !existingForProvider.some((m) => m.upstreamModelId === upstreamId)) {
          const caps = inferCapabilitiesFromModelName(upstreamId);
          const tagMeta = detailByName.get(upstreamId);
          const procMeta = loadedByName.get(upstreamId);
          const showMeta =
            provider.protocol === 'ollama'
              ? await this.ollamaAdapter.inspectModel(provider, upstreamId)
              : null;

          const diskMb = tagMeta?.sizeMb || undefined;
          const estRamMb = estimateRamFromDiskMb(diskMb, upstreamId);
          const quant = showMeta?.quantization || tagMeta?.quantization || inferQuantizationFromTag(upstreamId);

          this.registry.registerModel({
            id: expectedId,
            name: `${upstreamId} (Local ${provider.protocol === 'ollama' ? 'Ollama' : 'OpenAI'})`,
            upstreamModelId: upstreamId,
            providerId: provider.id,
            brain: 'local',
            modelType: upstreamId.toLowerCase().includes('q') ? 'quantized_local' : 'open_weight_local',
            capabilities: caps,
            contextCapacityTokens:
              showMeta?.contextLength ?? (upstreamId.toLowerCase().includes('llama3') ? 32768 : 16384),
            maxOutputTokens: 2048,
            isLocal: true,
            supportsVision: caps.includes('vision'),
            supportsTools: caps.includes('tool_calling'),
            supportsStreaming: true,
            availability: 'ready',
            availabilityDetail: `Auto-discovered from ${provider.baseUrl}`,
            installed: true,
            currentlyLoaded: Boolean(procMeta),
            diskSizeMb: diskMb,
            vramUsedMb: procMeta?.sizeVramMb || 0,
            vramRequiredMb: diskMb ? Math.round(diskMb * 1.15) : undefined,
            ramRequiredMb: estRamMb,
            runtimeName: provider.protocol === 'ollama' ? 'ollama' : 'local-openai',
            parameterCountLabel: showMeta?.parameterSize || tagMeta?.parameterSize || 'Local GGUF',
            quantization: quant,
            sinhalaQualityScore: caps.includes('sinhala') ? 0.68 : 0.45,
            englishQualityScore: 0.85,
            codingQualityScore: caps.includes('coding') ? 0.86 : 0.72,
            costPer1kInputUsd: 0,
            costPer1kOutputUsd: 0,
            isBuiltIn: false,
            config: { autoDiscovered: true, family: showMeta?.family || tagMeta?.family },
          });
        }
      }
    }
  }

  public async pullOllamaModel(
    modelTag: string,
    providerId = 'ollama',
    onProgress?: (event: PullProgressEvent) => void,
    signal?: AbortSignal,
  ): Promise<{ ok: boolean; message: string }> {
    const provider = this.registry.getProvider(providerId);
    if (!provider || provider.protocol !== 'ollama') {
      return { ok: false, message: `Ollama provider "${providerId}" is not configured.` };
    }
    const base = provider.baseUrl.replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(
        `${base}/api/pull`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: modelTag.trim(), stream: true }),
          signal,
        },
        600000,
        this.customFetch,
      );
      if (!res.ok) {
        return { ok: false, message: `Pull failed with HTTP ${res.status}` };
      }
      if (res.body) {
        await consumeTextLineStream(
          res.body,
          (line) => {
            try {
              const ev = JSON.parse(line);
              if (ev.error) {
                throw new Error(String(ev.error));
              }
              const total = typeof ev.total === 'number' ? ev.total : undefined;
              const completed = typeof ev.completed === 'number' ? ev.completed : undefined;
              const percent =
                total && total > 0 && typeof completed === 'number'
                  ? Math.min(100, Math.round((completed / total) * 100))
                  : undefined;
              onProgress?.({
                status: String(ev.status || 'pulling'),
                digest: ev.digest,
                total,
                completed,
                percent,
              });
            } catch (e) {
              if (e instanceof Error && e.message && !line.startsWith('{')) return;
              if (e instanceof Error && e.message && line.includes('"error"')) throw e;
            }
          },
          signal,
        );
      }
      await this.discoverLocalRuntimes();
      return { ok: true, message: `Installed local model ${modelTag}.` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, message: `Unable to pull "${modelTag}" from ${base}: ${msg}` };
    }
  }

  public async unloadOllamaModel(modelIdOrTag: string, providerId = 'ollama'): Promise<{ ok: boolean; message: string }> {
    const existing = this.registry.getModel(modelIdOrTag);
    const provider = this.registry.getProvider(existing?.providerId || providerId);
    if (!provider || provider.protocol !== 'ollama') {
      return { ok: false, message: 'Ollama provider not found.' };
    }
    const tag = existing ? existing.upstreamModelId : modelIdOrTag;
    const ok = await this.ollamaAdapter.unloadModel(provider, tag);
    await this.discoverLocalRuntimes();
    return ok
      ? { ok: true, message: `Unloaded "${tag}" from VRAM/RAM.` }
      : { ok: false, message: `Could not unload "${tag}" cleanly.` };
  }

  public async unloadLocalModel(modelIdOrTag: string, providerId = 'ollama'): Promise<{ ok: boolean; message: string }> {
    return this.unloadOllamaModel(modelIdOrTag, providerId);
  }

  public async removeOllamaModel(modelIdOrTag: string, providerId = 'ollama'): Promise<{ ok: boolean; message: string }> {
    const provider = this.registry.getProvider(providerId);
    const existing = this.registry.getModel(modelIdOrTag);
    const tag = existing ? existing.upstreamModelId : modelIdOrTag;

    if (!provider || provider.protocol !== 'ollama') {
      if (existing && !existing.isBuiltIn) {
        this.registry.removeModel(existing.id);
        return { ok: true, message: `Removed custom model registration "${existing.name}".` };
      }
      return { ok: false, message: 'Ollama provider not found.' };
    }

    const base = provider.baseUrl.replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(
        `${base}/api/delete`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tag }),
        },
        15000,
        this.customFetch,
      );
      if (!res.ok) {
        return { ok: false, message: `Ollama delete returned HTTP ${res.status}` };
      }
      if (existing) {
        if (existing.isBuiltIn) {
          this.registry.setModelAvailability(existing.id, 'needs_download', 'Removed locally; pull again to reinstall.', {
            installed: false,
            currentlyLoaded: false,
            vramUsedMb: 0,
          });
        } else {
          this.registry.removeModel(existing.id);
        }
      }
      await this.discoverLocalRuntimes();
      return { ok: true, message: `Removed local model "${tag}".` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, message: `Failed to delete "${tag}": ${msg}` };
    }
  }

  public registerCustomLocalModel(input: {
    id?: string;
    name: string;
    upstreamModelId: string;
    providerId: 'ollama' | 'local-openai' | string;
    contextCapacityTokens?: number;
    quantization?: string;
    capabilities?: ModelCapability[];
    supportsVision?: boolean;
  }): AiModelDescriptor {
    const id = (input.id || `${input.providerId}:${input.upstreamModelId}`).trim();
    const caps = input.capabilities?.length
      ? input.capabilities
      : inferCapabilitiesFromModelName(input.upstreamModelId);
    return this.registry.registerModel({
      id,
      name: input.name.trim() || input.upstreamModelId,
      upstreamModelId: input.upstreamModelId.trim(),
      providerId: input.providerId,
      brain: 'local',
      modelType: 'quantized_local',
      capabilities: caps,
      contextCapacityTokens: input.contextCapacityTokens ?? 16384,
      maxOutputTokens: 2048,
      isLocal: true,
      supportsVision: input.supportsVision ?? caps.includes('vision'),
      supportsTools: caps.includes('tool_calling'),
      supportsStreaming: true,
      availability: 'needs_download',
      availabilityDetail: 'Custom local model added; run Discovery to verify online status.',
      installed: false,
      currentlyLoaded: false,
      runtimeName: input.providerId === 'ollama' ? 'ollama' : 'local-openai',
      parameterCountLabel: 'Custom Local',
      quantization: input.quantization || inferQuantizationFromTag(input.upstreamModelId),
      sinhalaQualityScore: caps.includes('sinhala') ? 0.65 : 0.45,
      englishQualityScore: 0.82,
      codingQualityScore: caps.includes('coding') ? 0.85 : 0.7,
      costPer1kInputUsd: 0,
      costPer1kOutputUsd: 0,
      isBuiltIn: false,
      isCustom: true,
      config: {},
    });
  }

  private async enforceSingleHeavyModelGuard(provider: AiProviderDescriptor, targetUpstreamId: string): Promise<void> {
    if (!this.settings.singleHeavyModelGuard || provider.protocol !== 'ollama') return;
    const health = await this.ollamaAdapter.checkHealth(provider);
    const loaded = health.loadedModels || [];
    const heavyOthers = loaded.filter(
      (p) => p.name !== targetUpstreamId && (p.sizeMb >= 1200 || p.sizeVramMb >= 1000),
    );
    for (const stale of heavyOthers) {
      await this.ollamaAdapter.unloadModel(provider, stale.name);
    }
  }

  public async generateLocal(
    model: AiModelDescriptor,
    request: UnifiedChatRequest,
  ): Promise<UnifiedChatResponse> {
    const provider = this.registry.getProvider(model.providerId);
    if (!provider) {
      throw new LocalInferenceError(
        'RUNTIME_ERROR',
        `Provider "${model.providerId}" not found for model "${model.id}".`,
        false,
      );
    }
    const started = Date.now();

    try {
      if (model.id === 'master-ai-v1-onnx' || provider.protocol === 'original-onnx') {
        const ready = await neuralRuntime.ensureInitialized();
        if (!ready) {
          const st = neuralRuntime.getStatus();
          throw new LocalInferenceError(
            'MODEL_LOAD_FAILED',
            st.errorMessage || 'MASTER AI v1.0 ONNX weights could not be initialized.',
            false,
          );
        }
        const promptText = sharedTokenizerV1.formatConversationPrompt(
          request.messages.map((m) => ({
            role: m.role === 'tool' ? 'system' : m.role,
            content: m.content,
          })),
        );
        const gen = await neuralRuntime.generateFromPrompt(
          promptText,
          {
            maxNewTokens: Math.min(160, request.maxTokens ?? 120),
            temperature: request.temperature ?? 0.65,
            topP: request.topP ?? 0.9,
            topK: request.topK ?? 40,
            repetitionPenalty: request.repetitionPenalty ?? 1.2,
          },
          {
            signal: request.signal,
            onProgress: (partial, count) => {
              request.onToken?.(partial, partial, count);
            },
          },
        );
        const latency = Math.max(1, Date.now() - started);
        const tps = gen.generatedTokens > 0 ? Number(((gen.generatedTokens / latency) * 1000).toFixed(1)) : 0;
        const res: UnifiedChatResponse = {
          modelId: model.id,
          providerId: provider.id,
          brain: 'original',
          text: gen.text,
          promptTokensEstimate: gen.promptTokens,
          completionTokensEstimate: gen.generatedTokens,
          latencyMs: latency,
          tokensPerSecond: tps,
          computeBackend: neuralRuntime.getStatus().backend || 'WASM CPU',
          finishReason: gen.stoppedReason === 'aborted' ? 'aborted' : 'stop',
          estimatedCostUsd: 0,
        };
        this.registry.recordTelemetry(model.id, { ok: true, latencyMs: res.latencyMs, tokensPerSecond: tps });
        return res;
      }

      if (provider.protocol === 'ollama') {
        await this.enforceSingleHeavyModelGuard(provider, model.upstreamModelId);
        const resolvedNumGpu =
          request.numGpu !== undefined
            ? request.numGpu
            : this.settings.computeMode === 'cpu'
              ? 0
              : this.settings.gpuLayers >= 0
                ? this.settings.gpuLayers
                : undefined;

        const baseCtx = request.numCtx ?? Math.min(model.contextCapacityTokens, this.settings.contextWindowTokens);
        const enrichedReq: UnifiedChatRequest = {
          ...request,
          numCtx: baseCtx,
          numGpu: resolvedNumGpu,
          numThread: request.numThread ?? (this.settings.cpuThreads > 0 ? this.settings.cpuThreads : undefined),
          keepAlive: request.keepAlive ?? this.settings.keepAlive,
          timeoutMs: request.timeoutMs ?? this.settings.requestTimeoutMs,
        };

        let res: UnifiedChatResponse;
        try {
          res = await this.ollamaAdapter.generate(model, provider, enrichedReq);
        } catch (primaryErr) {
          const classifiedPrimary = classifyLocalError(primaryErr, undefined, '', model.upstreamModelId);
          const canRecoverMemory =
            !request.signal?.aborted &&
            (classifiedPrimary.code === 'OUT_OF_MEMORY' || classifiedPrimary.code === 'CONTEXT_EXCEEDED') &&
            (resolvedNumGpu !== 0 || baseCtx > 2048);

          if (!canRecoverMemory) {
            throw classifiedPrimary;
          }

          // Automatic v2.2 OOM / Context Recovery: flush VRAM and retry once at CPU + conservative context
          await this.ollamaAdapter.unloadModel(provider, model.upstreamModelId);
          const safeCtx = Math.min(2048, baseCtx);
          const safeGpu = classifiedPrimary.code === 'OUT_OF_MEMORY' ? 0 : resolvedNumGpu;
          res = await this.ollamaAdapter.generate(model, provider, {
            ...enrichedReq,
            numCtx: safeCtx,
            numGpu: safeGpu,
          });
          res.computeBackend = `${res.computeBackend || 'Ollama'} [Auto-Recovered: num_ctx=${safeCtx}${safeGpu === 0 ? ', cpu-fallback' : ''}]`;
        }

        this.registry.recordTelemetry(model.id, {
          ok: true,
          latencyMs: res.latencyMs,
          tokensPerSecond: res.tokensPerSecond,
        });
        return res;
      }

      if (provider.protocol === 'local-openai') {
        const res = await this.localOpenAiAdapter.generate(model, provider, {
          ...request,
          timeoutMs: request.timeoutMs ?? this.settings.requestTimeoutMs,
        });
        this.registry.recordTelemetry(model.id, {
          ok: true,
          latencyMs: res.latencyMs,
          tokensPerSecond: res.tokensPerSecond,
        });
        return res;
      }

      throw new LocalInferenceError('RUNTIME_ERROR', `Unsupported local protocol: ${provider.protocol}`, false);
    } catch (err) {
      const classified = classifyLocalError(err, undefined, '', model.upstreamModelId);
      this.registry.recordTelemetry(model.id, {
        ok: false,
        latencyMs: Date.now() - started,
        errorMessage: classified.message,
      });
      throw classified;
    }
  }
}

export const localBrainManager = new LocalBrainManager(modelRegistry);
