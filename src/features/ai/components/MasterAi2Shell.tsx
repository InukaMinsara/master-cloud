/**
 * src/features/ai/components/MasterAi2Shell.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI 2.0 — TOP-LEVEL APPLICATION SHELL
 * Coordinates streaming inference via Groq, session management, keyboard shortcuts,
 * and contextual Drive file attachments.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { MasterAi2Sidebar } from './MasterAi2Sidebar';
import { MasterAi2Header } from './MasterAi2Header';
import { MasterAi2ChatArea } from './MasterAi2ChatArea';
import { MasterAi2Composer } from './MasterAi2Composer';
import { MasterAi2KeyModal } from './MasterAi2KeyModal';
import { useAiChatStore } from '../stores/aiChatStore';
import { groqService } from '../services/groqService';
import { ContextManager } from '../services/contextManager';
import { AiAttachment } from '../types/aiTypes';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function MasterAi2Shell() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const getActiveConversation = useAiChatStore((s) => s.getActiveConversation);
  const selectedModelId = useAiChatStore((s) => s.selectedModelId);
  const addUserMessage = useAiChatStore((s) => s.addUserMessage);
  const createAssistantPlaceholder = useAiChatStore((s) => s.createAssistantPlaceholder);
  const updateAssistantContent = useAiChatStore((s) => s.updateAssistantContent);
  const finalizeAssistantMessage = useAiChatStore((s) => s.finalizeAssistantMessage);
  const setAssistantError = useAiChatStore((s) => s.setAssistantError);
  const setStreaming = useAiChatStore((s) => s.setStreaming);
  const renameConversation = useAiChatStore((s) => s.renameConversation);
  const newConversation = useAiChatStore((s) => s.newConversation);
  const setIsKeyModalOpen = useAiChatStore((s) => s.setIsKeyModalOpen);

  // Global Keyboard Shortcuts (Ctrl+N for new chat, Ctrl+K for Key Vault)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newConversation();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsKeyModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newConversation, setIsKeyModalOpen]);

  // Context-action from Cloud Drive: auto-attach file if passed via sessionStorage
  useEffect(() => {
    const preAttachedId = sessionStorage.getItem('master_ai_attached_file_id');
    if (preAttachedId) {
      sessionStorage.removeItem('master_ai_attached_file_id');
      api.getFileContentText(preAttachedId).then((content) => {
        if (content) {
          toast.success('Attached file context from Drive to Master AI 2.0');
        }
      }).catch(() => {});
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

      // 1. Add user message
      addUserMessage(text, attachments);

      // 2. Prepare context messages
      const history = activeConv.messages;
      const inferenceMessages = ContextManager.buildMessagesForInference(
        history,
        text,
        attachments,
        activeConv.systemPrompt
      );

      // 3. Create assistant placeholder
      const assistantMsgId = createAssistantPlaceholder();

      // 4. Create AbortController
      const abortCtrl = new AbortController();
      abortControllerRef.current = abortCtrl;

      try {
        let accumulatedText = '';
        const result = await groqService.streamChat({
          model: selectedModelId,
          messages: inferenceMessages,
          signal: abortCtrl.signal,
          onChunk: (chunk, fullText) => {
            accumulatedText = fullText;
          },
          onMetrics: (metrics) => {
            updateAssistantContent(assistantMsgId, accumulatedText, metrics);
          },
        });

        finalizeAssistantMessage(
          assistantMsgId,
          result.text || accumulatedText,
          result.modelUsed,
          result.metrics
        );

        // 5. Generate smart title if this is the first turn
        if (activeConv.messages.length <= 1) {
          ContextManager.generateTitle(text).then((smartTitle) => {
            if (smartTitle) {
              renameConversation(activeConv.id, smartTitle);
            }
          }).catch(() => {});
        }
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
      addUserMessage,
      createAssistantPlaceholder,
      updateAssistantContent,
      finalizeAssistantMessage,
      setAssistantError,
      setStreaming,
      renameConversation,
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

  const handleEditMessage = useCallback(
    (_msgId: string, newText: string) => {
      handleSendMessage(newText, []);
    },
    [handleSendMessage]
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-950 text-white font-sans">
      {/* Fluent Sidebar */}
      <MasterAi2Sidebar />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-gradient-to-b from-zinc-900/40 via-zinc-950 to-zinc-950">
        <MasterAi2Header />
        <MasterAi2ChatArea
          onSendMessage={(p) => handleSendMessage(p, [])}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEditMessage}
        />
        <MasterAi2Composer
          onSendMessage={handleSendMessage}
          onStopGenerating={handleStopGenerating}
        />
      </div>

      {/* Groq Key Modal */}
      <MasterAi2KeyModal />
    </div>
  );
}
