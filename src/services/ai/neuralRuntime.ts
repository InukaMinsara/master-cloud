/**
 * MASTER CLOUD — MASTER AI CORE v1.0
 * Browser / Electron Client-Side Autoregressive Neural Runtime via ONNX Runtime Web.
 *
 * Non-Negotiable Architecture Rules:
 * - Executes strictly our own `master_ai_v1.onnx` weights + `tokenizer_v1.json`.
 * - Strictly offline WASM paths (`/ort/`) — zero CDN fetches or remote LLM calls.
 * - Never fakes neural responses when runtime fails: reports real status/errors honestly.
 */

import { sharedTokenizerV1, TOKEN_IDS_V1 } from './tokenizerV1';

export type NeuralRuntimeStatus = 'unloaded' | 'loading' | 'ready' | 'error';

export interface NeuralModelManifest {
  model_name: string;
  version: string;
  architecture: string;
  parameter_count: number;
  vocab_size: number;
  max_seq_len: number;
  onnx_size_mb: number;
  onnx_sha256: string;
  policy: string;
}

export interface NeuralGenerationConfig {
  maxNewTokens: number;
  temperature: number;
  topK: number;
  topP: number;
  repetitionPenalty: number;
}

export const DEFAULT_NEURAL_GEN_CONFIG: NeuralGenerationConfig = {
  maxNewTokens: 96,
  temperature: 0.65,
  topK: 40,
  topP: 0.9,
  repetitionPenalty: 1.15,
};

export interface NeuralGenerationResult {
  text: string;
  rawTextWithSpecials: string;
  promptTokens: number;
  generatedTokens: number;
  elapsedMs: number;
  tokensPerSec: number;
  stoppedReason: 'eos' | 'endturn' | 'max_tokens' | 'aborted';
  backend: string;
  toolCall?: { tool: string; args: Record<string, unknown> } | null;
}

/**
 * Pure deterministic/stochastic logits sampler exported for testing and reuse.
 */
export function applyRepetitionPenalty(
  logits: Float32Array,
  recentTokenIds: number[],
  penalty: number,
): void {
  if (penalty === 1.0) return;
  const seen = new Set(recentTokenIds.slice(-64));
  for (const tid of seen) {
    if (tid < 0 || tid >= logits.length) continue;
    logits[tid] = logits[tid] > 0 ? logits[tid] / penalty : logits[tid] * penalty;
  }
}

