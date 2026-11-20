/**
 * src/features/ai/services/chatNamingService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — AUTOMATIC CONVERSATION TITLE GENERATOR
 * Generates concise, meaningful titles immediately upon the first user message.
 * Provides instant heuristic naming with asynchronous LLM refinement.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class ChatNamingService {
  /**
   * Generates a smart title immediately on turn 1 using semantic pattern matching.
   * Runs in 0ms with zero network round-trip.
   */
  public static generateImmediateTitle(input: string): string {
    const raw = input.trim().replace(/^[/@#]\w+\s*/, ''); // strip slash command
    if (!raw) return 'New Conversation';

    const clean = raw.replace(/\s+/g, ' ');

    // Rule 1A: Specific match for "Explain how X works/operates" -> "How X Works"
    const explainHowMatch = clean.match(
      /^(?:can you\s+)?(?:please\s+)?explain\s+(how\s+.*?)(?:\?|\.|$)/i
    );
    if (explainHowMatch && explainHowMatch[1].trim()) {
      const phrase = explainHowMatch[1].trim();
      return this.titleCase(this.truncateWords(phrase, 6));
    }

    // Rule 1B: "Explain / What is / Tell me about"
    const explainMatch = clean.match(
      /^(?:can you\s+)?(?:please\s+)?(?:explain|describe|clarify|what is|tell me about)\s+(?:the\s+)?(.*?)(?:\s+works?|\s+operates?)?(?:\?|\.|$)/i
    );
    if (explainMatch && explainMatch[1].trim()) {
      const topic = this.titleCase(this.truncateWords(explainMatch[1].trim(), 5));
      return topic.toLowerCase().startsWith('understanding') ? topic : `Understanding ${topic}`;
    }

    // Rule 2: "How to / How do I"
    const howToMatch = clean.match(/^(?:how to|how do i|how can i)\s+(.*?)(?:\?|\.|$)/i);
    if (howToMatch && howToMatch[1].trim()) {
      const action = this.titleCase(this.truncateWords(howToMatch[1].trim(), 6));
      return `Guide: ${action}`;
    }

    // Rule 3: "Write / Create / Build / Implement / Code"
    const codeMatch = clean.match(
      /^(?:write|create|build|implement|make|code|generate)\s+(?:a|an|the)?\s*(.*?)(?:\.|$)/i
    );
    if (codeMatch && codeMatch[1].trim()) {
      return this.titleCase(this.truncateWords(codeMatch[1].trim(), 6));
    }

    // Rule 4: "Debug / Fix / Solve"
    const fixMatch = clean.match(/^(?:debug|fix|help with|solve|troubleshoot)\s+(?:this|the)?\s*(.*?)(?:\.|$)/i);
    if (fixMatch && fixMatch[1].trim()) {
      const target = fixMatch[1].trim();
      const inMatch = target.match(/(?:in|for)\s+([A-Za-z0-9_]+)/i);
      const subject = inMatch && inMatch[1] ? inMatch[1] : this.truncateWords(target, 4);
      return `Debugging ${this.titleCase(subject)}`;
    }

    // Rule 5: Fallback — first 5 words capitalized
    const words = this.truncateWords(clean, 5);
    const fallback = words.replace(/[`"'*?]/g, '').trim();
    return this.titleCase(fallback) || 'New Conversation';
  }

  private static truncateWords(str: string, maxWords = 6): string {
    const parts = str.trim().split(/\s+/);
    return parts.slice(0, maxWords).join(' ');
  }

  private static titleCase(str: string): string {
    const minorWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of']);
    return str
      .split(' ')
      .filter(Boolean)
      .map((word, idx) => {
        const lower = word.toLowerCase();
        if (idx > 0 && minorWords.has(lower)) {
          return lower;
        }
        // Preserve CamelCase or uppercase acronyms
        if (/[A-Z]/.test(word.slice(1)) || (word.length <= 4 && word === word.toUpperCase())) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  /**
   * Refines the conversation title asynchronously using the unified AI chat API.
   */
  public static async refineTitleAsync(firstMessage: string, modelId: string = 'openai/gpt-oss-120b'): Promise<string> {
    const fallback = this.generateImmediateTitle(firstMessage);
    const snippet = firstMessage.trim().slice(0, 200).replace(/[`"'\n\r]/g, ' ');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'system',
              content: 'You are a chat title generator. Output ONLY a concise 3-5 word title summarizing the user message. Do not include quotes, periods, prefixes, or preamble.',
            },
            {
              role: 'user',
              content: `Message: "${snippet}"`,
            },
          ],
          stream: false,
          max_tokens: 16,
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const rawTitle = json?.choices?.[0]?.message?.content || '';
        const cleanTitle = rawTitle.replace(/[`"'.\n\r]/g, '').trim();
        if (cleanTitle && cleanTitle.length > 2 && cleanTitle.length < 50) {
          return this.titleCase(cleanTitle);
        }
      }
    } catch {
      // Fallback seamlessly on timeout or network error
    }

    return fallback;
  }
}
