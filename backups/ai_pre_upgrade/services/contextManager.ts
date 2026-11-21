/**
 * src/features/ai/services/contextManager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — INTELLIGENT CONTEXT & TOKEN-LIMIT MANAGEMENT ENGINE
 *
 * Implements:
 * - Accurate multi-lingual & code token estimation
 * - Model-specific token budget allocation (strictly preventing 8000 TPM Groq errors)
 * - Dynamic context-window management & oldest-first intelligent truncation
 * - Automatic conversation synopsis/summarization for truncated older history
 * - Safe completion token (max_tokens) bounding so Requested <= 7,200 TPM
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AiAttachment, AiMessage, AiRole } from '../types/aiTypes';
import { groqService } from './groqService';
import { ModelCapabilityService } from './modelCapabilityService';

const DEFAULT_SYSTEM_PROMPT = `You are MASTER AI, an elite, high-performance AI assistant.
- Provide direct, concise, and deeply insightful answers.
- For coding, write production-grade, bug-free, beautifully formatted code with comments where needed.
- Support English and Sinhala (සිංහල / Singlish) fluently and naturally.
- Use GitHub Flavored Markdown for formatting, including tables and syntax-highlighted code blocks.
- Never invent tool results or unverified facts.`;

export class ContextManager {
  /**
   * Estimates token count for a text string.
   * Blends character and word heuristics with higher density weighting
   * for code syntax and multi-byte Unicode (e.g. Sinhala / Asian scripts).
   */
  public static estimateTokens(text: string): number {
    if (!text) return 0;

    // Detect non-ASCII / multi-byte characters
    const nonAsciiCount = (text.match(/[^\x00-\x7F]/g) || []).length;
    const nonAsciiRatio = nonAsciiCount / Math.max(1, text.length);

    // Heuristics:
    // Standard English/code: ~3.5 chars per token
    // Heavy Unicode/Sinhala: ~1.5 - 2 chars per token
    const divisor = nonAsciiRatio > 0.3 ? 2.0 : 3.5;
    const charEstimate = Math.ceil(text.length / divisor);
    const wordEstimate = Math.ceil((text.split(/\s+/).length || 1) * 1.35);

    return Math.max(charEstimate, wordEstimate);
  }

  /**
   * Estimates total token count of an array of inference messages,
   * including OpenAI per-message formatting overhead (3 tokens per message + 3 priming).
   */
  public static estimateMessagesTokens(
    messages: Array<{ role: string; content: string | any[] }>
  ): number {
    let total = 3; // Priming overhead
    for (const msg of messages) {
      total += 3; // Role + formatting markers
      if (typeof msg.content === 'string') {
        total += this.estimateTokens(msg.content);
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'text') {
            total += this.estimateTokens(part.text || '');
          } else if (part.type === 'image_url') {
            total += 800; // Standard visual token budget allocation
          }
        }
      }
    }
    return total;
  }

  /**
   * Determines if a model is subject to Groq free-tier rate limits (8000 TPM cap).
   */
  public static isGroqRateLimitedModel(modelId?: string): boolean {
    if (!modelId) return true;
    const lower = modelId.toLowerCase();
    if (lower.endsWith(':free')) return false;
    return (
      lower.startsWith('groq/') ||
      lower.startsWith('openai/gpt-oss') ||
      (lower.startsWith('meta-llama/') && !lower.includes('muse')) ||
      (lower.startsWith('llama-') && !lower.includes(':free'))
    );
  }

  /**
   * Calculates safe max_tokens (output completion ceiling) to strictly guarantee
   * promptTokens + max_tokens never exceeds the free tier 8000 TPM limit.
   */
  public static getSafeOutputTokens(modelId: string | undefined, promptTokens: number): number {
    const isReasoning = /reason|r1|o1|o3|qwq|thought|kimi/i.test(modelId || '');
    if (!this.isGroqRateLimitedModel(modelId)) {
      // High context models (xKiro, Pollinations, OpenRouter, Abhibots)
      return isReasoning ? 4096 : 2048;
    }

    // Strict Groq safety: 8000 TPM limit - 800 token safety margin = 7200 max requested
    const remainingForOutput = 7200 - promptTokens;

    // Output must be at least 1024 (so reasoning / code models don't exhaust limits), up to 2048
    if (remainingForOutput <= 1024) {
      return 1024;
    }
    return Math.min(2048, remainingForOutput);
  }

  /**
   * Generates a concise synopsis of older messages that had to be pruned
   * due to context budget exhaustion, preserving conversational memory.
   */
  public static summarizeOlderMessages(prunedMessages: AiMessage[]): string {
    if (!prunedMessages || prunedMessages.length === 0) return '';

    const summaryPoints: string[] = [];
    for (const m of prunedMessages) {
      if (!m.content || m.isGeneratingImage || m.isError) continue;
      const snippet = m.content.trim().slice(0, 120).replace(/\n+/g, ' ');
      if (m.role === 'user') {
        summaryPoints.push(`- User asked about: "${snippet}${m.content.length > 120 ? '...' : ''}"`);
      } else if (m.role === 'assistant') {
        summaryPoints.push(`- Assistant addressed: "${snippet}${m.content.length > 120 ? '...' : ''}"`);
      }
    }

    if (summaryPoints.length === 0) return '';
    return `[Summary of earlier discussion to maintain context]:\n${summaryPoints.slice(-4).join('\n')}`;
  }

  /**
   * Prepares the message history array for inference within safe token budget limits.
   * Dynamically adapts token budget based on selected model:
   * - Groq models: maxPromptTokens = 3200 (guaranteeing Requested = prompt + completion <= 7200 < 8000 TPM)
   * - High-context models: maxPromptTokens = 12000
   */
  public static buildMessagesForInference(
    history: AiMessage[],
    currentPrompt: string,
    attachments?: AiAttachment[],
    customSystemPrompt?: string,
    modelId?: string
  ): Array<{ role: AiRole; content: string | any[] }> {
    const isGroq = this.isGroqRateLimitedModel(modelId);
    const caps = ModelCapabilityService.getModelCapabilities(modelId || '');
    // Safe prompt budget: 3200 for Groq (prevents 8000 TPM errors), 16000 for high-context models
    const maxPromptTokens = isGroq ? 3200 : 16000;

    // 1. System Persona
    const systemContent = customSystemPrompt || DEFAULT_SYSTEM_PROMPT;
    const systemTokens = this.estimateTokens(systemContent) + 10;

    // 2. Format Current User Message with Attachments
    let formattedPrompt = currentPrompt.trim();
    const imageParts: Array<{ type: 'image_url'; image_url: { url: string } }> = [];

    if (attachments && attachments.length > 0) {
      let attachmentContext = '\n\n[Attached Reference Documents & Multimodal Data]:\n';
      for (const att of attachments) {
        // Document / Code / Spreadsheet / Presentation
        if (att.content) {
          const maxFileChars = isGroq ? 4000 : 16000;
          const snippet =
            att.content.length > maxFileChars
              ? att.content.slice(0, maxFileChars) + '\n...[Content Truncated to fit context window]'
              : att.content;
          attachmentContext += `\n--- [Attachment: ${att.name} (${(att.sizeBytes / 1024).toFixed(1)} KB)] ---\n${snippet}\n`;
        }

        // Native Image Vision Input
        if (att.type === 'image' && att.dataUri && caps.hasVision) {
          imageParts.push({
            type: 'image_url',
            image_url: { url: att.dataUri },
          });
        }

        // Video Keyframe Vision Input
        if (att.type === 'video' && att.keyframes && att.keyframes.length > 0 && caps.hasVision) {
          for (const kf of att.keyframes) {
            imageParts.push({
              type: 'image_url',
              image_url: { url: kf.dataUri },
            });
          }
        }
      }
      formattedPrompt = `${attachmentContext}\n[User Directive]:\n${formattedPrompt}`;
    }

    let currentPromptTokens = this.estimateTokens(formattedPrompt) + 10 + imageParts.length * 800;

    // If current prompt alone exceeds safe budget, compress text attachments
    if (systemTokens + currentPromptTokens > maxPromptTokens) {
      const allowedPromptChars = Math.max(600, (maxPromptTokens - systemTokens - 80 - imageParts.length * 800) * 3);
      formattedPrompt =
        formattedPrompt.slice(0, allowedPromptChars) +
        '\n...[Context trimmed to respect model token safety limits]';
      currentPromptTokens = this.estimateTokens(formattedPrompt) + 10 + imageParts.length * 800;
    }

    // 3. Calculate remaining budget for conversation history
    let remainingBudget = Math.max(0, maxPromptTokens - systemTokens - currentPromptTokens);

    // 4. Backwards traversal of history (prioritize most recent turns)
    const eligibleHistory = history.filter(
      (m) => (m.role === 'user' || m.role === 'assistant') && m.content && !m.isGeneratingImage && !m.isError
    );

    const includedTurns: Array<{ role: AiRole; content: string }> = [];
    const prunedHistory: AiMessage[] = [];

    for (let i = eligibleHistory.length - 1; i >= 0; i--) {
      const msg = eligibleHistory[i];
      const msgTokens = this.estimateTokens(msg.content) + 8;
      if (msgTokens <= remainingBudget) {
        includedTurns.unshift({
          role: msg.role,
          content: msg.content,
        });
        remainingBudget -= msgTokens;
      } else {
        // Budget exhausted: record remaining older messages for summarization
        prunedHistory.unshift(...eligibleHistory.slice(0, i + 1));
        break;
      }
    }

    // 5. Generate concise summary of pruned older history if any exists
    const olderSummary = this.summarizeOlderMessages(prunedHistory);

    // Assemble final ordered messages
    const messages: Array<{ role: AiRole; content: string | any[] }> = [];

    // System prompt
    messages.push({
      role: 'system',
      content: systemContent,
    });

    // If older turns were pruned, inject concise summary right after system message
    if (olderSummary) {
      messages.push({
        role: 'system',
        content: olderSummary,
      });
    }

    // Recent preserved turns
    for (const turn of includedTurns) {
      messages.push(turn);
    }

    // Active user turn: Multimodal parts if vision images exist, otherwise plain text
    if (imageParts.length > 0) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: formattedPrompt },
          ...imageParts,
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: formattedPrompt,
      });
    }

    return messages;
  }

  /**
   * Generates a concise 3-5 word conversation title using the fast 8B model.
   */
  public static async generateTitle(firstUserMessage: string): Promise<string> {
    try {
      if (!groqService.hasApiKey()) {
        return firstUserMessage.slice(0, 28) + (firstUserMessage.length > 28 ? '...' : '');
      }

      const prompt = `Generate a concise, 3 to 5 word title summarizing this user conversation prompt. Output ONLY the raw title without quotation marks or punctuation: "${firstUserMessage.slice(0, 200)}"`;
      const title = await groqService.completeChat(prompt, {
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        maxTokens: 16,
      });

      const clean = title.replace(/[`"'\n\r]/g, '').trim();
      return clean.length > 1 ? clean.slice(0, 40) : firstUserMessage.slice(0, 28);
    } catch {
      return firstUserMessage.slice(0, 28) + (firstUserMessage.length > 28 ? '...' : '');
    }
  }

  /**
   * Reads and extracts textual content from a user-uploaded File.
   */
  public static async readFileText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsText(file);
    });
  }
}
