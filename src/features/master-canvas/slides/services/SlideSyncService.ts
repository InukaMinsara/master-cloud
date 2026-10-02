import { MasterPresentationData } from '../types';

const OFFLINE_STORAGE_PREFIX = 'master_cloud_slides_offline_';
const RECOVERY_STORAGE_PREFIX = 'master_cloud_slides_recovery_';

export type SyncState = 'saved' | 'saving' | 'unsaved' | 'offline' | 'syncing' | 'conflict';

export class SlideSyncService {
  /**
   * Save working presentation locally for offline resiliency and power-loss recovery
   */
  static saveOfflineDraft(fileId: string, presentation: MasterPresentationData): void {
    try {
      const key = `${RECOVERY_STORAGE_PREFIX}${fileId || 'draft'}`;
      const payload = {
        presentation,
        savedAt: new Date().toISOString(),
        checksum: this.generateChecksum(presentation),
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to store local recovery draft in localStorage', err);
    }
  }

  /**
   * Check if a recoverable offline draft exists for this presentation
   */
  static getRecoverableDraft(fileId: string): { presentation: MasterPresentationData; savedAt: string } | null {
    try {
      const key = `${RECOVERY_STORAGE_PREFIX}${fileId || 'draft'}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.presentation?.slides?.length) {
        return {
          presentation: parsed.presentation,
          savedAt: parsed.savedAt,
        };
      }
    } catch (err) {
      console.warn('Failed to read recovery draft', err);
    }
    return null;
  }

  /**
   * Clear recovered draft after successful server commit
   */
  static clearRecoveryDraft(fileId: string): void {
    try {
      const key = `${RECOVERY_STORAGE_PREFIX}${fileId || 'draft'}`;
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('Failed to clear recovery draft', err);
    }
  }

  /**
   * Check network connectivity state
   */
  static isOnline(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  }

  /**
   * Listen to browser online/offline network transitions
   */
  static subscribeNetworkStatus(onStatusChange: (isOnline: boolean) => void): () => void {
    const handleOnline = () => onStatusChange(true);
    const handleOffline = () => onStatusChange(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * Calculate byte size of the presentation
   */
  static calculatePresentationSize(presentation: MasterPresentationData): string {
    const str = JSON.stringify(presentation);
    const bytes = new Blob([str]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  private static generateChecksum(presentation: MasterPresentationData): string {
    return `${presentation.slides.length}-${presentation.title}-${presentation.lastSavedAt}`;
  }
}
