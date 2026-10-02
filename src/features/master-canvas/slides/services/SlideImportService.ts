import { MasterPresentationData, MasterSlide, MasterSlideObject } from '../types';

export interface ImportResult {
  presentation: MasterPresentationData;
  warnings: string[];
  slideCount: number;
}

export class SlideImportService {
  /**
   * Import presentation from JSON string or file content
   */
  static parseJsonDeck(content: string): ImportResult {
    const warnings: string[] = [];
    try {
      const data = JSON.parse(content);
      if (!data.slides || !Array.isArray(data.slides)) {
        throw new Error('Invalid presentation structure: missing slides array.');
      }

      // Validate and sanitize each slide
      const validatedSlides: MasterSlide[] = data.slides.map((s: any, idx: number) => {
        const objects: MasterSlideObject[] = (s.objects || []).map((o: any, oIdx: number) => ({
          id: o.id || `imported-obj-${idx}-${oIdx}`,
          name: o.name || `Object ${oIdx + 1}`,
          type: o.type || 'text',
          shapeKind: o.shapeKind,
          content: o.content || '',
          x: typeof o.x === 'number' ? o.x : 10,
          y: typeof o.y === 'number' ? o.y : 10,
          width: typeof o.width === 'number' ? o.width : 50,
          height: typeof o.height === 'number' ? o.height : 20,
          zIndex: o.zIndex || oIdx + 1,
          format: o.format || {},
          animation: o.animation,
          connector: o.connector,
          tableData: o.tableData,
          chartData: o.chartData,
        }));

        return {
          id: s.id || `imported-slide-${idx + 1}`,
          title: s.title || `Slide ${idx + 1}`,
          layout: s.layout || 'title-content',
          bgTheme: s.bgTheme || 'dark-slate',
          customBgColor: s.customBgColor,
          objects,
          notes: s.notes || '',
          transition: s.transition || { type: 'fade', durationSeconds: 0.5 },
        };
      });

      const presentation: MasterPresentationData = {
        title: data.title || 'Imported Presentation',
        version: data.version || 1,
        aspectRatio: data.aspectRatio || '16:9',
        activeSlideId: validatedSlides[0]?.id || 'slide-1',
        slides: validatedSlides,
        defaultTheme: data.defaultTheme || 'dark-slate',
        lastSavedAt: new Date().toISOString(),
      };

      return {
        presentation,
        warnings,
        slideCount: validatedSlides.length,
      };
    } catch (err: any) {
      throw new Error(`Failed to parse presentation JSON: ${err.message}`);
    }
  }

  /**
   * Import outline or plain text document into multiple structured presentation slides
   */
  static parseOutlineText(text: string, title = 'Imported Outline'): ImportResult {
    const lines = text.split(/\r?\n/);
    const slides: MasterSlide[] = [];
    const warnings: string[] = [];

    let currentSlideTitle = 'Introduction';
    let currentBulletLines: string[] = [];

    const flushSlide = () => {
      if (currentBulletLines.length === 0 && !currentSlideTitle) return;

      const slideId = 'slide-' + Date.now() + '-' + slides.length;
      slides.push({
        id: slideId,
        title: currentSlideTitle,
        layout: slides.length === 0 ? 'title' : 'title-content',
        bgTheme: 'dark-slate',
        transition: { type: 'slide-left', durationSeconds: 0.5 },
        notes: '',
        objects: [
          {
            id: `obj-title-${slides.length}`,
            type: 'text',
            content: currentSlideTitle,
            x: 8,
            y: 12,
            width: 84,
            height: 14,
            zIndex: 1,
            format: { bold: true, fontSize: 32, textColor: '#ffffff' },
            animation: { type: 'fade-in', trigger: 'after-previous', durationMs: 400 },
          },
          {
            id: `obj-body-${slides.length}`,
            type: 'text',
            content: currentBulletLines.map((l) => (l.startsWith('•') ? l : `• ${l}`)).join('\n'),
            x: 8,
            y: 32,
            width: 84,
            height: 54,
            zIndex: 2,
            format: { fontSize: 18, textColor: '#cbd5e1', lineHeight: 1.6 },
            animation: { type: 'slide-up', trigger: 'on-click', durationMs: 500 },
          },
        ],
      });

      currentBulletLines = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('Slide ') || line.startsWith('SLIDE ')) {
        flushSlide();
        currentSlideTitle = line.replace(/^[#\s]+/, '').replace(/^Slide \d+:\s*/i, '');
      } else {
        currentBulletLines.push(line);
      }
    }
    flushSlide();

    if (slides.length === 0) {
      warnings.push('Document contained no recognized slide headers. Created 1 default slide.');
      slides.push({
        id: 'slide-1',
        title: 'Overview',
        layout: 'title-content',
        bgTheme: 'dark-slate',
        objects: [
          {
            id: 'obj-1',
            type: 'text',
            content: text,
            x: 10,
            y: 20,
            width: 80,
            height: 60,
            zIndex: 1,
            format: { fontSize: 18, textColor: '#ffffff' },
          },
        ],
      });
    }

    return {
      presentation: {
        title,
        version: 1,
        aspectRatio: '16:9',
        activeSlideId: slides[0].id,
        slides,
        defaultTheme: 'dark-slate',
        lastSavedAt: new Date().toISOString(),
      },
      warnings,
      slideCount: slides.length,
    };
  }
}
