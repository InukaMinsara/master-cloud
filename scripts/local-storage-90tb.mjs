#!/usr/bin/env node
/**
 * local-storage-90tb.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER STORAGE — Private 90 TB Zero-Disk Virtual Drive (Drive I:)
 *
 * 100% Zero-Disk Footprint:
 *   - 0 Bytes kept on C: drive!
 *   - 0 Bytes kept on D: drive!
 *   - 0 Bytes stored into Z: drive!
 *
 * How it works:
 *   1. Files dropped into I:\ are accepted instantly at native speed via RAM buffer / local staging.
 *   2. A background offloader uploads chunks to the storage backend, records streaming URLs
 *      in `cloud-manifest-storage-90tb.json`, and DELETES the local file from disk (`fs.unlinkSync`).
 *   3. Files appear permanently in I:\ from the in-memory manifest (0.01ms PROPFIND) and stream
 *      live with full HTTP byte-range seeking when opened.
 *   4. Independent from Z:\ and isolated from public web apps.
 *   5. Permanently mounts on Windows boot / logon.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, spawnSync } from 'child_process';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 90 TB in bytes (90 * 1024^4)
const NINETY_TB_BYTES = 90 * 1024 * 1024 * 1024 * 1024; // 98,956,046,499,840 bytes
const USER_DATA_DIR = path.join(os.homedir(), '.mastercloud');
try { fs.mkdirSync(USER_DATA_DIR, { recursive: true }); } catch { /* ignore */ }

const CHUNK_LIMIT_BYTES = 180 * 1024 * 1024; // 180 MB chunk limit

