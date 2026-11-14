/**
 * puterAiService.ts
 * Master AI — Unified Puter.js AI Integration Platform.
 *
 * Implements:
 * 1. Puter.js Client Initializer & Auth (zero developer cost, user-pays/free tier model)
 * 2. Dynamic Model Catalog & Free-Tier Prioritization
 * 3. AI Chat with Streaming, History, Code/Reason/Vision, and Automatic Fallback
 * 4. AI Image Generation & Editing (FLUX, Stable Diffusion, Gemini Image, resolutions, download)
 * 5. AI Video Generation (Wan 2.7, Kling, Veo, Seedance, progress, preview, download)
 * 6. AI Speech & Audio (AWS Polly, OpenAI TTS, ElevenLabs, Speech-to-Text Whisper)
 * 7. Transparent Free vs Credit Cost Guard (never fakes generation with testMode)
 */

// In browser, Puter.js is loaded via official https://js.puter.com/v2/ script tag to avoid duplicate customElements definitions
let nodePuterModule: any = null;

export interface PuterUser {
  uuid?: string;
  username?: string;
  email?: string;
}

export interface PuterModelEntry {
  id: string;
  name: string;
  provider: string;
  description?: string;
  isFree: boolean;
  context?: number;
  maxTokens?: number;
  inputCost?: number;
  outputCost?: number;
  toolCall?: boolean;
}

export interface AiMemoryItem {
  id: string;
  fact: string;
  category: 'user_profile' | 'preference' | 'project' | 'custom';
  createdAt: string;
}

export interface PuterChatOptions {
  model?: string;
  stream?: boolean;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
  image?: string | Blob;
  memories?: AiMemoryItem[];
}

export interface PuterChatResult {
  text: string;
  modelUsed: string;
  fallbackTriggered: boolean;
  latencyMs: number;
  isFreeTier: boolean;
}

export interface PuterImageOptions {
  model?: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:2';
  width?: number;
  height?: number;
  input_image?: string | Blob;
  negative_prompt?: string;
}

export interface PuterImageResult {
  imageUrl: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  source: 'puter-txt2img';
}

export interface PuterVideoOptions {
  model?: string;
  duration?: number;
  size?: '1280x720' | '720x1280' | '1024x576' | '576x1024';
  input_image?: string | Blob;
  onProgress?: (status: string) => void;
}

export interface PuterVideoResult {
  videoUrl: string;
  prompt: string;
  model: string;
  durationSeconds: number;
}

export interface PuterTtsOptions {
  provider?: 'aws-polly' | 'openai' | 'elevenlabs' | 'gemini' | 'xai';
  voice?: string;
  engine?: 'standard' | 'neural' | 'generative';
  language?: string;
}

export interface PuterTtsResult {
  audioElement: HTMLAudioElement;
  audioUrl: string;
  voice: string;
  provider: string;
}

export interface PuterSttResult {
  text: string;
  durationSeconds?: number;
}

// ─── STRICT WATERFALL CHAINS (AUTONOMOUS MULTI-TIER ROUTING) ───
// Tier 1: Google Gemini (Extreme Fast, Turbo, Low-Latency)
// Tier 2: OpenAI (Instant fallback when Gemini free tier / quota is exhausted)
// Tier 3: DeepSeek & OpenRouter Free Tier (Unrestricted high-capacity fallback)
export const CHAT_WATERFALL_CHAIN = [
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'openrouter:google/gemini-3.8-flash:free',
  'openrouter:google/gemma-2-9b-it:free',
  'gpt-4o-mini',
  'gpt-4o',
  'deepseek-chat',
  'openrouter:meta-llama/llama-3.3-70b-instruct:free',
  'openrouter:mistralai/mistral-7b-instruct:free',
  'openrouter:google/gemma-4-31b-it:free',
  'openrouter:nvidia/nemotron-3.5-lightning:free',
  'openrouter:cohere/north-mini-code:free',
  'openrouter:openrouter/free',
];

// Image Waterfall: Google Imagen 3 -> Imagen 3.0 -> Imagen 3 Fast -> FLUX.1 -> SD3 -> Puter Flare
export const IMAGE_WATERFALL_CHAIN = [
  'google/imagen-3',
  'imagen-3.0-generate-002',
  'google/imagen-3-fast',
  'black-forest-labs/FLUX.1-schnell',
  'stabilityai/stable-diffusion-3-medium',
  'gpt-image-2.6-flare',
];

