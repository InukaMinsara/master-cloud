/**
 * MASTER CLOUD Subtitle Studio - SRT & WebVTT Parser
 * Parses standard .srt and .vtt subtitle files into time-indexed cues.
 */

export interface SubtitleCue {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  cues: SubtitleCue[];
  isCustom?: boolean;
}

/**
 * Parses timestamp string to seconds.
 * Supports:
 * - SRT: 00:01:23,456
 * - VTT: 00:01:23.456 or 01:23.456
 */
export function parseTimestamp(timeStr: string): number {
  const clean = timeStr.trim().replace(',', '.');
  const parts = clean.split(':');

  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Formats seconds into SRT timestamp (00:00:00,000)
 */
export function formatSrtTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00,000';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Formats seconds into WebVTT timestamp (00:00:00.000)
 */
export function formatVttTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00.000';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Exports cues to standard SubRip (.srt) string format
 */
export function exportToSrt(cues: SubtitleCue[]): string {
  const sorted = [...cues].sort((a, b) => a.start - b.start);
  return sorted
    .map((cue, idx) => {
      const num = idx + 1;
      const start = formatSrtTimestamp(cue.start);
      const end = formatSrtTimestamp(cue.end);
      return `${num}\n${start} --> ${end}\n${cue.text}\n`;
    })
    .join('\n');
}

/**
 * Exports cues to standard WebVTT (.vtt) format
 */
export function exportToVtt(cues: SubtitleCue[], title?: string): string {
  const sorted = [...cues].sort((a, b) => a.start - b.start);
  let out = 'WEBVTT\n';
  if (title) out += `NOTE ${title}\n\n`;
  else out += '\n';

  out += sorted
    .map((cue, idx) => {
      const start = formatVttTimestamp(cue.start);
      const end = formatVttTimestamp(cue.end);
      return `${idx + 1}\n${start} --> ${end}\n${cue.text}\n`;
    })
    .join('\n');
  return out;
}

/**
 * Triggers a browser file download of exported subtitle content
 */
export function downloadSubtitleFile(
  filename: string,
  content: string,
  mimeType: 'text/plain' | 'text/vtt' = 'text/plain',
) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Cleans styling or tag annotations from subtitle text (e.g. <b>, <i>, <font>, <v Voice>)
 */
export function cleanSubtitleText(rawText: string): string {
  return rawText
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/\{[^}]*\}/g, '') // remove ASS/SSA curly tags
    .trim();
}

/**
 * Parses raw text from .srt or .vtt file
 */
export function parseSubtitleText(rawContent: string, trackId: string, trackLabel: string = 'Subtitles'): SubtitleTrack {
  const lines = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const cues: SubtitleCue[] = [];

  let i = 0;
  // Skip WEBVTT header if present
  if (lines[0]?.trim().toUpperCase().startsWith('WEBVTT')) {
    i = 1;
    while (i < lines.length && lines[i].trim() !== '') {
      i++; // Skip header metadata lines
    }
  }

  let currentCue: Partial<SubtitleCue> | null = null;
  let textLines: string[] = [];
  let cueCount = 0;

  const flushCue = () => {
    if (currentCue && currentCue.start !== undefined && currentCue.end !== undefined && textLines.length > 0) {
      cues.push({
        id: currentCue.id || `cue_${++cueCount}`,
        start: currentCue.start,
        end: currentCue.end,
        text: cleanSubtitleText(textLines.join('\n')),
      });
    }
    currentCue = null;
    textLines = [];
  };

  const timeRangeRegex = /((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{3})/;

  for (; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '') {
      flushCue();
      continue;
    }

    const match = line.match(timeRangeRegex);
    if (match) {
      flushCue();
      const start = parseTimestamp(match[1]);
      const end = parseTimestamp(match[2]);
      currentCue = {
        id: `cue_${cueCount + 1}`,
        start,
        end,
      };
      textLines = [];
    } else if (currentCue) {
      textLines.push(line);
    } else if (/^\d+$/.test(line)) {
      // Possible SRT sequence number, ignore or track
    }
  }

  flushCue();

  return {
    id: trackId,
    label: trackLabel,
    language: 'en',
    cues,
    isCustom: true,
  };
}
