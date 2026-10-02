import React, { useEffect, useRef } from 'react';
import {
  Copy,
  Scissors,
  Clipboard,
  Plus,
  Trash2,
  Table,
  BarChart3,
  MessageSquare,
  ArrowUpDown,
  Filter,
  CheckSquare,
} from 'lucide-react';

interface MasterSheetsContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  selectedCellId: string;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onInsertRowAbove: () => void;
  onInsertRowBelow: () => void;
  onInsertColLeft: () => void;
  onInsertColRight: () => void;
  onDeleteRow: () => void;
  onDeleteCol: () => void;
  onOpenValidation: () => void;
  onOpenChart: () => void;
  onAddComment: () => void;
}

export function MasterSheetsContextMenu({
  x,
  y,
  isOpen,
  onClose,
  selectedCellId,
  onCut,
  onCopy,
  onPaste,
  onInsertRowAbove,
  onInsertRowBelow,
  onInsertColLeft,
  onInsertColRight,
  onDeleteRow,
  onDeleteCol,
  onOpenValidation,
  onOpenChart,
  onAddComment,
}: MasterSheetsContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 340);

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-52 rounded-xl bg-card border border-border shadow-2xl p-1 text-xs text-foreground animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <button
        onClick={() => {
          onCopy();
          onClose();
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
      >
        <span className="flex items-center gap-2">
          <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Copy
        </span>
        <span className="text-[10px] text-muted-foreground">Ctrl+C</span>
      </button>

      <button
        onClick={() => {
          onCut();
          onClose();
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
      >
        <span className="flex items-center gap-2">
          <Scissors className="h-3.5 w-3.5 text-muted-foreground" /> Cut
        </span>
        <span className="text-[10px] text-muted-foreground">Ctrl+X</span>
      </button>

      <button
        onClick={() => {
          onPaste();
          onClose();
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
      >
        <span className="flex items-center gap-2">
          <Clipboard className="h-3.5 w-3.5 text-muted-foreground" /> Paste
        </span>
        <span className="text-[10px] text-muted-foreground">Ctrl+V</span>
      </button>

      <div className="my-1 border-t border-border/60" />

      {/* Row / Col Operations */}
      <button
        onClick={() => {
          onInsertRowAbove();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
      >
        <Plus className="h-3.5 w-3.5 text-emerald-500" /> Insert Row Above
      </button>

      <button
        onClick={() => {
          onInsertColLeft();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
      >
        <Plus className="h-3.5 w-3.5 text-blue-500" /> Insert Column Left
      </button>

      <button
        onClick={() => {
          onDeleteRow();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive text-left"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete Row
      </button>

      <button
        onClick={() => {
          onDeleteCol();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive text-left"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete Column
      </button>

      <div className="my-1 border-t border-border/60" />

      {/* Advanced Tools */}
      <button
        onClick={() => {
          onOpenValidation();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
      >
        <CheckSquare className="h-3.5 w-3.5 text-indigo-500" /> Data Validation
      </button>

      <button
        onClick={() => {
          onOpenChart();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
      >
        <BarChart3 className="h-3.5 w-3.5 text-amber-500" /> Insert Chart
      </button>

      <button
        onClick={() => {
          onAddComment();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left font-semibold text-primary"
      >
        <MessageSquare className="h-3.5 w-3.5" /> Add Comment
      </button>
    </div>
  );
}
