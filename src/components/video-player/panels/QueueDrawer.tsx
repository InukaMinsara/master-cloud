import React, { useRef, useState } from 'react';
import {
  ListVideo,
  Play,
  Trash2,
  ArrowUp,
  ArrowDown,
  Shuffle,
  Repeat,
  Repeat1,
  Plus,
  X,
  Film,
  Check,
} from 'lucide-react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function QueueDrawer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const queue = useVideoPlayerStore((s) => s.queue);
  const currentQueueIndex = useVideoPlayerStore((s) => s.currentQueueIndex);
  const repeatMode = useVideoPlayerStore((s) => s.repeatMode);
  const isShuffled = useVideoPlayerStore((s) => s.isShuffled);

  const addToQueue = useVideoPlayerStore((s) => s.addToQueue);
  const removeFromQueue = useVideoPlayerStore((s) => s.removeFromQueue);
  const clearQueue = useVideoPlayerStore((s) => s.clearQueue);
  const reorderQueue = useVideoPlayerStore((s) => s.reorderQueue);
  const playQueueItem = useVideoPlayerStore((s) => s.playQueueItem);
  const setRepeatMode = useVideoPlayerStore((s) => s.setRepeatMode);
  const toggleShuffle = useVideoPlayerStore((s) => s.toggleShuffle);
  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    addToQueue(fileArray);
    toast.success(`Added ${fileArray.length} video${fileArray.length > 1 ? 's' : ''} to queue`);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleShuffle = () => {
    toggleShuffle();
    toast.info(!isShuffled ? 'Shuffle turned on' : 'Shuffle turned off');
  };

  const cycleRepeatMode = () => {
    if (repeatMode === 'off') {
      setRepeatMode('all');
      toast.info('Repeat queue (all)');
    } else if (repeatMode === 'all') {
      setRepeatMode('one');
      toast.info('Repeat current video (one)');
    } else {
      setRepeatMode('off');
      toast.info('Repeat disabled');
    }
  };

  const handleClearQueue = () => {
    if (queue.length === 0) return;
    clearQueue();
    toast.success('Queue cleared');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('video/') || /\.(mp4|mkv|webm|mov|avi|flv|wmv|m4v)$/i.test(file.name)
    );
    if (droppedFiles.length > 0) {
      addToQueue(droppedFiles);
      toast.success(`Added ${droppedFiles.length} video${droppedFiles.length > 1 ? 's' : ''} to queue`);
    } else if (e.dataTransfer.files.length > 0) {
      toast.error('Please drop valid video files');
    }
  };

  return (
    <div
      data-controls="true"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="absolute inset-y-0 right-0 z-40 w-80 sm:w-96 bg-zinc-950/90 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl text-white select-none animate-in slide-in-from-right duration-200"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*"
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-2 z-50 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-md border-2 border-dashed border-cyan-400 rounded-2xl animate-in fade-in duration-150 pointer-events-none">
          <Film className="w-10 h-10 text-cyan-400 mb-2 animate-bounce" />
          <span className="text-sm font-semibold text-cyan-200">Drop videos to add to queue</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-zinc-950/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <ListVideo className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Playback Queue</h3>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-white/10 text-white/70 border border-white/10">
                {queue.length}
              </span>
            </div>
            <p className="text-[11px] text-white/50">Manage upcoming videos</p>
          </div>
        </div>
        <button
          onClick={() => setActivePanel('none')}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Close Queue"
          aria-label="Close queue drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Queue Controls Bar */}
      <div className="flex items-center justify-between gap-1.5 px-4 py-2.5 border-b border-white/10 bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Shuffle Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleShuffle}
            title={isShuffled ? 'Shuffle: On' : 'Shuffle: Off'}
            className={`h-7 px-2.5 text-xs gap-1.5 rounded-lg transition-colors border ${
              isShuffled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Shuffle</span>
          </Button>

          {/* Repeat Mode Cycle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cycleRepeatMode}
            title={`Repeat: ${repeatMode.toUpperCase()}`}
            className={`h-7 px-2.5 text-xs gap-1.5 rounded-lg transition-colors border ${
              repeatMode !== 'off'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-3.5 h-3.5 text-cyan-300" />
            ) : (
              <Repeat className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px] font-medium capitalize">{repeatMode}</span>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Add Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 px-2 text-xs gap-1 bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 rounded-lg"
            title="Add Local Videos"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">Add</span>
          </Button>

          {/* Clear Queue Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearQueue}
            disabled={queue.length === 0}
            title="Clear Queue"
            className="h-7 w-7 p-0 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 2 & 5. Queue List or Empty State */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-1.5">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none min-h-[260px]">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-cyan-400 shadow-inner">
              <Film className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Queue is empty</h4>
            <p className="text-xs text-white/50 max-w-[220px] mb-4 leading-relaxed">
              Queue is empty. Add videos or drag and drop files to create a playlist.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 rounded-xl gap-1.5 text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Local Videos</span>
            </Button>
          </div>
        ) : (
          queue.map((item, index) => {
            const isPlaying = index === currentQueueIndex;

            return (
              <div
                key={item.id}
                onClick={() => playQueueItem(index)}
                className={`group/item flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-white shadow-sm shadow-cyan-950/40'
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/15 text-white/80'
                }`}
              >
                {/* Index / Status Indicator */}
                <div className="w-6 shrink-0 flex items-center justify-center">
                  {isPlaying ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-white/40 group-hover/item:hidden">
                      #{index + 1}
                    </span>
                  )}
                  {!isPlaying && (
                    <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 hidden group-hover/item:block transition-all" />
                  )}
                </div>

                {/* Name & Size */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-xs font-medium truncate ${
                        isPlaying ? 'text-cyan-300 font-semibold' : 'text-white/90'
                      }`}
                      title={item.name}
                    >
                      {item.name}
                    </p>
                    {isPlaying && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 text-cyan-400 bg-cyan-400/10 rounded font-semibold shrink-0 border border-cyan-400/20">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        Now
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/40 font-mono">
                    <span>{formatBytes(item.size)}</span>
                  </div>
                </div>

                {/* Actions: Reorder & Remove */}
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => reorderQueue(index, index - 1)}
                    disabled={index === 0}
                    title="Move up"
                    aria-label={`Move ${item.name} up`}
                    className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderQueue(index, index + 1)}
                    disabled={index === queue.length - 1}
                    title="Move down"
                    aria-label={`Move ${item.name} down`}
                    className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeFromQueue(item.id);
                      toast.info(`Removed "${item.name}" from queue`);
                    }}
                    title="Remove from queue"
                    aria-label={`Remove ${item.name} from queue`}
                    className="p-1 rounded text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Bottom Footer: Add to Queue */}
      <div className="p-3 border-t border-white/10 bg-zinc-950/80 shrink-0">
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-9 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs gap-2 rounded-xl shadow-lg shadow-cyan-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Local Videos</span>
        </Button>
      </div>
    </div>
  );
}
