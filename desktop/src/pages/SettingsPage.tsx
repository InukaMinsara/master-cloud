import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface AppSettings {
  drive_letter: string; storage_mode: string;
  cache_path: string; cache_limit_gb: number;
  start_on_boot: boolean; notifications: boolean;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    invoke<AppSettings>('cmd_get_settings').then(setSettings).catch(() => {});
  }, []);

  async function save() {
    if (!settings) return;
    await invoke('cmd_save_settings', { settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return <div className="p-8 text-slate-400">Loading…</div>;

  return (
    <div className="p-8 max-w-lg space-y-6">
      <h1 className="text-2xl font-black text-white">Settings</h1>

      <div className="space-y-4">
        <label className="block">
          <div className="text-sm font-semibold text-slate-300 mb-1">Drive Letter</div>
          <select value={settings.drive_letter}
            onChange={e => setSettings({ ...settings, drive_letter: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm">
            {['M','N','O','P'].map(l => <option key={l} value={l}>{l}:</option>)}
          </select>
        </label>

        <label className="block">
          <div className="text-sm font-semibold text-slate-300 mb-1">Storage Mode</div>
          <select value={settings.storage_mode}
            onChange={e => setSettings({ ...settings, storage_mode: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm">
            <option value="stream">Stream (0-byte local)</option>
            <option value="mirror">Mirror (full local copy)</option>
            <option value="hybrid">Hybrid (smart cache)</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm font-semibold text-slate-300 mb-1">Cache Limit (GB)</div>
          <input type="number" min={1} max={500} value={settings.cache_limit_gb}
            onChange={e => setSettings({ ...settings, cache_limit_gb: parseInt(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" />
        </label>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800 border border-slate-700">
          <div>
            <div className="text-sm font-semibold text-white">Start with Windows</div>
            <div className="text-xs text-slate-400 mt-0.5">Auto-mount on login</div>
          </div>
          <button onClick={() => setSettings({ ...settings, start_on_boot: !settings.start_on_boot })}
            className={`w-12 h-6 rounded-full transition-colors ${settings.start_on_boot ? 'bg-blue-500' : 'bg-slate-600'} flex items-center px-1`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.start_on_boot ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      <button onClick={save}
        className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
