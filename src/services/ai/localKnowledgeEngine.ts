/**
 * MASTER CLOUD — LOCAL KNOWLEDGE & TRANSCRIPT RETRIEVAL SYSTEM
 * 
 * Ingests media transcripts and document texts into timestamped chunks,
 * builds a client-side BM25 index, and retrieves grounded evidence passages
 * with clickable [mm:ss] timestamp references.
 */

import { SubtitleCue } from '../subtitleParser';

export interface KnowledgeChunk {
  id: string;
  mediaId: string;
  start: number;
  end: number;
  text: string;
  tokens: string[];
}

export interface RetrievalResult {
  chunk: KnowledgeChunk;
  score: number;
  formattedTimestamp: string;
  snippet: string;
}

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its',
  'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'i', 'you', 'we', 'they', 'this', 'that'
]);

export class LocalKnowledgeEngine {
  private chunks: KnowledgeChunk[] = [];
  private avgDocLength = 0;
  private docFreqs = new Map<string, number>();

  /**
   * Ingest and index subtitle cues into 15-30 second knowledge passages
   */
  public indexTranscript(mediaId: string, cues: SubtitleCue[]): void {
    this.chunks = [];
    this.docFreqs.clear();

    if (cues.length === 0) return;

    // Group adjacent cues into coherent knowledge chunks (target: 20-30s windows)
    let currentCues: SubtitleCue[] = [];
    let windowStart = cues[0].start;

    const finalizeChunk = () => {
      if (currentCues.length === 0) return;
      const text = currentCues.map((c) => c.text).join(' ').trim();
      const end = currentCues[currentCues.length - 1].end;
      const tokens = this.tokenize(text);

      const chunk: KnowledgeChunk = {
        id: `chunk_${mediaId}_${Math.floor(windowStart)}`,
        mediaId,
        start: windowStart,
        end,
        text,
        tokens,
      };

      this.chunks.push(chunk);

      // Record document frequencies
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach((t) => {
        this.docFreqs.set(t, (this.docFreqs.get(t) || 0) + 1);
      });

      currentCues = [];
    };

    cues.forEach((cue) => {
      if (cue.start - windowStart > 25 && currentCues.length > 0) {
        finalizeChunk();
        windowStart = cue.start;
      }
      currentCues.push(cue);
    });

    finalizeChunk();

    // Compute average chunk length
    const totalTokens = this.chunks.reduce((acc, c) => acc + c.tokens.length, 0);
    this.avgDocLength = this.chunks.length > 0 ? totalTokens / this.chunks.length : 1;
  }

  /**
   * BM25 Passage Retrieval for evidence grounding
   */
  public query(queryText: string, topK: number = 3): RetrievalResult[] {
    const qTokens = this.tokenize(queryText);
    if (qTokens.length === 0 || this.chunks.length === 0) return [];

    const N = this.chunks.length;
    const k1 = 1.5;
    const b = 0.75;

    const scored = this.chunks.map((chunk) => {
      let score = 0;
      const docLen = chunk.tokens.length;

      // Count term frequencies in chunk
      const tfMap = new Map<string, number>();
      chunk.tokens.forEach((t) => tfMap.set(t, (tfMap.get(t) || 0) + 1));

      qTokens.forEach((qTerm) => {
        const tf = tfMap.get(qTerm) || 0;
        if (tf > 0) {
          const df = this.docFreqs.get(qTerm) || 1;
          const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
          const numerator = tf * (k1 + 1);
          const denominator = tf + k1 * (1 - b + b * (docLen / Math.max(1, this.avgDocLength)));
          score += idf * (numerator / denominator);
        }
      });

      return {
        chunk,
        score,
        formattedTimestamp: `[${this.formatTime(chunk.start)}]`,
        snippet: chunk.text,
      };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

export const localKnowledgeEngine = new LocalKnowledgeEngine();
