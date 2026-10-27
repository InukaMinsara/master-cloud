import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const outputZip = path.join(rootDir, 'NETLIFY-WEB-DIST.zip');

const zip = new JSZip();

function addDirToZip(currentPath, zipNode) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'releases') continue; // exclude heavy Windows installer exes for instant upload
    const fullPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      const sub = zipNode.folder(entry.name);
      addDirToZip(fullPath, sub);
    } else {
      zipNode.file(entry.name, fs.readFileSync(fullPath));
    }
  }
}

addDirToZip(distDir, zip);

zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 6 },
}).then(buffer => {
  fs.writeFileSync(outputZip, buffer);
  const mb = (buffer.length / (1024 * 1024)).toFixed(2);
  console.log(`✅ NETLIFY-WEB-DIST.zip created (${mb} MB) at ${outputZip}`);
});
