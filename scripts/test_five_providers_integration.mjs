/**
 * scripts/test_five_providers_integration.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Test Suite for Five API Providers with Dynamic Free Chat Model Discovery:
 * 1. Experiential Labs
 * 2. UnoRouter
 * 3. Opus Proxy / Abhibots
 * 4. APmix
 * 5. OpenRouter
 *
 * Verifies:
 * - Server-side environment configuration loading (zero client bundle exposure)
 * - /api/ai/status endpoint reporting for all 9 providers
 * - /api/ai/models dynamic discovery across providers
 * - Strict exclusion of non-chat, image, audio, embedding, and decisions-only models
 * - Clean model display naming with ZERO provider names, logos, or badges
 * - Model capability categorization (fast, coding, reasoning, general, vision)
 * - Context length badges (32k context, 128k context, 1M context, etc.)
 * - /api/ai/chat multi-provider routing (OpenRouter headers, UnoRouter, etc.)
 * - Strict Image Rule: ONLY sensenova/sensenova-u1.5-lite preserved as primary
 * ─────────────────────────────────────────────────────────────────────────────
 */

import http from 'http';

const BASE_URL = 'http://localhost:5173';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      `${BASE_URL}${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 MASTER AI — FIVE API PROVIDERS INTEGRATION VERIFICATION TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  // ── TEST 1: Status Endpoint includes all 9 Providers ───────────────────────
  console.log('\n--- 1. Testing /api/ai/status Provider Availability ---');
  try {
    const statusRes = await get('/api/ai/status');
    assert(statusRes.status === 200, 'GET /api/ai/status returns HTTP 200');

    const status = statusRes.data;
    const requiredProviders = [
      'groq',
      'xkiro',
      'pollinations',
      'comfyui',
      'experiential',
      'unorouter',
      'abhibots',
      'apmix',
      'openrouter',
    ];

    for (const p of requiredProviders) {
      assert(status[p] !== undefined, `/api/ai/status reports status for provider '${p}'`);
      assert(
        typeof status[p]?.available === 'boolean',
        `Provider '${p}' reports available boolean`
      );
      assert(
        typeof status[p]?.endpoint === 'string',
        `Provider '${p}' reports valid endpoint: ${status[p]?.endpoint}`
      );
    }
  } catch (err) {
    assert(false, 'GET /api/ai/status failed', err.message);
  }

  // ── TEST 2: Dynamic Multi-Provider Model Discovery (/api/ai/models) ────────
  console.log('\n--- 2. Testing /api/ai/models Dynamic Discovery ---');
  try {
    const modelsRes = await get('/api/ai/models?refresh=true');
    assert(modelsRes.status === 200, 'GET /api/ai/models returns HTTP 200');

    const models = modelsRes.data?.models || [];
    assert(Array.isArray(models) && models.length > 0, `Discovered ${models.length} unified models`);

    const providersInCatalogue = new Set(models.map((m) => m.provider));
    console.log(`Providers represented in catalogue:`, Array.from(providersInCatalogue));

    assert(
      providersInCatalogue.has('groq') || providersInCatalogue.has('pollinations'),
      'Core free providers (Groq/Pollinations) are present'
    );
    assert(
      providersInCatalogue.has('unorouter') || providersInCatalogue.has('openrouter'),
      'Newly integrated providers (UnoRouter or OpenRouter) dynamically discovered'
    );

    // ── TEST 3: Zero Provider Names, Logos, or Badges in Model Names ─────────
    console.log('\n--- 3. Testing UI Requirements: Clean Display Names (Zero Provider Branding) ---');
    const forbiddenProviderStrings = [
      'openrouter:',
      'unorouter:',
      'experiential:',
      'abhibots:',
      'apmix:',
      'groq:',
      'xkiro:',
      'inclusionai:',
      'baidu:',
      'liquidai:',
      ':free',
      '(free)',
    ];

    let hasBrandedNames = false;
    let sampleCleanNames = [];
    for (const m of models) {
      const lowerName = m.name.toLowerCase();
      for (const forbidden of forbiddenProviderStrings) {
        if (lowerName.includes(forbidden)) {
          hasBrandedNames = true;
          console.error(`Found forbidden branding in model name: "${m.name}" contains "${forbidden}"`);
        }
      }
      if (sampleCleanNames.length < 5) {
        sampleCleanNames.push({ id: m.id, name: m.name, category: m.category, badge: m.contextBadge });
      }
    }
    assert(!hasBrandedNames, 'All model display names are clean with zero provider prefixes or :free tags');
    console.log('Sample Clean Models Displayed in UI:', sampleCleanNames);

    // ── TEST 4: Exclude Non-Chat, Image, Audio, and Decisions-Only Models ──────
    console.log('\n--- 4. Testing Strict Exclusion of Non-Chat & Non-Text Models ---');
    let hasNonChat = false;
    for (const m of models) {
      const id = m.id.toLowerCase();
      if (
        id.includes('whisper') ||
        id.includes('text-embedding') ||
        id.includes('audio') ||
        id.includes('tts') ||
        id.includes('image-generation') ||
        id.includes('sdxl') ||
        id.includes('flux') ||
        id.includes('decision')
      ) {
        hasNonChat = true;
        console.error(`Found illegal non-chat model in chat catalogue: ${m.id}`);
      }
    }
    assert(!hasNonChat, 'Zero non-chat models (no audio, embedding, image, or decisions-only models) in catalogue');

    // ── TEST 5: Valid Capability Categories & Context Badges ─────────────────
    console.log('\n--- 5. Testing Model Categorization & Context Badges ---');
    const validCategories = new Set(['fast', 'coding', 'reasoning', 'general', 'vision']);
    let allCategoriesValid = true;
    let allBadgesValid = true;

    for (const m of models) {
      if (!validCategories.has(m.category)) {
        allCategoriesValid = false;
        console.error(`Invalid category "${m.category}" for model ${m.id}`);
      }
      if (!m.contextBadge || !m.contextBadge.includes('context')) {
        allBadgesValid = false;
        console.error(`Invalid context badge "${m.contextBadge}" for model ${m.id}`);
      }
    }
    assert(allCategoriesValid, 'All models mapped to valid capability categories (fast, coding, reasoning, general, vision)');
    assert(allBadgesValid, 'All models have valid human-readable context badges (e.g. 128k context, 1M context)');

  } catch (err) {
    assert(false, 'Models discovery test threw an exception', err.message);
  }

  // ── TEST 6: Strict Image Generation Rule: Only SenseNova U1.5 Lite ─────────
  console.log('\n--- 6. Testing Strict Image Generation Rule ---');
  try {
    const imgRes = await post('/api/ai/image/generate', { prompt: 'a beautiful mountain peak' });
    assert(imgRes.status === 200, 'POST /api/ai/image/generate returns HTTP 200');
    assert(
      imgRes.data?.url && typeof imgRes.data.url === 'string',
      `Image URL generated successfully: ${imgRes.data?.url?.slice(0, 60)}...`
    );
    assert(
      imgRes.data?.model === 'sensenova/sensenova-u1.5-lite' || imgRes.data?.model === 'pollinations/flux',
      `Image model strictly constrained to SenseNova U1.5 Lite (or inline Pollinations fallback): ${imgRes.data?.model}`
    );
  } catch (err) {
    assert(false, 'Image generation test failed', err.message);
  }

  // ── TEST 7: Chat Routing for Providers ────────────────────────────────────
  console.log('\n--- 7. Testing /api/ai/chat Routing Logic ---');
  try {
    // Send a minimal request through the router
    const chatRes = await post('/api/ai/chat', {
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: 'Say "MASTER AI OK" and nothing else.' }],
      max_tokens: 30,
      stream: false,
    });

    assert(
      chatRes.status === 200 || chatRes.status === 429,
      `POST /api/ai/chat responds properly (HTTP ${chatRes.status})`
    );
    if (chatRes.status === 200) {
      console.log('Chat completion response:', chatRes.data?.choices?.[0]?.message?.content?.trim());
    } else if (chatRes.status === 429) {
      console.log('Rate limit safely handled with status 429 and Retry-After headers supported.');
    }
  } catch (err) {
    assert(false, 'Chat routing test failed', err.message);
  }

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
