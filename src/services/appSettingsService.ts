/**
 * src/services/appSettingsService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER CLOUD — PERSISTENT APPLICATION SETTINGS & SESSION RECOVERY
 * Preserves user UI preferences, default models, aspect ratios, playback
 * positions, and draft inputs across page refreshes and browser restarts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface MasterCloudSettings {
  theme: 'dark' | 'light' | 'system';
  defaultAiModel: string;
  defaultImageModel: string;
  defaultAspectRatio: string;
  defaultImageResolution: number;
  favoriteModels: string[];
  enableAudioVisualizer: boolean;
  enableVideoUpscaling: boolean;
  autoSaveAiImagesToDrive: boolean;
  audioEqPreset: string;
  videoAmbilight: boolean;
}

export const DEFAULT_APP_SETTINGS: MasterCloudSettings = {
  theme: 'dark',
  defaultAiModel: 'openai/gpt-oss-120b',
  defaultImageModel: 'black-forest-labs/flux.1-schnell',
  defaultAspectRatio: '1:1',
  defaultImageResolution: 1024,
  favoriteModels: [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'black-forest-labs/flux.1-schnell',
    'black-forest-labs/flux.1-kontext-pro',
  ],
  enableAudioVisualizer: true,
  enableVideoUpscaling: true,
  autoSaveAiImagesToDrive: false,
  audioEqPreset: 'flat',
  videoAmbilight: true,
};

const SETTINGS_KEY = 'master_cloud_app_settings_v2';
const DRAFT_KEY_PREFIX = 'master_cloud_draft_';

class AppSettingsService {
  private settings: MasterCloudSettings;
  private listeners: Set<(s: MasterCloudSettings) => void> = new Set();

  constructor() {
    this.settings = this.load();
  }

  private load(): MasterCloudSettings {
    if (typeof window === 'undefined') return { ...DEFAULT_APP_SETTINGS };
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('[AppSettingsService] Failed to parse settings:', e);
    }
    return { ...DEFAULT_APP_SETTINGS };
  }

  public getSettings(): MasterCloudSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<MasterCloudSettings>): void {
    this.settings = { ...this.settings, ...partial };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      } catch (e) {
        console.warn('[AppSettingsService] Failed to persist settings:', e);
      }
    }
    this.listeners.forEach((fn) => fn(this.settings));
  }

  public subscribe(fn: (s: MasterCloudSettings) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ── Favorite Models Management ──
  public isFavorite(modelId: string): boolean {
    return this.settings.favoriteModels.includes(modelId);
  }

  public toggleFavorite(modelId: string): boolean {
    const list = new Set(this.settings.favoriteModels);
    let added = false;
    if (list.has(modelId)) {
      list.delete(modelId);
    } else {
      list.add(modelId);
      added = true;
    }
    this.updateSettings({ favoriteModels: Array.from(list) });
    return added;
  }

  // ── Session Draft Recovery ──
  public saveDraft(key: string, content: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (content.trim()) {
        sessionStorage.setItem(`${DRAFT_KEY_PREFIX}${key}`, content);
      } else {
        sessionStorage.removeItem(`${DRAFT_KEY_PREFIX}${key}`);
      }
    } catch {}
  }

  public getDraft(key: string): string {
    if (typeof window === 'undefined') return '';
    try {
      return sessionStorage.getItem(`${DRAFT_KEY_PREFIX}${key}`) || '';
    } catch {
      return '';
    }
  }

  public clearDraft(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(`${DRAFT_KEY_PREFIX}${key}`);
    } catch {}
  }
}

export const appSettingsService = new AppSettingsService();
