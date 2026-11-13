/**
 * storageHelper.ts
 * Shared storage adapter for browser localStorage + isolated Node/test memory fallback.
 * Avoids duplicating storage guards across MASTER AI CORE v2.0 modules.
 */

const memoryFallback = new Map<string, string>();

export function safeReadStorage(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      return localStorage.getItem(key);
    }
  } catch {
    // Fall back to in-memory storage when localStorage is unavailable or restricted
  }
  return memoryFallback.get(key) ?? null;
}

export function safeWriteStorage(key: string, value: string): boolean {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(key, value);
      return true;
    }
  } catch {
    // QuotaExceeded or Node test environment
  }
  memoryFallback.set(key, value);
  return false;
}

export function safeRemoveStorage(key: string): void {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
  memoryFallback.delete(key);
}

export function safeReadJson<T>(key: string, fallback: T): T {
  const raw = safeReadStorage(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeWriteJson<T>(key: string, value: T): boolean {
  try {
    return safeWriteStorage(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
