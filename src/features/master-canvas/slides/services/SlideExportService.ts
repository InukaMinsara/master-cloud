import { MasterPresentationData, MasterSlide } from '../types';

export class SlideExportService {
  /**
   * Export presentation as a standalone HTML presentation deck with full keyboard navigation
   */
  static exportToHtmlDeck(presentation: MasterPresentationData, filename: string = 'presentation.html') {
    const slidesHtml = presentation.slides
      .filter((s) => !s.isHidden)
      .map((slide, idx) => {
        const objectsHtml = slide.objects
          .map((obj) => {
            const x = obj.x;
            const y = obj.y;
            const w = obj.width;
            const h = obj.height;
            const f = obj.format || {};

            let inner = '';
            if (obj.type === 'text') {
              inner = `<div style="font-size: ${f.fontSize || 20}px; font-weight: ${
                f.bold ? 'bold' : 'normal'
              }; font-style: ${f.italic ? 'italic' : 'normal'}; text-align: ${f.align || 'left'}; color: ${
                f.textColor || '#ffffff'
              }; line-height: 1.4; white-space: pre-wrap;">${escapeHtml(obj.content)}</div>`;
            } else if (obj.type === 'image') {
              inner = `<img src="${obj.content}" alt="Slide image" style="width: 100%; height: 100%; object-fit: contain; border-radius: ${
                f.borderRadius || 8
              }px;" />`;
            } else if (obj.type === 'shape') {
              inner = `<div style="width: 100%; height: 100%; background: ${
                f.fillColor || '#3b82f6'
              }; border: ${f.strokeWidth || 0}px solid ${f.strokeColor || 'transparent'}; border-radius: ${
                f.borderRadius || 8
              }px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${
                f.textColor || '#ffffff'
              };">${escapeHtml(obj.content)}</div>`;
            }

            return `<div style="position: absolute; left: ${x}%; top: ${y}%; width: ${w}%; height: ${h}%; z-index: ${obj.zIndex}; transform: rotate(${
              f.rotation || 0
            }deg);">${inner}</div>`;
          })
          .join('');

        return `
          <div class="slide" id="slide-${idx}" style="display: ${
          idx === 0 ? 'flex' : 'none'
        }; position: absolute; inset: 0; width: 100%; height: 100%; background: #0f172a; overflow: hidden; align-items: center; justify-content: center;">
            <div style="position: relative; width: 100%; height: 100%; max-width: 1280px; max-height: 720px; aspect-ratio: 16/9; margin: auto;">
              ${objectsHtml}
            </div>
            <div style="position: absolute; bottom: 16px; right: 24px; font-size: 12px; color: rgba(255,255,255,0.4); font-family: monospace;">
              ${idx + 1} / ${presentation.slides.length}
            </div>
          </div>
        `;
      })
      .join('');

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${presentation.title || 'Master Presentation'}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { background: #020617; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; width: 100vw; height: 100vh; }
            .controls { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 100; background: rgba(15,23,42,0.8); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.1); }
            .btn { background: #2563eb; color: white; border: none; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold; cursor: pointer; }
            .btn:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          ${slidesHtml}
          <div class="controls">
            <button class="btn" onclick="prevSlide()">&larr; Prev</button>
            <span id="counter" style="font-size: 12px; font-family: monospace; display: flex; align-items: center; padding: 0 8px;">1 / ${
              presentation.slides.length
            }</span>
            <button class="btn" onclick="nextSlide()">Next &rarr;</button>
          </div>
          <script>
            let current = 0;
            const total = ${presentation.slides.length};
            function showSlide(idx) {
              for (let i = 0; i < total; i++) {
                const el = document.getElementById('slide-' + i);
                if (el) el.style.display = (i === idx) ? 'flex' : 'none';
              }
              document.getElementById('counter').innerText = (idx + 1) + ' / ' + total;
            }
            function nextSlide() { if (current < total - 1) { current++; showSlide(current); } }
            function prevSlide() { if (current > 0) { current--; showSlide(current); } }
            window.addEventListener('keydown', function(e) {
              if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') nextSlide();
              else if (e.key === 'ArrowLeft') prevSlide();
              else if (e.key === 'Escape') window.close();
            });
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    this.downloadBlob(blob, filename.endsWith('.html') ? filename : `${filename}.html`);
  }

  /**
   * Export complete presentation structure as JSON
   */
  static exportToJson(presentation: MasterPresentationData, filename: string = 'presentation.json') {
    const jsonStr = JSON.stringify(presentation, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    this.downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
  }

  /**
   * Trigger clean browser print / PDF generation for slides
   */
  static printPresentation(presentation: MasterPresentationData) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const slidesHtml = presentation.slides
      .filter((s) => !s.isHidden)
      .map((slide, idx) => {
        const objectsHtml = slide.objects
          .map((obj) => {
            const f = obj.format || {};
            let inner = '';
            if (obj.type === 'text') {
              inner = `<div style="font-size: ${f.fontSize || 20}px; font-weight: ${f.bold ? 'bold' : 'normal'}; color: ${f.textColor || '#1e293b'}; text-align: ${f.align || 'left'};">${escapeHtml(obj.content)}</div>`;
            } else if (obj.type === 'image') {
              inner = `<img src="${obj.content}" style="width: 100%; height: 100%; object-fit: contain;" />`;
            } else if (obj.type === 'shape') {
              inner = `<div style="width: 100%; height: 100%; background: ${f.fillColor || '#e2e8f0'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${escapeHtml(obj.content)}</div>`;
            }
            return `<div style="position: absolute; left: ${obj.x}%; top: ${obj.y}%; width: ${obj.width}%; height: ${obj.height}%;">${inner}</div>`;
          })
          .join('');

        return `
          <div class="page">
            <div class="slide-frame">
              ${objectsHtml}
            </div>
            <div class="page-footer">Slide ${idx + 1}</div>
          </div>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${presentation.title || 'Master Presentation'}</title>
          <style>
            @page { size: A4 landscape; margin: 0.5in; }
            body { font-family: system-ui, sans-serif; padding: 0; margin: 0; }
            .page { page-break-after: always; height: 100vh; display: flex; flex-direction: column; justify-content: space-between; }
            .slide-frame { position: relative; width: 100%; aspect-ratio: 16/9; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff; }
            .page-footer { font-size: 10px; color: #64748b; text-align: right; padding-top: 8px; }
          </style>
        </head>
        <body>
          ${slidesHtml}
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
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
