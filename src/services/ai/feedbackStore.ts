/**
 * MASTER CLOUD — MASTER AI CORE v1.0
 * Opt-In Local Human Feedback & Corrected-Response Dataset Exporter.
 *
 * Non-Negotiable Privacy & Honesty Design:
 * - Zero cloud uploads: all feedback remains in local browser storage only.
 * - Strictly opt-in: recording fails closed unless user enables feedback consent.
 * - Never pretends live clicks alter active ONNX model weights; exports curated
 *   human preference/correction JSONL pairs for future offline fine-tuning cycles.
 */

import { LanguagePreferenceMode } from './conversationMemory';
import { HELD_OUT_EVAL_PROMPTS_SET } from './evaluationEngine';

export type FeedbackRating = 'helpful' | 'unhelpful';

export type FeedbackTag =
  | 'accurate'
  | 'natural_sinhala'
  | 'natural_english'
  | 'inaccurate_fact'
  | 'unnatural_grammar'
  | 'incomplete_answer'
  | 'wrong_tool_usage';

export interface HumanFeedbackRecord {
  id: string;
  sessionId: string;
  messageId: string;
  prompt: string;
  modelResponse: string;
  correctedResponse?: string;
  rating: FeedbackRating;
  tags: FeedbackTag[];
  language: LanguagePreferenceMode;
  modelTag: string;
  createdAt: number;
}

export interface FeedbackSummaryStats {
  consentEnabled: boolean;
  totalEntries: number;
  helpfulCount: number;
  unhelpfulCount: number;
  correctionsCount: number;
}

const FEEDBACK_KEY = 'master_cloud_ai_feedback_v1';
const CONSENT_KEY = 'master_cloud_ai_feedback_consent_v1';

interface SafeStorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem?(k: string): void;
}

const memFallback = new Map<string, string>();
const store: SafeStorageLike =
  typeof globalThis !== 'undefined' &&
  'localStorage' in globalThis &&
  globalThis.localStorage
    ? globalThis.localStorage
    : {
        getItem: (k) => memFallback.get(k) ?? null,
        setItem: (k, v) => {
          memFallback.set(k, v);
        },
        removeItem: (k) => {
          memFallback.delete(k);
        },
      };

export class HumanFeedbackStore {
  private records: HumanFeedbackRecord[] = [];
  private consent = false;

  constructor() {
    this.reload();
  }

  public reload(): void {
    try {
      this.consent = store.getItem(CONSENT_KEY) === 'true';
      const raw = store.getItem(FEEDBACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.records = parsed;
          return;
        }
      }
    } catch {
      // ignore corrupted storage
    }
    this.records = [];
  }

  private persist(): void {
    // Unlimited entries attempted first; trim only on genuine browser storage QuotaExceeded
    try {
      store.setItem(FEEDBACK_KEY, JSON.stringify(this.records));
    } catch {
      let trimmed = [...this.records];
      while (trimmed.length > 1) {
        trimmed = trimmed.slice(Math.floor(trimmed.length * 0.2));
        try {
          store.setItem(FEEDBACK_KEY, JSON.stringify(trimmed));
          break;
        } catch {
          // shrink only while storage overflows
        }
      }
    }
  }

  public isConsentEnabled(): boolean {
    return this.consent;
  }

  public setConsent(enabled: boolean): void {
    this.consent = Boolean(enabled);
    try {
      store.setItem(CONSENT_KEY, this.consent ? 'true' : 'false');
    } catch {
      // ignore
    }
  }

  public recordFeedback(input: {
    sessionId: string;
    messageId: string;
    prompt: string;
    modelResponse: string;
    correctedResponse?: string;
    rating: FeedbackRating;
    tags?: FeedbackTag[];
    language?: LanguagePreferenceMode;
    modelTag?: string;
  }): { saved: boolean; reason?: string; record?: HumanFeedbackRecord } {
    if (!this.consent) {
      return {
        saved: false,
        reason: 'Opt-in feedback collection is currently disabled in Settings.',
      };
    }

    const cleanedPrompt = (input.prompt || '').trim();
    const cleanedModelResp = (input.modelResponse || '').trim();
    if (!cleanedPrompt || !cleanedModelResp) {
      return { saved: false, reason: 'Empty prompt or response cannot be recorded.' };
    }

    const existingIdx = this.records.findIndex(
      (r) => r.sessionId === input.sessionId && r.messageId === input.messageId,
    );

    const rec: HumanFeedbackRecord = {
      id: existingIdx >= 0 ? this.records[existingIdx].id : `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sessionId: input.sessionId,
      messageId: input.messageId,
      prompt: cleanedPrompt.normalize('NFC'),
      modelResponse: cleanedModelResp.normalize('NFC'),
      correctedResponse: input.correctedResponse?.trim()
        ? input.correctedResponse.trim().normalize('NFC')
        : undefined,
      rating: input.rating,
      tags: input.tags ?? [],
      language: input.language ?? 'auto',
      modelTag: input.modelTag ?? 'MASTER-AI-v1.0',
      createdAt: Date.now(),
    };

    if (existingIdx >= 0) {
      this.records[existingIdx] = rec;
    } else {
      this.records.push(rec);
    }
    this.persist();
    return { saved: true, record: rec };
  }

  public listRecords(): HumanFeedbackRecord[] {
    return [...this.records].sort((a, b) => b.createdAt - a.createdAt);
  }

  public getStats(): FeedbackSummaryStats {
    let helpfulCount = 0;
    let unhelpfulCount = 0;
    let correctionsCount = 0;
    for (const r of this.records) {
      if (r.rating === 'helpful') helpfulCount++;
      else unhelpfulCount++;
      if (r.correctedResponse) correctionsCount++;
    }
    return {
      consentEnabled: this.consent,
      totalEntries: this.records.length,
      helpfulCount,
      unhelpfulCount,
      correctionsCount,
    };
  }

  /**
   * Export clean offline SFT & preference pairs in JSONL format.
   * Automatically strips any prompts matching held-out evaluation sets to prevent leakage.
   */
  public exportPreferencePairsJsonl(excludeHeldOutEvalPrompts = true): string {
    return this.records
      .filter((r) => {
        if (!excludeHeldOutEvalPrompts) return true;
        return !HELD_OUT_EVAL_PROMPTS_SET.has(r.prompt.normalize('NFC').trim().toLowerCase());
      })
      .map((r) => {
        const chosen = r.correctedResponse || (r.rating === 'helpful' ? r.modelResponse : null);
        const rejected = r.correctedResponse || r.rating === 'unhelpful' ? r.modelResponse : null;
        return JSON.stringify({
          id: r.id,
          source: 'master_cloud_local_human_feedback',
          license: 'User-Owned-Local-OptIn',
          language: r.language,
          rating: r.rating,
          tags: r.tags,
          prompt: r.prompt,
          chosen,
          rejected: chosen === rejected ? null : rejected,
          model_tag: r.modelTag,
          created_at: r.createdAt,
        });
      })
      .join('\n');
  }

  public clearAll(): void {
    this.records = [];
    try {
      if (store.removeItem) {
        store.removeItem(FEEDBACK_KEY);
      } else {
        store.setItem(FEEDBACK_KEY, '[]');
      }
    } catch {
      // ignore
    }
  }
}

export const humanFeedbackStore = new HumanFeedbackStore();
