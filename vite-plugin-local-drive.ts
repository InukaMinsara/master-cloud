import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

const DRIVE_PATHS = ['Z:\\', 'D:\\MasterCloudDrive'];

function getDriveRoot(): string {
  for (const p of DRIVE_PATHS) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  return 'D:\\MasterCloudDrive';
}

function guessMimeType(ext: string): string {
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    txt: 'text/plain; charset=utf-8',
    md: 'text/markdown; charset=utf-8',
    json: 'application/json; charset=utf-8',
    js: 'text/javascript; charset=utf-8',
    jsx: 'text/javascript; charset=utf-8',
    ts: 'text/typescript; charset=utf-8',
    tsx: 'text/typescript; charset=utf-8',
    html: 'text/html; charset=utf-8',
    css: 'text/css; charset=utf-8',
    yaml: 'text/yaml; charset=utf-8',
    yml: 'text/yaml; charset=utf-8',
    xml: 'text/xml; charset=utf-8',
    csv: 'text/csv; charset=utf-8',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip',
    fig: 'application/octet-stream',
    msheet: 'application/json; charset=utf-8',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

let cachedItems: any[] = [];
let isScanning = false;
let lastScanTime = 0;
const SCAN_INTERVAL_MS = 10000;

async function scanDriveAsync(dir: string, baseDir: string = dir, maxDepth = 4, depth = 0): Promise<any[]> {
  if (depth > maxDepth) return [];
  const results: any[] = [];
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.name.startsWith('.') ||
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '$RECYCLE.BIN' ||
        entry.name === 'System Volume Information'
      ) {
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      const isDir = entry.isDirectory();
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const parentRel = path.dirname(relPath).replace(/\\/g, '/');

      let size = 0;
      let mtime = new Date().toISOString();
      let birthtime = mtime;

      if (!isDir) {
        try {
          const st = await fs.promises.stat(fullPath);
          size = st.size;
          mtime = st.mtime.toISOString();
          birthtime = st.birthtime.toISOString();
        } catch {
          // ignore stat errors
        }
      }

      results.push({
        relPath,
        name: entry.name,
        isDir,
        parentRelPath: parentRel === '.' ? null : parentRel,
        size,
        mtime,
        birthtime,
      });

      if (isDir) {
        const sub = await scanDriveAsync(fullPath, baseDir, maxDepth, depth + 1);
        results.push(...sub);
      }
    }
  } catch {
    // ignore directory read errors
  }
  return results;
}

function triggerBackgroundScan() {
  if (isScanning) return;
  const driveRoot = getDriveRoot();
  isScanning = true;
  scanDriveAsync(driveRoot)
    .then((items) => {
      cachedItems = items;
      lastScanTime = Date.now();
    })
    .catch(() => {})
    .finally(() => {
      isScanning = false;
    });
}

// Initial scan trigger on load
triggerBackgroundScan();

export function localDrivePlugin(): Plugin {
  return {
    name: 'vite-plugin-local-drive',
    configureServer(server) {
      // Trigger background scan on server startup
      triggerBackgroundScan();

      // 1. List files & folders from local drive (Z:\ or D:\MasterCloudDrive) with strict account isolation
      server.middlewares.use('/api/local-drive/list', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end();
          return;
        }

        const urlObj = new URL(req.url || '', 'http://localhost');
        let requestedUser = urlObj.searchParams.get('user')?.trim().toLowerCase();
        const sessionFile = path.join(process.env.USERPROFILE || process.env.HOME || '', '.mastercloud', 'active-web-session.json');
        if (!requestedUser && fs.existsSync(sessionFile)) {
          try {
            const s = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
            if (s && s.email) requestedUser = s.email.trim().toLowerCase();
          } catch {}
        }
        if (!requestedUser) requestedUser = 'immaster2024@gmail.com';

        const isMounted = fs.existsSync('Z:\\');
        if (!isMounted) {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: true,
              isMounted: false,
              driveLetter: null,
              user: requestedUser,
              items: [],
            })
          );
          return;
        }

        // Non-admin user isolation: Do not leak admin files from Z: or D:\MasterCloudDrive
        if (requestedUser !== 'immaster2024@gmail.com') {
          const safeKey = requestedUser.replace(/[^a-zA-Z0-9_-]/g, '_');
          const userManifestPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.mastercloud', `cloud-manifest-${safeKey}.json`);
          let userItems: any[] = [];
          if (fs.existsSync(userManifestPath)) {
            try {
              const uManifest = JSON.parse(fs.readFileSync(userManifestPath, 'utf8'));
              for (const [rel, f] of Object.entries((uManifest.files || {}) as Record<string, any>)) {
                userItems.push({
                  relPath: f.relPath || rel,
                  name: f.name || rel,
                  isDir: false,
                  parentRelPath: null,
                  size: f.size || 0,
                  mtime: f.mtime || new Date().toISOString(),
                  birthtime: f.birthtime || new Date().toISOString(),
                });
              }
              for (const [rel, fd] of Object.entries((uManifest.folders || {}) as Record<string, any>)) {
                userItems.push({
                  relPath: fd.relPath || rel,
                  name: fd.name || rel,
                  isDir: true,
                  parentRelPath: null,
                  size: 0,
                  mtime: fd.mtime || new Date().toISOString(),
                  birthtime: fd.birthtime || new Date().toISOString(),
                });
              }
            } catch {}
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: true,
              isMounted: true,
              driveLetter: 'Z:',
              drivePath: 'Z:\\',
              user: requestedUser,
              items: userItems,
            })
          );
          return;
        }

        const driveRoot = 'Z:\\';
        const now = Date.now();
        if (now - lastScanTime > SCAN_INTERVAL_MS) {
          triggerBackgroundScan();
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            ok: true,
            isMounted: true,
            driveLetter: 'Z:',
            drivePath: driveRoot,
            user: requestedUser,
            items: cachedItems,
          })
        );
      });

