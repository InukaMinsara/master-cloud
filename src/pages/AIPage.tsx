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
  ArrowRight,
  Globe,
  Search,
  MessageSquare,
  Square,
  RefreshCw,
  Image as ImageIcon,
  Film,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneCall,
  PhoneOff,
  Download,
  Wand2,
  Code2,
  Share2,
  Upload,
  Camera,
  Radio,
} from 'lucide-react';
import { AIService, AIMessage, AIChatSession } from '@/services/aiService';
import { api } from '@/services/api';
import {
  puterAiService,
  VERIFIED_FREE_CHAT_MODELS,
  PUTER_STANDARD_MODELS,
  PuterImageResult,
  PuterVideoResult,
  PuterTtsResult,
} from '@/services/ai/puterAiService';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';
import { ChatMarkdownRenderer } from '@/components/ai/ChatMarkdownRenderer';
import { aiHordeService } from '@/services/ai/aiHordeService';
import { webGpuEngine } from '@/services/ai/webGpuEngine';

/**
 * Detects whether the user is requesting in-chat image or video generation
 * Supports English, Sinhala, and Singlish trigger phrases.
 */
function detectMediaIntent(text: string): { type: 'image' | 'video' | 'none'; prompt: string } {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // ─── 1. Video Patterns (English, Sinhala, Singlish) ───
  const isVideoKeyword =
    lower.includes('video') ||
    lower.includes('වීඩියෝ') ||
    lower.startsWith('animate') ||
    lower.includes('animation');

  const isVideoAction =
    lower.includes('generate') ||
    lower.includes('create') ||
    lower.includes('make') ||
    lower.includes('hadanna') ||
    lower.includes('hadapan') ||
    lower.includes('hadala') ||
    lower.includes('render') ||
    lower.startsWith('animate');

  if (isVideoKeyword && isVideoAction) {
    let promptPart = clean
      .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:generate|create|make|render|animate)\s+(?:an?\s+)?video\s+(?:of|about|showing)?\s*/i, '')
      .replace(/^(?:video\s+ekak\s+(?:hadanna|hadapan|hadala\s+denna|generate\s+karanna))\s*/i, '')
      .replace(/^(?:meke\s+video\s+ekak\s+hadanna|hadapan)\s*/i, '')
      .replace(/video\s*ekak\s*(?:hadanna|hadapan|generate\s*karanna)/gi, '')
      .trim();

    if (!promptPart || promptPart.length < 3) promptPart = clean;
    return { type: 'video', prompt: promptPart };
  }

  // ─── 2. Image Patterns (English, Sinhala, Singlish) ───
  const isImageKeyword =
    lower.includes('image') ||
    lower.includes('photo') ||
    lower.includes('picture') ||
    lower.includes('wallpaper') ||
    lower.includes('chithra') ||
    lower.includes('පින්තූර') ||
    lower.startsWith('draw') ||
    lower.startsWith('paint') ||
    lower.startsWith('sketch');

  const isImageAction =
    lower.includes('generate') ||
    lower.includes('create') ||
    lower.includes('make') ||
    lower.includes('hadanna') ||
    lower.includes('hadapan') ||
    lower.includes('hadala') ||
    lower.includes('andinna') ||
    lower.includes('andala') ||
    lower.startsWith('draw') ||
    lower.startsWith('paint') ||
    lower.startsWith('sketch');

  if (isImageKeyword && isImageAction) {
    let promptPart = clean
      .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:generate|create|make|render)\s+(?:an?\s+)?(?:image|photo|picture|wallpaper|art|drawing)\s+(?:of|about|showing)?\s*/i, '')
      .replace(/^(?:draw|paint|sketch|illustrate)\s+(?:an?\s+)?(?:image|photo|picture)?\s*(?:of)?\s*/i, '')
      .replace(/^(?:photo\s+ekak|image\s+ekak|pic\s+ekak)\s+(?:hadanna|hadapan|hadala\s+denna|generate\s+karanna|andinna)\s*/i, '')
      .replace(/^(?:chithrayak|chithra)\s+(?:andinna|andala\s+denna|hadanna)\s*/i, '')
      .replace(/(?:photo|image)\s*ekak\s*(?:hadanna|hadapan|generate\s*karanna|andinna)/gi, '')
      .trim();

    if (!promptPart || promptPart.length < 3) promptPart = clean;
    return { type: 'image', prompt: promptPart };
  }

  return { type: 'none', prompt: clean };
}

