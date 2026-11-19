/**
 * src/features/ai/types/aiTypes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI 2.0 — CORE TYPE DEFINITIONS
 * Modern, clean, decoupled interfaces for the Groq-powered AI engine.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type AiRole = 'user' | 'assistant' | 'system';

export interface AiAttachment {
  id: string;
  name: string;
  type: 'file' | 'image';
  sizeBytes: number;
  mimeType?: string;
  content?: string; // Text content for document files
  url?: string;     // Object URL or data URL
}

export interface AiTokenMetrics {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  tokensPerSec?: number;
  latencyMs?: number;
  firstTokenMs?: number;
}

export interface AiMessage {
  id: string;
  role: AiRole;
  content: string;
  timestamp: number;
  modelUsed?: string;
  metrics?: AiTokenMetrics;
  attachments?: AiAttachment[];
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

export interface GroqModelInfo {
  id: string;
  name: string;
  tag: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  category: 'production' | 'fast' | 'reasoning';
  isDefault?: boolean;
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
