import { create } from 'zustand';
import { SubtitleTrack, parseSubtitleText } from '@/services/subtitleParser';
import { audioStudioEngine, AUDIO_PRESETS } from '@/services/audioStudioEngine';
import { mediaMetadataDb, MediaBookmark } from '@/services/mediaMetadataDb';

export interface QueueItem {
  id: string;
  name: string;
  file?: File;
  url: string;
  size: number;
  duration?: number;
  addedAt: number;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  type: 'custom' | 'chapter';
  color?: string;
}

export interface SubtitleSettings {
  fontSize: number; // 14 to 36
  color: string;
  backgroundColor: string;
  backgroundOpacity: number; // 0 to 1
  position: 'bottom' | 'top' | 'middle';
  bottomOffsetPercent: number; // 2 to 30
}

export type ActiveDrawerPanel = 'none' | 'queue' | 'subtitles' | 'audio' | 'bookmarks' | 'library';

interface VideoPlayerState {
  // Playback & Source
  videoFile: File | null;
  videoSrc: string | null;
  fileName: string | null;
  fileSize: number;
  fileMimeType: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  previousVolume: number;
  isMuted: boolean;
  playbackSpeed: number;
  isFullscreen: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isControlsVisible: boolean;
  isVideoLoaded: boolean;
  resolution: { width: number; height: number } | null;
  codecInfo: string | null;

  // Feature 1: Smart Timeline & A-B Repeat
  markers: TimelineMarker[];
  abRepeat: { a: number | null; b: number | null; active: boolean };

  // Feature 2: Queue
  queue: QueueItem[];
  currentQueueIndex: number;
  repeatMode: 'off' | 'one' | 'all';
  isShuffled: boolean;

  // Feature 3: Subtitle Studio
  subtitleTracks: SubtitleTrack[];
  activeSubtitleTrackId: string | null;
  subtitleOffset: number;
  subtitleStyles: SubtitleSettings;

  // Feature 4: Audio Studio
  eqGains: number[];
  eqPreset: string;
  stereoPan: number;
  audioDelay: number;
  bassGain: number;
  trebleGain: number;

  // Feature 6: Mini-Player & UI Drawers
  activePanel: ActiveDrawerPanel;
  isMiniPlayer: boolean;

  // Feature 7: Bookmarks
  bookmarks: MediaBookmark[];

