import React, { useMemo } from 'react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';

/**
 * Converts a hex color string and opacity to an rgba(...) CSS string.
 */
function hexToRgba(hex: string, opacity: number): string {
  if (!hex || hex === 'transparent') return 'transparent';
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;

  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const safeOpacity = Math.max(0, Math.min(1, isNaN(opacity) ? 1 : opacity));
    return `rgba(${r}, ${g}, ${b}, ${safeOpacity})`;
  }

  return `rgba(0, 0, 0, ${opacity})`;
}

export function SubtitleOverlay() {
  const currentTime = useVideoPlayerStore((s) => s.currentTime);
  const activeSubtitleTrackId = useVideoPlayerStore((s) => s.activeSubtitleTrackId);
  const subtitleTracks = useVideoPlayerStore((s) => s.subtitleTracks);
  const subtitleOffset = useVideoPlayerStore((s) => s.subtitleOffset);
  const subtitleStyles = useVideoPlayerStore((s) => s.subtitleStyles);

  const activeTrack = useMemo(() => {
    if (!activeSubtitleTrackId) return null;
    return subtitleTracks.find((t) => t.id === activeSubtitleTrackId) ?? null;
  }, [activeSubtitleTrackId, subtitleTracks]);

  const effectiveTime = currentTime + subtitleOffset;

  const activeCues = useMemo(() => {
    if (!activeTrack?.cues) return [];
    return activeTrack.cues.filter(
      (c) => effectiveTime >= c.start && effectiveTime <= c.end
    );
  }, [activeTrack, effectiveTime]);

  // If subtitles are off
  if (!activeSubtitleTrackId) {
    return null;
  }

  // If no track or no active cue
  if (!activeTrack || activeCues.length === 0) {
    return null;
  }

  const cueText = activeCues.map((c) => c.text).join('\n');

  // Positioning inside video container
  const positionStyles: React.CSSProperties =
    subtitleStyles.position === 'top'
      ? { top: '8%' }
      : subtitleStyles.position === 'middle'
      ? { top: '50%', transform: 'translateY(-50%)' }
      : { bottom: `${subtitleStyles.bottomOffsetPercent}%` };

  return (
    <div
      className="absolute inset-x-0 flex justify-center pointer-events-none select-none"
      style={{
        ...positionStyles,
        zIndex: 25,
      }}
    >
      <div
        style={{
          fontSize: `${subtitleStyles.fontSize}px`,
          color: subtitleStyles.color,
          backgroundColor: hexToRgba(
            subtitleStyles.backgroundColor,
            subtitleStyles.backgroundOpacity
          ),
          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          padding: '6px 14px',
          borderRadius: '8px',
          maxWidth: '85%',
          textAlign: 'center',
          lineHeight: 1.4,
          pointerEvents: 'none',
          zIndex: 25,
          whiteSpace: 'pre-line',
        }}
      >
        {cueText}
      </div>
    </div>
  );
}