export function sampleNextTokenId(
  rawLogits: ArrayLike<number>,
  config: NeuralGenerationConfig,
  recentTokenIds: number[] = [],
  rng: () => number = Math.random,
): number {
  const V = rawLogits.length;
  const scores = new Float32Array(V);
  for (let i = 0; i < V; i++) {
    scores[i] = rawLogits[i];
  }

  // Suppress <pad> and <unk> so generation never stalls cleanly on pad
  scores[TOKEN_IDS_V1.PAD] = -1e9;
  scores[TOKEN_IDS_V1.UNK] = -1e9;

  applyRepetitionPenalty(scores, recentTokenIds, config.repetitionPenalty);

  if (config.temperature <= 0.01) {
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < V; i++) {
      if (scores[i] > bestVal) {
        bestVal = scores[i];
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  const invTemp = 1.0 / Math.max(0.05, config.temperature);
  for (let i = 0; i < V; i++) {
    scores[i] *= invTemp;
  }

  // Sort candidate indices descending for exact top-k + top-p nucleus filtering
  const kLimit = config.topK > 0 && config.topK < V ? config.topK : Math.min(V, 128);
  const candidates: Array<{ id: number; score: number }> = [];
  for (let i = 0; i < V; i++) {
    if (scores[i] > -1e8) {
      candidates.push({ id: i, score: scores[i] });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const topCandidates = candidates.slice(0, kLimit);
  if (topCandidates.length === 0) return TOKEN_IDS_V1.EOS;

  const maxLogit = topCandidates[0].score;
  let sumExp = 0;
  const probs = new Float64Array(topCandidates.length);
  for (let i = 0; i < topCandidates.length; i++) {
    const p = Math.exp(topCandidates[i].score - maxLogit);
    probs[i] = p;
    sumExp += p;
  }

  // Top-p truncation
  const topP = config.topP > 0 && config.topP < 1 ? config.topP : 1.0;
  let cumP = 0;
  let cutoff = topCandidates.length;
  for (let i = 0; i < topCandidates.length; i++) {
    probs[i] /= Math.max(1e-12, sumExp);
    cumP += probs[i];
    if (cumP >= topP && i >= 0) {
      cutoff = i + 1;
      break;
    }
  }

  let keptSum = 0;
  for (let i = 0; i < cutoff; i++) keptSum += probs[i];

  const r = rng() * keptSum;
  let acc = 0;
  for (let i = 0; i < cutoff; i++) {
    acc += probs[i];
    if (r <= acc) return topCandidates[i].id;
  }
  return topCandidates[0].id;
}

/**
 * Inspect raw generated stream with special tokens for an explicit `<|tool|>` JSON request.
 */
export function extractToolCallFromGeneration(
  rawTextWithSpecials: string,
): { tool: string; args: Record<string, unknown> } | null {
  const idx = rawTextWithSpecials.indexOf('<|tool|>');
  if (idx < 0) return null;
  const after = rawTextWithSpecials.slice(idx + '<|tool|>'.length);
  const endIdx = after.search(/<\|(?:endturn|eos|assistant|tool_result)\|>/);
  const jsonCandidate = (endIdx >= 0 ? after.slice(0, endIdx) : after).trim();
  const match = jsonCandidate.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (parsed && typeof parsed.tool === 'string') {
      return {
        tool: parsed.tool,
        args: parsed.args && typeof parsed.args === 'object' ? parsed.args : {},
      };
    }
  } catch {
    return null;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrtModule = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrtSession = any;

export class MasterAiNeuralRuntime {
  private ort: OrtModule | null = null;
  private session: OrtSession | null = null;
  private manifest: NeuralModelManifest | null = null;
  private status: NeuralRuntimeStatus = 'unloaded';
  private errorMessage: string | null = null;
  private activeBackend = 'uninitialized';
  private loadPromise: Promise<boolean> | null = null;

  public getStatus(): {
    status: NeuralRuntimeStatus;
    backend: string;
    manifest: NeuralModelManifest | null;
    errorMessage: string | null;
  } {
    return {
      status: this.status,
      backend: this.activeBackend,
      manifest: this.manifest,
      errorMessage: this.errorMessage,
    };
  }

  public async ensureInitialized(): Promise<boolean> {
    if (this.status === 'ready' && this.session && sharedTokenizerV1.loaded) {
      return true;
    }
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this.performInit().finally(() => {
      this.loadPromise = null;
    });
    return this.loadPromise;
  }

  private async performInit(): Promise<boolean> {
    this.status = 'loading';
    this.errorMessage = null;

    try {
      // Load manifest + tokenizer concurrently from local assets
      const [manifestRes] = await Promise.all([
        fetch('/models/master-ai-core-v1/model_manifest_v1.json'),
        sharedTokenizerV1.loaded
          ? Promise.resolve()
          : sharedTokenizerV1.fetchAndLoad('/models/master-ai-core-v1/tokenizer_v1.json'),
      ]);

      if (!manifestRes.ok) {
        throw new Error(`Model manifest unavailable (${manifestRes.status})`);
      }
      this.manifest = (await manifestRes.json()) as NeuralModelManifest;

      // Dynamically import onnxruntime-web so unit tests without WebAssembly/DOM remain isolated
      const ort = await import('onnxruntime-web');
      this.ort = ort;
      // Enforce 100% offline local WASM runtime path (no CDN lookups)
      if (ort.env?.wasm) {
        ort.env.wasm.wasmPaths = '/ort/';
        ort.env.wasm.numThreads = 1;
      }

      const modelUrl = '/models/master-ai-core-v1/master_ai_v1.onnx';
      const tryProviders: string[] = [];
      if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
        tryProviders.push('webgpu');
      }
      tryProviders.push('wasm');

      let lastErr: unknown = null;
      for (const ep of tryProviders) {
        try {
          this.session = await ort.InferenceSession.create(modelUrl, {
            executionProviders: [ep],
            graphOptimizationLevel: 'all',
          });
          this.activeBackend = `onnxruntime-web:${ep}`;
          this.status = 'ready';
          return true;
        } catch (err) {
          lastErr = err;
        }
      }

      throw lastErr || new Error('No ONNX execution provider succeeded');
    } catch (err) {
      this.status = 'error';
      this.errorMessage = err instanceof Error ? err.message : String(err);
      this.session = null;
      return false;
    }
  }

  public async generateFromPrompt(
    promptText: string,
    config: Partial<NeuralGenerationConfig> = {},
    options?: {
      signal?: AbortSignal;
      onProgress?: (partialText: string, generatedTokens: number) => void;
    },
  ): Promise<NeuralGenerationResult> {
    const ready = await this.ensureInitialized();
    if (!ready || !this.session || !this.ort) {
      throw new Error(
        `Local Neural Core ONNX model unavailable: ${this.errorMessage || 'not initialized'}`,
      );
    }

    const genCfg: NeuralGenerationConfig = { ...DEFAULT_NEURAL_GEN_CONFIG, ...config };
    const maxCtx = this.manifest?.max_seq_len ?? 512;
    let promptIds = sharedTokenizerV1.encode(promptText, false, false);
    const maxPromptLen = Math.max(32, maxCtx - Math.min(genCfg.maxNewTokens, 160));
    if (promptIds.length > maxPromptLen) {
      promptIds = promptIds.slice(promptIds.length - maxPromptLen);
    }

    const t0 = performance.now();
    const seq = [...promptIds];
    const generated: number[] = [];
    let stoppedReason: NeuralGenerationResult['stoppedReason'] = 'max_tokens';

    for (let step = 0; step < genCfg.maxNewTokens; step++) {
      if (options?.signal?.aborted) {
        stoppedReason = 'aborted';
        break;
      }
      if (seq.length >= maxCtx) {
        stoppedReason = 'max_tokens';
        break;
      }

      const bigIds = new BigInt64Array(seq.length);
      for (let i = 0; i < seq.length; i++) {
        bigIds[i] = BigInt(seq[i]);
      }

      const inputTensor = new this.ort.Tensor('int64', bigIds, [1, seq.length]);
      const outputs = await this.session.run({ input_ids: inputTensor });
      const logitsTensor = outputs.logits;
      const vocabSize = logitsTensor.dims[2] as number;
      const lastOffset = (seq.length - 1) * vocabSize;
      const lastSlice = (logitsTensor.data as Float32Array).subarray(
        lastOffset,
        lastOffset + vocabSize,
      );

      // Avoid emitting <|assistant|> right at step 0 if already prompted with <|assistant|>\n
      const nextId = sampleNextTokenId(lastSlice, genCfg, seq);

      if (nextId === TOKEN_IDS_V1.EOS) {
        stoppedReason = 'eos';
        break;
      }
      if (nextId === TOKEN_IDS_V1.ENDTURN) {
        stoppedReason = 'endturn';
        break;
      }

      generated.push(nextId);
      seq.push(nextId);

      const partialClean = sharedTokenizerV1.decode(generated, true);
      if (options?.onProgress) {
        options.onProgress(partialClean, generated.length);
      }

      // Yield a micro-slice so UI streaming updates paint and AbortSignal clicks trigger promptly
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }

    const elapsedMs = Math.max(1, performance.now() - t0);
    const rawWithSpecials = sharedTokenizerV1.decode(generated, false);
    const cleanText = sharedTokenizerV1.decode(generated, true).trim();
    const toolCall = extractToolCallFromGeneration(rawWithSpecials);

    return {
      text: cleanText,
      rawTextWithSpecials: rawWithSpecials,
      promptTokens: promptIds.length,
      generatedTokens: generated.length,
      elapsedMs: Math.round(elapsedMs),
      tokensPerSec: Number(((generated.length * 1000) / elapsedMs).toFixed(1)),
      stoppedReason,
      backend: this.activeBackend,
      toolCall,
    };
  }
}

export const neuralRuntime = new MasterAiNeuralRuntime();
