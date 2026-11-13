import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Brain,
  Sparkles,
  Copy,
  Clock,
  Play,
  RotateCcw,
  Tag,
  Search,
  Sliders,
  X,
  Check,
  CheckCircle2,
  Key,
  Shield,
  Layers,
  FileText,
  Activity,
  Download,
  AlertTriangle,
  Cpu,
  HardDrive,
  Monitor,
  Gauge,
  Database,
  Volume2,
  Trash2,
  Lock,
  FlaskConical,
} from 'lucide-react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { resourceManager, BrowserCapabilities } from '@/services/resourceManager';
import { formatBytes } from '@/lib/utils';
import {
  masterAiEngine,
  ChatMessage,
  VideoAIContext,
  AIChapterSuggestion,
} from '@/services/masterAiEngine';
import {
  extractDetailedMediaMetadata,
  extractTranscriptKeywords,
  searchTranscriptCues,
  speechToTextEngine,
  TranscriptionEvent,
} from '@/services/videoIntelligence';
import {
  conversationMemory,
  ConversationSession,
  LanguagePreferenceMode,
  StoredChatMessage,
} from '@/services/ai/conversationMemory';
import {
  DEFAULT_NEURAL_GEN_CONFIG,
  NeuralGenerationConfig,
  neuralRuntime,
} from '@/services/ai/neuralRuntime';
import { humanFeedbackStore } from '@/services/ai/feedbackStore';
import { AiModelDescriptor, modelRegistry } from '@/services/ai/modelRegistry';
import { VERIFIED_FREE_CHAT_MODELS } from '@/services/ai/puterAiService';
import { MasterAiChatStudio } from './MasterAiChatStudio';
import { LongTermMemoryPanel } from './MasterAiV2Panels';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function buildWelcomeMessage(
  mediaName: string | undefined,
  durationSec: number,
  cueCount: number,
  sceneCount: number,
): ChatMessage {
  return {
    id: 'welcome',
    sender: 'ai',
    text: `👋 **MASTER AI CORE v1.0** is ready for **${mediaName || 'this media workspace'}**.\n\nIndexed **${formatTimestamp(durationSec)}** duration, **${cueCount}** dialogue cues, and **${sceneCount}** visual scenes. Speak to me naturally in **සිංහල, English, or Mixed** — or switch modes anytime.`,
    timestamp: Date.now(),
    sourcesUsed: ['neural_core'],
    sourceLabel: 'MASTER AI v1.0',
    modelTag: 'MASTER-AI-v1.0',
  };
}

