/**
 * MASTER CLOUD - Media Library 2.0 & 3.0 IndexedDB Persistence Service
 * Persists local video metadata, continue watching checkpoints,
 * bookmarks with screenshot previews, collections, detected scenes,
 * playback analytics, duplicates, and audio/subtitle preferences.
 */

export interface MediaLibraryItem {
  id: string;
  name: string;
  size: number;
  duration: number;
  resolution?: string;
  lastPlayed: number;
  continueTime: number; // in seconds
  isFavorite: boolean;
  collections: string[];
  thumbnailDataUrl?: string;
  // Phase 3 additions:
  category?: string; // 'Movies' | 'TV Shows' | 'Clips' | 'Courses' | 'Music' | 'Personal' | 'Other'
  tags?: string[];
  hash?: string; // SHA-256 chunk hash
  codec?: string;
  bitrate?: number; // in kbps
  playCount?: number;
  totalWatchTime?: number; // cumulative seconds watched
  isCorrupt?: boolean;
  healthNote?: string;
}

export interface MediaBookmark {
  id: string;
  mediaId: string;
  videoName: string;
  timestamp: number;
  note: string;
  thumbnailDataUrl?: string;
  createdAt: number;
}

export interface StoredQueueItem {
  id: string;
  name: string;
  size?: number;
  duration?: number;
  url?: string;
  addedAt: number;
}

export interface DetectedScene {
  id: string;
  mediaId: string;
  start: number; // in seconds
  end: number;   // in seconds
  label: string;
  thumbnailDataUrl?: string;
  differenceScore?: number;
  isCustom?: boolean;
}

export interface PlaybackSessionLog {
  id: string;
  mediaId: string;
  videoName: string;
  timestamp: number;
  watchedSeconds: number;
  completionPercentage: number;
  duration: number;
}

export interface DuplicateGroup {
  hash: string;
  totalSize: number;
  items: MediaLibraryItem[];
}

