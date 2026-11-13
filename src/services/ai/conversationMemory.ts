/**
 * MASTER CLOUD — MASTER AI CORE v1.0
 * Multi-Turn Conversation Session & Working-Memory Manager.
 *
 * Clear separation of concerns:
 * - Working Memory (Session History + Context Compression): lives only in local browser storage
 *   for active multi-turn dialogue continuity; NEVER alters neural model weights.
 * - Tracks exact subword token budget via MasterAiTokenizerV1 (default 512 tokens)
 *   and produces user-visible compression notifications when older turns are summarized.
 */

import { ChatTurnInput, sharedTokenizerV1 } from './tokenizerV1';
import { safeReadJson, safeRemoveStorage, safeWriteJson } from './storageHelper';

export type ChatSourceBadge =
  | 'neural_core'
  | 'tool_assisted_neural'
  | 'doc_retrieval'
  | 'transcript_grounding'
  | 'deterministic_calc'
  | 'gemini_cloud'
  | 'local_open_weight'
  | 'cloud_brain'
  | 'long_term_memory'
  | 'parallel_verified'
  | 'system_notice';

export type LanguagePreferenceMode = 'auto' | 'sinhala' | 'english' | 'mixed';

export interface StoredChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  sourcesUsed?: ChatSourceBadge[];
  sourceLabel?: string;
  modelTag?: string;
  brainUsed?: 'original' | 'local' | 'cloud';
  confidenceScore?: number;
  validationWarnings?: string[];
  rememberedMemoryIds?: string[];
  orchestrationTrace?: string[];
  tokensGenerated?: number;
  latencyMs?: number;
  matchedTimestamps?: Array<{ time: number; label: string }>;
  suggestedAction?: {
    type: string;
    label: string;
    payload?: unknown;
  };
  feedbackRating?: 'helpful' | 'unhelpful' | null;
  correctedText?: string;
}

export type MemoryCategory =
  | 'user_preference'
  | 'project_fact'
  | 'media_insight'
  | 'session_summary'
  | 'explicit_note';

export type MemoryProvenance =
  | 'remembered_from_prior_session'
  | 'user_explicit_pin'
  | 'session_compression_summary';

export interface LongTermMemoryEntry {
  id: string;
  content: string;
  category: MemoryCategory;
  provenance: MemoryProvenance;
  importanceScore: number; // 0.0 .. 1.0
  sourceSessionId?: string;
  mediaFileName?: string;
  tags: string[];
  keywords: string[];
  pinned: boolean;
  accessCount: number;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
}

export interface MemoryAddResult {
  added: boolean;
  duplicateOfId?: string;
  entry: LongTermMemoryEntry;
}

export interface MemoryBundleExport {
  schemaVersion: 'master_ai_memory_v2';
  exportedAt: string;
  sessions: ConversationSession[];
  longTermMemories: LongTermMemoryEntry[];
}

export interface ConversationSession {
  id: string;
  title: string;
  mediaFileName?: string;
  createdAt: number;
  updatedAt: number;
  languageMode: LanguagePreferenceMode;
  pinnedSummary?: string;
  messages: StoredChatMessage[];
}

export interface ContextBuildResult {
  turns: ChatTurnInput[];
  promptText: string;
  promptTokens: number;
  maxContextTokens: number;
  reservedGenerationTokens: number;
  wasCompressed: boolean;
  compressedTurnCount: number;
  compressedSummary: string;
  summaryNotice: string | null;
  tokenCountExact: boolean;
  rememberedMemories?: LongTermMemoryEntry[];
}

const STORAGE_KEY = 'master_cloud_ai_sessions_v1';
const LTM_STORAGE_KEY = 'master_cloud_ai_v2_long_term_memories';

