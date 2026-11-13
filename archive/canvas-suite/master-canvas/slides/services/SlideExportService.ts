import { MasterPresentationData, MasterSlide } from '../types';
import { SlideAnimationService } from './SlideAnimationService';

export class SlideExportService {
  /**
   * Export presentation as a standalone HTML presentation deck with full keyboard navigation,
   * CSS transitions, and interactive multi-step object animations.
   */
  static exportToHtmlDeck(presentation: MasterPresentationData, filename: string = 'presentation.html') {
    const activeSlides = presentation.slides.filter((s) => !s.isHidden);

    const slidesHtml = activeSlides
      .map((slide, sIdx) => {
        const transitionType = slide.transition?.type || 'fade';
        const transitionDuration = slide.transition?.durationSeconds || 0.5;

        const objectsHtml = slide.objects
          .map((obj, oIdx) => {
            const x = obj.x;
            const y = obj.y;
            const w = obj.width;
            const h = obj.height;
            const f = obj.format || {};
            const anim = obj.animation;

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
            } else if (obj.type === 'button') {
              inner = `<div style="width: 100%; height: 100%; background: ${
                f.fillColor || '#6366f1'
              }; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${
                f.textColor || '#ffffff'
              }; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase;">${escapeHtml(obj.content || 'ACTION')}</div>`;
            }

            const animDataAttr = anim && anim.type !== 'none'
              ? `data-anim-type="${anim.type}" data-anim-trigger="${anim.trigger || 'on-click'}" data-anim-duration="${(anim.durationMs || 500) / 1000}" data-anim-delay="${(anim.delayMs || 0) / 1000}"`
              : '';

            return `
              <div class="slide-obj ${anim && anim.type !== 'none' && anim.trigger !== 'after-previous' ? 'anim-onclick' : ''}" id="obj-${sIdx}-${oIdx}" ${animDataAttr} style="position: absolute; left: ${x}%; top: ${y}%; width: ${w}%; height: ${h}%; z-index: ${obj.zIndex}; transform: rotate(${
                f.rotation || 0
              }deg);">
                ${inner}
              </div>
            `;
          })
          .join('');

        return `
          <div class="slide" id="slide-${sIdx}" data-trans-type="${transitionType}" data-trans-duration="${transitionDuration}" style="display: ${
          sIdx === 0 ? 'flex' : 'none'
        }; position: absolute; inset: 0; width: 100%; height: 100%; background: #0f172a; overflow: hidden; align-items: center; justify-content: center;">
            <div class="slide-stage" style="position: relative; width: 100%; height: 100%; max-width: 1440px; aspect-ratio: 16/9; margin: auto; padding: 48px;">
              ${objectsHtml}
            </div>
            <div style="position: absolute; bottom: 16px; right: 24px; font-size: 12px; color: rgba(255,255,255,0.4); font-family: monospace;">
              ${sIdx + 1} / ${activeSlides.length}
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${presentation.title || 'Master Presentation'}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { background: #020617; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; width: 100vw; height: 100vh; }
            
            ${SlideAnimationService.getAnimationKeyframesCss()}

            .controls { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 100; background: rgba(15,23,42,0.85); backdrop-filter: blur(12px); padding: 8px 18px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .btn { background: #2563eb; color: white; border: none; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold; cursor: pointer; transition: background 0.15s; }
            .btn:hover { background: #1d4ed8; }
            .counter { font-size: 12px; font-family: monospace; display: flex; align-items: center; padding: 0 8px; color: #e2e8f0; font-weight: bold; }
          </style>
        </head>
        <body>
          ${slidesHtml}
          <div class="controls">
            <button class="btn" onclick="prevStep()">&larr; Prev</button>
            <span id="counter" class="counter">1 / ${activeSlides.length}</span>
            <button class="btn" onclick="nextStep()">Next &rarr;</button>
          </div>
          <script>
            let currentSlide = 0;
            let currentStep = 0;
            const totalSlides = ${activeSlides.length};

            function getSlideOnClickObjects(slideIdx) {
              const slide = document.getElementById('slide-' + slideIdx);
              if (!slide) return [];
              return Array.from(slide.querySelectorAll('.anim-onclick'));
            }

            function setupSlide(slideIdx) {
              const slide = document.getElementById('slide-' + slideIdx);
              if (!slide) return;
              const transType = slide.getAttribute('data-trans-type') || 'fade';
              const transDur = slide.getAttribute('data-trans-duration') || '0.5';

              let animKey = 'mcSlideTransFade';
              if (transType === 'slide-left') animKey = 'mcSlideTransLeft';
              else if (transType === 'slide-right') animKey = 'mcSlideTransRight';
              else if (transType === 'slide-up') animKey = 'mcSlideTransUp';
              else if (transType === 'slide-down') animKey = 'mcSlideTransDown';
              else if (transType === 'zoom') animKey = 'mcSlideTransZoom';
              else if (transType === 'flip') animKey = 'mcSlideTransFlip';
              else if (transType === 'rotate') animKey = 'mcSlideTransRotate';
              else if (transType === 'dissolve') animKey = 'mcSlideTransDissolve';

              slide.style.animation = transType !== 'none' ? animKey + ' ' + transDur + 's cubic-bezier(0.16, 1, 0.3, 1) both' : 'none';

              // Hide all on-click animated objects on slide entry
              const onClickObjs = getSlideOnClickObjects(slideIdx);
              onClickObjs.forEach(el => {
                el.style.opacity = '0';
                el.style.animation = 'none';
              });

              // Trigger after-previous objects
              const afterPrevObjs = Array.from(slide.querySelectorAll('[data-anim-trigger="after-previous"]'));
              afterPrevObjs.forEach(el => {
                const aType = el.getAttribute('data-anim-type');
                const aDur = el.getAttribute('data-anim-duration') || '0.5';
                const aDelay = el.getAttribute('data-anim-delay') || '0';
                let aKey = 'mcFadeIn';
                if (aType === 'slide-up') aKey = 'mcSlideUp';
                else if (aType === 'slide-down') aKey = 'mcSlideDown';
                else if (aType === 'zoom-in') aKey = 'mcZoomIn';
                else if (aType === 'bounce') aKey = 'mcBounce';
                else if (aType === 'flip') aKey = 'mcFlip';
                else if (aType === 'spin') aKey = 'mcSpin';
                el.style.animation = aKey + ' ' + aDur + 's cubic-bezier(0.16, 1, 0.3, 1) ' + aDelay + 's both';
              });
            }

            function showSlide(idx) {
              for (let i = 0; i < totalSlides; i++) {
                const el = document.getElementById('slide-' + i);
                if (el) el.style.display = (i === idx) ? 'flex' : 'none';
              }
              document.getElementById('counter').innerText = (idx + 1) + ' / ' + totalSlides;
              currentStep = 0;
              setupSlide(idx);
            }

            function nextStep() {
              const onClickObjs = getSlideOnClickObjects(currentSlide);
              if (currentStep < onClickObjs.length) {
                const targetObj = onClickObjs[currentStep];
                const aType = targetObj.getAttribute('data-anim-type') || 'fade-in';
                const aDur = targetObj.getAttribute('data-anim-duration') || '0.5';
                let aKey = 'mcFadeIn';
                if (aType === 'slide-up') aKey = 'mcSlideUp';
                else if (aType === 'slide-down') aKey = 'mcSlideDown';
                else if (aType === 'zoom-in') aKey = 'mcZoomIn';
                else if (aType === 'bounce') aKey = 'mcBounce';
                else if (aType === 'flip') aKey = 'mcFlip';
                else if (aType === 'spin') aKey = 'mcSpin';
                targetObj.style.opacity = '1';
                targetObj.style.animation = aKey + ' ' + aDur + 's cubic-bezier(0.16, 1, 0.3, 1) both';
                currentStep++;
              } else if (currentSlide < totalSlides - 1) {
                currentSlide++;
                showSlide(currentSlide);
              }
            }

            function prevStep() {
              if (currentStep > 0) {
                const onClickObjs = getSlideOnClickObjects(currentSlide);
                currentStep--;
                if (onClickObjs[currentStep]) {
                  onClickObjs[currentStep].style.opacity = '0';
                  onClickObjs[currentStep].style.animation = 'none';
                }
              } else if (currentSlide > 0) {
                currentSlide--;
                showSlide(currentSlide);
                const onClickObjs = getSlideOnClickObjects(currentSlide);
                currentStep = onClickObjs.length;
                onClickObjs.forEach(el => { el.style.opacity = '1'; });
              }
            }

            // Init first slide
            setupSlide(0);

            window.addEventListener('keydown', function(e) {
              if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') nextStep();
              else if (e.key === 'ArrowLeft') prevStep();
              else if (e.key === 'Escape') window.close();
            });

            document.body.addEventListener('click', function(e) {
              if (!e.target.closest('.controls')) {
                nextStep();
              }
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
