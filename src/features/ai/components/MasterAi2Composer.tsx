/**
 * src/features/ai/components/MasterAi2Composer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — MULTI-PROVIDER CHAT & IMAGE COMPOSER
 * Auto-expanding input, multi-mode selector (Chat Groq / Image Pollinations / Auto),
 * aspect ratio controls, multi-tier resolution matrix (512p/1024p/1536p),
 * seed controls, batch generation (1-4x), prompt history navigation,
 * drag-and-drop file/image dropzone, favorite models, and 1-click catalogue refresh.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  RotateCw,
  Star,
  Dices,
  Sliders,
  UploadCloud,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { groqService } from '../services/groqService';
import { pollinationsService } from '../services/pollinationsService';
import { ContextManager } from '../services/contextManager';
import { appSettingsService } from '@/services/appSettingsService';
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
  const [inputText, setInputText] = useState(() => appSettingsService.getDraft('master_ai_composer'));
  const [attachments, setAttachments] = useState<AiAttachment[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [activeModelTab, setActiveModelTab] = useState<'groq' | 'pollinations'>('groq');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

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
  const imageResolution = useAiChatStore((s) => s.imageResolution);
  const setImageResolution = useAiChatStore((s) => s.setImageResolution);
  const imageSeed = useAiChatStore((s) => s.imageSeed);
  const setImageSeed = useAiChatStore((s) => s.setImageSeed);
  const batchCount = useAiChatStore((s) => s.batchCount);
  const setBatchCount = useAiChatStore((s) => s.setBatchCount);
  const favoriteModels = useAiChatStore((s) => s.favoriteModels);
  const toggleFavoriteModel = useAiChatStore((s) => s.toggleFavoriteModel);
  const promptHistory = useAiChatStore((s) => s.promptHistory);
  const addPromptToHistory = useAiChatStore((s) => s.addPromptToHistory);

  const hasGroqKey = groqService.hasApiKey();
  const activeGroqModel = getGroqModelInfo(selectedModelId);

  // Pollinations models state
  const [pollinationsModels, setPollinationsModels] = useState(PREFERRED_POLLINATIONS_MODELS);

  const refreshCatalogues = useCallback(async (isManual = false) => {
    setIsRefreshingModels(true);
    try {
      const models = await pollinationsService.fetchModels(true);
      if (models && models.length > 0) {
        setPollinationsModels(models);
      }
      await groqService.discoverActiveModels();
      if (isManual) {
        toast.success(`Catalogue updated: ${models.length} image models discovered.`);
      }
    } catch {
      if (isManual) toast.error('Catalogue refresh failed.');
    } finally {
      setIsRefreshingModels(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalogues(false);
  }, [refreshCatalogues]);

  const activeImageModel =
    pollinationsModels.find((m) => m.id === activeImageModelId || m.aliases.includes(activeImageModelId)) ||
    PREFERRED_POLLINATIONS_MODELS[0];

  // Auto-resize textarea & save draft
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${newHeight}px`;
    }
    appSettingsService.saveDraft('master_ai_composer', inputText);
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

    if (chatMode === 'chat' && !hasGroqKey) {
      toast.warning('Groq is offline. Please configure GROQ_API_KEY in .env.local to enable text chat.');
      return;
    }

    const text = inputText.trim();
    const currentAttachments = [...attachments];
    addPromptToHistory(text);
    setHistoryIndex(-1);
    setInputText('');
    setAttachments([]);
    appSettingsService.clearDraft('master_ai_composer');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    onSendMessage(text, currentAttachments);
  };

  // Keyboard navigation: Enter to send, Up/Down for prompt history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    // Prompt history navigation on empty or cursor at start
    if (e.key === 'ArrowUp' && (inputText === '' || textareaRef.current?.selectionStart === 0)) {
      if (promptHistory.length > 0) {
        e.preventDefault();
        const nextIdx = historyIndex + 1;
        if (nextIdx < promptHistory.length) {
          setHistoryIndex(nextIdx);
          setInputText(promptHistory[promptHistory.length - 1 - nextIdx]);
        }
      }
    } else if (e.key === 'ArrowDown' && historyIndex >= 0) {
      e.preventDefault();
      const nextIdx = historyIndex - 1;
      if (nextIdx >= 0) {
        setHistoryIndex(nextIdx);
        setInputText(promptHistory[promptHistory.length - 1 - nextIdx]);
      } else {
        setHistoryIndex(-1);
        setInputText('');
      }
    }
  };

  const processUploadedFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 25 MB limit.`);
        continue;
      }

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
        toast.success(`Attached image "${file.name}"`);
      } else {
        try {
          const textContent = await ContextManager.readFileText(file);
          const newAtt: AiAttachment = {
            id: `att_${Date.now()}_${i}`,
            name: file.name,
            type: 'file',
            sizeBytes: file.size,
            mimeType: file.type || 'text/plain',
            content: textContent,
          };
          setAttachments((prev) => [...prev, newAtt]);
          toast.success(`Attached "${file.name}"`);
        } catch (err: any) {
          toast.error(`Could not read ${file.name}: ${err?.message}`);
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Filtered models for dropdown
  const filteredGroqModels = VERIFIED_GROQ_MODELS.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.description.toLowerCase().includes(modelSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Coding') return m.tag.includes('Code') || m.id.includes('code');
    if (selectedCategory === 'Reasoning') return m.tag.includes('Reasoning') || m.id.includes('r1');
    if (selectedCategory === 'Fast') return m.tag.includes('Fast') || m.tag.includes('Instant');
    return true;
  });

  const filteredImageModels = pollinationsModels.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.title.toLowerCase().includes(modelSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Editing') return m.supportsEditing;
    if (selectedCategory === 'Fast') return m.name.toLowerCase().includes('schnell') || m.id.includes('schnell');
    return true;
  });

  const allAspectRatios: ImageAspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:2', '2:3', '21:9'];

  return (
    <div
      className="w-full max-w-4xl mx-auto px-4 pb-4 select-none relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Visual Backdrop */}
      {isDragging && (
        <div className="absolute inset-x-4 inset-y-0 rounded-2xl border-2 border-dashed border-orange-500 bg-orange-500/10 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-2 pointer-events-none animate-in fade-in duration-150">
          <UploadCloud className="w-10 h-10 text-orange-400 animate-bounce" />
          <span className="text-sm font-bold text-white tracking-wide">Drop files or images here to attach</span>
          <span className="text-xs text-orange-300 font-mono">Supports code, documents, and reference images</span>
        </div>
      )}

      {/* Groq Environment Offline Notification */}
      {!hasGroqKey && chatMode !== 'image' && (
        <div className="mb-2 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-500 flex-shrink-0" />
          <span>Groq text chat is offline (set <code className="text-zinc-300 font-mono">GROQ_API_KEY</code> in <code className="text-zinc-300 font-mono">.env.local</code> to enable). Image generation via Pollinations is fully available.</span>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="rounded-2xl border border-white/[0.1] bg-zinc-900/80 backdrop-blur-xl shadow-2xl p-2.5 space-y-2 focus-within:border-orange-500/40 transition-colors">
        {/* Mode Selector & Toolbar */}
        <div className="flex items-center justify-between px-1 text-xs flex-wrap gap-2">
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

          {/* Quick Image Controls (Aspect Ratio, Resolution, Seed, Batch) */}
          {(chatMode === 'image' || chatMode === 'auto') && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Aspect Ratio Chips */}
              <div className="flex items-center gap-1 bg-white/[0.02] p-0.5 rounded-lg border border-white/[0.04]">
                {allAspectRatios.map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-all cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title={`Set aspect ratio ${ratio}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              {/* Extra Parameters Button (Resolution / Seed / Batch) */}
              <button
                type="button"
                onClick={() => setShowImageOptions(!showImageOptions)}
                className={`p-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono ${
                  showImageOptions
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                    : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
                }`}
                title="Configure resolution, seed & batch generation"
              >
                <Sliders className="w-3 h-3" />
                <span className="hidden sm:inline">{imageResolution}p</span>
                {batchCount > 1 && <span className="text-orange-400">({batchCount}x)</span>}
              </button>
            </div>
          )}
        </div>

        {/* Expandable Image Settings Bar (Resolution, Seed, Batch) */}
        {showImageOptions && (
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3 text-xs flex-wrap animate-in fade-in duration-150">
            {/* Resolution Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Resolution:</span>
              {[512, 1024, 1536].map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setImageResolution(res)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer transition-all ${
                    imageResolution === res
                      ? 'bg-orange-500 text-white font-bold'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                  }`}
                >
                  {res}p {res === 512 ? '(SD)' : res === 1024 ? '(HD)' : '(UHD)'}
                </button>
              ))}
            </div>

            {/* Batch Count Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Batch:</span>
              {[1, 2, 4].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setBatchCount(cnt)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer transition-all ${
                    batchCount === cnt
                      ? 'bg-orange-500 text-white font-bold'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                  }`}
                >
                  {cnt}x
                </button>
              ))}
            </div>

            {/* Seed Controller */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Seed:</span>
              <button
                type="button"
                onClick={() => setImageSeed(imageSeed === null ? Math.floor(Math.random() * 999999) : null)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer transition-all ${
                  imageSeed !== null
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                }`}
                title={imageSeed !== null ? `Fixed seed: ${imageSeed}. Click to randomize.` : 'Random seed. Click to fix.'}
              >
                <Dices className="w-3 h-3" />
                <span>{imageSeed !== null ? imageSeed : 'Random'}</span>
              </button>
            </div>
          </div>
        )}

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
              ? 'Describe the image to generate or edit (e.g. "Cyberpunk neon street at twilight, 8K ultra-detailed")...'
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
                <div className="absolute bottom-full mb-2 left-0 w-84 sm:w-96 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  {/* Selector Tabs (Groq vs Pollinations) */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModelTab('groq');
                        setSelectedCategory('All');
                      }}
                      className={`flex-1 py-1 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeModelTab === 'groq'
                          ? 'bg-orange-500 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>Groq Models</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModelTab('pollinations');
                        setSelectedCategory('All');
                      }}
                      className={`flex-1 py-1 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeModelTab === 'pollinations'
                          ? 'bg-orange-500 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Pollinations Models</span>
                    </button>
                  </div>

                  {/* Search and Refresh Bar */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search models..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
                      />
                    </div>
                    {/* 1-Click Catalogue Refresh */}
                    <button
                      type="button"
                      onClick={() => refreshCatalogues(true)}
                      disabled={isRefreshingModels}
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                      title="1-Click Refresh Catalogue from Live API"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isRefreshingModels ? 'animate-spin text-orange-400' : ''}`} />
                    </button>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                    {(activeModelTab === 'groq'
                      ? ['All', 'Coding', 'Reasoning', 'Fast']
                      : ['All', 'General', 'Editing', 'Fast']
                    ).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-0.5 rounded-md font-mono shrink-0 cursor-pointer transition-all ${
                          selectedCategory === cat
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'bg-white/[0.02] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Models List */}
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {activeModelTab === 'groq' ? (
                      filteredGroqModels.map((m) => {
                        const isFav = favoriteModels.includes(m.id) || appSettingsService.isFavorite(m.id);
                        return (
                          <div
                            key={m.id}
                            className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between cursor-pointer group ${
                              selectedModelId === m.id
                                ? 'bg-orange-500/15 border border-orange-500/30 text-white'
                                : 'hover:bg-white/[0.04] text-zinc-300'
                            }`}
                            onClick={() => {
                              setSelectedModelId(m.id);
                              setIsModelDropdownOpen(false);
                              toast.info(`Switched to Groq: ${m.name}`);
                            }}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="font-semibold text-xs flex items-center gap-1.5">
                                <span className="truncate">{m.name}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 shrink-0">
                                  {m.tag}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                                {m.description}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavoriteModel(m.id);
                                  appSettingsService.toggleFavorite(m.id);
                                }}
                                className={`p-1 rounded transition-colors ${
                                  isFav
                                    ? 'text-amber-400'
                                    : 'text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100'
                                }`}
                                title={isFav ? 'Remove from favorites' : 'Pin to favorites'}
                              >
                                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                              </button>
                              {selectedModelId === m.id && (
                                <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      filteredImageModels.map((m) => {
                        const isFav = favoriteModels.includes(m.id) || appSettingsService.isFavorite(m.id);
                        return (
                          <div
                            key={m.id}
                            className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between cursor-pointer group ${
                              activeImageModelId === m.id
                                ? 'bg-orange-500/15 border border-orange-500/30 text-white'
                                : 'hover:bg-white/[0.04] text-zinc-300'
                            }`}
                            onClick={() => {
                              setActiveImageModelId(m.id);
                              setIsModelDropdownOpen(false);
                              toast.info(`Switched to Image Model: ${m.name}`);
                            }}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="font-semibold text-xs flex items-center gap-1.5 flex-wrap">
                                <span className="truncate">{m.name}</span>
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
                                    m.paidOnly
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-emerald-500/20 text-emerald-300'
                                  }`}
                                >
                                  {m.paidOnly ? 'Paid Tier' : 'Free Tier'}
                                </span>
                                {m.supportsEditing && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 shrink-0">
                                    Editing
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5 font-mono truncate max-w-[220px]">
                                {m.id}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavoriteModel(m.id);
                                  appSettingsService.toggleFavorite(m.id);
                                }}
                                className={`p-1 rounded transition-colors ${
                                  isFav
                                    ? 'text-amber-400'
                                    : 'text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100'
                                }`}
                                title={isFav ? 'Remove from favorites' : 'Pin to favorites'}
                              >
                                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                              </button>
                              {activeImageModelId === m.id && (
                                <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })
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
                title="Stop generation (Esc)"
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
