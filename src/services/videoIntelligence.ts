/**
 * MASTER CLOUD - Video Intelligence & Scene Detection Engine
 * Local-first frame difference scene analysis, Web Speech API transcription,
 * transcript keyword extraction, full-text transcript search, and metadata inspection.
 */

import { SubtitleCue } from './subtitleParser';
import { DetectedScene } from './mediaMetadataDb';

// ---------------------------------------------------------------------------
// 1. Scene Detection (Local Frame Visual Difference)
// ---------------------------------------------------------------------------

export interface SceneDetectionOptions {
  sensitivity?: number; // 10 (very sensitive) to 70 (high changes only), default: 35
  minSceneDuration?: number; // minimum seconds between scene cuts, default: 3.0s
  stepSeconds?: number; // sampling frequency, default: 1.5s
  onProgress?: (progress: number, currentSceneCount: number) => void;
  signal?: AbortSignal;
}

/**
 * Calculates mean RGB color/luminance difference between two Uint8ClampedArray frame buffers
 */
export function calculateFrameDifference(dataA: Uint8ClampedArray, dataB: Uint8ClampedArray): number {
  if (dataA.length !== dataB.length || dataA.length === 0) return 0;

  let totalDiff = 0;
  const numPixels = dataA.length / 4;

  for (let i = 0; i < dataA.length; i += 4) {
    const dr = Math.abs(dataA[i] - dataB[i]);
    const dg = Math.abs(dataA[i + 1] - dataB[i + 1]);
    const db = Math.abs(dataA[i + 2] - dataB[i + 2]);
    totalDiff += (dr + dg + db) / 3;
  }

  return totalDiff / numPixels; // Normalized 0-255 scale
}

/**
 * Detects scene boundaries by seeking a hidden clone video element across timestamps
 * and computing visual differences between sampled frames.
 */
export async function detectVideoScenes(
  videoSourceUrl: string,
  duration: number,
  options: SceneDetectionOptions = {},
): Promise<DetectedScene[]> {
  const {
    sensitivity = 35,
    minSceneDuration = 3.0,
    stepSeconds = 1.5,
    onProgress,
    signal,
  } = options;

  if (typeof window === 'undefined' || !videoSourceUrl || duration <= 0) {
    return [];
  }

  // Create an offscreen video element for analysis
  const video = document.createElement('video');
  video.src = videoSourceUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  // Wait for metadata
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video for scene detection.'));
  });

  const canvas = document.createElement('canvas');
  // Small resolution is fast and robust against camera noise
  canvas.width = 80;
  canvas.height = 45;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  const scenes: DetectedScene[] = [];
  let previousFrameData: Uint8ClampedArray | null = null;
  let lastSceneCutTime = 0;
  let sceneIndex = 1;

  // Add initial opening scene
  scenes.push({
    id: `scene_0_${Date.now()}`,
    mediaId: videoSourceUrl,
    start: 0,
    end: duration,
    label: `Scene 1: Introduction`,
    differenceScore: 0,
  });

  const seekAsync = (time: number): Promise<void> => {
    return new Promise((resolve) => {
      const targetTime = Math.min(time, duration);
      if (Math.abs(video.currentTime - targetTime) < 0.05) {
        resolve();
        return;
      }
      let timeoutId: ReturnType<typeof setTimeout>;
      const handleSeeked = () => {
        clearTimeout(timeoutId);
        video.removeEventListener('seeked', handleSeeked);
        resolve();
      };
      timeoutId = setTimeout(() => {
        video.removeEventListener('seeked', handleSeeked);
        resolve();
      }, 900);
      video.addEventListener('seeked', handleSeeked, { once: true });
      video.currentTime = targetTime;
    });
  };

  const totalSteps = Math.ceil(duration / stepSeconds);
  let currentStep = 0;

  for (let t = 0; t <= duration; t += stepSeconds) {
    if (signal?.aborted) {
      break;
    }

    currentStep++;
    const progress = Math.min(100, Math.round((currentStep / totalSteps) * 100));
    if (onProgress) {
      onProgress(progress, scenes.length);
    }

    await seekAsync(t);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const currentFrameData = new Uint8ClampedArray(imgData.data);

    if (previousFrameData) {
      const diff = calculateFrameDifference(previousFrameData, currentFrameData);

      // If difference exceeds threshold and enough time passed since last cut
      if (diff >= sensitivity && t - lastSceneCutTime >= minSceneDuration) {
        // Close previous scene
        if (scenes.length > 0) {
          scenes[scenes.length - 1].end = t;
        }

        let thumbUrl: string | undefined;
        try {
          thumbUrl = canvas.toDataURL('image/jpeg', 0.6);
        } catch {
          // ignore canvas taint
        }

        sceneIndex++;
        scenes.push({
          id: `scene_${sceneIndex}_${Math.floor(t)}_${Date.now()}`,
          mediaId: videoSourceUrl,
          start: t,
          end: duration,
          label: `Scene ${sceneIndex}: Transition at ${Math.floor(t)}s`,
          thumbnailDataUrl: thumbUrl,
          differenceScore: Math.round(diff * 10) / 10,
        });

        lastSceneCutTime = t;
      }
    }

    previousFrameData = currentFrameData;
  }

  // Ensure last scene ends at video duration
  if (scenes.length > 0) {
    scenes[scenes.length - 1].end = duration;
  }

  // Cleanup offscreen element
  video.src = '';
  video.load();

  return scenes;
}

