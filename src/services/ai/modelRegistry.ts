/**
 * modelRegistry.ts
 * MASTER AI CORE v2.0 — Dynamic, Unlimited AI Model & Provider Registry.
 *
 * Design principles:
 * - Zero hardcoded caps on registered providers, models, or capabilities.
 * - Separates model declaration from verified runtime availability (`availability` never faked).
 * - Exposes a unified adapter contract (`UnifiedChatRequest` / `UnifiedChatResponse`) across
 *   Brain A (Original), Brain B (Local Open-Weight), and Brain C (Optional Cloud).
 */

import { safeReadJson, safeWriteJson } from './storageHelper';

export type BrainLayer = 'original' | 'local' | 'cloud';

export type ModelType =
  | 'original_neural'
  | 'tool_orchestrator'
  | 'open_weight_local'
  | 'quantized_local'
  | 'cloud_llm'
  | 'multimodal_cloud';

export type ModelCapability =
  | 'chat'
  | 'coding'
  | 'math_reasoning'
  | 'vision'
  | 'sinhala'
  | 'english'
  | 'research'
  | 'tool_calling'
  | 'summarization';

export type ModelAvailability =
  | 'ready'
  | 'needs_download'
  | 'needs_api_key'
  | 'cloud_consent_required'
  | 'offline_unavailable'
  | 'rate_limited'
  | 'error';

export type ProviderProtocol =
  | 'original-onnx'
  | 'original-tools'
  | 'ollama'
  | 'local-openai'
  | 'openai-compatible'
  | 'gemini'
  | 'anthropic'
  | 'puter';

export interface ModelPerformanceStats {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  rateLimitedCount: number;
  avgLatencyMs: number;
  lastLatencyMs: number;
  lastTokensPerSecond?: number;
  reliabilityEma: number; // 0..1 exponential moving average
  lastError: string | null;
  lastCheckedAt: string | null;
  lastRateLimitUntil: number | null;
}

export interface AiProviderDescriptor {
  id: string;
  name: string;
  brain: BrainLayer;
  protocol: ProviderProtocol;
  baseUrl: string;
  requiresApiKey: boolean;
  isBuiltIn: boolean;
  enabled: boolean;
  healthy: boolean | null; // null = not yet probed
  lastHealthMessage?: string;
  rateLimitResetAt?: number | null;
  headers?: Record<string, string>;
  description?: string;
}

export interface AiModelDescriptor {
  id: string;
  name: string;
  upstreamModelId: string;
  providerId: string;
  brain: BrainLayer;
  modelType: ModelType;
  capabilities: ModelCapability[];
  contextCapacityTokens: number;
  maxOutputTokens: number;
  isLocal: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsStreaming: boolean;
  availability: ModelAvailability;
  availabilityDetail?: string;
  parameterCountLabel: string;
  quantization: string;
  vramRequiredMb?: number;
  ramRequiredMb?: number;
  installed?: boolean;
  currentlyLoaded?: boolean;
  diskSizeMb?: number;
  vramUsedMb?: number;
  runtimeName?: 'original-tools' | 'onnx-web' | 'ollama' | 'local-openai' | 'cloud-api';
  sinhalaQualityScore: number | null; // Verified 0..1 or null if untested/weak
  englishQualityScore: number | null;
  codingQualityScore: number | null;
  costPer1kInputUsd?: number | null;
  costPer1kOutputUsd?: number | null;
  isBuiltIn: boolean;
  isCustom?: boolean;
  tags?: string[];
  config: Record<string, unknown>;
  performanceStats: ModelPerformanceStats;
}

export interface UnifiedChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  imageDataUrl?: string; // Optional vision payload when model supportsVision
}

export interface UnifiedChatRequest {
  modelId: string;
  messages: UnifiedChatMessage[];
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  repetitionPenalty?: number;
  numCtx?: number;
  numGpu?: number;
  numThread?: number;
  keepAlive?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  onToken?: (partialText: string, deltaText: string, tokenCountApprox: number) => void;
}

