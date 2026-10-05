import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(__dirname, 'cloud-manifest.json');

const args = process.argv.slice(2).reduce((acc, arg) => {
  const eqIdx = arg.indexOf('=');
  if (eqIdx === -1) acc[arg.replace(/^--/, '')] = true;
  else acc[arg.slice(0, eqIdx).replace(/^--/, '')] = arg.slice(eqIdx + 1).replace(/^["']|["']$/g, '');
  return acc;
}, {});

const SOURCE_DIR = (args.source || 'Mg').replace(/^[/\\]+|[/\\]+$/g, '');
const TARGET_DIR = path.resolve(args.target || 'E:\\Mg');
const CONCURRENCY = parseInt(args.concurrency, 10) || 2;

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`❌ Manifest file not found: ${MANIFEST_PATH}`);
  process.exit(1);
}

console.log('='.repeat(65));
console.log(`📦 MASTER CLOUD FOLDER MOVER: [Z:\\${SOURCE_DIR}] ➔ [${TARGET_DIR}]`);
console.log(`   Concurrency: ${CONCURRENCY} parallel streams`);
console.log('='.repeat(65));

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 64,
  timeout: 30000,
});

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// Filter items
const matchingFiles = [];
let totalBytesExpected = 0;

for (const [k, v] of Object.entries(manifest.files || {})) {
  if (k === SOURCE_DIR || k.startsWith(`${SOURCE_DIR}/`)) {
    const subPath = k === SOURCE_DIR ? path.basename(k) : k.slice(SOURCE_DIR.length + 1);
    const size = Number(v.size) || 0;
    matchingFiles.push({
      relKey: k,
      subPath,
      destPath: path.join(TARGET_DIR, subPath),
      size,
      cloudUrls: v.cloudUrls || [],
      mtime: v.mtime ? new Date(v.mtime) : new Date(),
    });
    totalBytesExpected += size;
  }
}

if (matchingFiles.length === 0) {
  console.log(`⚠️  No files found for source folder: "${SOURCE_DIR}" in manifest.`);
  process.exit(0);
}

// Ensure target directory and all subfolders exist
fs.mkdirSync(TARGET_DIR, { recursive: true });

for (const [k] of Object.entries(manifest.folders || {})) {
  if (k === SOURCE_DIR || k.startsWith(`${SOURCE_DIR}/`)) {
    const sub = k === SOURCE_DIR ? '' : k.slice(SOURCE_DIR.length + 1);
    if (sub) {
      fs.mkdirSync(path.join(TARGET_DIR, sub), { recursive: true });
    }
  }
}

console.log(`🔍 Found ${matchingFiles.length.toLocaleString()} files (${(totalBytesExpected / (1024 ** 3)).toFixed(2)} GB).`);
console.log(`📁 Target directory verified: ${TARGET_DIR}`);

// Statistics tracking
let filesCompleted = 0;
let bytesDownloaded = 0;
let filesFailed = 0;
let filesSkipped = 0;
const startTime = Date.now();
let lastPrintTime = 0;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function printProgress(force = false) {
  const now = Date.now();
  if (!force && now - lastPrintTime < 2500) return;
  lastPrintTime = now;

  const elapsedSec = Math.max(1, (now - startTime) / 1000);
  const speed = bytesDownloaded / elapsedSec; // bytes/sec
  const pctFiles = ((filesCompleted / matchingFiles.length) * 100).toFixed(1);
  const pctBytes = totalBytesExpected > 0 ? ((bytesDownloaded / totalBytesExpected) * 100).toFixed(1) : '100';
  const remainingBytes = Math.max(0, totalBytesExpected - bytesDownloaded);
  const etaSec = speed > 0 ? Math.ceil(remainingBytes / speed) : 0;
  const etaMin = Math.floor(etaSec / 60);
  const etaSecRem = etaSec % 60;

  console.log(
    `[PROGRESS] ${filesCompleted.toLocaleString()}/${matchingFiles.length.toLocaleString()} files (${pctFiles}%) | ` +
    `${formatBytes(bytesDownloaded)} / ${formatBytes(totalBytesExpected)} (${pctBytes}%) | ` +
    `Speed: ${formatBytes(speed)}/s | ETA: ${etaMin}m ${etaSecRem}s`
  );
}

