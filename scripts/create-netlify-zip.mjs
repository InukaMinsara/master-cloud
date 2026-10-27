import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const outputZip = path.join(rootDir, 'NETLIFY-DEPLOY.zip');

if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist! Run npm run build first.');
  process.exit(1);
}

const zip = new JSZip();

function addDirToZip(currentPath, zipNode) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      const sub = zipNode.folder(entry.name);
      addDirToZip(fullPath, sub);
    } else {
      zipNode.file(entry.name, fs.readFileSync(fullPath));
    }
  }
}

console.log('📦 Packaging dist folder into NETLIFY-DEPLOY.zip...');
addDirToZip(distDir, zip);

zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 },
}).then(buffer => {
  fs.writeFileSync(outputZip, buffer);
  const mb = (buffer.length / (1024 * 1024)).toFixed(2);
  console.log(`✅ NETLIFY-DEPLOY.zip created successfully! (${mb} MB)`);
  console.log(`📍 Path: ${outputZip}`);
}).catch(err => {
  console.error('Failed to create zip:', err);
  process.exit(1);
});
