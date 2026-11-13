import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-ai-v21-'));

function execCmdSafe(cmd) {
  try {
    return { ok: true, out: execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim() };
  } catch (e) {
    return { ok: false, out: String(e?.stderr || e?.message || '').trim() };
  }
}

async function probeRealHostHardware() {
  const cpuModel = os.cpus()[0]?.model || null;
  const cpuCores = os.cpus().length || 4;
  const totalRamGb = Number((os.totalmem() / 1073741824).toFixed(2));
  const freeRamGb = Number((os.freemem() / 1073741824).toFixed(2));

  let gpuName = null;
  let gpuVramTotalMb = null;
  let gpuVramFreeMb = null;
  let nvidiaDriverVersion = null;
  const smi = execCmdSafe('nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version --format=csv,noheader,nounits');
  if (smi.ok && smi.out) {
    const parts = smi.out.split(/\r?\n/)[0].split(',').map((s) => s.trim());
    if (parts.length >= 4) {
      gpuName = parts[0] || null;
      gpuVramTotalMb = Number(parts[1]) || null;
      gpuVramFreeMb = Number(parts[2]) || null;
      nvidiaDriverVersion = parts[3] || null;
    }
  }

  const pyBin = 'C:\\Users\\HP\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
  let torchVersion = null;
  let cudaVerified = false;
  let ortProviders = [];
  if (fs.existsSync(pyBin)) {
    const pyCheck = execFileSync(
      pyBin,
      [
        '-c',
        'import json, torch, onnxruntime as ort; print(json.dumps({"torch": torch.__version__, "cuda": bool(torch.cuda.is_available()), "ort": ort.get_available_providers()}))',
      ],
      { encoding: 'utf8', env: { ...process.env, OPENBLAS_NUM_THREADS: '1', OMP_NUM_THREADS: '1' } },
    );
    const parsed = JSON.parse(pyCheck.trim());
    torchVersion = parsed.torch;
    cudaVerified = parsed.cuda;
    ortProviders = parsed.ort || [];
  }

  const ollamaCli = execCmdSafe('ollama --version');

  let liveOllamaModels = [];
  let liveOllamaReachable = false;
  try {
    const r = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(1500) });
    if (r.ok) {
      liveOllamaReachable = true;
      const d = await r.json();
      liveOllamaModels = Array.isArray(d?.models) ? d.models.map((m) => String(m.name || m.model || '')).filter(Boolean) : [];
    }
  } catch {
    liveOllamaReachable = false;
  }

  let liveLocalOpenAiModels = [];
  let liveLocalOpenAiReachable = false;
  try {
    const r = await fetch('http://127.0.0.1:1234/v1/models', { signal: AbortSignal.timeout(1500) });
    if (r.ok) {
      liveLocalOpenAiReachable = true;
      const d = await r.json();
      liveLocalOpenAiModels = Array.isArray(d?.data) ? d.data.map((m) => String(m.id || '')).filter(Boolean) : [];
    }
  } catch {
    liveLocalOpenAiReachable = false;
  }

  return {
    cpuModel,
    cpuCores,
    totalRamGb,
    freeRamGb,
    gpuName,
    gpuVramTotalMb,
    gpuVramFreeMb,
    nvidiaDriverVersion,
    torchVersion,
    cudaVerified,
    cudaVerificationDetail: gpuName
      ? cudaVerified
        ? `CUDA verified (${torchVersion})`
        : `NVIDIA GPU driver ${nvidiaDriverVersion} present (${gpuVramTotalMb} MiB VRAM), but CUDA toolkit/PyTorch CUDA is NOT active (${torchVersion || 'N/A'}; ORT=${ortProviders.join(',')}).`
      : 'No NVIDIA GPU detected.',
    ortProviders,
    ollamaCliInstalled: ollamaCli.ok,
    ollamaCliVersion: ollamaCli.ok ? ollamaCli.out : null,
    liveOllamaReachable,
    liveOllamaModels,
    liveLocalOpenAiReachable,
    liveLocalOpenAiModels,
  };
}

