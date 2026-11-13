import { DocQualityIssue } from '../types';

export interface DocHealthMetrics {
  score: number; // 0 - 100
  readingEase: number; // Flesch Reading Ease
  gradeLevel: string; // Flesch-Kincaid Grade Level
  headingCount: number;
  imageCount: number;
  tableCount: number;
  linkCount: number;
  emptyParagraphCount: number;
  unresolvedCommentCount: number;
  issues: DocQualityIssue[];
}

export class DocQualityService {
  /**
   * Run full quality inspection on the document
   */
  static analyze(contentHtml: string, unresolvedCommentsCount: number = 0): DocHealthMetrics {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml || '';

    const text = tempDiv.innerText || tempDiv.textContent || '';
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;

    // Count sentences
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = Math.max(1, sentences.length);

    // Count syllables (approximate)
    let syllableCount = 0;
    words.forEach((w) => {
      syllableCount += countSyllables(w);
    });
    syllableCount = Math.max(1, syllableCount);

    // Flesch Reading Ease: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    let readingEase = 100;
    if (wordCount > 0) {
      readingEase = Math.round(
        206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)
      );
      readingEase = Math.max(0, Math.min(100, readingEase));
    }

    // Grade Level: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
    let gradeScore = 0;
    if (wordCount > 0) {
      gradeScore = Math.round(
        0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59
      );
    }
    const gradeLevel =
      gradeScore <= 6
        ? 'Elementary'
        : gradeScore <= 8
        ? 'Middle School'
        : gradeScore <= 12
        ? 'High School'
        : 'College / Professional';

    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const images = tempDiv.querySelectorAll('img');
    const tables = tempDiv.querySelectorAll('table');
    const links = tempDiv.querySelectorAll('a');
    const paragraphs = tempDiv.querySelectorAll('p');

    const issues: DocQualityIssue[] = [];

    // 1. Structure Check: Has headings?
    if (wordCount > 150 && headings.length === 0) {
      issues.push({
        id: 'iss-no-headings',
        type: 'warning',
        category: 'headings',
        message: 'Document contains over 150 words with no headings. Adding H1/H2 headings improves readability.',
        fixActionLabel: 'Add Heading',
      });
    }

    // 2. Accessibility: Images missing alt text
    let missingAltCount = 0;
    images.forEach((img) => {
      if (!img.getAttribute('alt') || img.getAttribute('alt')?.trim() === '') {
        missingAltCount++;
      }
    });
    if (missingAltCount > 0) {
      issues.push({
        id: 'iss-missing-alt',
        type: 'info',
        category: 'alt-text',
        message: `${missingAltCount} image(s) lack descriptive alt text for accessibility.`,
        fixActionLabel: 'Inspect Images',
      });
    }

    // 3. Clutter: Empty paragraphs
    let emptyPCount = 0;
    paragraphs.forEach((p) => {
      const pText = p.textContent?.trim() || '';
      if (!pText && !p.querySelector('img, table, iframe')) {
        emptyPCount++;
      }
    });
    if (emptyPCount > 3) {
      issues.push({
        id: 'iss-empty-blocks',
        type: 'info',
        category: 'empty-blocks',
        message: `Found ${emptyPCount} empty paragraph lines. Use paragraph spacing properties instead of multiple blank lines.`,
        fixActionLabel: 'Clean Up Spacing',
      });
    }

    // 4. Broken Links
    let brokenLinks = 0;
    links.forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.trim() === '') {
        brokenLinks++;
      }
    });
    if (brokenLinks > 0) {
      issues.push({
        id: 'iss-broken-links',
        type: 'warning',
        category: 'links',
        message: `${brokenLinks} hyperlink(s) are missing valid destination URLs.`,
        fixActionLabel: 'Fix Links',
      });
    }

    // 5. Unresolved Collaboration Feedback
    if (unresolvedCommentsCount > 0) {
      issues.push({
        id: 'iss-unresolved-comments',
        type: 'info',
        category: 'readability',
        message: `You have ${unresolvedCommentsCount} unresolved reviewer comments in this document.`,
        fixActionLabel: 'Open Comments',
      });
    }

    // Calculate Overall Health Score
    let score = 100;
    issues.forEach((iss) => {
      if (iss.type === 'error') score -= 15;
      else if (iss.type === 'warning') score -= 8;
      else if (iss.type === 'info') score -= 4;
    });
    score = Math.max(20, Math.min(100, score));

    return {
      score,
      readingEase,
      gradeLevel,
      headingCount: headings.length,
      imageCount: images.length,
      tableCount: tables.length,
      linkCount: links.length,
      emptyParagraphCount: emptyPCount,
      unresolvedCommentCount: unresolvedCommentsCount,
      issues,
    };
  }
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}
