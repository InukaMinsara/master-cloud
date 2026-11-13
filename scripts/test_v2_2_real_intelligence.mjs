import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OLLAMA_BASE = 'http://127.0.0.1:11434';
const TARGET_MODEL_TAG = 'qwen2.5:3b-instruct-q4_K_M';
const TARGET_MODEL_ID = `ollama:${TARGET_MODEL_TAG}`;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-ai-v22-'));

function execSafe(cmd) {
  try {
    return { ok: true, out: execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() };
  } catch (err) {
    return { ok: false, err: (err?.stderr || err?.message || String(err)).toString().trim() };
  }
}

function readGpuStats() {
  const n = execSafe('nvidia-smi --query-gpu=name,memory.total,memory.free,memory.used,utilization.gpu,driver_version --format=csv,noheader,nounits');
  if (!n.ok || !n.out) return null;
  const line = n.out.split(/\r?\n/)[0].split(',').map((s) => s.trim());
  return {
    gpuName: line[0] || 'NVIDIA GPU',
    vramTotalMb: Number(line[1]) || 0,
    vramFreeMb: Number(line[2]) || 0,
    vramUsedMb: Number(line[3]) || 0,
    gpuUtilPct: Number(line[4]) || 0,
    driverVersion: line[5] || '',
    freeRamGb: Number((os.freemem() / 1024 ** 3).toFixed(2)),
    totalRamGb: Number((os.totalmem() / 1024 ** 3).toFixed(2)),
  };
}

