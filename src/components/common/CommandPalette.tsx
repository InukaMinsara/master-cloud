import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2,
  FolderPlus,
  Upload,
  Settings,
  Sun,
  Moon,
  PieChart,
  Film,
  Download,
  Share2,
  Check,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckSquare,
  Palette,
  BookOpen,
  Image as ImageIcon,
  Video,
  Sparkles,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useFileStore } from '@/stores/fileStore';
import { useUploadStore } from '@/stores/uploadStore';
import { Dialog } from '@/components/ui/dialog';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: any;
  action: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setNewFolderModalOpen,
    theme,
    setTheme,
    setSmartCleanupModalOpen,
  } = useUIStore();
  const { files, folders } = useFileStore();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Command registry
  const baseCommands: CommandItem[] = [
    {
      id: 'cmd-drive',
      title: 'Go to My Drive',
      category: 'Navigation',
      icon: HardDrive,
      action: () => navigate('/drive'),
    },
    {
      id: 'cmd-shared',
      title: 'Go to Shared with Me',
      category: 'Navigation',
      icon: Users,
      action: () => navigate('/shared'),
    },
    {
      id: 'cmd-recent',
      title: 'Go to Recent Files',
      category: 'Navigation',
      icon: Clock,
      action: () => navigate('/recent'),
    },
    {
      id: 'cmd-starred',
      title: 'Go to Starred Items',
      category: 'Navigation',
      icon: Star,
      action: () => navigate('/starred'),
    },
    {
      id: 'cmd-media',
      title: 'Go to Media Library',
      category: 'Navigation',
      icon: Film,
      action: () => navigate('/media'),
    },
    {
      id: 'cmd-trash',
      title: 'Go to Trash',
      category: 'Navigation',
      icon: Trash2,
      action: () => navigate('/trash'),
    },
    {
      id: 'cmd-storage',
      title: 'Go to Storage & Quota Analytics',
      category: 'Navigation',
      icon: PieChart,
      action: () => navigate('/storage'),
    },
    {
      id: 'cmd-canvas',
      title: 'Open Master Canvas Suite',
      category: 'Creation',
      icon: Sparkles,
      action: () => navigate('/canvas'),
    },
    {
      id: 'cmd-new-doc',
      title: 'New Master Document',
      category: 'Creation',
      icon: FileText,
      action: () => navigate('/canvas/docs/new'),
    },
    {
      id: 'cmd-new-sheet',
      title: 'New Master Spreadsheet',
      category: 'Creation',
      icon: FileSpreadsheet,
      action: () => navigate('/canvas/sheets/new'),
    },
    {
      id: 'cmd-new-slide',
      title: 'New Master Slide Deck',
      category: 'Creation',
      icon: Presentation,
      action: () => navigate('/canvas/slides/new'),
    },
    {
      id: 'cmd-new-form',
      title: 'New Master Form',
      category: 'Creation',
      icon: CheckSquare,
      action: () => navigate('/canvas/forms/new'),
    },
    {
      id: 'cmd-new-draw',
      title: 'New Master Diagram',
      category: 'Creation',
      icon: Palette,
      action: () => navigate('/canvas/draw/new'),
    },
    {
      id: 'cmd-new-note',
      title: 'New Master Notebook',
      category: 'Creation',
      icon: BookOpen,
      action: () => navigate('/canvas/notes/new'),
    },
    {
      id: 'cmd-admin',
      title: 'Go to Admin Platform & System Center',
      category: 'Management',
      icon: ShieldCheck,
      action: () => navigate('/admin'),
    },
    {
      id: 'cmd-settings',
      title: 'Go to Settings',
      category: 'Navigation',
      icon: Settings,
      action: () => navigate('/settings'),
    },
    {
      id: 'cmd-new-folder',
      title: 'Create New Folder',
      category: 'Actions',
      icon: FolderPlus,
      action: () => setNewFolderModalOpen(true),
    },
    {
      id: 'cmd-cleanup',
      title: 'Smart Storage Cleanup',
      category: 'Actions',
      icon: PieChart,
      action: () => setSmartCleanupModalOpen(true),
    },
    {
      id: 'cmd-toggle-theme',
      title: `Toggle Theme (Currently ${theme})`,
      category: 'Appearance',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
  ];

  // Dynamic file items in search results
  const fileCommands: CommandItem[] = files.slice(0, 8).map(file => ({
    id: `file-${file.id}`,
    title: `Open file: ${file.name}`,
    category: 'Files',
    icon: HardDrive,
    action: () => {
      // preview or details
    },
  }));

  const allCommands = [...baseCommands, ...fileCommands];

  const filtered = allCommands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        setCommandPaletteOpen(false);
      }
    }
  };

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} className="p-0 max-w-xl overflow-hidden">
      <div className="flex items-center border-b border-border/80 px-4 py-3">
        <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command or search files..."
          className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground text-foreground"
        />
        <span className="text-[11px] font-mono text-muted-foreground uppercase border border-border px-1.5 py-0.5 rounded">
          ESC
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No matching commands or files found</div>
        ) : (
          filtered.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setCommandPaletteOpen(false);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-colors ${
                  isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground hover:bg-accent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-primary'}`} />
                  <span className="truncate">{cmd.title}</span>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {cmd.category}
                </span>
              </button>
            );
          })
        )}
      </div>
      <div className="flex items-center justify-between border-t border-border/60 bg-secondary/30 px-4 py-2 text-[11px] text-muted-foreground">
        <span>Use arrows to navigate, Enter to select</span>
        <span>MASTER CLOUD Command Center</span>
      </div>
    </Dialog>
  );
}
