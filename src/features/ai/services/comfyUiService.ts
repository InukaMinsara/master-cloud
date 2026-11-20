/**
 * src/features/ai/services/comfyUiService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — LOCAL COMFYUI INTEGRATION SERVICE
 * Optional local provider for ComfyUI workflows, local SD/Flux models,
 * offline inpainting/image-to-image operations, and RTX 3050 6GB low-VRAM presets.
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

export interface ComfyUiHardwarePreset {
  name: string;
  maxResolution: number;
  lowVram: boolean;
  batchLimit: number;
  attentionMechanism: string;
}

export const RTX_3050_6GB_PRESET: ComfyUiHardwarePreset = {
  name: 'NVIDIA RTX 3050 (6GB VRAM Optimized)',
  maxResolution: 768,
  lowVram: true,
  batchLimit: 1,
  attentionMechanism: 'xformers / sdp',
};

class ComfyUiService {
  public readonly lowVramPreset = RTX_3050_6GB_PRESET;

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

  /**
   * Queue a prompt workflow on the local ComfyUI instance.
   */
  public async queuePrompt(promptWorkflow: Record<string, any>): Promise<{ promptId?: string; error?: string }> {
    const conn = await this.testConnection();
    if (!conn.online) {
      return { error: 'ComfyUI server is offline.' };
    }

    try {
      const res = await fetch('/api/ai/comfyui/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptWorkflow }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { promptId: data.prompt_id };
    } catch (e: any) {
      return { error: e.message || 'Failed to queue ComfyUI prompt' };
    }
  }
}

export const comfyUiService = new ComfyUiService();
