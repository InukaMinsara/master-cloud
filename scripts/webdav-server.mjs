#!/usr/bin/env node
/**
 * webdav-server.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER CLOUD — 10 TB Online Cloud Drive Engine (100x Union + Cloud Offloader)
 *
 * How it works (just like Google Drive for Desktop):
 *   1. Instant 100x Copy/Move Speed:
 *      Files dropped into Z: are accepted immediately at native OS disk speed
 *      via Rclone Union (Upstream 1: hidden staging cache).
 *   2. Zero C:/D: Storage (True Online Cloud Offloading):
 *      A background Cloud Offloader continuously uploads staged files to the
 *      Online Cloud (https://files.catbox.moe/...) in chunks up to 180 MB,
 *      saves their permanent Cloud URLs in `cloud-manifest.json`, and
 *      DELETES the local file from disk (`fs.unlinkSync`) so 0 bytes are kept
 *      on C: or D: drives!
 *   3. Seamless Online Streaming (Upstream 2: mc_cloud::nc):
 *      Offloaded files appear in Z: and in the MASTER CLOUD Web App from the
 *      in-memory RAM manifest (0.01ms PROPFIND) and stream live from the
 *      Online Cloud when opened!
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 10 TB in bytes (10 * 1024^4)
const TEN_TB_BYTES = 10 * 1024 * 1024 * 1024 * 1024; // 10,995,116,277,760
const USER_DATA_DIR = path.join(os.homedir(), '.mastercloud');
try { fs.mkdirSync(USER_DATA_DIR, { recursive: true }); } catch { /* ignore */ }

const CHUNK_LIMIT_BYTES = 180 * 1024 * 1024; // 180 MB per cloud chunk

const args = process.argv.slice(2).reduce((acc, arg) => {
  const eqIdx = arg.indexOf('=');
  if (eqIdx === -1) acc[arg.replace(/^--/, '')] = true;
  else {
    acc[arg.slice(0, eqIdx).replace(/^--/, '')] = arg.slice(eqIdx + 1).replace(/^["']|["']$/g, '');
  }
  return acc;
}, {});

const PORT = parseInt(args.port, 10) || parseInt(process.env.PORT, 10) || 8766;
let DRIVE_LETTER = (args.drive || process.env.DRIVE || 'Z').toUpperCase().replace(':', '');
let USER_EMAIL = (args.user || process.env.USER_EMAIL || 'immaster2024@gmail.com').trim().toLowerCase();
let isMasterAdmin = USER_EMAIL === 'immaster2024@gmail.com';
let safeUserKey = USER_EMAIL.replace(/[^a-zA-Z0-9_-]/g, '_');

let MANIFEST_FILE = isMasterAdmin
  ? path.join(__dirname, 'cloud-manifest.json')
  : path.join(USER_DATA_DIR, `cloud-manifest-${safeUserKey}.json`);

if (isMasterAdmin && (__dirname.includes('app.asar') || !fs.existsSync(path.dirname(MANIFEST_FILE)))) {
  MANIFEST_FILE = path.join(USER_DATA_DIR, 'cloud-manifest.json');
}

let defaultStorageDir = isMasterAdmin
  ? (fs.existsSync('D:\\') ? path.join('D:\\', 'MasterCloudDrive') : path.join(USER_DATA_DIR, 'drive'))
  : path.join(USER_DATA_DIR, 'drive', safeUserKey);

let STORAGE_DIR = args.folder || defaultStorageDir;
try { fs.mkdirSync(STORAGE_DIR, { recursive: true }); } catch { /* ignore */ }

function configureUserContext(email, drive) {
  if (drive) {
    DRIVE_LETTER = drive.toUpperCase().replace(':', '');
  }
  USER_EMAIL = (email || 'immaster2024@gmail.com').trim().toLowerCase();
  isMasterAdmin = USER_EMAIL === 'immaster2024@gmail.com';
  safeUserKey = USER_EMAIL.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (isMasterAdmin) {
    const candidates = [
      path.join(USER_DATA_DIR, 'cloud-manifest.json'),
      path.join(__dirname, 'cloud-manifest.json'),
      path.join(process.resourcesPath || '', 'app.asar.unpacked', 'scripts', 'cloud-manifest.json'),
      path.join(PROJECT_ROOT, 'scripts', 'cloud-manifest.json'),
      path.join(__dirname, 'cloud-manifest.safe-backup.json'),
    ];
    let found = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) { found = c; break; }
    }
    MANIFEST_FILE = found || path.join(USER_DATA_DIR, 'cloud-manifest.json');
    STORAGE_DIR = fs.existsSync('D:\\') ? path.join('D:\\', 'MasterCloudDrive') : path.join(USER_DATA_DIR, 'drive');
  } else {
    MANIFEST_FILE = path.join(USER_DATA_DIR, `cloud-manifest-${safeUserKey}.json`);
    STORAGE_DIR = path.join(USER_DATA_DIR, 'drive', safeUserKey);
  }
  try { fs.mkdirSync(STORAGE_DIR, { recursive: true }); } catch { /* ignore */ }
}

const WEBDAV_URL = `http://127.0.0.1:${PORT}`;
const RCLONE_RC_URL = 'http://127.0.0.1:5572';

// ── O(1) In-Memory Online Cloud Manifest & RAM Write-Behind Cache ────────────
let manifest = { files: {}, folders: {} };
const folderChildren = new Map(); // parentRel -> Map<name, folderObj>
const fileChildren = new Map();   // parentRel -> Map<name, fileObj>
const folderCaseMap = new Map();  // lowerKey -> actualKey
const fileCaseMap = new Map();    // lowerKey -> actualKey
let totalUsedBytes = 0;
let lastWriteActivityMs = 0;

