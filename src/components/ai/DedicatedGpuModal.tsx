/**
 * src/components/ai/DedicatedGpuModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — DEDICATED GPU (OPTION A) CONNECTION & LAUNCHER MODAL
 * 100% Private Cloud GPU backend for Master Cloud.
 * Connects to Google Colab, Kaggle, or private servers running:
 * `scripts/master_cloud_gpu_backend.py` via FastAPI & Cloudflare Tunnel.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Server,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  Terminal,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { dedicatedGpuService, DedicatedGpuStatus } from '@/services/ai/dedicatedGpuBackend';
import { toast } from 'sonner';

interface DedicatedGpuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: DedicatedGpuStatus) => void;
}

export const DedicatedGpuModal: React.FC<DedicatedGpuModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [backendUrl, setBackendUrl] = useState(() => dedicatedGpuService.getBackendUrl());
  const [status, setStatus] = useState<DedicatedGpuStatus>({ online: false, url: '' });
  const [isChecking, setIsChecking] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const colabScriptOneLiner = `!pip install -q fastapi uvicorn pyngrok diffusers transformers torch torchvision accelerate
!curl -sSL https://raw.githubusercontent.com/InukaMinsara/master-cloud/master/scripts/master_colab_launcher.py | python`;

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  const checkConnection = async (customUrl?: string) => {
    const urlToTest = customUrl !== undefined ? customUrl : backendUrl;
    setIsChecking(true);
    if (customUrl !== undefined) {
      dedicatedGpuService.setBackendUrl(urlToTest);
    }
    try {
      const res = await dedicatedGpuService.checkHealth();
      setStatus(res);
      if (onStatusChange) onStatusChange(res);
      if (res.online) {
        toast.success(`Dedicated GPU Connected: ${res.gpuName || 'Tesla GPU'}`);
      }
    } catch {
      setStatus({ online: false, url: urlToTest });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveAndConnect = () => {
    const clean = backendUrl.trim().replace(/\/+$/, '');
    dedicatedGpuService.setBackendUrl(clean);
    checkConnection(clean);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(colabScriptOneLiner);
    setCopiedCode(true);
    toast.success('Colab launcher script copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-zinc-950/95 border border-white/[0.1] shadow-2xl p-5 sm:p-6 space-y-5 relative">
        {/* Subtle Ambient Top Rim Glow */}
        <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                  Master Dedicated GPU Engine
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                  Option A
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/80">
                Connect your private Tesla T4/A100 Cloud GPU backend (FastAPI / Cloudflare)
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

        {/* Status Card */}
        <div
          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
            status.online
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-white/[0.03] border-white/[0.08] text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {status.online ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-zinc-500 shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>{status.online ? 'Dedicated GPU is Online' : 'No Dedicated GPU Connected'}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    status.online
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {status.online ? '100% Private' : 'Fallback to vGPU'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {status.online
                  ? `${status.gpuName || 'Tesla GPU'} · ${status.freeVramGb || 15} GB / ${status.totalVramGb || 16} GB VRAM Available`
                  : 'Master AI will automatically route through Master Cloud Unified vGPU.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => checkConnection()}
            disabled={isChecking}
            className="h-8 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 border border-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="text-[11px]">Test</span>
          </button>
        </div>

        {/* Input URL Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center justify-between">
            <span>FastAPI Server / Cloudflare Tunnel URL</span>
            <span className="text-[10px] font-mono text-zinc-500">e.g. https://xxx.trycloudflare.com</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="https://your-tunnel.trycloudflare.com or http://127.0.0.1:8000"
              className="flex-1 h-10 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] focus:border-cyan-500/50 text-xs font-mono text-foreground placeholder:text-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveAndConnect}
              disabled={isChecking}
              className="h-10 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isChecking ? 'Connecting...' : 'Save & Link'}
            </button>
          </div>
        </div>

        {/* One-Click Google Colab Launch Script */}
        <div className="space-y-2 pt-1 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span>Launch your own Free Tesla T4 GPU in Google Colab</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
          <div className="relative rounded-2xl bg-black/60 border border-white/[0.06] p-3 text-left font-mono text-[11px] text-zinc-300 overflow-x-auto space-y-1">
            <div className="text-zinc-500 select-none"># 1. Open Google Colab (Runtime &gt; Change runtime type &gt; T4 GPU)</div>
            <div className="text-zinc-500 select-none"># 2. Paste and run this one-liner command:</div>
            <div className="text-cyan-300 font-semibold select-all pt-1">
              {colabScriptOneLiner}
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
            Zero laptop battery drain · 16 GB Tesla GPU RAM in cloud · Zero Hugging Face needed · Zero watermarks.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            100% Sovereign API
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-foreground text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
