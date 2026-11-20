/**
 * src/features/ai/services/masterCloudImageSaveService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER CLOUD — REAL AI IMAGE PERSISTENCE SERVICE
 * Authenticated end-to-end saving of generated, edited, and upscaled images
 * directly to the user's Master Cloud Drive.
 *
 * Guarantees:
 * - CORS-safe retrieval via /api/ai/image/proxy
 * - Automatic "AI Images" destination folder detection/creation
 * - Full binary File upload with real-time percentage progress
 * - Immediate store refresh (useFileStore.getState().fetchItems())
 * - In-flight concurrency lock to prevent duplicate uploads
 * - Full persistence across page reloads
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { api } from '@/services/api';
import { useFileStore } from '@/stores/fileStore';
import { toast } from 'sonner';

export interface SaveImageOptions {
  imageUrl?: string;
  blob?: Blob;
  prompt?: string;
  filename?: string;
  onProgress?: (percent: number) => void;
}

export interface SaveImageResult {
  fileId: string;
  fileName: string;
  folderId: string;
  folderName: string;
  storagePath: string;
}

const SAVED_URLS_CACHE_KEY = 'master_cloud_saved_ai_image_urls_v1';

class MasterCloudImageSaveService {
  private activeSaves = new Set<string>();
  private savedUrls = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SAVED_URLS_CACHE_KEY);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            this.savedUrls = new Set(list);
          }
        }
      } catch {}
    }
  }

  /**
   * Checks if an image URL was previously saved to Master Cloud Drive.
   */
  public isSaved(imageUrl: string): boolean {
    if (!imageUrl) return false;
    return this.savedUrls.has(imageUrl);
  }

  /**
   * Checks if an image URL is currently in the middle of being uploaded.
   */
  public isSaving(imageUrl: string): boolean {
    if (!imageUrl) return false;
    return this.activeSaves.has(imageUrl);
  }

  /**
   * Finds or creates the root "AI Images" folder in Master Cloud Drive.
   */
  public async getOrCreateAiFolder(): Promise<{ id: string; name: string }> {
    try {
      const rootFolders = await api.getFolders(null);
      const existing = rootFolders.find(
        (f) => f.name.toLowerCase() === 'ai images' || f.name.toLowerCase() === 'images'
      );

      if (existing) {
        return { id: existing.id, name: existing.name };
      }

      // Create folder if not found
      const newFolder = await api.createFolder('AI Images', null, '#f97316');
      return { id: newFolder.id, name: newFolder.name };
    } catch (err) {
      console.warn('[MasterCloudImageSaveService] Error getting/creating folder, falling back to root:', err);
      return { id: '', name: 'My Drive' };
    }
  }

  /**
   * Fetches the image blob safely through the server CORS-safe binary proxy.
   */
  public async fetchImageBlob(imageUrl: string): Promise<Blob> {
    const isLocalBlob = imageUrl.startsWith('blob:') || imageUrl.startsWith('data:');
    const fetchUrl = isLocalBlob ? imageUrl : `/api/ai/image/proxy?url=${encodeURIComponent(imageUrl)}`;

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      throw new Error(`Failed to download image bytes (HTTP ${res.status})`);
    }
    return await res.blob();
  }

  /**
   * Saves an AI image (by URL or direct Blob) into Master Cloud.
   */
  public async saveToMasterCloud(options: SaveImageOptions): Promise<SaveImageResult> {
    const lockKey = options.imageUrl || options.filename || 'direct_blob';

    if (this.activeSaves.has(lockKey)) {
      throw new Error('An upload for this image is already in progress.');
    }

    this.activeSaves.add(lockKey);

    try {
      // 1. Acquire Image Blob
      let blob = options.blob;
      if (!blob && options.imageUrl) {
        blob = await this.fetchImageBlob(options.imageUrl);
      }
      if (!blob) {
        throw new Error('No valid image data available to save.');
      }

      // 2. Prepare File Name
      const cleanPrompt = (options.prompt || 'art')
        .slice(0, 30)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      const mimeType = blob.type || 'image/png';
      const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
      const fileName = options.filename || `AI_${cleanPrompt || 'image'}_${Date.now()}.${ext}`;

      const fileObj = new File([blob], fileName, { type: mimeType });

      // 3. Resolve Destination Folder
      const folder = await this.getOrCreateAiFolder();
      const targetFolderId = folder.id || null;

      // 4. Upload File with Real-Time Progress
      const uploadedFile = await api.uploadFile(
        fileObj,
        targetFolderId,
        (progress) => {
          options.onProgress?.(progress);
        }
      );

      // 5. Mark as saved & refresh file store
      if (options.imageUrl) {
        this.savedUrls.add(options.imageUrl);
        this.persistSavedUrls();
      }

      // Trigger Drive UI refresh so user immediately sees their file in "AI Images"
      useFileStore.getState().fetchItems().catch(() => {});

      return {
        fileId: uploadedFile.id,
        fileName: uploadedFile.name,
        folderId: folder.id,
        folderName: folder.name,
        storagePath: uploadedFile.storage_path || '',
      };
    } finally {
      this.activeSaves.delete(lockKey);
    }
  }

  private persistSavedUrls() {
    if (typeof window !== 'undefined') {
      try {
        const arr = Array.from(this.savedUrls).slice(-500); // keep recent 500
        localStorage.setItem(SAVED_URLS_CACHE_KEY, JSON.stringify(arr));
      } catch {}
    }
  }
}

export const masterCloudImageSaveService = new MasterCloudImageSaveService();
