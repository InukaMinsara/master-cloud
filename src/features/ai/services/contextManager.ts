/**
 * src/features/ai/services/contextManager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI 2.0 — CONTEXT & MEMORY MANAGEMENT LAYER
 * Handles prompt assembly, document context grounding, context-window truncation,
 * and autonomous conversation title generation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AiAttachment, AiMessage, AiRole } from '../types/aiTypes';
import { groqService } from './groqService';

const DEFAULT_SYSTEM_PROMPT = `You are MASTER AI 2.0, an elite, high-performance AI assistant powered by Groq's low-latency LPU architecture.
- Provide direct, concise, and deeply insightful answers.
- For coding, write production-grade, bug-free, beautifully formatted code with comments where needed.
- Support English and Sinhala (සිංහල / Singlish) fluently and naturally.
- Use GitHub Flavored Markdown for formatting, including tables and syntax-highlighted code blocks.
- Never invent tool results or unverified facts.`;

export class ContextManager {
  /**
   * Estimates token count for a text string.
   * Uses conservative heuristic: ~3.5 chars per token for English & code,
   * with a safety buffer to prevent exceeding Groq free tier 8000 TPM limit.
   */
  public static estimateTokens(text: string): number {
    if (!text) return 0;
    // Word-based + character length blended estimate
    const charEstimate = Math.ceil(text.length / 3.6);
    const wordEstimate = Math.ceil((text.split(/\s+/).length || 1) * 1.3);
    return Math.max(charEstimate, wordEstimate);
  }

  /**
   * Prepares the message history array for inference within safe token budget limits.
   * Free tier models (e.g. gpt-oss-120b on Groq) enforce an 8,000 TPM cap.
   * Default maxPromptTokens = 3800 ensures requested prompt + generated output never exceeds 8000 TPM.
   */
  public static buildMessagesForInference(
    history: AiMessage[],
    currentPrompt: string,
    attachments?: AiAttachment[],
    customSystemPrompt?: string,
    maxPromptTokens = 3800
  ): Array<{ role: AiRole; content: string }> {
    const messages: Array<{ role: AiRole; content: string }> = [];

    // 1. System Persona
    const systemContent = customSystemPrompt || DEFAULT_SYSTEM_PROMPT;
    const systemTokens = this.estimateTokens(systemContent) + 10;

    // 2. Format Current User Message with Attachments
    let formattedPrompt = currentPrompt.trim();
    if (attachments && attachments.length > 0) {
      let attachmentContext = '\n\n[Attached Context Files]:\n';
      for (const att of attachments) {
        if (att.content) {
          // Truncate individual file if excessively long
          const snippet = att.content.length > 8000 ? att.content.slice(0, 8000) + '\n...[File Truncated for Context]' : att.content;
          attachmentContext += `\n--- File: ${att.name} (${(att.sizeBytes / 1024).toFixed(1)} KB) ---\n\`\`\`\n${snippet}\n\`\`\`\n`;
        }
      }
      formattedPrompt = `${attachmentContext}\n[User Directive]:\n${formattedPrompt}`;
    }

    const currentPromptTokens = this.estimateTokens(formattedPrompt) + 10;

    // 3. Calculate remaining budget for conversation history
    let remainingBudget = maxPromptTokens - systemTokens - currentPromptTokens;
    if (remainingBudget < 0) {
      // If prompt + attachments alone exceeded budget, compress attachments
      const allowedPromptChars = Math.max(500, (maxPromptTokens - systemTokens - 100) * 3);
      formattedPrompt = formattedPrompt.slice(0, allowedPromptChars) + '\n...[Attachments trimmed to fit TPM limit]';
      remainingBudget = 100;
    }

    // 4. Backwards traversal of history (prioritize most recent turns)
    const eligibleHistory = history.filter(
      (m) => (m.role === 'user' || m.role === 'assistant') && m.content && !m.isGeneratingImage
    );

    const includedTurns: Array<{ role: AiRole; content: string }> = [];
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
        // Budget exhausted: stop adding older messages
        break;
      }
    }

    // Assemble final ordered messages
    messages.push({
      role: 'system',
      content: systemContent,
    });

    for (const turn of includedTurns) {
      messages.push(turn);
    }

    messages.push({
      role: 'user',
      content: formattedPrompt,
    });

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
