import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Clock,
  Film,
  TrendingUp,
  Trash2,
  X,
  CheckCircle2,
  Calendar,
  Sparkles,
  Shield,
} from 'lucide-react';
import { analyticsService, AnalyticsSummary } from '@/services/analyticsService';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function formatDurationHms(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return '0m';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${Math.floor(totalSeconds % 60)}s`;
}

export function PlaybackAnalyticsModal() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsService.getSummary();
      setSummary(data);
    } catch {
      // safe fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your local playback analytics history?')) {
      await analyticsService.clearAllHistory();
      await loadData();
      toast.success('Playback analytics and viewing history cleared.');
    }
  };

  const maxDailyMinutes = summary
    ? Math.max(1, ...summary.dailyTrends.map((d) => d.watchMinutes))
    : 1;

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
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Playback Analytics & Viewing Trends
              </h2>
              <p className="text-xs text-white/50">
                Local-only metrics tracking watch duration, completion rates, and historical viewing habits.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 1. Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-white/40 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider">Watch Time</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-lg font-bold text-cyan-300 font-mono">
                {formatDurationHms(summary?.totalWatchTimeSeconds || 0)}
              </span>
              <span className="text-[10px] text-white/50 block mt-0.5">Cumulative playtime</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-white/40 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider">Sessions</span>
                <Film className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-lg font-bold text-purple-300 font-mono">
                {summary?.totalSessions || 0}
              </span>
              <span className="text-[10px] text-white/50 block mt-0.5">Total video plays</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-white/40 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider">Completion</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-lg font-bold text-emerald-300 font-mono">
                {summary?.averageCompletionRate || 0}%
              </span>
              <span className="text-[10px] text-white/50 block mt-0.5">Avg. completion rate</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-white/40 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider">Unique Files</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-lg font-bold text-amber-300 font-mono">
                {summary?.uniqueVideosCount || 0}
              </span>
              <span className="text-[10px] text-white/50 block mt-0.5">Distinct media items</span>
            </div>
          </div>

          {/* 2. 7-Day Viewing Trends Chart */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Calendar className="w-4 h-4 text-blue-400" />
                7-Day Activity Trends (Minutes Watched)
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 items-end h-28 pt-4">
              {summary?.dailyTrends.map((d) => {
                const heightPercent = Math.min(100, Math.max(10, (d.watchMinutes / maxDailyMinutes) * 100));
                return (
                  <div key={d.dateKey} className="flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] font-mono text-cyan-300">{d.watchMinutes}m</span>
                    <div className="w-full max-w-[28px] bg-white/10 rounded-t-lg overflow-hidden flex flex-col justify-end h-16">
                      <div
                        className="bg-gradient-to-t from-cyan-500 to-blue-500 w-full transition-all duration-300 rounded-t"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-white/50">{d.dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Most Watched Videos */}
          {summary && summary.mostWatchedVideos.length > 0 && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Most Watched Videos
              </div>
              <div className="space-y-1.5">
                {summary.mostWatchedVideos.map((item, idx) => (
                  <div
                    key={item.mediaId}
                    className="flex items-center justify-between p-2 rounded-lg bg-black/40 text-xs border border-white/5"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-white/40 font-mono text-[11px] w-4">#{idx + 1}</span>
                      <span className="font-semibold text-white truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-white/60">
                      <span>{item.playCount} plays</span>
                      <span className="text-cyan-300 font-bold">{formatDurationHms(item.totalWatchSeconds)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Recent Playback Sessions */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Clock className="w-4 h-4 text-cyan-400" />
                Recent Playback History
              </div>
              <span className="text-[10px] text-white/40">Last 10 sessions</span>
            </div>

            {summary?.recentSessions.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-4">No playback sessions logged yet.</p>
            ) : (
              <div className="space-y-1.5">
                {summary?.recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-black/40 text-xs border border-white/5"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Film className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span className="text-white/90 truncate">{session.videoName}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono text-white/50">
                      <span>{formatDurationHms(session.watchedSeconds)}</span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold">
                        {session.completionPercentage}%
                      </span>
                      <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Privacy Clearing */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>All analytics remain 100% local inside your browser sandbox.</span>
          </div>
          <Button
            onClick={handleClearHistory}
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Analytics History
          </Button>
        </div>
      </div>
    </div>
  );
}
