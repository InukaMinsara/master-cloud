import React, { useState } from 'react';
import { Sparkles, X, FileText, Check, LayoutTemplate } from 'lucide-react';
import { MASTER_DOCS_TEMPLATES, DocumentTemplate } from './MasterDocsTemplates';
import { Button } from '@/components/ui/button';

interface MasterDocsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DocumentTemplate) => void;
}

export function MasterDocsTemplateModal({ isOpen, onClose, onSelectTemplate }: MasterDocsTemplateModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Business', 'Academic', 'Personal', 'Engineering'];

  const filtered = selectedCategory === 'All'
    ? MASTER_DOCS_TEMPLATES
    : MASTER_DOCS_TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Master Docs Template Gallery</h3>
              <p className="text-xs text-muted-foreground">Select a professionally formatted document template to start.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-1 flex-1">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                onSelectTemplate(tpl);
                onClose();
              }}
              className="p-5 rounded-3xl border border-border/80 bg-card hover:border-primary/60 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className={`h-24 rounded-2xl bg-gradient-to-br ${tpl.thumbnailColor} p-3 flex flex-col justify-between text-white shadow-inner`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur-md px-2 py-0.5 rounded-full w-fit">
                    {tpl.category}
                  </span>
                  <FileText className="h-6 w-6 opacity-80 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {tpl.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>
              </div>

              <Button size="sm" variant="outline" className="w-full rounded-xl text-xs font-bold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                Use Template
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
