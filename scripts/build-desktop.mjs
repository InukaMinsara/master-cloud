import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDesktop = path.join(rootDir, 'dist-desktop');

console.log('🧹 Cleaning dist-desktop directory...');
try {
  if (fs.existsSync(distDesktop)) {
    fs.rmSync(distDesktop, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  }
} catch (e) {
  console.warn('Cleanup warning:', e.message);
}

console.log('🔨 Compiling Master Cloud Desktop with electron-builder...');
execSync('npx electron-builder --win --x64', { cwd: rootDir, stdio: 'inherit' });

console.log('📦 Updating public/releases/MasterCloudSetup.exe...');
const setupExe = path.join(distDesktop, 'Master Cloud Setup 1.0.0.exe');
const targetExe = path.join(rootDir, 'public', 'releases', 'MasterCloudSetup.exe');

if (fs.existsSync(setupExe)) {
  fs.mkdirSync(path.dirname(targetExe), { recursive: true });
  fs.copyFileSync(setupExe, targetExe);

  const fileBuffer = fs.readFileSync(targetExe);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
  const sizeMb = (fileBuffer.length / (1024 * 1024)).toFixed(1);

  console.log(`✅ Setup copied! Size: ${sizeMb} MB | SHA256: ${hash}`);

  // Update DownloadPage.tsx
  const dlPagePath = path.join(rootDir, 'src', 'pages', 'public', 'DownloadPage.tsx');
  if (fs.existsSync(dlPagePath)) {
    let content = fs.readFileSync(dlPagePath, 'utf8');
    content = content.replace(/const INSTALLER_SHA256\s*=\s*'[^']*';/, `const INSTALLER_SHA256  = '${hash}';`);
    content = content.replace(/const INSTALLER_SIZE\s*=\s*'[^']*';/, `const INSTALLER_SIZE    = '${sizeMb} MB';`);
    fs.writeFileSync(dlPagePath, content, 'utf8');
    console.log('✅ DownloadPage.tsx updated with new SHA256 & size!');
  }
}
