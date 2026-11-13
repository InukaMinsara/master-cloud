/**
 * MASTER CLOUD — MASTER AI CORE v1.0
 * Comprehensive Verification Suite for v1.0 TypeScript Modules & Cross-Runtime Parity.
 *
 * Tests:
 * 1. Custom Bilingual BPE Tokenizer (`tokenizerV1.ts`) exact ID parity vs Python `tokenizer_v1.py`
 *    across English, Sinhala ZWJ conjuncts, Mixed bilingual text, emojis, numbers, and special tokens.
 * 2. Multi-turn Conversation Memory (`conversationMemory.ts`) session lifecycle, exact 512-token
 *    context bounding, deterministic overflow summarization notice, and Markdown export.
 * 3. Opt-In Local Human Feedback Store (`feedbackStore.ts`) consent fail-closed enforcement,
 *    corrections & JSONL preference-pair export.
 * 4. Offline Neural Runtime (`neuralRuntime.ts`) pure greedy/nucleus/repetition-penalty sampling,
 *    `<|tool|>` JSON extraction, and honest fail-closed uninitialized diagnostics.
 * 5. Safe Tool Orchestrator (`toolAssistedLocalMode.ts`) read-only allowlist enforcement and
 *    strict missing-evidence refusal when dialogue cues are absent.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-ai-v1-test-'));

async function bundleModulesIntoSharedGraph() {
  const entryFile = path.join(tmpDir, '_barrel.ts');
  const lines = [
    `export * as tokMod from ${JSON.stringify(path.join(ROOT, 'src/services/ai/tokenizerV1.ts').replace(/\\/g, '/'))};`,
    `export * as memMod from ${JSON.stringify(path.join(ROOT, 'src/services/ai/conversationMemory.ts').replace(/\\/g, '/'))};`,
    `export * as fbMod from ${JSON.stringify(path.join(ROOT, 'src/services/ai/feedbackStore.ts').replace(/\\/g, '/'))};`,
    `export * as rtMod from ${JSON.stringify(path.join(ROOT, 'src/services/ai/neuralRuntime.ts').replace(/\\/g, '/'))};`,
    `export * as toolMod from ${JSON.stringify(path.join(ROOT, 'src/services/ai/toolAssistedLocalMode.ts').replace(/\\/g, '/'))};`,
  ];
  fs.writeFileSync(entryFile, lines.join('\n'), 'utf-8');
  const outfile = path.join(tmpDir, '_bundle.mjs');
  await esbuild.build({
    entryPoints: [entryFile],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    logLevel: 'silent',
    external: ['onnxruntime-web'],
  });
  return import(pathToFileURL(outfile).href);
}

let passed = 0;
let failed = 0;

async function testCase(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err?.stack || err}`);
    failed++;
  }
}

try {
  console.log('=== MASTER AI CORE v1.0 Module & Parity Tests ===');

  const tokPath = path.join(ROOT, 'models', 'master-ai-core-v1', 'tokenizer_v1.json');
  assert.ok(fs.existsSync(tokPath), `Missing trained tokenizer artifact: ${tokPath}`);
  const artifact = JSON.parse(fs.readFileSync(tokPath, 'utf-8'));

  const { tokMod, memMod, fbMod, rtMod, toolMod } = await bundleModulesIntoSharedGraph();

  // ── 1. Tokenizer Parity vs Python Reference ─────────────────────────────
  const tsTok = tokMod.sharedTokenizerV1;
  tsTok.loadFromArtifact(artifact);

  const probeStrings = [
    'Hello MASTER CLOUD! Let us upscale 720p video to 1080p.',
    'ආයුබෝවන්! ශ්‍රී ලංකාවේ වීඩියෝවේ ගුණාත්මකභාවය වැඩි කරන්නේ කෙසේද?',
    'මචං Quality Boost on කරලා bitrate එක check කරමුද?',
    '<|system|>\nReply clearly.\n<|endturn|>\n<|user|>\nතත්පර 120 🎬✨\n<|endturn|>\n<|assistant|>\n',
    'Normalization NFC vs NFD: ස්වර + \r\n newlines   spaced.',
  ];

  // Cross-check exact Python token IDs when Python 3.12 is present
  const pyBin = 'C:\\Users\\HP\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
  let pyParityMap = null;
  if (fs.existsSync(pyBin)) {
    const pyScript = [
      'import json, sys',
      'from pathlib import Path',
      `sys.path.insert(0, ${JSON.stringify(ROOT)})`,
      'from training.v1.tokenizer_v1 import MasterAiTokenizerV1',
      'tok = MasterAiTokenizerV1()',
      `tok.load(${JSON.stringify(tokPath)})`,
      `probes = json.loads(${JSON.stringify(JSON.stringify(probeStrings))})`,
      'print(json.dumps([tok.encode(p, True, True) for p in probes]))',
    ].join('\n');
    const raw = execFileSync(pyBin, ['-c', pyScript], { encoding: 'utf-8' });
    pyParityMap = JSON.parse(raw.trim());
  }

  for (let i = 0; i < probeStrings.length; i++) {
    const text = probeStrings[i];
    await testCase(`Tokenizer roundtrip & special-token integrity [#${i + 1}]`, () => {
      const ids = tsTok.encode(text, true, true);
      assert.ok(ids[0] === tokMod.TOKEN_IDS_V1.BOS);
      assert.ok(ids[ids.length - 1] === tokMod.TOKEN_IDS_V1.EOS);
      const decodedFull = tsTok.decode(ids, false);
      assert.equal(decodedFull, `<bos>${text.normalize('NFC')}<eos>`);
      assert.ok(!decodedFull.includes('\ufffd'), 'Unexpected Unicode replacement character in decoded output');
      if (pyParityMap) {
        assert.deepEqual(ids, pyParityMap[i], `TypeScript token IDs diverged from Python reference on probe #${i + 1}`);
      }
    });
  }

  await testCase('Tokenizer prompt formatting encodes <bos> + role tokens matching Python strictly', () => {
    const prompt = tsTok.formatConversationPrompt([
      { role: 'system', content: 'Be helpful.' },
      { role: 'user', content: 'Hi' },
    ]);
    assert.equal(prompt, '<bos>\n<|system|>\nBe helpful.\n<|endturn|>\n<|user|>\nHi\n<|endturn|>\n<|assistant|>\n');
    const ids = tsTok.encode(prompt, false, false);
    assert.equal(ids[0], tokMod.TOKEN_IDS_V1.BOS);
    assert.ok(ids.includes(tokMod.TOKEN_IDS_V1.SYSTEM));
    assert.ok(ids.includes(tokMod.TOKEN_IDS_V1.USER));
    assert.ok(ids.includes(tokMod.TOKEN_IDS_V1.ASSISTANT));
    assert.ok(ids.includes(tokMod.TOKEN_IDS_V1.ENDTURN));
  });

  // ── 2. Conversation Memory & 512-Token Working Memory ───────────────────
  await testCase('ConversationMemory session CRUD + deterministic 512-token compression notice', () => {
    const mgr = memMod.conversationMemory;
    const sess = mgr.createSession('demo_video.mkv', 'mixed');
    assert.ok(sess.id.startsWith('sess_'));
    mgr.renameSession(sess.id, 'Renamed Chat');
    assert.equal(mgr.getSession(sess.id).title, 'Renamed Chat');

    const longHistory = [];
    for (let i = 0; i < 18; i++) {
      longHistory.push({
        id: `u_${i}`,
        sender: 'user',
        text: `Turn ${i}: explain 720p to 4K Quality Boost shader pipeline and subtitle bitrate details number ${i}.`,
        timestamp: Date.now() + i,
      });
      longHistory.push({
        id: `a_${i}`,
        sender: 'ai',
        text: `Answer ${i}: MASTER CLOUD upscaling runs shaders with audio track normalization cleanly for segment ${i}.`,
        timestamp: Date.now() + i,
      });
    }

    const ctx = mgr.buildContextWindow('System instruction.', longHistory, 'Final question?', 512, 112);
    assert.equal(ctx.tokenCountExact, true);
    assert.ok(ctx.promptTokens <= 400, `Expected <= 400 prompt tokens, got ${ctx.promptTokens}`);
    assert.equal(ctx.wasCompressed, true);
    assert.ok(ctx.compressedTurnCount > 0);
    assert.ok(ctx.summaryNotice.includes('model weights unchanged'));

    mgr.saveMessages(sess.id, longHistory.slice(0, 2));
    const md = mgr.exportSessionMarkdown(mgr.getSession(sess.id));
    assert.ok(md.includes('MASTER AI v1.0 Conversation:'));
    mgr.deleteSession(sess.id);
    assert.equal(mgr.getSession(sess.id), null);
  });

  // ── 3. Opt-In Human Feedback & JSONL Preference Export ──────────────────
  await testCase('HumanFeedbackStore enforces opt-in consent and exports chosen/rejected JSONL', () => {
    const fb = fbMod.humanFeedbackStore;
    fb.clearAll();
    fb.setConsent(false);
    const blocked = fb.recordFeedback({
      sessionId: 's1',
      messageId: 'm1',
      prompt: 'Hello',
      modelResponse: 'Hi',
      rating: 'helpful',
    });
    assert.equal(blocked.saved, false);

    fb.setConsent(true);
    const saved = fb.recordFeedback({
      sessionId: 's1',
      messageId: 'm2',
      prompt: 'Explain Audio Mode',
      modelResponse: 'Vague answer',
      correctedResponse: 'Audio Mode turns MASTER CLOUD into a dedicated waveform/equalizer workstation.',
      rating: 'unhelpful',
      tags: ['incomplete_answer'],
      language: 'english',
    });
    assert.equal(saved.saved, true);
    const stats = fb.getStats();
    assert.equal(stats.totalEntries, 1);
    assert.equal(stats.correctionsCount, 1);

    const jsonl = fb.exportPreferencePairsJsonl().trim();
    const row = JSON.parse(jsonl);
    assert.equal(row.chosen, 'Audio Mode turns MASTER CLOUD into a dedicated waveform/equalizer workstation.');
    assert.equal(row.rejected, 'Vague answer');
    fb.clearAll();
    fb.setConsent(false);
  });

  // ── 4. Neural Runtime Pure Sampler, Tool Extraction & Honest Failure ──────
  await testCase('NeuralRuntime sampler suppresses PAD/UNK & respects greedy/repetition penalty', () => {
    const logits = new Float32Array(120);
    logits[tokMod.TOKEN_IDS_V1.PAD] = 99.0;
    logits[tokMod.TOKEN_IDS_V1.UNK] = 98.0;
    logits[42] = 5.0;
    logits[55] = 4.5;
    const greedy = rtMod.sampleNextTokenId(logits, {
      maxNewTokens: 32,
      temperature: 0.0,
      topK: 40,
      topP: 0.9,
      repetitionPenalty: 1.0,
    }, []);
    assert.equal(greedy, 42);

    // Repeating token 42 with heavy repetition penalty switches argmax to 55
    const penalized = rtMod.sampleNextTokenId(logits, {
      maxNewTokens: 32,
      temperature: 0.0,
      topK: 40,
      topP: 0.9,
      repetitionPenalty: 2.0,
    }, [42]);
    assert.equal(penalized, 55);
  });

  await testCase('NeuralRuntime extracts valid <|tool|> JSON and rejects malformed payloads', () => {
    const valid = rtMod.extractToolCallFromGeneration('<|tool|>\n{"tool":"calc_bitrate","args":{"size_bytes":1000000}}\n<|endturn|>');
    assert.deepEqual(valid, { tool: 'calc_bitrate', args: { size_bytes: 1000000 } });

    const invalid = rtMod.extractToolCallFromGeneration('<|tool|>not-json<|endturn|>');
    assert.equal(invalid, null);
  });

  await testCase('NeuralRuntime fails closed cleanly when local assets are unreachable in Node', async () => {
    const statusBefore = rtMod.neuralRuntime.getStatus();
    assert.equal(statusBefore.status, 'unloaded');
    const ok = await rtMod.neuralRuntime.ensureInitialized();
    assert.equal(ok, false);
    const after = rtMod.neuralRuntime.getStatus();
    assert.equal(after.status, 'error');
    assert.ok(typeof after.errorMessage === 'string' && after.errorMessage.length > 0);
  });

  // ── 5. Safe Tool Allowlist & Missing Evidence Guard ───────────────────────
  await testCase('ToolAssistedOrchestrator enforces read-only allowlist & missing-evidence guard', async () => {
    const orch = toolMod.toolAssistedOrchestrator;
    const mockCtx = {
      fileName: 'sample.mp4',
      duration: 120,
      currentTime: 30,
      resolution: { width: 1280, height: 720 },
      fileSize: 30 * 1024 * 1024,
      container: 'MP4',
      cues: [],
      scenes: [],
      bookmarks: [],
    };

    const specOut = orch.executeSafeToolCall('calc_media_specs', {}, mockCtx);
    assert.equal(specOut.ok, true);
    const parsedSpec = JSON.parse(specOut.resultJson);
    assert.equal(parsedSpec.bitrate_mbps, 2.097);
    assert.equal(parsedSpec.duration_seconds, 120);

    const aspectOut = orch.executeSafeToolCall('calc_aspect_ratio', {}, mockCtx);
    assert.equal(aspectOut.ok, true);
    assert.equal(JSON.parse(aspectOut.resultJson).ratio, '16:9 (Widescreen)');

    const unsafeOut = orch.executeSafeToolCall('exec_shell_command', { cmd: 'whoami' }, mockCtx);
    assert.equal(unsafeOut.ok, false);
    assert.ok(JSON.parse(unsafeOut.resultJson).error.includes('not permitted'));

    const missingEvidence = await orch.processQuery('what was said in this video transcript dialogue?', mockCtx);
    assert.ok(missingEvidence.answerMarkdown.includes('No subtitle or transcript track is currently loaded'));
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
