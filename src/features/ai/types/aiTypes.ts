/**
 * src/features/ai/types/aiTypes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI INFINITY — CORE UNIFIED TYPE DEFINITIONS
 * Unified multi-provider chat models, SenseNova image details,
 * token telemetry, and web intelligence types.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type AiRole = 'user' | 'assistant' | 'system';

export type AiProviderId =
  | 'groq'
  | 'xkiro'
  | 'pollinations'
  | 'experiential'
  | 'unorouter'
  | 'abhibots'
  | 'apmix'
  | 'openrouter'
  | 'nvidia';

export type ChatMode = 'auto' | 'chat';

export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:2' | '2:3' | '21:9';

export type ModelCategory = 'all' | 'reasoning' | 'coding' | 'fast' | 'general' | 'vision';

export interface GenerationParameters {
  temperature?: number;      // 0.0 - 2.0 (default 0.7)
  topP?: number;             // 0.0 - 1.0 (default 0.95)
  topK?: number;             // 1 - 100
  maxTokens?: number;        // 256 - 16384 (default 4096)
  frequencyPenalty?: number; // -2.0 - 2.0 (default 0.0)
  presencePenalty?: number;  // -2.0 - 2.0 (default 0.0)
  seed?: number | null;
  stopSequences?: string[];
  stream?: boolean;          // default true
  preset?: 'creative' | 'balanced' | 'precise' | 'coding' | 'custom';
}

export interface AiMemoryItem {
  id: string;
  content: string;
  createdAt: number;
  enabled: boolean;
  scope?: 'global' | string;
}

export interface AiFolder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'coding' | 'writing' | 'analysis' | 'brainstorming' | 'productivity' | 'custom';
  prompt: string;
  description?: string;
  isFavorite?: boolean;
}

export type ModelFamily =
  | 'gpt'
  | 'gemini'
  | 'claude'
  | 'deepseek'
  | 'qwen'
  | 'mistral'
  | 'llama'
  | 'cohere'
  | 'sensenova'
  | 'nvidia'
  | 'minimax'
  | 'moonshot'
  | 'grok'
  | 'stepfun'
  | 'baichuan'
  | 'general';

export interface ModelCapabilities {
  hasVision: boolean;          // Native vision (image/keyframe analysis)
  hasAppDocument: boolean;     // Application-assisted document parsing (PDF, DOCX, XLSX, PPTX)
  hasAppVideo: boolean;        // Application-assisted video keyframe analysis
  hasCode: boolean;            // Advanced code understanding
  hasReasoning: boolean;       // Extended reasoning
  contextLength: number;       // Context window token limit
}

export interface UnifiedChatModel {
  id: string;
  name: string; // Clean display name with ZERO provider branding
  description: string;
  category: ModelCategory;
  family?: ModelFamily;
  capabilities?: ModelCapabilities;
  contextLength?: number;
  contextBadge?: string;
  isDefault?: boolean;
  provider: AiProviderId; // Internal routing only
  isFree?: boolean;
  pricingPrompt?: number | string;
  pricingCompletion?: number | string;
  maxOutputTokens?: number;
  supportsStreaming?: boolean;
  supportsVision?: boolean;
  supportsJson?: boolean;
}

export interface VideoKeyframe {
  timestampSec: number;
  formattedTime: string;
  dataUri: string;
}

export interface AiAttachment {
  id: string;
  name: string;
  type: 'file' | 'image' | 'video';
  sizeBytes: number;
  mimeType?: string;
  content?: string; // Text content for document files & video summary breakdown
  url?: string;     // Object URL or preview URL
  dataUri?: string; // Base64 data URI for vision models (image & video frames)
  width?: number;
  height?: number;
  durationSec?: number;
  fps?: number;
  status?: 'pending' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
  pageCount?: number;
  sheetNames?: string[];
  slideCount?: number;
  keyframes?: VideoKeyframe[];
  extractedSummary?: string;
  metadata?: Record<string, any>;
  driveFileId?: string;
}

export interface AiTokenMetrics {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  tokensPerSec?: number;
  latencyMs?: number;
  firstTokenMs?: number;
}

export interface WebSearchResult {
  title: string;
  snippet: string;
  url?: string;
}

export interface AiImageDetails {
  url: string;
  prompt: string;
  revisedPrompt?: string;
  provider: AiProviderId;
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
  webSearchResults?: WebSearchResult[];
  isGeneratingImage?: boolean;
  isError?: boolean;
}

export interface AiConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
  folderId?: string | null;
  tags?: string[];
  messages: AiMessage[];
  systemPrompt?: string;
  modelUsed?: string;
  generationParameters?: GenerationParameters;
  modelLocked?: boolean;
  memoryEnabled?: boolean;
  isShared?: boolean;
  shareId?: string;
}

export type GroqCategory = string;
export type PollinationsCategory = string;

export interface GroqChatOptions {
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
  onChunk?: (chunk: string, accumulated: string) => void;
  onMetrics?: (metrics: AiTokenMetrics) => void;
}

export interface GroqChatResult {
  text: string;
  modelUsed: string;
  metrics: AiTokenMetrics;
}

export interface GroqTranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
}

// Backward-compatible Groq & Pollinations Model interfaces for legacy tests
export interface GroqModelInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  tag: string;
  maxTokens?: number;
  contextWindow?: number;
  maxOutputTokens?: number;
  groqCategory?: any;
  isFreeTier?: boolean;
  isActive?: boolean;
  rateLimits?: string;
  isFreeEligible?: boolean;
  isDefault?: boolean;
}

export interface PollinationsModelInfo {
  id: string;
  name: string;
  title: string;
  description?: string;
  aliases: string[];
  paidOnly: boolean;
  supportsEditing: boolean;
  category: string;
  publisher?: string;
  freeStatus?: string;
  supportsGeneration?: boolean;
  maxReferenceImages?: number;
  lastRefreshedAt?: number;
  isPreferred?: boolean;
  isAvailable?: boolean;
  estimatedSpeed?: string;
}
