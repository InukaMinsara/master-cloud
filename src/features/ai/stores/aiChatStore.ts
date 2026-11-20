/**
 * src/features/ai/stores/aiChatStore.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — HIGH-SPEED MULTI-PROVIDER CHAT & IMAGE STORE
 * Unified reactive state management for Groq LPU text/code, Pollinations AI
 * image generation and editing, and local ComfyUI.
 *
 * Guarantees zero data loss across legacy sessions and multi-modal message formats.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';
import {
  AiAttachment,
  AiConversation,
  AiImageDetails,
  AiMessage,
  AiTokenMetrics,
  ChatMode,
  ImageAspectRatio,
  UnifiedChatModel,
  WebSearchResult,
} from '../types/aiTypes';
import { DEFAULT_GROQ_MODEL } from '../services/groqModels';
import { SENSENOVA_MODEL_ID } from '../services/senseNovaImageService';
import { unifiedModelEngine } from '../services/unifiedModelEngine';
import { ChatNamingService } from '../services/chatNamingService';
import { chatHistoryService, createInitialConversation } from '../services/chatHistoryService';

const STORAGE_KEY = 'master_ai_conversations_v2';
const ACTIVE_CONV_KEY = 'master_ai_active_conv_id';

interface AiChatState {
  conversations: AiConversation[];
  activeConversationId: string;
  selectedModelId: string;
  activeImageModelId: string;
  unifiedModels: UnifiedChatModel[];
  isModelsLoading: boolean;
  isWebSearchEnabled: boolean;
  chatMode: ChatMode;
  aspectRatio: ImageAspectRatio;
  isStreaming: boolean;
  streamingMessageId: string | null;
  activeMetrics: AiTokenMetrics | null;
  providerStatus: {
    groq: boolean;
    xkiro: boolean;
    pollinations: boolean;
    comfyui: boolean;
  };
  lightboxImage: { url: string; prompt?: string; title?: string } | null;
  isSidebarOpen: boolean;
  searchQuery: string;
  imageResolution: number;
  imageSeed: number | null;
  batchCount: number;
  favoriteModels: string[];
  promptHistory: string[];
  isHistoryLoading: boolean;

  // Actions
  refreshProviderStatus: () => Promise<void>;
  fetchUnifiedModels: (force?: boolean) => Promise<void>;
  syncHistoryWithServer: () => Promise<void>;
  toggleWebSearch: () => void;
  setWebSearchEnabled: (enabled: boolean) => void;
  newConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  restoreConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  togglePinConversation: (id: string) => void;
  clearActiveConversation: () => void;
  branchConversation: (fromMsgId: string, newContent?: string) => string;
  deleteMessage: (msgId: string) => void;
  setSelectedModelId: (modelId: string) => void;
  setActiveImageModelId: (modelId: string) => void;
  setChatMode: (mode: ChatMode) => void;
  setAspectRatio: (ratio: ImageAspectRatio) => void;
  setImageResolution: (res: number) => void;
  setImageSeed: (seed: number | null) => void;
  setBatchCount: (count: number) => void;
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
  createImagePlaceholder: (prompt: string, modelId?: string, provider?: 'xkiro' | 'pollinations' | 'comfyui') => string;
  finalizeImageMessage: (msgId: string, details: AiImageDetails) => void;
  setImageError: (msgId: string, errorText: string) => void;
  setStreaming: (isStreaming: boolean, msgId?: string | null) => void;
  setLightboxImage: (img: { url: string; prompt?: string; title?: string } | null) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  getActiveConversation: () => AiConversation | undefined;
}

export const useAiChatStore = create<AiChatState>((set, get) => {
  const { conversations: initialConvs, activeId: initialActiveId } = chatHistoryService.loadCachedConversations();

  const persist = (convs: AiConversation[], activeId: string) => {
    chatHistoryService.save(convs, activeId);
  };

  return {
    conversations: initialConvs,
    activeConversationId: initialActiveId,
    selectedModelId: DEFAULT_GROQ_MODEL,
    activeImageModelId: SENSENOVA_MODEL_ID,
    unifiedModels: [],
    isModelsLoading: false,
    isHistoryLoading: false,
    isWebSearchEnabled: false,
    chatMode: 'auto',
    aspectRatio: '1:1',
    isStreaming: false,
    streamingMessageId: null,
    activeMetrics: null,
    providerStatus: {
      groq: false,
      xkiro: false,
      pollinations: true,
      comfyui: false,
    },
    lightboxImage: null,
    isSidebarOpen: true,
    searchQuery: '',
    imageResolution: 1024,
    imageSeed: null,
    batchCount: 1,
    favoriteModels: [
      'openai/gpt-oss-120b',
      'mistralai/mistral-large-2512',
      'openai/gpt-5.4-nano',
      'mistralai/codestral-2508',
      'sensenova/sensenova-6.8-flash-lite',
      'sensenova/sensenova-u1.5-lite',
    ],
    promptHistory: [],

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
              comfyui: Boolean(data?.comfyui?.available),
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
          const exists = models.some((m) => m.id === current);
          if (!exists) {
            const def = models.find((m) => m.isDefault) || models[0];
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

    setImageResolution: (res: number) => {
      set({ imageResolution: res });
    },

    setImageSeed: (seed: number | null) => {
      set({ imageSeed: seed });
    },

    setBatchCount: (count: number) => {
      set({ batchCount: Math.max(1, Math.min(4, count)) });
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
        const role = m.role === 'user' ? '👤 **User**' : `🤖 **Master AI** *(${m.modelUsed || 'Groq'})*`;
        const time = new Date(m.timestamp).toLocaleTimeString();
        md += `### ${role}  ·  *${time}*\n\n${m.content}\n\n`;
        if (m.imageDetails) {
          md += `![Generated Image](${m.imageDetails.url})\n*Model: ${m.imageDetails.modelTitle || m.imageDetails.modelId}*\n\n`;
        }
      });
      return md;
    },

    setSelectedModelId: (modelId: string) => {
      set({ selectedModelId: modelId });
    },

    setActiveImageModelId: (modelId: string) => {
      set({ activeImageModelId: modelId });
    },

    setChatMode: (mode: ChatMode) => {
      set({ chatMode: mode });
    },

    setAspectRatio: (ratio: ImageAspectRatio) => {
      set({ aspectRatio: ratio });
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
        }, 150);
      }

      return msgId;
    },

    createAssistantPlaceholder: () => {
      const assistantId = `msg_ai_${Date.now()}`;
      const placeholder: AiMessage = {
        id: assistantId,
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
          streamingMessageId: assistantId,
          activeMetrics: null,
        };
      });

      return assistantId;
    },

    updateAssistantContent: (msgId: string, fullText: string, metrics?: AiTokenMetrics) => {
      set((state) => {
        const next = state.conversations.map((c) => {
          if (c.id === state.activeConversationId) {
            const updated = c.messages.map((m) =>
              m.id === msgId ? { ...m, content: fullText, metrics } : m
            );
            return { ...c, messages: updated };
          }
          return c;
        });
        return { conversations: next, activeMetrics: metrics || state.activeMetrics };
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
                    metrics,
                    webSearchResults: webSearchResults && webSearchResults.length > 0 ? webSearchResults : undefined,
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
                    content: `⚠️ **Inference Error**: ${errorText}`,
                    isError: true,
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

    createImagePlaceholder: (prompt: string, modelId: string = SENSENOVA_MODEL_ID, provider: 'xkiro' | 'pollinations' | 'comfyui' = 'xkiro') => {
      const msgId = `msg_img_${Date.now()}`;
      const placeholder: AiMessage = {
        id: msgId,
        role: 'assistant',
        content: prompt,
        timestamp: Date.now(),
        providerUsed: provider,
        modelUsed: modelId,
        isGeneratingImage: true,
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
        };
      });

      return msgId;
    },

    finalizeImageMessage: (msgId: string, details: AiImageDetails) => {
      set((state) => {
        const next = state.conversations.map((c) => {
          if (c.id === state.activeConversationId) {
            const updated = c.messages.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    content: details.prompt,
                    imageDetails: details,
                    isGeneratingImage: false,
                    providerUsed: details.provider,
                    modelUsed: details.modelId,
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

    setImageError: (msgId: string, errorText: string) => {
      set((state) => {
        const next = state.conversations.map((c) => {
          if (c.id === state.activeConversationId) {
            const updated = c.messages.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    content: `⚠️ **Image Generation Error**: ${errorText}`,
                    isGeneratingImage: false,
                    isError: true,
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
  };
});
