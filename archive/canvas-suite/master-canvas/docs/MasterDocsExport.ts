import { CanvasDocData } from '@/types/canvas';
import { DocTheme } from './types';
import { DocDocxService } from './services/DocDocxService';
import { DocSearchService } from './services/DocSearchService';
import { DocThemesService } from './services/DocThemesService';

export class MasterDocsExportService {
  /**
   * Triggers clean browser printing for the document without UI chrome.
   */
  static printDocument(
    title: string,
    contentHtml: string,
    pageLayout?: CanvasDocData['pageLayout'],
    theme?: DocTheme,
  ) {
    const cleanHtml = DocSearchService.stripHighlightMarksFromHtml(contentHtml);
    const activeTheme = theme || DocThemesService.getBuiltinThemes()[0];
    const headingDark = DocThemesService.darkenHex(activeTheme.primaryColor, 0.74);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pageSize = pageLayout?.size || 'A4';
    const orientation = pageLayout?.orientation || 'portrait';
    const margins = pageLayout?.margins === 'narrow' ? '0.5in' : pageLayout?.margins === 'wide' ? '1.5in' : '1in';
    const lineHeight = pageLayout?.lineSpacing || 1.16;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'Document'}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: ${pageSize} ${orientation};
              margin: ${margins};
            }
            body {
              font-family: ${activeTheme.bodyFont}, Aptos, Calibri, "Iskoola Pota", "Nirmala UI", sans-serif;
              font-size: 12pt;
              color: #000000;
              line-height: ${lineHeight};
              padding: 0;
              margin: 0;
            }
            h1, h2 { font-family: ${activeTheme.headingFont}; color: ${headingDark}; font-weight: 400; }
            h1 { font-size: 20pt; margin-top: 18pt; margin-bottom: 4pt; }
            h2 { font-size: 16pt; margin-top: 8pt; margin-bottom: 4pt; }
            h3 { font-size: 14pt; color: ${headingDark}; font-weight: 400; margin-top: 8pt; margin-bottom: 4pt; }
            h4 { font-size: 12pt; color: ${headingDark}; font-style: italic; font-weight: 400; }
            .word-title { font-family: ${activeTheme.headingFont}; font-size: 28pt; margin-bottom: 4pt; }
            .word-subtitle { font-size: 14pt; color: #595959; margin-bottom: 8pt; }
            .word-no-spacing { margin: 0; line-height: 1; }
            table { width: 100%; border-collapse: collapse; margin: 1em 0; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
            th { background-color: ${activeTheme.tableHeaderBg}; }
            img { max-width: 100%; height: auto; }
            blockquote { border-left: 3px solid ${activeTheme.primaryColor}; padding-left: 1rem; color: #404040; font-style: italic; margin: 8pt 0; }
            blockquote.word-intense-quote { border-left: none; border-top: 1.5px solid ${headingDark}; border-bottom: 1.5px solid ${headingDark}; text-align: center; padding: 10px 24px; color: ${headingDark}; }
            code { background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: Consolas, monospace; font-size: 0.9em; }
            pre { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; overflow-x: auto; }
            .docs-page-break { page-break-before: always; break-before: page; border: none; height: 0; margin: 0; }
            .docs-page-break::after { display: none; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${cleanHtml}
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
   * Exports document as a genuine Microsoft Word OpenXML (.docx) file.
   */
  static async exportToDocx(
    title: string,
    contentHtml: string,
    pageLayout?: CanvasDocData['pageLayout'],
    theme?: DocTheme,
  ) {
    const cleanHtml = DocSearchService.stripHighlightMarksFromHtml(contentHtml);
    const blob = await DocDocxService.exportDocxBlob(title, cleanHtml, pageLayout, theme);
    this.downloadBlob(blob, `${this.sanitizeFilename(title)}.docx`);
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
