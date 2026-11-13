/**
 * MASTER CLOUD — MasterAI Autonomous Media Intelligence Engine
 * 
 * Proprietary dual-engine AI built specifically for MASTER CLOUD Video Player:
 * 1. Master Local Neural AI: 100% client-side, offline, private, zero-latency
 *    semantic reasoning, intent classification, chaptering, and dialogue search.
 * 2. Master Cloud Gemini AI: Optional supercharged multimodal generative intelligence
 *    via direct Google Gemini API (gemini-2.5-flash / gemini-1.5-flash).
 */

import { SubtitleCue } from './subtitleParser';
import { DetectedScene, MediaBookmark } from './mediaMetadataDb';
import { localKnowledgeEngine } from './ai/localKnowledgeEngine';
import {
  toolAssistedOrchestrator,
  ToolAssistedProcessOptions,
  ToolAssistedResponse,
} from './ai/toolAssistedLocalMode';
import {
  ChatSourceBadge,
  LanguagePreferenceMode,
  StoredChatMessage,
} from './ai/conversationMemory';
import {
  NeuralGenerationConfig,
} from './ai/neuralRuntime';
import { cloudBrainManager } from './ai/cloudBrain';
import { BrainLayer, modelRegistry } from './ai/modelRegistry';
import {
  originalBrainController,
  ParallelCandidateResult,
} from './ai/originalBrainController';

export interface VideoAIContext {
  fileName: string;
  duration: number;
  currentTime: number;
  resolution?: { width: number; height: number } | null;
  fileSize?: number;
  container?: string;
  cues: SubtitleCue[];
  scenes: DetectedScene[];
  bookmarks: MediaBookmark[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  suggestedAction?: {
    type: 'seek' | 'apply_chapters' | 'copy_summary';
    label: string;
    payload?: any;
  };
  matchedTimestamps?: { time: number; label: string }[];
  sourcesUsed?: ChatSourceBadge[];
  sourceLabel?: string;
  modelTag?: string;
  brainUsed?: BrainLayer;
  confidenceScore?: number;
  validationWarnings?: string[];
  rememberedMemoriesCount?: number;
  orchestrationTrace?: string[];
  fallbackTriggered?: boolean;
  estimatedCostUsd?: number;
  parallelAlternatives?: ParallelCandidateResult[];
  tokensGenerated?: number;
  latencyMs?: number;
  promptTokens?: number;
  maxContextTokens?: number;
  compressedNotice?: string | null;
  isStreaming?: boolean;
  editedFromId?: string;
}

export interface LocalChatOptions {
  signal?: AbortSignal;
  onProgress?: (partialText: string, generatedTokens: number) => void;
  languageMode?: LanguagePreferenceMode;
  genConfig?: Partial<NeuralGenerationConfig>;
  pureNeuralOnly?: boolean;
  manualModelId?: string | null;
  sessionId?: string;
  enableParallelComparison?: boolean;
}

export interface AIChapterSuggestion {
  start: number;
  end: number;
  title: string;
  description: string;
}

export interface AISummaryResponse {
  title: string;
  executiveSummary: string;
  keyTakeaways: string[];
  speechPacing: {
    wpm: number;
    density: 'Fast-paced' | 'Moderate / Conversational' | 'Slow / Deliberate' | 'Silent / Instrumental';
    totalWords: number;
  };
  audioProfile: string;
  technicalVerdict: string;
}

export interface AIPacingAnalysis {
  speechRateWpm: number;
  pacingRating: string;
  dialogueCoveragePercent: number;
  quietIntervalsCount: number;
  recommendedEqPreset: string;
}

// ---------------------------------------------------------------------------
// Stopwords & Semantic Dictionary for Local Neural Processing
// ---------------------------------------------------------------------------
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
  'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
  'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export class MasterAiEngine {
  private static instance: MasterAiEngine;
  
