/**
 * src/features/ai/stores/aiChatStore.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — HIGH-SPEED MULTI-PROVIDER CHAT ENGINE STORE
 * Unified reactive state management for multi-provider streaming conversational AI,
 * generation parameter controls, multi-folder & tag organization, persistent memory,
 * prompt templates, dual-model comparison, and multi-tier offline-resilient persistence.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';
import {
  AiAttachment,
  AiConversation,
  AiFolder,
  AiImageDetails,
  AiMemoryItem,
  AiMessage,
  AiTokenMetrics,
  ChatMode,
  GenerationParameters,
  PromptTemplate,
  UnifiedChatModel,
  WebSearchResult,
} from '../types/aiTypes';
import { DEFAULT_GROQ_MODEL } from '../services/groqModels';
import { unifiedModelEngine } from '../services/unifiedModelEngine';
import { ChatNamingService } from '../services/chatNamingService';
import { chatHistoryService, createInitialConversation } from '../services/chatHistoryService';

export const DEFAULT_GENERATION_PARAMS: GenerationParameters = {
  temperature: 0.7,
  topP: 0.95,
  maxTokens: 4096,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  seed: null,
  stopSequences: [],
  stream: true,
  preset: 'balanced',
};

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'tpl_code_refactor',
    title: 'Code Refactor & Optimization',
    category: 'coding',
    prompt: 'Refactor this code to follow clean architecture principles, improve performance, remove redundancy, and add thorough TypeScript types and error handling:',
    description: 'Optimize code structure, performance, and type safety.',
    isFavorite: true,
  },
  {
    id: 'tpl_bug_debugger',
    title: 'Bug Debugger & Root Cause Analysis',
    category: 'coding',
    prompt: 'Analyze this code and error log. Identify the exact root cause, explain why it happens, and provide the minimal robust fix with regression test guidelines:',
    description: 'Pinpoint bug root causes and provide verified fixes.',
    isFavorite: true,
  },
  {
    id: 'tpl_architecture_design',
    title: 'System Architecture Design',
    category: 'coding',
    prompt: 'Design a scalable, secure, and production-grade full-stack system architecture for the following requirements. Include component hierarchy, data flow, API schema, and storage strategy:',
    description: 'Create end-to-end production architecture plans.',
    isFavorite: false,
  },
  {
    id: 'tpl_executive_summary',
    title: 'Executive Summary',
    category: 'writing',
    prompt: 'Summarize the attached document/text into an executive summary. Break it down into Key Takeaways, Critical Metrics, Risks, and Recommended Next Actions:',
    description: 'Transform complex content into high-level strategic takeaways.',
    isFavorite: true,
  },
  {
    id: 'tpl_root_cause_analysis',
    title: '5-Whys Root Cause Analysis',
    category: 'analysis',
    prompt: 'Conduct a rigorous 5-Whys root cause analysis on the following incident or problem, proposing concrete corrective and preventive actions (CAPA):',
    description: 'Systematic problem solving using 5-Whys methodology.',
    isFavorite: false,
  },
  {
    id: 'tpl_brainstorm_features',
    title: 'Creative Feature Ideation',
    category: 'brainstorming',
    prompt: 'Brainstorm 10 innovative, high-impact features for the following concept. For each feature, evaluate user value, technical feasibility, and differentiation:',
    description: 'Generate high-impact product ideas and differentiators.',
    isFavorite: false,
  },
];

const FOLDERS_KEY = 'master_ai_folders_v1';
const MEMORIES_KEY = 'master_ai_memories_v1';
const TEMPLATES_KEY = 'master_ai_templates_v1';
const GEN_PARAMS_KEY = 'master_ai_gen_params_v1';
const UI_PREFS_KEY = 'master_ai_ui_prefs_v1';

export interface UiPreferences {
  fontSize: 'sm' | 'md' | 'lg';
  density: 'compact' | 'normal' | 'relaxed';
  theme: 'dark' | 'light' | 'system';
}

interface AiChatState {
  conversations: AiConversation[];
  activeConversationId: string;
  selectedModelId: string;
  unifiedModels: UnifiedChatModel[];
  isModelsLoading: boolean;
  isWebSearchEnabled: boolean;
  isFailoverEnabled: boolean;
  chatMode: ChatMode;
  responsePreference: 'balanced' | 'fast' | 'quality';
  globalSystemPrompt: string;
  generationParameters: GenerationParameters;
  isStreaming: boolean;
  streamingMessageId: string | null;
  activeMetrics: AiTokenMetrics | null;
  providerStatus: {
    groq: boolean;
    xkiro: boolean;
    pollinations: boolean;
    nvidia: boolean;
    openrouter: boolean;
    unorouter: boolean;
    abhibots: boolean;
    apmix: boolean;
    experiential: boolean;
  };
  lightboxImage: { url: string; prompt?: string; title?: string } | null;
  isSidebarOpen: boolean;
  searchQuery: string;
  selectedFilterModel: string;
  selectedFilterDate: string;
  selectedFilterStatus: 'all' | 'active' | 'pinned' | 'archived';
  selectedSortOrder: 'newest' | 'oldest';
  favoriteModels: string[];
  promptHistory: string[];
  isHistoryLoading: boolean;

  // Folders & Tags
  folders: AiFolder[];
  activeFolderId: string | null;

  // Bulk conversation management
  isBulkMode: boolean;
  selectedConversationIds: string[];

  // Prompt templates
  promptTemplates: PromptTemplate[];

  // Persistent user memories / custom instructions
  memories: AiMemoryItem[];

  // Side-by-side comparison mode
  isComparisonMode: boolean;
  compareModelId: string;

  // Accessibility & Personalization
  uiPreferences: UiPreferences;

  // Actions
  refreshProviderStatus: () => Promise<void>;
  fetchUnifiedModels: (force?: boolean) => Promise<void>;
  syncHistoryWithServer: () => Promise<void>;
  toggleWebSearch: () => void;
  setWebSearchEnabled: (enabled: boolean) => void;
  setFailoverEnabled: (enabled: boolean) => void;
  setResponsePreference: (pref: 'balanced' | 'fast' | 'quality') => void;
  setGlobalSystemPrompt: (prompt: string) => void;
  setGenerationParameters: (params: Partial<GenerationParameters>) => void;
  resetGenerationParameters: () => void;
  newConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  restoreConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  togglePinConversation: (id: string) => void;
  duplicateConversation: (id: string) => string;
  clearActiveConversation: () => void;
  branchConversation: (fromMsgId: string, newContent?: string) => string;
  deleteMessage: (msgId: string) => void;
  setSelectedModelId: (modelId: string) => void;
  setChatMode: (mode: ChatMode) => void;
  toggleFavoriteModel: (modelId: string) => void;
  addPromptToHistory: (prompt: string) => void;
  exportConversation: (format: 'markdown' | 'json' | 'text') => string;
  addUserMessage: (content: string, attachments?: AiAttachment[]) => string;
  createAssistantPlaceholder: () => string;
  updateAssistantContent: (msgId: string, chunk: string, metrics?: AiTokenMetrics) => void;
  finalizeAssistantMessage: (
    msgId: string,
    fullText: string,
    modelUsed: string,
    metrics?: AiTokenMetrics,
    webSearchResults?: WebSearchResult[]
  ) => void;
  setAssistantError: (msgId: string, errorText: string) => void;
  setStreaming: (isStreaming: boolean, msgId?: string | null) => void;
  setLightboxImage: (img: { url: string; prompt?: string; title?: string } | null) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedFilterModel: (model: string) => void;
  setSelectedFilterDate: (date: string) => void;
  setSelectedFilterStatus: (status: 'all' | 'active' | 'pinned' | 'archived') => void;
  setSelectedSortOrder: (order: 'newest' | 'oldest') => void;
  getActiveConversation: () => AiConversation | undefined;

  // Folder Actions
  createFolder: (name: string, color?: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  setConversationFolder: (convId: string, folderId: string | null) => void;
  setActiveFolderId: (folderId: string | null) => void;

  // Tag Actions
  setConversationTags: (convId: string, tags: string[]) => void;

  // Bulk Actions
  toggleBulkMode: () => void;
  toggleSelectConversation: (id: string) => void;
  selectAllConversations: () => void;
  clearSelectedConversations: () => void;
  bulkDeleteConversations: () => void;
  bulkArchiveConversations: () => void;
  bulkExportConversations: (format: 'markdown' | 'json' | 'text') => string;

  // Prompt Templates Actions
  addPromptTemplate: (tpl: Omit<PromptTemplate, 'id'>) => string;
  deletePromptTemplate: (id: string) => void;
  toggleFavoriteTemplate: (id: string) => void;

  // Memory Actions
  addMemory: (content: string, scope?: string) => string;
  deleteMemory: (id: string) => void;
  toggleMemory: (id: string) => void;

  // Comparison Mode Actions
  setComparisonMode: (enabled: boolean, compareModelId?: string) => void;
  setCompareModelId: (modelId: string) => void;

  // Personalization Actions
  setUiPreferences: (prefs: Partial<UiPreferences>) => void;
}

export const useAiChatStore = create<AiChatState>((set, get) => {
  const { conversations: initialConvs, activeId: initialActiveId } = chatHistoryService.loadCachedConversations();

  const loadLocalJson = <T>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveLocalJson = <T>(key: string, data: T) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  const initialFolders = loadLocalJson<AiFolder[]>(FOLDERS_KEY, []);
  const initialMemories = loadLocalJson<AiMemoryItem[]>(MEMORIES_KEY, []);
  const initialTemplates = loadLocalJson<PromptTemplate[]>(TEMPLATES_KEY, DEFAULT_PROMPT_TEMPLATES);
  const initialGenParams = loadLocalJson<GenerationParameters>(GEN_PARAMS_KEY, DEFAULT_GENERATION_PARAMS);
  const initialUiPrefs = loadLocalJson<UiPreferences>(UI_PREFS_KEY, {
    fontSize: 'md',
    density: 'normal',
    theme: 'dark',
  });

  const persist = (convs: AiConversation[], activeId: string) => {
    chatHistoryService.save(convs, activeId);
  };

  return {
    conversations: initialConvs,
    activeConversationId: initialActiveId,
    selectedModelId: DEFAULT_GROQ_MODEL,
    unifiedModels: [],
    isModelsLoading: false,
    isHistoryLoading: false,
    isWebSearchEnabled: false,
    isFailoverEnabled: false, // Default false: Respects selected model strictly without silent switching
    chatMode: 'auto',
    responsePreference: 'balanced',
    globalSystemPrompt: '',
    generationParameters: initialGenParams,
    isStreaming: false,
    streamingMessageId: null,
    activeMetrics: null,
    providerStatus: {
      groq: false,
      xkiro: false,
      pollinations: true,
      nvidia: false,
      openrouter: false,
      unorouter: false,
      abhibots: false,
      apmix: false,
      experiential: false,
    },
    lightboxImage: null,
    isSidebarOpen: true,
    searchQuery: '',
    selectedFilterModel: 'all',
    selectedFilterDate: 'all',
    selectedFilterStatus: 'all',
    selectedSortOrder: 'newest',
    favoriteModels: [
      'openai/gpt-oss-120b',
      'mistralai/mistral-large-2512',
      'openai/gpt-5.4-nano',
      'mistralai/codestral-2508',
      'sensenova/sensenova-6.8-flash-lite',
    ],
    promptHistory: [],

    // Folders & Tags
    folders: initialFolders,
    activeFolderId: null,

    // Bulk Mode
    isBulkMode: false,
    selectedConversationIds: [],

    // Prompt templates
    promptTemplates: initialTemplates,

    // Memories
    memories: initialMemories,

    // Comparison Mode
    isComparisonMode: false,
    compareModelId: 'mistralai/mistral-large-2512',

    // UI Preferences
    uiPreferences: initialUiPrefs,

    refreshProviderStatus: async () => {
      try {
        const res = await fetch('/api/ai/status');
        if (res.ok) {
          const data = await res.json();
          set({
            providerStatus: {
              groq: Boolean(data?.groq?.available),
              xkiro: Boolean(data?.xkiro?.available),
              pollinations: Boolean(data?.pollinations?.available),
              nvidia: Boolean(data?.nvidia?.available),
              openrouter: Boolean(data?.openrouter?.available),
              unorouter: Boolean(data?.unorouter?.available),
              abhibots: Boolean(data?.abhibots?.available),
              apmix: Boolean(data?.apmix?.available),
              experiential: Boolean(data?.experiential?.available),
            },
          });
        }
      } catch (e) {
        console.warn('[Master AI Store] Failed to refresh provider status:', e);
      }
    },

    fetchUnifiedModels: async (force = false) => {
      set({ isModelsLoading: true });
      try {
        const models = await unifiedModelEngine.discoverModels(force);
        if (models && models.length > 0) {
          set({ unifiedModels: models });
          const current = get().selectedModelId;
          const isInvalid = current === 'llama-3.3-70b-versatile' || !models.some((m) => m.id === current);
          if (isInvalid) {
            const def = models.find((m) => m.id === DEFAULT_GROQ_MODEL) || models.find((m) => m.isDefault) || models[0];
            if (def) {
              set({ selectedModelId: def.id });
            }
          }
        }
      } catch (e) {
        console.warn('[Master AI Store] fetchUnifiedModels failed:', e);
      } finally {
        set({ isModelsLoading: false });
      }
    },

    toggleWebSearch: () => {
      set((state) => ({ isWebSearchEnabled: !state.isWebSearchEnabled }));
    },

    setWebSearchEnabled: (enabled: boolean) => {
      set({ isWebSearchEnabled: enabled });
    },

    setFailoverEnabled: (enabled: boolean) => {
      set({ isFailoverEnabled: enabled });
    },

    setResponsePreference: (pref: 'balanced' | 'fast' | 'quality') => {
      set({ responsePreference: pref });
    },

    setGlobalSystemPrompt: (prompt: string) => {
      set({ globalSystemPrompt: prompt });
    },

    setGenerationParameters: (params: Partial<GenerationParameters>) => {
      set((state) => {
        const updated = { ...state.generationParameters, ...params };
        saveLocalJson(GEN_PARAMS_KEY, updated);
        return { generationParameters: updated };
      });
    },

    resetGenerationParameters: () => {
      saveLocalJson(GEN_PARAMS_KEY, DEFAULT_GENERATION_PARAMS);
      set({ generationParameters: DEFAULT_GENERATION_PARAMS });
    },

    getActiveConversation: () => {
      const state = get();
      return state.conversations.find((c) => c.id === state.activeConversationId) || state.conversations[0];
    },

    newConversation: () => {
      const newConv = createInitialConversation();
      set((state) => {
        const next = [newConv, ...state.conversations];
        persist(next, newConv.id);
        return {
          conversations: next,
          activeConversationId: newConv.id,
          activeMetrics: null,
          isStreaming: false,
          streamingMessageId: null,
        };
      });
    },

    syncHistoryWithServer: async () => {
      set({ isHistoryLoading: true });
      try {
        const serverConvs = await chatHistoryService.fetchServerConversations();
        if (serverConvs && serverConvs.length > 0) {
          set((state) => {
            const map = new Map<string, AiConversation>();
            for (const c of state.conversations) {
              map.set(c.id, c);
            }
            for (const sc of serverConvs) {
              const existing = map.get(sc.id);
              if (!existing || (sc.updatedAt || 0) >= (existing.updatedAt || 0)) {
                map.set(sc.id, sc);
              }
            }
            const merged = Array.from(map.values()).sort(
              (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
            );
            const validActive = merged.some((c) => c.id === state.activeConversationId)
              ? state.activeConversationId
              : merged[0].id;
            persist(merged, validActive);
            return { conversations: merged, activeConversationId: validActive };
          });
        }
      } catch (err) {
        console.warn('[Master AI Store] syncHistoryWithServer error:', err);
      } finally {
        set({ isHistoryLoading: false });
      }
    },

    selectConversation: (id: string) => {
      set((state) => {
        if (!state.conversations.some((c) => c.id === id)) return state;
        persist(state.conversations, id);
        return {
          activeConversationId: id,
          activeMetrics: null,
          isStreaming: false,
          streamingMessageId: null,
        };
      });
    },

    deleteConversation: (id: string) => {
      chatHistoryService.deleteOnServer(id);
      set((state) => {
        const remaining = state.conversations.filter((c) => c.id !== id);
        const next = remaining.length > 0 ? remaining : [createInitialConversation()];
        const nextActive = state.activeConversationId === id ? next[0].id : state.activeConversationId;
        persist(next, nextActive);
        return {
          conversations: next,
          activeConversationId: nextActive,
          activeMetrics: null,
          isStreaming: false,
          streamingMessageId: null,
        };
      });
    },

    archiveConversation: (id: string) => {
      set((state) => {
        const next = state.conversations.map((c) =>
          c.id === id ? { ...c, isArchived: true, updatedAt: Date.now() } : c
        );
        let nextActive = state.activeConversationId;
        if (state.activeConversationId === id) {
          const firstUnarchived = next.find((c) => !c.isArchived);
          nextActive = firstUnarchived ? firstUnarchived.id : next[0].id;
        }
        persist(next, nextActive);
        return { conversations: next, activeConversationId: nextActive };
      });
    },

    restoreConversation: (id: string) => {
      set((state) => {
        const next = state.conversations.map((c) =>
          c.id === id ? { ...c, isArchived: false, updatedAt: Date.now() } : c
        );
        persist(next, id);
        return { conversations: next, activeConversationId: id };
      });
    },

    renameConversation: (id: string, newTitle: string) => {
      const title = newTitle.trim();
      if (!title) return;
      set((state) => {
        const next = state.conversations.map((c) =>
          c.id === id ? { ...c, title, updatedAt: Date.now() } : c
        );
        persist(next, state.activeConversationId);
        return { conversations: next };
      });
    },

    togglePinConversation: (id: string) => {
      set((state) => {
        const next = state.conversations.map((c) =>
          c.id === id ? { ...c, isPinned: !c.isPinned, updatedAt: Date.now() } : c
        );
        persist(next, state.activeConversationId);
        return { conversations: next };
      });
    },

    duplicateConversation: (id: string) => {
      const state = get();
      const original = state.conversations.find((c) => c.id === id);
      if (!original) return state.activeConversationId;

      const dupId = `conv_dup_${Date.now()}`;
      const duplicate: AiConversation = {
        ...original,
        id: dupId,
        title: `${original.title} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: original.messages.map((m) => ({ ...m, id: `msg_dup_${Date.now()}_${Math.random()}` })),
      };

      const next = [duplicate, ...state.conversations];
      persist(next, dupId);
      set({
        conversations: next,
        activeConversationId: dupId,
        activeMetrics: null,
      });
      return dupId;
    },

    clearActiveConversation: () => {
      set((state) => {
        const next = state.conversations.map((c) =>
          c.id === state.activeConversationId ? { ...c, messages: [], updatedAt: Date.now() } : c
        );
        persist(next, state.activeConversationId);
        return {
          conversations: next,
          activeMetrics: null,
          isStreaming: false,
          streamingMessageId: null,
        };
      });
    },

    branchConversation: (fromMsgId: string, newContent?: string) => {
      const state = get();
      const current = state.conversations.find((c) => c.id === state.activeConversationId);
      if (!current) return state.activeConversationId;

      const msgIndex = current.messages.findIndex((m) => m.id === fromMsgId);
      const sliced = msgIndex >= 0 ? current.messages.slice(0, msgIndex + 1) : [...current.messages];

      if (newContent && msgIndex >= 0) {
        sliced[msgIndex] = {
          ...sliced[msgIndex],
          content: newContent.trim(),
          timestamp: Date.now(),
        };
      }

      const branchId = `conv_branch_${Date.now()}`;
      const branchConv: AiConversation = {
        id: branchId,
        title: `${current.title.replace(/\s*\(Branch.*?\)/, '')} (Branch)`,
        messages: sliced,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelUsed: current.modelUsed,
      };

      const next = [branchConv, ...state.conversations];
      persist(next, branchId);
      set({
        conversations: next,
        activeConversationId: branchId,
        activeMetrics: null,
        isStreaming: false,
        streamingMessageId: null,
      });
      return branchId;
    },

    deleteMessage: (msgId: string) => {
      set((state) => {
        const next = state.conversations.map((c) => {
          if (c.id === state.activeConversationId) {
            return {
              ...c,
              messages: c.messages.filter((m) => m.id !== msgId),
              updatedAt: Date.now(),
            };
          }
          return c;
        });
        persist(next, state.activeConversationId);
        return { conversations: next };
      });
    },

    setSelectedModelId: (modelId: string) => {
      set({ selectedModelId: modelId });
    },

    setChatMode: (mode: ChatMode) => {
      set({ chatMode: mode });
    },

    toggleFavoriteModel: (modelId: string) => {
      set((state) => {
        const favs = new Set(state.favoriteModels);
        if (favs.has(modelId)) {
          favs.delete(modelId);
        } else {
          favs.add(modelId);
        }
        return { favoriteModels: Array.from(favs) };
      });
    },

    addPromptToHistory: (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;
      set((state) => {
        const next = [trimmed, ...state.promptHistory.filter((p) => p !== trimmed)].slice(0, 30);
        return { promptHistory: next };
      });
    },

    exportConversation: (format: 'markdown' | 'json' | 'text' = 'markdown') => {
      const state = get();
      const conv = state.conversations.find((c) => c.id === state.activeConversationId);
      if (!conv || conv.messages.length === 0) return '';

      if (format === 'json') {
        return JSON.stringify(conv, null, 2);
      }

      if (format === 'text') {
        let text = `MASTER AI TRANSCRIPT: ${conv.title}\nDate: ${new Date(conv.createdAt).toLocaleString()}\n\n`;
        conv.messages.forEach((m) => {
          const role = m.role === 'user' ? 'USER' : `ASSISTANT (${m.modelUsed || 'Master AI'})`;
          text += `[${new Date(m.timestamp).toLocaleTimeString()}] ${role}:\n${m.content}\n\n`;
        });
        return text;
      }

      // Markdown
      let md = `# ${conv.title}\n*Exported from Master AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
      conv.messages.forEach((m) => {
        const role = m.role === 'user' ? '👤 **User**' : `🤖 **Master AI** *(${m.modelUsed || 'Assistant'})*`;
        const time = new Date(m.timestamp).toLocaleTimeString();
        md += `### ${role}  ·  *${time}*\n\n${m.content}\n\n`;
      });
      return md;
    },

    addUserMessage: (content: string, attachments?: AiAttachment[]) => {
      const msgId = `msg_user_${Date.now()}`;
      const userMsg: AiMessage = {
        id: msgId,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      };

      let needsTitleRefine = false;
      let convIdToRefine = '';

      set((state) => {
        const next = state.conversations.map((c) => {
          if (c.id === state.activeConversationId) {
            const isFirstTurn = c.messages.length === 0 || c.title === 'New Conversation' || c.title.startsWith('New Chat');
            if (isFirstTurn) {
              needsTitleRefine = true;
              convIdToRefine = c.id;
            }
            const smartTitle = isFirstTurn ? ChatNamingService.generateImmediateTitle(content) : c.title;

            return {
              ...c,
              messages: [...c.messages, userMsg],
              updatedAt: Date.now(),
              title: smartTitle,
            };
          }
          return c;
        });
        persist(next, state.activeConversationId);
        return { conversations: next };
      });

      // Background asynchronous title refinement
      if (needsTitleRefine && convIdToRefine) {
        const selectedModel = get().selectedModelId;
        setTimeout(() => {
          ChatNamingService.refineTitleAsync(content, selectedModel)
            .then((refinedTitle) => {
              if (refinedTitle && refinedTitle !== 'New Conversation') {
                get().renameConversation(convIdToRefine, refinedTitle);
              }
            })
            .catch(() => {});
        }, 1200);
      }

      return msgId;
    },

    createAssistantPlaceholder: () => {
      const msgId = `msg_asst_${Date.now()}`;
      const placeholder: AiMessage = {
        id: msgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      set((state) => {
        const next = state.conversations.map((c) => {
          if (c.id === state.activeConversationId) {
            return {
              ...c,
              messages: [...c.messages, placeholder],
              updatedAt: Date.now(),
            };
          }
          return c;
        });
        persist(next, state.activeConversationId);
        return {
          conversations: next,
          isStreaming: true,
          streamingMessageId: msgId,
          activeMetrics: null,
        };
      });

      return msgId;
    },

    updateAssistantContent: (msgId: string, chunk: string, metrics?: AiTokenMetrics) => {
      set((state) => {
        const next = state.conversations.map((c) => {
          if (c.id === state.activeConversationId) {
            const updated = c.messages.map((m) =>
              m.id === msgId ? { ...m, content: chunk, metrics: metrics || m.metrics } : m
            );
            return { ...c, messages: updated };
          }
          return c;
        });
        return {
          conversations: next,
          activeMetrics: metrics || state.activeMetrics,
        };
      });
    },

    finalizeAssistantMessage: (
      msgId: string,
      fullText: string,
      modelUsed: string,
      metrics?: AiTokenMetrics,
      webSearchResults?: WebSearchResult[]
    ) => {
      set((state) => {
        const next = state.conversations.map((c) => {
          if (c.id === state.activeConversationId) {
            const updated = c.messages.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    content: fullText,
                    modelUsed,
                    metrics: metrics || m.metrics,
                    webSearchResults: webSearchResults || m.webSearchResults,
                    timestamp: Date.now(),
                  }
                : m
            );
            return { ...c, messages: updated, updatedAt: Date.now() };
          }
          return c;
        });
        persist(next, state.activeConversationId);
        return {
          conversations: next,
          isStreaming: false,
          streamingMessageId: null,
          activeMetrics: metrics || null,
        };
      });
    },

    setAssistantError: (msgId: string, errorText: string) => {
      set((state) => {
        const next = state.conversations.map((c) => {
          if (c.id === state.activeConversationId) {
            const updated = c.messages.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    content: `⚠️ **Generation Error**: ${errorText}`,
                    isError: true,
                    timestamp: Date.now(),
                  }
                : m
            );
            return { ...c, messages: updated, updatedAt: Date.now() };
          }
          return c;
        });
        persist(next, state.activeConversationId);
        return {
          conversations: next,
          isStreaming: false,
          streamingMessageId: null,
        };
      });
    },

    setStreaming: (isStreaming: boolean, msgId?: string | null) => {
      set({ isStreaming, streamingMessageId: msgId ?? null });
    },

    setLightboxImage: (img: { url: string; prompt?: string; title?: string } | null) => {
      set({ lightboxImage: img });
    },

    toggleSidebar: () => {
      set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    setSelectedFilterModel: (model: string) => {
      set({ selectedFilterModel: model });
    },

    setSelectedFilterDate: (date: string) => {
      set({ selectedFilterDate: date });
    },

    setSelectedFilterStatus: (status: 'all' | 'active' | 'pinned' | 'archived') => {
      set({ selectedFilterStatus: status });
    },

    setSelectedSortOrder: (order: 'newest' | 'oldest') => {
      set({ selectedSortOrder: order });
    },

    // Folder Actions
    createFolder: (name: string, color?: string) => {
      const id = `folder_${Date.now()}`;
      const newFolder: AiFolder = { id, name: name.trim(), color: color || '#38bdf8', createdAt: Date.now() };
      set((state) => {
        const updated = [...state.folders, newFolder];
        saveLocalJson(FOLDERS_KEY, updated);
        return { folders: updated };
      });
      return id;
    },

    renameFolder: (id: string, name: string) => {
      set((state) => {
        const updated = state.folders.map((f) => (f.id === id ? { ...f, name: name.trim() } : f));
        saveLocalJson(FOLDERS_KEY, updated);
        return { folders: updated };
      });
    },

    deleteFolder: (id: string) => {
      set((state) => {
        const updatedFolders = state.folders.filter((f) => f.id !== id);
        const updatedConvs = state.conversations.map((c) =>
          c.folderId === id ? { ...c, folderId: null } : c
        );
        saveLocalJson(FOLDERS_KEY, updatedFolders);
        persist(updatedConvs, state.activeConversationId);
        return {
          folders: updatedFolders,
          conversations: updatedConvs,
          activeFolderId: state.activeFolderId === id ? null : state.activeFolderId,
        };
      });
    },

    setConversationFolder: (convId: string, folderId: string | null) => {
      set((state) => {
        const updated = state.conversations.map((c) => (c.id === convId ? { ...c, folderId } : c));
        persist(updated, state.activeConversationId);
        return { conversations: updated };
      });
    },

    setActiveFolderId: (folderId: string | null) => {
      set({ activeFolderId: folderId });
    },

    // Tag Actions
    setConversationTags: (convId: string, tags: string[]) => {
      set((state) => {
        const updated = state.conversations.map((c) => (c.id === convId ? { ...c, tags } : c));
        persist(updated, state.activeConversationId);
        return { conversations: updated };
      });
    },

    // Bulk Actions
    toggleBulkMode: () => {
      set((state) => ({
        isBulkMode: !state.isBulkMode,
        selectedConversationIds: [],
      }));
    },

    toggleSelectConversation: (id: string) => {
      set((state) => {
        const exists = state.selectedConversationIds.includes(id);
        const next = exists
          ? state.selectedConversationIds.filter((cid) => cid !== id)
          : [...state.selectedConversationIds, id];
        return { selectedConversationIds: next };
      });
    },

    selectAllConversations: () => {
      set((state) => ({
        selectedConversationIds: state.conversations.map((c) => c.id),
      }));
    },

    clearSelectedConversations: () => {
      set({ selectedConversationIds: [] });
    },

    bulkDeleteConversations: () => {
      const state = get();
      const idsToDelete = new Set(state.selectedConversationIds);
      idsToDelete.forEach((id) => chatHistoryService.deleteOnServer(id));
      const remaining = state.conversations.filter((c) => !idsToDelete.has(c.id));
      const next = remaining.length > 0 ? remaining : [createInitialConversation()];
      const nextActive = idsToDelete.has(state.activeConversationId) ? next[0].id : state.activeConversationId;
      persist(next, nextActive);
      set({
        conversations: next,
        activeConversationId: nextActive,
        selectedConversationIds: [],
        isBulkMode: false,
      });
    },

    bulkArchiveConversations: () => {
      set((state) => {
        const ids = new Set(state.selectedConversationIds);
        const next = state.conversations.map((c) =>
          ids.has(c.id) ? { ...c, isArchived: true, updatedAt: Date.now() } : c
        );
        persist(next, state.activeConversationId);
        return {
          conversations: next,
          selectedConversationIds: [],
          isBulkMode: false,
        };
      });
    },

    bulkExportConversations: (format: 'markdown' | 'json' | 'text' = 'markdown') => {
      const state = get();
      const ids = new Set(state.selectedConversationIds);
      const targetConvs = state.conversations.filter((c) => ids.has(c.id));
      if (targetConvs.length === 0) return '';

      if (format === 'json') {
        return JSON.stringify(targetConvs, null, 2);
      }

      let res = `# MASTER AI BULK EXPORT (${targetConvs.length} CONVERSATIONS)\n*Exported on ${new Date().toLocaleString()}*\n\n`;
      targetConvs.forEach((conv, idx) => {
        res += `\n---\n## [Conversation ${idx + 1}]: ${conv.title}\n`;
        res += `*Date: ${new Date(conv.createdAt).toLocaleString()}*\n\n`;
        conv.messages.forEach((m) => {
          const role = m.role === 'user' ? '👤 **User**' : `🤖 **Assistant** *(${m.modelUsed || 'Master AI'})*`;
          res += `**${role}**:\n${m.content}\n\n`;
        });
      });
      return res;
    },

    // Prompt Template Actions
    addPromptTemplate: (tpl: Omit<PromptTemplate, 'id'>) => {
      const id = `tpl_${Date.now()}`;
      const newTpl: PromptTemplate = { ...tpl, id };
      set((state) => {
        const updated = [newTpl, ...state.promptTemplates];
        saveLocalJson(TEMPLATES_KEY, updated);
        return { promptTemplates: updated };
      });
      return id;
    },

    deletePromptTemplate: (id: string) => {
      set((state) => {
        const updated = state.promptTemplates.filter((t) => t.id !== id);
        saveLocalJson(TEMPLATES_KEY, updated);
        return { promptTemplates: updated };
      });
    },

    toggleFavoriteTemplate: (id: string) => {
      set((state) => {
        const updated = state.promptTemplates.map((t) =>
          t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        );
        saveLocalJson(TEMPLATES_KEY, updated);
        return { promptTemplates: updated };
      });
    },

    // Memory Actions
    addMemory: (content: string, scope = 'global') => {
      const id = `mem_${Date.now()}`;
      const newMem: AiMemoryItem = { id, content: content.trim(), createdAt: Date.now(), enabled: true, scope };
      set((state) => {
        const updated = [newMem, ...state.memories];
        saveLocalJson(MEMORIES_KEY, updated);
        return { memories: updated };
      });
      return id;
    },

    deleteMemory: (id: string) => {
      set((state) => {
        const updated = state.memories.filter((m) => m.id !== id);
        saveLocalJson(MEMORIES_KEY, updated);
        return { memories: updated };
      });
    },

    toggleMemory: (id: string) => {
      set((state) => {
        const updated = state.memories.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m));
        saveLocalJson(MEMORIES_KEY, updated);
        return { memories: updated };
      });
    },

    // Comparison Mode
    setComparisonMode: (enabled: boolean, compareModelId?: string) => {
      set((state) => ({
        isComparisonMode: enabled,
        compareModelId: compareModelId || state.compareModelId,
      }));
    },

    setCompareModelId: (modelId: string) => {
      set({ compareModelId: modelId });
    },

    // Personalization Actions
    setUiPreferences: (prefs: Partial<UiPreferences>) => {
      set((state) => {
        const updated = { ...state.uiPreferences, ...prefs };
        saveLocalJson(UI_PREFS_KEY, updated);
        return { uiPreferences: updated };
      });
    },
  };
});
