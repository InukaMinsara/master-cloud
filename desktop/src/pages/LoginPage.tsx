import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Cloud, Shield } from 'lucide-react';

interface Props { onLogin: () => void; }

export function LoginPage({ onLogin }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError]     = useState('');

  async function handleOAuth(provider: string) {
    setLoading(provider);
    setError('');
    try {
      await invoke('cmd_start_oauth', { provider });
      // After the browser OAuth completes, deep link triggers Rust handler
      // which stores session and changes auth state.
      // Poll for auth state change:
      let attempts = 0;
      const check = setInterval(async () => {
        attempts++;
        const status: any = await invoke('cmd_get_auth_status');
        if (status.status === 'logged_in') {
          clearInterval(check);
          onLogin();
        }
        if (attempts > 60) { clearInterval(check); setLoading(null); }
      }, 1000);
    } catch (e: any) {
      setError(e?.toString() ?? 'Login failed');
      setLoading(null);
    }
  }

  return (
    <div className="flex h-screen bg-[#0f172a] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <img src="/logo-icon.svg" alt="Master Cloud" className="h-16 w-16 mx-auto" />
          <h1 className="text-3xl font-black text-white">MASTER CLOUD</h1>
          <p className="text-slate-400 text-sm">Sign in to mount your 10 TB cloud drive</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {[
            { id: 'google', label: 'Continue with Google',    bg: 'hover:bg-slate-700', emoji: '🔵' },
            { id: 'github', label: 'Continue with GitHub',    bg: 'hover:bg-slate-700', emoji: '⚫' },
            { id: 'azure',  label: 'Continue with Microsoft', bg: 'hover:bg-slate-700', emoji: '🟦' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => handleOAuth(p.id)}
              disabled={!!loading}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-800 ${p.bg} border border-slate-700 text-white font-semibold transition-all disabled:opacity-50`}
            >
              {loading === p.id
                ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="text-xl">{p.emoji}</span>
              }
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
          <Shield className="h-3.5 w-3.5" />
          Your browser opens for secure authentication. Tokens stored in Windows Credential Manager.
        </div>
      </div>
    </div>
  );
}
