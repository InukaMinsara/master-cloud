import React, { useState } from 'react';
import { X, Search, Sigma, Check, Copy, BookOpen } from 'lucide-react';
import { FunctionDefinition } from '../types';
import { SheetFormulaEngine } from '../services/SheetFormulaEngine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MasterSheetsFunctionLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFunction: (syntax: string) => void;
}

export function MasterSheetsFunctionLibraryModal({
  isOpen,
  onClose,
  onSelectFunction,
}: MasterSheetsFunctionLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const allFunctions = SheetFormulaEngine.getFunctionLibrary();

  if (!isOpen) return null;

  const categories = ['All', 'Math', 'Logical', 'Text', 'Date & Time', 'Lookup', 'Statistical'];

  const filtered = allFunctions.filter((fn) => {
    const matchesCat = selectedCategory === 'All' || fn.category === selectedCategory;
    const matchesQuery =
      fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fn.syntax.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleInsert = (fn: FunctionDefinition) => {
    onSelectFunction(`=${fn.name}(`);
    toast.success(`Inserted =${fn.name}(`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sigma className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Formula & Function Library</h2>
              <p className="text-xs text-muted-foreground">Search and insert over 70+ built-in mathematical, statistical, and logical functions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="px-6 py-3 border-b border-border/80 bg-background/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search functions by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-xl bg-muted/30 border border-border pl-9 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/30 text-muted-foreground hover:bg-accent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Function Cards Grid */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-xs text-muted-foreground">
              No spreadsheet functions found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            filtered.map((fn) => (
              <div
                key={fn.name}
                className="p-4 rounded-xl border border-border bg-background/60 hover:bg-accent/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-primary">{fn.name}</span>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold py-0">
                      {fn.category}
                    </Badge>
                  </div>
                  <div className="font-mono text-[11px] bg-muted/40 px-2 py-1 rounded-md text-foreground mb-2">
                    {fn.syntax}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{fn.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-[10px] font-mono text-muted-foreground">{fn.example}</span>
                  <Button
                    size="sm"
                    variant="gradient"
                    onClick={() => handleInsert(fn)}
                    className="rounded-lg text-[11px] h-7 font-semibold"
                  >
                    Insert Function
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
