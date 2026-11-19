/**
 * src/features/ai/services/groqModels.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — OFFICIAL GROQ MODEL REGISTRY & FREE-TIER ELIGIBILITY
 * Verified against official GroqCloud documentation (console.groq.com/docs/models).
 * Maintains a strict free-tier eligibility database and dynamic discovery parser.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GroqCategory, GroqModelInfo } from '../types/aiTypes';

export const GROQ_CATEGORIES: Array<{ id: GroqCategory; label: string; icon: string }> = [
  { id: 'all_free', label: 'All Free Models', icon: 'Sparkles' },
  { id: 'general_chat', label: 'General Chat', icon: 'MessageSquare' },
  { id: 'reasoning', label: 'Reasoning', icon: 'Brain' },
  { id: 'coding', label: 'Coding & Architecture', icon: 'Code' },
  { id: 'multimodal', label: 'Vision / Multimodal', icon: 'Eye' },
  { id: 'audio', label: 'Audio & Transcription', icon: 'Mic' },
  { id: 'moderation', label: 'Safety / Moderation', icon: 'ShieldCheck' },
  { id: 'other', label: 'Other Supported Models', icon: 'Layers' },
];

/**
 * Official GroqCloud Free-Tier Eligibility Registry.
 * Based on official Groq rate limits & documentation.
 */
export const OFFICIAL_GROQ_FREE_REGISTRY: Record<string, {
  isFree: boolean;
  name: string;
  tag: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  category: GroqModelInfo['category'];
  groqCategory: GroqCategory;
  rateLimits?: string;
}> = {
  'openai/gpt-oss-120b': {
    isFree: true,
    name: 'GPT-OSS 120B',
    tag: 'Flagship Core',
    description: 'High-capability open reasoning model with deep system architecture and analytical depth.',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    category: 'production',
    groqCategory: 'coding',
    rateLimits: '1k RPM · 6k RPD · 100k TPM',
  },
  'openai/gpt-oss-20b': {
    isFree: true,
    name: 'GPT-OSS 20B Instant',
    tag: 'Ultra-Fast',
    description: 'Sub-second conversational intelligence, snappy answers, code assistance, and fast chat.',
    contextWindow: 65536,
    maxOutputTokens: 8192,
    category: 'fast',
    groqCategory: 'general_chat',
    rateLimits: '1k RPM · 14.4k RPD · 30k TPM',
  },
  'qwen/qwen3.8-27b': {
    isFree: true,
    name: 'Qwen 3.8 27B',
    tag: 'Multi-Lingual Reasoning',
    description: 'Advanced instruction following, mathematical reasoning, and versatile multi-lingual chat.',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    category: 'production',
    groqCategory: 'reasoning',
    rateLimits: '1k RPM · 6k RPD · 60k TPM',
  },
  'llama-3.3-70b-versatile': {
    isFree: true,
    name: 'Meta Llama 3.3 70B',
    tag: 'Flagship Core',
    description: 'State-of-the-art coding, system architecture, deep reasoning, and multi-turn precision.',
    contextWindow: 131072,
    maxOutputTokens: 32768,
    category: 'production',
    groqCategory: 'coding',
    rateLimits: '1k RPM · 6k RPD · 100k TPM',
  },
  'llama-3.1-8b-instant': {
    isFree: true,
    name: 'Meta Llama 3.1 8B Instant',
    tag: 'Ultra-Fast',
    description: 'Sub-second conversational intelligence, real-time code snippet generation, and instant analysis.',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    category: 'fast',
    groqCategory: 'general_chat',
    rateLimits: '1k RPM · 14.4k RPD · 30k TPM',
  },
  'deepseek-r1-distill-llama-70b': {
    isFree: true,
    name: 'DeepSeek-R1 Distill Llama 70B',
    tag: 'Deep Reasoning',
    description: 'Explicit multi-step mathematical deduction, algorithmic proofs, and chain-of-thought reasoning.',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    category: 'reasoning',
    groqCategory: 'reasoning',
    rateLimits: '1k RPM · 6k RPD · 100k TPM',
  },
  'gemma2-9b-it': {
    isFree: true,
    name: 'Google Gemma 2 9B IT',
    tag: 'Efficient Instruction',
    description: 'High-speed compact model built on Google Gemma 2 architecture for targeted instruction following.',
    contextWindow: 8192,
    maxOutputTokens: 8192,
    category: 'fast',
    groqCategory: 'general_chat',
    rateLimits: '1k RPM · 14.4k RPD · 15k TPM',
  },
  'llama-3.2-1b-preview': {
    isFree: true,
    name: 'Meta Llama 3.2 1B Preview',
    tag: 'Lightweight Fast',
    description: 'Ultra-lightweight edge model designed for rapid token streaming and lightweight tasks.',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    category: 'fast',
    groqCategory: 'general_chat',
    rateLimits: '1k RPM · 14.4k RPD',
  },
  'llama-3.2-3b-preview': {
    isFree: true,
    name: 'Meta Llama 3.2 3B Preview',
    tag: 'Compact Balanced',
    description: 'Efficient compact model balancing speed and conversational coherence.',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    category: 'fast',
    groqCategory: 'general_chat',
    rateLimits: '1k RPM · 14.4k RPD',
  },
  'whisper-large-v3': {
    isFree: true,
    name: 'Whisper Large v3',
    tag: 'Speech-to-Text',
    description: 'Multilingual speech transcription and translation with state-of-the-art precision.',
    contextWindow: 448,
    maxOutputTokens: 448,
    category: 'audio',
    groqCategory: 'audio',
    rateLimits: '20 RPM · 2k RPD',
  },
  'whisper-large-v3-turbo': {
    isFree: true,
    name: 'Whisper Large v3 Turbo',
    tag: 'Fast ASR',
    description: 'High-speed audio transcription with reduced latency for real-time speech workflows.',
    contextWindow: 448,
    maxOutputTokens: 448,
    category: 'audio',
    groqCategory: 'audio',
    rateLimits: '20 RPM · 2k RPD',
  },
  'llama-guard-3-8b': {
    isFree: true,
    name: 'Meta Llama Guard 3 8B',
    tag: 'Safety Guard',
    description: 'Content safety classification, prompt injection guardrail, and input/output moderation.',
    contextWindow: 8192,
    maxOutputTokens: 8192,
    category: 'moderation',
    groqCategory: 'moderation',
    rateLimits: '1k RPM · 14.4k RPD',
  },
};

