import JSZip from 'jszip';
import { MasterPresentationData, MasterSlide, MasterSlideObject, ShapeKind, SlideThemeId } from '../types';
import { SlideTemplates } from './SlideTemplates';

const SLIDE_W_16_9 = 12192000; // 13.333 in * 914400
const SLIDE_H_16_9 = 6858000;  // 7.5 in * 914400
const SLIDE_W_4_3 = 9144000;   // 10 in * 914400
const SLIDE_H_4_3 = 6858000;   // 7.5 in * 914400

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanHex(color: string | undefined, fallback: string): string {
  const c = (color || '').trim();
  const hexMatch = /^#([0-9a-fA-F]{6})$/.exec(c);
  if (hexMatch) return hexMatch[1].toUpperCase();
  const shortHex = /^#([0-9a-fA-F]{3})$/.exec(c);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split('');
    return `${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback;
}

function themeBackgroundHex(themeId: SlideThemeId, customBg?: string): string {
  if (customBg && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(customBg)) {
    return cleanHex(customBg, '0F172A');
  }
  const map: Record<string, string> = {
    'minimal-light': 'FFFFFF',
    'aptos-office': 'FFFFFF',
    'pitchbook-coral': 'FFFBF7',
    'widescreen-cyan': 'F8FAFC',
    'berlin-amber': 'FFFFFF',
    'gallery-classic': 'FAF8F5',
    'dark-slate': '0F172A',
    'corporate-indigo': '1E1B4B',
    'emerald-nature': '064E3B',
    'crimson-bold': '4C0519',
    'sunset-amber': '451A03',
    'cyber-neon': '000000',
  };
  return map[themeId] || '0F172A';
}

function mapShapeKindToPptPrst(kind?: ShapeKind): string {
  const map: Record<string, string> = {
    rectangle: 'rect',
    rounded: 'roundRect',
    circle: 'ellipse',
    ellipse: 'ellipse',
    triangle: 'triangle',
    diamond: 'diamond',
    arrow: 'rightArrow',
    'arrow-right': 'rightArrow',
    'arrow-double': 'leftRightArrow',
    chevron: 'chevron',
    star: 'star5',
    heart: 'heart',
    callout: 'wedgeRoundRectCallout',
    cloud: 'cloud',
    database: 'can',
    cylinder: 'can',
    process: 'flowChartProcess',
    decision: 'flowChartDecision',
    banner: 'ribbon',
    hexagon: 'hexagon',
  };
  return map[kind || 'rect'] || 'rect';
}

/**
 * SlidePptxService
 * Real OpenXML (.pptx) reader & writer using JSZip for Microsoft PowerPoint interoperability.
 */
export class SlidePptxService {
  static async exportToPptx(
    presentation: MasterPresentationData,
    filename?: string
  ): Promise<void> {
    const zip = new JSZip();
    const is43 = presentation.aspectRatio === '4:3';
    const slideW = is43 ? SLIDE_W_4_3 : SLIDE_W_16_9;
    const slideH = is43 ? SLIDE_H_4_3 : SLIDE_H_16_9;
    const slides = presentation.slides.length > 0 ? presentation.slides : SlideTemplates.getPrebuiltDeck().slides;
    const themes = SlideTemplates.getThemes();

    // [Content_Types].xml
    const slideOverrides = slides
      .map(
        (_, i) =>
          `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
      )
      .join('\n  ');

    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slideOverrides}
