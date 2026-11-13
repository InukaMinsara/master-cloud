import React, { useState } from 'react';
import { X, BookOpen, Sun, Moon, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MasterDocsReadingModeProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  contentHtml: string;
}

export function MasterDocsReadingMode({ isOpen, onClose, title, contentHtml }: MasterDocsReadingModeProps) {
  const [fontSize, setFontSize] = useState(16);
  const [isDark, setIsDark] = useState(false);
  const [isTwoPage, setIsTwoPage] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-colors ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-amber-50/40 text-slate-900'
      }`}
    >
      {/* Top Floating Controls */}
      <header className="flex h-14 items-center justify-between px-6 border-b border-border/40 backdrop-blur-md bg-background/50 z-20">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm truncate max-w-sm">{title}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => setFontSize((f) => Math.max(12, f - 2))}
              className="p-1.5 rounded-lg hover:bg-background transition-colors text-xs font-bold"
              title="Decrease Font Size"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-mono px-1">{fontSize}px</span>
            <button
              onClick={() => setFontSize((f) => Math.min(26, f + 2))}
              className="p-1.5 rounded-lg hover:bg-background transition-colors text-xs font-bold"
              title="Increase Font Size"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsTwoPage(!isTwoPage)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isTwoPage ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'
            }`}
          >
            {isTwoPage ? '2-Page Spread' : 'Single Column'}
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl border border-border bg-background hover:bg-accent transition-colors"
            title="Toggle Dark / Sepia Theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          <Button size="sm" variant="ghost" onClick={onClose} className="rounded-xl text-xs gap-1">
            <X className="h-4 w-4" /> Exit Reading
          </Button>
        </div>
      </header>

      {/* Reader Content Sheet */}
      <main className="flex-1 overflow-y-auto p-8 flex justify-center">
        <div
          style={{ fontSize: `${fontSize}px` }}
          className={`w-full max-w-5xl leading-relaxed font-serif ${
            isTwoPage ? 'columns-2 gap-12' : 'max-w-3xl'
          } p-8 rounded-2xl ${isDark ? 'bg-slate-900/80' : 'bg-white'} shadow-xl border border-border/40`}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </main>
    </div>
  );
}
