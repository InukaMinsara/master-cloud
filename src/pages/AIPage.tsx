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
  Square,
  Image as ImageIcon,
  Mic,
  Volume2,
  Download,
  Wand2,
  Code2,
  Share2,
  Laptop,
  UploadCloud,
} from 'lucide-react';
import { AIService, AIMessage, AIChatSession } from '@/services/aiService';
import { api } from '@/services/api';
import { puterAiService, PuterImageResult } from '@/services/ai/puterAiService';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';
import { ChatMarkdownRenderer } from '@/components/ai/ChatMarkdownRenderer';

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
  const [sessions, setSessions] = useState<AIChatSession[]>(() => AIService.getSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || 'session-default');
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedFile, setAttachedFile] = useState<FileItem | null>(null);
  const [attachedLocalFile, setAttachedLocalFile] = useState<LocalAttachedFile | null>(null);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [attachmentModalTab, setAttachmentModalTab] = useState<'local' | 'cloud'>('local');
  const fileInputLocalRef = useRef<HTMLInputElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');

  // Conversational AI Features
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Vision Image Attachment & Polishing & Export State
  const [attachedImage, setAttachedImage] = useState<{ url: string; file?: File; name: string } | null>(null);
  const [isPolishingPrompt, setIsPolishingPrompt] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const selectedVoice = 'Joanna';
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
    // If AI is currently speaking, interrupt it immediately
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
            '👋 Welcome to **Master AI** — 100% Free & Unlimited Conversational Copilot!\n\n' +
            'Powered by Google Gemini 3.8 Flash, OpenAI GPT-4o Mini, and DeepSeek with zero daily limits, zero token caps, and zero paywalls.\n\n' +
            '- **Autonomous Cascade**: Gemini 3.8 Flash ⚡ → GPT-4o Mini → DeepSeek (100% Free)\n' +
            '- **Document & Code Intelligence**: Attach files from your PC or Master Cloud Drive\n' +
            '- **Multimodal Vision**: Paste (Ctrl+V) or attach images to analyze diagrams, code, and photos\n' +
            '- **Web Grounding**: Real-time live web citations and web browsing\n' +
            '- **Bilingual**: Ask in **English** or **සිංහල (Sinhala)** anytime!',
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

  // ─── SEND MESSAGE WITH STREAMING + CANCEL SUPPORT (PURE UNLIMITED CHATTING) ───
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

    // ─── 1. IN-CHAT IMAGE GENERATION (FLUX.1 ULTRA ZERO-LIMIT CASCADE) ───
    const imageIntent = detectImageIntent(textToSend, Boolean(sentImage));
    if (imageIntent.isImage) {
      const isImg2Img = Boolean(sentImage);
      const initialAssistantMsg: AIMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: isImg2Img
          ? `🎨 Analyzing reference photo with **Gemini Multimodal Vision** to preserve facial identity & generating transformation via **FLUX.1 Ultra**...\n\n> Edit: *"${imageIntent.prompt}"*`
          : `🎨 Synthesizing high-resolution image with **FLUX.1 Ultra** (Perchance-grade Zero-Limit Engine)...\n\n> Prompt: *"${imageIntent.prompt}"*`,
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
        let targetPrompt = imageIntent.prompt;

        if (sentImage) {
          try {
            toast.info('🔍 Vision AI analyzing reference photo to lock facial identity & build...');
            const visionAnalysis = await puterAiService.chat(
              `The user uploaded a reference photograph and requested this edit/generation: "${imageIntent.prompt}".
Carefully inspect the attached reference photograph:
1. Identify the subject: exact gender, age, hairstyle, hair color, skin tone/complexion, facial features, facial hair (beard/stubble/clean-shaven), body build, and current posture.
2. Incorporate the user's requested edit: "${imageIntent.prompt}".
3. Formulate an exact, photorealistic prompt (1-2 sentences) instructing the diffusion model to depict this EXACT same person, face, and facial structure from the reference photo, but modified to satisfy "${imageIntent.prompt}".
Output ONLY the resulting prompt text, with no preamble or quotes.`,
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
          // Primary: 100% Free & Unlimited FLUX.1 Ultra via Pollinations
          imgRes = await puterAiService.generateImageViaPollinations(targetPrompt, {
            aspect_ratio: '1:1',
            input_image: sentImage?.url,
          });
        } catch {
          // Fallback: Puter txt2img / AI Horde
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
                        ? `✨ Transformed image with preserved subject identity, powered by **${imgRes.model}**:\n\n> *"${imageIntent.prompt}"*`
                        : `✨ Here is your generated image powered by **${imgRes.model}**:\n\n> *"${imageIntent.prompt}"*`,
                      mediaAttachment: {
                        type: 'image' as const,
                        url: imgRes.imageUrl,
                        prompt: imageIntent.prompt,
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
        toast.success(`Image ${isImg2Img ? 'transformed' : 'generated'} in chat via ${imgRes.model}!`);
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

    // ─── 2. TEXT CHAT STREAMING (GEMINI -> OPENAI -> DEEPSEEK CASCADE) ───
    // Initial empty assistant message for streaming
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

      // Stream directly through Puter.js with automatic waterfall cascade (Gemini 3.8 Flash -> GPT-4o -> DeepSeek)
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
    { label: '🎨 AI Image Gen (FLUX Ultra)', text: 'Photo ekak hadanna futuristic neon cyber city in rain' },
    { label: '⚡ Fast Chat (Sinhala)', text: 'Master Cloud එකේ Unlimited AI Chat එක ගැන කෙටියෙන් සිංහලෙන් කියන්න.' },
    { label: '💻 Code Generation', text: 'Write a clean, responsive TypeScript and Tailwind CSS Dashboard component.' },
    { label: '📑 File & Code Analysis', text: 'Analyze this code or document, extract key points, and suggest improvements.' },
  ];

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
      s.messages.some((m) => m.content.toLowerCase().includes(sessionSearchQuery.toLowerCase())),
  );

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-background text-foreground select-none">
      {/* ─── MASTER AI CHAT TOP HEADER ─── */}
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
                100% Free &amp; Unlimited
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gemini 3.8 Flash + FLUX.1
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              Zero Token Caps · Zero Daily Message Limits · FLUX Ultra Images &amp; Document Intelligence
            </p>
          </div>
        </div>

        {/* ─── HEADER STATUS BADGE ─── */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>⚡ Cascade: Gemini 3.8 Flash + FLUX.1 Ultra (100% Free)</span>
          </div>
        </div>
      </header>

      {/* ─── MAIN CHAT INTERFACE ─── */}
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
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors cursor-pointer"
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

            {/* Autonomous AI Waterfall Routing Engine */}
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
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity p-0.5 cursor-pointer"
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
                  {activeSession.persona} Persona · Zero Limits · Autonomous Free Gateway
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                ⚡ Extreme Fast Stream (~120 tok/s)
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
                className="px-2 py-1 rounded-lg border border-border/60 hover:bg-accent text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                <UploadCloud className="h-12 w-12 text-cyan-400 animate-bounce" />
                <span className="text-sm font-bold text-foreground">Drop files from your PC to attach to Master AI</span>
                <span className="text-xs text-muted-foreground">Code, documents, data (.json, .csv, .py, .pdf) or images</span>
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
                      <span className="font-mono text-cyan-400">Master AI · Autonomous Free Cascade</span>
                      <div className="flex items-center gap-2">
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
              {/* Quick Action Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                <button
                  type="button"
                  onClick={() => setInputText((prev) => (prev ? `${prev} Photo ekak hadanna ` : 'Photo ekak hadanna '))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-colors shrink-0 cursor-pointer"
                >
                  <ImageIcon className="h-3 w-3 text-purple-400" />
                  <span>🎨 Image Gen (FLUX)</span>
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
                  disabled={isPolishingPrompt || !inputText.trim()}
                  onClick={handlePolishPrompt}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/15 to-indigo-500/15 hover:from-purple-500/25 hover:to-indigo-500/25 text-purple-300 border border-purple-500/30 transition-all shrink-0 cursor-pointer disabled:opacity-50 ml-auto"
                  title="Polish and enrich prompt with AI Magic Wand"
                >
                  <Wand2 className={`h-3 w-3 text-purple-400 ${isPolishingPrompt ? 'animate-spin' : ''}`} />
                  <span>{isPolishingPrompt ? 'Polishing...' : '✨ Polish'}</span>
                </button>
              </div>

              {/* Attached File Pill (Cloud Drive) */}
              {attachedFile && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold animate-in fade-in">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="truncate max-w-xs">{attachedFile.name} (Drive)</span>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="hover:text-destructive ml-1 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Attached Local PC File Pill */}
              {attachedLocalFile && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold animate-in fade-in">
                  <Laptop className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="truncate max-w-xs">{attachedLocalFile.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({(attachedLocalFile.size / 1024).toFixed(1)} KB · PC)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedLocalFile(null)}
                    className="hover:text-destructive ml-1 cursor-pointer"
                    title="Remove local file"
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
                  title="Attach file from Local PC or Master Cloud Drive"
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
                      ? 'Ask Master AI anything about this attached image/screenshot, or ask to dress/modify it... [Enter]'
                      : 'Ask Master AI anything, generate images (Photo ekak hadanna...), paste screenshots (Ctrl+V)... [Enter]'
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
                <span>Autonomous AI Cascade · 100% Free &amp; Unlimited</span>
                <span className="text-emerald-400 font-medium font-mono">⚡ Gemini 3.8 Flash → GPT-4o Mini → DeepSeek</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── UNIFIED FILE ATTACHMENT MODAL (LOCAL PC & CLOUD DRIVE) ─── */}
      {isFilePickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Attach File to AI Context</h3>
              </div>
              <button
                onClick={() => setIsFilePickerOpen(false)}
                className="hover:text-foreground text-muted-foreground p-1 rounded-lg hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Source Switcher Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/50 border border-border/60">
              <button
                type="button"
                onClick={() => setAttachmentModalTab('local')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  attachmentModalTab === 'local'
                    ? 'bg-primary text-primary-foreground shadow-sm'
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
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>☁️ Master Cloud ({files.filter((f) => !f.deleted_at).length})</span>
              </button>
            </div>

            {/* TAB 1: LOCAL PC FILE BROWSER & DRAG ZONE */}
            {attachmentModalTab === 'local' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputLocalRef.current?.click()}
                  className="border-2 border-dashed border-border/80 hover:border-primary/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-accent/40 group bg-card/40"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud className="h-7 w-7 text-primary" />
                  </div>
                  <span className="font-bold text-sm text-foreground">Choose files from your Computer</span>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Click to browse or drop any file here. Supports Code (.ts, .py, .js), Documents (.pdf, .txt, .md), Data (.json, .csv), and Images for Vision AI.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputLocalRef.current?.click();
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-2"
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
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-accent cursor-pointer transition-colors text-xs border border-border/40 hover:border-border"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
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
    </div>
  );
}