class MediaMetadataDbService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private memoryLibrary = new Map<string, MediaLibraryItem>();
  private memoryBookmarks = new Map<string, MediaBookmark>();
  private memoryQueue: StoredQueueItem[] = [];
  private memoryScenes = new Map<string, DetectedScene>();
  private memoryAnalytics: PlaybackSessionLog[] = [];

  private getDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        if (typeof window === 'undefined' || !window.indexedDB) {
          resolve(null);
          return;
        }

        const request = indexedDB.open('MasterCloud_MediaStudio_DB', 2);

        request.onupgradeneeded = (event) => {
          const db = request.result;
          if (!db.objectStoreNames.contains('mediaLibrary')) {
            const store = db.createObjectStore('mediaLibrary', { keyPath: 'id' });
            store.createIndex('name', 'name', { unique: false });
            store.createIndex('lastPlayed', 'lastPlayed', { unique: false });
            store.createIndex('isFavorite', 'isFavorite', { unique: false });
          }
          if (!db.objectStoreNames.contains('bookmarks')) {
            const store = db.createObjectStore('bookmarks', { keyPath: 'id' });
            store.createIndex('mediaId', 'mediaId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
          if (!db.objectStoreNames.contains('queue')) {
            db.createObjectStore('queue', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('preferences')) {
            db.createObjectStore('preferences');
          }
          // Phase 3 stores
          if (!db.objectStoreNames.contains('scenes')) {
            const store = db.createObjectStore('scenes', { keyPath: 'id' });
            store.createIndex('mediaId', 'mediaId', { unique: false });
            store.createIndex('start', 'start', { unique: false });
          }
          if (!db.objectStoreNames.contains('analytics')) {
            const store = db.createObjectStore('analytics', { keyPath: 'id' });
            store.createIndex('mediaId', 'mediaId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  // ─── Media Library Items ──────────────────────────────────────────────

  async saveMediaItem(item: MediaLibraryItem): Promise<void> {
    try {
      this.memoryLibrary.set(item.id, item);
      const db = await this.getDB();
      if (!db) return;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('mediaLibrary', 'readwrite');
          const store = tx.objectStore('mediaLibrary');
          store.put(item);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    } catch {
      // safe fallback
    }
  }

  async getMediaItem(id: string): Promise<MediaLibraryItem | null> {
    try {
      const db = await this.getDB();
      if (!db) return this.memoryLibrary.get(id) || null;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('mediaLibrary', 'readonly');
          const store = tx.objectStore('mediaLibrary');
          const req = store.get(id);
          req.onsuccess = () => resolve(req.result || this.memoryLibrary.get(id) || null);
          req.onerror = () => resolve(this.memoryLibrary.get(id) || null);
        } catch {
          resolve(this.memoryLibrary.get(id) || null);
        }
      });
    } catch {
      return this.memoryLibrary.get(id) || null;
    }
  }

  async getAllMediaItems(): Promise<MediaLibraryItem[]> {
    try {
      const db = await this.getDB();
      if (!db) return Array.from(this.memoryLibrary.values());

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('mediaLibrary', 'readonly');
          const store = tx.objectStore('mediaLibrary');
          const req = store.getAll();
          req.onsuccess = () => {
            const list = req.result || [];
            if (list.length === 0 && this.memoryLibrary.size > 0) {
              resolve(Array.from(this.memoryLibrary.values()));
            } else {
              resolve(list);
            }
          };
          req.onerror = () => resolve(Array.from(this.memoryLibrary.values()));
        } catch {
          resolve(Array.from(this.memoryLibrary.values()));
        }
      });
    } catch {
      return Array.from(this.memoryLibrary.values());
    }
  }

  async updateContinueTime(id: string, time: number, duration?: number): Promise<void> {
    const existing = await this.getMediaItem(id);
    if (existing) {
      existing.continueTime = time;
      existing.lastPlayed = Date.now();
      if (duration && duration > 0) existing.duration = duration;
      await this.saveMediaItem(existing);
    }
  }

  async updateMediaMetadata(id: string, updates: Partial<MediaLibraryItem>): Promise<void> {
    const existing = await this.getMediaItem(id);
    if (existing) {
      const merged = { ...existing, ...updates };
      await this.saveMediaItem(merged);
    }
  }

  async incrementPlayCount(id: string, watchedSeconds: number): Promise<void> {
    const existing = await this.getMediaItem(id);
    if (existing) {
      existing.playCount = (existing.playCount || 0) + 1;
      existing.totalWatchTime = (existing.totalWatchTime || 0) + watchedSeconds;
      existing.lastPlayed = Date.now();
      await this.saveMediaItem(existing);
    }
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const item = await this.getMediaItem(id);
    if (item) {
      item.isFavorite = !item.isFavorite;
      await this.saveMediaItem(item);
      return item.isFavorite;
    }
    return false;
  }

  async removeMediaItem(id: string): Promise<void> {
    this.memoryLibrary.delete(id);
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('mediaLibrary', 'readwrite');
        tx.objectStore('mediaLibrary').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async deleteMediaItem(id: string): Promise<void> {
    return this.removeMediaItem(id);
  }

  // ─── Phase 3: Smart Scene Detection ───────────────────────────────────

  async saveScenes(mediaId: string, scenes: DetectedScene[]): Promise<void> {
    try {
      scenes.forEach((s) => this.memoryScenes.set(s.id, s));
      const db = await this.getDB();
      if (!db) return;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('scenes', 'readwrite');
          const store = tx.objectStore('scenes');
          for (const scene of scenes) {
            store.put(scene);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    } catch {
      // safe fallback
    }
  }

  async getScenes(mediaId: string): Promise<DetectedScene[]> {
    try {
      const db = await this.getDB();
      if (!db) {
        return Array.from(this.memoryScenes.values())
          .filter((s) => s.mediaId === mediaId)
          .sort((a, b) => a.start - b.start);
      }

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('scenes', 'readonly');
          const store = tx.objectStore('scenes');
          const index = store.index('mediaId');
          const req = index.getAll(mediaId);
          req.onsuccess = () => {
            const list: DetectedScene[] = req.result || [];
            list.sort((a, b) => a.start - b.start);
            resolve(list);
          };
          req.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });
    } catch {
      return [];
    }
  }

  async deleteScene(id: string): Promise<void> {
    this.memoryScenes.delete(id);
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('scenes', 'readwrite');
        tx.objectStore('scenes').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // ─── Phase 3: Playback Analytics ──────────────────────────────────────

  async recordPlaybackSession(session: PlaybackSessionLog): Promise<void> {
    try {
      this.memoryAnalytics.push(session);
      const db = await this.getDB();
      if (!db) return;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('analytics', 'readwrite');
          tx.objectStore('analytics').put(session);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    } catch {
      // safe fallback
    }
  }

  async getAllPlaybackSessions(): Promise<PlaybackSessionLog[]> {
    try {
      const db = await this.getDB();
      if (!db) {
        return [...this.memoryAnalytics].sort((a, b) => b.timestamp - a.timestamp);
      }

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('analytics', 'readonly');
          const store = tx.objectStore('analytics');
          const req = store.getAll();
          req.onsuccess = () => {
            const list: PlaybackSessionLog[] = req.result || [];
            list.sort((a, b) => b.timestamp - a.timestamp);
            resolve(list);
          };
          req.onerror = () => resolve(this.memoryAnalytics);
        } catch {
          resolve(this.memoryAnalytics);
        }
      });
    } catch {
      return this.memoryAnalytics;
    }
  }

  async clearPlaybackAnalytics(): Promise<void> {
    this.memoryAnalytics = [];
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('analytics', 'readwrite');
        tx.objectStore('analytics').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // ─── Bookmarks ────────────────────────────────────────────────────────

  async addBookmark(bookmark: MediaBookmark): Promise<void> {
    try {
      this.memoryBookmarks.set(bookmark.id, bookmark);
      const db = await this.getDB();
      if (!db) return;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('bookmarks', 'readwrite');
          tx.objectStore('bookmarks').put(bookmark);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    } catch {
      // safe fallback
    }
  }

  async getBookmarksForMedia(mediaId: string): Promise<MediaBookmark[]> {
    try {
      const db = await this.getDB();
      if (!db) {
        return Array.from(this.memoryBookmarks.values())
          .filter((b) => b.mediaId === mediaId)
          .sort((a, b) => a.timestamp - b.timestamp);
      }

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('bookmarks', 'readonly');
          const store = tx.objectStore('bookmarks');
          const index = store.index('mediaId');
          const req = index.getAll(mediaId);
          req.onsuccess = () => {
            const list = req.result || [];
            list.sort((a: MediaBookmark, b: MediaBookmark) => a.timestamp - b.timestamp);
            resolve(list);
          };
          req.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });
    } catch {
      return [];
    }
  }

  async removeBookmark(id: string): Promise<void> {
    this.memoryBookmarks.delete(id);
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('bookmarks', 'readwrite');
        tx.objectStore('bookmarks').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // ─── Queue Persistence ────────────────────────────────────────────────

  async saveQueue(items: StoredQueueItem[]): Promise<void> {
    try {
      this.memoryQueue = [...items];
      const db = await this.getDB();
      if (!db) return;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('queue', 'readwrite');
          const store = tx.objectStore('queue');
          store.clear();
          for (const item of items) {
            store.put(item);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    } catch {
      // safe fallback
    }
  }

  async getStoredQueue(): Promise<StoredQueueItem[]> {
    const db = await this.getDB();
    if (!db) return this.memoryQueue;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('queue', 'readonly');
        const req = tx.objectStore('queue').getAll();
        req.onsuccess = () => resolve(req.result || this.memoryQueue);
        req.onerror = () => resolve(this.memoryQueue);
      } catch {
        resolve(this.memoryQueue);
      }
    });
  }

  // ─── Preferences (EQ, Subtitle styles, etc.) ──────────────────────────

  async setPreference<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`mc_vp_${key}`, JSON.stringify(value));
      }
      const db = await this.getDB();
      if (!db) return;

      const tx = db.transaction('preferences', 'readwrite');
      tx.objectStore('preferences').put(value, key);
    } catch {
      // safe fallback
    }
  }

  async getPreference<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = localStorage.getItem(`mc_vp_${key}`);
        if (cached !== null) {
          try {
            return JSON.parse(cached) as T;
          } catch {
            // continue
          }
        }
      }
      const db = await this.getDB();
      if (!db) return defaultValue;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('preferences', 'readonly');
          const req = tx.objectStore('preferences').get(key);
          req.onsuccess = () => resolve(req.result !== undefined ? req.result : defaultValue);
          req.onerror = () => resolve(defaultValue);
        } catch {
          resolve(defaultValue);
        }
      });
    } catch {
      return defaultValue;
    }
  }
}

export const mediaMetadataDb = new MediaMetadataDbService();
