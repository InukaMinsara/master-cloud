// MASTER CLOUD: Video Player Phase 1 & Phase 2 Complete Verification Suite

console.log('====================================================');
console.log(' MASTER CLOUD: VIDEO PLAYER PHASE 1 & 2 TEST SUITE');
console.log('====================================================');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${message}`);
  }
}

// ============================================================================
// PHASE 1 VERIFICATION
// ============================================================================

// ----------------------------------------------------
// 1. Time Formatting Verification
// ----------------------------------------------------
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

assert(formatTime(0) === '0:00', 'formatTime(0) === "0:00"');
assert(formatTime(9) === '0:09', 'formatTime(9) === "0:09"');
assert(formatTime(45) === '0:45', 'formatTime(45) === "0:45"');
assert(formatTime(60) === '1:00', 'formatTime(60) === "1:00"');
assert(formatTime(75) === '1:15', 'formatTime(75) === "1:15"');
assert(formatTime(599) === '9:59', 'formatTime(599) === "9:59"');
assert(formatTime(600) === '10:00', 'formatTime(600) === "10:00"');
assert(formatTime(3600) === '1:00:00', 'formatTime(3600) === "1:00:00"');
assert(formatTime(3665) === '1:01:05', 'formatTime(3665) === "1:01:05"');
assert(formatTime(36000) === '10:00:00', 'formatTime(36000) === "10:00:00"');
assert(formatTime(NaN) === '0:00', 'formatTime(NaN) === "0:00"');
assert(formatTime(-10) === '0:00', 'formatTime(-10) === "0:00"');

// ----------------------------------------------------
// 2. Resolution Badge Verification
// ----------------------------------------------------
function getResolutionBadge(width, height) {
  if (!width || !height) return null;
  if (width >= 3840 || height >= 2160) return '4K UHD';
  if (width >= 2560 || height >= 1440) return '2K QHD';
  if (width >= 1920 || height >= 1080) return '1080p FHD';
  if (width >= 1280 || height >= 720) return '720p HD';
  if (height >= 480) return '480p';
  return `${width}×${height}`;
}

assert(getResolutionBadge(3840, 2160) === '4K UHD', '3840x2160 resolves to 4K UHD');
assert(getResolutionBadge(2560, 1440) === '2K QHD', '2560x1440 resolves to 2K QHD');
assert(getResolutionBadge(1920, 1080) === '1080p FHD', '1920x1080 resolves to 1080p FHD');
assert(getResolutionBadge(1280, 720) === '720p HD', '1280x720 resolves to 720p HD');
assert(getResolutionBadge(854, 480) === '480p', '854x480 resolves to 480p');
assert(getResolutionBadge(640, 360) === '640×360', '640x360 resolves to 640×360');
assert(getResolutionBadge(0, 0) === null, '0x0 returns null');
assert(getResolutionBadge(undefined, undefined) === null, 'undefined returns null');

// ----------------------------------------------------
// 3. Codec Detection Fallback Logic
// ----------------------------------------------------
function detectBrowserCodecSupport(fileOrMime) {
  let mimeType = '';
  let extension = '';

  if (typeof fileOrMime === 'string') {
    mimeType = fileOrMime.toLowerCase();
  } else {
    mimeType = (fileOrMime.type || '').toLowerCase();
    extension = fileOrMime.name.split('.').pop()?.toLowerCase() || '';
  }

  const FORMAT_PROBES = {
    mp4: { label: 'MP4 (MPEG-4 Part 14)' },
    webm: { label: 'WebM' },
    mov: { label: 'QuickTime MOV' },
    mkv: { label: 'Matroska MKV', nativeOnly: true },
    avi: { label: 'Audio Video Interleave (AVI)', nativeOnly: true },
    ogg: { label: 'OGG Theora' },
  };

  const detectedKey = extension || (mimeType.includes('mp4') ? 'mp4' : mimeType.includes('webm') ? 'webm' : '');
  const config = FORMAT_PROBES[detectedKey];

  if (!config) {
    return { isSupported: true, canPlay: 'maybe', formatName: extension ? `.${extension}` : 'Unknown' };
  }

  if (['mkv', 'avi', 'flv', 'wmv'].includes(extension)) {
    return {
      isSupported: false,
      canPlay: '',
      formatName: config.label,
      details: `Container "${extension.toUpperCase()}" is not natively supported by standard HTML5 video.`,
      recommendedAction: `For smooth browser playback, convert this video to MP4 (H.264/AAC) or WebM (VP9/Opus).`,
    };
  }

  return {
    isSupported: true,
    canPlay: 'maybe',
    formatName: config.label,
  };
}

const mockMkvFile = { name: 'movie.mkv', type: 'video/x-matroska' };
const mkvResult = detectBrowserCodecSupport(mockMkvFile);
assert(mkvResult.formatName.includes('Matroska'), 'Detects MKV format');
assert(mkvResult.recommendedAction !== undefined, 'Provides actionable recommendation for MKV');

const mockAviFile = { name: 'clip.avi', type: 'video/x-msvideo' };
const aviResult = detectBrowserCodecSupport(mockAviFile);
assert(aviResult.formatName.includes('AVI'), 'Detects AVI format');
assert(aviResult.recommendedAction !== undefined, 'Provides recommendation for AVI');

// ----------------------------------------------------
// 4. Object URL Lifecycle Simulation
// ----------------------------------------------------
let revokedUrls = [];
const mockURL = {
  createObjectURL: (file) => `blob:http://localhost:5173/${file.name}`,
  revokeObjectURL: (url) => { revokedUrls.push(url); },
};