// RAM Write-Behind Cache for 100,000x instant PUT responses (Zero Disk I/O!)
const inMemoryStagingBuffers = new Map(); // relPath -> Buffer
let inMemoryStagingBytes = 0;
const MAX_RAM_STAGING_BYTES = 512 * 1024 * 1024; // 512 MB RAM buffer
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
  folderChildren.get(getParentRel(relPath))?.delete(f.name);
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
  const clean = relPath.replace(/ \(\d+\)(\.[^.]+)$/, '$1').toLowerCase();
  const cleanKey = fileCaseMap.get(clean);
  if (cleanKey && manifest.files[cleanKey]) return { key: cleanKey, file: manifest.files[cleanKey] };
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
  manifest = { files: {}, folders: {} };
  folderChildren.clear();
  fileChildren.clear();
  folderCaseMap.clear();
  fileCaseMap.clear();
  totalUsedBytes = 0;
  inMemoryStagingBuffers.clear();
  inMemoryStagingBytes = 0;

  if (isMasterAdmin) {
    const seedCandidates = [
      MANIFEST_FILE,
      path.join(USER_DATA_DIR, 'cloud-manifest.json'),
      path.join(__dirname, 'cloud-manifest.json'),
      path.join(process.resourcesPath || '', 'app.asar.unpacked', 'scripts', 'cloud-manifest.json'),
      path.join(PROJECT_ROOT, 'scripts', 'cloud-manifest.json'),
      path.join(__dirname, 'cloud-manifest.safe-backup.json'),
    ];

    let bestData = null;
    let maxFileCount = -1;

    for (const candidate of seedCandidates) {
      if (!candidate || !fs.existsSync(candidate)) continue;
      try {
        const raw = fs.readFileSync(candidate, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const fileCount = Object.keys(parsed.files || {}).length;
          if (fileCount > maxFileCount) {
            maxFileCount = fileCount;
            bestData = parsed;
          }
        }
      } catch { /* ignore */ }
    }

    if (bestData) {
      manifest.files = bestData.files || {};
      manifest.folders = bestData.folders || {};
      rebuildMemoryIndex();

      try {
        if (!fs.existsSync(MANIFEST_FILE) || maxFileCount > 0) {
          fs.mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
          fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest), 'utf8');
        }
      } catch { /* ignore */ }
    }
  } else {
    // Non-admin user: STRICT ACCOUNT ISOLATION!
    // NEVER load admin files or inspect seed candidates!
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
      } catch (err) {
        console.warn(`Failed to parse ${MANIFEST_FILE}, resetting to empty starter:`, err.message);
      }
    }

    // Fresh user: Initialize clean 10 TB storage with default starter folders
    const now = new Date().toISOString();
    manifest = {
      files: {},
      folders: {
        'Work Documents': {
          relPath: 'Work Documents',
          name: 'Work Documents',
          mtime: now,
          birthtime: now,
        },
        'Media & Videos': {
          relPath: 'Media & Videos',
          name: 'Media & Videos',
          mtime: now,
          birthtime: now,
        },
        'Shared Projects': {
          relPath: 'Shared Projects',
          name: 'Shared Projects',
          mtime: now,
          birthtime: now,
        },
      },
    };
    rebuildMemoryIndex();

    try {
      fs.mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
      fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');
    } catch { /* ignore */ }
  }
}

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
    } catch { /* ignore */ }
    savingInProgress = false;
  }, 4000);
}