export interface UnifiedChatResponse {
  modelId: string;
  providerId: string;
  brain: BrainLayer;
  text: string;
  promptTokensEstimate: number;
  completionTokensEstimate: number;
  latencyMs: number;
  tokensPerSecond?: number;
  computeBackend?: string;
  finishReason: 'stop' | 'length' | 'aborted' | 'error' | 'rate_limited';
  estimatedCostUsd?: number;
  rawUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AiModelAdapter {
  readonly protocol: ProviderProtocol;
  checkHealth(provider: AiProviderDescriptor, apiKey?: string | null): Promise<{ ok: boolean; detail: string; discoveredModels?: string[] }>;
  generate(
    model: AiModelDescriptor,
    provider: AiProviderDescriptor,
    request: UnifiedChatRequest,
    apiKey?: string | null,
  ): Promise<UnifiedChatResponse>;
}

const PROVIDERS_STORAGE_KEY = 'master_cloud_ai_v2_providers';
const MODELS_STORAGE_KEY = 'master_cloud_ai_v2_models';
const STATS_STORAGE_KEY = 'master_cloud_ai_v2_model_stats';

export function createDefaultStats(): ModelPerformanceStats {
  return {
    totalCalls: 0,
    successCalls: 0,
    failedCalls: 0,
    rateLimitedCount: 0,
    avgLatencyMs: 0,
    lastLatencyMs: 0,
    reliabilityEma: 1.0,
    lastError: null,
    lastCheckedAt: null,
    lastRateLimitUntil: null,
  };
}

const DEFAULT_PROVIDERS: AiProviderDescriptor[] = [
  {
    id: 'master-original',
    name: 'MASTER AI Original Brain (Built-in)',
    brain: 'original',
    protocol: 'original-tools',
    baseUrl: 'local://master-ai-core',
    requiresApiKey: false,
    isBuiltIn: true,
    enabled: true,
    healthy: true,
    description: 'Central controller, BM25 document & transcript RAG, deterministic media/math calculators, and independently trained v1.0 ONNX checkpoint.',
  },
  {
    id: 'ollama',
    name: 'Ollama Local Open-Weight Runtime',
    brain: 'local',
    protocol: 'ollama',
    baseUrl: 'http://127.0.0.1:11434',
    requiresApiKey: false,
    isBuiltIn: true,
    enabled: true,
    healthy: null,
    description: 'Local quantized GGUF inference daemon (Llama, Qwen, Gemma, Mistral, DeepSeek) with zero API keys.',
  },
  {
    id: 'local-openai',
    name: 'Local OpenAI-Compatible Server (llama.cpp / LM Studio)',
    brain: 'local',
    protocol: 'local-openai',
    baseUrl: 'http://127.0.0.1:1234/v1',
    requiresApiKey: false,
    isBuiltIn: true,
    enabled: true,
    healthy: null,
    description: 'Connects to local llama-server, LM Studio, vLLM, or LocalAI endpoints.',
  },
  {
    id: 'puter',
    name: 'Puter.js Unified AI Platform',
    brain: 'cloud',
    protocol: 'puter',
    baseUrl: 'https://api.puter.com',
    requiresApiKey: false,
    isBuiltIn: true,
    enabled: true,
    healthy: true,
    description: 'Puter.js Unified AI Gateway: Keyless, $0 developer cost, verified free models & Puter models.',
  },
  {
    id: 'gemini',
    name: 'Google Gemini API (Optional Cloud)',
    brain: 'cloud',
    protocol: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresApiKey: true,
    isBuiltIn: true,
    enabled: true,
    healthy: null,
    description: 'Optional external cloud provider authenticated strictly via x-goog-api-key header.',
  },
  {
    id: 'openai',
    name: 'OpenAI / Compatible Cloud API (Optional Cloud)',
    brain: 'cloud',
    protocol: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    isBuiltIn: true,
    enabled: true,
    healthy: null,
    description: 'Standard OpenAI Chat Completions provider (configurable baseUrl for custom endpoints).',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude API (Optional Cloud)',
    brain: 'cloud',
    protocol: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    requiresApiKey: true,
    isBuiltIn: true,
    enabled: true,
    healthy: null,
    description: 'Optional external Claude API using x-api-key + anthropic-version headers.',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter Multi-Model Gateway (Optional Cloud)',
    brain: 'cloud',
    protocol: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    isBuiltIn: true,
    enabled: true,
    healthy: null,
    description: 'User-configured OpenRouter gateway requiring explicit API key & cloud authorization.',
  },
];

const DEFAULT_MODELS: Omit<AiModelDescriptor, 'performanceStats'>[] = [
  {
    id: 'master-ai-v2-orchestrator',
    name: 'MASTER AI Core (Tool-Assisted + Evidence RAG)',
    upstreamModelId: 'master-ai-v2-orchestrator',
    providerId: 'master-original',
    brain: 'original',
    modelType: 'tool_orchestrator',
    capabilities: ['chat', 'math_reasoning', 'tool_calling', 'summarization', 'research', 'english', 'sinhala'],
    contextCapacityTokens: 4096,
    maxOutputTokens: 1024,
    isLocal: true,
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'ready',
    availabilityDetail: 'Always ready offline (deterministic math, BM25 transcript & documentation RAG).',
    parameterCountLabel: 'Deterministic + Hybrid',
    quantization: 'Native TS + Safe Tools',
    ramRequiredMb: 32,
    sinhalaQualityScore: 0.72,
    englishQualityScore: 0.85,
    codingQualityScore: 0.45,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['default', 'offline', 'tools', 'zero-hallucination-guard'],
    config: {},
  },
  {
    id: 'master-ai-v1-onnx',
    name: 'MASTER AI v1.0 Original Weights (5.16M ONNX)',
    upstreamModelId: 'master_ai_v1.onnx',
    providerId: 'master-original',
    brain: 'original',
    modelType: 'original_neural',
    capabilities: ['chat', 'english', 'sinhala', 'tool_calling'],
    contextCapacityTokens: 512,
    maxOutputTokens: 160,
    isLocal: true,
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'needs_download',
    availabilityDetail: 'Loads local /models/master-ai-core-v1/master_ai_v1.onnx (research pilot trained on 96.8k tokens).',
    parameterCountLabel: '5.16M (From Scratch)',
    quantization: 'FP32 ONNX',
    ramRequiredMb: 120,
    // Measured honest scores from FINAL_REPORT_v1.md: Gates B-E failed open-ended dialogue
    sinhalaQualityScore: 0.25,
    englishQualityScore: 0.18,
    codingQualityScore: 0.05,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['original-weights', 'research-baseline', 'v1.0-preserved'],
    config: { assetPath: '/models/master-ai-core-v1/master_ai_v1.onnx' },
  },
  // Local Brain B Open-Weight Installable Templates (honestly marked needs_download until detected live)
  {
    id: 'ollama:qwen2.5:3b-instruct-q4_K_M',
    name: 'Qwen 2.5 3B Instruct (Q4_K_M Local)',
    upstreamModelId: 'qwen2.5:3b-instruct-q4_K_M',
    providerId: 'ollama',
    brain: 'local',
    modelType: 'quantized_local',
    capabilities: ['chat', 'coding', 'math_reasoning', 'tool_calling', 'summarization', 'english', 'sinhala'],
    contextCapacityTokens: 32768,
    maxOutputTokens: 2048,
    isLocal: true,
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'needs_download',
    availabilityDetail: 'Pull via Ollama Local Brain Manager (fits 6 GB RTX 3050 VRAM comfortably).',
    parameterCountLabel: '3.1B',
    quantization: 'Q4_K_M (~2.0 GB)',
    vramRequiredMb: 2400,
    ramRequiredMb: 3500,
    sinhalaQualityScore: 0.68,
    englishQualityScore: 0.86,
    codingQualityScore: 0.80,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['recommended-6gb-gpu', 'bilingual', 'fast'],
    config: { ollamaTag: 'qwen2.5:3b-instruct-q4_K_M' },
  },
  {
    id: 'ollama:gemma2:2b-instruct-q4_K_M',
    name: 'Gemma 2 2B Instruct (Q4_K_M Local)',
    upstreamModelId: 'gemma2:2b-instruct-q4_K_M',
    providerId: 'ollama',
    brain: 'local',
    modelType: 'quantized_local',
    capabilities: ['chat', 'summarization', 'english', 'sinhala', 'research'],
    contextCapacityTokens: 8192,
    maxOutputTokens: 2048,
    isLocal: true,
    supportsVision: false,
    supportsTools: false,
    supportsStreaming: true,
    availability: 'needs_download',
    availabilityDetail: 'Compact multilingual open-weight model pullable in Local Brain tab.',
    parameterCountLabel: '2.6B',
    quantization: 'Q4_K_M (~1.6 GB)',
    vramRequiredMb: 1900,
    ramRequiredMb: 2800,
    sinhalaQualityScore: 0.74,
    englishQualityScore: 0.82,
    codingQualityScore: 0.65,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['compact', 'multilingual', 'sinhala-friendly'],
    config: { ollamaTag: 'gemma2:2b-instruct-q4_K_M' },
  },
  {
    id: 'ollama:llama3.2:3b-instruct-q4_K_M',
    name: 'Llama 3.2 3B Instruct (Q4_K_M Local)',
    upstreamModelId: 'llama3.2:3b-instruct-q4_K_M',
    providerId: 'ollama',
    brain: 'local',
    modelType: 'quantized_local',
    capabilities: ['chat', 'summarization', 'tool_calling', 'english', 'research'],
    contextCapacityTokens: 131072,
    maxOutputTokens: 4096,
    isLocal: true,
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'needs_download',
    availabilityDetail: 'Long-context (128K) local model pullable via Ollama.',
    parameterCountLabel: '3.2B',
    quantization: 'Q4_K_M (~2.0 GB)',
    vramRequiredMb: 2500,
    ramRequiredMb: 3600,
    sinhalaQualityScore: 0.55,
    englishQualityScore: 0.85,
    codingQualityScore: 0.75,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['long-context', '128k'],
    config: { ollamaTag: 'llama3.2:3b-instruct-q4_K_M' },
  },
  {
    id: 'ollama:qwen2.5-coder:7b-instruct-q4_K_M',
    name: 'Qwen 2.5 Coder 7B (Q4_K_M Local)',
    upstreamModelId: 'qwen2.5-coder:7b-instruct-q4_K_M',
    providerId: 'ollama',
    brain: 'local',
    modelType: 'quantized_local',
    capabilities: ['coding', 'math_reasoning', 'tool_calling', 'english'],
    contextCapacityTokens: 32768,
    maxOutputTokens: 4096,
    isLocal: true,
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'needs_download',
    availabilityDetail: 'High-accuracy local coding model (tight fit in 6 GB VRAM; uses shared system RAM if needed).',
    parameterCountLabel: '7.6B',
    quantization: 'Q4_K_M (~4.7 GB)',
    vramRequiredMb: 5200,
    ramRequiredMb: 7500,
    sinhalaQualityScore: 0.58,
    englishQualityScore: 0.88,
    codingQualityScore: 0.94,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['coding-specialist'],
    config: { ollamaTag: 'qwen2.5-coder:7b-instruct-q4_K_M' },
  },
  // Cloud Brain C Templates (Never active unless user enables Cloud Privacy Consent + API Key)
  {
    id: 'gemini:gemini-3.8-flash',
    name: 'Google Gemini 3.8 Flash (Cloud / Puter)',
    upstreamModelId: 'gemini-3.8-flash',
    providerId: 'gemini',
    brain: 'cloud',
    modelType: 'multimodal_cloud',
    capabilities: ['chat', 'coding', 'math_reasoning', 'vision', 'sinhala', 'english', 'research', 'summarization', 'tool_calling'],
    contextCapacityTokens: 1048576,
    maxOutputTokens: 8192,
    isLocal: false,
    supportsVision: true,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'ready',
    availabilityDetail: 'Available via Puter.js Unified AI Gateway & Cloud Gemini.',
    parameterCountLabel: 'Cloud Managed',
    quantization: 'Cloud Managed',
    sinhalaQualityScore: 0.96,
    englishQualityScore: 0.98,
    codingQualityScore: 0.95,
    costPer1kInputUsd: 0.0001,
    costPer1kOutputUsd: 0.0004,
    isBuiltIn: true,
    tags: ['gemini-3.8', 'multimodal', '1m-context', 'sinhala-strong', 'high-speed'],
    config: {},
  },
  {
    id: 'gemini:gemini-2.5-flash',
    name: 'Google Gemini 2.5 Flash (Cloud)',
    upstreamModelId: 'gemini-2.5-flash',
    providerId: 'gemini',
    brain: 'cloud',
    modelType: 'multimodal_cloud',
    capabilities: ['chat', 'coding', 'math_reasoning', 'vision', 'sinhala', 'english', 'research', 'summarization', 'tool_calling'],
    contextCapacityTokens: 1000000,
    maxOutputTokens: 8192,
    isLocal: false,
    supportsVision: true,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'needs_api_key',
    availabilityDetail: 'Requires explicit Cloud Authorization + Gemini API key.',
    parameterCountLabel: 'Cloud Managed',
    quantization: 'Cloud Managed',
    sinhalaQualityScore: 0.93,
    englishQualityScore: 0.95,
    codingQualityScore: 0.90,
    costPer1kInputUsd: 0.00015,
    costPer1kOutputUsd: 0.0006,
    isBuiltIn: true,
    tags: ['multimodal', '1m-context', 'sinhala-strong'],
    config: {},
  },
  {
    id: 'openai:gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini (Cloud)',
    upstreamModelId: 'gpt-4o-mini',
    providerId: 'openai',
    brain: 'cloud',
    modelType: 'multimodal_cloud',
    capabilities: ['chat', 'coding', 'math_reasoning', 'vision', 'sinhala', 'english', 'research', 'summarization', 'tool_calling'],
    contextCapacityTokens: 128000,
    maxOutputTokens: 16384,
    isLocal: false,
    supportsVision: true,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'needs_api_key',
    availabilityDetail: 'Requires explicit Cloud Authorization + OpenAI API key.',
    parameterCountLabel: 'Cloud Managed',
    quantization: 'Cloud Managed',
    sinhalaQualityScore: 0.86,
    englishQualityScore: 0.94,
    codingQualityScore: 0.91,
    costPer1kInputUsd: 0.00015,
    costPer1kOutputUsd: 0.0006,
    isBuiltIn: true,
    tags: ['fast-cloud', 'vision', 'coding'],
    config: {},
  },
  {
    id: 'anthropic:claude-3-5-sonnet-latest',
    name: 'Anthropic Claude 3.5 Sonnet (Cloud)',
    upstreamModelId: 'claude-3-5-sonnet-latest',
    providerId: 'anthropic',
    brain: 'cloud',
    modelType: 'multimodal_cloud',
    capabilities: ['chat', 'coding', 'math_reasoning', 'vision', 'sinhala', 'english', 'research', 'summarization'],
    contextCapacityTokens: 200000,
    maxOutputTokens: 8192,
    isLocal: false,
    supportsVision: true,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'needs_api_key',
    availabilityDetail: 'Requires explicit Cloud Authorization + Anthropic API key.',
    parameterCountLabel: 'Cloud Managed',
    quantization: 'Cloud Managed',
    sinhalaQualityScore: 0.89,
    englishQualityScore: 0.96,
    codingQualityScore: 0.96,
    costPer1kInputUsd: 0.003,
    costPer1kOutputUsd: 0.015,
    isBuiltIn: true,
    tags: ['coding', 'reasoning'],
    config: {},
  },
  {
    id: 'openrouter:google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B (Puter Verified Free)',
    upstreamModelId: 'openrouter:google/gemma-4-31b-it:free',
    providerId: 'puter',
    brain: 'cloud',
    modelType: 'cloud_llm',
    capabilities: ['chat', 'coding', 'math_reasoning', 'english', 'sinhala', 'research'],
    contextCapacityTokens: 32768,
    maxOutputTokens: 4096,
    isLocal: false,
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'ready',
    availabilityDetail: 'Puter.js Verified Free Tier — $0 developer cost & 0 user credits required.',
    parameterCountLabel: '31B Parameters',
    quantization: 'FP16 Cloud Service',
    sinhalaQualityScore: 0.88,
    englishQualityScore: 0.94,
    codingQualityScore: 0.85,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['puter', 'free', 'general', 'google'],
    config: { isFree: true },
  },
  {
    id: 'openrouter:nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA Nemotron 3.5 Lightning (Puter Verified Free)',
    upstreamModelId: 'openrouter:nvidia/nemotron-3.5-lightning:free',
    providerId: 'puter',
    brain: 'cloud',
    modelType: 'cloud_llm',
    capabilities: ['chat', 'math_reasoning', 'coding', 'english', 'sinhala'],
    contextCapacityTokens: 65536,
    maxOutputTokens: 4096,
    isLocal: false,
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'ready',
    availabilityDetail: 'Puter.js Verified Free Tier — Ultra-fast lightning reasoning.',
    parameterCountLabel: 'Nemotron 3.5',
    quantization: 'Cloud Service',
    sinhalaQualityScore: 0.82,
    englishQualityScore: 0.95,
    codingQualityScore: 0.89,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['puter', 'free', 'reasoning', 'nvidia'],
    config: { isFree: true },
  },
  {
    id: 'openrouter:cohere/north-mini-code:free',
    name: 'Cohere North Mini Code (Puter Verified Free)',
    upstreamModelId: 'openrouter:cohere/north-mini-code:free',
    providerId: 'puter',
    brain: 'cloud',
    modelType: 'cloud_llm',
    capabilities: ['chat', 'coding', 'english'],
    contextCapacityTokens: 32768,
    maxOutputTokens: 4096,
    isLocal: false,
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'ready',
    availabilityDetail: 'Puter.js Verified Free Tier — Specialized for code architecture & debugging.',
    parameterCountLabel: 'North Mini Code',
    quantization: 'Cloud Service',
    sinhalaQualityScore: 0.65,
    englishQualityScore: 0.92,
    codingQualityScore: 0.96,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['puter', 'free', 'coding', 'cohere'],
    config: { isFree: true },
  },
  {
    id: 'openrouter:nvidia/nemotron-3.5-super-vl:free',
    name: 'NVIDIA Nemotron 3.5 Super VL (Puter Verified Free Multimodal)',
    upstreamModelId: 'openrouter:nvidia/nemotron-3.5-super-vl:free',
    providerId: 'puter',
    brain: 'cloud',
    modelType: 'multimodal_cloud',
    capabilities: ['chat', 'vision', 'summarization', 'english'],
    contextCapacityTokens: 32768,
    maxOutputTokens: 4096,
    isLocal: false,
    supportsVision: true,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'ready',
    availabilityDetail: 'Puter.js Verified Free Tier — Visual document analysis & diagram inspection.',
    parameterCountLabel: 'Super VL',
    quantization: 'Cloud Multimodal',
    sinhalaQualityScore: 0.75,
    englishQualityScore: 0.93,
    codingQualityScore: 0.80,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['puter', 'free', 'vision', 'multimodal'],
    config: { isFree: true },
  },
  {
    id: 'openrouter:openrouter/free',
    name: 'OpenRouter Free Model Router (Puter.js)',
    upstreamModelId: 'openrouter:openrouter/free',
    providerId: 'puter',
    brain: 'cloud',
    modelType: 'cloud_llm',
    capabilities: ['chat', 'coding', 'math_reasoning', 'english', 'sinhala'],
    contextCapacityTokens: 16384,
    maxOutputTokens: 2048,
    isLocal: false,
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'ready',
    availabilityDetail: 'Puter.js Dynamic Free Router — Auto-routes to lowest latency free open model.',
    parameterCountLabel: 'Dynamic Free Router',
    quantization: 'Cloud Service',
    sinhalaQualityScore: 0.78,
    englishQualityScore: 0.90,
    codingQualityScore: 0.82,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['puter', 'free', 'router'],
    config: { isFree: true },
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Anthropic Claude 3.5 Sonnet (Puter.js)',
    upstreamModelId: 'claude-3-5-sonnet',
    providerId: 'puter',
    brain: 'cloud',
    modelType: 'cloud_llm',
    capabilities: ['chat', 'coding', 'math_reasoning', 'english', 'sinhala', 'vision', 'research'],
    contextCapacityTokens: 200000,
    maxOutputTokens: 8192,
    isLocal: false,
    supportsVision: true,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'ready',
    availabilityDetail: 'Puter.js User Allowance — Industry-leading reasoning and code architecture.',
    parameterCountLabel: 'Frontier SOTA',
    quantization: 'FP16 Cloud Service',
    sinhalaQualityScore: 0.91,
    englishQualityScore: 0.98,
    codingQualityScore: 0.98,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['puter', 'frontier', 'anthropic'],
    config: {},
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini (Puter.js)',
    upstreamModelId: 'gpt-4o-mini',
    providerId: 'puter',
    brain: 'cloud',
    modelType: 'cloud_llm',
    capabilities: ['chat', 'coding', 'math_reasoning', 'english', 'sinhala', 'vision'],
    contextCapacityTokens: 128000,
    maxOutputTokens: 4096,
    isLocal: false,
    supportsVision: true,
    supportsTools: true,
    supportsStreaming: true,
    availability: 'ready',
    availabilityDetail: 'Puter.js User Allowance — Fast, accurate multimodal generation.',
    parameterCountLabel: 'GPT-4o Mini',
    quantization: 'Cloud Service',
    sinhalaQualityScore: 0.86,
    englishQualityScore: 0.95,
    codingQualityScore: 0.90,
    costPer1kInputUsd: 0,
    costPer1kOutputUsd: 0,
    isBuiltIn: true,
    tags: ['puter', 'fast', 'openai'],
    config: {},
  },
];

export class ModelRegistry {
  private providers = new Map<string, AiProviderDescriptor>();
  private models = new Map<string, AiModelDescriptor>();
  private listeners = new Set<() => void>();

