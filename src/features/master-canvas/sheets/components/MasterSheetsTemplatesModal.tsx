import React from 'react';
import { X, FileSpreadsheet, Sparkles, Check, ChevronRight } from 'lucide-react';
import { SheetTemplates, SheetTemplateDefinition } from '../services/SheetTemplates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MasterSheetsTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SheetTemplateDefinition) => void;
}

export function MasterSheetsTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: MasterSheetsTemplatesModalProps) {
  const templates = SheetTemplates.getTemplates();

  if (!isOpen) return null;

  const handleApply = (tpl: SheetTemplateDefinition) => {
    onSelectTemplate(tpl);
    toast.success(`Loaded template: "${tpl.name}"`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Spreadsheet Template Gallery</h2>
              <p className="text-xs text-muted-foreground">Pre-built financial, project management, and sales workbooks with formulas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-2xl border border-border bg-background hover:border-primary/50 hover:bg-accent/30 transition-all flex flex-col justify-between space-y-4 shadow-sm group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">
                    {tpl.category}
                  </Badge>
                  <Sparkles className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{tpl.description}</p>
              </div>

              <Button
                size="sm"
                variant="gradient"
                onClick={() => handleApply(tpl)}
                className="w-full rounded-xl text-xs font-semibold gap-1.5"
              >
                <span>Use This Template</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
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
