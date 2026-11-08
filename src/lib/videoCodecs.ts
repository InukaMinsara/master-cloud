/**
 * MASTER CLOUD Video Player - Codec & Format Detection Utility
 * Uses HTMLMediaElement.canPlayType and container/codec heuristics
 * to report browser compatibility accurately.
 */

export interface CodecSupportResult {
  isSupported: boolean;
  canPlay: '' | 'maybe' | 'probably';
  formatName: string;
  recommendedAction?: string;
  details?: string;
}

export function detectBrowserCodecSupport(fileOrMime: File | string): CodecSupportResult {
  const video = typeof document !== 'undefined' ? document.createElement('video') : null;
  if (!video) {
    return { isSupported: true, canPlay: 'maybe', formatName: 'Unknown' };
  }

  let mimeType = '';
  let extension = '';
  let fileName = '';

  if (typeof fileOrMime === 'string') {
    mimeType = fileOrMime.toLowerCase();
  } else {
    fileName = fileOrMime.name;
    mimeType = (fileOrMime.type || '').toLowerCase();
    extension = fileOrMime.name.split('.').pop()?.toLowerCase() || '';
  }

  // Common Container & Codec definitions
  const FORMAT_PROBES: Record<string, { label: string; probeMimes: string[]; nativeOnly?: boolean }> = {
    mp4: {
      label: 'MP4 (MPEG-4 Part 14)',
      probeMimes: [
        'video/mp4',
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', // H.264 Baseline
        'video/mp4; codecs="avc1.640028, mp4a.40.2"', // H.264 High
      ],
    },
    webm: {
      label: 'WebM',
      probeMimes: [
        'video/webm',
        'video/webm; codecs="vp8, vorbis"',
        'video/webm; codecs="vp9, opus"',
        'video/webm; codecs="av01.0.08M.08"', // AV1
      ],
    },
    mov: {
      label: 'QuickTime MOV',
      probeMimes: [
        'video/quicktime',
        'video/mp4; codecs="avc1.42E01E"',
      ],
    },
    mkv: {
      label: 'Matroska MKV',
      probeMimes: [
        'video/x-matroska',
        'video/webm',
      ],
      nativeOnly: true,
    },
    avi: {
      label: 'Audio Video Interleave (AVI)',
      probeMimes: ['video/x-msvideo', 'video/avi'],
      nativeOnly: true,
    },
    ogg: {
      label: 'OGG Theora',
      probeMimes: ['video/ogg; codecs="theora, vorbis"'],
    },
    m3u8: {
      label: 'HLS Live Stream',
      probeMimes: ['application/vnd.apple.mpegurl', 'application/x-mpegURL'],
    },
  };

  const detectedKey = extension || (mimeType.includes('mp4') ? 'mp4' : mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : '');
  const config = FORMAT_PROBES[detectedKey];

  if (!config) {
    if (mimeType) {
      const can = video.canPlayType(mimeType);
      return {
        isSupported: can !== '',
        canPlay: can,
        formatName: mimeType,
        recommendedAction: can === '' ? 'Browser reports no native decoder for this media type.' : undefined,
      };
    }
    return { isSupported: true, canPlay: 'maybe', formatName: extension ? `.${extension}` : 'Unknown' };
  }

  // Containers with rare native browser support (MKV, AVI, FLV, WMV)
  if (['mkv', 'avi', 'flv', 'wmv'].includes(extension)) {
    // Check if browser happens to support x-matroska (Chromium sometimes does for VP9/Vorbis in MKV)
    let bestResult: '' | 'maybe' | 'probably' = '';
    for (const probe of config.probeMimes) {
      const res = video.canPlayType(probe);
      if (res === 'probably') {
        bestResult = 'probably';
        break;
      }
      if (res === 'maybe') bestResult = 'maybe';
    }

    if (bestResult === '') {
      return {
        isSupported: false,
        canPlay: '',
        formatName: config.label,
        details: `Container "${extension.toUpperCase()}" is not natively supported by the standard HTML5 video pipeline in this browser.`,
        recommendedAction: `For smooth browser playback, convert this video to MP4 (H.264/AAC) or WebM (VP9/Opus).`,
      };
    }
  }

  // Probe mime types for this format
  let bestResult: '' | 'maybe' | 'probably' = '';
  for (const probe of config.probeMimes) {
    const res = video.canPlayType(probe);
    if (res === 'probably') {
      bestResult = 'probably';
      break;
    }
    if (res === 'maybe') bestResult = 'maybe';
  }

  return {
    isSupported: bestResult !== '',
    canPlay: bestResult,
    formatName: config.label,
    recommendedAction:
      bestResult === ''
        ? `Your browser does not have the hardware or software codecs installed to play ${config.label}. Try opening in Edge, Chrome, or Chrome-based browser with H.264 or VP9 support.`
        : undefined,
  };
}
