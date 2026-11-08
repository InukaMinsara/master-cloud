/**
 * MASTER CLOUD - Playback Analytics Engine
 * Tracks watch duration, completion rates, playback trends,
 * and empowers users with full history control and privacy clearing.
 */

import { mediaMetadataDb, PlaybackSessionLog } from './mediaMetadataDb';

export interface AnalyticsSummary {
  totalWatchTimeSeconds: number;
  totalSessions: number;
  uniqueVideosCount: number;
  averageCompletionRate: number;
  mostWatchedVideos: {
    mediaId: string;
    name: string;
    playCount: number;
    totalWatchSeconds: number;
  }[];
  recentSessions: PlaybackSessionLog[];
  dailyTrends: {
    dayLabel: string;
    dateKey: string;
    watchMinutes: number;
  }[];
}

class PlaybackAnalyticsService {
  /**
   * Records a playback session chunk or completion checkpoint
   */
  async recordSession(
    mediaId: string,
    videoName: string,
    watchedSeconds: number,
    duration: number,
  ): Promise<void> {
    if (watchedSeconds <= 1 || isNaN(watchedSeconds)) return;

    const completionPercentage =
      duration > 0 ? Math.min(100, Math.round((watchedSeconds / duration) * 100)) : 0;

    const log: PlaybackSessionLog = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mediaId,
      videoName: videoName || 'Video',
      timestamp: Date.now(),
      watchedSeconds: Math.round(watchedSeconds),
      completionPercentage,
      duration: Math.round(duration),
    };

    await mediaMetadataDb.recordPlaybackSession(log);
    await mediaMetadataDb.incrementPlayCount(mediaId, Math.round(watchedSeconds));
  }

  /**
   * Computes an aggregate analytics report for the dashboard
   */
  async getSummary(): Promise<AnalyticsSummary> {
    const sessions = await mediaMetadataDb.getAllPlaybackSessions();
    const mediaItems = await mediaMetadataDb.getAllMediaItems();

    let totalWatchTimeSeconds = 0;
    let totalCompletion = 0;
    const videoStatsMap = new Map<
      string,
      { mediaId: string; name: string; playCount: number; totalWatchSeconds: number }
    >();

    for (const session of sessions) {
      totalWatchTimeSeconds += session.watchedSeconds;
      totalCompletion += session.completionPercentage;

      const current = videoStatsMap.get(session.mediaId) || {
        mediaId: session.mediaId,
        name: session.videoName,
        playCount: 0,
        totalWatchSeconds: 0,
      };

      current.playCount += 1;
      current.totalWatchSeconds += session.watchedSeconds;
      videoStatsMap.set(session.mediaId, current);
    }

    const uniqueVideosCount = videoStatsMap.size;
    const averageCompletionRate =
      sessions.length > 0 ? Math.round(totalCompletion / sessions.length) : 0;

    const mostWatchedVideos = Array.from(videoStatsMap.values())
      .sort((a, b) => b.totalWatchSeconds - a.totalWatchSeconds)
      .slice(0, 5);

    // Compute last 7 days viewing trends
    const dayMap = new Map<string, number>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dayMap.set(key, 0);
    }

    for (const session of sessions) {
      const dateKey = new Date(session.timestamp).toISOString().split('T')[0];
      if (dayMap.has(dateKey)) {
        dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + session.watchedSeconds / 60);
      }
    }

    const dailyTrends = Array.from(dayMap.entries()).map(([dateKey, minutes]) => {
      const parts = dateKey.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
      return {
        dayLabel,
        dateKey,
        watchMinutes: Math.round(minutes * 10) / 10,
      };
    });

    return {
      totalWatchTimeSeconds,
      totalSessions: sessions.length,
      uniqueVideosCount,
      averageCompletionRate,
      mostWatchedVideos,
      recentSessions: sessions.slice(0, 10),
      dailyTrends,
    };
  }

  /**
   * Clears all analytics logs and history with user confirmation
   */
  async clearAllHistory(): Promise<void> {
    await mediaMetadataDb.clearPlaybackAnalytics();
  }
}

export const analyticsService = new PlaybackAnalyticsService();