let currentSrc = null;
function loadVideoSim(file) {
  if (currentSrc && currentSrc.startsWith('blob:')) {
    mockURL.revokeObjectURL(currentSrc);
  }
  currentSrc = mockURL.createObjectURL(file);
}

loadVideoSim({ name: 'clip1.mp4' });
assert(currentSrc === 'blob:http://localhost:5173/clip1.mp4', 'First video blob created');
loadVideoSim({ name: 'clip2.mp4' });
assert(revokedUrls.includes('blob:http://localhost:5173/clip1.mp4'), 'Previous video blob revoked');


// ============================================================================
// PHASE 2 VERIFICATION
// ============================================================================

console.log('\n--- PHASE 2: SMART TIMELINE & A-B REPEAT ---');

// ----------------------------------------------------
// 5. Timeline Calculations & A-B Repeat
// ----------------------------------------------------
function formatPreciseTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00.0';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
}

assert(formatPreciseTime(65.4) === '1:05.4', 'formatPreciseTime formats fractional seconds');
assert(formatPreciseTime(3605.12) === '1:00:05.1', 'formatPreciseTime formats hours with subsecond precision');

function checkAbRepeatLoop(currentTime, abState) {
  if (abState.active && abState.b !== null && abState.a !== null && currentTime >= abState.b) {
    return { shouldLoop: true, loopTo: abState.a };
  }
  return { shouldLoop: false, loopTo: null };
}

const abActive = { a: 10.0, b: 25.0, active: true };
assert(checkAbRepeatLoop(5.0, abActive).shouldLoop === false, 'A-B repeat before loop end does not trigger');
assert(checkAbRepeatLoop(24.9, abActive).shouldLoop === false, 'A-B repeat immediately before point B does not trigger');
assert(checkAbRepeatLoop(25.0, abActive).shouldLoop === true && checkAbRepeatLoop(25.0, abActive).loopTo === 10.0, 'A-B repeat loops to point A at point B');
assert(checkAbRepeatLoop(30.0, abActive).shouldLoop === true, 'A-B repeat loops to point A beyond point B');

const abDisabled = { a: 10.0, b: 25.0, active: false };
assert(checkAbRepeatLoop(30.0, abDisabled).shouldLoop === false, 'Inactive A-B repeat does not loop');

// ----------------------------------------------------
// 6. Playback Queue Management
// ----------------------------------------------------
console.log('\n--- PHASE 2: PLAYBACK QUEUE MANAGEMENT ---');

class MockQueueManager {
  constructor() {
    this.queue = [];
    this.currentIndex = -1;
    this.repeatMode = 'off'; // 'off' | 'one' | 'all'
    this.isShuffled = false;
  }

  addItems(items) {
    const newItems = items.map((item, idx) => ({
      id: `q_${Date.now()}_${idx}`,
      name: item.name,
      size: item.size || 0,
    }));
    this.queue.push(...newItems);
    if (this.currentIndex === -1 && this.queue.length > 0) {
      this.currentIndex = 0;
    }
  }

