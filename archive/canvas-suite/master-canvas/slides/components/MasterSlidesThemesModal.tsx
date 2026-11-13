import React from 'react';
import { X, Palette, Check, Sparkles, Layers } from 'lucide-react';
import { SlideThemeConfig, SlideThemeId } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';

interface MasterSlidesThemesModalProps {
  currentThemeId: SlideThemeId;
  onClose: () => void;
  onSelectTheme: (themeId: SlideThemeId, applyToAll: boolean) => void;
}

export function MasterSlidesThemesModal({
  currentThemeId,
  onClose,
  onSelectTheme,
}: MasterSlidesThemesModalProps) {
  const themes = SlideTemplates.getThemes();

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-5xl max-h-[85vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Theme &amp; Typography Studio</h2>
              <p className="text-[11px] text-muted-foreground">
                Select professionally crafted design systems for your presentation.
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

        {/* Themes Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => {
            const isSelected = currentThemeId === theme.id;

            return (
              <div
                key={theme.id}
                className={`flex flex-col rounded-2xl border p-4 transition-all shadow-md ${
                  isSelected ? 'border-primary ring-2 ring-primary/20 bg-accent/20' : 'border-border hover:border-border/80 bg-card/50'
                }`}
              >
                {/* Visual Theme Preview Box */}
                <div
                  className={`w-full aspect-video rounded-xl ${theme.bgGradient} p-4 flex flex-col justify-between border border-white/10 shadow-inner mb-3`}
                >
                  <div>
                    <span
                      style={{ color: theme.accentColor }}
                      className="text-[9px] font-bold uppercase tracking-wider block"
                    >
                      THEME PREVIEW
                    </span>
                    <h3
                      style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
                      className="text-base font-extrabold tracking-tight mt-0.5"
                    >
                      {theme.name}
                    </h3>
                  </div>

                  <p
                    style={{ color: theme.subtextColor, fontFamily: theme.fontFamily }}
                    className="text-[11px] leading-tight"
                  >
                    • Clean typography &bull; Unified palette
                  </p>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span
                      style={{ backgroundColor: theme.accentColor }}
                      className="w-3 h-3 rounded-full shadow-sm"
                    />
                    <span
                      style={{ backgroundColor: theme.cardBg }}
                      className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                    />
                  </div>
                </div>

                {/* Theme Description */}
                <p className="text-xs text-muted-foreground mb-4 flex-1">{theme.description}</p>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onSelectTheme(theme.id, false);
                      onClose();
                    }}
                    className="px-2 py-1.5 text-xs font-bold rounded-xl bg-accent hover:bg-accent/80 text-foreground border border-border transition-colors text-center"
                  >
                    Current Slide
                  </button>
                  <button
                    onClick={() => {
                      onSelectTheme(theme.id, true);
                      onClose();
                    }}
                    className="px-2 py-1.5 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors text-center"
                  >
                    Apply All Slides
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
