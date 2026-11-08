import React, { useEffect, useState, useMemo } from 'react';
import {
  Film,
  Search,
  Clock,
  Star,
  Play,
  Trash2,
  X,
  Filter,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { mediaMetadataDb, MediaLibraryItem } from '@/services/mediaMetadataDb';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MediaLibraryModal() {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'duration'>('date');
  const [filterFav, setFilterFav] = useState(false);

  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);
  const loadUrl = useVideoPlayerStore((s) => s.loadUrl);
  const loadVideo = useVideoPlayerStore((s) => s.loadVideo);

  useEffect(() => {
    mediaMetadataDb.getAllMediaItems().then(setItems);
  }, []);

  const continueWatchingItems = useMemo(() => {
    return items.filter((item) => item.continueTime > 5 && (item.duration === 0 || item.continueTime < item.duration - 5));
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = items.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchFav = !filterFav || item.isFavorite;
      return matchSearch && matchFav;
    });

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'duration') return (b.duration || 0) - (a.duration || 0);
      return b.lastPlayed - a.lastPlayed;
    });

    return list;
  }, [items, searchQuery, sortBy, filterFav]);

  const handleToggleFav = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = await mediaMetadataDb.toggleFavorite(id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isFavorite: updated } : item)));
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await mediaMetadataDb.deleteMediaItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.info('Item removed from local library');
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[85vh] rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl text-white flex flex-col space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Media Library 2.0</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  IndexedDB
                </span>
              </div>
              <p className="text-xs text-white/50">Local video metadata, continue watching, and favorites</p>
            </div>
          </div>
          <button
            onClick={() => setActivePanel('none')}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search local videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterFav((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterFav
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${filterFav ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Favorites</span>
            </button>

            <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5 text-xs">
              {(['date', 'name', 'duration'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortBy(mode)}
                  className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-all ${
                    sortBy === mode ? 'bg-cyan-500 text-black font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Continue Watching Section */}
          {continueWatchingItems.length > 0 && !filterFav && !searchQuery && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>Continue Watching</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {continueWatchingItems.map((item) => {
                  const percent = item.duration > 0 ? (item.continueTime / item.duration) * 100 : 0;
                  return (
                    <div
                      key={item.id}
                      className="group relative rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all p-3 flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">
                            Resume at {formatDuration(item.continueTime)}
                          </span>
                          <span className="text-[10px] text-white/40">{formatBytes(item.size)}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate mt-1">{item.name}</h4>
                      </div>

                      <div className="mt-3 space-y-1">
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/40">
                          <span>{Math.round(percent)}% watched</span>
                          <span>{formatDuration(item.duration)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Videos Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Saved Videos ({filteredItems.length})
              </span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-white/40 space-y-2">
                <Film className="w-8 h-8 opacity-30" />
                <p className="text-xs">No media files in your local library yet.</p>
                <p className="text-[10px] text-white/30 max-w-xs">
                  Videos you open or add to the queue are automatically indexed here in browser IndexedDB.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all p-3 flex flex-col justify-between cursor-pointer space-y-3"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                        <Film className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleToggleFav(e, item.id)}
                          className="p-1 rounded text-white/40 hover:text-amber-400 transition-colors"
                          title="Favorite"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                          />
                        </button>
                        <button
                          onClick={(e) => handleDeleteItem(e, item.id)}
                          className="p-1 rounded text-white/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div>
                      <h4 className="text-xs font-bold text-white truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-white/50 mt-1">
                        <span>{formatBytes(item.size)}</span>
                        <span>{formatDuration(item.duration)}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                      <span>{new Date(item.lastPlayed).toLocaleDateString()}</span>
                      <span className="text-cyan-400 group-hover:underline font-semibold">Play Video</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