// ---------------------------------------------------------------------------
// 2. Automatic Speech-to-Text Transcription via Web Speech API
// ---------------------------------------------------------------------------

export interface TranscriptionEvent {
  status: 'idle' | 'listening' | 'processing' | 'paused' | 'error';
  transcriptSnippet?: string;
  isFinal?: boolean;
  error?: string;
}

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class BrowserSpeechToTextEngine {
  private recognition: any = null;
  private isListening = false;
  private activeCues: SubtitleCue[] = [];
  private cueCounter = 0;
  private currentSegmentStart = 0;
  private onCueAddedCallback?: (cue: SubtitleCue) => void;
  private onStatusCallback?: (event: TranscriptionEvent) => void;

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as IWindowWithSpeech;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  start(
    getCurrentVideoTime: () => number,
    onCueAdded: (cue: SubtitleCue) => void,
    onStatus: (event: TranscriptionEvent) => void,
    language: string = 'en-US',
  ): boolean {
    if (!this.isSupported()) {
      onStatus({
        status: 'error',
        error: 'Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.',
      });
      return false;
    }

    const win = window as IWindowWithSpeech;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = language;
      this.onCueAddedCallback = onCueAdded;
      this.onStatusCallback = onStatus;

      this.currentSegmentStart = getCurrentVideoTime();

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStatusCallback?.({ status: 'listening' });
      };

      this.recognition.onresult = (event: any) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript.trim();

          if (res.isFinal) {
            const cueEnd = getCurrentVideoTime();
            const cue: SubtitleCue = {
              id: `auto_cue_${++this.cueCounter}`,
              start: Math.max(0, this.currentSegmentStart),
              end: Math.max(this.currentSegmentStart + 1.5, cueEnd),
              text,
            };
            this.activeCues.push(cue);
            this.onCueAddedCallback?.(cue);
            this.currentSegmentStart = cueEnd;
            this.onStatusCallback?.({ status: 'listening', transcriptSnippet: text, isFinal: true });
          } else {
            interimText += text + ' ';
            this.onStatusCallback?.({ status: 'processing', transcriptSnippet: interimText, isFinal: false });
          }
        }
      };

      this.recognition.onerror = (err: any) => {
        this.onStatusCallback?.({ status: 'error', error: err.error || 'Speech recognition error.' });
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Restart if still marked as listening
          try {
            this.recognition.start();
          } catch {
            this.isListening = false;
            this.onStatusCallback?.({ status: 'idle' });
          }
        } else {
          this.onStatusCallback?.({ status: 'idle' });
        }
      };

      this.recognition.start();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onStatus({ status: 'error', error: msg });
      return false;
    }
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    this.onStatusCallback?.({ status: 'idle' });
  }
}

export const speechToTextEngine = new BrowserSpeechToTextEngine();

// ---------------------------------------------------------------------------
// 3. Transcript Keyword Extraction & Full-Text Search
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has',
  'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if',
  'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor',
  'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to',
  'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
  'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves', 'like', 'yeah',
  'know', 'going', 'think', 'right', 'okay', 'well', 'really',
]);

export interface KeywordItem {
  word: string;
  count: number;
  relevance: number; // 0 to 1 score
}

export function extractTranscriptKeywords(cues: SubtitleCue[], maxKeywords: number = 15): KeywordItem[] {
  if (!cues || cues.length === 0) return [];

  const wordCounts = new Map<string, number>();
  let totalValidWords = 0;

  for (const cue of cues) {
    const tokens = cue.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/);

    for (const token of tokens) {
      if (token.length >= 3 && !STOPWORDS.has(token) && !/^\d+$/.test(token)) {
        wordCounts.set(token, (wordCounts.get(token) || 0) + 1);
        totalValidWords++;
      }
    }
  }

  if (totalValidWords === 0) return [];

  const sorted = Array.from(wordCounts.entries())
    .map(([word, count]) => ({
      word,
      count,
      relevance: Math.min(1.0, count / (totalValidWords * 0.05 + 1)),
    }))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, maxKeywords);
}

