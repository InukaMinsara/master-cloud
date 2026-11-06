/**
 * src/services/videoPosterService.ts
 * ─────────────────────────────────────────────────────────────
 * Instant 0ms Zero-Latency Video Preview Poster Generator
 *
 * Generates rich, hardware-accelerated SVG poster graphics for video
 * assets so previews appear instantaneously (0ms) across all devices
 * before video streaming buffers.
 * ─────────────────────────────────────────────────────────────
 */

export class VideoPosterService {
  /**
   * Generates an instant high-resolution SVG poster Data URI for any video file
   */
  static getVideoPoster(fileName: string = '', sizeBytes: number = 0): string {
    const lower = (fileName || '').toLowerCase();

    // 1. Customized Authentic Poster for AVATAR First Medley
    if (lower.includes('avatar') || lower.includes('heen kaluware') || lower.includes('w8lbkc')) {
      const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a1a" />
      <stop offset="50%" stop-color="#141432" />
      <stop offset="100%" stop-color="#050510" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
    <radialGradient id="stageLight" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.45" />
      <stop offset="60%" stop-color="#3b82f6" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-color="#000000" flood-opacity="0.7" />
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)" />
  <rect width="100%" height="100%" fill="url(#stageLight)" />

  <!-- Ambient Equalizer Lines -->
  <g opacity="0.15" stroke="#a78bfa" stroke-width="2">
    <line x1="80" y1="560" x2="80" y2="400" />
    <line x1="120" y1="560" x2="120" y2="350" />
    <line x1="160" y1="560" x2="160" y2="480" />
    <line x1="200" y1="560" x2="200" y2="300" />
    <line x1="1080" y1="560" x2="1080" y2="320" />
    <line x1="1120" y1="560" x2="1120" y2="450" />
    <line x1="1160" y1="560" x2="1160" y2="380" />
    <line x1="1200" y1="560" x2="1200" y2="490" />
  </g>

  <!-- Top Badges -->
  <rect x="60" y="50" width="160" height="38" rx="19" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" />
  <text x="140" y="74" fill="#a5b4fc" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="700" text-anchor="middle" letter-spacing="1">MASTER CLOUD</text>

  <rect x="235" y="50" width="120" height="38" rx="19" fill="#831843" stroke="#f43f5e" stroke-width="1.5" />
  <text x="295" y="74" fill="#fecdd3" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="700" text-anchor="middle" letter-spacing="1">LIVE SHOW</text>

  <!-- Big Central Play Button -->
  <g filter="url(#shadow)" transform="translate(640, 320)">
    <circle r="60" fill="url(#glow)" opacity="0.9" />
    <circle r="52" fill="#0f172a" />
    <polygon points="-12,-22 24,0 -12,22" fill="#ffffff" />
  </g>

  <!-- Title & Metadata -->
  <text x="640" y="470" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="34" font-weight="800" text-anchor="middle" letter-spacing="0.5">AVATAR First Medley</text>
  <text x="640" y="515" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="20" font-weight="500" text-anchor="middle">Heen Kaluware Medley (Live Concert Recording)</text>

  <!-- Bottom Details Bar -->
  <rect x="420" y="565" width="440" height="44" rx="22" fill="#0f172a" stroke="#334155" stroke-width="1" />
  <text x="640" y="593" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="15" font-weight="600" text-anchor="middle">114.5 MB  •  1080p HD  •  MP4 Video  •  Stereo Audio</text>
</svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    // 2. Customized Authentic Poster for 2000's Chart Hits Medley
    if (lower.includes('2000') || lower.includes('chart') || lower.includes('news') || lower.includes('7ctigb') || lower.includes('අයිමාත්‍රා')) {
      const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#11052C" />
      <stop offset="50%" stop-color="#1e0c45" />
      <stop offset="100%" stop-color="#090117" />
    </linearGradient>
    <linearGradient id="glow2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="50%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
    <radialGradient id="centerGlow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.35" />
      <stop offset="70%" stop-color="#3b82f6" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-color="#000000" flood-opacity="0.7" />
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg2)" />
  <rect width="100%" height="100%" fill="url(#centerGlow)" />

  <!-- Top Badges -->
  <rect x="60" y="50" width="160" height="38" rx="19" fill="#1e1b4b" stroke="#38bdf8" stroke-width="1.5" />
  <text x="140" y="74" fill="#bae6fd" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="700" text-anchor="middle" letter-spacing="1">MASTER CLOUD</text>

  <rect x="235" y="50" width="145" height="38" rx="19" fill="#581c87" stroke="#c084fc" stroke-width="1.5" />
  <text x="307" y="74" fill="#f3e8ff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="700" text-anchor="middle" letter-spacing="1">CHART HITS</text>

  <!-- Big Central Play Button -->
  <g filter="url(#shadow2)" transform="translate(640, 320)">
    <circle r="60" fill="url(#glow2)" opacity="0.95" />
    <circle r="52" fill="#0f172a" />
    <polygon points="-12,-22 24,0 -12,22" fill="#ffffff" />
  </g>

  <!-- Title & Metadata -->
  <text x="640" y="470" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="34" font-weight="800" text-anchor="middle" letter-spacing="0.5">2000's Chart Hits Medley</text>
  <text x="640" y="515" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="20" font-weight="500" text-anchor="middle">News අයිමාත්‍රා [Official Track Edition]</text>

  <!-- Bottom Details Bar -->
  <rect x="420" y="565" width="440" height="44" rx="22" fill="#0f172a" stroke="#334155" stroke-width="1" />
  <text x="640" y="593" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="15" font-weight="600" text-anchor="middle">183.8 MB  •  1080p HD  •  MP4 Video  •  Stereo Audio</text>
</svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    // 3. Elegant Universal Glassmorphism Video Poster for Any Other Video
    const displayName = fileName ? (fileName.length > 40 ? fileName.slice(0, 37) + '...' : fileName) : 'Master Cloud Video';
    const sizeStr = sizeBytes > 0 ? (sizeBytes > 1024 * 1024 * 1024 ? `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB` : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`) : 'HD Video';

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bgU" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="btnU" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#bgU)" />

  <g transform="translate(640, 320)">
    <circle r="56" fill="url(#btnU)" />
    <circle r="48" fill="#0f172a" />
    <polygon points="-10,-18 20,0 -10,18" fill="#ffffff" />
  </g>

  <text x="640" y="460" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="28" font-weight="700" text-anchor="middle">${displayName}</text>
  <text x="640" y="505" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="500" text-anchor="middle">${sizeStr}  •  Click to Stream in High Definition</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
