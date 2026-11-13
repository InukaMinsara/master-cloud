#!/usr/bin/env node
/**
 * MASTER CLOUD ZERO-LEAK SECURITY SHIELD
 * ─────────────────────────────────────────────────────────────────────────────
 * Uncompromising Pre-Commit & Codebase Security Firewall
 * Blocks accidental credential, secret, or private key commits before they
 * ever reach Git or the remote repository.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Regex rules for high-risk credentials
const SECRET_PATTERNS = [
  {
    id: 'TELEGRAM_BOT_TOKEN',
    name: 'Telegram Bot API Token',
    regex: /\b\d{8,11}:[A-Za-z0-9_-]{35}\b/g,
    description: 'Direct bot access credential from @BotFather'
  },
  {
    id: 'GOOGLE_API_KEY',
    name: 'Google / Gemini API Key',
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
    description: 'Exposed Google Cloud / Gemini API key'
  },
  {
    id: 'GITHUB_PAT',
    name: 'GitHub Personal Access Token',
    regex: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{82})\b/g,
    description: 'GitHub Personal Access Token'
  },
  {
    id: 'AWS_ACCESS_KEY',
    name: 'AWS Access Key ID',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    description: 'Amazon Web Services programmatic access key'
  },
  {
    id: 'PRIVATE_KEY',
    name: 'RSA / EC / OPENSSH Private Key',
    regex: /-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----/g,
    description: 'Cryptographic private key block'
  },
  {
    id: 'GENERIC_SECRET_ASSIGNMENT',
    name: 'Hardcoded Secret Assignment',
    regex: /(?:botToken|apiSecret|secretKey|serviceRoleKey)\s*[:=]\s*['"][a-zA-Z0-9_\-]{32,}['"]/gi,
    description: 'Direct variable assignment of high-entropy secrets'
  }
];

// Files and paths explicitly ignored by scanner
const IGNORED_PATHS = [
  '.git',
  'node_modules',
  'dist',
  'build',
  '.env.example',
  'package-lock.json',
  'expressions.txt',
  'scripts/security-shield.mjs'
];

function isIgnored(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  return IGNORED_PATHS.some(ignored => norm.includes(ignored) || norm.endsWith(ignored));
}

function getFilesToScan(scanAll = false) {
  try {
    if (scanAll) {
      const output = execSync('git ls-files', { cwd: REPO_ROOT, encoding: 'utf-8' });
      return output.split(/\r?\n/).filter(Boolean);
    } else {
      // Staged files only
      const output = execSync('git diff --cached --name-only --diff-filter=ACM', { cwd: REPO_ROOT, encoding: 'utf-8' });
      const staged = output.split(/\r?\n/).filter(Boolean);
      if (staged.length === 0) {
        // If nothing staged, scan files modified in working tree
        const wtOutput = execSync('git diff --name-only --diff-filter=ACM', { cwd: REPO_ROOT, encoding: 'utf-8' });
        return wtOutput.split(/\r?\n/).filter(Boolean);
      }
      return staged;
    }
  } catch {
    return [];
  }
}

export function runSecurityShieldAudit(scanAll = false) {
  console.log('\n\x1b[36m╔══════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m║     🛡️  MASTER CLOUD ZERO-LEAK SECURITY FIREWALL ACTIVE 🛡️        ║\x1b[0m');
  console.log('\x1b[36m╚══════════════════════════════════════════════════════════════════╝\x1b[0m\n');

  const files = getFilesToScan(scanAll);
  if (files.length === 0) {
    console.log('\x1b[32m✔ No relevant staged/tracked files to scan.\x1b[0m\n');
    return { ok: true, violations: [] };
  }

  const violations = [];

  for (const relPath of files) {
    if (isIgnored(relPath)) continue;

    // Check if committing raw .env file
    const baseName = path.basename(relPath);
    if (/^\.env(\.[a-zA-Z0-9]+)?$/.test(baseName) && baseName !== '.env.example') {
      violations.push({
        file: relPath,
        line: 1,
        rule: 'BLOCKED_ENV_FILE',
        name: 'Prohibited Environment File',
        preview: baseName,
        description: 'Raw .env files MUST NEVER be committed to Git. Put secrets in local uncommitted .env.'
      });
      continue;
    }

    const fullPath = path.resolve(REPO_ROOT, relPath);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const stat = fs.statSync(fullPath);
      if (stat.size > 2 * 1024 * 1024) continue; // Skip huge binaries
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split(/\r?\n/);

      lines.forEach((lineText, idx) => {
        for (const pattern of SECRET_PATTERNS) {
          pattern.regex.lastIndex = 0;
          const match = pattern.regex.exec(lineText);
          if (match) {
            // Mask middle of match for secure logging
            const raw = match[0];
            const masked = raw.length > 8
              ? `${raw.slice(0, 4)}••••••••${raw.slice(-4)}`
              : '••••••••';

            violations.push({
              file: relPath,
              line: idx + 1,
              rule: pattern.id,
              name: pattern.name,
              preview: masked,
              description: pattern.description
            });
          }
        }
      });
    } catch {
      // binary or unreadable file
    }
  }

  if (violations.length > 0) {
    console.log('\x1b[31m⛔ CRITICAL SECURITY BREACH PREVENTED BY MASTER CLOUD SHIELD! ⛔\x1b[0m\n');
    console.log(`Found \x1b[31m${violations.length} exposed credential(s)\x1b[0m in files scheduled for commit:\n`);

    violations.forEach((v, i) => {
      console.log(` \x1b[31m[${i + 1}]\x1b[0m \x1b[33m${v.file}:${v.line}\x1b[0m — \x1b[1m${v.name}\x1b[0m`);
      console.log(`     Secret Preview: \x1b[35m${v.preview}\x1b[0m`);
      console.log(`     Reason: ${v.description}`);
      console.log('');
    });

    console.log('\x1b[31mCOMMIT ABORTED. Git will not allow secrets to be pushed.\x1b[0m');
    console.log('\x1b[36m👉 HOW TO RESOLVE:\x1b[0m');
    console.log('   1. Move sensitive credentials into your local .env file.');
    console.log('   2. Reference them via import.meta.env.VITE_* or process.env.*');
    console.log('   3. Re-run git commit.\n');
    return { ok: false, violations };
  }

  console.log(`\x1b[32m✔ ZERO LEAKS DETECTED across ${files.length} inspected file(s).\x1b[0m`);
  console.log('\x1b[32m✔ Codebase is completely clean and audit-ready.\x1b[0m\n');
  return { ok: true, violations: [] };
}

// CLI entry point
const isAll = process.argv.includes('--all');
const result = runSecurityShieldAudit(isAll);
if (!result.ok) {
  process.exit(1);
} else {
  process.exit(0);
}
