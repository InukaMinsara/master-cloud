import React, { useState, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, Replace, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MasterDocsFindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string, matchCase: boolean) => { count: number; activeIndex: number };
  onFindNext: () => { count: number; activeIndex: number };
  onFindPrev: () => { count: number; activeIndex: number };
  onReplace: (replacement: string, query: string, matchCase: boolean) => { count: number; activeIndex: number };
  onReplaceAll: (query: string, replacement: string, matchCase: boolean) => void;
}

export function MasterDocsFindReplace({
  isOpen,
  onClose,
  onFind,
  onFindNext,
  onFindPrev,
  onReplace,
  onReplaceAll,
}: MasterDocsFindReplaceProps) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setMatchCount(0);
      setActiveIndex(0);
    } else if (query.trim()) {
      const res = onFind(query, matchCase);
      setMatchCount(res.count);
      setActiveIndex(res.activeIndex);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const res = onFind(val, matchCase);
    setMatchCount(res.count);
    setActiveIndex(res.activeIndex);
  };

  const handleToggleCase = () => {
    const next = !matchCase;
    setMatchCase(next);
    const res = onFind(query, next);
    setMatchCount(res.count);
    setActiveIndex(res.activeIndex);
  };

  const handleNext = () => {
    const res = onFindNext();
    setMatchCount(res.count);
    setActiveIndex(res.activeIndex);
  };

  const handlePrev = () => {
    const res = onFindPrev();
    setMatchCount(res.count);
    setActiveIndex(res.activeIndex);
  };

  const handleReplaceOne = () => {
    const res = onReplace(replacement, query, matchCase);
    setMatchCount(res.count);
    setActiveIndex(res.activeIndex);
  };

  const handleReplaceAllClick = () => {
    onReplaceAll(query, replacement, matchCase);
    setMatchCount(0);
    setActiveIndex(0);
  };

  return (
    <div className="absolute top-3 right-6 z-40 w-80 sm:w-96 rounded-2xl border border-border/90 bg-card/95 backdrop-blur-xl p-3 shadow-2xl space-y-2 select-none animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Search Row */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) handlePrev();
                else handleNext();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Find in document..."
            className="w-full pl-8 pr-16 py-1.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-primary"
            autoFocus
          />
          {query && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground">
              {matchCount > 0 ? `${activeIndex + 1}/${matchCount}` : '0/0'}
            </span>
          )}
        </div>

        <button
          onClick={handleToggleCase}
          title="Match Case (Aa)"
          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
            matchCase ? 'bg-[#185abd] text-white' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          Aa
        </button>

        <button
          onClick={handlePrev}
          title="Previous match (Shift+Enter)"
          disabled={matchCount === 0}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent disabled:opacity-40"
        >
          <ChevronUp className="h-4 w-4" />
        </button>

        <button
          onClick={handleNext}
          title="Next match (Enter)"
          disabled={matchCount === 0}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent disabled:opacity-40"
        >
          <ChevronDown className="h-4 w-4" />
        </button>

        <button
          onClick={onClose}
          title="Close (Esc)"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Replace Row */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
        <div className="relative flex-1">
          <Replace className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Replace with..."
            className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-primary"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={!query || matchCount === 0}
          onClick={handleReplaceOne}
          className="rounded-xl text-[11px] h-7 px-2"
        >
          Replace
        </Button>

        <Button
          size="sm"
          disabled={!query || matchCount === 0}
          onClick={handleReplaceAllClick}
          className="rounded-xl text-[11px] h-7 px-2 font-bold bg-[#185abd] hover:bg-[#144a9c] text-white"
        >
          All
        </Button>
      </div>
    </div>
  );
}
