/**
 * src/features/ai/components/MasterAi2Composer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI 2.0 — HIGH-SPEED MULTIMODAL COMPOSER
 * Auto-expanding input, file attachment ingestion, request abortion,
 * and responsive model selection.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  X,
  FileText,
  Key,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { groqService } from '../services/groqService';
import { ContextManager } from '../services/contextManager';
import { AiAttachment } from '../types/aiTypes';
import { VERIFIED_GROQ_MODELS, getGroqModelInfo } from '../services/groqModels';
import { toast } from 'sonner';

interface ComposerProps {
  onSendMessage: (text: string, attachments: AiAttachment[]) => void;
  onStopGenerating: () => void;
}

export function MasterAi2Composer({ onSendMessage, onStopGenerating }: ComposerProps) {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<AiAttachment[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const isStreaming = useAiChatStore((s) => s.isStreaming);
  const selectedModelId = useAiChatStore((s) => s.selectedModelId);
  const setSelectedModelId = useAiChatStore((s) => s.setSelectedModelId);
  const setIsKeyModalOpen = useAiChatStore((s) => s.setIsKeyModalOpen);

  const hasKey = groqService.hasApiKey();
  const activeModel = getGroqModelInfo(selectedModelId);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return;
    if (!hasKey) {
      setIsKeyModalOpen(true);
      toast.warning('Please enter your free Groq API key to begin chatting.');
      return;
    }

    const text = inputText.trim();
    const currentAttachments = [...attachments];
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    onSendMessage(text, currentAttachments);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const textContent = await ContextManager.readFileText(file);
        const newAtt: AiAttachment = {
          id: `att_${Date.now()}_${i}`,
          name: file.name,
          type: 'file',
          sizeBytes: file.size,
          content: textContent,
        };
        setAttachments((prev) => [...prev, newAtt]);
        toast.success(`Attached "${file.name}"`);
      } catch (err: any) {
        toast.error(`Could not read ${file.name}: ${err?.message}`);
      }
    }
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 select-none">
      {/* Key Missing Banner */}
      {!hasKey && (
        <div className="mb-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-orange-400" />
            <span>Connect your 100% Free Groq API Key to enable instant LPU inference</span>
          </div>
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] transition-colors"
          >
            Enter Key
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="rounded-2xl border border-white/[0.1] bg-zinc-900/80 backdrop-blur-xl shadow-2xl p-2.5 space-y-2 focus-within:border-orange-500/40 transition-colors">
        {/* Attachment Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1 pt-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-zinc-200"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate max-w-[160px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Master AI 2.0 anything... (Enter to send, Shift+Enter for newline)"
          rows={1}
          className="w-full bg-transparent resize-none text-sm text-white placeholder:text-zinc-500 px-2 py-1 focus:outline-none scrollbar-thin scrollbar-thumb-zinc-700 leading-relaxed font-sans"
        />

        {/* Toolbar & Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
          {/* Left Actions: Attachments & Model Selector */}
          <div className="flex items-center gap-1.5">
            {/* File Attachment Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.md,.json,.csv,.ts,.tsx,.js,.py,.html,.css,.sql"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Attach document/code file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Model Dropdown Trigger */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-zinc-300 font-medium transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span>{activeModel.name}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {/* Model Dropdown Menu */}
              {isModelDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    Verified Groq Models
                  </div>
                  {VERIFIED_GROQ_MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        setSelectedModelId(model.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex flex-col gap-0.5 ${
                        model.id === selectedModelId
                          ? 'bg-orange-500/15 border border-orange-500/30 text-white'
                          : 'hover:bg-white/[0.05] text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{model.name}</span>
                        <span className="text-[10px] text-orange-400 font-mono">{model.tag}</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 line-clamp-1">{model.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Action: Send or Stop */}
          <div>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopGenerating}
                className="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 transition-all cursor-pointer flex items-center justify-center"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!inputText.trim()}
                onClick={handleSend}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  inputText.trim()
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-white/[0.06] text-zinc-500 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
