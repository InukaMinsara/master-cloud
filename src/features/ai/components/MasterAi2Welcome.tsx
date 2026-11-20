/**
 * src/features/ai/components/MasterAi2Welcome.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — WELCOME & DISCOVERY SCREEN
 * Clean Windows 11 Fluent layout with sample prompts for Groq coding,
 * reasoning, and Pollinations generative image creation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { Sparkles, Code2, Cpu, ImageIcon, Zap } from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { groqService } from '../services/groqService';

const PROMPT_STARTERS = [
  {
    icon: Code2,
    title: 'Full-Stack Architecture',
    prompt: 'Design a high-performance React + TypeScript architecture for real-time collaboration with WebSockets.',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/20 hover:border-cyan-500/40',
  },
  {
    icon: ImageIcon,
    title: 'Generative Image Art',
    prompt: '/image Cinematic futuristic city at night in neon rain, volumetric lighting, photorealistic, 8k',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/20 hover:border-orange-500/40',
  },
  {
    icon: Cpu,
    title: 'Mathematical Reasoning',
    prompt: 'Explain the algorithmic mechanics of Grouped-Query Attention (GQA) vs Multi-Head Attention (MHA).',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/20 hover:border-purple-500/40',
  },
  {
    icon: Zap,
    title: 'Ultra-Fast Code Refactor',
    prompt: 'Write an optimized React virtualized list component supporting 100,000 items with zero jank.',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
  },
];

export function MasterAi2Welcome({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  const hasKey = groqService.hasApiKey();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 max-w-4xl mx-auto w-full select-none text-center">
      {/* Brand Hero */}
      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300 shadow-inner">
          <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
          <span>HIGH-VELOCITY CONVERSATIONAL INTELLIGENCE & VISUAL STUDIO</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-3">
          <span>MASTER AI</span>
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
            INFINITY
          </span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
          Ultra-low latency conversational intelligence, coding, deep reasoning, and live web search, paired with native in-chat SenseNova image synthesis.
        </p>

        <div className="pt-2 flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Master AI Engine · Online</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[11px] font-mono text-orange-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>SenseNova Visual Studio · Ready</span>
          </div>
        </div>
      </div>

      {/* 4 Quick Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl text-left">
        {PROMPT_STARTERS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className={`p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border ${item.borderColor} transition-all duration-200 group text-left cursor-pointer flex flex-col justify-between gap-2 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </span>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {item.prompt}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
