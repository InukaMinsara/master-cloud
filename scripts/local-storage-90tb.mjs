#!/usr/bin/env node
/**
 * local-storage-90tb.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER STORAGE — Private 90 TB Offline Local Drive (Drive I:)
 *
 * Features:
 *   1. 100% Offline & Private Local Storage:
 *      NOT connected to the cloud, NO external uploads, NO internet dependency.
 *      All files physically reside on local disk (D:\MasterStorage_I).
 *   2. Virtual 90 TB Capacity:
 *      Displays as a 90.0 TB local fixed disk in Windows File Explorer via
 *      RFC 4331 WebDAV quota (98,956,046,499,840 bytes).
 *   3. Native Disk Speed:
 *      Direct streaming writes and reads with full HTTP byte-range seeking.
 *   4. Permanent Startup Persistence:
 *      Automatically mounts on Windows boot/logon silently in the background.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 90 TB in bytes (90 * 1024^4)
const NINETY_TB_BYTES = 90 * 1024 * 1024 * 1024 * 1024; // 98,956,046,499,840 bytes
const USER_DATA_DIR = path.join(os.homedir(), '.mastercloud');
try { fs.mkdirSync(USER_DATA_DIR, { recursive: true }); } catch { /* ignore */ }

const args = process.argv.slice(2).reduce((acc, arg) => {
  const eqIdx = arg.indexOf('=');
  if (eqIdx === -1) acc[arg.replace(/^--/, '')] = true;
  else acc[arg.slice(0, eqIdx).replace(/^--/, '')] = arg.slice(eqIdx + 1).replace(/^["']|["']$/g, '');
  return acc;
}, {});

const PORT = parseInt(args.port, 10) || 8770;
const DRIVE_LETTER = (args.drive || 'I').toUpperCase().replace(':', '');

// Choose physical directory on fastest available local disk
const defaultStorageDir = fs.existsSync('D:\\') ? 'D:\\MasterStorage_I' : 'C:\\MasterStorage_I';
const STORAGE_DIR = args.folder || defaultStorageDir;
try { fs.mkdirSync(STORAGE_DIR, { recursive: true }); } catch { /* ignore */ }

// Initialize welcome readme if empty
const readmePath = path.join(STORAGE_DIR, 'MASTER STORAGE - README.txt');
if (!fs.existsSync(readmePath)) {
  const readmeContent = [
    '=================================================================',
    '  MASTER STORAGE - PRIVATE LOCAL 90 TB DRIVE (I:)',
    '=================================================================',
    '',
    `  Drive Letter : ${DRIVE_LETTER}:\\`,
    '  Total Quota  : 90.0 TB Virtual Storage',
    `  Physical Dir : ${STORAGE_DIR}`,
    '  Cloud Sync   : NONE (100% Offline & Private Local Storage)',
    '  Auto-Mount   : Enabled (Automatically mounts on Windows startup)',
    '',
    '  Any file or folder placed here is stored purely on your local',
    '  hard drive. No internet connection or cloud service is used.',
    '=================================================================',
  ].join('\r\n') + '\r\n';
  try { fs.writeFileSync(readmePath, readmeContent, 'utf8'); } catch { /* ignore */ }
}

const WEBDAV_URL = `http://127.0.0.1:${PORT}`;

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

function calculateUsedBytes(dir) {
  let total = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        total += calculateUsedBytes(full);
      } else if (ent.isFile()) {
        try { total += fs.statSync(full).size; } catch {}
      }
    }
  } catch {}
  return total;
}

