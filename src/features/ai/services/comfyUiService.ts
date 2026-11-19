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
   * Test connection to the local ComfyUI instance.
   * Never fabricates connectivity: returns honest offline status if unreachable.
   */
  public async testConnection(endpoint?: string, apiKey?: string): Promise<ComfyUiConnectionStatus> {
    const targetEndpoint = (endpoint || aiVaultService.getComfyUiEndpoint()).replace(/\/+$/, '');
    const targetKey = apiKey !== undefined ? apiKey : aiVaultService.getComfyUiApiKey();

    const t0 = performance.now();
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (targetKey) {
        headers['Authorization'] = `Bearer ${targetKey}`;
      }

      // Check system stats
      const res = await fetch(`${targetEndpoint}/system_stats`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(4000),
      });

      const latencyMs = Math.round(performance.now() - t0);

      if (!res.ok) {
        return {
          online: false,
          endpoint: targetEndpoint,
          latencyMs,
          error: `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const data = await res.json();
      const devices: string[] = [];
      let vramFreeMb: number | undefined;

      if (data?.devices && Array.isArray(data.devices)) {
        data.devices.forEach((d: any) => {
          if (d.name) devices.push(d.name);
          if (d.vram_free) vramFreeMb = Math.round(d.vram_free / (1024 * 1024));
        });
      }

      return {
        online: true,
        endpoint: targetEndpoint,
        latencyMs,
        devices,
        vramFreeMb,
      };
    } catch (err: any) {
      return {
        online: false,
        endpoint: targetEndpoint,
        latencyMs: Math.round(performance.now() - t0),
        error: 'ComfyUI is offline or unreachable at 127.0.0.1:8188. Ensure ComfyUI is running locally.',
      };
    }
  }

  /**
   * Dispatch local generation workflow.
   */
  public async generateImage(prompt: string): Promise<string> {
    const status = await this.testConnection();
    if (!status.online) {
      throw new Error(status.error || 'Local ComfyUI is disconnected.');
    }

    // In a complete ComfyUI workflow, prompts are queued via POST /prompt.
    throw new Error('ComfyUI workflow execution requires a configured local workflow JSON.');
  }
}

export const comfyUiService = new ComfyUiService();
