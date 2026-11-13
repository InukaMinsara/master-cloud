import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { SlideTemplateCatalogItem } from '../services/SlideTemplates';

interface SlideTemplateCardProps {
  template: SlideTemplateCatalogItem;
  isCreating?: boolean;
  onSelect: (template: SlideTemplateCatalogItem) => void;
}

/**
 * Calm Microsoft PowerPoint Home–style 16:9 widescreen template preview card.
 */
export function SlideTemplateCard({
  template,
  isCreating = false,
  onSelect,
}: SlideTemplateCardProps) {
  const accent = template.accentColor || '#B7472A';
  const isBlank = template.id === 'blank';
  const isLight = template.lightCardText !== false && template.bgPreview !== '#1C1917' && template.bgPreview !== '#4C0519' && template.bgPreview !== '#0F172A';

  const renderSlideThumbnail = () => {
    if (isBlank) {
      return (
        <div className="w-full max-w-[172px] aspect-video bg-white rounded-[4px] shadow-md ring-1 ring-black/10 flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.03]">
          <div className="h-8 w-8 rounded-full bg-[#B7472A]/10 text-[#B7472A] flex items-center justify-center">
            <Plus className="h-5 w-5 stroke-[2.2]" />
          </div>
        </div>
      );
    }

    return (
      <div
        className="w-full max-w-[172px] aspect-video rounded-[4px] shadow-md ring-1 ring-black/10 overflow-hidden flex flex-col justify-between p-2.5 transition-transform duration-200 group-hover:scale-[1.03] relative"
        style={{ backgroundColor: template.bgPreview || '#FFFFFF' }}
      >
        {/* Top or Left Signature Accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: accent }}
        />

        <div className="pt-1.5 space-y-1.5">
          <div className="h-2 w-3/4 rounded-[1px]" style={{ backgroundColor: isLight ? '#0F172A' : '#FFFFFF' }} />
          <div className="h-1 w-1/2 rounded-[1px]" style={{ backgroundColor: accent }} />
        </div>

        {/* Mini Content Columns / Visual Block */}
        <div className="grid grid-cols-3 gap-1.5 items-end">
          <div className="col-span-2 space-y-1">
            <div className="h-1 w-full rounded-[1px]" style={{ backgroundColor: isLight ? '#CBD5E1' : 'rgba(255,255,255,0.28)' }} />
            <div className="h-1 w-5/6 rounded-[1px]" style={{ backgroundColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.18)' }} />
          </div>
          <div className="h-5 rounded-[2px] flex items-end gap-0.5 p-0.5" style={{ backgroundColor: `${accent}24` }}>
            <div className="w-1/3 h-2 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="w-1/3 h-3.5 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="w-1/3 h-3 rounded-[1px]" style={{ backgroundColor: accent }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <button
      type="button"
      disabled={isCreating}
      onClick={() => onSelect(template)}
      className="group text-left rounded-xl border border-border/70 bg-card/85 hover:bg-card hover:border-[#B7472A]/60 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-[#B7472A]/50 disabled:opacity-60"
    >
      <div className="relative h-36 w-full bg-slate-100/80 dark:bg-slate-900/75 border-b border-border/50 flex items-center justify-center p-3">
        {renderSlideThumbnail()}
        {isCreating && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#B7472A]" />
          </div>
        )}
      </div>

      <div className="px-3.5 py-3 flex-1 flex flex-col justify-between gap-1">
        <div className="font-semibold text-[13px] text-foreground group-hover:text-[#B7472A] dark:group-hover:text-orange-400 transition-colors truncate">
          {template.name}
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-1">
          {template.category} &bull; {template.description}
        </p>
      </div>
    </button>
  );
}
