import React, { useState, useMemo } from 'react';
import {
  Brain,
  Search,
  Sparkles,
  Info,
  Tag,
  Clock,
  Play,
  X,
  FileText,
  Activity,
  HardDrive,
  Monitor,
} from 'lucide-react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import {
  generateLocalVideoSummary,
  extractDetailedMediaMetadata,
  extractTranscriptKeywords,
  searchTranscriptCues,
} from '@/services/videoIntelligence';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoIntelligenceModal({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  const [searchQuery, setSearchQuery] = useState('');

  const videoFile = useVideoPlayerStore((s) => s.videoFile);
  const fileName = useVideoPlayerStore((s) => s.fileName);
  const duration = useVideoPlayerStore((s) => s.duration);
  const subtitleTracks = useVideoPlayerStore((s) => s.subtitleTracks);
  const activeSubtitleTrackId = useVideoPlayerStore((s) => s.activeSubtitleTrackId);
  const detectedScenes = useVideoPlayerStore((s) => s.detectedScenes);

  const setCurrentTime = useVideoPlayerStore((s) => s.setCurrentTime);
  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);

  const activeTrack = subtitleTracks.find((t) => t.id === activeSubtitleTrackId) || subtitleTracks[0];
  const cues = activeTrack?.cues || [];

  // Summary
  const summary = useMemo(() => {
    return generateLocalVideoSummary(fileName || 'Video', duration, cues, detectedScenes);
  }, [fileName, duration, cues, detectedScenes]);

  // Keywords
  const keywords = useMemo(() => {
    return extractTranscriptKeywords(cues, 16);
  }, [cues]);

  // Search results
  const searchResults = useMemo(() => {
    return searchTranscriptCues(cues, searchQuery);
  }, [cues, searchQuery]);

  // Technical metadata
  const techMeta = useMemo(() => {
    if (videoRef.current) {
      return extractDetailedMediaMetadata(videoRef.current, videoFile);
    }
    return null;
  }, [videoRef, videoFile]);

  const jumpToCue = (start: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = start;
      setCurrentTime(start);
      toast.info(`Jumped to ${formatTimestamp(start)}`);
    }
  };

  return (
    <div
      data-controls="true"
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl text-white max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Video Intelligence & Insights
              </h2>
              <p className="text-xs text-white/50">
                Local-first metadata inspection, transcript keyword extraction, dialogue search, and summaries.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePanel('none')}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 1. Technical Inspector Cards */}
          {techMeta && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/40 block uppercase tracking-wider font-semibold">
                  Resolution
                </span>
                <span className="text-sm font-bold text-cyan-300 font-mono">
                  {techMeta.resolution || 'Probing…'}
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">{techMeta.aspectRatio}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/40 block uppercase tracking-wider font-semibold">
                  Est. Bitrate
                </span>
                <span className="text-sm font-bold text-emerald-300 font-mono">
                  {techMeta.estimatedBitrateKbps > 0
                    ? `${techMeta.estimatedBitrateKbps.toLocaleString()} kbps`
                    : 'N/A'}
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">{techMeta.container} container</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/40 block uppercase tracking-wider font-semibold">
                  File Size
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  {techMeta.fileSize > 0 ? formatBytes(techMeta.fileSize) : 'Local blob'}
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">
                  {Math.round(techMeta.duration)}s duration
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/40 block uppercase tracking-wider font-semibold">
                  Speech Rate
                </span>
                <span className="text-sm font-bold text-purple-300 font-mono">
                  {summary.wordsPerMinute} WPM
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">
                  {summary.totalWords} spoken words
                </span>
              </div>
            </div>
          )}

          {/* 2. Content Summary */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Content Summary & Dialogue Overview
            </div>
            <p className="text-xs text-white/70 leading-relaxed">{summary.summaryText}</p>
          </div>

          {/* 3. Keyword Cloud */}
          {keywords.length > 0 && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Tag className="w-4 h-4 text-cyan-400" />
                Extracted Transcript Keywords
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {keywords.map((kw) => (
                  <button
                    key={kw.word}
                    onClick={() => setSearchQuery(kw.word)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <span>#{kw.word}</span>
                    <span className="text-[10px] bg-cyan-500/30 px-1 rounded-full">{kw.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Transcript Search */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Search className="w-4 h-4 text-emerald-400" />
                Dialogue & Transcript Full-Text Search
              </div>
              {cues.length > 0 && (
                <span className="text-[10px] text-white/50">{cues.length} total cues</span>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search spoken dialogue (e.g. 'welcome', 'feature', 'cloud')…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-black/50 border border-white/15 focus:border-cyan-400 text-white outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-white/40 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <div className="text-center py-4 text-xs text-white/40">
                    No dialogue matches found for &quot;{searchQuery}&quot;.
                  </div>
                ) : (
                  searchResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => jumpToCue(res.cue.start)}
                      className="group flex items-center justify-between p-2 rounded-lg bg-black/40 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="font-mono text-[11px] text-cyan-300 shrink-0">
                          {formatTimestamp(res.cue.start)}
                        </span>
                        <span className="text-white/80 truncate">{res.snippet}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-cyan-300 opacity-0 group-hover:opacity-100"
                      >
                        <Play className="w-2.5 h-2.5 mr-1 fill-current" /> Jump
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