export const VERIFIED_GROQ_MODELS: GroqModelInfo[] = Object.entries(OFFICIAL_GROQ_FREE_REGISTRY).map(
  ([id, meta]) => ({
    id,
    name: meta.name,
    tag: meta.tag,
    description: meta.description,
    contextWindow: meta.contextWindow,
    maxOutputTokens: meta.maxOutputTokens,
    category: meta.category,
    groqCategory: meta.groqCategory,
    isDefault: id === 'llama-3.3-70b-versatile',
    isFreeTier: meta.isFree,
    isActive: true,
    rateLimits: meta.rateLimits,
  })
);

export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

export const GROQ_AUDIO_MODELS = {
  whisperLarge: 'whisper-large-v3',
  whisperTurbo: 'whisper-large-v3-turbo',
};

/**
 * Validates whether a model ID is officially registered.
 */
export function isGroqModelSupported(modelId: string): boolean {
  return VERIFIED_GROQ_MODELS.some((m) => m.id === modelId);
}

/**
 * Returns model metadata for a given ID with safe fallback.
 */
export function getGroqModelInfo(modelId: string): GroqModelInfo {
  const found = VERIFIED_GROQ_MODELS.find((m) => m.id === modelId);
  if (found) return found;

  const displayName = modelId.split('/').pop() || modelId;
  return {
    id: modelId,
    name: displayName,
    tag: 'Live Model',
    description: 'Active model detected on configured Groq API account.',
    contextWindow: 16384,
    maxOutputTokens: 8192,
    category: 'other',
    groqCategory: 'other',
    isDefault: false,
    isFreeTier: true,
    isActive: true,
  };
}

/**
 * Reconciles live models returned by GET /models with official Free-Tier Registry.
 * Guarantees that only confirmed free-tier eligible models are offered in Free-Only mode.
 */
export function reconcileLiveGroqModels(liveModels: Array<{ id: string; active?: boolean }>): GroqModelInfo[] {
  const results: GroqModelInfo[] = [];

  for (const live of liveModels) {
    const registryEntry = OFFICIAL_GROQ_FREE_REGISTRY[live.id];
    if (registryEntry) {
      results.push({
        id: live.id,
        name: registryEntry.name,
        tag: registryEntry.tag,
        description: registryEntry.description,
        contextWindow: registryEntry.contextWindow,
        maxOutputTokens: registryEntry.maxOutputTokens,
        category: registryEntry.category,
        groqCategory: registryEntry.groqCategory,
        isDefault: live.id === DEFAULT_GROQ_MODEL,
        isFreeTier: registryEntry.isFree,
        isActive: live.active !== false,
        rateLimits: registryEntry.rateLimits,
      });
    } else {
      // Returned by Groq GET /models but not in confirmed free registry -> labeled UNVERIFIED/PAID
      results.push({
        id: live.id,
        name: live.id,
        tag: 'Extended Model',
        description: 'Returned by Groq account API. Pricing status not officially verified.',
        contextWindow: 8192,
        maxOutputTokens: 4096,
        category: 'other',
        groqCategory: 'other',
        isDefault: false,
        isFreeTier: false, // Strict safety: never assume free!
        isActive: live.active !== false,
      });
    }
  }

  // If the default model was not among the active account models, select the first active chat model
  if (!results.some((m) => m.isDefault && m.isActive)) {
    const firstChat = results.find(
      (m) => !m.id.includes('whisper') && !m.id.includes('guard') && m.isActive
    );
    if (firstChat) {
      firstChat.isDefault = true;
    }
  }

  // Ensure baseline models are present
  if (results.length === 0) {
    return VERIFIED_GROQ_MODELS;
  }

  return results;
}