export interface TranscriptSearchResult {
  cue: SubtitleCue;
  matchedText: string;
  snippet: string;
}

export function searchTranscriptCues(cues: SubtitleCue[], query: string): TranscriptSearchResult[] {
  if (!query || query.trim() === '' || !cues) return [];

  const q = query.trim().toLowerCase();
  const results: TranscriptSearchResult[] = [];

  for (const cue of cues) {
    const textLower = cue.text.toLowerCase();
    const idx = textLower.indexOf(q);
    if (idx !== -1) {
      // Create a contextual snippet
      const start = Math.max(0, idx - 20);
      const end = Math.min(cue.text.length, idx + q.length + 30);
      const snippet = (start > 0 ? '…' : '') + cue.text.substring(start, end) + (end < cue.text.length ? '…' : '');

      results.push({
        cue,
        matchedText: cue.text.substring(idx, idx + q.length),
        snippet,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 4. Video Summary & Content Insights
// ---------------------------------------------------------------------------

export interface VideoSummaryInsight {
  totalDuration: number;
  totalWords: number;
  wordsPerMinute: number;
  summaryText: string;
  topics: string[];
}

export function generateLocalVideoSummary(
  videoName: string,
  duration: number,
  cues: SubtitleCue[],
  scenes?: DetectedScene[],
): VideoSummaryInsight {
  const fullText = cues.map((c) => c.text).join(' ');
  const words = fullText.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const minutes = duration > 0 ? duration / 60 : 1;
  const wordsPerMinute = Math.round(totalWords / minutes);

  const keywords = extractTranscriptKeywords(cues, 6).map((k) => k.word);

  let summaryParagraph = '';
  if (cues.length > 0) {
    const sampleSentences = cues
      .slice(0, Math.min(cues.length, 5))
      .map((c) => c.text)
      .join(' ');
    summaryParagraph = `This video contains ${cues.length} dialogue segments with a speech rate of ${wordsPerMinute} words per minute. Key discussion topics include ${
      keywords.length > 0 ? keywords.join(', ') : 'general media discussion'
    }. Overview: "${sampleSentences.substring(0, 180)}…"`;
  } else {
    summaryParagraph = `Local media file "${videoName}" with a total runtime of ${Math.round(duration)} seconds. No embedded or external transcript cues loaded yet.`;
  }

  return {
    totalDuration: duration,
    totalWords,
    wordsPerMinute,
    summaryText: summaryParagraph,
    topics: keywords,
  };
}

// ---------------------------------------------------------------------------
// 5. Technical Metadata Inspector
// ---------------------------------------------------------------------------

export interface DetailedMediaMetadata {
  fileName: string;
  fileSize: number;
  duration: number;
  resolution?: string;
  aspectRatio: string;
  estimatedBitrateKbps: number;
  container: string;
  hasAudio: boolean;
}

export function extractDetailedMediaMetadata(
  video: HTMLVideoElement,
  file?: File | null,
): DetailedMediaMetadata {
  const width = video.videoWidth || 0;
  const height = video.videoHeight || 0;
  const duration = video.duration || 0;
  const size = file?.size || 0;

  // Aspect ratio calculation
  let aspectRatio = 'Unknown';
  if (width > 0 && height > 0) {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    const rW = width / divisor;
    const rH = height / divisor;
    if (Math.abs(rW / rH - 16 / 9) < 0.05) aspectRatio = '16:9 Widescreen';
    else if (Math.abs(rW / rH - 4 / 3) < 0.05) aspectRatio = '4:3 Standard';
    else if (Math.abs(rW / rH - 21 / 9) < 0.05) aspectRatio = '21:9 Ultrawide';
    else if (Math.abs(rW / rH - 9 / 16) < 0.05) aspectRatio = '9:16 Vertical';
    else aspectRatio = `${rW}:${rH}`;
  }

  // Estimated bitrate: (size in bytes * 8) / duration in seconds / 1000 = kbps
  const estimatedBitrateKbps = duration > 0 && size > 0 ? Math.round((size * 8) / duration / 1000) : 0;

  const ext = file?.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';

  return {
    fileName: file?.name || 'Current Video',
    fileSize: size,
    duration,
    resolution: width && height ? `${width}×${height}` : undefined,
    aspectRatio,
    estimatedBitrateKbps,
    container: ext,
    hasAudio: true,
  };
}