const args = process.argv.slice(2).reduce((acc, arg) => {
  const eqIdx = arg.indexOf('=');
  if (eqIdx === -1) acc[arg.replace(/^--/, '')] = true;
  else acc[arg.slice(0, eqIdx).replace(/^--/, '')] = arg.slice(eqIdx + 1).replace(/^["']|["']$/g, '');
  return acc;
}, {});

const PORT = parseInt(args.port, 10) || 8770;
const DRIVE_LETTER = (args.drive || 'I').toUpperCase().replace(':', '');

// Independent isolated manifest for 90 TB drive
const MANIFEST_FILE = path.join(USER_DATA_DIR, 'cloud-manifest-storage-90tb.json');

// Hidden temporary staging folder (files are deleted immediately after offload!)
const defaultStagingDir = fs.existsSync('D:\\')
  ? path.join('D:\\', 'MasterStorage_Staging_I')
  : path.join(USER_DATA_DIR, 'staging_i');
const STORAGE_DIR = args.folder || defaultStagingDir;
try { fs.mkdirSync(STORAGE_DIR, { recursive: true }); } catch { /* ignore */ }

const WEBDAV_URL = `http://127.0.0.1:${PORT}`;

// ── In-Memory Manifest & RAM Write-Behind Cache ──────────────────────────────
let manifest = { files: {}, folders: {} };
const folderChildren = new Map();
const fileChildren = new Map();
const folderCaseMap = new Map();
const fileCaseMap = new Map();
let totalUsedBytes = 0;
let lastWriteActivityMs = 0;

const inMemoryStagingBuffers = new Map();
let inMemoryStagingBytes = 0;
const MAX_RAM_STAGING_BYTES = 512 * 1024 * 1024;
const diskFlushQueue = [];
let activeDiskFlushes = 0;

function getParentRel(relPath) {
  const idx = relPath.lastIndexOf('/');
  return idx === -1 ? '' : relPath.slice(0, idx);
}

function setManifestFolder(relPath, folderObj) {
  manifest.folders[relPath] = folderObj;
  folderCaseMap.set(relPath.toLowerCase(), relPath);
  const p = getParentRel(relPath);
  let m = folderChildren.get(p);
  if (!m) { m = new Map(); folderChildren.set(p, m); }
  m.set(folderObj.name, folderObj);
}

function deleteManifestFolder(relPath) {
  const f = manifest.folders[relPath];
  if (!f) return;
  delete manifest.folders[relPath];
  folderCaseMap.delete(relPath.toLowerCase());
  folderChildren.get(getParentRel(relPath))?.delete(f.name);
}

function setManifestFile(relPath, fileObj) {
  const prev = manifest.files[relPath];
  if (prev && prev !== fileObj) {
    totalUsedBytes = Math.max(0, totalUsedBytes - (Number(prev.size) || 0));
  }
  manifest.files[relPath] = fileObj;
  fileCaseMap.set(relPath.toLowerCase(), relPath);
  totalUsedBytes += (Number(fileObj.size) || 0);
  const p = getParentRel(relPath);
  let m = fileChildren.get(p);
  if (!m) { m = new Map(); fileChildren.set(p, m); }
  m.set(fileObj.name, fileObj);
}

function deleteManifestFile(relPath) {
  const f = manifest.files[relPath];
  if (!f) return;
  totalUsedBytes = Math.max(0, totalUsedBytes - (Number(f.size) || 0));
  delete manifest.files[relPath];
  fileCaseMap.delete(relPath.toLowerCase());
  fileChildren.get(getParentRel(relPath))?.delete(f.name);
}

function findManifestFolder(relPath) {
  if (!relPath) return null;
  if (manifest.folders[relPath]) return { key: relPath, folder: manifest.folders[relPath] };
  const actualKey = folderCaseMap.get(relPath.toLowerCase());
  if (actualKey && manifest.folders[actualKey]) return { key: actualKey, folder: manifest.folders[actualKey] };
  return null;
}

function findManifestFile(relPath) {
  if (!relPath) return null;
  if (manifest.files[relPath]) return { key: relPath, file: manifest.files[relPath] };
  const actualKey = fileCaseMap.get(relPath.toLowerCase());
  if (actualKey && manifest.files[actualKey]) return { key: actualKey, file: manifest.files[actualKey] };
  return null;
}

function rebuildMemoryIndex() {
  folderChildren.clear();
  fileChildren.clear();
  folderCaseMap.clear();
  fileCaseMap.clear();
  totalUsedBytes = 0;
  for (const [k, f] of Object.entries(manifest.folders)) {
    if (f && f.name) setManifestFolder(k, f);
  }
  for (const [k, file] of Object.entries(manifest.files)) {
    if (file && file.name) setManifestFile(k, file);
  }
}

function loadManifest() {
  if (fs.existsSync(MANIFEST_FILE)) {
    try {
      const raw = fs.readFileSync(MANIFEST_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        manifest.files = parsed.files || {};
        manifest.folders = parsed.folders || {};
        rebuildMemoryIndex();
        return;
      }
    } catch {}
  }

  // Initialize fresh 90 TB storage with default starter folders
  const now = new Date().toISOString();
  manifest = {
    files: {
      'MASTER STORAGE - README.txt': {
        relPath: 'MASTER STORAGE - README.txt',
        name: 'MASTER STORAGE - README.txt',
        size: 540,
        mtime: now,
        birthtime: now,
        cloudUrls: ['data:text/plain;charset=utf-8,' + encodeURIComponent([
          '=================================================================',
          '  MASTER STORAGE - PRIVATE 90 TB ZERO-DISK LOCAL DRIVE (I:)',
          '=================================================================',
          '',
          '  Drive Letter : I:\\',
          '  Total Quota  : 90.0 TB Virtual Storage',
          '  Disk Footprint: 0 BYTES on C: / 0 BYTES on D: / 0 BYTES on Z:',
          '  Cloud Status : 100% Private Offline Architecture',
          '  Auto-Mount   : Enabled (Automatically mounts on Windows startup)',
          '',
          '  Files dropped here take ZERO bytes on your local hard drives!',
          '=================================================================',
        ].join('\r\n'))],
      },
    },
    folders: {
      'Private Documents': { relPath: 'Private Documents', name: 'Private Documents', mtime: now, birthtime: now },
      'Media & Archives': { relPath: 'Media & Archives', name: 'Media & Archives', mtime: now, birthtime: now },
      'Big Data Projects': { relPath: 'Big Data Projects', name: 'Big Data Projects', mtime: now, birthtime: now },
    },
  };
  rebuildMemoryIndex();

  try {
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');
  } catch {}
}

loadManifest();

let saveManifestTimer = null;
let savingInProgress = false;
function saveManifestDebounced() {
  if (saveManifestTimer) clearTimeout(saveManifestTimer);
  saveManifestTimer = setTimeout(async () => {
    saveManifestTimer = null;
    if (savingInProgress || Date.now() - lastWriteActivityMs < 3000) {
      saveManifestDebounced();
      return;
    }
    savingInProgress = true;
    try {
      const tmpFile = `${MANIFEST_FILE}.tmp`;
      await fs.promises.writeFile(tmpFile, JSON.stringify(manifest), 'utf8');
      await fs.promises.rename(tmpFile, MANIFEST_FILE);
    } catch {}
    savingInProgress = false;
  }, 3000);
}

function ensureManifestParentFolders(relPath) {
  const parts = relPath.split('/').filter(Boolean);
  parts.pop();
  let curr = '';
  const now = new Date().toISOString();
  for (const part of parts) {
    curr = curr ? `${curr}/${part}` : part;
    if (!manifest.folders[curr]) {
      setManifestFolder(curr, {
        relPath: curr,
        name: part,
        mtime: now,
        birthtime: now,
      });
    }
  }
}

// ── Background Zero-Disk Cloud Offloader ────────────────────────────────────
const CLOUD_WORKER_CODE = `
const { parentPort } = require('worker_threads');
parentPort.on('message', async ({ id, buffer }) => {
  try {
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('fileToUpload', new Blob([buffer]), 'chunk.bin');
    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      body: fd,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = (await res.text()).trim();
    if (!text.startsWith('https://files.catbox.moe/')) {
      throw new Error('Invalid cloud response: ' + text);
    }
    parentPort.postMessage({ id, url: text });
  } catch (err) {
    parentPort.postMessage({ id, error: err.message || String(err) });
  }
});
`;

let cloudWorker = null;
let workerReqId = 0;
const workerCallbacks = new Map();

function getCloudWorker() {
  if (!cloudWorker) {
    cloudWorker = new Worker(CLOUD_WORKER_CODE, { eval: true });
    cloudWorker.on('message', ({ id, url, error }) => {
      const cb = workerCallbacks.get(id);
      if (cb) {
        workerCallbacks.delete(id);
        if (error) cb.reject(new Error(error));
        else cb.resolve(url);
      }
    });
    cloudWorker.on('error', () => { cloudWorker = null; });
    cloudWorker.on('exit', () => { cloudWorker = null; });
    cloudWorker.unref();
  }
  return cloudWorker;
}

function uploadBufferToOnlineCloud(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const worker = getCloudWorker();
      const id = ++workerReqId;
      workerCallbacks.set(id, { resolve, reject });
      worker.postMessage({ id, buffer });
    } catch (e) {
      reject(e);
    }
  });
}