  /**
   * Ephemeral In-Memory Protection:
   * Uses an ECMAScript private field (#geminiApiKey) enforced at the JavaScript engine runtime level.
   * - Never written to localStorage, sessionStorage, IndexedDB, cookies, or persisted on disk.
   * - Wiped immediately upon browser tab closure or page reload.
   * - Transmitted strictly via 'x-goog-api-key' HTTP header (never in URL query parameters).
   * 
   * Security Boundary Note:
   * While in-memory isolation protects against forensic disk extraction and cross-session persistence,
   * any hostile script executing inside the same origin (XSS vulnerability) could potentially access
   * volatile memory. For zero-trust enterprise deployments, server-side gateway proxying (aiGateway.ts)
   * must be utilized.
   */
  #geminiApiKey: string | null = null;
  private mode: 'local' | 'cloud' = 'local';
  private selectedModel = 'gemini-2.5-flash';

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        // Active Security Purge: Clean up any legacy keys from localStorage or sessionStorage
        localStorage.removeItem('master_cloud_gemini_api_key');
        sessionStorage.removeItem('master_cloud_gemini_api_key_session');
        const savedMode = localStorage.getItem('master_cloud_ai_mode') as 'local' | 'cloud' | null;
        if (savedMode) this.mode = savedMode;
      } catch {
        // Ignore environments where storage access is restricted
      }
    }
  }

  public static getInstance(): MasterAiEngine {
    if (!MasterAiEngine.instance) {
      MasterAiEngine.instance = new MasterAiEngine();
    }
    return MasterAiEngine.instance;
  }

  public getMode(): 'local' | 'cloud' {
    return this.mode;
  }

  public setMode(mode: 'local' | 'cloud'): void {
    this.mode = mode;
    cloudBrainManager.updatePrivacyPolicy({
      allowCloudProcessing: mode === 'cloud',
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('master_cloud_ai_mode', mode);
    }
  }

  public getApiKey(): string | null {
    return this.#geminiApiKey || cloudBrainManager.getProviderApiKey('gemini');
  }

  public setApiKey(key: string): void {
    const clean = key.trim() || null;
    this.#geminiApiKey = clean;
    cloudBrainManager.setProviderApiKey('gemini', clean);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('master_cloud_gemini_api_key');
        sessionStorage.removeItem('master_cloud_gemini_api_key_session');
      } catch {
        // Ignore
      }
    }
  }

  public setModel(model: string): void {
    this.selectedModel = model;
  }

  // -------------------------------------------------------------------------
  // Main Interactive Chat Interface — Powered by MASTER AI CORE v2.0 (Three-Brain)
  // -------------------------------------------------------------------------
  public async chat(
    userQuery: string,
    context: VideoAIContext,
    history: ChatMessage[] = [],
    options: LocalChatOptions = {},
  ): Promise<ChatMessage> {
    const query = userQuery.trim();
    if (!query) {
      return {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: 'Please ask a question in Sinhala, English, or Mixed language, or choose one of the quick actions below.',
        timestamp: Date.now(),
        sourcesUsed: ['neural_core'],
        sourceLabel: 'Brain A · MASTER AI v2.0',
        brainUsed: 'original',
      };
    }

    const qLower = query.toLowerCase();
    const storedHistory = this.toStoredHistory(history);

    // Explicit deterministic media UI card commands (only when not Pure Neural and not overridden)
    if (!options.pureNeuralOnly && (!options.manualModelId || options.manualModelId === 'auto')) {
      if (/^(generate|create|make)\s+(smart\s+)?chapters\b/i.test(qLower)) {
        const chapters = this.generateSmartChapters(context);
        const timestamps = chapters.map((ch) => ({ time: ch.start, label: ch.title }));
        let text = `### 🎬 MasterAI Deterministic Chapter Breakdown\n\nAnalyzed **${context.fileName}** (${formatTimestamp(context.duration)}) across visual cuts and caption shifts:\n\n`;
        chapters.forEach((ch) => {
          text += `- **[${formatTimestamp(ch.start)}] ${ch.title}**: ${ch.description}\n`;
        });
        text += `\nClick any timestamp or **"Apply to Timeline"** below.`;
        return {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text,
          timestamp: Date.now(),
          matchedTimestamps: timestamps,
          sourcesUsed: ['deterministic_calc'],
          sourceLabel: 'Brain A · Deterministic Chapter Builder',
          brainUsed: 'original',
          suggestedAction: { type: 'apply_chapters', label: 'Apply to Timeline', payload: chapters },
        };
      }

      if (/^(summarize this video|summarize video|executive summary)\b/i.test(qLower)) {
        const summary = this.generateExecutiveSummary(context);
        let text = `### 📝 Local Media Summary for *${context.fileName}*\n\n${summary.executiveSummary}\n\n#### Key Observations:\n`;
        summary.keyTakeaways.forEach((k) => {
          text += `- ${k}\n`;
        });
        text += `\n**Speech Pacing**: ${summary.speechPacing.wpm} WPM (${summary.speechPacing.density}) across ${summary.speechPacing.totalWords} words.`;
        return {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text,
          timestamp: Date.now(),
          sourcesUsed: context.cues.length > 0 ? ['transcript_grounding', 'deterministic_calc'] : ['deterministic_calc'],
          sourceLabel: context.cues.length > 0 ? 'Brain A · Transcript + Media Stats' : 'Brain A · Deterministic Media Stats',
          brainUsed: 'original',
          suggestedAction: { type: 'copy_summary', label: 'Copy Summary', payload: text },
        };
      }

      if (/^(analyze speech pacing|speech pacing)\b/i.test(qLower)) {
        const pacing = this.analyzePacingAndMood(context);
        const text =
          `### 🎙️ Deterministic Speech & Pacing Analysis\n\n` +
          `- **Average Speech Rate**: **${pacing.speechRateWpm} WPM** (${pacing.pacingRating})\n` +
          `- **Dialogue Coverage**: **${pacing.dialogueCoveragePercent}%**\n` +
          `- **Quiet / Instrumental Intervals**: **${pacing.quietIntervalsCount}**\n` +
          `- **Suggested EQ Preset**: **${pacing.recommendedEqPreset}**`;
        return {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text,
          timestamp: Date.now(),
          sourcesUsed: ['deterministic_calc'],
          sourceLabel: 'Brain A · Deterministic Pacing Analyzer',
          brainUsed: 'original',
        };
      }
    }

    // Legacy `cloud` mode + `selectedModel` honored cleanly when no v2 manual override passed
    const resolvedManualModel =
      options.manualModelId ??
      (options.pureNeuralOnly
        ? 'master-ai-v1-onnx'
        : this.mode === 'cloud' && this.getApiKey()
          ? modelRegistry.getModel(`gemini:${this.selectedModel}`)?.id || 'gemini:gemini-2.5-flash'
          : null);

    const offlineOnly = this.mode === 'local' && !cloudBrainManager.getPrivacyPolicy().allowCloudProcessing;

    const orch = await originalBrainController.processQuery({
      query,
      history: storedHistory,
      sessionId: options.sessionId,
      mediaContext: context,
      languageMode: options.languageMode,
      manualModelId: resolvedManualModel,
      offlineOnly,
      pureNeuralOnly: options.pureNeuralOnly,
      enableParallelComparison: options.enableParallelComparison,
      temperature: options.genConfig?.temperature,
      topP: options.genConfig?.topP,
      topK: options.genConfig?.topK,
      maxTokens: options.genConfig?.maxNewTokens,
      repetitionPenalty: options.genConfig?.repetitionPenalty,
      signal: options.signal,
      onProgress: options.onProgress,
    });

    return {
      id: `ai_${Date.now()}`,
      sender: 'ai',
      text: orch.text,
      timestamp: Date.now(),
      matchedTimestamps: orch.matchedTimestamps,
      suggestedAction: orch.suggestedAction as ChatMessage['suggestedAction'],
      sourcesUsed: orch.sourcesUsed,
      sourceLabel: orch.sourceLabel,
      modelTag: orch.modelName,
      brainUsed: orch.brainUsed,
      confidenceScore: orch.validation.confidenceScore,
      validationWarnings: orch.validation.warnings,
      rememberedMemoriesCount: orch.rememberedMemories.length,
      orchestrationTrace: orch.orchestrationTrace,
      fallbackTriggered: orch.fallbackTriggered,
      estimatedCostUsd: orch.estimatedCostUsd,
      parallelAlternatives: orch.parallelAlternatives,
      tokensGenerated: orch.tokensGenerated,
      latencyMs: orch.latencyMs,
      promptTokens: orch.promptTokens,
      maxContextTokens: orch.maxContextTokens,
      compressedNotice: orch.compressedNotice,
    };
  }

  /**
   * Transparent Tool-Assisted Local Mode (v1.0):
   * Coordinates verified document retrieval, transcript grounding, deterministic media math,
   * and original neural dialogue via real client-side ONNX Runtime Web.
   */
  public async processToolAssistedQuery(
    userQuery: string,
    context: VideoAIContext,
    options: ToolAssistedProcessOptions = {},
  ): Promise<ToolAssistedResponse> {
    return toolAssistedOrchestrator.processQuery(userQuery, context, options);
  }

  private toStoredHistory(history: ChatMessage[]): StoredChatMessage[] {
    return history.map((m) => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp,
      sourcesUsed: m.sourcesUsed,
      sourceLabel: m.sourceLabel,
      modelTag: m.modelTag,
      tokensGenerated: m.tokensGenerated,
      latencyMs: m.latencyMs,
      matchedTimestamps: m.matchedTimestamps,
    }));
  }

  // -------------------------------------------------------------------------
  // Helper: Extract [mm:ss] timestamps from AI response text
  // -------------------------------------------------------------------------
  public extractTimestampsFromText(text: string): { time: number; label: string }[] {
    const regex = /\[(\d{1,2}):(\d{2})\]/g;
    const list: { time: number; label: string }[] = [];
    const seenTimes = new Set<number>();

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const totalSeconds = mins * 60 + secs;

      if (!seenTimes.has(totalSeconds)) {
        seenTimes.add(totalSeconds);
        list.push({
          time: totalSeconds,
          label: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
        });
      }
    }
    return list;
  }

  // -------------------------------------------------------------------------
  // Smart Chapter Generator
  // -------------------------------------------------------------------------
  public generateSmartChapters(context: VideoAIContext): AIChapterSuggestion[] {
    const duration = context.duration > 0 ? context.duration : 600;
    const chapters: AIChapterSuggestion[] = [];

    // If visual scenes were detected, synthesize chapters around scene boundaries
    if (context.scenes.length >= 2) {
      context.scenes.forEach((s, idx) => {
        // Find dialogue cues in this scene
        const sceneCues = context.cues.filter((c) => c.start >= s.start && c.start <= s.end);
        let title = s.label || `Part ${idx + 1}`;
        let description = `Visual transition at ${formatTimestamp(s.start)}.`;

        if (sceneCues.length > 0) {
          const topWords = this.getTopWordsFromCues(sceneCues, 3);
          if (topWords.length > 0) {
            title = `${topWords.map((w) => w[0].toUpperCase() + w.slice(1)).join(' & ')}`;
          }
          description = `Dialogue discussion: "${sceneCues[0].text.slice(0, 60)}…"`;
        }

        chapters.push({
          start: s.start,
          end: s.end || duration,
          title,
          description,
        });
      });
      return chapters;
    }

    // Fallback: Uniform smart chaptering based on duration
    const numChapters = duration >= 3600 ? 6 : duration >= 1200 ? 4 : 3;
    const step = duration / numChapters;

    const DEFAULT_TITLES = [
      'Introduction & Opening Sequence',
      'Core Topic Discussion',
      'Key Analysis & Demonstration',
      'Deep Dive & Extended Concepts',
      'Critical Takeaways',
      'Conclusion & Closing Remarks',
    ];

    for (let i = 0; i < numChapters; i++) {
      const start = Math.round(i * step);
      const end = Math.round((i + 1) * step);
      const segmentCues = context.cues.filter((c) => c.start >= start && c.start < end);
      let desc = `Segment coverage from ${formatTimestamp(start)} to ${formatTimestamp(end)}.`;

      if (segmentCues.length > 0) {
        desc = `Includes dialogue: "${segmentCues[0].text.slice(0, 50)}…"`;
      }

      chapters.push({
        start,
        end,
        title: DEFAULT_TITLES[i] || `Chapter ${i + 1}`,
        description: desc,
      });
    }

    return chapters;
  }

  // -------------------------------------------------------------------------
  // Executive Summary Generator
  // -------------------------------------------------------------------------
  public generateExecutiveSummary(context: VideoAIContext): AISummaryResponse {
    const totalWords = context.cues.reduce((acc, c) => acc + c.text.split(/\s+/).length, 0);
    const durationMinutes = Math.max(0.1, context.duration / 60);
    const wpm = Math.round(totalWords / durationMinutes);

    let density: AISummaryResponse['speechPacing']['density'] = 'Moderate / Conversational';
    if (wpm > 165) density = 'Fast-paced';
    else if (wpm < 100 && wpm > 0) density = 'Slow / Deliberate';
    else if (wpm === 0) density = 'Silent / Instrumental';

    let summaryText = `This video titled "${context.fileName}" spans ${formatTimestamp(context.duration)}. `;
    if (context.cues.length > 0) {
      const topWords = this.getTopWordsFromCues(context.cues, 5);
      summaryText += `Spoken dialogue actively focuses on ${topWords.join(', ')} with ${totalWords} total spoken words across ${context.cues.length} cues.`;
    } else {
      summaryText += `The media contains ${context.scenes.length} visual scene transitions with high-fidelity frame playback.`;
    }

    const keyTakeaways: string[] = [];
    if (context.cues.length >= 3) {
      keyTakeaways.push(`Discussion commences at [${formatTimestamp(context.cues[0].start)}] with introductory statements.`);
      const mid = context.cues[Math.floor(context.cues.length / 2)];
      keyTakeaways.push(`Core theme develops around [${formatTimestamp(mid.start)}]: "${mid.text.slice(0, 70)}".`);
      const last = context.cues[context.cues.length - 1];
      keyTakeaways.push(`Conclusion wraps up at [${formatTimestamp(last.start)}].`);
    } else {
      keyTakeaways.push(`High dynamic range visual pacing with ${context.scenes.length} detected scene cuts.`);
      keyTakeaways.push(`Full hardware-accelerated playback in MASTER CLOUD studio.`);
      keyTakeaways.push(`Audio stream ready with 10-Band Equalizer presets.`);
    }

    return {
      title: context.fileName,
      executiveSummary: summaryText,
      keyTakeaways,
      speechPacing: {
        wpm,
        density,
        totalWords,
      },
      audioProfile: wpm > 140 ? 'High vocal presence (Vocal Boost recommended)' : 'Balanced stereo range',
      technicalVerdict: context.resolution ? `${context.resolution.width}×${context.resolution.height} High Fidelity` : 'Smooth Playback',
    };
  }

  // -------------------------------------------------------------------------
  // Pacing and Mood Analyzer
  // -------------------------------------------------------------------------
  public analyzePacingAndMood(context: VideoAIContext): AIPacingAnalysis {
    const totalWords = context.cues.reduce((acc, c) => acc + c.text.split(/\s+/).length, 0);
    const durationMinutes = Math.max(0.1, context.duration / 60);
    const wpm = Math.round(totalWords / durationMinutes);

    // Calculate spoken dialogue time coverage
    let spokenSeconds = 0;
    context.cues.forEach((c) => {
      spokenSeconds += Math.max(0, c.end - c.start);
    });
    const dialogueCoveragePercent = context.duration > 0
      ? Math.min(100, Math.round((spokenSeconds / context.duration) * 100))
      : 0;

    let pacingRating = 'Balanced & Conversational';
    let recommendedEq = 'Vocal Boost';

    if (wpm > 165) {
      pacingRating = 'Energetic / Fast Paced';
      recommendedEq = 'Spoken Word Clarity';
    } else if (wpm < 80 && wpm > 0) {
      pacingRating = 'Atmospheric / Calm';
      recommendedEq = 'Acoustic Presence';
    } else if (wpm === 0) {
      pacingRating = 'Non-verbal / Instrumental';
      recommendedEq = 'Bass Boost';
    }

    return {
      speechRateWpm: wpm,
      pacingRating,
      dialogueCoveragePercent,
      quietIntervalsCount: Math.max(0, context.scenes.length - context.cues.length),
      recommendedEqPreset: recommendedEq,
    };
  }

  // -------------------------------------------------------------------------
  // Private Utilities
  // -------------------------------------------------------------------------
  private semanticSearchCues(
    query: string,
    cues: SubtitleCue[],
    limit = 3,
  ): { start: number; text: string; score: number }[] {
    const queryTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2 && !STOPWORDS.has(t));

    if (queryTokens.length === 0) return [];

    const scored = cues.map((cue) => {
      const cueWords = cue.text.toLowerCase().split(/\s+/);
      let matchCount = 0;
      queryTokens.forEach((qt) => {
        if (cueWords.some((cw) => cw.includes(qt))) {
          matchCount += 1;
        }
      });
      return {
        start: cue.start,
        text: cue.text,
        score: matchCount,
      };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private getTopWordsFromCues(cues: SubtitleCue[], count = 3): string[] {
    const freq = new Map<string, number>();
    for (const cue of cues) {
      const words = cue.text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/);
      for (const w of words) {
        if (w.length >= 4 && !STOPWORDS.has(w)) {
          freq.set(w, (freq.get(w) || 0) + 1);
        }
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([w]) => w);
  }

  private calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    const aspectW = width / divisor;
    const aspectH = height / divisor;
    if (aspectW === 16 && aspectH === 9) return '16:9 (Standard Widescreen)';
    if (aspectW === 4 && aspectH === 3) return '4:3 (Classic Academy)';
    if (aspectW === 21 && aspectH === 9) return '21:9 (Cinematic Ultrawide)';
    if (aspectW === 9 && aspectH === 16) return '9:16 (Vertical Mobile)';
    return `${aspectW}:${aspectH}`;
  }
}

export const masterAiEngine = MasterAiEngine.getInstance();
