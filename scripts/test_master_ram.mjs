#!/usr/bin/env node
/**
 * scripts/test_master_ram.mjs
 * End-to-end verification of the Master RAM 4-Tier Hybrid Engine & Native Win32 Helper.
 */

import { spawn, execFileSync } from 'child_process';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_PORT = 9069;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`✅ [PASS] ${msg}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${msg}`);
  }
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function run() {
  console.log('====================================================');
  console.log(' MASTER RAM: 4-TIER & WIN32 VERIFICATION SUITE');
  console.log('====================================================');

  // 1. Direct Win32 native helper test
  if (process.platform === 'win32') {
    const winBin = path.join(__dirname, 'bin', 'master-ram-win32.exe');
    const raw = execFileSync(winBin, ['status'], { encoding: 'utf8' });
    const winStatus = JSON.parse(raw);
    assert(winStatus.ok === true, 'Win32 native helper status returns ok: true');
    assert(winStatus.memory.totalPhysicalBytes > 0, `Win32 detects real physical RAM (${(winStatus.memory.totalPhysicalBytes / 1073741824).toFixed(1)} GB)`);
    assert(winStatus.processCount > 10, `Win32 enumerates live processes (${winStatus.processCount})`);
  }

  // 2. Spawn daemon on isolated test port
  const daemon = spawn(process.execPath, [path.join(__dirname, 'master-ram-engine.mjs')], {
    env: { ...process.env, MASTER_RAM_PORT: String(TEST_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Wait for /health
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(`${BASE_URL}/health`);
      if (r.ok) { ready = true; break; }
    } catch { /* wait */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  assert(ready, `Master RAM Engine HTTP daemon started on port ${TEST_PORT}`);
  if (!ready) {
    daemon.kill();
    process.exit(1);
  }

  try {
    const userA = 'alpha@mastercloud.test';
    const userB = 'beta@mastercloud.test';

    // 3. Stats & 500 GB quota
    const statsRes = await fetch(`${BASE_URL}/stats`, { headers: { 'X-Master-User': userA } });
    const stats = await statsRes.json();
    assert(stats.user.quotaGB === 500, 'User receives 500 GB dedicated Virtual RAM quota');
    assert(stats.user.quotaBytes === 500 * 1024 * 1024 * 1024, 'Quota matches exact 500 GiB bytes');

    // 4. Allocate region & test Tier 1 (L1 Hot RAM)
    const regId = 'test_reg_' + Date.now();
    const allocRes = await fetch(`${BASE_URL}/api/ram/alloc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Master-User': userA },
      body: JSON.stringify({ regionId: regId, name: 'Test Region', pageSize: 65536 }),
    });
    assert((await allocRes.json()).ok === true, 'Region allocated in User A 500 GB namespace');

    const pages = [];
    for (let i = 0; i < 8; i++) {
      const buf = Buffer.alloc(65536, 0x41 + i);
      // Mix structured & dynamic bytes so Zstd achieves clean compression
      for (let j = 0; j < 4096; j += 4) buf.writeUInt32LE((i * 10000 + j) >>> 0, j);
      pages.push(buf);

      const putRes = await fetch(`${BASE_URL}/api/ram/page/${regId}/${i}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream', 'X-Master-User': userA },
        body: buf,
      });
      if (!putRes.ok) throw new Error(`PUT page ${i} failed`);
    }

    // Read page 0 -> should hit L1
    const r0 = await fetch(`${BASE_URL}/api/ram/page/${regId}/0`, {
      headers: { 'X-Master-User': userA },
    });
    const tier0 = r0.headers.get('X-MasterRam-Tier');
    const b0 = Buffer.from(await r0.arrayBuffer());
    assert(tier0 === 'L1', `Page 0 read served directly from Tier 1 (L1), got ${tier0}`);
    assert(sha256(b0) === sha256(pages[0]), 'Page 0 SHA-256 matches byte-for-byte');

    // Isolation check: User B must NOT see User A's region
    const isoRes = await fetch(`${BASE_URL}/api/ram/page/${regId}/0`, {
      headers: { 'X-Master-User': userB },
    });
    assert(isoRes.status === 404, 'Per-user isolation blocks User B from reading User A virtual RAM');

    // 5. Demote to L2 Zstd & verify compression + readback
    const demL2 = await (await fetch(`${BASE_URL}/api/ram/demote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Master-User': userA },
      body: JSON.stringify({ target: 'L2' }),
    })).json();
    assert(demL2.demotedL2 === 8, `Demoted all 8 pages from L1 into L2 Zstd pool (${demL2.demotedL2})`);

    const statsL2 = await (await fetch(`${BASE_URL}/stats`, { headers: { 'X-Master-User': userA } })).json();
    assert(statsL2.user.tiers.l2Pages === 8, 'Stats report 8 pages in L2 Compressed RAM');
    assert(statsL2.performance.compressionRatio > 1.5, `Real Zstd compression ratio > 1.5x (${statsL2.performance.compressionRatio}x)`);

    const r1 = await fetch(`${BASE_URL}/api/ram/page/${regId}/1`, { headers: { 'X-Master-User': userA } });
    const tier1 = r1.headers.get('X-MasterRam-Tier');
    const b1 = Buffer.from(await r1.arrayBuffer());
    assert(tier1 === 'L2', `Page 1 transparently decompressed from Tier 2 (L2), got ${tier1}`);
    assert(sha256(b1) === sha256(pages[1]), 'Page 1 after L2 Zstd decompression matches byte-for-byte');

    // 6. Demote to L3 SSD Swap & verify Predictive Prefetcher
    await fetch(`${BASE_URL}/api/ram/demote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Master-User': userA },
      body: JSON.stringify({ target: 'L3' }),
    });
    const statsL3 = await (await fetch(`${BASE_URL}/stats`, { headers: { 'X-Master-User': userA } })).json();
    assert(statsL3.user.tiers.l3Pages === 8 && statsL3.user.tiers.l3SsdSwapBytes > 0, 'All 8 pages spilled cleanly to L3 Local SSD Swap');

    // Read page 2 -> L3 hit, then read page 3 -> L3 hit + triggers stride prefetch for page 4, 5, 6!
    const r2 = await fetch(`${BASE_URL}/api/ram/page/${regId}/2`, { headers: { 'X-Master-User': userA } });
    assert(r2.headers.get('X-MasterRam-Tier') === 'L3', 'Page 2 fetched from Tier 3 (L3 SSD Swap)');
    const b2 = Buffer.from(await r2.arrayBuffer());
    assert(sha256(b2) === sha256(pages[2]), 'Page 2 from L3 matches byte-for-byte');

    await fetch(`${BASE_URL}/api/ram/page/${regId}/3`, { headers: { 'X-Master-User': userA } });
    // Give async background prefetcher 150ms to hydrate page 4 into L1
    await new Promise((r) => setTimeout(r, 150));
    const r4 = await fetch(`${BASE_URL}/api/ram/page/${regId}/4`, { headers: { 'X-Master-User': userA } });
    const tier4 = r4.headers.get('X-MasterRam-Tier');
    const b4 = Buffer.from(await r4.arrayBuffer());
    assert(tier4 === 'L1', `Predictive Stride Prefetcher pre-loaded Page 4 from L3 straight into L1 (got ${tier4})`);
    assert(sha256(b4) === sha256(pages[4]), 'Prefetched Page 4 matches byte-for-byte');

    // 7. Demote to L4 Cold Vault & read back
    await fetch(`${BASE_URL}/api/ram/demote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Master-User': userA },
      body: JSON.stringify({ target: 'L4' }),
    });
    const statsL4 = await (await fetch(`${BASE_URL}/stats`, { headers: { 'X-Master-User': userA } })).json();
    assert(statsL4.user.tiers.l4Pages === 8 && statsL4.user.tiers.l4CloudVaultBytes > 0, 'All 8 pages stored in Tier 4 Cold Vault');

    const r7 = await fetch(`${BASE_URL}/api/ram/page/${regId}/7`, { headers: { 'X-Master-User': userA } });
    const tier7 = r7.headers.get('X-MasterRam-Tier');
    const b7 = Buffer.from(await r7.arrayBuffer());
    assert(tier7 === 'L4', `Page 7 restored from Tier 4 Cold Vault (got ${tier7})`);
    assert(sha256(b7) === sha256(pages[7]), 'Page 7 from L4 matches byte-for-byte');

    // 8. Real Hardware Speed Benchmark
    const benchRes = await (await fetch(`${BASE_URL}/api/ram/benchmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Master-User': userA },
      body: '{}',
    })).json();
    assert(benchRes.ok && benchRes.benchmark.l1ReadMBps > 0, `Real Benchmark L1 Read: ${benchRes.benchmark?.l1ReadMBps} MB/s`);
    assert(benchRes.benchmark.l2ParallelDecompressMBps > 0, `Multi-Core Zstd (${benchRes.benchmark?.l2ParallelWorkers}T) Decompress: ${benchRes.benchmark?.l2ParallelDecompressMBps} MB/s`);
    assert(benchRes.benchmark.l3SsdReadMBps > 0, `Real Benchmark L3 SSD Read: ${benchRes.benchmark?.l3SsdReadMBps} MB/s`);
    if (process.platform === 'win32') {
      assert(benchRes.benchmark.ddrReadGBps > 0, `Native Multi-Core DDR Bus Read: ${benchRes.benchmark?.ddrReadGBps} GB/s (${benchRes.benchmark?.ddrThreads} threads)`);
      assert(benchRes.benchmark.shmVerified === true, 'Win32 Kernel Shared Memory Section (Local\\MasterRamSharedSlab) verified');
    }

    // 8.5. Extreme Background App Balancer (/api/ram/mode + /api/ram/balance + Win32 balance CLI)
    const modeRes = await (await fetch(`${BASE_URL}/api/ram/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Master-User': userA },
      body: JSON.stringify({ bgBalanceEnabled: true, targetMemoryLoadPct: 30, demoteBgPriority: true }),
    })).json();
    assert(
      modeRes.ok && modeRes.config?.targetMemoryLoadPct === 30 && modeRes.config?.bgBalanceEnabled === true,
      'Balancer config updated via /api/ram/mode (target=30%, bgBalance=true, demote=true)'
    );

    if (process.platform === 'win32') {
      const balRes = await (await fetch(`${BASE_URL}/api/ram/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Master-User': userA },
        body: JSON.stringify({ targetPct: 30, demoteBg: true, aggressive: false }),
      })).json();
      assert(
        balRes.ok &&
          balRes.targetPct === 30 &&
          typeof balRes.targetReached === 'boolean' &&
          typeof balRes.memoryLoadAfter === 'number' &&
          typeof balRes.demotedProcesses === 'number',
        `Extreme BG Balancer ran cleanly (${balRes.memoryLoadBefore}% -> ${balRes.memoryLoadAfter}%, trimmed=${balRes.trimmedProcesses}, demoted=${balRes.demotedProcesses})`
      );

      const statsBal = await (await fetch(`${BASE_URL}/stats`, { headers: { 'X-Master-User': userA } })).json();
      assert(
        statsBal.bgBalanceEnabled === true &&
          statsBal.targetMemoryLoadPct === 30 &&
          typeof statsBal.adminTaskInstalled === 'boolean' &&
          statsBal.lastBalanceResult?.ok === true,
        'Stats reflects Extreme BG Balancer telemetry, adminTaskInstalled, and lastBalanceResult'
      );

      const adminTaskRes = await (await fetch(`${BASE_URL}/api/ram/admin-task`)).json();
      assert(
        adminTaskRes.supported === true && typeof adminTaskRes.installed === 'boolean',
        `Admin Balancer Scheduled Task status endpoint responds (installed=${adminTaskRes.installed})`
      );

      const vmInfoRes = await (await fetch(`${BASE_URL}/api/ram/windows-vm`)).json();
      assert(
        vmInfoRes.supported === true &&
          Array.isArray(vmInfoRes.disks) &&
          vmInfoRes.disks.every((d) => ['NTFS', 'ReFS'].includes(d.FileSystem)),
        'Windows VM endpoint only returns physical NTFS/ReFS disks and excludes cloud mounts (Z:/I:)'
      );

      const applyCloudRes = await (await fetch(`${BASE_URL}/api/ram/windows-vm/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drive: 'Z:', sizeMB: 65536 }),
      })).json();
      assert(
        applyCloudRes.ok === false &&
          String(applyCloudRes.error).toLowerCase().includes('cloud/virtual'),
        'Pagefile setup cleanly blocks invalid cloud/virtual drive Z: with informative error'
      );
    }

    // 9. Free region & verify clean zeroing
    const delRes = await (await fetch(`${BASE_URL}/api/ram/region/${regId}`, {
      method: 'DELETE',
      headers: { 'X-Master-User': userA },
    })).json();
    assert(delRes.ok && delRes.freed === true, 'Region freed across all 4 tiers');

    const statsAfter = await (await fetch(`${BASE_URL}/stats`, { headers: { 'X-Master-User': userA } })).json();
    assert(statsAfter.user.committedBytes === 0, 'Committed bytes returned cleanly to 0 after free');
  } finally {
    daemon.kill();
  }

  console.log('====================================================');
  console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