// Video Waterfall: BytePlus Seedance -> Wan 2.7 -> Kling -> MiniMax -> Google Veo
export const VIDEO_WATERFALL_CHAIN = [
  'byteplus:seedance',
  'togetherai:wan-ai/wan2.7-t2v',
  'kling',
  'minimax',
  'google:veo',
];

// Voice TTS Waterfall: AWS Polly Neural -> OpenAI TTS
export const TTS_WATERFALL_CHAIN = [
  { provider: 'aws-polly', voice: 'Joanna' },
  { provider: 'aws-polly', voice: 'Matthew' },
  { provider: 'openai', voice: 'alloy' },
  { provider: 'openai', voice: 'nova' },
];

// ─── VERIFIED FREE CHAT MODELS CHAIN (PRIORITIZED FOR EXTREME FAST LOW LATENCY) ───
export const VERIFIED_FREE_CHAT_MODELS = [
  { id: 'gemini-3.8-flash', name: '⚡ Google Gemini 3.8 Flash (Extreme Fast)', category: 'fast' },
  { id: 'gemini-2.5-flash', name: '⚡ Google Gemini 2.5 Flash (Ultra Low-Latency)', category: 'fast' },
  { id: 'gpt-4o-mini', name: '⚡ OpenAI GPT-4o Mini (Instant Turbo)', category: 'fast' },
  { id: 'deepseek-chat', name: '⚡ DeepSeek-V3 Chat (Fast Reasoning)', category: 'reasoning' },
  { id: 'openrouter:meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B (Free Turbo)', category: 'reasoning' },
  { id: 'openrouter:google/gemma-2-9b-it:free', name: 'Google Gemma 2 9B (Free Fast)', category: 'general' },
  { id: 'openrouter:mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free Fast)', category: 'coding' },
  { id: 'openrouter:google/gemma-4-31b-it:free', name: 'Google Gemma 4 31B (Free High-Capacity)', category: 'general' },
  { id: 'openrouter:nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA Nemotron 3.5 Lightning (Free)', category: 'reasoning' },
  { id: 'openrouter:cohere/north-mini-code:free', name: 'Cohere North Mini Code (Free)', category: 'coding' },
  { id: 'openrouter:openrouter/free', name: 'OpenRouter Free Model Router', category: 'general' },
];

// Standard models supported through Puter's generous user allowance
export const PUTER_STANDARD_MODELS = [
  { id: 'gemini-3.8-flash', name: '⚡ Google Gemini 3.8 Flash (Turbo Low-Latency)', category: 'fast' },
  { id: 'gemini-2.5-flash', name: '⚡ Google Gemini 2.5 Flash (Ultra Fast)', category: 'fast' },
  { id: 'gpt-4o-mini', name: '⚡ OpenAI GPT-4o Mini (Instant Response)', category: 'fast' },
  { id: 'deepseek-chat', name: 'DeepSeek-V3 Chat (Fast Reasoning)', category: 'reasoning' },
  { id: 'claude-3-5-sonnet', name: 'Anthropic Claude 3.5 Sonnet', category: 'coding' },
  { id: 'gpt-4o', name: 'OpenAI GPT-4o', category: 'general' },
];

