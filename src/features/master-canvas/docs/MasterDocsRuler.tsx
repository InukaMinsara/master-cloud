import React from 'react';
import { CanvasDocData } from '@/types/canvas';

interface MasterDocsRulerProps {
  pageWidth: number; // in pixels (e.g. 794 for A4)
  leftMargin: number;
  rightMargin: number;
  zoomLevel: number;
  currentMarginPreset?: NonNullable<CanvasDocData['pageLayout']>['margins'];
  onChangeMargins?: (margins: NonNullable<CanvasDocData['pageLayout']>['margins']) => void;
}

export function MasterDocsRuler({
  pageWidth,
  leftMargin,
  rightMargin,
  zoomLevel,
  currentMarginPreset = 'normal',
  onChangeMargins,
}: MasterDocsRulerProps) {
  const totalInches = Math.round(pageWidth / 96);
  const ticks: number[] = [];
  for (let i = 0; i <= totalInches * 4; i++) {
    ticks.push(i);
  }

  const cycleMargin = () => {
    if (!onChangeMargins) return;
    const order: Array<'narrow' | 'moderate' | 'normal' | 'wide'> = ['narrow', 'moderate', 'normal', 'wide'];
    const idx = order.indexOf(currentMarginPreset as any);
    const next = order[(idx + 1) % order.length];
    onChangeMargins(next);
  };

  return (
    <div className="w-full bg-[#f3f2f1] dark:bg-slate-900 border-b border-black/[0.08] dark:border-border/80 flex justify-center overflow-x-auto select-none shrink-0 py-0.5">
      <div
        style={{ width: `${pageWidth * zoomLevel}px` }}
        className="h-5 bg-[#e1dfdd] dark:bg-slate-800 relative flex items-end overflow-hidden text-[9px] font-mono text-muted-foreground shrink-0 border-x border-black/10"
      >
        {/* Active text area shading (White Word printable band) */}
        <div
          style={{
            left: `${leftMargin * zoomLevel}px`,
            right: `${rightMargin * zoomLevel}px`,
          }}
          className="absolute inset-y-0 bg-white dark:bg-card border-x border-[#185abd]/40 transition-all duration-150"
        />

        {/* Interactive Left Margin Handle */}
        <button
          type="button"
          onClick={cycleMargin}
          style={{ left: `${leftMargin * zoomLevel}px` }}
          title={`Left Margin (${currentMarginPreset}) — click to cycle preset`}
          className="absolute top-0.5 -translate-x-1/2 z-10 w-3 h-3 cursor-pointer flex items-center justify-center group"
        >
          <span className="w-2 h-2 rotate-45 bg-[#185abd] group-hover:scale-125 transition-transform shadow-xs" />
        </button>

        {/* Interactive Right Margin Handle */}
        <button
          type="button"
          onClick={cycleMargin}
          style={{ right: `${rightMargin * zoomLevel}px` }}
          title={`Right Margin (${currentMarginPreset}) — click to cycle preset`}
          className="absolute top-0.5 translate-x-1/2 z-10 w-3 h-3 cursor-pointer flex items-center justify-center group"
        >
          <span className="w-2 h-2 rotate-45 bg-[#185abd] group-hover:scale-125 transition-transform shadow-xs" />
        </button>

        {/* Tick Marks & Numbers */}
        {ticks.map((t) => {
          const isInch = t % 4 === 0;
          const isHalfInch = t % 2 === 0 && !isInch;
          const posPercent = (t / (totalInches * 4)) * 100;

          return (
            <div
              key={t}
              style={{ left: `${posPercent}%` }}
              className="absolute bottom-0 flex flex-col items-center pointer-events-none"
            >
              {isInch && t > 0 && t < totalInches * 4 && (
                <span className="mb-0.5 transform -translate-x-1/2">{t / 4}</span>
              )}
              <div
                className={`w-px bg-muted-foreground/50 ${
                  isInch ? 'h-3 bg-muted-foreground' : isHalfInch ? 'h-2' : 'h-1'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
