import React from 'react';

interface MasterDocsRulerProps {
  pageWidth: number; // in pixels (e.g. 794 for A4)
  leftMargin: number;
  rightMargin: number;
  zoomLevel: number;
}

export function MasterDocsRuler({ pageWidth, leftMargin, rightMargin, zoomLevel }: MasterDocsRulerProps) {
  // Generate tick marks (each tick = 0.25 inch / ~24px)
  const totalInches = Math.round(pageWidth / 96);
  const ticks = [];
  for (let i = 0; i <= totalInches * 4; i++) {
    ticks.push(i);
  }

  return (
    <div
      style={{ width: `${pageWidth * zoomLevel}px` }}
      className="h-6 bg-muted/40 border-b border-border/80 relative select-none mx-auto flex items-end overflow-hidden shadow-inner text-[9px] font-mono text-muted-foreground"
    >
      {/* Active text area shading */}
      <div
        style={{
          left: `${leftMargin * zoomLevel}px`,
          right: `${rightMargin * zoomLevel}px`,
        }}
        className="absolute inset-y-0 bg-background/80 border-x border-primary/40"
      />

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
  );
}
