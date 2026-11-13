#!/usr/bin/env node
/**
 * scripts/master-ram-engine.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER RAM — 4-Tier Extreme-Speed Hybrid Virtual Memory Engine & OS Optimizer
 *
 * Combines all 4 memory tiers into one unified high-speed engine (Port 9060):
 *   - Per-User Isolated 500 GB Virtual RAM Address Space
 *   - Tier 1 (L1): Zero-Copy Hot Physical RAM Slab (ArrayBuffer/Buffer Pool)
 *   - Tier 2 (L2): Native C++ Zstandard (zstd) In-RAM Compressed Pool (ZRAM-style)
 *   - Tier 3 (L3): Sparse Local SSD Swap + Predictive Sequential/Stride Prefetcher
 *   - Tier 4 (L4): Master Cloud 500 GB Cold Memory Vault (Async Offload)
 *   - Native Win32 Helper: Real EmptyWorkingSet, Foreground App Protection,
 *     Windows MemoryCompression & High-Speed SSD Pagefile Optimization.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import { Worker } from 'worker_threads';
import { execFile, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const PORT_RAM = parseInt(process.env.MASTER_RAM_PORT, 10) || 9060;
const USER_QUOTA_BYTES = 500 * 1024 * 1024 * 1024; // 500 GB dedicated virtual RAM per user
const DEFAULT_PAGE_SIZE = 64 * 1024; // 64 KB page
const MAX_PAGE_SIZE = 16 * 1024 * 1024; // 16 MB max per page

const USER_DATA_DIR = path.join(os.homedir(), '.mastercloud');
const RAM_ROOT_DIR = path.join(USER_DATA_DIR, 'master-ram');
const FAST_SWAP_BASE =
  process.platform === 'win32' && fs.existsSync('D:\\')
    ? 'D:\\MasterRamSwap'
    : path.join(RAM_ROOT_DIR, 'swap');

for (const dir of [USER_DATA_DIR, RAM_ROOT_DIR, FAST_SWAP_BASE]) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
}

const WIN32_BIN_CANDIDATES = [
  path.join(__dirname, 'bin', 'master-ram-win32.exe'),
  path.join(process.resourcesPath || '', 'app.asar.unpacked', 'scripts', 'bin', 'master-ram-win32.exe'),
  path.join(PROJECT_ROOT, 'scripts', 'bin', 'master-ram-win32.exe'),
];

function getWin32ExePath() {
  for (const p of WIN32_BIN_CANDIDATES) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

// ── Compression Primitives (Native C++ Zstandard / Deflate fallback) ────────
const hasNativeZstd = typeof zlib.zstdCompressSync === 'function';
const ZSTD_COMPRESS_OPTS = hasNativeZstd
  ? { params: { [zlib.constants.ZSTD_c_compressionLevel]: 1 } }
  : undefined;

function compressFast(buf) {
  if (!buf || buf.length < 128) return { data: buf, codec: 'raw' };
  const compressed = hasNativeZstd
    ? zlib.zstdCompressSync(buf, ZSTD_COMPRESS_OPTS)
    : zlib.deflateRawSync(buf, { level: 1 });
  // Do not waste CPU decompressing incompressible/high-entropy pages
  if (compressed.length >= buf.length * 0.96) {
    return { data: buf, codec: 'raw' };
  }
  return { data: compressed, codec: hasNativeZstd ? 'zstd' : 'deflate' };
}

function decompressFast(buf, codec) {
  if (codec === 'raw') return buf;
  if (codec === 'zstd' && hasNativeZstd) {
    return zlib.zstdDecompressSync(buf);
  }
  return zlib.inflateRawSync(buf);
}

// ── Engine Modes & Adaptive Host-Safe Budgets ───────────────────────────────
const MODE_PROFILES = {
  extreme_speed: {
    label: 'Extreme Speed (All 4 Tiers)',
    maxL1RatioOfFree: 0.14,
    maxL1BytesCap: 256 * 1024 * 1024,
    minL1Bytes: 24 * 1024 * 1024,
    maxL2RatioOfFree: 0.14,
    maxL2BytesCap: 256 * 1024 * 1024,
    minL2Bytes: 24 * 1024 * 1024,
    maxL3LocalSwapBytes: 8 * 1024 * 1024 * 1024, // 8 GB fast SSD swap cache
    prefetchDepth: 8,
    autoTrimThresholdPct: 84,
  },
  balanced: {
    label: 'Balanced Smart Tiering',
    maxL1RatioOfFree: 0.08,
    maxL1BytesCap: 96 * 1024 * 1024,
    minL1Bytes: 12 * 1024 * 1024,
    maxL2RatioOfFree: 0.08,
    maxL2BytesCap: 128 * 1024 * 1024,
    minL2Bytes: 16 * 1024 * 1024,
    maxL3LocalSwapBytes: 4 * 1024 * 1024 * 1024,
    prefetchDepth: 2,
    autoTrimThresholdPct: 88,
  },
  ultra_potato: {
    label: 'Ultra-Potato Guard (2GB–4GB PCs)',
    maxL1RatioOfFree: 0.04,
    maxL1BytesCap: 8 * 1024 * 1024, // Strictly <= 8 MB L1
    minL1Bytes: 4 * 1024 * 1024,
    maxL2RatioOfFree: 0.05,
    maxL2BytesCap: 16 * 1024 * 1024, // Strictly <= 16 MB L2
    minL2Bytes: 6 * 1024 * 1024,
    maxL3LocalSwapBytes: 2 * 1024 * 1024 * 1024,
    prefetchDepth: 1,
    autoTrimThresholdPct: 76,
  },
};

let engineConfig = {
  mode: 'extreme_speed',
  prefetchEnabled: true,
  autoTrimEnabled: true,
  bgBalanceEnabled: true,
  targetMemoryLoadPct: 30,
  demoteBgPriority: true,
  cloudVaultEnabled: false, // Optional L4 remote upload (offline vault works locally without internet)
  cloudProviderUrl: 'https://litterbox.catbox.moe/resources/internals/api.php',
};

function computeBudgets() {
  const profile = MODE_PROFILES[engineConfig.mode] || MODE_PROFILES.extreme_speed;
  const free = os.freemem();
  const total = os.totalmem();

  // Keep ultra-safe ceiling on low-RAM laptops (<= 4 GB)
  const isLowRamHost = total <= 4.5 * 1024 * 1024 * 1024;
  const effectiveCapScale = isLowRamHost && engineConfig.mode !== 'ultra_potato' ? 0.5 : 1;

  const l1BudgetBytes = Math.min(
    Math.floor(profile.maxL1BytesCap * effectiveCapScale),
    Math.max(profile.minL1Bytes, Math.floor(free * profile.maxL1RatioOfFree))
  );
  const l2BudgetBytes = Math.min(
    Math.floor(profile.maxL2BytesCap * effectiveCapScale),
    Math.max(profile.minL2Bytes, Math.floor(free * profile.maxL2RatioOfFree))
  );

  return {
    l1BudgetBytes,
    l2BudgetBytes,
    maxL3LocalSwapBytes: profile.maxL3LocalSwapBytes,
    prefetchDepth: engineConfig.prefetchEnabled ? profile.prefetchDepth : 0,
    autoTrimThresholdPct: profile.autoTrimThresholdPct,
    isLowRamHost,
  };
}

// ── Per-User 500 GB Virtual Memory State ────────────────────────────────────
function getActiveSessionEmail() {
  const candidates = [
    path.join(USER_DATA_DIR, 'user-session.json'),
    path.join(USER_DATA_DIR, 'active-web-session.json'),
  ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (parsed?.email) return String(parsed.email).trim().toLowerCase();
      }
    } catch { /* ignore */ }
  }
  return 'default@mastercloud.local';
}

function hashUser(email) {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16);
}

// Global L1/L2 LRU pools keyed by `${userHash}:${regionId}:${pageIndex}`
// while tracking strict per-user 500 GB virtual quota & region ownership!
const l1Pool = new Map(); // pageKey -> { userHash, regionId, pageIndex, buf, size, accessedAt }
let l1UsedBytes = 0;

const l2Pool = new Map(); // pageKey -> { userHash, regionId, pageIndex, buf, codec, rawSize, compSize, accessedAt }
let l2UsedBytes = 0;

// In-flight prefetch & eviction deduplication
const inflightPrefetch = new Set();
const userStores = new Map(); // userHash -> UserRamSpace

