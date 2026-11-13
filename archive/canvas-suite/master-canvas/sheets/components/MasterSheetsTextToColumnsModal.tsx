import React, { useState } from 'react';
import { X, Columns, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MasterSheetsTextToColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySplit: (delimiter: string) => void;
}

export function MasterSheetsTextToColumnsModal({
  isOpen,
  onClose,
  onApplySplit,
}: MasterSheetsTextToColumnsModalProps) {
  const [delimiterType, setDelimiterType] = useState<',' | '\t' | ' ' | ';' | 'custom'>(',');
  const [customDelim, setCustomDelim] = useState('-');

  if (!isOpen) return null;

  const handleApply = () => {
    const delim = delimiterType === 'custom' ? customDelim : delimiterType;
    onApplySplit(delim);
    toast.success('Column split applied');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Columns className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Text to Columns Tool</h2>
              <p className="text-xs text-muted-foreground">Split cell values in the active column using a delimiter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-2">Select Delimiter</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Comma (,)', value: ',' },
                { label: 'Tab (\\t)', value: '\t' },
                { label: 'Space ( )', value: ' ' },
                { label: 'Semicolon (;)', value: ';' },
              ].map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDelimiterType(d.value as any)}
                  className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                    delimiterType === d.value
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-border bg-background hover:bg-accent text-foreground'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground mb-1">
              <input
                type="radio"
                name="delim"
                checked={delimiterType === 'custom'}
                onChange={() => setDelimiterType('custom')}
              />
              Custom Delimiter
            </label>
            {delimiterType === 'custom' && (
              <input
                type="text"
                value={customDelim}
                onChange={(e) => setCustomDelim(e.target.value)}
                maxLength={3}
                className="w-24 text-xs rounded-xl bg-background border border-border px-3 py-1.5 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button variant="gradient" size="sm" onClick={handleApply} className="rounded-xl text-xs font-bold gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Split Column
          </Button>
        </div>
      </div>
    </div>
  );
}
