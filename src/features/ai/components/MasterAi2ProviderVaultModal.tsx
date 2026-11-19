/**
 * src/features/ai/components/MasterAi2ProviderVaultModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — UNIFIED MULTI-PROVIDER VAULT MODAL
 * Manages custom endpoints, API credentials, live connectivity testing,
 * model catalogue refreshes, and the strict Free-Only policy for:
 * 1. Groq (Text, Code, Reasoning)
 * 2. Pollinations AI (Image Generation & Editing)
 * 3. ComfyUI (Local Offline Generation)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  Zap,
  Sparkles,
  Cpu,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Lock,
  Globe,
  Settings2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { aiVaultService } from '../services/aiVaultService';
import { groqService } from '../services/groqService';
import { pollinationsService } from '../services/pollinationsService';
import { comfyUiService } from '../services/comfyUiService';
import { useAiChatStore } from '../stores/aiChatStore';
import { ProviderVaultConfig } from '../types/aiTypes';

export function MasterAi2ProviderVaultModal() {
  const isOpen = useAiChatStore((s) => s.isVaultModalOpen);
  const setIsOpen = useAiChatStore((s) => s.setIsVaultModalOpen);
  const activeTab = useAiChatStore((s) => s.activeVaultTab);

  const [tab, setTab] = useState<'groq' | 'pollinations' | 'comfyui' | 'policy'>('groq');
  const [vaultConfig, setVaultConfig] = useState<ProviderVaultConfig>(aiVaultService.getConfig());

  // Password visibility states
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showPollinationsKey, setShowPollinationsKey] = useState(false);
  const [showComfyKey, setShowComfyKey] = useState(false);

  // Testing states
  const [testingGroq, setTestingGroq] = useState(false);
  const [testingPollinations, setTestingPollinations] = useState(false);
  const [testingComfy, setTestingComfy] = useState(false);

  const [groqTestResult, setGroqTestResult] = useState<{ ok: boolean; latencyMs?: number; error?: string; modelCount?: number } | null>(null);
  const [pollinationsTestResult, setPollinationsTestResult] = useState<{ ok: boolean; latencyMs?: number; error?: string } | null>(null);
  const [comfyTestResult, setComfyTestResult] = useState<{ online: boolean; latencyMs?: number; error?: string; devices?: string[] } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVaultConfig(aiVaultService.getConfig());
      setTab(activeTab || 'groq');
      setGroqTestResult(null);
      setPollinationsTestResult(null);
      setComfyTestResult(null);
    }
  }, [isOpen, activeTab]);

  const handleTestGroq = async () => {
    setTestingGroq(true);
    setGroqTestResult(null);
    try {
      const res = await groqService.testConnection(vaultConfig.groqApiKey, vaultConfig.groqEndpoint);
      setGroqTestResult(res);
      if (res.ok) {
        toast.success(`Groq LPU Connected! Latency: ${res.latencyMs}ms (${res.modelCount || 0} models available)`);
        groqService.discoverActiveModels(true).catch(() => {});
      } else {
        toast.error(`Groq test failed: ${res.error}`);
      }
    } finally {
      setTestingGroq(false);
    }
  };

  const handleTestPollinations = async () => {
    setTestingPollinations(true);
    setPollinationsTestResult(null);
    try {
      const res = await pollinationsService.testConnection(vaultConfig.pollinationsApiKey, vaultConfig.pollinationsEndpoint);
      setPollinationsTestResult(res);
      if (res.ok) {
        toast.success(`Pollinations AI Connected! Latency: ${res.latencyMs}ms`);
        pollinationsService.fetchModels(true).catch(() => {});
      } else {
        toast.error(`Pollinations test failed: ${res.error}`);
      }
    } finally {
      setTestingPollinations(false);
    }
  };

  const handleTestComfy = async () => {
    setTestingComfy(true);
    setComfyTestResult(null);
    try {
      const res = await comfyUiService.testConnection(vaultConfig.comfyUiEndpoint, vaultConfig.comfyUiApiKey);
      setComfyTestResult(res);
      if (res.online) {
        toast.success(`Local ComfyUI Online! Latency: ${res.latencyMs}ms`);
      } else {
        toast.warning(res.error || 'ComfyUI is offline or unreachable at 127.0.0.1:8188');
      }
    } finally {
      setTestingComfy(false);
    }
  };

  const handleSave = () => {
    aiVaultService.updateConfig(vaultConfig);
    toast.success('AI Provider settings saved successfully!');
    setIsOpen(false);
  };

  const handleClearAll = () => {
    aiVaultService.clearAllCredentials();
    setVaultConfig(aiVaultService.getConfig());
    toast.info('All provider API credentials removed.');
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
      className="max-w-2xl bg-zinc-950/95 backdrop-blur-2xl border-white/[0.08] text-white p-6 rounded-2xl shadow-2xl overflow-hidden"
    >
      <DialogHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                MASTER AI Provider Vault
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Configure endpoints, API keys, and model parameters across conversational and visual engines.
              </DialogDescription>
            </div>
          </div>
        </div>
      </DialogHeader>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mt-4 mb-3 text-xs">
        <button
          type="button"
          onClick={() => setTab('groq')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            tab === 'groq'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Groq LPU</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('pollinations')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            tab === 'pollinations'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pollinations Image AI</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('comfyui')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            tab === 'comfyui'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Local ComfyUI</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('policy')}
          className={`py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            tab === 'policy'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Free-Only</span>
        </button>
      </div>

      {/* Security Architecture Notice */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-zinc-400 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Client Storage Security Notice</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          Credentials are stored in your browser client storage and sent directly over TLS to the verified provider endpoints. Client-side storage is isolated by the browser origin policy, but remains accessible to in-origin scripts.
        </p>
      </div>

      {/* Tab Panels */}
      <div className="py-3 space-y-4 min-h-[260px]">
        {/* ── TAB 1: GROQ ── */}
        {tab === 'groq' && (
          <div className="space-y-3.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Groq API Endpoint</span>
              <span className="text-[10px] font-mono text-zinc-500">Default: api.groq.com/openai/v1</span>
            </div>
            <input
              type="text"
              value={vaultConfig.groqEndpoint}
              onChange={(e) => setVaultConfig({ ...vaultConfig, groqEndpoint: e.target.value })}
              placeholder="https://api.groq.com/openai/v1"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Groq API Key (gsk_...)</span>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  value={vaultConfig.groqApiKey}
                  onChange={(e) => setVaultConfig({ ...vaultConfig, groqApiKey: e.target.value })}
                  placeholder="gsk_..."
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-zinc-400">
                {groqTestResult?.ok ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected ({groqTestResult.latencyMs}ms · {groqTestResult.modelCount || 0} models)
                  </span>
                ) : groqTestResult?.error ? (
                  <span className="text-red-400 text-[11px] font-mono">{groqTestResult.error}</span>
                ) : (
                  <span>Verify live connection to GroqCloud</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestGroq}
                disabled={testingGroq}
                className="h-8 text-xs border-white/10 hover:bg-white/[0.05]"
              >
                {testingGroq ? 'Pinging Groq...' : 'Test Connection'}
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB 2: POLLINATIONS AI ── */}
        {tab === 'pollinations' && (
          <div className="space-y-3.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Pollinations API Endpoint</span>
              <span className="text-[10px] font-mono text-zinc-500">Default: gen.pollinations.ai</span>
            </div>
            <input
              type="text"
              value={vaultConfig.pollinationsEndpoint}
              onChange={(e) => setVaultConfig({ ...vaultConfig, pollinationsEndpoint: e.target.value })}
              placeholder="https://gen.pollinations.ai"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Pollinations API Key (Bearer Secret)</span>
                <a
                  href="https://enter.pollinations.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Get Pollinations Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPollinationsKey ? 'text' : 'password'}
                  value={vaultConfig.pollinationsApiKey}
                  onChange={(e) => setVaultConfig({ ...vaultConfig, pollinationsApiKey: e.target.value })}
                  placeholder="Leave blank for free unauthenticated tier or enter key"
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPollinationsKey(!showPollinationsKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPollinationsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-zinc-400">
                {pollinationsTestResult?.ok ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected ({pollinationsTestResult.latencyMs}ms)
                  </span>
                ) : pollinationsTestResult?.error ? (
                  <span className="text-red-400 text-[11px] font-mono">{pollinationsTestResult.error}</span>
                ) : (
                  <span>Verify connection & model catalogue</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestPollinations}
                disabled={testingPollinations}
                className="h-8 text-xs border-white/10 hover:bg-white/[0.05]"
              >
                {testingPollinations ? 'Pinging Pollinations...' : 'Test Connection'}
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB 3: COMFYUI LOCAL ── */}
        {tab === 'comfyui' && (
          <div className="space-y-3.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Local ComfyUI Endpoint</span>
              <span className="text-[10px] font-mono text-zinc-500">Default: http://127.0.0.1:8188</span>
            </div>
            <input
              type="text"
              value={vaultConfig.comfyUiEndpoint}
              onChange={(e) => setVaultConfig({ ...vaultConfig, comfyUiEndpoint: e.target.value })}
              placeholder="http://127.0.0.1:8188"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">ComfyUI Gateway Key (Optional)</span>
                <span className="text-[10px] font-mono text-zinc-500">Only if reverse-proxy auth is used</span>
              </div>
              <div className="relative">
                <input
                  type={showComfyKey ? 'text' : 'password'}
                  value={vaultConfig.comfyUiApiKey}
                  onChange={(e) => setVaultConfig({ ...vaultConfig, comfyUiApiKey: e.target.value })}
                  placeholder="Optional authentication token"
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowComfyKey(!showComfyKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showComfyKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-zinc-400">
                {comfyTestResult?.online ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Online ({comfyTestResult.latencyMs}ms)
                  </span>
                ) : comfyTestResult?.error ? (
                  <span className="text-amber-400 text-[11px] font-mono">{comfyTestResult.error}</span>
                ) : (
                  <span>Check local daemon status</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestComfy}
                disabled={testingComfy}
                className="h-8 text-xs border-white/10 hover:bg-white/[0.05]"
              >
                {testingComfy ? 'Checking ComfyUI...' : 'Check Status'}
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB 4: STRICT FREE-ONLY SYSTEM ── */}
        {tab === 'policy' && (
          <div className="space-y-4 animate-in fade-in text-xs">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-emerald-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Strict Free-Only Policy</span>
                </div>
                <input
                  type="checkbox"
                  id="freeOnlySwitch"
                  checked={vaultConfig.freeOnly}
                  onChange={(e) => setVaultConfig({ ...vaultConfig, freeOnly: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                When enabled, MASTER AI blocks all paid or unverified-pricing models, disables automatic paid fallback, and prevents surprise API charges.
              </p>
            </div>

            <div className="space-y-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-semibold text-white">Block Paid Models</div>
                  <div className="text-[11px] text-zinc-400">Prevent executing models marked with paid status</div>
                </div>
                <input
                  type="checkbox"
                  checked={vaultConfig.blockPaid}
                  onChange={(e) => setVaultConfig({ ...vaultConfig, blockPaid: e.target.checked })}
                  className="w-4 h-4 accent-orange-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-white/[0.04]">
                <div>
                  <div className="font-semibold text-white">Automatic Paid Fallback</div>
                  <div className="text-[11px] text-zinc-400">Automatically switch to a paid model if free is busy (default: DISABLED)</div>
                </div>
                <input
                  type="checkbox"
                  checked={vaultConfig.autoPaidFallback}
                  onChange={(e) => setVaultConfig({ ...vaultConfig, autoPaidFallback: e.target.checked })}
                  className="w-4 h-4 accent-orange-500 rounded"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Credentials</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