function getUserSpace(emailRaw) {
  const email = (emailRaw || getActiveSessionEmail()).trim().toLowerCase();
  const userHash = hashUser(email);
  let space = userStores.get(userHash);
  if (space) return space;

  const swapDir = path.join(FAST_SWAP_BASE, userHash);
  const vaultDir = path.join(RAM_ROOT_DIR, 'vault', userHash);
  const manifestPath = path.join(vaultDir, 'ram-manifest.json');
  try { fs.mkdirSync(swapDir, { recursive: true }); } catch { /* ignore */ }
  try { fs.mkdirSync(vaultDir, { recursive: true }); } catch { /* ignore */ }

  space = {
    email,
    userHash,
    quotaBytes: USER_QUOTA_BYTES,
    swapDir,
    vaultDir,
    manifestPath,
    regions: new Map(), // regionId -> { id, name, pageSize, committedBytes, pages: Map<number, PageMeta>, lastAccessIdx, lastStride }
    l3SwapBytes: 0,
    l4VaultBytes: 0,
    totalCommittedBytes: 0,
  };

  // Load persisted region/page metadata if available
  try {
    if (fs.existsSync(manifestPath)) {
      const saved = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (saved && Array.isArray(saved.regions)) {
        for (const r of saved.regions) {
          const pagesMap = new Map();
          if (Array.isArray(r.pages)) {
            for (const p of r.pages) {
              // On restart, any L1/L2 pages that weren't flushed to L3/L4 don't exist in volatile RAM,
              // so only restore pages backed by L3 swap or L4 vault files!
              if (p.swapFile && fs.existsSync(p.swapFile)) {
                pagesMap.set(p.pageIndex, {
                  pageIndex: p.pageIndex,
                  rawSize: p.rawSize,
                  compSize: p.compSize,
                  codec: p.codec,
                  tier: p.tier === 'L4' ? 'L4' : 'L3',
                  swapFile: p.swapFile,
                  cloudUrl: p.cloudUrl || null,
                  updatedAt: p.updatedAt || Date.now(),
                });
                if (p.tier === 'L4') space.l4VaultBytes += p.compSize;
                else space.l3SwapBytes += p.compSize;
                space.totalCommittedBytes += p.rawSize;
              }
            }
          }
          space.regions.set(r.id, {
            id: r.id,
            name: r.name,
            pageSize: r.pageSize || DEFAULT_PAGE_SIZE,
            createdAt: r.createdAt || Date.now(),
            lastAccessIdx: -1,
            lastStride: 1,
            pages: pagesMap,
          });
        }
      }
    }
  } catch { /* ignore corrupt manifest */ }

  userStores.set(userHash, space);
  return space;
}

const dirtyManifestUsers = new Set();
let manifestFlushTimer = null;

function scheduleManifestSave(userHash) {
  dirtyManifestUsers.add(userHash);
  if (manifestFlushTimer) return;
  manifestFlushTimer = setTimeout(() => {
    manifestFlushTimer = null;
    for (const uh of dirtyManifestUsers) {
      const space = userStores.get(uh);
      if (!space) continue;
      try {
        const serialized = {
          email: space.email,
          quotaBytes: space.quotaBytes,
          updatedAt: new Date().toISOString(),
          regions: Array.from(space.regions.values()).map((r) => ({
            id: r.id,
            name: r.name,
            pageSize: r.pageSize,
            createdAt: r.createdAt,
            pages: Array.from(r.pages.values()).filter((p) => p.swapFile),
          })),
        };
        fs.writeFileSync(space.manifestPath, JSON.stringify(serialized), 'utf8');
      } catch { /* ignore */ }
    }
    dirtyManifestUsers.clear();
  }, 1500);
}

// ── Telemetry Counters (100% Real Measured Metrics) ─────────────────────────
const telemetry = {
  startedAt: Date.now(),
  l1Hits: 0,
  l2Hits: 0,
  l3Hits: 0,
  l4Hits: 0,
  misses: 0,
  writes: 0,
  bytesRead: 0,
  bytesWritten: 0,
  rawBytesBeforeCompress: 0,
  compressedBytesInPool: 0,
  prefetchIssued: 0,
  prefetchHits: 0,
  evictionsL1ToL2: 0,
  evictionsL2ToL3: 0,
  evictionsL3ToL4: 0,
  lastReadLatencyUs: 0,
  lastBenchmark: null,
  lastOptimizeResult: null,
  lastBalanceResult: null,
  lastAutoTrimAt: 0,
  lastBalanceAt: 0,
  recentFgPids: new Map(), // pid -> lastSeenTimestampMs (20s foreground grace protection)
};

function makePageKey(userHash, regionId, pageIndex) {
  return `${userHash}:${regionId}:${pageIndex}`;
}

// ── Eviction Cascade: L1 -> L2 -> L3 -> L4 ──────────────────────────────────
async function spillL3ToL4(space, region, pageMeta) {
  if (!pageMeta.swapFile || !fs.existsSync(pageMeta.swapFile)) return;
  const vaultFile = path.join(space.vaultDir, `${region.id}_p${pageMeta.pageIndex}.mram`);

  try {
    // Move local SSD swap frame into compressed Cold Vault (and optionally upload to Cloud CDN)
    const data = await fs.promises.readFile(pageMeta.swapFile);
    await fs.promises.writeFile(vaultFile, data);
    if (pageMeta.swapFile !== vaultFile) {
      await fs.promises.unlink(pageMeta.swapFile).catch(() => {});
      space.l3SwapBytes = Math.max(0, space.l3SwapBytes - pageMeta.compSize);
    }
    pageMeta.swapFile = vaultFile;
    pageMeta.tier = 'L4';
    space.l4VaultBytes += pageMeta.compSize;
    telemetry.evictionsL3ToL4++;

    if (engineConfig.cloudVaultEnabled && !pageMeta.cloudUrl) {
      // Optional async offload to cloud chunk host (litterbox 72h scratch / catbox)
      uploadChunkToCloud(data, `${space.userHash}_${region.id}_p${pageMeta.pageIndex}.mram`)
        .then((url) => {
          if (url) {
            pageMeta.cloudUrl = url;
            scheduleManifestSave(space.userHash);
          }
        })
        .catch(() => {});
    }

    scheduleManifestSave(space.userHash);
  } catch { /* ignore */ }
}

