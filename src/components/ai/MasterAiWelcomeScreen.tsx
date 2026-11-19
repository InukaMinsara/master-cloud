/**
 * src/components/ai/MasterAiWelcomeScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — FLUENT DESIGN WELCOME SCREEN & BENTO CAPABILITIES
 * Windows 11 Mica & Acrylic glassmorphic welcome canvas.
 * Features:
 * - Dynamic time-of-day greeting
 * - Quantum Tensor animated emblem
 * - 4 interactive Bento capability cards with 1-click execution
 * - System specifications & zero-limit badges
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {
  Sparkles,
  Zap,
  Cpu,
  HardDrive,
  Code2,
  Image as ImageIcon,
  Shirt,
  FolderOpen,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  BrainCircuit,
  Layers,
} from 'lucide-react';
import { MasterAiToolMode } from './MasterAiSidebar';

interface MasterAiWelcomeScreenProps {
  userName?: string;
  onSelectPrompt: (prompt: string, mode?: MasterAiToolMode) => void;
  onOpenTryOn: () => void;
  onOpenFilePicker: () => void;
}

export const MasterAiWelcomeScreen: React.FC<MasterAiWelcomeScreenProps> = ({
  userName = 'Inuka Minsara',
  onSelectPrompt,
  onOpenTryOn,
  onOpenFilePicker,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const bentoCards = [
    {
      id: 'photoreal-art',
      title: '4K Photorealistic Art Studio',
      subtitle: 'FLUX.1 Ultra · 100% Raw · Zero Watermark',
      description:
        'Generate extreme cinematic portraits, landscapes, and product visuals with DALL-E 3 grade prompt auto-expansion.',
      prompt:
        'Photo ekak hadanna futuristic cybernetic samurai in neon rain, wet asphalt reflections, volumetric smoke, 8K photorealism, cinematic film grain, Leica M6 50mm f/1.2 lens',
      mode: 'image' as MasterAiToolMode,
      icon: ImageIcon,
      gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
      borderGlow: 'hover:border-pink-500/40 hover:shadow-pink-500/10',
      iconColor: 'text-pink-400 bg-pink-500/15',
      badge: 'Auto-8K Mode',
    },
    {
      id: 'code-architect',
      title: 'Full-Stack Code Architect',
      subtitle: 'DeepSeek Coder & Groq LPU (~480 tok/s)',
      description:
        'Architect responsive React components, optimize database queries, build backend APIs, and debug complex stacks.',
      prompt:
        'Write an optimized, production-ready TypeScript React component with Tailwind CSS for a real-time analytics dashboard with dark mode and smooth animations.',
      mode: 'code' as MasterAiToolMode,
      icon: Code2,
      gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      borderGlow: 'hover:border-cyan-500/40 hover:shadow-cyan-500/10',
      iconColor: 'text-cyan-400 bg-cyan-500/15',
      badge: 'Instant LPU',
    },
    {
      id: 'virtual-tryon',
      title: 'Virtual Fashion Try-On',
      subtitle: 'Headless IDM-VTON · Identity Preserved',
      description:
        'Seamlessly fit custom garments and outfits onto reference photos using Master Cloud Dedicated GPU or Cloud vGPU.',
      action: onOpenTryOn,
      icon: Shirt,
      gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
      borderGlow: 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
      iconColor: 'text-indigo-400 bg-indigo-500/15',
      badge: '100% Headless',
    },
    {
      id: 'doc-intelligence',
      title: 'Drive Document Intelligence',
      subtitle: 'Master Cloud Storage & Local Disk RAG',
      description:
        'Extract key metrics, summarize PDFs, analyze source code, and query files from your PC or Master Cloud Drive.',
      action: onOpenFilePicker,
      icon: FolderOpen,
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderGlow: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
      iconColor: 'text-amber-400 bg-amber-500/15',
      badge: 'Context RAG',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-5xl mx-auto w-full select-none overflow-y-auto animate-in fade-in duration-500">
      {/* ─── HERO EMBLEM & GREETING ─── */}
      <div className="flex flex-col items-center text-center space-y-4 mb-8">
        {/* Animated Quantum Emblem */}
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 opacity-30 blur-xl group-hover:opacity-60 transition duration-1000 group-hover:duration-300" />
          <div className="relative h-20 w-20 rounded-2xl bg-zinc-950/80 border border-white/[0.12] backdrop-blur-2xl flex items-center justify-center shadow-2xl">
            <Sparkles className="h-10 w-10 text-cyan-400 animate-pulse" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />
          </div>
        </div>

        {/* Dynamic Greeting */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              Master AI Operating System
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {getGreeting()},{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              {userName}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-xl mx-auto leading-relaxed">
            What will we create today? Master AI integrates multimodal intelligence, 4K photorealism, and cloud computation in one sovereign workspace.
          </p>
        </div>

        {/* System Capability Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-[10px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300">
            <Cpu className="h-3 w-3 text-cyan-400" />
            <span>4,096 GB Unified vGPU</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300">
            <HardDrive className="h-3 w-3 text-purple-400" />
            <span>0 MB Local Download</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Zero Watermarks</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>100% Free & Unlimited</span>
          </div>
        </div>
      </div>

      {/* ─── 4 BENTO CAPABILITY CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
        {bentoCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => {
                if (card.action) {
                  card.action();
                } else if (card.prompt) {
                  onSelectPrompt(card.prompt, card.mode);
                }
              }}
              className={`group relative rounded-2xl bg-zinc-950/40 hover:bg-zinc-900/60 border border-white/[0.08] ${card.borderGlow} p-4 sm:p-5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl overflow-hidden flex flex-col justify-between`}
            >
              {/* Background Ambient Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />

              <div className="relative z-10 space-y-3">
                {/* Header: Icon + Badge + Arrow */}
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${card.iconColor} transition-transform group-hover:scale-105`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300">
                      {card.badge}
                    </span>
                    <div className="h-7 w-7 rounded-lg bg-white/[0.03] group-hover:bg-white/[0.1] flex items-center justify-center transition-colors">
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-cyan-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-[11px] font-mono text-muted-foreground/70 mt-0.5">
                    {card.subtitle}
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-1.5 leading-relaxed line-clamp-2">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Action Hint */}
              <div className="relative z-10 pt-3 mt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-muted-foreground/70 font-mono">
                <span>Click to launch directive</span>
                <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                  Launch →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── QUICK FOOTER PROMPTS ─── */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-[11px] font-mono text-muted-foreground/60 mr-1">
          Quick queries:
        </span>
        <button
          type="button"
          onClick={() => onSelectPrompt('Master Cloud එක ගැන කෙටියෙන් සිංහලෙන් කියන්න.')}
          className="px-3 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-muted-foreground hover:text-foreground text-[11px] transition-colors cursor-pointer"
        >
          සිංහල AI Copilot
        </button>
        <button
          type="button"
          onClick={() =>
            onSelectPrompt(
              'Photo ekak hadanna ultra realistic luxury sports car in neon Tokyo night, rain puddles, 8K, cinematic lighting'
            )
          }
          className="px-3 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-muted-foreground hover:text-foreground text-[11px] transition-colors cursor-pointer"
        >
          🎨 Neon Tokyo Supercar
        </button>
        <button
          type="button"
          onClick={() =>
            onSelectPrompt(
              'Create a modern Python script with asyncio for fast multi-threaded file hashing with Blake3 and SHA256'
            )
          }
          className="px-3 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-muted-foreground hover:text-foreground text-[11px] transition-colors cursor-pointer"
        >
          💻 Async Python Hasher
        </button>
      </div>
    </div>
  );
};
