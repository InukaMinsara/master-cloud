/**
 * src/features/ai/components/MasterAi2ChatArea.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — MULTIMODAL CHAT TIMELINE
 * Auto-scrolling message list, streaming animation, welcome screen,
 * and support for text bubbles, image cards, variations, and image enhancements.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect } from 'react';
import { useAiChatStore } from '../stores/aiChatStore';
import { MasterAi2MessageBubble } from './MasterAi2MessageBubble';
import { MasterAi2Welcome } from './MasterAi2Welcome';
import { AiImageDetails } from '../types/aiTypes';

interface ChatAreaProps {
  onSendMessage: (text: string) => void;
  onRegenerate: () => void;
  onEditMessage: (msgId: string, newText: string) => void;
  onEditImage?: (imageUrl: string, prompt: string) => void;
  onVariation?: (details: AiImageDetails) => void;
  onRemoveBackground?: (imageUrl: string) => void;
  onUpscale?: (imageUrl: string) => void;
}

export function MasterAi2ChatArea({
  onSendMessage,
  onRegenerate,
  onEditMessage,
  onEditImage,
  onVariation,
  onRemoveBackground,
  onUpscale,
}: ChatAreaProps) {
  const activeConv = useAiChatStore(
    (s) => s.conversations.find((c) => c.id === s.activeConversationId) || s.conversations[0]
  );
  const isStreaming = useAiChatStore((s) => s.isStreaming);
  const streamingMessageId = useAiChatStore((s) => s.streamingMessageId);

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth auto-scroll to bottom during streaming, message update, or conversation switch
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [
    activeConv?.id,
    activeConv?.messages.length,
    activeConv?.messages[activeConv.messages.length - 1]?.content,
    activeConv?.messages[activeConv.messages.length - 1]?.imageDetails,
  ]);

  if (!activeConv || activeConv.messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center">
        <MasterAi2Welcome onSelectPrompt={(p) => onSendMessage(p)} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin scrollbar-thumb-zinc-800"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {activeConv.messages.map((msg, idx) => (
          <MasterAi2MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={isStreaming && msg.id === streamingMessageId}
            onRegenerate={
              idx === activeConv.messages.length - 1 && msg.role === 'assistant'
                ? onRegenerate
                : undefined
            }
            onEdit={
              msg.role === 'user'
                ? (newText) => onEditMessage(msg.id, newText)
                : undefined
            }
            onEditImage={onEditImage}
            onVariation={onVariation}
            onRemoveBackground={onRemoveBackground}
            onUpscale={onUpscale}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
