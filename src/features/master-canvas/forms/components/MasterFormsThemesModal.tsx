import React, { useState } from 'react';
import { Palette, X, Sparkles, Check, Layout, Type } from 'lucide-react';
import { FormTheme } from '../types';
import { toast } from 'sonner';

interface MasterFormsThemesModalProps {
  currentTheme: FormTheme;
  isOpen: boolean;
  onClose: () => void;
  onSaveTheme: (theme: FormTheme) => void;
}

const THEME_PALETTES = [
  { id: 'purple-modern', name: 'Master Purple', primary: '#8b5cf6', accent: '#c084fc', banner: 'gradient-purple' },
  { id: 'emerald-eco', name: 'Emerald Clean', primary: '#10b981', accent: '#34d399', banner: 'gradient-emerald' },
  { id: 'sky-tech', name: 'Sky Tech', primary: '#0284c7', accent: '#38bdf8', banner: 'gradient-cyan' },
  { id: 'indigo-corp', name: 'Indigo Corporate', primary: '#6366f1', accent: '#818cf8', banner: 'gradient-indigo' },
  { id: 'sunset-amber', name: 'Sunset Amber', primary: '#f59e0b', accent: '#fbbf24', banner: 'gradient-purple' },
  { id: 'rose-minimal', name: 'Rose Aesthetic', primary: '#f43f5e', accent: '#fb7185', banner: 'gradient-purple' },
];

const FONTS: Array<FormTheme['fontFamily']> = [
  'Inter',
  'Roboto',
  'Poppins',
  'Playfair Display',
  'JetBrains Mono',
  'Outfit',
];

export function MasterFormsThemesModal({
  currentTheme,
  isOpen,
  onClose,
  onSaveTheme,
}: MasterFormsThemesModalProps) {
  const [theme, setTheme] = useState<FormTheme>(currentTheme);

  if (!isOpen) return null;

  const handleApply = () => {
    onSaveTheme(theme);
    toast.success('Theme applied');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border/80 rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Theme & Visual Styling</h2>
              <p className="text-xs text-muted-foreground">Customize colors, typography, banners, and layout style</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 text-xs">
          {/* Color Palettes */}
          <div className="space-y-2">
            <label className="font-bold text-foreground block">Color Theme Palette</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {THEME_PALETTES.map((p) => {
                const isSelected = theme.primaryColor === p.primary;
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      setTheme({
                        ...theme,
                        themeId: p.id,
                        primaryColor: p.primary,
                        accentColor: p.accent,
                        headerBannerPreset: p.banner,
                      })
                    }
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-bold text-foreground'
                        : 'border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div
                      className="h-5 w-5 rounded-full shrink-0 flex items-center justify-center text-white"
                      style={{ backgroundColor: p.primary }}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Layout Mode */}
          <div className="space-y-2">
            <label className="font-bold text-foreground flex items-center gap-1.5">
              <Layout className="h-4 w-4 text-primary" />
              <span>Form Layout & Display Flow</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme({ ...theme, layoutMode: 'single-page' })}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  theme.layoutMode === 'single-page'
                    ? 'border-primary bg-primary/5 text-foreground font-bold'
                    : 'border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="text-xs">Single Page</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Classic Scroll</div>
              </button>

              <button
                onClick={() => setTheme({ ...theme, layoutMode: 'multi-page' })}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  theme.layoutMode === 'multi-page'
                    ? 'border-primary bg-primary/5 text-foreground font-bold'
                    : 'border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="text-xs">Multi-Page</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Section Wizard</div>
              </button>

              <button
                onClick={() => setTheme({ ...theme, layoutMode: 'card-wizard' })}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  theme.layoutMode === 'card-wizard'
                    ? 'border-primary bg-primary/5 text-foreground font-bold'
                    : 'border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="text-xs">Card-by-Card</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Typeform Style</div>
              </button>
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-2">
            <label className="font-bold text-foreground flex items-center gap-1.5">
              <Type className="h-4 w-4 text-primary" />
              <span>Typography Font Family</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FONTS.map((font) => (
                <button
                  key={font}
                  onClick={() => setTheme({ ...theme, fontFamily: font })}
                  className={`p-2.5 rounded-xl border text-xs text-center transition-all ${
                    theme.fontFamily === font
                      ? 'border-primary bg-primary/5 text-foreground font-bold'
                      : 'border-border/60 text-muted-foreground hover:text-foreground'
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          {/* Header Banner Preset */}
          <div className="space-y-2">
            <label className="font-bold text-foreground block">Top Header Banner Style</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme({ ...theme, headerBannerPreset: undefined })}
                className={`p-2.5 rounded-xl border text-xs text-center ${
                  !theme.headerBannerPreset
                    ? 'border-primary bg-primary/5 font-bold text-foreground'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                Minimal (No Banner)
              </button>
              <button
                onClick={() => setTheme({ ...theme, headerBannerPreset: 'gradient-purple' })}
                className={`p-2.5 rounded-xl border text-xs text-center ${
                  theme.headerBannerPreset
                    ? 'border-primary bg-primary/5 font-bold text-foreground'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                Vibrant Gradient Banner
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border/80 hover:bg-muted text-xs font-semibold text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
          >
            Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
}
