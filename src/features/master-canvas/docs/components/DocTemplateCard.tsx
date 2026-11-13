import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { DocumentTemplate } from '../MasterDocsTemplates';

interface DocTemplateCardProps {
  template: DocumentTemplate;
  isCreating?: boolean;
  onSelect: (template: DocumentTemplate) => void;
}

/**
 * Renders a calm, Microsoft Word Home–style template card with a scaled miniature A4 paper preview.
 */
export function DocTemplateCard({ template, isCreating = false, onSelect }: DocTemplateCardProps) {
  const accent = template.accentColor || '#156082';
  const cat = template.category;
  const isBlank = template.id === 'blank';

  const renderPaperThumbnail = () => {
    if (isBlank) {
      return (
        <div className="w-[106px] h-[138px] bg-white rounded-[3px] shadow-md ring-1 ring-black/10 flex flex-col items-center justify-center gap-1.5 transition-transform duration-200 group-hover:scale-[1.04]">
          <div className="h-8 w-8 rounded-full bg-[#185abd]/10 text-[#185abd] flex items-center justify-center">
            <Plus className="h-5 w-5 stroke-[2.2]" />
          </div>
        </div>
      );
    }

    if (cat === 'Resumes') {
      return (
        <div className="w-[106px] h-[138px] bg-white rounded-[3px] shadow-md ring-1 ring-black/10 p-2.5 flex flex-col gap-1.5 overflow-hidden transition-transform duration-200 group-hover:scale-[1.04]">
          <div className="space-y-1">
            <div className="h-2 w-16 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="h-1 w-11 rounded-[1px] bg-slate-400" />
            <div className="h-0.5 w-full bg-slate-200 mt-1" />
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="h-1 w-9 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="h-1 w-full rounded-[1px] bg-slate-200" />
            <div className="h-1 w-11/12 rounded-[1px] bg-slate-200" />
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="h-1 w-10 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: accent }} />
              <div className="h-1 w-full rounded-[1px] bg-slate-200" />
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: accent }} />
              <div className="h-1 w-4/5 rounded-[1px] bg-slate-200" />
            </div>
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="h-1 w-8 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="h-1 w-3/4 rounded-[1px] bg-slate-200" />
          </div>
        </div>
      );
    }

    if (cat === 'Letters') {
      return (
        <div className="w-[106px] h-[138px] bg-white rounded-[3px] shadow-md ring-1 ring-black/10 p-2.5 flex flex-col justify-between overflow-hidden transition-transform duration-200 group-hover:scale-[1.04]">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: `${accent}55` }}>
              <div className="space-y-0.5">
                <div className="h-1.5 w-12 rounded-[1px]" style={{ backgroundColor: accent }} />
                <div className="h-0.5 w-9 bg-slate-300" />
              </div>
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
            </div>
            <div className="h-1 w-8 bg-slate-300 mt-1" />
            <div className="space-y-0.5 pt-1">
              <div className="h-1 w-10 bg-slate-400" />
              <div className="h-1 w-12 bg-slate-200" />
            </div>
            <div className="space-y-1 pt-1">
              <div className="h-1 w-full bg-slate-200" />
              <div className="h-1 w-full bg-slate-200" />
              <div className="h-1 w-5/6 bg-slate-200" />
              <div className="h-1 w-full bg-slate-200" />
              <div className="h-1 w-2/3 bg-slate-200" />
            </div>
          </div>
          <div className="space-y-0.5 pt-1">
            <div className="h-1 w-7 bg-slate-300" />
            <div className="h-1.5 w-10 rounded-[1px]" style={{ backgroundColor: accent }} />
          </div>
        </div>
      );
    }

    if (cat === 'Academic') {
      return (
        <div className="w-[106px] h-[138px] bg-white rounded-[3px] shadow-md ring-1 ring-black/10 p-2.5 flex flex-col gap-1.5 overflow-hidden transition-transform duration-200 group-hover:scale-[1.04]">
          <div className="text-center space-y-1 pb-1 border-b border-slate-200">
            <div className="h-1.5 w-16 mx-auto rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="h-1 w-10 mx-auto bg-slate-300" />
          </div>
          <div
            className="p-1.5 rounded-[2px] border-l-2 space-y-1"
            style={{ borderColor: accent, backgroundColor: `${accent}12` }}
          >
            <div className="h-1 w-8 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="h-0.5 w-full bg-slate-300" />
            <div className="h-0.5 w-4/5 bg-slate-300" />
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="h-1 w-10 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="h-1 w-full bg-slate-200" />
            <div className="h-1 w-11/12 bg-slate-200" />
            <div className="h-1 w-4/5 bg-slate-200" />
          </div>
        </div>
      );
    }

    if (cat === 'Newsletters') {
      return (
        <div className="w-[106px] h-[138px] bg-white rounded-[3px] shadow-md ring-1 ring-black/10 overflow-hidden flex flex-col transition-transform duration-200 group-hover:scale-[1.04]">
          <div className="px-2.5 py-2 text-white" style={{ backgroundColor: accent }}>
            <div className="h-1 w-8 bg-white/70 mb-1 rounded-[1px]" />
            <div className="h-2 w-16 bg-white rounded-[1px]" />
          </div>
          <div className="p-2 grid grid-cols-3 gap-1.5 flex-1">
            <div className="col-span-2 space-y-1">
              <div className="h-1 w-full bg-slate-300" />
              <div className="h-1 w-full bg-slate-200" />
              <div className="h-1 w-4/5 bg-slate-200" />
              <div className="h-1 w-full bg-slate-200 mt-1" />
              <div className="h-1 w-3/4 bg-slate-200" />
            </div>
            <div className="rounded-[2px] p-1 space-y-1" style={{ backgroundColor: `${accent}18` }}>
              <div className="h-1 w-full rounded-[1px]" style={{ backgroundColor: accent }} />
              <div className="h-0.5 w-full bg-slate-300" />
              <div className="h-0.5 w-3/4 bg-slate-300" />
            </div>
          </div>
        </div>
      );
    }

    // Business / Reports / Engineering cover-accent layout
    return (
      <div className="w-[106px] h-[138px] bg-white rounded-[3px] shadow-md ring-1 ring-black/10 overflow-hidden flex flex-col transition-transform duration-200 group-hover:scale-[1.04]">
        <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
        <div className="p-2.5 flex flex-col gap-1.5 flex-1">
          <div className="space-y-1">
            <div className="h-2 w-16 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="h-1 w-12 bg-slate-300" />
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="h-1 w-full bg-slate-200" />
            <div className="h-1 w-11/12 bg-slate-200" />
          </div>
          {/* Mini Word table */}
          <div className="border border-slate-200 rounded-[2px] overflow-hidden mt-0.5">
            <div className="h-2 w-full" style={{ backgroundColor: accent }} />
            <div className="h-1.5 w-full bg-slate-50 border-t border-slate-200" />
            <div className="h-1.5 w-full bg-white border-t border-slate-200" />
          </div>
          <div className="space-y-1 mt-auto">
            <div className="h-1 w-10 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="h-1 w-full bg-slate-200" />
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
      className="group text-left rounded-xl border border-border/70 bg-card/85 hover:bg-card hover:border-[#185abd]/60 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-[#185abd]/50 disabled:opacity-60"
    >
      {/* Thumbnail Stage */}
      <div className="relative h-40 w-full bg-slate-100/80 dark:bg-slate-900/75 border-b border-border/50 flex items-center justify-center p-3">
        {renderPaperThumbnail()}
        {isCreating && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#185abd]" />
          </div>
        )}
      </div>

      {/* Clean Single-Focus Caption */}
      <div className="px-3.5 py-3 flex-1 flex flex-col justify-between gap-1">
        <div className="font-semibold text-[13px] text-foreground group-hover:text-[#185abd] dark:group-hover:text-blue-400 transition-colors truncate">
          {template.name}
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-1">
          {template.category} &bull; {template.description}
        </p>
      </div>
    </button>
  );
}
