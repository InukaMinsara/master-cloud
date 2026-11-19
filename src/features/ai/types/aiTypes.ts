/**
 * src/features/ai/types/aiTypes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI 2.0 — CORE TYPE DEFINITIONS
 * Modern, clean, decoupled interfaces for the Groq-powered AI engine.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type AiRole = 'user' | 'assistant' | 'system';

export type AiProviderId = 'groq' | 'pollinations' | 'comfyui';

export type ChatMode = 'auto' | 'chat' | 'image';

export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:2' | '2:3';

export interface AiAttachment {
  id: string;
  name: string;
  type: 'file' | 'image';
  sizeBytes: number;
  mimeType?: string;
  content?: string; // Text content for document files
  url?: string;     // Object URL, data URL, or remote URL
  width?: number;
  height?: number;
}

export interface AiTokenMetrics {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  tokensPerSec?: number;
  latencyMs?: number;
  firstTokenMs?: number;
}

export interface AiImageDetails {
  url: string;
  prompt: string;
  revisedPrompt?: string;
  provider: 'pollinations' | 'comfyui';
  modelId: string;
  modelTitle?: string;
  width: number;
  height: number;
  seed?: number;
  aspectRatio?: ImageAspectRatio;
  isEdited?: boolean;
  referenceImageId?: string;
  savedToDriveId?: string;
  generationTimeMs?: number;
}

export interface AiMessage {
  id: string;
  role: AiRole;
  content: string;
  timestamp: number;
  providerUsed?: AiProviderId;
  modelUsed?: string;
  metrics?: AiTokenMetrics;
  attachments?: AiAttachment[];
  imageDetails?: AiImageDetails;
  isGeneratingImage?: boolean;
  isError?: boolean;
}

export interface AiConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  messages: AiMessage[];
  systemPrompt?: string;
}

// ── Groq Models & Capabilities ──────────────────────────────────────────────
export type GroqCategory =
  | 'all_free'
  | 'general_chat'
  | 'reasoning'
  | 'coding'
  | 'multimodal'
  | 'audio'
  | 'moderation'
  | 'other';

export interface GroqModelInfo {
  id: string;
  name: string;
  tag: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  category: 'production' | 'fast' | 'reasoning' | 'audio' | 'moderation' | 'other';
  groqCategory: GroqCategory;
  isDefault?: boolean;
  isFreeTier: boolean;
  isActive: boolean;
  rateLimits?: string;
}

// ── Pollinations Models & Capabilities ──────────────────────────────────────
export type PollinationsCategory =
  | 'primary_gen'
  | 'primary_edit'
  | 'free_gen'
  | 'fast_gen'
  | 'experimental'
  | 'all';

export interface PollinationsModelInfo {
  id: string;                    // Canonical identifier (e.g. black-forest-labs/flux.1-schnell)
  name: string;                  // Short display name
  title: string;
  aliases: string[];
  publisher?: string;
  category: PollinationsCategory;
  paidOnly: boolean;
  freeStatus: 'free' | 'paid' | 'unverified';
  supportsGeneration: boolean;
  supportsEditing: boolean;
  maxReferenceImages?: number;
  pricing?: any;
  healthStatus?: string;
  isAvailable: boolean;
  estimatedSpeed?: 'fast' | 'medium' | 'slow';
  lastRefreshedAt?: number;
}

// ── Unified Provider Vault Configuration ────────────────────────────────────
export interface ProviderVaultConfig {
  // Groq
  groqEndpoint: string;
  groqApiKey: string;
  groqEnabled: boolean;
  groqLastConnected?: number;
  groqLastError?: string;

  // Pollinations
  pollinationsEndpoint: string;
  pollinationsApiKey: string;
  pollinationsEnabled: boolean;
  pollinationsLastConnected?: number;
  pollinationsLastError?: string;

  // ComfyUI Local
  comfyUiEndpoint: string;
  comfyUiApiKey: string;
  comfyUiEnabled: boolean;
  comfyUiLastConnected?: number;
  comfyUiLastError?: string;

  // Global Policies
  freeOnly: boolean;
  blockPaid: boolean;
  autoPaidFallback: boolean;
}

export interface GroqChatOptions {
  model?: string;
  messages: Array<{ role: AiRole; content: string }>;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  onChunk?: (chunk: string, fullText: string) => void;
  onMetrics?: (metrics: AiTokenMetrics) => void;
}

export interface GroqChatResult {
  text: string;
  modelUsed: string;
  metrics: AiTokenMetrics;
}

export interface GroqTranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}
