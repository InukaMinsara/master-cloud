#!/usr/bin/env node
/**
 * master-cloud-daemon.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER CLOUD Windows Desktop Companion & Virtual Drive Daemon.
 *
 * Responsibilities:
 * - Supervises the 10 TB Virtual Local Drive (Z: / M:).
 * - Manages LRU eviction cache on D:\MasterCloudCache (protecting C:\ from disk exhaustion).
 * - Exposes health heartbeat and local shell integration IPC.
 * - Handles safe shutdown and journal persistence.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const DRIVE_DIR = 'D:\\MasterCloudDrive';
const CACHE_DIR = 'D:\\MasterCloudCache';
const DRIVE_LETTER = (process.env.MASTER_CLOUD_DRIVE || 'Z').toUpperCase().replace(':', '');
const DAEMON_PORT = parseInt(process.env.DAEMON_PORT, 10) || 8769;

// Ensure storage & cache directories exist on D:
if (!fs.existsSync(DRIVE_DIR)) {
  fs.mkdirSync(DRIVE_DIR, { recursive: true });
}
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

console.log(`[Master Cloud Daemon] Initializing on Drive ${DRIVE_LETTER}: (Storage: ${DRIVE_DIR}, Cache: ${CACHE_DIR})`);

// 1. Start Virtual Local Drive Server if not active
let webdavProcess = null;

function startVirtualDrive() {
  const serverScript = path.join(__dirname, 'webdav-server.mjs');
  console.log(`[Master Cloud Daemon] Spawning Virtual Drive Engine (${serverScript})...`);
  
  webdavProcess = spawn(process.execPath, [serverScript, `--drive=${DRIVE_LETTER}`], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    windowsHide: true,
  });

  webdavProcess.on('exit', (code) => {
    console.warn(`[Master Cloud Daemon] Virtual Drive Engine exited with code ${code}. Restarting in 3s...`);
    setTimeout(startVirtualDrive, 3000);
  });
}

startVirtualDrive();

// 2. LRU Cache Maintenance Loop (every 10 minutes)
function performCacheMaintenance() {
  try {
    if (!fs.existsSync(CACHE_DIR)) return;
    const files = fs.readdirSync(CACHE_DIR);
    let totalCacheBytes = 0;
    const statsList = [];

    for (const file of files) {
      const p = path.join(CACHE_DIR, file);
      try {
        const s = fs.statSync(p);
        totalCacheBytes += s.size;
        statsList.push({ path: p, size: s.size, atime: s.atimeMs });
      } catch { /* ignore */ }
    }

    const MAX_CACHE_BYTES = 20 * 1024 * 1024 * 1024; // 20 GB max cache on D:
    if (totalCacheBytes > MAX_CACHE_BYTES) {
      // Sort oldest accessed first
      statsList.sort((a, b) => a.atime - b.atime);
      let bytesToFree = totalCacheBytes - MAX_CACHE_BYTES;
      for (const item of statsList) {
        if (bytesToFree <= 0) break;
        try {
          fs.unlinkSync(item.path);
          bytesToFree -= item.size;
          console.log(`[Master Cloud Daemon] LRU evicted temporary chunk: ${item.path}`);
        } catch { /* ignore */ }
      }
    }
  } catch (err) {
    console.error('[Master Cloud Daemon] Cache maintenance error:', err);
  }
}

setInterval(performCacheMaintenance, 10 * 60 * 1000);

// 3. Local IPC HTTP Server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/api/daemon/health') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'online',
      version: '2.4.0',
      driveLetter: `${DRIVE_LETTER}:`,
      storageDir: DRIVE_DIR,
      cacheDir: CACHE_DIR,
      uptimeSeconds: Math.floor(process.uptime()),
    }));
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(DAEMON_PORT, '127.0.0.1', () => {
  console.log(`[Master Cloud Daemon] Local IPC Server listening at http://127.0.0.1:${DAEMON_PORT}`);
});

// Clean shutdown handler
process.on('SIGINT', () => {
  console.log('[Master Cloud Daemon] Shutting down cleanly...');
  if (webdavProcess) webdavProcess.kill();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (webdavProcess) webdavProcess.kill();
  server.close();
  process.exit(0);
});
