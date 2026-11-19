/**
 * src/features/ai/services/pollinationsService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — POLLINATIONS IMAGE AI INTEGRATION SERVICE
 * Official API client for image generation, in-chat image editing, live catalogue
 * discovery, capability detection, and strict Free-Only policy enforcement.
 *
 * Routing:
 * - All outbound network traffic proxies through server-side /api/ai/pollinations/*
 * - API keys remain on the server in .env.local
 * - Zero client-side API key handling or storage
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { aiVaultService } from './aiVaultService';
import {
  PREFERRED_POLLINATIONS_MODELS,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_EDIT_MODEL,
  FREE_IMAGE_FALLBACK_SEQUENCE,
  FREE_EDIT_FALLBACK_SEQUENCE,
} from './pollinationsModels';
import { PollinationsModelInfo, ImageAspectRatio } from '../types/aiTypes';

export interface GenerateImageOptions {
  prompt: string;
  modelId?: string;
  width?: number;
  height?: number;
  seed?: number;
  aspectRatio?: ImageAspectRatio;
  enhance?: boolean;
  signal?: AbortSignal;
}

export interface EditImageOptions {
  prompt: string;
  imageBlobOrUrl: Blob | string;
  modelId?: string;
  signal?: AbortSignal;
}

export interface ImageOperationResult {
  imageUrl: string;
  modelUsed: string;
  modelTitle: string;
  width: number;
  height: number;
  seed: number;
  isEdited?: boolean;
  generationTimeMs: number;
}

const CACHE_KEY = 'master_ai_pollinations_models_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

class PollinationsService {
  private cachedModels: PollinationsModelInfo[] | null = null;
  private lastFetchTimestamp = 0;

  constructor() {
    this.loadCachedModels();
  }

  private loadCachedModels(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.models) && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          this.cachedModels = parsed.models;
          this.lastFetchTimestamp = parsed.timestamp;
        }
      }
    } catch (e) {
      console.warn('[PollinationsService] Cache load error:', e);
    }
  }

  private saveCachedModels(models: PollinationsModelInfo[]): void {
    if (typeof window === 'undefined') return;
    try {
      this.cachedModels = models;
      this.lastFetchTimestamp = Date.now();
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ models, timestamp: this.lastFetchTimestamp })
      );
    } catch (e) {
      console.warn('[PollinationsService] Cache save error:', e);
    }
  }

  /**
   * Fetch live models catalogue from /api/ai/pollinations/models.
   * Reconciles canonical IDs, aliases, capability support, and free/paid pricing.
   */
  public async fetchModels(forceRefresh = false): Promise<PollinationsModelInfo[]> {
    if (!forceRefresh && this.cachedModels && this.cachedModels.length > 0) {
      return this.cachedModels;
    }

    try {
      const res = await fetch('/api/ai/pollinations/models', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Catalogue request failed with status ${res.status}`);
      }

      const liveModels: any[] = await res.json();
      if (!Array.isArray(liveModels)) {
        throw new Error('Invalid catalogue format returned by Pollinations');
      }

      // Map live catalogue models
      const unified: PollinationsModelInfo[] = liveModels.map((m) => {
        const canonicalId = m.name || m.id;
        const aliases: string[] = Array.isArray(m.aliases) ? m.aliases : [];
        const endpoints: string[] = Array.isArray(m.supported_endpoints) ? m.supported_endpoints : [];
        const isPaidOnly = Boolean(m.paid_only);
        const supportsEdit = endpoints.includes('/v1/images/edits') || Boolean(m.max_reference_images > 0);
        const supportsGen = endpoints.includes('/v1/images/generations') || endpoints.includes('/image/{prompt}') || true;

        // Categorize based on preferences or fallback
        let category: PollinationsModelInfo['category'] = 'all';
        if (canonicalId.includes('sunburst')) category = 'primary_gen';
        else if (canonicalId.includes('kontext')) category = 'primary_edit';
        else if (canonicalId.includes('flux-2-dev-free')) category = 'free_gen';
        else if (canonicalId.includes('schnell')) category = 'fast_gen';
        else if (canonicalId.includes('nano-banana') || canonicalId.includes('lucid-origin')) category = 'experimental';
        else if (!isPaidOnly) category = 'free_gen';

        return {
          id: canonicalId,
          name: m.title || canonicalId.split('/').pop() || canonicalId,
          title: m.title || canonicalId,
          aliases,
          publisher: m.publisher,
          category,
          paidOnly: isPaidOnly,
          freeStatus: isPaidOnly ? 'paid' : 'free',
          supportsGeneration: supportsGen,
          supportsEditing: supportsEdit,
          maxReferenceImages: m.max_reference_images || 0,
          pricing: m.pricing,
          healthStatus: m.health?.status || 'healthy',
          isAvailable: m.health?.status !== 'unhealthy',
          estimatedSpeed: m.flat_rate ? 'fast' : 'medium',
          lastRefreshedAt: Date.now(),
        };
      });

      // Merge baseline preferred models ensuring they exist even if offline
      for (const pref of PREFERRED_POLLINATIONS_MODELS) {
        const exists = unified.some(
          (u) => u.id === pref.id || u.aliases.includes(pref.id) || pref.aliases.some((a) => u.aliases.includes(a))
        );
        if (!exists) {
          unified.push(pref);
        }
      }

      this.saveCachedModels(unified);
      return unified;
    } catch (err: any) {
      console.warn('[PollinationsService] Live fetch failed, using fallback catalogue:', err?.message);
      if (this.cachedModels && this.cachedModels.length > 0) {
        return this.cachedModels;
      }
      return PREFERRED_POLLINATIONS_MODELS;
    }
  }

  /**
   * Test connection to the Pollinations API endpoint via proxy.
   */
  public async testConnection(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/ai/pollinations/models', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      const latencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        return { ok: true, latencyMs };
      }
      return { ok: false, latencyMs, error: `HTTP ${res.status}: ${res.statusText}` };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Connection failed' };
    }
  }

  /**
   * Generates a new image via the server-side proxy POST /api/ai/pollinations/generate.
   */
  public async generateImage(options: GenerateImageOptions): Promise<ImageOperationResult> {
    const t0 = performance.now();
    const isFreeOnly = aiVaultService.isFreeOnly();

    // 1. Resolve target model ID
    let targetModelId = options.modelId || DEFAULT_IMAGE_MODEL;

    // 2. Strict Free-Only enforcement
    const allModels = await this.fetchModels();
    let modelMeta = allModels.find((m) => m.id === targetModelId || m.aliases.includes(targetModelId));

    if (isFreeOnly && modelMeta?.paidOnly) {
      const fallback = allModels.find(
        (m) => FREE_IMAGE_FALLBACK_SEQUENCE.includes(m.id) && !m.paidOnly
      );
      if (fallback) {
        targetModelId = fallback.id;
        modelMeta = fallback;
      } else {
        targetModelId = DEFAULT_IMAGE_MODEL;
      }
    }

    // 3. Resolve aspect ratio and dimensions
    const dims = this.resolveDimensions(options.aspectRatio, options.width, options.height);
    const seed = options.seed !== undefined ? options.seed : Math.floor(Math.random() * 99999999);

    // 4. Send request to proxy
    const res = await fetch('/api/ai/pollinations/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt.trim(),
        model: targetModelId,
        width: dims.width,
        height: dims.height,
        seed,
        enhance: options.enhance,
      }),
      signal: options.signal,
    });

    if (!res.ok) {
      let errMsg = `Generation failed (HTTP ${res.status})`;
      try {
        const errorJson = await res.json();
        if (errorJson?.error?.message) {
          errMsg = errorJson.error.message;
        }
      } catch {}
      throw new Error(errMsg);
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const generationTimeMs = Math.round(performance.now() - t0);

    return {
      imageUrl: objectUrl,
      modelUsed: targetModelId,
      modelTitle: modelMeta?.name || targetModelId,
      width: dims.width,
      height: dims.height,
      seed,
      isEdited: false,
      generationTimeMs,
    };
  }

  /**
   * Edit an existing or uploaded image using Pollinations AI POST /api/ai/pollinations/edit.
   */
  public async editImage(options: EditImageOptions): Promise<ImageOperationResult> {
    const t0 = performance.now();
    const isFreeOnly = aiVaultService.isFreeOnly();

    // 1. Resolve editing model
    let targetModelId = options.modelId || DEFAULT_EDIT_MODEL;
    const allModels = await this.fetchModels();
    let modelMeta = allModels.find((m) => m.id === targetModelId || m.aliases.includes(targetModelId));

    // Verify model editing support
    if (modelMeta && !modelMeta.supportsEditing) {
      const fallbackEdit = allModels.find(
        (m) => FREE_EDIT_FALLBACK_SEQUENCE.includes(m.id) && m.supportsEditing && (!isFreeOnly || !m.paidOnly)
      );
      if (fallbackEdit) {
        targetModelId = fallbackEdit.id;
        modelMeta = fallbackEdit;
      } else {
        throw new Error(`Model "${modelMeta?.name || targetModelId}" does not support image editing. Please select a compatible editing model like FLUX.1 Kontext Pro.`);
      }
    }

    // 2. Prepare image file/blob
    let imageBlob: Blob;
    if (typeof options.imageBlobOrUrl === 'string') {
      const resp = await fetch(options.imageBlobOrUrl);
      imageBlob = await resp.blob();
    } else {
      imageBlob = options.imageBlobOrUrl;
    }

    // 3. Prepare FormData for proxy
    const formData = new FormData();
    formData.append('prompt', options.prompt.trim());
    formData.append('model', targetModelId);
    formData.append('image', imageBlob, 'input_image.png');

    const res = await fetch('/api/ai/pollinations/edit', {
      method: 'POST',
      body: formData,
      signal: options.signal,
    });

    if (!res.ok) {
      let errMsg = `Editing failed (HTTP ${res.status})`;
      try {
        const errorJson = await res.json();
        if (errorJson?.error?.message) {
          errMsg = errorJson.error.message;
        }
      } catch {}
      throw new Error(errMsg);
    }

    const data = await res.json();
    let resultImageUrl = '';
    if (data?.data && Array.isArray(data.data) && data.data[0]?.url) {
      resultImageUrl = data.data[0].url;
    } else if (data?.url) {
      resultImageUrl = data.url;
    } else {
      throw new Error('Pollinations edit endpoint returned unexpected payload format.');
    }

    const generationTimeMs = Math.round(performance.now() - t0);

    return {
      imageUrl: resultImageUrl,
      modelUsed: targetModelId,
      modelTitle: modelMeta?.name || targetModelId,
      width: 1024,
      height: 1024,
      seed: Math.floor(Math.random() * 999999),
      isEdited: true,
      generationTimeMs,
    };
  }

  private resolveDimensions(
    aspectRatio?: ImageAspectRatio,
    customWidth?: number,
    customHeight?: number
  ): { width: number; height: number } {
    if (customWidth && customHeight) {
      return { width: customWidth, height: customHeight };
    }

    switch (aspectRatio) {
      case '16:9':
        return { width: 1280, height: 720 };
      case '9:16':
        return { width: 720, height: 1280 };
      case '4:3':
        return { width: 1024, height: 768 };
      case '3:2':
        return { width: 1080, height: 720 };
      case '2:3':
        return { width: 720, height: 1080 };
      case '1:1':
      default:
        return { width: 1024, height: 1024 };
    }
  }
}

export const pollinationsService = new PollinationsService();
