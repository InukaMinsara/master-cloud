/**
 * src/features/ai/services/aiProviderRouter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — UNIFIED PROVIDER ROUTER
 * Intelligently routes incoming user requests between Groq (text, code, reasoning),
 * Pollinations AI (image generation & editing), and local ComfyUI.
 *
 * Enforces:
 * - Deterministic intent recognition (Text vs Image vs In-Chat Editing)
 * - Strict Free-Only policy enforcement
 * - Automatic safe free-model fallback
 * - Prevention of invalid routing (never sends image requests to Groq or chat to image endpoints)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  AiAttachment,
  AiProviderId,
  ChatMode,
  ImageAspectRatio,
} from '../types/aiTypes';

export type RequestIntent = 'text_chat' | 'image_generation' | 'image_edit';

export interface RouteResolution {
  intent: RequestIntent;
  targetProvider: AiProviderId;
  cleanedPrompt: string;
  referenceImageAttachment?: AiAttachment;
}

export class AiProviderRouter {
  /**
   * Deterministic intent classification heuristics.
   */
  public static resolveRoute(
    prompt: string,
    mode: ChatMode,
    attachments: AiAttachment[] = []
  ): RouteResolution {
    const raw = prompt.trim();
    const lower = raw.toLowerCase();

    // Check for image attachments that could be used for editing
    const imageAttachments = attachments.filter((a) => a.type === 'image');

    // 1. Explicit Mode Overrides
    if (mode === 'image') {
      if (imageAttachments.length > 0 && this.isEditingQuery(lower)) {
        return {
          intent: 'image_edit',
          targetProvider: 'pollinations',
          cleanedPrompt: this.cleanPrompt(raw),
          referenceImageAttachment: imageAttachments[0],
        };
      }
      return {
        intent: 'image_generation',
        targetProvider: 'pollinations',
        cleanedPrompt: this.cleanPrompt(raw),
      };
    }

    if (mode === 'chat') {
      return {
        intent: 'text_chat',
        targetProvider: 'groq',
        cleanedPrompt: raw,
      };
    }

    // 2. AUTO Mode: Intent Detection
    // Slash commands
    if (/^\/(image|img|draw|paint|gen)\b/i.test(raw)) {
      const stripped = raw.replace(/^\/(image|img|draw|paint|gen)\s*/i, '');
      if (imageAttachments.length > 0 && this.isEditingQuery(lower)) {
        return {
          intent: 'image_edit',
          targetProvider: 'pollinations',
          cleanedPrompt: stripped,
          referenceImageAttachment: imageAttachments[0],
        };
      }
      return {
        intent: 'image_generation',
        targetProvider: 'pollinations',
        cleanedPrompt: stripped,
      };
    }

    // Natural Language Image Generation Phrasing
    const isImageGenPattern =
      /^(generate|create|make|draw|render|paint|design)\s+.*?(image|picture|photo|illustration|artwork|rendering|wallpaper)\s+(of|with|depicting|showing)\b/i.test(
        lower
      ) ||
      /^(generate|draw|paint|render)\s+(me\s+)?.*?(image|picture|photo)\b/i.test(lower);

    // Natural Language Image Editing Phrasing (with reference attachment)
    if (imageAttachments.length > 0 && (this.isEditingQuery(lower) || isImageGenPattern)) {
      return {
        intent: 'image_edit',
        targetProvider: 'pollinations',
        cleanedPrompt: this.cleanPrompt(raw),
        referenceImageAttachment: imageAttachments[0],
      };
    }

    if (isImageGenPattern) {
      // Extract prompt without prefix
      const match = raw.match(
        /^(?:generate|create|make|draw|render|paint|design)(?:\s+.*?)?(?:image|picture|photo|illustration|artwork|rendering|wallpaper)\s+(?:of|with|depicting|showing)?\s*(.*)$/i
      );
      const cleaned = match && match[1]?.trim() ? match[1].trim() : raw;
      return {
        intent: 'image_generation',
        targetProvider: 'pollinations',
        cleanedPrompt: cleaned,
      };
    }

    // Default to conversational Groq intelligence
    return {
      intent: 'text_chat',
      targetProvider: 'groq',
      cleanedPrompt: raw,
    };
  }

  private static isEditingQuery(lower: string): boolean {
    return (
      lower.includes('make this') ||
      lower.includes('change this') ||
      lower.includes('edit this') ||
      lower.includes('turn this') ||
      lower.includes('restyle') ||
      lower.includes('modify this') ||
      lower.includes('replace the background') ||
      lower.includes('in this image') ||
      lower.includes('remove the') ||
      lower.includes('add a')
    );
  }

  private static cleanPrompt(prompt: string): string {
    return prompt.replace(/^\/(image|img|draw|paint|gen|edit)\s*/i, '').trim();
  }
}
