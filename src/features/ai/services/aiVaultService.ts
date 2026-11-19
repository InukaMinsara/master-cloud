/**
 * src/features/ai/services/aiVaultService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — ENVIRONMENT CONFIGURATION & PROVIDER STATUS SERVICE
 *
 * Strict Security Guarantees:
 * - Pure environment-driven architecture: API keys reside ONLY in .env.local on the server
 * - Zero API key storage in localStorage or IndexedDB
 * - Zero secrets exposed in browser memory, bundles, or network headers
 * - Automatically checks server-side provider readiness via /api/ai/status
 * - Enforces the Master AI Free-Only model policy
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ProviderStatus {
  groq: {
    available: boolean;
    hasKey: boolean;
    endpoint: string;
  };
  pollinations: {
    available: boolean;
    hasKey: boolean;
    endpoint: string;
  };
  comfyui: {
    available: boolean;
    hasKey: boolean;
    endpoint: string;
  };
}

export const DEFAULT_PROVIDER_STATUS: ProviderStatus = {
  groq: {
    available: false,
    hasKey: false,
    endpoint: 'https://api.groq.com/openai/v1',
  },
  pollinations: {
    available: true,
    hasKey: false,
    endpoint: 'https://gen.pollinations.ai',
  },
  comfyui: {
    available: false,
    hasKey: false,
    endpoint: 'http://127.0.0.1:8188',
  },
};

type StatusListener = (status: ProviderStatus) => void;

class AiVaultService {
  private status: ProviderStatus = { ...DEFAULT_PROVIDER_STATUS };
  private listeners: Set<StatusListener> = new Set();
  private isInitialized = false;

  constructor() {
    this.purgeLegacyClientKeys();
  }

  /**
   * Cleans any legacy client-side keys out of browser storage to guarantee zero-leakage.
   */
  private purgeLegacyClientKeys(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('master_ai_groq_api_key');
      localStorage.removeItem('master_ai_provider_vault_v1');
      sessionStorage.removeItem('master_ai_groq_api_key');
    } catch {
      // Ignore browser storage restrictions
    }
  }

  /**
   * Automatically initializes provider status by checking server-side proxy.
   */
  public async init(): Promise<ProviderStatus> {
    if (typeof window === 'undefined') return this.status;

    try {
      const res = await fetch('/api/ai/status');
      if (res.ok) {
        const data = await res.json();
        this.status = {
          groq: {
            available: Boolean(data?.groq?.available),
            hasKey: Boolean(data?.groq?.hasKey),
            endpoint: data?.groq?.endpoint || DEFAULT_PROVIDER_STATUS.groq.endpoint,
          },
          pollinations: {
            available: data?.pollinations?.available !== false,
            hasKey: Boolean(data?.pollinations?.hasKey),
            endpoint: data?.pollinations?.endpoint || DEFAULT_PROVIDER_STATUS.pollinations.endpoint,
          },
          comfyui: {
            available: Boolean(data?.comfyui?.available),
            hasKey: Boolean(data?.comfyui?.hasKey),
            endpoint: data?.comfyui?.endpoint || DEFAULT_PROVIDER_STATUS.comfyui.endpoint,
          },
        };
        this.isInitialized = true;
        this.notify();
      }
    } catch (err) {
      console.warn('[AiVaultService] Server AI proxy status check failed:', err);
    }

    return this.status;
  }

  public async refreshStatus(): Promise<ProviderStatus> {
    return this.init();
  }

  private notify(): void {
    const snapshot = this.getStatus();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  public subscribe(fn: StatusListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getStatus(): ProviderStatus {
    return { ...this.status };
  }

  // ── Groq Provider Telemetry & Readiness ──
  public hasGroqKey(): boolean {
    return this.status.groq.hasKey;
  }

  public isGroqAvailable(): boolean {
    return this.status.groq.available;
  }

  public getGroqEndpoint(): string {
    return this.status.groq.endpoint;
  }

  // ── Pollinations Provider Telemetry & Readiness ──
  public hasPollinationsKey(): boolean {
    return this.status.pollinations.hasKey;
  }

  public isPollinationsAvailable(): boolean {
    return this.status.pollinations.available;
  }

  public getPollinationsEndpoint(): string {
    return this.status.pollinations.endpoint;
  }

  // ── ComfyUI Provider Telemetry & Readiness ──
  public isComfyUiAvailable(): boolean {
    return this.status.comfyui.available;
  }

  public getComfyUiEndpoint(): string {
    return this.status.comfyui.endpoint;
  }

  // ── Strict Free-Tier Safety Policies ──
  public isFreeOnly(): boolean {
    return true;
  }

  public isBlockPaid(): boolean {
    return true;
  }

  public isAutoPaidFallbackAllowed(): boolean {
    return false;
  }

  /**
   * Compatibility adapter: clears cache and scrubs legacy browser keys.
   */
  public clearAllCredentials(): void {
    this.purgeLegacyClientKeys();
    this.notify();
  }
}

export const aiVaultService = new AiVaultService();
