export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

export interface DiffResult {
  segments: DiffSegment[];
  addedWords: number;
  removedWords: number;
  unchangedWords: number;
  similarityPercentage: number;
  diffHtml: string;
}

export class DocDiffService {
  /**
   * Strip HTML tags to compare raw textual document changes
   */
  static extractPlainText(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.innerText || tmp.textContent || '';
  }

  /**
   * Compare two text blocks using token-level LCS diff algorithm
   */
  static computeDiff(originalHtml: string, modifiedHtml: string): DiffResult {
    const textA = this.extractPlainText(originalHtml);
    const textB = this.extractPlainText(modifiedHtml);

    const wordsA = textA.split(/(\s+)/);
    const wordsB = textB.split(/(\s+)/);

    // Compute simple LCS table
    const n = wordsA.length;
    const m = wordsB.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (wordsA[i - 1] === wordsB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to build segments
    let i = n;
    let j = m;
    const rawSegments: DiffSegment[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
        rawSegments.unshift({ type: 'unchanged', text: wordsA[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        rawSegments.unshift({ type: 'added', text: wordsB[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        rawSegments.unshift({ type: 'removed', text: wordsA[i - 1] });
        i--;
      }
    }

    let addedWords = 0;
    let removedWords = 0;
    let unchangedWords = 0;
    let diffHtml = '<div class="master-docs-diff-view" style="font-family: inherit; line-height: 1.6;">';

    rawSegments.forEach((seg) => {
      const isWord = seg.text.trim().length > 0;
      if (seg.type === 'added') {
        if (isWord) addedWords++;
        diffHtml += `<span style="background-color: #dcfce7; color: #15803d; text-decoration: underline; padding: 1px 3px; border-radius: 3px;">${escapeHtml(
          seg.text
        )}</span>`;
      } else if (seg.type === 'removed') {
        if (isWord) removedWords++;
        diffHtml += `<span style="background-color: #fee2e2; color: #b91c1c; text-decoration: line-through; padding: 1px 3px; border-radius: 3px; opacity: 0.8;">${escapeHtml(
          seg.text
        )}</span>`;
      } else {
        if (isWord) unchangedWords++;
        diffHtml += escapeHtml(seg.text);
      }
    });

    diffHtml += '</div>';

    const totalWords = unchangedWords + addedWords;
    const similarity = totalWords > 0 ? Math.round((unchangedWords / (totalWords + removedWords)) * 100) : 100;

    return {
      segments: rawSegments,
      addedWords,
      removedWords,
      unchangedWords,
      similarityPercentage: Math.min(100, Math.max(0, similarity)),
      diffHtml,
    };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