  removeItem(index) {
    if (index < 0 || index >= this.queue.length) return;
    this.queue.splice(index, 1);
    if (index < this.currentIndex) {
      this.currentIndex--;
    } else if (index === this.currentIndex) {
      this.currentIndex = Math.min(this.currentIndex, this.queue.length - 1);
    }
  }

  reorder(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.queue.length || toIndex < 0 || toIndex >= this.queue.length) return;
    const [moved] = this.queue.splice(fromIndex, 1);
    this.queue.splice(toIndex, 0, moved);

    if (this.currentIndex === fromIndex) {
      this.currentIndex = toIndex;
    } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
      this.currentIndex--;
    } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
      this.currentIndex++;
    }
  }

  next() {
    if (this.queue.length === 0) return -1;
    if (this.repeatMode === 'one' && this.currentIndex >= 0) {
      return this.currentIndex;
    }
    const nextIdx = this.currentIndex + 1;
    if (nextIdx < this.queue.length) {
      this.currentIndex = nextIdx;
      return this.currentIndex;
    } else if (this.repeatMode === 'all') {
      this.currentIndex = 0;
      return 0;
    }
    return -1; // End of queue
  }

  previous() {
    if (this.queue.length === 0) return -1;
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.currentIndex;
    } else if (this.repeatMode === 'all') {
      this.currentIndex = this.queue.length - 1;
      return this.currentIndex;
    }
    return 0;
  }
}

const qm = new MockQueueManager();
qm.addItems([{ name: 'Ep1.mp4' }, { name: 'Ep2.mp4' }, { name: 'Ep3.mp4' }]);
assert(qm.queue.length === 3, 'Queue accepts multiple items');
assert(qm.currentIndex === 0, 'First item becomes current index');

// Next item navigation
assert(qm.next() === 1, 'Advance to next track Ep2.mp4 (index 1)');
assert(qm.next() === 2, 'Advance to next track Ep3.mp4 (index 2)');
assert(qm.next() === -1, 'End of queue reached when repeat is off');

// Repeat all
qm.repeatMode = 'all';
assert(qm.next() === 0, 'Repeat-all wraps back to index 0 (Ep1.mp4)');

// Previous item navigation
qm.currentIndex = 0;
assert(qm.previous() === 2, 'Previous from start wraps to last item when repeat-all is enabled');

// Repeat one
qm.repeatMode = 'one';
qm.currentIndex = 1;
assert(qm.next() === 1, 'Repeat-one stays on current index');

// Reorder queue
qm.reorder(0, 2); // Move Ep1 to end
assert(qm.queue[2].name === 'Ep1.mp4', 'Reordering moves item to target slot');

// Remove item
qm.removeItem(0);
assert(qm.queue.length === 2, 'Queue item removed');


// ----------------------------------------------------
// 7. Subtitle Parsing & Sync
// ----------------------------------------------------
console.log('\n--- PHASE 2: SUBTITLE STUDIO ---');

function parseTimecode(tc) {
  const parts = tc.trim().split(':');
  if (parts.length < 2) return 0;
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) {
    h = parseFloat(parts[0]);
    m = parseFloat(parts[1]);
    s = parseFloat(parts[2].replace(',', '.'));
  } else {
    m = parseFloat(parts[0]);
    s = parseFloat(parts[1].replace(',', '.'));
  }
  return h * 3600 + m * 60 + s;
}

assert(parseTimecode('00:01:23,456') === 83.456, 'SRT comma decimal timestamp parsed accurately');
assert(parseTimecode('01:23.456') === 83.456, 'VTT 2-part period decimal timestamp parsed accurately');
assert(parseTimecode('02:00:10.500') === 7210.5, 'VTT 3-part period timestamp parsed accurately');

function cleanCueText(text) {
  return text.replace(/<[^>]+>/g, '').trim();
}
assert(cleanCueText('<b>Hello</b> <i>World</i>') === 'Hello World', 'Subtitle markup stripped cleanly');

function getActiveSubtitleCue(cues, currentTime, offsetSeconds = 0) {
  const effectiveTime = currentTime + offsetSeconds;
  return cues.find((c) => effectiveTime >= c.start && effectiveTime <= c.end) || null;
}

