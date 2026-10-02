import React, { useState } from 'react';
import { Sigma, X, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MasterDocsEquationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertEquation: (latex: string) => void;
}

export function MasterDocsEquationModal({ isOpen, onClose, onInsertEquation }: MasterDocsEquationModalProps) {
  const [latexInput, setLatexInput] = useState('E = mc^2');

  if (!isOpen) return null;

  const equationSnippets = [
    { label: 'Fraction (a/b)', code: '\\frac{a}{b}' },
    { label: 'Square Root', code: '\\sqrt{x}' },
    { label: 'Exponent (x^n)', code: 'x^{n}' },
    { label: 'Subscript (x_i)', code: 'x_{i}' },
    { label: 'Integral', code: '\\int_{a}^{b} f(x) dx' },
    { label: 'Summation', code: '\\sum_{i=1}^{n} x_i' },
    { label: 'Limit', code: '\\lim_{x \\to 0} f(x)' },
    { label: 'Matrix (2x2)', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: 'Quadratic Formula', code: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  ];

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!latexInput.trim()) return;
    onInsertEquation(latexInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Sigma className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Insert Mathematical Equation</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Snippets */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Quick Symbols &amp; Formulas</label>
          <div className="flex flex-wrap gap-1.5">
            {equationSnippets.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setLatexInput(s.code)}
                className="px-2.5 py-1 rounded-xl bg-secondary/50 hover:bg-primary/10 hover:text-primary border border-border/60 text-[11px] font-medium transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* LaTeX Code Input */}
        <form onSubmit={handleInsert} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">LaTeX Equation Code</label>
            <input
              type="text"
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              placeholder="e.g. \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>

          {/* Rendered Preview Box */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/80 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Equation Preview
            </span>
            <div className="font-serif text-lg text-foreground py-2 font-bold italic tracking-wide">
              {latexInput || 'E = mc^2'}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={!latexInput.trim()} className="rounded-xl text-xs font-bold gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Insert into Document
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
