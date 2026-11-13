import React, { useEffect, useRef } from 'react';
import {
  Copy,
  Scissors,
  Bold,
  Italic,
  Underline,
  MessageSquare,
  Plus,
  Trash2,
  Sparkles,
  Table,
  PaintBucket,
} from 'lucide-react';

interface MasterDocsContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  targetType: 'text' | 'table' | 'image' | 'general';
  onExecCommand: (command: string, value?: string) => void;
  onAddComment: () => void;
  onOpenCopilot?: () => void;
  onInsertRowAbove?: () => void;
  onInsertRowBelow?: () => void;
  onInsertColumnLeft?: () => void;
  onInsertColumnRight?: () => void;
  onDeleteRow?: () => void;
  onDeleteColumn?: () => void;
  onDeleteTable?: () => void;
  onToggleTableHeader?: () => void;
  onShadeCell?: (color: string) => void;
}

export function MasterDocsContextMenu({
  x,
  y,
  isOpen,
  onClose,
  targetType,
  onExecCommand,
  onAddComment,
  onOpenCopilot,
  onInsertRowAbove,
  onInsertRowBelow,
  onInsertColumnLeft,
  onInsertColumnRight,
  onDeleteRow,
  onDeleteColumn,
  onDeleteTable,
  onToggleTableHeader,
  onShadeCell,
}: MasterDocsContextMenuProps) {
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

  const adjustedX = Math.min(x, window.innerWidth - 240);
  const adjustedY = Math.min(y, window.innerHeight - 360);

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-56 rounded-xl bg-card border border-border shadow-2xl p-1 text-xs text-foreground animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Text Actions */}
      <button
        onClick={() => {
          onExecCommand('copy');
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
          onExecCommand('cut');
          onClose();
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
      >
        <span className="flex items-center gap-2">
          <Scissors className="h-3.5 w-3.5 text-muted-foreground" /> Cut
        </span>
        <span className="text-[10px] text-muted-foreground">Ctrl+X</span>
      </button>

      <div className="my-1 border-t border-border/60" />

      {/* Formatting Mini Strip */}
      <div className="flex items-center justify-around p-1 bg-muted/40 rounded-lg mb-1">
        <button
          onClick={() => {
            onExecCommand('bold');
            onClose();
          }}
          className="p-1 rounded hover:bg-background"
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            onExecCommand('italic');
            onClose();
          }}
          className="p-1 rounded hover:bg-background"
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            onExecCommand('underline');
            onClose();
          }}
          className="p-1 rounded hover:bg-background"
          title="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        onClick={() => {
          onAddComment();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left font-semibold text-primary"
      >
        <MessageSquare className="h-3.5 w-3.5" /> Add Comment
      </button>

      {onOpenCopilot && (
        <button
          onClick={() => {
            onOpenCopilot();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#185abd]/10 text-left font-semibold text-[#185abd]"
        >
          <Sparkles className="h-3.5 w-3.5" /> Rewrite with Copilot
        </button>
      )}

      {/* Real Word Table Controls */}
      {targetType === 'table' && (
        <>
          <div className="my-1 border-t border-border/60" />
          <div className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-0.5 flex items-center gap-1">
            <Table className="h-3 w-3" /> Table Tools
          </div>

          <button
            onClick={() => {
              onInsertRowAbove?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-500" /> Insert Row Above
          </button>
          <button
            onClick={() => {
              onInsertRowBelow?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-500" /> Insert Row Below
          </button>
          <button
            onClick={() => {
              onInsertColumnLeft?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
          >
            <Plus className="h-3.5 w-3.5 text-blue-500" /> Insert Column Left
          </button>
          <button
            onClick={() => {
              onInsertColumnRight?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
          >
            <Plus className="h-3.5 w-3.5 text-blue-500" /> Insert Column Right
          </button>

          <button
            onClick={() => {
              onToggleTableHeader?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
          >
            <PaintBucket className="h-3.5 w-3.5 text-[#185abd]" /> Toggle Header Row Shading
          </button>

          {onShadeCell && (
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[11px] text-muted-foreground">Cell Fill:</span>
              <div className="flex items-center gap-1">
                {['transparent', '#eff6ff', '#ecfdf5', '#fef9c3', '#fee2e2'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onShadeCell(c);
                      onClose();
                    }}
                    style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                    className="w-4 h-4 rounded-sm border border-border hover:scale-110 transition-transform"
                    title={c === 'transparent' ? 'No Fill' : c}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="my-1 border-t border-border/60" />

          <button
            onClick={() => {
              onDeleteRow?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive text-left"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Row
          </button>
          <button
            onClick={() => {
              onDeleteColumn?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive text-left"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Column
          </button>
          <button
            onClick={() => {
              onDeleteTable?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive text-left font-semibold"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Table
          </button>
        </>
      )}
    </div>
  );
}
