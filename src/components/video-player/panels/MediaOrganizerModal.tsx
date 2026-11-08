import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FolderSync,
  Copy,
  AlertTriangle,
  Tag,
  Folder,
  Trash2,
  X,
  CheckCircle2,
  Filter,
  Sparkles,
  HardDrive,
  Film,
  Upload,
  Loader2,
} from 'lucide-react';
import { mediaMetadataDb, MediaLibraryItem, DuplicateGroup } from '@/services/mediaMetadataDb';
import {
  identifyDuplicateMedia,
  computeMediaChunkHash,
  probeMediaHealth,
  guessMediaCategory,
  MEDIA_CATEGORIES,
  MediaCategory,
} from '@/services/mediaOrganizer';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function MediaOrganizerModal() {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'duplicates' | 'categories' | 'health'>('duplicates');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tagInput, setTagInput] = useState<{ [itemId: string]: string }>({});
  const [isScanning, setIsScanning] = useState(false);
  const fileScanRef = useRef<HTMLInputElement>(null);

  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);

  const loadItems = async () => {
    const list = await mediaMetadataDb.getAllMediaItems();
    setItems(list);
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Compute duplicate groups
  const duplicates = useMemo(() => {
    return identifyDuplicateMedia(items);
  }, [items]);

  const totalWastedBytes = useMemo(() => {
    return duplicates.reduce((acc, curr) => {
      // Wasted size is total size minus 1 copy
      const singleCopySize = curr.items[0]?.size || 0;
      return acc + (curr.totalSize - singleCopySize);
    }, 0);
  }, [duplicates]);

  // Compute health issues
  const corruptItems = useMemo(() => {
    return items.filter((item) => item.isCorrupt || (item.size > 0 && item.duration === 0));
  }, [items]);

  // Filtered category items
  const categorizedItems = useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter((item) => (item.category || 'Uncategorized') === selectedCategory);
  }, [items, selectedCategory]);

  const handleSetCategory = async (itemId: string, cat: string) => {
    await mediaMetadataDb.updateMediaMetadata(itemId, { category: cat });
    await loadItems();
    toast.success(`Category updated to "${cat}"`);
  };

  const handleAddTag = async (itemId: string) => {
    const text = (tagInput[itemId] || '').trim().replace(/^#/, '');
    if (!text) return;
    const item = items.find((i) => i.id === itemId);
    const existingTags = item?.tags || [];
    if (!existingTags.includes(text)) {
      const nextTags = [...existingTags, text];
      await mediaMetadataDb.updateMediaMetadata(itemId, { tags: nextTags });
      await loadItems();
      setTagInput((prev) => ({ ...prev, [itemId]: '' }));
      toast.success(`Added tag #${text}`);
    }
  };

  const handleRemoveTag = async (itemId: string, tagToRemove: string) => {
    const item = items.find((i) => i.id === itemId);
    const nextTags = (item?.tags || []).filter((t) => t !== tagToRemove);
    await mediaMetadataDb.updateMediaMetadata(itemId, { tags: nextTags });
    await loadItems();
  };

  const handleRemoveItem = async (id: string) => {
    await mediaMetadataDb.removeMediaItem(id);
    await loadItems();
    toast.success('Media record removed from library.');
  };

  const handleScanFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsScanning(true);
    toast.info(`Scanning ${files.length} video files for duplicates & health…`);

    for (const f of files) {
      try {
        const hash = await computeMediaChunkHash(f);
        const health = await probeMediaHealth(f);
        const category = guessMediaCategory(f.name, health.duration);
        await mediaMetadataDb.saveMediaItem({
          id: `${f.name}_${f.size}`,
          name: f.name,
          size: f.size,
          duration: health.duration || 0,
          resolution: health.width && health.height ? `${health.width}×${health.height}` : undefined,
          lastPlayed: Date.now(),
          continueTime: 0,
          isFavorite: false,
          collections: ['Local Videos'],
          hash,
          category,
          isCorrupt: !health.isReadable,
        });
      } catch (err) {
        console.warn('Scan file error:', err);
      }
    }

    await loadItems();
    setIsScanning(false);
    toast.success(`Successfully scanned and indexed ${files.length} videos!`);
    if (fileScanRef.current) fileScanRef.current.value = '';
  };

  return (
    <div
      data-controls="true"
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
    >
      <input
        ref={fileScanRef}
        type="file"
        multiple
        accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.m4v,.flv,.wmv"
        className="hidden"
        onChange={handleScanFiles}
      />
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl text-white max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Smart Media Organizer
              </h2>
              <p className="text-xs text-white/50">
                Detect duplicate video files, monitor media health, organize categories, and curate custom tags.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="gradient"
              size="sm"
              onClick={() => fileScanRef.current?.click()}
              disabled={isScanning}
              className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 shadow-md shadow-cyan-500/10"
            >
              {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {isScanning ? 'Scanning…' : 'Scan Files for Duplicates'}
            </Button>
            <button
              onClick={() => setActivePanel('none')}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('duplicates')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'duplicates'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicates ({duplicates.length})
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'categories'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            Categories & Tags
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'health'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Media Health ({corruptItems.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* TAB 1: DUPLICATES */}
          {activeTab === 'duplicates' && (
            <div className="space-y-3">
              {duplicates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-white/50 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <p className="text-xs font-semibold text-white">No duplicate media files detected!</p>
                  <p className="text-[11px] text-white/40">
                    Your media library has clean, deduplicated file entries.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-xs">
                    <span className="text-cyan-200">
                      Identified {duplicates.length} duplicate cluster{duplicates.length > 1 ? 's' : ''}
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      Redundant space: {formatBytes(totalWastedBytes)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {duplicates.map((group, gIdx) => (
                      <div
                        key={gIdx}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                          <span className="flex items-center gap-1.5">
                            <Copy className="w-3.5 h-3.5 text-cyan-400" />
                            Cluster #{gIdx + 1} ({group.items.length} copies)
                          </span>
                          <span className="text-[11px] font-mono text-white/50">
                            {formatBytes(group.items[0]?.size || 0)} each
                          </span>
                        </div>

                        <div className="space-y-1">
                          {group.items.map((it, idx) => (
                            <div
                              key={it.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-black/40 text-xs border border-white/5"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Film className="w-3.5 h-3.5 text-white/40 shrink-0" />
                                <span className="text-white/90 truncate">{it.name}</span>
                                {idx === 0 && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-white/40 font-mono">
                                  {new Date(it.lastPlayed).toLocaleDateString()}
                                </span>
                                {idx > 0 && (
                                  <button
                                    onClick={() => handleRemoveItem(it.id)}
                                    className="p-1 rounded text-red-400 hover:bg-red-500/10"
                                    title="Remove duplicate record"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: CATEGORIES & TAGS */}
          {activeTab === 'categories' && (
            <div className="space-y-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {MEDIA_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-cyan-500 text-black font-bold'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {categorizedItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-white/40">
                    No videos in category &quot;{selectedCategory}&quot;.
                  </div>
                ) : (
                  categorizedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 truncate">
                          <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="font-bold text-white truncate">{item.name}</span>
                        </div>

                        {/* Category Selector */}
                        <select
                          value={item.category || 'Uncategorized'}
                          onChange={(e) => handleSetCategory(item.id, e.target.value)}
                          className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-cyan-300 outline-none"
                        >
                          {MEDIA_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                            <option key={c} value={c} className="bg-zinc-900 text-white">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {(item.tags || []).map((t) => (
                          <span
                            key={t}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-cyan-300 text-[11px]"
                          >
                            #{t}
                            <button
                              onClick={() => handleRemoveTag(item.id, t)}
                              className="hover:text-red-400 ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}

                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Add tag…"
                            value={tagInput[item.id] || ''}
                            onChange={(e) =>
                              setTagInput((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag(item.id);
                              }
                            }}
                            className="w-20 px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[11px] text-white outline-none"
                          />
                          <button
                            onClick={() => handleAddTag(item.id)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold px-1"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA HEALTH */}
          {activeTab === 'health' && (
            <div className="space-y-3">
              {corruptItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-white/50 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <p className="text-xs font-semibold text-white">All media files healthy!</p>
                  <p className="text-[11px] text-white/40">
                    No unreadable duration headers or corrupted stream indices detected.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
                    Found {corruptItems.length} file{corruptItems.length > 1 ? 's' : ''} with incomplete
                    or unreadable duration metadata.
                  </div>

                  {corruptItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold text-white block truncate">{item.name}</span>
                          <span className="text-[10px] text-white/50">
                            {formatBytes(item.size)} • Missing duration header
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10"
                        title="Remove corrupted entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
