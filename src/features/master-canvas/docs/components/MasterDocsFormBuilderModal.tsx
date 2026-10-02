import React, { useState } from 'react';
import { X, CheckSquare, Plus, Check } from 'lucide-react';
import { DocFormField } from '../types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MasterDocsFormBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertFieldHtml: (fieldHtml: string) => void;
}

export function MasterDocsFormBuilderModal({
  isOpen,
  onClose,
  onInsertFieldHtml,
}: MasterDocsFormBuilderModalProps) {
  const [fieldType, setFieldType] = useState<DocFormField['type']>('text');
  const [label, setLabel] = useState('Full Name');
  const [placeholder, setPlaceholder] = useState('Enter text here...');
  const [optionsStr, setOptionsStr] = useState('Option 1, Option 2, Option 3');
  const [required, setRequired] = useState(false);

  if (!isOpen) return null;

  const handleInsert = () => {
    const fieldId = 'ff-' + Date.now();
    let controlHtml = '';

    if (fieldType === 'text') {
      controlHtml = `
        <span class="master-docs-form-field" style="display: inline-block; margin: 4px 6px;">
          <span style="font-size: 11px; font-weight: 600; color: #475569; display: block;">${label}${required ? ' *' : ''}</span>
          <input type="text" placeholder="${placeholder}" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 12px; min-width: 200px;" />
        </span>
      `;
    } else if (fieldType === 'number') {
      controlHtml = `
        <span class="master-docs-form-field" style="display: inline-block; margin: 4px 6px;">
          <span style="font-size: 11px; font-weight: 600; color: #475569; display: block;">${label}${required ? ' *' : ''}</span>
          <input type="number" placeholder="${placeholder}" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 12px; width: 120px;" />
        </span>
      `;
    } else if (fieldType === 'date') {
      controlHtml = `
        <span class="master-docs-form-field" style="display: inline-block; margin: 4px 6px;">
          <span style="font-size: 11px; font-weight: 600; color: #475569; display: block;">${label}${required ? ' *' : ''}</span>
          <input type="date" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 12px;" />
        </span>
      `;
    } else if (fieldType === 'checkbox') {
      controlHtml = `
        <label class="master-docs-form-field" style="display: inline-flex; align-items: center; gap: 6px; margin: 4px 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
          <input type="checkbox" style="width: 14px; height: 14px; border-radius: 4px;" />
          <span>${label}</span>
        </label>
      `;
    } else if (fieldType === 'dropdown') {
      const opts = optionsStr.split(',').map((o) => o.trim()).filter(Boolean);
      controlHtml = `
        <span class="master-docs-form-field" style="display: inline-block; margin: 4px 6px;">
          <span style="font-size: 11px; font-weight: 600; color: #475569; display: block;">${label}${required ? ' *' : ''}</span>
          <select style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 12px; min-width: 160px;">
            ${opts.map((o) => `<option value="${o}">${o}</option>`).join('')}
          </select>
        </span>
      `;
    }

    onInsertFieldHtml(controlHtml);
    toast.success(`Inserted ${fieldType} field`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Interactive Form Field Builder</h2>
              <p className="text-xs text-muted-foreground">Embed interactive fillable inputs into your document</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Field Type</label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as any)}
              className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="text">Text Input Field</option>
              <option value="number">Number Field</option>
              <option value="date">Date Picker</option>
              <option value="checkbox">Checkbox</option>
              <option value="dropdown">Dropdown Select</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Field Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          {(fieldType === 'text' || fieldType === 'number') && (
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Placeholder</label>
              <input
                type="text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          )}

          {fieldType === 'dropdown' && (
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Options (comma separated)</label>
              <input
                type="text"
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            Mark as required field
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button variant="gradient" size="sm" onClick={handleInsert} className="rounded-xl text-xs font-bold gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Insert Form Control
          </Button>
        </div>
      </div>
    </div>
  );
}
