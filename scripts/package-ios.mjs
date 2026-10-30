import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const iosDir = path.join(rootDir, 'ios');
const publicReleasesDir = path.join(rootDir, 'public', 'releases');
const distReleasesDir = path.join(rootDir, 'dist', 'releases');

fs.mkdirSync(publicReleasesDir, { recursive: true });
fs.mkdirSync(distReleasesDir, { recursive: true });

const zip = new JSZip();

function addDirectoryToZip(dirPath, zipFolder) {
  if (!fs.existsSync(dirPath)) return;
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const item of items) {
    // Skip Pods, DerivedData, .build
    if (['Pods', 'DerivedData', '.build', '.git', 'xcuserdata'].includes(item.name)) continue;

    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      const subFolder = zipFolder.folder(item.name);
      addDirectoryToZip(fullPath, subFolder);
    } else {
      // If file is larger than 10MB, skip (e.g. big raw video/dumps)
      const stat = fs.statSync(fullPath);
      if (stat.size < 15 * 1024 * 1024) {
        zipFolder.file(item.name, fs.readFileSync(fullPath));
      }
    }
  }
}

console.log('📦 Packaging Master Cloud iOS Native Project...');
addDirectoryToZip(iosDir, zip.folder('ios'));

// Add README for iOS developers
zip.file('README-IOS.md', `# Master Cloud - iOS & iPhone Native App Project

This package contains the complete Xcode project and Capacitor 8 configuration for Master Cloud.

## Requirements
- macOS Ventura / Sonoma / Sequoia
- Xcode 15+ or 16+
- Node.js 18+

## Quick Start on Mac:
1. Extract this zip file into your Master Cloud directory.
2. Run:
   \`\`\`bash
   npm install
   npm run build
   npx cap sync ios
   npx cap open ios
   \`\`\`
3. In Xcode:
   - Select your Development Team in Signing & Capabilities.
   - Choose your connected iPhone (or Simulator).
   - Press **Cmd + R** to Build & Run!

## Native Features Enabled:
- Full 10 TB Virtual Drive on iPhone (0-byte disk consumption via on-demand streaming)
- Apple "Files" App integration (UIFileSharingEnabled & LSSupportsOpeningDocumentsInPlace)
- Photo Library & 4K Camera instant cloud auto-backup
- Dark Mode iOS Status Bar
- Capacitor 8 native bridge
`);

const outPath1 = path.join(publicReleasesDir, 'MasterCloud-iOS-Xcode.zip');
const outPath2 = path.join(distReleasesDir, 'MasterCloud-iOS-Xcode.zip');
const outPathRoot = path.join(rootDir, 'MasterCloud-iOS-Xcode.zip');

zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  .then((buffer) => {
    fs.writeFileSync(outPath1, buffer);
    fs.writeFileSync(outPath2, buffer);
    fs.writeFileSync(outPathRoot, buffer);
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
    console.log(`✅ Master Cloud iOS Package generated successfully! (${sizeMb} MB)`);
    console.log(`   Location: ${outPath1}`);
  })
  .catch((err) => {
    console.error('❌ Failed to package iOS zip:', err);
    process.exit(1);
  });