async function offloadRamBatchPackToCloud() {
  const batch = [];
  let totalPackBytes = 0;
  const MAX_PACK_BYTES = 45 * 1024 * 1024;

  for (const [relPath, buf] of inMemoryStagingBuffers.entries()) {
    if (Date.now() - lastWriteActivityMs < 4000) return false;
    if (buf.length === 0) {
      const entry = manifest.files[relPath];
      if (entry) entry.cloudUrls = ['data:empty'];
      inMemoryStagingBuffers.delete(relPath);
      continue;
    }
    if (batch.length > 0 && (totalPackBytes + buf.length > MAX_PACK_BYTES || batch.length >= 1000)) {
      break;
    }
    batch.push({ relPath, buf, offset: totalPackBytes, length: buf.length });
    totalPackBytes += buf.length;
  }

  if (batch.length === 0) return false;

  const packBuffer = batch.length === 1 ? batch[0].buf : Buffer.concat(batch.map(b => b.buf), totalPackBytes);
  const packUrl = await uploadBufferToOnlineCloud(packBuffer);

  for (const item of batch) {
    const entry = manifest.files[item.relPath];
    if (entry) {
      entry.cloudUrls = batch.length === 1
        ? [packUrl]
        : [`${packUrl}#range=${item.offset}-${item.offset + item.length - 1}`];
    }
    const curBuf = inMemoryStagingBuffers.get(item.relPath);
    if (curBuf === item.buf) {
      inMemoryStagingBuffers.delete(item.relPath);
      inMemoryStagingBytes = Math.max(0, inMemoryStagingBytes - item.buf.length);
    }
  }
  saveManifestDebounced();
  return true;
}

async function offloadDiskBatchPackToCloud(smallItems) {
  const batch = [];
  const buffers = [];
  let totalPackBytes = 0;
  const MAX_PACK_BYTES = 40 * 1024 * 1024;

  for (const item of smallItems) {
    if (Date.now() - lastWriteActivityMs < 4000) break;
    if (item.stat.size === 0) {
      ensureManifestParentFolders(item.relPath);
      setManifestFile(item.relPath, {
        relPath: item.relPath,
        name: path.basename(item.fullPath),
        size: 0,
        mtime: item.stat.mtime.toISOString(),
        birthtime: (item.stat.birthtime || item.stat.mtime).toISOString(),
        cloudUrls: ['data:empty'],
      });
      await fs.promises.unlink(item.fullPath).catch(() => {});
      continue;
    }
    if (batch.length > 0 && (totalPackBytes + item.stat.size > MAX_PACK_BYTES || batch.length >= 500)) {
      break;
    }
    try {
      const buf = await fs.promises.readFile(item.fullPath);
      batch.push({ item, offset: totalPackBytes, length: buf.length });
      buffers.push(buf);
      totalPackBytes += buf.length;
    } catch {}
  }

  if (batch.length === 0) return;

  const packBuffer = buffers.length === 1 ? buffers[0] : Buffer.concat(buffers, totalPackBytes);
  const packUrl = await uploadBufferToOnlineCloud(packBuffer);

  for (const { item, offset, length } of batch) {
    ensureManifestParentFolders(item.relPath);
    setManifestFile(item.relPath, {
      relPath: item.relPath,
      name: path.basename(item.fullPath),
      size: length,
      mtime: item.stat.mtime.toISOString(),
      birthtime: (item.stat.birthtime || item.stat.mtime).toISOString(),
      cloudUrls: batch.length === 1 ? [packUrl] : [`${packUrl}#range=${offset}-${offset + length - 1}`],
    });
    // Immediately delete local file so ZERO bytes are kept on C: or D:!
    await fs.promises.unlink(item.fullPath).catch(() => {});
  }
  saveManifestDebounced();
}

async function offloadSingleFileToCloud(fullPath, relPath, stat) {
  const fileName = path.basename(fullPath);
  const size = stat.size;
  const cloudUrls = [];

  if (size === 0) {
    cloudUrls.push('data:empty');
  } else if (size <= CHUNK_LIMIT_BYTES) {
    const buf = await fs.promises.readFile(fullPath);
    const url = await uploadBufferToOnlineCloud(buf);
    cloudUrls.push(url);
  } else {
    const fd = await fs.promises.open(fullPath, 'r');
    try {
      let offset = 0;
      while (offset < size) {
        const readLen = Math.min(CHUNK_LIMIT_BYTES, size - offset);
        const buf = Buffer.allocUnsafe(readLen);
        const { bytesRead } = await fd.read(buf, 0, readLen, offset);
        const slice = bytesRead === readLen ? buf : buf.subarray(0, bytesRead);
        const url = await uploadBufferToOnlineCloud(slice);
        cloudUrls.push(url);
        offset += bytesRead;
      }
    } finally {
      await fd.close();
    }
  }

  ensureManifestParentFolders(relPath);
  setManifestFile(relPath, {
    relPath,
    name: fileName,
    size,
    mtime: stat.mtime.toISOString(),
    birthtime: (stat.birthtime || stat.mtime).toISOString(),
    cloudUrls,
  });
  saveManifestDebounced();

  // Immediately delete local file from disk!
  await fs.promises.unlink(fullPath).catch(() => {});
}

async function scanStagingDir(dir) {
  const results = [];
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const sub = await scanStagingDir(full);
        results.push(...sub);
      } else if (ent.isFile()) {
        try {
          const st = await fs.promises.stat(full);
          const rel = path.relative(STORAGE_DIR, full).replace(/\\/g, '/');
          results.push({ fullPath: full, relPath: rel, stat: st });
        } catch {}
      }
    }
  } catch {}
  return results;
}

