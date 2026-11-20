/**
 * src/features/ai/components/MasterAi2Shell.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — TOP-LEVEL MULTI-PROVIDER APPLICATION SHELL
 * Seamlessly routes between Groq conversational LPU streaming, Pollinations AI
 * image generation, editing, variations, upscaling, background removal,
 * batch generation (1-4x), and conversation branching.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { MasterAi2Sidebar } from './MasterAi2Sidebar';
import { MasterAi2Header } from './MasterAi2Header';
import { MasterAi2ChatArea } from './MasterAi2ChatArea';
import { MasterAi2Composer } from './MasterAi2Composer';
import { MasterAi2ImageLightbox } from './MasterAi2ImageLightbox';
import { useAiChatStore } from '../stores/aiChatStore';
import { aiVaultService } from '../services/aiVaultService';
import { groqService } from '../services/groqService';
import { pollinationsService } from '../services/pollinationsService';
import { AiProviderRouter } from '../services/aiProviderRouter';
import { ContextManager } from '../services/contextManager';
import { AiAttachment, AiImageDetails } from '../types/aiTypes';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function MasterAi2Shell() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const getActiveConversation = useAiChatStore((s) => s.getActiveConversation);
  const selectedModelId = useAiChatStore((s) => s.selectedModelId);
  const setSelectedModelId = useAiChatStore((s) => s.setSelectedModelId);
  const activeImageModelId = useAiChatStore((s) => s.activeImageModelId);
  const chatMode = useAiChatStore((s) => s.chatMode);
  const setChatMode = useAiChatStore((s) => s.setChatMode);
  const aspectRatio = useAiChatStore((s) => s.aspectRatio);
  const batchCount = useAiChatStore((s) => s.batchCount);
  const imageSeed = useAiChatStore((s) => s.imageSeed);
  const imageResolution = useAiChatStore((s) => s.imageResolution);
  const addUserMessage = useAiChatStore((s) => s.addUserMessage);
  const createAssistantPlaceholder = useAiChatStore((s) => s.createAssistantPlaceholder);
  const updateAssistantContent = useAiChatStore((s) => s.updateAssistantContent);
  const finalizeAssistantMessage = useAiChatStore((s) => s.finalizeAssistantMessage);
  const setAssistantError = useAiChatStore((s) => s.setAssistantError);
  const createImagePlaceholder = useAiChatStore((s) => s.createImagePlaceholder);
  const finalizeImageMessage = useAiChatStore((s) => s.finalizeImageMessage);
  const setImageError = useAiChatStore((s) => s.setImageError);
  const setStreaming = useAiChatStore((s) => s.setStreaming);
  const renameConversation = useAiChatStore((s) => s.renameConversation);
  const newConversation = useAiChatStore((s) => s.newConversation);
  const refreshProviderStatus = useAiChatStore((s) => s.refreshProviderStatus);
  const branchConversation = useAiChatStore((s) => s.branchConversation);

  // Automatic Provider Initialization on mount
  useEffect(() => {
    aiVaultService.init().then(() => {
      refreshProviderStatus();
      pollinationsService.fetchModels().catch(() => {});
      groqService
        .discoverActiveModels()
        .then((models) => {
          const chatModels = models.filter(
            (m) => !m.id.includes('whisper') && !m.id.includes('guard') && m.isActive
          );
          if (chatModels.length > 0) {
            const isCurrentValid = chatModels.some((m) => m.id === selectedModelId);
            if (!isCurrentValid) {
              const defaultModel = chatModels.find((m) => m.isDefault) || chatModels[0];
              setSelectedModelId(defaultModel.id);
            }
          }
        })
        .catch(() => {});
    });
  }, [refreshProviderStatus, selectedModelId, setSelectedModelId]);

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

      // 1. Resolve Provider Route (Groq Text vs Pollinations Gen vs Pollinations Edit)
      const route = AiProviderRouter.resolveRoute(text, chatMode, attachments);

      // 2. Add user message
      addUserMessage(text, attachments);

      // 3. Create AbortController
      const abortCtrl = new AbortController();
      abortControllerRef.current = abortCtrl;

      // ── ROUTE A: IMAGE GENERATION (Pollinations) ──
      if (route.intent === 'image_generation') {
        const count = Math.max(1, Math.min(4, batchCount));

        if (count > 1) {
          // Batch Generation (2x or 4x)
          const msgIds: string[] = [];
          for (let i = 0; i < count; i++) {
            msgIds.push(
              createImagePlaceholder(
                `${route.cleanedPrompt} (${i + 1}/${count})`,
                activeImageModelId,
                'pollinations'
              )
            );
          }

          try {
            const results = await pollinationsService.generateBatchImages(
              {
                prompt: route.cleanedPrompt,
                modelId: activeImageModelId,
                aspectRatio,
                seed: imageSeed ?? undefined,
                baseResolution: imageResolution,
                signal: abortCtrl.signal,
              },
              count
            );

            results.forEach((res, idx) => {
              finalizeImageMessage(msgIds[idx], {
                url: res.imageUrl,
                prompt: route.cleanedPrompt,
                provider: 'pollinations',
                modelId: res.modelUsed,
                modelTitle: res.modelTitle,
                width: res.width,
                height: res.height,
                seed: res.seed,
                aspectRatio,
                generationTimeMs: res.generationTimeMs,
              });
            });

            if (activeConv.messages.length <= 1) {
              renameConversation(activeConv.id, `Art: ${route.cleanedPrompt.slice(0, 24)}`);
            }
          } catch (err: any) {
            if (!abortCtrl.signal.aborted) {
              msgIds.forEach((id) =>
                setImageError(id, err?.message || 'Batch generation error')
              );
            }
          } finally {
            setStreaming(false);
            abortControllerRef.current = null;
          }
          return;
        }

        // Single Image Generation
        const msgId = createImagePlaceholder(route.cleanedPrompt, activeImageModelId, 'pollinations');
        try {
          const result = await pollinationsService.generateImage({
            prompt: route.cleanedPrompt,
            modelId: activeImageModelId,
            aspectRatio,
            seed: imageSeed ?? undefined,
            baseResolution: imageResolution,
            signal: abortCtrl.signal,
          });

          finalizeImageMessage(msgId, {
            url: result.imageUrl,
            prompt: route.cleanedPrompt,
            provider: 'pollinations',
            modelId: result.modelUsed,
            modelTitle: result.modelTitle,
            width: result.width,
            height: result.height,
            seed: result.seed,
            aspectRatio,
            generationTimeMs: result.generationTimeMs,
          });

          // Auto-title conversation from prompt if first turn
          if (activeConv.messages.length <= 1) {
            renameConversation(activeConv.id, `Art: ${route.cleanedPrompt.slice(0, 24)}`);
          }
        } catch (err: any) {
          if (!abortCtrl.signal.aborted) {
            setImageError(msgId, err?.message || 'Image generation error');
          }
        } finally {
          setStreaming(false);
          abortControllerRef.current = null;
        }
        return;
      }

      // ── ROUTE B: IMAGE EDITING (Pollinations) ──
      if (route.intent === 'image_edit' && route.referenceImageAttachment?.url) {
        const msgId = createImagePlaceholder(route.cleanedPrompt, activeImageModelId, 'pollinations');
        try {
          const result = await pollinationsService.editImage({
            prompt: route.cleanedPrompt,
            imageBlobOrUrl: route.referenceImageAttachment.url,
            modelId: activeImageModelId,
            signal: abortCtrl.signal,
          });

          finalizeImageMessage(msgId, {
            url: result.imageUrl,
            prompt: route.cleanedPrompt,
            provider: 'pollinations',
            modelId: result.modelUsed,
            modelTitle: result.modelTitle,
            width: result.width,
            height: result.height,
            seed: result.seed,
            isEdited: true,
            referenceImageId: route.referenceImageAttachment.id,
            generationTimeMs: result.generationTimeMs,
          });
        } catch (err: any) {
          if (!abortCtrl.signal.aborted) {
            setImageError(msgId, err?.message || 'Image editing error');
          }
        } finally {
          setStreaming(false);
          abortControllerRef.current = null;
        }
        return;
      }

      // ── ROUTE C: CONVERSATIONAL GROQ LPU TEXT / REASONING ──
      const history = activeConv.messages;
      const inferenceMessages = ContextManager.buildMessagesForInference(
        history,
        text,
        attachments,
        activeConv.systemPrompt
      );

      const assistantMsgId = createAssistantPlaceholder();

      try {
        let accumulatedText = '';
        const result = await groqService.streamChat({
          model: selectedModelId,
          messages: inferenceMessages,
          signal: abortCtrl.signal,
          onChunk: (_chunk, fullText) => {
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

        // Generate smart title if this is the first turn
        if (activeConv.messages.length <= 1) {
          ContextManager.generateTitle(text)
            .then((smartTitle) => {
              if (smartTitle) {
                renameConversation(activeConv.id, smartTitle);
              }
            })
            .catch(() => {});
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
      chatMode,
      selectedModelId,
      activeImageModelId,
      aspectRatio,
      batchCount,
      imageSeed,
      imageResolution,
      addUserMessage,
      createAssistantPlaceholder,
      updateAssistantContent,
      finalizeAssistantMessage,
      setAssistantError,
      createImagePlaceholder,
      finalizeImageMessage,
      setImageError,
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
      setChatMode('image');
      const referenceAtt: AiAttachment = {
        id: `att_ref_${Date.now()}`,
        name: 'reference_image.png',
        type: 'image',
        sizeBytes: 1024,
        url: imageUrl,
      };
      toast.info('Loaded reference image for editing in chat.');
      handleSendMessage(`Edit this image: ${prompt}`, [referenceAtt]);
    },
    [setChatMode, handleSendMessage]
  );

  const handleVariation = useCallback(
    async (details: AiImageDetails) => {
      toast.info('Generating creative variation...');
      const msgId = createImagePlaceholder(
        `${details.prompt} (Variation)`,
        activeImageModelId,
        'pollinations'
      );
      try {
        const result = await pollinationsService.generateVariation(
          details.prompt,
          details.seed,
          details.modelId
        );
        finalizeImageMessage(msgId, {
          url: result.imageUrl,
          prompt: `${details.prompt} (Variation)`,
          provider: 'pollinations',
          modelId: result.modelUsed,
          modelTitle: result.modelTitle,
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
    [activeImageModelId, createImagePlaceholder, finalizeImageMessage, setImageError]
  );

  const handleRemoveBackground = useCallback(
    async (imageUrl: string) => {
      toast.info('Extracting subject and removing background...');
      const msgId = createImagePlaceholder('Cutout: Isolated Subject', activeImageModelId, 'pollinations');
      try {
        const result = await pollinationsService.removeBackground(imageUrl);
        finalizeImageMessage(msgId, {
          url: result.imageUrl,
          prompt: 'Cutout: Isolated Subject',
          provider: 'pollinations',
          modelId: result.modelUsed,
          modelTitle: result.modelTitle,
          width: result.width,
          height: result.height,
          seed: result.seed,
          isEdited: true,
          generationTimeMs: result.generationTimeMs,
        });
        toast.success('Background removed successfully!');
      } catch (err: any) {
        setImageError(msgId, err?.message || 'Background removal failed');
      }
    },
    [activeImageModelId, createImagePlaceholder, finalizeImageMessage, setImageError]
  );

  const handleUpscale = useCallback(
    async (imageUrl: string) => {
      toast.info('Enhancing and upscaling to 2x resolution...');
      const msgId = createImagePlaceholder('Upscaled 2x Image', activeImageModelId, 'pollinations');
      try {
        const result = await pollinationsService.upscaleImage(imageUrl, 2);
        finalizeImageMessage(msgId, {
          url: result.imageUrl,
          prompt: 'Upscaled 2x Ultra-High Fidelity',
          provider: 'pollinations',
          modelId: result.modelUsed,
          modelTitle: result.modelTitle,
          width: result.width,
          height: result.height,
          seed: result.seed,
          isEdited: true,
          generationTimeMs: result.generationTimeMs,
        });
        toast.success('Image upscaled to 2x resolution!');
      } catch (err: any) {
        setImageError(msgId, err?.message || 'Upscaling failed');
      }
    },
    [activeImageModelId, createImagePlaceholder, finalizeImageMessage, setImageError]
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
          onRemoveBackground={handleRemoveBackground}
          onUpscale={handleUpscale}
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
