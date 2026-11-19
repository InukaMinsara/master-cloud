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
   * Prepares the message history array for Groq within context window limits.
   */
  public static buildMessagesForInference(
    history: AiMessage[],
    currentPrompt: string,
    attachments?: AiAttachment[],
    customSystemPrompt?: string
  ): Array<{ role: AiRole; content: string }> {
    const messages: Array<{ role: AiRole; content: string }> = [];

    // System Persona
    messages.push({
      role: 'system',
      content: customSystemPrompt || DEFAULT_SYSTEM_PROMPT,
    });

    // Recent conversation turns (sliding window, max last 24 turns to keep fast latency)
    const recentHistory = history.slice(-24);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Assemble current user turn with document attachments if present
    let formattedPrompt = currentPrompt.trim();

    if (attachments && attachments.length > 0) {
      let attachmentContext = '\n\n[Attached Context Files]:\n';
      for (const att of attachments) {
        if (att.content) {
          attachmentContext += `\n--- File: ${att.name} (${(att.sizeBytes / 1024).toFixed(1)} KB) ---\n\`\`\`\n${att.content.slice(0, 15000)}\n\`\`\`\n`;
        }
      }
      formattedPrompt = `${attachmentContext}\n[User Directive]:\n${formattedPrompt}`;
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
