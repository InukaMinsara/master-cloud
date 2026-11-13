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

export interface PuterChatOptions {
  model?: string;
  stream?: boolean;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
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

// ─── VERIFIED FREE CHAT MODELS CHAIN (PRIORITIZED) ───
export const VERIFIED_FREE_CHAT_MODELS = [
  { id: 'openrouter:google/gemma-4-31b-it:free', name: 'Google Gemma 4 31B (Free)', category: 'general' },
  { id: 'openrouter:nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA Nemotron 3.5 Lightning (Free)', category: 'reasoning' },
  { id: 'openrouter:cohere/north-mini-code:free', name: 'Cohere North Mini Code (Free)', category: 'coding' },
  { id: 'openrouter:nvidia/nemotron-3.5-super-vl:free', name: 'NVIDIA Nemotron 3.5 Super VL (Free)', category: 'vision' },
  { id: 'infron:qwen/qwen3.8-27b:free', name: 'Qwen 3.8 27B Uncensored (Free)', category: 'general' },
  { id: 'openrouter:google/gemma-4-26b-a4b-it:free', name: 'Google Gemma 4 26B A4B (Free)', category: 'general' },
  { id: 'openrouter:baidu/ernie-5.5-flash-preview:free', name: 'Baidu ERNIE 5.5 Flash (Free)', category: 'general' },
  { id: 'openrouter:openrouter/free', name: 'OpenRouter Free Model Router', category: 'general' },
];

// Standard models supported through Puter's generous user allowance
export const PUTER_STANDARD_MODELS = [
  { id: 'claude-3-5-sonnet', name: 'Anthropic Claude 3.5 Sonnet', category: 'coding' },
  { id: 'gpt-4o', name: 'OpenAI GPT-4o', category: 'general' },
  { id: 'gpt-4o-mini', name: 'OpenAI GPT-4o Mini', category: 'fast' },
  { id: 'gemini-2.5-flash', name: 'Google Gemini 2.5 Flash', category: 'fast' },
  { id: 'deepseek-chat', name: 'DeepSeek-V3 Chat', category: 'reasoning' },
];

export const PUTER_IMAGE_MODELS = [
  { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell (Fast Open)', isFreeCandidate: true },
  { id: 'stabilityai/stable-diffusion-3-medium', name: 'Stable Diffusion 3 Medium', isFreeCandidate: true },
  { id: 'gpt-image-2.6-flare', name: 'Puter GPT Image Flare (Default)', isFreeCandidate: false },
  { id: 'gemini-3.1-flash-image', name: 'Google Nano Banana 2 Image', isFreeCandidate: false },
  { id: 'black-forest-labs/FLUX.1-dev', name: 'FLUX.1 Dev (Ultra Quality)', isFreeCandidate: false },
];

export const PUTER_VIDEO_MODELS = [
  { id: 'togetherai:wan-ai/wan2.7-t2v', name: 'Wan 2.7 Video (Default)', provider: 'Together AI' },
  { id: 'byteplus:seedance', name: 'BytePlus Seedance Video', provider: 'BytePlus' },
  { id: 'google:veo', name: 'Google Veo Video Preview', provider: 'Google' },
  { id: 'kling', name: 'Kling AI Video', provider: 'Kling' },
  { id: 'minimax', name: 'MiniMax Video', provider: 'MiniMax' },
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
  private sanitizeChatPayload(
    prompt: string,
    history?: Array<{ role?: string; content?: string }>,
  ): string | Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    const cleanPrompt = (prompt || '').trim();
    const sanitized: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    if (Array.isArray(history)) {
      for (const m of history) {
        if (!m || typeof m.content !== 'string') continue;
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

    return sanitized;
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

  // ─── 3. AI CHAT WITH AUTOMATIC FALLBACK & STREAMING ───

  /**
   * Executes AI chat generation using Puter.js with automatic free model fallback.
   */
  public async chat(prompt: string, options: PuterChatOptions = {}): Promise<PuterChatResult> {
    const p = this.getPuter();
    if (!p?.ai?.chat) {
      throw new Error('Puter AI chat is not available in this environment.');
    }

    // Determine initial candidate model
    const requestedModel = options.model || VERIFIED_FREE_CHAT_MODELS[0].id;
    const fallbackList = [
      requestedModel,
      ...VERIFIED_FREE_CHAT_MODELS.map((m) => m.id).filter((id) => id !== requestedModel),
      'gpt-4o-mini',
      'claude-3-5-sonnet',
    ];

    const startTime = performance.now();
    let lastError: any = null;
    let fallbackTriggered = false;

    // Build strictly-validated chat payload
    const messagesPayload = this.sanitizeChatPayload(prompt, options.messages);

    for (let i = 0; i < fallbackList.length; i++) {
      const candidateModel = fallbackList[i];
      if (i > 0) fallbackTriggered = true;

      try {
        const res = await p.ai.chat(messagesPayload, {
          model: candidateModel,
          temperature: options.temperature,
          max_tokens: options.max_tokens,
        });

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
          isFreeTier: candidateModel.includes(':free'),
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Puter AI] Model "${candidateModel}" failed, attempting fallback:`, err?.message || err);
      }
    }

    throw new Error(
      `All Puter.js AI candidate models were unavailable or rate-limited. Last error: ${lastError?.message || lastError}`,
    );
  }

  /**
   * Streams chat responses incrementally from Puter.js.
   */
  public async *streamChat(
    prompt: string,
    options: PuterChatOptions = {},
  ): AsyncGenerator<string, PuterChatResult, unknown> {
    const p = this.getPuter();
    if (!p?.ai?.chat) {
      throw new Error('Puter AI chat is not available.');
    }

    const requestedModel = options.model || VERIFIED_FREE_CHAT_MODELS[0].id;
    const fallbackList = [
      requestedModel,
      ...VERIFIED_FREE_CHAT_MODELS.map((m) => m.id).filter((id) => id !== requestedModel),
      'gpt-4o-mini',
    ];

    const startTime = performance.now();
    const messagesPayload = this.sanitizeChatPayload(prompt, options.messages);

    let fullAccumulated = '';
    let successModel = requestedModel;
    let fallbackTriggered = false;
    let lastErr: any = null;

    for (let i = 0; i < fallbackList.length; i++) {
      const candidateModel = fallbackList[i];
      if (i > 0) fallbackTriggered = true;
      fullAccumulated = '';

      try {
        const stream = await p.ai.chat(messagesPayload, {
          model: candidateModel,
          stream: true,
          temperature: options.temperature,
          max_tokens: options.max_tokens,
        });

        if (stream && stream.error) {
          throw new Error(stream.error.message || stream.error);
        }

        // Puter returns an AsyncIterable
        if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
          for await (const chunk of stream) {
            if (options.signal?.aborted) break;
            const piece = chunk?.text ?? chunk?.message?.content ?? (typeof chunk === 'string' ? chunk : '');
            if (piece) {
              fullAccumulated += piece;
              options.onChunk?.(piece);
              yield fullAccumulated;
            }
          }
        } else {
          // Non-streaming fallback response
          const staticText = typeof stream === 'string' ? stream : (stream?.message?.content || stream?.text || '');
          fullAccumulated = staticText;
          yield fullAccumulated;
        }

        successModel = candidateModel;
        return {
          text: fullAccumulated,
          modelUsed: successModel,
          fallbackTriggered,
          latencyMs: Math.round(performance.now() - startTime),
          isFreeTier: successModel.includes(':free'),
        };
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Puter AI Stream] Model "${candidateModel}" failed:`, err?.message || err);
      }
    }

    throw new Error(`Puter streaming failed across candidates. Last error: ${lastErr?.message || lastErr}`);
  }

  // ─── 4. AI IMAGE GENERATION & EDITING ───

  /**
   * Generates or edits an image using Puter.js txt2img.
   * Real generation only; testMode is strictly set to false.
   */
  public async generateImage(prompt: string, options: PuterImageOptions = {}): Promise<PuterImageResult> {
    const p = this.getPuter();
    if (!p?.ai?.txt2img) {
      throw new Error('Puter AI Image Generation (txt2img) is not available.');
    }

    const modelToUse = options.model || 'black-forest-labs/FLUX.1-schnell';
    const aspectRatio = options.aspect_ratio || '1:1';

    const opts: any = {
      model: modelToUse,
      aspect_ratio: aspectRatio,
      testMode: false, // Strict requirement: Never substitute test mode for real generation
    };

    if (options.width && options.height) {
      opts.width = options.width;
      opts.height = options.height;
    }

    if (options.input_image) {
      opts.input_image = options.input_image;
    }

    try {
      const result = await p.ai.txt2img(prompt, opts);

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

      return {
        imageUrl,
        prompt,
        model: modelToUse,
        aspectRatio,
        source: 'puter-txt2img',
      };
    } catch (err: any) {
      // Fallback to FLUX Schnell or default image model if primary fails
      if (modelToUse !== 'gpt-image-2.6-flare') {
        console.warn(`[Puter Image] Model "${modelToUse}" failed, falling back to default image model:`, err);
        opts.model = 'gpt-image-2.6-flare';
        const fallbackRes = await p.ai.txt2img(prompt, opts);
        const imageUrl = fallbackRes?.src || (fallbackRes instanceof Blob ? URL.createObjectURL(fallbackRes) : String(fallbackRes));
        return {
          imageUrl,
          prompt,
          model: 'gpt-image-2.6-flare',
          aspectRatio,
          source: 'puter-txt2img',
        };
      }
      throw err;
    }
  }

  // ─── 5. AI VIDEO GENERATION ───

  /**
   * Generates video clips using Puter.js txt2vid.
   * Real video generation; testMode is strictly set to false.
   */
  public async generateVideo(prompt: string, options: PuterVideoOptions = {}): Promise<PuterVideoResult> {
    const p = this.getPuter();
    if (!p?.ai?.txt2vid) {
      throw new Error('Puter AI Video Generation (txt2vid) is not available.');
    }

    const modelToUse = options.model || 'togetherai:wan-ai/wan2.7-t2v';
    const duration = options.duration || 3;
    const size = options.size || '1280x720';

    options.onProgress?.('Initializing Puter video pipeline...');

    const opts: any = {
      model: modelToUse,
      duration,
      size,
      testMode: false, // Strict requirement: real generation
    };

    if (options.input_image) {
      opts.input_image = options.input_image;
    }

    options.onProgress?.(`Synthesizing motion frames with model ${modelToUse}...`);

    try {
      const result = await p.ai.txt2vid(prompt, opts);

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

      options.onProgress?.('Video generation complete!');

      return {
        videoUrl,
        prompt,
        model: modelToUse,
        durationSeconds: duration,
      };
    } catch (err: any) {
      console.error('[Puter Video] Video generation failed:', err);
      throw err;
    }
  }

  // ─── 6. AI SPEECH & AUDIO ───

  /**
   * Converts text to speech using Puter.js txt2speech.
   */
  public async textToSpeech(text: string, options: PuterTtsOptions = {}): Promise<PuterTtsResult> {
    const p = this.getPuter();
    if (!p?.ai?.txt2speech) {
      throw new Error('Puter AI Text-to-Speech (txt2speech) is not available.');
    }

    const provider = options.provider || 'aws-polly';
    const voice = options.voice || 'Joanna';

    const opts: any = {
      provider,
      voice,
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
        voice,
        provider,
      };
    } catch (err: any) {
      console.error('[Puter TTS] Speech synthesis failed:', err);
      throw err;
    }
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
}

export const puterAiService = new PuterAiPlatformService();
