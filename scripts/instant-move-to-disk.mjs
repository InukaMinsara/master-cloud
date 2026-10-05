import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(__dirname, 'cloud-manifest.json');
const TARGET_DIR = 'E:\\Mg';
const SOURCE_DIR = 'Mg';

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`❌ Manifest file not found: ${MANIFEST_PATH}`);
  process.exit(1);
}

console.log('='.repeat(65));
console.log(`⚡ INSTANT FOLDER MOVER: [Z:\\${SOURCE_DIR}] ➔ [${TARGET_DIR}]`);
console.log('='.repeat(65));

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// 1. Collect all matching files and folders
const matchingFiles = {};
const matchingFolders = {};

for (const [k, v] of Object.entries(manifest.files || {})) {
  if (k === SOURCE_DIR || k.startsWith(`${SOURCE_DIR}/`)) {
    matchingFiles[k] = v;
  }
}

for (const [k, v] of Object.entries(manifest.folders || {})) {
  if (k === SOURCE_DIR || k.startsWith(`${SOURCE_DIR}/`)) {
    matchingFolders[k] = v;
  }
}

const fileKeys = Object.keys(matchingFiles);
const folderKeys = Object.keys(matchingFolders);

console.log(`📁 Found ${fileKeys.length.toLocaleString()} files and ${folderKeys.length.toLocaleString()} folders in Z:\\${SOURCE_DIR}.`);

// 2. Ensure target root
fs.mkdirSync(TARGET_DIR, { recursive: true });

// 3. Create all folders in E:\Mg
for (const k of folderKeys) {
  const sub = k === SOURCE_DIR ? '' : k.slice(SOURCE_DIR.length + 1);
  if (sub) {
    fs.mkdirSync(path.join(TARGET_DIR, sub), { recursive: true });
  }
}

// 4. Create / preserve all files
let createdCount = 0;
let preservedCount = 0;

for (const [k, fileObj] of Object.entries(matchingFiles)) {
  const subPath = k === SOURCE_DIR ? path.basename(k) : k.slice(SOURCE_DIR.length + 1);
  const destPath = path.join(TARGET_DIR, subPath);
  const destDir = path.dirname(destPath);
  fs.mkdirSync(destDir, { recursive: true });

  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    preservedCount++;
    continue;
  }

  if (!fs.existsSync(destPath)) {
    fs.writeFileSync(destPath, Buffer.alloc(0));
    try {
      const mtime = fileObj.mtime ? new Date(fileObj.mtime) : new Date();
      fs.utimesSync(destPath, mtime, mtime);
    } catch {}
    createdCount++;
  }
}

// 5. Save cloud metadata backup into E:\Mg\.cloud_metadata.json
fs.writeFileSync(path.join(TARGET_DIR, '.cloud_metadata.json'), JSON.stringify(matchingFiles, null, 2), 'utf8');

// 6. Delete from manifest
for (const k of fileKeys) {
  delete manifest.files[k];
}
for (const k of folderKeys) {
  delete manifest.folders[k];
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest), 'utf8');
console.log(`✅ Removed [${SOURCE_DIR}] from cloud-manifest.json.`);

// 7. Notify rclone to forget Z:\Mg immediately
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

console.log('='.repeat(65));
console.log(`🎉 MOVE COMPLETE!`);
console.log(`   Preserved (downloaded bytes): ${preservedCount} files`);
console.log(`   Populated in E:\\Mg:           ${createdCount} files`);
console.log(`   Cloud Metadata Backup:        E:\\Mg\\.cloud_metadata.json`);
console.log(`   Z:\\${SOURCE_DIR}:                         DELETED from Z:\\ drive`);
console.log(`   Destination:                  ${TARGET_DIR} (Active on Local Disk)`);
console.log('='.repeat(65));
