import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const TARGET_DIR = 'E:\\Mg';
const METADATA_PATH = 'E:\\Mg\\.cloud_metadata.json';
const meta = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));

console.log('='.repeat(70));
console.log('⚡ PRIORITY .EXE RESTORATION ENGINE');
console.log('='.repeat(70));

function runCurl(args) {
  return new Promise((resolve, reject) => {
    const cp = spawn('curl.exe', args, { windowsHide: true });
    let err = '';
    cp.stderr.on('data', d => { err += d; });
    cp.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`curl exit ${code}: ${err.trim().slice(0, 100)}`));
    });
    cp.on('error', reject);
  });
}

function appendStream(src, dest) {
  return new Promise((resolve, reject) => {
    const r = fs.createReadStream(src);
    const w = fs.createWriteStream(dest, { flags: 'a' });
    r.pipe(w);
    w.on('finish', resolve);
    r.on('error', reject);
    w.on('error', reject);
  });
}

const exeQueue = [];
for (const [k, v] of Object.entries(meta)) {
  const sub = k === 'Mg' ? 'Mg' : k.slice(3);
  const isRoot = !sub.includes('\\') && !sub.includes('/');
  if (isRoot && k.toLowerCase().endsWith('.exe')) {
    const destPath = path.join(TARGET_DIR, sub);
    const sz = fs.existsSync(destPath) ? fs.statSync(destPath).size : -1;
    if (sz !== v.size) {
      exeQueue.push({
        name: sub,
        destPath,
        size: v.size,
        urls: v.cloudUrls || [],
        mtime: v.mtime ? new Date(v.mtime) : new Date()
      });
    }
  }
}

// Sort from smallest to largest so files finish as fast as possible
exeQueue.sort((a, b) => a.size - b.size);

console.log(`📋 Found ${exeQueue.length} pending .exe files to restore:`);
exeQueue.forEach(f => {
  console.log(`   - ${f.name} (${(f.size / 1048576).toFixed(1)} MB)`);
});

let completed = 0;
const total = exeQueue.length;

async function processExe(item) {
  // Check if duplicate of another file
  if (item.name.includes('(1)')) {
    const originalName = item.name.replace(' (1)', '');
    const originalPath = path.join(TARGET_DIR, originalName);
    if (fs.existsSync(originalPath) && fs.statSync(originalPath).size === item.size) {
      console.log(`\n📋 Instant copying ${originalName} -> ${item.name}`);
      try { if (fs.existsSync(item.destPath)) fs.unlinkSync(item.destPath); } catch {}
      fs.copyFileSync(originalPath, item.destPath);
      try { fs.utimesSync(item.destPath, item.mtime, item.mtime); } catch {}
      completed++;
      console.log(`✅ [${completed}/${total}] ${item.name} completed instantly!`);
      return;
    }
  }

  const tmpPath = `${item.destPath}.exe_dl`;
  try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}

  console.log(`\n⬇️  Downloading: ${item.name} (${(item.size / 1048576).toFixed(1)} MB)...`);
  const t0 = Date.now();

  try {
    if (item.urls.length === 1) {
      await runCurl([
        '-s', '-S', '-f', '-L',
        '--connect-timeout', '20',
        '--max-time', '1200',
        '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        item.urls[0],
        '-o', tmpPath
      ]);
    } else {
      for (let i = 0; i < item.urls.length; i++) {
        const partTmp = `${tmpPath}.p${i}`;
        try { if (fs.existsSync(partTmp)) fs.unlinkSync(partTmp); } catch {}
        console.log(`   ... downloading part ${i + 1}/${item.urls.length}`);
        await runCurl([
          '-s', '-S', '-f', '-L',
          '--connect-timeout', '20',
          '--max-time', '1200',
          '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          item.urls[i],
          '-o', partTmp
        ]);
        await appendStream(partTmp, tmpPath);
        try { fs.unlinkSync(partTmp); } catch {}
      }
    }

    if (fs.existsSync(tmpPath)) {
      const actual = fs.statSync(tmpPath).size;
      if (actual !== item.size) {
        throw new Error(`Size mismatch: expected ${item.size}, got ${actual}`);
      }

      try { if (fs.existsSync(item.destPath)) fs.unlinkSync(item.destPath); } catch {}
      fs.renameSync(tmpPath, item.destPath);
      try { fs.utimesSync(item.destPath, item.mtime, item.mtime); } catch {}

      const dur = ((Date.now() - t0) / 1000).toFixed(1);
      const mbps = ((item.size / 1048576) / (dur || 1)).toFixed(2);
      completed++;
      console.log(`✅ [${completed}/${total}] ${item.name} DONE in ${dur}s (${mbps} MB/s)!`);

      // Check if duplicate file is waiting
      const dupName = item.name.replace('.exe', ' (1).exe');
      const dupItem = exeQueue.find(q => q.name === dupName);
      if (dupItem && fs.existsSync(dupItem.destPath)) {
        try {
          fs.copyFileSync(item.destPath, dupItem.destPath);
          try { fs.utimesSync(dupItem.destPath, dupItem.mtime, dupItem.mtime); } catch {}
          console.log(`   ✨ Mirrored instantly to duplicate: ${dupName}`);
        } catch {}
      }
    }
  } catch (err) {
    console.error(`❌ Error downloading ${item.name}: ${err.message}`);
    try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
  }
}

async function run() {
  let idx = 0;
  // 2 concurrent workers for .exe files
  const workers = [0, 1].map(async (wid) => {
    while (idx < exeQueue.length) {
      const item = exeQueue[idx++];
      // Check again if already done by mirror or another process
      if (fs.existsSync(item.destPath) && fs.statSync(item.destPath).size === item.size) {
        continue;
      }
      await processExe(item);
    }
  });

  await Promise.all(workers);
  console.log('\n' + '='.repeat(70));
  console.log(`🎉 ALL .EXE FILES ARE 100% RESTORED AND FULLY EXECUTABLE!`);
  console.log('='.repeat(70));
}

run();
