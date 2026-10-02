import React, { useState } from 'react';
import {
  X,
  LayoutTemplate,
  Palette,
  Type,
  Image as ImageIcon,
  Check,
  Save,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { MasterPresentationData, SlideMaster, SlideThemeId } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';

interface MasterSlidesMasterViewProps {
  presentation: MasterPresentationData;
  onUpdateMaster: (master: SlideMaster) => void;
  onClose: () => void;
}

export function MasterSlidesMasterView({
  presentation,
  onUpdateMaster,
  onClose,
}: MasterSlidesMasterViewProps) {
  const currentMaster: SlideMaster = presentation.master || {
    bgTheme: presentation.defaultTheme || 'dark-slate',
    headerText: presentation.headerText || 'Master Cloud Presentation',
    footerText: presentation.footerText || 'Confidential & Proprietary',
    showSlideNumbers: presentation.showSlideNumbers ?? true,
    titleFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    logoUrl: '',
  };

  const [bgTheme, setBgTheme] = useState<SlideThemeId>(currentMaster.bgTheme);
  const [headerText, setHeaderText] = useState(currentMaster.headerText || '');
  const [footerText, setFooterText] = useState(currentMaster.footerText || '');
  const [showSlideNumbers, setShowSlideNumbers] = useState(currentMaster.showSlideNumbers ?? true);
  const [titleFont, setTitleFont] = useState(currentMaster.titleFont || 'Inter, sans-serif');
  const [bodyFont, setBodyFont] = useState(currentMaster.bodyFont || 'Inter, sans-serif');
  const [logoUrl, setLogoUrl] = useState(currentMaster.logoUrl || '');

  const themes = SlideTemplates.getThemes();
  const themeConfig = themes.find((t) => t.id === bgTheme) || themes[0];

  const handleSaveMaster = () => {
    onUpdateMaster({
      bgTheme,
      headerText,
      footerText,
      showSlideNumbers,
      titleFont,
      bodyFont,
      logoUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col select-none overflow-hidden animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-card/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <LayoutTemplate className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Slide Master Studio</h2>
              <p className="text-[10px] text-muted-foreground">
                Customize global headers, footers, logo placement, and base typography.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveMaster}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Apply Master to All Slides</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Controls Drawer */}
        <div className="w-80 border-r border-border bg-card/40 p-6 overflow-y-auto space-y-6">
          {/* Base Theme */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Default Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setBgTheme(t.id)}
                  className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                    bgTheme === t.id
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/10 text-foreground font-bold'
                      : 'border-border hover:border-border/80 text-muted-foreground'
                  }`}
                >
                  {t.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Master Typography
            </label>
            <div>
              <span className="text-[11px] text-muted-foreground block mb-1">Title Font:</span>
              <select
                value={titleFont}
                onChange={(e) => setTitleFont(e.target.value)}
                className="w-full text-xs bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="Inter, sans-serif">Inter (Modern Clean)</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="Georgia, serif">Georgia (Editorial)</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
              </select>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block mb-1">Body Font:</span>
              <select
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                className="w-full text-xs bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="Inter, sans-serif">Inter</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
              </select>
            </div>
          </div>

          {/* Header & Footer */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Header &amp; Footer Text
            </label>
            <div>
              <span className="text-[11px] text-muted-foreground block mb-1">Header Label:</span>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="Header text..."
                className="w-full text-xs bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block mb-1">Footer Label:</span>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="Footer text..."
                className="w-full text-xs bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={showSlideNumbers}
                onChange={(e) => setShowSlideNumbers(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs text-foreground font-medium">Show Slide Numbers</span>
            </label>
          </div>
        </div>

        {/* Central Master Preview Stage */}
        <div className="flex-1 bg-muted/30 p-10 flex items-center justify-center overflow-auto">
          <div
            style={{ aspectRatio: '16/9', maxWidth: '960px', width: '100%' }}
            className={`rounded-2xl shadow-2xl border border-border/80 p-8 flex flex-col justify-between relative ${themeConfig.bgGradient}`}
          >
            {/* Master Header */}
            <div className="flex items-center justify-between text-[11px] opacity-60 text-slate-300 border-b border-white/10 pb-2">
              <span>{headerText || 'MASTER HEADER PLACEHOLDER'}</span>
              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10">
                Slide Master
              </span>
            </div>

            {/* Master Title & Subtitle Placeholders */}
            <div className="my-auto space-y-4">
              <div
                style={{ fontFamily: titleFont, color: themeConfig.textColor }}
                className="border border-dashed border-white/30 rounded-xl p-4 text-center text-2xl font-black"
              >
                Click to Edit Master Title Style
              </div>
              <div
                style={{ fontFamily: bodyFont, color: themeConfig.subtextColor }}
                className="border border-dashed border-white/20 rounded-xl p-4 text-center text-sm"
              >
                Click to Edit Master Subtitle / Body Hierarchy
              </div>
            </div>

            {/* Master Footer */}
            <div className="flex items-center justify-between text-[11px] opacity-60 text-slate-300 border-t border-white/10 pt-2">
              <span>{footerText || 'MASTER FOOTER PLACEHOLDER'}</span>
              {showSlideNumbers && <span className="font-mono">Slide #</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