function tokenizeSemanticTerms(text: string): string[] {
  return text
    .normalize('NFC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}_-]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const item of setA) {
    if (setB.has(item)) inter++;
  }
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function scoreMemoryImportance(content: string, category: MemoryCategory, pinned = false): number {
  if (pinned) return 1.0;
  const lower = content.toLowerCase();
  let score = 0.42;
  if (category === 'user_preference' || category === 'explicit_note') score += 0.25;
  if (category === 'project_fact' || category === 'media_insight') score += 0.15;
  if (/\b(remember|always|prefer|default|language|sinhala|english|bitrate|resolution|api)\b/i.test(lower)) {
    score += 0.14;
  }
  if (/[\u0D80-\u0DFF]/.test(content)) score += 0.08;
  if (content.length > 60 && content.length < 360) score += 0.06;
  return Number(Math.max(0.1, Math.min(0.99, score)).toFixed(2));
}

interface SafeStorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const memoryFallbackMap = new Map<string, string>();
const safeStorage: SafeStorageLike =
  typeof globalThis !== 'undefined' &&
  'localStorage' in globalThis &&
  globalThis.localStorage
    ? globalThis.localStorage
    : {
        getItem: (k: string) => memoryFallbackMap.get(k) ?? null,
        setItem: (k: string, v: string) => {
          memoryFallbackMap.set(k, v);
        },
      };

function countTurnTokens(text: string): { count: number; exact: boolean } {
  if (sharedTokenizerV1.loaded) {
    return { count: sharedTokenizerV1.countTokens(text), exact: true };
  }
  // Conservative bilingual heuristic (~3.5 chars/token, Sinhala clusters heavier per byte)
  const est = Math.max(1, Math.ceil((text || '').length / 3.5) + 4);
  return { count: est, exact: false };
}

/**
 * Deterministic extractive summarizer for overflowing earlier dialogue turns.
 * Never fabricates unseen entities; retains concrete user intents, numbers & topics.
 */
export function summarizeOlderTurnsDeterministically(messages: StoredChatMessage[]): string {
  if (messages.length === 0) return '';
  const snippets: string[] = [];
  for (const m of messages) {
    const clean = m.text.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    const prefix = m.sender === 'user' ? 'User' : 'AI';
    const trimmed = clean.length > 90 ? `${clean.slice(0, 87)}...` : clean;
    snippets.push(`${prefix}: ${trimmed}`);
  }
  const combined = snippets.slice(-6).join(' | ');
  return `Earlier context summary (session memory only): ${combined}`;
}

export class ConversationMemoryManager {
  private sessions: ConversationSession[] = [];
  private longTermMemories: LongTermMemoryEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public loadFromStorage(): ConversationSession[] {
    try {
      const raw = safeStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.sessions = parsed;
        }
      }
    } catch {
      this.sessions = [];
    }

    const loadedLtm = safeReadJson<LongTermMemoryEntry[]>(LTM_STORAGE_KEY, []);
    this.longTermMemories = Array.isArray(loadedLtm) ? loadedLtm : [];
    return this.sessions;
  }

  private persist(): void {
    // No artificial cap on conversation count: attempt full write first
    try {
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
    } catch {
      // Only trim oldest tail if actual browser localStorage quota is exceeded
      let trimmed = [...this.sessions];
      while (trimmed.length > 1) {
        trimmed = trimmed.slice(0, Math.floor(trimmed.length * 0.8));
        try {
          safeStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
          break;
        } catch {
          // keep shrinking only until storage fits
        }
      }
    }
  }

  private persistLongTermMemories(): void {
    safeWriteJson(LTM_STORAGE_KEY, this.longTermMemories);
  }

  public listSessions(): ConversationSession[] {
    return [...this.sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getSession(sessionId: string): ConversationSession | null {
    return this.sessions.find((s) => s.id === sessionId) ?? null;
  }

  public createSession(
    title = 'New Conversation',
    mediaFileName?: string,
    languageMode: LanguagePreferenceMode = 'auto',
  ): ConversationSession {
    const now = Date.now();
    const session: ConversationSession = {
      id: `sess_${now}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim() || 'New Conversation',
      mediaFileName,
      createdAt: now,
      updatedAt: now,
      languageMode,
      messages: [],
    };
    this.sessions.unshift(session);
    this.persist();
    return session;
  }

  public renameSession(sessionId: string, newTitle: string): ConversationSession | null {
    const sess = this.getSession(sessionId);
    if (!sess) return null;
    sess.title = newTitle.trim() || sess.title;
    sess.updatedAt = Date.now();
    this.persist();
    return sess;
  }

  public setSessionLanguage(sessionId: string, languageMode: LanguagePreferenceMode): void {
    const sess = this.getSession(sessionId);
    if (!sess) return;
    sess.languageMode = languageMode;
    sess.updatedAt = Date.now();
    this.persist();
  }

  public saveMessages(sessionId: string, messages: StoredChatMessage[], autoTitleFromFirstUser = true): void {
    const sess = this.getSession(sessionId);
    if (!sess) return;
    sess.messages = messages;
    sess.updatedAt = Date.now();
    if (autoTitleFromFirstUser && (sess.title === 'New Conversation' || sess.title.startsWith('Chat:'))) {
      const firstUser = messages.find((m) => m.sender === 'user');
      if (firstUser && firstUser.text.trim()) {
        const clean = firstUser.text.trim().replace(/\s+/g, ' ');
        sess.title = clean.length > 42 ? `${clean.slice(0, 39)}...` : clean;
      }
    }
    this.persist();
  }

  public clearSessionMessages(sessionId: string): void {
    const sess = this.getSession(sessionId);
    if (!sess) return;
    sess.messages = [];
    sess.pinnedSummary = undefined;
    sess.updatedAt = Date.now();
    this.persist();
  }

  public deleteSession(sessionId: string): void {
    this.sessions = this.sessions.filter((s) => s.id !== sessionId);
    this.persist();
  }

  public searchSessions(query: string): ConversationSession[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.listSessions();
    return this.listSessions().filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.mediaFileName?.toLowerCase().includes(q) ?? false) ||
        s.messages.some((m) => m.text.toLowerCase().includes(q)),
    );
  }

  /**
   * Assemble bounded multi-turn prompt fitting within `maxContextTokens - reserveGenTokens`.
   * Compresses overflowing earliest turns cleanly and reports compression transparently.
   */
  public buildContextWindow(
    systemInstruction: string,
    history: StoredChatMessage[],
    latestUserQuery: string,
    maxContextTokens = 512,
    reserveGenTokens = 112,
  ): ContextBuildResult {
    const budget = Math.max(128, maxContextTokens - reserveGenTokens);
    const cleanedHistory = history.filter((m) => m.text && m.text.trim().length > 0);

    const sysTurn: ChatTurnInput = { role: 'system', content: systemInstruction };
    const latestTurn: ChatTurnInput = { role: 'user', content: latestUserQuery };

    const baseTurns: ChatTurnInput[] = cleanedHistory.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    const fullPromptText = sharedTokenizerV1.formatConversationPrompt([sysTurn, ...baseTurns, latestTurn]);
    const fullCheck = countTurnTokens(fullPromptText);

    if (fullCheck.count <= budget) {
      return {
        turns: [sysTurn, ...baseTurns, latestTurn],
        promptText: fullPromptText,
        promptTokens: fullCheck.count,
        maxContextTokens,
        reservedGenerationTokens: reserveGenTokens,
        wasCompressed: false,
        compressedTurnCount: 0,
        compressedSummary: '',
        summaryNotice: null,
        tokenCountExact: fullCheck.exact,
      };
    }

    // Keep newest turns that fit alongside a compact summary of earlier turns
    const keptRecent: StoredChatMessage[] = [];
    let dropped: StoredChatMessage[] = [...cleanedHistory];

    for (let i = cleanedHistory.length - 1; i >= 0; i--) {
      const candidate = [cleanedHistory[i], ...keptRecent];
      const earlier = cleanedHistory.slice(0, i);
      const summary = summarizeOlderTurnsDeterministically(earlier);
      const candSys = summary ? `${systemInstruction}\n${summary}` : systemInstruction;
      const candTurns: ChatTurnInput[] = [
        { role: 'system', content: candSys },
        ...candidate.map((m) => ({ role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text })),
        latestTurn,
      ];
      const text = sharedTokenizerV1.formatConversationPrompt(candTurns);
      const tok = countTurnTokens(text);
      if (tok.count <= budget) {
        keptRecent.unshift(cleanedHistory[i]);
        dropped = earlier;
      } else {
        break;
      }
    }

    const summaryText = summarizeOlderTurnsDeterministically(dropped);
    const compressedSys = summaryText ? `${systemInstruction}\n${summaryText}` : systemInstruction;
    const finalTurns: ChatTurnInput[] = [
      { role: 'system', content: compressedSys },
      ...keptRecent.map((m) => ({ role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text })),
      latestTurn,
    ];
    let finalText = sharedTokenizerV1.formatConversationPrompt(finalTurns);
    let finalTok = countTurnTokens(finalText);

    // Extreme fallback: trim oldest remaining character slice from compressed summary if even 1 turn is massive
    if (finalTok.count > budget && keptRecent.length > 0) {
      const bareTurns = [sysTurn, latestTurn];
      finalText = sharedTokenizerV1.formatConversationPrompt(bareTurns);
      finalTok = countTurnTokens(finalText);
      dropped = cleanedHistory;
    }

    return {
      turns: finalTurns,
      promptText: finalText,
      promptTokens: finalTok.count,
      maxContextTokens,
      reservedGenerationTokens: reserveGenTokens,
      wasCompressed: true,
      compressedTurnCount: dropped.length,
      compressedSummary: summaryText,
      summaryNotice: `Working memory summarized ${dropped.length} earlier turn(s) to stay within the ${maxContextTokens}-token window (session memory only — model weights unchanged).`,
      tokenCountExact: finalTok.exact,
    };
  }

  // ── Long-Term Semantic Memory Engine (v2.0) ───────────────────────────────

  public listLongTermMemories(query?: string): LongTermMemoryEntry[] {
    const q = query?.trim();
    if (!q) {
      return [...this.longTermMemories].sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.importanceScore - a.importanceScore || b.updatedAt - a.updatedAt,
      );
    }
    return this.retrieveSemanticMemories(q, this.longTermMemories.length || 20);
  }

  public addLongTermMemory(input: {
    content: string;
    category?: MemoryCategory;
    provenance?: MemoryProvenance;
    importanceScore?: number;
    sourceSessionId?: string;
    mediaFileName?: string;
    tags?: string[];
    pinned?: boolean;
  }): MemoryAddResult {
    const clean = input.content.replace(/\s+/g, ' ').trim();
    const keywords = tokenizeSemanticTerms(clean);
    const category = input.category ?? 'project_fact';
    const provenance = input.provenance ?? 'remembered_from_prior_session';
    const now = Date.now();

    // Duplicate & near-duplicate detection (exact match or normalized token Jaccard >= 0.78)
    for (const existing of this.longTermMemories) {
      const exactSame = existing.content.normalize('NFC').toLowerCase() === clean.normalize('NFC').toLowerCase();
      const sim = exactSame ? 1 : jaccardSimilarity(existing.keywords, keywords);
      if (exactSame || sim >= 0.78) {
        existing.updatedAt = now;
        existing.accessCount += 1;
        existing.importanceScore = Math.max(
          existing.importanceScore,
          input.importanceScore ?? scoreMemoryImportance(clean, category, input.pinned),
        );
        if (input.pinned) existing.pinned = true;
        if (input.tags?.length) {
          existing.tags = Array.from(new Set([...existing.tags, ...input.tags]));
        }
        if (clean.length > existing.content.length && !exactSame) {
          existing.content = clean;
          existing.keywords = keywords;
        }
        this.persistLongTermMemories();
        return { added: false, duplicateOfId: existing.id, entry: existing };
      }
    }

    const entry: LongTermMemoryEntry = {
      id: `mem_${now}_${Math.random().toString(36).slice(2, 7)}`,
      content: clean,
      category,
      provenance,
      importanceScore: input.importanceScore ?? scoreMemoryImportance(clean, category, input.pinned),
      sourceSessionId: input.sourceSessionId,
      mediaFileName: input.mediaFileName,
      tags: Array.from(new Set(input.tags || [])),
      keywords,
      pinned: Boolean(input.pinned),
      accessCount: 0,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    };

    this.longTermMemories.unshift(entry);
    this.persistLongTermMemories();
    return { added: true, entry };
  }

  /**
   * Conservative fact & preference extractor: stores explicit user preferences or goals ONLY.
   * Never speculates or fabricates memories from uncertain AI responses.
   */
  public extractMemoryCandidatesFromTurn(
    userText: string,
    sessionId?: string,
    mediaFileName?: string,
  ): MemoryAddResult[] {
    const clean = userText.replace(/\s+/g, ' ').trim();
    if (!clean || clean.length < 12) return [];

    const added: MemoryAddResult[] = [];
    const prefMatch = clean.match(
      /(?:remember that|please remember|always use|i prefer|my preferred|මතක තබා ගන්න|මම කැමති)\s+(.{6,200})/i,
    );
    if (prefMatch) {
      const fact = prefMatch[0].trim();
      added.push(
        this.addLongTermMemory({
          content: fact,
          category: 'user_preference',
          provenance: 'remembered_from_prior_session',
          sourceSessionId: sessionId,
          mediaFileName,
          tags: ['auto-preference'],
          importanceScore: 0.85,
        }),
      );
    }
    return added;
  }

  /**
   * TF-IDF weighted semantic memory retrieval combined with importance & recency decay.
   */
  public retrieveSemanticMemories(
    query: string,
    limit = 5,
    mediaFileName?: string,
    excludeSessionId?: string,
  ): LongTermMemoryEntry[] {
    if (this.longTermMemories.length === 0) return [];
    const qTokens = tokenizeSemanticTerms(query);
    if (qTokens.length === 0) {
      return this.listLongTermMemories().slice(0, limit);
    }

    const totalDocs = this.longTermMemories.length;
    const df = new Map<string, number>();
    for (const mem of this.longTermMemories) {
      const uniq = new Set(mem.keywords);
      for (const tok of qTokens) {
        if (uniq.has(tok)) df.set(tok, (df.get(tok) || 0) + 1);
      }
    }

    const now = Date.now();
    const scored = this.longTermMemories
      .map((mem) => {
        const memSet = new Set(mem.keywords);
        let idfOverlap = 0;
        for (const qt of qTokens) {
          if (memSet.has(qt)) {
            const freq = df.get(qt) || 1;
            idfOverlap += Math.log(1 + (totalDocs - freq + 0.5) / (freq + 0.5));
          } else {
            // Substring fallback for Sinhala inflection variants
            for (const mt of memSet) {
              if (mt.length >= 4 && (mt.includes(qt) || qt.includes(mt))) {
                idfOverlap += 0.35;
                break;
              }
            }
          }
        }
        const mediaBonus =
          mediaFileName && mem.mediaFileName && mem.mediaFileName === mediaFileName ? 0.65 : 0;
        const ageDays = Math.max(0, (now - mem.updatedAt) / (1000 * 60 * 60 * 24));
        const recencyFactor = 1 / (1 + ageDays * 0.05);
        const pinBonus = mem.pinned ? 0.5 : 0;
        const crossSessionBonus =
          excludeSessionId && mem.sourceSessionId === excludeSessionId ? 0 : 0.1;

        const score =
          idfOverlap * 1.4 +
          mem.importanceScore * 0.45 +
          recencyFactor * 0.2 +
          mediaBonus +
          pinBonus +
          (idfOverlap > 0 ? crossSessionBonus : 0);

        return { mem, idfOverlap, score };
      })
      .filter((row) => row.idfOverlap > 0 || row.mem.pinned)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((row) => {
        row.mem.accessCount += 1;
        row.mem.lastAccessedAt = now;
        return row.mem;
      });

    if (scored.length > 0) this.persistLongTermMemories();
    return scored;
  }

  public pinLongTermMemory(memoryId: string, pinned: boolean): LongTermMemoryEntry | null {
    const entry = this.longTermMemories.find((m) => m.id === memoryId);
    if (!entry) return null;
    entry.pinned = pinned;
    entry.importanceScore = pinned
      ? 1.0
      : scoreMemoryImportance(entry.content, entry.category, false);
    entry.updatedAt = Date.now();
    this.persistLongTermMemories();
    return entry;
  }

  public deleteLongTermMemory(memoryId: string): boolean {
    const before = this.longTermMemories.length;
    this.longTermMemories = this.longTermMemories.filter((m) => m.id !== memoryId);
    if (this.longTermMemories.length !== before) {
      this.persistLongTermMemories();
      return true;
    }
    return false;
  }

  public rememberFact(input: { category?: MemoryCategory; content: string; source?: string }): LongTermMemoryEntry {
    const res = this.addLongTermMemory({
      content: input.content,
      category: input.category,
      provenance: 'remembered_from_prior_session',
    });
    return res.entry;
  }

  public forgetFact(memoryId: string): boolean {
    return this.deleteLongTermMemory(memoryId);
  }

  public clearLongTermMemories(): void {
    this.longTermMemories = [];
    safeRemoveStorage(LTM_STORAGE_KEY);
  }

  /**
   * Builds bounded prompt context INCLUDING clearly tagged Long-Term Memories
   * so the model and user always distinguish remembered info from newly generated answers.
   */
  public buildContextWindowWithLongTerm(
    systemInstruction: string,
    history: StoredChatMessage[],
    latestUserQuery: string,
    options?: {
      maxContextTokens?: number;
      reserveGenTokens?: number;
      mediaFileName?: string;
      sessionId?: string;
      memoryLimit?: number;
    },
  ): ContextBuildResult {
    const remembered = this.retrieveSemanticMemories(
      latestUserQuery,
      options?.memoryLimit ?? 4,
      options?.mediaFileName,
      options?.sessionId,
    );

    const memoryBlock =
      remembered.length > 0
        ? [
            '\n[REMEMBERED FROM PRIOR SESSIONS — REFERENCE ONLY]',
            ...remembered.map(
              (m, idx) =>
                `- [Memory #${idx + 1} | ${m.category} | score=${m.importanceScore.toFixed(2)}] ${m.content}`,
            ),
            'Note: Clearly cite when using remembered facts vs newly computed facts.',
          ].join('\n')
        : '';

    const augmentedSystem = `${systemInstruction}${memoryBlock}`;
    const res = this.buildContextWindow(
      augmentedSystem,
      history,
      latestUserQuery,
      options?.maxContextTokens ?? 2048,
      options?.reserveGenTokens ?? 512,
    );
    return {
      ...res,
      rememberedMemories: remembered,
    };
  }

  public exportMemoryBundleJson(): string {
    const bundle: MemoryBundleExport = {
      schemaVersion: 'master_ai_memory_v2',
      exportedAt: new Date().toISOString(),
      sessions: this.listSessions(),
      longTermMemories: this.listLongTermMemories(),
    };
    return JSON.stringify(bundle, null, 2);
  }

  public importMemoryBundleJson(
    rawJson: string,
    mode: 'merge' | 'replace' = 'merge',
  ): { sessionsImported: number; memoriesImported: number } {
    const parsed = JSON.parse(rawJson) as Partial<MemoryBundleExport>;
    if (parsed.schemaVersion !== 'master_ai_memory_v2') {
      throw new Error('Unsupported memory export schema version.');
    }

    if (mode === 'replace') {
      this.sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
      this.longTermMemories = [];
    } else if (Array.isArray(parsed.sessions)) {
      const existingIds = new Set(this.sessions.map((s) => s.id));
      for (const s of parsed.sessions) {
        if (s && s.id && !existingIds.has(s.id)) {
          this.sessions.push(s);
          existingIds.add(s.id);
        }
      }
    }

    let memCount = 0;
    if (Array.isArray(parsed.longTermMemories)) {
      for (const m of parsed.longTermMemories) {
        if (m && typeof m.content === 'string' && m.content.trim()) {
          const res = this.addLongTermMemory({
            content: m.content,
            category: m.category,
            provenance: m.provenance || 'remembered_from_prior_session',
            importanceScore: m.importanceScore,
            sourceSessionId: m.sourceSessionId,
            mediaFileName: m.mediaFileName,
            tags: m.tags,
            pinned: m.pinned,
          });
          if (res.added) memCount++;
        }
      }
    }

    this.persist();
    return {
      sessionsImported: Array.isArray(parsed.sessions) ? parsed.sessions.length : 0,
      memoriesImported: memCount,
    };
  }

  public exportSessionMarkdown(session: ConversationSession): string {
    const lines = [
      `# MASTER AI v1.0 Conversation: ${session.title}`,
      `- Session ID: \`${session.id}\``,
      `- Media File: \`${session.mediaFileName || 'None'}\``,
      `- Language Mode: \`${session.languageMode}\``,
      `- Exported: ${new Date().toISOString()}`,
      '',
      '---',
      '',
    ];
    for (const msg of session.messages) {
      const ts = new Date(msg.timestamp).toLocaleTimeString();
      const speaker = msg.sender === 'user' ? 'User' : `MASTER AI (${msg.sourceLabel || msg.modelTag || 'Local'})`;
      lines.push(`### ${speaker} — ${ts}`);
      lines.push('');
      lines.push(msg.text);
      lines.push('');
    }
    return lines.join('\n');
  }
}

export const conversationMemory = new ConversationMemoryManager();
