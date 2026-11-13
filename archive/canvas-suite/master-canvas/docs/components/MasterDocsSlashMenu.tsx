import React, { useEffect, useState } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table,
  Quote,
  Code,
  Minus,
  Scissors,
  Sparkles,
  FileText,
} from 'lucide-react';

export interface SlashCommandOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface MasterDocsSlashMenuProps {
  visible: boolean;
  x: number;
  y: number;
  filterText: string;
  onSelect: (commandId: string) => void;
  onClose: () => void;
}

export const SLASH_COMMAND_OPTIONS: SlashCommandOption[] = [
  {
    id: 'copilot',
    label: 'Ask Docs Copilot',
    description: 'Draft or rewrite content with Master AI',
    icon: <Sparkles className="h-4 w-4 text-[#185abd]" />,
  },
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Large document title heading',
    icon: <Heading1 className="h-4 w-4 text-blue-600" />,
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Major section heading',
    icon: <Heading2 className="h-4 w-4 text-indigo-600" />,
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Subsection heading',
    icon: <Heading3 className="h-4 w-4 text-sky-600" />,
  },
  {
    id: 'bullet',
    label: 'Bulleted List',
    description: 'Create an unordered bullet list',
    icon: <List className="h-4 w-4 text-emerald-600" />,
  },
  {
    id: 'numbered',
    label: 'Numbered List',
    description: 'Create an ordered numbered list',
    icon: <ListOrdered className="h-4 w-4 text-emerald-600" />,
  },
  {
    id: 'table',
    label: 'Table (3×3)',
    description: 'Insert a formatted Word table',
    icon: <Table className="h-4 w-4 text-blue-500" />,
  },
  {
    id: 'callout',
    label: 'Callout Note Box',
    description: 'Highlighted info box for notes',
    icon: <FileText className="h-4 w-4 text-amber-500" />,
  },
  {
    id: 'quote',
    label: 'Blockquote',
    description: 'Indented quotation block',
    icon: <Quote className="h-4 w-4 text-purple-500" />,
  },
  {
    id: 'code',
    label: 'Code Snippet',
    description: 'Formatted syntax code block',
    icon: <Code className="h-4 w-4 text-cyan-600" />,
  },
  {
    id: 'pagebreak',
    label: 'Page Break',
    description: 'Start the next section on a new page',
    icon: <Scissors className="h-4 w-4 text-rose-500" />,
  },
  {
    id: 'divider',
    label: 'Horizontal Divider',
    description: 'Insert a clean horizontal line',
    icon: <Minus className="h-4 w-4 text-muted-foreground" />,
  },
];

export function MasterDocsSlashMenu({
  visible,
  x,
  y,
  filterText,
  onSelect,
  onClose,
}: MasterDocsSlashMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = SLASH_COMMAND_OPTIONS.filter(
    (opt) =>
      opt.label.toLowerCase().includes(filterText.toLowerCase()) ||
      opt.description.toLowerCase().includes(filterText.toLowerCase()),
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [filterText, visible]);

  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === 'Enter') {
        if (filtered[activeIndex]) {
          e.preventDefault();
          onSelect(filtered[activeIndex].id);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [visible, filtered, activeIndex, onSelect, onClose]);

  if (!visible || filtered.length === 0) return null;

  const clampedX = Math.max(16, Math.min(x, window.innerWidth - 280));
  const clampedY = Math.max(80, Math.min(y, window.innerHeight - 300));

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      style={{ top: `${clampedY}px`, left: `${clampedX}px` }}
      className="fixed z-50 w-68 max-h-72 overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-1.5 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Quick Insert
      </div>
      {filtered.map((opt, idx) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          onMouseEnter={() => setActiveIndex(idx)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
            idx === activeIndex ? 'bg-[#185abd]/10 text-foreground' : 'hover:bg-accent'
          }`}
        >
          <div className="h-8 w-8 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center shrink-0">
            {opt.icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">{opt.label}</div>
            <div className="text-[10px] text-muted-foreground truncate">{opt.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
