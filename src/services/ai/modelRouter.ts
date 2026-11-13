/**
 * modelRouter.ts
 * MASTER AI CORE v2.0 — Intelligent Task-Routing Engine.
 *
 * Evaluates each incoming query dynamically across:
 * - Task intent & complexity (coding, math reasoning, vision, Sinhala, research RAG, media tools, chat)
 * - Required capabilities & context capacity
 * - Verified model availability, reliability EMA, latency, and cost
 * - Privacy & offline policy (never routes to cloud unless explicitly authorized)
 * - Manual user model override & ordered fallback chain
 * - Optional value-driven parallel execution (only when multi-model comparison adds value)
 */

import { LanguagePreferenceMode } from './conversationMemory';
import {
  AiModelDescriptor,
  BrainLayer,
  ModelRegistry,
  modelRegistry,
} from './modelRegistry';

export type TaskCategory =
  | 'coding'
  | 'math_reasoning'
  | 'vision'
  | 'sinhala'
  | 'research_rag'
  | 'media_tool'
  | 'general_chat';

export type TaskComplexity = 'simple' | 'moderate' | 'complex';

export interface TaskClassification {
  primaryTask: TaskCategory;
  secondaryTasks: TaskCategory[];
  complexity: TaskComplexity;
  containsSinhala: boolean;
  requiresVision: boolean;
  requiresDeterministicTools: boolean;
  requiresEvidenceRetrieval: boolean;
  estimatedContextTokensNeeded: number;
  subGoals: string[];
}

export interface RoutingOptions {
  languageMode?: LanguagePreferenceMode;
  offlineOnly?: boolean;
  allowCloud?: boolean;
  preferLocal?: boolean;
  preferFreeOrLowCost?: boolean;
  hasImageAttachment?: boolean;
  hasVideoTranscriptOrDocs?: boolean;
  manualModelId?: string | null;
  activeLocalModelId?: string | null;
  enableParallelComparison?: boolean;
  pureNeuralOnly?: boolean;
  requiredContextTokens?: number;
}

export interface ModelScoreBreakdown {
  modelId: string;
  score: number;
  eligible: boolean;
  disqualifyReason?: string;
  reasons: string[];
}

export interface RoutingDecision {
  classification: TaskClassification;
  selectedModel: AiModelDescriptor;
  fallbackChain: AiModelDescriptor[];
  parallelModels: AiModelDescriptor[]; // empty unless parallel comparison adds clear value
  usedManualOverride: boolean;
  attachDeterministicTools: boolean;
  routingReason: string;
  candidatesEvaluated: ModelScoreBreakdown[];
}

export class IntelligentModelRouter {
  constructor(private registry: ModelRegistry = modelRegistry) {}

