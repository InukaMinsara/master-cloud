/**
 * MASTER CLOUD - Media Library 2.0 IndexedDB Persistence Service
 * Persists local video metadata, continue watching checkpoints,
 * bookmarks with screenshot previews, collections, and audio/subtitle preferences.
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

class MediaMetadataDbService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private memoryLibrary = new Map<string, MediaLibraryItem>();
  private memoryBookmarks = new Map<string, MediaBookmark>();
  private memoryQueue: StoredQueueItem[] = [];

  private getDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        if (typeof window === 'undefined' || !window.indexedDB) {
          resolve(null);
          return;
        }

        const request = indexedDB.open('MasterCloud_MediaStudio_DB', 1);

        request.onupgradeneeded = () => {
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

  async toggleFavorite(id: string): Promise<boolean> {
    const item = await this.getMediaItem(id);
    if (item) {
      item.isFavorite = !item.isFavorite;
      await this.saveMediaItem(item);
      return item.isFavorite;
    }
    return false;
  }

  async deleteMediaItem(id: string): Promise<void> {
    this.memoryLibrary.delete(id);
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('mediaLibrary', 'readwrite');
        const store = tx.objectStore('mediaLibrary');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // ─── Bookmarks ─────────────────────────────────────────────────────────

  async saveBookmark(bookmark: MediaBookmark): Promise<void> {
    this.memoryBookmarks.set(bookmark.id, bookmark);
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('bookmarks', 'readwrite');
        const store = tx.objectStore('bookmarks');
        store.put(bookmark);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async getBookmarks(mediaId?: string): Promise<MediaBookmark[]> {
    const db = await this.getDB();
    if (!db) {
      const list = Array.from(this.memoryBookmarks.values());
      return mediaId ? list.filter((b) => b.mediaId === mediaId) : list;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('bookmarks', 'readonly');
        const store = tx.objectStore('bookmarks');
        const req = store.getAll();
        req.onsuccess = () => {
          let list: MediaBookmark[] = req.result || [];
          if (list.length === 0 && this.memoryBookmarks.size > 0) {
            list = Array.from(this.memoryBookmarks.values());
          }
          if (mediaId) {
            list = list.filter((b) => b.mediaId === mediaId);
          }
          list.sort((a, b) => a.timestamp - b.timestamp);
          resolve(list);
        };
        req.onerror = () => resolve(Array.from(this.memoryBookmarks.values()));
      } catch {
        resolve(Array.from(this.memoryBookmarks.values()));
      }
    });
  }

  async deleteBookmark(id: string): Promise<void> {
    this.memoryBookmarks.delete(id);
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('bookmarks', 'readwrite');
        const store = tx.objectStore('bookmarks');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // ─── Queue Persistence ─────────────────────────────────────────────────

  async saveQueue(items: StoredQueueItem[]): Promise<void> {
    this.memoryQueue = items;
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
  }

  async getQueue(): Promise<StoredQueueItem[]> {
    const db = await this.getDB();
    if (!db) return this.memoryQueue;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('queue', 'readonly');
        const store = tx.objectStore('queue');
        const req = store.getAll();
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
