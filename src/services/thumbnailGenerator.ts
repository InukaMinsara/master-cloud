/**
 * MASTER CLOUD - Smart Timeline Hover Thumbnail Generator
 * Generates frame preview thumbnails using an offscreen canvas and cached video seek.
 */

class ThumbnailGenerator {
  private cache = new Map<string, string>();
  private maxCacheSize = 250;
  private offscreenVideo: HTMLVideoElement | null = null;
  private currentSrc: string | null = null;
  private isSeeking = false;
  private pendingRequests: Array<{
    timestamp: number;
    resolve: (url: string | null) => void;
  }> = [];

  private getOffscreenVideo(src: string): HTMLVideoElement {
    if (!this.offscreenVideo) {
      this.offscreenVideo = document.createElement('video');
      this.offscreenVideo.muted = true;
      this.offscreenVideo.playsInline = true;
      this.offscreenVideo.preload = 'auto';
      this.offscreenVideo.crossOrigin = 'anonymous';
    }

    if (this.currentSrc !== src) {
      this.currentSrc = src;
      this.offscreenVideo.src = src;
    }

    return this.offscreenVideo;
  }

  /**
   * Generates or retrieves a cached preview thumbnail at the given timestamp
   */
  async getThumbnail(src: string, timestamp: number, width = 160, height = 90): Promise<string | null> {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    if (!src || isNaN(timestamp) || timestamp < 0) return null;

    // Cache key quantized to 1-second intervals for optimal performance and memory
    const quantizedTime = Math.floor(timestamp);
    const cacheKey = `${src}_${quantizedTime}_${width}x${height}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || null;
    }

    return new Promise((resolve) => {
      this.pendingRequests.push({ timestamp: quantizedTime, resolve });
      this.processQueue(src, width, height);
    });
  }

  private async processQueue(src: string, width: number, height: number) {
    if (this.isSeeking || this.pendingRequests.length === 0) return;

    this.isSeeking = true;
    const item = this.pendingRequests.shift();
    if (!item) {
      this.isSeeking = false;
      return;
    }

    const { timestamp, resolve } = item;
    const cacheKey = `${src}_${timestamp}_${width}x${height}`;

    if (this.cache.has(cacheKey)) {
      this.isSeeking = false;
      resolve(this.cache.get(cacheKey) || null);
      this.processQueue(src, width, height);
      return;
    }

    try {
      const video = this.getOffscreenVideo(src);

      // Handle seeking
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);

        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

            // LRU eviction
            if (this.cache.size >= this.maxCacheSize) {
              const firstKey = this.cache.keys().next().value;
              if (firstKey) this.cache.delete(firstKey);
            }

            this.cache.set(cacheKey, dataUrl);
            resolve(dataUrl);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        } finally {
          this.isSeeking = false;
          this.processQueue(src, width, height);
        }
      };

      const onError = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        this.isSeeking = false;
        resolve(null);
        this.processQueue(src, width, height);
      };

      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });

      // Seek to target time
      video.currentTime = timestamp;
    } catch {
      this.isSeeking = false;
      resolve(null);
      this.processQueue(src, width, height);
    }
  }

  /**
   * Clears thumbnail cache when video source changes
   */
  clearCache(src?: string) {
    if (src) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(src)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  cleanup() {
    this.clearCache();
    if (this.offscreenVideo) {
      this.offscreenVideo.pause();
      this.offscreenVideo.removeAttribute('src');
      this.offscreenVideo.load();
      this.offscreenVideo = null;
    }
    this.currentSrc = null;
    this.pendingRequests = [];
  }
}

export const thumbnailGenerator = new ThumbnailGenerator();
