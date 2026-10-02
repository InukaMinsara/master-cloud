import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Layout,
  Check,
  Download,
} from 'lucide-react';
import { MasterPresentationData, SlideHandoutConfig } from '../types';

interface MasterSlidesHandoutModalProps {
  presentation: MasterPresentationData;
  onClose: () => void;
}

export function MasterSlidesHandoutModal({
  presentation,
  onClose,
}: MasterSlidesHandoutModalProps) {
  const [layout, setLayout] = useState<SlideHandoutConfig['layout']>('3-slides-notes');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showNotes, setShowNotes] = useState(true);
  const [showSlideNumbers, setShowSlideNumbers] = useState(true);
  const [headerText, setHeaderText] = useState(presentation.title || 'Master Cloud Presentation Handout');
  const [footerText, setFooterText] = useState('Generated via Master Cloud (10 TB Free Storage)');

  const handlePrintHandouts = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const activeSlides = presentation.slides.filter((s) => !s.isHidden);

    let slidesPerPage = 3;
    if (layout === '1-slide') slidesPerPage = 1;
    else if (layout === '2-slides') slidesPerPage = 2;
    else if (layout === '3-slides-notes') slidesPerPage = 3;
    else if (layout === '4-slides') slidesPerPage = 4;
    else if (layout === '6-slides') slidesPerPage = 6;
    else if (layout === '9-slides') slidesPerPage = 9;

    const pagesCount = Math.ceil(activeSlides.length / slidesPerPage);
    let pagesHtml = '';

    for (let p = 0; p < pagesCount; p++) {
      const pageSlides = activeSlides.slice(p * slidesPerPage, (p + 1) * slidesPerPage);

      let gridClass = 'grid-3-notes';
      if (layout === '1-slide') gridClass = 'grid-1';
      else if (layout === '2-slides') gridClass = 'grid-2';
      else if (layout === '4-slides') gridClass = 'grid-4';
      else if (layout === '6-slides') gridClass = 'grid-6';
      else if (layout === '9-slides') gridClass = 'grid-9';

      const itemsHtml = pageSlides
        .map((slide, sIdx) => {
          const globalIdx = p * slidesPerPage + sIdx + 1;
          const titleObj = slide.objects.find((o) => o.type === 'text');

          return `
            <div class="handout-item ${layout === '3-slides-notes' ? 'item-with-notes' : ''}">
              <div class="slide-thumbnail">
                <div class="thumb-header">Slide ${globalIdx} &bull; ${escapeHtml(slide.title || 'Slide')}</div>
                <div class="thumb-body">
                  <h4>${escapeHtml(titleObj?.content || slide.title || '')}</h4>
                  <p>${escapeHtml(slide.notes || '')}</p>
                </div>
              </div>
              ${
                layout === '3-slides-notes'
                  ? `
                <div class="notes-lines">
                  <div class="note-line"></div>
                  <div class="note-line"></div>
                  <div class="note-line"></div>
                  <div class="note-line"></div>
                </div>
              `
                  : ''
              }
            </div>
          `;
        })
        .join('');

      pagesHtml += `
        <div class="page">
          <div class="header">${escapeHtml(headerText)}</div>
          <div class="handouts-grid ${gridClass}">
            ${itemsHtml}
          </div>
          <div class="footer">
            <span>${escapeHtml(footerText)}</span>
            <span>Page ${p + 1} of ${pagesCount}</span>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${presentation.title || 'Presentation'} - Handouts</title>
          <style>
            @page { size: A4 ${orientation}; margin: 0.4in; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
            .page { page-break-after: always; height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 20px; }
            .header { font-size: 11px; font-weight: bold; border-b: 1px solid #cbd5e1; padding-bottom: 6px; color: #475569; }
            .footer { font-size: 10px; border-t: 1px solid #cbd5e1; padding-top: 6px; display: flex; justify-content: space-between; color: #64748b; }
            .handouts-grid { flex: 1; display: grid; gap: 16px; margin: 16px 0; }
            .grid-1 { grid-template-rows: 1fr; }
            .grid-2 { grid-template-rows: 1fr 1fr; }
            .grid-3-notes { grid-template-rows: 1fr 1fr 1fr; }
            .grid-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
            .grid-6 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; }
            .grid-9 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; }
            .handout-item { display: flex; gap: 16px; align-items: stretch; }
            .slide-thumbnail { flex: 1; border: 1px solid #94a3b8; border-radius: 6px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; background: #f8fafc; }
            .thumb-header { font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; }
            .thumb-body h4 { font-size: 12px; font-weight: bold; margin: 6px 0; }
            .thumb-body p { font-size: 9px; color: #475569; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
            .notes-lines { flex: 1; display: flex; flex-direction: column; justify-content: space-around; padding: 8px 0; }
            .note-line { border-bottom: 1px solid #cbd5e1; height: 1px; width: 100%; }
          </style>
        </head>
        <body>
          ${pagesHtml}
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Presentation Handouts &amp; Print Setup</h2>
              <p className="text-[11px] text-muted-foreground">
                Generate professional multi-slide audience handouts with speaker note lines.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Configuration Form */}
        <div className="p-6 space-y-5">
          {/* Handout Layout Options */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Handout Layout
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: '1-slide', label: '1 Slide / Page', desc: 'Full-page slide view' },
                { id: '2-slides', label: '2 Slides / Page', desc: 'Large 2-slide stack' },
                { id: '3-slides-notes', label: '3 Slides + Notes', desc: 'Slide with writing lines' },
                { id: '4-slides', label: '4 Slides (2x2)', desc: 'Compact quadrant' },
                { id: '6-slides', label: '6 Slides (2x3)', desc: 'Conference overview' },
                { id: '9-slides', label: '9 Slides (3x3)', desc: 'Thumbnail catalog' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLayout(item.id as SlideHandoutConfig['layout'])}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    layout === item.id
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/10'
                      : 'border-border hover:border-border/80 bg-card/50'
                  }`}
                >
                  <span className="font-bold text-xs text-foreground block">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Page Orientation
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setOrientation('portrait')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  orientation === 'portrait'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  orientation === 'landscape'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Header & Footer Labels */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-muted-foreground block mb-1">Header Text:</span>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className="w-full text-xs bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block mb-1">Footer Text:</span>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full text-xs bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-card/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={handlePrintHandouts}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Generate &amp; Print Handouts</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