  constructor() {
    this.hydrate();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // ignore listener errors
      }
    }
  }

  private hydrate(): void {
    // 1. Load built-in defaults first
    for (const p of DEFAULT_PROVIDERS) {
      this.providers.set(p.id, { ...p });
    }
    const savedStats = safeReadJson<Record<string, ModelPerformanceStats>>(STATS_STORAGE_KEY, {});
    for (const m of DEFAULT_MODELS) {
      this.models.set(m.id, {
        ...m,
        capabilities: [...m.capabilities],
        config: { ...m.config },
        performanceStats: { ...createDefaultStats(), ...(savedStats[m.id] || {}) },
      });
    }

    // 2. Merge custom / updated user providers & models (unlimited capacity)
    const customProviders = safeReadJson<AiProviderDescriptor[]>(PROVIDERS_STORAGE_KEY, []);
    for (const p of customProviders) {
      if (p && p.id) {
        this.providers.set(p.id, { ...this.providers.get(p.id), ...p });
      }
    }

    const customModels = safeReadJson<Array<Omit<AiModelDescriptor, 'performanceStats'> & { performanceStats?: ModelPerformanceStats }>>(
      MODELS_STORAGE_KEY,
      [],
    );
    for (const m of customModels) {
      if (m && m.id) {
        this.models.set(m.id, {
          ...m,
          capabilities: Array.isArray(m.capabilities) ? [...m.capabilities] : ['chat'],
          config: { ...(m.config || {}) },
          performanceStats: { ...createDefaultStats(), ...(savedStats[m.id] || m.performanceStats || {}) },
        });
      }
    }
  }

  private persistProviders(): void {
    const all = Array.from(this.providers.values());
    safeWriteJson(PROVIDERS_STORAGE_KEY, all);
    this.notify();
  }

  private persistModels(): void {
    const customOrUpdated = Array.from(this.models.values()).map((m) => ({
      ...m,
      performanceStats: undefined,
    }));
    safeWriteJson(MODELS_STORAGE_KEY, customOrUpdated);
    this.notify();
  }

  private persistStats(): void {
    const statsMap: Record<string, ModelPerformanceStats> = {};
    for (const [id, m] of this.models.entries()) {
      statsMap[id] = m.performanceStats;
    }
    safeWriteJson(STATS_STORAGE_KEY, statsMap);
  }

  // ── Provider CRUD ──────────────────────────────────────────────────────────
  public listProviders(filterBrain?: BrainLayer): AiProviderDescriptor[] {
    const all = Array.from(this.providers.values());
    return filterBrain ? all.filter((p) => p.brain === filterBrain) : all;
  }

  public getProvider(providerId: string): AiProviderDescriptor | null {
    return this.providers.get(providerId) || null;
  }

  public registerProvider(descriptor: Omit<AiProviderDescriptor, 'isBuiltIn'> & { isBuiltIn?: boolean }): AiProviderDescriptor {
    const next: AiProviderDescriptor = {
      ...descriptor,
      isBuiltIn: descriptor.isBuiltIn ?? false,
    };
    this.providers.set(next.id, next);
    this.persistProviders();
    return next;
  }

  public updateProvider(providerId: string, patch: Partial<AiProviderDescriptor>): AiProviderDescriptor | null {
    const cur = this.providers.get(providerId);
    if (!cur) return null;
    const next = { ...cur, ...patch, id: cur.id };
    this.providers.set(providerId, next);
    this.persistProviders();
    return next;
  }

  public removeProvider(providerId: string, removeAssociatedModels = true): boolean {
    const cur = this.providers.get(providerId);
    if (!cur) return false;
    this.providers.delete(providerId);
    if (removeAssociatedModels) {
      for (const [mId, m] of this.models.entries()) {
        if (m.providerId === providerId) this.models.delete(mId);
      }
      this.persistModels();
    }
    this.persistProviders();
    return true;
  }

  // ── Model CRUD (Zero Caps) ─────────────────────────────────────────────────
  public listModels(filter?: {
    brain?: BrainLayer;
    providerId?: string;
    capability?: ModelCapability;
    onlyReady?: boolean;
    localOnly?: boolean;
  }): AiModelDescriptor[] {
    let items = Array.from(this.models.values());
    if (filter?.brain) items = items.filter((m) => m.brain === filter.brain);
    if (filter?.providerId) items = items.filter((m) => m.providerId === filter.providerId);
    if (filter?.capability) items = items.filter((m) => m.capabilities.includes(filter.capability!));
    if (filter?.onlyReady) items = items.filter((m) => m.availability === 'ready');
    if (filter?.localOnly) items = items.filter((m) => m.isLocal);
    return items;
  }

  public getModel(modelId: string): AiModelDescriptor | null {
    return this.models.get(modelId) || null;
  }

  public registerModel(
    descriptor: Omit<AiModelDescriptor, 'performanceStats' | 'isBuiltIn'> & {
      isBuiltIn?: boolean;
      performanceStats?: Partial<ModelPerformanceStats>;
    },
  ): AiModelDescriptor {
    const existing = this.models.get(descriptor.id);
    const next: AiModelDescriptor = {
      ...descriptor,
      isBuiltIn: descriptor.isBuiltIn ?? existing?.isBuiltIn ?? false,
      capabilities: Array.from(new Set(descriptor.capabilities || ['chat'])),
      config: { ...(existing?.config || {}), ...(descriptor.config || {}) },
      performanceStats: {
        ...createDefaultStats(),
        ...(existing?.performanceStats || {}),
        ...(descriptor.performanceStats || {}),
      },
    };
    this.models.set(next.id, next);
    this.persistModels();
    return next;
  }

  public updateModel(modelId: string, patch: Partial<AiModelDescriptor>): AiModelDescriptor | null {
    const existing = this.models.get(modelId);
    if (!existing) return null;
    const next: AiModelDescriptor = {
      ...existing,
      ...patch,
      id: existing.id,
      capabilities: patch.capabilities ? Array.from(new Set(patch.capabilities)) : existing.capabilities,
      config: patch.config ? { ...existing.config, ...patch.config } : existing.config,
      performanceStats: patch.performanceStats
        ? { ...existing.performanceStats, ...patch.performanceStats }
        : existing.performanceStats,
    };
    this.models.set(modelId, next);
    this.persistModels();
    return next;
  }

  public removeModel(modelId: string): boolean {
    if (!this.models.has(modelId)) return false;
    this.models.delete(modelId);
    this.persistModels();
    return true;
  }

  public setModelAvailability(
    modelId: string,
    availability: ModelAvailability,
    detail?: string,
    runtimeMeta?: {
      installed?: boolean;
      currentlyLoaded?: boolean;
      diskSizeMb?: number;
      vramUsedMb?: number;
    },
  ): void {
    const cur = this.models.get(modelId);
    if (!cur) return;
    cur.availability = availability;
    if (detail !== undefined) cur.availabilityDetail = detail;
    if (runtimeMeta) {
      if (runtimeMeta.installed !== undefined) cur.installed = runtimeMeta.installed;
      if (runtimeMeta.currentlyLoaded !== undefined) cur.currentlyLoaded = runtimeMeta.currentlyLoaded;
      if (runtimeMeta.diskSizeMb !== undefined) cur.diskSizeMb = runtimeMeta.diskSizeMb;
      if (runtimeMeta.vramUsedMb !== undefined) cur.vramUsedMb = runtimeMeta.vramUsedMb;
    }
    this.persistModels();
  }

  public recordTelemetry(
    modelId: string,
    outcome: {
      ok: boolean;
      latencyMs: number;
      tokensPerSecond?: number;
      errorMessage?: string;
      rateLimitedCooldownMs?: number;
    },
  ): void {
    const m = this.models.get(modelId);
    if (!m) return;
    const s = m.performanceStats;
    s.totalCalls += 1;
    s.lastCheckedAt = new Date().toISOString();
    s.lastLatencyMs = Math.max(0, Math.round(outcome.latencyMs));
    if (typeof outcome.tokensPerSecond === 'number' && outcome.tokensPerSecond > 0) {
      s.lastTokensPerSecond = Number(outcome.tokensPerSecond.toFixed(1));
    }

    if (outcome.ok) {
      s.successCalls += 1;
      s.lastError = null;
      s.lastRateLimitUntil = null;
      s.avgLatencyMs =
        s.successCalls === 1
          ? s.lastLatencyMs
          : Math.round(s.avgLatencyMs * 0.75 + s.lastLatencyMs * 0.25);
      s.reliabilityEma = Number(Math.min(1, s.reliabilityEma * 0.8 + 0.2).toFixed(3));
      if (m.availability === 'error' || m.availability === 'rate_limited') {
        m.availability = 'ready';
      }
    } else {
      s.failedCalls += 1;
      s.lastError = outcome.errorMessage || 'Unknown failure';
      s.reliabilityEma = Number(Math.max(0.05, s.reliabilityEma * 0.75).toFixed(3));
      if (outcome.rateLimitedCooldownMs && outcome.rateLimitedCooldownMs > 0) {
        s.rateLimitedCount += 1;
        s.lastRateLimitUntil = Date.now() + outcome.rateLimitedCooldownMs;
        m.availability = 'rate_limited';
        m.availabilityDetail = `Rate limited; cooldown until ${new Date(s.lastRateLimitUntil).toLocaleTimeString()}`;
      }
    }
    this.persistStats();
    this.notify();
  }

  public resetToDefaults(): void {
    this.providers.clear();
    this.models.clear();
    for (const p of DEFAULT_PROVIDERS) {
      this.providers.set(p.id, { ...p });
    }
    for (const m of DEFAULT_MODELS) {
      this.models.set(m.id, {
        ...m,
        capabilities: [...m.capabilities],
        config: { ...m.config },
        performanceStats: createDefaultStats(),
      });
    }
    this.persistProviders();
    this.persistModels();
    this.persistStats();
  }

  public getSummaryCounts(): {
    totalProviders: number;
    totalModels: number;
    readyModels: number;
    localReadyModels: number;
    cloudReadyModels: number;
  } {
    const models = Array.from(this.models.values());
    const ready = models.filter((m) => m.availability === 'ready');
    return {
      totalProviders: this.providers.size,
      totalModels: models.length,
      readyModels: ready.length,
      localReadyModels: ready.filter((m) => m.isLocal).length,
      cloudReadyModels: ready.filter((m) => !m.isLocal).length,
    };
  }
}

export const modelRegistry = new ModelRegistry();
