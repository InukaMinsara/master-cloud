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
  Clock,
  ShieldCheck,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { AIService, AIMessage, AIChatSession } from '@/services/aiService';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';

export function AIPage() {
  const { user } = useAuthStore();
  const { files, fetchItems } = useFileStore();
  const [sessions, setSessions] = useState<AIChatSession[]>(() => AIService.getSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || 'session-default');
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedFile, setAttachedFile] = useState<FileItem | null>(null);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    AIService.saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isStreaming]);

  // Session CRUD
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
          content: 'Hello! I am **Master AI**. How can I assist you with your cloud files or projects today?',
          timestamp: new Date().toISOString(),
          tokensUsed: 24,
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
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isStreaming) return;

    const userMsg: AIMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
      attachedFile: attachedFile ? {
        id: attachedFile.id,
        name: attachedFile.name,
        sizeBytes: attachedFile.size_bytes,
      } : undefined,
    };

    const updatedMessages = [...activeSession.messages, userMsg];
    const updatedSessions = sessions.map(s => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          title: s.messages.length <= 1 ? textToSend.slice(0, 28) : s.title,
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

    // Add empty assistant placeholder
    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        return { ...s, messages: [...s.messages, initialAssistantMsg] };
      }
      return s;
    }));

    try {
      const stream = AIService.streamResponse(
        textToSend,
        updatedMessages,
        sentFile,
        activeSession.persona,
        user?.id
      );

      for await (const chunk of stream) {
        setSessions(prev => prev.map(s => {
          if (s.id === activeSession.id) {
            const msgs = s.messages.map(m => m.id === assistantMsgId ? { ...m, content: chunk } : m);
            return { ...s, messages: msgs };
          }
          return s;
        }));
      }
    } catch (err) {
      toast.error('AI Gateway encountered an interruption.');
    } finally {
      setIsStreaming(false);
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Response copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const promptSuggestions = [
    'Summarize my Master Cloud storage quota status',
    'Explain the zero-trust encryption model',
    'How do I create a new spreadsheet in Master Canvas?',
    'Draft an executive project proposal for my team',
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-background text-foreground select-none">
      {/* Left Sidebar: Conversations & Persona */}
      <div className="w-64 border-r border-border/60 bg-card/30 flex flex-col shrink-0">
        <div className="p-3 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs">Master AI</span>
          </div>
          <button
            onClick={handleNewSession}
            className="p-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            title="New Conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Persona Selector */}
        <div className="p-3 border-b border-border/50 space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Assistant Persona
          </label>
          <select
            value={activeSession.persona}
            onChange={(e) => {
              const updated = sessions.map(s => s.id === activeSession.id ? { ...s, persona: e.target.value as any } : s);
              setSessions(updated);
            }}
            className="w-full bg-muted text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-border/60 focus:outline-none focus:border-primary"
          >
            <option value="general">General Copilot</option>
            <option value="analyst">Document Analyst</option>
            <option value="coder">Code Architect</option>
            <option value="writer">Executive Writer</option>
          </select>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => {
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
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Gateway Status Badge */}
        <div className="p-3 border-t border-border/50 text-[10px] text-muted-foreground bg-card/40 flex items-center justify-between font-mono">
          <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            master-chat
          </span>
          <span>14ms • Online</span>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden bg-secondary/10">
        {/* Chat Header */}
        <header className="h-14 border-b border-border/60 px-6 flex items-center justify-between bg-card/30 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-xs text-foreground">{activeSession.title}</h2>
              <span className="text-[10px] text-muted-foreground capitalize">
                Persona: {activeSession.persona} Copilot • Free & Unlimited for 10 TB users
              </span>
            </div>
          </div>
        </header>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeSession.messages.map(msg => (
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
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
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
                  {msg.content}
                </div>

                {msg.role === 'assistant' && msg.content && (
                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Master AI Virtual Engine</span>
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="hover:text-foreground flex items-center gap-1"
                    >
                      {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Empty Thread Suggestions */}
          {activeSession.messages.length <= 1 && (
            <div className="max-w-2xl mx-auto pt-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block text-center">
                Suggested Prompts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {promptSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="p-3 rounded-xl bg-card border border-border/70 hover:border-primary text-left text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-sm flex items-center justify-between group"
                  >
                    <span>{suggestion}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
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
            {/* Attached file pill */}
            {attachedFile && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold animate-in fade-in">
                <FileText className="h-3.5 w-3.5" />
                <span className="truncate max-w-xs">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="hover:text-destructive ml-1">
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
                placeholder="Ask Master AI anything, or request file analysis..."
                className="flex-1 bg-transparent resize-none border-none outline-none text-xs sm:text-sm py-1.5 px-2 text-foreground placeholder:text-muted-foreground/50 max-h-32"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground">
              Master AI Gateway delivers secure zero-trust processing. Never exposes raw credentials or models.
            </p>
          </div>
        </div>
      </div>

      {/* Cloud File Context Picker Modal */}
      {isFilePickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>Select File from Master Cloud</span>
              </h3>
              <button onClick={() => setIsFilePickerOpen(false)} className="hover:text-foreground text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5">
              {files.filter(f => !f.deleted_at).map(file => (
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