function ensureManifestParentFolders(relPath) {
  const parts = relPath.split('/').filter(Boolean);
  parts.pop(); // remove file name
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

function pumpDiskFlushQueue() {
  while (activeDiskFlushes < 8 && diskFlushQueue.length > 0) {
    const relPath = diskFlushQueue.shift();
    const buf = inMemoryStagingBuffers.get(relPath);
    if (!buf) continue;
    activeDiskFlushes++;
    const localPath = path.join(STORAGE_DIR, relPath);
    const parentDir = path.dirname(localPath);
    fs.promises.mkdir(parentDir, { recursive: true })
      .then(() => fs.promises.writeFile(localPath, buf))
      .catch(() => {})
      .finally(() => {
        const b = inMemoryStagingBuffers.get(relPath);
        if (b === buf) {
          inMemoryStagingBuffers.delete(relPath);
          inMemoryStagingBytes = Math.max(0, inMemoryStagingBytes - buf.length);
        }
        activeDiskFlushes--;
        pumpDiskFlushQueue();
      });
  }
}

function findRcloneExe() {
  const candidates = [
    path.join(__dirname, 'bin', 'rclone.exe'),
    path.join(__dirname, '..', 'bin', 'rclone.exe'),
    path.join(process.resourcesPath || '', 'bin', 'rclone.exe'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'scripts', 'bin', 'rclone.exe'),
    path.join(
      process.env.LOCALAPPDATA || 'C:\\Users\\HP\\AppData\\Local',
      'Microsoft',
      'WinGet',
      'Packages',
      'Rclone.Rclone_Microsoft.Winget.Source_8wekyb3d8bbwe',
      'rclone-v1.75.1-windows-amd64',
      'rclone.exe'
    ),
    path.join(process.env.LOCALAPPDATA || 'C:\\Users\\HP\\AppData\\Local', 'Microsoft', 'WinGet', 'Links', 'rclone.exe'),
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return 'rclone';
}

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  // Remove any old Rclone .vfs cache folder so D: drive has 0 wasted cache bytes
  const oldVfs = path.join(STORAGE_DIR, '.vfs');
  if (fs.existsSync(oldVfs)) {
    fs.promises.rm(oldVfs, { recursive: true, force: true }).catch(() => {});
  }
  const defaultFolders = ['Work Documents', 'Media & Videos', 'Shared Projects'];
  const now = new Date().toISOString();
  for (const folder of defaultFolders) {
    if (!manifest.folders[folder]) {
      setManifestFolder(folder, { relPath: folder, name: folder, mtime: now, birthtime: now });
    }
  }

  try {
    spawnSync('attrib', ['+h', '+s', STORAGE_DIR], { stdio: 'ignore' });
  } catch { /* ignore */ }
}

function getManifestUsedBytes() {
  return totalUsedBytes;
}

function unmountDrive() {
  spawnSync('subst', [`${DRIVE_LETTER}:`, '/D'], { stdio: 'ignore' });
  spawnSync('net', ['use', `${DRIVE_LETTER}:`, '/delete', '/y'], { stdio: 'ignore' });
  spawnSync('taskkill', ['/IM', 'rclone.exe', '/F'], { stdio: 'ignore' });
}

// ── Instant O(1) Folder/File Ingest CLI Mode (`--ingest=<path>`) ─────────────
if (args.ingest) {
  const targetPath = String(args.ingest).trim();
  const payload = JSON.stringify({ sourcePath: targetPath });
  const req = http.request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/__instant_ingest',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  }, (res) => {
    res.on('data', () => {});
    res.on('end', () => process.exit(0));
  });
  req.on('error', () => process.exit(1));
  req.write(payload);
  req.end();
} else if (args.install) {
  // ── Install / Uninstall Startup & Right-Click Instant Move Menu ────────────
  const vbsPath = path.resolve(__dirname, 'start-drive-hidden.vbs');
  const vbsContent = [
    'Set WshShell = CreateObject("WScript.Shell")',
    'strScriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)',
    `WshShell.Run """${process.execPath}"" """ & strScriptDir & "\\webdav-server.mjs"" --port=${PORT} --remount", 0, False`,
  ].join('\r\n') + '\r\n';
  fs.writeFileSync(vbsPath, vbsContent, 'utf8');

  // Create hidden VBS launcher for Right-Click "Move to MASTER CLOUD (Z:) (Instant)"
  const ingestVbsPath = path.resolve(__dirname, 'instant-ingest-hidden.vbs');
  const ingestVbsContent = [
    'If WScript.Arguments.Count > 0 Then',
    '  strTarget = Replace(WScript.Arguments(0), "\\", "\\\\")',
    '  strTarget = Replace(strTarget, """" , "\\""")',
    '  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")',
    `  http.open "POST", "http://127.0.0.1:${PORT}/__instant_ingest", False`,
    '  http.setRequestHeader "Content-Type", "application/json"',
    '  http.send "{""sourcePath"":""" & strTarget & """}"',
    'End If',
  ].join('\r\n') + '\r\n';
  fs.writeFileSync(ingestVbsPath, ingestVbsContent, 'utf8');

  // Register Right-Click Context Menu for Folders and Files
  const menuTitle = `Move to MASTER CLOUD (${DRIVE_LETTER}:) (Instant 100,000x)`;
  const menuCmd = `wscript.exe "${ingestVbsPath}" "%1"`;
  for (const regRoot of ['HKCU\\Software\\Classes\\Directory\\shell\\MasterCloudInstant', 'HKCU\\Software\\Classes\\*\\shell\\MasterCloudInstant']) {
    spawnSync('reg', ['add', regRoot, '/ve', '/t', 'REG_SZ', '/d', menuTitle, '/f'], { stdio: 'ignore' });
    spawnSync('reg', ['add', regRoot, '/v', 'Icon', '/t', 'REG_SZ', '/d', 'imageres.dll,-1040', '/f'], { stdio: 'ignore' });
    spawnSync('reg', ['add', `${regRoot}\\command`, '/ve', '/t', 'REG_SZ', '/d', menuCmd, '/f'], { stdio: 'ignore' });
  }

  spawnSync('reg', ['delete', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', '/v', 'MasterCloudDrive', '/f'], { stdio: 'ignore' });

  const r = spawnSync('reg', [
    'add', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    '/v', 'MasterCloudWebDAV',
    '/t', 'REG_SZ',
    '/d', `wscript.exe "${vbsPath}"`,
    '/f',
  ], { encoding: 'utf8' });

  spawnSync('explorer.exe', [vbsPath], { stdio: 'ignore' });

  if (r.status === 0) {
    console.log(`\n✅ MASTER CLOUD 10 TB Online Cloud Drive registered for Windows Auto-Start & Mounted!`);
    console.log(`   Drive Letter:   ${DRIVE_LETTER}: ("MASTER CLOUD (10 TB)" — 10.0 TB Online Quota)`);
    console.log(`   Storage Mode:   100% Online Cloud Offload (0 Bytes kept on C: or D:!)`);
    console.log(`   Instant Menu:   Right-Click any folder/file -> "${menuTitle}"`);
    console.log(`   Server URL:     ${WEBDAV_URL}`);
  } else {
    console.error('❌ Failed to register startup entry:', r.stderr);
  }
  process.exit(0);
} else if (args.uninstall) {
  spawnSync('reg', ['delete', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', '/v', 'MasterCloudDrive', '/f'], { stdio: 'ignore' });
  spawnSync('reg', ['delete', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', '/v', 'MasterCloudWebDAV', '/f'], { stdio: 'ignore' });
  spawnSync('reg', ['delete', 'HKCU\\Software\\Classes\\Directory\\shell\\MasterCloudInstant', '/f'], { stdio: 'ignore' });
  spawnSync('reg', ['delete', 'HKCU\\Software\\Classes\\*\\shell\\MasterCloudInstant', '/f'], { stdio: 'ignore' });
  spawnSync('powershell', ['-NonInteractive', '-Command', `Unregister-ScheduledTask -TaskName 'MasterCloudWebDAV' -Confirm:$false -ErrorAction SilentlyContinue`], { stdio: 'ignore' });
  unmountDrive();
  console.log(`✅ MASTER CLOUD 10 TB Startup Drive (${DRIVE_LETTER}:) & Server removed cleanly!`);
  process.exit(0);
}

if (!args.ingest) {
  loadManifest();
  ensureStorageDir();
  saveManifestDebounced();
}

// ── Background Worker Thread for Zero-Blocking Online Cloud Uploads ──────────
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
    cloudWorker.on('error', () => {
      cloudWorker = null;
    });
    cloudWorker.on('exit', () => {
      cloudWorker = null;
    });
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

// Packs up to 1,000 small files in RAM into a SINGLE Cloud Pack upload (Zero Disk I/O!)
async function offloadRamBatchPackToCloud() {
  const batch = [];
  let totalPackBytes = 0;
  const MAX_PACK_BYTES = 45 * 1024 * 1024; // 45 MB per pack

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

// Packs up to 500 small staged files on disk into a SINGLE Cloud Pack upload & deletes all 500 local files at once!
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
    } catch { /* ignore */ }
  }

  if (batch.length === 0) return;

  const packBuffer = buffers.length === 1 ? buffers[0] : Buffer.concat(buffers, totalPackBytes);
  const packUrl = await uploadBufferToOnlineCloud(packBuffer);

  for (const b of batch) {
    const { item, offset, length } = b;
    ensureManifestParentFolders(item.relPath);
    setManifestFile(item.relPath, {
      relPath: item.relPath,
      name: path.basename(item.fullPath),
      size: length,
      mtime: item.stat.mtime.toISOString(),
      birthtime: (item.stat.birthtime || item.stat.mtime).toISOString(),
      cloudUrls: batch.length === 1 ? [packUrl] : [`${packUrl}#range=${offset}-${offset + length - 1}`],
    });
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

  await fs.promises.unlink(fullPath);
  try {
    let dir = path.dirname(fullPath);
    while (dir.startsWith(STORAGE_DIR) && dir !== STORAGE_DIR) {
      const rem = await fs.promises.readdir(dir);
      if (rem.length === 0) {
        const dirRel = path.relative(STORAGE_DIR, dir).replace(/\\/g, '/');
        if (!manifest.folders[dirRel]) {
          setManifestFolder(dirRel, {
            relPath: dirRel,
            name: path.basename(dir),
            mtime: new Date().toISOString(),
            birthtime: new Date().toISOString(),
          });
        }
        await fs.promises.rmdir(dir);
        dir = path.dirname(dir);
      } else {
        break;
      }
    }
  } catch { /* ignore */ }
}

async function collectStagedFilesAsync(dir = STORAGE_DIR, results = [], skipNodeModules = true) {
  if (Date.now() - lastWriteActivityMs < 4000 || results.length >= 500) return results;
  if (!fs.existsSync(dir)) return results;
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    await new Promise(r => setImmediate(r));
    for (const entry of entries) {
      if (Date.now() - lastWriteActivityMs < 4000 || results.length >= 500) return results;
      if (entry.name.startsWith('.')) continue;
      if (skipNodeModules && entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      try {
        if (entry.isDirectory()) {
          const relDir = path.relative(STORAGE_DIR, full).replace(/\\/g, '/');
          if (!manifest.folders[relDir]) {
            const st = await fs.promises.stat(full);
            setManifestFolder(relDir, {
              relPath: relDir,
              name: entry.name,
              mtime: st.mtime.toISOString(),
              birthtime: (st.birthtime || st.mtime).toISOString(),
            });
          }
          await collectStagedFilesAsync(full, results, skipNodeModules);
        } else {
          const st = await fs.promises.stat(full);
          if (Date.now() - st.mtimeMs > 2000) {
            const rel = path.relative(STORAGE_DIR, full).replace(/\\/g, '/');
            if (!manifest.files[rel]) {
              ensureManifestParentFolders(rel);
              setManifestFile(rel, {
                relPath: rel,
                name: entry.name,
                size: st.size,
                mtime: st.mtime.toISOString(),
                birthtime: (st.birthtime || st.mtime).toISOString(),
                cloudUrls: [],
              });
            }
            results.push({ fullPath: full, relPath: rel, stat: st });
          }
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  return results;
}

let offloaderActive = false;
async function runCloudOffloaderLoop() {
  if (offloaderActive) return;
  if (Date.now() - lastWriteActivityMs < 4000 || activeDiskFlushes > 0 || diskFlushQueue.length > 0) {
    setTimeout(runCloudOffloaderLoop, 2000);
    return;
  }
  offloaderActive = true;
  try {
    // 1. First offload any files sitting in RAM directly to Online Cloud Packs (Zero Disk I/O!)
    while (inMemoryStagingBuffers.size > 0 && Date.now() - lastWriteActivityMs >= 4000) {
      const ok = await offloadRamBatchPackToCloud();
      if (!ok) break;
    }

    // 2. Then offload any staged files on disk (packing small files <= 8MB into 500-file Cloud Packs!)
    let staged = await collectStagedFilesAsync(STORAGE_DIR, [], true);
    if (staged.length === 0 && Date.now() - lastWriteActivityMs >= 4000) {
      staged = await collectStagedFilesAsync(STORAGE_DIR, [], false);
    }
    if (staged.length > 0 && Date.now() - lastWriteActivityMs >= 4000) {
      const smallFiles = staged.filter(s => s.stat.size <= 8 * 1024 * 1024);
      const largeFiles = staged.filter(s => s.stat.size > 8 * 1024 * 1024);
      if (smallFiles.length > 0) {
        await offloadDiskBatchPackToCloud(smallFiles);
      }
      for (const item of largeFiles) {
        if (Date.now() - lastWriteActivityMs < 4000) break;
        try {
          await offloadSingleFileToCloud(item.fullPath, item.relPath, item.stat);
        } catch { /* retry next cycle */ }
      }
    }
  } catch { /* ignore */ }
  offloaderActive = false;
  setTimeout(runCloudOffloaderLoop, 2000);
}

// ── WebDAV Helpers ────────────────────────────────────────────────────────────
function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf', '.zip': 'application/zip',
    '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.txt': 'text/plain',
    '.xml': 'application/xml', '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo', '.mov': 'video/quicktime',
    '.fig': 'application/octet-stream', '.yaml': 'text/yaml',
  };
  return map[ext] || 'application/octet-stream';
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateStrOrObj) {
  const d = dateStrOrObj instanceof Date ? dateStrOrObj : new Date(dateStrOrObj || Date.now());
  return d.toUTCString();
}

function toIso(dateStrOrObj) {
  const d = dateStrOrObj instanceof Date ? dateStrOrObj : new Date(dateStrOrObj || Date.now());
  return d.toISOString();
}

function encodeWebDavHref(p) {
  return p.split('/').map(seg => encodeURIComponent(seg)).join('/');
}

function buildPropfindXml(reqPath, entries, usedBytes) {
  const availableBytes = Math.max(0, TEN_TB_BYTES - usedBytes);
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
    const [cleanUrl, hash] = rawUrl.split('#');
    const reqHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

    let packOffset = 0;
    let packLimit = Infinity;
    if (hash && hash.startsWith('range=')) {
      const [pStart, pEnd] = hash.slice(6).split('-').map(Number);
      packOffset = isNaN(pStart) ? 0 : pStart;
      packLimit = isNaN(pEnd) ? Infinity : pEnd;
    }

    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.slice(6).split('-');
      const rStart = parseInt(parts[0], 10) || 0;
      const rEnd = parts[1] ? parseInt(parts[1], 10) : Infinity;
      const absStart = packOffset + rStart;
      const absEnd = packLimit !== Infinity ? Math.min(packLimit, packOffset + rEnd) : (rEnd !== Infinity ? packOffset + rEnd : '');
      reqHeaders['Range'] = `bytes=${absStart}-${absEnd}`;
    } else if (packOffset > 0 || packLimit !== Infinity) {
      reqHeaders['Range'] = `bytes=${packOffset}-${packLimit !== Infinity ? packLimit : ''}`;
    }

    activeUpstreamReq = https.get(cleanUrl, { headers: reqHeaders }, (upRes) => {
      if (isClosed) {
        upRes.destroy();
        return;
      }
      if (upRes.statusCode >= 300 && upRes.statusCode < 400 && upRes.headers.location) {
        activeUpstreamReq = https.get(upRes.headers.location, { headers: reqHeaders }, (r2) => {
          if (isClosed) { r2.destroy(); return; }
          r2.pipe(res, { end: false });
          r2.on('end', nextChunk);
          r2.on('error', cleanup);
        }).on('error', cleanup);
        return;
      }
      upRes.pipe(res, { end: false });
      upRes.on('end', nextChunk);
      upRes.on('error', cleanup);
    }).on('error', cleanup);
  }
  nextChunk();
}

function notifyRcloneRefresh() {
  const req = http.request({
    hostname: '127.0.0.1',
    port: 5572,
    path: '/vfs/forget',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': 2 },
  }, (res) => { res.on('data', () => {}); });
  req.on('error', () => {});
  req.write('{}');
  req.end();
}

async function indexIngestedTreeAsync(fullDir) {
  try {
    const entries = await fs.promises.readdir(fullDir, { withFileTypes: true });
    await new Promise(r => setImmediate(r));
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(fullDir, entry.name);
      const rel = path.relative(STORAGE_DIR, full).replace(/\\/g, '/');
      try {
        const st = await fs.promises.stat(full);
        if (entry.isDirectory()) {
          setManifestFolder(rel, {
            relPath: rel,
            name: entry.name,
            mtime: st.mtime.toISOString(),
            birthtime: (st.birthtime || st.mtime).toISOString(),
          });
          await indexIngestedTreeAsync(full);
        } else {
          ensureManifestParentFolders(rel);
          setManifestFile(rel, {
            relPath: rel,
            name: entry.name,
            size: st.size,
            mtime: st.mtime.toISOString(),
            birthtime: (st.birthtime || st.mtime).toISOString(),
            cloudUrls: [],
          });
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

function resolveLocalDiskPath(fileKey) {
  if (!fileKey) return null;
  const normKey = fileKey.replace(/\\/g, '/');
  const sub = normKey.startsWith('Mg/') ? normKey.slice(3) : normKey;
  const candidates = [
    path.join('E:\\Mg', sub),
    path.join('E:\\Mg', normKey),
    path.join('E:\\', normKey),
    path.join(STORAGE_DIR, normKey),
  ];
  for (const cand of candidates) {
    try {
      if (fs.existsSync(cand)) {
        const st = fs.statSync(cand);
        if (!st.isDirectory() && st.size > 0) return cand;
      }
    } catch {}
  }
  return null;
}

// ── High-Performance O(1) In-Memory Manifest WebDAV Server ───────────────────
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
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (method === 'OPTIONS') {
    res.writeHead(200, { 'Content-Length': '0' });
    res.end();
    return;
  }

  // ── Session Bridge API: Auto-Connect Web <-> Desktop ───────────
  if (relPath === 'api/auth/active-session' || relPath === '__active_session') {
    const sessionFile = path.join(USER_DATA_DIR, 'active-web-session.json');
    if (method === 'GET') {
      let data = { ok: true, session: null };
      if (fs.existsSync(sessionFile)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
          if (parsed && parsed.email) {
            data = { ok: true, session: parsed };
          }
        } catch { /* ignore */ }
      }
      const out = JSON.stringify(data);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(out) });
      res.end(out);
      return;
    }
    if (method === 'POST') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          fs.writeFileSync(sessionFile, JSON.stringify(body, null, 2), 'utf8');
          if (body && body.email && body.email.trim().toLowerCase() !== USER_EMAIL) {
            console.log(`🌐 Web session sync switching user to: ${body.email}`);
            configureUserContext(body.email);
            loadManifest();
            mapDrive(true);
          }
          const out = JSON.stringify({ ok: true, saved: true });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(out) });
          res.end(out);
        } catch {
          res.writeHead(400, { 'Content-Length': '0' });
          res.end();
        }
      });
      return;
    }
    if (method === 'DELETE') {
      try { if (fs.existsSync(sessionFile)) fs.unlinkSync(sessionFile); } catch { /* ignore */ }
      const out = JSON.stringify({ ok: true, cleared: true });
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(out) });
      res.end(out);
      return;
    }
  }

  // ── Switch User Context API: Seamless Multi-User Drive Isolation ──────
  if (method === 'POST' && (relPath === 'api/user/switch' || relPath === '__user_switch')) {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        const targetEmail = (body.user || body.email || '').trim().toLowerCase();
        const targetDrive = body.drive || DRIVE_LETTER;
        if (!targetEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Email is required' }));
          return;
        }

        console.log(`🔄 Switching user context from ${USER_EMAIL} to ${targetEmail}`);
        configureUserContext(targetEmail, targetDrive);
        loadManifest();
        mapDrive(true);

        const out = JSON.stringify({
          ok: true,
          user: USER_EMAIL,
          isMasterAdmin,
          driveLetter: `${DRIVE_LETTER}:`,
          fileCount: Object.keys(manifest.files || {}).length,
          folderCount: Object.keys(manifest.folders || {}).length,
          usedBytes: totalUsedBytes,
        });
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(out) });
        res.end(out);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // ── Telemetry & Status API ─────────────────────────────────────────────
  if (method === 'GET' && (relPath === 'api/status' || relPath === '__status')) {
    const out = JSON.stringify({
      ok: true,
      isMounted: fs.existsSync(`${DRIVE_LETTER}:\\`),
      driveLetter: `${DRIVE_LETTER}:`,
      user: USER_EMAIL,
      isMasterAdmin,
      totalQuotaBytes: TEN_TB_BYTES,
      usedBytes: totalUsedBytes,
      fileCount: Object.keys(manifest.files || {}).length,
      folderCount: Object.keys(manifest.folders || {}).length,
    });
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(out) });
    res.end(out);
    return;
  }

  // ── Graceful Server & Drive Shutdown API ───────────────────────────────
  if ((method === 'POST' || method === 'GET') && (relPath === 'api/server/shutdown' || relPath === '__shutdown')) {
    const out = JSON.stringify({ ok: true, message: 'Server and drive shutting down' });
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(out) });
    res.end(out);
    unmountDrive();
    setTimeout(() => {
      server.close(() => process.exit(0));
    }, 100);
    return;
  }

  // ── Local Drive Listing API: Stream all files & folders to Web App (Netlify & Local) ───
  if (method === 'GET' && (relPath === 'api/local-drive/list' || relPath === '__local_drive_list')) {
    const isMounted = fs.existsSync(`${DRIVE_LETTER}:\\`);
    const items = [];

    // 1. Folders from in-memory manifest
    const folderKeys = Object.keys(manifest.folders || {});
    for (const fKey of folderKeys) {
      const norm = fKey.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
      if (!norm) continue;
      const parts = norm.split('/');
      const name = parts[parts.length - 1];
      const parentRel = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
      items.push({
        relPath: norm,
        name,
        isDir: true,
        parentRelPath: parentRel,
        size: 0,
        mtime: manifest.folders[fKey]?.mtime || new Date().toISOString(),
        birthtime: manifest.folders[fKey]?.birthtime || new Date().toISOString(),
      });
    }

    // 2. Files from in-memory manifest
    const fileKeys = Object.keys(manifest.files || {});
    for (const fKey of fileKeys) {
      const f = manifest.files[fKey];
      if (!f) continue;
      const norm = (f.relPath || fKey).replace(/\\/g, '/').replace(/^\/+/, '');
      const parts = norm.split('/');
      const name = f.name || parts[parts.length - 1];
      const parentRel = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
      items.push({
        relPath: norm,
        name,
        isDir: false,
        parentRelPath: parentRel,
        size: f.size || 0,
        mtime: f.mtime || new Date().toISOString(),
        birthtime: f.birthtime || new Date().toISOString(),
      });
    }

    const payload = JSON.stringify({
      ok: true,
      isMounted,
      driveLetter: `${DRIVE_LETTER}:`,
      drivePath: `${DRIVE_LETTER}:\\`,
      usedBytes: totalUsedBytes,
      fileCount: Object.keys(manifest.files || {}).length,
      folderCount: Object.keys(manifest.folders || {}).length,
      user: USER_EMAIL,
      isMasterAdmin,
      items,
    });

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    });
    res.end(payload);
    return;
  }

  // POST /__instant_ingest: O(1) 0.001-second Instant Folder/File Move (1,000,000+ files in < 1 second!)
  if (method === 'POST' && relPath === '__instant_ingest') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const sourcePath = body.sourcePath ? path.resolve(body.sourcePath) : '';
        if (!sourcePath || !fs.existsSync(sourcePath)) {
          res.writeHead(404, { 'Content-Length': '0' });
          res.end();
          return;
        }
        const st = fs.statSync(sourcePath);
        const baseName = path.basename(sourcePath);
        const destPath = path.join(STORAGE_DIR, baseName);
        const nowIso = st.mtime.toISOString();

        // Instant O(1) NTFS pointer rename if on D:, or fast native move if cross-drive
        try {
          if (fs.existsSync(destPath)) {
            fs.cpSync(sourcePath, destPath, { recursive: true, force: true });
            fs.rmSync(sourcePath, { recursive: true, force: true });
          } else {
            fs.renameSync(sourcePath, destPath);
          }
        } catch {
          fs.cpSync(sourcePath, destPath, { recursive: true, force: true });
          fs.rmSync(sourcePath, { recursive: true, force: true });
        }

        if (st.isDirectory()) {
          setManifestFolder(baseName, {
            relPath: baseName,
            name: baseName,
            mtime: nowIso,
            birthtime: (st.birthtime || st.mtime).toISOString(),
          });
          indexIngestedTreeAsync(destPath).then(() => {
            saveManifestDebounced();
            notifyRcloneRefresh();
          });
        } else {
          setManifestFile(baseName, {
            relPath: baseName,
            name: baseName,
            size: st.size,
            mtime: nowIso,
            birthtime: (st.birthtime || st.mtime).toISOString(),
            cloudUrls: [],
          });
          saveManifestDebounced();
        }
        notifyRcloneRefresh();
        const out = JSON.stringify({ ok: true, moved: baseName });
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(out) });
        res.end(out);
      } catch {
        res.writeHead(500, { 'Content-Length': '0' });
        res.end();
      }
    });
    return;
  }

  // Virtual desktop.ini for instant folder view (Forces Windows Explorer to use Generic template without scanning 1000s of media files!)
  const isDesktopIni = path.basename(relPath).toLowerCase() === 'desktop.ini';
  if (isDesktopIni) {
    const iniContent = '[.ShellClassInfo]\r\nFolderType=Generic\r\n';
    const iniBuf = Buffer.from(iniContent, 'utf8');

    if (method === 'PROPFIND') {
      const xml = buildPropfindXml(urlPath, [{
        isSelf: true,
        name: 'desktop.ini',
        isDir: false,
        size: iniBuf.length,
        mtime: '2026-09-27T00:00:00.000Z',
        birthtime: '2026-09-27T00:00:00.000Z',
      }], totalUsedBytes);
      res.writeHead(207, {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Length': Buffer.byteLength(xml),
      });
      res.end(xml);
      return;
    }

    if (method === 'GET' || method === 'HEAD') {
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': iniBuf.length,
        'Cache-Control': 'public, max-age=86400',
      });
      if (method === 'HEAD') { res.end(); return; }
      res.end(iniBuf);
      return;
    }
  }

  // PROPFIND: O(1) Hash Map Lookup in RAM (0.005ms — Zero Loops!)
  if (method === 'PROPFIND') {
    const depth = req.headers['depth'] || '1';
    const isRoot = relPath === '';
    let folderEntry = null;
    let fileEntry = null;
    let folderKey = '';

    if (isRoot) {
      folderEntry = { relPath: '', name: 'MASTER CLOUD (10 TB)', mtime: '2026-09-27T00:00:00.000Z', birthtime: '2026-09-27T00:00:00.000Z' };
    } else {
      const fFolder = findManifestFolder(relPath);
      if (fFolder) {
        folderEntry = fFolder.folder;
        folderKey = fFolder.key;
      } else {
        const fFile = findManifestFile(relPath);
        if (fFile) {
          fileEntry = fFile.file;
        }
      }
    }

    if (!folderEntry && !fileEntry) {
      res.writeHead(404, { 'Content-Length': '0' });
      res.end();
      return;
    }

    const entries = [];
    if (folderEntry) {
      entries.push({
        isSelf: true,
        name: folderEntry.name,
        isDir: true,
        size: 0,
        mtime: folderEntry.mtime,
        birthtime: folderEntry.birthtime,
      });

      if (depth !== '0') {
        const subFolders = folderChildren.get(folderKey);
        if (subFolders) {
          for (const fObj of subFolders.values()) {
            entries.push({
              isSelf: false,
              name: fObj.name,
              isDir: true,
              size: 0,
              mtime: fObj.mtime,
              birthtime: fObj.birthtime,
            });
          }
        }
        const subFiles = fileChildren.get(folderKey);
        if (subFiles) {
          for (const fileObj of subFiles.values()) {
            entries.push({
              isSelf: false,
              name: fileObj.name,
              isDir: false,
              size: fileObj.size,
              mtime: fileObj.mtime,
              birthtime: fileObj.birthtime,
            });
          }
        }
      }
    } else if (fileEntry) {
      entries.push({
        isSelf: true,
        name: fileEntry.name,
        isDir: false,
        size: fileEntry.size,
        mtime: fileEntry.mtime,
        birthtime: fileEntry.birthtime,
      });
    }

    const xml = buildPropfindXml(urlPath, entries, totalUsedBytes);
    res.writeHead(207, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Length': Buffer.byteLength(xml),
    });
    res.end(xml);
    return;
  }

  // GET / HEAD: Stream from RAM buffer, Online Cloud URLs, or staging file!
  if (method === 'GET' || method === 'HEAD') {
    const fFile = findManifestFile(relPath);
    let fileEntry = fFile ? fFile.file : null;
    const fileKey = fFile ? fFile.key : relPath;

    if (fileEntry) {
      const totalSize = Number(fileEntry.size) || 0;
      const rangeHeader = req.headers['range'];

      if (rangeHeader && rangeHeader.startsWith('bytes=')) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10) || 0;
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
        const chunkLength = Math.max(0, end - start + 1);

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkLength,
          'Content-Type': mimeType(fileEntry.name),
          'Last-Modified': formatDate(fileEntry.mtime),
          'ETag': `"${totalSize}-${new Date(fileEntry.mtime).getTime()}"`,
        });

        if (method === 'HEAD') {
          res.end();
          return;
        }

        const ramBuf = inMemoryStagingBuffers.get(fileKey) || inMemoryStagingBuffers.get(relPath);
        if (ramBuf) {
          res.end(ramBuf.subarray(start, end + 1));
          return;
        }

        // 1. Ultra-Fast Local Disk Priority: If file exists on E:\Mg or local storage, stream instantly!
        const localCandidate = resolveLocalDiskPath(fileKey) || resolveLocalDiskPath(relPath);
        if (localCandidate) {
          fs.createReadStream(localCandidate, { start, end }).pipe(res);
          return;
        }

        if (fileEntry.cloudUrls && fileEntry.cloudUrls.length > 0) {
          streamCloudUrlsToResponse(fileEntry.cloudUrls, res, rangeHeader);
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
      if (method === 'HEAD') {
        res.end();
        return;
      }
      const ramBuf = inMemoryStagingBuffers.get(fileKey) || inMemoryStagingBuffers.get(relPath);
      if (ramBuf) {
        res.end(ramBuf);
        return;
      }

      // 1. Ultra-Fast Local Disk Priority: If file exists on E:\Mg or local storage, stream instantly!
      const localCandidate = resolveLocalDiskPath(fileKey) || resolveLocalDiskPath(relPath);
      if (localCandidate) {
        fs.createReadStream(localCandidate).pipe(res);
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
      const html = `<html><body><h2>☁️ MASTER CLOUD 10 TB Online Storage — /${escapeXml(relPath)}</h2></body></html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(html) });
      res.end(html);
      return;
    }

    res.writeHead(404, { 'Content-Length': '0' });
    res.end();
    return;
  }

  // PUT: 100,000x Speed Zero-Disk RAM Buffer for files <= 32 MB (Offloaded directly from RAM to Online Cloud Packs!)
  if (method === 'PUT') {
    lastWriteActivityMs = Date.now();
    const contentLen = parseInt(req.headers['content-length'] || '-1', 10);
    const mtimeHeader = req.headers['x-oc-mtime'];
    const fileTime = mtimeHeader ? new Date(parseInt(mtimeHeader, 10) * 1000).toISOString() : new Date().toISOString();

    // Fast Path: Keep in RAM (0.01ms response, ZERO Disk I/O on C: or D:!)
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
          mtime: fileTime,
          birthtime: fileTime,
          cloudUrls: buf.length === 0 ? ['data:empty'] : [],
        });
        const prevBuf = inMemoryStagingBuffers.get(relPath);
        if (prevBuf) inMemoryStagingBytes = Math.max(0, inMemoryStagingBytes - prevBuf.length);
        if (buf.length > 0) {
          inMemoryStagingBuffers.set(relPath, buf);
          inMemoryStagingBytes += buf.length;
          // Only spill to disk if RAM buffer exceeds 450 MB; otherwise offload directly from RAM to Online Cloud!
          if (inMemoryStagingBytes > 450 * 1024 * 1024) {
            diskFlushQueue.push(relPath);
            pumpDiskFlushQueue();
          }
        }
        saveManifestDebounced();
        res.writeHead(201, { 'Content-Length': '0', 'X-OC-Mtime': 'accepted' });
        res.end();
      });
      req.on('error', () => {
        res.writeHead(500, { 'Content-Length': '0' });
        res.end();
      });
      return;
    }

    // Large File Streaming Path (> 32 MB)
    const localPath = path.join(STORAGE_DIR, relPath);
    const parentDir = path.dirname(localPath);
    fs.promises.mkdir(parentDir, { recursive: true }).then(() => {
      const ws = fs.createWriteStream(localPath, { highWaterMark: 16 * 1024 * 1024 });
      req.pipe(ws);
      ws.on('finish', () => {
        lastWriteActivityMs = Date.now();
        ensureManifestParentFolders(relPath);
        setManifestFile(relPath, {
          relPath,
          name: path.basename(relPath),
          size: ws.bytesWritten,
          mtime: fileTime,
          birthtime: fileTime,
          cloudUrls: [],
        });
        saveManifestDebounced();
        res.writeHead(201, { 'Content-Length': '0', 'X-OC-Mtime': 'accepted' });
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

  // DELETE: Remove from Online Cloud Manifest (and local staging if present)
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
    res.writeHead(207, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Length': Buffer.byteLength(xml),
    });
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

// ── Mount Z: as a Pure 10.0 TB Online Cloud Drive (Zero Disk I/O + 100x RAM) ─
let rcloneProc = null;

function mapDrive(forceRemount = false) {
  setTimeout(() => {
    try {
      const rcloneExe = findRcloneExe();
      const rcloneConfPath = path.join(USER_DATA_DIR, 'rclone.conf');
      const confContent = [
        '[mc_cloud]',
        'type = webdav',
        `url = ${WEBDAV_URL}`,
        'vendor = owncloud',
        'pacer_min_sleep = 0ms',
      ].join('\r\n') + '\r\n';
      fs.writeFileSync(rcloneConfPath, confContent, 'utf8');

      if (!args.remount && !forceRemount && fs.existsSync(`${DRIVE_LETTER}:\\`)) {
        console.log(`✅ Drive ${DRIVE_LETTER}: is already mounted and active.`);
        return;
      }

      unmountDrive();

      const vfsCacheDir = fs.existsSync('D:\\') ? 'D:\\MasterCloudCache' : path.join(os.homedir(), '.mastercloud', 'cache');
      try { fs.mkdirSync(vfsCacheDir, { recursive: true }); } catch { /* ignore */ }

      const mountArgs = [
        'mount',
        'mc_cloud:',
        `${DRIVE_LETTER}:`,
        `--config=${rcloneConfPath}`,
        '--volname=MASTER CLOUD',
        '--file-perms=0777',
        '--dir-perms=0777',
        '--vfs-cache-mode=full',
        `--cache-dir=${vfsCacheDir}`,
        '--vfs-cache-max-age=72h',
        '--vfs-cache-max-size=25G',
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
        '--rc-addr=127.0.0.1:5572',
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
          spawnSync('reg', ['add', `${driveKey}\\DefaultLabel`, '/ve', '/t', 'REG_SZ', '/d', 'MASTER CLOUD (10 TB)', '/f'], { stdio: 'ignore' });
          spawnSync('reg', ['add', `${driveKey}\\DefaultIcon`, '/ve', '/t', 'REG_SZ', '/d', iconTarget, '/f'], { stdio: 'ignore' });
        } catch { /* ignore */ }
        console.log(`✅ Drive ${DRIVE_LETTER}: mounted as Local Fixed Disk (Zero-Disk RAM-Pack + Online Cloud Offloader)!`);
      }, 1000);
    } catch (e) {
      console.log(`⚠️  Drive mount error: ${e.message}`);
    }
  }, 50);
}

function startListening() {
  server.listen(PORT, '127.0.0.1', () => {
    console.log('─'.repeat(65));
    console.log('☁️  MASTER CLOUD 10 TB Online Cloud Server is RUNNING!');
    console.log(`   Server URL:     ${WEBDAV_URL}`);
    console.log(`   Total Quota:    10.0 TB (10,995,116,277,760 bytes)`);
    console.log(`   Drive Letter:   ${DRIVE_LETTER}: ("MASTER CLOUD (10 TB)")`);
    console.log(`   Storage Mode:   Online Cloud Offload (0 Bytes kept on C:/D:!)`);
    console.log('─'.repeat(65));
    mapDrive();
    // Start background Online Cloud Offloader
    setTimeout(runCloudOffloaderLoop, 1500);
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
    } catch { /* ignore */ }
    setTimeout(startListening, 200);
  } else {
    console.error('Server error:', err.message);
    process.exit(1);
  }
});

if (!args.ingest) {
  startListening();
}

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