export function MasterAiModal({ videoRef }: { videoRef?: React.RefObject<HTMLVideoElement> }) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'chat' | 'summary' | 'chapters' | 'search' | 'memory' | 'capabilities' | 'export' | 'settings'
  >('chat');
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null);
  const [registeredModels, setRegisteredModels] = useState<AiModelDescriptor[]>(() => modelRegistry.listModels());
  const [manualModelId, setManualModelId] = useState<string>(VERIFIED_FREE_CHAT_MODELS[0].id);
  const [enableParallel, setEnableParallel] = useState<boolean>(false);

  // Store Selectors
  const videoFile = useVideoPlayerStore((s) => s.videoFile);
  const fileName = useVideoPlayerStore((s) => s.fileName);
  const duration = useVideoPlayerStore((s) => s.duration);
  const currentTime = useVideoPlayerStore((s) => s.currentTime);
  const resolution = useVideoPlayerStore((s) => s.resolution);
  const subtitleTracks = useVideoPlayerStore((s) => s.subtitleTracks);
  const activeSubtitleTrackId = useVideoPlayerStore((s) => s.activeSubtitleTrackId);
  const detectedScenes = useVideoPlayerStore((s) => s.detectedScenes);
  const bookmarks = useVideoPlayerStore((s) => s.bookmarks);

  // Store Actions
  const setCurrentTime = useVideoPlayerStore((s) => s.setCurrentTime);
  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);
  const addMarker = useVideoPlayerStore((s) => s.addMarker);

  const activeTrack = subtitleTracks.find((t) => t.id === activeSubtitleTrackId) || subtitleTracks[0];
  const cues = activeTrack?.cues || [];

  // Multi-Session Studio State
  const [sessions, setSessions] = useState<ConversationSession[]>(() => {
    const existing = conversationMemory.listSessions();
    if (existing.length > 0) return existing;
    return [conversationMemory.createSession(fileName || 'New Conversation', fileName || undefined, 'auto')];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const existing = conversationMemory.listSessions();
    return existing[0]?.id || sessions[0]?.id || '';
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const existing = conversationMemory.listSessions();
    const first = existing[0];
    if (first && first.messages.length > 0) {
      return first.messages as ChatMessage[];
    }
    return [buildWelcomeMessage(fileName || undefined, duration, cues.length, detectedScenes.length)];
  });
  const [languageMode, setLanguageMode] = useState<LanguagePreferenceMode>(
    () => conversationMemory.getSession(conversationMemory.listSessions()[0]?.id || '')?.languageMode || 'auto',
  );
  const [pureNeuralOnly, setPureNeuralOnly] = useState(false);
  const [genConfig, setGenConfig] = useState<NeuralGenerationConfig>(DEFAULT_NEURAL_GEN_CONFIG);

  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);

  // Settings & Telemetry State
  const [aiMode, setAiMode] = useState<'local' | 'cloud'>(masterAiEngine.getMode());
  const [apiKeyInput, setApiKeyInput] = useState(masterAiEngine.getApiKey() || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackConsent, setFeedbackConsent] = useState(() => humanFeedbackStore.isConsentEnabled());
  const [feedbackStats, setFeedbackStats] = useState(() => humanFeedbackStore.getStats());
  const [neuralSnapshot, setNeuralSnapshot] = useState(() => neuralRuntime.getStatus());

  // Build Context for Master AI
  const aiContext: VideoAIContext = useMemo(() => {
    return {
      fileName: fileName || 'Video',
      duration,
      currentTime: videoRef?.current ? videoRef.current.currentTime : currentTime,
      resolution,
      fileSize: videoFile?.size || 0,
      container: fileName ? fileName.split('.').pop()?.toUpperCase() : 'MP4',
      cues,
      scenes: detectedScenes,
      bookmarks,
    };
  }, [fileName, duration, currentTime, resolution, videoFile, cues, detectedScenes, bookmarks, videoRef]);

  const persistSessionMessages = useCallback(
    (sessId: string, nextMessages: ChatMessage[]) => {
      const storable = nextMessages.filter((m) => m.id !== 'welcome' && !m.isStreaming) as StoredChatMessage[];
      if (sessId) {
        conversationMemory.saveMessages(sessId, storable, true);
        setSessions(conversationMemory.listSessions());
      }
    },
    [],
  );

  // Update welcome greeting metadata if still untouched
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome') {
      setMessages([buildWelcomeMessage(fileName || undefined, duration, cues.length, detectedScenes.length)]);
    }
  }, [fileName, duration, cues.length, detectedScenes.length]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, activeTab]);

  // Load real browser capabilities & refresh ONNX/feedback/registry snapshots
  useEffect(() => {
    resourceManager.getBrowserCapabilities(aiMode).then(setCapabilities);
    setFeedbackConsent(humanFeedbackStore.isConsentEnabled());
    setFeedbackStats(humanFeedbackStore.getStats());
    setNeuralSnapshot(neuralRuntime.getStatus());
    setRegisteredModels(modelRegistry.listModels());
    return modelRegistry.subscribe(() => setRegisteredModels(modelRegistry.listModels()));
  }, [aiMode, activeTab]);

  // Jump to specific timestamp
  const jumpTo = (seconds: number) => {
    const video = videoRef?.current;
    if (video) {
      video.currentTime = seconds;
      setCurrentTime(seconds);
      toast.info(`Jumped to ${formatTimestamp(seconds)}`);
    }
  };

  // Send message to Master AI with true streaming + abort + edit support
  const handleSendMessage = async (textToSend?: string, editMsgId?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query || isThinking) return;

    let baseAll = messages;
    if (editMsgId) {
      const editIdx = messages.findIndex((m) => m.id === editMsgId);
      if (editIdx >= 0) {
        baseAll = messages.slice(0, editIdx);
      }
    }

    const cleanHistory = baseAll.filter((m) => m.id !== 'welcome' && !m.isStreaming);
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };
    const streamAiId = `ai_${Date.now() + 1}`;
    const placeholderAi: ChatMessage = {
      id: streamAiId,
      sender: 'ai',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      sourcesUsed: pureNeuralOnly ? ['neural_core'] : ['tool_assisted_neural'],
      sourceLabel: aiMode === 'cloud' && apiKeyInput ? 'Cloud Gemini' : 'MASTER AI v1.0',
      modelTag: 'MASTER-AI-v1.0',
    };

    const nextWithUser = [...baseAll, userMsg, placeholderAi];
    setMessages(nextWithUser);
    if (!textToSend && !editMsgId) setInputText('');
    setIsThinking(true);

    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;

    try {
      const response = await masterAiEngine.chat(query, aiContext, cleanHistory, {
        signal: ctrl.signal,
        languageMode,
        genConfig,
        pureNeuralOnly,
        manualModelId,
        sessionId: activeSessionId,
        enableParallelComparison: enableParallel,
        onProgress: (partialText) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === streamAiId ? { ...m, text: partialText } : m)),
          );
        },
      });
      const finalMsg: ChatMessage = { ...response, isStreaming: false };
      setMessages((prev) => {
        const finalized = prev.map((m) => (m.id === streamAiId ? finalMsg : m));
        persistSessionMessages(activeSessionId, finalized);
        return finalized;
      });
      setNeuralSnapshot(neuralRuntime.getStatus());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const errReply: ChatMessage = {
        id: streamAiId,
        sender: 'ai',
        text: `⚠️ **MasterAI Runtime Notice**: ${msg}`,
        timestamp: Date.now(),
        isStreaming: false,
        sourcesUsed: ['system_notice'],
        sourceLabel: 'System Diagnostic',
      };
      setMessages((prev) => {
        const finalized = prev.map((m) => (m.id === streamAiId ? errReply : m));
        persistSessionMessages(activeSessionId, finalized);
        return finalized;
      });
    } finally {
      abortCtrlRef.current = null;
      setIsThinking(false);
    }
  };

  const handleStopGenerating = () => {
    abortCtrlRef.current?.abort();
    setIsThinking(false);
    setMessages((prev) => prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)));
  };

  const handleRegenerateLast = () => {
    if (isThinking) return;
    const lastUser = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUser) {
      handleSendMessage(lastUser.text, lastUser.id);
    }
  };

  const handleCreateSession = () => {
    const created = conversationMemory.createSession('New Conversation', fileName || undefined, languageMode);
    setSessions(conversationMemory.listSessions());
    setActiveSessionId(created.id);
    setMessages([buildWelcomeMessage(fileName || undefined, duration, cues.length, detectedScenes.length)]);
  };

  const handleSelectSession = (sessId: string) => {
    const sess = conversationMemory.getSession(sessId);
    if (!sess) return;
    setActiveSessionId(sess.id);
    setLanguageMode(sess.languageMode);
    setMessages(
      sess.messages.length > 0
        ? (sess.messages as ChatMessage[])
        : [buildWelcomeMessage(fileName || undefined, duration, cues.length, detectedScenes.length)],
    );
  };

  const handleRenameSession = (sessId: string, newTitle: string) => {
    conversationMemory.renameSession(sessId, newTitle);
    setSessions(conversationMemory.listSessions());
  };

  const handleDeleteSession = (sessId: string) => {
    conversationMemory.deleteSession(sessId);
    let nextList = conversationMemory.listSessions();
    if (nextList.length === 0) {
      const fresh = conversationMemory.createSession(fileName || 'New Conversation', fileName || undefined, languageMode);
      nextList = [fresh];
    }
    setSessions(nextList);
    if (sessId === activeSessionId) {
      const target = nextList[0];
      setActiveSessionId(target.id);
      setLanguageMode(target.languageMode);
      setMessages(
        target.messages.length > 0
          ? (target.messages as ChatMessage[])
          : [buildWelcomeMessage(fileName || undefined, duration, cues.length, detectedScenes.length)],
      );
    }
  };

  const handleClearCurrentSession = () => {
    conversationMemory.clearSessionMessages(activeSessionId);
    setSessions(conversationMemory.listSessions());
    setMessages([buildWelcomeMessage(fileName || undefined, duration, cues.length, detectedScenes.length)]);
    toast.info('Cleared current conversation session.');
  };

  const handleLanguageChange = (mode: LanguagePreferenceMode) => {
    setLanguageMode(mode);
    conversationMemory.setSessionLanguage(activeSessionId, mode);
    setSessions(conversationMemory.listSessions());
  };

  const handleExportSession = (fmt: 'markdown' | 'json') => {
    const sess = conversationMemory.getSession(activeSessionId);
    if (!sess) return;
    const safeTitle = (sess.title || 'master_ai_chat').replace(/[^a-zA-Z0-9_-]/g, '_');
    if (fmt === 'markdown') {
      const md = conversationMemory.exportSessionMarkdown(sess);
      resourceManager.downloadFile(`${safeTitle}.md`, md, 'text/markdown;charset=utf-8');
    } else {
      resourceManager.downloadFile(
        `${safeTitle}.json`,
        JSON.stringify(sess, null, 2),
        'application/json;charset=utf-8',
      );
    }
    toast.success(`Exported conversation as .${fmt === 'markdown' ? 'MD' : 'JSON'}`);
  };

  // Voice Query using Web Speech API
  const handleToggleVoice = () => {
    if (isVoiceActive) {
      speechToTextEngine.stop();
      setIsVoiceActive(false);
      toast.info('Voice query stopped.');
    } else {
      const started = speechToTextEngine.start(
        () => 0,
        () => {},
        (ev: TranscriptionEvent) => {
          if (ev.isFinal && ev.transcriptSnippet) {
            setInputText(ev.transcriptSnippet);
            handleSendMessage(ev.transcriptSnippet);
            setIsVoiceActive(false);
          } else if (ev.transcriptSnippet) {
            setInputText(ev.transcriptSnippet);
          } else if (ev.status === 'error') {
            setIsVoiceActive(false);
            toast.error(ev.error || 'Speech recognition error.');
          }
        },
      );
      if (started) {
        setIsVoiceActive(true);
        toast.info('Listening… Speak your question for MasterAI.');
      }
    }
  };

  // Apply chapters suggested by Master AI to timeline
  const handleApplyChapters = (chapters: AIChapterSuggestion[]) => {
    chapters.forEach((ch, idx) => {
      addMarker(ch.start, ch.title, 'chapter', '#06b6d4');
    });
    toast.success(`Applied ${chapters.length} chapters to your player timeline!`);
  };

  // Quick Action Chips
  const QUICK_PROMPTS = [
    { label: '✨ Summarize Key Points', prompt: 'Summarize this video and give me the key takeaways.' },
    { label: '📑 Generate Chapters', prompt: 'Analyze scenes and dialogue to create structured chapters with timestamps.' },
    { label: '🔍 Main Topics Discussed', prompt: 'What are the main topics and keywords in this dialogue?' },
    { label: '⚙️ Technical Quality Check', prompt: 'Critique the video resolution, bitrate, aspect ratio, and technical specs.' },
    { label: '🎙️ Speech & Pacing', prompt: 'Analyze speech pacing, words per minute, and audio profile.' },
  ];

  // Generated Summary (cached)
  const summaryData = useMemo(() => {
    return masterAiEngine.generateExecutiveSummary(aiContext);
  }, [aiContext]);

  // Generated Chapters (cached)
  const chaptersData = useMemo(() => {
    return masterAiEngine.generateSmartChapters(aiContext);
  }, [aiContext]);

  // Multi-format export trigger (Zero Artificial Limits)
  const handleExport = (format: 'txt' | 'srt' | 'vtt' | 'json' | 'csv' | 'markdown') => {
    const safeTitle = (fileName || 'master_cloud_intelligence').replace(/[^a-zA-Z0-9_-]/g, '_');
    const result = resourceManager.generateExport(format, {
      title: fileName || 'Master Cloud Video',
      duration,
      summary: summaryData.executiveSummary,
      takeaways: summaryData.keyTakeaways,
      chapters: chaptersData,
      cues,
      scenes: detectedScenes.map((s) => ({ timestamp: s.start, label: s.label })),
      chatHistory: messages.map((m) => ({ sender: m.sender, text: m.text, timestamp: m.timestamp })),
    });
    resourceManager.downloadFile(`${safeTitle}.${result.extension}`, result.content, result.mimeType);
    toast.success(`Successfully exported report as .${result.extension.toUpperCase()}`);
  };

  // Transcript Keywords
  const keywords = useMemo(() => {
    return extractTranscriptKeywords(cues, 16);
  }, [cues]);

  // Search Results
  const searchResults = useMemo(() => {
    return searchTranscriptCues(cues, searchQuery);
  }, [cues, searchQuery]);

  // Save Settings
  const handleSaveSettings = () => {
    masterAiEngine.setMode(aiMode);
    masterAiEngine.setApiKey(apiKeyInput);
    toast.success('MasterAI configuration saved successfully!');
  };

  // Copy full summary to clipboard
  const handleCopySummary = () => {
    const text = `# ${summaryData.title}\n\n${summaryData.executiveSummary}\n\n## Key Takeaways:\n${summaryData.keyTakeaways.map((t) => `- ${t}`).join('\n')}\n\nSpeech Pacing: ${summaryData.speechPacing.wpm} WPM (${summaryData.speechPacing.density})\nAudio Profile: ${summaryData.audioProfile}`;
    navigator.clipboard.writeText(text);
    toast.success('Summary copied to clipboard!');
  };

  return (
    <div
      data-controls="true"
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full max-w-4xl h-[90vh] rounded-2xl border border-white/10 bg-zinc-950/95 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl text-white flex flex-col space-y-3">
        {/* ---- Header Bar ---- */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
              <Brain className="w-5 h-5 text-cyan-400" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">MASTER AI Studio</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {aiMode === 'cloud' && apiKeyInput ? 'Cloud Gemini Supercharge' : 'Master Local Neural AI'}
                </span>
              </div>
              <p className="text-xs text-white/50 truncate max-w-sm sm:max-w-md">
                Analyzing: <span className="text-white/80 font-medium">{fileName || 'Active Video'}</span> • {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePanel('none')}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Master AI"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ---- Navigation Tabs ---- */}
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            AI Co-Pilot Chat
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'summary'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Executive Summary
          </button>
          <button
            onClick={() => setActiveTab('chapters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'chapters'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Smart Chapters ({chaptersData.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'search'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Dialogue Search
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'memory'
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Memory
          </button>
          <button
            onClick={() => setActiveTab('capabilities')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'capabilities'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            System Specs
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'export'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ml-auto ${
              activeTab === 'settings'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            AI Engine
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: MASTER AI STUDIO CHAT                                      */}
        {/* ================================================================= */}
        {activeTab === 'chat' && (
          <MasterAiChatStudio
            messages={messages}
            sessions={sessions}
            activeSessionId={activeSessionId}
            languageMode={languageMode}
            pureNeuralOnly={pureNeuralOnly}
            genConfig={genConfig}
            aiMode={aiMode}
            isThinking={isThinking}
            isVoiceActive={isVoiceActive}
            inputText={inputText}
            quickPrompts={QUICK_PROMPTS}
            chatBottomRef={chatBottomRef}
            registeredModels={registeredModels}
            manualModelId={manualModelId}
            enableParallel={enableParallel}
            onChangeManualModelId={setManualModelId}
            onToggleParallel={setEnableParallel}
            onInputChange={setInputText}
            onSendMessage={handleSendMessage}
            onStopGenerating={handleStopGenerating}
            onRegenerateLast={handleRegenerateLast}
            onToggleVoice={handleToggleVoice}
            onJumpTo={jumpTo}
            onApplyChapters={handleApplyChapters}
            onCopySummary={handleCopySummary}
            onLanguageChange={handleLanguageChange}
            onTogglePureNeural={setPureNeuralOnly}
            onChangeGenConfig={setGenConfig}
            onCreateSession={handleCreateSession}
            onSelectSession={handleSelectSession}
            onRenameSession={handleRenameSession}
            onDeleteSession={handleDeleteSession}
            onClearCurrentSession={handleClearCurrentSession}
            onExportSession={handleExportSession}
          />
        )}

        {activeTab === 'memory' && <LongTermMemoryPanel />}

        {/* ================================================================= */}
        {/* TAB 2: EXECUTIVE SUMMARY & KEY TAKEAWAYS                          */}
        {/* ================================================================= */}
        {activeTab === 'summary' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Autonomous Video Synthesis
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySummary}
                  className="h-7 text-xs rounded-lg gap-1 border-white/15 hover:bg-white/10"
                >
                  <Copy className="w-3 h-3" />
                  Copy Markdown
                </Button>
              </div>
            </div>

            {/* Executive Summary Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300">Executive Brief</span>
              <p className="text-xs text-white/90 leading-relaxed font-sans">
                {summaryData.executiveSummary}
              </p>
            </div>

            {/* Key Takeaways */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300">Key Moments & Takeaways</span>
              <div className="space-y-2">
                {summaryData.keyTakeaways.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Speech and Audio Acoustics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/40 block uppercase font-semibold">Speech Rate</span>
                <span className="text-base font-bold text-cyan-300 font-mono">
                  {summaryData.speechPacing.wpm} WPM
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">{summaryData.speechPacing.density}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/40 block uppercase font-semibold">Total Spoken Words</span>
                <span className="text-base font-bold text-white font-mono">
                  {summaryData.speechPacing.totalWords.toLocaleString()}
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">{cues.length} dialogue cues</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/40 block uppercase font-semibold">Acoustic Profile</span>
                <span className="text-xs font-bold text-emerald-300 block truncate mt-1">
                  {summaryData.audioProfile}
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">{summaryData.technicalVerdict}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: SMART CHAPTERS & SCENES                                    */}
        {/* ================================================================= */}
        {activeTab === 'chapters' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  AI-Generated Chapter Timeline
                </h3>
                <p className="text-xs text-white/50">
                  Synthesized from {detectedScenes.length} visual transitions and dialogue boundaries.
                </p>
              </div>

              <Button
                variant="gradient"
                size="sm"
                onClick={() => handleApplyChapters(chaptersData)}
                className="rounded-xl h-8 text-xs font-bold gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                Apply All to Timeline
              </Button>
            </div>

            <div className="space-y-2 mt-2">
              {chaptersData.map((ch, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{ch.title}</span>
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 shrink-0">
                          {formatTimestamp(ch.start)} – {formatTimestamp(ch.end)}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 truncate mt-0.5">{ch.description}</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => jumpTo(ch.start)}
                    className="h-7 px-2.5 text-xs text-cyan-300 hover:bg-cyan-500/20 rounded-lg gap-1 shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Seek
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: DIALOGUE & KEYWORD SEARCH                                  */}
        {/* ================================================================= */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Keywords */}
            {keywords.length > 0 && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300">
                  Extracted Dialogue Keywords
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {keywords.map((kw) => (
                    <button
                      key={kw.word}
                      onClick={() => setSearchQuery(kw.word)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <span>#{kw.word}</span>
                      <span className="text-[10px] bg-cyan-500/30 px-1 rounded-full">{kw.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search transcript dialogue (e.g. 'cloud', 'security', 'code')…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 text-white outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-white/40 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results */}
            {searchQuery && (
              <div className="space-y-1.5">
                {searchResults.length === 0 ? (
                  <div className="text-center py-6 text-xs text-white/40">
                    No dialogue matches found for &quot;{searchQuery}&quot;.
                  </div>
                ) : (
                  searchResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => jumpTo(res.cue.start)}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-mono text-[11px] text-cyan-300 shrink-0 font-bold">
                          {formatTimestamp(res.cue.start)}
                        </span>
                        <span className="text-white/80 truncate">{res.snippet}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-cyan-300 opacity-0 group-hover:opacity-100"
                      >
                        <Play className="w-2.5 h-2.5 mr-1 fill-current" /> Jump
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: SYSTEM CAPABILITIES & HARDWARE SPECS (ZERO ARTIFICIAL LIMITS) */}
        {/* ================================================================= */}
        {activeTab === 'capabilities' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                System Capabilities &amp; Resource Dashboard
              </h3>
              <p className="text-xs text-white/50">
                Transparent diagnostics of your browser sandbox, hardware acceleration, and zero-limit architecture.
              </p>
            </div>

            {/* Hardware & Sandbox Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Logical CPU Cores
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">{capabilities?.cpuCores || 4} Threads</span>
                </div>
                <p className="text-[10px] text-white/40">Multi-threaded browser worker concurrency.</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-purple-400" /> WebGPU Acceleration
                  </span>
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    capabilities?.hasWebGpu ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {capabilities?.hasWebGpu ? 'Active' : 'WASM/CPU Fallback'}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 truncate">
                  {capabilities?.gpuAdapterName || 'Hardware WebGPU accelerated when supported.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-400" /> Browser Storage Quota
                  </span>
                  <span className="font-mono text-[11px] text-blue-300 font-bold">
                    {capabilities?.storageQuotaBytes ? formatBytes(capabilities.storageQuotaBytes) : 'Dynamic Quota'}
                  </span>
                </div>
                <p className="text-[10px] text-white/40">
                  {capabilities?.storageUsageBytes ? `${formatBytes(capabilities.storageUsageBytes)} used (${capabilities.storagePercentUsed || '<1'}%)` : 'IndexedDB persistence available.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Web Audio Engine
                  </span>
                  <span className="font-mono text-emerald-300 font-bold">{capabilities?.audioSampleRate || 44100} Hz</span>
                </div>
                <p className="text-[10px] text-white/40">10-band ISO equalizer &amp; sub-frame sync.</p>
              </div>
            </div>

            {/* Original Neural Core v1.0 Telemetry */}
            <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-cyan-400" />
                  MASTER AI CORE v1.0 — Original Neural Runtime
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold">
                  {neuralSnapshot.status.toUpperCase()} ({neuralSnapshot.backend})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-white/40">Parameters</div>
                  <div className="font-mono text-white font-bold">
                    {neuralSnapshot.manifest
                      ? `${(neuralSnapshot.manifest.parameter_count / 1e6).toFixed(2)}M`
                      : '5.16M (v1.0)'}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-white/40">Bilingual Vocab</div>
                  <div className="font-mono text-white font-bold">
                    {neuralSnapshot.manifest?.vocab_size ?? 7875} tokens
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-white/40">Context Window</div>
                  <div className="font-mono text-white font-bold">
                    {neuralSnapshot.manifest?.max_seq_len ?? 512} RoPE
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-white/40">Weights Policy</div>
                  <div className="font-mono text-emerald-300 font-bold">Original Self-Trained</div>
                </div>
              </div>
              {neuralSnapshot.errorMessage && (
                <div className="text-[10px] text-rose-300 font-mono">
                  Runtime diagnostic: {neuralSnapshot.errorMessage}
                </div>
              )}
            </div>

            {/* Zero Artificial Limits Policy */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent border border-cyan-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Gauge className="w-4 h-4 text-cyan-400" />
                Zero Artificial Limits Architecture
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed">
                MASTER AI operates without arbitrary product paywalls or artificial caps. Computing boundaries are governed strictly by your device hardware, memory, and browser capabilities:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-white/80">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  No daily message or question quotas
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Unlimited video length (chunked streaming)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  No arbitrary chapter or bookmark limits
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Sliding context budgeting for long chats
                </li>
              </ul>
            </div>

            {/* Hardware Codec Support */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                Native Browser Codec Support Matrix
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {capabilities?.supportedVideoCodecs.map((codec) => (
                  <div key={codec.name} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 text-[11px]">
                    <span className="font-semibold text-white/80">{codec.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      codec.supported ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/40'
                    }`}>
                      {codec.supported ? 'Supported' : 'Unavailable'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: MULTI-FORMAT ZERO-LIMIT DATA EXPORT                       */}
        {/* ================================================================= */}
        {activeTab === 'export' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Multi-Format Data Export Studio
              </h3>
              <p className="text-xs text-white/50">
                Export generated summaries, chapters, spoken dialogue, and analytics in standardized, non-proprietary formats.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Markdown Report (.md)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">Comprehensive</span>
                </div>
                <p className="text-[11px] text-white/60">
                  Full executive report formatted with GitHub-flavored markdown, timestamped chapters, and key takeaways.
                </p>
                <Button
                  onClick={() => handleExport('markdown')}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs rounded-xl gap-1.5 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                >
                  <Download className="w-3.5 h-3.5" /> Download Markdown (.md)
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">SubRip Subtitles (.srt)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">Standard</span>
                </div>
                <p className="text-[11px] text-white/60">
                  Standard subtitle format compatible with VLC, YouTube, Adobe Premiere, and professional media players.
                </p>
                <Button
                  onClick={() => handleExport('srt')}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs rounded-xl gap-1.5 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Download className="w-3.5 h-3.5" /> Download SubRip (.srt)
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">WebVTT Subtitles (.vtt)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">Web Native</span>
                </div>
                <p className="text-[11px] text-white/60">
                  W3C Web Video Text Tracks for HTML5 video players, browsers, and streaming servers.
                </p>
                <Button
                  onClick={() => handleExport('vtt')}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs rounded-xl gap-1.5 border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                >
                  <Download className="w-3.5 h-3.5" /> Download WebVTT (.vtt)
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Tabular Timeline (.csv)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">Spreadsheet</span>
                </div>
                <p className="text-[11px] text-white/60">
                  Structured spreadsheet rows with start timestamps, end timestamps, chapters, and cue text.
                </p>
                <Button
                  onClick={() => handleExport('csv')}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs rounded-xl gap-1.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                >
                  <Download className="w-3.5 h-3.5" /> Download CSV (.csv)
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Full JSON Dataset (.json)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Developers</span>
                </div>
                <p className="text-[11px] text-white/60">
                  Complete programmatic payload including raw metadata, cue timestamps, scenes, and conversation state.
                </p>
                <Button
                  onClick={() => handleExport('json')}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs rounded-xl gap-1.5 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  <Download className="w-3.5 h-3.5" /> Download JSON (.json)
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Plain Text Transcript (.txt)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/20 text-white font-bold">Clean</span>
                </div>
                <p className="text-[11px] text-white/60">
                  Unformatted plain text transcript with timeline cues and summary notes.
                </p>
                <Button
                  onClick={() => handleExport('txt')}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs rounded-xl gap-1.5 border-white/20 text-white/80 hover:bg-white/10"
                >
                  <Download className="w-3.5 h-3.5" /> Download TXT (.txt)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 7: AI ENGINE & PRIVACY SETTINGS                              */}
        {/* ================================================================= */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                MasterAI Dual-Engine Configuration
              </h3>
              <p className="text-xs text-white/50">
                Choose between offline, local neural processing or supercharged cloud reasoning.
              </p>
            </div>

            {/* Mode Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setAiMode('local')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  aiMode === 'local'
                    ? 'bg-cyan-500/10 border-cyan-400 shadow-lg shadow-cyan-500/5'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    MASTER AI CORE (Original Neural)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                    Default / Local
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  100% private, offline original neural intelligence powered by our independently initialized Transformer ({neuralSnapshot.manifest ? `${(neuralSnapshot.manifest.parameter_count / 1e6).toFixed(2)}M` : '5.16M'} params · RMSNorm + RoPE + SwiGLU + GQA · {neuralSnapshot.manifest?.vocab_size ?? 7875}-token custom bilingual Sinhala/English tokenizer · {neuralSnapshot.manifest?.max_seq_len ?? 512} context), BM25 retrieval, and deterministic media calculators. Zero third-party pretrained weights or API dependencies.
                </p>
              </div>

              <div
                onClick={() => setAiMode('cloud')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  aiMode === 'cloud'
                    ? 'bg-purple-500/10 border-purple-400 shadow-lg shadow-purple-500/5'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    MASTER AI CLOUD (Optional Gemini)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                    External API
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Optional external integration. Sends retrieved transcript snippets directly to Google Gemini API via secure headers. Requires an external API key.
                </p>
              </div>
            </div>

            {/* Puter.js Gateway Section (Keyless Zero-Cost Cloud Mode) */}
            {aiMode === 'cloud' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Puter.js Unified AI Platform (Keyless Architecture)
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    $0 Developer Cost
                  </span>
                </div>
                <p className="text-[11px] text-white/70">
                  External AI providers are unified through Puter.js. No private API keys required from users or developers. Free open models (Gemma 4, Nemotron 3.5, Cohere North, Qwen 3.8) run with zero user credit consumption.
                </p>
              </div>
            )}

            {/* Opt-In Local Human Feedback & Dataset Curation (Zero Cloud Upload) */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    Opt-In Local Feedback &amp; Correction Export
                  </div>
                  <p className="text-[11px] text-white/55 mt-0.5">
                    Strictly local browser storage — never uploads data or claims to modify live ONNX weights. Export JSONL pairs for future human-reviewed offline training.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !feedbackConsent;
                    humanFeedbackStore.setConsent(next);
                    setFeedbackConsent(next);
                    setFeedbackStats(humanFeedbackStore.getStats());
                    toast.info(next ? 'Local feedback logging enabled.' : 'Local feedback logging disabled.');
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold border shrink-0 transition-all ${
                    feedbackConsent
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                      : 'bg-white/5 border-white/15 text-white/60 hover:text-white'
                  }`}
                >
                  {feedbackConsent ? 'Consent: Enabled' : 'Consent: Disabled'}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-white/40">Entries</div>
                  <div className="font-mono text-white font-bold">{feedbackStats.totalEntries}</div>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-white/40">Helpful</div>
                  <div className="font-mono text-emerald-300 font-bold">{feedbackStats.helpfulCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-white/40">Unhelpful</div>
                  <div className="font-mono text-rose-300 font-bold">{feedbackStats.unhelpfulCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-white/40">Corrections</div>
                  <div className="font-mono text-cyan-300 font-bold">{feedbackStats.correctionsCount}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={feedbackStats.totalEntries === 0}
                  onClick={() => {
                    const jsonl = humanFeedbackStore.exportPreferencePairsJsonl();
                    resourceManager.downloadFile(
                      `master_ai_feedback_${Date.now()}.jsonl`,
                      jsonl,
                      'application/x-ndjson;charset=utf-8',
                    );
                    toast.success('Exported local human feedback preference pairs (.jsonl).');
                  }}
                  className="text-xs rounded-xl gap-1.5 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSONL Pairs
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={feedbackStats.totalEntries === 0}
                  onClick={() => {
                    humanFeedbackStore.clearAll();
                    setFeedbackStats(humanFeedbackStore.getStats());
                    toast.info('Cleared all locally saved feedback entries.');
                  }}
                  className="text-xs rounded-xl gap-1.5 text-rose-300 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Saved Feedback
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <Button
                variant="gradient"
                size="sm"
                onClick={handleSaveSettings}
                className="rounded-xl px-5 h-9 font-semibold gap-1.5"
              >
                <Check className="w-4 h-4" />
                Save AI Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
