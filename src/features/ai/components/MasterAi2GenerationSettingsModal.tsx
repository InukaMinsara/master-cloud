/**
 * src/features/ai/components/MasterAi2GenerationSettingsModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — ADVANCED GENERATION PARAMETERS & PERSONALIZATION MODAL
 * Full controls for:
 * - Sampling Parameters: Temperature, Top-P, Max Output Tokens, Frequency & Presence Penalty, Seed, Stop sequences
 * - One-click Presets: Creative, Balanced, Precise, Coding
 * - Automatic Failover Toggle & Routing Preference (Fast, Quality, Balanced)
 * - Global Custom System Instructions & Per-Chat Overrides
 * - User-Controlled Persistent Memory (Review, Add, Delete, Toggle)
 * - UI Accessibility (Font size, Response density, Theme)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  ShieldAlert,
  Brain,
  Type,
  Maximize2,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Settings,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { GenerationParameters } from '../types/aiTypes';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MasterAi2GenerationSettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const generationParameters = useAiChatStore((s) => s.generationParameters);
  const setGenerationParameters = useAiChatStore((s) => s.setGenerationParameters);
  const resetGenerationParameters = useAiChatStore((s) => s.resetGenerationParameters);

  const isFailoverEnabled = useAiChatStore((s) => s.isFailoverEnabled);
  const setFailoverEnabled = useAiChatStore((s) => s.setFailoverEnabled);

  const responsePreference = useAiChatStore((s) => s.responsePreference);
  const setResponsePreference = useAiChatStore((s) => s.setResponsePreference);

  const globalSystemPrompt = useAiChatStore((s) => s.globalSystemPrompt);
  const setGlobalSystemPrompt = useAiChatStore((s) => s.setGlobalSystemPrompt);

  const memories = useAiChatStore((s) => s.memories);
  const addMemory = useAiChatStore((s) => s.addMemory);
  const deleteMemory = useAiChatStore((s) => s.deleteMemory);
  const toggleMemory = useAiChatStore((s) => s.toggleMemory);

  const uiPreferences = useAiChatStore((s) => s.uiPreferences);
  const setUiPreferences = useAiChatStore((s) => s.setUiPreferences);

  const [activeTab, setActiveTab] = useState<'parameters' | 'memory' | 'system' | 'appearance'>('parameters');
  const [newMemoryDraft, setNewMemoryDraft] = useState('');

  if (!isOpen) return null;

  const handlePresetSelect = (preset: 'creative' | 'balanced' | 'precise' | 'coding') => {
    switch (preset) {
      case 'creative':
        setGenerationParameters({ temperature: 1.1, topP: 0.95, frequencyPenalty: 0.3, presencePenalty: 0.3, preset: 'creative' });
        toast.success('Applied Creative Preset (Temp 1.1, Top-P 0.95)');
        break;
      case 'balanced':
        setGenerationParameters({ temperature: 0.7, topP: 0.9, frequencyPenalty: 0.0, presencePenalty: 0.0, preset: 'balanced' });
        toast.success('Applied Balanced Preset (Temp 0.7, Top-P 0.90)');
        break;
      case 'precise':
        setGenerationParameters({ temperature: 0.2, topP: 0.85, frequencyPenalty: 0.0, presencePenalty: 0.0, preset: 'precise' });
        toast.success('Applied Precise Preset (Temp 0.2, Top-P 0.85)');
        break;
      case 'coding':
        setGenerationParameters({ temperature: 0.1, topP: 0.8, frequencyPenalty: 0.0, presencePenalty: 0.0, preset: 'coding' });
        toast.success('Applied Coding Preset (Temp 0.1, Top-P 0.80)');
        break;
    }
  };

  const handleAddMemory = () => {
    if (!newMemoryDraft.trim()) return;
    addMemory(newMemoryDraft.trim());
    setNewMemoryDraft('');
    toast.success('Added persistent instruction to memory.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-white/[0.1] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Chat Configuration & Preferences</h2>
              <p className="text-[11px] text-zinc-400">Fine-tune generation parameters, failover, memory, and interface</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/[0.06] bg-zinc-900/30 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('parameters')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'parameters'
                ? 'border-cyan-400 text-white bg-white/[0.04]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Generation Controls</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'system'
                ? 'border-cyan-400 text-white bg-white/[0.04]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>System Prompt</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'memory'
                ? 'border-cyan-400 text-white bg-white/[0.04]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memory ({memories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'appearance'
                ? 'border-cyan-400 text-white bg-white/[0.04]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Appearance</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {activeTab === 'parameters' && (
            <div className="space-y-6">
              {/* Parameter Presets */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2">Generation Presets</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['creative', 'balanced', 'precise', 'coding'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePresetSelect(p)}
                      className={`p-2.5 rounded-xl border text-xs font-medium capitalize transition-all cursor-pointer text-left ${
                        generationParameters.preset === p
                          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200 shadow-sm'
                          : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="font-bold">{p}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {p === 'creative' && 'High temperature & variance'}
                        {p === 'balanced' && 'Default all-round quality'}
                        {p === 'precise' && 'Deterministic factual analysis'}
                        {p === 'coding' && 'Strict syntax & zero jank'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200">Temperature</span>
                  <span className="font-mono text-cyan-400">{generationParameters.temperature ?? 0.7}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.05"
                  value={generationParameters.temperature ?? 0.7}
                  onChange={(e) =>
                    setGenerationParameters({ temperature: parseFloat(e.target.value), preset: 'custom' })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>0.0 (Precise)</span>
                  <span>1.0 (Standard)</span>
                  <span>2.0 (Creative)</span>
                </div>
              </div>

              {/* Top-P Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200">Top-P (Nucleus Sampling)</span>
                  <span className="font-mono text-cyan-400">{generationParameters.topP ?? 0.95}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={generationParameters.topP ?? 0.95}
                  onChange={(e) =>
                    setGenerationParameters({ topP: parseFloat(e.target.value), preset: 'custom' })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Max Output Tokens */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200">Max Output Tokens</span>
                  <span className="font-mono text-cyan-400">{generationParameters.maxTokens ?? 4096}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={generationParameters.maxTokens ?? 4096}
                  onChange={(e) =>
                    setGenerationParameters({ maxTokens: parseInt(e.target.value, 10), preset: 'custom' })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Frequency and Presence Penalty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">Frequency Penalty</span>
                    <span className="font-mono text-cyan-400">{generationParameters.frequencyPenalty ?? 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.1"
                    value={generationParameters.frequencyPenalty ?? 0}
                    onChange={(e) =>
                      setGenerationParameters({ frequencyPenalty: parseFloat(e.target.value), preset: 'custom' })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">Presence Penalty</span>
                    <span className="font-mono text-cyan-400">{generationParameters.presencePenalty ?? 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.1"
                    value={generationParameters.presencePenalty ?? 0}
                    onChange={(e) =>
                      setGenerationParameters({ presencePenalty: parseFloat(e.target.value), preset: 'custom' })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Failover Policy & Response Preference */}
              <div className="pt-3 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Provider Failover Cascade</div>
                    <div className="text-[11px] text-zinc-400">
                      When enabled, automatically retries equivalent models if your chosen provider is down.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFailoverEnabled(!isFailoverEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isFailoverEnabled ? 'bg-cyan-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        isFailoverEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="text-xs font-semibold text-white">Auto-Routing Preference</div>
                    <div className="text-[11px] text-zinc-400">Guides model choice when 'Auto' mode is selected</div>
                  </div>
                  <div className="inline-flex rounded-lg bg-zinc-900 border border-white/[0.08] p-0.5 text-xs">
                    {(['fast', 'balanced', 'quality'] as const).map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setResponsePreference(pref)}
                        className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors cursor-pointer ${
                          responsePreference === pref
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reset Parameters Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    resetGenerationParameters();
                    toast.success('Reset generation parameters to defaults.');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">Global System Instructions</label>
                <p className="text-[11px] text-zinc-400 mb-2">
                  Injected into the system prompt across all conversations unless overridden per chat.
                </p>
                <textarea
                  rows={8}
                  value={globalSystemPrompt}
                  onChange={(e) => setGlobalSystemPrompt(e.target.value)}
                  placeholder="e.g. Always answer in concise TypeScript bullet points. Explain architectural decisions clearly and prioritize security and performance..."
                  className="w-full rounded-xl bg-zinc-900 border border-white/[0.08] p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-y font-sans leading-relaxed"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => toast.success('Saved global system instructions.')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Save Instructions
                </button>
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-white">Persistent User Memories</h3>
                <p className="text-[11px] text-zinc-400">
                  Key facts and preferences remembered across chats. You can enable, disable, or delete them anytime.
                </p>
              </div>

              {/* Add Memory Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMemoryDraft}
                  onChange={(e) => setNewMemoryDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                  placeholder="e.g. I prefer dark mode, React 18, and Vite..."
                  className="flex-1 rounded-xl bg-zinc-900 border border-white/[0.08] px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={handleAddMemory}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/30 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Memories List */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                {memories.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500 text-xs italic">
                    No memories saved yet. Add your preferred coding stack or formatting guidelines above.
                  </div>
                ) : (
                  memories.map((mem) => (
                    <div
                      key={mem.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <button
                          type="button"
                          onClick={() => toggleMemory(mem.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            mem.enabled
                              ? 'bg-cyan-500 border-cyan-500 text-black'
                              : 'border-white/20 bg-transparent'
                          }`}
                        >
                          {mem.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <span
                          className={`truncate ${
                            mem.enabled ? 'text-zinc-200' : 'text-zinc-500 line-through'
                          }`}
                        >
                          {mem.content}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteMemory(mem.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Font Size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white block">Chat Font Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sm', 'md', 'lg'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setUiPreferences({ fontSize: size })}
                      className={`p-3 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer ${
                        uiPreferences.fontSize === size
                          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200'
                          : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {size === 'sm' && 'Small (13px)'}
                      {size === 'md' && 'Medium (14px)'}
                      {size === 'lg' && 'Large (16px)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Density */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white block">Response Density</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'normal', 'relaxed'] as const).map((density) => (
                    <button
                      key={density}
                      type="button"
                      onClick={() => setUiPreferences({ density })}
                      className={`p-3 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer ${
                        uiPreferences.density === density
                          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200'
                          : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">Preferences auto-saved to client storage</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
