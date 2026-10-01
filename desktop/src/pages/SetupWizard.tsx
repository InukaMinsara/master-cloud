import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Cloud, Shield, HardDrive, Zap, Layers, Monitor } from 'lucide-react';

type Step = 'welcome' | 'signin' | 'drive_letter' | 'storage_mode' | 'cache' | 'startup' | 'mounting' | 'done';

interface Props { onComplete: () => void; }

const PREFERRED_LETTERS = ['M', 'N', 'O', 'P'];
const STORAGE_MODES = [
  {
    id: 'stream',
    icon: Zap,
    title: 'Stream Mode',
    badge: 'Default · 0-byte local',
    desc: 'Browse your full 10 TB in File Explorer without using local disk space. Files are streamed on demand.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
  },
  {
    id: 'mirror',
    icon: Monitor,
    title: 'Mirror Mode',
    badge: 'Full local copy',
    desc: 'Keep selected files/folders both locally and in the cloud. Changes sync bidirectionally.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  {
    id: 'hybrid',
    icon: Layers,
    title: 'Hybrid Mode',
    badge: 'Smart cache',
    desc: 'Frequently used files are kept local. Everything else stays cloud-only until needed.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
  },
];

export function SetupWizard({ onComplete }: Props) {
  const [step, setStep]               = useState<Step>('welcome');
  const [driveLetter, setDriveLetter] = useState('M');
  const [storageMode, setStorageMode] = useState('stream');
  const [cacheLimitGb, setCacheLimitGb] = useState(5);
  const [startOnBoot, setStartOnBoot] = useState(true);
  const [mountError, setMountError]   = useState('');
  const [mounting, setMounting]       = useState(false);

  async function handleMount() {
    setMounting(true);
    setMountError('');
    setStep('mounting');
    try {
      await invoke('cmd_save_settings', {
        settings: {
          drive_letter:   driveLetter,
          storage_mode:   storageMode,
          cache_path:     '',
          cache_limit_gb: cacheLimitGb,
          start_on_boot:  startOnBoot,
          notifications:  true,
        }
      });
      await invoke('cmd_mount_drive', { letter: driveLetter });
      setStep('done');
    } catch (e: any) {
      setMountError(e?.toString() ?? 'Mount failed');
      setStep('drive_letter');
    } finally {
      setMounting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const steps: Step[] = ['welcome','signin','drive_letter','storage_mode','cache','startup','mounting'];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="flex h-screen bg-[#0f172a]">
      {/* Sidebar */}
      <div className="w-64 bg-[#0f1e38] border-r border-slate-800 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <img src="/logo-icon.svg" alt="Master Cloud" className="h-9 w-9" />
          <span className="font-black text-base text-white tracking-tight">MASTER CLOUD</span>
        </div>
        <div className="space-y-1 flex-1">
          {[
            ['welcome',      'Welcome'],
            ['signin',       'Sign In'],
            ['drive_letter', 'Drive Letter'],
            ['storage_mode', 'Storage Mode'],
            ['cache',        'Cache'],
            ['startup',      'Startup'],
            ['mounting',     'Mount Drive'],
          ].map(([id, label], i) => {
            const current = steps.indexOf(step);
            const idx     = steps.indexOf(id as Step);
            const done    = idx < current;
            const active  = id === step;
            return (
              <div key={id} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                active ? 'bg-blue-600 text-white font-bold'
                : done  ? 'text-emerald-400'
                : 'text-slate-500'
              }`}>
                <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                  active ? 'bg-white/20' : done ? 'bg-emerald-500/20' : 'bg-slate-700'
                }`}>{done ? '✓' : i + 1}</span>
                {label}
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-slate-600 mt-4">Master Cloud v1.0.0</div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {step === 'welcome' && (
          <div className="max-w-lg text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-blue-600/20 flex items-center justify-center">
              <Cloud className="h-10 w-10 text-blue-400" />
            </div>
            <h1 className="text-4xl font-black text-white">Welcome to<br />Master Cloud</h1>
            <p className="text-slate-400 leading-relaxed">
              Your 10 TB cloud will appear directly inside Windows File Explorer as a real drive.
              Let's set it up in a few steps.
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {[['🚀','Stream Mode','0-byte local disk'],['🔒','Encrypted','Zero-trust security'],['⚡','Fast','Metadata-first']].map(([icon, t, d]) => (
                <div key={t} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="font-bold text-white">{t}</div>
                  <div className="text-slate-400">{d}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep('signin')}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">
              Get Started →
            </button>
          </div>
        )}

        {step === 'signin' && (
          <div className="max-w-sm w-full space-y-4">
            <h2 className="text-2xl font-black text-white text-center">Sign In</h2>
            <p className="text-slate-400 text-sm text-center">
              Your browser will open for secure authentication.
              No password is stored in the app.
            </p>
            {[
              { id: 'google', label: 'Continue with Google', emoji: '🔵' },
              { id: 'github', label: 'Continue with GitHub', emoji: '⚫' },
              { id: 'azure',  label: 'Continue with Microsoft', emoji: '🟦' },
            ].map(provider => (
              <button
                key={provider.id}
                onClick={() => {
                  invoke('cmd_start_oauth', { provider: provider.id });
                  // OAuth callback will trigger deep link → auth state change
                  setTimeout(() => setStep('drive_letter'), 2000);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold transition-colors"
              >
                <span className="text-xl">{provider.emoji}</span>
                {provider.label}
              </button>
            ))}
            <div className="text-[11px] text-slate-500 text-center">
              Tokens stored securely in Windows Credential Manager. Never on disk.
            </div>
          </div>
        )}

        {step === 'drive_letter' && (
          <div className="max-w-sm w-full space-y-6">
            <h2 className="text-2xl font-black text-white text-center">Choose Drive Letter</h2>
            <p className="text-slate-400 text-sm text-center">Master Cloud will appear as this drive in File Explorer.</p>
            {mountError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{mountError}</div>}
            <div className="grid grid-cols-4 gap-3">
              {PREFERRED_LETTERS.map(l => (
                <button
                  key={l}
                  onClick={() => setDriveLetter(l)}
                  className={`h-16 rounded-2xl text-2xl font-black border-2 transition-all ${
                    driveLetter === l
                      ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {l}:
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <HardDrive className="h-4 w-4" />
              MASTER CLOUD ({driveLetter}:) will appear in This PC
            </div>
            <button onClick={() => setStep('storage_mode')}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">
              Continue →
            </button>
          </div>
        )}

        {step === 'storage_mode' && (
          <div className="max-w-lg w-full space-y-4">
            <h2 className="text-2xl font-black text-white text-center">Storage Mode</h2>
            <div className="space-y-3">
              {STORAGE_MODES.map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setStorageMode(mode.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      storageMode === mode.id ? mode.bg + ' border-opacity-100' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${mode.color}`} />
                      <span className="font-bold text-white">{mode.title}</span>
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${mode.color} bg-current/10 border border-current/20`}>
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1 pl-8">{mode.desc}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('drive_letter')} className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-400 hover:text-white transition-colors">← Back</button>
              <button onClick={() => setStep('cache')} className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">Continue →</button>
            </div>
          </div>
        )}

        {step === 'cache' && (
          <div className="max-w-sm w-full space-y-6">
            <h2 className="text-2xl font-black text-white text-center">Local Cache</h2>
            <p className="text-slate-400 text-sm text-center">
              How much local disk space should Master Cloud use for caching?
              Never silently fills your drive.
            </p>
            <div className="space-y-3">
              {[2, 5, 10, 20, 50].map(gb => (
                <button
                  key={gb}
                  onClick={() => setCacheLimitGb(gb)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    cacheLimitGb === gb ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="font-bold">{gb} GB</span>
                  {gb === 5 && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Recommended</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('storage_mode')} className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-400 hover:text-white transition-colors">← Back</button>
              <button onClick={() => setStep('startup')} className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">Continue →</button>
            </div>
          </div>
        )}

        {step === 'startup' && (
          <div className="max-w-sm w-full space-y-6">
            <h2 className="text-2xl font-black text-white text-center">Start with Windows</h2>
            <p className="text-slate-400 text-sm text-center">
              When enabled, Master Cloud starts automatically when you log in
              so your drive is always available.
            </p>
            <div
              onClick={() => setStartOnBoot(!startOnBoot)}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                startOnBoot ? 'border-blue-500 bg-blue-600/10' : 'border-slate-700 bg-slate-800'
              }`}
            >
              <div>
                <div className="font-bold text-white">Start with Windows</div>
                <div className="text-xs text-slate-400 mt-0.5">Recommended for best experience</div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${startOnBoot ? 'bg-blue-500' : 'bg-slate-600'} flex items-center px-1`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${startOnBoot ? 'translate-x-6' : ''}`} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('cache')} className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-400 hover:text-white transition-colors">← Back</button>
              <button onClick={handleMount} className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">
                Mount Drive →
              </button>
            </div>
          </div>
        )}

        {step === 'mounting' && (
          <div className="text-center space-y-6">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-blue-600/20 flex items-center justify-center">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
            <h2 className="text-2xl font-black text-white">Mounting Drive…</h2>
            <p className="text-slate-400">MASTER CLOUD ({driveLetter}:) is being mounted via WinFsp.</p>
            <p className="text-slate-400 text-sm">Check This PC in File Explorer in a moment.</p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-6 max-w-sm">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-emerald-600/20 flex items-center justify-center text-4xl">✅</div>
            <h2 className="text-2xl font-black text-white">You're all set!</h2>
            <p className="text-slate-400 leading-relaxed">
              <strong className="text-white">MASTER CLOUD ({driveLetter}:)</strong> is now mounted in Windows File Explorer.
              Open <em>This PC</em> to start browsing your 10 TB.
            </p>
            <button
              onClick={onComplete}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
            >
              Open Master Cloud →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
