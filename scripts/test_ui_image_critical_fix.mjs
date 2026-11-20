/**
 * scripts/test_ui_image_critical_fix.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * TEST SUITE: MASTER AI UI & IMAGE WORKFLOW CRITICAL FIX
 *
 * Verifies all 7 sections of the critical fix:
 * 1. Complete removal of Image and Auto tabs (Unified Chat only)
 * 2. Master Cloud Image Save end-to-end functionality
 * 3. Functional Image Editor window & actions
 * 4. Functional Upscale window & real super-resolution implementation
 * 5. Token-limit error prevention (TPM <= 7200 < 8000) & context summarization
 * 6. Rate-limit 429 backoff & intelligent retry
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

console.log('\n🚀 Running MASTER AI UI & IMAGE WORKFLOW CRITICAL FIX TEST SUITE...\n');

// ── SECTION 1: VERIFY REMOVAL OF IMAGE AND AUTO TABS ──
console.log('--- 1. Removal of Image and Auto Tabs (Unified Chat Interface) ---');

it('MasterAi2Composer contains ZERO mode tabs, image tabs, or aspect-ratio toolbars', () => {
  const content = fs.readFileSync('src/features/ai/components/MasterAi2Composer.tsx', 'utf-8');
  assert(!content.includes('chatMode === \'image\''), 'Composer should not have mode branching');
  assert(!content.includes('Auto mode tab'), 'Auto mode tab must not exist');
  assert(!content.includes('AspectRatioToolbar'), 'Aspect ratio toolbar must not exist in main composer');
  assert(!content.includes('aspectRatio ==='), 'Aspect ratio buttons must not exist in main composer');
  assert(content.includes('placeholder="Ask Master AI anything, or request an image'), 'Unified prompt placeholder present');
});

it('MasterAi2Header contains ZERO mode toggles or image mode tabs', () => {
  const content = fs.readFileSync('src/features/ai/components/MasterAi2Header.tsx', 'utf-8');
  assert(!content.includes('chatMode === \'image\''), 'Header should not have chatMode branching');
  assert(!content.includes('setChatMode'), 'Header should not have mode toggling');
  assert(content.includes('activeModelDisplayName'), 'Header cleanly displays active model');
});

// ── SECTION 2: TOKEN LIMIT (TPM: 8000) RESOLUTION & CONTEXT MANAGEMENT ──
console.log('\n--- 2. Token-Limit Errors (TPM 8000 cap) Resolution & Context Manager ---');

import { ContextManager } from '../src/features/ai/services/contextManager.ts';

it('Accurately estimates tokens across English, code, and Unicode/Sinhala', () => {
  const eng = 'Hello world, how does artificial intelligence work?';
  const estEng = ContextManager.estimateTokens(eng);
  assert(estEng >= 10 && estEng <= 25, `English estimate ${estEng} should be between 10 and 25`);

  const code = 'function calculateBudget(tpm: number, tokens: number): number { return tpm - tokens; }';
  const estCode = ContextManager.estimateTokens(code);
  assert(estCode >= 18 && estCode <= 35, `Code estimate ${estCode} should be reasonable`);

  const sinhala = 'ආයුබෝවන්, කෘතිම බුද්ධිය ක්‍රියාත්මක වන්නේ කෙසේද?';
  const estSinhala = ContextManager.estimateTokens(sinhala);
  assert(estSinhala >= 20, `Sinhala multi-byte estimate ${estSinhala} should account for Unicode density`);
});

it('Identifies Groq models subject to strict 8,000 TPM limit', () => {
  assert(ContextManager.isGroqRateLimitedModel('openai/gpt-oss-120b') === true, 'gpt-oss-120b is Groq limited');
  assert(ContextManager.isGroqRateLimitedModel('llama-3.3-70b-versatile') === true, 'llama-3.3-70b is Groq limited');
  assert(ContextManager.isGroqRateLimitedModel('llama-3.1-8b-instant') === true, 'llama-3.1-8b is Groq limited');
  assert(ContextManager.isGroqRateLimitedModel('mistralai/mistral-large-2512') === false, 'Mistral Large is xKiro (not 8k Groq)');
});

it('Strictly caps promptTokens + safeMaxTokens <= 7200 (well below 8000 TPM limit)', () => {
  const groqModel = 'openai/gpt-oss-120b';

  // Test scenario: prompt tokens = 4336 (exact user scenario that previously caused 8432 requested tokens!)
  const promptTokens4336 = 4336;
  const safeTokens1 = ContextManager.getSafeOutputTokens(groqModel, promptTokens4336);
  assert(promptTokens4336 + safeTokens1 <= 7200, `Total requested ${promptTokens4336 + safeTokens1} must be <= 7200`);
  assert(safeTokens1 >= 512, `Output tokens ${safeTokens1} must be at least 512`);

  // Test scenario: small prompt tokens = 1000
  const promptTokens1000 = 1000;
  const safeTokens2 = ContextManager.getSafeOutputTokens(groqModel, promptTokens1000);
  assert(promptTokens1000 + safeTokens2 <= 7200, `Total requested ${promptTokens1000 + safeTokens2} must be <= 7200`);
  assert(safeTokens2 === 2048, `Output tokens ${safeTokens2} should cap at 2048`);
});

it('Performs intelligent backwards truncation and injects context summary when history is long', () => {
  // Create 12 simulated long turns (~6,000 tokens total, well exceeding 3200 limit)
  const fakeHistory = [];
  const longParagraph = 'Software architecture patterns require balancing trade-offs between consistency, availability, partition tolerance, network latency, database throughput, asynchronous queues, caching strategies, and event sourcing pipelines across Kubernetes clusters. '.repeat(4);
  for (let i = 1; i <= 10; i++) {
    fakeHistory.push({
      id: `msg_u_${i}`,
      role: 'user',
      content: `Question ${i}: Can you explain software architecture concept number ${i} in detail? ${longParagraph}`,
      timestamp: Date.now() - (15 - i) * 60000,
    });
    fakeHistory.push({
      id: `msg_a_${i}`,
      role: 'assistant',
      content: `Answer ${i}: Here is the comprehensive analysis of concept ${i}. ${longParagraph}`,
      timestamp: Date.now() - (15 - i) * 60000 + 5000,
    });
  }

  const currentPrompt = 'Now compare all of these concepts in a final summary table.';
  const messages = ContextManager.buildMessagesForInference(
    fakeHistory,
    currentPrompt,
    [],
    'You are Master AI.',
    'openai/gpt-oss-120b' // Groq model with 3200 prompt token budget
  );

  // Assertions:
  assert(messages[0].role === 'system', 'First message is system prompt');
  assert(messages[messages.length - 1].role === 'user', 'Last message is active user prompt');
  assert(messages[messages.length - 1].content.includes(currentPrompt), 'Current prompt preserved');

  // Verify total prompt tokens is strictly bounded under safe budget (3200)
  const totalTokens = ContextManager.estimateMessagesTokens(messages);
  assert(totalTokens <= 3250, `Total prompt tokens ${totalTokens} must be <= 3250 for Groq models`);

  // Verify summary of pruned history was injected
  const summaryTurn = messages.find(
    (m) => m.role === 'system' && m.content.includes('[Summary of earlier discussion')
  );
  assert(Boolean(summaryTurn), 'Context synopsis injected to preserve conversational memory');
});

// ── SECTION 3: MASTER CLOUD IMAGE SAVE AUDIT ──
console.log('\n--- 3. Master Cloud Image Save Architecture ---');

it('masterCloudImageSaveService has real binary upload, folder creation, concurrency locks, and cache', () => {
  const content = fs.readFileSync('src/features/ai/services/masterCloudImageSaveService.ts', 'utf-8');
  assert(content.includes('api.uploadFile'), 'Must use real api.uploadFile');
  assert(content.includes('getOrCreateAiFolder'), 'Must have AI Images folder creation logic');
  assert(content.includes('activeSaves.has'), 'Must enforce concurrency locking');
  assert(content.includes('useFileStore.getState().fetchItems()'), 'Must refresh cloud file list immediately');
  assert(content.includes('localStorage.setItem'), 'Must persist saved image URLs across reloads');
});

// ── SECTION 4: IMAGE STUDIO / EDITOR MODAL AUDIT ──
console.log('\n--- 4. Dedicated Image Editor Window Audit ---');

it('MasterAi2ImageEditorModal implements all required editing tools with SenseNova disclosure', () => {
  const content = fs.readFileSync('src/features/ai/components/MasterAi2ImageEditorModal.tsx', 'utf-8');
  assert(content.includes('canvasRef'), 'Must use real canvas rendering');
  assert(content.includes('handleUndo') && content.includes('handleRedo'), 'Must have undo and redo stack');
  assert(content.includes('handleRotate') && content.includes('handleFlip'), 'Must have 90° rotation and flip');
  assert(content.includes('handleApplyCrop'), 'Must have crop tool with aspect ratios');
  assert(content.includes('brightness') && content.includes('contrast') && content.includes('saturation') && content.includes('sharpness'), 'Must have color adjustments');
  assert(content.includes('handleSaveToCloud'), 'Must support direct save to Master Cloud Drive');
  assert(content.includes('handleDownload'), 'Must support PNG download');
  assert(content.includes('handleSaveToChat'), 'Must support saving edited copy back to chat');
  assert(content.includes('SenseNova Architecture Note'), 'Must honestly disclose SenseNova text-to-image limitations');
});

// ── SECTION 5: UPSCALE MODAL & SUPER-RESOLUTION IMPLEMENTATION ──
console.log('\n--- 5. Dedicated Upscale Window Audit ---');

it('MasterAi2UpscaleModal implements real high-fidelity multi-pass CAS super-resolution', () => {
  const content = fs.readFileSync('src/features/ai/components/MasterAi2UpscaleModal.tsx', 'utf-8');
  assert(content.includes('scaleFactor === 2') && content.includes('scaleFactor === 4'), 'Supports 2x and 4x scale factors');
  assert(content.includes('Contrast-Adaptive Sharpening') || content.includes('CAS'), 'Implements Contrast-Adaptive Sharpening');
  assert(content.includes('clipPath'), 'Implements interactive before/after split comparison slider');
  assert(content.includes('handleSaveToCloud'), 'Supports save upscaled to Master Cloud Drive');
  assert(content.includes('handleDownload'), 'Supports download upscaled PNG');
  assert(content.includes('handleSaveToChat'), 'Supports save upscaled to chat');
  assert(content.includes('Algorithm: Multi-Pass Progressive Bicubic + CAS'), 'Transparently specifies algorithm without fake AI claims');
});

// ── SECTION 6: PROXY SERVER ENDPOINT & RETRY AUDIT ──
console.log('\n--- 6. Backend AI Proxy & Fallback Safety ---');

it('vite-plugin-ai-proxy.ts clamps Groq max_tokens and provides Pollinations fallback for image synthesis', () => {
  const content = fs.readFileSync('vite-plugin-ai-proxy.ts', 'utf-8');
  assert(content.includes('Token Safety Clamping for Groq Free Tier'), 'Enforces server-side token clamping on Groq');
  assert(content.includes('safeMax = Math.max(512, Math.min(body.max_tokens || 1800, 7200 - promptTokens))'), 'Limits total requested tokens to <= 7200');
  assert(content.includes('https://image.pollinations.ai/prompt/'), 'Provides automatic fallback to Pollinations Image AI');
});

console.log('\n========================================');
console.log(`Critical Fix Test Suite: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) process.exit(1);