const mockCues = [
  { id: '1', start: 10.0, end: 15.0, text: 'First dialogue cue' },
  { id: '2', start: 20.0, end: 25.0, text: 'Second dialogue cue' },
];

assert(getActiveSubtitleCue(mockCues, 12.0)?.text === 'First dialogue cue', 'Subtitle matches cue during interval');
assert(getActiveSubtitleCue(mockCues, 16.0) === null, 'No subtitle outside cue interval');

// Sync offset: if video is at 18.0s, with +3s offset effective time is 21.0s (matches cue 2)
assert(getActiveSubtitleCue(mockCues, 18.0, 3.0)?.text === 'Second dialogue cue', 'Subtitle sync offset shifts effective timestamp');


// ----------------------------------------------------
// 8. Audio Studio: 10-Band EQ & Tone Controls
// ----------------------------------------------------
console.log('\n--- PHASE 2: AUDIO STUDIO & 10-BAND EQ ---');

const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
assert(EQ_FREQUENCIES.length === 10, '10 ISO octave frequency bands defined');

const AUDIO_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'bass-boost': [6, 5, 4, 2, 0, 0, 0, 1, 2, 3],
  vocal: [-3, -2, 0, 2, 4, 5, 4, 2, 0, -1],
  cinema: [5, 4, 2, 0, 2, 3, 4, 3, 2, 4],
};

function clampEqGain(gain) {
  return Math.max(-12, Math.min(12, gain));
}

assert(clampEqGain(15) === 12, 'EQ gain clamped to +12dB ceiling');
assert(clampEqGain(-20) === -12, 'EQ gain clamped to -12dB floor');
assert(clampEqGain(6) === 6, 'Valid EQ gain preserved');

function clampPan(pan) {
  return Math.max(-1, Math.min(1, pan));
}
assert(clampPan(-1.5) === -1, 'Stereo pan clamped to -1 (Full Left)');
assert(clampPan(2.0) === 1, 'Stereo pan clamped to +1 (Full Right)');

function clampDelay(delay) {
  return Math.max(0, Math.min(1.0, delay));
}
assert(clampDelay(1.5) === 1.0, 'Audio sync delay clamped to 1.0s max');
assert(clampDelay(-0.5) === 0, 'Audio delay clamped to 0s min');


// ----------------------------------------------------
// 9. Media Library 2.0 Persistence & Checkpoints
// ----------------------------------------------------
console.log('\n--- PHASE 2: MEDIA LIBRARY 2.0 PERSISTENCE ---');

class MockMediaLibraryDb {
  constructor() {
    this.items = new Map();
    this.bookmarks = [];
  }

  async saveItem(item) {
    this.items.set(item.id, { ...item });
  }

  async getItem(id) {
    return this.items.get(id) || null;
  }

  async updateContinueTime(id, time, duration) {
    const existing = this.items.get(id);
    if (existing) {
      existing.continueTime = time;
      existing.lastPlayed = Date.now();
      if (duration) existing.duration = duration;
    }
  }

  async addBookmark(bm) {
    this.bookmarks.push(bm);
  }

  async removeBookmark(id) {
    this.bookmarks = this.bookmarks.filter((b) => b.id !== id);
  }
}

const db = new MockMediaLibraryDb();
await db.saveItem({
  id: 'movie1_5000',
  name: 'SciFi_Feature.mp4',
  size: 500000000,
  duration: 7200,
  continueTime: 0,
  isFavorite: false,
});

assert((await db.getItem('movie1_5000')) !== null, 'Media item stored in metadata DB');

await db.updateContinueTime('movie1_5000', 3450, 7200);
const updatedItem = await db.getItem('movie1_5000');
assert(updatedItem.continueTime === 3450, 'Continue watching checkpoint updated accurately');


// ----------------------------------------------------
// 10. Bookmarks & Frame Capture Error Handling
// ----------------------------------------------------
console.log('\n--- PHASE 2: BOOKMARKS & SCREENSHOT ERROR HANDLING ---');

await db.addBookmark({
  id: 'bm_1',
  mediaId: 'movie1_5000',
  timestamp: 3450,
  note: 'Key plot twist scene',
  thumbnailDataUrl: 'data:image/png;base64,mock',
});
assert(db.bookmarks.length === 1, 'Bookmark saved with timestamp and note');
assert(db.bookmarks[0].timestamp === 3450, 'Bookmark timestamp matches video position');

