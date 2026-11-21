/**
 * src/features/ai/services/modelCapabilityService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — MODEL CAPABILITY & COMPATIBILITY ENGINE
 *
 * Verifies and detects real multimodal capabilities for every discovered model:
 * - Native Vision (Image understanding & Visual Keyframe analysis)
 * - Application-Assisted Document Understanding (PDF, DOCX, XLSX, PPTX, Code)
 * - Application-Assisted Video Understanding (Representative Keyframes + Metadata)
 * - Code & Structural Reasoning
 *
 * Provides real-time compatibility checks between attached files and selected models,
 * warning the user with helpful explanations without silently replacing their choice.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AiAttachment, ModelCapabilities, UnifiedChatModel } from '../types/aiTypes';

export class ModelCapabilityService {
  /**
   * Evaluates verified capabilities for a model based on model ID, name, and provider traits.
   */
  public static getModelCapabilities(modelId: string, category?: string): ModelCapabilities {
    const id = modelId.toLowerCase();

    // 1. Vision Capability Check
    // Models with verified native vision inputs (image_url parts):
    const hasVision =
      id.includes('vision') ||
      id.includes('super-vl') ||
      id.includes('gpt-5.4-nano') ||
      id.includes('gpt-6.1-terra') ||
      id.includes('vl-72b') ||
      id.includes('nemotron-3.5-super-vl') ||
      id.includes('gemini') ||
      id.includes('claude-3') ||
      id.includes('claude-4') ||
      id.includes('claude-5') ||
      category === 'vision';

    // 2. Application-Assisted Document Understanding
    // Supported across all chat models via client-side structured extraction
    const hasAppDocument = true;

    // 3. Application-Assisted Video Understanding
    // Video analysis generates representative keyframes and metadata; requires vision for visual inspection
    const hasAppVideo = hasVision;

    // 4. Code & Architecture Capability
    const hasCode =
      id.includes('code') ||
      id.includes('dev') ||
      id.includes('120b') ||
      id.includes('70b') ||
      id.includes('qwen') ||
      id.includes('mistral') ||
      category === 'coding' ||
      category === 'reasoning';

    // 5. Extended Multi-step Reasoning
    const hasReasoning =
      id.includes('reason') ||
      id.includes('r1') ||
      id.includes('120b') ||
      id.includes('qwen') ||
      id.includes('flint') ||
      category === 'reasoning';

    // 6. Context Length Heuristic
    let contextLength = 131072;
    if (id.includes('nano') || id.includes('flash')) contextLength = 262144;
    if (id.includes('1m') || id.includes('ling')) contextLength = 1048576;
    if (id.includes('256k')) contextLength = 262144;

    return {
      hasVision,
      hasAppDocument,
      hasAppVideo,
      hasCode,
      hasReasoning,
      contextLength,
    };
  }

  /**
   * Checks whether the current model can handle the uploaded attachments.
   */
  public static checkCompatibility(
    selectedModel: UnifiedChatModel | undefined,
    attachments: AiAttachment[],
    allModels: UnifiedChatModel[] = []
  ): {
    isCompatible: boolean;
    hasImageAttachment: boolean;
    hasVideoAttachment: boolean;
    hasDocumentAttachment: boolean;
    warningMessage?: string;
    recommendedModelId?: string;
    recommendedModelName?: string;
  } {
    if (!attachments || attachments.length === 0) {
      return {
        isCompatible: true,
        hasImageAttachment: false,
        hasVideoAttachment: false,
        hasDocumentAttachment: false,
      };
    }

    const hasImageAttachment = attachments.some((a) => a.type === 'image');
    const hasVideoAttachment = attachments.some((a) => a.type === 'video');
    const hasDocumentAttachment = attachments.some((a) => a.type === 'file');

    if (!selectedModel) {
      return {
        isCompatible: true,
        hasImageAttachment,
        hasVideoAttachment,
        hasDocumentAttachment,
      };
    }

    const caps = selectedModel.capabilities || this.getModelCapabilities(selectedModel.id, selectedModel.category);

    // 1. Image Compatibility Check
    if (hasImageAttachment && !caps.hasVision) {
      // Find a verified vision model recommendation
      const visionRec = allModels.find(
        (m) =>
          (m.capabilities?.hasVision || this.getModelCapabilities(m.id, m.category).hasVision) &&
          (m.id.includes('command-a-vision') || m.id.includes('super-vl') || m.id.includes('gpt-5.4-nano'))
      ) || allModels.find((m) => m.capabilities?.hasVision || this.getModelCapabilities(m.id, m.category).hasVision);

      return {
        isCompatible: false,
        hasImageAttachment,
        hasVideoAttachment,
        hasDocumentAttachment,
        warningMessage: `The selected model (${selectedModel.name}) is optimized for text & documents and does not natively support visual image analysis. Switch to a vision-compatible model to inspect images.`,
        recommendedModelId: visionRec?.id || 'cohere/command-a-vision',
        recommendedModelName: visionRec?.name || 'Command A Vision',
      };
    }

    // 2. Video Compatibility Check
    if (hasVideoAttachment && !caps.hasVision) {
      const visionRec = allModels.find(
        (m) => m.capabilities?.hasVision || this.getModelCapabilities(m.id, m.category).hasVision
      );

      return {
        isCompatible: false,
        hasImageAttachment,
        hasVideoAttachment,
        hasDocumentAttachment,
        warningMessage: `Video visual frame analysis requires a vision-capable model. Switch to a vision model to inspect video frames and timestamps.`,
        recommendedModelId: visionRec?.id || 'cohere/command-a-vision',
        recommendedModelName: visionRec?.name || 'Command A Vision',
      };
    }

    return {
      isCompatible: true,
      hasImageAttachment,
      hasVideoAttachment,
      hasDocumentAttachment,
    };
  }
}
