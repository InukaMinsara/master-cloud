import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Play,
  MonitorPlay,
  Grid,
  Palette,
  Sparkles,
  Save,
  Download,
  Printer,
  Copy,
  Trash2,
  Maximize2,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface MasterSlidesCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSlide: () => void;
  onStartPresentation: () => void;
  onOpenPresenterView: () => void;
  onOpenSorter: () => void;
  onOpenThemes: () => void;
  onOpenTemplates: () => void;
  onExportHtml: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onSaveManual: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
}

export function MasterSlidesCommandPalette({
  isOpen,
  onClose,
  onAddSlide,
  onStartPresentation,
  onOpenPresenterView,
  onOpenSorter,
  onOpenThemes,
  onOpenTemplates,
  onExportHtml,
  onExportPdf,
  onExportJson,
  onSaveManual,
  onDuplicateSlide,
  onDeleteSlide,
}: MasterSlidesCommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'present',
      title: 'Start Fullscreen Slideshow',
      category: 'Presentation',
      icon: <Play className="h-4 w-4 text-amber-500" />,
      shortcut: 'F5',
      action: () => {
        onStartPresentation();
        onClose();
      },
    },
    {
      id: 'presenter-view',
      title: 'Open Presenter Studio (Dual Monitor)',
      category: 'Presentation',
      icon: <MonitorPlay className="h-4 w-4 text-indigo-400" />,
      action: () => {
        onOpenPresenterView();
        onClose();
      },
    },
    {
      id: 'new-slide',
      title: 'Add New Slide',
      category: 'Slide Actions',
      icon: <Plus className="h-4 w-4 text-primary" />,
      shortcut: 'Ctrl+M',
      action: () => {
        onAddSlide();
        onClose();
      },
    },
    {
      id: 'duplicate-slide',
      title: 'Duplicate Current Slide',
      category: 'Slide Actions',
      icon: <Copy className="h-4 w-4 text-blue-400" />,
      shortcut: 'Ctrl+D',
      action: () => {
        onDuplicateSlide();
        onClose();
      },
    },
    {
      id: 'delete-slide',
      title: 'Delete Current Slide',
      category: 'Slide Actions',
      icon: <Trash2 className="h-4 w-4 text-destructive" />,
      action: () => {
        onDeleteSlide();
        onClose();
      },
    },
    {
      id: 'sorter',
      title: 'Open Slide Sorter Grid',
      category: 'Views',
      icon: <Grid className="h-4 w-4 text-emerald-400" />,
      action: () => {
        onOpenSorter();
        onClose();
      },
    },
    {
      id: 'themes',
      title: 'Change Presentation Theme & Typography',
      category: 'Design',
      icon: <Palette className="h-4 w-4 text-purple-400" />,
      action: () => {
        onOpenThemes();
        onClose();
      },
    },
    {
      id: 'templates',
      title: 'Browse Prebuilt Slide Templates',
      category: 'Design',
      icon: <Sparkles className="h-4 w-4 text-amber-400" />,
      action: () => {
        onOpenTemplates();
        onClose();
      },
    },
    {
      id: 'save',
      title: 'Save to Master Cloud Storage',
      category: 'File',
      icon: <Save className="h-4 w-4 text-primary" />,
      shortcut: 'Ctrl+S',
      action: () => {
        onSaveManual();
        onClose();
      },
    },
    {
      id: 'export-html',
      title: 'Export Standalone HTML Presentation Deck',
      category: 'Export',
      icon: <Download className="h-4 w-4 text-amber-500" />,
      action: () => {
        onExportHtml();
        onClose();
      },
    },
    {
      id: 'export-pdf',
      title: 'Export to PDF / Print Deck',
      category: 'Export',
      icon: <Printer className="h-4 w-4 text-blue-500" />,
      shortcut: 'Ctrl+P',
      action: () => {
        onExportPdf();
        onClose();
      },
    },
    {
      id: 'export-json',
      title: 'Export JSON Presentation Raw File',
      category: 'Export',
      icon: <Download className="h-4 w-4 text-emerald-500" />,
      action: () => {
        onExportJson();
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-start justify-center pt-24 p-6 select-none animate-in fade-in duration-100">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Search Box */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-card/80">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search actions..."
            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono rounded bg-muted text-muted-foreground border border-border">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  selectedIndex === idx
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={selectedIndex === idx ? 'text-primary-foreground' : ''}>
                    {cmd.icon}
                  </span>
                  <span>{cmd.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] ${
                      selectedIndex === idx ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}
                  >
                    {cmd.category}
                  </span>
                  {cmd.shortcut && (
                    <kbd
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                        selectedIndex === idx
                          ? 'bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}
                    >
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No matching slide commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