await db.removeBookmark('bm_1');
assert(db.bookmarks.length === 0, 'Bookmark removed by ID');

// Simulated screenshot CORS handling
function simulateFrameCapture(videoMock) {
  if (!videoMock || videoMock.readyState < 2) {
    return { success: false, error: 'Video is not ready or has zero dimensions.' };
  }
  if (videoMock.isCrossOriginTainted) {
    return {
      success: false,
      error: 'Browser security restricted frame capture for this remote stream (cross-origin CORS restriction).',
    };
  }
  return { success: true, dataUrl: 'data:image/png;base64,valid' };
}

assert(simulateFrameCapture({ readyState: 0 }).success === false, 'Detects unready video element');
assert(simulateFrameCapture({ readyState: 4, isCrossOriginTainted: true }).error.includes('cross-origin'), 'Handles tainted canvas gracefully');
assert(simulateFrameCapture({ readyState: 4, isCrossOriginTainted: false }).success === true, 'Captures frame successfully when security permits');


// ----------------------------------------------------
// 11. Mini Player & Picture-in-Picture Fallback
// ----------------------------------------------------
console.log('\n--- PHASE 2: MINI PLAYER & PIP FALLBACK ---');

function handlePiPToggle(hasNativePiP, requestPiPFails = false) {
  if (hasNativePiP && !requestPiPFails) {
    return { mode: 'native-pip' };
  }
  return { mode: 'in-app-mini-player' };
}

assert(handlePiPToggle(true, false).mode === 'native-pip', 'Uses native Picture-in-Picture when supported');
assert(handlePiPToggle(false).mode === 'in-app-mini-player', 'Falls back to in-app floating mini-player when PiP is unsupported');
assert(handlePiPToggle(true, true).mode === 'in-app-mini-player', 'Falls back to in-app mini-player when requestPictureInPicture throws');

// ============================================================================
// PHASE 3: SMART MEDIA INTELLIGENCE VERIFICATION
// ============================================================================

// ----------------------------------------------------
// 12. Smart Scene Transition Detection
// ----------------------------------------------------
console.log('\n--- PHASE 3: SMART SCENE TRANSITION DETECTION ---');

function calculateFrameDifference(data1, data2) {
  if (!data1 || !data2 || data1.length !== data2.length) return 0;
  let totalDelta = 0;
  const pixelCount = data1.length / 4;
  for (let i = 0; i < data1.length; i += 4) {
    const lum1 = 0.299 * data1[i] + 0.587 * data1[i + 1] + 0.114 * data1[i + 2];
    const lum2 = 0.299 * data2[i] + 0.587 * data2[i + 1] + 0.114 * data2[i + 2];
    totalDelta += Math.abs(lum1 - lum2);
  }
  return totalDelta / pixelCount;
}

const blackFrame = new Uint8ClampedArray(64 * 36 * 4).fill(0);
const whiteFrame = new Uint8ClampedArray(64 * 36 * 4).fill(255);
const grayFrame = new Uint8ClampedArray(64 * 36 * 4).fill(128);

assert(calculateFrameDifference(blackFrame, blackFrame) === 0, 'Identical frames have 0 delta');
assert(calculateFrameDifference(blackFrame, whiteFrame) === 255, 'Black to white cut has maximum 255 delta');
const midDelta = calculateFrameDifference(blackFrame, grayFrame);
assert(Math.round(midDelta) === 128, 'Black to 50% gray frame has ~128 delta');

// Scene cut detection thresholding
const threshold = 35;
assert(calculateFrameDifference(blackFrame, whiteFrame) > threshold, 'Dramatic transition triggers scene cut');
assert(calculateFrameDifference(blackFrame, blackFrame) < threshold, 'Continuous scene remains below threshold');

// Scene to Chapter Marker conversion
const mockScenes = [
  { id: 'sc_1', start: 0, end: 120, label: 'Intro & Title' },
  { id: 'sc_2', start: 120, end: 450, label: 'Key Presentation' },
  { id: 'sc_3', start: 450, end: 700, label: 'Q&A & Outro' },
];
const sceneMarkers = mockScenes.map((s, idx) => ({
  id: `marker_scene_${idx}`,
  time: s.start,
  label: s.label || `Scene ${idx + 1}`,
  type: 'chapter',
  color: '#06b6d4',
}));