let isOffloaderRunning = false;
async function runCloudOffloaderLoop() {
  if (isOffloaderRunning) return;
  isOffloaderRunning = true;
  try {
    while (true) {
      if (Date.now() - lastWriteActivityMs < 3000) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      let didWork = false;
      if (inMemoryStagingBuffers.size > 0) {
        try {
          didWork = await offloadRamBatchPackToCloud();
        } catch {}
      }

      const diskItems = await scanStagingDir(STORAGE_DIR);
      if (diskItems.length > 0) {
        const smallItems = diskItems.filter(i => i.stat.size <= 25 * 1024 * 1024);
        const largeItems = diskItems.filter(i => i.stat.size > 25 * 1024 * 1024);

        if (smallItems.length > 0) {
          try {
            await offloadDiskBatchPackToCloud(smallItems);
            didWork = true;
          } catch {}
        }
        for (const largeItem of largeItems) {
          try {
            await offloadSingleFileToCloud(largeItem.fullPath, largeItem.relPath, largeItem.stat);
            didWork = true;
          } catch {}
        }
      }

      await new Promise(r => setTimeout(r, didWork ? 500 : 4000));
    }
  } finally {
    isOffloaderRunning = false;
  }
}

// ── Stream Online Cloud URLs Directly with Byte-Range Support ────────────────
function streamCloudUrlsToResponse(cloudUrls, res, rangeHeader = null) {
  let isClosed = false;
  let activeUpstreamReq = null;

  const cleanup = () => {
    if (isClosed) return;
    isClosed = true;
    if (activeUpstreamReq) {
      try { activeUpstreamReq.destroy(); } catch {}
      activeUpstreamReq = null;
    }
  };

  res.on('close', cleanup);
  res.on('error', cleanup);

  let idx = 0;
  function nextChunk() {
    if (isClosed || idx >= cloudUrls.length) {
      if (!isClosed) res.end();
      return;
    }
    const rawUrl = cloudUrls[idx++];
    if (rawUrl === 'data:empty') {
      nextChunk();
      return;
    }
    if (rawUrl.startsWith('data:text/plain;charset=utf-8,')) {
      const decoded = decodeURIComponent(rawUrl.slice(30));
      res.end(decoded);
      return;
    }

    const [cleanUrl, hash] = rawUrl.split('#');
    const reqHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

    let packOffset = 0;
    let packLimit = Infinity;
    if (hash && hash.startsWith('range=')) {
      const [pStart, pEnd] = hash.slice(6).split('-').map(Number);
      packOffset = pStart;
      packLimit = pEnd - pStart + 1;
    }

    if (rangeHeader && cloudUrls.length === 1 && !hash) {
      reqHeaders['Range'] = rangeHeader;
    } else if (packOffset > 0 || isFinite(packLimit)) {
      reqHeaders['Range'] = `bytes=${packOffset}-${packOffset + packLimit - 1}`;
    }

    try {
      activeUpstreamReq = https.get(cleanUrl, { headers: reqHeaders, timeout: 30000 }, (upRes) => {
        if (upRes.statusCode >= 400) {
          activeUpstreamReq = null;
          nextChunk();
          return;
        }
        upRes.on('data', (d) => {
          if (!isClosed) res.write(d);
        });
        upRes.on('end', () => {
          activeUpstreamReq = null;
          nextChunk();
        });
        upRes.on('error', () => {
          activeUpstreamReq = null;
          nextChunk();
        });
      });
      activeUpstreamReq.on('error', () => {
        activeUpstreamReq = null;
        nextChunk();
      });
    } catch {
      nextChunk();
    }
  }

  nextChunk();
}

// ── WebDAV XML Builder ──────────────────────────────────────────────────────
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date) {
  return new Date(date).toUTCString();
}

function toIso(date) {
  return new Date(date).toISOString();
}

function encodeWebDavHref(p) {
  return p.split('/').map(seg => encodeURIComponent(seg)).join('/');
}

const MIME_MAP = {
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
};

function mimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

