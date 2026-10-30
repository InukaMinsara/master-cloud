import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const apkPath = path.join(rootDir, 'MasterCloud-Android-v1.0.apk');

// Find local Wi-Fi IPv4 address (prioritizing 192.168.1.x)
function getLocalIps() {
  const ips = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  // Sort so 192.168.1.x or non-virtualbox comes first
  ips.sort((a, b) => {
    if (a.startsWith('192.168.1.')) return -1;
    if (b.startsWith('192.168.1.')) return 1;
    return 0;
  });
  return ips;
}

const localIps = getLocalIps();
const primaryIp = localIps[0] || '192.168.1.164';
const PORT = 8899;

const server = http.createServer((req, res) => {
  if (req.url === '/download' || req.url === '/MasterCloud.apk' || req.url?.endsWith('.apk')) {
    if (!fs.existsSync(apkPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('APK not found on server.');
    }
    const stat = fs.statSync(apkPath);
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': stat.size,
      'Content-Disposition': 'attachment; filename="MasterCloud-Android-v1.0.apk"',
    });
    const readStream = fs.createReadStream(apkPath);
    readStream.pipe(res);
    return;
  }

  // Mobile-friendly Download Landing Page
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Master Cloud Android App</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #090d16;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: #111827;
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      border-radius: 20px;
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
    }
    .logo svg {
      width: 44px;
      height: 44px;
      fill: none;
      stroke: #fff;
      stroke-width: 2;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(to right, #60a5fa, #a5b4fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(37, 99, 235, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #93c5fd;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 16px 20px;
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      color: #fff;
      text-decoration: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
      transition: all 0.2s;
    }
    .btn:active {
      transform: scale(0.98);
    }
    .steps {
      margin-top: 24px;
      text-align: left;
      background: rgba(255,255,255,0.03);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .steps h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #cbd5e1;
      margin-bottom: 8px;
    }
    .steps ol {
      padding-left: 20px;
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
      </svg>
    </div>
    <h1>Master Cloud</h1>
    <div class="badge">Android v1.0 • 10 TB Virtual Drive</div>
    <p>Install the native Master Cloud Android app to access your 10 TB storage, stream media, and backup your phone with zero space usage.</p>
    
    <a href="/download" class="btn">📥 Download APK (179 MB)</a>

    <div class="steps">
      <h3>Quick Installation Steps:</h3>
      <ol>
        <li>Tap <b>Download APK</b> above.</li>
        <li>Open the downloaded file and select <b>Install</b> (allow Unknown Sources if prompted).</li>
        <li>Open Master Cloud and sign in to access your 10 TB storage!</li>
      </ol>
    </div>
  </div>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Master Cloud Android Download Portal running!`);
  console.log(`📱 Phone URL: http://${primaryIp}:${PORT}`);
  console.log(`📥 Direct APK: http://${primaryIp}:${PORT}/download`);
});
