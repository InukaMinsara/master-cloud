import React, { useState, useEffect, useRef } from 'react';
import { Sigma, Check, X, Sparkles } from 'lucide-react';
import { SheetFormulaEngine } from '../services/SheetFormulaEngine';

interface MasterSheetsFormulaBarProps {
  selectedCellId: string;
  formulaValue: string;
  onChangeFormula: (val: string) => void;
  onCommitFormula: () => void;
  onOpenFunctionLibrary: () => void;
}

export function MasterSheetsFormulaBar({
  selectedCellId,
  formulaValue,
  onChangeFormula,
  onCommitFormula,
  onOpenFunctionLibrary,
}: MasterSheetsFormulaBarProps) {
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const functions = SheetFormulaEngine.getFunctionLibrary();

  // Detect autocomplete when typing e.g. "=SU"
  const matchingFunctions = formulaValue.startsWith('=')
    ? functions.filter((fn) =>
        fn.name.toLowerCase().startsWith(formulaValue.substring(1).toUpperCase())
      )
    : [];

  const handleSelectAutocomplete = (name: string) => {
    onChangeFormula(`=${name}(`);
    setIsAutocompleteOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/80 bg-background text-xs select-none relative z-10 shrink-0">
      {/* Name Box (Cell Address) */}
      <div className="flex items-center justify-center font-mono font-bold text-foreground bg-muted/40 border border-border rounded-lg px-2.5 py-1 min-w-[56px] text-center shadow-xs">
        {selectedCellId}
      </div>

      {/* Function Library Trigger Button */}
      <button
        onClick={onOpenFunctionLibrary}
        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 font-bold"
        title="Insert Function (fx)"
      >
        <span className="font-serif italic text-xs">fx</span>
      </button>

      {/* Cancel / Confirm Buttons */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onChangeFormula('')}
          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Cancel (Esc)"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onCommitFormula}
          className="p-1 rounded-md text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
          title="Confirm (Enter)"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Formula Input Box */}
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={formulaValue}
          onChange={(e) => {
            onChangeFormula(e.target.value);
            if (e.target.value.startsWith('=') && e.target.value.length >= 2) {
              setIsAutocompleteOpen(true);
            } else {
              setIsAutocompleteOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onCommitFormula();
              setIsAutocompleteOpen(false);
            } else if (e.key === 'Escape') {
              setIsAutocompleteOpen(false);
            }
          }}
          placeholder="Enter a value or formula (e.g. =SUM(A1:A10))"
          className="w-full font-mono text-xs rounded-lg bg-card border border-border px-3 py-1 focus:ring-1 focus:ring-primary focus:outline-none"
        />

        {/* Autocomplete Popup */}
        {isAutocompleteOpen && matchingFunctions.length > 0 && (
          <div className="absolute top-8 left-0 z-50 w-72 rounded-xl bg-card border border-border shadow-2xl p-1.5 space-y-1">
            <div className="text-[10px] font-bold uppercase text-muted-foreground px-2 py-0.5">
              Function Suggestions
            </div>
            {matchingFunctions.slice(0, 5).map((fn) => (
              <div
                key={fn.name}
                onClick={() => handleSelectAutocomplete(fn.name)}
                className="p-2 rounded-lg hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors text-xs"
              >
                <div className="font-bold font-mono">{fn.name}</div>
                <div className="text-[10px] opacity-80 truncate">{fn.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
