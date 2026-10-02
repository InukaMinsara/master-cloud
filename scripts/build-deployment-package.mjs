import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const rootDir = process.cwd();
const outputZipPath = path.join(rootDir, 'MASTER-CLOUD-READY.zip');

const zip = new JSZip();

// Excluded paths / patterns
const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'target',
  'cargo-target',
  'cargo-home',
  'cargo-temp',
  '.xkiro-session',
  '.xkiro-edge-session',
  '.xkiro-edge-native',
]);

const EXCLUDE_FILES = new Set([
  '.env',
  '.rclone-mount.log',
  'tsconfig.node.tsbuildinfo',
  'tsconfig.tsbuildinfo',
  'cloud-manifest.json',
  'cloud-manifest.safe-backup.json',
  'generated-keys.txt',
  'rclone.conf',
]);

function addDirectoryToZip(dirPath, zipFolder) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      if (EXCLUDE_DIRS.has(item.name)) continue;
      const subFolder = zipFolder.folder(item.name);
      addDirectoryToZip(fullPath, subFolder);
    } else if (item.isFile()) {
      if (EXCLUDE_FILES.has(item.name) || item.name.endsWith('.log') || item.name.endsWith('.tmp')) continue;
      const content = fs.readFileSync(fullPath);
      zipFolder.file(item.name, content);
    }
  }
}

console.log('📦 Generating MASTER-CLOUD-READY.zip production package...');

// Add root essential files
const rootFiles = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'netlify.toml',
  'README.md',
  '.env.example',
  '.gitignore',
  'index.html',
];

for (const file of rootFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    zip.file(file, fs.readFileSync(filePath));
  }
}

// Add folders
const foldersToAdd = ['src', 'public', 'desktop', 'supabase', 'releases'];
for (const folder of foldersToAdd) {
  const folderPath = path.join(rootDir, folder);
  if (fs.existsSync(folderPath)) {
    const zipSubFolder = zip.folder(folder);
    addDirectoryToZip(folderPath, zipSubFolder);
  }
}

// Add core scripts (without massive cache manifests)
const scriptsPath = path.join(rootDir, 'scripts');
if (fs.existsSync(scriptsPath)) {
  const scriptsFolder = zip.folder('scripts');
  const scriptFiles = fs.readdirSync(scriptsPath, { withFileTypes: true });
  for (const item of scriptFiles) {
    if (item.isFile() && !EXCLUDE_FILES.has(item.name) && !item.name.startsWith('cloud-manifest')) {
      scriptsFolder.file(item.name, fs.readFileSync(path.join(scriptsPath, item.name)));
    }
  }
}

// Write the zip stream
console.log('⏳ Compressing deployment archive...');
zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 },
}).then((buffer) => {
  fs.writeFileSync(outputZipPath, buffer);
  const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
  console.log(`✅ MASTER-CLOUD-READY.zip generated successfully! (${sizeMb} MB)`);
  console.log(`📍 Location: ${outputZipPath}`);
}).catch((err) => {
  console.error('❌ Failed to generate zip package:', err);
  process.exit(1);
});
