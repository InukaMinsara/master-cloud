/**
 * src/features/ai/components/MasterAi2CompareView.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — DUAL-MODEL SIDE-BY-SIDE COMPARATIVE WORKBENCH
 * Run one prompt across two models concurrently and compare output quality,
 * reasoning depth, and latency in real time.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Zap,
  ArrowRight,
  Columns2,
  Send,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { unifiedModelEngine } from '../services/unifiedModelEngine';
import { ModelFamilyLogo } from './ModelFamilyLogo';
import { MasterAi2Markdown } from './MasterAi2Markdown';
import { toast } from 'sonner';

export function MasterAi2CompareView() {
  const unifiedModels = useAiChatStore((s) => s.unifiedModels);
  const selectedModelId = useAiChatStore((s) => s.selectedModelId);
  const compareModelId = useAiChatStore((s) => s.compareModelId);
  const setComparisonMode = useAiChatStore((s) => s.setComparisonMode);
  const setCompareModelId = useAiChatStore((s) => s.setCompareModelId);
  const setSelectedModelId = useAiChatStore((s) => s.setSelectedModelId);

  const [prompt, setPrompt] = useState('');
  const [modelA, setModelA] = useState(selectedModelId);
  const [modelB, setModelB] = useState(compareModelId || 'meta-llama/llama-3.3-70b-versatile');

  const [responseA, setResponseA] = useState('');
  const [responseB, setResponseB] = useState('');
  const [metricsA, setMetricsA] = useState<{ tokSec?: number; latencyMs?: number }>({});
  const [metricsB, setMetricsB] = useState<{ tokSec?: number; latencyMs?: number }>({});
  const [isEvaluating, setIsEvaluating] = useState(false);

  const abortCtrlRef = useRef<AbortController | null>(null);

  const handleRunComparison = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isEvaluating) return;

    setIsEvaluating(true);
    setResponseA('');
    setResponseB('');
    setMetricsA({});
    setMetricsB({});

    const abortCtrl = new AbortController();
    abortCtrlRef.current = abortCtrl;

    const messages = [{ role: 'user' as const, content: prompt.trim() }];

    const startA = performance.now();
    const startB = performance.now();

    // Concurrently stream both models
    const taskA = unifiedModelEngine
      .streamChat({
        model: modelA,
        messages,
        signal: abortCtrl.signal,
        onChunk: (_c, full) => setResponseA(full),
        onMetrics: (m) =>
          setMetricsA({
            tokSec: m.tokensPerSec,
            latencyMs: Math.round(performance.now() - startA),
          }),
      })
      .catch((err) => {
        if (!abortCtrl.signal.aborted) setResponseA(`[Model A Error: ${err.message}]`);
      });

    const taskB = unifiedModelEngine
      .streamChat({
        model: modelB,
        messages,
        signal: abortCtrl.signal,
        onChunk: (_c, full) => setResponseB(full),
        onMetrics: (m) =>
          setMetricsB({
            tokSec: m.tokensPerSec,
            latencyMs: Math.round(performance.now() - startB),
          }),
      })
      .catch((err) => {
        if (!abortCtrl.signal.aborted) setResponseB(`[Model B Error: ${err.message}]`);
      });

    await Promise.allSettled([taskA, taskB]);
    setIsEvaluating(false);
    abortCtrlRef.current = null;
  };

  const handleClose = () => {
    if (abortCtrlRef.current) abortCtrlRef.current.abort();
    setComparisonMode(false);
  };

  const modelAObj = unifiedModels.find((m) => m.id === modelA);
  const modelBObj = unifiedModels.find((m) => m.id === modelB);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.08] bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <Columns2 className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-bold text-white">Multi-Model Comparative Workbench</h2>
          <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/[0.08]">
            Side-by-Side Evaluation
          </span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit Comparison</span>
        </button>
      </div>

      {/* Model Selectors Bar */}
      <div className="grid grid-cols-2 gap-4 px-6 py-2.5 bg-black/40 border-b border-white/[0.04]">
        {/* Model A Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-orange-400 font-mono">Model A:</span>
          <select
            value={modelA}
            onChange={(e) => {
              setModelA(e.target.value);
              setSelectedModelId(e.target.value);
            }}
            className="flex-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer truncate"
          >
            {unifiedModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.contextBadge || '128k'})
              </option>
            ))}
          </select>
          <ModelFamilyLogo modelId={modelA} size={16} />
        </div>

        {/* Model B Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-cyan-400 font-mono">Model B:</span>
          <select
            value={modelB}
            onChange={(e) => {
              setModelB(e.target.value);
              setCompareModelId(e.target.value);
            }}
            className="flex-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer truncate"
          >
            {unifiedModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.contextBadge || '128k'})
              </option>
            ))}
          </select>
          <ModelFamilyLogo modelId={modelB} size={16} />
        </div>
      </div>

      {/* Dual Column Output Timeline */}
      <div className="flex-1 grid grid-cols-2 divide-x divide-white/[0.06] overflow-hidden">
        {/* Model A Results */}
        <div className="flex flex-col h-full overflow-hidden p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-xs">
            <span className="font-bold text-white truncate max-w-[200px]">
              {modelAObj?.name || modelA}
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
              {metricsA.tokSec && (
                <span className="text-orange-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {metricsA.tokSec} tok/s
                </span>
              )}
              {metricsA.latencyMs && <span>{metricsA.latencyMs}ms</span>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {responseA ? (
              <MasterAi2Markdown content={responseA} isStreaming={isEvaluating} />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
                Awaiting comparison prompt...
              </div>
            )}
          </div>
        </div>

        {/* Model B Results */}
        <div className="flex flex-col h-full overflow-hidden p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-xs">
            <span className="font-bold text-white truncate max-w-[200px]">
              {modelBObj?.name || modelB}
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
              {metricsB.tokSec && (
                <span className="text-cyan-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {metricsB.tokSec} tok/s
                </span>
              )}
              {metricsB.latencyMs && <span>{metricsB.latencyMs}ms</span>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {responseB ? (
              <MasterAi2Markdown content={responseB} isStreaming={isEvaluating} />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
                Awaiting comparison prompt...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Concurrent Prompt Input Bar */}
      <div className="p-4 bg-zinc-900/80 border-t border-white/[0.08]">
        <form onSubmit={handleRunComparison} className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt to compare both models simultaneously..."
            disabled={isEvaluating}
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500 placeholder-zinc-500"
          />
          <button
            type="submit"
            disabled={isEvaluating || !prompt.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
          >
            {isEvaluating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Evaluate</span>
          </button>
        </form>
      </div>
    </div>
  );
}
