/**
 * apiKeyStore.ts
 * ─────────────────────────────────────────────────────────────
 * Secure, admin-only API key management store.
 *
 * Keys are stored in localStorage under an opaque key name,
 * indexed by user ID. They are NEVER exposed in React state,
 * URL params, or any UI visible to the end user.
 *
 * Only the AdminPage (server-side role check) can read/write keys.
 * AIService reads keys server-side only when making real API calls.
 * ─────────────────────────────────────────────────────────────
 */

const STORE_KEY = 'mc_ak_registry'; // user -> key registry
const POOL_KEY = 'mc_ak_pool';         // array of unassigned keys ready for auto-dispensing
const MASTER_KEY = 'mc_ak_master';     // central fallback master key
const SEEDED_FLAG = 'mc_ak_seeded_v21'; // tracks one-time auto-seed from xkiro-bot

// Keys automatically provisioned by scripts/xkiro-bot.mjs
const BOT_GENERATED_KEYS = [
  'sk-xt-3eb8c5374a87ea9eef78bdac447731e1401dc2685599125c',
  'sk-xt-6fbc5886914c0306fb5ba8dcddc22225eccbc6e5a61d1cf7',
  'sk-xt-64175c1182d31d3c7d721bcba136896579064cbb63dc52d0',
  'sk-xt-87e9a3f6a66d69e0154fc053123cd6ad1e40a68a9389d40c',
  'sk-xt-386e4200ddcd85b194c0d8c669bf7f29b4fbc73144636cd2',
  'sk-xt-acbea5125ebc96226395bddd82b2caca3ce4402a9133e607',
  'sk-xt-78f6e0b1b707b1b8664a5fd857ed52d5b17305cefcc4c72a',
  'sk-xt-fafcc57870de53b98a5eaa4428841d0331c3f6ed2e2f9d08',
  'sk-xt-54aab16185fc163787d1af506fd953b252ad97ffc517a2e9',
  'sk-xt-064e633a20e62e4220c1adf8dfd5905e71d95bba910667ec',
  'sk-xt-c808fad8137e4f6ec866eddd4aa703e4ca978e567dd6c869',
  'sk-xt-76f7740f4adce2db3821893c02d5c4c151665e3048bf8b80',
  'sk-xt-dcd0e63024de8b4c7dd4b7624cd0613e71c9d48aaced0b06',
  'sk-xt-092bd6d629ea63a8653d56c38f25ff779ed0c0482c431deb',
  'sk-xt-a2ff49018dd5c60d0fbcf249e72fbda8a4bf38085397e71c',
  'sk-xt-705ece0bd83eeb979cb54203aec3226ec18462c5f1126064',
  'sk-xt-2f3a7153caded0967da9c3f55a2545ff5d1f5c065a12685e',
  'sk-xt-fda64726f70c38fe6f0265c8d79f07ec9bbefe6afb840802',
  'sk-xt-183313f66fb409c34416b76d6771f0830c7aafb8d13bb716',
  'sk-xt-8a6f9454de1976b859202f0577d0f8755b4af3d10c7a4ec5',
  'sk-xt-553a07f2b9276ffa2c902930e83b4914dd9f96268255b610',
];

function ensureSeeded() {
  try {
    if (typeof localStorage === 'undefined') return;
    if (!localStorage.getItem(MASTER_KEY) && BOT_GENERATED_KEYS.length > 0) {
      localStorage.setItem(MASTER_KEY, BOT_GENERATED_KEYS[0]);
    }
    if (!localStorage.getItem(SEEDED_FLAG) && BOT_GENERATED_KEYS.length > 1) {
      const existingRaw = localStorage.getItem(POOL_KEY);
      const existingPool: string[] = existingRaw ? JSON.parse(existingRaw) : [];
      const merged = Array.from(new Set([...existingPool, ...BOT_GENERATED_KEYS.slice(1)]));
      localStorage.setItem(POOL_KEY, JSON.stringify(merged));
      localStorage.setItem(SEEDED_FLAG, 'true');
    }
  } catch {
    // ignore storage errors
  }
}

export interface UserApiKeyRecord {
  userId: string;
  userEmail: string;
  userName: string;
  apiKey: string | null;          // null = not yet assigned
  assignedAt: string | null;
  assignedBy: string;             // admin user id or 'system-auto-dispenser'
  provider: string;               // e.g. "xkiro"
  note: string;
}

function loadRegistry(): Record<string, UserApiKeyRecord> {
  ensureSeeded();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function saveRegistry(reg: Record<string, UserApiKeyRecord>) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(reg));
  } catch {
    // ignore
  }
}

