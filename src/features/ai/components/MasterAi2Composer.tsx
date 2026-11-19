/**
 * src/features/ai/components/MasterAi2Composer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — MULTI-PROVIDER CHAT & IMAGE COMPOSER
 * Auto-expanding input, multi-mode selector (Chat Groq / Image Pollinations / Auto),
 * aspect ratio controls, file & reference-image attachments, and model catalogue drawer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  X,
  FileText,
  ChevronDown,
  Sparkles,
  Zap,
  Search,
  ImageIcon,
  Check,
  Edit3,
  Layers,
  Ratio,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { groqService } from '../services/groqService';
import { pollinationsService } from '../services/pollinationsService';
import { ContextManager } from '../services/contextManager';
import { AiAttachment, ChatMode, ImageAspectRatio } from '../types/aiTypes';
import { VERIFIED_GROQ_MODELS, getGroqModelInfo, GROQ_CATEGORIES } from '../services/groqModels';
import {
  PREFERRED_POLLINATIONS_MODELS,
  POLLINATIONS_CATEGORIES,
} from '../services/pollinationsModels';
import { toast } from 'sonner';

interface ComposerProps {
  onSendMessage: (text: string, attachments: AiAttachment[]) => void;
  onStopGenerating: () => void;
}

export function MasterAi2Composer({ onSendMessage, onStopGenerating }: ComposerProps) {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<AiAttachment[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [activeModelTab, setActiveModelTab] = useState<'groq' | 'pollinations'>('groq');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const isStreaming = useAiChatStore((s) => s.isStreaming);
  const chatMode = useAiChatStore((s) => s.chatMode);
  const setChatMode = useAiChatStore((s) => s.setChatMode);
  const selectedModelId = useAiChatStore((s) => s.selectedModelId);
  const setSelectedModelId = useAiChatStore((s) => s.setSelectedModelId);
  const activeImageModelId = useAiChatStore((s) => s.activeImageModelId);
  const setActiveImageModelId = useAiChatStore((s) => s.setActiveImageModelId);
  const aspectRatio = useAiChatStore((s) => s.aspectRatio);
  const setAspectRatio = useAiChatStore((s) => s.setAspectRatio);

  const hasGroqKey = groqService.hasApiKey();
  const activeGroqModel = getGroqModelInfo(selectedModelId);

  // Pollinations models state
  const [pollinationsModels, setPollinationsModels] = useState(PREFERRED_POLLINATIONS_MODELS);
  useEffect(() => {
    pollinationsService.fetchModels().then(setPollinationsModels).catch(() => {});
  }, []);

  const activeImageModel =
    pollinationsModels.find((m) => m.id === activeImageModelId || m.aliases.includes(activeImageModelId)) ||
    PREFERRED_POLLINATIONS_MODELS[0];

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

    // In chat mode, ensure key is present
    if (chatMode === 'chat' && !hasGroqKey) {
      toast.warning('Groq is offline. Please configure GROQ_API_KEY in .env.local to enable text chat.');
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
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        const newAtt: AiAttachment = {
          id: `att_img_${Date.now()}_${i}`,
          name: file.name,
          type: 'image',
          sizeBytes: file.size,
          mimeType: file.type,
          url,
        };
        setAttachments((prev) => [...prev, newAtt]);
        toast.success(`Attached image "${file.name}" for reference or editing`);
      } else {
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
    }
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Filtered models for dropdown
  const filteredGroqModels = VERIFIED_GROQ_MODELS.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.description.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const filteredImageModels = pollinationsModels.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.title.toLowerCase().includes(modelSearch.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 select-none">
      {/* Groq Environment Offline Notification */}
      {!hasGroqKey && chatMode !== 'image' && (
        <div className="mb-2 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-500 flex-shrink-0" />
          <span>Groq text chat is offline (set <code className="text-zinc-300 font-mono">GROQ_API_KEY</code> in <code className="text-zinc-300 font-mono">.env.local</code> to enable). Image generation via Pollinations is fully available.</span>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="rounded-2xl border border-white/[0.1] bg-zinc-900/80 backdrop-blur-xl shadow-2xl p-2.5 space-y-2 focus-within:border-orange-500/40 transition-colors">
        {/* Mode Selector & Aspect Ratio Toolbar */}
        <div className="flex items-center justify-between px-1 text-xs">
          {/* Chat Mode Switcher */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setChatMode('auto')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                chatMode === 'auto'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Automatically routes between Groq chat and Pollinations image generation"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto</span>
            </button>

            <button
              type="button"
              onClick={() => setChatMode('chat')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                chatMode === 'chat'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setChatMode('image')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                chatMode === 'image'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Image</span>
            </button>
          </div>

          {/* Aspect Ratio Selector (visible in Image Mode) */}
          {chatMode === 'image' && (
            <div className="flex items-center gap-1">
              {(['1:1', '16:9', '9:16', '4:3'] as ImageAspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium transition-all cursor-pointer ${
                    aspectRatio === ratio
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : 'text-zinc-400 hover:text-white bg-white/[0.02]'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attachment Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1 pt-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-zinc-200"
              >
                {att.type === 'image' && att.url ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-5 h-5 object-cover rounded border border-white/20"
                  />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span className="truncate max-w-[160px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            chatMode === 'image'
              ? 'Describe the image to generate or edit (e.g. "Cinematic cybernetic cityscape in neon rain")...'
              : 'Ask Master AI anything, or type "/image <prompt>" to create visual art...'
          }
          rows={1}
          disabled={isStreaming}
          className="w-full bg-transparent px-2.5 py-1.5 text-sm font-sans text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed max-h-[180px] overflow-y-auto"
        />

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.txt,.md,.json,.ts,.tsx,.js,.jsx,.py,.html,.css"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Attach Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Attach code file, document, or reference image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Model Selector Dropdown Trigger */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs font-mono text-zinc-300 border border-white/[0.08] transition-colors cursor-pointer"
              >
                {chatMode === 'image' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span className="truncate max-w-[130px] font-medium">
                      {activeImageModel.name}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <span className="truncate max-w-[130px] font-medium">
                      {activeGroqModel.name}
                    </span>
                  </>
                )}
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {/* Enhanced Model Dropdown Menu */}
              {isModelDropdownOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-80 sm:w-96 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  {/* Selector Tabs (Groq vs Pollinations) */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveModelTab('groq')}
                      className={`flex-1 py-1 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeModelTab === 'groq'
                          ? 'bg-orange-500 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>Groq Text Models</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModelTab('pollinations')}
                      className={`flex-1 py-1 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeModelTab === 'pollinations'
                          ? 'bg-orange-500 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Pollinations Images</span>
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="Search models..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Models List */}
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {activeModelTab === 'groq' ? (
                      filteredGroqModels.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedModelId(m.id);
                            setIsModelDropdownOpen(false);
                            toast.info(`Switched to Groq: ${m.name}`);
                          }}
                          className={`w-full text-left p-2 rounded-xl transition-all flex items-start justify-between cursor-pointer ${
                            selectedModelId === m.id
                              ? 'bg-orange-500/15 border border-orange-500/30 text-white'
                              : 'hover:bg-white/[0.04] text-zinc-300'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-xs flex items-center gap-1.5">
                              <span>{m.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300">
                                {m.tag}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                              {m.description}
                            </div>
                          </div>
                          {selectedModelId === m.id && (
                            <Check className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      ))
                    ) : (
                      filteredImageModels.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setActiveImageModelId(m.id);
                            setIsModelDropdownOpen(false);
                            toast.info(`Switched to Image Model: ${m.name}`);
                          }}
                          className={`w-full text-left p-2 rounded-xl transition-all flex items-start justify-between cursor-pointer ${
                            activeImageModelId === m.id
                              ? 'bg-orange-500/15 border border-orange-500/30 text-white'
                              : 'hover:bg-white/[0.04] text-zinc-300'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-xs flex items-center gap-1.5">
                              <span>{m.name}</span>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                                  m.paidOnly
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {m.paidOnly ? 'Paid Tier' : 'Free Tier'}
                              </span>
                              {m.supportsEditing && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                                  Editing
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono truncate max-w-[220px]">
                              {m.id}
                            </div>
                          </div>
                          {activeImageModelId === m.id && (
                            <Check className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action: Send / Stop Button */}
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopGenerating}
                className="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-md shadow-red-500/20 cursor-pointer"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  inputText.trim()
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/30 scale-100'
                    : 'bg-white/[0.05] text-zinc-500 cursor-not-allowed scale-95'
                }`}
                title="Send message (Enter)"
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
