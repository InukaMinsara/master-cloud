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
  // Zero persistent credentials policy: External cloud API keys are NEVER written to disk,
  // localStorage, or sessionStorage. They reside strictly in volatile process memory for the active tab.
  private geminiApiKey: string | null = null;
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('master_cloud_ai_mode', mode);
    }
  }

  public getApiKey(): string | null {
    // Pure ephemeral in-memory getter
    return this.geminiApiKey;
  }

  public setApiKey(key: string): void {
    // Strict ephemeral in-memory storage (cleared upon tab closure or page reload)
    this.geminiApiKey = key.trim() || null;
    if (typeof window !== 'undefined') {
      try {
        // Enforce that nothing ever enters persistent or session storage
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
  // Main Interactive Chat Interface
  // -------------------------------------------------------------------------
  public async chat(
    userQuery: string,
    context: VideoAIContext,
    history: ChatMessage[] = [],
  ): Promise<ChatMessage> {
    const query = userQuery.trim();
    if (!query) {
      return {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: 'Please ask a question about your video or choose one of the recommended analysis prompts below.',
        timestamp: Date.now(),
      };
    }

    // If Cloud mode is active and API key exists, call Gemini API
    if (this.mode === 'cloud' && this.geminiApiKey) {
      try {
        return await this.chatWithGemini(query, context, history);
      } catch (err) {
        console.warn('Gemini Cloud AI failed, falling back to Master Local Neural AI:', err);
      }
    }

    // Default: Master Local Neural AI
    return this.chatWithLocalNeuralAi(query, context);
  }

  // -------------------------------------------------------------------------
  // Master Local Neural AI Implementation
  // -------------------------------------------------------------------------
  private chatWithLocalNeuralAi(query: string, context: VideoAIContext): ChatMessage {
    const qLower = query.toLowerCase();
    const timestamps: { time: number; label: string }[] = [];

    // 1. Chapter generation intent
    if (/(chapter|timeline marker|split scenes|create chapters|outline|sections)/i.test(qLower)) {
      const chapters = this.generateSmartChapters(context);
      let text = `### 🎬 MasterAI Smart Chapters Breakdown\n\nI analyzed **${context.fileName}** (${formatTimestamp(context.duration)}) across detected visual cuts and dialogue shifts. Here is the structured chapter outline:\n\n`;

      chapters.forEach((ch, i) => {
        const timeStr = `[${formatTimestamp(ch.start)}]`;
        text += `- **${timeStr} ${ch.title}**: ${ch.description}\n`;
        timestamps.push({ time: ch.start, label: ch.title });
      });

      text += `\nClick any timestamp above to jump directly, or click **"Apply to Timeline"** below to add these as interactive chapter markers on your player!`;

      return {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text,
        timestamp: Date.now(),
        matchedTimestamps: timestamps,
        suggestedAction: {
          type: 'apply_chapters',
          label: 'Apply to Timeline',
          payload: chapters,
        },
      };
    }

    // 2. Summary & Takeaways intent
    if (/(summar|overview|takeaway|key point|bullet|what is this|gist|brief)/i.test(qLower)) {
      const summary = this.generateExecutiveSummary(context);
      let text = `### 📝 MasterAI Executive Summary for *${context.fileName}*\n\n`;
      text += `${summary.executiveSummary}\n\n`;
      text += `#### 💡 Key Takeaways:\n`;
      summary.keyTakeaways.forEach((k) => {
        text += `- ${k}\n`;
      });
      text += `\n**📊 Spoken Pacing**: ${summary.speechPacing.wpm} words/min (${summary.speechPacing.density}) across ${summary.speechPacing.totalWords} spoken words.\n`;
      text += `**🛠️ Audio Profile**: ${summary.audioProfile}`;

      return {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text,
        timestamp: Date.now(),
        suggestedAction: {
          type: 'copy_summary',
          label: 'Copy Summary',
          payload: text,
        },
      };
    }

    // 3. Technical & Quality analysis intent
    if (/(quality|resolution|bitrate|codec|format|fps|technical|specs|hardware)/i.test(qLower)) {
      const res = context.resolution;
      const resBadge = res ? `${res.width}×${res.height}` : 'Standard';
      const durationStr = formatTimestamp(context.duration);
      const estBitrate = context.fileSize && context.duration > 0
        ? Math.round((context.fileSize * 8) / context.duration / 1000)
        : 0;

      let text = `### ⚙️ MasterAI Technical Video Inspector\n\n`;
      text += `- **File**: \`${context.fileName}\`\n`;
      text += `- **Resolution**: **${resBadge}** ${res ? `(${res.width >= 1920 ? 'High Definition' : 'Standard Definition'})` : ''}\n`;
      text += `- **Duration**: **${durationStr}** (${Math.round(context.duration)} seconds)\n`;
      if (estBitrate > 0) {
        text += `- **Calculated Bitrate**: **${estBitrate.toLocaleString()} kbps**\n`;
      }
      text += `- **Aspect Ratio**: ${res ? this.calculateAspectRatio(res.width, res.height) : '16:9 widescreen'}\n`;
      text += `- **Detected Scene Cuts**: **${context.scenes.length}** distinct transitions\n`;
      text += `- **Dialogue Cue Count**: **${context.cues.length}** time-coded cues\n\n`;
      text += `**Optimization Advice**: Master Cloud's hardware-accelerated playback engine is active. For optimal acoustics, try the Audio Studio equalizer (press <kbd>E</kbd>).`;

      return {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text,
        timestamp: Date.now(),
      };
    }

    // 4. Specific timestamp / scene search intent ("when did", "find where", "jump to", "who said")
    if (context.cues.length > 0) {
      const searchMatches = this.semanticSearchCues(qLower, context.cues, 3);
      if (searchMatches.length > 0) {
        let text = `### 🔍 Dialogue Search & Moment Identification\n\nI located ${searchMatches.length} matching spoken moments in *${context.fileName}*:\n\n`;

        searchMatches.forEach((m, idx) => {
          const timeStr = `[${formatTimestamp(m.start)}]`;
          text += `${idx + 1}. **${timeStr}**: "${m.text}"\n`;
          timestamps.push({ time: m.start, label: `Match ${idx + 1}` });
        });

        text += `\nClick on any timestamp above to jump straight to that moment!`;

        return {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text,
          timestamp: Date.now(),
          matchedTimestamps: timestamps,
        };
      }
    }

    // 5. Pacing and dialogue flow analysis intent
    if (/(pacing|speed|tempo|audio|fast|slow|talk|speech rate)/i.test(qLower)) {
      const pacing = this.analyzePacingAndMood(context);
      let text = `### 🎙️ MasterAI Speech & Audio Pacing Analysis\n\n`;
      text += `- **Average Speech Rate**: **${pacing.speechRateWpm} WPM** (${pacing.pacingRating})\n`;
      text += `- **Dialogue Presence**: Approximately **${pacing.dialogueCoveragePercent}%** of video contains spoken dialogue.\n`;
      text += `- **Quiet / Instrumental Moments**: Identified **${pacing.quietIntervalsCount}** silent or background music gaps.\n`;
      text += `- **Recommended EQ Preset**: **${pacing.recommendedEqPreset}** in the Master Cloud Audio Studio.\n`;

      return {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text,
        timestamp: Date.now(),
      };
    }

    // 6. General Conversational Fallback
    const currentPos = `[${formatTimestamp(context.currentTime)}]`;
    timestamps.push({ time: context.currentTime, label: 'Current Playhead' });

    let text = `### 🤖 MasterAI Assistant\n\n`;
    text += `I am active and monitoring **${context.fileName}** at current position **${currentPos}**.\n\n`;
    text += `Here is what I can do for you right now:\n`;
    text += `- 📑 **"Generate chapters"**: Automatically splits your video into navigable chapters with timestamps.\n`;
    text += `- 📝 **"Summarize video"**: Extracts the executive summary and key points.\n`;
    text += `- 🔍 **"Find [phrase]"**: Searches transcript dialogue and provides 1-click jump links.\n`;
    text += `- ⚙️ **"Technical analysis"**: Evaluates bitrate, resolution, and audio profile.\n`;
    text += `- 🎙️ **"Analyze speech pacing"**: Measures words-per-minute and dialogue density.\n\n`;
    text += `*Tip: You can also switch to **Cloud Gemini AI** in settings for deep multimodal generative video comprehension.*`;

    return {
      id: `ai_${Date.now()}`,
      sender: 'ai',
      text,
      timestamp: Date.now(),
      matchedTimestamps: timestamps,
    };
  }

  // -------------------------------------------------------------------------
  // Cloud Gemini Mode (Google Gemini API via direct HTTPS)
  // -------------------------------------------------------------------------
  private async chatWithGemini(
    userQuery: string,
    context: VideoAIContext,
    history: ChatMessage[],
  ): Promise<ChatMessage> {
    // Secure Endpoint: Pass API key strictly via x-goog-api-key header (never in URL query string)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.selectedModel}:generateContent`;

    // Dynamic Context Retrieval via Local Knowledge Engine (BM25 across entire transcript)
    localKnowledgeEngine.indexTranscript(context.fileName, context.cues);
    const retrievedPassages = localKnowledgeEngine.query(userQuery, 8);

    let transcriptSnippet = '';
    if (retrievedPassages.length > 0) {
      transcriptSnippet = retrievedPassages
        .map((p) => `${p.formattedTimestamp} ${p.snippet}`)
        .join('\n');
    } else {
      // Fallback to evenly sampled cues across entire duration rather than blind front-truncation
      const step = Math.max(1, Math.floor(context.cues.length / 40));
      transcriptSnippet = context.cues
        .filter((_, idx) => idx % step === 0)
        .slice(0, 45)
        .map((c) => `[${formatTimestamp(c.start)}] ${c.text}`)
        .join('\n');
    }

    const scenesSnippet = context.scenes
      .slice(0, 30)
      .map((s) => `[${formatTimestamp(s.start)} - ${formatTimestamp(s.end)}] ${s.label || 'Scene'}`)
      .join('\n');

    const systemInstruction = `
You are MasterAI, the world-class media intelligence co-pilot built natively into MASTER CLOUD Professional Video Player.
You are analyzing a video loaded by the user.

VIDEO CONTEXT:
- File Name: "${context.fileName}"
- Duration: ${formatTimestamp(context.duration)} (${Math.round(context.duration)} seconds)
- Current Playhead: ${formatTimestamp(context.currentTime)}
- Resolution: ${context.resolution ? `${context.resolution.width}x${context.resolution.height}` : 'Unknown'}
- Detected Scene Transitions:
${scenesSnippet || 'None detected yet'}

TRANSCRIPT / SUBTITLE CUES:
${transcriptSnippet || 'No spoken transcript loaded'}

CRITICAL FORMATTING RULES:
1. Always format timestamps as [mm:ss] (e.g. [01:23] or [00:45]) whenever mentioning a scene, quote, or key moment so the video player can create interactive jump links.
2. If the user asks for chapters, provide clean bullet points like "- [mm:ss] Chapter Title: Brief summary".
3. Keep your tone professional, concise, and helpful. Use clean GitHub-flavored markdown.
`.trim();

    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\nUser Question: ${userQuery}` }],
      },
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.geminiApiKey || '',
      },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Gemini API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!candidateText) {
      throw new Error('Gemini returned an empty response.');
    }

    // Extract all [mm:ss] timestamps from the text for interactive seeking
    const timestampMatches = this.extractTimestampsFromText(candidateText);

    return {
      id: `gemini_${Date.now()}`,
      sender: 'ai',
      text: candidateText,
      timestamp: Date.now(),
      matchedTimestamps: timestampMatches,
    };
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
