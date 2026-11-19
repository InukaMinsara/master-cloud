/**
 * src/features/ai/services/aiVaultService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — UNIFIED PROVIDER VAULT SERVICE
 * Manages API keys, custom endpoints, connectivity telemetry, and the strict
 * Free-Only policy across Groq, Pollinations AI, and ComfyUI.
 *
 * NOTE ON CLIENT STORAGE SECURITY:
 * Pure browser client storage (localStorage / IndexedDB) is protected by the
 * browser's Same-Origin Policy against other websites, but any script running
 * inside the client application origin has access to runtime memory. Never claim
 * that localStorage alone constitutes a hardware security module (HSM).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ProviderVaultConfig } from '../types/aiTypes';

const VAULT_STORAGE_KEY = 'master_ai_provider_vault_v1';

export const DEFAULT_VAULT_CONFIG: ProviderVaultConfig = {
  // Groq
  groqEndpoint: 'https://api.groq.com/openai/v1',
  groqApiKey: '',
  groqEnabled: true,

  // Pollinations AI
  pollinationsEndpoint: 'https://gen.pollinations.ai',
  pollinationsApiKey: '',
  pollinationsEnabled: true,

  // ComfyUI Local
  comfyUiEndpoint: 'http://127.0.0.1:8188',
  comfyUiApiKey: '',
  comfyUiEnabled: false,

  // Strict Free-Only System
  freeOnly: true,
  blockPaid: true,
  autoPaidFallback: false,
};

type VaultListener = (config: ProviderVaultConfig) => void;

class AiVaultService {
  private config: ProviderVaultConfig;
  private listeners: Set<VaultListener> = new Set();

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): ProviderVaultConfig {
    if (typeof window === 'undefined') return { ...DEFAULT_VAULT_CONFIG };

    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_VAULT_CONFIG,
          ...parsed,
          // Preserve groq key if migrated from single-key legacy storage
          groqApiKey: parsed.groqApiKey || localStorage.getItem('master_ai_groq_api_key') || '',
        };
      }
    } catch (e) {
      console.warn('[AiVaultService] Failed to parse vault config:', e);
    }

    // Check legacy groq key if fresh vault
    const legacyKey = typeof window !== 'undefined' ? localStorage.getItem('master_ai_groq_api_key') : null;
    return {
      ...DEFAULT_VAULT_CONFIG,
      groqApiKey: legacyKey || '',
    };
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(this.config));
      // Keep legacy groq key synced for backwards compatibility
      if (this.config.groqApiKey) {
        localStorage.setItem('master_ai_groq_api_key', this.config.groqApiKey);
      } else {
        localStorage.removeItem('master_ai_groq_api_key');
      }
      this.notify();
    } catch (e) {
      console.warn('[AiVaultService] Failed to persist vault config:', e);
    }
  }

  private notify(): void {
    const snapshot = this.getConfig();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  public subscribe(fn: VaultListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getConfig(): ProviderVaultConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<ProviderVaultConfig>): void {
    this.config = { ...this.config, ...partial };
    this.persist();
  }

  // ── Groq Getters / Setters ──
  public getGroqApiKey(): string {
    return this.config.groqApiKey?.trim() || '';
  }

  public getGroqEndpoint(): string {
    const ep = this.config.groqEndpoint?.trim();
    return ep ? ep.replace(/\/+$/, '') : 'https://api.groq.com/openai/v1';
  }

  public hasGroqKey(): boolean {
    return Boolean(this.getGroqApiKey());
  }

  // ── Pollinations Getters / Setters ──
  public getPollinationsApiKey(): string {
    return this.config.pollinationsApiKey?.trim() || '';
  }

  public getPollinationsEndpoint(): string {
    const ep = this.config.pollinationsEndpoint?.trim();
    return ep ? ep.replace(/\/+$/, '') : 'https://gen.pollinations.ai';
  }

  public hasPollinationsKey(): boolean {
    return Boolean(this.getPollinationsApiKey());
  }

  // ── ComfyUI Local Getters / Setters ──
  public getComfyUiEndpoint(): string {
    const ep = this.config.comfyUiEndpoint?.trim();
    return ep ? ep.replace(/\/+$/, '') : 'http://127.0.0.1:8188';
  }

  public getComfyUiApiKey(): string {
    return this.config.comfyUiApiKey?.trim() || '';
  }

  // ── Free-Only Policies ──
  public isFreeOnly(): boolean {
    return Boolean(this.config.freeOnly);
  }

  public isBlockPaid(): boolean {
    return Boolean(this.config.blockPaid);
  }

  public isAutoPaidFallbackAllowed(): boolean {
    return Boolean(this.config.autoPaidFallback);
  }

  public clearAllCredentials(): void {
    this.config = {
      ...this.config,
      groqApiKey: '',
      pollinationsApiKey: '',
      comfyUiApiKey: '',
    };
    this.persist();
  }
}

export const aiVaultService = new AiVaultService();
