import React from 'react';
import { Layers, Trash2, SplitSquareVertical } from 'lucide-react';
import { FormSection } from '../types';

interface MasterFormsSectionCardProps {
  section: FormSection;
  sectionIndex: number;
  totalSections: number;
  allSections: FormSection[];
  onUpdate: (updates: Partial<FormSection>) => void;
  onDelete: () => void;
}

export function MasterFormsSectionCard({
  section,
  sectionIndex,
  totalSections,
  allSections,
  onUpdate,
  onDelete,
}: MasterFormsSectionCardProps) {
  return (
    <div className="bg-primary/5 border-2 border-dashed border-primary/40 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Section {sectionIndex + 1} of {totalSections}
          </span>
        </div>

        {totalSections > 1 && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-xs flex items-center gap-1"
            title="Delete Section (Questions will move to previous section)"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Remove Section</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Section Title (e.g. Personal Details, Experience...)"
          className="w-full text-base font-bold bg-transparent border-b border-border/50 focus:border-primary focus:outline-none py-1 text-foreground"
        />

        <textarea
          rows={1}
          value={section.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Optional description or instructions for this section..."
          className="w-full text-xs text-muted-foreground bg-transparent border-none outline-none resize-none"
        />
      </div>

      {/* Default Navigation after this section */}
      {sectionIndex < totalSections - 1 && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
          <SplitSquareVertical className="h-3.5 w-3.5 text-primary" />
          <span>After Section {sectionIndex + 1}:</span>
          <select
            value={section.nextSectionId || 'next'}
            onChange={(e) => onUpdate({ nextSectionId: e.target.value === 'next' ? undefined : e.target.value })}
            className="bg-background border border-border/60 rounded-lg px-2 py-1 text-xs font-medium text-foreground"
          >
            <option value="next">Continue to next section</option>
            {allSections
              .filter((s) => s.id !== section.id)
              .map((s, idx) => (
                <option key={s.id} value={s.id}>
                  Jump to Section {idx + 1}: {s.title || 'Untitled'}
                </option>
              ))}
            <option value="submit">Submit form directly</option>
          </select>
        </div>
      )}
    </div>
  );
}
