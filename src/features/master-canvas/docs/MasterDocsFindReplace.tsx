import React, { useState } from 'react';
import { Search, ChevronUp, ChevronDown, Replace, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MasterDocsFindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string, matchCase: boolean) => { count: number; activeIndex: number };
  onFindNext: () => void;
  onFindPrev: () => void;
  onReplace: (replacement: string) => void;
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
  const [showReplaceRow, setShowReplaceRow] = useState(true);
  const [matchCount, setMatchCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!isOpen) return null;

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setMatchCount(0);
      setActiveIndex(0);
      return;
    }
    const res = onFind(val, matchCase);
    setMatchCount(res.count);
    setActiveIndex(res.activeIndex);
  };

  const handleToggleCase = () => {
    const next = !matchCase;
    setMatchCase(next);
    if (query.trim()) {
      const res = onFind(query, next);
      setMatchCount(res.count);
      setActiveIndex(res.activeIndex);
    }
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
                if (e.shiftKey) onFindPrev();
                else onFindNext();
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
              {matchCount > 0 ? `${activeIndex + 1}/${matchCount}` : '0 results'}
            </span>
          )}
        </div>

        <button
          onClick={handleToggleCase}
          title="Match Case (Aa)"
          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
            matchCase ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          Aa
        </button>

        <button
          onClick={onFindPrev}
          title="Previous match (Shift+Enter)"
          disabled={matchCount === 0}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent disabled:opacity-40"
        >
          <ChevronUp className="h-4 w-4" />
        </button>

        <button
          onClick={onFindNext}
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
      {showReplaceRow && (
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
            onClick={() => onReplace(replacement)}
            className="rounded-xl text-[11px] h-7 px-2"
          >
            Replace
          </Button>

          <Button
            size="sm"
            disabled={!query || matchCount === 0}
            onClick={() => onReplaceAll(query, replacement, matchCase)}
            className="rounded-xl text-[11px] h-7 px-2 font-bold"
          >
            All
          </Button>
        </div>
      )}
    </div>
  );
}
