/**
 * src/features/ai/components/MasterAi2KeyboardShortcutsModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — KEYBOARD SHORTCUTS PALETTE
 * Windows 11 Fluent design shortcuts guide for high-velocity power users.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect } from 'react';
import { X, Command, Keyboard, Zap, Sparkles, Navigation } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  icon: React.ReactNode;
  shortcuts: ShortcutItem[];
}

export function MasterAi2KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: ShortcutCategory[] = [
    {
      title: 'Chat & Composition',
      icon: <Zap className="w-4 h-4 text-orange-400" />,
      shortcuts: [
        { keys: ['Enter'], description: 'Send message / trigger generation' },
        { keys: ['Shift', 'Enter'], description: 'Insert new line in composer' },
        { keys: ['↑ (Up Arrow)'], description: 'Recall previous prompt from history (when input is empty)' },
        { keys: ['↓ (Down Arrow)'], description: 'Navigate forward through prompt history' },
        { keys: ['Esc'], description: 'Halt / abort streaming AI response' },
      ],
    },
    {
      title: 'Workspace & Navigation',
      icon: <Navigation className="w-4 h-4 text-cyan-400" />,
      shortcuts: [
        { keys: ['Ctrl', 'N'], description: 'Start new chat conversation' },
        { keys: ['Ctrl', 'B'], description: 'Toggle conversation sidebar' },
        { keys: ['Ctrl', '/'], description: 'Open this keyboard shortcuts palette' },
        { keys: ['Esc'], description: 'Close modals & fullscreen lightbox' },
      ],
    },
    {
      title: 'Image Studio & Media',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      shortcuts: [
        { keys: ['/image <prompt>'], description: 'Prefix prompt in chat to force image generation' },
        { keys: ['Drag & Drop'], description: 'Drop images onto composer to attach reference image' },
        { keys: ['Click Image'], description: 'Open high-resolution fullscreen lightbox' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-2xl bg-zinc-950/95 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Keyboard Shortcuts
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">
                  Master AI 2.0
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Accelerate your workflow with quick keyboard navigation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-zinc-800">
          {categories.map((cat, idx) => (
            <div key={idx} className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                {cat.icon}
                <span>{cat.title}</span>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
                {cat.shortcuts.map((sc, sIdx) => (
                  <div
                    key={sIdx}
                    className="px-3.5 py-2.5 flex items-center justify-between text-xs gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-zinc-300">{sc.description}</span>
                    <div className="flex items-center gap-1 shrink-0 font-mono">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-[11px] text-zinc-200 font-semibold shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-zinc-900/50 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">Esc</kbd> anytime to dismiss</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
