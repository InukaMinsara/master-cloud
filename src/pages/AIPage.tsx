import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Paperclip,
  Trash2,
  Plus,
  Copy,
  Check,
  Bot,
  User,
  FileText,
  X,
  Cpu,
  ArrowRight,
  Database,
  Globe,
  Activity,
  Search,
  MessageSquare,
  Square,
  RefreshCw,
  Image as ImageIcon,
  Film,
  Mic,
  Volume2,
  Download,
  Upload,
  Layers,
  Wand2,
} from 'lucide-react';
import { AIService, AIMessage, AIChatSession } from '@/services/aiService';
import { api } from '@/services/api';
import {
  puterAiService,
  VERIFIED_FREE_CHAT_MODELS,
  PUTER_STANDARD_MODELS,
  PUTER_IMAGE_MODELS,
  PUTER_VIDEO_MODELS,
  PUTER_VOICES,
  PuterImageResult,
  PuterVideoResult,
  PuterTtsResult,
} from '@/services/ai/puterAiService';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';
import {
  CloudAndRegistryPanel,
  LongTermMemoryPanel,
} from '@/components/video-player/panels/MasterAiV2Panels';

type PageTab = 'chat' | 'image' | 'video' | 'voice' | 'gateway' | 'memory';

export function AIPage() {
  const { user } = useAuthStore();
  const { files, fetchItems } = useFileStore();

  // Top-level Studio Tab
  const [activeStudioTab, setActiveStudioTab] = useState<PageTab>('chat');

  // Chat State
  const [sessions, setSessions] = useState<AIChatSession[]>(() => AIService.getSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || 'session-default');
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedFile, setAttachedFile] = useState<FileItem | null>(null);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>(VERIFIED_FREE_CHAT_MODELS[0].id);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // ─── IMAGE STUDIO STATE ───
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgNegativePrompt, setImgNegativePrompt] = useState('');
  const [imgModel, setImgModel] = useState('black-forest-labs/FLUX.1-schnell');
  const [imgAspectRatio, setImgAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:2'>('1:1');
  const [imgInputImage, setImgInputImage] = useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [imgResult, setImgResult] = useState<PuterImageResult | null>(null);
  const [imgHistory, setImgHistory] = useState<PuterImageResult[]>([]);

  // ─── VIDEO STUDIO STATE ───
  const [vidPrompt, setVidPrompt] = useState('');
  const [vidModel, setVidModel] = useState('togetherai:wan-ai/wan2.7-t2v');
  const [vidDuration, setVidDuration] = useState<number>(3);
  const [vidSize, setVidSize] = useState<'1280x720' | '720x1280' | '1024x576'>('1280x720');
  const [vidInputImage, setVidInputImage] = useState<string | null>(null);
  const [isGeneratingVid, setIsGeneratingVid] = useState(false);
  const [vidProgressStatus, setVidProgressStatus] = useState<string>('');
  const [vidResult, setVidResult] = useState<PuterVideoResult | null>(null);
  const [vidHistory, setVidHistory] = useState<PuterVideoResult[]>([]);

  // ─── VOICE & SPEECH STATE ───
  const [voiceTab, setVoiceTab] = useState<'tts' | 'stt'>('tts');
  const [ttsText, setTtsText] = useState('');
  const [ttsProvider, setTtsProvider] = useState<'aws-polly' | 'openai'>('aws-polly');
  const [ttsVoice, setTtsVoice] = useState('Joanna');
  const [isSynthesizingTts, setIsSynthesizingTts] = useState(false);
  const [ttsResult, setTtsResult] = useState<PuterTtsResult | null>(null);
  const [sttFile, setSttFile] = useState<File | null>(null);
  const [isTranscribingStt, setIsTranscribingStt] = useState(false);
  const [sttTranscript, setSttTranscript] = useState('');

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    AIService.saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (activeStudioTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages, isStreaming, activeStudioTab]);

  // Session Management
  const handleNewSession = () => {
    const newSession: AIChatSession = {
      id: 'session-' + Date.now(),
      title: 'New Conversation',
      persona: 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          content:
            '👋 Welcome to **Master AI Studio** powered directly by **Puter.js**!\n\nAll AI capabilities (Chat, Image Studio, Video Studio, Voice & Audio) run directly via Puter.js with verified 100% free models and zero developer cost ($0).\n\n- **100% Free Chat Models**: Google Gemma 4 31B, NVIDIA Nemotron 3.5, Cohere Code, Qwen 3.8\n- **Zero API Keys**: No personal API keys or setups needed\n- **Bilingual**: Ask questions in **English** or **සිංහල (Sinhala)** anytime!',
          timestamp: new Date().toISOString(),
          tokensUsed: 32,
        },
      ],
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      toast.warning('You must keep at least one chat session.');
      return;
    }
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleClearCurrentSession = () => {
    if (!activeSession) return;
    const clearedMessages: AIMessage[] = [
      {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: 'Conversation cleared. How can I assist you now?',
        timestamp: new Date().toISOString(),
        tokensUsed: 8,
      },
    ];
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, messages: clearedMessages, updatedAt: new Date().toISOString() }
          : s,
      ),
    );
    toast.info('Chat history cleared for this session.');
  };

  // Send message with streaming + cancel support
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isStreaming) return;

    const userMsg: AIMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
      attachedFile: attachedFile
        ? {
            id: attachedFile.id,
            name: attachedFile.name,
            sizeBytes: attachedFile.size_bytes,
          }
        : undefined,
    };

    // Purge any ghost/empty messages from prior failed turns
    const cleanedPriorMessages = activeSession.messages.filter(
      (m) => m.role === 'user' || (m.role === 'assistant' && typeof m.content === 'string' && m.content.trim().length > 0)
    );

    const updatedMessages = [...cleanedPriorMessages, userMsg];
    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          title: s.messages.length <= 1 ? textToSend.slice(0, 32) : s.title,
          messages: updatedMessages,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setInputText('');
    const sentFile = attachedFile;
    setAttachedFile(null);
    setIsStreaming(true);

    const assistantMsgId = 'msg-' + (Date.now() + 1);
    const initialAssistantMsg: AIMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      tokensUsed: 0,
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSession.id) {
          return { ...s, messages: [...s.messages, initialAssistantMsg] };
        }
        return s;
      }),
    );

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      let promptToSend = textToSend.trim();
      if (sentFile) {
        try {
          const fileExcerpt = await api.getFileContentText(sentFile.id);
          if (fileExcerpt) {
            promptToSend = `[Attached File: ${sentFile.name}]\n${fileExcerpt.slice(0, 6000)}\n\n[User Prompt]:\n${promptToSend}`;
          }
        } catch {
          // Continue with prompt alone if excerpt read fails
        }
      }

      // Stream directly through Puter.js with automatic verified free model fallback
      const historyForPuter = cleanedPriorMessages
        .filter((m) => m.id !== 'msg-welcome' && m.content && m.content.trim().length > 0)
        .map((m) => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content.trim(),
        }));

      let accumulated = '';
      const puterStream = puterAiService.streamChat(promptToSend, {
        model: selectedModelId,
        messages: historyForPuter,
        signal: abortCtrl.signal,
      });

      for await (const chunk of puterStream) {
        if (abortCtrl.signal.aborted) break;
        accumulated = chunk;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulated } : m,
              );
              return { ...s, messages: msgs };
            }
            return s;
          }),
        );
      }
    } catch (err: any) {
      if (!abortCtrl.signal.aborted) {
        toast.error(`Generation error: ${err?.message || 'AI service interrupted'}`);
        // Remove empty assistant message if it failed before generating any content
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              const msgs = s.messages.filter(
                (m) => m.id !== assistantMsgId || m.content.trim().length > 0,
              );
              return { ...s, messages: msgs };
            }
            return s;
          }),
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    toast.info('Generation halted by user.');
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Response copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── IMAGE GENERATION HANDLER ───
  const handleGenerateImage = async () => {
    if (!imgPrompt.trim() || isGeneratingImg) return;
    setIsGeneratingImg(true);
    const start = performance.now();
    try {
      const res = await puterAiService.generateImage(imgPrompt.trim(), {
        model: imgModel,
        aspect_ratio: imgAspectRatio,
        negative_prompt: imgNegativePrompt.trim() || undefined,
        input_image: imgInputImage || undefined,
      });
      setImgResult(res);
      setImgHistory((prev) => [res, ...prev.slice(0, 15)]);
      const elapsed = Math.round((performance.now() - start) / 1000);
      toast.success(`Image generated in ${elapsed}s via ${res.model}!`);
    } catch (err: any) {
      toast.error(`Image generation failed: ${err?.message || err}`);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  // ─── VIDEO GENERATION HANDLER ───
  const handleGenerateVideo = async () => {
    if (!vidPrompt.trim() || isGeneratingVid) return;
    setIsGeneratingVid(true);
    setVidProgressStatus('Initializing video generation...');
    try {
      const res = await puterAiService.generateVideo(vidPrompt.trim(), {
        model: vidModel,
        duration: vidDuration,
        size: vidSize,
        input_image: vidInputImage || undefined,
        onProgress: (status) => setVidProgressStatus(status),
      });
      setVidResult(res);
      setVidHistory((prev) => [res, ...prev.slice(0, 9)]);
      toast.success(`Video generated successfully via ${res.model}!`);
    } catch (err: any) {
      toast.error(`Video generation failed: ${err?.message || err}`);
    } finally {
      setIsGeneratingVid(false);
      setVidProgressStatus('');
    }
  };

  // ─── TTS HANDLER ───
  const handleSynthesizeTts = async () => {
    if (!ttsText.trim() || isSynthesizingTts) return;
    setIsSynthesizingTts(true);
    try {
      const res = await puterAiService.textToSpeech(ttsText.trim(), {
        provider: ttsProvider,
        voice: ttsVoice,
      });
      setTtsResult(res);
      toast.success('Speech synthesized successfully!');
      try {
        await res.audioElement.play();
      } catch {
        // autoplay restriction might occur
      }
    } catch (err: any) {
      toast.error(`TTS failed: ${err?.message || err}`);
    } finally {
      setIsSynthesizingTts(false);
    }
  };

  // ─── STT HANDLER ───
  const handleTranscribeStt = async () => {
    if (!sttFile || isTranscribingStt) return;
    setIsTranscribingStt(true);
    try {
      const res = await puterAiService.speechToText(sttFile);
      setSttTranscript(res.text);
      toast.success('Transcription completed!');
    } catch (err: any) {
      toast.error(`Transcription failed: ${err?.message || err}`);
    } finally {
      setIsTranscribingStt(false);
    }
  };

  const handleDownloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const promptSuggestions = [
    { label: 'සිංහල හැඳින්වීම (Sinhala)', text: 'Master AI Puter.js Studio එක ගැන කෙටියෙන් සිංහලෙන් පහදන්න.' },
    { label: 'Code Assistant', text: 'Write a modern TypeScript debounce utility function with unit tests.' },
    { label: 'Math & Logic', text: 'Solve this step by step: Calculate the monthly loan payment for $25,000 at 6.5% interest over 5 years.' },
    { label: 'Cloud Storage Summary', text: 'Summarize my Master Cloud zero-trust encryption architecture and 10 TB storage quota.' },
  ];

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
      s.messages.some((m) => m.content.toLowerCase().includes(sessionSearchQuery.toLowerCase())),
  );

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-background text-foreground select-none">
      {/* ─── MASTER AI CORE TOP NAVIGATION BAR ─── */}
      <header className="h-14 border-b border-border/70 bg-card/40 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                MASTER AI STUDIO
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Puter.js Unified
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              Unified Platform: AI Chat · Image Studio · Video Studio · Voice · Zero-Key Free Gateway
            </p>
          </div>
        </div>

        {/* Studio Sub-Tabs */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveStudioTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStudioTab === 'chat'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStudioTab === 'image'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Image Studio</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStudioTab === 'video'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            <span>Video Studio</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStudioTab === 'voice'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Voice &amp; Audio</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('gateway')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStudioTab === 'gateway'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Puter</span>
            <span>Gateway</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('memory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStudioTab === 'memory'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Memory</span>
          </button>
        </div>
      </header>

      {/* ─── TAB 1: CHAT STUDIO ─── */}
      {activeStudioTab === 'chat' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Conversations, Persona, Model */}
          <div className="w-64 sm:w-72 border-r border-border/60 bg-card/25 flex flex-col shrink-0">
            {/* Header / New Chat */}
            <div className="p-3 border-b border-border/50 flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                Conversations
              </span>
              <button
                onClick={handleNewSession}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
                title="Start a new conversation"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Chat</span>
              </button>
            </div>

            {/* Session Search */}
            <div className="p-2 border-b border-border/50">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={sessionSearchQuery}
                  onChange={(e) => setSessionSearchQuery(e.target.value)}
                  className="w-full bg-muted/50 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary border border-border/50"
                />
              </div>
            </div>

            {/* Persona & Model Selector Controls */}
            <div className="p-3 border-b border-border/50 space-y-2.5 bg-muted/20">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Assistant Persona
                </label>
                <select
                  value={activeSession.persona}
                  onChange={(e) => {
                    const updated = sessions.map((s) =>
                      s.id === activeSession.id ? { ...s, persona: e.target.value as any } : s,
                    );
                    setSessions(updated);
                  }}
                  className="w-full bg-background text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-border/60 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="general">General Copilot</option>
                  <option value="analyst">Document Analyst</option>
                  <option value="coder">Code Architect</option>
                  <option value="writer">Executive Writer</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Puter.js Model Selector
                  </label>
                  <span className="text-[9px] text-emerald-400 font-bold">100% Free Tier</span>
                </div>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full bg-background text-[11px] font-semibold rounded-lg px-2 py-1.5 border border-border/60 focus:outline-none focus:border-primary cursor-pointer truncate"
                >
                  <optgroup label="Verified 100% Free Models ($0)">
                    {VERIFIED_FREE_CHAT_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Puter.js Standard Cloud Models">
                    {PUTER_STANDARD_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredSessions.map((s) => {
                const isSelected = activeSessionId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    className={`group px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <span className="truncate flex-1 pr-2">{s.title}</span>
                    {sessions.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity p-0.5"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Status Badge */}
            <div className="p-3 border-t border-border/50 text-[10px] text-muted-foreground bg-card/40 flex items-center justify-between font-mono gap-2">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                Puter.js Gateway: Connected
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                100% Free Models
              </span>
            </div>
          </div>

          {/* Right Main Chat Thread & Input */}
          <div className="flex-1 flex flex-col overflow-hidden bg-secondary/5">
            {/* Thread Header */}
            <div className="h-12 border-b border-border/60 px-4 sm:px-6 flex items-center justify-between bg-card/30 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2 truncate">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <h2 className="font-bold text-xs text-foreground truncate">{activeSession.title}</h2>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {activeSession.persona} Persona · Zero Key Leaks · Verified Free Gateway
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearCurrentSession}
                  className="px-2 py-1 rounded-lg border border-border/60 hover:bg-accent text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Clear chat messages in this session"
                >
                  Clear Chat
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {activeSession.messages
                .filter((msg) => msg.role === 'user' || Boolean(msg.content && msg.content.trim().length > 0) || isStreaming)
                .map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>

                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed max-w-xl shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-card border border-border/80 text-foreground'
                    }`}
                  >
                    {msg.attachedFile && (
                      <div className="mb-2.5 p-2 rounded-xl bg-background/50 border border-border/60 flex items-center gap-2 text-xs">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-bold truncate">{msg.attachedFile.name}</span>
                      </div>
                    )}

                    <div className="whitespace-pre-line prose prose-sm dark:prose-invert">
                      {msg.content || (isStreaming ? 'Thinking...' : '')}
                    </div>

                    {msg.role === 'assistant' && msg.content && (
                      <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-mono text-cyan-400">Master AI Core v2.2 · Puter.js</span>
                        <button
                          onClick={() => copyMessage(msg.id, msg.content)}
                          className="hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Starter Prompt Suggestions */}
              {activeSession.messages.length <= 1 && (
                <div className="max-w-2xl mx-auto pt-6 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block text-center">
                    Quick Intelligence Prompts
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {promptSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(suggestion.text)}
                        className="p-3 rounded-xl bg-card border border-border/70 hover:border-primary text-left text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-sm flex items-center justify-between group"
                      >
                        <div className="flex flex-col gap-0.5 pr-2">
                          <span className="text-foreground font-bold">{suggestion.label}</span>
                          <span className="line-clamp-1 text-[11px] text-muted-foreground">
                            {suggestion.text}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-border/60 bg-card/40 backdrop-blur-md">
              <div className="max-w-3xl mx-auto space-y-2">
                {/* Attached File Pill */}
                {attachedFile && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold animate-in fade-in">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="truncate max-w-xs">{attachedFile.name}</span>
                    <button
                      onClick={() => setAttachedFile(null)}
                      className="hover:text-destructive ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-background border border-border/70 rounded-2xl p-2 shadow-md focus-within:border-primary transition-colors">
                  <button
                    type="button"
                    onClick={() => setIsFilePickerOpen(true)}
                    className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Attach file from Master Cloud Drive"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    placeholder="Ask Master AI (Puter.js 100% Free Models)... [Enter to send]"
                    className="flex-1 bg-transparent resize-none border-none outline-none text-xs sm:text-sm py-1.5 px-2 text-foreground placeholder:text-muted-foreground/50 max-h-32"
                  />

                  {isStreaming ? (
                    <button
                      onClick={handleStopGenerating}
                      className="p-2.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
                      title="Stop generation"
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputText.trim()}
                      className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-sm"
                      title="Send prompt"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2">
                  <span>Puter.js Direct Unified Cloud Gateway</span>
                  <span className="text-emerald-400 font-medium">100% Free Tier Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: IMAGE STUDIO ─── */}
      {activeStudioTab === 'image' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-secondary/5">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  Master AI Image Studio (Puter.js txt2img)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Generate and edit high-resolution images using FLUX.1 Schnell, Stable Diffusion 3, and Gemini Image.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono font-semibold">
                Real Generation · 0 Mocking
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Controls */}
              <div className="lg:col-span-1 space-y-4 bg-card/60 border border-border/80 p-4 rounded-2xl shadow-sm">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Prompt
                  </label>
                  <textarea
                    value={imgPrompt}
                    onChange={(e) => setImgPrompt(e.target.value)}
                    rows={4}
                    placeholder="Describe your scene in vivid detail (e.g. Cyberpunk city floating above crystalline clouds, 8k resolution, cinematic lighting)..."
                    className="w-full p-2.5 rounded-xl bg-background border border-border/70 text-xs text-foreground outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Negative Prompt (Optional)
                  </label>
                  <input
                    value={imgNegativePrompt}
                    onChange={(e) => setImgNegativePrompt(e.target.value)}
                    placeholder="blurry, distorted, ugly, low resolution..."
                    className="w-full p-2 rounded-xl bg-background border border-border/70 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Diffusion Model
                  </label>
                  <select
                    value={imgModel}
                    onChange={(e) => setImgModel(e.target.value)}
                    className="w-full p-2 rounded-xl bg-background border border-border/70 text-xs text-foreground font-semibold outline-none focus:border-primary cursor-pointer"
                  >
                    {PUTER_IMAGE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.isFreeCandidate ? '(Free Tier)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['1:1', '16:9', '9:16', '4:3', '3:2'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setImgAspectRatio(ratio)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          imgAspectRatio === ratio
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Reference Image (Image-to-Image)</span>
                    {imgInputImage && (
                      <button
                        type="button"
                        onClick={() => setImgInputImage(null)}
                        className="text-[10px] text-destructive hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => setImgInputImage(evt.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-primary/10 file:text-primary file:cursor-pointer"
                  />
                  {imgInputImage && (
                    <img
                      src={imgInputImage}
                      alt="Ref"
                      className="w-full h-20 object-cover rounded-lg border border-border/60 mt-1"
                    />
                  )}
                </div>

                <button
                  type="button"
                  disabled={!imgPrompt.trim() || isGeneratingImg}
                  onClick={handleGenerateImage}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <Wand2 className={`w-4 h-4 ${isGeneratingImg ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingImg ? 'Synthesizing Image...' : 'Generate Image'}</span>
                </button>
              </div>

              {/* Right Column: Result Preview & History */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-card/60 border border-border/80 rounded-2xl p-4 min-h-[380px] flex flex-col items-center justify-center text-center shadow-sm">
                  {imgResult ? (
                    <div className="w-full space-y-3">
                      <div className="relative group max-h-[500px] overflow-hidden rounded-xl border border-border/60 bg-black/50 flex items-center justify-center">
                        <img
                          src={imgResult.imageUrl}
                          alt={imgResult.prompt}
                          className="max-h-[500px] w-auto object-contain rounded-xl shadow-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="text-left truncate">
                          <p className="font-semibold text-foreground truncate">{imgResult.prompt}</p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Model: {imgResult.model} · Ratio: {imgResult.aspectRatio}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadFile(
                              imgResult.imageUrl,
                              `master-ai-${Date.now()}.png`,
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-xs shrink-0 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-16 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto stroke-1 opacity-40 text-purple-400" />
                      <p className="text-xs font-semibold">No image generated yet</p>
                      <p className="text-[11px] max-w-xs mx-auto opacity-70">
                        Type a creative prompt on the left and click "Generate Image" to create AI artwork via Puter.js.
                      </p>
                    </div>
                  )}
                </div>

                {/* Session History Gallery */}
                {imgHistory.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Recent Creations in this Session ({imgHistory.length})
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {imgHistory.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setImgResult(item)}
                          className="relative aspect-square rounded-xl overflow-hidden border border-border/70 cursor-pointer hover:border-purple-400 group transition-all"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.prompt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: VIDEO STUDIO ─── */}
      {activeStudioTab === 'video' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-secondary/5">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Film className="w-5 h-5 text-blue-400" />
                  Master AI Video Studio (Puter.js txt2vid)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Create generative AI video clips with Wan 2.7, Kling, Google Veo, and Seedance models.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-mono font-semibold">
                Text-to-Video &amp; Image-to-Video
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Video Settings */}
              <div className="lg:col-span-1 space-y-4 bg-card/60 border border-border/80 p-4 rounded-2xl shadow-sm">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Video Scene Prompt
                  </label>
                  <textarea
                    value={vidPrompt}
                    onChange={(e) => setVidPrompt(e.target.value)}
                    rows={4}
                    placeholder="Describe scene action and camera movement (e.g. Drone flyover over a crystal mountain at sunrise, cinematic hyperlapse)..."
                    className="w-full p-2.5 rounded-xl bg-background border border-border/70 text-xs text-foreground outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Video Model
                  </label>
                  <select
                    value={vidModel}
                    onChange={(e) => setVidModel(e.target.value)}
                    className="w-full p-2 rounded-xl bg-background border border-border/70 text-xs text-foreground font-semibold outline-none focus:border-primary cursor-pointer"
                  >
                    {PUTER_VIDEO_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Duration
                    </label>
                    <select
                      value={vidDuration}
                      onChange={(e) => setVidDuration(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-background border border-border/70 text-xs text-foreground outline-none cursor-pointer"
                    >
                      <option value={3}>3 Seconds</option>
                      <option value={5}>5 Seconds</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Resolution
                    </label>
                    <select
                      value={vidSize}
                      onChange={(e) => setVidSize(e.target.value as any)}
                      className="w-full p-2 rounded-xl bg-background border border-border/70 text-xs text-foreground outline-none cursor-pointer"
                    >
                      <option value="1280x720">1280x720 (16:9 HD)</option>
                      <option value="720x1280">720x1280 (9:16 Reel)</option>
                      <option value="1024x576">1024x576 (Wide)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>First-Frame Reference (Img2Vid)</span>
                    {vidInputImage && (
                      <button
                        type="button"
                        onClick={() => setVidInputImage(null)}
                        className="text-[10px] text-destructive hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => setVidInputImage(evt.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-primary/10 file:text-primary file:cursor-pointer"
                  />
                  {vidInputImage && (
                    <img
                      src={vidInputImage}
                      alt="Ref"
                      className="w-full h-20 object-cover rounded-lg border border-border/60 mt-1"
                    />
                  )}
                </div>

                {isGeneratingVid && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span className="font-semibold">Rendering Frames...</span>
                    </div>
                    <p className="text-[11px] opacity-80">{vidProgressStatus || 'Processing in Puter video pipeline...'}</p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!vidPrompt.trim() || isGeneratingVid}
                  onClick={handleGenerateVideo}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Film className={`w-4 h-4 ${isGeneratingVid ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingVid ? 'Synthesizing Video...' : 'Generate Video Clip'}</span>
                </button>
              </div>

              {/* Right Column: Player & History */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-card/60 border border-border/80 rounded-2xl p-4 min-h-[380px] flex flex-col items-center justify-center text-center shadow-sm">
                  {vidResult ? (
                    <div className="w-full space-y-3">
                      <div className="rounded-xl overflow-hidden bg-black/80 border border-border/60 flex items-center justify-center">
                        <video
                          src={vidResult.videoUrl}
                          controls
                          autoPlay
                          loop
                          className="max-h-[480px] w-full rounded-xl shadow-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="text-left truncate">
                          <p className="font-semibold text-foreground truncate">{vidResult.prompt}</p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Model: {vidResult.model} · {vidResult.durationSeconds}s clip
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadFile(
                              vidResult.videoUrl,
                              `master-ai-${Date.now()}.mp4`,
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-xs shrink-0 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Video
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-16 text-muted-foreground">
                      <Film className="w-12 h-12 mx-auto stroke-1 opacity-40 text-blue-400" />
                      <p className="text-xs font-semibold">No video rendered yet</p>
                      <p className="text-[11px] max-w-xs mx-auto opacity-70">
                        Select a model (Wan 2.7, Veo, Kling), enter a prompt, and click "Generate Video Clip".
                      </p>
                    </div>
                  )}
                </div>

                {/* Video History Gallery */}
                {vidHistory.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Rendered Clips in this Session ({vidHistory.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {vidHistory.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setVidResult(item)}
                          className="p-2 rounded-xl bg-card border border-border/70 cursor-pointer hover:border-blue-400 space-y-1 transition-all"
                        >
                          <video src={item.videoUrl} className="w-full h-24 object-cover rounded-lg bg-black" />
                          <p className="text-[10px] font-semibold text-foreground truncate">{item.prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: VOICE & SPEECH STUDIO ─── */}
      {activeStudioTab === 'voice' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-secondary/5">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                  Master AI Voice &amp; Speech Studio
                </h2>
                <p className="text-xs text-muted-foreground">
                  Text-to-Speech (AWS Polly / OpenAI voices) and Speech-to-Text Whisper transcription.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                <button
                  type="button"
                  onClick={() => setVoiceTab('tts')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    voiceTab === 'tts'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Text-to-Speech
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceTab('stt')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    voiceTab === 'stt'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Speech-to-Text (Whisper)
                </button>
              </div>
            </div>

            {/* TTS Section */}
            {voiceTab === 'tts' && (
              <div className="bg-card/60 border border-border/80 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Speech Text (English, Sinhala, or Multilingual)
                  </label>
                  <textarea
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    rows={4}
                    placeholder="Enter sentences to synthesize into natural, human-sounding speech..."
                    className="w-full p-3 rounded-xl bg-background border border-border/70 text-xs sm:text-sm text-foreground outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Voice Provider
                    </label>
                    <select
                      value={ttsProvider}
                      onChange={(e) => {
                        const prov = e.target.value as 'aws-polly' | 'openai';
                        setTtsProvider(prov);
                        setTtsVoice(prov === 'aws-polly' ? 'Joanna' : 'alloy');
                      }}
                      className="w-full p-2 rounded-xl bg-background border border-border/70 text-xs font-semibold text-foreground outline-none cursor-pointer"
                    >
                      <option value="aws-polly">AWS Polly Neural Voices</option>
                      <option value="openai">OpenAI TTS Voices</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Voice Identity
                    </label>
                    <select
                      value={ttsVoice}
                      onChange={(e) => setTtsVoice(e.target.value)}
                      className="w-full p-2 rounded-xl bg-background border border-border/70 text-xs font-semibold text-foreground outline-none cursor-pointer"
                    >
                      {PUTER_VOICES.filter((v) => v.provider === ttsProvider).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!ttsText.trim() || isSynthesizingTts}
                  onClick={handleSynthesizeTts}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Volume2 className={`w-4 h-4 ${isSynthesizingTts ? 'animate-spin' : ''}`} />
                  <span>{isSynthesizingTts ? 'Synthesizing Audio Stream...' : 'Synthesize Speech'}</span>
                </button>

                {ttsResult && (
                  <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-300">
                        Synthesized Audio ({ttsResult.voice} · {ttsResult.provider})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadFile(ttsResult.audioUrl, `speech-${Date.now()}.mp3`)
                        }
                        className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download .MP3
                      </button>
                    </div>
                    <audio controls src={ttsResult.audioUrl} className="w-full h-10" />
                  </div>
                )}
              </div>
            )}

            {/* STT Section */}
            {voiceTab === 'stt' && (
              <div className="bg-card/60 border border-border/80 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Upload Audio Recording (.mp3, .wav, .m4a, .ogg)
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setSttFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-primary file:text-primary-foreground file:cursor-pointer"
                  />
                  {sttFile && (
                    <p className="text-[11px] text-foreground font-semibold mt-1">
                      Selected: {sttFile.name} ({(sttFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!sttFile || isTranscribingStt}
                  onClick={handleTranscribeStt}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Mic className={`w-4 h-4 ${isTranscribingStt ? 'animate-spin' : ''}`} />
                  <span>{isTranscribingStt ? 'Transcribing with Whisper...' : 'Transcribe Audio'}</span>
                </button>

                {sttTranscript && (
                  <div className="p-4 rounded-xl bg-black/40 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Whisper Transcript</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sttTranscript);
                          toast.success('Transcript copied to clipboard');
                        }}
                        className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Text
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-background text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                      {sttTranscript}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: PUTER GATEWAY & MODEL CATALOG ─── */}
      {activeStudioTab === 'gateway' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-secondary/5">
          <div className="max-w-5xl mx-auto">
            <CloudAndRegistryPanel />
          </div>
        </div>
      )}

      {/* ─── TAB 6: LONG-TERM MEMORY BANK ─── */}
      {activeStudioTab === 'memory' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-secondary/5">
          <div className="max-w-6xl mx-auto">
            <LongTermMemoryPanel />
          </div>
        </div>
      )}

      {/* Cloud File Context Picker Modal */}
      {isFilePickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>Select File from Master Cloud</span>
              </h3>
              <button
                onClick={() => setIsFilePickerOpen(false)}
                className="hover:text-foreground text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5">
              {files
                .filter((f) => !f.deleted_at)
                .map((file) => (
                  <div
                    key={file.id}
                    onClick={() => {
                      setAttachedFile(file);
                      setIsFilePickerOpen(false);
                      toast.success(`Attached "${file.name}" to context`);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-accent cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium truncate">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {file.extension.toUpperCase()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
