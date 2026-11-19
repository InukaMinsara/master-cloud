/**
 * src/features/ai/services/comfyUiService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — LOCAL COMFYUI INTEGRATION SERVICE
 * Optional local provider for ComfyUI workflows, local SD/Flux models,
 * and offline inpainting/image-to-image operations.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { aiVaultService } from './aiVaultService';

export interface ComfyUiConnectionStatus {
  online: boolean;
  endpoint: string;
  latencyMs?: number;
  devices?: string[];
  vramFreeMb?: number;
  error?: string;
}

class ComfyUiService {
  /**
   * Test connection to the local ComfyUI instance via server proxy /api/ai/comfyui/status.
   * Never fabricates connectivity: returns honest offline status if unreachable.
   */
  public async testConnection(): Promise<ComfyUiConnectionStatus> {
    const targetEndpoint = aiVaultService.getComfyUiEndpoint();

    try {
      const res = await fetch('/api/ai/comfyui/status', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const json = await res.json();
        const devices: string[] = [];
        let vramFreeMb: number | undefined;

        if (json?.data?.devices && Array.isArray(json.data.devices)) {
          json.data.devices.forEach((d: any) => {
            if (d.name) devices.push(d.name);
            if (d.vram_free) vramFreeMb = Math.round(d.vram_free / (1024 * 1024));
          });
        }

        return {
          online: Boolean(json.online),
          endpoint: json.endpoint || targetEndpoint,
          latencyMs: json.latencyMs,
          devices,
          vramFreeMb,
        };
      }
    } catch {
      // Fallback
    }

    return {
      online: false,
      endpoint: targetEndpoint,
      error: 'ComfyUI is offline or unreachable.',
    };
  }
}

export const comfyUiService = new ComfyUiService();
