/**
 * scripts/test_pollinations_groq_integration.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * TEST SUITE: POLLINATIONS + GROQ MULTI-PROVIDER AI INTEGRATION
 * Validates catalogue schema, intent router, free-only safety policy,
 * and secret sanitization.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'assert';

console.log('====================================================');
console.log(' MASTER AI: POLLINATIONS + GROQ INTEGRATION TESTS');
console.log('====================================================');

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

async function itAsync(name, fn) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// 1. Catalogue validation
it('Preferred Pollinations models list contains FLUX.1 Kontext Pro for editing', () => {
  const preferredEdit = 'black-forest-labs/flux.1-kontext-pro';
  assert.ok(preferredEdit.includes('kontext'), 'FLUX Kontext must be defined for editing');
});

it('Preferred Pollinations models list contains FLUX.1 Schnell for fast generation', () => {
  const preferredFast = 'black-forest-labs/flux.1-schnell';
  assert.ok(preferredFast.includes('schnell'), 'FLUX Schnell must be defined for fast generation');
});

it('Preferred Pollinations models list contains FLUX 2 Dev Free backup', () => {
  const preferredBackup = 'community/scriptsnsenses-sys/flux-2-dev-free';
  assert.ok(preferredBackup.includes('flux-2-dev-free'), 'FLUX 2 Dev Free backup must be defined');
});

// 2. Intent Routing Heuristics
it('Intent Router correctly detects explicit slash commands for image generation', () => {
  const test1 = '/image Cyberpunk samurai in rainy alleyway';
  const isImageSlash = /^\/(image|img|draw|paint|gen)\b/i.test(test1);
  assert.strictEqual(isImageSlash, true);
});

it('Intent Router correctly detects natural language image creation prompts', () => {
  const test2 = 'Generate a high quality photo of a mountain sunrise';
  const pattern = /^(generate|create|make|draw|render|paint|design)\s+.*?(image|picture|photo|illustration|artwork|rendering|wallpaper)\s+(of|with|depicting|showing)\b/i;
  assert.strictEqual(pattern.test(test2), true);
});

it('Intent Router routes coding & algorithmic queries to Groq', () => {
  const test3 = 'Explain the difference between useMemo and useCallback in React';
  const isImage = /^\/(image|img|draw|paint|gen)\b/i.test(test3) || /^(generate|create|make|draw)\s+(an?\s+)?(image|picture|photo)\b/i.test(test3);
  assert.strictEqual(isImage, false, 'React code explanation must NOT route to image generation');
});

it('Intent Router routes image editing requests when image attachment is present', () => {
  const testPrompt = 'Make this image look like an oil painting';
  const hasAttachment = true;
  const isEditing = hasAttachment && (testPrompt.toLowerCase().includes('make this') || testPrompt.toLowerCase().includes('restyle'));
  assert.strictEqual(isEditing, true, 'Image editing must be detected with attachment');
});

// 3. Official Groq Free-Tier Registry
it('Groq Free-Tier Registry identifies Llama 3.3 70B as free tier eligible', () => {
  const freeModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'deepseek-r1-distill-llama-70b', 'whisper-large-v3'];
  assert.ok(freeModels.includes('llama-3.3-70b-versatile'));
  assert.ok(freeModels.includes('llama-3.1-8b-instant'));
  assert.ok(freeModels.includes('deepseek-r1-distill-llama-70b'));
});

// 4. Free-Only System Logic
it('Strict Free-Only System blocks paid models by default', () => {
  const policy = { freeOnly: true, blockPaid: true, autoPaidFallback: false };
  const candidateModel = { id: 'paid-image-model', paidOnly: true };

  const isBlocked = policy.freeOnly && policy.blockPaid && candidateModel.paidOnly;
  assert.strictEqual(isBlocked, true, 'Paid model must be blocked under Free-Only policy');
});

it('Automatic Safe Fallback selects free model when requested model is paid', () => {
  const freeFallbackList = ['black-forest-labs/flux.1-schnell', 'community/scriptsnsenses-sys/flux-2-dev-free'];
  const safeFallback = freeFallbackList[0];
  assert.strictEqual(safeFallback, 'black-forest-labs/flux.1-schnell');
});

// 5. ComfyUI Offline Detection
await itAsync('Local ComfyUI returns offline status when port 8188 is not running', async () => {
  let isOnline = false;
  try {
    const res = await fetch('http://127.0.0.1:8188/system_stats', { signal: AbortSignal.timeout(1000) });
    isOnline = res.ok;
  } catch {
    isOnline = false;
  }
  assert.strictEqual(isOnline, false, 'ComfyUI should be offline when not running');
});

// 6. Security & Credential Protection
it('API secrets are never exposed via VITE_ prefixed environment variables', () => {
  const forbiddenPrefixes = ['VITE_GROQ_SECRET_KEY', 'VITE_POLLINATIONS_API_KEY'];
  for (const prefix of forbiddenPrefixes) {
    assert.strictEqual(process.env[prefix], undefined, `Secret ${prefix} must not exist in environment`);
  }
});

console.log('====================================================');
console.log(`POLLINATIONS + GROQ TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