  public classifyTask(
    query: string,
    options: Pick<
      RoutingOptions,
      'languageMode' | 'hasImageAttachment' | 'hasVideoTranscriptOrDocs' | 'requiredContextTokens'
    > = {},
  ): TaskClassification {
    const clean = (query || '').trim();
    const lower = clean.toLowerCase();

    const hasSinhalaChars = /[\u0D80-\u0DFF]/.test(clean);
    const mentionsSinhala = /\b(sinhala|සිංහල|sinhalen)\b/i.test(clean);
    const containsSinhala =
      hasSinhalaChars ||
      mentionsSinhala ||
      options.languageMode === 'sinhala' ||
      options.languageMode === 'mixed';

    const secondary: TaskCategory[] = [];

    const isCoding =
      /\b(code|typescript|javascript|python|rust|sql|regex|function|class|component|bug|error|stacktrace|compile|refactor|api|html|css|json|diff)\b/i.test(
        lower,
      ) || /```/.test(clean);
    const isMath =
      /\b(calculate|compute|equation|solve|formula|bitrate|megabit|aspect ratio|pixels|percent|percentage|sum|average|integral|derivative|math|multiply|divide|filesize|duration)\b/i.test(
        lower,
      ) || /\d+\s*[\+\-\*\/\^]\s*\d+/.test(clean);
    const isVision =
      Boolean(options.hasImageAttachment) ||
      /\b(image|screenshot|picture|frame|diagram|ocr|see in this photo|what is shown)\b/i.test(lower);
    const isMediaTool =
      /\b(chapter|chapters|timestamp|transcript|subtitle|dialogue|caption|equalizer|eq preset|hotkey|shortcut|quality boost|upscale|ab repeat|a-b loop|bookmark|scene|pacing|wpm)\b/i.test(
        lower,
      );
    const isResearch =
      /\b(analyze|compare|summarize|executive summary|deep research|evidence|cite|report|architecture|explain in detail|key takeaways|pros and cons)\b/i.test(
        lower,
      ) ||
      Boolean(options.hasVideoTranscriptOrDocs) ||
      clean.length > 260;

    if (isCoding) secondary.push('coding');
    if (isMath) secondary.push('math_reasoning');
    if (isVision) secondary.push('vision');
    if (containsSinhala) secondary.push('sinhala');
    if (isMediaTool) secondary.push('media_tool');
    if (isResearch) secondary.push('research_rag');

    let primaryTask: TaskCategory = 'general_chat';
    if (options.hasImageAttachment || isVision) primaryTask = 'vision';
    else if (isCoding) primaryTask = 'coding';
    else if (isMath && !isMediaTool) primaryTask = 'math_reasoning';
    else if (isMediaTool && (isMath || /\b(bitrate|resolution|hotkey|eq|equalizer|preset|duration|size|chapter|transcript|subtitle|dialogue)\b/i.test(lower))) {
      primaryTask = 'media_tool';
    } else if (isResearch) primaryTask = 'research_rag';
    else if (containsSinhala) primaryTask = 'sinhala';

    const sentenceCount = clean.split(/[.!?\n]+/).filter((s) => s.trim().length > 0).length;
    const hasConjunctions = /\b(and then|also|compare|plus|step by step|first.*second)\b/i.test(lower);
    const complexity: TaskComplexity =
      clean.length > 240 || secondary.length >= 2 || (sentenceCount >= 3 && hasConjunctions)
        ? 'complex'
        : clean.length > 75 || secondary.length >= 1
          ? 'moderate'
          : 'simple';

    const subGoals: string[] = [];
    if (isMath || isMediaTool) subGoals.push('Execute deterministic calculations / metadata lookup');
    if (options.hasVideoTranscriptOrDocs || isResearch || isMediaTool) {
      subGoals.push('Retrieve relevant local evidence (BM25 / transcripts / Drive docs / LTM)');
    }
    subGoals.push(`Synthesize answer (${containsSinhala ? 'Sinhala/Bilingual' : 'English'}) with ${primaryTask}`);
    subGoals.push('Validate output for hallucinations, loops, and numeric consistency');

    return {
      primaryTask,
      secondaryTasks: Array.from(new Set(secondary)),
      complexity,
      containsSinhala,
      requiresVision: Boolean(options.hasImageAttachment || isVision),
      requiresDeterministicTools: isMath || isMediaTool,
      requiresEvidenceRetrieval: isResearch || isMediaTool || Boolean(options.hasVideoTranscriptOrDocs),
      estimatedContextTokensNeeded: options.requiredContextTokens ?? (isResearch ? 2048 : 512),
      subGoals,
    };
  }

  public selectRoute(query: string, options: RoutingOptions = {}): RoutingDecision {
    const classification = this.classifyTask(query, options);
    const allModels = this.registry.listModels();

    const orchestratorFallback =
      this.registry.getModel('master-ai-v2-orchestrator') ||
      allModels[0];

    const breakdowns: ModelScoreBreakdown[] = [];

    for (const model of allModels) {
      const reasons: string[] = [];
      let disqualifyReason: string | undefined;

      const provider = this.registry.getProvider(model.providerId);
      if (!provider || !provider.enabled) {
        disqualifyReason = 'Provider disabled';
      } else if (options.offlineOnly && !model.isLocal) {
        disqualifyReason = 'Blocked by Offline Mode';
      } else if (!model.isLocal && !options.allowCloud) {
        disqualifyReason = 'Cloud inference not authorized';
      } else if (model.availability !== 'ready') {
        disqualifyReason = model.availabilityDetail || `Unavailable (${model.availability})`;
      } else if (options.hasImageAttachment && !model.supportsVision) {
        disqualifyReason = 'No vision support for attached image';
      } else if (
        model.contextCapacityTokens < classification.estimatedContextTokensNeeded &&
        model.id !== 'master-ai-v1-onnx'
      ) {
        disqualifyReason = `Context ${model.contextCapacityTokens} < required ${classification.estimatedContextTokensNeeded}`;
      } else if (options.pureNeuralOnly && model.modelType === 'tool_orchestrator') {
        disqualifyReason = 'Pure Neural mode excludes tool orchestrator';
      }

      if (disqualifyReason) {
        breakdowns.push({
          modelId: model.id,
          score: -1,
          eligible: false,
          disqualifyReason,
          reasons,
        });
        continue;
      }

      let score = 50;

      // 1. Task Capability Match
      if (classification.primaryTask === 'coding') {
        score += (model.codingQualityScore ?? 0.3) * 35;
        if (model.capabilities.includes('coding')) {
          score += 12;
          reasons.push('coding specialist');
        }
      } else if (classification.primaryTask === 'vision') {
        if (model.supportsVision) {
          score += 35;
          reasons.push('vision capable');
        }
      } else if (classification.primaryTask === 'math_reasoning' || classification.primaryTask === 'media_tool') {
        if (model.modelType === 'tool_orchestrator') {
          score += 36;
          reasons.push('exact deterministic media & math tools');
        } else if (model.capabilities.includes('math_reasoning')) {
          score += 24;
          reasons.push('math reasoning + tools');
        }
      } else if (classification.primaryTask === 'research_rag') {
        if (model.capabilities.includes('research') || model.capabilities.includes('summarization')) {
          score += 20;
        }
        score += Math.min(18, Math.log2(Math.max(512, model.contextCapacityTokens) / 512) * 3);
        reasons.push('research & long-context');
      }

      // 2. Bilingual / Sinhala Verified Performance
      if (classification.containsSinhala) {
        const siScore = model.sinhalaQualityScore ?? 0.3;
        score += siScore * 28;
        if (siScore >= 0.7) reasons.push(`verified Sinhala (${Math.round(siScore * 100)}%)`);
      } else {
        score += (model.englishQualityScore ?? 0.5) * 18;
      }

      // 3. Do not send open-ended prose/coding tasks to the tiny 5.16M research baseline if stronger models are ready!
      if (model.id === 'master-ai-v1-onnx') {
        score -= 22;
        reasons.push('v1.0 5.16M pilot (research capacity)');
      }

      // 3b. Prioritize real Brain B open-weight local models over deterministic doc fallback on generative & compound reasoning tasks
      const hasGenerativeReasoningNeed =
        /\b(explain|confirm|step[- ]by[- ]step|why|compare|analyze|summarize|step)\b/i.test(query);
      if (
        model.brain === 'local' &&
        classification.primaryTask !== 'media_tool' &&
        (classification.primaryTask !== 'math_reasoning' || hasGenerativeReasoningNeed)
      ) {
        score += 16;
        reasons.push('Brain B local open-weight generation');
      }
      if (options.activeLocalModelId && model.id === options.activeLocalModelId && model.brain === 'local') {
        score += 25;
        reasons.push('active Local Brain selection');
      }

      // 4. Local-first & Cost affinity
      if (model.isLocal) {
        score += options.preferLocal !== false ? 14 : 5;
        reasons.push('local privacy & zero cost');
      } else if (options.preferFreeOrLowCost && (model.costPer1kOutputUsd ?? 0.01) > 0.002) {
        score -= 10;
        reasons.push('higher cloud cost penalty');
      }

      // 5. Runtime Reliability & Latency Telemetry
      score += model.performanceStats.reliabilityEma * 15;
      if (model.performanceStats.avgLatencyMs > 0) {
        score -= Math.min(12, model.performanceStats.avgLatencyMs / 600);
      }

      breakdowns.push({
        modelId: model.id,
        score: Number(score.toFixed(2)),
        eligible: true,
        reasons,
      });
    }

    breakdowns.sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score);

    // Handle explicit manual override
    if (options.manualModelId && options.manualModelId !== 'auto') {
      const manual = this.registry.getModel(options.manualModelId);
      if (manual) {
        const manualCheck = breakdowns.find((b) => b.modelId === manual.id);
        const eligibleFallbacks = breakdowns
          .filter((b) => b.eligible && b.modelId !== manual.id)
          .map((b) => this.registry.getModel(b.modelId)!)
          .filter(Boolean);

        // Hard safety: do not allow blocked cloud override when cloud is unauthorized
        const blockedByPrivacy = !manual.isLocal && (!options.allowCloud || options.offlineOnly);
        if (!blockedByPrivacy && (manual.availability === 'ready' || manual.id === 'master-ai-v1-onnx')) {
          return {
            classification,
            selectedModel: manual,
            fallbackChain: eligibleFallbacks,
            parallelModels: [],
            usedManualOverride: true,
            attachDeterministicTools: classification.requiresDeterministicTools,
            routingReason: `Manual override selected "${manual.name}"${manualCheck?.reasons.length ? ` (${manualCheck.reasons.join(', ')})` : ''}.`,
            candidatesEvaluated: breakdowns,
          };
        }
      }
    }

    const eligibleModels = breakdowns
      .filter((b) => b.eligible)
      .map((b) => this.registry.getModel(b.modelId)!)
      .filter(Boolean);

    const selectedModel = eligibleModels[0] || orchestratorFallback;
    const fallbackChain = eligibleModels.slice(1);
    if (!fallbackChain.some((m) => m.id === orchestratorFallback.id) && selectedModel.id !== orchestratorFallback.id) {
      fallbackChain.push(orchestratorFallback);
    }

    // Value-driven optional parallel execution: ONLY when explicitly enabled AND >= 2 ready non-trivial models AND complex/reasoning task
    const parallelModels: AiModelDescriptor[] = [];
    if (
      options.enableParallelComparison &&
      (classification.complexity === 'complex' ||
        classification.primaryTask === 'coding' ||
        classification.primaryTask === 'math_reasoning' ||
        classification.primaryTask === 'research_rag')
    ) {
      const strongReady = eligibleModels.filter((m) => m.id !== 'master-ai-v1-onnx').slice(0, 2);
      if (strongReady.length >= 2) {
        parallelModels.push(...strongReady);
      }
    }

    const topBreak = breakdowns.find((b) => b.modelId === selectedModel.id);
    const brainTag: Record<BrainLayer, string> = {
      original: 'Brain A (Original)',
      local: 'Brain B (Local Open-Weight)',
      cloud: 'Brain C (Cloud)',
    };

    return {
      classification,
      selectedModel,
      fallbackChain,
      parallelModels,
      usedManualOverride: false,
      attachDeterministicTools: classification.requiresDeterministicTools,
      routingReason: `Auto-routed [${classification.primaryTask} · ${classification.complexity}] → ${selectedModel.name} [${brainTag[selectedModel.brain]}]${topBreak?.reasons.length ? ` (${topBreak.reasons.join(', ')})` : ''}`,
      candidatesEvaluated: breakdowns,
    };
  }
}

export const modelRouter = new IntelligentModelRouter(modelRegistry);
