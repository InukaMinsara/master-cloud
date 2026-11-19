/**
 * src/features/ai/components/MasterAi2KeyModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI 2.0 — SECURE GROQ API KEY CONFIGURATION MODAL
 * Encrypted client storage, live connectivity test with millisecond latency ping.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { Key, Shield, ExternalLink, Check, Eye, EyeOff, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { groqService } from '../services/groqService';
import { useAiChatStore } from '../stores/aiChatStore';

export function MasterAi2KeyModal() {
  const isOpen = useAiChatStore((s) => s.isKeyModalOpen);
  const setIsOpen = useAiChatStore((s) => s.setIsKeyModalOpen);

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latencyMs?: number; error?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(groqService.getApiKey());
      setTestResult(null);
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a Groq API key first.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await groqService.testConnection(apiKey);
      setTestResult(res);
      if (res.ok) {
        toast.success(`Groq LPU Connected! Latency: ${res.latencyMs}ms`);
      } else {
        toast.error(`Connection failed: ${res.error}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    groqService.setApiKey(apiKey);
    toast.success('Groq API Key saved successfully!');
    setIsOpen(false);
  };

  const handleClear = () => {
    groqService.setApiKey('');
    setApiKey('');
    setTestResult(null);
    toast.info('Groq API Key removed.');
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      className="max-w-md bg-zinc-950/95 backdrop-blur-2xl border-white/[0.08] text-white p-6 rounded-2xl shadow-2xl"
    >
      <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Groq LPU Engine Key Vault
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Connect your personal 100% Free Groq API Key for ultra-fast LPU inference.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Instructions Box */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-300 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zero-Telemetry Client Storage</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Your API key is stored exclusively in your browser&apos;s local storage. It is never sent to any intermediary server and communicates strictly with <code className="text-cyan-300 font-mono">api.groq.com</code>.
            </p>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 transition-colors pt-1"
            >
              <span>Get Free Key at console.groq.com/keys</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Key Input Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Groq API Key (starts with gsk_)</label>
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="gsk_..."
                className="w-full h-10 px-3 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-zinc-400 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Test Connection Button & Indicator */}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isTesting || !apiKey.trim()}
              onClick={handleTestConnection}
              className="h-8 text-xs font-medium border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-200"
            >
              {isTesting ? (
                <>
                  <Activity className="w-3.5 h-3.5 mr-1.5 animate-spin text-orange-400" />
                  <span>Pinging Groq LPU...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                  <span>Test Connection</span>
                </>
              )}
            </Button>

            {testResult && (
              <div
                className={`text-[11px] font-mono flex items-center gap-1.5 ${
                  testResult.ok ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {testResult.ok ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Connected ({testResult.latencyMs}ms)</span>
                  </>
                ) : (
                  <span>Failed</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          {groqService.hasApiKey() ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-9 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              Remove Key
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-9 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="h-9 px-4 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
            >
              Save Key
            </Button>
          </div>
        </div>
    </Dialog>
  );
}
