/**
 * src/features/ai/components/MasterAi2Shell.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI INFINITY — UNIFIED APPLICATION SHELL
 * Direct, single-pane AI assistant uniting Groq, xKiro, and Pollinations free chat models
 * with official SenseNova U1.5 Lite image synthesis and live web intelligence.
 *
 * Strict Compliance:
 * - One unified chat interface (no separate tabs, no separate apps)
 * - Zero third-party provider branding in UI
 * - Instant semantic chat naming on turn 1
 * - Exclusively SenseNova U1.5 Lite for visual asset generation
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { MasterAi2Sidebar } from './MasterAi2Sidebar';
import { MasterAi2Header } from './MasterAi2Header';
import { MasterAi2ChatArea } from './MasterAi2ChatArea';
import { MasterAi2Composer } from './MasterAi2Composer';
import { MasterAi2ImageLightbox } from './MasterAi2ImageLightbox';
import { useAiChatStore } from '../stores/aiChatStore';
import { unifiedModelEngine } from '../services/unifiedModelEngine';
import { senseNovaImageService, SENSENOVA_MODEL_ID, SENSENOVA_MODEL_TITLE } from '../services/senseNovaImageService';
import { ContextManager } from '../services/contextManager';
import { AiAttachment, AiImageDetails, WebSearchResult } from '../types/aiTypes';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function MasterAi2Shell() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const getActiveConversation = useAiChatStore((s) => s.getActiveConversation);
  const selectedModelId = useAiChatStore((s) => s.selectedModelId);
  const isWebSearchEnabled = useAiChatStore((s) => s.isWebSearchEnabled);
  const aspectRatio = useAiChatStore((s) => s.aspectRatio);
  const addUserMessage = useAiChatStore((s) => s.addUserMessage);
  const createAssistantPlaceholder = useAiChatStore((s) => s.createAssistantPlaceholder);
  const updateAssistantContent = useAiChatStore((s) => s.updateAssistantContent);
  const finalizeAssistantMessage = useAiChatStore((s) => s.finalizeAssistantMessage);
  const setAssistantError = useAiChatStore((s) => s.setAssistantError);
  const createImagePlaceholder = useAiChatStore((s) => s.createImagePlaceholder);
  const finalizeImageMessage = useAiChatStore((s) => s.finalizeImageMessage);
  const setImageError = useAiChatStore((s) => s.setImageError);
  const setStreaming = useAiChatStore((s) => s.setStreaming);
  const newConversation = useAiChatStore((s) => s.newConversation);
  const refreshProviderStatus = useAiChatStore((s) => s.refreshProviderStatus);
  const fetchUnifiedModels = useAiChatStore((s) => s.fetchUnifiedModels);
  const syncHistoryWithServer = useAiChatStore((s) => s.syncHistoryWithServer);
  const branchConversation = useAiChatStore((s) => s.branchConversation);

  // Initialize service status, sync persistent history with server, and discover free models on mount
  useEffect(() => {
    refreshProviderStatus();
    syncHistoryWithServer();
    fetchUnifiedModels(false);
  }, [refreshProviderStatus, syncHistoryWithServer, fetchUnifiedModels]);

  // Global Keyboard Shortcuts (Ctrl+N for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newConversation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newConversation]);

  // Context-action from Cloud Drive: auto-attach file if passed via sessionStorage
  useEffect(() => {
    const preAttachedId = sessionStorage.getItem('master_ai_attached_file_id');
    if (preAttachedId) {
      sessionStorage.removeItem('master_ai_attached_file_id');
      api
        .getFileContentText(preAttachedId)
        .then((content) => {
          if (content) {
            toast.success('Attached file context from Drive to Master AI');
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleStopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreaming(false);
    toast.info('Generation halted.');
  }, [setStreaming]);

  const handleSendMessage = useCallback(
    async (text: string, attachments: AiAttachment[] = []) => {
      const activeConv = getActiveConversation();
      if (!activeConv || !text.trim()) return;

      // 1. Add user message (triggers automatic smart naming on turn 1)
      addUserMessage(text, attachments);

      // 2. Create AbortController
      const abortCtrl = new AbortController();
      abortControllerRef.current = abortCtrl;

      // 3. Resolve Intent: Image generation vs Conversational Chat
      const imageIntent = unifiedModelEngine.detectImageIntent(text);
      const isImageRequest = imageIntent.isImage;

      // ── ROUTE A: SENSENOVA U1.5 LITE IMAGE SYNTHESIS ──
      if (isImageRequest) {
        const prompt = imageIntent.prompt;
        const msgId = createImagePlaceholder(prompt, SENSENOVA_MODEL_ID, 'xkiro');

        try {
          const result = await senseNovaImageService.generateImage({
            prompt,
            aspectRatio,
            signal: abortCtrl.signal,
          });

          finalizeImageMessage(msgId, {
            url: result.imageUrl,
            prompt,
            provider: 'xkiro',
            modelId: result.modelUsed,
            modelTitle: SENSENOVA_MODEL_TITLE,
            width: result.width,
            height: result.height,
            seed: result.seed,
            aspectRatio,
            generationTimeMs: result.generationTimeMs,
          });
        } catch (err: any) {
          if (!abortCtrl.signal.aborted) {
            setImageError(msgId, err?.message || 'SenseNova image synthesis error');
          }
        } finally {
          setStreaming(false);
          abortControllerRef.current = null;
        }
        return;
      }

      // ── ROUTE B: CONVERSATIONAL STREAMING CHAT (Groq / xKiro / Pollinations) ──
      const history = activeConv.messages;
      const inferenceMessages = ContextManager.buildMessagesForInference(
        history,
        text,
        attachments,
        activeConv.systemPrompt,
        selectedModelId
      );

      const assistantMsgId = createAssistantPlaceholder();
      let webSourcesReported: WebSearchResult[] = [];

      try {
        let accumulatedText = '';
        const result = await unifiedModelEngine.streamChat({
          model: selectedModelId,
          messages: inferenceMessages,
          signal: abortCtrl.signal,
          webSearch: isWebSearchEnabled,
          onChunk: (_chunk, fullText) => {
            accumulatedText = fullText;
          },
          onMetrics: (metrics) => {
            updateAssistantContent(assistantMsgId, accumulatedText, metrics);
          },
          onWebSources: (sources) => {
            webSourcesReported = sources;
          },
        });

        finalizeAssistantMessage(
          assistantMsgId,
          result.text || accumulatedText,
          result.modelUsed,
          result.metrics,
          result.webSearchResults || (webSourcesReported.length > 0 ? webSourcesReported : undefined)
        );
      } catch (err: any) {
        if (!abortCtrl.signal.aborted) {
          setAssistantError(assistantMsgId, err?.message || 'Inference error');
        }
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [
      getActiveConversation,
      selectedModelId,
      aspectRatio,
      isWebSearchEnabled,
      addUserMessage,
      createAssistantPlaceholder,
      updateAssistantContent,
      finalizeAssistantMessage,
      setAssistantError,
      createImagePlaceholder,
      finalizeImageMessage,
      setImageError,
      setStreaming,
    ]
  );

  const handleRegenerate = useCallback(() => {
    const activeConv = getActiveConversation();
    if (!activeConv || activeConv.messages.length === 0) return;

    // Find last user message
    const msgs = [...activeConv.messages];
    let lastUserPrompt = '';
    let lastUserAttachments: AiAttachment[] | undefined;

    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserPrompt = msgs[i].content;
        lastUserAttachments = msgs[i].attachments;
        break;
      }
    }

    if (lastUserPrompt) {
      handleSendMessage(lastUserPrompt, lastUserAttachments || []);
    }
  }, [getActiveConversation, handleSendMessage]);

  // Branch conversation on edit of a past message
  const handleEditMessage = useCallback(
    (msgId: string, newText: string) => {
      branchConversation(msgId, newText);
      handleSendMessage(newText, []);
      toast.success('Branched conversation from edited message!');
    },
    [branchConversation, handleSendMessage]
  );

  const handleEditImageInChat = useCallback(
    (imageUrl: string, prompt: string) => {
      const referenceAtt: AiAttachment = {
        id: `att_ref_${Date.now()}`,
        name: 'reference_image.png',
        type: 'image',
        sizeBytes: 1024,
        url: imageUrl,
      };
      toast.info('Loaded reference image for creative synthesis.');
      handleSendMessage(prompt, [referenceAtt]);
    },
    [handleSendMessage]
  );

  const handleVariation = useCallback(
    async (details: AiImageDetails) => {
      toast.info('Synthesizing creative variation with SenseNova...');
      const msgId = createImagePlaceholder(
        `${details.prompt} (Variation)`,
        SENSENOVA_MODEL_ID,
        'xkiro'
      );
      try {
        const result = await senseNovaImageService.generateImage({
          prompt: details.prompt,
          aspectRatio: details.aspectRatio,
        });

        finalizeImageMessage(msgId, {
          url: result.imageUrl,
          prompt: `${details.prompt} (Variation)`,
          provider: 'xkiro',
          modelId: result.modelUsed,
          modelTitle: SENSENOVA_MODEL_TITLE,
          width: result.width,
          height: result.height,
          seed: result.seed,
          aspectRatio: details.aspectRatio,
          generationTimeMs: result.generationTimeMs,
        });
        toast.success('Variation generated!');
      } catch (err: any) {
        setImageError(msgId, err?.message || 'Variation failed');
      }
    },
    [createImagePlaceholder, finalizeImageMessage, setImageError]
  );

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden font-sans">
      {/* Windows 11 Acrylic Collapsible Sidebar */}
      <MasterAi2Sidebar />

      {/* Main Workspace Column */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-zinc-900/40">
        {/* Workspace Header */}
        <MasterAi2Header />

        {/* Central Chat Timeline */}
        <MasterAi2ChatArea
          onSendMessage={(prompt) => handleSendMessage(prompt, [])}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEditMessage}
          onEditImage={handleEditImageInChat}
          onVariation={handleVariation}
        />

        {/* Unified Multimodal Composer */}
        <MasterAi2Composer
          onSendMessage={handleSendMessage}
          onStopGenerating={handleStopGenerating}
        />
      </main>

      {/* Fullscreen Image Lightbox Modal */}
      <MasterAi2ImageLightbox />
    </div>
  );
}