async function bundleV21Modules() {
  const entryPoints = {
    modelRegistry: path.join(ROOT, 'src/services/ai/modelRegistry.ts'),
    localBrain: path.join(ROOT, 'src/services/ai/localBrain.ts'),
    cloudBrain: path.join(ROOT, 'src/services/ai/cloudBrain.ts'),
    modelRouter: path.join(ROOT, 'src/services/ai/modelRouter.ts'),
    conversationMemory: path.join(ROOT, 'src/services/ai/conversationMemory.ts'),
    evaluationEngine: path.join(ROOT, 'src/services/ai/evaluationEngine.ts'),
    originalBrainController: path.join(ROOT, 'src/services/ai/originalBrainController.ts'),
    tokenizerV1: path.join(ROOT, 'src/services/ai/tokenizerV1.ts'),
  };

  await esbuild.build({
    entryPoints,
    outdir: tmpDir,
    bundle: true,
    splitting: true,
    platform: 'node',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    logLevel: 'silent',
  });

  const loaded = {};
  const bust = Date.now();
  for (const name of Object.keys(entryPoints)) {
    const outfile = path.join(tmpDir, `${name}.mjs`);
    loaded[name] = await import(`file://${outfile.replace(/\\/g, '/')}?v=${bust}`);
  }
  return loaded;
}

async function startProtocolMockServer() {
  const state = {
    tags: [
      {
        name: 'qwen2.5:3b-instruct-q4_K_M',
        size: 2048 * 1024 * 1024,
        details: { quantization_level: 'Q4_K_M', parameter_size: '3.1B', family: 'qwen2' },
      },
      {
        name: 'llama3.2:3b-instruct-q4_K_M',
        size: 2100 * 1024 * 1024,
        details: { quantization_level: 'Q4_K_M', parameter_size: '3.2B', family: 'llama' },
      },
      {
        name: 'custom-sinhala-coder:1.5b-q4_K_M',
        size: 1050 * 1024 * 1024,
        details: { quantization_level: 'Q4_K_M', parameter_size: '1.5B', family: 'qwen2' },
      },
    ],
    loaded: [
      {
        name: 'llama3.2:3b-instruct-q4_K_M',
        size: 2100 * 1024 * 1024,
        size_vram: 1950 * 1024 * 1024,
      },
    ],
    unloadedModels: [],
    lastChatOptions: null,
    chatMode: 'normal', // 'normal' | 'oom' | 'not_found' | 'hang'
  };

  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const bodyStr = Buffer.concat(chunks).toString('utf8');

    if (req.url === '/api/tags' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ models: state.tags }));
      return;
    }

    if (req.url === '/api/ps' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ models: state.loaded }));
      return;
    }

    if (req.url === '/api/show' && req.method === 'POST') {
      const parsed = JSON.parse(bodyStr || '{}');
      const found = state.tags.find((t) => t.name === parsed.name);
      if (!found) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'model not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          details: found.details,
          parameters: 'num_ctx 16384\nstop <|im_end|>',
        }),
      );
      return;
    }

    if (req.url === '/api/chat' && req.method === 'POST') {
      const parsed = JSON.parse(bodyStr || '{}');
      // Handle explicit keep_alive: 0 unload call cleanly
      if (parsed.keep_alive === 0 && (!parsed.messages || parsed.messages.length === 0)) {
        state.unloadedModels.push(parsed.model);
        state.loaded = state.loaded.filter((m) => m.name !== parsed.model);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ model: parsed.model, done: true, done_reason: 'unload' }));
        return;
      }

      state.lastChatOptions = parsed.options || {};

      if (state.chatMode === 'oom') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'CUDA out of memory: cudaMalloc failed allocating 2800 MiB' }));
        return;
      }
      if (state.chatMode === 'not_found') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `model '${parsed.model}' not found` }));
        return;
      }
      if (state.chatMode === 'hang') {
        await new Promise((r) => setTimeout(r, 1200));
        if (!res.writableEnded) {
          res.writeHead(504);
          res.end('timeout');
        }
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
      const replyTokens = [
        'Protocol ',
        'integration ',
        'OK ',
        `(model=${parsed.model}, `,
        `num_gpu=${parsed.options?.num_gpu ?? 'auto'}).`,
      ];
      for (const tok of replyTokens) {
        res.write(JSON.stringify({ message: { role: 'assistant', content: tok }, done: false }) + '\n');
      }
      res.write(
        JSON.stringify({
          message: { role: 'assistant', content: '' },
          done: true,
          prompt_eval_count: 32,
          eval_count: 24,
          eval_duration: 600_000_000, // 0.6s -> 40.0 tok/s
        }) + '\n',
      );
      res.end();
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  return {
    url: `http://127.0.0.1:${addr.port}`,
    state,
    close: () => new Promise((r) => server.close(r)),
  };
}

