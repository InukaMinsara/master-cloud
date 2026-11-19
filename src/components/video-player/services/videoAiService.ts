/**
 * src/components/video-player/services/videoAiService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * VIDEO PLAYER AI ADAPTER
 * Lightweight, modern session memory and Groq-integrated model registry
 * for in-player video intelligence, dialogue indexing, and transcripts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { VERIFIED_GROQ_MODELS } from '@/features/ai/services/groqModels';

export type LanguagePreferenceMode = 'auto' | 'en' | 'si' | 'mixed' | 'sinhala';

export interface StoredChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: number;
  sourcesUsed?: string[];
  sourceLabel?: string;
  modelTag?: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  mediaRef?: string;
  languageMode: LanguagePreferenceMode;
  createdAt: number;
  updatedAt: number;
  messages: StoredChatMessage[];
}

export interface NeuralGenerationConfig {
  temperature: number;
  topP: number;
  maxTokens: number;
  repetitionPenalty: number;
  topK?: number;
  maxNewTokens?: number;
}

export const DEFAULT_NEURAL_GEN_CONFIG: NeuralGenerationConfig = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 512,
  repetitionPenalty: 1.1,
  topK: 40,
  maxNewTokens: 512,
};

export interface AiModelDescriptor {
  id: string;
  name: string;
  category?: string;
  description?: string;
  contextLength?: number;
  providerId?: string;
  upstreamModelId?: string;
  isBuiltIn?: boolean;
  brain?: string;
  availability?: string;
  availabilityDetail?: string;
  currentlyLoaded?: boolean;
  vramUsedMb?: number;
  parameterCountLabel?: string;
  quantization?: string;
  diskSizeMb?: number;
  contextCapacityTokens?: number;
  isLocal?: boolean;
  [key: string]: any;
}

export type ChatSourceBadge = string;

export const VERIFIED_FREE_CHAT_MODELS: AiModelDescriptor[] = VERIFIED_GROQ_MODELS.map((m) => ({
  id: m.id,
  name: m.name,
  description: m.description,
  contextLength: m.contextWindow,
  providerId: 'groq',
  upstreamModelId: m.id,
  isBuiltIn: true,
  brain: 'Groq LPU',
  availability: 'online',
}));

export const PUTER_STANDARD_MODELS = VERIFIED_FREE_CHAT_MODELS;

export interface LongTermMemoryEntry {
  id: string;
  content: string;
  category: string;
  provenance: string;
  importanceScore: number;
  pinned: boolean;
  createdAt: number;
}

class VideoConversationMemory {
  private storageKey = 'master_video_ai_sessions';
  private memoryKey = 'master_video_ai_longterm_memory';

  public listSessions(): ConversationSession[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: 'default_video_session',
        title: 'Video Analysis Session',
        languageMode: 'auto',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      },
    ];
  }

  public getSession(id: string): ConversationSession | undefined {
    return this.listSessions().find((s) => s.id === id);
  }

  public createSession(title: string, mediaRef?: string, languageMode: LanguagePreferenceMode = 'auto'): ConversationSession {
    const fresh: ConversationSession = {
      id: `vsess_${Date.now()}`,
      title,
      mediaRef,
      languageMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    const list = [fresh, ...this.listSessions()];
    localStorage.setItem(this.storageKey, JSON.stringify(list));
    return fresh;
  }

  public saveMessages(id: string, messages: StoredChatMessage[], _append: boolean = false): void {
    const list = this.listSessions().map((s) =>
      s.id === id ? { ...s, messages, updatedAt: Date.now() } : s
    );
    localStorage.setItem(this.storageKey, JSON.stringify(list));
  }

  public renameSession(id: string, title: string): void {
    const list = this.listSessions().map((s) => (s.id === id ? { ...s, title } : s));
    localStorage.setItem(this.storageKey, JSON.stringify(list));
  }

  public deleteSession(id: string): void {
    const list = this.listSessions().filter((s) => s.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(list));
  }

  public clearSessionMessages(id: string): void {
    this.saveMessages(id, []);
  }

  public setSessionLanguage(id: string, languageMode: LanguagePreferenceMode): void {
    const list = this.listSessions().map((s) =>
      s.id === id ? { ...s, languageMode } : s
    );
    localStorage.setItem(this.storageKey, JSON.stringify(list));
  }

  public exportSessionMarkdown(session?: ConversationSession): string {
    if (!session) return '';
    let md = `# Video Analysis: ${session.title}\n\n`;
    for (const m of session.messages) {
      md += `**${m.sender.toUpperCase()}**: ${m.text}\n\n`;
    }
    return md;
  }

  public listLongTermMemories(searchQuery?: string): LongTermMemoryEntry[] {
    try {
      const raw = localStorage.getItem(this.memoryKey);
      const list: LongTermMemoryEntry[] = raw ? JSON.parse(raw) : [];
      if (!searchQuery?.trim()) return list;
      const q = searchQuery.toLowerCase();
      return list.filter((m) => m.content.toLowerCase().includes(q));
    } catch {
      return [];
    }
  }

  public addLongTermMemory(entry: {
    content: string;
    category: string;
    provenance: string;
    pinned?: boolean;
  }): { added: boolean } {
    const list = this.listLongTermMemories();
    const clean = entry.content.trim();
    if (list.some((m) => m.content.toLowerCase() === clean.toLowerCase())) {
      return { added: false };
    }
    const fresh: LongTermMemoryEntry = {
      id: `mem_${Date.now()}`,
      content: clean,
      category: entry.category,
      provenance: entry.provenance,
      importanceScore: 1.0,
      pinned: Boolean(entry.pinned),
      createdAt: Date.now(),
    };
    const next = [fresh, ...list];
    localStorage.setItem(this.memoryKey, JSON.stringify(next));
    return { added: true };
  }

  public pinLongTermMemory(id: string, pinned: boolean): void {
    const list = this.listLongTermMemories().map((m) =>
      m.id === id ? { ...m, pinned } : m
    );
    localStorage.setItem(this.memoryKey, JSON.stringify(list));
  }

  public deleteLongTermMemory(id: string): void {
    const list = this.listLongTermMemories().filter((m) => m.id !== id);
    localStorage.setItem(this.memoryKey, JSON.stringify(list));
  }

  public clearLongTermMemories(): void {
    localStorage.removeItem(this.memoryKey);
  }

  public rememberFact(factOrObj: string | { content: string; category?: string; source?: string }): { saved: boolean; id: string; reason?: string } {
    const content = typeof factOrObj === 'string' ? factOrObj : factOrObj.content;
    const category = typeof factOrObj === 'string' ? 'fact' : (factOrObj.category || 'fact');
    const provenance = typeof factOrObj === 'string' ? 'user' : (factOrObj.source || 'user');
    const res = this.addLongTermMemory({ content, category, provenance });
    return { saved: res.added, id: `mem_${Date.now()}` };
  }

  public forgetFact(id: string): void {
    this.deleteLongTermMemory(id);
  }

  public exportMemoryBundleJson(): string {
    return JSON.stringify(
      {
        sessions: this.listSessions(),
        memories: this.listLongTermMemories(),
      },
      null,
      2
    );
  }

  public importMemoryBundleJson(rawJson: string, _mode = 'merge'): { sessionsImported: number; memoriesImported: number } {
    const parsed = JSON.parse(rawJson);
    const sessions = Array.isArray(parsed?.sessions) ? parsed.sessions : [];
    const memories = Array.isArray(parsed?.memories) ? parsed.memories : [];
    localStorage.setItem(this.storageKey, JSON.stringify(sessions));
    localStorage.setItem(this.memoryKey, JSON.stringify(memories));
    return { sessionsImported: sessions.length, memoriesImported: memories.length };
  }
}

export const conversationMemory = new VideoConversationMemory();

export const humanFeedbackStore = {
  isConsentEnabled: () => true,
  setConsent: (_val: boolean) => {},
  recordFeedback: (_data: any) => ({ saved: true, reason: '' }),
  getStats: () => ({
    total: 0,
    positive: 0,
    negative: 0,
    totalEntries: 0,
    helpfulCount: 0,
    unhelpfulCount: 0,
    correctionsCount: 0,
  }),
  exportPreferencePairsJsonl: () => '',
  clearAll: () => {},
};

export const neuralRuntime = {
  getStatus: () => ({
    engine: 'Groq LPU Sovereign',
    status: 'ready',
    memoryUsageMB: 0,
    activeModel: 'llama-3.3-70b-versatile',
    backend: 'Groq Cloud',
    manifest: {
      name: 'Meta Llama 3.3 70B',
      version: '3.3',
      contextLength: 131072,
      parameterSize: '70B',
      parameter_count: 70_000_000_000,
      vocab_size: 128256,
      max_seq_len: 131072,
    },
    errorMessage: null as string | null,
  }),
};

export const modelRegistry = {
  listModels: (_filter?: any): AiModelDescriptor[] => VERIFIED_FREE_CHAT_MODELS,
  getModel: (id: string): AiModelDescriptor =>
    VERIFIED_FREE_CHAT_MODELS.find((m) => m.id === id) || VERIFIED_FREE_CHAT_MODELS[0],
  getProvider: (_id?: string): any => ({ baseUrl: 'http://127.0.0.1:11434' }),
  updateProvider: (_id: string, _updates: any): void => {},
  subscribe: (_fn: () => void): (() => void) => () => {},
};