  // ── Actions ─────────────────────────────────────────────────────────────
  loadVideo: (file: File) => void;
  loadUrl: (url: string, name?: string) => void;
  setPlaying: (playing: boolean) => void;
  setPaused: (paused: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setBuffered: (percent: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setFullscreen: (fs: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string) => void;
  clearError: () => void;
  setControlsVisible: (visible: boolean) => void;
  setVideoLoaded: () => void;
  setResolution: (res: { width: number; height: number } | null) => void;
  setCodecInfo: (info: string | null) => void;

  // Feature 1 Actions
  addMarker: (time: number, label: string, type?: 'custom' | 'chapter', color?: string) => void;
  removeMarker: (id: string) => void;
  setPointA: (time?: number) => void;
  setPointB: (time?: number) => void;
  clearAbRepeat: () => void;

  // Feature 2 Actions
  addToQueue: (items: (File | { url: string; name: string; size?: number; duration?: number })[]) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  playQueueItem: (index: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
  toggleShuffle: () => void;

  // Feature 3 Actions
  loadSubtitleFile: (file: File) => Promise<void>;
  setActiveSubtitleTrack: (id: string | null) => void;
  setSubtitleOffset: (offset: number) => void;
  updateSubtitleStyles: (styles: Partial<SubtitleSettings>) => void;

  // Feature 4 Actions
  setEqBand: (bandIndex: number, gain: number) => void;
  setEqPreset: (preset: string) => void;
  setStereoPan: (pan: number) => void;
  setAudioDelay: (delay: number) => void;
  setBassGain: (gain: number) => void;
  setTrebleGain: (gain: number) => void;
  resetAudioStudio: () => void;

  // Feature 6 Actions
  setActivePanel: (panel: ActiveDrawerPanel) => void;
  setMiniPlayer: (isMini: boolean) => void;

  // Feature 7 Actions
  addBookmark: (time: number, note?: string, thumbnailDataUrl?: string) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
  loadBookmarksForCurrentVideo: () => Promise<void>;

  closeVideo: () => void;
  reset: () => void;
}

const defaultSubtitleStyles: SubtitleSettings = {
  fontSize: 20,
  color: '#FFFFFF',
  backgroundColor: '#000000',
  backgroundOpacity: 0.65,
  position: 'bottom',
  bottomOffsetPercent: 8,
};

const initialState = {
  videoFile: null as File | null,
  videoSrc: null as string | null,
  fileName: null as string | null,
  fileSize: 0,
  fileMimeType: null as string | null,
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  previousVolume: 1,
  isMuted: false,
  playbackSpeed: 1,
  isFullscreen: false,
  isLoading: false,
  hasError: false,
  errorMessage: null as string | null,
  isControlsVisible: true,
  isVideoLoaded: false,
  resolution: null as { width: number; height: number } | null,
  codecInfo: null as string | null,

  // Feature 1
  markers: [] as TimelineMarker[],
  abRepeat: { a: null as number | null, b: null as number | null, active: false },

  // Feature 2
  queue: [] as QueueItem[],
  currentQueueIndex: -1,
  repeatMode: 'off' as 'off' | 'one' | 'all',
  isShuffled: false,

  // Feature 3
  subtitleTracks: [] as SubtitleTrack[],
  activeSubtitleTrackId: null as string | null,
  subtitleOffset: 0,
  subtitleStyles: defaultSubtitleStyles,

  // Feature 4
  eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  eqPreset: 'flat',
  stereoPan: 0,
  audioDelay: 0,
  bassGain: 0,
  trebleGain: 0,

  // Feature 6
  activePanel: 'none' as ActiveDrawerPanel,
  isMiniPlayer: false,

  // Feature 7
  bookmarks: [] as MediaBookmark[],
};

export const useVideoPlayerStore = create<VideoPlayerState>((set, get) => ({
  ...initialState,

  loadVideo: (file) => {
    const { videoSrc, queue } = get();
    if (videoSrc && videoSrc.startsWith('blob:')) {
      URL.revokeObjectURL(videoSrc);
    }

    const newSrc = URL.createObjectURL(file);

    // Check if file is already in queue; if not, add it
    let queueIdx = queue.findIndex((q) => q.name === file.name && q.size === file.size);
    let newQueue = queue;
    if (queueIdx === -1) {
      const newItem: QueueItem = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        file,
        url: newSrc,
        size: file.size,
        addedAt: Date.now(),
      };
      newQueue = [...queue, newItem];
      queueIdx = newQueue.length - 1;
    }

    set({
      videoFile: file,
      videoSrc: newSrc,
      fileName: file.name,
      fileSize: file.size,
      fileMimeType: file.type || null,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      duration: 0,
      buffered: 0,
      playbackSpeed: 1,
      isFullscreen: false,
      isLoading: true,
      hasError: false,
      errorMessage: null,
      isControlsVisible: true,
      isVideoLoaded: false,
      resolution: null,
      codecInfo: null,
      abRepeat: { a: null, b: null, active: false },
      queue: newQueue,
      currentQueueIndex: queueIdx,
    });

    // Record in media metadata database
    mediaMetadataDb.saveMediaItem({
      id: `${file.name}_${file.size}`,
      name: file.name,
      size: file.size,
      duration: 0,
      lastPlayed: Date.now(),
      continueTime: 0,
      isFavorite: false,
      collections: ['Local Videos'],
    });

    // Load saved bookmarks
    get().loadBookmarksForCurrentVideo();
  },

  loadUrl: (url, name) => {
    const { videoSrc, queue } = get();
    if (videoSrc && videoSrc.startsWith('blob:')) {
      URL.revokeObjectURL(videoSrc);
    }

    const guessedName = name || url.split('?')[0].split('/').pop() || 'Video Stream';

    let queueIdx = queue.findIndex((q) => q.url === url);
    let newQueue = queue;
    if (queueIdx === -1) {
      const newItem: QueueItem = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: guessedName,
        url,
        size: 0,
        addedAt: Date.now(),
      };
      newQueue = [...queue, newItem];
      queueIdx = newQueue.length - 1;
    }

    set({
      videoFile: null,
      videoSrc: url,
      fileName: guessedName,
      fileSize: 0,
      fileMimeType: url.includes('.m3u8') ? 'application/x-mpegURL' : null,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      duration: 0,
      buffered: 0,
      playbackSpeed: 1,
      isFullscreen: false,
      isLoading: true,
      hasError: false,
      errorMessage: null,
      isControlsVisible: true,
      isVideoLoaded: false,
      resolution: null,
      codecInfo: url.includes('.m3u8') ? 'HLS Stream' : null,
      abRepeat: { a: null, b: null, active: false },
      queue: newQueue,
      currentQueueIndex: queueIdx,
    });

    get().loadBookmarksForCurrentVideo();
  },

  setPlaying: (playing) => set({ isPlaying: playing }),
  setPaused: (paused) => set({ isPaused: paused }),
  setCurrentTime: (time) => {
    const { abRepeat } = get();
    // A-B Repeat loop enforcement
    if (abRepeat.active && abRepeat.a !== null && abRepeat.b !== null) {
      if (time >= abRepeat.b) {
        set({ currentTime: abRepeat.a });
        return;
      }
    }
    set({ currentTime: time });
  },
  setDuration: (duration) => set({ duration }),
  setBuffered: (percent) => set({ buffered: percent }),

  setVolume: (vol) => {
    const update: Partial<VideoPlayerState> = {
      volume: vol,
      isMuted: vol === 0,
    };
    if (vol > 0) update.previousVolume = vol;
    set(update);
  },

  toggleMute: () => {
    const { isMuted, volume, previousVolume } = get();
    if (isMuted) {
      set({ isMuted: false, volume: previousVolume });
    } else {
      set({ isMuted: true, previousVolume: volume, volume: 0 });
    }
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setFullscreen: (fs) => set({ isFullscreen: fs }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (message) => set({ hasError: true, errorMessage: message, isLoading: false }),
  clearError: () => set({ hasError: false, errorMessage: null }),
  setControlsVisible: (visible) => set({ isControlsVisible: visible }),
  setVideoLoaded: () => set({ isVideoLoaded: true, isLoading: false }),
  setResolution: (resolution) => set({ resolution }),
  setCodecInfo: (codecInfo) => set({ codecInfo }),

  // ── Feature 1: Smart Timeline Markers & A-B Repeat ──────────────────────
  addMarker: (time, label, type = 'custom', color = '#06b6d4') => {
    const newMarker: TimelineMarker = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      time,
      label,
      type,
      color,
    };
    const nextMarkers = [...get().markers, newMarker].sort((a, b) => a.time - b.time);
    set({ markers: nextMarkers });
  },

  removeMarker: (id) => {
    set({ markers: get().markers.filter((m) => m.id !== id) });
  },

  setPointA: (time) => {
    const t = time !== undefined ? time : get().currentTime;
    const { abRepeat } = get();
    const newB = abRepeat.b !== null && abRepeat.b > t ? abRepeat.b : null;
    set({
      abRepeat: {
        a: t,
        b: newB,
        active: newB !== null,
      },
    });
  },

  setPointB: (time) => {
    const t = time !== undefined ? time : get().currentTime;
    const { abRepeat } = get();
    if (abRepeat.a !== null && t > abRepeat.a) {
      set({
        abRepeat: {
          a: abRepeat.a,
          b: t,
          active: true,
        },
      });
    }
  },

  clearAbRepeat: () => {
    set({ abRepeat: { a: null, b: null, active: false } });
  },

  // ── Feature 2: Playback Queue ───────────────────────────────────────────
  addToQueue: (items) => {
    const newQueueItems: QueueItem[] = items.map((item) => {
      const isFile = item instanceof File;
      const name = isFile ? item.name : item.name;
      const size = isFile ? item.size : item.size || 0;
      const url = isFile ? URL.createObjectURL(item) : item.url;
      return {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        file: isFile ? item : undefined,
        url,
        size,
        duration: isFile ? undefined : item.duration,
        addedAt: Date.now(),
      };
    });

    const nextQueue = [...get().queue, ...newQueueItems];
    set({ queue: nextQueue });
    mediaMetadataDb.saveQueue(nextQueue);
  },

  removeFromQueue: (id) => {
    const { queue, currentQueueIndex } = get();
    const itemIndex = queue.findIndex((q) => q.id === id);
    if (itemIndex === -1) return;

    const item = queue[itemIndex];
    if (item.file && item.url.startsWith('blob:') && item.url !== get().videoSrc) {
      URL.revokeObjectURL(item.url);
    }

    const nextQueue = queue.filter((q) => q.id !== id);
    let nextIndex = currentQueueIndex;
    if (itemIndex < currentQueueIndex) {
      nextIndex -= 1;
    } else if (itemIndex === currentQueueIndex) {
      nextIndex = Math.min(nextIndex, nextQueue.length - 1);
    }

    set({ queue: nextQueue, currentQueueIndex: nextIndex });
    mediaMetadataDb.saveQueue(nextQueue);
  },

  clearQueue: () => {
    const { queue, videoSrc } = get();
    for (const item of queue) {
      if (item.url.startsWith('blob:') && item.url !== videoSrc) {
        URL.revokeObjectURL(item.url);
      }
    }
    set({ queue: [], currentQueueIndex: -1 });
    mediaMetadataDb.saveQueue([]);
  },

  reorderQueue: (startIndex, endIndex) => {
    const { queue, currentQueueIndex } = get();
    if (startIndex < 0 || startIndex >= queue.length || endIndex < 0 || endIndex >= queue.length) return;

    const result = Array.from(queue);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    let nextIndex = currentQueueIndex;
    if (currentQueueIndex === startIndex) {
      nextIndex = endIndex;
    } else if (startIndex < currentQueueIndex && endIndex >= currentQueueIndex) {
      nextIndex -= 1;
    } else if (startIndex > currentQueueIndex && endIndex <= currentQueueIndex) {
      nextIndex += 1;
    }

    set({ queue: result, currentQueueIndex: nextIndex });
    mediaMetadataDb.saveQueue(result);
  },

  playQueueItem: (index) => {
    const { queue } = get();
    const item = queue[index];
    if (!item) return;

    if (item.file) {
      get().loadVideo(item.file);
    } else {
      get().loadUrl(item.url, item.name);
    }
    set({ currentQueueIndex: index });
  },

  playNext: () => {
    const { queue, currentQueueIndex, repeatMode, isShuffled } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentQueueIndex >= 0) {
      get().playQueueItem(currentQueueIndex);
      return;
    }

    if (isShuffled && queue.length > 1) {
      let randIdx = Math.floor(Math.random() * queue.length);
      if (randIdx === currentQueueIndex) {
        randIdx = (randIdx + 1) % queue.length;
      }
      get().playQueueItem(randIdx);
      return;
    }

    const nextIndex = currentQueueIndex + 1;
    if (nextIndex < queue.length) {
      get().playQueueItem(nextIndex);
    } else if (repeatMode === 'all') {
      get().playQueueItem(0);
    }
  },

  playPrevious: () => {
    const { queue, currentQueueIndex, currentTime } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart current track first
    if (currentTime > 3) {
      get().setCurrentTime(0);
      return;
    }

    const prevIndex = currentQueueIndex - 1;
    if (prevIndex >= 0) {
      get().playQueueItem(prevIndex);
    } else {
      get().playQueueItem(queue.length - 1);
    }
  },

  setRepeatMode: (mode) => set({ repeatMode: mode }),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

  // ── Feature 3: Subtitle Studio ──────────────────────────────────────────
  loadSubtitleFile: async (file) => {
    try {
      const text = await file.text();
      const trackId = `sub_${Date.now()}`;
      const track = parseSubtitleText(text, trackId, file.name);

      set((state) => ({
        subtitleTracks: [...state.subtitleTracks, track],
        activeSubtitleTrackId: trackId,
      }));
    } catch (err) {
      console.error('Failed to parse subtitle file:', err);
    }
  },

  setActiveSubtitleTrack: (id) => set({ activeSubtitleTrackId: id }),
  setSubtitleOffset: (offset) => set({ subtitleOffset: offset }),
  updateSubtitleStyles: (styles) => {
    set((state) => {
      const next = { ...state.subtitleStyles, ...styles };
      mediaMetadataDb.setPreference('subtitle_styles', next);
      return { subtitleStyles: next };
    });
  },

  // ── Feature 4: Audio Studio ─────────────────────────────────────────────
  setEqBand: (bandIndex, gain) => {
    const nextGains = [...get().eqGains];
    nextGains[bandIndex] = gain;
    audioStudioEngine.setBandGain(bandIndex, gain);
    set({ eqGains: nextGains, eqPreset: 'custom' });
    mediaMetadataDb.setPreference('eq_gains', nextGains);
  },

  setEqPreset: (presetKey) => {
    const preset = AUDIO_PRESETS[presetKey];
    if (preset) {
      audioStudioEngine.applyPreset(presetKey);
      set({
        eqPreset: presetKey,
        eqGains: [...preset.gains],
        bassGain: preset.bass || 0,
        trebleGain: preset.treble || 0,
      });
      mediaMetadataDb.setPreference('eq_preset', presetKey);
    }
  },

  setStereoPan: (pan) => {
    audioStudioEngine.setPan(pan);
    set({ stereoPan: pan });
  },

  setAudioDelay: (delay) => {
    audioStudioEngine.setAudioDelay(delay);
    set({ audioDelay: delay });
  },

  setBassGain: (gain) => {
    audioStudioEngine.setBass(gain);
    set({ bassGain: gain });
  },

  setTrebleGain: (gain) => {
    audioStudioEngine.setTreble(gain);
    set({ trebleGain: gain });
  },

  resetAudioStudio: () => {
    audioStudioEngine.reset();
    set({
      eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      eqPreset: 'flat',
      stereoPan: 0,
      audioDelay: 0,
      bassGain: 0,
      trebleGain: 0,
    });
  },

  // ── Feature 6: Panels & Mini Player ─────────────────────────────────────
  setActivePanel: (panel) => {
    set((state) => ({ activePanel: state.activePanel === panel ? 'none' : panel }));
  },

  setMiniPlayer: (isMini) => set({ isMiniPlayer: isMini }),

  // ── Feature 7: Bookmarks ────────────────────────────────────────────────
  addBookmark: async (time, note = '', thumbnailDataUrl) => {
    const { fileName, fileSize } = get();
    const mediaId = `${fileName || 'unknown'}_${fileSize}`;
    const newBookmark: MediaBookmark = {
      id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mediaId,
      videoName: fileName || 'Video',
      timestamp: time,
      note,
      thumbnailDataUrl,
      createdAt: Date.now(),
    };

    await mediaMetadataDb.saveBookmark(newBookmark);
    set((state) => ({ bookmarks: [...state.bookmarks, newBookmark].sort((a, b) => a.timestamp - b.timestamp) }));
  },

  removeBookmark: async (id) => {
    await mediaMetadataDb.deleteBookmark(id);
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) }));
  },

  loadBookmarksForCurrentVideo: async () => {
    const { fileName, fileSize } = get();
    const mediaId = `${fileName || 'unknown'}_${fileSize}`;
    const list = await mediaMetadataDb.getBookmarks(mediaId);
    set({ bookmarks: list });
  },

  // ── Teardown ────────────────────────────────────────────────────────────
  closeVideo: () => {
    const { videoSrc } = get();
    if (videoSrc && videoSrc.startsWith('blob:')) {
      URL.revokeObjectURL(videoSrc);
    }
    audioStudioEngine.reset();
    set({ ...initialState });
  },

  reset: () => {
    const { videoSrc } = get();
    if (videoSrc && videoSrc.startsWith('blob:')) {
      URL.revokeObjectURL(videoSrc);
    }
    audioStudioEngine.reset();
    set({ ...initialState });
  },
}));
