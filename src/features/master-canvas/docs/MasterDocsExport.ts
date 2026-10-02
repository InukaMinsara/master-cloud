import { CanvasDocData } from '@/types/canvas';

export class MasterDocsExportService {
  /**
   * Triggers clean browser printing for the document without UI chrome.
   */
  static printDocument(title: string, contentHtml: string, pageLayout?: CanvasDocData['pageLayout']) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pageSize = pageLayout?.size || 'A4';
    const orientation = pageLayout?.orientation || 'portrait';
    const margins = pageLayout?.margins === 'narrow' ? '0.5in' : pageLayout?.margins === 'wide' ? '1.5in' : '1in';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'Master Document'}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: ${pageSize} ${orientation};
              margin: ${margins};
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              line-height: 1.6;
              padding: 0;
              margin: 0;
            }
            h1, h2, h3, h4, h5, h6 { color: #0f172a; margin-top: 1.2em; margin-bottom: 0.5em; }
            table { width: 100%; border-collapse: collapse; margin: 1em 0; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
            th { background-color: #f8fafc; }
            img { max-width: 100%; height: auto; }
            blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #475569; margin: 1em 0; }
            code { background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
            pre { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${contentHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * Exports document as Microsoft Word compatible DOCX / HTML wrapper.
   */
  static exportToDocx(title: string, contentHtml: string) {
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1f2937; }
          h1 { font-size: 20pt; color: #1e3a8a; }
          h2 { font-size: 15pt; color: #1e40af; }
          h3 { font-size: 13pt; color: #1d4ed8; }
          table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
          td, th { border: 1px solid #94a3b8; padding: 6pt; }
          th { background-color: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
    `;
    const footer = `</body></html>`;
    const fullHtml = header + contentHtml + footer;

    const blob = new Blob(['\ufeff', fullHtml], {
      type: 'application/msword',
    });
    this.downloadBlob(blob, `${this.sanitizeFilename(title)}.doc`);
  }

  /**
   * Exports document as standalone HTML.
   */
  static exportToHtml(title: string, contentHtml: string) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { max-width: 850px; margin: 40px auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; padding: 0 20px; }
    h1, h2, h3 { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; }
    blockquote { border-left: 4px solid #3b82f6; margin: 0; padding-left: 16px; color: #64748b; }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    this.downloadBlob(blob, `${this.sanitizeFilename(title)}.html`);
  }

  /**
   * Exports document as RTF (Rich Text Format).
   */
  static exportToRtf(title: string, contentHtml: string) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    const text = tempDiv.innerText || tempDiv.textContent || '';
    const rtf = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Calibri;}}\n\\f0\\fs22 ${text.replace(/\n/g, '\\par\n')}}`;
    const blob = new Blob([rtf], { type: 'application/rtf;charset=utf-8' });
    this.downloadBlob(blob, `${this.sanitizeFilename(title)}.rtf`);
  }

  /**
   * Exports document as plain text.
   */
  static exportToTxt(title: string, contentHtml: string) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    const text = tempDiv.innerText || tempDiv.textContent || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    this.downloadBlob(blob, `${this.sanitizeFilename(title)}.txt`);
  }

  /**
   * Exports document as Markdown.
   */
  static exportToMarkdown(title: string, contentHtml: string) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    
    // Convert basic HTML to Markdown
    let md = tempDiv.innerHTML
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]+>/g, '');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    this.downloadBlob(blob, `${this.sanitizeFilename(title)}.md`);
  }

  /**
   * Exports complete structured document as JSON.
   */
  static exportToJson(title: string, data: any) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    this.downloadBlob(blob, `${this.sanitizeFilename(title)}.json`);
  }

  private static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private static sanitizeFilename(name: string): string {
    return (name || 'Untitled Document').replace(/[/\\?%*:|"<>]/g, '_').trim();
  }
}