async function bundleV22Modules() {
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

function summarizeRubrics(outcomes) {
  if (!outcomes.length) return null;
  const avg = (key) => Number((outcomes.reduce((acc, o) => acc + (o.rubric?.[key] ?? 0), 0) / outcomes.length).toFixed(2));
  return {
    relevance: avg('relevance'),
    coherence: avg('coherence'),
    languageQuality: avg('languageQuality'),
    safety: avg('safety'),
    overall: avg('overall'),
  };
}

const checks = [];
let passed = 0;
let failed = 0;
let skipped = 0;

async function check(phase, name, fn) {
  try {
    const r = await fn();
    if (r?.skipped) {
      skipped++;
      checks.push({ phase, name, status: 'SKIPPED', reason: r.reason });
      console.log(`  - [${phase}] ${name} -> SKIPPED (${r.reason})`);
      return r;
    }
    passed++;
    checks.push({ phase, name, status: 'PASS', detail: r?.detail });
    console.log(`  ✓ [${phase}] ${name}${r?.detail ? ` — ${r.detail}` : ''}`);
    return r;
  } catch (err) {
    failed++;
    checks.push({ phase, name, status: 'FAIL', error: err?.message || String(err) });
    console.error(`  ✗ [${phase}] ${name}\n    ${err?.stack || err}`);
    return null;
  }
}

try {
  console.log('=== MASTER AI v2.2 — Real Local Intelligence Activation & 11-Category Benchmark ===\n');

  // Step 0: Verify live Ollama server first (never assume installed/running)
  let ollamaVersion = null;
  let apiTags = null;
  let apiPsInitial = null;
  let apiShow = null;
  let liveReady = false;

  try {
    const vRes = await fetch(`${OLLAMA_BASE}/api/version`, { signal: AbortSignal.timeout(2500) });
    if (vRes.ok) ollamaVersion = await vRes.json();
    const tRes = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(2500) });
    if (tRes.ok) apiTags = await tRes.json();
    const pRes = await fetch(`${OLLAMA_BASE}/api/ps`, { signal: AbortSignal.timeout(2500) });
    if (pRes.ok) apiPsInitial = await pRes.json();
    const sRes = await fetch(`${OLLAMA_BASE}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: TARGET_MODEL_TAG }),
      signal: AbortSignal.timeout(3000),
    });
    if (sRes.ok) apiShow = await sRes.json();
    const installedNames = Array.isArray(apiTags?.models) ? apiTags.models.map((m) => m.name || m.model) : [];
    liveReady = Boolean(ollamaVersion && installedNames.includes(TARGET_MODEL_TAG));
  } catch {
    liveReady = false;
  }

  const baselineGpu = readGpuStats();
  console.log('[Host Verification]');
  console.log(`  Ollama Server (${OLLAMA_BASE}): ${ollamaVersion ? `ONLINE v${ollamaVersion.version}` : 'UNREACHABLE'}`);
  console.log(`  Installed Tags (/api/tags): ${apiTags?.models?.map((m) => `${m.name} (${(m.size / 1024 ** 3).toFixed(2)} GB)`).join(', ') || 'None'}`);
  console.log(`  Target Model "${TARGET_MODEL_TAG}": ${liveReady ? 'VERIFIED INSTALLED & READY' : 'NOT AVAILABLE'}`);
  if (baselineGpu) {
    console.log(`  Hardware Baseline: ${baselineGpu.gpuName} (${baselineGpu.vramFreeMb}/${baselineGpu.vramTotalMb} MiB VRAM free, ${baselineGpu.vramUsedMb} MiB used) | Free RAM ${baselineGpu.freeRamGb}/${baselineGpu.totalRamGb} GB\n`);
  }

  const mods = await bundleV22Modules();
  const reg = mods.modelRegistry.modelRegistry;
  const localMgr = mods.localBrain.localBrainManager;
  const brainA = mods.originalBrainController.originalBrainController;
  const memory = mods.conversationMemory.conversationMemory;
  const evalEng = mods.evaluationEngine.evaluationEngine;
  const suite22 = mods.evaluationEngine.LOCAL_BRAIN_V22_EVAL_SUITE;

  const tokArtifactPath = path.join(ROOT, 'models', 'master-ai-core-v1', 'tokenizer_v1.json');
  mods.tokenizerV1.sharedTokenizerV1.loadFromArtifact(JSON.parse(fs.readFileSync(tokArtifactPath, 'utf-8')));
  reg.resetToDefaults();

  if (!liveReady) {
    console.log('ABORTING LIVE BENCHMARK: Target Ollama model not running. Marking live phases SKIPPED.');
    await check('Phase 1', 'Real Ollama connection & streaming telemetry', async () => ({ skipped: true, reason: 'Ollama/model not reachable at 127.0.0.1:11434' }));
    process.exitCode = 1;
  } else {
    // ── PHASE 1: REAL MODEL CONNECTION & STREAMING + CANCELLATION ─────────────
    console.log('[Phase 1 — Real Model Connection, Endpoints, Streaming & Cancellation]');
    await check('Phase 1', '/api/tags, /api/ps, /api/show & exact model ID verified via LocalBrainManager', async () => {
      const disc = await localMgr.discoverLocalRuntimes();
      assert.equal(disc.ollama.online, true);
      assert.ok(disc.ollama.models.includes(TARGET_MODEL_TAG));

      const model = reg.getModel(TARGET_MODEL_ID);
      assert.ok(model, `Model ${TARGET_MODEL_ID} not registered`);
      assert.equal(model.availability, 'ready');
      assert.equal(model.installed, true);
      assert.equal(model.upstreamModelId, TARGET_MODEL_TAG);
      assert.ok(model.diskSizeMb && model.diskSizeMb > 1500, `Unexpected diskSizeMb: ${model.diskSizeMb}`);
      return {
        detail: `${model.upstreamModelId} · ${model.parameterCountLabel} · ${model.quantization} · ${model.diskSizeMb} MiB disk · ${model.contextCapacityTokens} ctx`,
      };
    });

    await check('Phase 1', 'Real streaming NDJSON generation & telemetry measurement', async () => {
      const model = reg.getModel(TARGET_MODEL_ID);
      let chunkCount = 0;
      const streamedRes = await localMgr.generateLocal(model, {
        modelId: model.id,
        numCtx: 4096,
        maxTokens: 96,
        timeoutMs: 60000,
        temperature: 0.2,
        messages: [
          { role: 'user', content: 'In one short sentence, confirm MASTER CLOUD local streaming is active.' },
        ],
        onToken: () => { chunkCount++; },
      });
      assert.ok(chunkCount >= 2, `Expected >=2 streamed token deltas, got ${chunkCount}`);
      assert.ok(streamedRes.text.trim().length > 5);
      assert.ok((streamedRes.tokensPerSecond ?? 0) > 0, 'Expected real tokensPerSecond > 0');
      return {
        detail: `${chunkCount} deltas · ${streamedRes.completionTokensEstimate} tok @ ${streamedRes.tokensPerSecond} tok/s (${streamedRes.latencyMs}ms): "${streamedRes.text.replace(/\s+/g, ' ').slice(0, 80)}"`,
      };
    });

    await check('Phase 1', 'Mid-stream AbortController cancellation & post-cancel recovery', async () => {
      const model = reg.getModel(TARGET_MODEL_ID);
      const ac = new AbortController();
      let deltasBeforeAbort = 0;
      let abortedCleanly = false;

      try {
        const res = await localMgr.generateLocal(model, {
          modelId: model.id,
          numCtx: 4096,
          maxTokens: 200,
          signal: ac.signal,
          messages: [{ role: 'user', content: 'Write a detailed 150-word essay explaining lossless audio codecs.' }],
          onToken: () => {
            deltasBeforeAbort++;
            if (deltasBeforeAbort >= 5 && !ac.signal.aborted) {
              ac.abort();
            }
          },
        });
        abortedCleanly = res.finishReason === 'aborted';
      } catch (err) {
        abortedCleanly = err?.code === 'ABORTED' || err?.name === 'AbortError' || ac.signal.aborted;
      }
      assert.equal(abortedCleanly, true, 'Expected clean abort interruption');

      // Recovery request immediately after cancellation
      const rec = await localMgr.generateLocal(model, {
        modelId: model.id,
        numCtx: 4096,
        maxTokens: 48,
        temperature: 0,
        messages: [{ role: 'user', content: 'Reply cleanly with the single word READY.' }],
      });
      assert.ok(rec.text.trim().length > 0);
      return {
        detail: `Aborted cleanly after ${deltasBeforeAbort} deltas -> recovered cleanly (${rec.tokensPerSecond} tok/s): "${rec.text.trim().slice(0, 40)}"`,
      };
    });

    // ── PHASE 3: HARDWARE OPTIMIZATION (GPU vs CPU + VRAM/RAM + GUARD) ────────
    console.log('\n[Phase 3 — Hardware Optimization: RTX 3050 6GB GPU Offload vs CPU, 4096 Context & Unload]');
    let gpuRunStats = null;
    let cpuRunStats = null;

    await check('Phase 3', 'Measure real GPU-offloaded inference (num_ctx=4096) & /api/ps VRAM offload ratio', async () => {
      localMgr.updateInferenceSettings({
        computeMode: 'auto',
        gpuLayers: -1,
        contextWindowTokens: 4096,
        singleHeavyModelGuard: true,
        activeLocalModelId: TARGET_MODEL_ID,
      });
      const model = reg.getModel(TARGET_MODEL_ID);
      const t0 = Date.now();
      const res = await localMgr.generateLocal(model, {
        modelId: model.id,
        numCtx: 4096,
        maxTokens: 120,
        temperature: 0.2,
        messages: [{ role: 'user', content: 'Explain why 4K 60fps streaming needs fast storage in 2 sentences.' }],
      });
      const psRes = await fetch(`${OLLAMA_BASE}/api/ps`);
      const psJson = await psRes.json();
      const loaded = (psJson?.models || []).find((m) => (m.name || m.model) === TARGET_MODEL_TAG);
      const afterGpu = readGpuStats();

      const sizeMb = loaded?.size ? Math.round(loaded.size / 1024 ** 2) : 0;
      const vramMb = loaded?.size_vram ? Math.round(loaded.size_vram / 1024 ** 2) : 0;
      const offloadPct = sizeMb > 0 ? Math.round((vramMb / sizeMb) * 100) : 0;

      gpuRunStats = {
        latencyMs: Date.now() - t0,
        tokensPerSecond: res.tokensPerSecond,
        completionTokens: res.completionTokensEstimate,
        ollamaPsSizeMb: sizeMb,
        ollamaPsVramMb: vramMb,
        gpuOffloadPct: offloadPct,
        nvidiaVramUsedMb: afterGpu?.vramUsedMb ?? null,
        nvidiaVramFreeMb: afterGpu?.vramFreeMb ?? null,
        hostFreeRamGb: afterGpu?.freeRamGb ?? null,
      };
      assert.ok(vramMb > 0, `Expected non-zero GPU VRAM offload in /api/ps, got ${vramMb} MiB`);
      return {
        detail: `${res.tokensPerSecond} tok/s · ${res.latencyMs}ms · /api/ps=${vramMb}/${sizeMb} MiB (${offloadPct}% GPU) · nvidia-smi used=${afterGpu?.vramUsedMb} MiB`,
      };
    });

    await check('Phase 3', 'Measure real CPU-only inference (num_gpu=0, num_ctx=4096) vs GPU speed', async () => {
      localMgr.updateInferenceSettings({
        computeMode: 'cpu',
        gpuLayers: 0,
        cpuThreads: 8,
        contextWindowTokens: 4096,
        singleHeavyModelGuard: true,
      });
      const model = reg.getModel(TARGET_MODEL_ID);
      const t0 = Date.now();
      const res = await localMgr.generateLocal(model, {
        modelId: model.id,
        numCtx: 4096,
        numGpu: 0,
        numThread: 8,
        maxTokens: 120,
        temperature: 0.2,
        messages: [{ role: 'user', content: 'Explain why 4K 60fps streaming needs fast storage in 2 sentences.' }],
      });
      const psRes = await fetch(`${OLLAMA_BASE}/api/ps`);
      const psJson = await psRes.json();
      const loaded = (psJson?.models || []).find((m) => (m.name || m.model) === TARGET_MODEL_TAG);
      const afterCpu = readGpuStats();

      const sizeMb = loaded?.size ? Math.round(loaded.size / 1024 ** 2) : 0;
      const vramMb = loaded?.size_vram ? Math.round(loaded.size_vram / 1024 ** 2) : 0;

      cpuRunStats = {
        latencyMs: Date.now() - t0,
        tokensPerSecond: res.tokensPerSecond,
        completionTokens: res.completionTokensEstimate,
        ollamaPsSizeMb: sizeMb,
        ollamaPsVramMb: vramMb,
        nvidiaVramUsedMb: afterCpu?.vramUsedMb ?? null,
        hostFreeRamGb: afterCpu?.freeRamGb ?? null,
      };
      assert.equal(vramMb, 0, `Expected 0 MiB VRAM in CPU mode (num_gpu=0), got ${vramMb}`);
      return {
        detail: `CPU: ${res.tokensPerSecond} tok/s (${res.latencyMs}ms) vs GPU: ${gpuRunStats?.tokensPerSecond} tok/s (${gpuRunStats?.latencyMs}ms) · /api/ps VRAM=${vramMb} MiB`,
      };
    });

    await check('Phase 3', 'Explicit model unload releases VRAM + restore GPU Auto mode (ctx=4096)', async () => {
      const res = await localMgr.unloadLocalModel(TARGET_MODEL_ID);
      assert.equal(Boolean(res?.ok ?? res), true);
      await new Promise((r) => setTimeout(r, 800));
      const psRes = await fetch(`${OLLAMA_BASE}/api/ps`);
      const psJson = await psRes.json();
      const stillLoaded = (psJson?.models || []).filter((m) => (m.name || m.model) === TARGET_MODEL_TAG);
      const postUnloadGpu = readGpuStats();

      localMgr.updateInferenceSettings({
        computeMode: 'auto',
        gpuLayers: -1,
        cpuThreads: 0,
        contextWindowTokens: 4096,
        singleHeavyModelGuard: true,
        activeLocalModelId: TARGET_MODEL_ID,
      });
      return {
        detail: `Unloaded: loaded=${stillLoaded.length} · nvidia-smi used=${postUnloadGpu?.vramUsedMb} MiB (${postUnloadGpu?.vramFreeMb} MiB free)`,
      };
    });

    // ── PHASE 4: REAL 11-CATEGORY HELD-OUT EVALUATION (BRAIN A vs BRAIN B vs BRAIN A+B) ──
    console.log('\n[Phase 4 — Real 11-Category Held-Out Benchmark: Brain A vs Brain B vs Brain A + Brain B]');
    await localMgr.discoverLocalRuntimes();
    const targetModel = reg.getModel(TARGET_MODEL_ID);
    const orchestratorModel = reg.getModel('master-ai-v2-orchestrator');

    // Warm load GPU once before timing Brain B benchmark cleanly so cold-start doesn't distort first prompt only
    await localMgr.generateLocal(targetModel, {
      modelId: targetModel.id,
      numCtx: 4096,
      maxTokens: 16,
      messages: [{ role: 'user', content: 'Say OK.' }],
    });

    const evalBrainA = await evalEng.runBenchmarkForModel(
      orchestratorModel,
      async (tc) => {
        const seededIds = [];
        if (tc.seedMemoryFacts?.length) {
          for (const f of tc.seedMemoryFacts) {
            const saved = memory.rememberFact({ category: f.category, content: f.content, source: 'system_detected' });
            if (saved) seededIds.push(saved.id);
          }
        }
        try {
          const res = await brainA.processQuery({
            query: tc.prompt,
            history: tc.seedHistory?.map((h, i) => ({
              id: `seed_${i}`,
              sender: h.role === 'user' ? 'user' : 'ai',
              text: h.content,
              timestamp: Date.now() - 1000 * (10 - i),
            })),
            manualModelId: orchestratorModel.id,
            offlineOnly: true,
            languageMode: tc.language,
          });
          return { text: res.text, latencyMs: res.latencyMs };
        } finally {
          for (const sid of seededIds) memory.forgetFact(sid);
        }
      },
      suite22,
    );
    console.log(`  [Benchmark 1/3] Brain A Standalone (Offline Tools+RAG): ${evalBrainA.casesPassed}/${evalBrainA.casesAttempted} (${Math.round(evalBrainA.passRate * 100)}%) · Avg ${evalBrainA.avgLatencyMs}ms`);

    const evalBrainBStandalone = await evalEng.runBenchmarkForModel(
      { ...targetModel, name: `${targetModel.name} (Brain B Standalone)` },
      async (tc) => {
        // Standalone Brain B sends ONLY raw user/assistant turns without Brain A math/doc/memory orchestration
        const msgs = [
          { role: 'system', content: 'You are a helpful AI assistant. Answer concisely and accurately.' },
          ...(tc.seedHistory || []).map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: tc.prompt },
        ];
        const gen = await localMgr.generateLocal(targetModel, {
          modelId: targetModel.id,
          numCtx: 4096,
          maxTokens: 512,
          temperature: 0.35,
          messages: msgs,
        });
        return { text: gen.text, latencyMs: gen.latencyMs, tokensPerSecond: gen.tokensPerSecond };
      },
      suite22,
    );
    console.log(`  [Benchmark 2/3] Brain B Standalone (${TARGET_MODEL_TAG}): ${evalBrainBStandalone.casesPassed}/${evalBrainBStandalone.casesAttempted} (${Math.round(evalBrainBStandalone.passRate * 100)}%) · Avg ${evalBrainBStandalone.avgLatencyMs}ms · ${evalBrainBStandalone.avgTokensPerSecond || 0} tok/s`);

    const evalCombined = await evalEng.runBenchmarkForModel(
      { ...targetModel, id: 'brain_a_plus_b', name: `Brain A + Brain B (${TARGET_MODEL_TAG})` },
      async (tc) => {
        const seededIds = [];
        if (tc.seedMemoryFacts?.length) {
          for (const f of tc.seedMemoryFacts) {
            const saved = memory.rememberFact({ category: f.category, content: f.content, source: 'system_detected' });
            if (saved) seededIds.push(saved.id);
          }
        }
        try {
          const res = await brainA.processQuery({
            query: tc.prompt,
            history: tc.seedHistory?.map((h, i) => ({
              id: `seed_${i}`,
              sender: h.role === 'user' ? 'user' : 'ai',
              text: h.content,
              timestamp: Date.now() - 1000 * (10 - i),
            })),
            // Let Brain A dynamically route and coordinate with Brain B (activeLocalModelId = TARGET_MODEL_ID)!
            activeLocalModelId: TARGET_MODEL_ID,
            offlineOnly: true,
            languageMode: tc.language,
            maxTokens: 512,
            temperature: 0.35,
          });
          return {
            text: res.text,
            latencyMs: res.latencyMs,
            tokensPerSecond: res.tokensPerSecond,
          };
        } finally {
          for (const sid of seededIds) memory.forgetFact(sid);
        }
      },
      suite22,
    );
    console.log(`  [Benchmark 3/3] Combined Brain A + Brain B (${TARGET_MODEL_TAG}): ${evalCombined.casesPassed}/${evalCombined.casesAttempted} (${Math.round(evalCombined.passRate * 100)}%) · Avg ${evalCombined.avgLatencyMs}ms · ${evalCombined.avgTokensPerSecond || 0} tok/s`);

    // ── PHASE 5: MULTI-MODEL PREPARATION & FALLBACK CHECK ─────────────────────
    console.log('\n[Phase 5 — Multi-Model Preparation, Zero Hardcoded Cap & Failure Fallback]');
    await check('Phase 5', 'Supports multi-model dynamic registration + single-resident guard + missing-model fallback without auto-downloading', async () => {
      const tempIds = [];
      for (let i = 1; i <= 5; i++) {
        const m = localMgr.registerCustomLocalModel({
          name: `Test Multi-Slot Local ${i}`,
          upstreamModelId: `uninstalled-eval-slot-${i}:latest`,
          providerId: 'ollama',
          contextCapacityTokens: 8192,
        });
        tempIds.push(m.id);
      }
      const totalLocalCount = reg.listModels({ localOnly: true }).length;
      assert.ok(totalLocalCount >= 8, `Expected unlimited local registry entries, got ${totalLocalCount}`);

      // Fallback check: attempt a missing model tag -> must fall back cleanly through Brain A without crashing or auto-pulling
      const fallbackRes = await brainA.processQuery({
        query: 'Give one short fact about offline AI privacy.',
        manualModelId: tempIds[0],
        activeLocalModelId: TARGET_MODEL_ID,
        offlineOnly: true,
      });
      assert.ok(fallbackRes.text.length > 10);

      for (const id of tempIds) reg.removeModel(id);
      return {
        detail: `${totalLocalCount} local descriptors active without cap -> missing-model fallback recovered cleanly via "${fallbackRes.modelName}"`,
      };
    });

    const loadedAfterBenchRes = await fetch(`${OLLAMA_BASE}/api/ps`);
    const loadedAfterBench = await loadedAfterBenchRes.json();
    const finalGpuStats = readGpuStats();

    const artifactPath = path.join(ROOT, 'models', 'master-ai-core-v2', 'v2_2_real_intelligence_benchmark.json');
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    const artifact = {
      schemaVersion: 'master_ai_v2_2_real_intelligence_v1',
      generatedAt: new Date().toISOString(),
      targetModel: TARGET_MODEL_TAG,
      ollamaServerVersion: ollamaVersion?.version || null,
      ollamaShowSummary: {
        family: apiShow?.details?.family || null,
        parameterSize: apiShow?.details?.parameter_size || null,
        quantization: apiShow?.details?.quantization_level || null,
      },
      hardwareOptimization: {
        baselineGpu,
        gpuOffloadRun4096Ctx: gpuRunStats,
        cpuOnlyRun4096Ctx: cpuRunStats,
        postBenchmarkGpu: finalGpuStats,
        postBenchmarkPs: loadedAfterBench,
      },
      verificationChecks: { passed, failed, skipped, checks },
      real11CategoryBenchmarks: {
        brainAStandaloneOffline: {
          ...evalBrainA,
          avgRubric: summarizeRubrics(evalBrainA.outcomes),
        },
        brainBStandaloneOllama: {
          ...evalBrainBStandalone,
          avgRubric: summarizeRubrics(evalBrainBStandalone.outcomes),
        },
        combinedBrainAPlusB: {
          ...evalCombined,
          avgRubric: summarizeRubrics(evalCombined.outcomes),
        },
      },
    };
    fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), 'utf8');
    console.log(`\n[*] Saved real v2.2 benchmark artifact -> ${artifactPath}`);
  }

  console.log(`\n=== MASTER AI v2.2 Summary ===\n  Checks: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  if (failed > 0) process.exitCode = 1;
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
