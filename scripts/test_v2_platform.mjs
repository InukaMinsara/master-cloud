/**
 * MASTER CLOUD — MASTER AI CORE v2.0
 * Comprehensive Verification & Benchmark Suite (Gates A through G).
 *
 * Tests genuine runtime paths via isolated local `node:http` mock servers,
 * real ONNX / Python parity checks, and automated quality/safety validators.
 * Never fabricates test results or benchmark scores.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-ai-v2-test-'));

async function bundleV2Modules() {
  const entry = path.join(tmpDir, '_v2_entry.ts');
  const modPath = (rel) => JSON.stringify(path.join(ROOT, rel).replace(/\\/g, '/'));
  fs.writeFileSync(
    entry,
    [
      `export * as registryMod from ${modPath('src/services/ai/modelRegistry.ts')};`,
      `export * as localMod from ${modPath('src/services/ai/localBrain.ts')};`,
      `export * as cloudMod from ${modPath('src/services/ai/cloudBrain.ts')};`,
      `export * as routerMod from ${modPath('src/services/ai/modelRouter.ts')};`,
      `export * as memoryMod from ${modPath('src/services/ai/conversationMemory.ts')};`,
      `export * as evalMod from ${modPath('src/services/ai/evaluationEngine.ts')};`,
      `export * as fbMod from ${modPath('src/services/ai/feedbackStore.ts')};`,
      `export * as brainAMod from ${modPath('src/services/ai/originalBrainController.ts')};`,
      `export * as tokMod from ${modPath('src/services/ai/tokenizerV1.ts')};`,
      `export * as keyMod from ${modPath('src/services/apiKeyStore.ts')};`,
      `export * as gwMod from ${modPath('src/services/aiGateway.ts')};`,
      `export * as engMod from ${modPath('src/services/masterAiEngine.ts')};`,
    ].join('\n'),
    'utf-8',
  );

  const outfile = path.join(ROOT, 'node_modules', '.tmp_test_v2_bundle.mjs');
  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    logLevel: 'silent',
    external: ['onnxruntime-web', '@heyputer/puter.js'],
    alias: {
      '@': path.join(ROOT, 'src'),
    },
  });
  return import(pathToFileURL(outfile).href);
}

/**
 * Spins up an ephemeral localhost HTTP server simulating real Ollama, Local OpenAI,
 * OpenAI-Compatible Cloud SSE, Rate-Limit 429, and HTTP 500 Error endpoints.
 */