assert(sceneMarkers.length === 3, 'All detected scenes convert to chapter markers');
assert(sceneMarkers[0].time === 0 && sceneMarkers[0].label === 'Intro & Title', 'First marker preserves time and label');
assert(sceneMarkers[1].type === 'chapter', 'Marker type tagged as chapter');

// ----------------------------------------------------
// 13. Subtitle Export & Synchronization
// ----------------------------------------------------
console.log('\n--- PHASE 3: SUBTITLE EXPORT & SYNC ---');

function formatSrtTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function formatVttTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function exportToSrt(cues) {
  return cues
    .map((cue, index) => {
      return `${index + 1}\n${formatSrtTimestamp(cue.start)} --> ${formatSrtTimestamp(cue.end)}\n${cue.text}\n`;
    })
    .join('\n');
}

function exportToVtt(cues, title) {
  const header = title ? `WEBVTT - ${title}\n\n` : 'WEBVTT\n\n';
  const body = cues
    .map((cue, index) => {
      return `${index + 1}\n${formatVttTimestamp(cue.start)} --> ${formatVttTimestamp(cue.end)}\n${cue.text}\n`;
    })
    .join('\n');
  return header + body;
}

const sampleCues = [
  { id: '1', start: 1.5, end: 4.25, text: 'Welcome to MASTER CLOUD Media Studio.' },
  { id: '2', start: 5.0, end: 9.125, text: 'Experience Smart Media Intelligence in your browser.' },
];

const srtExport = exportToSrt(sampleCues);
assert(srtExport.includes('00:00:01,500 --> 00:00:04,250'), 'SRT formats comma millisecond timestamps');
assert(srtExport.includes('Welcome to MASTER CLOUD Media Studio.'), 'SRT preserves cue text');

const vttExport = exportToVtt(sampleCues, 'Demo');
assert(vttExport.startsWith('WEBVTT - Demo'), 'VTT includes proper WEBVTT header');
assert(vttExport.includes('00:00:01.500 --> 00:00:04.250'), 'VTT formats period millisecond timestamps');

// ----------------------------------------------------
// 14. Video Intelligence: Keywords, Summary & Search
// ----------------------------------------------------
console.log('\n--- PHASE 3: VIDEO INTELLIGENCE & KEYWORDS ---');

const STOPWORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'it', 'this', 'that', 'you', 'we', 'are', 'was'
]);

function extractTranscriptKeywords(cues, maxKeywords = 10) {
  const freqMap = new Map();
  for (const cue of cues) {
    const words = cue.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/);
    for (const word of words) {
      if (word.length >= 3 && !STOPWORDS.has(word)) {
        freqMap.set(word, (freqMap.get(word) || 0) + 1);
      }
    }
  }
  return Array.from(freqMap.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxKeywords);
}

const speechCues = [
  { id: 'c1', start: 0, end: 5, text: 'Quantum computing revolutionizes cryptography and physics.' },
  { id: 'c2', start: 5, end: 10, text: 'Quantum algorithms enable super-fast encryption and quantum teleportation.' },
  { id: 'c3', start: 10, end: 15, text: 'Classical computing cannot match quantum supremacy.' },
];

const keywords = extractTranscriptKeywords(speechCues, 5);
assert(keywords[0].keyword === 'quantum', 'Most frequent non-stopword "quantum" ranks first');
assert(keywords[0].count === 4, '"quantum" appears 4 times');
assert(!keywords.some(k => STOPWORDS.has(k.keyword)), 'Stopwords are filtered out');

// Dialogue search
function searchTranscriptCues(cues, query) {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];
  return cues
    .filter((cue) => cue.text.toLowerCase().includes(cleanQ))
    .map((cue) => ({
      cue,
      matchSnippet: cue.text,
    }));
}

const searchHits = searchTranscriptCues(speechCues, 'encryption');
assert(searchHits.length === 1, 'Search finds matching cue for "encryption"');
assert(searchHits[0].cue.start === 5, 'Search returns accurate cue start timestamp for 1-click jump');

// ----------------------------------------------------
// 15. Smart Media Organizer: Duplicates & Categories
// ----------------------------------------------------
console.log('\n--- PHASE 3: SMART MEDIA ORGANIZER ---');