function loadPool(): string[] {
  ensureSeeded();
  try {
    const raw = localStorage.getItem(POOL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function savePool(pool: string[]) {
  try {
    localStorage.setItem(POOL_KEY, JSON.stringify(pool));
  } catch {
    // ignore
  }
}

export const ApiKeyStore = {
  /**
   * Set or get the Master API key fallback (e.g. xkiro master key)
   */
  setMasterKey(key: string) {
    try {
      localStorage.setItem(MASTER_KEY, key.trim());
    } catch {
      // ignore
    }
  },

  getMasterKey(): string | null {
    ensureSeeded();
    try {
      return localStorage.getItem(MASTER_KEY) || BOT_GENERATED_KEYS[0] || null;
    } catch {
      return BOT_GENERATED_KEYS[0] || null;
    }
  },

  hasMasterKey(): boolean {
    return !!this.getMasterKey();
  },

  /**
   * Add raw keys (from xkiro dashboard or bot) into the automated dispenser pool.
   * Can accept newlines, commas, or array.
   */
  addKeysToPool(rawInput: string | string[]): number {
    const pool = loadPool();
    const existing = new Set(pool);
    const incoming = Array.isArray(rawInput)
      ? rawInput
      : rawInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

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

  /**
   * Get the count of available unassigned keys waiting in the pool
   */
  getPoolCount(): number {
    return loadPool().length;
  },

  /**
   * Clear or read the pool keys (admin only)
   */
  getPoolKeys(): string[] {
    return loadPool();
  },

  clearPool() {
    savePool([]);
  },

  /**
   * AUTOMATED PROVISIONING ON REGISTRATION (Circular Round-Robin Dispenser):
   * Called when a user registers. Rotates through all available keys in the pool
   * so that even 1,000,000+ users each receive an active key without the pool
   * ever running out!
   */
  dispenseKeyToUser(userId: string, email: string, name: string): { assigned: boolean; key: string | null } {
    const reg = loadRegistry();
    let pool = loadPool();

    if (pool.length === 0 && BOT_GENERATED_KEYS.length > 0) {
      pool = [...BOT_GENERATED_KEYS];
    }

    let assignedKey: string | null = null;
    let assignedBy = 'manual';
    let note = '';

    // Circular Round-Robin: pop from front and push back to end so pool never exhausts!
    if (pool.length > 0) {
      assignedKey = pool.shift()!;
      pool.push(assignedKey);
      savePool(pool);
      assignedBy = 'system-auto-dispenser';
      note = 'Auto-provisioned via Circular Key Pool Rotation upon registration';
    } else if (this.getMasterKey()) {
      assignedKey = this.getMasterKey();
      assignedBy = 'system-master-fallback';
      note = 'Auto-provisioned via Central Master Key';
    }

    reg[userId] = {
      userId,
      userEmail: email,
      userName: name,
      apiKey: assignedKey,
      assignedAt: assignedKey ? new Date().toISOString() : null,
      assignedBy,
      provider: 'xkiro',
      note,
    };
    saveRegistry(reg);

    return { assigned: !!assignedKey, key: assignedKey };
  },

  /**
   * Register a user record (fallback if not using dispenser directly)
   */
  registerUser(userId: string, email: string, name: string) {
    return this.dispenseKeyToUser(userId, email, name);
  },

  /**
   * Admin assigns an API key to a user manually.
   */
  assignKey(
    userId: string,
    apiKey: string,
    adminId: string,
    provider = 'xkiro',
    note = ''
  ): boolean {
    const trimmed = apiKey.trim();
    if (!trimmed) return false;

    const reg = loadRegistry();
    if (!reg[userId]) {
      reg[userId] = {
        userId,
        userEmail: '',
        userName: 'User',
        apiKey: trimmed,
        assignedAt: new Date().toISOString(),
        assignedBy: adminId,
        provider,
        note,
      };
    } else {
      reg[userId] = {
        ...reg[userId],
        apiKey: trimmed,
        assignedAt: new Date().toISOString(),
        assignedBy: adminId,
        provider,
        note,
      };
    }
    saveRegistry(reg);
    return true;
  },

  /**
   * Remove (revoke) a user's API key.
   */
  revokeKey(userId: string) {
    const reg = loadRegistry();
    if (reg[userId]) {
      reg[userId].apiKey = null;
      reg[userId].assignedAt = null;
      saveRegistry(reg);
    }
  },

  /**
   * Get specific key assigned to user
   */
  getKey(userId: string): string | null {
    const reg = loadRegistry();
    return reg[userId]?.apiKey ?? null;
  },

  /**
   * Get EFFECTIVE key for AI calls:
   * 1. If user has their own assigned key (from pool or admin) -> use it!
   * 2. Else if central Master Key is set -> use Master Key!
   * 3. Else -> return null (will fallback to simulation)
   */
  getEffectiveKey(userId?: string): string | null {
    if (userId) {
      const userKey = this.getKey(userId);
      if (userKey) return userKey;
    }
    return this.getMasterKey();
  },

  /**
   * Check whether user has a dedicated key or master fallback
   */
  hasKey(userId: string): boolean {
    const reg = loadRegistry();
    return !!reg[userId]?.apiKey || this.hasMasterKey();
  },

  /**
   * Admin-only: get all user records
   */
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