function uploadChunkToCloud(buffer, filename) {
  return new Promise((resolve) => {
    try {
      const boundary = '----MasterRamBoundary' + crypto.randomBytes(8).toString('hex');
      const header = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="time"\r\n\r\n72h\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="${filename}"\r\n` +
        `Content-Type: application/octet-stream\r\n\r\n`
      );
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([header, buffer, footer]);

      const urlObj = new URL(engineConfig.cloudProviderUrl);
      const req = https.request(
        {
          hostname: urlObj.hostname,
          path: urlObj.pathname,
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length,
          },
          timeout: 15000,
        },
        (res) => {
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => {
            const trimmed = raw.trim();
            if (res.statusCode === 200 && trimmed.startsWith('http')) resolve(trimmed);
            else resolve(null);
          });
        }
      );
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(body);
      req.end();
    } catch {
      resolve(null);
    }
  });
}

const pendingSwapFrames = new Map(); // pageKey -> { buf, codec } during async disk spill

async function evictL2IfNeeded(budgets) {
  while (l2UsedBytes > budgets.l2BudgetBytes && l2Pool.size > 0) {
    const oldestKey = l2Pool.keys().next().value;
    const entry = l2Pool.get(oldestKey);
    l2Pool.delete(oldestKey);
    l2UsedBytes = Math.max(0, l2UsedBytes - entry.compSize);

    const space = userStores.get(entry.userHash);
    if (!space) continue;
    const region = space.regions.get(entry.regionId);
    if (!region) continue;
    const meta = region.pages.get(entry.pageIndex);
    if (!meta) continue;

    pendingSwapFrames.set(oldestKey, { buf: entry.buf, codec: entry.codec });

    // Write compressed binary frame straight to L3 SSD Swap
    const swapFile = path.join(space.swapDir, `${region.id}_p${entry.pageIndex}.swap`);
    try {
      await fs.promises.writeFile(swapFile, entry.buf);
      if (meta.tier === 'L3') {
        space.l3SwapBytes = Math.max(0, space.l3SwapBytes - (meta.compSize || 0));
      } else if (meta.tier === 'L4') {
        space.l4VaultBytes = Math.max(0, space.l4VaultBytes - (meta.compSize || 0));
      }
      space.l3SwapBytes += entry.compSize;
      meta.swapFile = swapFile;
      meta.codec = entry.codec;
      meta.compSize = entry.compSize;
      meta.rawSize = entry.rawSize;
      meta.tier = 'L3';
      telemetry.evictionsL2ToL3++;
      scheduleManifestSave(space.userHash);

      // If local SSD swap exceeds budget, migrate cold pages into L4 Vault
      if (space.l3SwapBytes > budgets.maxL3LocalSwapBytes) {
        for (const r of space.regions.values()) {
          for (const pm of r.pages.values()) {
            if (pm.tier === 'L3' && space.l3SwapBytes > budgets.maxL3LocalSwapBytes * 0.85) {
              await spillL3ToL4(space, r, pm);
            }
          }
        }
      }
    } catch { /* ignore disk write error */ } finally {
      pendingSwapFrames.delete(oldestKey);
    }
  }
}

async function evictL1IfNeeded(budgets) {
  while (l1UsedBytes > budgets.l1BudgetBytes && l1Pool.size > 0) {
    const oldestKey = l1Pool.keys().next().value;
    const entry = l1Pool.get(oldestKey);
    l1Pool.delete(oldestKey);
    l1UsedBytes = Math.max(0, l1UsedBytes - entry.size);

    // Compress L1 page into L2 Zstd/Deflate RAM Pool
    const { data, codec } = compressFast(entry.buf);
    telemetry.rawBytesBeforeCompress += entry.buf.length;
    telemetry.compressedBytesInPool += data.length;

    l2Pool.set(oldestKey, {
      userHash: entry.userHash,
      regionId: entry.regionId,
      pageIndex: entry.pageIndex,
      buf: data,
      codec,
      rawSize: entry.buf.length,
      compSize: data.length,
      accessedAt: Date.now(),
    });
    l2UsedBytes += data.length;
    telemetry.evictionsL1ToL2++;

    const space = userStores.get(entry.userHash);
    const region = space?.regions.get(entry.regionId);
    const meta = region?.pages.get(entry.pageIndex);
    if (meta) {
      if (meta.tier === 'L3') {
        space.l3SwapBytes = Math.max(0, space.l3SwapBytes - (meta.compSize || 0));
      } else if (meta.tier === 'L4') {
        space.l4VaultBytes = Math.max(0, space.l4VaultBytes - (meta.compSize || 0));
      }
      meta.tier = 'L2';
      meta.codec = codec;
      meta.compSize = data.length;
    }
  }
  await evictL2IfNeeded(budgets);
}

function promoteToL1(space, region, pageIndex, rawBuf, isPrefetch = false) {
  const key = makePageKey(space.userHash, region.id, pageIndex);
  if (l1Pool.has(key)) {
    const existing = l1Pool.get(key);
    l1Pool.delete(key);
    l1UsedBytes = Math.max(0, l1UsedBytes - existing.size);
  }
  l1Pool.set(key, {
    userHash: space.userHash,
    regionId: region.id,
    pageIndex,
    buf: rawBuf,
    size: rawBuf.length,
    accessedAt: Date.now(),
    prefetched: isPrefetch,
  });
  l1UsedBytes += rawBuf.length;

  const meta = region.pages.get(pageIndex);
  if (meta) {
    // Cleanup stale swap/vault file when promoted back to L1? Keep swap file or decrement cleanly:
    // Moving back to L1 means active tier is now L1 (no tier double-counting).
    if (meta.tier === 'L3') {
      space.l3SwapBytes = Math.max(0, space.l3SwapBytes - (meta.compSize || 0));
    } else if (meta.tier === 'L4') {
      space.l4VaultBytes = Math.max(0, space.l4VaultBytes - (meta.compSize || 0));
    }
    if (meta.swapFile && fs.existsSync(meta.swapFile)) {
      fs.unlink(meta.swapFile, () => {});
      meta.swapFile = null;
    }
    meta.tier = 'L1';
    meta.updatedAt = Date.now();
  }
}

async function writePage(space, regionId, pageIndex, rawBuf) {
  if (rawBuf.length > MAX_PAGE_SIZE) {
    throw new Error(`Page exceeds max ${MAX_PAGE_SIZE} bytes`);
  }
  const region = space.regions.get(regionId);
  if (!region) throw new Error('Region not found');

  const existingMeta = region.pages.get(pageIndex);
  const sizeDelta = rawBuf.length - (existingMeta?.rawSize || 0);
  if (space.totalCommittedBytes + sizeDelta > space.quotaBytes) {
    throw new Error('User 500 GB Master RAM quota exceeded');
  }

  space.totalCommittedBytes += sizeDelta;
  telemetry.writes++;
  telemetry.bytesWritten += rawBuf.length;

  const key = makePageKey(space.userHash, regionId, pageIndex);
  if (l2Pool.has(key)) {
    const prevL2 = l2Pool.get(key);
    l2Pool.delete(key);
    l2UsedBytes = Math.max(0, l2UsedBytes - prevL2.compSize);
  }

  region.pages.set(pageIndex, {
    pageIndex,
    rawSize: rawBuf.length,
    compSize: existingMeta?.compSize || rawBuf.length,
    codec: 'raw',
    tier: existingMeta?.tier || 'L1',
    swapFile: existingMeta?.swapFile || null,
    cloudUrl: null,
    updatedAt: Date.now(),
  });

  promoteToL1(space, region, pageIndex, rawBuf, false);

  const budgets = computeBudgets();
  if (l1UsedBytes > budgets.l1BudgetBytes) {
    await evictL1IfNeeded(budgets);
  }

  return {
    tier: 'L1',
    size: rawBuf.length,
    committedBytes: space.totalCommittedBytes,
  };
}

async function fetchFromCloudUrl(url) {
  return new Promise((resolve) => {
    try {
      https.get(url, { timeout: 15000 }, (res) => {
        if (res.statusCode !== 200) { resolve(null); return; }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      }).on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

async function readPage(space, regionId, pageIndex, isPrefetch = false) {
  const t0 = process.hrtime.bigint();
  const region = space.regions.get(regionId);
  if (!region) return null;

  const key = makePageKey(space.userHash, regionId, pageIndex);

  // 1. TIER 1 HIT (Zero-Copy Physical RAM Slab)
  if (l1Pool.has(key)) {
    const entry = l1Pool.get(key);
    // Refresh LRU order
    l1Pool.delete(key);
    entry.accessedAt = Date.now();
    if (!isPrefetch) {
      if (entry.prefetched) {
        telemetry.prefetchHits++;
        entry.prefetched = false;
      }
      telemetry.l1Hits++;
      telemetry.bytesRead += entry.size;
    }
    l1Pool.set(key, entry);
    const dtUs = Number(process.hrtime.bigint() - t0) / 1000;
    if (!isPrefetch) telemetry.lastReadLatencyUs = dtUs;
    return { buf: entry.buf, tier: 'L1', latencyUs: dtUs };
  }

  // 2. TIER 2 HIT (In-RAM Zstd Decompression)
  if (l2Pool.has(key)) {
    const entry = l2Pool.get(key);
    l2Pool.delete(key);
    l2UsedBytes = Math.max(0, l2UsedBytes - entry.compSize);

    const rawBuf = decompressFast(entry.buf, entry.codec);
    promoteToL1(space, region, pageIndex, rawBuf, isPrefetch);
    const budgets = computeBudgets();
    if (l1UsedBytes > budgets.l1BudgetBytes) {
      await evictL1IfNeeded(budgets);
    }

    if (!isPrefetch) {
      telemetry.l2Hits++;
      telemetry.bytesRead += rawBuf.length;
    }
    const dtUs = Number(process.hrtime.bigint() - t0) / 1000;
    if (!isPrefetch) telemetry.lastReadLatencyUs = dtUs;
    return { buf: rawBuf, tier: 'L2', latencyUs: dtUs };
  }

  // 3. TIER 3 / TIER 4 HIT (Local SSD Swap or Cold Cloud Vault)
  const pending = pendingSwapFrames.get(key);
  if (pending) {
    const rawBuf = decompressFast(pending.buf, pending.codec || 'raw');
    promoteToL1(space, region, pageIndex, rawBuf, isPrefetch);
    if (!isPrefetch) {
      telemetry.l2Hits++;
      telemetry.bytesRead += rawBuf.length;
    }
    const dtUs = Number(process.hrtime.bigint() - t0) / 1000;
    if (!isPrefetch) telemetry.lastReadLatencyUs = dtUs;
    return { buf: rawBuf, tier: 'L2', latencyUs: dtUs };
  }

  const meta = region.pages.get(pageIndex);
  if (!meta) {
    if (!isPrefetch) telemetry.misses++;
    return null;
  }

  let frameBuf = null;
  let sourceTier = meta.tier === 'L4' ? 'L4' : 'L3';

  if (meta.swapFile && fs.existsSync(meta.swapFile)) {
    frameBuf = await fs.promises.readFile(meta.swapFile);
  } else if (meta.cloudUrl) {
    sourceTier = 'L4';
    frameBuf = await fetchFromCloudUrl(meta.cloudUrl);
  }

  if (!frameBuf) {
    if (!isPrefetch) telemetry.misses++;
    return null;
  }

  const rawBuf = decompressFast(frameBuf, meta.codec || 'raw');
  promoteToL1(space, region, pageIndex, rawBuf, isPrefetch);
  const budgets = computeBudgets();
  if (l1UsedBytes > budgets.l1BudgetBytes) {
    await evictL1IfNeeded(budgets);
  }

  if (!isPrefetch) {
    if (sourceTier === 'L4') telemetry.l4Hits++;
    else telemetry.l3Hits++;
    telemetry.bytesRead += rawBuf.length;
  }

  const dtUs = Number(process.hrtime.bigint() - t0) / 1000;
  if (!isPrefetch) telemetry.lastReadLatencyUs = dtUs;
  return { buf: rawBuf, tier: sourceTier, latencyUs: dtUs };
}

function triggerPredictivePrefetch(space, region, currentPageIndex) {
  const budgets = computeBudgets();
  if (budgets.prefetchDepth <= 0) return;

  // Detect sequential or stride access pattern
  let stride = 1;
  if (region.lastAccessIdx >= 0) {
    const delta = currentPageIndex - region.lastAccessIdx;
    if (delta !== 0 && Math.abs(delta) <= 8) {
      stride = delta;
    }
  }
  region.lastAccessIdx = currentPageIndex;
  region.lastStride = stride;

  for (let step = 1; step <= budgets.prefetchDepth; step++) {
    const nextIdx = currentPageIndex + stride * step;
    if (nextIdx < 0 || !region.pages.has(nextIdx)) continue;
    const nextKey = makePageKey(space.userHash, region.id, nextIdx);
    if (l1Pool.has(nextKey) || inflightPrefetch.has(nextKey)) continue;

    inflightPrefetch.add(nextKey);
    telemetry.prefetchIssued++;
    setImmediate(async () => {
      try {
        await readPage(space, region.id, nextIdx, true);
      } finally {
        inflightPrefetch.delete(nextKey);
      }
    });
  }
}

// ── Native Win32 Helper Execution & Windows Memory Optimization ─────────────
function runWin32Helper(args = ['status']) {
  return new Promise((resolve) => {
    const exe = getWin32ExePath();
    if (!exe || process.platform !== 'win32') {
      resolve(null);
      return;
    }
    execFile(exe, args, { timeout: 6000, windowsHide: true }, (err, stdout) => {
      if (err || !stdout) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        resolve(null);
      }
    });
  });
}

function getFallbackHostMemory() {
  const total = os.totalmem();
  const avail = os.freemem();
  const used = Math.max(0, total - avail);
  return {
    ok: true,
    foregroundPid: 0,
    processCount: 0,
    memory: {
      memoryLoadPercent: total > 0 ? Math.round((used / total) * 100) : 0,
      totalPhysicalBytes: total,
      availPhysicalBytes: avail,
      usedPhysicalBytes: used,
      totalCommitBytes: total,
      availCommitBytes: avail,
      usedCommitBytes: used,
      totalVirtualBytes: total,
      availVirtualBytes: avail,
    },
    topProcesses: [],
  };
}

let cachedWin32Status = null;
let lastWin32PollAt = 0;

async function getHostMemoryStatus(force = false) {
  const now = Date.now();
  if (!force && cachedWin32Status && now - lastWin32PollAt < 2000) {
    return cachedWin32Status;
  }
  const winData = await runWin32Helper(['status']);
  cachedWin32Status = winData || getFallbackHostMemory();
  lastWin32PollAt = now;
  return cachedWin32Status;
}

const FG_GRACE_WINDOW_MS = 20000;
const BG_BALANCE_COOLDOWN_MS = 15000;

function trackForegroundPid(fgPid) {
  const now = Date.now();
  if (fgPid && fgPid > 4) {
    telemetry.recentFgPids.set(fgPid, now);
  }
  for (const [pid, ts] of telemetry.recentFgPids.entries()) {
    if (now - ts > FG_GRACE_WINDOW_MS) {
      telemetry.recentFgPids.delete(pid);
    }
  }
}

function collectProtectPidArgs() {
  const args = [`--protect-pid=${process.pid}`];
  const now = Date.now();
  for (const [pid, ts] of telemetry.recentFgPids.entries()) {
    if (now - ts <= FG_GRACE_WINDOW_MS && pid !== process.pid) {
      args.push(`--protect-pid=${pid}`);
    }
  }
  return args;
}

function runWin32HelperElevated(args = ['balance']) {
  return new Promise((resolve) => {
    const exe = getWin32ExePath();
    if (!exe || process.platform !== 'win32') {
      resolve(null);
      return;
    }
    const outFile = path.join(os.tmpdir(), `mram-elev-${process.pid}-${Date.now()}.json`);
    const safeArgs = args.map((a) => `'${String(a).replace(/'/g, "''")}'`).join(' ');
    const exeEsc = exe.replace(/'/g, "''");
    const outEsc = outFile.replace(/'/g, "''");
    // Run elevated cmd wrapper so stdout is captured into outFile cleanly
    const innerCmd = `& '${exeEsc}' ${safeArgs} | Out-File -FilePath '${outEsc}' -Encoding utf8`;
    const encoded = Buffer.from(innerCmd, 'utf16le').toString('base64');
    const wrapper = `Start-Process powershell.exe -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}'`;

    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', wrapper],
      { timeout: 30000, windowsHide: true },
      (err) => {
        try {
          if (!err && fs.existsSync(outFile)) {
            const raw = fs.readFileSync(outFile, 'utf8').replace(/^\uFEFF/, '').trim();
            if (raw) {
              resolve(JSON.parse(raw));
              return;
            }
          }
        } catch { /* ignore */ }
        finally {
          try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch { /* ignore */ }
        }
        resolve({ ok: false, error: 'UAC elevation cancelled or failed' });
      }
    );
  });
}

