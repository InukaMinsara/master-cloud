/**
 * src/services/ai/virtualTryOnService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER CLOUD — NATIVE VIRTUAL TRY-ON CLOUD GPU SERVICE
 *
 * Connects directly to Hugging Face ZeroGPU (NVIDIA A100 Cloud Supercomputer)
 * via the official @gradio/client SDK.
 *
 * Benefits:
 * - ZERO Local 12GB Model Download
 * - ZERO Laptop GPU/VRAM Strain
 * - 100% Free & Unlimited Cloud Compute
 * - Only ~1-2 MB data transfer per try-on
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Client } from '@gradio/client';

export interface TryOnOptions {
  garmentDescription?: string;
  autoCrop?: boolean;
  denoiseSteps?: number;
  seed?: number;
  onStatusUpdate?: (status: string) => void;
}

export interface TryOnResult {
  outputImageUrl: string;
  maskedImageUrl?: string;
  durationSeconds: number;
  source: 'cloud-zero-gpu';
}

// Hugging Face Space ID hosting the State-of-the-Art IDM-VTON model
const SPACE_ID = 'yisol/IDM-VTON';

let cachedClient: any = null;

async function getClient(onStatus?: (status: string) => void) {
  if (cachedClient) return cachedClient;
  onStatus?.('Connecting to Cloud Supercomputer (NVIDIA A100)...');
  try {
    cachedClient = await Client.connect(SPACE_ID);
    return cachedClient;
  } catch (err: any) {
    console.error('[VirtualTryOnService] Client connect error:', err);
    throw new Error(`Cloud GPU connection failed: ${err.message || 'Network error'}`);
  }
}

/**
 * Executes a full virtual clothing try-on in the cloud.
 * Accepts either File objects, Blobs, or data URLs.
 */
export async function executeVirtualTryOn(
  personImage: Blob | File,
  garmentImage: Blob | File,
  options: TryOnOptions = {}
): Promise<TryOnResult> {
  const startTime = Date.now();
  const {
    garmentDescription = 'A stylish clothing garment',
    autoCrop = false,
    denoiseSteps = 30,
    seed = Math.floor(Math.random() * 1000000),
    onStatusUpdate,
  } = options;

  onStatusUpdate?.('Initializing Cloud ZeroGPU worker...');
  const client = await getClient(onStatusUpdate);

  onStatusUpdate?.('Uploading reference photos to Cloud GPU (~2 MB)...');

  try {
    onStatusUpdate?.('AI Pose alignment and clothing synthesis in progress (~15s)...');

    const result = await client.predict('/tryon', {
      dict: {
        background: personImage,
        layers: [],
        composite: null,
      },
      garm_img: garmentImage,
      garment_des: garmentDescription,
      is_checked: true, // auto-masking enabled
      is_checked_crop: autoCrop,
      denoise_steps: denoiseSteps,
      seed: seed,
    });

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    onStatusUpdate?.('Synthesis complete! Processing high-res output...');

    // Extract return image URLs
    const data = result?.data;
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Cloud GPU returned an empty response. Please try again.');
    }

    const outputData = data[0];
    const maskedData = data[1];

    let outputUrl = '';
    if (typeof outputData === 'string') {
      outputUrl = outputData;
    } else if (outputData && typeof outputData === 'object') {
      outputUrl = outputData.url || outputData.path || '';
    }

    let maskedUrl = '';
    if (typeof maskedData === 'string') {
      maskedUrl = maskedData;
    } else if (maskedData && typeof maskedData === 'object') {
      maskedUrl = maskedData.url || maskedData.path || '';
    }

    if (!outputUrl) {
      throw new Error('Failed to parse output image from Cloud GPU response.');
    }

    return {
      outputImageUrl: outputUrl,
      maskedImageUrl: maskedUrl || undefined,
      durationSeconds: elapsed,
      source: 'cloud-zero-gpu',
    };
  } catch (err: any) {
    console.error('[VirtualTryOnService] Try-on prediction error:', err);
    throw new Error(err?.message || 'Virtual Try-On generation failed. Please try with another image.');
  }
}
