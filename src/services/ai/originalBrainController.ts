/**
 * originalBrainController.ts
 * MASTER AI CORE v2.0 — Brain A: Original Brain (Main Controller).
 *
 * Central Intelligence Orchestrator responsible for:
 * 1. Understanding user intent & decomposing multi-step tasks
 * 2. Executing deterministic tools (media specs, docs/transcript BM25, safe arithmetic)
 * 3. Retrieving & separating Long-Term Semantic Memories from newly generated text
 * 4. Routing via IntelligentModelRouter across Brain A / Brain B / Brain C
 * 5. Optional value-driven parallel execution & output scoring
 * 6. Real-time hallucination, repetition loop, script, & uncertainty validation
 * 7. Graceful automatic fallback across models when rate-limited, offline, or failing
 */

import {
  ChatSourceBadge,
  LanguagePreferenceMode,
  LongTermMemoryEntry,
  StoredChatMessage,
  conversationMemory,
} from './conversationMemory';
import {
  OutputValidationResult,
  validateModelOutput,
} from './evaluationEngine';
import { localBrainManager } from './localBrain';
import { cloudBrainManager } from './cloudBrain';
import {
  AiModelDescriptor,
  BrainLayer,
  UnifiedChatMessage,
  UnifiedChatResponse,
  modelRegistry,
} from './modelRegistry';
import { RoutingDecision, modelRouter } from './modelRouter';
import {
  ToolAssistedResponse,
  VideoAIContext,
  toolAssistedOrchestrator,
} from './toolAssistedLocalMode';

export interface OrchestratorRequest {
  query: string;
  history?: StoredChatMessage[];
  sessionId?: string;
  mediaContext?: VideoAIContext;
  externalFileContext?: { name: string; contentExcerpt: string } | null;
  imageDataUrl?: string;
  languageMode?: LanguagePreferenceMode;
  manualModelId?: string | null;
  offlineOnly?: boolean;
  pureNeuralOnly?: boolean;
  enableParallelComparison?: boolean;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  repetitionPenalty?: number;
  signal?: AbortSignal;
  onProgress?: (partialText: string, tokensApprox: number) => void;
}

export interface ParallelCandidateResult {
  modelId: string;
  modelName: string;
  brain: BrainLayer;
  text: string;
  latencyMs: number;
  validation: OutputValidationResult;
}

export interface OrchestratorResponse {
  text: string;
  modelId: string;
  modelName: string;
  brainUsed: BrainLayer;
  sourcesUsed: ChatSourceBadge[];
  sourceLabel: string;
  routingDecision: RoutingDecision;
  validation: OutputValidationResult;
  rememberedMemories: LongTermMemoryEntry[];
  deterministicFactsUsed: string[];
  orchestrationTrace: string[];
  fallbackTriggered: boolean;
  matchedTimestamps: Array<{ time: number; label: string }>;
  suggestedAction?: ToolAssistedResponse['suggestedAction'];
  tokensGenerated: number;
  promptTokens: number;
  maxContextTokens: number;
  compressedNotice: string | null;
  latencyMs: number;
  tokensPerSecond?: number;
  computeBackend?: string;
  estimatedCostUsd: number;
  parallelAlternatives?: ParallelCandidateResult[];
}

/**
 * Pure zero-eval recursive descent arithmetic evaluator for deterministic math verification.
 * Supports numbers, +, -, *, /, %, parentheses, and negation.
 */
