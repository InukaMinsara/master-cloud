import { DocCitationSource, CitationStyle } from '../types';

export class DocCitationService {
  /**
   * Format an in-text citation (e.g., "(Smith et al., 2024)" or "[1]")
   */
  static formatInText(source: DocCitationSource, index: number, style: CitationStyle = 'APA'): string {
    if (style === 'IEEE') {
      return `[${index + 1}]`;
    }

    const firstAuthor = source.authors[0] || 'Anonymous';
    const authorLastName = firstAuthor.split(' ').pop() || firstAuthor;

    if (source.authors.length === 1) {
      return `(${authorLastName}, ${source.year})`;
    } else if (source.authors.length === 2) {
      const secondLastName = source.authors[1].split(' ').pop() || source.authors[1];
      return `(${authorLastName} & ${secondLastName}, ${source.year})`;
    } else {
      return `(${authorLastName} et al., ${source.year})`;
    }
  }

  /**
   * Format full bibliography entry
   */
  static formatBibliographyEntry(source: DocCitationSource, index: number, style: CitationStyle = 'APA'): string {
    const authorsStr = source.authors.join(', ') || 'Anonymous';

    switch (style) {
      case 'APA':
        // APA: Author, A. A. (Year). Title of work. Publisher/Journal, Volume(Issue), Pages. DOI/URL
        return `${authorsStr} (${source.year}). <em>${source.title}</em>.${
          source.publisherOrJournal ? ` ${source.publisherOrJournal}` : ''
        }${source.volume ? `, ${source.volume}` : ''}${source.issue ? `(${source.issue})` : ''}${
          source.pages ? `, ${source.pages}` : ''
        }.${source.doi ? ` https://doi.org/${source.doi}` : source.url ? ` ${source.url}` : ''}`;

      case 'MLA':
        // MLA: Author. "Title." Publisher/Journal, vol. X, no. Y, Year, pp. Z.
        return `${authorsStr}. "${source.title}." <em>${source.publisherOrJournal || 'Publisher'}</em>${
          source.volume ? `, vol. ${source.volume}` : ''
        }${source.issue ? `, no. ${source.issue}` : ''}, ${source.year}${
          source.pages ? `, pp. ${source.pages}` : ''
        }.${source.url ? ` ${source.url}` : ''}`;

      case 'Chicago':
        // Chicago: Author. Year. "Title." Publisher/Journal.
        return `${authorsStr}. ${source.year}. "${source.title}." <em>${
          source.publisherOrJournal || 'Publication'
        }</em>.`;

      case 'IEEE':
        // IEEE: [1] A. Author, "Title," Journal, vol. x, no. y, pp. z, Year.
        return `[${index + 1}] ${authorsStr}, "${source.title}," <em>${
          source.publisherOrJournal || 'Publication'
        }</em>, ${source.year}.`;

      default:
        return `${authorsStr} (${source.year}). ${source.title}.`;
    }
  }

  /**
   * Generate complete References / Bibliography HTML Block
   */
  static generateBibliographyHtml(sources: DocCitationSource[], style: CitationStyle = 'APA'): string {
    if (!sources || sources.length === 0) return '';

    let html = `
      <div class="master-docs-bibliography" style="margin-top: 32px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
        <h2 style="font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 16px;">
          ${style === 'APA' ? 'References' : style === 'MLA' ? 'Works Cited' : 'Bibliography'}
        </h2>
        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; line-height: 1.6; color: #334155;">
    `;

    sources.forEach((s, idx) => {
      const entry = this.formatBibliographyEntry(s, idx, style);
      html += `<div style="padding-left: 24px; text-indent: -24px;">${entry}</div>`;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }
}
