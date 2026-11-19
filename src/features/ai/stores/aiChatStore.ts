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
} from '../types/aiTypes';
import { DEFAULT_GROQ_MODEL } from '../services/groqModels';
import { DEFAULT_IMAGE_MODEL } from '../services/pollinationsModels';

const STORAGE_KEY = 'master_ai_conversations_v2';
const ACTIVE_CONV_KEY = 'master_ai_active_conv_id';

function createInitialConversation(): AiConversation {
  return {
    id: `conv_${Date.now()}`,
    title: 'New Conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

function loadPersistedConversations(): { conversations: AiConversation[]; activeId: string } {
  if (typeof window === 'undefined') {
    const init = createInitialConversation();
    return { conversations: [init], activeId: init.id };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: AiConversation[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const storedActiveId = localStorage.getItem(ACTIVE_CONV_KEY) || parsed[0].id;
        const validActive = parsed.some((c) => c.id === storedActiveId) ? storedActiveId : parsed[0].id;
        return { conversations: parsed, activeId: validActive };
      }
    }

    // Check legacy storage keys to ensure ZERO user history loss
    const legacyRaw = localStorage.getItem('master_ai_chat_sessions') || localStorage.getItem('master_ai_sessions');
    if (legacyRaw) {
      const legacySessions = JSON.parse(legacyRaw);
      if (Array.isArray(legacySessions) && legacySessions.length > 0) {
        const migrated: AiConversation[] = legacySessions.map((s: any) => ({
          id: s.id || `conv_${Date.now()}_${Math.random()}`,
          title: s.title || 'Imported Conversation',
          createdAt: s.createdAt ? new Date(s.createdAt).getTime() : Date.now(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt).getTime() : Date.now(),
          isPinned: Boolean(s.isPinned),
          messages: Array.isArray(s.messages)
            ? s.messages.map((m: any) => ({
                id: m.id || `msg_${Date.now()}_${Math.random()}`,
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content || '',
                timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now(),
              }))
            : [],
        }));
        const activeId = migrated[0].id;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return { conversations: migrated, activeId };
      }
    }
  } catch (e) {
    console.warn('[Master AI Store] Could not parse stored conversations:', e);
  }

  const initial = createInitialConversation();
  return { conversations: [initial], activeId: initial.id };
}

interface AiChatState {
  conversations: AiConversation[];
  activeConversationId: string;
  selectedModelId: string;
  activeImageModelId: string;
  chatMode: ChatMode;
  aspectRatio: ImageAspectRatio;
  isStreaming: boolean;
  streamingMessageId: string | null;
  activeMetrics: AiTokenMetrics | null;
  providerStatus: {
    groq: boolean;
    pollinations: boolean;
    comfyui: boolean;
  };
  lightboxImage: { url: string; prompt?: string; title?: string } | null;
  isSidebarOpen: boolean;
  searchQuery: string;

  // Actions
  refreshProviderStatus: () => Promise<void>;
  newConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  togglePinConversation: (id: string) => void;
  clearActiveConversation: () => void;
  setSelectedModelId: (modelId: string) => void;
  setActiveImageModelId: (modelId: string) => void;
  setChatMode: (mode: ChatMode) => void;
  setAspectRatio: (ratio: ImageAspectRatio) => void;
  addUserMessage: (content: string, attachments?: AiAttachment[]) => string;
  createAssistantPlaceholder: () => string;
  updateAssistantContent: (msgId: string, chunk: string, metrics?: AiTokenMetrics) => void;
  finalizeAssistantMessage: (msgId: string, fullText: string, modelUsed: string, metrics?: AiTokenMetrics) => void;
  setAssistantError: (msgId: string, errorText: string) => void;
  createImagePlaceholder: (prompt: string, modelId: string, provider: 'pollinations' | 'comfyui') => string;
  finalizeImageMessage: (msgId: string, details: AiImageDetails) => void;
  setImageError: (msgId: string, errorText: string) => void;
  setStreaming: (isStreaming: boolean, msgId?: string | null) => void;
  setLightboxImage: (img: { url: string; prompt?: string; title?: string } | null) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  getActiveConversation: () => AiConversation | undefined;
}

export const useAiChatStore = create<AiChatState>((set, get) => {
  const { conversations: initialConvs, activeId: initialActiveId } = loadPersistedConversations();

  const persist = (convs: AiConversation[], activeId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
      localStorage.setItem(ACTIVE_CONV_KEY, activeId);
    } catch (e) {
      console.warn('[Master AI Store] Save error:', e);
    }
  };

  return {
    conversations: initialConvs,
    activeConversationId: initialActiveId,
    selectedModelId: DEFAULT_GROQ_MODEL,
    activeImageModelId: DEFAULT_IMAGE_MODEL,
    chatMode: 'auto',
    aspectRatio: '1:1',
    isStreaming: false,
    streamingMessageId: null,
    activeMetrics: null,
    providerStatus: {
      groq: false,
      pollinations: true,
      comfyui: false,
    },
    lightboxImage: null,
    isSidebarOpen: true,
    searchQuery: '',

    refreshProviderStatus: async () => {
      try {
        const res = await fetch('/api/ai/status');
        if (res.ok) {
          const data = await res.json();
          set({
            providerStatus: {
              groq: Boolean(data?.groq?.available),
              pollinations: Boolean(data?.pollinations?.available),
              comfyui: Boolean(data?.comfyui?.available),
            },
          });
        }
      } catch (e) {
        console.warn('[Master AI Store] Failed to refresh provider status:', e);
      }
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

      set((state) => {
        const next = state.conversations.map((c) => {
          if (c.id === state.activeConversationId) {
            return {
              ...c,
              messages: [...c.messages, userMsg],
              updatedAt: Date.now(),
              title: c.messages.length === 0 ? content.slice(0, 32) : c.title,
            };
          }
          return c;
        });
        persist(next, state.activeConversationId);
        return { conversations: next };
      });

      return msgId;
    },

    createAssistantPlaceholder: () => {
      const assistantId = `msg_ai_${Date.now()}`;
      const placeholder: AiMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        providerUsed: 'groq' as const,
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

    finalizeAssistantMessage: (msgId: string, fullText: string, modelUsed: string, metrics?: AiTokenMetrics) => {
      set((state) => {
        const next = state.conversations.map((c) => {
          if (c.id === state.activeConversationId) {
            const updated = c.messages.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    content: fullText,
                    modelUsed,
                    providerUsed: 'groq' as const,
                    metrics,
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

    createImagePlaceholder: (prompt: string, modelId: string, provider: 'pollinations' | 'comfyui') => {
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
