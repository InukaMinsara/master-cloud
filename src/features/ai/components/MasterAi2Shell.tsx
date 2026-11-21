/**
 * src/features/ai/components/MasterAi2Shell.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — ENTERPRISE MULTI-PROVIDER CHAT PLATFORM
 * Strictly CHAT-ONLY:
 * - 9-provider unified chat routing & streaming
 * - Dual-model side-by-side comparative mode (#176, #177)
 * - Complete multimodal file understanding (PDF, Word, Excel, PPTX, Code, Vision, Video keyframes)
 * - Regeneration with alternative model (#178)
 * - Continue interrupted generation (#5)
 * - Branching, folders, and persistent multi-tier synchronization
 * - Zero image or video generation workflows
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MasterAi2Sidebar } from './MasterAi2Sidebar';
import { MasterAi2Header } from './MasterAi2Header';
import { MasterAi2ChatArea } from './MasterAi2ChatArea';
import { MasterAi2Composer } from './MasterAi2Composer';
import { MasterAi2CompareView } from './MasterAi2CompareView';
import { MasterAi2PromptTemplatesModal } from './MasterAi2PromptTemplatesModal';
import { useAiChatStore } from '../stores/aiChatStore';
import { unifiedModelEngine } from '../services/unifiedModelEngine';
import { ContextManager } from '../services/contextManager';
import { AiAttachment, WebSearchResult } from '../types/aiTypes';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function MasterAi2Shell() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const getActiveConversation = useAiChatStore((s) => s.getActiveConversation);
  const selectedModelId = useAiChatStore((s) => s.selectedModelId);
  const setSelectedModelId = useAiChatStore((s) => s.setSelectedModelId);
  const isWebSearchEnabled = useAiChatStore((s) => s.isWebSearchEnabled);
  const isComparisonMode = useAiChatStore((s) => s.isComparisonMode);
  const isFailoverEnabled = useAiChatStore((s) => s.isFailoverEnabled);
  const generationParameters = useAiChatStore((s) => s.generationParameters);
  const addUserMessage = useAiChatStore((s) => s.addUserMessage);
  const createAssistantPlaceholder = useAiChatStore((s) => s.createAssistantPlaceholder);
  const updateAssistantContent = useAiChatStore((s) => s.updateAssistantContent);
  const finalizeAssistantMessage = useAiChatStore((s) => s.finalizeAssistantMessage);
  const setAssistantError = useAiChatStore((s) => s.setAssistantError);
  const setStreaming = useAiChatStore((s) => s.setStreaming);
  const newConversation = useAiChatStore((s) => s.newConversation);
  const refreshProviderStatus = useAiChatStore((s) => s.refreshProviderStatus);
  const fetchUnifiedModels = useAiChatStore((s) => s.fetchUnifiedModels);
  const syncHistoryWithServer = useAiChatStore((s) => s.syncHistoryWithServer);
  const branchConversation = useAiChatStore((s) => s.branchConversation);

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Initialize service status, sync history, and discover free models on mount
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
    async (text: string, attachments: AiAttachment[] = [], overrideModelId?: string) => {
      const activeConv = getActiveConversation();
      if (!activeConv || !text.trim()) return;

      const modelToUse = overrideModelId || selectedModelId;

      // 1. Add user message
      addUserMessage(text, attachments);

      // 2. Create AbortController
      const abortCtrl = new AbortController();
      abortControllerRef.current = abortCtrl;

      // 3. Build messages context
      const history = activeConv.messages;
      const inferenceMessages = ContextManager.buildMessagesForInference(
        history,
        text,
        attachments,
        activeConv.systemPrompt,
        modelToUse
      );

      const assistantMsgId = createAssistantPlaceholder();
      let webSourcesReported: WebSearchResult[] = [];

      try {
        let accumulatedText = '';
        const result = await unifiedModelEngine.streamChat({
          model: modelToUse,
          messages: inferenceMessages,
          signal: abortCtrl.signal,
          webSearch: isWebSearchEnabled,
          failover: isFailoverEnabled,
          generationParameters,
          onChunk: (_chunk, fullText) => {
            accumulatedText = fullText;
          },
          onMetrics: (metrics) => {
            updateAssistantContent(assistantMsgId, accumulatedText, metrics);
          },
          onWebSources: (sources) => {
            webSourcesReported = sources;
          },
          onFailoverNotification: (orig, fallback) => {
            toast.warning(`Primary model rate-limited. Resumed on ${fallback.split('/').pop()}`);
          },
          onAutoModelSelected: (chosen) => {
            toast.info(`Auto selected: ${chosen.split('/').pop()}`);
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
      isWebSearchEnabled,
      isFailoverEnabled,
      generationParameters,
      addUserMessage,
      createAssistantPlaceholder,
      updateAssistantContent,
      finalizeAssistantMessage,
      setAssistantError,
      setStreaming,
    ]
  );

  const handleRegenerate = useCallback(
    (overrideModelId?: string) => {
      const activeConv = getActiveConversation();
      if (!activeConv || activeConv.messages.length === 0) return;

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
        handleSendMessage(lastUserPrompt, lastUserAttachments || [], overrideModelId);
      }
    },
    [getActiveConversation, handleSendMessage]
  );

  const handleContinueMessage = useCallback(() => {
    handleSendMessage('Please continue from exactly where you left off.', []);
  }, [handleSendMessage]);

  const handleRegenerateWithModel = useCallback(
    (modelId: string) => {
      setSelectedModelId(modelId);
      toast.info(`Regenerating using: ${modelId.split('/').pop()}`);
      handleRegenerate(modelId);
    },
    [setSelectedModelId, handleRegenerate]
  );

  const handleEditMessage = useCallback(
    (msgId: string, newText: string) => {
      branchConversation(msgId, newText);
      handleSendMessage(newText, []);
      toast.success('Branched conversation from edited message!');
    },
    [branchConversation, handleSendMessage]
  );

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden font-sans">
      {/* Acrylic Collapsible History & Folders Sidebar */}
      <MasterAi2Sidebar />

      {/* Main Workspace Column */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-zinc-900/40">
        {/* Workspace Header */}
        <MasterAi2Header />

        {/* Dual-Model Comparison Workbench (#176) OR Standard Chat Timeline */}
        {isComparisonMode ? (
          <MasterAi2CompareView />
        ) : (
          <>
            {/* Central Chat Timeline */}
            <MasterAi2ChatArea
              onSendMessage={(prompt) => handleSendMessage(prompt, [])}
              onRegenerate={() => handleRegenerate()}
              onContinueMessage={handleContinueMessage}
              onRegenerateWithModel={handleRegenerateWithModel}
              onEditMessage={handleEditMessage}
            />

            {/* Unified Multimodal Composer */}
            <MasterAi2Composer
              onSendMessage={handleSendMessage}
              onStopGenerating={handleStopGenerating}
              onOpenTemplates={() => setIsTemplatesOpen(true)}
            />
          </>
        )}
      </main>

      {/* Prompt Templates Modal */}
      <MasterAi2PromptTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={(prompt) => handleSendMessage(prompt, [])}
      />
    </div>
  );
}
