/**
 * src/features/ai/services/senseNovaImageService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — SENSENOVA U1.5 LITE IMAGE SERVICE
 * Integrated text-to-image synthesis using the official xKiro SenseNova engine.
 * Exclusively provides sensenova/sensenova-u1.5-lite with zero third-party models.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ImageAspectRatio } from '../types/aiTypes';

export const SENSENOVA_MODEL_ID = 'sensenova/sensenova-u1.5-lite';
export const SENSENOVA_MODEL_TITLE = 'SenseNova U1.5 Lite';

export interface SenseNovaGenerateOptions {
  prompt: string;
  aspectRatio?: ImageAspectRatio;
  size?: '1024x1024' | '1024x768' | '768x1024' | '1280x720' | '720x1280';
  signal?: AbortSignal;
}

export interface SenseNovaImageResult {
  imageUrl: string;
  modelUsed: string;
  modelTitle: string;
  prompt: string;
  width: number;
  height: number;
  seed: number;
  generationTimeMs: number;
}

class SenseNovaImageService {
  /**
   * Resolves the closest supported resolution string for SenseNova U1.5 Lite.
   */
  public resolveSize(aspectRatio?: ImageAspectRatio): { size: '1024x1024' | '1024x768' | '768x1024' | '1280x720' | '720x1280'; width: number; height: number } {
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
   * Generates a visual asset using sensenova/sensenova-u1.5-lite via xKiro proxy.
   */
  public async generateImage(options: SenseNovaGenerateOptions): Promise<SenseNovaImageResult> {
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
      throw new Error(err?.error?.message || `SenseNova generation failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data.url) {
      throw new Error('No image URL returned from SenseNova engine');
    }

    const elapsed = Math.round(performance.now() - startTime);

    return {
      imageUrl: data.url,
      modelUsed: SENSENOVA_MODEL_ID,
      modelTitle: SENSENOVA_MODEL_TITLE,
      prompt: options.prompt.trim(),
      width,
      height,
      seed: Math.floor(Math.random() * 99999999),
      generationTimeMs: elapsed,
    };
  }
}

export const senseNovaImageService = new SenseNovaImageService();
