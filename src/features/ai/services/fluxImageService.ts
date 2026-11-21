/**
 * src/features/ai/services/fluxImageService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — FLUX.2 [klein] 4B IMAGE GENERATION & EDITING SERVICE
 * Integrated text-to-image synthesis and natural-language image editing
 * powered by Black Forest Labs FLUX.2-klein-4b via NVIDIA NIM API.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ImageAspectRatio } from '../types/aiTypes';

export const FLUX_MODEL_ID = 'black-forest-labs/flux.2-klein-4b';
export const FLUX_MODEL_TITLE = 'FLUX.2 [klein] 4B';

// Compatibility constants for components referencing legacy identifiers
export const SENSENOVA_MODEL_ID = FLUX_MODEL_ID;
export const SENSENOVA_MODEL_TITLE = FLUX_MODEL_TITLE;

export interface FluxGenerateOptions {
  prompt: string;
  aspectRatio?: ImageAspectRatio;
  size?: '1024x1024' | '1024x768' | '768x1024' | '1280x720' | '720x1280';
  signal?: AbortSignal;
}

export interface FluxEditOptions {
  prompt: string;
  image: string; // Base64 data URI or example_id
  aspectRatio?: ImageAspectRatio;
  signal?: AbortSignal;
}

export interface FluxImageResult {
  imageUrl: string;
  originalUrl?: string;
  modelUsed: string;
  modelTitle: string;
  prompt: string;
  width: number;
  height: number;
  seed: number;
  generationTimeMs: number;
}

// Compatibility type
export type SenseNovaImageResult = FluxImageResult;
export type SenseNovaGenerateOptions = FluxGenerateOptions;

class FluxImageService {
  /**
   * Resolves supported resolution string for FLUX.2-klein-4b.
   */
  public resolveSize(aspectRatio?: ImageAspectRatio): {
    size: '1024x1024' | '1024x768' | '768x1024' | '1280x720' | '720x1280';
    width: number;
    height: number;
  } {
    switch (aspectRatio) {
      case '16:9':
        return { size: '1280x720', width: 1280, height: 720 };
      case '9:16':
        return { size: '720x1280', width: 720, height: 1280 };
      case '4:3':
      case '3:2':
        return { size: '1024x768', width: 1024, height: 768 };
      case '2:3':
        return { size: '720x1280', width: 720, height: 1280 };
      case '21:9':
        return { size: '1280x720', width: 1280, height: 720 };
      case '1:1':
      default:
        return { size: '1024x1024', width: 1024, height: 1024 };
    }
  }

  /**
   * Generates a visual asset using black-forest-labs/flux.2-klein-4b via NVIDIA NIM API.
   */
  public async generateImage(options: FluxGenerateOptions): Promise<FluxImageResult> {
    const startTime = performance.now();
    const { size, width, height } = this.resolveSize(options.aspectRatio);

    const res = await fetch('/api/ai/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: options.signal,
      body: JSON.stringify({
        prompt: options.prompt.trim(),
        size,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `FLUX.2 generation failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data.url) {
      throw new Error('No image URL returned from FLUX.2-klein-4b engine');
    }

    const elapsed = Math.round(performance.now() - startTime);

    return {
      imageUrl: data.url,
      modelUsed: FLUX_MODEL_ID,
      modelTitle: FLUX_MODEL_TITLE,
      prompt: options.prompt.trim(),
      width,
      height,
      seed: data.seed || Math.floor(Math.random() * 99999999),
      generationTimeMs: elapsed,
    };
  }

  /**
   * Modifies an existing image with natural-language instruction in "Image Editing" mode.
   */
  public async editImage(options: FluxEditOptions): Promise<FluxImageResult> {
    const startTime = performance.now();
    const { size, width, height } = this.resolveSize(options.aspectRatio);

    const res = await fetch('/api/ai/image/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: options.signal,
      body: JSON.stringify({
        prompt: options.prompt.trim(),
        image: options.image,
        size,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errMsg = err?.error?.message || `FLUX.2 image editing failed with status ${res.status}`;
      const limitationNotice = err?.error?.limitationNotice;
      if (limitationNotice) {
        throw new Error(limitationNotice);
      }
      throw new Error(errMsg);
    }

    const data = await res.json();
    if (!data.url) {
      throw new Error('No edited image returned from FLUX.2-klein-4b engine');
    }

    const elapsed = Math.round(performance.now() - startTime);

    return {
      imageUrl: data.url,
      originalUrl: options.image,
      modelUsed: FLUX_MODEL_ID,
      modelTitle: FLUX_MODEL_TITLE,
      prompt: options.prompt.trim(),
      width,
      height,
      seed: data.seed || Math.floor(Math.random() * 99999999),
      generationTimeMs: elapsed,
    };
  }
}

export const fluxImageService = new FluxImageService();
// Compatibility export
export const senseNovaImageService = fluxImageService;
