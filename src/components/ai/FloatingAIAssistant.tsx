import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Maximize2,
  Minimize2,
  Bot,
  User,
  ArrowUpRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AIService, AIMessage } from '@/services/aiService';
import { useAuthStore } from '@/stores/authStore';

export function FloatingAIAssistant() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'float-welcome',
      role: 'assistant',
      content: 'Hi! Need quick help with your Master Cloud drive or documents?',
      timestamp: new Date().toISOString(),
    },
  ]);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) return;
    const userMsg: AIMessage = {
      id: 'f-msg-' + Date.now(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInputText('');
    setIsStreaming(true);

    const botId = 'f-msg-' + (Date.now() + 1);
    setMessages(prev => [...prev, { id: botId, role: 'assistant', content: '', timestamp: new Date().toISOString() }]);

    try {
      const stream = AIService.streamResponse(userMsg.content, newMsgs, null, 'general', user?.id);
      for await (const chunk of stream) {
        setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: chunk } : m));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <>
      {/* Floating Sparkle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-13 w-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white p-3.5 shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
          title="Master AI Quick Assistant"
        >
          <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
          <span className="sr-only">Open Master AI</span>
        </button>
      )}

      {/* Slide-over Mini Drawer / Popup */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-32px)] h-[520px] max-h-[85vh] rounded-3xl bg-card border border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 backdrop-blur-xl">
          {/* Header */}
          <div className="h-12 border-b border-border/60 px-4 flex items-center justify-between bg-primary/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-xs">Master AI Quick Assistant</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai');
                }}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title="Open Full Workspace"
              >
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-muted/70 text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border/60 bg-background">
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-2.5 py-1.5 border border-border/60 focus-within:border-primary">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Master AI..."
                className="flex-1 bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/60"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isStreaming}
                className="p-1 rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
