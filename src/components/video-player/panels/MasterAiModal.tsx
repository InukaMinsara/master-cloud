import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Brain,
  Sparkles,
  Send,
  Mic,
  MicOff,
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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MasterAiModal({ videoRef }: { videoRef?: React.RefObject<HTMLVideoElement> }) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'chapters' | 'search' | 'capabilities' | 'export' | 'settings'>('chat');
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Settings State
  const [aiMode, setAiMode] = useState<'local' | 'cloud'>(masterAiEngine.getMode());
  const [apiKeyInput, setApiKeyInput] = useState(masterAiEngine.getApiKey() || '');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Initial Welcome Message from Master AI
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `👋 Greetings! I am **MasterAI**, your media intelligence co-pilot for **${fileName || 'this video'}**.\n\nI have indexed your video's timeline (${formatTimestamp(duration)}), ${cues.length} dialogue cues, and ${detectedScenes.length} visual scenes. How can I assist you today?`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [fileName, duration, cues.length, detectedScenes.length]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, activeTab]);

  // Load real browser & hardware capabilities
  useEffect(() => {
    resourceManager.getBrowserCapabilities(aiMode).then(setCapabilities);
  }, [aiMode]);

  // Jump to specific timestamp
  const jumpTo = (seconds: number) => {
    const video = videoRef?.current;
    if (video) {
      video.currentTime = seconds;
      setCurrentTime(seconds);
      toast.info(`Jumped to ${formatTimestamp(seconds)}`);
    }
  };

  // Send message to Master AI
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await masterAiEngine.chat(query, aiContext, messages);
      setMessages((prev) => [...prev, response]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **MasterAI Error**: ${msg}\n\nFalling back to Master Local Neural AI.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
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
        {/* TAB 1: AI CO-PILOT CHAT STREAM                                   */}
        {/* ================================================================= */}
        {activeTab === 'chat' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            {/* Chat Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white shadow-md rounded-br-none'
                        : 'bg-white/5 border border-white/10 text-white/90 shadow-md rounded-bl-none'
                    }`}
                  >
                    {/* Message Body */}
                    <div className="whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>

                    {/* Matched Timestamps for 1-Click Jumping */}
                    {msg.matchedTimestamps && msg.matchedTimestamps.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-white/40 font-semibold mr-1">Jump to moment:</span>
                        {msg.matchedTimestamps.map((ts, i) => (
                          <button
                            key={i}
                            onClick={() => jumpTo(ts.time)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold transition-all hover:scale-105"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            {ts.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Suggested Direct Action Button */}
                    {msg.suggestedAction && (
                      <div className="mt-2.5 pt-2 border-t border-white/10">
                        {msg.suggestedAction.type === 'apply_chapters' && (
                          <Button
                            variant="gradient"
                            size="sm"
                            onClick={() => handleApplyChapters(msg.suggestedAction?.payload || [])}
                            className="rounded-lg h-7 px-3 text-[11px] font-bold gap-1.5 shadow-md shadow-cyan-500/20"
                          >
                            <Check className="w-3 h-3" />
                            {msg.suggestedAction.label}
                          </Button>
                        )}
                        {msg.suggestedAction.type === 'copy_summary' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopySummary}
                            className="rounded-lg h-7 px-3 text-[11px] font-bold gap-1.5 border-white/20 hover:bg-white/10"
                          >
                            <Copy className="w-3 h-3" />
                            {msg.suggestedAction.label}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-white/30 px-1 mt-0.5 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* Thinking Indicator */}
              {isThinking && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/70 max-w-xs animate-pulse">
                  <Brain className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>MasterAI is synthesizing video insights…</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Action Chips Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  disabled={isThinking}
                  onClick={() => handleSendMessage(qp.prompt)}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/80 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="relative flex items-center gap-2 pt-1 border-t border-white/10 shrink-0">
              <input
                type="text"
                placeholder={isVoiceActive ? 'Listening to speech…' : 'Ask MasterAI anything about this video (e.g. "What happened at 2:00?")…'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isThinking}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 text-xs text-white outline-none placeholder:text-white/40"
              />

              {/* Voice Input Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-2.5 rounded-xl border transition-all ${
                  isVoiceActive
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border-white/10'
                }`}
                title={isVoiceActive ? 'Stop Voice Recording' : 'Speak to MasterAI'}
              >
                {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <Button
                variant="gradient"
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isThinking}
                className="h-9 px-4 rounded-xl gap-1.5 font-semibold"
              >
                <Send className="w-3.5 h-3.5" />
                Ask
              </Button>
            </div>
          </div>
        )}

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
                    Master Local Neural AI
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                    Default
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  100% private and offline. Runs client-side NLP intent classification, scene synthesis, and dialogue search with zero latency. No API keys required.
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
                    Cloud Gemini Supercharge
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                    Enhanced
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Connects to Google Gemini API (gemini-2.5-flash) for deep generative conversational reasoning, complex creative Q&A, and multimodal analysis.
                </p>
              </div>
            </div>

            {/* Gemini API Key Section (if Cloud mode selected) */}
            {aiMode === 'cloud' && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Key className="w-4 h-4 text-purple-400" />
                  Google Gemini API Key
                </div>
                <p className="text-[11px] text-white/60">
                  Your API key is stored securely in your browser&apos;s local storage and used directly for Google Gemini API calls. It is never transmitted to any third-party server.
                </p>
                <input
                  type="password"
                  placeholder="AIzaSy…"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-black/50 border border-white/15 focus:border-purple-400 text-white outline-none font-mono"
                />
              </div>
            )}

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