export function evaluateSafeArithmeticExpression(expr: string): { ok: true; value: number; formatted: string } | { ok: false } {
  const cleaned = (expr || '').replace(/,/g, '').trim();
  if (!cleaned || !/^[0-9+\-*/().%\s]+$/.test(cleaned) || !/\d/.test(cleaned)) {
    return { ok: false };
  }
  // Require at least one operator so standalone plain integers aren't misinterpreted
  if (!/[+\-*/%]/.test(cleaned.replace(/^-/, ''))) {
    return { ok: false };
  }

  let pos = 0;
  const skipWs = () => {
    while (pos < cleaned.length && /\s/.test(cleaned[pos])) pos++;
  };

  const parseExpression = (): number => {
    let val = parseTerm();
    while (true) {
      skipWs();
      if (cleaned[pos] === '+') {
        pos++;
        val += parseTerm();
      } else if (cleaned[pos] === '-') {
        pos++;
        val -= parseTerm();
      } else {
        break;
      }
    }
    return val;
  };

  const parseTerm = (): number => {
    let val = parseFactor();
    while (true) {
      skipWs();
      const ch = cleaned[pos];
      if (ch === '*') {
        pos++;
        val *= parseFactor();
      } else if (ch === '/') {
        pos++;
        const denom = parseFactor();
        if (denom === 0) throw new Error('Division by zero');
        val /= denom;
      } else if (ch === '%') {
        pos++;
        const mod = parseFactor();
        if (mod === 0) throw new Error('Modulo by zero');
        val %= mod;
      } else {
        break;
      }
    }
    return val;
  };

  const parseFactor = (): number => {
    skipWs();
    if (cleaned[pos] === '+') {
      pos++;
      return parseFactor();
    }
    if (cleaned[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    if (cleaned[pos] === '(') {
      pos++;
      const inner = parseExpression();
      skipWs();
      if (cleaned[pos] !== ')') throw new Error('Unclosed parenthesis');
      pos++;
      return inner;
    }
    const start = pos;
    let seenDot = false;
    while (pos < cleaned.length && (/\d/.test(cleaned[pos]) || (cleaned[pos] === '.' && !seenDot))) {
      if (cleaned[pos] === '.') seenDot = true;
      pos++;
    }
    if (pos === start) throw new Error('Expected number');
    const num = Number(cleaned.slice(start, pos));
    if (!Number.isFinite(num)) throw new Error('Invalid number');
    return num;
  };

  try {
    const val = parseExpression();
    skipWs();
    if (pos !== cleaned.length || !Number.isFinite(val)) return { ok: false };
    const formatted = Number.isInteger(val) ? String(val) : Number(val.toFixed(6)).toString();
    return { ok: true, value: val, formatted };
  } catch {
    return { ok: false };
  }
}

export function extractInlineArithmeticResult(query: string): { expression: string; formatted: string } | null {
  const candidates = query.match(/[\d().+\-*/%\s]{3,60}/g) || [];
  let best: { expression: string; formatted: string } | null = null;
  for (const cand of candidates) {
    const expr = cand.trim();
    const res = evaluateSafeArithmeticExpression(expr);
    if (res.ok) {
      if (!best || expr.length > best.expression.length) {
        best = { expression: expr, formatted: res.formatted };
      }
    }
  }
  return best;
}

const DEFAULT_EMPTY_MEDIA: VideoAIContext = {
  fileName: 'Workspace',
  duration: 0,
  currentTime: 0,
  cues: [],
  scenes: [],
  bookmarks: [],
};

export class OriginalBrainController {
  public async processQuery(req: OrchestratorRequest): Promise<OrchestratorResponse> {
    const started = Date.now();
    const trace: string[] = [];
    const mediaCtx = req.mediaContext || DEFAULT_EMPTY_MEDIA;
    const history = req.history || [];

    // Sync cloud authorization state cleanly before routing
    cloudBrainManager.syncCloudModelAvailability();
    const privacy = cloudBrainManager.getPrivacyPolicy();

    // 1. Decompose Intent & Plan Route
    const hasTranscript = (mediaCtx.cues?.length ?? 0) > 0;
    const hasEvidenceSource = hasTranscript || Boolean(req.externalFileContext);
    const localSettings = localBrainManager.getInferenceSettings();
    const decision = modelRouter.selectRoute(req.query, {
      languageMode: req.languageMode ?? 'auto',
      offlineOnly: req.offlineOnly,
      allowCloud: !req.offlineOnly && privacy.allowCloudProcessing,
      preferLocal: true,
      hasImageAttachment: Boolean(req.imageDataUrl),
      hasVideoTranscriptOrDocs: hasEvidenceSource,
      manualModelId: req.manualModelId,
      activeLocalModelId: localSettings.activeLocalModelId,
      enableParallelComparison: req.enableParallelComparison,
      pureNeuralOnly: req.pureNeuralOnly,
    });

    trace.push(
      `Intent: ${decision.classification.primaryTask} (${decision.classification.complexity}) | Plan: ${decision.routingReason}`,
    );

    // 2. Execute Deterministic Pre-Tools (zero hallucination math & local facts)
    const deterministicFacts: string[] = [];
    const verifiedNumbers: string[] = [];

    const arithmetic = extractInlineArithmeticResult(req.query);
    if (arithmetic) {
      deterministicFacts.push(`Deterministic Math: \`${arithmetic.expression} = ${arithmetic.formatted}\``);
      verifiedNumbers.push(arithmetic.formatted);
      trace.push(`Math Verifier computed: ${arithmetic.expression} = ${arithmetic.formatted}`);
    }

    let preMatchedTimestamps: Array<{ time: number; label: string }> = [];
    if (!req.pureNeuralOnly && req.mediaContext && req.mediaContext.duration > 0) {
      const specsOut = toolAssistedOrchestrator.executeSafeToolCall('calc_media_specs', {}, mediaCtx);
      if (specsOut.ok) {
        try {
          const parsedSpecs = JSON.parse(specsOut.resultJson);
          if (parsedSpecs.bitrate_mbps) verifiedNumbers.push(String(parsedSpecs.bitrate_mbps));
          deterministicFacts.push(
            `Media Specs (${mediaCtx.fileName}): ${parsedSpecs.duration_formatted}, ${parsedSpecs.bitrate_mbps} Mbps`,
          );
        } catch {
          // ignore
        }
      }
      if (hasTranscript && decision.classification.requiresEvidenceRetrieval) {
        const searchOut = toolAssistedOrchestrator.executeSafeToolCall(
          'search_transcript',
          { query: req.query },
          mediaCtx,
        );
        if (searchOut.ok && searchOut.timestamps.length > 0) {
          preMatchedTimestamps = searchOut.timestamps;
          trace.push(`Transcript RAG matched ${preMatchedTimestamps.length} timestamped cue(s).`);
        }
      }
    }

    // 3. Retrieve Long-Term Semantic Memory & Assemble Context Window
    const activeContextBudget = Math.min(8192, decision.selectedModel.contextCapacityTokens || 2048);
    const reserveOut = Math.min(1024, Math.floor(activeContextBudget * 0.25));
    const systemPromptLines = [
      'You are MASTER AI (Original Brain Controller). Provide accurate, honest, naturally fluent responses.',
      req.languageMode === 'sinhala'
        ? 'Reply naturally in accurate Sinhala script.'
        : req.languageMode === 'mixed'
          ? 'Reply naturally blending Sinhala and English cleanly.'
          : 'Match the user language (Sinhala or English).',
      'Never fabricate facts, numbers, or unspoken video dialogue. Separate remembered facts from newly computed outputs.',
    ];
    if (deterministicFacts.length > 0) {
      systemPromptLines.push(`[VERIFIED DETERMINISTIC FACTS]\n${deterministicFacts.join('\n')}`);
    }
    if (req.externalFileContext && (!privacy.allowCloudProcessing || privacy.sendDocumentContext || decision.selectedModel.isLocal)) {
      systemPromptLines.push(
        `[WORKSPACE DOCUMENT: ${req.externalFileContext.name}]\n${req.externalFileContext.contentExcerpt.slice(0, 2400)}`,
      );
    }

    const effectiveHistory =
      !decision.selectedModel.isLocal && !privacy.sendConversationHistory ? [] : history;

    const ctxWindow = conversationMemory.buildContextWindowWithLongTerm(
      systemPromptLines.join('\n'),
      effectiveHistory,
      req.query,
      {
        maxContextTokens: decision.selectedModel.id === 'master-ai-v1-onnx' ? 512 : activeContextBudget,
        reserveGenTokens: decision.selectedModel.id === 'master-ai-v1-onnx' ? 112 : reserveOut,
        mediaFileName: req.mediaContext?.fileName,
        sessionId: req.sessionId,
      },
    );

    const remembered = ctxWindow.rememberedMemories || [];
    if (remembered.length > 0) {
      trace.push(`Retrieved ${remembered.length} relevant long-term semantic memory entry(ies).`);
    }

    const adapterMessages: UnifiedChatMessage[] = ctxWindow.turns.map((t, idx) => ({
      role: t.role === 'tool_result' ? 'tool' : t.role,
      content: t.content,
      ...(idx === ctxWindow.turns.length - 1 && t.role === 'user' && req.imageDataUrl
        ? { imageDataUrl: req.imageDataUrl }
        : {}),
    }));

    const executeSingleModel = async (
      model: AiModelDescriptor,
      enableStreaming: boolean,
    ): Promise<{
      response: UnifiedChatResponse;
      matchedTimestamps: Array<{ time: number; label: string }>;
      suggestedAction?: ToolAssistedResponse['suggestedAction'];
      sources: ChatSourceBadge[];
    }> => {
      if (model.id === 'master-ai-v2-orchestrator' || model.modelType === 'tool_orchestrator') {
        const res = await this.executeOriginalToolOrchestrator(
          req.query,
          mediaCtx,
          req.externalFileContext,
          arithmetic,
          remembered,
          req.languageMode,
          req.pureNeuralOnly,
          enableStreaming ? req.onProgress : undefined,
          req.signal,
        );
        return {
          response: {
            modelId: model.id,
            providerId: model.providerId,
            brain: 'original',
            text: res.text,
            promptTokensEstimate: ctxWindow.promptTokens,
            completionTokensEstimate: Math.ceil(res.text.length / 4),
            latencyMs: res.latencyMs,
            finishReason: 'stop',
            estimatedCostUsd: 0,
          },
          matchedTimestamps: res.matchedTimestamps,
          suggestedAction: res.suggestedAction,
          sources: res.sources,
        };
      }

      const unifiedReq = {
        modelId: model.id,
        messages: adapterMessages,
        temperature: req.temperature,
        topP: req.topP,
        topK: req.topK,
        maxTokens: req.maxTokens,
        repetitionPenalty: req.repetitionPenalty,
        signal: req.signal,
        onToken: enableStreaming
          ? (partial: string, _d: string, count: number) => req.onProgress?.(partial, count)
          : undefined,
      };

      const gen = model.isLocal
        ? await localBrainManager.generateLocal(model, unifiedReq)
        : await cloudBrainManager.generateCloud(model, unifiedReq);

      const sources: ChatSourceBadge[] = [
        model.brain === 'original'
          ? 'neural_core'
          : model.isLocal
            ? 'local_open_weight'
            : 'cloud_brain',
      ];
      return {
        response: gen,
        matchedTimestamps: preMatchedTimestamps,
        suggestedAction: undefined,
        sources,
      };
    };

    // 4. Optional Parallel Comparison vs Primary Execution + Automatic Fallback Queue
    let chosenExec: Awaited<ReturnType<typeof executeSingleModel>> | null = null;
    let fallbackTriggered = false;
    let parallelAlternatives: ParallelCandidateResult[] | undefined;

    if (decision.parallelModels.length >= 2) {
      trace.push(`Parallel Compare enabled across ${decision.parallelModels.map((m) => m.name).join(' vs ')}.`);
      const settled = await Promise.allSettled(
        decision.parallelModels.map((m) => executeSingleModel(m, false)),
      );
      const validRuns: Array<{
        exec: Awaited<ReturnType<typeof executeSingleModel>>;
        model: AiModelDescriptor;
        val: OutputValidationResult;
      }> = [];

      settled.forEach((item, idx) => {
        const candModel = decision.parallelModels[idx];
        if (item.status === 'fulfilled') {
          const val = validateModelOutput(item.value.response.text, {
            requestedLanguage: req.languageMode,
            hasTranscriptCues: hasTranscript,
            asksAboutDialogue: decision.classification.primaryTask === 'media_tool' && /\b(say|said|speak|dialogue|talk)\b/i.test(req.query),
            verifiedNumbers,
          });
          validRuns.push({ exec: item.value, model: candModel, val });
        } else {
          trace.push(`Parallel candidate "${candModel.name}" failed: ${item.reason instanceof Error ? item.reason.message : String(item.reason)}`);
        }
      });

      if (validRuns.length > 0) {
        validRuns.sort((a, b) => Number(b.val.valid) - Number(a.val.valid) || b.val.confidenceScore - a.val.confidenceScore);
        chosenExec = validRuns[0].exec;
        chosenExec.sources.push('parallel_verified');
        req.onProgress?.(chosenExec.response.text, chosenExec.response.completionTokensEstimate);
        parallelAlternatives = validRuns.map((v) => ({
          modelId: v.model.id,
          modelName: v.model.name,
          brain: v.model.brain,
          text: v.exec.response.text,
          latencyMs: v.exec.response.latencyMs,
          validation: v.val,
        }));
      }
    }

    const failureDetails: string[] = [];
    if (!chosenExec) {
      const attemptQueue = [decision.selectedModel, ...decision.fallbackChain];
      for (let i = 0; i < attemptQueue.length; i++) {
        const candidate = attemptQueue[i];
        if (req.signal?.aborted) break;
        if (i > 0) fallbackTriggered = true;

        try {
          trace.push(`Executing ${i === 0 ? 'primary' : `fallback #${i}`}: ${candidate.name}`);
          chosenExec = await executeSingleModel(candidate, i === 0 || attemptQueue.length <= 2);
          if (i > 0) {
            trace.push(`Fallback succeeded cleanly on ${candidate.name}.`);
          }
          break;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          failureDetails.push(`${candidate.name}: ${msg}`);
          trace.push(`Model "${candidate.name}" failed (${msg}); checking next fallback...`);
          // Enforce strict privacy: never fall back from Local to Cloud unless explicitly allowed
          if (!candidate.isLocal) {
            cloudBrainManager.syncCloudModelAvailability();
          }
        }
      }
    }

    // Ultimate fail-safe: deterministic local Brain A answer so system NEVER crashes
    if (!chosenExec) {
      fallbackTriggered = true;
      chosenExec = await executeSingleModel(
        modelRegistry.getModel('master-ai-v2-orchestrator') || decision.selectedModel,
        true,
      );
    }

    // 5. Real-Time Output Validation, Hallucination & Uncertainty Guard
    const asksDialogue =
      /(speaker say|exact dialogue|what was said|what did\b.*\b(say|said|speak|talk)|when did\b.*\bsay|who said|spoken dialogue|dialogue at minute|කතා කළේ|වීඩියෝවේ කිව්වේ|කිව්වේ කුමක්ද)/i.test(
        req.query,
      );
    let finalText = chosenExec.response.text;
    const validation = validateModelOutput(finalText, {
      requestedLanguage: req.languageMode,
      hasTranscriptCues: hasTranscript,
      asksAboutDialogue: asksDialogue,
      verifiedNumbers,
    });

    if (remembered.length > 0) {
      chosenExec.sources.push('long_term_memory');
    }
    if (arithmetic) {
      chosenExec.sources.push('deterministic_calc');
      if (!finalText.includes(arithmetic.formatted)) {
        finalText = `${finalText}\n\n---\n**Verified Deterministic Calculation:** \`${arithmetic.expression} = ${arithmetic.formatted}\``;
      }
    }

    if (!validation.valid || validation.warnings.length > 0) {
      trace.push(`Validator flagged: ${validation.warnings.join('; ')}`);
      if (validation.failureCategory === 'missing_evidence_hallucination') {
        finalText =
          'Cannot verify spoken dialogue because no subtitle or transcript track is currently loaded for this media. Load or generate subtitles first.';
      } else if (validation.failureCategory === 'loop_degeneration') {
        finalText = `${finalText}\n\n> **Brain A Integrity Notice:** Repetitive loop degeneration was detected in raw generation output (confidence ${Math.round(validation.confidenceScore * 100)}%).`;
      }
    }

    // Clearly distinguish remembered cross-session facts vs newly generated output
    if (remembered.length > 0 && !finalText.includes('Remembered from prior sessions')) {
      finalText = `${finalText}\n\n> *Context note — Remembered from prior sessions (${remembered.length}):* ${remembered
        .map((m) => `“${m.content.slice(0, 80)}”`)
        .join(' · ')}`;
    }
    if (fallbackTriggered && failureDetails.length > 0 && chosenExec.response.modelId === 'master-ai-v2-orchestrator') {
      finalText = `${finalText}\n\n> *Brain A Recovery Note:* Primary model (${failureDetails[0]}) could not complete, so Brain A recovered safely without fabricating generative text.`;
    }

    // 6. Conservative Memory Extraction (no fabrication)
    conversationMemory.extractMemoryCandidatesFromTurn(
      req.query,
      req.sessionId,
      req.mediaContext?.fileName,
    );

    const usedModel = modelRegistry.getModel(chosenExec.response.modelId) || decision.selectedModel;

    return {
      text: finalText,
      modelId: chosenExec.response.modelId,
      modelName: usedModel.name,
      brainUsed: chosenExec.response.brain,
      sourcesUsed: Array.from(new Set(chosenExec.sources)),
      sourceLabel:
        chosenExec.response.brain === 'cloud'
          ? `Brain C · ${usedModel.name}`
          : chosenExec.response.brain === 'local'
            ? `Brain B · ${usedModel.name}`
            : `Brain A · ${usedModel.name}`,
      routingDecision: decision,
      validation,
      rememberedMemories: remembered,
      deterministicFactsUsed: deterministicFacts,
      orchestrationTrace: trace,
      fallbackTriggered,
      matchedTimestamps: chosenExec.matchedTimestamps,
      suggestedAction: chosenExec.suggestedAction,
      tokensGenerated: chosenExec.response.completionTokensEstimate,
      promptTokens: chosenExec.response.promptTokensEstimate,
      maxContextTokens: ctxWindow.maxContextTokens,
      compressedNotice: ctxWindow.summaryNotice,
      latencyMs: Date.now() - started,
      tokensPerSecond: chosenExec.response.tokensPerSecond,
      computeBackend: chosenExec.response.computeBackend,
      estimatedCostUsd: chosenExec.response.estimatedCostUsd ?? 0,
      parallelAlternatives,
    };
  }

  private async executeOriginalToolOrchestrator(
    query: string,
    mediaContext: VideoAIContext,
    externalFile: OrchestratorRequest['externalFileContext'],
    arithmetic: { expression: string; formatted: string } | null,
    remembered: LongTermMemoryEntry[],
    languageMode: LanguagePreferenceMode = 'auto',
    pureNeuralOnly = false,
    onProgress?: (partial: string, count: number) => void,
    signal?: AbortSignal,
  ): Promise<{
    text: string;
    latencyMs: number;
    matchedTimestamps: Array<{ time: number; label: string }>;
    suggestedAction?: ToolAssistedResponse['suggestedAction'];
    sources: ChatSourceBadge[];
  }> {
    const started = Date.now();

    // File analysis grounded directly in the attached excerpt (no fake canned response!)
    if (externalFile) {
      const snippet = externalFile.contentExcerpt.trim();
      const lines = snippet ? snippet.split(/\r?\n/).slice(0, 12) : [];
      const text = [
        `### Grounded Document Inspection — \`${externalFile.name}\``,
        snippet
          ? `Extracted excerpt (${snippet.length} chars inspected locally):\n\n\`\`\`\n${lines.join('\n')}\n\`\`\``
          : `No plain-text excerpt was extracted from \`${externalFile.name}\` (binary asset or empty file). Connect a Local Open-Weight model in Brain B or an authorized Cloud Vision/LLM in Brain C for deeper semantic analysis.`,
        arithmetic ? `\n**Exact Calculation:** \`${arithmetic.expression} = ${arithmetic.formatted}\`` : '',
      ]
        .filter(Boolean)
        .join('\n');
      onProgress?.(text, Math.ceil(text.length / 4));
      return {
        text,
        latencyMs: Date.now() - started,
        matchedTimestamps: [],
        sources: ['doc_retrieval', ...(arithmetic ? (['deterministic_calc'] as ChatSourceBadge[]) : [])],
      };
    }

    // Pure math question outside video domain
    if (arithmetic && mediaContext.fileName === 'Workspace' && mediaContext.duration === 0) {
      const text =
        languageMode === 'sinhala'
          ? `නිවැරදි ගණනය කිරීමේ ප්‍රතිඵලය: \`${arithmetic.expression} = ${arithmetic.formatted}\``
          : `**Deterministic Calculation Result:** \`${arithmetic.expression} = ${arithmetic.formatted}\``;
      onProgress?.(text, Math.ceil(text.length / 4));
      return {
        text,
        latencyMs: Date.now() - started,
        matchedTimestamps: [],
        sources: ['deterministic_calc'],
      };
    }

    // Delegate media / docs / transcript queries to the proven Tool-Assisted Orchestrator
    const toolRes = await toolAssistedOrchestrator.processQuery(query, mediaContext, {
      languageMode,
      signal,
      onProgress: (txt, tok) => onProgress?.(txt, tok),
    });

    const mappedSources = toolRes.sourcesUsed.map((s) => s.type as ChatSourceBadge);
    let answer = toolRes.answerMarkdown;
    // Honest capability disclosure when user asks open-ended chat/coding while only offline rules + 5.16M pilot exist
    const usedDocs = mappedSources.includes('doc_retrieval');
    const usedTranscript = mappedSources.includes('transcript_grounding');
    const usedSpecs = mappedSources.includes('deterministic_calc');

    const looksOpenEndedGeneral =
      !usedDocs &&
      !usedTranscript &&
      !usedSpecs &&
      !arithmetic &&
      (toolRes.primarySource === 'neural_core' || (mediaContext.fileName === 'Workspace' && mediaContext.duration === 0));

    if (looksOpenEndedGeneral) {
      const memoryHint =
        remembered.length > 0
          ? `\n\n**Remembered Context:** ${remembered.map((m) => `- ${m.content}`).join('\n')}`
          : '';
      answer =
        languageMode === 'sinhala'
          ? `මෙම ප්‍රශ්නය සාමාන්‍ය/විවෘත AI සංවාදයක් වන අතර දැනට සක්‍රීය වී ඇත්තේ offline Original Brain මෙවලම් පද්ධතියයි. සම්පූර්ණ බුද්ධිමත් සංවාද, කේත ලිවීම සහ ගැඹුරු සිංහල පිළිතුරු සඳහා **Local Brain** හි open-weight model එකක් (උදා: Ollama Qwen2.5/Gemma2) හෝ **Cloud Brain** හි API සැපයුමක් සම්බන්ධ කරන්න.${memoryHint}`
          : `**Original Brain Notice (Offline Mode):** No local open-weight model (Ollama / llama.cpp) or authorized Cloud Brain is currently active for open-ended conversation or code generation.\n\nConnect a local quantized model in **Local Brain Manager** (zero API keys, 100% offline) or authorize a Cloud Provider in **Cloud & Privacy** to unlock full generative reasoning. Deterministic math, memory lookup, and local media tools remain ready anytime.${memoryHint}`;
    }

    onProgress?.(answer, Math.ceil(answer.length / 4));
    return {
      text: answer,
      latencyMs: Date.now() - started,
      matchedTimestamps: toolRes.matchedTimestamps,
      suggestedAction: toolRes.suggestedAction,
      sources: mappedSources.length > 0 ? mappedSources : ['tool_assisted_neural'],
    };
  }
}

export const originalBrainController = new OriginalBrainController();
