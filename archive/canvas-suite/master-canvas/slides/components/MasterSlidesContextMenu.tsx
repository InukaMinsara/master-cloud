import React, { useEffect, useRef } from 'react';
import {
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Plus,
  Play,
  Palette,
  Type,
  Grid,
} from 'lucide-react';
import { MasterSlideObject } from '../types';

interface MasterSlidesContextMenuProps {
  x: number;
  y: number;
  targetObjectId?: string | null;
  targetObject?: MasterSlideObject | null;
  onClose: () => void;
  onAddSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onDuplicateObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onToggleLockObject: (id: string) => void;
  onStartPresentation: () => void;
  onOpenThemes: () => void;
  onAddObject: (type: MasterSlideObject['type']) => void;
}

export function MasterSlidesContextMenu({
  x,
  y,
  targetObjectId,
  targetObject,
  onClose,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onDuplicateObject,
  onDeleteObject,
  onBringForward,
  onSendBackward,
  onToggleLockObject,
  onStartPresentation,
  onOpenThemes,
  onAddObject,
}: MasterSlidesContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust positioning to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 260);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-52 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-1.5 flex flex-col space-y-0.5 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {targetObjectId && targetObject ? (
        // Object Context Menu
        <>
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border mb-1">
            {targetObject.type} Element
          </div>

          <button
            onClick={() => {
              onDuplicateObject(targetObjectId);
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-foreground transition-colors text-left"
          >
            <Copy className="h-3.5 w-3.5 text-primary" />
            <span>Duplicate Element</span>
          </button>

          <button
            onClick={() => {
              onBringForward(targetObjectId);
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-foreground transition-colors text-left"
          >
            <ArrowUp className="h-3.5 w-3.5 text-blue-400" />
            <span>Bring Forward</span>
          </button>

          <button
            onClick={() => {
              onSendBackward(targetObjectId);
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-foreground transition-colors text-left"
          >
            <ArrowDown className="h-3.5 w-3.5 text-blue-400" />
            <span>Send Backward</span>
          </button>

          <button
            onClick={() => {
              onToggleLockObject(targetObjectId);
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-foreground transition-colors text-left"
          >
            {targetObject.isLocked ? (
              <>
                <Unlock className="h-3.5 w-3.5 text-amber-500" />
                <span>Unlock Element</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span>Lock Element</span>
              </>
            )}
          </button>

          <div className="h-px bg-border my-1" />

          <button
            onClick={() => {
              onDeleteObject(targetObjectId);
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Element</span>
          </button>
        </>
      ) : (
        // Canvas Background Context Menu
        <>
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border mb-1">
            Slide Options
          </div>

          <button
            onClick={() => {
              onAddSlide();
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-foreground transition-colors text-left"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            <span>New Slide</span>
          </button>

          <button
            onClick={() => {
              onDuplicateSlide();
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-foreground transition-colors text-left"
          >
            <Copy className="h-3.5 w-3.5 text-blue-400" />
            <span>Duplicate Slide</span>
          </button>

          <button
            onClick={() => {
              onAddObject('text');
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-foreground transition-colors text-left"
          >
            <Type className="h-3.5 w-3.5 text-amber-500" />
            <span>Add Text Box</span>
          </button>

          <button
            onClick={() => {
              onOpenThemes();
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-foreground transition-colors text-left"
          >
            <Palette className="h-3.5 w-3.5 text-purple-400" />
            <span>Theme Studio</span>
          </button>

          <div className="h-px bg-border my-1" />

          <button
            onClick={() => {
              onStartPresentation();
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-foreground font-bold transition-colors text-left"
          >
            <Play className="h-3.5 w-3.5 text-amber-500 fill-current" />
            <span>Start Presentation (F5)</span>
          </button>

          <button
            onClick={() => {
              onDeleteSlide();
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Slide</span>
          </button>
        </>
      )}
    </div>
  );
}
