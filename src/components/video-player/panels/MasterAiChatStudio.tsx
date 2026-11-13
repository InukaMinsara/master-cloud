/**
 * MASTER CLOUD — MASTER AI STUDIO (v1.0)
 * Rich Interactive Bilingual Chat Workspace with:
 * - Conversation Session History Sidebar (New / Rename / Search / Clear / Export MD & JSON)
 * - Streaming ONNX Token Generation + Stop Button (AbortController) + Regenerate + Edit-Message
 * - Live Context Token Gauge & Working-Memory Compression Notice
 * - Language Selector (Auto / සිංහල / English / Mixed) & Tool-Assisted vs Pure-Neural Toggle
 * - Sampling Controls Drawer (Temperature, Top-K, Top-P, Max Tokens, Rep-Penalty)
 * - Explicit Source Provenance Badges & Opt-In Local Human Feedback / Correction UI
 */

import React, { useMemo, useState } from 'react';
import {
  Brain,
  Check,
  Download,
  Edit3,
  History,
  MessageSquarePlus,
  Mic,
  MicOff,
  Play,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { ChatMessage } from '../../../services/masterAiEngine';
import { AIChapterSuggestion } from '../../../services/masterAiEngine';
import {
  ChatSourceBadge,
  ConversationSession,
  LanguagePreferenceMode,
} from '../../../services/ai/conversationMemory';
import { NeuralGenerationConfig, neuralRuntime } from '../../../services/ai/neuralRuntime';
import { humanFeedbackStore } from '../../../services/ai/feedbackStore';
import { MasterAiMarkdown } from './MasterAiMarkdown';

import {
  AiModelDescriptor,
  modelRegistry,
} from '../../../services/ai/modelRegistry';
import {
  VERIFIED_FREE_CHAT_MODELS,
  PUTER_STANDARD_MODELS,
} from '../../../services/ai/puterAiService';

export interface MasterAiChatStudioProps {
  messages: ChatMessage[];
  sessions: ConversationSession[];
  activeSessionId: string;
  languageMode: LanguagePreferenceMode;
  pureNeuralOnly: boolean;
  genConfig: NeuralGenerationConfig;
  aiMode: 'local' | 'cloud';
  isThinking: boolean;
  isVoiceActive: boolean;
  inputText: string;
  quickPrompts: Array<{ label: string; prompt: string }>;
  chatBottomRef: React.RefObject<HTMLDivElement>;
  registeredModels?: AiModelDescriptor[];
  manualModelId?: string;
  enableParallel?: boolean;
  onChangeManualModelId?: (id: string) => void;
  onToggleParallel?: (val: boolean) => void;
  onInputChange: (val: string) => void;
  onSendMessage: (overrideText?: string, editMsgId?: string) => void;
  onStopGenerating: () => void;
  onRegenerateLast: () => void;
  onToggleVoice: () => void;
  onJumpTo: (seconds: number) => void;
  onApplyChapters: (chapters: AIChapterSuggestion[]) => void;
  onCopySummary: () => void;
  onLanguageChange: (mode: LanguagePreferenceMode) => void;
  onTogglePureNeural: (val: boolean) => void;
  onChangeGenConfig: (cfg: NeuralGenerationConfig) => void;
  onCreateSession: () => void;
  onSelectSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onDeleteSession: (id: string) => void;
  onClearCurrentSession: () => void;
  onExportSession: (fmt: 'markdown' | 'json') => void;
}

const SOURCE_BADGE_STYLES: Record<ChatSourceBadge, { label: string; cls: string }> = {
  neural_core: { label: 'Original Neural Core', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  tool_assisted_neural: { label: 'Brain A · Tools + Core', cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  deterministic_calc: { label: 'Deterministic Calc', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  doc_retrieval: { label: 'Local Docs RAG', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  transcript_grounding: { label: 'Transcript BM25', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  gemini_cloud: { label: 'Puter.js Cloud', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  local_open_weight: { label: 'Puter.js Open-Weight', cls: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  cloud_brain: { label: 'Puter.js Free Model', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  long_term_memory: { label: 'Remembered Memory', cls: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' },
  parallel_verified: { label: 'Parallel Verified', cls: 'bg-lime-500/20 text-lime-300 border-lime-500/30' },
  system_notice: { label: 'System Diagnostic', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
};

export function MasterAiChatStudio(props: MasterAiChatStudioProps) {
  const {
    messages,
    sessions,
    activeSessionId,
    languageMode,
    pureNeuralOnly,
    genConfig,
    aiMode,
    isThinking,
    isVoiceActive,
    inputText,
    quickPrompts,
    chatBottomRef,
    registeredModels,
    manualModelId = 'auto',
    enableParallel = false,
    onChangeManualModelId,
    onToggleParallel,
    onInputChange,
    onSendMessage,
    onStopGenerating,
    onRegenerateLast,
    onToggleVoice,
    onJumpTo,
    onApplyChapters,
    onCopySummary,
    onLanguageChange,
    onTogglePureNeural,
    onChangeGenConfig,
    onCreateSession,
    onSelectSession,
    onRenameSession,
    onDeleteSession,
    onClearCurrentSession,
    onExportSession,
  } = props;

  const [showSidebar, setShowSidebar] = useState(false);
  const [showGenControls, setShowGenControls] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [feedbackMsgId, setFeedbackMsgId] = useState<string | null>(null);
  const [correctionDraft, setCorrectionDraft] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<Record<string, string>>({});
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const rtStatus = neuralRuntime.getStatus();
  const modelOptions = useMemo(
    () => registeredModels ?? modelRegistry.listModels(),
    [registeredModels],
  );

  const filteredSessions = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.text.toLowerCase().includes(q)),
    );
  }, [sessions, sessionSearch]);

  // Estimate live conversation tokens for visual budget gauge
  const latestAiWithMetrics = [...messages].reverse().find((m) => m.sender === 'ai' && m.promptTokens);
  const estContextUsed = useMemo(() => {
    if (latestAiWithMetrics?.promptTokens) return latestAiWithMetrics.promptTokens;
    const totalChars = messages.reduce((acc, m) => acc + (m.text?.length || 0) + 18, 0);
    return Math.min(512, Math.ceil(totalChars / 3.4));
  }, [messages, latestAiWithMetrics]);

  const maxCtx = latestAiWithMetrics?.maxContextTokens ?? rtStatus.manifest?.max_seq_len ?? 512;
  const ctxPct = Math.min(100, Math.round((estContextUsed / Math.max(1, maxCtx)) * 100));

  const submitFeedback = (msg: ChatMessage, rating: 'helpful' | 'unhelpful', corrected?: string) => {
    if (!humanFeedbackStore.isConsentEnabled()) {
      setFeedbackToast((prev) => ({
        ...prev,
        [msg.id]: 'Enable Opt-In Feedback inside "AI Engine" settings first.',
      }));
      return;
    }
    const msgIdx = messages.findIndex((m) => m.id === msg.id);
    const prevUser = msgIdx > 0 ? [...messages.slice(0, msgIdx)].reverse().find((m) => m.sender === 'user') : undefined;
    const res = humanFeedbackStore.recordFeedback({
      sessionId: activeSessionId,
      messageId: msg.id,
      prompt: prevUser?.text || '[Session Prompt]',
      modelResponse: msg.text,
      correctedResponse: corrected,
      rating,
      language: languageMode,
      modelTag: msg.modelTag || 'MASTER-AI-v1.0',
    });
    setFeedbackToast((prev) => ({
      ...prev,
      [msg.id]: res.saved
        ? corrected
          ? 'Saved locally with correction (active model weights unchanged).'
          : `Saved "${rating}" locally for future offline training export.`
        : res.reason || 'Could not record feedback.',
    }));
    if (res.saved && corrected) {
      setFeedbackMsgId(null);
      setCorrectionDraft('');
    }
  };

  return (
    <div className="flex flex-1 min-h-0 gap-3 relative">
      {/* Collapsible Session History Sidebar */}
      {showSidebar && (
        <aside className="w-60 shrink-0 rounded-2xl bg-black/40 border border-white/10 p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-1.5">
            <Button
              size="sm"
              variant="gradient"
              onClick={onCreateSession}
              className="flex-1 h-7 rounded-xl text-[11px] font-semibold gap-1"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" /> New Chat
            </Button>
          </div>

          <div className="relative">
            <Search className="w-3 h-3 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
            {filteredSessions.map((sess) => {
              const active = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => onSelectSession(sess.id)}
                  className={`group p-2 rounded-xl border text-[11px] cursor-pointer transition-all ${
                    active
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-white'
                      : 'bg-white/5 border-transparent hover:border-white/10 text-white/70'
                  }`}
                >
                  {renamingId === sess.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onRenameSession(sess.id, renameDraft);
                            setRenamingId(null);
                          }
                        }}
                        className="flex-1 bg-black/60 border border-cyan-400 rounded px-1.5 py-0.5 text-[11px] text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onRenameSession(sess.id, renameDraft);
                          setRenamingId(null);
                        }}
                        className="text-emerald-400 p-0.5"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-medium">{sess.title}</span>
                      <div className="hidden group-hover:flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingId(sess.id);
                            setRenameDraft(sess.title);
                          }}
                          className="text-white/50 hover:text-cyan-300"
                          title="Rename"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {sessions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteSession(sess.id)}
                            className="text-white/50 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="text-[9px] text-white/40 mt-0.5 font-mono">
                    {sess.messages.length} msgs · {new Date(sess.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={onClearCurrentSession}
              className="py-1 px-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-[10px] text-white/70 hover:text-rose-300 transition-colors"
              title="Clear Current Chat"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => onExportSession('markdown')}
              className="py-1 px-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-[10px] text-white/70 hover:text-cyan-300 flex items-center justify-center gap-0.5"
              title="Export Markdown"
            >
              <Download className="w-2.5 h-2.5" /> .MD
            </button>
            <button
              type="button"
              onClick={() => onExportSession('json')}
              className="py-1 px-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-[10px] text-white/70 hover:text-amber-300 flex items-center justify-center gap-0.5"
              title="Export JSON"
            >
              <Download className="w-2.5 h-2.5" /> .JSON
            </button>
          </div>
        </aside>
      )}

      {/* Main Chat Column */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 space-y-2.5">
        {/* Studio Control Strip */}
        <div className="flex items-center justify-between gap-2 flex-wrap px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowSidebar((v) => !v)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-colors ${
                showSidebar
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : 'bg-white/5 text-white/75 border-white/10 hover:text-white'
              }`}
            >
              <History className="w-3 h-3" />
              Chats ({sessions.length})
            </button>

            {/* Bilingual Language Mode Selector */}
            <div className="flex items-center rounded-lg bg-black/40 border border-white/10 p-0.5">
              {(['auto', 'sinhala', 'english', 'mixed'] as LanguagePreferenceMode[]).map((lg) => (
                <button
                  key={lg}
                  type="button"
                  onClick={() => onLanguageChange(lg)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                    languageMode === lg
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/30'
                      : 'text-white/55 hover:text-white'
                  }`}
                >
                  {lg === 'sinhala' ? 'සිංහල' : lg.charAt(0).toUpperCase() + lg.slice(1)}
                </button>
              ))}
            </div>

            {aiMode === 'local' && (
              <button
                type="button"
                onClick={() => onTogglePureNeural(!pureNeuralOnly)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-colors ${
                  pureNeuralOnly
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
                title="Toggle between Tool-Assisted (Deterministic Tools + ONNX) and Pure Raw Neural ONNX mode"
              >
                <Sparkles className="w-3 h-3" />
                {pureNeuralOnly ? 'Pure Neural Raw' : 'Tool-Assisted'}
              </button>
            )}

            {/* Puter.js Model Selector */}
            {onChangeManualModelId && (
              <select
                value={manualModelId}
                onChange={(e) => onChangeManualModelId(e.target.value)}
                title="Puter.js Verified Free Models"
                className="px-2 py-1 rounded-lg bg-black/50 border border-white/15 text-[10px] text-white/90 outline-none max-w-[175px]"
              >
                <optgroup label="Verified Free Models ($0)">
                  {VERIFIED_FREE_CHAT_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Puter.js Standard Models">
                  {PUTER_STANDARD_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            )}

            {onToggleParallel && (
              <button
                type="button"
                onClick={() => onToggleParallel(!enableParallel)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-colors ${
                  enableParallel
                    ? 'bg-lime-500/20 text-lime-300 border-lime-500/30'
                    : 'bg-white/5 text-white/55 border-white/10 hover:text-white'
                }`}
                title="Optional value-driven parallel multi-model comparison on complex prompts"
              >
                Parallel {enableParallel ? 'ON' : 'OFF'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Context Token Meter */}
            <div className="flex items-center gap-1.5" title="Conversation window budget inside active ONNX session">
              <span className="text-[10px] font-mono text-white/60">
                Ctx {estContextUsed}/{maxCtx}
              </span>
              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    ctxPct > 85 ? 'bg-rose-400' : ctxPct > 65 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${ctxPct}%` }}
                />
              </div>
            </div>

            {/* Runtime Indicator */}
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                aiMode === 'cloud'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : rtStatus.status === 'ready'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : rtStatus.status === 'error'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {aiMode === 'cloud'
                ? 'Cloud API'
                : rtStatus.status === 'ready'
                  ? `ONNX Ready`
                  : rtStatus.status === 'loading'
                    ? 'Loading ONNX…'
                    : rtStatus.status === 'error'
                      ? 'ONNX Error'
                      : 'ONNX Standby'}
            </span>

            <button
              type="button"
              onClick={() => setShowGenControls((v) => !v)}
              className={`p-1 rounded-lg border transition-colors ${
                showGenControls
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
              }`}
              title="Sampling Parameters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Generation Parameter Popover Bar */}
        {showGenControls && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-[10px] shrink-0">
            <label className="space-y-1 text-white/70">
              <div className="flex justify-between font-mono">
                <span>Temp</span><span>{genConfig.temperature.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1.2" step="0.05"
                value={genConfig.temperature}
                onChange={(e) => onChangeGenConfig({ ...genConfig, temperature: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </label>
            <label className="space-y-1 text-white/70">
              <div className="flex justify-between font-mono">
                <span>Top-K</span><span>{genConfig.topK}</span>
              </div>
              <input
                type="range" min="1" max="100" step="1"
                value={genConfig.topK}
                onChange={(e) => onChangeGenConfig({ ...genConfig, topK: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </label>
            <label className="space-y-1 text-white/70">
              <div className="flex justify-between font-mono">
                <span>Top-P</span><span>{genConfig.topP.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.1" max="1" step="0.05"
                value={genConfig.topP}
                onChange={(e) => onChangeGenConfig({ ...genConfig, topP: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </label>
            <label className="space-y-1 text-white/70">
              <div className="flex justify-between font-mono">
                <span>Max Tok</span><span>{genConfig.maxNewTokens}</span>
              </div>
              <input
                type="range" min="24" max="224" step="8"
                value={genConfig.maxNewTokens}
                onChange={(e) => onChangeGenConfig({ ...genConfig, maxNewTokens: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </label>
            <label className="space-y-1 text-white/70">
              <div className="flex justify-between font-mono">
                <span>Rep Pen</span><span>{genConfig.repetitionPenalty.toFixed(2)}</span>
              </div>
              <input
                type="range" min="1" max="1.5" step="0.05"
                value={genConfig.repetitionPenalty}
                onChange={(e) => onChangeGenConfig({ ...genConfig, repetitionPenalty: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </label>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((msg, msgIdx) => {
            const isLastAi = msg.sender === 'ai' && msgIdx === messages.length - 1;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white shadow-md rounded-br-none'
                      : 'bg-white/5 border border-white/10 text-white/90 shadow-md rounded-bl-none'
                  }`}
                >
                  {/* Working Memory Compression Alert */}
                  {msg.compressedNotice && (
                    <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-200">
                      {msg.compressedNotice}
                    </div>
                  )}

                  {/* Source Attribution Badges (AI Messages) */}
                  {msg.sender === 'ai' && (msg.sourcesUsed?.length || msg.modelTag) && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-2 pb-1.5 border-b border-white/10">
                      {(msg.sourcesUsed || []).map((badge, bi) => {
                        const st = SOURCE_BADGE_STYLES[badge] || SOURCE_BADGE_STYLES.neural_core;
                        return (
                          <span
                            key={bi}
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        );
                      })}
                      {msg.confidenceScore !== undefined && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            msg.confidenceScore >= 0.75
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                          }`}
                          title="Brain A automated hallucination & repetition confidence"
                        >
                          Conf {Math.round(msg.confidenceScore * 100)}%
                        </span>
                      )}
                      {msg.tokensGenerated !== undefined && (
                        <span className="text-[9px] font-mono text-white/45 ml-auto">
                          {msg.tokensGenerated} tok · {msg.latencyMs ?? 0}ms
                          {msg.fallbackTriggered ? ' · Fallback' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Orchestration Trace & Warnings Drawer (Brain A Transparency) */}
                  {msg.sender === 'ai' && !msg.isStreaming && (msg.validationWarnings?.length || msg.orchestrationTrace?.length) && (
                    <div className="mb-2 space-y-1">
                      {msg.validationWarnings?.map((w, wi) => (
                        <div key={wi} className="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[10px] text-rose-200">
                          ⚠️ {w}
                        </div>
                      ))}
                      {msg.orchestrationTrace && msg.orchestrationTrace.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)}
                            className="text-[9px] font-mono text-cyan-300/75 hover:text-cyan-200 underline"
                          >
                            {expandedTraceId === msg.id ? 'Hide Brain A Orchestration Trace' : 'Inspect Brain A Routing & Validation Trace'}
                          </button>
                          {expandedTraceId === msg.id && (
                            <div className="mt-1 p-2 rounded-lg bg-black/45 border border-white/10 text-[9px] font-mono text-white/70 space-y-0.5">
                              {msg.orchestrationTrace.map((line, li) => (
                                <div key={li}>• {line}</div>
                              ))}
                              {msg.parallelAlternatives && msg.parallelAlternatives.length > 1 && (
                                <div className="pt-1 mt-1 border-t border-white/10 text-lime-300">
                                  Parallel Candidates Compared: {msg.parallelAlternatives.map((p) => `${p.modelName} (${Math.round(p.validation.confidenceScore * 100)}%)`).join(' vs ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Inline Edit Mode vs Display */}
                  {editingMsgId === msg.id ? (
                    <div className="space-y-1.5 min-w-[220px]">
                      <textarea
                        value={editingDraft}
                        onChange={(e) => setEditingDraft(e.target.value)}
                        rows={2}
                        className="w-full p-2 rounded-lg bg-black/50 border border-white/30 text-xs text-white outline-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingMsgId(null)}
                          className="px-2 py-0.5 rounded bg-white/10 text-[10px]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const txt = editingDraft.trim();
                            setEditingMsgId(null);
                            if (txt) onSendMessage(txt, msg.id);
                          }}
                          className="px-2 py-0.5 rounded bg-cyan-400 text-black font-bold text-[10px]"
                        >
                          Save & Resend
                        </button>
                      </div>
                    </div>
                  ) : msg.sender === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <MasterAiMarkdown text={msg.text} onSeek={onJumpTo} />
                  )}

                  {/* Matched Timestamps Bar */}
                  {msg.matchedTimestamps && msg.matchedTimestamps.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-white/40 font-semibold mr-1">Jump:</span>
                      {msg.matchedTimestamps.map((ts, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onJumpTo(ts.time)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold transition-all"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {ts.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {msg.suggestedAction && (
                    <div className="mt-2.5 pt-2 border-t border-white/10">
                      {msg.suggestedAction.type === 'apply_chapters' && (
                        <Button
                          variant="gradient"
                          size="sm"
                          onClick={() => onApplyChapters((msg.suggestedAction?.payload as AIChapterSuggestion[]) || [])}
                          className="rounded-lg h-7 px-3 text-[11px] font-bold gap-1.5"
                        >
                          <Check className="w-3 h-3" />
                          {msg.suggestedAction.label}
                        </Button>
                      )}
                      {msg.suggestedAction.type === 'copy_summary' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onCopySummary}
                          className="rounded-lg h-7 px-3 text-[11px] font-bold gap-1.5 border-white/20 hover:bg-white/10"
                        >
                          <Check className="w-3 h-3" />
                          {msg.suggestedAction.label}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Inline AI Controls: Regenerate + Opt-In Feedback */}
                  {msg.sender === 'ai' && !msg.isStreaming && msgIdx > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center gap-2 flex-wrap text-[10px] text-white/50">
                      <button
                        type="button"
                        onClick={() => submitFeedback(msg, 'helpful')}
                        className="inline-flex items-center gap-1 hover:text-emerald-300 transition-colors"
                        title="Mark helpful (Opt-in local dataset)"
                      >
                        <ThumbsUp className="w-3 h-3" /> Helpful
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          submitFeedback(msg, 'unhelpful');
                          setFeedbackMsgId(msg.id);
                          setCorrectionDraft(msg.text);
                        }}
                        className="inline-flex items-center gap-1 hover:text-rose-300 transition-colors"
                        title="Suggest correction (Opt-in local dataset)"
                      >
                        <ThumbsDown className="w-3 h-3" /> Correct
                      </button>
                      {isLastAi && !isThinking && (
                        <button
                          type="button"
                          onClick={onRegenerateLast}
                          className="inline-flex items-center gap-1 hover:text-cyan-300 transition-colors ml-auto"
                        >
                          <RefreshCw className="w-3 h-3" /> Regenerate
                        </button>
                      )}
                    </div>
                  )}

                  {/* Correction Drawer */}
                  {feedbackMsgId === msg.id && (
                    <div className="mt-2 p-2 rounded-xl bg-black/50 border border-white/15 space-y-1.5">
                      <div className="text-[10px] text-amber-300">
                        Write improved response (saved locally for future offline fine-tuning; live ONNX weights remain unchanged):
                      </div>
                      <textarea
                        value={correctionDraft}
                        onChange={(e) => setCorrectionDraft(e.target.value)}
                        rows={2}
                        className="w-full p-1.5 rounded bg-black/60 border border-white/15 text-[11px] text-white outline-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFeedbackMsgId(null)}
                          className="px-2 py-0.5 rounded bg-white/10 text-[10px]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => submitFeedback(msg, 'unhelpful', correctionDraft)}
                          className="px-2 py-0.5 rounded bg-emerald-500 text-black font-bold text-[10px]"
                        >
                          Save Correction
                        </button>
                      </div>
                    </div>
                  )}

                  {feedbackToast[msg.id] && (
                    <div className="mt-1.5 text-[10px] text-cyan-300/90 font-mono">
                      {feedbackToast[msg.id]}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 px-1 mt-0.5">
                  <span className="text-[9px] text-white/30 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'user' && !isThinking && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMsgId(msg.id);
                        setEditingDraft(msg.text);
                      }}
                      className="text-[9px] text-white/35 hover:text-cyan-300 inline-flex items-center gap-0.5"
                    >
                      <Edit3 className="w-2.5 h-2.5" /> Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/75 max-w-sm">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Generating neural response locally…</span>
              </div>
              <button
                type="button"
                onClick={onStopGenerating}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-[10px] font-bold"
              >
                <Square className="w-2.5 h-2.5 fill-current" /> Stop
              </button>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 shrink-0">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              disabled={isThinking}
              onClick={() => onSendMessage(qp.prompt)}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/80 hover:text-white whitespace-nowrap transition-colors"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center gap-2 pt-1 border-t border-white/10 shrink-0">
          <input
            type="text"
            placeholder={
              isVoiceActive
                ? 'Listening to speech…'
                : 'Message MASTER AI v1.0 in සිංහල, English, or Mixed…'
            }
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isThinking && onSendMessage()}
            disabled={isThinking}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 text-xs text-white outline-none placeholder:text-white/40"
          />

          <button
            type="button"
            onClick={onToggleVoice}
            className={`p-2.5 rounded-xl border transition-all ${
              isVoiceActive
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title="Voice Query"
          >
            {isVoiceActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {isThinking ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onStopGenerating}
              className="h-9 px-3.5 rounded-xl font-semibold gap-1.5 border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Stop
            </Button>
          ) : (
            <Button
              variant="gradient"
              size="sm"
              onClick={() => onSendMessage()}
              disabled={!inputText.trim()}
              className="h-9 px-4 rounded-xl font-semibold gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
