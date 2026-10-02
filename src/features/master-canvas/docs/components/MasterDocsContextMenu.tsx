import React, { useEffect, useRef } from 'react';
import {
  Copy,
  Scissors,
  Clipboard,
  Bold,
  Italic,
  Underline,
  MessageSquare,
  Link,
  Plus,
  Trash2,
  Table,
  Image,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MasterDocsContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  targetType: 'text' | 'table' | 'image' | 'general';
  onExecCommand: (command: string, value?: string) => void;
  onAddComment: () => void;
  onInsertRow?: () => void;
  onInsertColumn?: () => void;
  onDeleteRow?: () => void;
}

export function MasterDocsContextMenu({
  x,
  y,
  isOpen,
  onClose,
  targetType,
  onExecCommand,
  onAddComment,
  onInsertRow,
  onInsertColumn,
  onDeleteRow,
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

  // Keep within window boundaries
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-52 rounded-xl bg-card border border-border shadow-2xl p-1 text-xs text-foreground animate-in fade-in zoom-in-95 duration-150 select-none"
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

      {/* Formatting tools */}
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

      {/* Table tools */}
      {targetType === 'table' && (
        <>
          <div className="my-1 border-t border-border/60" />
          <div className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-0.5">Table Controls</div>
          <button
            onClick={() => {
              if (onInsertRow) onInsertRow();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-500" /> Insert Row Below
          </button>
          <button
            onClick={() => {
              if (onInsertColumn) onInsertColumn();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left"
          >
            <Plus className="h-3.5 w-3.5 text-blue-500" /> Insert Column Right
          </button>
          <button
            onClick={() => {
              if (onDeleteRow) onDeleteRow();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive text-left"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Row
          </button>
        </>
      )}
    </div>
  );
}