async function optimizeHostMemory(aggressive = false) {
  const args = ['optimize', ...collectProtectPidArgs()];
  if (aggressive) args.push('--aggressive');
  const result = await runWin32Helper(args);
  if (result && result.ok) {
    telemetry.lastOptimizeResult = {
      ...result,
      timestamp: new Date().toISOString(),
    };
    cachedWin32Status = null; // invalidate cache
    return telemetry.lastOptimizeResult;
  }
  return {
    ok: false,
    error: process.platform === 'win32' ? 'Win32 helper unavailable' : 'Windows-only feature',
    timestamp: new Date().toISOString(),
  };
}

const ADMIN_TASK_NAME = 'MasterRamAdminBalancer';
const ADMIN_TASK_OUT_FILE = path.join(USER_DATA_DIR, 'last-admin-balance.json');
let adminTaskInstalled = false;

function refreshAdminTaskStatus() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      adminTaskInstalled = false;
      resolve({ supported: false, installed: false });
      return;
    }
    execFile(
      'schtasks.exe',
      ['/Query', '/TN', ADMIN_TASK_NAME],
      { timeout: 3000, windowsHide: true },
      (err) => {
        adminTaskInstalled = !err;
        resolve({ supported: true, installed: adminTaskInstalled, taskName: ADMIN_TASK_NAME });
      }
    );
  });
}

if (process.platform === 'win32') {
  refreshAdminTaskStatus();
}

function runAdminBalancerTask(prevMtimeMs = 0) {
  return new Promise((resolve) => {
    execFile(
      'schtasks.exe',
      ['/Run', '/TN', ADMIN_TASK_NAME],
      { timeout: 4000, windowsHide: true },
      async (err) => {
        if (err) {
          resolve(null);
          return;
        }
        // Poll output JSON briefly while the elevated task completes
        for (let i = 0; i < 16; i++) {
          await new Promise((r) => setTimeout(r, 180));
          try {
            if (fs.existsSync(ADMIN_TASK_OUT_FILE)) {
              const st = fs.statSync(ADMIN_TASK_OUT_FILE);
              if (st.mtimeMs > prevMtimeMs) {
                const raw = fs.readFileSync(ADMIN_TASK_OUT_FILE, 'utf8').trim();
                if (raw) {
                  resolve(JSON.parse(raw));
                  return;
                }
              }
            }
          } catch { /* wait next poll */ }
        }
        resolve(null);
      }
    );
  });
}

function installAdminBalancerTask(targetPct = 30) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ ok: false, error: 'Windows only' });
      return;
    }
    const exe = getWin32ExePath();
    if (!exe) {
      resolve({ ok: false, error: 'master-ram-win32.exe not found' });
      return;
    }
    const cleanTarget = Math.max(15, Math.min(95, Math.round(Number(targetPct) || 30)));
    const exeEsc = exe.replace(/'/g, "''");
    const outEsc = ADMIN_TASK_OUT_FILE.replace(/'/g, "''");
    const argStr = `balance --target=${cleanTarget} --demote-bg --aggressive --out="${outEsc}"`;
    const psScript = [
      `$action = New-ScheduledTaskAction -Execute '${exeEsc}' -Argument '${argStr}';`,
      `$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Highest;`,
      `$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew;`,
      `Register-ScheduledTask -TaskName '${ADMIN_TASK_NAME}' -Action $action -Principal $principal -Settings $settings -Force | Out-Null;`,
      `Start-ScheduledTask -TaskName '${ADMIN_TASK_NAME}';`,
    ].join(' ');
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    const wrapper = `Start-Process powershell.exe -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}'`;
    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', wrapper], {
      windowsHide: false,
    });
    child.on('exit', async (code) => {
      await refreshAdminTaskStatus();
      resolve({
        ok: code === 0 && adminTaskInstalled,
        installed: adminTaskInstalled,
        note: adminTaskInstalled
          ? 'Always-On Admin Balancer task installed (SeDebugPrivilege + Modified/Standby purge active).'
          : 'Admin installation was cancelled or failed.',
      });
    });
    child.on('error', (e) => resolve({ ok: false, installed: adminTaskInstalled, error: e.message }));
  });
}

function uninstallAdminBalancerTask() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ ok: false, error: 'Windows only' });
      return;
    }
    const psScript = `Unregister-ScheduledTask -TaskName '${ADMIN_TASK_NAME}' -Confirm:$false -ErrorAction SilentlyContinue`;
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    const wrapper = `Start-Process powershell.exe -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}'`;
    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', wrapper], {
      windowsHide: false,
    });
    child.on('exit', async (code) => {
      await refreshAdminTaskStatus();
      resolve({ ok: code === 0, installed: adminTaskInstalled });
    });
    child.on('error', (e) => resolve({ ok: false, installed: adminTaskInstalled, error: e.message }));
  });
}

