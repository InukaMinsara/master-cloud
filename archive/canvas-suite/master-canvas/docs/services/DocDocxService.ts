import JSZip from 'jszip';
import { CanvasDocData } from '@/types/canvas';
import { DocTheme } from '../types';
import { DocThemesService } from './DocThemesService';

/**
 * DocDocxService.ts
 * Native OpenXML (.docx) import & export engine using JSZip.
 */
export class DocDocxService {
  private static escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static isDocxZipBuffer(buf: ArrayBuffer): boolean {
    if (buf.byteLength < 4) return false;
    const view = new Uint8Array(buf, 0, 4);
    return view[0] === 0x50 && view[1] === 0x4b; // 'PK'
  }

  /**
   * Parses a real Microsoft Word (.docx) binary into clean HTML + extracted title.
   */
  static async importDocxBuffer(buffer: ArrayBuffer, fallbackTitle = 'Imported Document'): Promise<{ title: string; html: string }> {
    const zip = await JSZip.loadAsync(buffer);
    const docFile = zip.file('word/document.xml');
    if (!docFile) {
      throw new Error('Invalid DOCX archive: missing word/document.xml');
    }

    const xmlText = await docFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    const body = xmlDoc.getElementsByTagName('w:body')[0] || xmlDoc.documentElement;

    const htmlParts: string[] = [];
    let extractedTitle = fallbackTitle;
    let foundFirstHeading = false;

    const parseRuns = (pEl: Element): string => {
      let runHtml = '';
      const children = Array.from(pEl.childNodes);
      for (const child of children) {
        if (!(child instanceof Element)) continue;
        if (child.tagName === 'w:r') {
          const rPr = child.getElementsByTagName('w:rPr')[0];
          const isBold = Boolean(rPr?.getElementsByTagName('w:b')[0]);
          const isItalic = Boolean(rPr?.getElementsByTagName('w:i')[0]);
          const isUnderline = Boolean(rPr?.getElementsByTagName('w:u')[0]);
          const isStrike = Boolean(rPr?.getElementsByTagName('w:strike')[0]);
          const szVal = rPr?.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
          const colorVal = rPr?.getElementsByTagName('w:color')[0]?.getAttribute('w:val');
          const fontVal = rPr?.getElementsByTagName('w:rFonts')[0]?.getAttribute('w:ascii');

          const brs = child.getElementsByTagName('w:br');
          for (let i = 0; i < brs.length; i++) {
            if (brs[i].getAttribute('w:type') === 'page') {
              runHtml += '<div data-page-break="true" class="docs-page-break" contenteditable="false"></div>';
            }
          }

          const tNodes = child.getElementsByTagName('w:t');
          let text = '';
          for (let i = 0; i < tNodes.length; i++) {
            text += tNodes[i].textContent || '';
          }
          if (!text) continue;

          let chunk = this.escapeHtml(text);
          const spanStyles: string[] = [];
          if (fontVal) spanStyles.push(`font-family: '${this.escapeHtml(fontVal)}', sans-serif`);
          if (szVal && !Number.isNaN(parseInt(szVal, 10))) {
            spanStyles.push(`font-size: ${parseInt(szVal, 10) / 2}pt`);
          }
          if (colorVal && /^[0-9A-Fa-f]{6}$/.test(colorVal)) {
            spanStyles.push(`color: #${colorVal}`);
          }
          if (spanStyles.length > 0) chunk = `<span style="${spanStyles.join('; ')}">${chunk}</span>`;
          if (isBold) chunk = `<strong>${chunk}</strong>`;
          if (isItalic) chunk = `<em>${chunk}</em>`;
          if (isUnderline) chunk = `<u>${chunk}</u>`;
          if (isStrike) chunk = `<s>${chunk}</s>`;
          runHtml += chunk;
        } else if (child.tagName === 'w:hyperlink') {
          runHtml += parseRuns(child);
        }
      }
      return runHtml;
    };

    const parseParagraph = (pEl: Element): { tag: string; isList: boolean; html: string } => {
      const pPr = pEl.getElementsByTagName('w:pPr')[0];
      const pStyle = pPr?.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || '';
      const numPr = pPr?.getElementsByTagName('w:numPr')[0];
      const inner = parseRuns(pEl);

      let tag = 'p';
      let className = '';
      if (/^Title$/i.test(pStyle)) { tag = 'p'; className = 'word-title'; }
      else if (/^Subtitle$/i.test(pStyle)) { tag = 'p'; className = 'word-subtitle'; }
      else if (/^NoSpacing$/i.test(pStyle)) { tag = 'p'; className = 'word-no-spacing'; }
      else if (/^Heading1$/i.test(pStyle)) tag = 'h1';
      else if (/^Heading2$/i.test(pStyle)) tag = 'h2';
      else if (/^Heading3$/i.test(pStyle)) tag = 'h3';
      else if (/^Heading4$/i.test(pStyle)) tag = 'h4';
      else if (/^IntenseQuote$/i.test(pStyle)) { tag = 'blockquote'; className = 'word-intense-quote'; }
      else if (/^Quote$/i.test(pStyle)) tag = 'blockquote';

      if (!foundFirstHeading && (tag === 'h1' || className === 'word-title') && inner.trim()) {
        const tmp = document.createElement('div');
        tmp.innerHTML = inner;
        extractedTitle = tmp.textContent?.trim() || fallbackTitle;
        foundFirstHeading = true;
      }

      if (numPr) {
        return { tag: 'li', isList: true, html: `<li>${inner || '&nbsp;'}</li>` };
      }

      if (!inner.trim()) {
        return { tag: 'p', isList: false, html: '<p><br></p>' };
      }

      const classAttr = className ? ` class="${className}"` : '';
      return { tag, isList: false, html: `<${tag}${classAttr}>${inner}</${tag}>` };
    };

    let listOpen = false;
    const bodyChildren = Array.from(body.childNodes);
    for (const node of bodyChildren) {
      if (!(node instanceof Element)) continue;
      if (node.tagName === 'w:p') {
        const parsed = parseParagraph(node);
        if (parsed.isList) {
          if (!listOpen) {
            htmlParts.push('<ul>');
            listOpen = true;
          }
          htmlParts.push(parsed.html);
        } else {
          if (listOpen) {
            htmlParts.push('</ul>');
            listOpen = false;
          }
          htmlParts.push(parsed.html);
        }
      } else if (node.tagName === 'w:tbl') {
        if (listOpen) {
          htmlParts.push('</ul>');
          listOpen = false;
        }
        let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 14px 0;"><tbody>';
        const rows = Array.from(node.getElementsByTagName('w:tr'));
        rows.forEach((tr, rowIdx) => {
          tableHtml += '<tr>';
          const cells = Array.from(tr.getElementsByTagName('w:tc'));
          cells.forEach((tc) => {
            const cellParas = Array.from(tc.getElementsByTagName('w:p'));
            const cellHtml = cellParas.map((cp) => parseRuns(cp)).filter(Boolean).join('<br>') || '&nbsp;';
            const tag = rowIdx === 0 ? 'th' : 'td';
            tableHtml += `<${tag} style="border: 1px solid #cbd5e1; padding: 8px 12px;">${cellHtml}</${tag}>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        htmlParts.push(tableHtml);
      }
    }
    if (listOpen) htmlParts.push('</ul>');

    return {
      title: extractedTitle,
      html: htmlParts.join('\n') || '<p></p>',
    };
  }

  /**
   * Exports document HTML to a genuine Microsoft Word OpenXML (.docx) Blob matching Word 365 styles & themes.
   */
  static async exportDocxBlob(
    title: string,
    contentHtml: string,
    pageLayout?: CanvasDocData['pageLayout'],
    theme?: DocTheme,
  ): Promise<Blob> {
    const activeTheme = theme || DocThemesService.getBuiltinThemes()[0];
    const majorFont = activeTheme.headingFont.split(',')[0].replace(/['"]/g, '').trim() || 'Aptos Display';
    const minorFont = activeTheme.bodyFont.split(',')[0].replace(/['"]/g, '').trim() || 'Aptos';
    const accent1Hex = (activeTheme.primaryColor || '#156082').replace('#', '').toUpperCase();
    const accent2Hex = (activeTheme.accentColor || '#E97132').replace('#', '').toUpperCase();
    const headingDarkHex = DocThemesService.darkenHex(activeTheme.primaryColor || '#156082', 0.74).replace('#', '').toUpperCase();
    const tableHdrHex = DocThemesService.lightenHexTint(activeTheme.primaryColor || '#156082', 0.9).replace('#', '').toUpperCase();

    const container = document.createElement('div');
    container.innerHTML = contentHtml;

    const toHex6 = (colorStr?: string): string | null => {
      if (!colorStr) return null;
      const c = colorStr.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(c)) return c.slice(1).toUpperCase();
      const m = c.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (m) {
        return [m[1], m[2], m[3]].map((n) => parseInt(n, 10).toString(16).padStart(2, '0')).join('').toUpperCase();
      }
      return null;
    };

    const buildRunsFromNode = (
      node: Node,
      inherited: { b: boolean; i: boolean; u: boolean; s: boolean; szHalfPt?: number; colorHex?: string; font?: string } = { b: false, i: false, u: false, s: false },
    ): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        const txt = node.nodeValue || '';
        if (!txt) return '';
        let rPr = '';
        if (inherited.font) rPr += `<w:rFonts w:ascii="${this.escapeXml(inherited.font)}" w:hAnsi="${this.escapeXml(inherited.font)}"/>`;
        if (inherited.b) rPr += '<w:b/>';
        if (inherited.i) rPr += '<w:i/>';
        if (inherited.u) rPr += '<w:u w:val="single"/>';
        if (inherited.s) rPr += '<w:strike/>';
        if (inherited.colorHex) rPr += `<w:color w:val="${inherited.colorHex}"/>`;
        if (inherited.szHalfPt) rPr += `<w:sz w:val="${inherited.szHalfPt}"/><w:szCs w:val="${inherited.szHalfPt}"/>`;
        const rPrXml = rPr ? `<w:rPr>${rPr}</w:rPr>` : '';
        return `<w:r>${rPrXml}<w:t xml:space="preserve">${this.escapeXml(txt)}</w:t></w:r>`;
      }

      if (node instanceof Element) {
        if (node.tagName === 'BR') {
          return '<w:r><w:br/></w:r>';
        }
        const elStyle = (node as HTMLElement).style;
        let nextSz = inherited.szHalfPt;
        if (elStyle?.fontSize && elStyle.fontSize.endsWith('pt')) {
          const pt = parseFloat(elStyle.fontSize);
          if (!Number.isNaN(pt) && pt > 0) nextSz = Math.round(pt * 2);
        }
        const nextColor = toHex6(elStyle?.color) || inherited.colorHex;
        const nextFont = elStyle?.fontFamily
          ? elStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim()
          : inherited.font;

        const nextStyle = {
          b: inherited.b || node.tagName === 'STRONG' || node.tagName === 'B',
          i: inherited.i || node.tagName === 'EM' || node.tagName === 'I',
          u: inherited.u || node.tagName === 'U',
          s: inherited.s || node.tagName === 'S' || node.tagName === 'STRIKE' || node.tagName === 'DEL',
          szHalfPt: nextSz,
          colorHex: nextColor,
          font: nextFont,
        };
        return Array.from(node.childNodes).map((c) => buildRunsFromNode(c, nextStyle)).join('');
      }
      return '';
    };

    const blocksXml: string[] = [];

    const serializeBlock = (el: Element) => {
      const tag = el.tagName.toUpperCase();

      if (el.classList.contains('docs-page-break') || el.getAttribute('data-page-break') === 'true') {
        blocksXml.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
        return;
      }

      if (el.classList.contains('word-title')) {
        const runs = buildRunsFromNode(el);
        blocksXml.push(`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr>${runs}</w:p>`);
        return;
      }
      if (el.classList.contains('word-subtitle')) {
        const runs = buildRunsFromNode(el);
        blocksXml.push(`<w:p><w:pPr><w:pStyle w:val="Subtitle"/></w:pPr>${runs}</w:p>`);
        return;
      }
      if (el.classList.contains('word-no-spacing')) {
        const runs = buildRunsFromNode(el);
        blocksXml.push(`<w:p><w:pPr><w:pStyle w:val="NoSpacing"/></w:pPr>${runs}</w:p>`);
        return;
      }

      if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4') {
        const styleId = `Heading${tag.slice(1)}`;
        const runs = buildRunsFromNode(el);
        blocksXml.push(`<w:p><w:pPr><w:pStyle w:val="${styleId}"/></w:pPr>${runs}</w:p>`);
        return;
      }

      if (tag === 'UL' || tag === 'OL') {
        const items = Array.from(el.children).filter((c) => c.tagName === 'LI');
        items.forEach((li, idx) => {
          const prefix = tag === 'OL' ? `${idx + 1}. ` : '• ';
          const runs = `<w:r><w:t xml:space="preserve">${this.escapeXml(prefix)}</w:t></w:r>${buildRunsFromNode(li)}`;
          blocksXml.push(`<w:p><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>${runs}</w:p>`);
        });
        return;
      }

      if (tag === 'TABLE') {
        const rows = Array.from(el.querySelectorAll('tr'));
        if (rows.length === 0) return;
        let tbl = '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>';
        tbl += '<w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>';
        tbl += '<w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>';
        tbl += '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>';
        tbl += '<w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>';
        tbl += '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>';
        tbl += '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>';
        tbl += '</w:tblBorders></w:tblPr>';

        rows.forEach((tr) => {
          tbl += '<w:tr>';
          const cells = Array.from(tr.querySelectorAll('th, td'));
          cells.forEach((cell) => {
            const isHeader = cell.tagName === 'TH';
            const runs = buildRunsFromNode(cell, { b: isHeader, i: false, u: false, s: false });
            const shd = isHeader ? `<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="${tableHdrHex}"/></w:tcPr>` : '';
            tbl += `<w:tc>${shd}<w:p>${runs || '<w:r><w:t></w:t></w:r>'}</w:p></w:tc>`;
          });
          tbl += '</w:tr>';
        });
        tbl += '</w:tbl>';
        blocksXml.push(tbl);
        return;
      }

      if (tag === 'BLOCKQUOTE') {
        const isIntense = el.classList.contains('word-intense-quote');
        const runs = buildRunsFromNode(el, { b: false, i: true, u: false, s: false });
        blocksXml.push(
          isIntense
            ? `<w:p><w:pPr><w:pStyle w:val="IntenseQuote"/></w:pPr>${runs}</w:p>`
            : `<w:p><w:pPr><w:pStyle w:val="Quote"/><w:ind w:left="720"/><w:pBdr><w:left w:val="single" w:sz="18" w:space="12" w:color="${accent1Hex}"/></w:pBdr></w:pPr>${runs}</w:p>`,
        );
        return;
      }

      const runs = buildRunsFromNode(el);
      blocksXml.push(`<w:p>${runs}</w:p>`);
    };

    Array.from(container.childNodes).forEach((node) => {
      if (node instanceof Element) {
        serializeBlock(node);
      } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
        blocksXml.push(`<w:p><w:r><w:t xml:space="preserve">${this.escapeXml(node.nodeValue)}</w:t></w:r></w:p>`);
      }
    });

    if (blocksXml.length === 0) {
      blocksXml.push(`<w:p><w:r><w:t>${this.escapeXml(title || '')}</w:t></w:r></w:p>`);
    }

    const sizeMap: Record<string, [number, number]> = {
      Letter: [12240, 15840],
      Legal: [12240, 20160],
      A3: [16838, 23811],
      A5: [8391, 11906],
      A4: [11906, 16838],
    };
    const [baseW, baseH] = sizeMap[pageLayout?.size || 'A4'] || sizeMap.A4;
    const isLandscape = pageLayout?.orientation === 'landscape';
    const pgSz = isLandscape
      ? `<w:pgSz w:w="${baseH}" w:h="${baseW}" w:orient="landscape"/>`
      : `<w:pgSz w:w="${baseW}" w:h="${baseH}"/>`;
    const marginTwips =
      pageLayout?.margins === 'narrow'
        ? 720
        : pageLayout?.margins === 'moderate'
          ? 1080
          : pageLayout?.margins === 'wide'
            ? 2160
            : 1440;

    const lineTwips = Math.round((pageLayout?.lineSpacing || 1.16) * 240);

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${blocksXml.join('\n    ')}
    <w:sectPr>
      ${pgSz}
      <w:pgMar w:top="${marginTwips}" w:right="${marginTwips}" w:bottom="${marginTwips}" w:left="${marginTwips}" w:header="720" w:footer="720"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;

    const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office">
  <a:themeElements>
    <a:clrScheme name="${this.escapeXml(activeTheme.name)}">
      <a:dk1><a:srgbClr val="000000"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="0E2841"/></a:dk2>
      <a:lt2><a:srgbClr val="E8E8E8"/></a:lt2>
      <a:accent1><a:srgbClr val="${accent1Hex}"/></a:accent1>
      <a:accent2><a:srgbClr val="${accent2Hex}"/></a:accent2>
      <a:accent3><a:srgbClr val="196B24"/></a:accent3>
      <a:accent4><a:srgbClr val="0F9ED5"/></a:accent4>
      <a:accent5><a:srgbClr val="A02B93"/></a:accent5>
      <a:accent6><a:srgbClr val="4EA72E"/></a:accent6>
      <a:hlink><a:srgbClr val="467886"/></a:hlink>
      <a:folHlink><a:srgbClr val="96607D"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="${this.escapeXml(majorFont)}"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="${this.escapeXml(minorFont)}"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
  </a:themeElements>
</a:theme>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:ascii="${this.escapeXml(minorFont)}" w:hAnsi="${this.escapeXml(minorFont)}"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="${lineTwips}" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="NoSpacing"><w:name w:val="No Spacing"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="80" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="${this.escapeXml(majorFont)}" w:hAnsi="${this.escapeXml(majorFont)}"/><w:sz w:val="56"/><w:szCs w:val="56"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:color w:val="595959"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="360" w:after="80"/></w:pPr><w:rPr><w:rFonts w:ascii="${this.escapeXml(majorFont)}" w:hAnsi="${this.escapeXml(majorFont)}"/><w:color w:val="${headingDarkHex}"/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:rFonts w:ascii="${this.escapeXml(majorFont)}" w:hAnsi="${this.escapeXml(majorFont)}"/><w:color w:val="${headingDarkHex}"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:color w:val="${headingDarkHex}"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/><w:pPr><w:spacing w:before="80" w:after="40"/></w:pPr><w:rPr><w:i/><w:color w:val="${headingDarkHex}"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:pPr><w:spacing w:before="160" w:after="160"/></w:pPr><w:rPr><w:i/><w:color w:val="404040"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="IntenseQuote"><w:name w:val="Intense Quote"/><w:pPr><w:pBdr><w:top w:val="single" w:sz="4" w:space="10" w:color="${headingDarkHex}"/><w:bottom w:val="single" w:sz="4" w:space="10" w:color="${headingDarkHex}"/></w:pBdr><w:spacing w:before="360" w:after="360"/></w:pPr><w:rPr><w:i/><w:color w:val="${headingDarkHex}"/></w:rPr></w:style>
</w:styles>`;

    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypesXml);
    zip.file('_rels/.rels', relsXml);
    zip.file('word/_rels/document.xml.rels', docRelsXml);
    zip.file('word/theme/theme1.xml', themeXml);
    zip.file('word/styles.xml', stylesXml);
    zip.file('word/document.xml', documentXml);

    return zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }
}
