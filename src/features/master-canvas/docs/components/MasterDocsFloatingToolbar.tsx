import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Link as LinkIcon,
  MessageSquare,
  Sparkles,
  Eraser,
} from 'lucide-react';

interface MasterDocsFloatingToolbarProps {
  visible: boolean;
  x: number;
  y: number;
  onExecCommand: (command: string, value?: string) => void;
  onInsertLink: () => void;
  onAddComment: () => void;
  onOpenCopilot: () => void;
}

export function MasterDocsFloatingToolbar({
  visible,
  x,
  y,
  onExecCommand,
  onInsertLink,
  onAddComment,
  onOpenCopilot,
}: MasterDocsFloatingToolbarProps) {
  if (!visible) return null;

  const clampedX = Math.max(16, Math.min(x, window.innerWidth - 360));
  const clampedY = Math.max(60, y);

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      style={{ top: `${clampedY}px`, left: `${clampedX}px` }}
      className="fixed z-50 flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl text-xs select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        onClick={() => onExecCommand('bold')}
        className="p-1.5 rounded-lg hover:bg-accent text-foreground"
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onExecCommand('italic')}
        className="p-1.5 rounded-lg hover:bg-accent text-foreground"
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onExecCommand('underline')}
        className="p-1.5 rounded-lg hover:bg-accent text-foreground"
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onExecCommand('strikeThrough')}
        className="p-1.5 rounded-lg hover:bg-accent text-foreground"
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-px bg-border mx-0.5" />

      <button
        onClick={() => onExecCommand('hiliteColor', '#fef08a')}
        className="p-1.5 rounded-lg hover:bg-accent text-amber-500"
        title="Yellow Highlight"
      >
        <Highlighter className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={() => onExecCommand('formatBlock', '<h2>')}
        className="px-1.5 py-1 rounded-lg hover:bg-accent font-bold text-[11px] text-foreground"
        title="Heading 2"
      >
        H2
      </button>

      <button
        onClick={() => onExecCommand('removeFormat')}
        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
        title="Clear Formatting"
      >
        <Eraser className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-px bg-border mx-0.5" />

      <button
        onClick={onInsertLink}
        className="p-1.5 rounded-lg hover:bg-accent text-sky-500"
        title="Insert Link"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={onAddComment}
        className="p-1.5 rounded-lg hover:bg-accent text-primary"
        title="New Comment"
      >
        <MessageSquare className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={onOpenCopilot}
        className="flex items-center gap-1 px-2 py-1 ml-0.5 rounded-lg bg-[#185abd] hover:bg-[#144a9c] text-white font-semibold text-[11px]"
        title="Ask Docs Copilot about selection"
      >
        <Sparkles className="h-3 w-3" />
        <span>Copilot</span>
      </button>
    </div>
  );
}
