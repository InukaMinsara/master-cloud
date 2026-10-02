import React, { useState } from 'react';
import {
  LayoutTemplate,
  X,
  Sparkles,
  HeartHandshake,
  GraduationCap,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { FORM_TEMPLATES, FormTemplateMeta } from '../services/FormTemplates';
import { MasterFormData } from '../types';
import { toast } from 'sonner';

interface MasterFormsTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateData: Partial<MasterFormData>) => void;
}

const CATEGORIES = ['All', 'Feedback', 'Education', 'HR', 'Events'];

export function MasterFormsTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: MasterFormsTemplatesModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  if (!isOpen) return null;

  const filtered =
    selectedCategory === 'All'
      ? FORM_TEMPLATES
      : FORM_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleApply = (template: FormTemplateMeta) => {
    if (confirm(`Apply "${template.name}" template? This will load template questions into your form.`)) {
      onSelectTemplate(template.data);
      toast.success(`Template "${template.name}" loaded!`);
      onClose();
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartHandshake':
        return <HeartHandshake className="h-5 w-5 text-purple-500" />;
      case 'GraduationCap':
        return <GraduationCap className="h-5 w-5 text-emerald-500" />;
      case 'Briefcase':
        return <Briefcase className="h-5 w-5 text-indigo-500" />;
      case 'CalendarDays':
        return <CalendarDays className="h-5 w-5 text-sky-500" />;
      default:
        return <LayoutTemplate className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border/80 rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">Form Templates Gallery</h2>
              <p className="text-xs text-muted-foreground">
                Start with a professionally crafted survey, quiz, registration, or application template
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 py-4 overflow-x-auto shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 py-2 pr-1">
          {filtered.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-card border border-border/70 hover:border-primary/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-muted/60 group-hover:bg-primary/10 transition-colors">
                    {getIcon(tmpl.icon)}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {tmpl.badge}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {tmpl.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-semibold">
                  {tmpl.data.questions?.length || 0} Questions
                </span>
                <button
                  onClick={() => handleApply(tmpl)}
                  className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <span>Use Template</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
