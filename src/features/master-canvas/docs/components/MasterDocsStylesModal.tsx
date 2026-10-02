import React, { useState } from 'react';
import { X, Check, Sparkles, Type, Sliders, Palette, ChevronRight } from 'lucide-react';
import { DocStyleItem } from '../types';
import { DocThemesService } from '../services/DocThemesService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MasterDocsStylesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customStyles?: DocStyleItem[];
  onApplyStyle: (style: DocStyleItem) => void;
  onSaveStyles: (styles: DocStyleItem[]) => void;
}

export function MasterDocsStylesModal({
  isOpen,
  onClose,
  customStyles,
  onApplyStyle,
  onSaveStyles,
}: MasterDocsStylesModalProps) {
  const [stylesList, setStylesList] = useState<DocStyleItem[]>(() =>
    customStyles && customStyles.length > 0 ? customStyles : DocThemesService.getDefaultStyles()
  );
  const [selectedStyleId, setSelectedStyleId] = useState<string>(stylesList[0]?.id || 'style-title');

  if (!isOpen) return null;

  const activeStyle = stylesList.find((s) => s.id === selectedStyleId) || stylesList[0];

  const handleUpdateActiveStyle = (updates: Partial<DocStyleItem>) => {
    const updated = stylesList.map((s) => (s.id === selectedStyleId ? { ...s, ...updates } : s));
    setStylesList(updated);
    onSaveStyles(updated);
  };

  const handleApply = () => {
    onApplyStyle(activeStyle);
    toast.success(`Applied style "${activeStyle.name}"`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Type className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Advanced Style & Typography Manager</h2>
              <p className="text-xs text-muted-foreground">
                Customize hierarchical styles, kerning, line heights, and typography presets
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

        {/* Body Split */}
        <div className="flex flex-1 min-h-0 divide-x divide-border/80">
          {/* Left: Styles list */}
          <div className="w-64 p-4 overflow-y-auto space-y-1.5 bg-muted/20">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
              Document Styles
            </div>
            {stylesList.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyleId(style.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                  style.id === selectedStyleId
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <div className="truncate">
                  <div className="font-semibold">{style.name}</div>
                  <div className="text-[10px] opacity-70">
                    {style.fontFamily.split(',')[0]} &bull; {style.fontSize}
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
              </button>
            ))}
          </div>

          {/* Right: Style Editor & Live Preview */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Live Preview Box */}
            <div className="rounded-xl border border-border/80 bg-background/80 p-5 shadow-inner">
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Live Style Preview</div>
              <div
                style={{
                  fontFamily: activeStyle.fontFamily,
                  fontSize: activeStyle.fontSize,
                  fontWeight: activeStyle.fontWeight,
                  lineHeight: activeStyle.lineHeight,
                  letterSpacing: activeStyle.letterSpacing || 'normal',
                  color: activeStyle.color || 'inherit',
                  textTransform: activeStyle.isAllCaps ? 'uppercase' : 'none',
                  fontVariant: activeStyle.isSmallCaps ? 'small-caps' : 'normal',
                  marginBottom: activeStyle.marginBottom || '0',
                }}
                className="transition-all"
              >
                {activeStyle.name} — The quick brown fox jumps over the lazy dog
              </div>
            </div>

            {/* Typography Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Font Family</label>
                <select
                  value={activeStyle.fontFamily}
                  onChange={(e) => handleUpdateActiveStyle({ fontFamily: e.target.value })}
                  className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="Inter, sans-serif">Inter (Modern Clean)</option>
                  <option value="Calibri, Arial, sans-serif">Calibri (Executive)</option>
                  <option value="Georgia, Times New Roman, serif">Georgia (Editorial Serif)</option>
                  <option value="'Times New Roman', serif">Times New Roman (Academic)</option>
                  <option value="'JetBrains Mono', monospace">JetBrains Mono (Code/Tech)</option>
                  <option value="'Playfair Display', serif">Playfair Display (Elegant)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Font Size</label>
                <input
                  type="text"
                  value={activeStyle.fontSize}
                  onChange={(e) => handleUpdateActiveStyle({ fontSize: e.target.value })}
                  placeholder="e.g. 14pt, 1.5rem"
                  className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Font Weight</label>
                <select
                  value={activeStyle.fontWeight}
                  onChange={(e) => handleUpdateActiveStyle({ fontWeight: e.target.value })}
                  className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="normal">Normal (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi-Bold (600)</option>
                  <option value="bold">Bold (700)</option>
                  <option value="800">Extra Bold (800)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Line Height</label>
                <input
                  type="text"
                  value={activeStyle.lineHeight}
                  onChange={(e) => handleUpdateActiveStyle({ lineHeight: e.target.value })}
                  placeholder="e.g. 1.5, 1.6"
                  className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeStyle.color || '#0f172a'}
                    onChange={(e) => handleUpdateActiveStyle({ color: e.target.value })}
                    className="h-8 w-10 rounded-lg cursor-pointer border border-border p-0.5 bg-background"
                  />
                  <input
                    type="text"
                    value={activeStyle.color || '#0f172a'}
                    onChange={(e) => handleUpdateActiveStyle({ color: e.target.value })}
                    className="flex-1 text-xs rounded-xl bg-background border border-border px-3 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Letter Spacing</label>
                <input
                  type="text"
                  value={activeStyle.letterSpacing || 'normal'}
                  onChange={(e) => handleUpdateActiveStyle({ letterSpacing: e.target.value })}
                  placeholder="e.g. 0.5px, 0.05em"
                  className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Advanced Typography Toggles */}
            <div className="flex items-center gap-4 pt-2 border-t border-border/80">
              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!activeStyle.isAllCaps}
                  onChange={(e) => handleUpdateActiveStyle({ isAllCaps: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                All Caps
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!activeStyle.isSmallCaps}
                  onChange={(e) => handleUpdateActiveStyle({ isSmallCaps: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                Small Caps
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!activeStyle.keepWithNext}
                  onChange={(e) => handleUpdateActiveStyle({ keepWithNext: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                Keep With Next (Orphan Control)
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <span className="text-xs text-muted-foreground">Changes automatically update all linked styles</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
              Close
            </Button>
            <Button variant="gradient" size="sm" onClick={handleApply} className="rounded-xl text-xs font-bold gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Apply to Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
