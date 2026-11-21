/**
 * src/features/ai/components/MasterAi2Composer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — UNIFIED MULTIMODAL CHAT COMPOSER
 * Single unified input interface for conversational AI and inline image/document requests.
 *
 * Multimodal Enhancements:
 * - Real document extraction (PDF page-by-page, DOCX, XLSX sheets, PPTX slides)
 * - Real image understanding & safe compression for vision models
 * - Video understanding engine: duration, resolution, representative keyframe scenes
 * - Pre-upload File Analysis Compatibility Legend (Supported vs. Unsupported formats)
 * - Model Selector with Model-Family Logos immediately AFTER model names
 * - Model Capability Badges (Vision, Document, Code, Reasoning)
 * - Real-time compatibility warning if text-only model is selected with visual attachments
 * - Zero third-party provider branding in UI.
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
  Eye,
  Code,
  Brain,
  Video,
  Table,
  HelpCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  BookTemplate,
  Sparkles,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { appSettingsService } from '@/services/appSettingsService';
import { AiAttachment, UnifiedChatModel } from '../types/aiTypes';
import { FileAnalysisEngine } from '../services/fileAnalysisEngine';
import { ModelCapabilityService } from '../services/modelCapabilityService';
import { ModelFamilyLogo } from './ModelFamilyLogo';
import { toast } from 'sonner';

interface ComposerProps {
  onSendMessage: (text: string, attachments: AiAttachment[]) => void;
  onStopGenerating: () => void;
  onOpenTemplates?: () => void;
}

const CATEGORIES = ['All', 'Fast', 'Reasoning', 'Coding', 'General', 'Vision'] as const;

export function MasterAi2Composer({ onSendMessage, onStopGenerating, onOpenTemplates }: ComposerProps) {
  const [inputText, setInputText] = useState(() => appSettingsService.getDraft('master_ai_composer'));
  const [attachments, setAttachments] = useState<AiAttachment[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isFormatGuideOpen, setIsFormatGuideOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const formatGuideRef = useRef<HTMLDivElement>(null);

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
    selectedModelId === 'auto'
      ? 'Auto (Smart Model)'
      : matchedModel?.name || (selectedModelId.split('/').pop()?.replace(/[-_]/g, ' ') || 'Master AI');
  const activeCapabilities =
    matchedModel?.capabilities || ModelCapabilityService.getModelCapabilities(selectedModelId, matchedModel?.category);

  // Live Model-Attachment Compatibility Check
  const compatibility = ModelCapabilityService.checkCompatibility(matchedModel, attachments, unifiedModels);

  // Auto-resize textarea & save draft
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${newHeight}px`;
    }
    appSettingsService.saveDraft('master_ai_composer', inputText);
  }, [inputText]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (formatGuideRef.current && !formatGuideRef.current.contains(e.target as Node)) {
        setIsFormatGuideOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if ((!inputText.trim() && attachments.length === 0) || isStreaming || isProcessingFile) return;

    const text = inputText.trim() || 'Please analyze the attached files and provide a detailed overview.';
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

  // Process uploaded files through real extraction pipeline
  const processUploadedFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsProcessingFile(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Enforce 35MB size ceiling
      if (file.size > 35 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 35 MB size limit.`);
        continue;
      }

      setProcessingStatusText(`Extracting ${file.name}...`);

      try {
        const processedAttachment = await FileAnalysisEngine.processAttachment(
          file,
          (percent, step) => {
            setProcessingStatusText(`${step} (${percent}%)`);
          }
        );

        setAttachments((prev) => [...prev, processedAttachment]);
        toast.success(`Attached "${file.name}" ready for analysis.`);
      } catch (err: any) {
        console.error('[Master AI] File extraction failed:', err);
        toast.error(`Could not process "${file.name}": ${err?.message || 'Unsupported format'}`);
      }
    }

    setIsProcessingFile(false);
    setProcessingStatusText('');
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
    if (selectedCategory === 'Vision') {
      const c = m.capabilities || ModelCapabilityService.getModelCapabilities(m.id, m.category);
      return c.hasVision;
    }
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
          <span className="text-sm font-bold text-white tracking-wide">Drop documents, images, or videos here</span>
          <span className="text-xs text-orange-300 font-mono">
            Supported: PDF, DOCX, XLSX, PPTX, Images (PNG/JPG), Videos (MP4/WEBM), Code
          </span>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="rounded-2xl border border-white/[0.1] bg-zinc-900/85 backdrop-blur-xl shadow-2xl p-2.5 space-y-2 focus-within:border-orange-500/40 transition-colors">
        {/* Model Compatibility Warning Banner */}
        {!compatibility.isCompatible && compatibility.warningMessage && (
          <div className="mx-1 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="leading-tight text-[11px] font-sans">{compatibility.warningMessage}</span>
            </div>
            {compatibility.recommendedModelId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedModelId(compatibility.recommendedModelId!);
                  toast.success(`Switched to vision model: ${compatibility.recommendedModelName}`);
                }}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-[11px] cursor-pointer transition-colors"
              >
                Switch to {compatibility.recommendedModelName?.split(' ')[0]}
              </button>
            )}
          </div>
        )}

        {/* Attachment Chips & Processing Indicator */}
        {(attachments.length > 0 || isProcessingFile) && (
          <div className="flex flex-wrap gap-1.5 px-1 pt-1">
            {attachments.map((att) => {
              const isImg = att.type === 'image';
              const isVid = att.type === 'video';
              return (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-mono text-zinc-200"
                >
                  {isImg && att.url ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-5 h-5 object-cover rounded border border-white/20"
                    />
                  ) : isVid ? (
                    <Video className="w-3.5 h-3.5 text-purple-400" />
                  ) : att.name.endsWith('.xlsx') || att.name.endsWith('.csv') ? (
                    <Table className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  )}

                  <div className="flex flex-col min-w-0">
                    <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                    {att.extractedSummary && (
                      <span className="text-[9px] text-zinc-400 truncate max-w-[150px]">
                        {att.extractedSummary}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {isProcessingFile && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/15 border border-orange-500/30 text-xs font-mono text-orange-300 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                <span>{processingStatusText || 'Extracting attachment...'}</span>
              </div>
            )}
          </div>
        )}

        {/* Textarea Input - Single Unified Input */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Master AI anything, attach documents or images for analysis, or insert prompt templates..."
          rows={1}
          disabled={isStreaming}
          className="w-full bg-transparent px-2.5 py-1.5 text-sm font-sans text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed max-h-[180px] overflow-y-auto"
        />

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            {/* Hidden Multimodal File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.docx,.xlsx,.xls,.csv,.pptx,.txt,.md,.json,.ts,.tsx,.js,.jsx,.py,.html,.css,.xml,.sql,.sh"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Attach Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || isProcessingFile}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Attach PDF, Word, Excel, PowerPoint, Image, Video, or Code file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Pre-Upload File Analysis Indicators & Compatibility Guide */}
            <div className="relative" ref={formatGuideRef}>
              <button
                type="button"
                onClick={() => setIsFormatGuideOpen(!isFormatGuideOpen)}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[11px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="View supported file formats and capabilities"
              >
                <HelpCircle className="w-3 h-3 text-orange-400" />
                <span>File Formats</span>
              </button>

              {/* Supported File Formats Dropdown Popover */}
              {isFormatGuideOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-80 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  <div className="text-xs font-bold text-white border-b border-white/[0.08] pb-1.5 flex items-center justify-between">
                    <span>File Analysis Compatibility</span>
                    <span className="text-[10px] font-mono text-orange-400">Master AI Engine</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>PDF — Supported (Page-by-page & tables)</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-200">
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>DOCX — Supported (Paragraphs & tables)</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Table className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>XLSX / XLS / CSV — Supported (All sheets)</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-200">
                      <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>PPTX — Supported (Slides & speaker notes)</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Eye className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Images (PNG, JPG, WEBP) — Supported (Vision)</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Video className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Videos (MP4, WEBM, MOV) — Supported (Keyframes)</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Code className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Code & Text (MD, JSON, TS, PY) — Supported</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 pt-1 border-t border-white/[0.06]">
                      <AlertTriangle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="text-[10px]">Legacy .doc / binaries — Not supported</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Templates Quick Trigger (#146) */}
            {onOpenTemplates && (
              <button
                type="button"
                onClick={onOpenTemplates}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[11px] font-mono text-amber-300 hover:text-white transition-colors cursor-pointer"
                title="Open Prompt Templates Library"
              >
                <BookTemplate className="w-3 h-3 text-amber-400" />
                <span>Templates</span>
              </button>
            )}

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

            {/* Model Selector Dropdown Trigger with Model Name & Model-Family Logo */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs font-mono text-zinc-300 border border-white/[0.08] transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="truncate max-w-[130px] font-medium text-white">
                  {activeModelDisplayName}
                </span>
                {/* Official Model-Family Logo immediately AFTER model name */}
                <ModelFamilyLogo modelId={selectedModelId} size={14} />

                {/* Capability Icons on Active Badge */}
                {activeCapabilities.hasVision && (
                  <span title="Vision Capable">
                    <Eye className="w-3 h-3 text-purple-400" />
                  </span>
                )}

                <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
              </button>

              {/* Unified Model Dropdown Menu with Capabilities & Model-Family Logos */}
              {isModelDropdownOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-84 sm:w-[420px] rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  {/* Search and Refresh Bar */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search models by name or capability..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none placeholder-zinc-500"
                      />
                    </div>
                    {/* 1-Click Refresh */}
                    <button
                      type="button"
                      onClick={handleRefreshCatalogue}
                      disabled={isRefreshingModels}
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                      title="Refresh Catalogue from Live Models API"
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
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold'
                            : 'bg-white/[0.02] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Unified Models List */}
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {/* Auto (Smart Selection) Adaptive Model */}
                    {(selectedCategory === 'All' || selectedCategory === 'General') && !modelSearch && (
                      <div
                        className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between cursor-pointer group mb-1 ${
                          selectedModelId === 'auto'
                            ? 'bg-orange-500/15 border border-orange-500/30 text-white'
                            : 'hover:bg-white/[0.04] text-zinc-300'
                        }`}
                        onClick={() => {
                          setSelectedModelId('auto');
                          setIsModelDropdownOpen(false);
                          toast.info('Switched to: Auto (Smart Model Selection)');
                        }}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-semibold text-xs flex items-center gap-1.5 flex-wrap">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Auto (Smart Selection)</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Adaptive
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                            Analyzes complexity, code, & visual attachments to route dynamically
                          </div>
                        </div>
                        {selectedModelId === 'auto' && (
                          <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        )}
                      </div>
                    )}

                    {filteredModels.map((m: UnifiedChatModel) => {
                      const isFav = favoriteModels.includes(m.id) || appSettingsService.isFavorite(m.id);
                      const caps =
                        m.capabilities || ModelCapabilityService.getModelCapabilities(m.id, m.category);

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
                              {/* 1. Model Name */}
                              <span className="truncate">{m.name}</span>

                              {/* 2. Official Model-Family Logo immediately AFTER name */}
                              <ModelFamilyLogo modelId={m.id} size={14} />

                              {/* 3. Capability Badges */}
                              {caps.hasVision && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  title="Visual image and keyframe understanding supported"
                                >
                                  <Eye className="w-2.5 h-2.5" />
                                  <span>Vision</span>
                                </span>
                              )}

                              {caps.hasAppDocument && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                                  title="Document extraction supported (PDF, DOCX, XLSX, PPTX)"
                                >
                                  <FileText className="w-2.5 h-2.5" />
                                  <span>Docs</span>
                                </span>
                              )}

                              {caps.hasReasoning && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  title="Extended reasoning supported"
                                >
                                  <Brain className="w-2.5 h-2.5" />
                                </span>
                              )}

                              {m.contextBadge && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/[0.05] text-zinc-400 shrink-0">
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
                disabled={(!inputText.trim() && attachments.length === 0) || isProcessingFile}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  inputText.trim() || attachments.length > 0
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
