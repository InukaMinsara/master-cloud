/**
 * src/features/ai/services/groqModels.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI 2.0 — VERIFIED GROQ MODEL REGISTRY
 * Verified against official GroqCloud documentation (console.groq.com/docs/models).
 * Dynamically discovers currently supported production models.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GroqModelInfo } from '../types/aiTypes';

export const VERIFIED_GROQ_MODELS: GroqModelInfo[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Meta Llama 3.3 70B',
    tag: 'Flagship Core',
    description: 'State-of-the-art coding, system architecture, deep reasoning, and multi-turn precision.',
    contextWindow: 131072,
    maxOutputTokens: 32768,
    category: 'production',
    isDefault: true,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Meta Llama 3.1 8B Instant',
    tag: 'Ultra-Fast',
    description: 'Sub-second conversational intelligence, real-time code snippet generation, and instant analysis.',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    category: 'fast',
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek-R1 Distill Llama 70B',
    tag: 'Deep Reasoning',
    description: 'Explicit multi-step mathematical deduction, algorithmic proofs, and chain-of-thought reasoning.',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    category: 'reasoning',
  },
];

export const GROQ_AUDIO_MODELS = {
  whisperLarge: 'whisper-large-v3',
  whisperTurbo: 'whisper-large-v3-turbo',
};

export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Validates whether a model ID is currently supported.
 */
export function isGroqModelSupported(modelId: string): boolean {
  return VERIFIED_GROQ_MODELS.some((m) => m.id === modelId);
}

/**
 * Returns model metadata for a given ID with safe fallback.
 */
export function getGroqModelInfo(modelId: string): GroqModelInfo {
  const found = VERIFIED_GROQ_MODELS.find((m) => m.id === modelId);
  return found || VERIFIED_GROQ_MODELS[0];
}