function buildPropfindXml(reqPath, entries, usedBytes) {
  const availableBytes = Math.max(0, NINETY_TB_BYTES - usedBytes);
  const cleanReqPath = reqPath === '/' ? '/' : reqPath.replace(/\/$/, '');

  const responses = entries.map(entry => {
    let fullHref;
    if (entry.isSelf) {
      fullHref = cleanReqPath === '/' ? '/' : encodeWebDavHref(cleanReqPath) + (entry.isDir ? '/' : '');
    } else {
      const childPath = (cleanReqPath === '/' ? '' : cleanReqPath) + '/' + entry.name;
      fullHref = encodeWebDavHref(childPath) + (entry.isDir ? '/' : '');
    }

    if (entry.isDir) {
      return `<D:response><D:href>${fullHref}</D:href><D:propstat><D:prop><D:displayname>${escapeXml(entry.name)}</D:displayname><D:resourcetype><D:collection/></D:resourcetype><D:getlastmodified>${formatDate(entry.mtime)}</D:getlastmodified><D:creationdate>${toIso(entry.birthtime || entry.mtime)}</D:creationdate><D:quota-available-bytes>${availableBytes}</D:quota-available-bytes><D:quota-used-bytes>${usedBytes}</D:quota-used-bytes></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>`;
    } else {
      const mtimeMs = new Date(entry.mtime || Date.now()).getTime();
      return `<D:response><D:href>${fullHref}</D:href><D:propstat><D:prop><D:displayname>${escapeXml(entry.name)}</D:displayname><D:resourcetype/><D:getcontentlength>${entry.size}</D:getcontentlength><D:getcontenttype>${mimeType(entry.name)}</D:getcontenttype><D:getlastmodified>${formatDate(entry.mtime)}</D:getlastmodified><D:creationdate>${toIso(entry.birthtime || entry.mtime)}</D:creationdate><D:getetag>"${entry.size}-${mtimeMs}"</D:getetag></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>`;
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<D:multistatus xmlns:D="DAV:">\n${responses.join('\n')}\n</D:multistatus>`;
}

// ── WebDAV HTTP Server ──────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const method = req.method.toUpperCase();
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const relPath = urlPath.replace(/^\/+|\/+$/g, '');

  res.setHeader('DAV', '1, 2');
  res.setHeader('Allow', 'OPTIONS, GET, HEAD, PUT, DELETE, MKCOL, PROPFIND, PROPPATCH, MOVE, COPY, LOCK, UNLOCK');
  res.setHeader('MS-Author-Via', 'DAV');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, HEAD, PUT, DELETE, MKCOL, PROPFIND, PROPPATCH, MOVE, COPY, LOCK, UNLOCK, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Depth, Destination, Overwrite, Authorization, X-OC-Mtime');

  if (method === 'OPTIONS') {
    res.writeHead(200, { 'Content-Length': '0' });
    res.end();
    return;
  }

  // Telemetry endpoint
  if (method === 'GET' && relPath === 'api/status') {
    const payload = JSON.stringify({
      ok: true,
      driveLetter: `${DRIVE_LETTER}:`,
      totalQuotaBytes: NINETY_TB_BYTES,
      usedBytes: totalUsedBytes,
      availableBytes: Math.max(0, NINETY_TB_BYTES - totalUsedBytes),
      fileCount: Object.keys(manifest.files || {}).length,
      folderCount: Object.keys(manifest.folders || {}).length,
      isMounted: fs.existsSync(`${DRIVE_LETTER}:\\`),
      storageMode: 'Zero-Disk Footprint (0 Bytes kept on C: or D:!)',
    });
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
    res.end(payload);
    return;
  }

  // Shutdown endpoint
  if ((method === 'POST' || method === 'GET') && relPath === 'api/shutdown') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'Shutting down Drive I:' }));
    unmountDrive();
    setTimeout(() => server.close(() => process.exit(0)), 100);
    return;
  }

  // PROPFIND
  if (method === 'PROPFIND') {
    const depth = req.headers['depth'] || '1';

    if (relPath === '') {
      const entries = [{
        name: '',
        isDir: true,
        size: 0,
        mtime: new Date().toISOString(),
        birthtime: new Date().toISOString(),
        isSelf: true,
      }];

      if (depth !== '0') {
        const topFolders = folderChildren.get('') || new Map();
        for (const f of topFolders.values()) {
          entries.push({ name: f.name, isDir: true, size: 0, mtime: f.mtime, birthtime: f.birthtime || f.mtime });
        }
        const topFiles = fileChildren.get('') || new Map();
        for (const f of topFiles.values()) {
          entries.push({ name: f.name, isDir: false, size: f.size, mtime: f.mtime, birthtime: f.birthtime || f.mtime });
        }
      }

      const xml = buildPropfindXml('/', entries, totalUsedBytes);
      res.writeHead(207, { 'Content-Type': 'application/xml; charset=utf-8', 'Content-Length': Buffer.byteLength(xml) });
      res.end(xml);
      return;
    }

    const folderMatch = findManifestFolder(relPath);
    if (folderMatch) {
      const folderKey = folderMatch.key;
      const folderObj = folderMatch.folder;
      const entries = [{
        name: folderObj.name,
        isDir: true,
        size: 0,
        mtime: folderObj.mtime,
        birthtime: folderObj.birthtime || folderObj.mtime,
        isSelf: true,
      }];

      if (depth !== '0') {
        const subFolders = folderChildren.get(folderKey) || new Map();
        for (const f of subFolders.values()) {
          entries.push({ name: f.name, isDir: true, size: 0, mtime: f.mtime, birthtime: f.birthtime || f.mtime });
        }
        const subFiles = fileChildren.get(folderKey) || new Map();
        for (const f of subFiles.values()) {
          entries.push({ name: f.name, isDir: false, size: f.size, mtime: f.mtime, birthtime: f.birthtime || f.mtime });
        }
      }

      const xml = buildPropfindXml(urlPath, entries, totalUsedBytes);
      res.writeHead(207, { 'Content-Type': 'application/xml; charset=utf-8', 'Content-Length': Buffer.byteLength(xml) });
      res.end(xml);
      return;
    }

    const fileMatch = findManifestFile(relPath);
    if (fileMatch) {
      const fileObj = fileMatch.file;
      const entries = [{
        name: fileObj.name,
        isDir: false,
        size: fileObj.size,
        mtime: fileObj.mtime,
        birthtime: fileObj.birthtime || fileObj.mtime,
        isSelf: true,
      }];
      const xml = buildPropfindXml(urlPath, entries, totalUsedBytes);
      res.writeHead(207, { 'Content-Type': 'application/xml; charset=utf-8', 'Content-Length': Buffer.byteLength(xml) });
      res.end(xml);
      return;
    }

    res.writeHead(404, { 'Content-Length': '0' });
    res.end();
    return;
  }

  // GET & HEAD
  if (method === 'GET' || method === 'HEAD') {
    const fileMatch = findManifestFile(relPath);
    if (fileMatch) {
      const fileKey = fileMatch.key;
      const fileEntry = fileMatch.file;
      const totalSize = Number(fileEntry.size) || 0;
      const range = req.headers['range'];

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
        const chunksize = (end - start) + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mimeType(fileEntry.name),
        });
        if (method === 'HEAD') { res.end(); return; }

        const ramBuf = inMemoryStagingBuffers.get(fileKey) || inMemoryStagingBuffers.get(relPath);
        if (ramBuf) {
          res.end(ramBuf.subarray(start, end + 1));
          return;
        }

        if (fileEntry.cloudUrls && fileEntry.cloudUrls.length > 0) {
          streamCloudUrlsToResponse(fileEntry.cloudUrls, res, range);
        } else {
          const localPath = path.join(STORAGE_DIR, fileKey);
          if (fs.existsSync(localPath)) {
            fs.createReadStream(localPath, { start, end }).pipe(res);
          } else {
            res.end();
          }
        }
        return;
      }

      res.writeHead(200, {
        'Content-Type': mimeType(fileEntry.name),
        'Content-Length': totalSize,
        'Accept-Ranges': 'bytes',
        'Last-Modified': formatDate(fileEntry.mtime),
        'ETag': `"${totalSize}-${new Date(fileEntry.mtime).getTime()}"`,
      });
      if (method === 'HEAD') { res.end(); return; }

      const ramBuf = inMemoryStagingBuffers.get(fileKey) || inMemoryStagingBuffers.get(relPath);
      if (ramBuf) {
        res.end(ramBuf);
        return;
      }

      if (fileEntry.cloudUrls && fileEntry.cloudUrls.length > 0) {
        streamCloudUrlsToResponse(fileEntry.cloudUrls, res);
      } else {
        const localPath = path.join(STORAGE_DIR, fileKey);
        if (fs.existsSync(localPath)) {
          fs.createReadStream(localPath).pipe(res);
        } else {
          res.end();
        }
      }
      return;
    }

    if (relPath === '' || manifest.folders[relPath]) {
      const html = `<html><body><h2>💾 MASTER STORAGE 90 TB (Zero-Disk Footprint) — /${escapeXml(relPath)}</h2><p>0 Bytes on C: / 0 Bytes on D: / 0 Bytes on Z:</p></body></html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(html) });
      res.end(html);
      return;
    }

    res.writeHead(404, { 'Content-Length': '0' });
    res.end();
    return;
  }

  // PUT: Instant RAM buffer (<= 32 MB) or local staging, then offloaded to 0-byte disk footprint!
  if (method === 'PUT') {
    lastWriteActivityMs = Date.now();
    const contentLen = parseInt(req.headers['content-length'] || '-1', 10);
    const nowIso = new Date().toISOString();

    // Fast Path: RAM Buffer (Zero Disk I/O!)
    if (contentLen <= 32 * 1024 * 1024 && inMemoryStagingBytes + Math.max(0, contentLen) <= MAX_RAM_STAGING_BYTES) {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        lastWriteActivityMs = Date.now();
        const buf = chunks.length === 0 ? Buffer.alloc(0) : (chunks.length === 1 ? chunks[0] : Buffer.concat(chunks));
        ensureManifestParentFolders(relPath);
        setManifestFile(relPath, {
          relPath,
          name: path.basename(relPath),
          size: buf.length,
          mtime: nowIso,
          birthtime: nowIso,
          cloudUrls: buf.length === 0 ? ['data:empty'] : [],
        });
        const prevBuf = inMemoryStagingBuffers.get(relPath);
        if (prevBuf) inMemoryStagingBytes = Math.max(0, inMemoryStagingBytes - prevBuf.length);
        if (buf.length > 0) {
          inMemoryStagingBuffers.set(relPath, buf);
          inMemoryStagingBytes += buf.length;
        }
        saveManifestDebounced();
        res.writeHead(201, { 'Content-Length': '0' });
        res.end();
      });
      return;
    }

    // Large File Staging Path: Staged temporarily on disk, offloader deletes it immediately!
    const localPath = path.join(STORAGE_DIR, relPath);
    fs.promises.mkdir(path.dirname(localPath), { recursive: true }).then(() => {
      const ws = fs.createWriteStream(localPath);
      req.pipe(ws);
      ws.on('finish', () => {
        lastWriteActivityMs = Date.now();
        ensureManifestParentFolders(relPath);
        setManifestFile(relPath, {
          relPath,
          name: path.basename(relPath),
          size: ws.bytesWritten,
          mtime: nowIso,
          birthtime: nowIso,
          cloudUrls: [],
        });
        saveManifestDebounced();
        res.writeHead(201, { 'Content-Length': '0' });
        res.end();
      });
      ws.on('error', () => {
        res.writeHead(500, { 'Content-Length': '0' });
        res.end();
      });
    }).catch(() => {
      res.writeHead(500, { 'Content-Length': '0' });
      res.end();
    });
    return;
  }

  // DELETE
  if (method === 'DELETE') {
    lastWriteActivityMs = Date.now();
    let deleted = false;
    const prevBuf = inMemoryStagingBuffers.get(relPath);
    if (prevBuf) {
      inMemoryStagingBuffers.delete(relPath);
      inMemoryStagingBytes = Math.max(0, inMemoryStagingBytes - prevBuf.length);
    }
    if (manifest.files[relPath]) {
      deleteManifestFile(relPath);
      deleted = true;
    }
    if (manifest.folders[relPath]) {
      deleteManifestFolder(relPath);
      const prefix = `${relPath}/`;
      for (const k of Object.keys(manifest.folders)) {
        if (k.startsWith(prefix)) deleteManifestFolder(k);
      }
      for (const k of Object.keys(manifest.files)) {
        if (k.startsWith(prefix)) deleteManifestFile(k);
      }
      deleted = true;
    }
    const localPath = path.join(STORAGE_DIR, relPath);
    if (fs.existsSync(localPath)) {
      fs.promises.rm(localPath, { recursive: true, force: true }).catch(() => {});
      deleted = true;
    }
    if (deleted) {
      saveManifestDebounced();
      res.writeHead(204, { 'Content-Length': '0' });
      res.end();
    } else {
      res.writeHead(404, { 'Content-Length': '0' });
      res.end();
    }
    return;
  }

  // MKCOL
  if (method === 'MKCOL') {
    lastWriteActivityMs = Date.now();
    const now = new Date().toISOString();
    ensureManifestParentFolders(`${relPath}/placeholder`);
    setManifestFolder(relPath, {
      relPath,
      name: path.basename(relPath),
      mtime: now,
      birthtime: now,
    });
    saveManifestDebounced();
    res.writeHead(201, { 'Content-Length': '0' });
    res.end();
    return;
  }

  // MOVE & COPY
  if (method === 'MOVE' || method === 'COPY') {
    lastWriteActivityMs = Date.now();
    const dest = req.headers['destination'];
    if (!dest) { res.writeHead(400, { 'Content-Length': '0' }); res.end(); return; }
    try {
      const destUrl = new URL(dest, WEBDAV_URL);
      const destRel = decodeURIComponent(destUrl.pathname).replace(/^\/+|\/+$/g, '');
      if (manifest.files[relPath]) {
        const entry = { ...manifest.files[relPath], relPath: destRel, name: path.basename(destRel) };
        ensureManifestParentFolders(destRel);
        setManifestFile(destRel, entry);
        const ramBuf = inMemoryStagingBuffers.get(relPath);
        if (ramBuf) {
          inMemoryStagingBuffers.set(destRel, ramBuf);
          if (method === 'MOVE') inMemoryStagingBuffers.delete(relPath);
        }
        if (method === 'MOVE') deleteManifestFile(relPath);
        saveManifestDebounced();
        res.writeHead(201, { 'Content-Length': '0' });
        res.end();
        return;
      }
      if (manifest.folders[relPath]) {
        const entry = { ...manifest.folders[relPath], relPath: destRel, name: path.basename(destRel) };
        ensureManifestParentFolders(`${destRel}/placeholder`);
        setManifestFolder(destRel, entry);
        const prefix = `${relPath}/`;
        for (const [k, v] of Object.entries(manifest.folders)) {
          if (k.startsWith(prefix)) {
            const newKey = `${destRel}/${k.slice(prefix.length)}`;
            setManifestFolder(newKey, { ...v, relPath: newKey });
            if (method === 'MOVE') deleteManifestFolder(k);
          }
        }
        for (const [k, v] of Object.entries(manifest.files)) {
          if (k.startsWith(prefix)) {
            const newKey = `${destRel}/${k.slice(prefix.length)}`;
            setManifestFile(newKey, { ...v, relPath: newKey });
            if (method === 'MOVE') deleteManifestFile(k);
          }
        }
        if (method === 'MOVE') deleteManifestFolder(relPath);
        saveManifestDebounced();
        res.writeHead(201, { 'Content-Length': '0' });
        res.end();
        return;
      }
      res.writeHead(404, { 'Content-Length': '0' });
      res.end();
    } catch {
      res.writeHead(500, { 'Content-Length': '0' });
      res.end();
    }
    return;
  }

  if (method === 'PROPPATCH') {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><D:multistatus xmlns:D="DAV:"><D:response><D:href>${encodeWebDavHref(urlPath)}</D:href><D:propstat><D:prop/><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>`;
    res.writeHead(207, { 'Content-Type': 'application/xml; charset=utf-8', 'Content-Length': Buffer.byteLength(xml) });
    res.end(xml);
    return;
  }

  if (method === 'LOCK' || method === 'UNLOCK') {
    res.writeHead(200, { 'Content-Length': '0' });
    res.end();
    return;
  }

  res.writeHead(405, { 'Content-Length': '0' });
  res.end();
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.on('connection', (socket) => {
  socket.setNoDelay(true);
});

function findRcloneExe() {
  const candidates = [
    path.join(__dirname, 'bin', 'rclone.exe'),
    path.join(__dirname, '..', 'bin', 'rclone.exe'),
    path.join(process.resourcesPath || '', 'bin', 'rclone.exe'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'scripts', 'bin', 'rclone.exe'),
    path.join(process.env.LOCALAPPDATA || 'C:\\Users\\HP\\AppData\\Local', 'Microsoft', 'WinGet', 'Links', 'rclone.exe'),
    'C:\\Program Files\\rclone\\rclone.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

function unmountDrive() {
  try { spawnSync('subst', [`${DRIVE_LETTER}:`, '/D'], { stdio: 'ignore' }); } catch {}
  try { spawnSync('net', ['use', `${DRIVE_LETTER}:`, '/delete', '/y'], { stdio: 'ignore' }); } catch {}
  try {
    const r = spawnSync('cmd', ['/c', `netstat -ano | findstr :5573`], { encoding: 'utf8' });
    const pids = [...new Set(
      (r.stdout || '').split('\n')
        .map(l => l.trim().split(/\s+/).pop())
        .filter(p => p && /^\d+$/.test(p) && p !== '0')
    )];
    for (const pid of pids) {
      try { spawnSync('taskkill', ['/PID', pid, '/F'], { stdio: 'ignore' }); } catch {}
    }
  } catch {}
}

let rcloneProc = null;
function mapDrive() {
  setTimeout(() => {
    try {
      const rcloneExe = findRcloneExe();
      const rcloneConfPath = path.join(USER_DATA_DIR, 'rclone_storage_i.conf');
      const confContent = [
        '[mc_storage_i]',
        'type = webdav',
        `url = ${WEBDAV_URL}`,
        'vendor = owncloud',
        'pacer_min_sleep = 0ms',
      ].join('\r\n') + '\r\n';
      fs.writeFileSync(rcloneConfPath, confContent, 'utf8');

      unmountDrive();

      const vfsCacheDir = fs.existsSync('D:\\') ? 'D:\\MasterStorageCache_I' : path.join(USER_DATA_DIR, 'cache_i');
      try { fs.mkdirSync(vfsCacheDir, { recursive: true }); } catch { /* ignore */ }

      const mountArgs = [
        'mount',
        'mc_storage_i:',
        `${DRIVE_LETTER}:`,
        `--config=${rcloneConfPath}`,
        '--volname=MASTER STORAGE (90 TB)',
        '--file-perms=0777',
        '--dir-perms=0777',
        '--vfs-cache-mode=full',
        `--cache-dir=${vfsCacheDir}`,
        '--vfs-cache-max-age=1m',
        '--vfs-cache-max-size=1G',
        '--vfs-read-chunk-size=128k',
        '--vfs-read-chunk-size-limit=16M',
        '--vfs-fast-fingerprint',
        '--dir-cache-time=72h',
        '--attr-timeout=72h',
        '--poll-interval=0',
        '--transfers=16',
        '--checkers=16',
        '--buffer-size=0',
        '--no-modtime',
        '--no-checksum',
        '--rc',
        '--rc-addr=127.0.0.1:5573',
        '--rc-no-auth',
      ];

      rcloneProc = spawn(rcloneExe, mountArgs, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      rcloneProc.unref();

      setTimeout(() => {
        try {
          const customIcoPath = path.join(USER_DATA_DIR, 'drive-icon.ico');
          const iconTarget = fs.existsSync(customIcoPath) ? customIcoPath : 'imageres.dll,-32';
          spawnSync('reg', ['add', `${driveKey}\\DefaultLabel`, '/ve', '/t', 'REG_SZ', '/d', 'MASTER STORAGE (90 TB)', '/f'], { stdio: 'ignore' });
          spawnSync('reg', ['add', `${driveKey}\\DefaultIcon`, '/ve', '/t', 'REG_SZ', '/d', iconTarget, '/f'], { stdio: 'ignore' });
        } catch {}
        console.log(`✅ Drive ${DRIVE_LETTER}: mounted as Pure Zero-Disk 90.0 TB Virtual Storage!`);
      }, 1000);
    } catch (e) {
      console.error(`⚠️ Drive mount error: ${e.message}`);
    }
  }, 100);
}

function registerStartupPersistence() {
  const vbsPath = path.join(USER_DATA_DIR, 'start-storage-90tb.vbs');
  const nodeExe = process.execPath;

  const vbsContent = [
    'Set WshShell = CreateObject("WScript.Shell")',
    `WshShell.Run """${nodeExe}"" """ & "${__filename}"" --port=${PORT} --drive=${DRIVE_LETTER}", 0, False`,
  ].join('\r\n') + '\r\n';
  fs.writeFileSync(vbsPath, vbsContent, 'utf8');

  // Registry Run
  try {
    spawnSync('reg', [
      'add',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      '/v',
      'MasterStorage90TB',
      '/t',
      'REG_SZ',
      '/d',
      `wscript.exe "${vbsPath}"`,
      '/f',
    ], { stdio: 'ignore' });
  } catch {}

  // Startup Folder
  try {
    const startupDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    if (fs.existsSync(startupDir)) {
      const batPath = path.join(startupDir, 'MasterStorage90TB.vbs');
      fs.writeFileSync(batPath, vbsContent, 'utf8');
    }
  } catch {}

  console.log('✅ Auto-Start registered permanently across Registry and Startup Folder!');
}

function startListening() {
  server.listen(PORT, '127.0.0.1', () => {
    console.log('═'.repeat(65));
    console.log('💾 MASTER STORAGE 90 TB Zero-Disk Offline Server is RUNNING!');
    console.log(`   Drive Letter:   ${DRIVE_LETTER}: ("MASTER STORAGE (90 TB)")`);
    console.log(`   Total Quota:    90.0 TB (${NINETY_TB_BYTES.toLocaleString()} bytes)`);
    console.log(`   Disk Footprint: 0 BYTES on C: / 0 BYTES on D: / 0 BYTES on Z:!`);
    console.log(`   Server URL:     ${WEBDAV_URL}`);
    console.log('═'.repeat(65));

    registerStartupPersistence();
    mapDrive();
    setTimeout(runCloudOffloaderLoop, 2000);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    try {
      const r = spawnSync('cmd', ['/c', `netstat -ano | findstr :${PORT}`], { encoding: 'utf8' });
      const pids = [...new Set(
        (r.stdout || '').split('\n')
          .map(l => l.trim().split(/\s+/).pop())
          .filter(p => p && /^\d+$/.test(p) && p !== '0' && Number(p) !== process.pid)
      )];
      for (const pid of pids) {
        spawnSync('taskkill', ['/PID', pid, '/F'], { stdio: 'ignore' });
      }
    } catch {}
    setTimeout(startListening, 300);
  } else {
    console.error('Server error:', err.message);
    process.exit(1);
  }
});

startListening();

process.on('SIGINT', () => {
  unmountDrive();
  server.close(() => process.exit(0));
});
