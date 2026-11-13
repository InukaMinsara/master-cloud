/**
 * apiKeyStore.ts
 * Clean runtime key registry without embedded secrets.
 *
 * Security audit (MASTER AI CORE v2.0):
 * - Removed hardcoded/pre-seeded `sk-xt-*` key pools so NO API credentials
 *   exist in frontend source code or production `dist/` builds.
 * - Credentials exist strictly when explicitly supplied at runtime by the user/admin.
 * - For interactive AI Brain C providers, use `cloudBrainManager.setProviderApiKey(...)`
 *   which defaults to volatile in-memory storage.
 */

const STORE_KEY = 'mc_ak_registry';
const POOL_KEY = 'mc_ak_pool';
const MASTER_KEY = 'mc_ak_master';

const volatileMasterKeyHolder = new Map<string, string>();

export interface UserApiKeyRecord {
  userId: string;
  userEmail: string;
  userName: string;
  apiKey: string | null;
  assignedAt: string | null;
  assignedBy: string;
  provider: string;
  note: string;
}

function loadRegistry(): Record<string, UserApiKeyRecord> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function saveRegistry(reg: Record<string, UserApiKeyRecord>) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORE_KEY, JSON.stringify(reg));
    }
  } catch {
    // ignore
  }
}

function loadPool(): string[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(POOL_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
}

function savePool(pool: string[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(POOL_KEY, JSON.stringify(pool));
    }
  } catch {
    // ignore
  }
}

export const ApiKeyStore = {
  /**
   * Store master key in volatile memory only (never persisted or bundled).
   */
  setMasterKey(key: string) {
    const clean = key.trim();
    if (!clean) {
      volatileMasterKeyHolder.delete(MASTER_KEY);
    } else {
      volatileMasterKeyHolder.set(MASTER_KEY, clean);
    }
  },

  getMasterKey(): string | null {
    return volatileMasterKeyHolder.get(MASTER_KEY) || null;
  },

  hasMasterKey(): boolean {
    return !!this.getMasterKey();
  },

  addKeysToPool(rawInput: string | string[]): number {
    const pool = loadPool();
    const existing = new Set(pool);
    const incoming = Array.isArray(rawInput)
      ? rawInput
      : rawInput.split(/[\n,;]+/).map((k) => k.trim()).filter(Boolean);

    let addedCount = 0;
    for (const key of incoming) {
      if (key && !existing.has(key)) {
        pool.push(key);
        existing.add(key);
        addedCount++;
      }
    }
    savePool(pool);
    return addedCount;
  },

  getPoolCount(): number {
    return loadPool().length;
  },

  getPoolKeys(): string[] {
    return loadPool();
  },

  clearPool() {
    savePool([]);
  },

  /**
   * Assigns an explicitly admin-supplied pool key if one exists, otherwise leaves unassigned (null).
   */
  dispenseKeyToUser(userId: string, email: string, name: string): { assigned: boolean; key: string | null } {
    const reg = loadRegistry();
    const pool = loadPool();

    let assignedKey: string | null = null;
    let assignedBy = 'manual';
    let note = 'Unassigned (configure explicitly in Cloud & Privacy or Admin panel)';

    if (pool.length > 0) {
      assignedKey = pool.shift()!;
      pool.push(assignedKey);
      savePool(pool);
      assignedBy = 'admin-pool-dispenser';
      note = 'Assigned from admin-configured pool';
    } else if (this.getMasterKey()) {
      assignedKey = this.getMasterKey();
      assignedBy = 'session-master-key';
      note = 'Assigned from volatile master session key';
    }

    reg[userId] = {
      userId,
      userEmail: email,
      userName: name,
      apiKey: assignedKey,
      assignedAt: assignedKey ? new Date().toISOString() : null,
      assignedBy,
      provider: 'user-configured',
      note,
    };
    saveRegistry(reg);

    return { assigned: !!assignedKey, key: assignedKey };
  },

  registerUser(userId: string, email: string, name: string) {
    return this.dispenseKeyToUser(userId, email, name);
  },

  assignKey(
    userId: string,
    apiKey: string,
    adminId: string,
    provider = 'custom',
    note = '',
  ): boolean {
    const trimmed = apiKey.trim();
    if (!trimmed) return false;

    const reg = loadRegistry();
    reg[userId] = {
      userId,
      userEmail: reg[userId]?.userEmail || '',
      userName: reg[userId]?.userName || 'User',
      apiKey: trimmed,
      assignedAt: new Date().toISOString(),
      assignedBy: adminId,
      provider,
      note,
    };
    saveRegistry(reg);
    return true;
  },

  revokeKey(userId: string) {
    const reg = loadRegistry();
    if (reg[userId]) {
      reg[userId].apiKey = null;
      reg[userId].assignedAt = null;
      saveRegistry(reg);
    }
  },

  getKey(userId: string): string | null {
    const reg = loadRegistry();
    return reg[userId]?.apiKey ?? null;
  },

  getEffectiveKey(userId?: string): string | null {
    if (userId) {
      const userKey = this.getKey(userId);
      if (userKey) return userKey;
    }
    return this.getMasterKey();
  },

  hasKey(userId: string): boolean {
    const reg = loadRegistry();
    return !!reg[userId]?.apiKey || this.hasMasterKey();
  },

  getAllRecords(): UserApiKeyRecord[] {
    return Object.values(loadRegistry());
  },

  updateUserInfo(userId: string, email: string, name: string) {
    const reg = loadRegistry();
    if (reg[userId]) {
      reg[userId].userEmail = email;
      reg[userId].userName = name;
      saveRegistry(reg);
    }
  },

  deleteRecord(userId: string) {
    const reg = loadRegistry();
    delete reg[userId];
    saveRegistry(reg);
  },
};