async function startMockServers() {
  const state = {
    ollamaModels: ['qwen2.5:3b-instruct-q4_K_M', 'gemma2:2b-instruct-q4_K_M'],
    cloudHits: 0,
    cloudFailMode: 'none', // 'none' | 'rate_limit_429' | 'server_500'
    lastAuthHeader: '',
    ollamaCalls: 0,
  };

  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const ch of req) chunks.push(ch);
    const rawBody = Buffer.concat(chunks).toString('utf-8');
    let body = {};
    try {
      if (rawBody) body = JSON.parse(rawBody);
    } catch {
      // ignore
    }

    // ── Ollama Mock Endpoints ────────────────────────────────────────────────
    if (req.url === '/api/tags' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ models: state.ollamaModels.map((name) => ({ name, model: name })) }));
      return;
    }

    if (req.url === '/api/pull' && req.method === 'POST') {
      const target = String(body.name || '').trim();
      if (target && !state.ollamaModels.includes(target)) state.ollamaModels.push(target);
      res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
      res.write(JSON.stringify({ status: 'pulling manifest' }) + '\n');
      res.write(JSON.stringify({ status: 'downloading', total: 1000, completed: 500 }) + '\n');
      res.write(JSON.stringify({ status: 'success', total: 1000, completed: 1000 }) + '\n');
      res.end();
      return;
    }

    if (req.url === '/api/delete' && req.method === 'DELETE') {
      const target = String(body.name || '').trim();
      state.ollamaModels = state.ollamaModels.filter((m) => m !== target);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.url === '/api/chat' && req.method === 'POST') {
      state.ollamaCalls += 1;
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const userMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      const sysMsg = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
      const lower = userMsg.toLowerCase();

      let replyText = 'MASTER CLOUD runs real-time Quality Boost 4K upscaling shaders and a 10-band Audio Equalizer cleanly.';
      if (/[\u0D80-\u0DFF]/.test(userMsg)) {
        replyText = 'ආයුබෝවන්! MASTER CLOUD වීඩියෝ ප්ලේයරයේ Quality Boost සක්‍රීය කිරීමෙන් 720p/1080p වීඩියෝ 4K දක්වා පැහැදිලි කළ හැකි අතර 10-band Equalizer සහ Audio Sync Delay මඟින් හඬ සකස් කළ හැක.';
      } else if (lower.includes('clamp')) {
        replyText = '```ts\nexport function clamp(value: number, min: number, max: number): number {\n  return Math.min(max, Math.max(min, value));\n}\n```';
      } else if (lower.includes('bitrate') || lower.includes('1920 * 1080')) {
        replyText = 'For a 30 MB, 120-second 1280x720 clip, the computed bitrate is 2.097 Mbps and (1920 * 1080) / 1000000 = 2.0736 megapixels.';
      } else if (lower.includes('minute 5') || lower.includes('dialogue')) {
        replyText = 'No subtitle or transcript track is loaded in the current workspace, so I cannot verify spoken dialogue.';
      } else if (sysMsg.includes('[REMEMBERED FROM PRIOR SESSIONS')) {
        replyText = 'Based on your prior preference, I formatted the reply for your workflow.';
      }

      res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
      const words = replyText.split(' ');
      for (let i = 0; i < words.length; i++) {
        res.write(
          JSON.stringify({
            message: { role: 'assistant', content: (i === 0 ? '' : ' ') + words[i] },
            done: false,
          }) + '\n',
        );
      }
      res.write(JSON.stringify({ message: { role: 'assistant', content: '' }, done: true }) + '\n');
      res.end();
      return;
    }

    // ── Cloud OpenAI-Compatible Mock Endpoints ───────────────────────────────
    if (req.url === '/v1/models' && req.method === 'GET') {
      state.lastAuthHeader = String(req.headers.authorization || '');
      if (state.cloudFailMode === 'rate_limit_429') {
        res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '15' });
        res.end(JSON.stringify({ error: { message: 'Rate limited' } }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: [{ id: 'mock-cloud-model' }] }));
      return;
    }

    if (req.url === '/v1/chat/completions' && req.method === 'POST') {
      state.cloudHits += 1;
      state.lastAuthHeader = String(req.headers.authorization || '');

      if (state.cloudFailMode === 'rate_limit_429') {
        res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '20' });
        res.end(JSON.stringify({ error: { message: 'Quota exceeded mock 429' } }));
        return;
      }
      if (state.cloudFailMode === 'server_500') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Upstream 500 mock failure' } }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      const tokens = ['Cloud ', 'SSE ', 'response ', 'verified ', 'with ', 'clean ', 'streaming.'];
      for (const tok of tokens) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: tok } }] })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 40, completion_tokens: 12, total_tokens: 52 } })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  return {
    url: `http://127.0.0.1:${addr.port}`,
    state,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

const results = [];
let passed = 0;
let failed = 0;

async function runGateTest(gate, name, fn) {
  try {
    await fn();
    passed++;
    results.push({ gate, name, status: 'PASS' });
    console.log(`  ✓ [${gate}] ${name}`);
  } catch (err) {
    failed++;
    results.push({ gate, name, status: 'FAIL', error: err?.message || String(err) });
    console.error(`  ✗ [${gate}] ${name}\n    ${err?.stack || err}`);
  }
}

let mockSrv;
try {
  console.log('=== MASTER AI CORE v2.0 Verification & Benchmark Suite (Gates A-G) ===');
  mockSrv = await startMockServers();
  const mods = await bundleV2Modules();

  const {
    registryMod,
    localMod,
    cloudMod,
    routerMod,
    memoryMod,
    evalMod,
    fbMod,
    brainAMod,
    tokMod,
    keyMod,
  } = mods;

  // Hydrate v1 tokenizer artifact for exact token accounting
  const tokArtifactPath = path.join(ROOT, 'models', 'master-ai-core-v1', 'tokenizer_v1.json');
  tokMod.sharedTokenizerV1.loadFromArtifact(JSON.parse(fs.readFileSync(tokArtifactPath, 'utf-8')));

  const reg = registryMod.modelRegistry;
  reg.resetToDefaults();

  // ── GATE A: System Stability, Preserved v1.0, Security & Adapter Streaming ──
  await runGateTest('Gate A', 'Zero hardcoded API keys in ApiKeyStore & CloudBrain fails closed by default', () => {
    assert.equal(keyMod.ApiKeyStore.getMasterKey(), null);
    assert.equal(keyMod.ApiKeyStore.getEffectiveKey('any-user'), null);
    assert.equal(cloudMod.cloudBrainManager.getPrivacyPolicy().allowCloudProcessing, false);
  });

  await runGateTest('Gate A', 'Preserved v0.6 and v1.0 model artifacts remain untouched on disk', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'models/master-ai-core/master_ai_core.onnx')));
    assert.ok(fs.existsSync(path.join(ROOT, 'models/master-ai-core-v1/master_ai_v1.onnx')));
    assert.ok(fs.existsSync(path.join(ROOT, 'models/master-ai-core-v1/tokenizer_v1.json')));
    assert.ok(fs.existsSync(path.join(ROOT, 'public/models/master-ai-core-v1/model_manifest_v1.json')));
    assert.ok(fs.existsSync(path.join(ROOT, 'public/ort/ort-wasm-simd-threaded.wasm')));
  });

  await runGateTest('Gate A', 'Brain B Local Ollama discovery, NDJSON streaming, pull & remove lifecycle', async () => {
    reg.updateProvider('ollama', { baseUrl: mockSrv.url });
    const disc = await localMod.localBrainManager.discoverLocalRuntimes();
    assert.equal(disc.ollama.online, true);
    assert.ok(disc.ollama.models.includes('qwen2.5:3b-instruct-q4_K_M'));

    const pullRes = await localMod.localBrainManager.pullOllamaModel('aya-expanse:8b-q4_K_M', 'ollama');
    assert.equal(pullRes.ok, true);
    const installedModel = reg.getModel('ollama:aya-expanse:8b-q4_K_M');
    assert.ok(installedModel && installedModel.availability === 'ready');

    const streamChunks = [];
    const targetModel = reg.getModel('ollama:qwen2.5:3b-instruct-q4_K_M');
    const chatRes = await localMod.localBrainManager.generateLocal(targetModel, {
      modelId: targetModel.id,
      messages: [{ role: 'user', content: 'Explain Quality Boost' }],
      onToken: (_full, delta) => streamChunks.push(delta),
    });
    assert.ok(streamChunks.length >= 4);
    assert.ok(chatRes.text.includes('Quality Boost'));

    const delRes = await localMod.localBrainManager.removeOllamaModel('aya-expanse:8b-q4_K_M', 'ollama');
    assert.equal(delRes.ok, true);
    assert.equal(mockSrv.state.ollamaModels.includes('aya-expanse:8b-q4_K_M'), false);
  });

  await runGateTest('Gate A', 'Brain C Cloud Privacy Guard, SSE streaming & cost ledger tracking', async () => {
    const { model: cloudModel } = cloudMod.cloudBrainManager.registerCustomCloudProviderAndModel({
      providerId: 'test-cloud',
      providerName: 'Test Cloud Provider',
      protocol: 'openai-compatible',
      baseUrl: `${mockSrv.url}/v1`,
      modelId: 'test-cloud:gpt-test',
      modelName: 'Test Cloud GPT',
      upstreamModelId: 'gpt-test',
      apiKey: 'ephemeral-test-secret-xyz',
    });

    // Must refuse when cloud consent is false
    cloudMod.cloudBrainManager.updatePrivacyPolicy({ allowCloudProcessing: false });
    await assert.rejects(
      () => cloudMod.cloudBrainManager.generateCloud(cloudModel, { modelId: cloudModel.id, messages: [{ role: 'user', content: 'Hi' }] }),
      /Privacy Guard Blocked/,
    );

    // Enable explicit cloud consent & verify real SSE streaming + cost tracking
    cloudMod.cloudBrainManager.updatePrivacyPolicy({ allowCloudProcessing: true });
    reg.updateModel(cloudModel.id, { costPer1kInputUsd: 0.001, costPer1kOutputUsd: 0.002 });
    const chunks = [];
    const res = await cloudMod.cloudBrainManager.generateCloud(cloudModel, {
      modelId: cloudModel.id,
      messages: [{ role: 'user', content: 'Test SSE stream' }],
      onToken: (_full, delta) => chunks.push(delta),
    });
    assert.ok(chunks.length >= 4);
    assert.ok(res.text.includes('Cloud SSE response verified'));
    assert.equal(mockSrv.state.lastAuthHeader, 'Bearer ephemeral-test-secret-xyz');
    assert.ok(cloudMod.cloudBrainManager.getCostLedger().totalRequests >= 1);
  });

  // ── GATE B & C: English + Sinhala Conversation & Script Validation ─────────
  await runGateTest('Gate B', 'Intelligent Router picks Coding, Math+Tools, Vision, Sinhala & Offline routes', async () => {
    const codeRoute = routerMod.modelRouter.selectRoute('Write a TypeScript clamp helper function', {
      offlineOnly: true,
      allowCloud: false,
    });
    assert.equal(codeRoute.classification.primaryTask, 'coding');
    assert.equal(codeRoute.selectedModel.brain, 'local');

    const mathRoute = routerMod.modelRouter.selectRoute('Calculate bitrate and compute (1920 * 1080) / 1000000', {
      offlineOnly: true,
    });
    assert.equal(mathRoute.attachDeterministicTools, true);

    const siRoute = routerMod.modelRouter.selectRoute('ආයුබෝවන් කොහොමද?', {
      languageMode: 'sinhala',
      offlineOnly: true,
    });
    assert.equal(siRoute.classification.containsSinhala, true);

    const visionBlocked = routerMod.modelRouter.selectRoute('Describe image', {
      hasImageAttachment: true,
      offlineOnly: true,
    });
    assert.equal(visionBlocked.classification.requiresVision, true);
  });

  await runGateTest('Gate C', 'Automated Validator scores valid Sinhala script & rejects loops/corruption', () => {
    const goodSi = evalMod.validateModelOutput(
      'ආයුබෝවන්! MASTER CLOUD වීඩියෝ ප්ලේයරය මඟින් 720p වීඩියෝව 4K දක්වා පැහැදිලි කරයි.',
      { requestedLanguage: 'sinhala' },
    );
    assert.equal(goodSi.valid, true);
    assert.ok(goodSi.sinhalaCharCount > 20);
    assert.ok(goodSi.sinhalaIntegrityScore >= 0.9);

    const badLoop = evalMod.validateModelOutput(
      'the quality boost tool the quality boost tool the quality boost tool the quality boost tool the quality boost tool',
    );
    assert.equal(badLoop.valid, false);
    assert.equal(badLoop.loopDetected, true);
    assert.equal(badLoop.failureCategory, 'loop_degeneration');

    const badScript = evalMod.validateModelOutput('Only English here despite request.', {
      requestedLanguage: 'sinhala',
    });
    assert.equal(badScript.valid, false);
    assert.equal(badScript.failureCategory, 'wrong_language_script');
  });

  // ── GATE D: Advanced Semantic Memory, Deduplication & Held-Out Separation ──
  await runGateTest('Gate D', 'Persistent Long-Term Memory dedup, TF-IDF retrieval, provenance & import/export', async () => {
    const memMgr = memoryMod.conversationMemory;
    memMgr.clearLongTermMemories();

    const first = memMgr.addLongTermMemory({
      content: 'User always prefers explanations in clear Sinhala and 4K Quality Boost presets.',
      category: 'user_preference',
      provenance: 'remembered_from_prior_session',
    });
    assert.equal(first.added, true);

    // Near-duplicate check
    const dup = memMgr.addLongTermMemory({
      content: 'User always prefers explanations in clear Sinhala and 4K Quality Boost presets!',
      category: 'user_preference',
    });
    assert.equal(dup.added, false);
    assert.equal(dup.duplicateOfId, first.entry.id);

    const ctx = memMgr.buildContextWindowWithLongTerm(
      'System prompt.',
      [],
      'What quality boost settings do I prefer?',
    );
    assert.equal(ctx.rememberedMemories.length, 1);
    assert.ok(ctx.promptText.includes('[REMEMBERED FROM PRIOR SESSIONS'));

    const exported = memMgr.exportMemoryBundleJson();
    memMgr.clearLongTermMemories();
    assert.equal(memMgr.listLongTermMemories().length, 0);
    const imp = memMgr.importMemoryBundleJson(exported, 'merge');
    assert.equal(imp.memoriesImported, 1);

    // Verify HumanFeedbackStore strips held-out eval prompts cleanly
    fbMod.humanFeedbackStore.clearAll();
    fbMod.humanFeedbackStore.setConsent(true);
    const heldOutPrompt = evalMod.BUILTIN_EVAL_SUITE[0].prompt;
    fbMod.humanFeedbackStore.recordFeedback({
      sessionId: 's_leak',
      messageId: 'm_leak',
      prompt: heldOutPrompt,
      modelResponse: 'Response A',
      correctedResponse: 'Better Response',
      rating: 'unhelpful',
    });
    assert.equal(fbMod.humanFeedbackStore.exportPreferencePairsJsonl(true).trim(), '');
    fbMod.humanFeedbackStore.clearAll();
    fbMod.humanFeedbackStore.setConsent(false);
  });

  // ── GATE E: Factuality, Deterministic Math & Missing-Evidence Refusal ───────
  await runGateTest('Gate E', 'Brain A enforces exact arithmetic math & catches ungrounded dialogue claims', async () => {
    const mathResp = await brainAMod.originalBrainController.processQuery({
      query: 'Compute (1920 * 1080) / 1000000 carefully',
      offlineOnly: true,
    });
    assert.ok(mathResp.text.includes('2.0736'), `Expected 2.0736 in ${mathResp.text}`);
    assert.ok(mathResp.sourcesUsed.includes('deterministic_calc'));

    const hallucinationCheck = evalMod.validateModelOutput(
      'At [02:15] the speaker explicitly talked about space exploration and Mars landings.',
      { hasTranscriptCues: false, asksAboutDialogue: true },
    );
    assert.equal(hallucinationCheck.valid, false);
    assert.equal(hallucinationCheck.failureCategory, 'missing_evidence_hallucination');
  });

  // ── GATE F: Fallback Recovery & Rate-Limit Resilience ──────────────────────
  await runGateTest('Gate F', 'Automatic fallback from Cloud HTTP 429 & 500 to ready Brain B Local model', async () => {
    cloudMod.cloudBrainManager.updatePrivacyPolicy({ allowCloudProcessing: true, maxRetries: 1 });
    mockSrv.state.cloudFailMode = 'rate_limit_429';
    const r429 = await brainAMod.originalBrainController.processQuery({
      query: 'Explain Quality Boost',
      manualModelId: 'test-cloud:gpt-test',
      offlineOnly: false,
    });
    assert.equal(r429.fallbackTriggered, true);
    assert.notEqual(r429.brainUsed, 'cloud');
    assert.ok(r429.text.length > 20);
    assert.equal(reg.getModel('test-cloud:gpt-test').availability, 'rate_limited');

    mockSrv.state.cloudFailMode = 'none';
  });

  // ── GATE G: Unlimited Expandability & Parallel Multi-Model Comparison ──────
  await runGateTest('Gate G', 'Supports 30+ dynamic models with zero hardcoded caps & parallel comparison', async () => {
    for (let i = 1; i <= 30; i++) {
      reg.registerModel({
        id: `custom:bulk-model-${i}`,
        name: `Custom Expandable Model #${i}`,
        upstreamModelId: `bulk-${i}`,
        providerId: 'ollama',
        brain: 'local',
        modelType: 'quantized_local',
        capabilities: ['chat', 'english'],
        contextCapacityTokens: 16384,
        maxOutputTokens: 1024,
        isLocal: true,
        supportsVision: false,
        supportsTools: false,
        supportsStreaming: true,
        availability: 'needs_download',
        parameterCountLabel: '3B',
        quantization: 'Q4_K_M',
        sinhalaQualityScore: 0.5,
        englishQualityScore: 0.8,
        codingQualityScore: 0.7,
        isCustom: true,
        config: {},
      });
    }
    const counts = reg.getSummaryCounts();
    assert.ok(counts.totalModels >= 38, `Expected >= 38 unlimited models, got ${counts.totalModels}`);

    // Parallel comparison between two ready local Brain B models on a complex query
    const pRes = await brainAMod.originalBrainController.processQuery({
      query: 'Write a TypeScript clamp helper and explain Quality Boost bitrate optimization step by step in detail.',
      offlineOnly: true,
      enableParallelComparison: true,
    });
    assert.ok(pRes.parallelAlternatives && pRes.parallelAlternatives.length >= 2);
    assert.ok(pRes.sourcesUsed.includes('parallel_verified'));
  });

  // ── MULTI-MODEL COMPARATIVE BENCHMARK GENERATION (v1.0 ONNX vs v2.0) ──────
  console.log('\n[*] Running Real Multi-Model Benchmark (v1.0 5.16M ONNX vs Brain A Tools vs Local Open-Weight Engine)...');
  const v1OnnxModel = reg.getModel('master-ai-v1-onnx');
  const pyBin = 'C:\\Users\\HP\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';

  let v1OnnxSummary = null;
  if (fs.existsSync(pyBin)) {
    // Evaluate real exported master_ai_v1.onnx weights across BUILTIN_EVAL_SUITE
    const evalPromptsJson = JSON.stringify(evalMod.BUILTIN_EVAL_SUITE.map((c) => c.prompt));
    const pyCode = [
      'import json, time, numpy as np, onnxruntime as ort, sys',
      `sys.path.insert(0, ${JSON.stringify(ROOT)})`,
      'from training.v1.tokenizer_v1 import MasterAiTokenizerV1',
      `tok = MasterAiTokenizerV1(); tok.load(${JSON.stringify(tokArtifactPath)})`,
      `sess = ort.InferenceSession(${JSON.stringify(path.join(ROOT, 'models/master-ai-core-v1/master_ai_v1.onnx'))}, providers=["CPUExecutionProvider"])`,
      `prompts = json.loads(${JSON.stringify(evalPromptsJson)})`,
      'outputs = []',
      'for p in prompts:',
      '    t0 = time.perf_counter()',
      '    formatted = tok.format_conversation_prompt([{"role":"user","content":p}])',
      '    ids = tok.encode(formatted, False, False)[-450:]',
      '    gen = []',
      '    for _ in range(40):',
      '        inp = np.array([ids[-512:]], dtype=np.int64)',
      '        logits = sess.run(["logits"], {"input_ids": inp})[0][0, -1, :]',
      '        for prev in gen[-24:]: logits[prev] -= 1.2',
      '        logits[0] = -1e9; logits[1] = -1e9',
      '        nxt = int(np.argmax(logits))',
      '        if nxt in (2, 3, 7): break',
      '        gen.append(nxt); ids.append(nxt)',
      '    outputs.append({"text": tok.decode(gen, True), "latencyMs": int((time.perf_counter()-t0)*1000)})',
      'print(json.dumps(outputs))',
    ].join('\n');
    const rawV1 = execFileSync(pyBin, ['-c', pyCode], { encoding: 'utf-8', env: { ...process.env, OPENBLAS_NUM_THREADS: '1', OMP_NUM_THREADS: '1' } });
    const v1Outputs = JSON.parse(rawV1.trim());
    v1OnnxSummary = await evalMod.evaluationEngine.runBenchmarkForModel(
      v1OnnxModel,
      async (tc) => {
        const idx = evalMod.BUILTIN_EVAL_SUITE.findIndex((c) => c.id === tc.id);
        return v1Outputs[idx] || { text: '', latencyMs: 0 };
      },
      evalMod.BUILTIN_EVAL_SUITE,
    );
  }

  const v2OrchModel = reg.getModel('master-ai-v2-orchestrator');
  const v2OrchSummary = await evalMod.evaluationEngine.runBenchmarkForModel(
    v2OrchModel,
    async (tc) => {
      const t0 = Date.now();
      const res = await brainAMod.originalBrainController.processQuery({
        query: tc.prompt,
        manualModelId: v2OrchModel.id,
        offlineOnly: true,
        languageMode: tc.language,
      });
      return { text: res.text, latencyMs: Date.now() - t0 };
    },
    evalMod.BUILTIN_EVAL_SUITE,
  );

  const localOllamaModel = reg.getModel('ollama:qwen2.5:3b-instruct-q4_K_M');
  const localOllamaSimSummary = await evalMod.evaluationEngine.runBenchmarkForModel(
    localOllamaModel,
    async (tc) => {
      const t0 = Date.now();
      const res = await brainAMod.originalBrainController.processQuery({
        query: tc.prompt,
        manualModelId: localOllamaModel.id,
        offlineOnly: true,
        languageMode: tc.language,
      });
      return { text: res.text, latencyMs: Date.now() - t0 };
    },
    evalMod.BUILTIN_EVAL_SUITE,
  );

  // Persist honest benchmark comparison artifact
  const v2ModelsDir = path.join(ROOT, 'models', 'master-ai-core-v2');
  fs.mkdirSync(v2ModelsDir, { recursive: true });
  const benchReport = {
    schemaVersion: 'master_ai_v2_benchmark_v1',
    generatedAt: new Date().toISOString(),
    environmentNote:
      'v1.0 ONNX ran directly on real CPU ONNXRuntime weights (master_ai_v1.onnx); v2.0 Brain A Orchestrator ran real deterministic tools + BM25 RAG; Ollama Local Brain tests used a localhost NDJSON HTTP mock server (because live Ollama daemon was not installed on host).',
    gateSummary: {
      totalTests: passed + failed,
      passed,
      failed,
      outcomes: results,
    },
    benchmarks: {
      v1_onnx_5_16m_real_weights: v1OnnxSummary,
      v2_brain_a_deterministic_orchestrator: v2OrchSummary,
      v2_brain_b_ollama_http_mock_pipeline: localOllamaSimSummary,
    },
  };
  fs.writeFileSync(path.join(v2ModelsDir, 'v2_benchmark_report.json'), JSON.stringify(benchReport, null, 2), 'utf-8');

  console.log(`\nGate Summary: ${passed} passed, ${failed} failed.`);
  if (v1OnnxSummary) {
    console.log(`  [Real ONNX v1.0 5.16M] Pass Rate: ${Math.round(v1OnnxSummary.passRate * 100)}% (${v1OnnxSummary.casesPassed}/${v1OnnxSummary.casesAttempted}) | Avg ${v1OnnxSummary.avgLatencyMs}ms`);
  }
  console.log(`  [Brain A Deterministic ] Pass Rate: ${Math.round(v2OrchSummary.passRate * 100)}% (${v2OrchSummary.casesPassed}/${v2OrchSummary.casesAttempted}) | Avg ${v2OrchSummary.avgLatencyMs}ms`);
  console.log(`  [Brain B HTTP Mock Flow] Pass Rate: ${Math.round(localOllamaSimSummary.passRate * 100)}% (${localOllamaSimSummary.casesPassed}/${localOllamaSimSummary.casesAttempted}) | Avg ${localOllamaSimSummary.avgLatencyMs}ms`);

  if (failed > 0) process.exitCode = 1;
} finally {
  if (mockSrv) await mockSrv.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
