/**
 * src/components/ai/MasterAiPromptInput.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — FLUENT DESIGN COMMAND DOCK & PROMPT INPUT
 * Windows 11 Acrylic glassmorphic command dock.
 * Features:
 * - Multiline auto-expanding textarea (Enter to send, Shift+Enter for newline)
 * - DALL-E 3 Grade GPT Auto-Enhance toggle: [⚡ 8K Mode: ON/OFF]
 * - Magic Prompt Wand with AI Polisher
 * - Attached files & Vision image preview chips with quick dismiss
 * - Voice dictation (Whisper STT with active waveform animation)
 * - Dynamic Send / Stop Generation controls
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  Wand2,
  Globe,
  Zap,
  X,
  Laptop,
  FileText,
  Sparkles,
} from 'lucide-react';
import { LocalAttachedFile } from '@/pages/AIPage';
import { FileItem } from '@/types/file';

interface MasterAiPromptInputProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  onSend: (customPrompt?: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  attachedImage: { url: string; file?: File; name: string } | null;
  onRemoveImage: () => void;
  attachedLocalFile: LocalAttachedFile | null;
  onRemoveLocalFile: () => void;
  attachedCloudFile: FileItem | null;
  onRemoveCloudFile: () => void;
  onOpenFilePicker: () => void;
  onOpenImagePicker: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  autoGptEnhance: boolean;
  onToggleAutoGptEnhance: () => void;
  isPolishingPrompt: boolean;
  onMagicPrompt: () => void;
  isWebSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  placeholder?: string;
}

export const MasterAiPromptInput: React.FC<MasterAiPromptInputProps> = ({
  inputText,
  setInputText,
  onSend,
  isStreaming,
  onStopStreaming,
  attachedImage,
  onRemoveImage,
  attachedLocalFile,
  onRemoveLocalFile,
  attachedCloudFile,
  onRemoveCloudFile,
  onOpenFilePicker,
  onOpenImagePicker,
  isRecording,
  onToggleRecording,
  autoGptEnhance,
  onToggleAutoGptEnhance,
  isPolishingPrompt,
  onMagicPrompt,
  isWebSearchEnabled,
  onToggleWebSearch,
  placeholder,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && inputText.trim()) {
        onSend();
      }
    }
  };

  const getDynamicPlaceholder = () => {
    if (placeholder) return placeholder;
    if (isRecording) return '🎙️ Listening... Speak naturally into your microphone';
    if (isWebSearchEnabled) return '🌐 Web Grounding ON: Ask anything with real-time web citations... [Enter]';
    if (attachedImage) return 'Ask Master AI anything about this image/screenshot, or ask to transform it... [Enter]';
    if (attachedLocalFile || attachedCloudFile) return 'Ask Master AI to analyze, summarize, or extract data from this file... [Enter]';
    return 'Ask Master AI anything, generate images ("Photo ekak hadanna..."), paste screenshots (Ctrl+V)... [Enter]';
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4 pt-2">
      {/* ─── DOCK WRAPPER ─── */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-zinc-950/70 border border-white/[0.08] hover:border-white/[0.15] focus-within:border-cyan-500/50 backdrop-blur-2xl shadow-2xl transition-all duration-300 p-2.5 sm:p-3.5 space-y-2">
        {/* Subtle Ambient Top Rim Glow */}
        <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        {/* ─── ATTACHMENT CHIPS BAR ─── */}
        {(attachedImage || attachedLocalFile || attachedCloudFile) && (
          <div className="flex flex-wrap items-center gap-2 pb-1 pt-0.5 border-b border-white/[0.06] animate-in fade-in">
            {/* Image Chip */}
            {attachedImage && (
              <div className="inline-flex items-center gap-2 p-1 pr-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs font-semibold text-purple-300">
                <img
                  src={attachedImage.url}
                  alt="Attachment preview"
                  className="h-7 w-7 object-cover rounded-lg border border-purple-400/40"
                />
                <span className="truncate max-w-[180px]">{attachedImage.name}</span>
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="hover:text-rose-400 p-0.5 rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Local PC File Chip */}
            {attachedLocalFile && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-xs font-semibold text-cyan-300">
                <Laptop className="h-3.5 w-3.5 text-cyan-400" />
                <span className="truncate max-w-[180px]">{attachedLocalFile.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  ({(attachedLocalFile.size / 1024).toFixed(1)} KB · PC)
                </span>
                <button
                  type="button"
                  onClick={onRemoveLocalFile}
                  className="hover:text-rose-400 p-0.5 rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer"
                  title="Remove local file"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Master Cloud Drive File Chip */}
            {attachedCloudFile && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
                <FileText className="h-3.5 w-3.5 text-indigo-400" />
                <span className="truncate max-w-[180px]">{attachedCloudFile.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  (Master Cloud Drive)
                </span>
                <button
                  type="button"
                  onClick={onRemoveCloudFile}
                  className="hover:text-rose-400 p-0.5 rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer"
                  title="Remove drive file"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── MULTILINE PROMPT TEXTAREA ─── */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getDynamicPlaceholder()}
            rows={1}
            className="w-full bg-transparent resize-none border-none outline-none text-xs sm:text-sm text-foreground placeholder:text-zinc-500/70 py-1.5 px-1 leading-relaxed custom-scrollbar max-h-44"
          />
        </div>

        {/* ─── BOTTOM CONTROLS DOCK ─── */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
          {/* Left Triggers: Attachment, Image, Web Search, Microphone */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* File Attachment (Paperclip) */}
            <button
              type="button"
              onClick={onOpenFilePicker}
              className="h-8 w-8 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground flex items-center justify-center transition-all border border-white/[0.06] cursor-pointer"
              title="Attach File from PC or Master Cloud Drive"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Vision Image Attachment */}
            <button
              type="button"
              onClick={onOpenImagePicker}
              className="h-8 w-8 rounded-xl bg-white/[0.03] hover:bg-purple-500/20 text-muted-foreground hover:text-purple-300 flex items-center justify-center transition-all border border-white/[0.06] hover:border-purple-500/30 cursor-pointer"
              title="Upload Photo or Screenshot for Vision AI analysis"
            >
              <ImageIcon className="h-4 w-4 text-purple-400" />
            </button>

            {/* Web Search Toggle */}
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`h-8 px-2 sm:px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isWebSearchEnabled
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-500/20'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-muted-foreground border-white/[0.06]'
              }`}
              title={isWebSearchEnabled ? 'Web Search ON' : 'Turn on Web Search'}
            >
              <Globe className={`h-3.5 w-3.5 ${isWebSearchEnabled ? 'text-blue-400' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline text-[11px]">
                {isWebSearchEnabled ? 'Web ON' : 'Web'}
              </span>
            </button>

            {/* Microphone Voice Dictation */}
            <button
              type="button"
              onClick={onToggleRecording}
              className={`h-8 px-2 sm:px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20 animate-pulse'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-muted-foreground border-white/[0.06]'
              }`}
              title={isRecording ? 'Stop Recording' : 'Voice Input (Whisper STT)'}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-3.5 w-3.5 text-rose-400" />
                  <span className="text-[11px] font-mono text-rose-300">Rec...</span>
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="hidden sm:inline text-[11px]">Voice</span>
                </>
              )}
            </button>

            {/* GPT Auto-Enhancer Toggle [⚡ 8K Mode: ON/OFF] */}
            <button
              type="button"
              onClick={onToggleAutoGptEnhance}
              className={`h-8 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                autoGptEnhance
                  ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-muted-foreground border-white/[0.06]'
              }`}
              title="DALL-E 3 Grade Prompt Auto-Enhance with GPT-4o-Mini: Turns simple prompts into 8K photorealistic masterpieces"
            >
              <Zap className={`h-3.5 w-3.5 ${autoGptEnhance ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
              <span className="text-[11px] font-bold">
                {autoGptEnhance ? '⚡ 8K Mode: ON' : '⚡ 8K Mode'}
              </span>
            </button>
          </div>

          {/* Right Controls: Magic Wand + Send/Stop */}
          <div className="flex items-center gap-1.5">
            {/* Magic Wand Prompt Polisher */}
            <button
              type="button"
              disabled={isPolishingPrompt || !inputText.trim()}
              onClick={onMagicPrompt}
              className="h-8 px-2 sm:px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Polish & enrich prompt with AI Magic Wand"
            >
              <Wand2
                className={`h-3.5 w-3.5 text-purple-400 ${isPolishingPrompt ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline text-[11px]">
                {isPolishingPrompt ? 'Polishing...' : 'Polish'}
              </span>
            </button>

            {/* Send / Stop Streaming Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="h-9 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer active:scale-95"
                title="Halt generation"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span className="text-[11px]">Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSend()}
                disabled={!inputText.trim()}
                className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white flex items-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-indigo-600/25 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                title="Send prompt to Master AI [Enter]"
              >
                <span className="text-[11px]">Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── DOCK FOOTER METADATA ─── */}
      <div className="flex items-center justify-between px-3 pt-1.5 text-[10px] text-zinc-500 font-mono">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Master Quantum vGPU · Zero Limits · No Hugging Face
        </span>
        <span className="text-zinc-500/80 hidden sm:inline">
          Shift+Enter for newline · Ctrl+V to paste screenshots
        </span>
      </div>
    </div>
  );
};