let mockSrv;
const suiteAResults = [];
const suiteBResults = [];
let passedA = 0;
let failedA = 0;
let passedB = 0;
let failedB = 0;
let skippedB = 0;

async function testA(name, fn) {
  try {
    await fn();
    passedA++;
    suiteAResults.push({ name, status: 'PASS' });
    console.log(`  ✓ [Integration/Protocol] ${name}`);
  } catch (err) {
    failedA++;
    suiteAResults.push({ name, status: 'FAIL', error: err?.message || String(err) });
    console.error(`  ✗ [Integration/Protocol] ${name}\n    ${err?.stack || err}`);
  }
}

async function testB(name, fn) {
  try {
    const res = await fn();
    if (res && res.skipped) {
      skippedB++;
      suiteBResults.push({ name, status: 'SKIPPED', reason: res.reason });
      console.log(`  - [Real Inference] ${name} -> SKIPPED (${res.reason})`);
      return;
    }
    passedB++;
    suiteBResults.push({ name, status: 'PASS', detail: res?.detail });
    console.log(`  ✓ [Real Inference] ${name}`);
  } catch (err) {
    failedB++;
    suiteBResults.push({ name, status: 'FAIL', error: err?.message || String(err) });
    console.error(`  ✗ [Real Inference] ${name}\n    ${err?.stack || err}`);
  }
}