function resolveLocalPath(cleanRelPath: string): string | null {
  const norm = cleanRelPath.replace(/\\/g, '/');
  const sub = norm.startsWith('Mg/') ? norm.slice(3) : norm;
  const candidates = [
    path.join('E:\\Mg', sub),
    path.join('E:\\Mg', norm),
    path.join('E:\\', norm),
    path.join(getDriveRoot(), norm),
    path.join('D:\\MasterCloudDrive', norm),
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

      // 2. Read & stream file bytes for preview & download
      server.middlewares.use('/api/local-drive/read', (req, res) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.statusCode = 405;
          res.end();
          return;
        }

        try {
          const driveRoot = getDriveRoot();
          const urlObj = new URL(req.url || '', 'http://localhost');
          const rawRelPath = urlObj.searchParams.get('path') || '';
          const cleanRelPath = rawRelPath.replace(/^[/\\]+/, '').replace(/\\/g, '/');

          if (!cleanRelPath || cleanRelPath.includes('..')) {
            res.statusCode = 400;
            res.end('Invalid path parameter');
            return;
          }

          const resolvedTarget = resolveLocalPath(cleanRelPath);
          const targetPath = resolvedTarget || path.join(driveRoot, cleanRelPath);
          if (fs.existsSync(targetPath)) {
            const stat = fs.statSync(targetPath);
            if (stat.isDirectory()) {
              res.statusCode = 400;
              res.end('Path is a directory');
              return;
            }

            const ext = cleanRelPath.split('.').pop() || '';
            const mime = guessMimeType(ext);

            const range = req.headers.range;
            if (range) {
              const parts = range.replace(/bytes=/, '').split('-');
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
              const chunkSize = end - start + 1;

              res.statusCode = 206;
              res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
              res.setHeader('Accept-Ranges', 'bytes');
              res.setHeader('Content-Length', chunkSize);
              res.setHeader('Content-Type', mime);
              res.setHeader('Cache-Control', 'public, max-age=3600');

              if (req.method === 'HEAD') {
                res.end();
                return;
              }

              const stream = fs.createReadStream(targetPath, { start, end });
              stream.on('error', (err) => {
                if (!res.headersSent) {
                  res.statusCode = 500;
                }
                res.end();
              });
              stream.pipe(res);
              return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', mime);
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=3600');

            if (req.method === 'HEAD') {
              res.end();
              return;
            }

            const stream = fs.createReadStream(targetPath);
            stream.on('error', (err) => {
              if (!res.headersSent) {
                res.statusCode = 500;
              }
              res.end();
            });
            stream.pipe(res);
            return;
          }

          // Fallback: Check cloud-manifest.json
          const manifestPath = path.resolve(process.cwd(), 'scripts', 'cloud-manifest.json');
          if (fs.existsSync(manifestPath)) {
            try {
              const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
              let fileRecord = manifest.files?.[cleanRelPath];
              if (!fileRecord) {
                const lower = cleanRelPath.toLowerCase();
                for (const [k, v] of Object.entries(manifest.files || {})) {
                  if (k.toLowerCase() === lower) {
                    fileRecord = v as any;
                    break;
                  }
                }
              }
              if (!fileRecord) {
                const clean = cleanRelPath.replace(/ \(\d+\)(\.[^.]+)$/, '$1');
                const lowerClean = clean.toLowerCase();
                for (const [k, v] of Object.entries(manifest.files || {})) {
                  if (k.toLowerCase() === lowerClean) {
                    fileRecord = v as any;
                    break;
                  }
                }
              }
              if (fileRecord?.cloudUrls?.[0]) {
                res.writeHead(302, { Location: fileRecord.cloudUrls[0] });
                res.end();
                return;
              }
            } catch {
              // ignore
            }
          }

          res.statusCode = 404;
          res.end('File not found on Z: drive');
        } catch (err: any) {
          res.statusCode = 500;
          res.end('Failed to stream file: ' + err.message);
        }
      });

      // 3. Write / upload files to drive
      server.middlewares.use('/api/local-drive/upload', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }

        try {
          const driveRoot = getDriveRoot();
          const encodedRel = req.headers['x-file-path'] || '';
          const relPath = decodeURIComponent(String(encodedRel)).replace(/^[/\\]+/, '');

          if (!relPath || relPath.includes('..')) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: 'Invalid path' }));
            return;
          }

          const targetPath = path.join(driveRoot, relPath);
          const targetDir = path.dirname(targetPath);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          const writeStream = fs.createWriteStream(targetPath);
          req.pipe(writeStream);

          writeStream.on('finish', () => {
            triggerBackgroundScan();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, relPath }));
          });

          writeStream.on('error', (err) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: err.message }));
          });
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });

      // 4. File system operations (mkdir, rename, delete)
      server.middlewares.use('/api/local-drive/fs-op', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const driveRoot = getDriveRoot();
            const { op, relPath, newRelPath } = JSON.parse(body || '{}');

            if (!relPath || String(relPath).includes('..')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Invalid relPath' }));
              return;
            }

            const target = path.join(driveRoot, String(relPath));
            if (op === 'mkdir') {
              if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
            } else if (op === 'delete') {
              if (fs.existsSync(target)) {
                fs.rmSync(target, { recursive: true, force: true });
              }
            } else if (op === 'rename') {
              if (newRelPath && !String(newRelPath).includes('..')) {
                const newTarget = path.join(driveRoot, String(newRelPath));
                if (fs.existsSync(target)) fs.renameSync(target, newTarget);
              }
            }

            triggerBackgroundScan();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        });
      });
    },
  };
}
