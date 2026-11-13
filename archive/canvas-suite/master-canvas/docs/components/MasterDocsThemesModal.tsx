import React, { useState } from 'react';
import { X, Check, Palette, Sparkles, CheckCircle2 } from 'lucide-react';
import { DocTheme } from '../types';
import { DocThemesService } from '../services/DocThemesService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MasterDocsThemesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeThemeId?: string;
  onSelectTheme: (theme: DocTheme) => void;
}

export function MasterDocsThemesModal({
  isOpen,
  onClose,
  activeThemeId = 'office-m365',
  onSelectTheme,
}: MasterDocsThemesModalProps) {
  const themes = DocThemesService.getBuiltinThemes();
  const fontPairs = DocThemesService.getWordThemeFontPairs();
  const [selectedId, setSelectedId] = useState(activeThemeId);
  const [selectedFontPairId, setSelectedFontPairId] = useState<string>('');

  if (!isOpen) return null;

  const handleApply = (theme: DocTheme) => {
    setSelectedId(theme.id);
    const chosenPair = fontPairs.find((p) => p.id === selectedFontPairId);
    const resolvedTheme: DocTheme = chosenPair
      ? { ...theme, headingFont: chosenPair.headingFont, bodyFont: chosenPair.bodyFont }
      : theme;
    onSelectTheme(resolvedTheme);
    toast.success(`Theme "${resolvedTheme.name}" applied`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Document Themes & Palettes</h2>
              <p className="text-xs text-muted-foreground">
                Apply coordinated font pairings, heading treatments, and color systems
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Theme Font Pair Override Bar */}
        <div className="px-6 py-2.5 border-b border-border/60 bg-background/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-foreground">
            Word Theme Font Pairing <span className="text-muted-foreground font-normal">(optional override)</span>
          </div>
          <select
            value={selectedFontPairId}
            onChange={(e) => setSelectedFontPairId(e.target.value)}
            className="h-8 px-3 rounded-xl bg-background border border-border text-xs focus:ring-1 focus:ring-[#185abd] focus:outline-none min-w-[260px]"
          >
            <option value="">Use Theme&apos;s Built-in Font Pair</option>
            {fontPairs.map((fp) => (
              <option key={fp.id} value={fp.id}>
                {fp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => {
            const isCurrent = theme.id === selectedId;
            return (
              <div
                key={theme.id}
                onClick={() => setSelectedId(theme.id)}
                className={`group relative rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary'
                    : 'border-border/80 bg-background/50 hover:border-border hover:bg-accent/40'
                }`}
              >
                <div>
                  {/* Theme Header & Tag */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {theme.name}
                    </h3>
                    {isCurrent && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                  </div>

                  <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                    {theme.description}
                  </p>

                  {/* Theme Mock Visual Preview */}
                  <div className="rounded-xl border border-border/70 p-3 bg-card/80 space-y-2 mb-4 shadow-sm">
                    <div
                      className="text-xs font-bold truncate"
                      style={{
                        fontFamily: theme.headingFont,
                        color: theme.primaryColor,
                        borderBottom: theme.headingDecoration === 'bottom-border' ? `2px solid ${theme.accentColor}` : 'none',
                      }}
                    >
                      Executive Summary
                    </div>
                    <div
                      className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed"
                      style={{ fontFamily: theme.bodyFont }}
                    >
                      Coordinated document typography and structured page layouts for publishing.
                    </div>
                    {/* Palette Dots */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <div
                        className="h-3.5 w-3.5 rounded-full border border-border shadow-xs"
                        style={{ backgroundColor: theme.primaryColor }}
                        title="Primary Color"
                      />
                      <div
                        className="h-3.5 w-3.5 rounded-full border border-border shadow-xs"
                        style={{ backgroundColor: theme.accentColor }}
                        title="Accent Color"
                      />
                      <div
                        className="h-3.5 w-3.5 rounded-full border border-border shadow-xs"
                        style={{ backgroundColor: theme.cardBg }}
                        title="Card Background"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isCurrent ? 'gradient' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply(theme);
                  }}
                  className="w-full rounded-xl text-xs font-semibold h-8"
                >
                  {isCurrent ? 'Applied Theme' : 'Apply Theme'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
