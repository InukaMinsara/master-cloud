import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const apkPath = path.join(rootDir, 'MasterCloud-Android-v1.0.apk');
const iosZipPath = path.join(rootDir, 'public', 'releases', 'MasterCloud-iOS-Xcode.zip');

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
  const url = req.url || '/';

  // Android APK Direct Download
  if (url === '/download' || url === '/MasterCloud.apk' || url.endsWith('.apk')) {
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

  // iOS Package Direct Download
  if (url === '/download-ios' || url.endsWith('Xcode.zip')) {
    if (!fs.existsSync(iosZipPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('iOS Package not found on server.');
    }
    const stat = fs.statSync(iosZipPath);
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Length': stat.size,
      'Content-Disposition': 'attachment; filename="MasterCloud-iOS-Xcode.zip"',
    });
    const readStream = fs.createReadStream(iosZipPath);
    readStream.pipe(res);
    return;
  }

  // Mobile-friendly Download Landing Page
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Master Cloud Mobile (Android &amp; iPhone)</title>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#090d16">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
      border-radius: 28px;
      padding: 32px 24px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      border-radius: 22px;
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
      font-weight: 800;
      margin-bottom: 8px;
      background: linear-gradient(to right, #60a5fa, #a5b4fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      display: inline-block;
      padding: 5px 14px;
      background: rgba(37, 99, 235, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #93c5fd;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn-android {
      display: block;
      width: 100%;
      padding: 16px 20px;
      background: linear-gradient(135deg, #059669, #10b981);
      color: #fff;
      text-decoration: none;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 700;
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
      margin-bottom: 12px;
      transition: all 0.2s;
    }
    .btn-ios {
      display: block;
      width: 100%;
      padding: 16px 20px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #fff;
      text-decoration: none;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 700;
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
      margin-bottom: 12px;
      transition: all 0.2s;
    }
    .btn:active {
      transform: scale(0.98);
    }
    .box {
      margin-top: 20px;
      text-align: left;
      background: rgba(255,255,255,0.03);
      padding: 16px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.07);
    }
    .box h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #cbd5e1;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .box ol {
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
    <h1>Master Cloud Mobile</h1>
    <div class="badge">10 TB Storage • Phone Edition</div>
    <p>Stream 4K videos, auto-backup photos, and access your 10 TB storage with 0-byte phone memory footprint.</p>
    
    <a href="/download" class="btn-android">🤖 Download Android APK (179 MB)</a>
    <a href="http://${primaryIp}:8766" class="btn-ios">🍏 Mount 10 TB in Apple "Files" App</a>
    <a href="/download-ios" style="display:inline-block; font-size:12px; color:#93c5fd; text-decoration:none; margin-top:8px;">📦 Download iOS Xcode Source Package (9.9 MB)</a>

    <div class="box">
      <h3>🍏 Mount 10 TB in iPhone "Files" (ගොනු) App:</h3>
      <ol>
        <li>Open the <b>Files</b> app on your iPhone.</li>
        <li>Tap <b>...</b> in top right &gt; <b>Connect to Server</b>.</li>
        <li>Enter <b>http://${primaryIp}:8766</b> and tap <b>Connect</b>.</li>
        <li>Select <b>Guest</b> &gt; tap <b>Next</b>. 10 TB storage appears right beside iCloud!</li>
      </ol>
    </div>

    <div class="box" style="margin-top:12px;">
      <h3>🤖 Android Installation:</h3>
      <ol>
        <li>Tap <b>Download Android APK</b>.</li>
        <li>Open and tap <b>Install</b>.</li>
      </ol>
    </div>
  </div>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Master Cloud Mobile Download Portal running!`);
  console.log(`📱 Phone URL: http://${primaryIp}:${PORT}`);
  console.log(`🤖 Android APK: http://${primaryIp}:${PORT}/download`);
  console.log(`🍏 iOS Package: http://${primaryIp}:${PORT}/download-ios`);
});
