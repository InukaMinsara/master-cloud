/**
 * src/services/ai/dedicatedGpuBackend.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER CLOUD — DEDICATED CLOUD GPU CLIENT GATEWAY (Option A)
 *
 * Connects Master Cloud frontend to our private dedicated GPU backend:
 * - 100% Custom JSON API endpoints
 * - Zero Gradio UI
 * - Zero Hugging Face logos or watermarks
 * - Automatic graceful fallback to internal Cloud Cascade if backend is offline
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface DedicatedGpuStatus {
  online: boolean;
  gpuName?: string;
  totalVramGb?: number;
  freeVramGb?: number;
  url: string;
}

class DedicatedGpuBackendService {
  private storageKey = 'master_dedicated_gpu_url';

  public getBackendUrl(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.storageKey) || '';
    }
    return '';
  }

  public setBackendUrl(url: string): void {
    if (typeof window !== 'undefined') {
      const clean = url.trim().replace(/\/+$/, '');
      if (clean) {
        localStorage.setItem(this.storageKey, clean);
      } else {
        localStorage.removeItem(this.storageKey);
      }
    }
  }

  /**
   * Health check to test if dedicated backend is reachable
   */
  public async checkHealth(): Promise<DedicatedGpuStatus> {
    const url = this.getBackendUrl();
    if (!url) {
      return { online: false, url: '' };
    }

    try {
      const res = await fetch(`${url}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          online: true,
          gpuName: data.gpu || 'NVIDIA Cloud GPU',
          totalVramGb: data.total_vram_gb || 16,
          freeVramGb: data.free_vram_gb || 14,
          url,
        };
      }
    } catch (e) {
      // Backend not currently reachable
    }

    return { online: false, url };
  }

  /**
   * Headless Virtual Try-On
   */
  public async virtualTryOn(
    personFile: Blob | File,
    garmentFile: Blob | File,
    description: string = 'A stylish garment'
  ): Promise<string> {
    const url = this.getBackendUrl();
    if (url) {
      const formData = new FormData();
      formData.append('person_image', personFile);
      formData.append('garment_image', garmentFile);
      formData.append('description', description);

      const res = await fetch(`${url}/api/v1/tryon`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.image_data) {
          return data.image_data;
        }
      }
    }

    // Fallback: If no dedicated backend URL is set, call virtualTryOnService
    const { executeVirtualTryOn } = await import('./virtualTryOnService');
    const result = await executeVirtualTryOn(personFile, garmentFile, {
      garmentDescription: description,
    });
    return result.outputImageUrl;
  }
}

export const dedicatedGpuService = new DedicatedGpuBackendService();
