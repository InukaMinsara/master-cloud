import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  RotateCcw,
  Settings,
  Loader2,
  AlertTriangle,
  Sparkles,
  Captions,
  Sliders,
  ListVideo,
  Bookmark,
  Camera,
  Film,
  PictureInPicture,
} from 'lucide-react';
import Hls from 'hls.js';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import { detectBrowserCodecSupport } from '@/lib/videoCodecs';
import { mediaMetadataDb } from '@/services/mediaMetadataDb';
import { audioStudioEngine } from '@/services/audioStudioEngine';
import { downloadVideoScreenshot } from '@/services/screenshotService';
import { SmartTimeline } from './SmartTimeline';
import { SubtitleOverlay } from './SubtitleOverlay';
import { MiniPlayer } from './MiniPlayer';
import { QueueDrawer } from './panels/QueueDrawer';
import { SubtitleStudioModal } from './panels/SubtitleStudioModal';
import { AudioStudioModal } from './panels/AudioStudioModal';
import { BookmarksDrawer } from './panels/BookmarksDrawer';
import { MediaLibraryModal } from './panels/MediaLibraryModal';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getResolutionBadge(width?: number, height?: number): string | null {
  if (!width || !height) return null;
  if (width >= 3840 || height >= 2160) return '4K UHD';
  if (width >= 2560 || height >= 1440) return '2K QHD';
  if (width >= 1920 || height >= 1080) return '1080p FHD';
  if (width >= 1280 || height >= 720) return '720p HD';
  if (height >= 480) return '480p';
  return `${width}×${height}`;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
const CONTROLS_HIDE_DELAY = 3000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VideoPlayer() {
  // ---- Refs ---------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const lastSavedTimeRef = useRef(0);
  const dragCounterRef = useRef(0);

  // ---- Local UI state -----------------------------------------------------
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [isPlayerDraggingOver, setIsPlayerDraggingOver] = useState(false);

  // ---- Store Selectors ----------------------------------------------------
  const videoSrc = useVideoPlayerStore((s) => s.videoSrc);
  const videoFile = useVideoPlayerStore((s) => s.videoFile);
  const fileName = useVideoPlayerStore((s) => s.fileName);
  const isPlaying = useVideoPlayerStore((s) => s.isPlaying);
  const currentTime = useVideoPlayerStore((s) => s.currentTime);
  const duration = useVideoPlayerStore((s) => s.duration);
  const volume = useVideoPlayerStore((s) => s.volume);
  const isMuted = useVideoPlayerStore((s) => s.isMuted);
  const playbackSpeed = useVideoPlayerStore((s) => s.playbackSpeed);
  const isFullscreen = useVideoPlayerStore((s) => s.isFullscreen);
  const isLoading = useVideoPlayerStore((s) => s.isLoading);
  const hasError = useVideoPlayerStore((s) => s.hasError);
  const errorMessage = useVideoPlayerStore((s) => s.errorMessage);
  const isControlsVisible = useVideoPlayerStore((s) => s.isControlsVisible);
  const resolution = useVideoPlayerStore((s) => s.resolution);
  const activePanel = useVideoPlayerStore((s) => s.activePanel);
  const isMiniPlayer = useVideoPlayerStore((s) => s.isMiniPlayer);
  const queue = useVideoPlayerStore((s) => s.queue);
  const currentQueueIndex = useVideoPlayerStore((s) => s.currentQueueIndex);
  const bookmarks = useVideoPlayerStore((s) => s.bookmarks);
  const abRepeat = useVideoPlayerStore((s) => s.abRepeat);

  const actions = useVideoPlayerStore((s) => ({
    loadVideo: s.loadVideo,
    setPlaying: s.setPlaying,
    setPaused: s.setPaused,
    setCurrentTime: s.setCurrentTime,
    setDuration: s.setDuration,
    setBuffered: s.setBuffered,
    setVolume: s.setVolume,
    toggleMute: s.toggleMute,
    setPlaybackSpeed: s.setPlaybackSpeed,
    setFullscreen: s.setFullscreen,
    setLoading: s.setLoading,
    setError: s.setError,
    clearError: s.clearError,
    setControlsVisible: s.setControlsVisible,
    setVideoLoaded: s.setVideoLoaded,
    setResolution: s.setResolution,
    setActivePanel: s.setActivePanel,
    setMiniPlayer: s.setMiniPlayer,
    setPointA: s.setPointA,
    setPointB: s.setPointB,
    clearAbRepeat: s.clearAbRepeat,
    playNext: s.playNext,
    playPrevious: s.playPrevious,
  }));

  // ---- Codec compatibility pre-check --------------------------------------
  useEffect(() => {
    if (videoFile) {
      const probe = detectBrowserCodecSupport(videoFile);
      if (!probe.isSupported) {
        toast.warning(`Format Alert: ${probe.formatName}`, {
          description: probe.recommendedAction || probe.details || 'This video format may not be natively supported.',
          duration: 5000,
        });
      }
    }
  }, [videoFile]);

  // ---- HLS.js and Source Handling -----------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    const isHls =
      videoSrc.includes('.m3u8') ||
      (!videoSrc.startsWith('blob:') && videoSrc.includes('m3u8'));

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsInstanceRef.current = hls;

      hls.loadSource(videoSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              actions.setError(`HLS Stream Error: ${data.details || 'Unable to play stream'}`);
              break;
          }
        }
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
    } else {
      video.src = videoSrc;
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [videoSrc, actions]);

  // ---- Controls auto-hide -------------------------------------------------
  const showControls = useCallback(() => {
    actions.setControlsVisible(true);

    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }

    if (useVideoPlayerStore.getState().isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        actions.setControlsVisible(false);
      }, CONTROLS_HIDE_DELAY);
    }
  }, [actions]);

  useEffect(() => {
    if (isPlaying) {
      showControls();
    } else {
      actions.setControlsVisible(true);
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = null;
      }
    }
  }, [isPlaying, actions, showControls]);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      audioStudioEngine.cleanup();
    };
  }, []);

  // ---- Fullscreen listener ------------------------------------------------
  useEffect(() => {
    const handleFsChange = () => {
      const isFull = !!document.fullscreenElement;
      actions.setFullscreen(isFull);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [actions]);

  // ---- Video element event handlers ---------------------------------------
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    actions.setDuration(video.duration);
    actions.setVideoLoaded();

    if (video.videoWidth && video.videoHeight) {
      actions.setResolution({ width: video.videoWidth, height: video.videoHeight });
    }

    // Attach Web Audio API Studio Engine (10-Band EQ, Tone, Delay, Balance)
    try {
      audioStudioEngine.attachVideo(video);
      const storeState = useVideoPlayerStore.getState();
      audioStudioEngine.setAllBands(storeState.eqGains);
      audioStudioEngine.setBass(storeState.bassGain);
      audioStudioEngine.setTreble(storeState.trebleGain);
      audioStudioEngine.setPan(storeState.stereoPan);
      audioStudioEngine.setAudioDelay(storeState.audioDelay);
    } catch (e) {
      console.warn('AudioStudio attach error:', e);
    }

    // Persist media metadata to IndexedDB & restore checkpoint if available
    const mediaId = `${videoFile?.name || 'video'}_${videoFile?.size || 0}`;
    mediaMetadataDb
      .saveMediaItem({
        id: mediaId,
        name: videoFile?.name || fileName || 'Video',
        size: videoFile?.size || 0,
        duration: video.duration || 0,
        resolution: video.videoWidth && video.videoHeight ? `${video.videoWidth}×${video.videoHeight}` : undefined,
        lastPlayed: Date.now(),
        continueTime: 0,
        isFavorite: false,
        collections: [],
      })
      .then(() => {
        mediaMetadataDb.getMediaItem(mediaId).then((item) => {
          if (item && item.continueTime > 5 && item.continueTime < (video.duration - 5)) {
            toast.info(`Resuming from ${formatTime(item.continueTime)}`, {
              duration: 4000,
              action: {
                label: 'Restart',
                onClick: () => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    actions.setCurrentTime(0);
                  }
                },
              },
            });
            video.currentTime = item.continueTime;
            actions.setCurrentTime(item.continueTime);
          }
        });
      });

    // Apply speed and volume
    video.playbackRate = playbackSpeed;
    video.volume = volume;
    video.muted = isMuted;

    video
      .play()
      .then(() => {
        actions.setPlaying(true);
      })
      .catch(() => {
        // Autoplay blocked by browser policy
      });
  }, [actions, playbackSpeed, volume, isMuted, videoFile, fileName]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    actions.setCurrentTime(video.currentTime);

    // Feature 1: A-B Repeat Loop Check
    const state = useVideoPlayerStore.getState();
    if (state.abRepeat.active && state.abRepeat.b !== null && state.abRepeat.a !== null && video.currentTime >= state.abRepeat.b) {
      video.currentTime = state.abRepeat.a;
      actions.setCurrentTime(state.abRepeat.a);
      return;
    }

    // Feature 5: Throttled Continue Watching Persistence (every 3s)
    const now = Date.now();
    if (now - lastSavedTimeRef.current > 3000) {
      lastSavedTimeRef.current = now;
      const mediaId = `${videoFile?.name || 'video'}_${videoFile?.size || 0}`;
      mediaMetadataDb.updateContinueTime(mediaId, video.currentTime, video.duration);
    }
  }, [actions, videoFile]);

  const handleProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.duration === 0) return;
    const buf = video.buffered;
    if (buf.length > 0) {
      const end = buf.end(buf.length - 1);
      actions.setBuffered((end / video.duration) * 100);
    }
  }, [actions]);

  const handlePlay = useCallback(() => {
    actions.setPlaying(true);
    actions.setPaused(false);
  }, [actions]);

  const handlePause = useCallback(() => {
    actions.setPlaying(false);
    actions.setPaused(true);
  }, [actions]);

  const handleEnded = useCallback(() => {
    const { repeatMode, abRepeat, queue: currentQ, currentQueueIndex: cIdx } = useVideoPlayerStore.getState();
    const video = videoRef.current;

    // A-B Repeat takes highest precedence
    if (abRepeat.active && abRepeat.a !== null && video) {
      video.currentTime = abRepeat.a;
      video.play().catch(() => {});
      return;
    }

    // Repeat one
    if (repeatMode === 'one' && video) {
      video.currentTime = 0;
      video.play().catch(() => {});
      return;
    }

    // Advance queue if more items exist or repeat all
    if (currentQ.length > 1 && (repeatMode === 'all' || cIdx < currentQ.length - 1)) {
      actions.playNext();
    } else {
      actions.setPlaying(false);
      actions.setPaused(true);
    }
  }, [actions]);

  const handleWaiting = useCallback(() => {
    actions.setLoading(true);
  }, [actions]);

  const handleCanPlay = useCallback(() => {
    actions.setLoading(false);
  }, [actions]);

  const handleVideoError = useCallback(() => {
    const video = videoRef.current;
    if (!video?.error) return;
    const code = video.error.code;
    let message = 'An unknown playback error occurred';

    if (code === MediaError.MEDIA_ERR_ABORTED) {
      message = 'Playback was aborted.';
    } else if (code === MediaError.MEDIA_ERR_NETWORK) {
      message = 'A network error occurred while loading the video.';
    } else if (code === MediaError.MEDIA_ERR_DECODE || code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      const ext = videoFile?.name.split('.').pop()?.toUpperCase() || 'this video';
      message = `Your browser cannot decode ${ext}. Browser video engines require standardized codecs like H.264 / AAC (MP4) or VP9 / Opus (WebM). If this file uses HEVC, AC3, or unsupported audio tracks, please convert it or play in a compatible browser.`;
    }

    actions.setError(message);
  }, [actions, videoFile]);

  const handleVolumeChange = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    actions.setVolume(video.volume);
  }, [actions]);

  // ---- Playback control actions -------------------------------------------
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch(() => {
        toast.error('Playback failed — your browser may be blocking playback.');
      });
    } else {
      video.pause();
    }
  }, []);

  const seekRelative = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      const target = Math.max(0, Math.min(video.currentTime + seconds, video.duration || 0));
      video.currentTime = target;
      actions.setCurrentTime(target);
    },
    [actions],
  );

  const changeVolume = useCallback(
    (vol: number) => {
      const video = videoRef.current;
      if (!video) return;
      const clamped = Math.max(0, Math.min(1, vol));
      video.volume = clamped;
      video.muted = clamped === 0;
      actions.setVolume(clamped);
    },
    [actions],
  );

  const handleToggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    actions.toggleMute();
    const next = useVideoPlayerStore.getState();
    video.volume = next.volume;
    video.muted = next.isMuted;
  }, [actions]);

  const changePlaybackSpeed = useCallback(
    (speed: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = speed;
      actions.setPlaybackSpeed(speed);
      setSpeedMenuOpen(false);
      toast.success(`Speed: ${speed}x`);
    },
    [actions],
  );

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {
        toast.error('Fullscreen is not permitted or supported in this browser.');
      });
    }
  }, []);

  // Quick Screenshot Action
  const takeQuickScreenshot = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const base = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'frame';
      await downloadVideoScreenshot(video, `${base}_${Math.floor(video.currentTime)}s`);
      toast.success('Screenshot downloaded as PNG!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Screenshot failed: ${msg}`);
    }
  }, [fileName]);

  // Picture-in-Picture / Mini-Player Toggle
  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
      } catch {
        actions.setMiniPlayer(!isMiniPlayer);
      }
    } else if ('requestPictureInPicture' in video) {
      try {
        await video.requestPictureInPicture();
      } catch {
        actions.setMiniPlayer(true);
      }
    } else {
      actions.setMiniPlayer(!isMiniPlayer);
    }
  }, [actions, isMiniPlayer]);

  // Sync volume / speed to video element on changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = isMuted;
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // ---- Keyboard shortcuts -------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      const key = e.key;
      let handled = true;

      switch (key) {
        case ' ':
        case 'k':
        case 'K':
          togglePlayPause();
          break;
        case 'ArrowLeft':
        case 'j':
        case 'J':
          seekRelative(-10);
          break;
        case 'ArrowRight':
        case 'l':
        case 'L':
          seekRelative(10);
          break;
        case 'ArrowUp':
          changeVolume(volume + 0.1);
          break;
        case 'ArrowDown':
          changeVolume(volume - 0.1);
          break;
        case 'm':
        case 'M':
          handleToggleMute();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'c':
        case 'C':
          actions.setActivePanel('subtitles');
          break;
        case 'e':
        case 'E':
          actions.setActivePanel('audio');
          break;
        case 'q':
        case 'Q':
          actions.setActivePanel('queue');
          break;
        case 'b':
        case 'B':
          actions.setActivePanel('bookmarks');
          break;
        case 's':
        case 'S':
          takeQuickScreenshot();
          break;
        case 'n':
        case 'N':
          actions.playNext();
          break;
        case 'p':
        case 'P':
          actions.playPrevious();
          break;
        case 'i':
        case 'I':
          togglePictureInPicture();
          break;
        case '[':
          actions.setPointA(currentTime);
          toast.info(`A-B Loop: Point A set at ${formatTime(currentTime)}`);
          break;
        case ']':
          actions.setPointB(currentTime);
          toast.info(`A-B Loop: Point B set at ${formatTime(currentTime)}`);
          break;
        case '\\':
          actions.clearAbRepeat();
          toast.info('A-B Loop cleared');
          break;
        case '.':
        case '>': {
          const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed as (typeof PLAYBACK_SPEEDS)[number]);
          if (idx < PLAYBACK_SPEEDS.length - 1) {
            changePlaybackSpeed(PLAYBACK_SPEEDS[idx + 1]);
          }
          break;
        }
        case ',':
        case '<': {
          const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed as (typeof PLAYBACK_SPEEDS)[number]);
          if (idx > 0) {
            changePlaybackSpeed(PLAYBACK_SPEEDS[idx - 1]);
          }
          break;
        }
        default:
          if (/^[0-9]$/.test(key) && duration > 0) {
            const targetTime = (Number(key) / 10) * duration;
            if (videoRef.current) videoRef.current.currentTime = targetTime;
            actions.setCurrentTime(targetTime);
          } else {
            handled = false;
          }
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
        showControls();
      }
    },
    [
      togglePlayPause,
      seekRelative,
      changeVolume,
      handleToggleMute,
      toggleFullscreen,
      changePlaybackSpeed,
      showControls,
      takeQuickScreenshot,
      togglePictureInPicture,
      actions,
      volume,
      playbackSpeed,
      duration,
      currentTime,
    ],
  );

  // ---- Drag and drop new video onto player --------------------------------
  const handlePlayerDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsPlayerDraggingOver(true);
    }
  }, []);

  const handlePlayerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handlePlayerDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsPlayerDraggingOver(false);
    }
  }, []);

  const handlePlayerDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsPlayerDraggingOver(false);
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('video/') || /\.(mp4|mkv|webm|mov|avi|flv|wmv|m4v)$/i.test(file.name),
      );
      if (files.length === 1) {
        actions.loadVideo(files[0]);
        toast.info(`Playing: ${files[0].name}`);
      } else if (files.length > 1) {
        actions.loadVideo(files[0]);
        useVideoPlayerStore.getState().addToQueue(files.slice(1));
        toast.success(`Playing first video, added ${files.length - 1} more to queue!`);
      }
    },
    [actions],
  );

  // ---- Volume icon helper -------------------------------------------------
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const volumeTrackStyle: React.CSSProperties = {
    background: `linear-gradient(
      to right,
      #06b6d4 0%,
      #06b6d4 ${volume * 100}%,
      rgba(255,255,255,0.2) ${volume * 100}%,
      rgba(255,255,255,0.2) 100%
    )`,
  };

  // ---- Close speed menu on outside click ----------------------------------
  const speedMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!speedMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setSpeedMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [speedMenuOpen]);

  if (!videoSrc) return null;

  const resBadge = getResolutionBadge(resolution?.width, resolution?.height);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black rounded-2xl overflow-hidden outline-none group select-none ${
        !isControlsVisible && isPlaying ? 'cursor-none' : ''
      }`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={showControls}
      onDragEnter={handlePlayerDragEnter}
      onDragOver={handlePlayerDragOver}
      onDragLeave={handlePlayerDragLeave}
      onDrop={handlePlayerDrop}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-controls]')) return;
        showControls();
      }}
    >
      {/* ---- Range Input Global Styles ---- */}
      <style>{`
        .vp-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
          transition: height 0.15s ease;
        }
        .vp-range:hover {
          height: 6px;
        }
        .vp-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 6px rgba(0,0,0,0.6);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .vp-range:hover::-webkit-slider-thumb {
          transform: scale(1.3);
        }
        .vp-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border: none;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 6px rgba(0,0,0,0.6);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .vp-range:hover::-moz-range-thumb {
          transform: scale(1.3);
        }
        .vp-range::-webkit-slider-runnable-track {
          border-radius: 9999px;
        }
        .vp-range::-moz-range-track {
          height: 4px;
          border-radius: 9999px;
          background: transparent;
        }
        .vp-volume {
          width: 72px;
        }
      `}</style>

      {/* ---- Video Element ---- */}
      <video
        ref={videoRef}
        preload="metadata"
        playsInline
        className="absolute inset-0 w-full h-full object-contain bg-black"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onError={handleVideoError}
        onVolumeChange={handleVolumeChange}
      />

      {/* ---- Feature 3: Subtitle Overlay ---- */}
      <SubtitleOverlay />

      {/* ---- Drag Over Drop Overlay ---- */}
      {isPlayerDraggingOver && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-cyan-950/80 backdrop-blur-md border-2 border-dashed border-cyan-400">
          <Sparkles className="w-12 h-12 text-cyan-300 animate-pulse mb-2" />
          <span className="text-base font-bold text-white">Drop video to play / enqueue</span>
          <span className="text-xs text-cyan-200/70 mt-1">Single video replaces current; multiple videos enqueue</span>
        </div>
      )}

      {/* ---- Loading Overlay ---- */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <span className="mt-3 text-xs text-white/80 font-medium">Buffering video…</span>
        </div>
      )}

      {/* ---- Error Overlay ---- */}
      {hasError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Video Playback Error</h3>
          <p className="text-white/70 text-xs max-w-md mb-6 leading-relaxed">
            {errorMessage || 'This video format or codec cannot be decoded by your browser.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                actions.clearError();
                const video = videoRef.current;
                if (video && videoSrc) {
                  video.load();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
            <button
              onClick={() => {
                useVideoPlayerStore.getState().closeVideo();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all border border-cyan-500/30"
            >
              Choose Another File
            </button>
          </div>
        </div>
      )}

      {/* ---- Click-to-Play Overlay ---- */}
      {!hasError && (
        <button
          className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {!isPlaying && isControlsVisible && !isLoading && (
            <div className="w-20 h-20 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-2xl shadow-cyan-500/30 transition-transform hover:scale-110">
              <Play className="w-9 h-9 ml-1 fill-black" />
            </div>
          )}
        </button>
      )}

      {/* ---- Top Gradient ---- */}
      <div
        className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* ---- Bottom Controls Bar ---- */}
      <div
        data-controls
        className={`absolute bottom-0 inset-x-0 z-20 transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-14 pb-3 px-4">
          {/* ---- Feature 1: Smart Timeline with Hover Previews, Markers, A-B Repeat ---- */}
          <div className="relative mb-2 px-0.5">
            <SmartTimeline videoRef={videoRef} />
          </div>

          {/* ---- Controls Row ---- */}
          <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
            {/* Left Controls */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Previous in Queue */}
              {queue.length > 1 && (
                <button
                  onClick={actions.playPrevious}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all"
                  title="Previous Video (P)"
                  aria-label="Previous video"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              )}

              {/* Rewind 10s */}
              <button
                onClick={() => seekRelative(-10)}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all"
                title="Rewind 10s (← / J)"
                aria-label="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePlayPause}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-white transition-all"
                title={isPlaying ? 'Pause (Space / K)' : 'Play (Space / K)'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5 fill-white" />
                )}
              </button>

              {/* Forward 10s */}
              <button
                onClick={() => seekRelative(10)}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all"
                title="Forward 10s (→ / L)"
                aria-label="Forward 10 seconds"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Next in Queue */}
              {queue.length > 1 && (
                <button
                  onClick={actions.playNext}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all"
                  title="Next Video (N)"
                  aria-label="Next video"
                >
                  <SkipForward className="w-4 h-4 text-cyan-400" />
                </button>
              )}

              {/* Volume & Mute */}
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={handleToggleMute}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  <VolumeIcon className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  className="vp-range vp-volume hidden sm:block"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  style={volumeTrackStyle}
                  aria-label="Volume slider"
                />
              </div>

              {/* Current Time / Duration */}
              <span className="ml-2 text-xs text-white/70 font-mono tabular-nums whitespace-nowrap select-none">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Resolution Badge */}
              {resBadge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hidden md:inline-block">
                  {resBadge}
                </span>
              )}

              {/* Subtitles Studio Toggle */}
              <button
                onClick={() => actions.setActivePanel('subtitles')}
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                  activePanel === 'subtitles'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                title="Subtitle Studio (C)"
                aria-label="Subtitle studio"
              >
                <Captions className="w-4 h-4" />
              </button>

              {/* Audio Studio Toggle (10-Band EQ) */}
              <button
                onClick={() => actions.setActivePanel('audio')}
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                  activePanel === 'audio'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                title="Audio Studio & 10-Band EQ (E)"
                aria-label="Audio studio"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Bookmarks Drawer Toggle */}
              <button
                onClick={() => actions.setActivePanel('bookmarks')}
                className={`relative p-1.5 sm:p-2 rounded-xl transition-all ${
                  activePanel === 'bookmarks'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                title="Bookmarks & Screenshots (B)"
                aria-label="Bookmarks"
              >
                <Bookmark className="w-4 h-4" />
                {bookmarks.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {bookmarks.length}
                  </span>
                )}
              </button>

              {/* Quick Frame Screenshot */}
              <button
                onClick={takeQuickScreenshot}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all hidden xs:flex"
                title="Capture Screenshot PNG (S)"
                aria-label="Capture screenshot"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Queue Drawer Toggle */}
              <button
                onClick={() => actions.setActivePanel('queue')}
                className={`relative p-1.5 sm:p-2 rounded-xl transition-all ${
                  activePanel === 'queue'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                title="Playback Queue (Q)"
                aria-label="Playback queue"
              >
                <ListVideo className="w-4 h-4" />
                {queue.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-cyan-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {queue.length}
                  </span>
                )}
              </button>

              {/* Media Library 2.0 */}
              <button
                onClick={() => actions.setActivePanel('library')}
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                  activePanel === 'library'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                title="Media Library 2.0"
                aria-label="Media library"
              >
                <Film className="w-4 h-4" />
              </button>

              {/* Playback Speed Menu */}
              <div className="relative" ref={speedMenuRef}>
                <button
                  onClick={() => setSpeedMenuOpen((prev) => !prev)}
                  className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10"
                  title="Playback Speed (< >)"
                  aria-label="Playback speed"
                >
                  {playbackSpeed === 1 ? '1x' : `${playbackSpeed}x`}
                </button>

                {speedMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 py-1 min-w-[110px] bg-zinc-900/95 backdrop-blur-xl rounded-xl border border-white/15 shadow-2xl overflow-hidden z-30">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase text-white/40 tracking-wider">
                      Speed
                    </div>
                    {PLAYBACK_SPEEDS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => changePlaybackSpeed(speed)}
                        className={`w-full px-3 py-1.5 text-xs text-left transition-all ${
                          speed === playbackSpeed
                            ? 'text-cyan-400 bg-cyan-500/10 font-bold'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {speed === 1 ? 'Normal (1x)' : `${speed}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture-in-Picture / Mini Player */}
              <button
                onClick={togglePictureInPicture}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all"
                title="Picture-in-Picture / Mini Player (I)"
                aria-label="Mini player"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-white transition-all"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Phase 2 Modals and Drawers ---- */}
      {activePanel === 'queue' && <QueueDrawer />}
      {activePanel === 'subtitles' && <SubtitleStudioModal />}
      {activePanel === 'audio' && <AudioStudioModal />}
      {activePanel === 'bookmarks' && <BookmarksDrawer videoRef={videoRef} />}
      {activePanel === 'library' && <MediaLibraryModal />}

      {/* ---- Feature 6: In-App Mini Player ---- */}
      <MiniPlayer videoRef={videoRef} />
    </div>
  );
}
