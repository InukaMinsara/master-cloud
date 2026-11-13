import React from 'react';
import { FileText, X, Clock, Type, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MasterDocsWordCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentHtml: string;
}

export function MasterDocsWordCountModal({ isOpen, onClose, contentHtml }: MasterDocsWordCountModalProps) {
  if (!isOpen) return null;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = contentHtml;
  const text = tempDiv.innerText || tempDiv.textContent || '';

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charactersWithSpaces = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0).length || 1;
  const pages = Math.max(1, Math.ceil(words / 450));
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
  const speakingTimeMinutes = Math.max(1, Math.ceil(words / 130));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Document Statistics</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-secondary/40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Pages</span>
            <p className="text-xl font-black text-foreground">{pages}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Words</span>
            <p className="text-xl font-black text-primary">{words.toLocaleString()}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Characters (with spaces)</span>
            <p className="text-lg font-bold text-foreground">{charactersWithSpaces.toLocaleString()}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Characters (no spaces)</span>
            <p className="text-lg font-bold text-foreground">{charactersNoSpaces.toLocaleString()}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Paragraphs</span>
            <p className="text-lg font-bold text-foreground">{paragraphs}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Reading Time</span>
            <p className="text-lg font-bold text-emerald-500">~{readingTimeMinutes} min</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="rounded-xl text-xs font-bold px-5">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