async function balanceHostMemory({
  targetPct,
  demoteBg,
  aggressive = false,
  elevateAdmin = false,
} = {}) {
  if (process.platform !== 'win32') {
    return { ok: false, error: 'Windows-only feature', timestamp: new Date().toISOString() };
  }
  const clampedTarget = Math.max(
    15,
    Math.min(95, Math.round(Number(targetPct ?? engineConfig.targetMemoryLoadPct) || 30))
  );
  const shouldDemote = demoteBg !== undefined ? Boolean(demoteBg) : engineConfig.demoteBgPriority;

  let rawResult = null;
  let usedTaskElevation = false;

  if (!elevateAdmin && adminTaskInstalled && clampedTarget <= 50) {
    const prevMtime = fs.existsSync(ADMIN_TASK_OUT_FILE)
      ? fs.statSync(ADMIN_TASK_OUT_FILE).mtimeMs
      : 0;
    rawResult = await runAdminBalancerTask(prevMtime);
    if (rawResult && rawResult.ok) {
      usedTaskElevation = true;
    }
  }

  if (!rawResult) {
    const args = ['balance', `--target=${clampedTarget}`, ...collectProtectPidArgs()];
    if (shouldDemote) args.push('--demote-bg');
    if (aggressive) args.push('--aggressive');

    rawResult = elevateAdmin
      ? await runWin32HelperElevated(args)
      : await runWin32Helper(args);
  }

  if (rawResult && rawResult.ok) {
    telemetry.lastBalanceAt = Date.now();
    telemetry.lastBalanceResult = {
      ...rawResult,
      elevated: Boolean(elevateAdmin || usedTaskElevation || rawResult.isAdmin),
      timestamp: new Date().toISOString(),
    };
    telemetry.lastOptimizeResult = telemetry.lastBalanceResult;
    cachedWin32Status = null;
    return telemetry.lastBalanceResult;
  }
  return {
    ok: false,
    error: rawResult?.error || 'Win32 helper unavailable',
    timestamp: new Date().toISOString(),
  };
}

// Background Potato-Proof Auto-Trimmer & Extreme BG App Balancer
setInterval(async () => {
  if (process.platform !== 'win32') return;
  const status = await getHostMemoryStatus(true);
  trackForegroundPid(status?.foregroundPid || 0);
  const load = status?.memory?.memoryLoadPercent || 0;
  const now = Date.now();

  if (engineConfig.bgBalanceEnabled && load > engineConfig.targetMemoryLoadPct) {
    if (now - telemetry.lastBalanceAt >= BG_BALANCE_COOLDOWN_MS) {
      telemetry.lastBalanceAt = now;
      await balanceHostMemory({
        targetPct: engineConfig.targetMemoryLoadPct,
        demoteBg: engineConfig.demoteBgPriority,
        aggressive: false,
      });
      return;
    }
  }

  if (!engineConfig.autoTrimEnabled) return;
  if (now - telemetry.lastAutoTrimAt < 25000) return;

  const budgets = computeBudgets();
  if (load >= budgets.autoTrimThresholdPct) {
    telemetry.lastAutoTrimAt = now;
    await optimizeHostMemory(false);
  }
}, 5000);

// Inspect Windows MemoryCompression & Pagefiles
function inspectWindowsVirtualMemory() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ supported: false });
      return;
    }
    const psCmd = [
      '$mm = try { Get-MMAgent | Select-Object MemoryCompression, PageCombining } catch { $null };',
      '$pf = try { Get-CimInstance Win32_PageFileUsage | Select-Object Name, AllocatedBaseSize, CurrentUsage, PeakUsage } catch { @() };',
      // Only include physical local NTFS/ReFS drives; exclude FUSE-rclone virtual cloud mounts (e.g. Z: / I:)
      '$disks = try { Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 -and $_.FileSystem -in @(\'NTFS\', \'ReFS\') } | Select-Object DeviceID, FreeSpace, Size, FileSystem } catch { @() };',
      '[PSCustomObject]@{ mm = $mm; pagefiles = @($pf); disks = @($disks) } | ConvertTo-Json -Depth 4 -Compress',
    ].join(' ');

    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCmd],
      { timeout: 6000, windowsHide: true },
      (err, stdout) => {
        if (err || !stdout) {
          resolve({ supported: true, error: err?.message || 'Query failed' });
          return;
        }
        try {
          resolve({ supported: true, ...JSON.parse(stdout.trim()) });
        } catch {
          resolve({ supported: true, raw: stdout.trim() });
        }
      }
    );
  });
}

// Launch elevated UAC prompt ONLY when user explicitly triggers Windows Pagefile/Compression setup
function applyWindowsPagefileAndCompression(
  targetDrive = 'C:',
  sizeMB = 16384,
  disableMemoryCompression = false
) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ ok: false, error: 'Windows only' });
      return;
    }
    const cleanDrive = /^[A-Z]:$/i.test(targetDrive) ? targetDrive.toUpperCase() : 'C:';
    const requestedMB = Number(sizeMB) || 16384;

    // Check physical filesystem & free space first before prompting UAC!
    const checkScript = `$d = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${cleanDrive}'"; if (!$d) { 'NOT_FOUND' } else { [PSCustomObject]@{ FileSystem = $d.FileSystem; DriveType = $d.DriveType; FreeMB = [math]::Floor($d.FreeSpace / 1MB) } | ConvertTo-Json -Compress }`;
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', checkScript],
      { timeout: 4000, windowsHide: true },
      (checkErr, checkStdout) => {
        if (!checkErr && checkStdout) {
          try {
            const raw = checkStdout.trim();
            if (raw === 'NOT_FOUND') {
              resolve({ ok: false, error: `Drive ${cleanDrive} not found.` });
              return;
            }
            const info = JSON.parse(raw);
            if (!['NTFS', 'ReFS'].includes(info.FileSystem)) {
              resolve({
                ok: false,
                error: `Drive ${cleanDrive} has filesystem "${info.FileSystem}". Windows pagefile requires a physical local NTFS/ReFS drive (like C: or D:). Cloud/virtual drives (Z: / I:) cannot host pagefile.sys.`,
              });
              return;
            }
            if (requestedMB > info.FreeMB - 1024) {
              resolve({
                ok: false,
                error: `Not enough free space on ${cleanDrive} (${(info.FreeMB / 1024).toFixed(1)} GB free). Cannot allocate a ${(requestedMB / 1024).toFixed(1)} GB pagefile. Please select a smaller size.`,
              });
              return;
            }
          } catch { /* proceed to attempt if check parse fails */ }
        }

        const safeSizeMB = Math.max(4096, Math.min(131072, requestedMB));
        const pagefilePath = `${cleanDrive}\\pagefile.sys`;
        const outFile = path.join(os.tmpdir(), `mram-vm-${process.pid}-${Date.now()}.json`);
        const outEsc = outFile.replace(/'/g, "''");

        const mmCmd = disableMemoryCompression
          ? 'try { Disable-MMAgent -MemoryCompression -ErrorAction SilentlyContinue } catch {}'
          : 'try { Enable-MMAgent -MemoryCompression -ErrorAction SilentlyContinue } catch {}';

        const elevatedScript = [
          mmCmd + ';',
          `$res = @{ ok = $false; error = '' };`,
          `try {`,
          `  $cs = Get-CimInstance Win32_ComputerSystem;`,
          `  if ($cs.AutomaticManagedPagefile) { Set-CimInstance -InputObject $cs -Property @{ AutomaticManagedPagefile = $false } };`,
          `  $existing = Get-CimInstance Win32_PageFileSetting -Filter "Name='${pagefilePath.replace('\\', '\\\\')}'" -ErrorAction SilentlyContinue;`,
          `  if ($existing) { Set-CimInstance -InputObject $existing -Property @{ InitialSize = ${safeSizeMB}; MaximumSize = ${safeSizeMB} } }`,
          `  else { New-CimInstance -ClassName Win32_PageFileSetting -Property @{ Name = '${pagefilePath}'; InitialSize = ${safeSizeMB}; MaximumSize = ${safeSizeMB} } | Out-Null };`,
          `  $res.ok = $true;`,
          `} catch {`,
          `  $res.ok = $false;`,
          `  $res.error = $_.Exception.Message;`,
          `};`,
          `$res | ConvertTo-Json -Compress | Out-File -FilePath '${outEsc}' -Encoding utf8;`,
        ].join(' ');

        const encoded = Buffer.from(elevatedScript, 'utf16le').toString('base64');
        const wrapper = `try { Start-Process powershell.exe -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}' } catch { @{ ok = $false; error = 'UAC elevation was cancelled or denied. Please click \"Yes\" on the Windows prompt.' } | ConvertTo-Json -Compress | Out-File -FilePath '${outEsc}' -Encoding utf8 }`;

        execFile(
          'powershell.exe',
          ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', wrapper],
          { timeout: 35000, windowsHide: true },
          () => {
            let resultData = null;
            try {
              if (fs.existsSync(outFile)) {
                const raw = fs.readFileSync(outFile, 'utf8').replace(/^\uFEFF/, '').trim();
                if (raw) resultData = JSON.parse(raw);
              }
            } catch { /* ignore */ }
            finally {
              try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch { /* ignore */ }
            }

            if (resultData && resultData.ok) {
              resolve({
                ok: true,
                targetDrive: cleanDrive,
                configuredMB: safeSizeMB,
                memoryCompressionDisabled: Boolean(disableMemoryCompression),
                note: disableMemoryCompression
                  ? `Configured ${cleanDrive} pagefile to ${safeSizeMB} MB & disabled MemoryCompression (reboot required so ~1.9 GB compressed store offloads to SSD pagefile).`
                  : `Configured ${cleanDrive} pagefile to ${safeSizeMB} MB.`,
              });
            } else {
              resolve({
                ok: false,
                targetDrive: cleanDrive,
                error: resultData?.error || 'Elevation cancelled or failed. Please click "Yes" when Windows asks for administrator permission.',
              });
            }
          }
        );
      }
    );
  });
}