let cachedUsedBytes = 0;
let lastUsedCheckTime = 0;
function getUsedBytes() {
  const now = Date.now();
  if (now - lastUsedCheckTime > 5000) {
    cachedUsedBytes = calculateUsedBytes(STORAGE_DIR);
    lastUsedCheckTime = now;
  }
  return cachedUsedBytes;
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
        'vendor = other',
        'pacer_min_sleep = 0ms',
      ].join('\r\n') + '\r\n';
      fs.writeFileSync(rcloneConfPath, confContent, 'utf8');

      unmountDrive();

      const mountArgs = [
        'mount',
        'mc_storage_i:',
        `${DRIVE_LETTER}:`,
        `--config=${rcloneConfPath}`,
        '--volname=MASTER STORAGE (90 TB)',
        '--file-perms=0777',
        '--dir-perms=0777',
        '--vfs-cache-mode=off', // Direct native stream to local disk!
        '--poll-interval=0',
        '--transfers=16',
        '--checkers=16',
        '--buffer-size=64M',
        '--no-modtime=false',
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
          const driveKey = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\DriveIcons\\${DRIVE_LETTER}`;
          spawnSync('reg', ['add', `${driveKey}\\DefaultLabel`, '/ve', '/t', 'REG_SZ', '/d', 'MASTER STORAGE (90 TB)', '/f'], { stdio: 'ignore' });
          spawnSync('reg', ['add', `${driveKey}\\DefaultIcon`, '/ve', '/t', 'REG_SZ', '/d', 'imageres.dll,-32', '/f'], { stdio: 'ignore' });
        } catch {}
        console.log(`✅ Drive ${DRIVE_LETTER}: mounted as Local Fixed Disk (90.0 TB Offline Storage)!`);
      }, 1000);
    } catch (e) {
      console.error(`⚠️ Drive mount error: ${e.message}`);
    }
  }, 100);
}

// ── Startup & Boot Persistence Registration ─────────────────────────────────
function registerStartupPersistence() {
  const vbsPath = path.join(USER_DATA_DIR, 'start-storage-90tb.vbs');
  const scriptPath = path.resolve(fileURLToPath(import.meta.url));
  const nodeExe = process.execPath;

  const vbsContent = [
    'Set WshShell = CreateObject("WScript.Shell")',
    `WshShell.Run """${nodeExe}"" """ & "${scriptPath}"" --port=${PORT} --drive=${DRIVE_LETTER}", 0, False`,
  ].join('\r\n') + '\r\n';
  fs.writeFileSync(vbsPath, vbsContent, 'utf8');

  // 1. Registry Run Key
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

  // 2. Windows Startup Folder
  try {
    const startupDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    if (fs.existsSync(startupDir)) {
      const batPath = path.join(startupDir, 'MasterStorage90TB.vbs');
      fs.writeFileSync(batPath, vbsContent, 'utf8');
    }
  } catch {}

  // 3. Task Scheduler (At logon)
  try {
    spawnSync('schtasks', [
      '/create',
      '/tn',
      'MasterStorage90TB',
      '/tr',
      `wscript.exe "${vbsPath}"`,
      '/sc',
      'onlogon',
      '/rl',
      'highest',
      '/f',
    ], { stdio: 'ignore' });
  } catch {}

  console.log('✅ Auto-Start registered permanently across Registry, Startup Folder, and Task Scheduler!');
}

if (args.install) {
  registerStartupPersistence();
  mapDrive();
}

// ── WebDAV Helpers ──────────────────────────────────────────────────────────
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
    const used = getUsedBytes();
    const payload = JSON.stringify({
      ok: true,
      driveLetter: `${DRIVE_LETTER}:`,
      totalQuotaBytes: NINETY_TB_BYTES,
      usedBytes: used,
      availableBytes: Math.max(0, NINETY_TB_BYTES - used),
      storageDir: STORAGE_DIR,
      isMounted: fs.existsSync(`${DRIVE_LETTER}:\\`),
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

  // Resolve local file path
  const localTarget = path.normalize(path.join(STORAGE_DIR, relPath));
  if (!localTarget.startsWith(path.normalize(STORAGE_DIR))) {
    res.writeHead(403, { 'Content-Length': '0' });
    res.end();
    return;
  }

  // PROPFIND
  if (method === 'PROPFIND') {
    const depth = req.headers['depth'] || '1';
    const usedBytes = getUsedBytes();

    if (!fs.existsSync(localTarget)) {
      res.writeHead(404, { 'Content-Length': '0' });
      res.end();
      return;
    }

    try {
      const st = fs.statSync(localTarget);
      const entries = [];

      // Self entry
      entries.push({
        name: relPath ? path.basename(localTarget) : '',
        isDir: st.isDirectory(),
        size: st.size,
        mtime: st.mtime.toISOString(),
        birthtime: (st.birthtime || st.mtime).toISOString(),
        isSelf: true,
      });

      // Child entries if depth === '1' and it is a directory
      if (st.isDirectory() && depth !== '0') {
        const files = fs.readdirSync(localTarget, { withFileTypes: true });
        for (const f of files) {
          try {
            const childFull = path.join(localTarget, f.name);
            const childStat = fs.statSync(childFull);
            entries.push({
              name: f.name,
              isDir: f.isDirectory(),
              size: childStat.size,
              mtime: childStat.mtime.toISOString(),
              birthtime: (childStat.birthtime || childStat.mtime).toISOString(),
              isSelf: false,
            });
          } catch {}
        }
      }

      const xml = buildPropfindXml(urlPath, entries, usedBytes);
      res.writeHead(207, {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Length': Buffer.byteLength(xml),
      });
      res.end(xml);
      return;
    } catch {
      res.writeHead(500, { 'Content-Length': '0' });
      res.end();
      return;
    }
  }

  // GET & HEAD
  if (method === 'GET' || method === 'HEAD') {
    if (!fs.existsSync(localTarget)) {
      res.writeHead(404, { 'Content-Length': '0' });
      res.end();
      return;
    }

    try {
      const st = fs.statSync(localTarget);
      if (st.isDirectory()) {
        const html = `<html><body><h2>💾 MASTER STORAGE (90 TB) — /${escapeXml(relPath)}</h2><p>100% Offline Local Storage</p></body></html>`;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(html) });
        res.end(html);
        return;
      }

      const range = req.headers['range'];
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : st.size - 1;
        const chunksize = (end - start) + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${st.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mimeType(localTarget),
        });
        if (method === 'HEAD') { res.end(); return; }
        fs.createReadStream(localTarget, { start, end }).pipe(res);
        return;
      }

      res.writeHead(200, {
        'Content-Type': mimeType(localTarget),
        'Content-Length': st.size,
        'Accept-Ranges': 'bytes',
        'Last-Modified': formatDate(st.mtime),
        'ETag': `"${st.size}-${st.mtime.getTime()}"`,
      });
      if (method === 'HEAD') { res.end(); return; }
      fs.createReadStream(localTarget).pipe(res);
      return;
    } catch {
      res.writeHead(500, { 'Content-Length': '0' });
      res.end();
      return;
    }
  }

  // PUT: Native Direct Stream to Local Disk
  if (method === 'PUT') {
    try {
      fs.mkdirSync(path.dirname(localTarget), { recursive: true });
      const ws = fs.createWriteStream(localTarget);
      req.pipe(ws);
      ws.on('finish', () => {
        lastUsedCheckTime = 0; // Invalidate cached size
        res.writeHead(201, { 'Content-Length': '0' });
        res.end();
      });
      ws.on('error', () => {
        res.writeHead(500, { 'Content-Length': '0' });
        res.end();
      });
      return;
    } catch {
      res.writeHead(500, { 'Content-Length': '0' });
      res.end();
      return;
    }
  }

  // MKCOL: Create Directory
  if (method === 'MKCOL') {
    try {
      fs.mkdirSync(localTarget, { recursive: true });
      res.writeHead(201, { 'Content-Length': '0' });
      res.end();
      return;
    } catch {
      res.writeHead(500, { 'Content-Length': '0' });
      res.end();
      return;
    }
  }

  // DELETE
  if (method === 'DELETE') {
    if (!fs.existsSync(localTarget)) {
      res.writeHead(404, { 'Content-Length': '0' });
      res.end();
      return;
    }
    try {
      fs.rmSync(localTarget, { recursive: true, force: true });
      lastUsedCheckTime = 0;
      res.writeHead(204, { 'Content-Length': '0' });
      res.end();
      return;
    } catch {
      res.writeHead(500, { 'Content-Length': '0' });
      res.end();
      return;
    }
  }

  // MOVE & COPY
  if (method === 'MOVE' || method === 'COPY') {
    const dest = req.headers['destination'];
    if (!dest) { res.writeHead(400, { 'Content-Length': '0' }); res.end(); return; }
    try {
      const destUrl = new URL(dest, WEBDAV_URL);
      const destRel = decodeURIComponent(destUrl.pathname).replace(/^\/+|\/+$/g, '');
      const destTarget = path.normalize(path.join(STORAGE_DIR, destRel));

      if (!destTarget.startsWith(path.normalize(STORAGE_DIR))) {
        res.writeHead(403, { 'Content-Length': '0' });
        res.end();
        return;
      }

      fs.mkdirSync(path.dirname(destTarget), { recursive: true });

      if (method === 'MOVE') {
        fs.renameSync(localTarget, destTarget);
      } else {
        fs.cpSync(localTarget, destTarget, { recursive: true });
      }

      lastUsedCheckTime = 0;
      res.writeHead(201, { 'Content-Length': '0' });
      res.end();
      return;
    } catch {
      res.writeHead(500, { 'Content-Length': '0' });
      res.end();
      return;
    }
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

function startListening() {
  server.listen(PORT, '127.0.0.1', () => {
    console.log('═'.repeat(65));
    console.log('💾 MASTER STORAGE 90 TB Private Offline Server is RUNNING!');
    console.log(`   Drive Letter:   ${DRIVE_LETTER}: ("MASTER STORAGE (90 TB)")`);
    console.log(`   Total Quota:    90.0 TB (${NINETY_TB_BYTES.toLocaleString()} bytes)`);
    console.log(`   Physical Path:  ${STORAGE_DIR}`);
    console.log(`   Cloud Status:   100% OFFLINE (No Cloud Sync / No Internet Dependency)`);
    console.log(`   Server URL:     ${WEBDAV_URL}`);
    console.log('═'.repeat(65));

    registerStartupPersistence();
    mapDrive();
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
