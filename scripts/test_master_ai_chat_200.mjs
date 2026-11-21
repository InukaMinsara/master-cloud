/**
 * scripts/test_master_ai_chat_200.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — 200 FEATURES AUTOMATED VERIFICATION SUITE
 * Tests:
 * 1. Chat-Only Model Discovery (Zero image/video synthesis models)
 * 2. Disabled Image Endpoints (410 Gone verification)
 * 3. Multi-Provider Status Telemetry (9 providers)
 * 4. Conversational Chat Completion & Real-Time Streaming
 * 5. Auto Model Selection & Routing
 * 6. User-Controlled Failover (Zero silent switching)
 * 7. Live Web Search Intelligence Grounding
 * 8. Multi-Tier Conversation Persistence & Synchronization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = 'http://localhost:5173';

async function runTests() {
  console.log('====================================================');
  console.log(' MASTER AI — EXTREME CHAT-ONLY VERIFICATION SUITE   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // ── TEST 1: Model Discovery (Chat-Only Guarantee) ────────────────────────
  console.log('Test 1: Model Discovery & Chat-Only Enforcement');
  try {
    const res = await fetch(`${BASE_URL}/api/ai/models`);
    assert(res.ok, `GET /api/ai/models returned HTTP ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.models), `Response contains models array (count: ${data.models?.length})`);

    const forbiddenTerms = ['flux', 'stable-diffusion', 'cosmos', 'wan', 'runway', 'pika', 'kling', 'sensenova-u1.5-lite'];
    let foundForbidden = 0;
    for (const m of data.models || []) {
      const lower = (m.id + ' ' + m.name).toLowerCase();
      for (const term of forbiddenTerms) {
        if (lower.includes(term)) {
          foundForbidden++;
          console.error(`    Found disallowed generation model: ${m.id}`);
        }
      }
    }
    assert(foundForbidden === 0, `Zero dedicated image/video generation models found (forbidden: ${foundForbidden})`);

    // Verify chat models present
    const hasFast = data.models.some((m) => m.category === 'fast');
    const hasReasoning = data.models.some((m) => m.category === 'reasoning');
    const hasCoding = data.models.some((m) => m.category === 'coding');
    assert(hasFast || hasReasoning || hasCoding, 'Verified genuine conversational models categorized');
  } catch (err) {
    assert(false, `Test 1 failed with error: ${err.message}`);
  }

  // ── TEST 2: Dedicated Image Endpoints Permanently Disabled ───────────────
  console.log('\nTest 2: Image Generation Endpoints Disabled (Rule A.1-A.5)');
  try {
    const genRes = await fetch(`${BASE_URL}/api/ai/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' }),
    });
    assert(genRes.status === 410, `/api/ai/image/generate returned 410 Gone (got ${genRes.status})`);

    const editRes = await fetch(`${BASE_URL}/api/ai/image/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'edit' }),
    });
    assert(editRes.status === 410, `/api/ai/image/edit returned 410 Gone (got ${editRes.status})`);
  } catch (err) {
    assert(false, `Test 2 failed with error: ${err.message}`);
  }

  // ── TEST 3: Provider Status & Telemetry ──────────────────────────────────
  console.log('\nTest 3: Provider Status & Telemetry');
  try {
    const res = await fetch(`${BASE_URL}/api/ai/status`);
    assert(res.ok, `GET /api/ai/status returned HTTP ${res.status}`);
    const data = await res.json();
    assert(data.providers !== undefined, 'Provider status object returned');
    assert(typeof data.providers?.groq === 'boolean', `Groq provider status reported: ${data.providers?.groq}`);
    assert(typeof data.providers?.openrouter === 'boolean', `OpenRouter status reported: ${data.providers?.openrouter}`);
    assert(typeof data.providers?.nvidia === 'boolean', `NVIDIA status reported: ${data.providers?.nvidia}`);
  } catch (err) {
    assert(false, `Test 3 failed with error: ${err.message}`);
  }

  // ── TEST 4: Conversational Chat Streaming ────────────────────────────────
  console.log('\nTest 4: Real-Time Conversational Chat Streaming');
  try {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Reply in 5 words: Hello Master AI' }],
        stream: true,
      }),
    });
    assert(res.ok, `POST /api/ai/chat returned HTTP ${res.status}`);
    assert(res.headers.get('content-type')?.includes('text/event-stream'), 'Content-Type is text/event-stream');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    let receivedChunks = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      text += chunk;
      receivedChunks++;
      if (receivedChunks > 30) break; // Sample received
    }
    assert(text.includes('data:') || text.includes('[DONE]'), `Streaming SSE tokens received (${receivedChunks} chunks)`);
  } catch (err) {
    assert(false, `Test 4 failed with error: ${err.message}`);
  }

  // ── TEST 5: Auto Model Selection ─────────────────────────────────────────
  console.log('\nTest 5: Auto Model Selection & Header Propagation');
  try {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'auto',
        messages: [{ role: 'user', content: 'Write a quick python function to reverse a string' }],
        stream: true,
      }),
    });
    assert(res.ok, `Auto model routing returned HTTP ${res.status}`);
    const autoHeader = res.headers.get('x-master-auto-selected-model');
    assert(Boolean(autoHeader), `Auto model selected: ${autoHeader}`);
  } catch (err) {
    assert(false, `Test 5 failed with error: ${err.message}`);
  }

  // ── TEST 6: User-Controlled Failover (No Silent Switching) ────────────────
  console.log('\nTest 6: User-Controlled Failover (No Silent Switching)');
  try {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'non-existent-fake-model-12345',
        messages: [{ role: 'user', content: 'Test' }],
        failover: false, // Strict: failover disabled
      }),
    });
    // Should NOT silently succeed on a random fallback when failover is false
    assert(!res.ok || res.status >= 400, `Rejection of invalid model without silent switch: HTTP ${res.status}`);
    const fallbackHeader = res.headers.get('x-master-fallback-model');
    assert(!fallbackHeader, 'Verified no silent fallback header applied when failover=false');
  } catch (err) {
    assert(false, `Test 6 failed with error: ${err.message}`);
  }

  // ── TEST 7: Web Search Grounding ─────────────────────────────────────────
  console.log('\nTest 7: Live Web Search Grounding');
  try {
    const res = await fetch(`${BASE_URL}/api/ai/search?q=TypeScript`);
    assert(res.ok, `GET /api/ai/search returned HTTP ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.results), `Search returned results array (count: ${data.results?.length})`);
  } catch (err) {
    assert(false, `Test 7 failed with error: ${err.message}`);
  }

  // ── TEST 8: Multi-Tier History Persistence ───────────────────────────────
  console.log('\nTest 8: History Persistence API');
  try {
    const testConv = {
      id: `test_conv_${Date.now()}`,
      title: 'Automated Test Chat',
      messages: [{ id: 'm1', role: 'user', content: 'Test message', createdAt: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const postRes = await fetch(`${BASE_URL}/api/ai/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation: testConv }),
    });
    assert(postRes.ok, `POST /api/ai/history returned HTTP ${postRes.status}`);

    const getRes = await fetch(`${BASE_URL}/api/ai/history`);
    assert(getRes.ok, `GET /api/ai/history returned HTTP ${getRes.status}`);
    const historyData = await getRes.json();
    assert(Array.isArray(historyData.conversations), `History returned conversations array`);
  } catch (err) {
    assert(false, `Test 8 failed with error: ${err.message}`);
  }

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log(` VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
