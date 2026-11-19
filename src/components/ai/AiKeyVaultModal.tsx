/**
 * src/components/ai/AiKeyVaultModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — PROVIDERS & API KEYS VAULT (Claude, GPT, Gemini, DeepSeek)
 * Lets users manage their own dedicated 100% Free API keys for:
 * 1. Google Gemini 2.0 (1,500 req/day Free, 1M context)
 * 2. Groq LPU / DeepSeek R1 (14,400 req/day Free, 500+ tok/s)
 * 3. OpenAI GPT-4o
 * 4. Anthropic Claude 3.5 Sonnet
 *
 * Keys are stored locally in browser localStorage (Zero-telemetry leak).
 * If no key is provided, Master AI operates in Sovereign Free Gateway Mode!
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Save,
  Trash2,
  X,
  Zap,
  Sparkles,
  Bot,
  BrainCircuit,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

interface AiKeyVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiKeyVaultModal: React.FC<AiKeyVaultModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGeminiKey(localStorage.getItem('master_cloud_gemini_api_key') || '');
      setGroqKey(localStorage.getItem('master_cloud_groq_api_key') || '');
      setOpenaiKey(localStorage.getItem('master_cloud_openai_api_key') || '');
      setAnthropicKey(localStorage.getItem('master_cloud_anthropic_api_key') || '');
    }
  }, [isOpen]);

  const handleSaveKeys = () => {
    if (typeof window !== 'undefined') {
      if (geminiKey.trim()) {
        localStorage.setItem('master_cloud_gemini_api_key', geminiKey.trim());
      } else {
        localStorage.removeItem('master_cloud_gemini_api_key');
      }

      if (groqKey.trim()) {
        localStorage.setItem('master_cloud_groq_api_key', groqKey.trim());
      } else {
        localStorage.removeItem('master_cloud_groq_api_key');
      }

      if (openaiKey.trim()) {
        localStorage.setItem('master_cloud_openai_api_key', openaiKey.trim());
      } else {
        localStorage.removeItem('master_cloud_openai_api_key');
      }

      if (anthropicKey.trim()) {
        localStorage.setItem('master_cloud_anthropic_api_key', anthropicKey.trim());
      } else {
        localStorage.removeItem('master_cloud_anthropic_api_key');
      }

      toast.success('AI Provider keys saved securely in local storage!');
      onClose();
    }
  };

  const handleClearAll = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('master_cloud_gemini_api_key');
      localStorage.removeItem('master_cloud_groq_api_key');
      localStorage.removeItem('master_cloud_openai_api_key');
      localStorage.removeItem('master_cloud_anthropic_api_key');
      setGeminiKey('');
      setGroqKey('');
      setOpenaiKey('');
      setAnthropicKey('');
      toast.info('All custom keys removed. Master AI is now in Sovereign Free Gateway Mode.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-3xl bg-zinc-950/95 border border-white/[0.1] shadow-2xl p-5 sm:p-6 space-y-5 relative"
      >
        {/* Subtle Ambient Top Rim Glow */}
        <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                  Frontier AI Providers &amp; Key Vault
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  Big 4 Supported
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/80">
                Claude, GPT, Gemini, DeepSeek — 100% Free or Dedicated Keys
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sovereign Free Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10 border border-cyan-500/20 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">Zero-Setup Mode: </span>
            Even if you enter <strong className="text-cyan-300">no keys at all</strong>, Master AI automatically routes all 4 model families through our sovereign free cloud cascade! Adding your free keys unlocks dedicated 500+ tok/s speeds and 1M context.
          </div>
        </div>

        {/* 4 Provider Inputs */}
        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
          {/* 1. Google Gemini */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Google Gemini 2.0 Flash / Pro</span>
              </div>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>Get Free Key (1,500 req/day)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Paste Google AI Studio Free Key (AIzaSy...)"
              className="w-full h-9 px-3 rounded-xl bg-black/40 border border-white/[0.08] focus:border-cyan-500/50 text-xs font-mono text-foreground placeholder:text-zinc-600 focus:outline-none"
            />
          </div>

          {/* 2. Groq LPU (DeepSeek R1 & Llama 3.3) */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <span>DeepSeek R1 / Llama 3.3 (Groq LPU)</span>
              </div>
              <a
                href="https://console.groq.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <span>Get Free Key (14,400 req/day)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="Paste Groq Free Key (gsk_...)"
              className="w-full h-9 px-3 rounded-xl bg-black/40 border border-white/[0.08] focus:border-amber-500/50 text-xs font-mono text-foreground placeholder:text-zinc-600 focus:outline-none"
            />
          </div>

          {/* 3. OpenAI GPT-4o */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-400" />
                <span>OpenAI GPT-4o / GPT-4o-mini</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Optional Custom Key
              </span>
            </div>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="Paste OpenAI Key (sk-...)"
              className="w-full h-9 px-3 rounded-xl bg-black/40 border border-white/[0.08] focus:border-emerald-500/50 text-xs font-mono text-foreground placeholder:text-zinc-600 focus:outline-none"
            />
          </div>

          {/* 4. Anthropic Claude 3.5 Sonnet */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-purple-400" />
                <span>Anthropic Claude 3.5 Sonnet / Haiku</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Optional Custom Key / OpenRouter
              </span>
            </div>
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="Paste Anthropic or OpenRouter Key (sk-ant-...)"
              className="w-full h-9 px-3 rounded-xl bg-black/40 border border-white/[0.08] focus:border-purple-500/50 text-xs font-mono text-foreground placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Custom Keys</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-foreground text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveKeys}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save &amp; Activate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