function identifyDuplicateMedia(items) {
  const groups = new Map();
  for (const item of items) {
    const key = `${item.size}_${Math.round(item.duration)}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }
  const duplicates = [];
  for (const [key, groupItems] of groups.entries()) {
    if (groupItems.length > 1) {
      const totalSize = groupItems.reduce((acc, curr) => acc + curr.size, 0);
      duplicates.push({
        groupKey: key,
        items: groupItems,
        totalSize,
      });
    }
  }
  return duplicates;
}

const mockLibrary = [
  { id: '1', name: 'Trailer_1080p.mp4', size: 50000000, duration: 120 },
  { id: '2', name: 'Trailer_1080p (copy).mp4', size: 50000000, duration: 120 },
  { id: '3', name: 'Movie.mp4', size: 1500000000, duration: 7200 },
];

const dups = identifyDuplicateMedia(mockLibrary);
assert(dups.length === 1, 'Identifies 1 duplicate group');
assert(dups[0].items.length === 2, 'Duplicate group contains both copies');
assert(dups[0].totalSize === 100000000, 'Total duplicate size summed accurately');

// Heuristic Category Classifier
function guessMediaCategory(name, duration) {
  const lower = name.toLowerCase();
  if (duration >= 3600 || /(movie|film|1080p|uhd|bluray|director)/i.test(lower)) return 'Movies';
  if (/s\d{2}e\d{2}|ep\d+|season|episode/i.test(lower)) return 'TV Shows';
  if (duration <= 600 && /(music|mv|official[\s_]+video|audio|lyric|vevo)/i.test(lower)) return 'Music Videos';
  if (/(tutorial|lesson|lecture|course|masterclass|learn)/i.test(lower)) return 'Courses';
  if (duration < 180) return 'Clips';
  return 'Personal';
}

assert(guessMediaCategory('Inception.2010.1080p.mp4', 8880) === 'Movies', 'Inception classified as Movies');
assert(guessMediaCategory('Breaking.Bad.S01E01.720p.mkv', 3480) === 'TV Shows', 'S01E01 classified as TV Shows');
assert(guessMediaCategory('Taylor_Swift_Official_Video.mp4', 240) === 'Music Videos', 'Music video classified as Music Videos');
assert(guessMediaCategory('React_Tutorial_Course_Part_1.mp4', 1800) === 'Courses', 'Tutorial classified as Courses');
assert(guessMediaCategory('Quick_Short_Clip.mp4', 45) === 'Clips', 'Short video under 3m classified as Clips');

// ----------------------------------------------------
// 16. Playback Analytics Aggregation
// ----------------------------------------------------
console.log('\n--- PHASE 3: PLAYBACK ANALYTICS ---');

function aggregateAnalytics(sessions) {
  let totalWatchTime = 0;
  let totalDuration = 0;
  const playCounts = new Map();

  for (const s of sessions) {
    totalWatchTime += s.watchedSeconds;
    totalDuration += s.totalDuration;
    playCounts.set(s.mediaName, (playCounts.get(s.mediaName) || 0) + 1);
  }

  const completionRate = totalDuration > 0 ? Math.min(100, Math.round((totalWatchTime / totalDuration) * 100)) : 0;
  const mostWatched = Array.from(playCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalWatchTime,
    completionRate,
    mostWatched,
  };
}

const mockSessions = [
  { mediaName: 'Matrix.mp4', watchedSeconds: 3600, totalDuration: 7200, timestamp: Date.now() },
  { mediaName: 'Matrix.mp4', watchedSeconds: 3600, totalDuration: 7200, timestamp: Date.now() },
  { mediaName: 'Short.mp4', watchedSeconds: 60, totalDuration: 60, timestamp: Date.now() },
];

const analytics = aggregateAnalytics(mockSessions);
assert(analytics.totalWatchTime === 7260, 'Total watch time aggregates accurately');
assert(analytics.completionRate === 50, 'Completion rate computed correctly (7260 / 14460 = 50%)');
assert(analytics.mostWatched[0].name === 'Matrix.mp4' && analytics.mostWatched[0].count === 2, 'Most watched video ranked at top');

console.log('====================================================');
console.log(`TOTAL TESTS: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) process.exit(1);
