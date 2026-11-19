/**
 * src/pages/AIPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — ULTIMATE INTERFACE REDESIGN
 * Sovereign AI Operating Environment inside MASTER CLOUD.
 *
 * Windows 11 Fluent Design / Acrylic Glassmorphism / Mica aesthetic.
 * 100% Sovereign & Independent (Zero Hugging Face, Zero @gradio/client).
 * Zero Local Model Downloads (10 TB Virtual Model Vault on Drive I:).
 * Autonomous Cascade: Gemini 3.8 Flash → GPT-4o Mini → DeepSeek (100% Free).
 * DALL-E 3 Grade GPT Auto-Enhancer [⚡ 8K Mode: ON].
 * Command Palette (Ctrl + K) & Regenerate / Edit Capabilities.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  User,
  FileText,
  X,
  Laptop,
  UploadCloud,
  Check,
  Copy,
  Volume2,
  Square,
  Paperclip,
  Share2,
  RefreshCw,
  Edit2,
  CheckCheck,
} from 'lucide-react';
import { AIService, AIMessage, AIChatSession } from '@/services/aiService';
import { api } from '@/services/api';
import { puterAiService, PuterImageResult } from '@/services/ai/puterAiService';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';
import { ChatMarkdownRenderer } from '@/components/ai/ChatMarkdownRenderer';
import { MasterAiSidebar, MasterAiToolMode } from '@/components/ai/MasterAiSidebar';
import { MasterAiHeader, MASTER_AI_MODELS } from '@/components/ai/MasterAiHeader';
import { MasterAiWelcomeScreen } from '@/components/ai/MasterAiWelcomeScreen';
import { MasterAiPromptInput } from '@/components/ai/MasterAiPromptInput';
import { MasterAiCommandPalette } from '@/components/ai/MasterAiCommandPalette';
import { VirtualTryOnStudio } from '@/components/ai/VirtualTryOnStudio';
import { DedicatedGpuModal } from '@/components/ai/DedicatedGpuModal';
import { dedicatedGpuService, DedicatedGpuStatus } from '@/services/ai/dedicatedGpuBackend';
import { enhancePromptWithGpt } from '@/services/ai/masterCloudAiEngines';

export interface LocalAttachedFile {
  name: string;
  size: number;
  type: string;
  content: string;
  rawFile?: File;
}

/**
 * Detects whether the user is requesting in-chat image generation
 * Powered by 100% Free & Unlimited FLUX.1 Ultra (Perchance-grade Engine)
 */
function detectImageIntent(text: string, hasAttachedImage: boolean): { isImage: boolean; prompt: string; isImg2Img: boolean } {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  const isImageKeyword =
    lower.includes('photo') ||
    lower.includes('image') ||
    lower.includes('picture') ||
    lower.includes('wallpaper') ||
    lower.includes('chithra') ||
    lower.includes('පින්තූර') ||
    lower.includes('portrait') ||
    lower.startsWith('draw') ||
    lower.startsWith('paint') ||
    lower.startsWith('sketch');

  const isActionKeyword =
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

  if (isImageKeyword && isActionKeyword) {
    let p = clean
      .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:generate|create|make|render)\s+(?:an?\s+)?(?:image|photo|picture|wallpaper|art|drawing)\s+(?:of|about|showing)?\s*/i, '')
      .replace(/^(?:draw|paint|sketch|illustrate)\s+(?:an?\s+)?(?:image|photo|picture)?\s*(?:of)?\s*/i, '')
      .replace(/^(?:photo\s+ekak|image\s+ekak|pic\s+ekak)\s+(?:hadanna|hadapan|hadala\s+denna|generate\s+karanna|andinna)\s*/i, '')
      .replace(/^(?:chithrayak|chithra)\s+(?:andinna|andala\s+denna|hadanna)\s*/i, '')
      .replace(/(?:photo|image)\s*ekak\s*(?:hadanna|hadapan|generate\s*karanna|andinna)/gi, '')
      .trim();
    if (!p || p.length < 3) p = clean;
    return { isImage: true, prompt: p, isImg2Img: hasAttachedImage };
  }

  if (hasAttachedImage) {
    const isEditAction =
      lower.includes('dress') ||
      lower.includes('wear') ||
      lower.includes('clothes') ||
      lower.includes('outfit') ||
      lower.includes('andanna') ||
      lower.includes('andapan') ||
      lower.includes('change background') ||
      lower.includes('replace background') ||
      lower.includes('edit') ||
      lower.includes('modify') ||
      lower.includes('transform');

    if (isEditAction) {
      return { isImage: true, prompt: clean, isImg2Img: true };
    }
  }

  return { isImage: false, prompt: clean, isImg2Img: false };
}