// ── Multi-Core Zstd Worker Pool ─────────────────────────────────────────────
const WORKER_SCRIPT = path.join(__dirname, 'ram-zstd-worker.mjs');
const zstdWorkers = [];
let workerMsgSeq = 1;
const workerCallbacks = new Map();

function getZstdWorkers() {
  if (!fs.existsSync(WORKER_SCRIPT)) return [];
  const targetCount =
    engineConfig.mode === 'ultra_potato'
      ? 2
      : Math.min(8, Math.max(2, os.cpus().length));
  while (zstdWorkers.length < targetCount) {
    const w = new Worker(WORKER_SCRIPT);
    w.unref();
    w.on('message', (msg) => {
      const cb = workerCallbacks.get(msg.id);
      if (cb) {
        workerCallbacks.delete(msg.id);
        cb(msg);
      }
    });
    zstdWorkers.push(w);
  }
  return zstdWorkers;
}

function runWorkerTask(worker, payload) {
  return new Promise((resolve) => {
    const id = workerMsgSeq++;
    workerCallbacks.set(id, resolve);
    worker.postMessage({ ...payload, id });
  });
}

async function runParallelZstdBench(pageSize = 64 * 1024, pagesPerWorker = 64) {
  const workers = getZstdWorkers();
  if (!workers.length) return null;

  const t0 = process.hrtime.bigint();
  const resList = await Promise.all(
    workers.map((w) => runWorkerTask(w, { op: 'bench', pageSize, count: pagesPerWorker }))
  );
  const wallSec = Number(process.hrtime.bigint() - t0) / 1e9;

  let totalRaw = 0;
  let totalComp = 0;
  let maxCompNs = 0;
  let maxDecompNs = 0;
  for (const r of resList) {
    if (!r?.ok) continue;
    totalRaw += r.rawBytes;
    totalComp += r.compBytes;
    if (r.compNs > maxCompNs) maxCompNs = r.compNs;
    if (r.decompNs > maxDecompNs) maxDecompNs = r.decompNs;
  }
  const mb = totalRaw / (1024 * 1024);
  const compSec = maxCompNs > 0 ? maxCompNs / 1e9 : wallSec;
  const decompSec = maxDecompNs > 0 ? maxDecompNs / 1e9 : wallSec;
  return {
    workers: workers.length,
    totalMB: Number(mb.toFixed(1)),
    parallelCompressMBps: Number((mb / Math.max(0.0001, compSec)).toFixed(1)),
    parallelDecompressMBps: Number((mb / Math.max(0.0001, decompSec)).toFixed(1)),
    ratio: Number((totalRaw / Math.max(1, totalComp)).toFixed(2)),
  };
}

// ── Real Hardware & 4-Tier Engine Benchmark ─────────────────────────────────
async function runRealBenchmark(space) {
  const PAGE_SZ = 64 * 1024; // 64 KB
  const PAGES = 128; // 8 MB real working set
  const TOTAL_BYTES = PAGE_SZ * PAGES;
  const benchRegionId = '__bench_' + Date.now();

  // Run native Win32 Multi-Core DDR Bus benchmark + Shared Memory check in parallel
  const ddrPromise = runWin32Helper(['bench-ddr', '--mb=128']);
  const shmPromise = runWin32Helper(['verify-shm']);
  const parallelZstdPromise = runParallelZstdBench(PAGE_SZ, 64);

  // Build semi-compressible realistic payload (structured patterns + entropy like real app/AI memory)
  const sampleBuf = Buffer.alloc(PAGE_SZ);
  for (let i = 0; i < PAGE_SZ; i += 4) {
    sampleBuf.writeUInt32LE((i * 2654435761) >>> 0, i);
  }
  // Make half structured (like tensors/JSON/UI state) so compression ratio is realistic
  sampleBuf.fill(0x41, 0, PAGE_SZ / 2);

  space.regions.set(benchRegionId, {
    id: benchRegionId,
    name: 'Hardware Benchmark',
    pageSize: PAGE_SZ,
    createdAt: Date.now(),
    lastAccessIdx: -1,
    lastStride: 1,
    pages: new Map(),
  });

  // 1. L1 Write + Read (Real RAM Speed)
  const tW0 = process.hrtime.bigint();
  for (let i = 0; i < PAGES; i++) {
    const copy = Buffer.allocUnsafe(PAGE_SZ);
    sampleBuf.copy(copy);
    await writePage(space, benchRegionId, i, copy);
  }
  const writeSec = Number(process.hrtime.bigint() - tW0) / 1e9;

  const tR0 = process.hrtime.bigint();
  for (let i = 0; i < PAGES; i++) {
    await readPage(space, benchRegionId, i, false);
  }
  const readL1Sec = Number(process.hrtime.bigint() - tR0) / 1e9;

  // 2. L2 Zstd Compression + Decompression Throughput
  const tC0 = process.hrtime.bigint();
  let compBytesTotal = 0;
  const compressedFrames = [];
  for (let i = 0; i < PAGES; i++) {
    const res = compressFast(sampleBuf);
    compressedFrames.push(res);
    compBytesTotal += res.data.length;
  }
  const compressSec = Number(process.hrtime.bigint() - tC0) / 1e9;

  const tD0 = process.hrtime.bigint();
  for (let i = 0; i < PAGES; i++) {
    decompressFast(compressedFrames[i].data, compressedFrames[i].codec);
  }
  const decompressSec = Number(process.hrtime.bigint() - tD0) / 1e9;

  // 3. L3 SSD Swap Write + Sequential Read Throughput
  const benchSwapFile = path.join(space.swapDir, `${benchRegionId}.bench`);
  const payload8MB = Buffer.concat(Array.from({ length: PAGES }, () => sampleBuf));
  const tS0 = process.hrtime.bigint();
  await fs.promises.writeFile(benchSwapFile, payload8MB);
  const ssdWriteSec = Number(process.hrtime.bigint() - tS0) / 1e9;

  const tSR0 = process.hrtime.bigint();
  await fs.promises.readFile(benchSwapFile);
  const ssdReadSec = Number(process.hrtime.bigint() - tSR0) / 1e9;

  // Cleanup benchmark artifacts
  await fs.promises.unlink(benchSwapFile).catch(() => {});
  freeRegion(space, benchRegionId);

  const [ddrBench, shmInfo, zstdParallel] = await Promise.all([
    ddrPromise,
    shmPromise,
    parallelZstdPromise,
  ]);

  const mbTotal = TOTAL_BYTES / (1024 * 1024);
  const result = {
    testedMB: mbTotal,
    codec: hasNativeZstd ? 'zstd-level1' : 'deflate-level1',
    l1WriteMBps: Number((mbTotal / Math.max(0.0001, writeSec)).toFixed(1)),
    l1ReadMBps: Number((mbTotal / Math.max(0.0001, readL1Sec)).toFixed(1)),
    l1AvgLatencyUs: Number(((readL1Sec * 1e6) / PAGES).toFixed(2)),
    l2CompressMBps: Number((mbTotal / Math.max(0.0001, compressSec)).toFixed(1)),
    l2DecompressMBps: Number((mbTotal / Math.max(0.0001, decompressSec)).toFixed(1)),
    l2CompressionRatio: Number((TOTAL_BYTES / Math.max(1, compBytesTotal)).toFixed(2)),
    l2ParallelWorkers: zstdParallel?.workers || 1,
    l2ParallelCompressMBps: zstdParallel?.parallelCompressMBps || Number((mbTotal / Math.max(0.0001, compressSec)).toFixed(1)),
    l2ParallelDecompressMBps: zstdParallel?.parallelDecompressMBps || Number((mbTotal / Math.max(0.0001, decompressSec)).toFixed(1)),
    l3SsdWriteMBps: Number((mbTotal / Math.max(0.0001, ssdWriteSec)).toFixed(1)),
    l3SsdReadMBps: Number((mbTotal / Math.max(0.0001, ssdReadSec)).toFixed(1)),
    ddrReadGBps: ddrBench?.ok ? ddrBench.ddrReadGBps : null,
    ddrCopyGBps: ddrBench?.ok ? ddrBench.ddrCopyGBps : null,
    ddrThreads: ddrBench?.ok ? ddrBench.threads : null,
    ddrPageLatencyNs: ddrBench?.ok ? ddrBench.pageLatencyNs : null,
    shmVerified: Boolean(shmInfo?.ok),
    timestamp: new Date().toISOString(),
  };

  telemetry.lastBenchmark = result;
  return result;
}

