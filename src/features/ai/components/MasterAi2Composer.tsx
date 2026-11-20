/**
 * src/features/ai/components/MasterAi2Composer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — UNIFIED CHAT COMPOSER
 * Single unified input interface for conversational AI and inline image requests.
 * Features:
 * - Auto-expanding textarea
 * - Drag-and-drop file/image dropzone
 * - Integrated Model Discovery & Selector with category filters (All / Fast / Reasoning / Coding / General)
 * - Live Web Search Grounding toggle
 * - Keyboard navigation (Enter to send, Shift+Enter for newline, Up/Down for prompt history)
 * - Strict Compliance: Zero third-party provider branding in the user interface.
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
  Search,
  Check,
  RotateCw,
  Star,
  UploadCloud,
  Globe,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { ContextManager } from '../services/contextManager';
import { appSettingsService } from '@/services/appSettingsService';
import { AiAttachment, UnifiedChatModel } from '../types/aiTypes';
import { toast } from 'sonner';

interface ComposerProps {
  onSendMessage: (text: string, attachments: AiAttachment[]) => void;
  onStopGenerating: () => void;
}

const CATEGORIES = ['All', 'Fast', 'Reasoning', 'Coding', 'General'] as const;

export function MasterAi2Composer({ onSendMessage, onStopGenerating }: ComposerProps) {
  const [inputText, setInputText] = useState(() => appSettingsService.getDraft('master_ai_composer'));
  const [attachments, setAttachments] = useState<AiAttachment[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const isStreaming = useAiChatStore((s) => s.isStreaming);
  const selectedModelId = useAiChatStore((s) => s.selectedModelId);
  const setSelectedModelId = useAiChatStore((s) => s.setSelectedModelId);
  const unifiedModels = useAiChatStore((s) => s.unifiedModels);
  const fetchUnifiedModels = useAiChatStore((s) => s.fetchUnifiedModels);
  const isWebSearchEnabled = useAiChatStore((s) => s.isWebSearchEnabled);
  const toggleWebSearch = useAiChatStore((s) => s.toggleWebSearch);
  const favoriteModels = useAiChatStore((s) => s.favoriteModels);
  const toggleFavoriteModel = useAiChatStore((s) => s.toggleFavoriteModel);
  const promptHistory = useAiChatStore((s) => s.promptHistory);
  const addPromptToHistory = useAiChatStore((s) => s.addPromptToHistory);

  // Discover and refresh model catalogue on mount
  useEffect(() => {
    if (unifiedModels.length === 0) {
      fetchUnifiedModels(false);
    }
  }, [fetchUnifiedModels, unifiedModels.length]);

  const handleRefreshCatalogue = useCallback(async () => {
    setIsRefreshingModels(true);
    try {
      await fetchUnifiedModels(true);
      toast.success('Discovered latest available free models.');
    } catch {
      toast.error('Could not refresh model catalogue.');
    } finally {
      setIsRefreshingModels(false);
    }
  }, [fetchUnifiedModels]);

  // Active Model Clean Display Name
  const matchedModel = unifiedModels.find((m) => m.id === selectedModelId);
  const activeModelDisplayName =
    matchedModel?.name || (selectedModelId.split('/').pop()?.replace(/[-_]/g, ' ') || 'Master AI');

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
  const filteredModels = unifiedModels.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.description.toLowerCase().includes(modelSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'All') return true;
    return m.category.toLowerCase() === selectedCategory.toLowerCase();
  });

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

        {/* Textarea Input - Single Unified Input */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Master AI anything, or request an image (e.g. 'Generate an image of a futuristic skyline')..."
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

            {/* Web Search Grounding Toggle Chip */}
            <button
              type="button"
              onClick={toggleWebSearch}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                isWebSearchEnabled
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/20'
                  : 'bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:text-white'
              }`}
              title={isWebSearchEnabled ? 'Live Web Intelligence: Enabled' : 'Enable Live Web Search Grounding'}
            >
              <Globe className={`w-3.5 h-3.5 ${isWebSearchEnabled ? 'text-cyan-400 animate-pulse' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline font-sans">Search</span>
            </button>

            {/* Model Selector Dropdown Trigger */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs font-mono text-zinc-300 border border-white/[0.08] transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="truncate max-w-[140px] font-medium">
                  {activeModelDisplayName}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {/* Unified Model Dropdown Menu (Zero Provider Branding) */}
              {isModelDropdownOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-84 sm:w-96 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
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
                    {/* 1-Click Refresh */}
                    <button
                      type="button"
                      onClick={handleRefreshCatalogue}
                      disabled={isRefreshingModels}
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                      title="1-Click Refresh Catalogue from Live Models API"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isRefreshingModels ? 'animate-spin text-orange-400' : ''}`} />
                    </button>
                  </div>

                  {/* Capability Category Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                    {CATEGORIES.map((cat) => (
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

                  {/* Unified Models List */}
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {filteredModels.map((m: UnifiedChatModel) => {
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
                            toast.info(`Switched to: ${m.name}`);
                          }}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="font-semibold text-xs flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{m.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 shrink-0 capitalize">
                                {m.category}
                              </span>
                              {m.contextBadge && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
                                  {m.contextBadge}
                                </span>
                              )}
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
                    })}
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
