import React, { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Folder, File, HardDrive, Cloud, UploadCloud, RefreshCw,
  ChevronRight, Star, Clock, Share2, Wifi, WifiOff, Settings,
  Download, Trash2, Copy, Scissors, Info, Pin, PinOff,
} from 'lucide-react';

interface FileMeta {
  id: string; parent_id: string | null; name: string; is_dir: boolean;
  size: number; mtime: string | null; sync_state: string;
  is_pinned: boolean; is_offline: boolean;
}

interface DriveStatus { status: string; letter?: string; }
interface SyncStatus  { mode: string; is_paused: boolean; upload_queue: number; download_queue: number; }

export function DriveBrowser() {
  const [files, setFiles]           = useState<FileMeta[]>([]);
  const [parentId, setParentId]     = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Master Cloud' }]);
  const [drive, setDrive]           = useState<DriveStatus>({ status: 'unmounted' });
  const [sync, setSync]             = useState<SyncStatus | null>(null);
  const [selected, setSelected]     = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileMeta } | null>(null);
  const [loading, setLoading]       = useState(false);

  const loadDir = useCallback(async (pid: string | null) => {
    setLoading(true);
    try {
      const result = await invoke<FileMeta[]>('cmd_list_dir', { parentId: pid });
      setFiles(result);
    } catch { setFiles([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDir(parentId);
    invoke<DriveStatus>('cmd_get_drive_status').then(setDrive).catch(() => {});
    invoke<SyncStatus>('cmd_get_sync_status').then(setSync).catch(() => {});
  }, [parentId, loadDir]);

  // Refresh every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      loadDir(parentId);
      invoke<SyncStatus>('cmd_get_sync_status').then(setSync).catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
  }, [parentId, loadDir]);

  function navigate(item: FileMeta) {
    if (!item.is_dir) return;
    setParentId(item.id);
    setBreadcrumbs(prev => [...prev, { id: item.id, name: item.name }]);
    setSelected([]);
  }

  function navigateTo(id: string | null, index: number) {
    setParentId(id);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setSelected([]);
  }

  async function handleDelete(id: string) {
    await invoke('cmd_delete_item', { id });
    loadDir(parentId);
  }

  async function handlePinOffline(id: string, pin: boolean) {
    await invoke(pin ? 'cmd_pin_offline' : 'cmd_unpin_offline', { id });
    loadDir(parentId);
  }

  async function handleCreateFolder() {
    const name = prompt('New folder name:');
    if (!name) return;
    await invoke('cmd_create_folder', { parentId, name });
    loadDir(parentId);
  }

  function stateIcon(state: string, isOffline: boolean, isPinned: boolean) {
    if (isPinned)            return <span title="Pinned offline" className="text-blue-400">📌</span>;
    if (isOffline)           return <span title="Available offline" className="text-emerald-400">✅</span>;
    if (state === 'syncing') return <div className="h-3 w-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />;
    if (state === 'cloud_only') return <Cloud className="h-3 w-3 text-slate-500" />;
    return null;
  }

  function formatSize(bytes: number) {
    if (bytes === 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden" onClick={() => setContextMenu(null)}>
      {/* Sidebar */}
      <div className="w-56 bg-[#0f1e38] border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-2">
          <img src="/logo-icon.svg" alt="" className="h-7 w-7" />
          <span className="font-black text-sm text-white">MASTER CLOUD</span>
        </div>

        {/* Drive Status Badge */}
        <div className={`mx-3 mb-3 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
          drive.status === 'mounted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
        }`}>
          <HardDrive className="h-3.5 w-3.5" />
          {drive.status === 'mounted' ? `Drive ${drive.letter}: Mounted` : 'Drive Unmounted'}
        </div>

        {/* Nav */}
        {[
          { icon: Cloud, label: 'My Drive',        id: null },
          { icon: Share2, label: 'Shared with Me', id: 'vroot:Shared_with_me' },
          { icon: Star,  label: 'Starred',          id: 'vroot:Starred' },
          { icon: Clock, label: 'Recent',           id: 'vroot:Recent' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => { setParentId(item.id); setBreadcrumbs([{ id: item.id, name: item.label }]); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors w-full ${
              parentId === item.id ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Sync Status */}
        {sync && (
          <div className="px-3 pb-3 space-y-1.5 text-[11px]">
            <div className="text-slate-600 font-bold uppercase tracking-wide px-1">Sync</div>
            <div className="flex items-center gap-2 text-slate-400">
              {sync.is_paused ? <WifiOff className="h-3 w-3 text-amber-400" /> : <Wifi className="h-3 w-3 text-emerald-400" />}
              {sync.is_paused ? 'Paused' : `${sync.upload_queue}↑ ${sync.download_queue}↓`}
            </div>
            <div className="text-slate-500 capitalize px-1">Mode: {sync.mode}</div>
          </div>
        )}

        {/* Settings */}
        <button
          className="flex items-center gap-2 px-4 py-3 text-slate-500 hover:text-white text-xs border-t border-slate-800 transition-colors"
          onClick={() => window.location.hash = '#settings'}
        >
          <Settings className="h-3.5 w-3.5" /> Settings
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-[#0f172a]">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
                <button
                  onClick={() => navigateTo(crumb.id, i)}
                  className={`text-sm font-semibold truncate transition-colors ${
                    i === breadcrumbs.length - 1 ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <button onClick={handleCreateFolder} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            <Folder className="h-3.5 w-3.5" /> New Folder
          </button>
          <button onClick={() => loadDir(parentId)} className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-auto">
          {files.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Cloud className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">This folder is empty</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-500 uppercase tracking-wide">
                  <th className="text-left py-2 px-4 font-semibold">Name</th>
                  <th className="text-left py-2 px-4 font-semibold">Size</th>
                  <th className="text-left py-2 px-4 font-semibold">Modified</th>
                  <th className="text-right py-2 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {files.map(item => (
                  <tr
                    key={item.id}
                    onDoubleClick={() => navigate(item)}
                    onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item }); }}
                    onClick={e => {
                      if (e.ctrlKey) {
                        setSelected(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]);
                      } else {
                        setSelected([item.id]);
                      }
                    }}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      selected.includes(item.id) ? 'bg-blue-600/10' : ''
                    }`}
                  >
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2.5">
                        {item.is_dir
                          ? <Folder className="h-4 w-4 text-amber-400 shrink-0" />
                          : <File   className="h-4 w-4 text-slate-400 shrink-0" />
                        }
                        <span className="truncate max-w-xs font-medium text-slate-200">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-slate-500 text-xs">{item.is_dir ? '—' : formatSize(item.size)}</td>
                    <td className="py-2 px-4 text-slate-500 text-xs">{item.mtime ? new Date(item.mtime).toLocaleDateString() : '—'}</td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {stateIcon(item.sync_state, item.is_offline, item.is_pinned)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl py-1 w-56 text-sm"
          onClick={e => e.stopPropagation()}
        >
          {[
            { label: 'Open', icon: Folder, action: () => navigate(contextMenu.item) },
            { label: 'Download', icon: Download, action: () => {} },
            { label: 'Share', icon: Share2, action: () => {} },
            null,
            { label: contextMenu.item.is_pinned ? 'Make Online Only' : 'Make Available Offline', icon: contextMenu.item.is_pinned ? PinOff : Pin, action: () => handlePinOffline(contextMenu.item.id, !contextMenu.item.is_pinned) },
            null,
            { label: 'Rename', icon: Copy, action: () => {} },
            { label: 'Move', icon: Scissors, action: () => {} },
            { label: 'Details', icon: Info, action: () => {} },
            null,
            { label: 'Delete', icon: Trash2, action: () => handleDelete(contextMenu.item.id), danger: true },
          ].map((item, i) =>
            item === null ? (
              <div key={i} className="border-t border-slate-700/60 my-1" />
            ) : (
              <button
                key={item.label}
                onClick={() => { item.action(); setContextMenu(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-700/60 transition-colors text-left ${
                  (item as any).danger ? 'text-red-400' : 'text-slate-300'
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