</Types>`
    );

    // _rels/.rels
    zip.file(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
    );

    // ppt/_rels/presentation.xml.rels
    const presRels = slides
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
      )
      .join('\n  ');
    const masterRelId = `rId${slides.length + 1}`;
    const themeRelId = `rId${slides.length + 2}`;

    zip.file(
      'ppt/_rels/presentation.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels}
  <Relationship Id="${masterRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="${themeRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`
    );

    // ppt/presentation.xml
    const sldIdLst = slides
      .map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`)
      .join('\n    ');

    zip.file(
      'ppt/presentation.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="${masterRelId}"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${sldIdLst}
  </p:sldIdLst>
  <p:sldSz cx="${slideW}" cy="${slideH}" type="${is43 ? 'screen4x3' : 'screen16x9'}"/>
  <p:notesSz cx="${slideH}" cy="${slideW}"/>
</p:presentation>`
    );

    // ppt/theme/theme1.xml (Microsoft Office Aptos 2023+ & PowerPoint palette)
    zip.file(
      'ppt/theme/theme1.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="0E2841"/></a:dk2>
      <a:lt2><a:srgbClr val="E8E8E8"/></a:lt2>
      <a:accent1><a:srgbClr val="156082"/></a:accent1>
      <a:accent2><a:srgbClr val="E97132"/></a:accent2>
      <a:accent3><a:srgbClr val="196B24"/></a:accent3>
      <a:accent4><a:srgbClr val="0F9ED5"/></a:accent4>
      <a:accent5><a:srgbClr val="A02B93"/></a:accent5>
      <a:accent6><a:srgbClr val="4EA72E"/></a:accent6>
      <a:hlink><a:srgbClr val="467886"/></a:hlink>
      <a:folHlink><a:srgbClr val="96607D"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Aptos Display"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Aptos"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`
    );

    // SlideMaster + SlideLayout minimal valid OpenXML definitions
    zip.file(
      'ppt/slideMasters/slideMaster1.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`
    );
    zip.file(
      'ppt/slideMasters/_rels/slideMaster1.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`
    );

    zip.file(
      'ppt/slideLayouts/slideLayout1.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
</p:sldLayout>`
    );
    zip.file(
      'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`
    );

    // Individual slides
    slides.forEach((slide, sIdx) => {
      const themeCfg = themes.find((t) => t.id === slide.bgTheme) || themes[0];
      const bgHex = themeBackgroundHex(slide.bgTheme, slide.customBgColor);
      const defaultTxtHex = cleanHex(themeCfg.textColor, 'FFFFFF');

      const shapesXml = slide.objects
        .map((obj, oIdx) => {
          const idNum = oIdx + 2;
          const xEmu = Math.round((Math.max(0, obj.x) / 100) * slideW);
          const yEmu = Math.round((Math.max(0, obj.y) / 100) * slideH);
          const wEmu = Math.max(200000, Math.round((Math.max(5, obj.width) / 100) * slideW));
          const hEmu = Math.max(150000, Math.round((Math.max(4, obj.height) / 100) * slideH));
          const fmt = obj.format || {};

          if (obj.type === 'table' && obj.tableData) {
            const rows = obj.tableData.cells || [['Column 1', 'Column 2']];
            const colsCount = Math.max(1, rows[0]?.length || 2);
            const colW = Math.round(wEmu / colsCount);
            const rowH = Math.round(hEmu / Math.max(1, rows.length));
            const gridCols = Array.from({ length: colsCount }, () => `<a:gridCol w="${colW}"/>`).join('');
            const trXml = rows
              .map(
                (row, rIdx) => `<a:tr h="${rowH}">
                  ${row
                    .map(
                      (cell) => `<a:tc>
                        <a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1400" ${
                          rIdx === 0 ? 'b="1"' : ''
                        }><a:solidFill><a:srgbClr val="${rIdx === 0 ? 'FFFFFF' : '1E293B'}"/></a:solidFill></a:rPr><a:t>${escapeXml(
                        cell
                      )}</a:t></a:r></a:p></a:txBody>
                        <a:tcPr><a:solidFill><a:srgbClr val="${rIdx === 0 ? '156082' : rIdx % 2 === 1 ? 'F8FAFC' : 'EEF2F6'}"/></a:solidFill></a:tcPr>
                      </a:tc>`
                    )
                    .join('')}
                </a:tr>`
              )
              .join('');

            return `<p:graphicFrame>
              <p:nvGraphicFramePr><p:cNvPr id="${idNum}" name="Table ${idNum}"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>
              <p:xfrm><a:off x="${xEmu}" y="${yEmu}"/><a:ext cx="${wEmu}" cy="${hEmu}"/></p:xfrm>
              <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
                <a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>${gridCols}</a:tblGrid>${trXml}</a:tbl>
              </a:graphicData></a:graphic>
            </p:graphicFrame>`;
          }

          const txtHex = cleanHex(fmt.textColor, defaultTxtHex);
          const fontPt = Math.max(10, Math.min(96, fmt.fontSize || 18));
          const fontSz = fontPt * 100;
          const align = fmt.align === 'center' ? 'ctr' : fmt.align === 'right' ? 'r' : 'l';
          const fontName = (fmt.fontFamily || 'Aptos').split(',')[0].replace(/['"]/g, '').trim() || 'Aptos';
          const prstGeom = obj.type === 'shape' ? mapShapeKindToPptPrst(obj.shapeKind) : 'rect';

          const fillXml =
            obj.type === 'shape' || obj.type === 'button'
              ? `<a:solidFill><a:srgbClr val="${cleanHex(fmt.fillColor, '156082')}"/></a:solidFill>`
              : fmt.fillColor
              ? `<a:solidFill><a:srgbClr val="${cleanHex(fmt.fillColor, 'FFFFFF')}"/></a:solidFill>`
              : '<a:noFill/>';

          const lnXml =
            fmt.strokeColor && (fmt.strokeWidth || 0) > 0
              ? `<a:ln w="${(fmt.strokeWidth || 1) * 12700}"><a:solidFill><a:srgbClr val="${cleanHex(
                  fmt.strokeColor,
                  'CBD5E1'
                )}"/></a:solidFill></a:ln>`
              : '<a:ln><a:noFill/></a:ln>';

          const lines = (obj.content || '').split(/\r?\n/);
          const paragraphsXml = lines
            .map(
              (line) => `<a:p>
                <a:pPr algn="${align}"/>
                <a:r>
                  <a:rPr lang="en-US" sz="${fontSz}" b="${fmt.bold ? '1' : '0'}" i="${fmt.italic ? '1' : '0'}" u="${
                fmt.underline ? 'sng' : 'none'
              }">
                    <a:solidFill><a:srgbClr val="${txtHex}"/></a:solidFill>
                    <a:latin typeface="${escapeXml(fontName)}"/>
                  </a:rPr>
                  <a:t>${escapeXml(line)}</a:t>
                </a:r>
              </a:p>`
            )
            .join('');

          return `<p:sp>
            <p:nvSpPr>
              <p:cNvPr id="${idNum}" name="${escapeXml(obj.name || `Object ${idNum}`)}"/>
              <p:cNvSpPr txBox="${obj.type === 'text' ? '1' : '0'}"/>
              <p:nvPr/>
            </p:nvSpPr>
            <p:spPr>
              <a:xfrm><a:off x="${xEmu}" y="${yEmu}"/><a:ext cx="${wEmu}" cy="${hEmu}"/></a:xfrm>
              <a:prstGeom prst="${prstGeom}"><a:avLst/></a:prstGeom>
              ${fillXml}
              ${lnXml}
            </p:spPr>
            <p:txBody>
              <a:bodyPr wrap="square" anchor="${obj.type === 'shape' ? 'ctr' : 't'}"/>
              <a:lstStyle/>
              ${paragraphsXml}
            </p:txBody>
          </p:sp>`;
        })
        .join('\n      ');

      zip.file(
        `ppt/slides/slide${sIdx + 1}.xml`,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="${bgHex}"/></a:solidFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${shapesXml}
    </p:spTree>
  </p:cSld>
</p:sld>`
      );

      zip.file(
        `ppt/slides/_rels/slide${sIdx + 1}.xml.rels`,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`
      );
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const safeName = (filename || presentation.title || 'presentation').replace(/\.pptx$/i, '') + '.pptx';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  static async importPptxBuffer(
    buffer: ArrayBuffer,
    fallbackTitle = 'Imported PowerPoint'
  ): Promise<MasterPresentationData> {
    const zip = await JSZip.loadAsync(buffer);
    const parser = new DOMParser();

    let slideW = SLIDE_W_16_9;
    let slideH = SLIDE_H_16_9;
    let majorFont = 'Aptos Display';
    let accent1 = '#156082';

    const presFile = zip.file('ppt/presentation.xml');
    if (presFile) {
      const presDoc = parser.parseFromString(await presFile.async('text'), 'application/xml');
      const sz = presDoc.getElementsByTagNameNS('*', 'sldSz')[0];
      if (sz) {
        const cx = parseInt(sz.getAttribute('cx') || '', 10);
        const cy = parseInt(sz.getAttribute('cy') || '', 10);
        if (cx > 0) slideW = cx;
        if (cy > 0) slideH = cy;
      }
    }

    const themeFile = zip.file('ppt/theme/theme1.xml');
    if (themeFile) {
      const tDoc = parser.parseFromString(await themeFile.async('text'), 'application/xml');
      const mj = tDoc.getElementsByTagNameNS('*', 'majorFont')[0]?.getElementsByTagNameNS('*', 'latin')[0];
      if (mj?.getAttribute('typeface')) majorFont = mj.getAttribute('typeface')!;
      const a1 = tDoc.getElementsByTagNameNS('*', 'accent1')[0]?.getElementsByTagNameNS('*', 'srgbClr')[0];
      if (a1?.getAttribute('val')) accent1 = `#${a1.getAttribute('val')}`;
    }

    const slidePaths = Object.keys(zip.files)
      .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
      .sort((a, b) => {
        const na = parseInt(/slide(\d+)\.xml/i.exec(a)?.[1] || '0', 10);
        const nb = parseInt(/slide(\d+)\.xml/i.exec(b)?.[1] || '0', 10);
        return na - nb;
      });

    if (slidePaths.length === 0) {
      throw new Error('No slides found inside the .pptx file.');
    }

    const slides: MasterSlide[] = [];
    for (let i = 0; i < slidePaths.length; i++) {
      const xmlStr = await zip.file(slidePaths[i])!.async('text');
      const sDoc = parser.parseFromString(xmlStr, 'application/xml');
      const objects: MasterSlideObject[] = [];

      const sps = Array.from(sDoc.getElementsByTagNameNS('*', 'sp'));
      sps.forEach((sp, spIdx) => {
        const off = sp.getElementsByTagNameNS('*', 'off')[0];
        const ext = sp.getElementsByTagNameNS('*', 'ext')[0];
        const xVal = parseInt(off?.getAttribute('x') || '0', 10);
        const yVal = parseInt(off?.getAttribute('y') || '0', 10);
        const wVal = parseInt(ext?.getAttribute('cx') || '0', 10);
        const hVal = parseInt(ext?.getAttribute('cy') || '0', 10);

        const xPct = Math.max(2, Math.min(92, (xVal / slideW) * 100));
        const yPct = Math.max(2, Math.min(92, (yVal / slideH) * 100));
        const wPct = wVal > 0 ? Math.max(10, Math.min(96, (wVal / slideW) * 100)) : 80;
        const hPct = hVal > 0 ? Math.max(6, Math.min(85, (hVal / slideH) * 100)) : 18;

        const paras = Array.from(sp.getElementsByTagNameNS('*', 'p'));
        const textLines = paras
          .map((p) =>
            Array.from(p.getElementsByTagNameNS('*', 't'))
              .map((t) => t.textContent || '')
              .join('')
          )
          .filter((l) => l.length > 0);
        const content = textLines.join('\n');

        const rPr = sp.getElementsByTagNameNS('*', 'rPr')[0];
        const szAttr = parseInt(rPr?.getAttribute('sz') || '0', 10);
        const fontSize = szAttr > 0 ? Math.round(szAttr / 100) : spIdx === 0 ? 32 : 18;
        const bold = rPr?.getAttribute('b') === '1' || spIdx === 0;
        const colorEl = rPr?.getElementsByTagNameNS('*', 'srgbClr')[0];
        const textColor = colorEl?.getAttribute('val') ? `#${colorEl.getAttribute('val')}` : '#0f172a';

        const solidFill = sp.getElementsByTagNameNS('*', 'spPr')[0]?.getElementsByTagNameNS('*', 'srgbClr')[0];
        const fillHex = solidFill?.getAttribute('val') ? `#${solidFill.getAttribute('val')}` : undefined;
        const prst = sp.getElementsByTagNameNS('*', 'prstGeom')[0]?.getAttribute('prst');

        if (!content && !fillHex) return;

        objects.push({
          id: `pptx-obj-${i + 1}-${spIdx + 1}`,
          type: content ? 'text' : 'shape',
          shapeKind: prst === 'ellipse' ? 'circle' : prst === 'roundRect' ? 'rounded' : 'rectangle',
          content: content || '',
          x: Math.round(xPct * 10) / 10,
          y: Math.round(yPct * 10) / 10,
          width: Math.round(wPct * 10) / 10,
          height: Math.round(hPct * 10) / 10,
          zIndex: spIdx + 1,
          format: {
            fontSize,
            bold,
            fontFamily: `${majorFont}, sans-serif`,
            textColor,
            fillColor: fillHex,
            align: spIdx === 0 ? 'center' : 'left',
          },
        });
      });

      const titleObj = objects.find((o) => o.content.trim().length > 0);
      slides.push({
        id: `pptx-slide-${i + 1}`,
        title: titleObj?.content.split('\n')[0].slice(0, 48) || `Slide ${i + 1}`,
        layout: i === 0 ? 'title' : 'title-content',
        bgTheme: 'aptos-office',
        transition: { type: 'fade', durationSeconds: 0.4 },
        notes: '',
        objects:
          objects.length > 0
            ? objects
            : [
                {
                  id: `pptx-fallback-${i + 1}`,
                  type: 'text',
                  content: `Slide ${i + 1}`,
                  x: 10,
                  y: 40,
                  width: 80,
                  height: 15,
                  zIndex: 1,
                  format: { fontSize: 32, bold: true, textColor: accent1, align: 'center' },
                },
              ],
      });
    }

    return {
      title: fallbackTitle.replace(/\.(pptx|potx)$/i, '') || 'Imported Presentation',
      version: 1,
      aspectRatio: slideW === SLIDE_W_4_3 ? '4:3' : '16:9',
      activeSlideId: slides[0]?.id || 'pptx-slide-1',
      defaultTheme: 'aptos-office',
      lastSavedAt: new Date().toISOString(),
      slides,
    };
  }
}