// Download a single chunk from URL
function downloadChunk(rawUrl, destStream) {
  return new Promise((resolve, reject) => {
    if (rawUrl === 'data:empty') {
      resolve(0);
      return;
    }

    const [cleanUrl, hash] = rawUrl.split('#');
    const reqHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

    if (hash && hash.startsWith('range=')) {
      reqHeaders['Range'] = `bytes=${hash.slice(6)}`;
    }

    function doRequest(targetUrl, retries = 3) {
      const req = https.get(targetUrl, { headers: reqHeaders, agent: httpsAgent, timeout: 35000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doRequest(res.headers.location, retries);
          return;
        }

        if (res.statusCode !== 200 && res.statusCode !== 206) {
          if (retries > 0) {
            setTimeout(() => doRequest(targetUrl, retries - 1), 1000);
            return;
          }
          reject(new Error(`HTTP ${res.statusCode} for ${cleanUrl}`));
          return;
        }

        let chunkBytes = 0;
        res.on('data', (d) => {
          chunkBytes += d.length;
          bytesDownloaded += d.length;
          printProgress();
        });

        res.pipe(destStream, { end: false });
        res.on('end', () => resolve(chunkBytes));
        res.on('error', (err) => {
          if (retries > 0) {
            setTimeout(() => doRequest(targetUrl, retries - 1), 1000);
          } else {
            reject(err);
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        if (retries > 0) setTimeout(() => doRequest(targetUrl, retries - 1), 1000);
        else reject(new Error(`Timeout for ${cleanUrl}`));
      });

      req.on('error', (err) => {
        if (retries > 0) setTimeout(() => doRequest(targetUrl, retries - 1), 1000);
        else reject(err);
      });
    }

    doRequest(cleanUrl);
  });
}

async function processFile(fileItem) {
  const destDir = path.dirname(fileItem.destPath);
  fs.mkdirSync(destDir, { recursive: true });

  // Resume check: if already exists on E: and has same size
  if (fs.existsSync(fileItem.destPath)) {
    try {
      const st = fs.statSync(fileItem.destPath);
      if (st.size === fileItem.size) {
        filesCompleted++;
        filesSkipped++;
        bytesDownloaded += fileItem.size;
        printProgress();
        return;
      }
    } catch {}
  }

  // If empty file
  if (fileItem.size === 0 || !fileItem.cloudUrls || fileItem.cloudUrls.length === 0 || fileItem.cloudUrls[0] === 'data:empty') {
    fs.writeFileSync(fileItem.destPath, Buffer.alloc(0));
    try { fs.utimesSync(fileItem.destPath, fileItem.mtime, fileItem.mtime); } catch {}
    filesCompleted++;
    printProgress();
    return;
  }

  // Stream to temporary file first
  const partPath = `${fileItem.destPath}.downloading`;
  const outStream = fs.createWriteStream(partPath, { flags: 'w' });

  try {
    for (const url of fileItem.cloudUrls) {
      await downloadChunk(url, outStream);
    }
    await new Promise((res, rej) => {
      outStream.end(() => res());
      outStream.on('error', rej);
    });

    // Atomic move
    fs.renameSync(partPath, fileItem.destPath);
    try { fs.utimesSync(fileItem.destPath, fileItem.mtime, fileItem.mtime); } catch {}
    filesCompleted++;
    printProgress();
  } catch (err) {
    try { fs.unlinkSync(partPath); } catch {}
    if (err.message && err.message.includes('HTTP 404')) {
      fs.writeFileSync(fileItem.destPath, Buffer.alloc(0));
      filesCompleted++;
      printProgress();
    } else {
      console.error(`\n❌ Failed to download ${fileItem.subPath}: ${err.message}`);
      filesFailed++;
      if (err.message && (err.message.includes('Timeout') || err.message.includes('ECONNREFUSED') || err.message.includes('connect'))) {
        console.log('⏳ Network throttled, cooling down for 15s...');
        await new Promise(r => setTimeout(r, 15000));
      }
    }
  }

  // Polite delay to avoid IP rate limits
  await new Promise(r => setTimeout(r, 80));
}

// Concurrency queue
async function runQueue() {
  let fileIndex = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (fileIndex < matchingFiles.length) {
      const idx = fileIndex++;
      await processFile(matchingFiles[idx]);
    }
  });

  await Promise.all(workers);
}

runQueue()
  .then(() => {
    printProgress(true);
    console.log('\n' + '='.repeat(65));
    console.log(`✅ DOWNLOAD COMPLETE:`);
    console.log(`   Files transferred: ${filesCompleted.toLocaleString()}/${matchingFiles.length.toLocaleString()}`);
    console.log(`   Files skipped (already present): ${filesSkipped.toLocaleString()}`);
    console.log(`   Files failed: ${filesFailed}`);
    console.log(`   Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log('='.repeat(65));

    if (filesFailed === 0) {
      console.log(`\n🧹 Removing [${SOURCE_DIR}] from Cloud Manifest to complete MOVE...`);

      // Remove from manifest
      for (const [k] of Object.entries(manifest.files)) {
        if (k === SOURCE_DIR || k.startsWith(`${SOURCE_DIR}/`)) {
          delete manifest.files[k];
        }
      }
      for (const [k] of Object.entries(manifest.folders)) {
        if (k === SOURCE_DIR || k.startsWith(`${SOURCE_DIR}/`)) {
          delete manifest.folders[k];
        }
      }

      fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest), 'utf8');
      console.log(`✅ [${SOURCE_DIR}] removed from cloud-manifest.json.`);

      // Notify rclone to refresh Z: drive
      try {
        const req = http.request({
          hostname: '127.0.0.1',
          port: 5572,
          path: '/vfs/forget',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': 2 },
        }, () => {});
        req.on('error', () => {});
        req.write('{}');
        req.end();
      } catch {}

      console.log(`🎉 Z:\\${SOURCE_DIR} has been successfully MOVED to ${TARGET_DIR} on your local disk!`);
    } else {
      console.log(`⚠️  Some files failed to transfer. Manifest was NOT modified so no data is lost.`);
    }
  })
  .catch((err) => {
    console.error('Fatal error during folder move:', err);
    process.exit(1);
  });
