/**
 * DocSearchService.ts
 * Non-destructive TreeWalker-based Find & Replace highlighting and navigation.
 */

export class DocSearchService {
  private static readonly MATCH_CLASS = 'docs-search-match';
  private static readonly ACTIVE_CLASS = 'docs-search-match-active';

  /**
   * Removes all temporary search <mark> highlights while preserving text nodes cleanly.
   */
  static clearHighlights(editorEl: HTMLElement | null): void {
    if (!editorEl) return;
    const marks = Array.from(editorEl.querySelectorAll(`mark.${this.MATCH_CLASS}`));
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    });
  }

  /**
   * Strips temporary <mark> tags from an HTML string before persisting/exporting.
   */
  static stripHighlightMarksFromHtml(html: string): string {
    if (!html.includes(this.MATCH_CLASS)) return html;
    const div = document.createElement('div');
    div.innerHTML = html;
    this.clearHighlights(div);
    return div.innerHTML;
  }

  /**
   * Highlights all matches of `query` inside `editorEl` and scrolls to the first match.
   */
  static highlightMatches(
    editorEl: HTMLElement | null,
    query: string,
    matchCase: boolean,
  ): { count: number; activeIndex: number } {
    if (!editorEl) return { count: 0, activeIndex: 0 };
    this.clearHighlights(editorEl);

    const trimmed = query;
    if (!trimmed) return { count: 0, activeIndex: 0 };

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(escaped, flags);

    const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      if (current.nodeValue && current.nodeValue.trim().length > 0) {
        const parentEl = (current as Text).parentElement;
        if (parentEl && !parentEl.closest('.docs-page-break')) {
          textNodes.push(current as Text);
        }
      }
      current = walker.nextNode();
    }

    let matchIndex = 0;
    textNodes.forEach((node) => {
      const text = node.nodeValue || '';
      regex.lastIndex = 0;
      if (!regex.test(text)) return;

      regex.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        }
        const mark = document.createElement('mark');
        mark.className = this.MATCH_CLASS;
        mark.setAttribute('data-docs-match', String(matchIndex));
        mark.textContent = match[0];
        frag.appendChild(mark);
        matchIndex++;
        lastIdx = match.index + match[0].length;
        if (match[0].length === 0) break;
      }

      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }
      node.parentNode?.replaceChild(frag, node);
    });

    if (matchIndex > 0) {
      this.setActiveMatch(editorEl, 0);
    }

    return { count: matchIndex, activeIndex: 0 };
  }

  /**
   * Moves active highlight styling and scrolls smoothly to `index`.
   */
  static setActiveMatch(editorEl: HTMLElement | null, index: number): number {
    if (!editorEl) return 0;
    const marks = Array.from(editorEl.querySelectorAll(`mark.${this.MATCH_CLASS}`));
    if (marks.length === 0) return 0;

    const normalized = ((index % marks.length) + marks.length) % marks.length;
    marks.forEach((m, i) => {
      if (i === normalized) {
        m.classList.add(this.ACTIVE_CLASS);
        m.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        m.classList.remove(this.ACTIVE_CLASS);
      }
    });
    return normalized;
  }

  /**
   * Replaces the currently active match and refreshes remaining matches.
   */
  static replaceActiveMatch(
    editorEl: HTMLElement | null,
    replacement: string,
    query: string,
    matchCase: boolean,
    currentIndex: number,
  ): { count: number; activeIndex: number } {
    if (!editorEl) return { count: 0, activeIndex: 0 };
    const marks = Array.from(editorEl.querySelectorAll(`mark.${this.MATCH_CLASS}`));
    if (marks.length === 0) return { count: 0, activeIndex: 0 };

    const target = marks[Math.min(currentIndex, marks.length - 1)];
    if (target && target.parentNode) {
      target.parentNode.replaceChild(document.createTextNode(replacement), target);
      target.parentNode.normalize();
    }

    const res = this.highlightMatches(editorEl, query, matchCase);
    if (res.count > 0) {
      const nextIdx = this.setActiveMatch(editorEl, Math.min(currentIndex, res.count - 1));
      return { count: res.count, activeIndex: nextIdx };
    }
    return { count: 0, activeIndex: 0 };
  }
}
