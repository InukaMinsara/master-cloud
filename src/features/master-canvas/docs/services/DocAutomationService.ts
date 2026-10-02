export class DocAutomationService {
  /**
   * Extract all {{variable}} tags from document content HTML
   */
  static extractVariables(html: string): string[] {
    const matches = html.match(/\{\{([a-zA-Z0-9_\s]+)\}\}/g);
    if (!matches) return [];
    const unique = new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim()));
    return Array.from(unique);
  }

  /**
   * Replace all {{variable}} placeholders with values
   */
  static interpolate(html: string, variables: Record<string, string>): string {
    let output = html;
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      output = output.replace(regex, escapeHtml(variables[key] || ''));
    });
    return output;
  }

  /**
   * Parse CSV string into array of object records
   */
  static parseCsv(csvText: string): Record<string, string>[] {
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const records: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((val) => val.trim().replace(/^["']|["']$/g, ''));
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => {
        record[h] = row[idx] || '';
      });
      records.push(record);
    }

    return records;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