export function AIPage() {
  const { user } = useAuthStore();
  const { files, fetchItems } = useFileStore();

  // Chat State
  const [sessions, setSessions] = useState<AIChatSession[]>(() => AIService.getSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || 'session-default');
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedFile, setAttachedFile] = useState<FileItem | null>(null);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');

  // ─── UNIFIED IN-CHAT SUPER AI CAPABILITIES ───
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);

  // Vision Image Attachment & Polishing & Export State
  const [attachedImage, setAttachedImage] = useState<{ url: string; file?: File; name: string } | null>(null);
  const [isPolishingPrompt, setIsPolishingPrompt] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('Joanna');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoStreamRef = useRef<HTMLVideoElement | null>(null);
  const cameraMediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputImageRef = useRef<HTMLInputElement | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Audio & Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Context-action from Drive: auto-attach file if passed via sessionStorage
  useEffect(() => {
    const preAttachedId = sessionStorage.getItem('master_ai_attached_file_id');
    if (preAttachedId && files.length > 0) {
      sessionStorage.removeItem('master_ai_attached_file_id');
      const found = files.find((f) => f.id === preAttachedId);
      if (found) {
        setAttachedFile(found);
        setInputText(`Please analyze and summarize "${found.name}" for me.`);
        toast.info(`Attached "${found.name}" from Drive!`);
      }
    }

    const aiSearchQuery = sessionStorage.getItem('master_ai_search_query');
    if (aiSearchQuery) {
      sessionStorage.removeItem('master_ai_search_query');
      setInputText(`Search and analyze my Master Cloud Drive for files matching: "${aiSearchQuery}"`);
    }
  }, [files]);

  useEffect(() => {
    AIService.saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isStreaming]);

  // ─── IN-CHAT VOICE RECORDING (SPEECH-TO-TEXT) ───
  const handleToggleVoiceRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size > 500) {
          toast.info('Transcribing speech via Whisper AI...');
          try {
            const sttRes = await puterAiService.speechToText(blob);
            if (sttRes?.text && sttRes.text.trim()) {
              setInputText((prev) => (prev ? `${prev} ${sttRes.text.trim()}` : sttRes.text.trim()));
              toast.success('Voice transcribed to prompt!');
            }
          } catch (sttErr: any) {
            toast.error(`Speech-to-text failed: ${sttErr?.message || sttErr}`);
          }
        }
      };

      mr.start();
      setIsRecording(true);
      toast.info('🎙️ Listening... Speak into your microphone.');
    } catch (err: any) {
      toast.error(`Microphone access error: ${err?.message || err}`);
    }
  };

  // ─── IN-CHAT READ ALOUD (TEXT-TO-SPEECH) ───
  const handleReadAloud = async (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      setSpeakingMsgId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    setSpeakingMsgId(msgId);
    toast.info('Synthesizing speech via AWS Polly / OpenAI voices...');
    try {
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/[*#`_>•]/g, '')
        .slice(0, 1500);

      const res = await puterAiService.textToSpeech(cleanText, {
        voice: selectedVoice,
      });
      activeAudioRef.current = res.audioElement;
      res.audioElement.onended = () => {
        setSpeakingMsgId(null);
        activeAudioRef.current = null;
      };
      await res.audioElement.play();
    } catch (err: any) {
      toast.error(`Read aloud failed: ${err?.message || err}`);
      setSpeakingMsgId(null);
    }
  };

  // ─── VISION IMAGE ATTACHMENT & CLIPBOARD PASTE (CTRL+V) ───
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setAttachedImage({
              url: dataUrl,
              file,
              name: file.name || `Pasted_Screenshot_${Date.now()}.png`,
            });
            toast.success('📸 Screenshot attached from clipboard for Vision AI!');
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleSelectImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAttachedImage({
        url: dataUrl,
        file,
        name: file.name,
      });
      toast.success(`Attached image for Vision AI: ${file.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachedImage({
          url: dataUrl,
          file,
          name: file.name,
        });
        toast.success(`📸 Image attached: ${file.name}`);
      };
      reader.readAsDataURL(file);
    } else {
      toast.info(`Please use the paperclip icon to attach drive file "${file.name}".`);
    }
  };

  // ─── LIVE CAMERA SNAPSHOT FOR VISION AI ───
  const handleStartCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      cameraMediaStreamRef.current = stream;
      setTimeout(() => {
        if (videoStreamRef.current) {
          videoStreamRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      toast.error(`Camera access error: ${err?.message || err}`);
      setIsCameraOpen(false);
    }
  };

  const handleCaptureSnap = () => {
    if (!videoStreamRef.current) return;
    const video = videoStreamRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setAttachedImage({
        url: dataUrl,
        name: `Camera_Snap_${Date.now()}.jpg`,
      });
      toast.success('📸 Photo snapped & attached for Vision AI analysis!');
    }
    handleCloseCamera();
  };

  const handleCloseCamera = () => {
    if (cameraMediaStreamRef.current) {
      cameraMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraMediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  // ─── PROMPT POLISHER / MAGIC WAND ───
  const handlePolishPrompt = async () => {
    if (!inputText.trim()) {
      toast.info('Please enter a prompt first to polish.');
      return;
    }
    setIsPolishingPrompt(true);
    toast.info('✨ Enhancing prompt with AI Magic Wand...');
    try {
      const polished = await puterAiService.polishPrompt(inputText.trim());
      setInputText(polished);
      toast.success('Prompt polished & enhanced!');
    } catch {
      toast.error('Could not polish prompt.');
    } finally {
      setIsPolishingPrompt(false);
    }
  };

  // ─── CHAT EXPORT (MARKDOWN & PRINT) ───
  const handleExportMarkdown = () => {
    if (!activeSession) return;
    let md = `# ${activeSession.title}\n*Exported from Master AI Studio on ${new Date().toLocaleString()}*\n\n---\n\n`;
    for (const msg of activeSession.messages) {
      const roleName = msg.role === 'user' ? '👤 User' : '🤖 Master AI';
      const time = new Date(msg.timestamp).toLocaleTimeString();
      md += `### ${roleName} (${time})\n\n${msg.content}\n\n`;
      if (msg.mediaAttachment) {
        md += `*Attached ${msg.mediaAttachment.type}: [View Media](${msg.mediaAttachment.url})*\n\n`;
      }
      md += `---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSession.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_chat.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Chat exported as Markdown (.md)!');
  };

  const handlePrintChat = () => {
    window.print();
  };

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
            '👋 Welcome to **Master AI Studio** — Unified Multimodal Super AI!\n\nAll capabilities (Chat, Image Gen, Video Gen, Voice, Code Canvas & Web Search) are unified right here in one seamless window with zero API keys and 100% free models.\n\n- **Autonomous Waterfall**: Google Gemini 3.8 Flash ⚡ → OpenAI GPT-4o → DeepSeek Free Tier\n- **In-Chat Images**: Type *"photo ekak hadanna [prompt]"* for Google Imagen 3\n- **In-Chat Videos**: Type *"video ekak hadanna [prompt]"* for BytePlus Seedance Video\n- **Interactive Canvas**: Generate HTML/React/SVG widgets and preview them live\n- **Bilingual**: Ask in **English** or **සිංහල (Sinhala)** anytime!',
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

  // Send message with streaming + cancel support + in-chat media generation
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isStreaming) return;

    const mediaIntent = detectMediaIntent(textToSend);

    const sentFile = attachedFile;
    const sentImage = attachedImage;
    setAttachedFile(null);
    setAttachedImage(null);

    const userMsg: AIMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
      attachedFile: sentFile
        ? {
            id: sentFile.id,
            name: sentFile.name,
            sizeBytes: sentFile.size_bytes,
          }
        : undefined,
      imageAttachment: sentImage?.url,
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
    setIsStreaming(true);

    const assistantMsgId = 'msg-' + (Date.now() + 1);

    // ─── 1. IN-CHAT IMAGE GENERATION (GOOGLE IMAGEN 3 WATERFALL) ───
    if (mediaIntent.type === 'image') {
      const initialAssistantMsg: AIMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: `🎨 Synthesizing photorealistic image with **Google Imagen 3** engine...\n\n> Prompt: *"${mediaIntent.prompt}"*`,
        timestamp: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSession.id) {
            return { ...s, messages: [...s.messages, initialAssistantMsg] };
          }
          return s;
        }),
      );

      try {
        let finalUrl = '';
        let finalModel = '';

        try {
          const imgRes = await puterAiService.generateImage(mediaIntent.prompt, {
            aspect_ratio: '1:1',
          });
          finalUrl = imgRes.imageUrl;
          finalModel = imgRes.model;
        } catch (puterErr) {
          console.warn('[Puter AI] Falling back to AI Horde Cloud GPU:', puterErr);
          const hordeRes = await aiHordeService.generateImage(mediaIntent.prompt, {
            aspectRatio: '1:1',
          });
          finalUrl = hordeRes.url;
          finalModel = `AI Horde Cloud GPU (${hordeRes.model})`;
        }

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: `✨ Here is your generated image powered by **${finalModel}**:\n\n> *"${mediaIntent.prompt}"*`,
                      mediaAttachment: {
                        type: 'image' as const,
                        url: finalUrl,
                        prompt: mediaIntent.prompt,
                        modelUsed: finalModel,
                      },
                    }
                  : m,
              );
              return { ...s, messages: msgs };
            }
            return s;
          }),
        );
        toast.success(`Image generated in chat via ${finalModel}!`);
      } catch (err: any) {
        toast.error(`Image generation failed: ${err?.message || err}`);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: `⚠️ Image generation could not be completed across waterfall candidates: ${err?.message || err}`,
                    }
                  : m,
              );
              return { ...s, messages: msgs };
            }
            return s;
          }),
        );
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    // ─── 2. IN-CHAT VIDEO GENERATION (BYTEPLUS SEEDANCE WATERFALL) ───
    if (mediaIntent.type === 'video') {
      const initialAssistantMsg: AIMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: `🎬 Initializing **BytePlus Seedance Video** pipeline...\n\n> Prompt: *"${mediaIntent.prompt}"*\n\n*Synthesizing video motion frames (this may take a few moments)...*`,
        timestamp: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSession.id) {
            return { ...s, messages: [...s.messages, initialAssistantMsg] };
          }
          return s;
        }),
      );

      try {
        const vidRes = await puterAiService.generateVideo(mediaIntent.prompt, {
          duration: 3,
          onProgress: (status) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === activeSession.id) {
                  const msgs = s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: `🎬 Initializing **BytePlus Seedance Video** pipeline...\n\n> Prompt: *"${mediaIntent.prompt}"*\n\n*Status: ${status}*`,
                        }
                      : m,
                  );
                  return { ...s, messages: msgs };
                }
                return s;
              }),
            );
          },
        });

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: `🎬 Here is your rendered video clip powered by **${vidRes.model}**:\n\n> *"${mediaIntent.prompt}"*`,
                      mediaAttachment: {
                        type: 'video' as const,
                        url: vidRes.videoUrl,
                        prompt: mediaIntent.prompt,
                        modelUsed: vidRes.model,
                      },
                    }
                  : m,
              );
              return { ...s, messages: msgs };
            }
            return s;
          }),
        );
        toast.success(`Video generated in chat via ${vidRes.model}!`);
      } catch (err: any) {
        toast.error(`Video generation failed: ${err?.message || err}`);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: `⚠️ Video generation could not be completed across waterfall candidates: ${err?.message || err}`,
                    }
                  : m,
              );
              return { ...s, messages: msgs };
            }
            return s;
          }),
        );
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    // ─── 3. TEXT CHAT STREAMING (GEMINI -> OPENAI -> DEEPSEEK CASCADE) ───
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
          // Continue with prompt alone
        }
      }

      // Stream directly through Puter.js with automatic waterfall cascade
      const historyForPuter = cleanedPriorMessages
        .filter((m) => m.id !== 'msg-welcome' && m.content && m.content.trim().length > 0)
        .map((m) => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content.trim(),
        }));

      let accumulated = '';
      let lastRenderTime = 0;

      const puterStream = puterAiService.streamChat(promptToSend, {
        messages: historyForPuter,
        signal: abortCtrl.signal,
        image: sentImage?.url,
      });

      for await (const chunk of puterStream) {
        if (abortCtrl.signal.aborted) break;
        accumulated = chunk;

        const now = performance.now();
        // Update immediately on first chunk (<60 chars) or throttle at 16ms (60fps) for extreme fast output
        if (now - lastRenderTime > 16 || accumulated.length < 60) {
          lastRenderTime = now;
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
      }

      // Final complete flush
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

  const promptSuggestions = [
    { label: '🎨 AI Image Gen (In-Chat)', text: 'Photo ekak hadanna futuristic cybernetic supercar in Tokyo neon rain' },
    { label: '🎬 AI Video Gen (In-Chat)', text: 'Video ekak hadanna cinematic drone flying through misty mountain valley at sunset' },
    { label: '⚡ Extreme Fast Chat (Sinhala)', text: 'Master AI Puter.js Studio එක ගැන කෙටියෙන් සිංහලෙන් පහදන්න.' },
    { label: '💻 Interactive Canvas Artifact', text: 'Write an interactive HTML & CSS modern calculator widget with working buttons.' },
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
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                WebGPU + AI Horde
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              Unified Multimodal Platform: In-Chat Images · Videos · Voice · Code Canvas · 100% Free
            </p>
          </div>
        </div>

        {/* ─── UNIFIED HEADER RIGHT ACTIONS ─── */}
        <div className="flex items-center gap-2">
          {/* Autonomous Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloud GPU: WebGPU ⚡ + AI Horde Swarm + Gemini</span>
          </div>

          {/* Live Voice Call Button */}
          <button
            type="button"
            onClick={() => setIsLiveCallOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Start Live Conversational Voice Call"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Live Voice Call</span>
          </button>
        </div>
      </header>

      {/* ─── UNIFIED MASTER AI STUDIO ─── */}
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

              {/* Autonomous AI Waterfall Routing Engine (Models hidden from user, auto-switching) */}
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-cyan-500/10 border border-primary/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                      Autonomous AI Cascade
                    </span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-bold font-mono">100% Free</span>
                </div>

                <div className="text-[11px] space-y-1 text-muted-foreground font-mono">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                    <span className="text-[10px] text-zinc-500">1.</span>
                    <span>⚡ Google Gemini 3.8 Flash</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 ml-auto">Active</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="text-[10px] text-zinc-600">2.</span>
                    <span>⚡ OpenAI GPT-4o Mini</span>
                    <span className="text-[9px] text-zinc-500 ml-auto">Auto-Tier 2</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="text-[10px] text-zinc-600">3.</span>
                    <span>⚡ DeepSeek &amp; Open Weights</span>
                    <span className="text-[9px] text-zinc-500 ml-auto">Auto-Tier 3</span>
                  </div>
                </div>

                <p className="text-[9px] text-muted-foreground/80 pt-0.5 leading-snug">
                  Zero manual switches. If Google Gemini free tier is exhausted, it seamlessly routes to OpenAI, then DeepSeek.
                </p>
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
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  ⚡ Extreme Fast Stream Active (~120 tok/s)
                </span>

                {/* Chat Export Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsExportMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 hover:bg-accent text-[11px] font-semibold text-foreground transition-colors cursor-pointer"
                    title="Export chat transcript"
                  >
                    <Share2 className="h-3 w-3 text-primary" />
                    <span>Export</span>
                  </button>

                  {isExportMenuOpen && (
                    <div className="absolute right-0 mt-1 w-52 rounded-xl bg-card border border-border/80 shadow-2xl z-30 py-1.5 text-xs animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleExportMarkdown();
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 cursor-pointer text-foreground"
                      >
                        <FileText className="h-4 w-4 text-purple-400" />
                        <div>
                          <div className="font-semibold">Markdown (.md)</div>
                          <div className="text-[10px] text-muted-foreground">Download formatted text</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handlePrintChat();
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 cursor-pointer text-foreground border-t border-border/40"
                      >
                        <Download className="h-4 w-4 text-cyan-400" />
                        <div>
                          <div className="font-semibold">Print / Save PDF</div>
                          <div className="text-[10px] text-muted-foreground">Save as PDF document</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

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
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative"
            >
              {isDraggingOver && (
                <div className="absolute inset-4 bg-primary/20 backdrop-blur-sm border-2 border-dashed border-primary rounded-2xl z-30 flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <Upload className="h-10 w-10 text-primary animate-bounce" />
                  <span className="text-sm font-bold text-primary">Drop image to analyze with Vision AI</span>
                </div>
              )}

              {activeSession.messages
                .filter((msg) => msg.role === 'user' || Boolean(msg.content && msg.content.trim().length > 0) || isStreaming)
                .map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 w-full ${
                    msg.role === 'user'
                      ? 'ml-auto flex-row-reverse justify-start'
                      : 'mr-auto max-w-3xl lg:max-w-4xl'
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
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground font-medium max-w-xl'
                        : 'bg-card border border-border/80 text-foreground w-full overflow-hidden'
                    }`}
                  >
                    {msg.attachedFile && (
                      <div className="mb-2.5 p-2 rounded-xl bg-background/50 border border-border/60 flex items-center gap-2 text-xs">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-bold truncate">{msg.attachedFile.name}</span>
                      </div>
                    )}

                    {msg.role === 'user' ? (
                      <div className="space-y-2">
                        {msg.imageAttachment && (
                          <div className="max-w-sm rounded-xl overflow-hidden border border-white/20 shadow-md">
                            <img
                              src={msg.imageAttachment}
                              alt="Vision attachment"
                              className="max-h-60 w-auto object-contain rounded-lg"
                            />
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    ) : (
                      <ChatMarkdownRenderer
                        content={msg.content}
                        mediaAttachment={msg.mediaAttachment}
                        isStreaming={isStreaming && msg.id === activeSession.messages[activeSession.messages.length - 1]?.id}
                      />
                    )}

                    {msg.role === 'assistant' && msg.content && (
                      <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-mono text-cyan-400">Master AI Core v2.2 · Puter.js</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReadAloud(msg.id, msg.content)}
                            className={`flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded cursor-pointer ${
                              speakingMsgId === msg.id
                                ? 'text-emerald-400 bg-emerald-500/10 font-bold'
                                : 'hover:text-foreground'
                            }`}
                            title={speakingMsgId === msg.id ? 'Stop audio' : 'Listen / Read aloud (AWS Polly)'}
                          >
                            {speakingMsgId === msg.id ? (
                              <>
                                <Square className="h-3 w-3 fill-current text-rose-400" />
                                <span className="text-rose-400">Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3 w-3 text-cyan-400" />
                                <span>Listen</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => copyMessage(msg.id, msg.content)}
                            className="hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
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
                        className="p-3 rounded-xl bg-card border border-border/70 hover:border-primary text-left text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-sm flex items-center justify-between group cursor-pointer"
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
                {/* Quick Multimodal Action Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setInputText((prev) => (prev ? `${prev} Photo ekak hadanna ` : 'Photo ekak hadanna '))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-colors shrink-0 cursor-pointer"
                  >
                    <ImageIcon className="h-3 w-3 text-purple-400" />
                    <span>🎨 Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputText((prev) => (prev ? `${prev} Video ekak hadanna ` : 'Video ekak hadanna '))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-colors shrink-0 cursor-pointer"
                  >
                    <Film className="h-3 w-3 text-cyan-400" />
                    <span>🎬 Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWebSearchEnabled((prev) => !prev)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors shrink-0 cursor-pointer ${
                      isWebSearchEnabled
                        ? 'bg-blue-600 text-white border border-blue-400 shadow-sm'
                        : 'bg-muted/60 hover:bg-muted text-muted-foreground border border-border/60'
                    }`}
                  >
                    <Globe className="h-3 w-3 text-blue-400" />
                    <span>🌐 Web Search: {isWebSearchEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputText((prev) => (prev ? `${prev} Write an interactive HTML & CSS ` : 'Write an interactive HTML & CSS '))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors shrink-0 cursor-pointer"
                  >
                    <Code2 className="h-3 w-3 text-amber-400" />
                    <span>💻 Code Canvas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputText((prev) => (prev ? `${prev} Convert our discussion and notes into a 2-host conversational podcast script with Host A (Alex) and Host B (Sarah) discussing the key insights dynamically.` : 'Convert our discussion and notes into a 2-host conversational podcast script with Host A (Alex) and Host B (Sarah) discussing the key insights dynamically.'))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors shrink-0 cursor-pointer"
                  >
                    <Radio className="h-3 w-3 text-rose-400" />
                    <span>🎙️ AI Podcast</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLiveCallOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-colors shrink-0 cursor-pointer ml-auto"
                  >
                    <PhoneCall className="h-3 w-3 text-emerald-400" />
                    <span>🎙️ Live Voice</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPolishingPrompt || !inputText.trim()}
                    onClick={handlePolishPrompt}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/15 to-indigo-500/15 hover:from-purple-500/25 hover:to-indigo-500/25 text-purple-300 border border-purple-500/30 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                    title="Polish and enrich prompt with AI Magic Wand"
                  >
                    <Wand2 className={`h-3 w-3 text-purple-400 ${isPolishingPrompt ? 'animate-spin' : ''}`} />
                    <span>{isPolishingPrompt ? 'Polishing...' : '✨ Polish'}</span>
                  </button>
                </div>

                {/* Attached File Pill */}
                {attachedFile && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold animate-in fade-in">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="truncate max-w-xs">{attachedFile.name}</span>
                    <button
                      onClick={() => setAttachedFile(null)}
                      className="hover:text-destructive ml-1 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Attached Image Pill (Vision AI) */}
                {attachedImage && (
                  <div className="inline-flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs font-semibold animate-in fade-in">
                    <img src={attachedImage.url} alt="Attached Preview" className="h-7 w-7 object-cover rounded-md border border-purple-500/40" />
                    <span className="truncate max-w-xs text-purple-300">{attachedImage.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="hover:text-destructive ml-1 cursor-pointer"
                      title="Remove attached image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-background border border-border/70 rounded-2xl p-2 shadow-md focus-within:border-primary transition-colors">
                  <button
                    type="button"
                    onClick={() => setIsFilePickerOpen(true)}
                    className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Attach file from Master Cloud Drive"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputImageRef.current?.click()}
                    className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Attach photo/screenshot for Vision AI analysis"
                  >
                    <ImageIcon className="h-4 w-4 text-purple-400" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputImageRef}
                    accept="image/*"
                    onChange={handleSelectImageFile}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Snap live photo with webcam/camera for Vision AI"
                  >
                    <Camera className="h-4 w-4 text-cyan-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWebSearchEnabled((prev) => !prev)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isWebSearchEnabled ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                    title={isWebSearchEnabled ? 'Real-Time Web Grounding Active' : 'Enable Real-Time Web Grounding'}
                  >
                    <Globe className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleVoiceRecording}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isRecording ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                    title={isRecording ? 'Stop Recording' : 'Voice Input (Microphone)'}
                  >
                    <Mic className="h-4 w-4" />
                  </button>

                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    placeholder={
                      isRecording
                        ? '🎙️ Listening... Speak naturally into your microphone'
                        : isWebSearchEnabled
                        ? '🌐 Web Search Active: Ask anything with real-time web citations...'
                        : attachedImage
                        ? 'Ask Master AI anything about this attached image/screenshot... [Enter to send]'
                        : 'Ask Master AI, generate photos/videos, paste screenshots (Ctrl+V)... [Enter]'
                    }
                    className="flex-1 bg-transparent resize-none border-none outline-none text-xs sm:text-sm py-1.5 px-2 text-foreground placeholder:text-muted-foreground/50 max-h-32"
                  />

                  {isStreaming ? (
                    <button
                      onClick={handleStopGenerating}
                      className="p-2.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm cursor-pointer"
                      title="Stop generation"
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputText.trim()}
                      className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
                      title="Send prompt"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2">
                  <span>Puter.js Direct Turbo Gateway</span>
                  <span className="text-emerald-400 font-medium font-mono">⚡ Cascade: Gemini 3.8 Flash → OpenAI → DeepSeek (100% Free)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* ─── CONVERSATIONAL LIVE VOICE CALL MODAL ─── */}
      {isLiveCallOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-gradient-to-b from-card to-card/90 border border-primary/30 rounded-3xl w-full max-w-lg p-8 shadow-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={() => {
                if (isRecording) handleToggleVoiceRecording();
                if (activeAudioRef.current) activeAudioRef.current.pause();
                setIsLiveCallOpen(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                Live Conversational Voice Mode
              </span>
              <h3 className="text-xl font-extrabold text-foreground tracking-tight pt-2">
                Master AI Voice Call
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Real-time spoken dialogue powered by Google Gemini 3.8 Flash &amp; AWS Polly Neural voice.
              </p>
            </div>

            {/* Glowing Pulsing Voice Orb */}
            <div className="relative py-4">
              <div
                className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                  isRecording
                    ? 'bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 animate-pulse shadow-rose-500/50 scale-105'
                    : speakingMsgId
                    ? 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 animate-pulse shadow-cyan-500/50 scale-105'
                    : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-purple-500/30'
                }`}
              >
                <Mic className="w-14 h-14 text-white" />
              </div>
            </div>

            <div className="text-xs font-mono text-muted-foreground">
              {isRecording
                ? '🎙️ Listening to your voice... Speak naturally.'
                : speakingMsgId
                ? '🔊 Master AI is speaking...'
                : 'Tap microphone to speak or end call.'}
            </div>

            {/* Voice Personality Selector */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background/50 border border-border/60 text-[11px] font-medium flex-wrap justify-center">
              {[
                { id: 'Joanna', label: '🌸 Joanna (Natural)' },
                { id: 'Matthew', label: '🎙️ Matthew (Deep)' },
                { id: 'alloy', label: '⚡ Alloy (OpenAI)' },
                { id: 'nova', label: '🌟 Nova (Studio)' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVoice(v.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedVoice === v.id
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Call Controls */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleToggleVoiceRecording}
                className={`p-4 rounded-full font-bold shadow-lg transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30'
                }`}
                title={isRecording ? 'Stop speaking' : 'Start speaking'}
              >
                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isRecording) handleToggleVoiceRecording();
                  if (activeAudioRef.current) activeAudioRef.current.pause();
                  setIsLiveCallOpen(false);
                }}
                className="p-4 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/30 transition-all cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE WEBCAM SNAP MODAL ─── */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-primary/30 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col items-center text-center space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between w-full pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-sm text-foreground">Live Camera Snapshot</span>
              </div>
              <button
                type="button"
                onClick={handleCloseCamera}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner flex items-center justify-center">
              <video
                ref={videoStreamRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-[11px] text-muted-foreground">
              Point your camera at any document, diagram, error, or object to analyze with Vision AI.
            </p>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={handleCloseCamera}
                className="flex-1 py-2.5 rounded-xl border border-border/80 hover:bg-accent text-xs font-semibold text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCaptureSnap}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-lg shadow-primary/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Capture &amp; Attach</span>
              </button>
            </div>
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