export const PUTER_IMAGE_MODELS = [
  // Google Imagen Models (Ultra Photorealism & High Detail)
  { id: 'google/imagen-3', name: 'Google Imagen 3 (Ultra Photoreal)', isFreeCandidate: true, isImagen: true },
  { id: 'google/imagen-3-fast', name: 'Google Imagen 3 Fast (Turbo Gen)', isFreeCandidate: true, isImagen: true },
  { id: 'imagen-3.0-generate-002', name: 'Google Imagen 3.0 Generate', isFreeCandidate: true, isImagen: true },
  { id: 'google/imagen-2', name: 'Google Imagen 2 Photorealism', isFreeCandidate: false, isImagen: true },

  // FLUX & High-Speed Diffusion
  { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell (Fast Open)', isFreeCandidate: true, isImagen: false },
  { id: 'stabilityai/stable-diffusion-3-medium', name: 'Stable Diffusion 3 Medium', isFreeCandidate: true, isImagen: false },
  { id: 'black-forest-labs/FLUX.1-dev', name: 'FLUX.1 Dev (Ultra Quality)', isFreeCandidate: false, isImagen: false },

  // Standard Puter Image Engines
  { id: 'gpt-image-2.6-flare', name: 'Puter GPT Image Flare (Default)', isFreeCandidate: false, isImagen: false },
  { id: 'gemini-3.1-flash-image', name: 'Google Nano Banana 2 Image', isFreeCandidate: false, isImagen: false },
];

export const PUTER_VIDEO_MODELS = [
  { id: 'byteplus:seedance', name: 'BytePlus Seedance Video (Priority 1)', provider: 'BytePlus' },
  { id: 'togetherai:wan-ai/wan2.7-t2v', name: 'Wan 2.7 Video (Priority 2)', provider: 'Together AI' },
  { id: 'kling', name: 'Kling AI Video (Priority 3)', provider: 'Kling' },
  { id: 'minimax', name: 'MiniMax Video (Priority 4)', provider: 'MiniMax' },
  { id: 'google:veo', name: 'Google Veo Video Preview (Priority 5)', provider: 'Google' },
];

export const PUTER_VOICES = [
  { provider: 'aws-polly', id: 'Joanna', name: 'Joanna (Female, US English)' },
  { provider: 'aws-polly', id: 'Matthew', name: 'Matthew (Male, US English)' },
  { provider: 'aws-polly', id: 'Amy', name: 'Amy (Female, British English)' },
  { provider: 'aws-polly', id: 'Brian', name: 'Brian (Male, British English)' },
  { provider: 'openai', id: 'alloy', name: 'Alloy (Neutral, OpenAI)' },
  { provider: 'openai', id: 'nova', name: 'Nova (Warm Female, OpenAI)' },
  { provider: 'openai', id: 'echo', name: 'Echo (Resonant Male, OpenAI)' },
  { provider: 'openai', id: 'shimmer', name: 'Shimmer (Bright Female, OpenAI)' },
];

class PuterAiPlatformService {
  private cachedModels: PuterModelEntry[] | null = null;
  private isInitializing = false;

  /**
   * Safely returns the live Puter SDK instance (browser window.puter or dynamic Node module).
   */
  public getPuter(): any {
    if (typeof window !== 'undefined' && (window as any).puter) {
      return (window as any).puter;
    }
    if (nodePuterModule) return nodePuterModule;
    if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        const req = typeof require !== 'undefined' ? require : null;
        if (req) {
          nodePuterModule = req('@heyputer/puter.js')?.puter;
          return nodePuterModule;
        }
      } catch {
        // Fallback for isolated unit tests
      }
    }
    return null;
  }

  // ─── 1. AUTHENTICATION & USER MANAGEMENT ───

  public async isSignedIn(): Promise<boolean> {
    try {
      const p = this.getPuter();
      if (!p?.auth) return false;
      return Boolean(p.auth.isSignedIn());
    } catch {
      return false;
    }
  }

  public async getUser(): Promise<PuterUser | null> {
    try {
      const p = this.getPuter();
      if (!p?.auth) return null;
      if (!p.auth.isSignedIn()) return null;
      const user = await p.auth.getUser();
      return user ? { uuid: user.uuid, username: user.username, email: user.email } : null;
    } catch {
      return null;
    }
  }

  /**
   * Signs in user through Puter with automatic guest/temp account support.
   */
  public async signIn(attemptTempUser: boolean = true): Promise<PuterUser | null> {
    const p = this.getPuter();
    if (!p?.auth) {
      throw new Error('Puter.js SDK is not available in current environment.');
    }
    try {
      await p.auth.signIn({ attempt_temp_user_creation: attemptTempUser });
      return await this.getUser();
    } catch (err: any) {
      console.warn('Puter sign in interrupted:', err);
      throw err;
    }
  }

  public async signOut(): Promise<void> {
    try {
      const p = this.getPuter();
      if (p?.auth?.signOut) {
        await p.auth.signOut();
      }
    } catch (err) {
      console.warn('Puter sign out error:', err);
    }
  }

  // ─── 2. DYNAMIC MODEL RETRIEVAL & FREE SELECTION ───

  /**
   * Sanitizes conversation history and prompt into a strictly valid payload
   * conforming to Puter / OpenRouter API constraints (non-empty content, valid roles, no orphan assistant openers).
   */
  public sanitizeChatPayload(
    prompt: string,
    history?: Array<{ role?: string; content?: string }>,
    memories?: AiMemoryItem[],
  ): string | Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    const cleanPrompt = (prompt || '').trim();
    const sanitized: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    // Inject Long-Term Persistent Memory if available
    if (Array.isArray(memories) && memories.length > 0) {
      const memoryText = memories.map((m) => `- ${m.fact}`).join('\n');
      sanitized.push({
        role: 'system',
        content: `You are Master AI, a world-class multimodal supercopilot.\n[LONG-TERM MEMORY BANK - REMEMBER THESE FACTS ABOUT THE USER]:\n${memoryText}`,
      });
    }

    if (Array.isArray(history)) {
      for (const m of history) {
        if (!m || typeof m !== 'object') continue;
        if (typeof m.content !== 'string') continue;
        const text = m.content.trim();
        if (!text) continue; // Skip empty content entirely

        const role = (m.role === 'assistant' || m.role === 'system') ? m.role : 'user';

        // An assistant greeting cannot open the chat history array in OpenAI/OpenRouter APIs
        if (role === 'assistant' && sanitized.length === 0) continue;

        sanitized.push({ role, content: text });
      }
    }

    if (cleanPrompt) {
      sanitized.push({ role: 'user', content: cleanPrompt });
    }

    // If there is only 1 message (or no history), return a simple string prompt for maximum compatibility
    if (sanitized.length <= 1) {
      return sanitized[0]?.content || cleanPrompt || 'Hello';
    }

    // Double check that every element has valid content
    const strictlyValid = sanitized.filter(
      (m) => typeof m.role === 'string' && typeof m.content === 'string' && m.content.length > 0
    );

    if (strictlyValid.length <= 1) {
      return strictlyValid[0]?.content || cleanPrompt || 'Hello';
    }

    return strictlyValid;
  }

  public async listAvailableModels(forceRefresh: boolean = false): Promise<PuterModelEntry[]> {
    if (this.cachedModels && !forceRefresh) {
      return this.cachedModels;
    }

    const p = this.getPuter();
    if (!p?.ai?.listModels) {
      return VERIFIED_FREE_CHAT_MODELS.map((m) => ({
        id: m.id,
        name: m.name,
        provider: 'OpenRouter',
        isFree: true,
      }));
    }

    try {
      const raw = await p.ai.listModels();
      const entries: PuterModelEntry[] = (raw || []).map((m: any) => {
        const hasFreeInId = Boolean(m.id?.includes(':free') || m.puterId?.includes(':free'));
        const inputPrice = m.catalogPricing?.[0]?.prices?.find((pr: any) => pr.type === 'input_token')?.amount;
        const isCostZero = inputPrice === 0 || m.costs?.input === 0 || m.costs?.tokens === 0;
        return {
          id: m.id || m.puterId,
          name: m.name || m.id,
          provider: m.provider || 'unknown',
          description: m.description,
          isFree: hasFreeInId || isCostZero,
          context: m.context || m.maxInputTokens,
          maxTokens: m.max_tokens,
          toolCall: m.tool_call,
        };
      });

      this.cachedModels = entries;
      return entries;
    } catch (err) {
      console.warn('Failed to fetch remote Puter model catalog, using verified fallbacks:', err);
      return VERIFIED_FREE_CHAT_MODELS.map((m) => ({
        id: m.id,
        name: m.name,
        provider: 'OpenRouter',
        isFree: true,
      }));
    }
  }

  public async getVerifiedFreeModels(): Promise<PuterModelEntry[]> {
    const all = await this.listAvailableModels();
    const freeRemote = all.filter((m) => m.isFree);
    if (freeRemote.length > 0) return freeRemote;

    return VERIFIED_FREE_CHAT_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      provider: 'Verified Free',
      isFree: true,
    }));
  }

  // ─── 3. AI CHAT WITH AUTOMATIC CASCADE & WATERFALL ───

  /**
   * Executes AI chat generation using Puter.js with automatic multi-tier waterfall:
   * 1. Google Gemini Tier
   * 2. OpenAI Tier
   * 3. DeepSeek & OpenRouter Free Tier
   */
  public async chat(prompt: string, options: PuterChatOptions = {}): Promise<PuterChatResult> {
    const p = this.getPuter();
    if (!p?.ai?.chat) {
      throw new Error('Puter AI chat is not available in this environment.');
    }

    const requestedModel = options.model || CHAT_WATERFALL_CHAIN[0];
    const fallbackList = Array.from(
      new Set([
        requestedModel,
        ...CHAT_WATERFALL_CHAIN,
      ]),
    );

    const startTime = performance.now();
    let lastError: any = null;
    let fallbackTriggered = false;

    // Build strictly-validated chat payload
    let messagesPayload = this.sanitizeChatPayload(prompt, options.messages, options.memories);

    for (let i = 0; i < fallbackList.length; i++) {
      const candidateModel = fallbackList[i];
      if (i > 0) fallbackTriggered = true;

      try {
        let res: any;
        try {
          if (options.image) {
            res = await (p.ai.chat as any)(prompt.trim(), options.image, {
              model: candidateModel,
              temperature: options.temperature,
              max_tokens: options.max_tokens,
            });
          } else {
            res = await p.ai.chat(messagesPayload, {
              model: candidateModel,
              temperature: options.temperature,
              max_tokens: options.max_tokens,
            });
          }
        } catch (firstErr: any) {
          // If error mentions content or message property, immediately retry this model with plain string prompt
          if (Array.isArray(messagesPayload) && (firstErr?.message?.includes('content') || firstErr?.message?.includes('property'))) {
            console.warn(`[Puter AI] Format warning on "${candidateModel}", retrying with raw prompt.`);
            messagesPayload = prompt.trim();
            res = await p.ai.chat(messagesPayload, {
              model: candidateModel,
              temperature: options.temperature,
              max_tokens: options.max_tokens,
            });
          } else {
            throw firstErr;
          }
        }

        if (res && res.error) {
          throw new Error(res.error.message || res.error);
        }

        const text = typeof res === 'string'
          ? res
          : (res?.message?.content || res?.text || JSON.stringify(res));

        return {
          text,
          modelUsed: candidateModel,
          fallbackTriggered,
          latencyMs: Math.round(performance.now() - startTime),
          isFreeTier: candidateModel.includes(':free') || candidateModel.startsWith('gemini'),
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Puter AI Waterfall] Model "${candidateModel}" failed, switching to next tier:`, err?.message || err);
      }
    }

    throw new Error(
      `All Puter.js AI waterfall models were unavailable or rate-limited. Last error: ${lastError?.message || lastError}`,
    );
  }

  /**
   * Streams chat responses incrementally from Puter.js with Extreme Fast Watchdog & Strict Waterfall:
   * Priority: Google Gemini -> OpenAI -> DeepSeek/OpenRouter Free
   */
  public async *streamChat(
    prompt: string,
    options: PuterChatOptions = {},
  ): AsyncGenerator<string, PuterChatResult, unknown> {
    const p = this.getPuter();
    if (!p?.ai?.chat) {
      throw new Error('Puter AI chat is not available.');
    }

    const requestedModel = options.model || CHAT_WATERFALL_CHAIN[0];
    const fallbackList = Array.from(
      new Set([
        requestedModel,
        ...CHAT_WATERFALL_CHAIN,
      ]),
    );

    const startTime = performance.now();
    let messagesPayload = this.sanitizeChatPayload(prompt, options.messages, options.memories);

    let fullAccumulated = '';
    let successModel = requestedModel;
    let fallbackTriggered = false;
    let lastErr: any = null;

    for (let i = 0; i < fallbackList.length; i++) {
      const candidateModel = fallbackList[i];
      if (i > 0) fallbackTriggered = true;
      fullAccumulated = '';

      let receivedFirstChunk = false;
      let watchdogTimer: any = null;

      try {
        // Fast watchdog: if candidate takes longer than 2200ms to produce first token, fast-fallback
        const watchdogPromise = new Promise<never>((_, reject) => {
          if (i < fallbackList.length - 1) {
            watchdogTimer = setTimeout(() => {
              if (!receivedFirstChunk) {
                reject(
                  new Error(
                    `Watchdog timeout: Model "${candidateModel}" did not respond within 2200ms. Cascading to next tier.`,
                  ),
                );
              }
            }, 2200);
          }
        });

        let chatPromise: Promise<any>;
        try {
          if (options.image) {
            chatPromise = (p.ai.chat as any)(prompt.trim(), options.image, {
              model: candidateModel,
              stream: true,
              temperature: options.temperature ?? 0.3,
              max_tokens: options.max_tokens,
            });
          } else {
            chatPromise = p.ai.chat(messagesPayload, {
              model: candidateModel,
              stream: true,
              temperature: options.temperature ?? 0.3,
              max_tokens: options.max_tokens,
            });
          }
        } catch (syncErr: any) {
          if (Array.isArray(messagesPayload) && (syncErr?.message?.includes('content') || syncErr?.message?.includes('property'))) {
            messagesPayload = prompt.trim();
            chatPromise = p.ai.chat(messagesPayload, {
              model: candidateModel,
              stream: true,
              temperature: options.temperature ?? 0.3,
              max_tokens: options.max_tokens,
            });
          } else {
            throw syncErr;
          }
        }

        let stream: any;
        try {
          stream = await Promise.race([chatPromise, watchdogPromise]);
        } catch (raceErr: any) {
          // If error mentions content property, retry this model with plain string
          if (Array.isArray(messagesPayload) && (raceErr?.message?.includes('content') || raceErr?.message?.includes('property'))) {
            console.warn(`[Puter AI Stream] Format warning on "${candidateModel}", retrying with raw prompt.`);
            messagesPayload = prompt.trim();
            chatPromise = p.ai.chat(messagesPayload, {
              model: candidateModel,
              stream: true,
              temperature: options.temperature ?? 0.3,
              max_tokens: options.max_tokens,
            });
            stream = await Promise.race([chatPromise, watchdogPromise]);
          } else {
            throw raceErr;
          }
        }

        if (stream && stream.error) {
          clearTimeout(watchdogTimer);
          throw new Error(stream.error.message || stream.error);
        }

        // Puter returns an AsyncIterable
        if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
          for await (const chunk of stream) {
            if (options.signal?.aborted) break;
            const piece = chunk?.text ?? chunk?.message?.content ?? (typeof chunk === 'string' ? chunk : '');
            if (piece) {
              if (!receivedFirstChunk) {
                receivedFirstChunk = true;
                clearTimeout(watchdogTimer);
              }
              fullAccumulated += piece;
              options.onChunk?.(piece);
              yield fullAccumulated;
            }
          }
        } else {
          clearTimeout(watchdogTimer);
          const staticText = typeof stream === 'string' ? stream : (stream?.message?.content || stream?.text || '');
          fullAccumulated = staticText;
          yield fullAccumulated;
        }

        clearTimeout(watchdogTimer);

        if (fullAccumulated.trim().length > 0) {
          successModel = candidateModel;
          return {
            text: fullAccumulated,
            modelUsed: successModel,
            fallbackTriggered,
            latencyMs: Math.round(performance.now() - startTime),
            isFreeTier: successModel.includes(':free') || successModel.startsWith('gemini') || successModel.includes('mini'),
          };
        }
      } catch (err: any) {
        clearTimeout(watchdogTimer);
        lastErr = err;
        console.warn(`[Puter AI Waterfall] Model "${candidateModel}" failed/timed out, fast-switching:`, err?.message || err);
      }
    }

    throw new Error(`Puter streaming failed across waterfall models. Last error: ${lastErr?.message || lastErr}`);
  }

  // ─── 4. AI IMAGE GENERATION (GOOGLE IMAGEN 3 WATERFALL) ───

  /**
   * Generates images using Puter.js txt2img with strict multi-tier fallback:
   * 1. Google Imagen 3 (Ultra Photoreal)
   * 2. Google Imagen 3.0 Generate
   * 3. Google Imagen 3 Fast
   * 4. FLUX.1 Schnell
   * 5. Stable Diffusion 3 Medium
   * 6. Puter GPT Image Flare
   */
  public async generateImage(prompt: string, options: PuterImageOptions = {}): Promise<PuterImageResult> {
    const p = this.getPuter();
    if (!p?.ai?.txt2img) {
      throw new Error('Puter AI Image Generation (txt2img) is not available.');
    }

    const cleanPrompt = prompt.trim();
    const aspectRatio = options.aspect_ratio || '1:1';

    const candidates = Array.from(
      new Set([
        ...(options.model ? [options.model] : []),
        ...IMAGE_WATERFALL_CHAIN,
      ]),
    );

    let lastErr: any = null;

    for (const modelCandidate of candidates) {
      const opts: any = {
        model: modelCandidate,
        aspect_ratio: aspectRatio,
        testMode: false, // Strict requirement: Real generation only
      };

      if (options.width && options.height) {
        opts.width = options.width;
        opts.height = options.height;
      }
      if (options.input_image) {
        opts.input_image = options.input_image;
      }
      if (options.negative_prompt) {
        opts.negative_prompt = options.negative_prompt;
      }

      try {
        console.log(`[Puter Image Waterfall] Generating image with model: ${modelCandidate}`);
        const result = await p.ai.txt2img(cleanPrompt, opts);
        let imageUrl = '';
        if (typeof result === 'string') {
          imageUrl = result;
        } else if (result?.src) {
          imageUrl = result.src;
        } else if (result instanceof HTMLImageElement) {
          imageUrl = result.src;
        } else if (result instanceof Blob) {
          imageUrl = URL.createObjectURL(result);
        } else {
          imageUrl = String(result);
        }

        if (imageUrl) {
          return {
            imageUrl,
            prompt: cleanPrompt,
            model: modelCandidate,
            aspectRatio,
            source: 'puter-txt2img',
          };
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Puter Image Waterfall] Model "${modelCandidate}" failed, falling back to next:`, err?.message || err);
      }
    }

    throw lastErr || new Error('Image generation failed across all available waterfall models.');
  }

  // ─── 5. AI VIDEO GENERATION (BYTEPLUS SEEDANCE WATERFALL) ───

  /**
   * Generates video clips using Puter.js txt2vid with strict multi-tier fallback:
   * 1. BytePlus Seedance Video
   * 2. Wan 2.7 Video
   * 3. Kling AI Video
   * 4. MiniMax Video
   * 5. Google Veo Video Preview
   */
  public async generateVideo(prompt: string, options: PuterVideoOptions = {}): Promise<PuterVideoResult> {
    const p = this.getPuter();
    if (!p?.ai?.txt2vid) {
      throw new Error('Puter AI Video Generation (txt2vid) is not available.');
    }

    const cleanPrompt = prompt.trim();
    const duration = options.duration || 3;
    const size = options.size || '1280x720';

    const candidates = Array.from(
      new Set([
        ...(options.model ? [options.model] : []),
        ...VIDEO_WATERFALL_CHAIN,
      ]),
    );

    let lastErr: any = null;

    for (const modelCandidate of candidates) {
      options.onProgress?.(`Synthesizing motion frames with ${modelCandidate}...`);

      const opts: any = {
        model: modelCandidate,
        duration,
        size,
        testMode: false, // Strict requirement: Real video generation
      };

      if (options.input_image) {
        opts.input_image = options.input_image;
      }

      try {
        console.log(`[Puter Video Waterfall] Generating video with model: ${modelCandidate}`);
        const result = await p.ai.txt2vid(cleanPrompt, opts);

        let videoUrl = '';
        if (typeof result === 'string') {
          videoUrl = result;
        } else if (result?.src) {
          videoUrl = result.src;
        } else if (result instanceof HTMLVideoElement) {
          videoUrl = result.src;
        } else if (result instanceof Blob) {
          videoUrl = URL.createObjectURL(result);
        } else {
          videoUrl = String(result);
        }

        if (videoUrl) {
          options.onProgress?.(`Video generation complete via ${modelCandidate}!`);
          return {
            videoUrl,
            prompt: cleanPrompt,
            model: modelCandidate,
            durationSeconds: duration,
          };
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Puter Video Waterfall] Model "${modelCandidate}" failed, falling back to next:`, err?.message || err);
      }
    }

    throw lastErr || new Error('Video generation failed across all waterfall models.');
  }

  // ─── 6. AI SPEECH & AUDIO (AWS POLLY -> OPENAI WATERFALL) ───

  /**
   * Converts text to speech using Puter.js txt2speech with AWS Polly -> OpenAI TTS fallback.
   */
  public async textToSpeech(text: string, options: PuterTtsOptions = {}): Promise<PuterTtsResult> {
    const p = this.getPuter();
    if (!p?.ai?.txt2speech) {
      throw new Error('Puter AI Text-to-Speech (txt2speech) is not available.');
    }

    const candidates = [
      { provider: options.provider || 'aws-polly', voice: options.voice || 'Joanna' },
      { provider: 'aws-polly', voice: 'Matthew' },
      { provider: 'openai', voice: 'alloy' },
      { provider: 'openai', voice: 'nova' },
    ];

    let lastErr: any = null;

    for (const c of candidates) {
      const opts: any = {
        provider: c.provider,
        voice: c.voice,
        testMode: false,
      };

      if (options.engine) opts.engine = options.engine;
      if (options.language) opts.language = options.language;

      try {
        const audioResult = await p.ai.txt2speech(text, opts);

        let audioElement: HTMLAudioElement;
        let audioUrl = '';

        if (audioResult instanceof HTMLAudioElement) {
          audioElement = audioResult;
          audioUrl = audioElement.src;
        } else if (audioResult?.src) {
          audioUrl = audioResult.src;
          audioElement = new Audio(audioUrl);
        } else if (audioResult instanceof Blob) {
          audioUrl = URL.createObjectURL(audioResult);
          audioElement = new Audio(audioUrl);
        } else if (typeof audioResult === 'string') {
          audioUrl = audioResult;
          audioElement = new Audio(audioUrl);
        } else {
          audioElement = new Audio();
        }

        return {
          audioElement,
          audioUrl,
          voice: c.voice,
          provider: c.provider,
        };
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Puter TTS Waterfall] ${c.provider}:${c.voice} failed, falling back:`, err?.message || err);
      }
    }

    throw lastErr || new Error('TTS failed across all fallback providers.');
  }

  /**
   * Transcribes speech audio to text using Puter.js speech2txt.
   */
  public async speechToText(audioSource: Blob | File | string): Promise<PuterSttResult> {
    const p = this.getPuter();
    if (!p?.ai?.speech2txt) {
      throw new Error('Puter AI Speech-to-Text (speech2txt) is not available.');
    }

    try {
      const res = await p.ai.speech2txt(audioSource);
      const text = typeof res === 'string' ? res : (res?.text || JSON.stringify(res));
      return {
        text,
        durationSeconds: res?.duration,
      };
    } catch (err: any) {
      console.error('[Puter STT] Speech transcription failed:', err);
      throw err;
    }
  }

  /**
   * Enhances and polishes a user prompt using AI magic wand.
   * Expands visual descriptions for Imagen/Seedance and refines logical clarity for coding.
   */
  public async polishPrompt(rawPrompt: string): Promise<string> {
    if (!rawPrompt || !rawPrompt.trim()) return rawPrompt;
    const metaPrompt = `You are a world-class AI prompt engineer. Refine and enhance the following user prompt for maximum output quality, photorealism (if describing an image or video), or structural precision (if asking a question or coding task).
Rules:
1. Preserve the user's core intent. If in Sinhala or Singlish, keep appropriate Sinhala context or translate visual keywords into vivid descriptive English for image/video models.
2. For visual image/video generation requests, enrich with cinematic lighting, camera perspective, texture, and 8k detail.
3. Return ONLY the enhanced prompt string. Do not include quotes, greetings, or explanations.

Prompt to polish:
"${rawPrompt.trim()}"`;

    try {
      const res = await this.chat(metaPrompt, {
        temperature: 0.7,
        max_tokens: 250,
      });
      const cleaned = res.text.replace(/^["']|["']$/g, '').trim();
      return cleaned || rawPrompt;
    } catch {
      return rawPrompt;
    }
  }

  /**
   * Retrieves long-term persistent memories stored across sessions.
   */
  public getMemories(): AiMemoryItem[] {
    try {
      const raw = localStorage.getItem('master_ai_long_term_memories');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Saves a persistent memory fact.
   */
  public saveMemory(
    fact: string,
    category: 'user_profile' | 'preference' | 'project' | 'custom' = 'custom',
  ): AiMemoryItem {
    const list = this.getMemories();
    const item: AiMemoryItem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fact: fact.trim(),
      category,
      createdAt: new Date().toISOString(),
    };
    const updated = [item, ...list.slice(0, 49)];
    try {
      localStorage.setItem('master_ai_long_term_memories', JSON.stringify(updated));
    } catch {}
    return item;
  }

  /**
   * Deletes a persistent memory fact by ID.
   */
  public deleteMemory(id: string): void {
    const list = this.getMemories().filter((m) => m.id !== id);
    try {
      localStorage.setItem('master_ai_long_term_memories', JSON.stringify(list));
    } catch {}
  }
}

export const puterAiService = new PuterAiPlatformService();