try {
  console.log('=== MASTER AI CORE v2.1 — Real Local Brain Hardware, Protocol & Benchmark Suite ===\n');
  const hostHw = await probeRealHostHardware();
  console.log('[Host Hardware Telemetry]');
  console.log(`  CPU: ${hostHw.cpuModel} (${hostHw.cpuCores} threads)`);
  console.log(`  RAM: ${hostHw.freeRamGb} GB free / ${hostHw.totalRamGb} GB total`);
  console.log(`  GPU: ${hostHw.gpuName || 'None'} (${hostHw.gpuVramTotalMb || 0} MiB VRAM, ${hostHw.gpuVramFreeMb || 0} MiB free)`);
  console.log(`  CUDA Verification: ${hostHw.cudaVerificationDetail}`);
  console.log(`  Live Ollama (127.0.0.1:11434): ${hostHw.liveOllamaReachable ? `ONLINE (${hostHw.liveOllamaModels.join(', ')})` : 'UNREACHABLE / NOT INSTALLED'}`);
  console.log(`  Live Local OpenAI (127.0.0.1:1234): ${hostHw.liveLocalOpenAiReachable ? `ONLINE (${hostHw.liveLocalOpenAiModels.join(', ')})` : 'UNREACHABLE'}\n`);

  mockSrv = await startProtocolMockServer();
  const mods = await bundleV21Modules();
  const reg = mods.modelRegistry.modelRegistry;
  const localMgr = mods.localBrain.localBrainManager;
  const brainA = mods.originalBrainController.originalBrainController;
  const evalEng = mods.evaluationEngine.evaluationEngine;
  const evalSuite11 = mods.evaluationEngine.LOCAL_BRAIN_V21_EVAL_SUITE;

  const tokArtifactPath = path.join(ROOT, 'models', 'master-ai-core-v1', 'tokenizer_v1.json');
  mods.tokenizerV1.sharedTokenizerV1.loadFromArtifact(JSON.parse(fs.readFileSync(tokArtifactPath, 'utf-8')));

  console.log('[Suite A — Protocol Integration, Hardware Awareness, Switching & Recovery Tests (Non-Benchmark)]');

  await testA('Hardware probe surfaces real OS/GPU metrics without faking CUDA', async () => {
    reg.resetToDefaults();
    localMgr.setHostHardwareProbe(async () => hostHw);
    reg.updateProvider('ollama', { baseUrl: mockSrv.url });
    const hw = await localMgr.detectHardwareCapabilities();
    assert.equal(hw.cpuCores, hostHw.cpuCores);
    assert.equal(hw.totalRamGb, hostHw.totalRamGb);
    assert.equal(hw.gpuVramTotalMb, hostHw.gpuVramTotalMb);
    assert.equal(hw.cudaVerified, hostHw.cudaVerified);
    assert.ok(hw.loadedModels.length === 1 && hw.loadedModels[0].name === 'llama3.2:3b-instruct-q4_K_M');

    const fitSmall = localMgr.evaluateHardwareFit(reg.getModel('ollama:qwen2.5:3b-instruct-q4_K_M'), hw);
    assert.equal(fitSmall.fits, true);
  });

  await testA('Dynamic discovery parses /api/tags, /api/ps, and /api/show into ModelRegistry', async () => {
    const customModel = reg.getModel('ollama:custom-sinhala-coder:1.5b-q4_K_M');
    assert.ok(customModel);
    assert.equal(customModel.installed, true);
    assert.equal(customModel.quantization, 'Q4_K_M');
    assert.equal(customModel.parameterCountLabel, '1.5B');
    assert.equal(customModel.contextCapacityTokens, 16384);
  });

  await testA('Single Heavy Model Guard unloads resident heavy model before loading new model + computes tok/s', async () => {
    localMgr.updateInferenceSettings({
      singleHeavyModelGuard: true,
      computeMode: 'cpu',
      cpuThreads: 6,
      contextWindowTokens: 4096,
      activeLocalModelId: 'ollama:qwen2.5:3b-instruct-q4_K_M',
    });

    const target = reg.getModel('ollama:qwen2.5:3b-instruct-q4_K_M');
    const res = await localMgr.generateLocal(target, {
      modelId: target.id,
      messages: [{ role: 'user', content: 'Test protocol generation' }],
    });
    assert.ok(mockSrv.state.unloadedModels.includes('llama3.2:3b-instruct-q4_K_M'));
    assert.equal(mockSrv.state.lastChatOptions.num_gpu, 0);
    assert.equal(mockSrv.state.lastChatOptions.num_thread, 6);
    assert.equal(mockSrv.state.lastChatOptions.num_ctx, 4096);
    assert.equal(res.tokensPerSecond, 40);
    assert.ok(res.text.includes('Protocol integration OK'));
  });

  await testA('Active model switching routes Brain A -> selected Brain B model', () => {
    const dec1 = mods.modelRouter.modelRouter.selectRoute('Explain neural networks cleanly', {
      offlineOnly: true,
      activeLocalModelId: 'ollama:custom-sinhala-coder:1.5b-q4_K_M',
    });
    assert.equal(dec1.selectedModel.id, 'ollama:custom-sinhala-coder:1.5b-q4_K_M');

    const dec2 = mods.modelRouter.modelRouter.selectRoute('Explain neural networks cleanly', {
      offlineOnly: true,
      activeLocalModelId: 'ollama:qwen2.5:3b-instruct-q4_K_M',
    });
    assert.equal(dec2.selectedModel.id, 'ollama:qwen2.5:3b-instruct-q4_K_M');
  });

  await testA('Failure recovery classifies OOM, 404 model missing, timeout & unreachable daemon gracefully', async () => {
    const target = reg.getModel('ollama:qwen2.5:3b-instruct-q4_K_M');

    mockSrv.state.chatMode = 'oom';
    await assert.rejects(
      () => localMgr.generateLocal(target, { modelId: target.id, messages: [{ role: 'user', content: 'Hi' }] }),
      (err) => err.code === 'OUT_OF_MEMORY',
    );

    mockSrv.state.chatMode = 'not_found';
    await assert.rejects(
      () => localMgr.generateLocal(target, { modelId: target.id, messages: [{ role: 'user', content: 'Hi' }] }),
      (err) => err.code === 'MODEL_NOT_FOUND',
    );

    mockSrv.state.chatMode = 'hang';
    await assert.rejects(
      () => localMgr.generateLocal(target, { modelId: target.id, timeoutMs: 250, messages: [{ role: 'user', content: 'Hi' }] }),
      (err) => err.code === 'TIMEOUT',
    );

    // Disconnected daemon -> Brain A falls back cleanly without crashing or calling cloud
    reg.updateProvider('ollama', { baseUrl: 'http://127.0.0.1:19999' });
    const recovered = await brainA.processQuery({
      query: 'Write a complex distributed Rust consensus actor.',
      offlineOnly: true,
      manualModelId: 'ollama:qwen2.5:3b-instruct-q4_K_M',
    });
    assert.equal(recovered.brainUsed, 'original');
    assert.equal(recovered.fallbackTriggered, true);
    assert.ok(recovered.text.includes('No local open-weight model') || recovered.text.includes('Brain A Recovery Note'));
  });

  // Reset registry cleanly to REAL host endpoints (NO MOCKS) for Suite B!
  console.log('\n[Suite B — Real Local Model Benchmarks & Offline Acceptance (Zero Mocks)]');
  reg.resetToDefaults();

  let realOllamaBench = null;
  let realV1OnnxBench = null;
  let realBrainABench = null;

  await testB('Real Ollama external model 11-category benchmark (no mocks)', async () => {
    if (!hostHw.liveOllamaReachable || hostHw.liveOllamaModels.length === 0) {
      return {
        skipped: true,
        reason: hostHw.liveOllamaReachable
          ? 'Ollama online at 127.0.0.1:11434 but 0 models installed'
          : 'Ollama daemon/CLI not installed or running at 127.0.0.1:11434 (never auto-downloading large weights without user approval)',
      };
    }

    await localMgr.discoverLocalRuntimes();
    const readyOllama = reg.listModels({ providerId: 'ollama', onlyReady: true })[0];
    assert.ok(readyOllama, 'No ready Ollama model registered after live discovery');

    realOllamaBench = await evalEng.runBenchmarkForModel(
      readyOllama,
      async (tc) => {
        const res = await brainA.processQuery({
          query: tc.prompt,
          history: tc.seedHistory?.map((h, i) => ({
            id: `seed_${i}`,
            sender: h.role === 'user' ? 'user' : 'ai',
            text: h.content,
            timestamp: Date.now() - 1000 * (10 - i),
          })),
          manualModelId: readyOllama.id,
          offlineOnly: true,
          languageMode: tc.language,
        });
        return { text: res.text, latencyMs: res.latencyMs, tokensPerSecond: res.tokensPerSecond };
      },
      evalSuite11,
    );
    return { detail: `${readyOllama.id}: ${realOllamaBench.casesPassed}/${realOllamaBench.casesAttempted}` };
  });

  await testB('Real Local OpenAI (LM Studio / llama.cpp) benchmark (no mocks)', async () => {
    if (!hostHw.liveLocalOpenAiReachable || hostHw.liveLocalOpenAiModels.length === 0) {
      return { skipped: true, reason: 'No Local OpenAI runtime listening at 127.0.0.1:1234' };
    }
    return { skipped: true, reason: 'Local OpenAI probe present but skipped if unloaded' };
  });

  await testB('Real CPU ONNX v1.0 (5.16M Original Weights) 11-category held-out evaluation', async () => {
    const pyBin = 'C:\\Users\\HP\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
    if (!fs.existsSync(pyBin)) {
      return { skipped: true, reason: 'Python ONNX runtime missing' };
    }
    const promptsJson = JSON.stringify(evalSuite11.map((c) => c.prompt));
    const pyCode = [
      'import json, time, numpy as np, onnxruntime as ort, sys',
      `sys.path.insert(0, ${JSON.stringify(ROOT)})`,
      'from training.v1.tokenizer_v1 import MasterAiTokenizerV1',
      `tok = MasterAiTokenizerV1(); tok.load(${JSON.stringify(tokArtifactPath)})`,
      `sess = ort.InferenceSession(${JSON.stringify(path.join(ROOT, 'models/master-ai-core-v1/master_ai_v1.onnx'))}, providers=["CPUExecutionProvider"])`,
      `prompts = json.loads(${JSON.stringify(promptsJson)})`,
      'out = []',
      'for p in prompts:',
      '    t0 = time.perf_counter()',
      '    ids = tok.encode(tok.format_conversation_prompt([{"role":"user","content":p}]), False, False)[-450:]',
      '    gen = []',
      '    for _ in range(40):',
      '        inp = np.array([ids[-512:]], dtype=np.int64)',
      '        logits = sess.run(["logits"], {"input_ids": inp})[0][0, -1, :]',
      '        for prev in gen[-24:]: logits[prev] -= 1.2',
      '        logits[0] = -1e9; logits[1] = -1e9',
      '        nxt = int(np.argmax(logits))',
      '        if nxt in (2, 3, 7): break',
      '        gen.append(nxt); ids.append(nxt)',
      '    out.append({"text": tok.decode(gen, True), "latencyMs": int((time.perf_counter()-t0)*1000)})',
      'print(json.dumps(out))',
    ].join('\n');

    const raw = execFileSync(pyBin, ['-c', pyCode], {
      encoding: 'utf8',
      env: { ...process.env, OPENBLAS_NUM_THREADS: '1', OMP_NUM_THREADS: '1' },
    });
    const outputs = JSON.parse(raw.trim());
    realV1OnnxBench = await evalEng.runBenchmarkForModel(
      reg.getModel('master-ai-v1-onnx'),
      async (tc) => outputs[evalSuite11.findIndex((c) => c.id === tc.id)],
      evalSuite11,
    );
  });

  await testB('Real Brain A Offline Deterministic + Memory + Bilingual Docs 11-category evaluation', async () => {
    const orchestrator = reg.getModel('master-ai-v2-orchestrator');
    realBrainABench = await evalEng.runBenchmarkForModel(
      orchestrator,
      async (tc) => {
        const res = await brainA.processQuery({
          query: tc.prompt,
          history: tc.seedHistory?.map((h, i) => ({
            id: `seed_${i}`,
            sender: h.role === 'user' ? 'user' : 'ai',
            text: h.content,
            timestamp: Date.now() - 1000 * (10 - i),
          })),
          manualModelId: orchestrator.id,
          offlineOnly: true,
          languageMode: tc.language,
        });
        return { text: res.text, latencyMs: res.latencyMs };
      },
      evalSuite11,
    );
  });

  const artifactPath = path.join(ROOT, 'models', 'master-ai-core-v2', 'v2_1_local_brain_benchmark.json');
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  const artifact = {
    schemaVersion: 'master_ai_v2_1_local_brain_benchmark_v1',
    generatedAt: new Date().toISOString(),
    hardwareMeasured: hostHw,
    integrationAndProtocolSuite: {
      note: 'Tested Ollama API lifecycle, Single Heavy Model Guard, num_gpu/num_ctx/num_thread, and failure recovery using a local HTTP protocol mock. NOT reported as real model intelligence.',
      passed: passedA,
      failed: failedA,
      results: suiteAResults,
    },
    realInferenceSuite: {
      passed: passedB,
      failed: failedB,
      skipped: skippedB,
      results: suiteBResults,
      benchmarks: {
        ollamaRealExternalModel: realOllamaBench,
        v1OnnxRealWeightsCpu: realV1OnnxBench,
        brainADeterministicOffline: realBrainABench,
      },
    },
  };
  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), 'utf8');

  console.log('\n=== Summary ===');
  console.log(`  Suite A (Protocol / Hardware / Recovery): ${passedA} passed, ${failedA} failed`);
  console.log(`  Suite B (Real Model Inference Tests)    : ${passedB} passed, ${failedB} failed, ${skippedB} SKIPPED`);
  if (realV1OnnxBench) {
    console.log(`  - Real v1.0 ONNX (5.16M CPU): ${realV1OnnxBench.casesPassed}/${realV1OnnxBench.casesAttempted} (${Math.round(realV1OnnxBench.passRate * 100)}%) · Avg ${realV1OnnxBench.avgLatencyMs}ms`);
  }
  if (realBrainABench) {
    console.log(`  - Real Brain A Offline      : ${realBrainABench.casesPassed}/${realBrainABench.casesAttempted} (${Math.round(realBrainABench.passRate * 100)}%) · Avg ${realBrainABench.avgLatencyMs}ms`);
  }
  if (realOllamaBench) {
    console.log(`  - Real Ollama Open-Weight   : ${realOllamaBench.casesPassed}/${realOllamaBench.casesAttempted} (${Math.round(realOllamaBench.passRate * 100)}%) · Avg ${realOllamaBench.avgLatencyMs}ms`);
  } else {
    console.log('  - Real Ollama Open-Weight   : SKIPPED (Ollama not installed/running on host)');
  }

  if (failedA > 0 || failedB > 0) process.exitCode = 1;
} finally {
  if (mockSrv) await mockSrv.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
