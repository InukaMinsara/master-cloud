import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = path.join(os.homedir(), '.mastercloud');
const vbsPath = path.join(USER_DATA_DIR, 'start-cloud-drive.vbs');
const nodeExe = process.execPath;
const scriptPath = path.join(__dirname, 'webdav-server.mjs');

const vbsContent = [
  'Set WshShell = CreateObject("WScript.Shell")',
  `WshShell.Run """${nodeExe}"" ""${scriptPath}"" --port=8766 --drive=Z --user=immaster2024@gmail.com", 0, False`,
].join('\r\n') + '\r\n';

fs.writeFileSync(vbsPath, vbsContent, 'utf8');

// Also register in HKCU Run
spawnSync('reg', [
  'add',
  'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
  '/v',
  'MasterCloudDrive10TB',
  '/t',
  'REG_SZ',
  '/d',
  `wscript.exe "${vbsPath}"`,
  '/f',
], { stdio: 'ignore' });

// Launch detached via wscript
spawnSync('wscript.exe', [vbsPath], { stdio: 'ignore' });
console.log('✅ Master Cloud 10 TB persistent background service launched successfully!');