export function AIPage() {
  const { user } = useAuthStore();
  const { files, fetchItems } = useFileStore();

  // Chat State
  const [sessions, setSessions] = useState<AIChatSession[]>(() => {
    const loaded = AIService.getSessions();
    if (loaded && loaded.length > 0) return loaded;
    return [
      {
        id: 'session-default',
        title: 'Master AI Intelligence',
        persona: 'general',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg-welcome',
            role: 'assistant',
            content:
              '👋 Welcome to **Master AI Operating System**!\n\n' +
              'Powered by Google Gemini 3.8 Flash, OpenAI GPT-4o Mini, and DeepSeek R1 with zero limits, zero token caps, and zero local model downloads.\n\n' +
              '- **Autonomous Cascade**: Gemini 3.8 Flash ⚡ → GPT-4o Mini → DeepSeek (100% Free)\n' +
              '- **DALL-E 3 Grade Photorealism**: [⚡ 8K Mode: ON] with zero watermarks\n' +
              '- **Document & Code Intelligence**: Drag & drop or attach files from your PC or Master Cloud Drive\n' +
              '- **Multimodal Vision**: Paste (Ctrl+V) or upload screenshots to analyze diagrams & layouts\n' +
              '- **Bilingual**: Ask in **English** or **සිංහල (Sinhala)** anytime!',
            timestamp: new Date().toISOString(),
            tokensUsed: 32,
          },
        ],
      },
    ];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || 'session-default');
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedFile, setAttachedFile] = useState<FileItem | null>(null);
  const [attachedLocalFile, setAttachedLocalFile] = useState<LocalAttachedFile | null>(null);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [attachmentModalTab, setAttachmentModalTab] = useState<'local' | 'cloud'>('local');
  const fileInputLocalRef = useRef<HTMLInputElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Message Editing State
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState('');

  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Conversational AI Features & Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeToolMode, setActiveToolMode] = useState<MasterAiToolMode>('chat');
  const [selectedModelId, setSelectedModelId] = useState<string>('quantum-cascade');
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoGptEnhance, setAutoGptEnhance] = useState<boolean>(true);

  // Vision Image Attachment & Modals
  const [attachedImage, setAttachedImage] = useState<{ url: string; file?: File; name: string } | null>(null);
  const [isPolishingPrompt, setIsPolishingPrompt] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isLocalVtonStudioOpen, setIsLocalVtonStudioOpen] = useState(false);
  const [isDedicatedGpuModalOpen, setIsDedicatedGpuModalOpen] = useState(false);
  const [dedicatedGpuStatus, setDedicatedGpuStatus] = useState<DedicatedGpuStatus>({ online: false, url: '' });
  const [isLocalHostActive, setIsLocalHostActive] = useState(false);
  const selectedVoice = 'Joanna';
  const fileInputImageRef = useRef<HTMLInputElement | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Audio & Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Dedicated GPU health check
  useEffect(() => {
    dedicatedGpuService.checkHealth().then(setDedicatedGpuStatus).catch(() => {});
    const interval = setInterval(() => {
      dedicatedGpuService.checkHealth().then(setDedicatedGpuStatus).catch(() => {});
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Monitor Localhost IDM-VTON Server (port 7860) status
  useEffect(() => {
    const checkLocalhost = async () => {
      try {
        await fetch('http://127.0.0.1:7860/', { mode: 'no-cors', signal: AbortSignal.timeout(2000) });
        setIsLocalHostActive(true);
      } catch {
        setIsLocalHostActive(false);
      }
    };
    checkLocalhost();
    const interval = setInterval(checkLocalhost, 6000);
    return () => clearInterval(interval);
  }, []);

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

  // Keyboard Shortcuts: Ctrl+K (Command palette), Ctrl+N (New chat), Ctrl+B (Toggle sidebar)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewSession();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // ─── IN-CHAT VOICE RECORDING (SPEECH-TO-TEXT VIA WHISPER) ───
  const handleToggleVoiceRecording = async () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (speakingMsgId) {
      setSpeakingMsgId(null);
    }

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
      toast.info('🎙️ Listening... Speak naturally.');
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
    toast.info('Synthesizing speech via Neural voice...');
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
            toast.success('📸 Screenshot attached for Vision AI!');
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

  // ─── LOCAL PC FILE ATTACHMENT HANDLER ───
  const handleAttachLocalFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachedImage({
          url: dataUrl,
          file,
          name: file.name,
        });
        toast.success(`📸 Image attached from PC: ${file.name}`);
      };
      reader.readAsDataURL(file);
      setIsFilePickerOpen(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const textContent = (event.target?.result as string) || '';
      setAttachedLocalFile({
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        content: textContent,
        rawFile: file,
      });
      setIsFilePickerOpen(false);
      toast.success(`💻 Attached local PC file: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.onerror = () => {
      toast.error(`Could not read local file "${file.name}"`);
    };
    reader.readAsText(file);
  };

  const handleSelectLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAttachLocalFile(file);
    }
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
    handleAttachLocalFile(file);
  };

  // ─── LIVE WEBPAGE URL SCRAPER ───
  const extractUrlFromText = (text: string): string | null => {
    const match = text.match(/https?:\/\/[^\s]+/i);
    return match ? match[0] : null;
  };

  const scrapeUrlContent = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const html = await res.text();
        const clean = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        return clean.slice(0, 4000);
      }
    } catch {}
    return null;
  };

  // ─── PROMPT POLISHER / MAGIC WAND (GPT-4o ENHANCEMENT) ───
  const handlePolishPrompt = async () => {
    if (!inputText.trim()) {
      toast.info('Please enter a prompt first to polish.');
      return;
    }
    setIsPolishingPrompt(true);
    toast.info('✨ Enhancing prompt with AI Magic Wand...');
    try {
      const polished = await enhancePromptWithGpt(inputText.trim(), 'Photorealistic');
      if (polished && polished.length > 5) {
        setInputText(polished);
        toast.success('Prompt expanded to 8K cinematic directive!');
      } else {
        const fallback = await puterAiService.polishPrompt(inputText.trim());
        setInputText(fallback);
        toast.success('Prompt polished & enhanced!');
      }
    } catch {
      toast.error('Could not polish prompt.');
    } finally {
      setIsPolishingPrompt(false);
    }
  };

  // ─── CHAT EXPORT (MARKDOWN & PRINT) ───
  const handleExportMarkdown = () => {
    if (!activeSession) return;
    let md = `# ${activeSession.title}\n*Exported from Master AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
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

  // ─── SESSION MANAGEMENT ───
  const handleNewSession = () => {
    const newSession: AIChatSession = {
      id: 'session-' + Date.now(),
      title: 'New Conversation',
      persona: 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setActiveToolMode('chat');
  };

  const handleDeleteSession = (id: string) => {
    if (sessions.length <= 1) {
      toast.warning('You must keep at least one chat session.');
      return;
    }
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
    toast.info('Conversation deleted.');
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s))
    );
    toast.success('Conversation renamed.');
  };

  const handleTogglePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned, updatedAt: new Date().toISOString() } : s))
    );
  };

  const handleClearCurrentSession = () => {
    if (!activeSession) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, messages: [], updatedAt: new Date().toISOString() }
          : s,
      ),
    );
    toast.info('Chat cleared for this session.');
  };

  // ─── TOOL MODE SWITCHER ───
  const handleSelectToolMode = (mode: MasterAiToolMode) => {
    setActiveToolMode(mode);
    if (mode === 'tryon') {
      setIsLocalVtonStudioOpen(true);
    } else if (mode === 'image') {
      setSelectedModelId('flux-ultra-image');
      setInputText('Photo ekak hadanna ');
    } else if (mode === 'code') {
      setSelectedModelId('code-architect');
      setInputText('Write an optimized code component: ');
    } else if (mode === 'file') {
      setIsFilePickerOpen(true);
    }
  };

  // ─── REGENERATE / RETRY LAST ASSISTANT RESPONSE ───
  const handleRegenerateLastResponse = () => {
    if (isStreaming || !activeSession || activeSession.messages.length === 0) return;

    // Find the last user message
    const msgs = [...activeSession.messages];
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) {
      toast.info('No user message to regenerate.');
      return;
    }

    const lastUserPrompt = msgs[lastUserIndex].content;
    // Trim conversation up to the last user message
    const trimmed = msgs.slice(0, lastUserIndex);
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, messages: trimmed } : s))
    );

    // Re-send with that prompt
    handleSendMessage(lastUserPrompt);
  };

  // ─── EDIT USER MESSAGE ───
  const handleSaveEditedMessage = (msgId: string) => {
    if (!editingMsgText.trim()) {
      setEditingMsgId(null);
      return;
    }

    const msgs = [...activeSession.messages];
    const targetIdx = msgs.findIndex((m) => m.id === msgId);
    if (targetIdx === -1) {
      setEditingMsgId(null);
      return;
    }

    const newPrompt = editingMsgText.trim();
    setEditingMsgId(null);
    setEditingMsgText('');

    // Slice history up to this message and re-run with edited text
    const trimmed = msgs.slice(0, targetIdx);
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, messages: trimmed } : s))
    );

    handleSendMessage(newPrompt);
  };

  // ─── SEND MESSAGE WITH STREAMING & DALL-E 3 GRADE AUTO-8K ───
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isStreaming) return;

    const sentFile = attachedFile;
    const sentImage = attachedImage;
    const sentLocalFile = attachedLocalFile;
    setAttachedFile(null);
    setAttachedImage(null);
    setAttachedLocalFile(null);

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
          title: s.messages.length === 0 ? textToSend.slice(0, 32) : s.title,
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

    // ─── 1. IN-CHAT IMAGE GENERATION (FLUX.1 ULTRA + DALL-E 3 AUTO-8K EXPANSION) ───
    const imageIntent = detectImageIntent(textToSend, Boolean(sentImage));
    if (imageIntent.isImage || selectedModelId === 'flux-ultra-image') {
      const isImg2Img = Boolean(sentImage);
      const rawPrompt = imageIntent.prompt || textToSend;

      const initialAssistantMsg: AIMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: isImg2Img
          ? `🎨 Analyzing reference photo with **Vision AI** to preserve identity & generating transformation with **FLUX.1 Ultra**...\n\n> Directive: *"${rawPrompt}"*`
          : autoGptEnhance
          ? `⚡ **[8K Mode: Active]** Expanding directive with GPT-4o-Mini into photorealistic master prompt...\n\n> Original: *"${rawPrompt}"*`
          : `🎨 Synthesizing high-resolution image with **FLUX.1 Ultra** (Raw 4K · Zero Watermark)...\n\n> Prompt: *"${rawPrompt}"*`,
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
        let targetPrompt = rawPrompt;

        // DALL-E 3 Grade GPT Auto-Enhancer
        if (autoGptEnhance && !sentImage) {
          try {
            const enhanced = await enhancePromptWithGpt(rawPrompt, 'Photorealistic');
            if (enhanced && enhanced.length > 5) {
              targetPrompt = enhanced;
            }
          } catch (e) {
            console.warn('[Auto GPT Enhance Warning]:', e);
          }
        }

        // Vision image-to-image reference identity refinement
        if (sentImage) {
          try {
            toast.info('🔍 Vision AI locking facial identity & features from photo...');
            const visionAnalysis = await puterAiService.chat(
              `The user uploaded a reference photo and requested this edit: "${rawPrompt}".
Carefully inspect the photo:
1. Identify gender, age, hairstyle, skin tone, facial features, facial hair, posture.
2. Incorportate user edit: "${rawPrompt}".
3. Formulate an exact photorealistic prompt instructing the diffusion model to depict this EXACT same person with the edit.
Output ONLY the resulting prompt text.`,
              { image: sentImage.url, temperature: 0.2 }
            );

            if (visionAnalysis?.text && visionAnalysis.text.trim()) {
              targetPrompt = visionAnalysis.text.trim();
            }
          } catch (visionErr) {
            console.warn('[Vision Prompt Refinement Error]:', visionErr);
          }
        }

        let imgRes: PuterImageResult;
        try {
          // Tier 1: 100% Free & Unlimited Raw FLUX.1 Ultra via Pollinations
          imgRes = await puterAiService.generateImageViaPollinations(targetPrompt, {
            aspect_ratio: '1:1',
            input_image: sentImage?.url,
          });
        } catch {
          // Tier 2 Fallback: Puter txt2img
          imgRes = await puterAiService.generateImage(targetPrompt, {
            aspect_ratio: '1:1',
            input_image: sentImage?.url,
          });
        }

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: isImg2Img
                        ? `✨ Transformed image with preserved subject identity, powered by **${imgRes.model}**:\n\n> *"${rawPrompt}"*`
                        : autoGptEnhance
                        ? `✨ Masterpiece generated via **${imgRes.model}** with **[⚡ 8K Mode]**:\n\n> *"${rawPrompt}"*\n\n<details><summary className="text-[11px] text-zinc-400 font-mono cursor-pointer">View GPT Expanded Prompt</summary>\n\n\`\`\`\n${targetPrompt}\n\`\`\`\n</details>`
                        : `✨ Here is your generated image powered by **${imgRes.model}**:\n\n> *"${rawPrompt}"*`,
                      mediaAttachment: {
                        type: 'image' as const,
                        url: imgRes.imageUrl,
                        prompt: rawPrompt,
                        modelUsed: imgRes.model,
                      },
                    }
                  : m,
              );
              return { ...s, messages: msgs };
            }
            return s;
          }),
        );
        toast.success(`Image generated via ${imgRes.model}!`);
      } catch (err: any) {
        toast.error(`Image generation failed: ${err?.message || err}`);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: `⚠️ Image generation could not be completed: ${err?.message || err}`,
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

    // ─── 2. TEXT CHAT STREAMING (GEMINI 3.8 FLASH -> GPT-4O MINI -> DEEPSEEK CASCADE) ───
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

      // Live Webpage URL Scraping & Grounding
      const foundUrl = extractUrlFromText(textToSend);
      if (foundUrl) {
        toast.info(`🌐 Reading & scraping webpage: ${foundUrl}...`);
        const scraped = await scrapeUrlContent(foundUrl);
        if (scraped) {
          promptToSend = `[Live Scraped Webpage Content from ${foundUrl}]:\n${scraped}\n\n[User Request]:\n${promptToSend}`;
          toast.success('Live webpage grounded into prompt!');
        }
      }

      // Cloud Drive File Excerpt Context
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

      // Local PC File Excerpt Context
      if (sentLocalFile) {
        promptToSend = `[Attached Local PC File: ${sentLocalFile.name} (${(sentLocalFile.size / 1024).toFixed(1)} KB)]\n\`\`\`\n${sentLocalFile.content.slice(0, 15000)}\n\`\`\`\n\n[User Prompt]:\n${promptToSend}`;
      }

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

  const isConversationEmpty =
    !activeSession ||
    activeSession.messages.length === 0 ||
    (activeSession.messages.length === 1 && activeSession.messages[0].id === 'msg-welcome');

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground select-none font-sans">
      {/* ─── 1. LEFT COLLAPSIBLE SIDEBAR ─── */}
      <MasterAiSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setActiveToolMode('chat');
        }}
        onNewChat={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onTogglePinSession={handleTogglePinSession}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        activeToolMode={activeToolMode}
        onSelectToolMode={handleSelectToolMode}
        isDedicatedGpuOnline={dedicatedGpuStatus.online}
        dedicatedGpuName={dedicatedGpuStatus.gpuName}
        onOpenGpuModal={() => setIsDedicatedGpuModalOpen(true)}
        userName={user?.name || 'Inuka Minsara'}
      />

      {/* ─── 2. MAIN WORKSPACE AREA ─── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-gradient-to-b from-card/30 via-background to-background">
        {/* TOP HEADER */}
        <MasterAiHeader
          activeSessionTitle={activeSession?.title || 'New Conversation'}
          onRenameTitle={(newTitle) => handleRenameSession(activeSession.id, newTitle)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          isDedicatedGpuOnline={dedicatedGpuStatus.online}
          dedicatedGpuName={dedicatedGpuStatus.gpuName}
          onOpenGpuModal={() => setIsDedicatedGpuModalOpen(true)}
          isWebSearchEnabled={isWebSearchEnabled}
          onToggleWebSearch={() => setIsWebSearchEnabled((prev) => !prev)}
          onExportMarkdown={handleExportMarkdown}
          onPrintChat={handlePrintChat}
          onClearChat={handleClearCurrentSession}
        />

        {/* CHAT THREAD / WELCOME SCREEN */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          className="flex-1 overflow-y-auto relative flex flex-col"
        >
          {/* Drag Overlay */}
          {isDraggingOver && (
            <div className="absolute inset-4 bg-cyan-500/10 backdrop-blur-md border-2 border-dashed border-cyan-400 rounded-3xl z-40 flex flex-col items-center justify-center gap-2 pointer-events-none animate-in fade-in">
              <UploadCloud className="h-12 w-12 text-cyan-400 animate-bounce" />
              <span className="text-sm font-bold text-foreground">
                Drop files from your PC to attach to Master AI
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Code, Documents (.pdf, .txt, .md), Data (.json, .csv) or Images for Vision AI
              </span>
            </div>
          )}

          {/* Show Welcome Screen if session has no real user interaction yet */}
          {isConversationEmpty ? (
            <MasterAiWelcomeScreen
              userName={user?.name || 'Inuka Minsara'}
              onSelectPrompt={(prompt, mode) => {
                if (mode) handleSelectToolMode(mode);
                handleSendMessage(prompt);
              }}
              onOpenTryOn={() => setIsLocalVtonStudioOpen(true)}
              onOpenFilePicker={() => setIsFilePickerOpen(true)}
            />
          ) : (
            <div className="flex-1 p-4 sm:p-6 sm:pb-8 max-w-4xl mx-auto w-full space-y-6">
              {activeSession.messages.map((msg, msgIdx) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 w-full ${
                    msg.role === 'user'
                      ? 'ml-auto flex-row-reverse justify-start'
                      : 'mr-auto max-w-full'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white'
                        : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-purple-500/20'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-cyan-200" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`group/msg rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg relative ${
                      msg.role === 'user'
                        ? 'bg-zinc-900 border border-white/[0.1] text-foreground font-medium max-w-xl'
                        : 'bg-zinc-950/70 border border-white/[0.08] text-foreground w-full overflow-hidden backdrop-blur-xl'
                    }`}
                  >
                    {/* Attached Drive File */}
                    {msg.attachedFile && (
                      <div className="mb-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2 text-xs">
                        <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="font-bold truncate">{msg.attachedFile.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                          (Drive)
                        </span>
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

                        {/* Inline editing mode for user message */}
                        {editingMsgId === msg.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingMsgText}
                              onChange={(e) => setEditingMsgText(e.target.value)}
                              rows={2}
                              className="w-full bg-zinc-950 border border-cyan-500/50 rounded-xl p-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-cyan-400 font-sans"
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingMsgId(null)}
                                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-zinc-300 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditedMessage(msg.id)}
                                className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                              >
                                <CheckCheck className="h-3.5 w-3.5" />
                                <span>Save & Run</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMsgId(msg.id);
                                setEditingMsgText(msg.content);
                              }}
                              className="opacity-0 group-hover/msg:opacity-100 hover:text-cyan-300 text-muted-foreground p-1 rounded transition-opacity cursor-pointer shrink-0"
                              title="Edit prompt and re-run"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <ChatMarkdownRenderer
                        content={msg.content}
                        mediaAttachment={msg.mediaAttachment}
                        isStreaming={
                          isStreaming &&
                          msg.id === activeSession.messages[activeSession.messages.length - 1]?.id
                        }
                      />
                    )}

                    {/* Assistant Message Footer Actions */}
                    {msg.role === 'assistant' && msg.content && (
                      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-mono text-cyan-400/90 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          Master AI · Quantum vGPU
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Regenerate Button (Only on last assistant message) */}
                          {msgIdx === activeSession.messages.length - 1 && !isStreaming && (
                            <button
                              type="button"
                              onClick={handleRegenerateLastResponse}
                              className="hover:text-foreground flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-white/[0.05] cursor-pointer"
                              title="Regenerate this response"
                            >
                              <RefreshCw className="h-3 w-3 text-cyan-400" />
                              <span>Retry</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleReadAloud(msg.id, msg.content)}
                            className={`flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded cursor-pointer ${
                              speakingMsgId === msg.id
                                ? 'text-emerald-400 bg-emerald-500/10 font-bold'
                                : 'hover:text-foreground'
                            }`}
                            title={speakingMsgId === msg.id ? 'Stop audio' : 'Listen / Read aloud'}
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
                            type="button"
                            onClick={() => copyMessage(msg.id, msg.content)}
                            className="hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
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
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ─── 3. COMMAND DOCK (PROMPT INPUT) ─── */}
        <MasterAiPromptInput
          inputText={inputText}
          setInputText={setInputText}
          onSend={handleSendMessage}
          isStreaming={isStreaming}
          onStopStreaming={handleStopGenerating}
          attachedImage={attachedImage}
          onRemoveImage={() => setAttachedImage(null)}
          attachedLocalFile={attachedLocalFile}
          onRemoveLocalFile={() => setAttachedLocalFile(null)}
          attachedCloudFile={attachedFile}
          onRemoveCloudFile={() => setAttachedFile(null)}
          onOpenFilePicker={() => setIsFilePickerOpen(true)}
          onOpenImagePicker={() => fileInputImageRef.current?.click()}
          isRecording={isRecording}
          onToggleRecording={handleToggleVoiceRecording}
          autoGptEnhance={autoGptEnhance}
          onToggleAutoGptEnhance={() => setAutoGptEnhance((prev) => !prev)}
          isPolishingPrompt={isPolishingPrompt}
          onMagicPrompt={handlePolishPrompt}
          isWebSearchEnabled={isWebSearchEnabled}
          onToggleWebSearch={() => setIsWebSearchEnabled((prev) => !prev)}
        />
      </div>

      {/* Hidden image input for Vision */}
      <input
        type="file"
        ref={fileInputImageRef}
        accept="image/*"
        onChange={handleSelectImageFile}
        className="hidden"
      />

      {/* ─── COMMAND PALETTE (Ctrl + K) ─── */}
      <MasterAiCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        sessions={sessions}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setActiveToolMode('chat');
        }}
        onNewChat={handleNewSession}
        onSelectModel={setSelectedModelId}
        onSelectToolMode={handleSelectToolMode}
        autoGptEnhance={autoGptEnhance}
        onToggleAutoGptEnhance={() => setAutoGptEnhance((prev) => !prev)}
        isWebSearchEnabled={isWebSearchEnabled}
        onToggleWebSearch={() => setIsWebSearchEnabled((prev) => !prev)}
        onExportMarkdown={handleExportMarkdown}
        onOpenGpuModal={() => setIsDedicatedGpuModalOpen(true)}
        onOpenTryOn={() => setIsLocalVtonStudioOpen(true)}
        onOpenFilePicker={() => setIsFilePickerOpen(true)}
        onClearChat={handleClearCurrentSession}
      />

      {/* ─── UNIFIED FILE ATTACHMENT MODAL (LOCAL PC & CLOUD DRIVE) ─── */}
      {isFilePickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="bg-zinc-950/95 border border-white/[0.1] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-foreground">Attach File to AI Context</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilePickerOpen(false)}
                className="hover:text-foreground text-muted-foreground p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Source Switcher Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setAttachmentModalTab('local')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  attachmentModalTab === 'local'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Laptop className="h-4 w-4" />
                <span>💻 From Local PC</span>
              </button>
              <button
                type="button"
                onClick={() => setAttachmentModalTab('cloud')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  attachmentModalTab === 'cloud'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>☁️ Master Cloud ({files.filter((f) => !f.deleted_at).length})</span>
              </button>
            </div>

            {/* TAB 1: LOCAL PC FILE BROWSER */}
            {attachmentModalTab === 'local' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputLocalRef.current?.click()}
                  className="border-2 border-dashed border-white/[0.1] hover:border-cyan-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-white/[0.02] group bg-white/[0.01]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <UploadCloud className="h-7 w-7 text-cyan-400" />
                  </div>
                  <span className="font-bold text-sm text-foreground">
                    Choose files from your Computer
                  </span>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Code (.ts, .py, .js), Documents (.pdf, .txt, .md), Data (.json, .csv), and Images.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputLocalRef.current?.click();
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Laptop className="h-4 w-4" />
                    <span>Browse Local Disk</span>
                  </button>
                  <input
                    ref={fileInputLocalRef}
                    type="file"
                    onChange={handleSelectLocalFile}
                    className="hidden"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                  <span>Client-Side Fast FileReader</span>
                  <span className="text-cyan-400 font-mono font-medium">Auto-Grounded into Context</span>
                </div>
              </div>
            )}

            {/* TAB 2: MASTER CLOUD DRIVE FILES */}
            {attachmentModalTab === 'cloud' && (
              <div className="space-y-2">
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
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
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors text-xs border border-white/[0.04] hover:border-cyan-500/30"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                          <span className="font-medium truncate">{file.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2 font-mono">
                          {file.extension.toUpperCase()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── VIRTUAL TRY-ON STUDIO MODAL ─── */}
      <VirtualTryOnStudio
        isOpen={isLocalVtonStudioOpen}
        onClose={() => setIsLocalVtonStudioOpen(false)}
        isLocalHostActive={isLocalHostActive}
      />

      {/* ─── DEDICATED GPU (OPTION A) MODAL ─── */}
      <DedicatedGpuModal
        isOpen={isDedicatedGpuModalOpen}
        onClose={() => setIsDedicatedGpuModalOpen(false)}
        onStatusChange={setDedicatedGpuStatus}
      />
    </div>
  );
}
export default AIPage;