function freeRegion(space, regionId) {
  const region = space.regions.get(regionId);
  if (!region) return false;
  for (const [pageIdx, meta] of region.pages.entries()) {
    const key = makePageKey(space.userHash, regionId, pageIdx);
    if (l1Pool.has(key)) {
      const e = l1Pool.get(key);
      l1Pool.delete(key);
      l1UsedBytes = Math.max(0, l1UsedBytes - e.size);
    }
    if (l2Pool.has(key)) {
      const e = l2Pool.get(key);
      l2Pool.delete(key);
      l2UsedBytes = Math.max(0, l2UsedBytes - e.compSize);
    }
    if (meta.swapFile && fs.existsSync(meta.swapFile)) {
      fs.unlink(meta.swapFile, () => {});
    }
    if (meta.tier === 'L4') space.l4VaultBytes = Math.max(0, space.l4VaultBytes - meta.compSize);
    else if (meta.tier === 'L3') space.l3SwapBytes = Math.max(0, space.l3SwapBytes - meta.compSize);
    space.totalCommittedBytes = Math.max(0, space.totalCommittedBytes - meta.rawSize);
  }
  space.regions.delete(regionId);
  scheduleManifestSave(space.userHash);
  return true;
}

// ── Stats Aggregator ────────────────────────────────────────────────────────
async function buildStats(userEmail) {
  const space = getUserSpace(userEmail);
  const budgets = computeBudgets();
  const hostMem = await getHostMemoryStatus();
  const daemonMem = process.memoryUsage();

  let l1Count = 0;
  let l2Count = 0;
  let l3Count = 0;
  let l4Count = 0;
  let userL1Bytes = 0;
  let userL2Bytes = 0;
  let totalPages = 0;

  for (const r of space.regions.values()) {
    for (const p of r.pages.values()) {
      totalPages++;
      if (p.tier === 'L1') { l1Count++; userL1Bytes += p.rawSize; }
      else if (p.tier === 'L2') { l2Count++; userL2Bytes += p.compSize; }
      else if (p.tier === 'L3') l3Count++;
      else if (p.tier === 'L4') l4Count++;
    }
  }

  const totalReads = telemetry.l1Hits + telemetry.l2Hits + telemetry.l3Hits + telemetry.l4Hits;
  const l1HitRatePct = totalReads > 0 ? Number(((telemetry.l1Hits / totalReads) * 100).toFixed(1)) : 100;
  const ramTierHitRatePct = totalReads > 0
    ? Number((((telemetry.l1Hits + telemetry.l2Hits) / totalReads) * 100).toFixed(1))
    : 100;
  const compressionRatio = telemetry.compressedBytesInPool > 0
    ? Number((telemetry.rawBytesBeforeCompress / telemetry.compressedBytesInPool).toFixed(2))
    : 1.0;

  return {
    status: 'online',
    name: 'Master RAM 4-Tier Hybrid Engine',
    version: '2026.11-extreme',
    codec: hasNativeZstd ? 'Zstandard (zstd C++ Native)' : 'Deflate-Fast',
    mode: engineConfig.mode,
    modeLabel: MODE_PROFILES[engineConfig.mode]?.label || engineConfig.mode,
    prefetchEnabled: engineConfig.prefetchEnabled,
    autoTrimEnabled: engineConfig.autoTrimEnabled,
    bgBalanceEnabled: engineConfig.bgBalanceEnabled,
    targetMemoryLoadPct: engineConfig.targetMemoryLoadPct,
    demoteBgPriority: engineConfig.demoteBgPriority,
    adminTaskInstalled,
    cloudVaultEnabled: engineConfig.cloudVaultEnabled,
    win32NativeAvailable: Boolean(getWin32ExePath()),
    user: {
      email: space.email,
      userHash: space.userHash,
      quotaBytes: space.quotaBytes,
      quotaGB: 500,
      committedBytes: space.totalCommittedBytes,
      freeQuotaBytes: Math.max(0, space.quotaBytes - space.totalCommittedBytes),
      regionCount: space.regions.size,
      totalPages,
      tiers: {
        l1HotRamBytes: userL1Bytes,
        l1Pages: l1Count,
        l2CompressedRamBytes: userL2Bytes,
        l2Pages: l2Count,
        l3SsdSwapBytes: space.l3SwapBytes,
        l3Pages: l3Count,
        l4CloudVaultBytes: space.l4VaultBytes,
        l4Pages: l4Count,
      },
    },
    budgets: {
      l1BudgetBytes: budgets.l1BudgetBytes,
      l2BudgetBytes: budgets.l2BudgetBytes,
      l1UsedGlobalBytes: l1UsedBytes,
      l2UsedGlobalBytes: l2UsedBytes,
      maxL3LocalSwapBytes: budgets.maxL3LocalSwapBytes,
      prefetchDepth: budgets.prefetchDepth,
      isLowRamHost: budgets.isLowRamHost,
      swapPath: FAST_SWAP_BASE,
    },
    performance: {
      l1Hits: telemetry.l1Hits,
      l2Hits: telemetry.l2Hits,
      l3Hits: telemetry.l3Hits,
      l4Hits: telemetry.l4Hits,
      misses: telemetry.misses,
      writes: telemetry.writes,
      bytesRead: telemetry.bytesRead,
      bytesWritten: telemetry.bytesWritten,
      l1HitRatePct,
      ramTierHitRatePct,
      compressionRatio,
      prefetchIssued: telemetry.prefetchIssued,
      prefetchHits: telemetry.prefetchHits,
      lastReadLatencyUs: Number(telemetry.lastReadLatencyUs.toFixed(2)),
    },
    host: {
      platform: process.platform,
      arch: process.arch,
      cpuCount: os.cpus().length,
      daemonRssBytes: daemonMem.rss,
      daemonRssMB: Number((daemonMem.rss / (1024 * 1024)).toFixed(1)),
      ...hostMem,
    },
    lastBenchmark: telemetry.lastBenchmark,
    lastOptimizeResult: telemetry.lastOptimizeResult,
    lastBalanceResult: telemetry.lastBalanceResult,
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

// ── HTTP Binary & JSON Helpers ──────────────────────────────────────────────
function readBodyBuffer(req, maxBytes = MAX_PAGE_SIZE + 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJsonBody(req) {
  const buf = await readBodyBuffer(req, 1024 * 1024);
  if (!buf.length) return {};
  return JSON.parse(buf.toString('utf8'));
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

// ── HTTP Server (Port 9060) ─────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Master-User'
  );
  res.setHeader('Access-Control-Expose-Headers', 'X-MasterRam-Tier, X-MasterRam-Latency-Us');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT_RAM}`);
  const userEmail = req.headers['x-master-user'] || url.searchParams.get('user') || getActiveSessionEmail();
  const space = getUserSpace(userEmail);

  try {
    if (url.pathname === '/health') {
      return sendJson(res, 200, { ok: true, engine: 'Master RAM 4-Tier Hybrid Engine', port: PORT_RAM });
    }

    if (url.pathname === '/stats') {
      const stats = await buildStats(userEmail);
      return sendJson(res, 200, stats);
    }

    if (url.pathname === '/api/ram/mode' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (body.mode && MODE_PROFILES[body.mode]) engineConfig.mode = body.mode;
      if (typeof body.prefetchEnabled === 'boolean') engineConfig.prefetchEnabled = body.prefetchEnabled;
      if (typeof body.autoTrimEnabled === 'boolean') engineConfig.autoTrimEnabled = body.autoTrimEnabled;
      if (typeof body.bgBalanceEnabled === 'boolean') engineConfig.bgBalanceEnabled = body.bgBalanceEnabled;
      if (typeof body.demoteBgPriority === 'boolean') engineConfig.demoteBgPriority = body.demoteBgPriority;
      if (body.targetMemoryLoadPct !== undefined && Number.isFinite(Number(body.targetMemoryLoadPct))) {
        engineConfig.targetMemoryLoadPct = Math.max(15, Math.min(95, Math.round(Number(body.targetMemoryLoadPct))));
      }
      if (typeof body.cloudVaultEnabled === 'boolean') engineConfig.cloudVaultEnabled = body.cloudVaultEnabled;
      return sendJson(res, 200, { ok: true, config: engineConfig });
    }

    // Allocate a virtual memory region inside user's 500 GB space
    if (url.pathname === '/api/ram/alloc' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const regionId = String(body.regionId || 'reg_' + crypto.randomBytes(6).toString('hex')).replace(/[^a-zA-Z0-9_-]/g, '_');
      const name = String(body.name || regionId);
      const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(4096, Number(body.pageSize) || DEFAULT_PAGE_SIZE));

      if (!space.regions.has(regionId)) {
        space.regions.set(regionId, {
          id: regionId,
          name,
          pageSize,
          createdAt: Date.now(),
          lastAccessIdx: -1,
          lastStride: 1,
          pages: new Map(),
        });
        scheduleManifestSave(space.userHash);
      }
      return sendJson(res, 200, { ok: true, regionId, name, pageSize, userQuotaGB: 500 });
    }

    // Raw binary page write: PUT /api/ram/page/:regionId/:pageIndex
    const pageMatch = url.pathname.match(/^\/api\/ram\/page\/([^/]+)\/(\d+)$/);
    if (pageMatch && req.method === 'PUT') {
      const regionId = decodeURIComponent(pageMatch[1]);
      const pageIndex = parseInt(pageMatch[2], 10);
      if (!space.regions.has(regionId)) {
        space.regions.set(regionId, {
          id: regionId,
          name: regionId,
          pageSize: DEFAULT_PAGE_SIZE,
          createdAt: Date.now(),
          lastAccessIdx: -1,
          lastStride: 1,
          pages: new Map(),
        });
      }
      const rawBuf = await readBodyBuffer(req);
      const result = await writePage(space, regionId, pageIndex, rawBuf);
      return sendJson(res, 200, { ok: true, regionId, pageIndex, ...result });
    }

    // Raw binary page read: GET /api/ram/page/:regionId/:pageIndex
    if (pageMatch && req.method === 'GET') {
      const regionId = decodeURIComponent(pageMatch[1]);
      const pageIndex = parseInt(pageMatch[2], 10);
      const hit = await readPage(space, regionId, pageIndex, false);
      if (!hit) {
        return sendJson(res, 404, { ok: false, error: 'Page not allocated' });
      }
      const region = space.regions.get(regionId);
      if (region) triggerPredictivePrefetch(space, region, pageIndex);

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': hit.buf.length,
        'X-MasterRam-Tier': hit.tier,
        'X-MasterRam-Latency-Us': hit.latencyUs.toFixed(2),
      });
      res.end(hit.buf);
      return;
    }

    // Free a region: DELETE /api/ram/region/:regionId
    const delMatch = url.pathname.match(/^\/api\/ram\/region\/([^/]+)$/);
    if (delMatch && req.method === 'DELETE') {
      const regionId = decodeURIComponent(delMatch[1]);
      const freed = freeRegion(space, regionId);
      return sendJson(res, 200, { ok: true, freed, regionId });
    }

    // List user regions
    if (url.pathname === '/api/ram/regions' && req.method === 'GET') {
      const list = Array.from(space.regions.values()).map((r) => {
        let bytes = 0;
        for (const p of r.pages.values()) bytes += p.rawSize;
        return {
          id: r.id,
          name: r.name,
          pageSize: r.pageSize,
          pageCount: r.pages.size,
          committedBytes: bytes,
          createdAt: r.createdAt,
        };
      });
      return sendJson(res, 200, { ok: true, regions: list });
    }

    // Trigger Real Win32 Physical RAM Optimization
    if (url.pathname === '/api/ram/optimize' && req.method === 'POST') {
      const body = await readJsonBody(req).catch(() => ({}));
      const resOpt = await optimizeHostMemory(Boolean(body.aggressive));
      return sendJson(res, 200, resOpt);
    }

    // Extreme Background App Balancer (trim idle working sets & demote bg priority toward target %)
    if (url.pathname === '/api/ram/balance' && req.method === 'POST') {
      const body = await readJsonBody(req).catch(() => ({}));
      const resBal = await balanceHostMemory({
        targetPct: body.targetPct,
        demoteBg: body.demoteBg,
        aggressive: Boolean(body.aggressive),
        elevateAdmin: Boolean(body.elevateAdmin),
      });
      return sendJson(res, 200, resBal);
    }

    // Query / Install / Remove Always-On Admin Balancer Task (single UAC setup)
    if (url.pathname === '/api/ram/admin-task' && req.method === 'GET') {
      const status = await refreshAdminTaskStatus();
      return sendJson(res, 200, status);
    }

    if (url.pathname === '/api/ram/admin-task/install' && req.method === 'POST') {
      const body = await readJsonBody(req).catch(() => ({}));
      const resTask = await installAdminBalancerTask(body.targetPct ?? engineConfig.targetMemoryLoadPct);
      return sendJson(res, 200, resTask);
    }

    if (url.pathname === '/api/ram/admin-task/uninstall' && req.method === 'POST') {
      const resTask = await uninstallAdminBalancerTask();
      return sendJson(res, 200, resTask);
    }

    // Inspect Windows Virtual Memory & Pagefile
    if (url.pathname === '/api/ram/windows-vm' && req.method === 'GET') {
      const vm = await inspectWindowsVirtualMemory();
      return sendJson(res, 200, vm);
    }

    // Apply Windows MemoryCompression + SSD Pagefile (prompts UAC cleanly)
    if (url.pathname === '/api/ram/windows-vm/apply' && req.method === 'POST') {
      const body = await readJsonBody(req).catch(() => ({}));
      const result = await applyWindowsPagefileAndCompression(
        body.drive || 'C:',
        body.sizeMB || 16384,
        Boolean(body.disableMemoryCompression)
      );
      return sendJson(res, 200, result);
    }

    // Force flush/demote L1->L2->L3->L4 for memory pressure relief or testing
    if (url.pathname === '/api/ram/demote' && req.method === 'POST') {
      const body = await readJsonBody(req).catch(() => ({}));
      const target = String(body.target || 'L3').toUpperCase();
      // Demote all user's L1 pages to L2
      let demotedL2 = 0;
      let demotedL3 = 0;
      let demotedL4 = 0;
      for (const [k, e] of Array.from(l1Pool.entries())) {
        if (e.userHash !== space.userHash) continue;
        l1Pool.delete(k);
        l1UsedBytes = Math.max(0, l1UsedBytes - e.size);
        const { data, codec } = compressFast(e.buf);
        telemetry.rawBytesBeforeCompress += e.buf.length;
        telemetry.compressedBytesInPool += data.length;
        l2Pool.set(k, {
          userHash: e.userHash,
          regionId: e.regionId,
          pageIndex: e.pageIndex,
          buf: data,
          codec,
          rawSize: e.buf.length,
          compSize: data.length,
          accessedAt: Date.now(),
        });
        l2UsedBytes += data.length;
        const meta = space.regions.get(e.regionId)?.pages.get(e.pageIndex);
        if (meta) { meta.tier = 'L2'; meta.codec = codec; meta.compSize = data.length; }
        demotedL2++;
      }
      if (target === 'L3' || target === 'L4') {
        for (const [k, e] of Array.from(l2Pool.entries())) {
          if (e.userHash !== space.userHash) continue;
          l2Pool.delete(k);
          l2UsedBytes = Math.max(0, l2UsedBytes - e.compSize);
          const reg = space.regions.get(e.regionId);
          const meta = reg?.pages.get(e.pageIndex);
          if (!reg || !meta) continue;
          const swapFile = path.join(space.swapDir, `${reg.id}_p${e.pageIndex}.swap`);
          await fs.promises.writeFile(swapFile, e.buf);
          if (meta.tier === 'L3') space.l3SwapBytes = Math.max(0, space.l3SwapBytes - (meta.compSize || 0));
          if (meta.tier === 'L4') space.l4VaultBytes = Math.max(0, space.l4VaultBytes - (meta.compSize || 0));
          space.l3SwapBytes += e.compSize;
          meta.swapFile = swapFile;
          meta.codec = e.codec;
          meta.compSize = e.compSize;
          meta.rawSize = e.rawSize;
          meta.tier = 'L3';
          demotedL3++;
          if (target === 'L4') {
            await spillL3ToL4(space, reg, meta);
            demotedL4++;
          }
        }
        if (target === 'L4') {
          for (const reg of space.regions.values()) {
            for (const meta of reg.pages.values()) {
              if (meta.tier === 'L3') {
                await spillL3ToL4(space, reg, meta);
                demotedL4++;
              }
            }
          }
        }
        scheduleManifestSave(space.userHash);
      }
      return sendJson(res, 200, { ok: true, target, demotedL2, demotedL3, demotedL4 });
    }

    // Run Real Timed 4-Tier Hardware Speed Benchmark
    if (url.pathname === '/api/ram/benchmark' && req.method === 'POST') {
      const result = await runRealBenchmark(space);
      return sendJson(res, 200, { ok: true, benchmark: result });
    }

    sendJson(res, 404, { ok: false, error: 'Endpoint not found' });
  } catch (err) {
    sendJson(res, 400, { ok: false, error: err.message });
  }
});

// CLI mode: `node scripts/master-ram-engine.mjs --optimize-once`
if (process.argv.includes('--optimize-once')) {
  const aggressive = process.argv.includes('--aggressive');
  optimizeHostMemory(aggressive).then((res) => {
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  });
} else {
  server.listen(PORT_RAM, '127.0.0.1', () => {
    const budgets = computeBudgets();
    console.log(`⚡ Master RAM 4-Tier Hybrid Engine running on http://127.0.0.1:${PORT_RAM}`);
    console.log(`   User Quota: 500 GB Dedicated Virtual RAM | Mode: ${engineConfig.mode}`);
    console.log(`   L1 Slab: ${(budgets.l1BudgetBytes / 1048576).toFixed(1)} MB | L2 Zstd: ${(budgets.l2BudgetBytes / 1048576).toFixed(1)} MB | L3 Swap: ${FAST_SWAP_BASE}`);
    console.log(`   Win32 Native Optimizer: ${getWin32ExePath() ? 'Active' : 'Fallback'}`);
  });
}
