#!/usr/bin/env node
/**
 * xkiro-bot.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * METHOD 3: Non-Stop 1,000,000 Key Generator Bot for xKiro (Microsoft Edge)
 *
 * Features:
 *   - Default target: 1,000,000 API keys (continuous non-stop generation!)
 *   - Unlimited / 24-Hour Login Wait Time (never times out while you log in)
 *   - Real-Time Instant Sync: Every single key is immediately saved to
 *     `scripts/generated-keys.txt` AND `src/services/apiKeyStore.ts` as soon
 *     as it is created (so you can stop anytime with Ctrl+C and keep all keys!)
 *   - Auto-recovers if a modal or network request ever slows down
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';

// Parse CLI arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const eqIdx = arg.indexOf('=');
  if (eqIdx === -1) {
    acc[arg.replace(/^--/, '')] = true;
  } else {
    const k = arg.slice(0, eqIdx).replace(/^--/, '');
    const v = arg.slice(eqIdx + 1).replace(/^["']|["']$/g, '');
    acc[k] = v;
  }
  return acc;
}, {});

const EMAIL = args.email || process.env.XKIRO_EMAIL || '';
const PASSWORD = args.password || process.env.XKIRO_PASSWORD || '';
const COUNT = parseInt(args.count, 10) || 1000000; // Default: 1,000,000 keys!
const OUTPUT_FILE = args.output || path.join(process.cwd(), 'scripts', 'generated-keys.txt');
const SESSION_DIR = path.join(process.cwd(), '.xkiro-edge-native');
const DEBUG_PORT = 9229;
const MAX_LOGIN_WAIT = 24 * 60 * 60 * 1000; // 24 Hours (Unlimited login time!)

function findEdgeExecutable() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env['PROGRAMFILES(X86)']
      ? path.join(process.env['PROGRAMFILES(X86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe')
      : '',
    process.env.PROGRAMFILES
      ? path.join(process.env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
      : '',
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
      : '',
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

async function getOpenTabs(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function copyToWindowsClipboard(text) {
  try {
    spawnSync('clip', [], { input: text, encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

function syncKeysToStore(outputFile) {
  try {
    const storePath = path.join(process.cwd(), 'src', 'services', 'apiKeyStore.ts');
    if (fs.existsSync(storePath) && fs.existsSync(outputFile)) {
      const allFileKeys = Array.from(
        new Set(
          fs.readFileSync(outputFile, 'utf8')
            .split(/\r?\n/)
            .map(k => k.trim())
            .filter(k => k.startsWith('sk-'))
        )
      );
      if (allFileKeys.length > 0) {
        let storeCode = fs.readFileSync(storePath, 'utf8');
        const arrayLiteral = `const BOT_GENERATED_KEYS = [\n${allFileKeys.map(k => `  '${k}',`).join('\n')}\n];`;
        storeCode = storeCode.replace(/const BOT_GENERATED_KEYS = \[[\s\S]*?\];/, arrayLiteral);
        storeCode = storeCode.replace(/const SEEDED_FLAG = 'mc_ak_seeded_v\d+';/, `const SEEDED_FLAG = 'mc_ak_seeded_v${allFileKeys.length}';`);
        fs.writeFileSync(storePath, storeCode, 'utf8');
        return allFileKeys.length;
      }
    }
  } catch {
    // ignore
  }
  return 0;
}

async function runBot() {
  const edgePath = findEdgeExecutable();
  if (!edgePath) {
    console.error('❌ Microsoft Edge (msedge.exe) could not be found on this PC.');
    process.exit(1);
  }

  console.log('─────────────────────────────────────────────────────────────────');
  console.log('🤖 Starting xKiro 1,000,000 Keys Continuous Auto-Generator Bot...');
  console.log(`   Browser:                 Microsoft Edge (Direct WebSocket CDP)`);
  console.log(`   Target Keys to Create:   ${COUNT.toLocaleString()} Keys`);
  console.log(`   Login Timeout:           UNLIMITED (24 Hours)`);
  console.log(`   Stop Anytime:            Press Ctrl + C (all keys auto-saved!)`);
  console.log('─────────────────────────────────────────────────────────────────');

  // Check if Edge debugging window is already open from previous run
  let tabs = await getOpenTabs(DEBUG_PORT);
  if (tabs.length > 0) {
    console.log('♻️  Reusing already-open Microsoft Edge session!');
  } else {
    console.log('🚀 Opening native Microsoft Edge window...');
    spawn(
      edgePath,
      [
        `--remote-debugging-port=${DEBUG_PORT}`,
        `--user-data-dir=${SESSION_DIR}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--start-maximized',
        'https://xkiro.com/dashboard/api/keys',
      ],
      {
        detached: true,
        stdio: 'ignore',
      }
    ).unref();

    await new Promise(r => setTimeout(r, 4000));
  }

  // Wait until user is logged in and on /dashboard
  const loginDeadline = Date.now() + MAX_LOGIN_WAIT;
  let targetTab = null;
  let printedLoginPrompt = false;

  while (Date.now() < loginDeadline) {
    tabs = await getOpenTabs(DEBUG_PORT);
    const pageTabs = tabs.filter(t => t.type === 'page');
    const dashTab = pageTabs.find(t => t.url && t.url.includes('xkiro.com/dashboard'));

    if (dashTab) {
      targetTab = dashTab;
      console.log(`\n✅ Logged-in xKiro Dashboard detected: ${dashTab.url}`);
      break;
    }

    if (!printedLoginPrompt) {
      printedLoginPrompt = true;
      console.log('\n=================================================================');
      console.log('🔓 PLEASE SIGN IN INSIDE THE OPENED MICROSOFT EDGE WINDOW');
      if (EMAIL) console.log(`   Email:    ${EMAIL}`);
      if (PASSWORD) console.log(`   Password: ${PASSWORD}`);
      console.log('   💡 Take as much time as you need (Unlimited Wait Time!).');
      console.log('   As soon as "/dashboard" loads, the bot will AUTOMATICALLY');
      console.log(`   start creating up to ${COUNT.toLocaleString()} keys non-stop!`);
      console.log('=================================================================\n');
    }

    const elapsedMin = Math.floor((Date.now() - (loginDeadline - MAX_LOGIN_WAIT)) / 60000);
    const elapsedSec = Math.floor(((Date.now() - (loginDeadline - MAX_LOGIN_WAIT)) % 60000) / 1000);
    process.stdout.write(`\r   ⏳ Waiting for login to reach /dashboard... (Elapsed: ${elapsedMin}m ${elapsedSec}s) `);
    await new Promise(r => setTimeout(r, 1500));
  }

  if (!targetTab) {
    console.error('\n❌ Timed out waiting for login.');
    process.exit(1);
  }

  // Connect directly to the xKiro page tab via native WebSocket (0ms, never hangs!)
  console.log('⚡ Connecting Direct WebSocket CDP to xKiro tab...');
  const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  const evalPage = (expression) =>
    new Promise((resolve) => {
      const id = Math.floor(Math.random() * 10000000) + 1;
      const timer = setTimeout(() => {
        ws.removeEventListener('message', handler);
        resolve(null);
      }, 15000);

      function handler(ev) {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.id === id) {
            clearTimeout(timer);
            ws.removeEventListener('message', handler);
            resolve(msg.result?.result?.value);
          }
        } catch {
          // ignore
        }
      }
      ws.addEventListener('message', handler);
      ws.send(
        JSON.stringify({
          id,
          method: 'Runtime.evaluate',
          params: {
            expression,
            awaitPromise: true,
            returnByValue: true,
          },
        })
      );
    });

  const newlyCreatedKeys = [];
  const seenKeys = new Set(
    fs.existsSync(OUTPUT_FILE)
      ? fs.readFileSync(OUTPUT_FILE, 'utf8').split(/\r?\n/).map(k => k.trim()).filter(Boolean)
      : []
  );

  // Graceful Ctrl+C handler so stopping anytime prints summary
  process.on('SIGINT', () => {
    const totalInStore = syncKeysToStore(OUTPUT_FILE);
    console.log('\n\n=================================================================');
    console.log(`🛑 Bot stopped by user (Ctrl+C).`);
    console.log(`🎉 Created in this session: ${newlyCreatedKeys.length.toLocaleString()} Key(s)`);
    console.log(`⚡ Total keys synced in Master Cloud Pool: ${totalInStore.toLocaleString()} Key(s)`);
    console.log(`📁 Saved to: ${OUTPUT_FILE}`);
    console.log('=================================================================\n');
    try { ws.close(); } catch {}
    process.exit(0);
  });

  // Make sure we are on /dashboard/api/keys
  const currentUrl = await evalPage('location.href');
  if (!currentUrl || !currentUrl.includes('/dashboard/api/keys')) {
    console.log('🧭 Navigating to https://xkiro.com/dashboard/api/keys ...');
    await evalPage(`location.href = 'https://xkiro.com/dashboard/api/keys'`);
    await new Promise(r => setTimeout(r, 4000));
  }

  // Wait up to 20s for the "Create new key" button to render
  console.log('⏳ Waiting for "Create new key" button to be ready...');
  for (let w = 0; w < 20; w++) {
    const ready = await evalPage(`(() => {
      const maybeBtns = Array.from(document.querySelectorAll('button'));
      for (const b of maybeBtns) {
        const txt = (b.innerText || '').trim().toLowerCase();
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        if (txt === 'maybe later' || aria === 'maybe later') b.click();
      }
      const createBtn = Array.from(document.querySelectorAll('button')).find(b => {
        const t = (b.innerText || '').trim().toLowerCase();
        return t === 'create new key' || t === 'create your first key';
      });
      return !!createBtn;
    })()`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  let consecutiveFailures = 0;

  for (let i = 1; i <= COUNT; i++) {
    const keyName = `mc-key-${Date.now().toString().slice(-6)}-${i}`;
    console.log(`\n⚙️  [${i.toLocaleString()}/${COUNT.toLocaleString()}] Auto-creating API key "${keyName}"...`);

    // Ensure any previous modal is closed first
    await evalPage(`(() => {
      try {
        if (navigator.clipboard) navigator.clipboard.writeText = async () => Promise.resolve();
      } catch {}
      const buttons = Array.from(document.querySelectorAll('button'));
      const copyBtn = buttons.find(b => (b.innerText || '').trim().toLowerCase().includes('copy api key'));
      if (copyBtn) copyBtn.click();
      const doneBtn = buttons.find(b => {
        const t = (b.innerText || '').trim().toLowerCase();
        return (t === 'done' || t === 'close' || t === 'cancel') && !b.disabled;
      });
      if (doneBtn) doneBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 450));

    // Step 1: Dismiss any "Maybe later" popup & click "Create new key"
    const step1 = await evalPage(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const maybe = buttons.find(b => (b.innerText || '').trim().toLowerCase() === 'maybe later' || (b.getAttribute('aria-label') || '').toLowerCase() === 'maybe later');
      if (maybe) maybe.click();

      const createBtn = buttons.find(b => {
        const t = (b.innerText || '').trim().toLowerCase();
        return t === 'create new key' || t === 'create your first key';
      });
      if (createBtn) {
        createBtn.click();
        return 'OPENED_MODAL';
      }
      return 'CREATE_BTN_NOT_FOUND';
    })()`);

    if (step1 !== 'OPENED_MODAL') {
      consecutiveFailures++;
      console.log(`   ⚠️ "Create new key" button busy (${step1}). Recovering...`);
      if (consecutiveFailures >= 3) {
        console.log('   🔄 Refreshing /dashboard/api/keys to clear modal state...');
        await evalPage(`location.href = 'https://xkiro.com/dashboard/api/keys'`);
        await new Promise(r => setTimeout(r, 5000));
        consecutiveFailures = 0;
      } else {
        await new Promise(r => setTimeout(r, 1500));
      }
      continue;
    }

    await new Promise(r => setTimeout(r, 850));

    // Step 2: Fill "Key name" input and click "Create key"
    const step2 = await evalPage(`(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const nameInput = inputs.find(inp =>
        (inp.placeholder || '').toLowerCase().includes('production') ||
        (inp.placeholder || '').toLowerCase().includes('my app') ||
        (inp.type === 'text' && inp.offsetParent !== null)
      );

      if (nameInput) {
        nameInput.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(nameInput, '${keyName}');
        } else {
          nameInput.value = '${keyName}';
        }
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => (b.innerText || '').trim().toLowerCase() === 'create key' && !b.disabled);
      if (submitBtn) {
        submitBtn.click();
        return 'CLICKED_CREATE_KEY';
      }
      return 'SUBMIT_BTN_NOT_FOUND';
    })()`);

    // Step 3: Poll up to 8 seconds for the `sk-xt-...` key to appear OR an account limit message
    let capturedKey = null;
    let limitErrorMsg = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise(r => setTimeout(r, 650));
      const revealData = await evalPage(`(() => {
        try {
          if (navigator.clipboard) navigator.clipboard.writeText = async () => Promise.resolve();
        } catch {}
        const allText = document.body.innerText || '';
        const inputVals = Array.from(document.querySelectorAll('input, code, pre'))
          .map(el => el.value || el.innerText || '')
          .join(' ');
        const combined = allText + ' ' + inputVals;
        const matches = combined.match(/sk-xt-[a-zA-Z0-9]{24,}/g);
        if (matches && matches.length > 0) {
          const copyBtn = Array.from(document.querySelectorAll('button')).find(b => {
            const t = (b.innerText || '').trim().toLowerCase();
            return t.includes('copy api key') || t === 'copy';
          });
          if (copyBtn) copyBtn.click();
          return { type: 'KEY', value: matches[0] };
        }

        // Check if xKiro displayed a maximum key limit message in the modal or toast
        const atMostMatch = allText.match(/You can create at most[^\n]+/i);
        if (atMostMatch) {
          return { type: 'LIMIT', value: atMostMatch[0].trim() };
        }

        const alerts = Array.from(document.querySelectorAll('[role="alert"], [role="status"], [data-sonner-toast], .text-destructive, .text-red-500'))
          .map(el => (el.innerText || '').trim())
          .filter(Boolean);
        for (const a of alerts) {
          const lower = a.toLowerCase();
          if (lower.includes('limit') || lower.includes('maximum') || lower.includes('at most') || lower.includes('too many') || lower.includes('upgrade') || lower.includes('reached')) {
            return { type: 'LIMIT', value: a };
          }
        }
        return null;
      })()`);

      if (revealData?.type === 'KEY' && !seenKeys.has(revealData.value)) {
        capturedKey = revealData.value;
        seenKeys.add(capturedKey);
        break;
      }
      if (revealData?.type === 'LIMIT') {
        limitErrorMsg = revealData.value;
        break;
      }
    }

    const reachedAccountMax = !!limitErrorMsg || consecutiveFailures >= 3;

    if (reachedAccountMax) {
      if (limitErrorMsg) {
        console.log(`\n🛑 Current Account Reached Max Limit: "${limitErrorMsg}"`);
      } else {
        console.log(`\n🛑 Current Account Reached Max 25 Keys Limit!`);
      }

      if (i < COUNT) {
        console.log('🔄 AUTO-LOGOUT: Logging out of current xKiro account and opening /login for the next account...');
        // Clear cookies via CDP & clear storage, then navigate to /login
        const clearId = Math.floor(Math.random() * 10000000) + 1;
        ws.send(JSON.stringify({ id: clearId, method: 'Network.clearBrowserCookies', params: {} }));
        await evalPage(`(() => {
          try { localStorage.clear(); sessionStorage.clear(); } catch {}
          location.href = 'https://xkiro.com/login';
        })()`);
        await new Promise(r => setTimeout(r, 3500));

        console.log('\n=================================================================');
        console.log('🔓 READY FOR NEXT ACCOUNT! (Create 25 Keys -> Auto-Logout -> Repeat)');
        console.log('   1. Register or Sign In with your next account in the Edge window.');
        console.log('      (Note: xKiro requires @gmail.com or @icloud.com emails).');
        console.log('   2. As soon as "/dashboard" loads, the bot will AUTOMATICALLY');
        console.log('      create 25 more keys, copy/sync them, log out, and repeat!');
        console.log('   3. Press Ctrl + C anytime to stop.');
        console.log('=================================================================\n');

        // Wait until next account reaches /dashboard
        while (true) {
          const urlNow = await evalPage('location.href');
          if (urlNow && urlNow.includes('/dashboard')) {
            console.log(`\n✅ Next Account Logged In! Navigating to /dashboard/api/keys...`);
            await evalPage(`location.href = 'https://xkiro.com/dashboard/api/keys'`);
            await new Promise(r => setTimeout(r, 5000));
            consecutiveFailures = 0;
            break;
          }
          process.stdout.write(`\r   ⏳ Waiting for next account login to reach /dashboard... `);
          await new Promise(r => setTimeout(r, 2000));
        }
        continue;
      } else {
        break;
      }
    }

    if (capturedKey) {
      consecutiveFailures = 0;
      newlyCreatedKeys.push(capturedKey);
      fs.appendFileSync(OUTPUT_FILE, capturedKey + '\n', 'utf8');
      copyToWindowsClipboard(capturedKey);
      const totalSynced = syncKeysToStore(OUTPUT_FILE);
      console.log(`   🔑 Auto-Created, Copied & Synced [#${newlyCreatedKeys.length}]: ${capturedKey} (Total in App Pool: ${totalSynced})`);
    } else {
      consecutiveFailures++;
      console.log(`   ⚠️ Key not revealed on attempt [#${i}] (Consecutive failures: ${consecutiveFailures}/3).`);
    }

    // Step 4: Wait until "Done" button is enabled and click it to close the modal cleanly
    for (let closeAttempt = 0; closeAttempt < 6; closeAttempt++) {
      await new Promise(r => setTimeout(r, 400));
      const closed = await evalPage(`(() => {
        try {
          if (navigator.clipboard) navigator.clipboard.writeText = async () => Promise.resolve();
        } catch {}
        const buttons = Array.from(document.querySelectorAll('button'));
        const copyBtn = buttons.find(b => (b.innerText || '').trim().toLowerCase().includes('copy api key'));
        if (copyBtn) copyBtn.click();
        const doneBtn = buttons.find(b => {
          const t = (b.innerText || '').trim().toLowerCase();
          return (t === 'done' || t === 'cancel') && !b.disabled;
        });
        if (doneBtn) {
          doneBtn.click();
          return true;
        }
        return false;
      })()`);
      if (closed) break;
    }

    await new Promise(r => setTimeout(r, 600));
  }

  ws.close();

  if (newlyCreatedKeys.length > 0) {
    const totalInStore = syncKeysToStore(OUTPUT_FILE);
    console.log('\n=================================================================');
    console.log(`🎉 SUCCESS! Automatically Created & Copied ${newlyCreatedKeys.length.toLocaleString()} Key(s)!`);
    console.log(`⚡ Total Keys Synced in Master Cloud Pool: ${totalInStore.toLocaleString()}`);
    console.log(`📋 Latest Key Copied to Windows Clipboard (Ctrl+V)!`);
    console.log(`📁 Saved to: ${OUTPUT_FILE}`);
    console.log('💡 Microsoft Edge was left open so you stay logged in!');
    console.log('=================================================================\n');
  }
}

runBot().catch(err => {
  console.error('\n❌ Bot error:', err.message);
  process.exit(1);
});
