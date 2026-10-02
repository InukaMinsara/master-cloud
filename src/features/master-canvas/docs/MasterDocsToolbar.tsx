import React, { useState } from 'react';
import {
  FileText,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Search,
  Printer,
  Download,
  Save,
  Clock,
  Sparkles,
  Scissors,
  Copy,
  Clipboard,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Calendar,
  Minus,
  Sigma,
  MessageSquare,
  Eye,
  Maximize2,
  Minimize2,
  Palette,
  Columns,
  BookOpen,
  HelpCircle,
  FilePlus,
  FolderOpen,
  FileDown,
  Layout,
  Layers,
  ChevronDown,
  Wand2,
  GitCompare,
  FileCheck,
  PenTool,
  ShieldCheck,
  Tag,
  Book,
  Rows,
  Play,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CanvasDocData } from '@/types/canvas';

export type RibbonTab =
  | 'file'
  | 'home'
  | 'insert'
  | 'layout'
  | 'references'
  | 'automate'
  | 'review'
  | 'view';

interface MasterDocsToolbarProps {
  activeTab: RibbonTab;
  setActiveTab: (tab: RibbonTab) => void;
  pageLayout: CanvasDocData['pageLayout'];
  onUpdateLayout: (updates: Partial<NonNullable<CanvasDocData['pageLayout']>>) => void;
  onExecCommand: (command: string, value?: string) => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertImage: (url: string) => void;
  onInsertLink: (url: string, text?: string) => void;
  onInsertTOC: () => void;
  onInsertFootnote: () => void;
  onInsertEquation: () => void;
  onInsertCallout: () => void;
  onOpenTemplates: () => void;
  onOpenWordCount: () => void;
  onToggleOutline: () => void;
  onToggleComments: () => void;
  onToggleFindReplace: () => void;
  onSave: () => void;
  onPrint: () => void;
  onExport: (format: 'pdf' | 'docx' | 'html' | 'txt' | 'md' | 'rtf' | 'json') => void;
  // Advanced features
  onOpenStylesModal: () => void;
  onOpenThemesModal: () => void;
  onOpenCitationModal: () => void;
  onOpenDiffModal: () => void;
  onOpenQualityModal: () => void;
  onOpenApprovalModal: () => void;
  onOpenSignatureModal: () => void;
  onOpenFormBuilderModal: () => void;
  onOpenMailMergeModal: () => void;
  onOpenBookBuilderModal: () => void;
  onOpenSecurityModal: () => void;
  onOpenPropertiesModal: () => void;
  onOpenCodeBlockModal: () => void;
  onOpenReadingMode: () => void;
  onOpenPresentationMode: () => void;
  onOpenCommandPalette: () => void;
  onToggleSplitView: () => void;
  // View states
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  showRuler: boolean;
  setShowRuler: (show: boolean) => void;
  isOutlineOpen: boolean;
  isCommentsOpen: boolean;
  isFullscreen: boolean;
  setIsFullscreen: (full: boolean) => void;
  isDocDarkMode: boolean;
  setIsDocDarkMode: (dark: boolean) => void;
}

export function MasterDocsToolbar({
  activeTab,
  setActiveTab,
  pageLayout,
  onUpdateLayout,
  onExecCommand,
  onInsertTable,
  onInsertImage,
  onInsertLink,
  onInsertTOC,
  onInsertFootnote,
  onInsertEquation,
  onInsertCallout,
  onOpenTemplates,
  onOpenWordCount,
  onToggleOutline,
  onToggleComments,
  onToggleFindReplace,
  onSave,
  onPrint,
  onExport,
  onOpenStylesModal,
  onOpenThemesModal,
  onOpenCitationModal,
  onOpenDiffModal,
  onOpenQualityModal,
  onOpenApprovalModal,
  onOpenSignatureModal,
  onOpenFormBuilderModal,
  onOpenMailMergeModal,
  onOpenBookBuilderModal,
  onOpenSecurityModal,
  onOpenPropertiesModal,
  onOpenCodeBlockModal,
  onOpenReadingMode,
  onOpenPresentationMode,
  onOpenCommandPalette,
  onToggleSplitView,
  zoomLevel,
  setZoomLevel,
  showRuler,
  setShowRuler,
  isOutlineOpen,
  isCommentsOpen,
  isFullscreen,
  setIsFullscreen,
  isDocDarkMode,
  setIsDocDarkMode,
}: MasterDocsToolbarProps) {
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedFontSize, setSelectedFontSize] = useState('3');
  const [tableGridHover, setTableGridHover] = useState({ r: 2, c: 2 });
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);

  const fontFamilies = [
    { label: 'Inter (Modern Sans)', value: 'Inter, sans-serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Calibri', value: 'Calibri, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'JetBrains Mono (Code)', value: '"JetBrains Mono", monospace' },
    { label: 'Playfair Display', value: '"Playfair Display", serif' },
  ];

  const fontSizes = [
    { label: '8 pt', value: '1' },
    { label: '10 pt', value: '2' },
    { label: '12 pt (Normal)', value: '3' },
    { label: '14 pt', value: '4' },
    { label: '18 pt (Heading 3)', value: '5' },
    { label: '24 pt (Heading 2)', value: '6' },
    { label: '32 pt (Heading 1)', value: '7' },
  ];

  const handleFontChange = (val: string) => {
    setSelectedFont(val);
    onExecCommand('fontName', val);
  };

  const handleFontSizeChange = (val: string) => {
    setSelectedFontSize(val);
    onExecCommand('fontSize', val);
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onInsertImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col border-b border-border/80 bg-card/70 backdrop-blur-md shrink-0 select-none z-20">
      {/* ── 1. Ribbon Tabs Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 pt-1 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {(
            [
              { id: 'file', label: 'File' },
              { id: 'home', label: 'Home' },
              { id: 'insert', label: 'Insert' },
              { id: 'layout', label: 'Layout' },
              { id: 'references', label: 'References' },
              { id: 'automate', label: 'Automate' },
              { id: 'review', label: 'Review' },
              { id: 'view', label: 'View' },
            ] as { id: RibbonTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all relative ${
                activeTab === tab.id
                  ? 'bg-card text-primary shadow-xs after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground border border-border/60 bg-background/50 transition-colors"
          title="Command Palette (Ctrl+Shift+P)"
        >
          <Search className="h-3 w-3" />
          <span className="hidden md:inline">Command Palette</span>
          <kbd className="text-[9px] bg-muted px-1 py-0.2 rounded font-mono">⌘K</kbd>
        </button>
      </div>

      {/* ── 2. Active Tab Ribbon Content ──────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto min-h-[44px] text-xs">
        {/* ──────── TAB: FILE ──────── */}
        {activeTab === 'file' && (
          <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
            <Button size="sm" variant="ghost" onClick={onSave} className="h-8 gap-1.5 px-2.5 font-semibold text-xs">
              <Save className="h-3.5 w-3.5 text-primary" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onOpenTemplates} className="h-8 gap-1.5 px-2.5 font-semibold text-xs">
              <FolderOpen className="h-3.5 w-3.5 text-amber-500" /> Templates
            </Button>
            <Button size="sm" variant="ghost" onClick={onOpenPropertiesModal} className="h-8 gap-1.5 px-2.5 font-semibold text-xs">
              <Tag className="h-3.5 w-3.5 text-indigo-500" /> Properties
            </Button>
            <Button size="sm" variant="ghost" onClick={onOpenSecurityModal} className="h-8 gap-1.5 px-2.5 font-semibold text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Security
            </Button>

            <div className="h-5 w-px bg-border mx-1" />

            <Button size="sm" variant="ghost" onClick={() => onExport('docx')} className="h-8 gap-1 px-2 text-xs">
              <Download className="h-3.5 w-3.5 text-blue-500" /> DOCX
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onExport('pdf')} className="h-8 gap-1 px-2 text-xs">
              <Download className="h-3.5 w-3.5 text-rose-500" /> PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onExport('html')} className="h-8 gap-1 px-2 text-xs">
              <Download className="h-3.5 w-3.5 text-emerald-500" /> HTML
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onExport('md')} className="h-8 gap-1 px-2 text-xs">
              <Download className="h-3.5 w-3.5 text-violet-500" /> Markdown
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onExport('rtf')} className="h-8 gap-1 px-2 text-xs">
              <Download className="h-3.5 w-3.5 text-amber-500" /> RTF
            </Button>

            <div className="h-5 w-px bg-border mx-1" />

            <Button size="sm" variant="ghost" onClick={onPrint} className="h-8 gap-1.5 px-2.5 font-semibold text-xs">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        )}

        {/* ──────── TAB: HOME ──────── */}
        {activeTab === 'home' && (
          <div className="flex items-center gap-1 animate-in fade-in duration-150">
            {/* Styles Modal Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenStylesModal}
              className="h-8 gap-1.5 px-2.5 font-bold text-xs bg-primary/5 text-primary border-primary/30 mr-1"
            >
              <Sparkles className="h-3.5 w-3.5" /> Styles Manager
            </Button>

            {/* Font Family Selector */}
            <select
              value={selectedFont}
              onChange={(e) => handleFontChange(e.target.value)}
              className="h-8 px-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {fontFamilies.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Font Size Selector */}
            <select
              value={selectedFontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              className="h-8 px-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {fontSizes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Basic Formatting */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onExecCommand('bold')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={() => onExecCommand('italic')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                onClick={() => onExecCommand('underline')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Underline (Ctrl+U)"
              >
                <Underline className="h-4 w-4" />
              </button>
              <button
                onClick={() => onExecCommand('strikeThrough')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </button>
              <button
                onClick={() => onExecCommand('subscript')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Subscript"
              >
                <Subscript className="h-4 w-4" />
              </button>
              <button
                onClick={() => onExecCommand('superscript')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Superscript"
              >
                <Superscript className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Colors */}
            <div className="flex items-center gap-1.5">
              <label className="flex items-center gap-1 cursor-pointer p-1 rounded-lg hover:bg-accent text-[11px]" title="Text Color">
                <span className="font-bold text-xs text-foreground">A</span>
                <input
                  type="color"
                  defaultValue="#1e293b"
                  onChange={(e) => onExecCommand('foreColor', e.target.value)}
                  className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                />
              </label>

              <label className="flex items-center gap-1 cursor-pointer p-1 rounded-lg hover:bg-accent text-[11px]" title="Highlight Color">
                <span className="p-0.5 bg-yellow-300 rounded text-slate-900 font-bold text-[10px]">H</span>
                <input
                  type="color"
                  defaultValue="#fef08a"
                  onChange={(e) => onExecCommand('hiliteColor', e.target.value)}
                  className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                />
              </label>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Alignment */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onExecCommand('justifyLeft')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => onExecCommand('justifyCenter')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                onClick={() => onExecCommand('justifyRight')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onExecCommand('justifyFull')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Justify"
              >
                <AlignJustify className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Lists */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onExecCommand('insertUnorderedList')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Bulleted List"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => onExecCommand('insertOrderedList')}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Headings Presets */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onExecCommand('formatBlock', '<h1>')}
                className="px-2 py-1 rounded-lg hover:bg-accent text-[11px] font-bold text-foreground"
                title="Heading 1"
              >
                H1
              </button>
              <button
                onClick={() => onExecCommand('formatBlock', '<h2>')}
                className="px-2 py-1 rounded-lg hover:bg-accent text-[11px] font-semibold text-foreground"
                title="Heading 2"
              >
                H2
              </button>
              <button
                onClick={() => onExecCommand('formatBlock', '<h3>')}
                className="px-2 py-1 rounded-lg hover:bg-accent text-[11px] font-medium text-foreground"
                title="Heading 3"
              >
                H3
              </button>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            <button
              onClick={onToggleFindReplace}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
              title="Find & Replace (Ctrl+F)"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ──────── TAB: INSERT ──────── */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            {/* Table Dropdown Picker */}
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
                className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
              >
                <TableIcon className="h-3.5 w-3.5 text-blue-500" /> Table <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>

              {isTableDropdownOpen && (
                <div className="absolute top-10 left-0 z-50 p-3 bg-card border border-border shadow-xl rounded-xl w-48 space-y-2">
                  <div className="text-[11px] font-bold text-foreground">
                    Insert Table ({tableGridHover.r} &times; {tableGridHover.c})
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 5 }).map((_, r) =>
                      Array.from({ length: 5 }).map((_, c) => (
                        <div
                          key={`${r}-${c}`}
                          onMouseEnter={() => setTableGridHover({ r: r + 1, c: c + 1 })}
                          onClick={() => {
                            onInsertTable(r + 1, c + 1);
                            setIsTableDropdownOpen(false);
                          }}
                          className={`h-5 rounded-xs border cursor-pointer transition-colors ${
                            r < tableGridHover.r && c < tableGridHover.c
                              ? 'bg-primary/40 border-primary'
                              : 'bg-muted border-border hover:bg-accent'
                          }`}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Image Inserter */}
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-background hover:bg-accent cursor-pointer text-xs font-semibold transition-colors">
              <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
              <span>Image</span>
              <input type="file" accept="image/*" onChange={handleLocalImageUpload} className="hidden" />
            </label>

            {/* Hyperlink */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const url = prompt('Enter website URL:');
                if (url) onInsertLink(url);
              }}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
            >
              <LinkIcon className="h-3.5 w-3.5 text-sky-500" /> Link
            </Button>

            {/* Interactive Forms */}
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenFormBuilderModal}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
            >
              <CheckSquare className="h-3.5 w-3.5 text-indigo-500" /> Form Field
            </Button>

            {/* Code Block Modal */}
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenCodeBlockModal}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
            >
              <Code className="h-3.5 w-3.5 text-cyan-500" /> Code Snippet
            </Button>

            {/* LaTeX Equations */}
            <Button
              size="sm"
              variant="outline"
              onClick={onInsertEquation}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
            >
              <Sigma className="h-3.5 w-3.5 text-purple-500" /> Equation
            </Button>

            {/* Footnote */}
            <Button
              size="sm"
              variant="outline"
              onClick={onInsertFootnote}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
            >
              <Quote className="h-3.5 w-3.5 text-amber-500" /> Footnote
            </Button>

            {/* Callout Box */}
            <Button
              size="sm"
              variant="outline"
              onClick={onInsertCallout}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
            >
              <FileText className="h-3.5 w-3.5 text-rose-500" /> Callout
            </Button>
          </div>
        )}

        {/* ──────── TAB: LAYOUT ──────── */}
        {activeTab === 'layout' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            {/* Themes Modal */}
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenThemesModal}
              className="h-8 gap-1.5 px-2.5 font-bold text-xs bg-primary/5 text-primary border-primary/30"
            >
              <Palette className="h-3.5 w-3.5" /> Themes & Palettes
            </Button>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Page Size */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-[11px] font-semibold">Size:</span>
              {(['A4', 'Letter', 'Legal', 'A3', 'A5'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => onUpdateLayout({ size: sz })}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    (pageLayout?.size || 'A4') === sz ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-accent'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Orientation */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-[11px] font-semibold">Orientation:</span>
              <button
                onClick={() => onUpdateLayout({ orientation: 'portrait' })}
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  (pageLayout?.orientation || 'portrait') === 'portrait'
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'hover:bg-accent'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => onUpdateLayout({ orientation: 'landscape' })}
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  pageLayout?.orientation === 'landscape' ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-accent'
                }`}
              >
                Landscape
              </button>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Margins */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-[11px] font-semibold">Margins:</span>
              {(['normal', 'narrow', 'moderate', 'wide'] as const).map((mg) => (
                <button
                  key={mg}
                  onClick={() => onUpdateLayout({ margins: mg })}
                  className={`px-2 py-1 rounded-lg text-xs capitalize font-medium ${
                    (pageLayout?.margins || 'normal') === mg ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-accent'
                  }`}
                >
                  {mg}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Columns */}
            <div className="flex items-center gap-1">
              <Columns className="h-3.5 w-3.5 text-muted-foreground" />
              {[1, 2, 3].map((cols) => (
                <button
                  key={cols}
                  onClick={() => onUpdateLayout({ columns: cols as any })}
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    (pageLayout?.columns || 1) === cols ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-accent'
                  }`}
                >
                  {cols} Col
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ──────── TAB: REFERENCES ──────── */}
        {activeTab === 'references' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <Button size="sm" variant="outline" onClick={onInsertTOC} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Table of Contents
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onOpenCitationModal}
              className="h-8 gap-1.5 px-2.5 font-bold text-xs bg-primary/5 text-primary border-primary/30"
            >
              <Quote className="h-3.5 w-3.5" /> Citations & Bibliography
            </Button>

            <Button size="sm" variant="outline" onClick={onInsertFootnote} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <Quote className="h-3.5 w-3.5 text-amber-500" /> Insert Footnote
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onOpenBookBuilderModal}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
            >
              <Book className="h-3.5 w-3.5 text-indigo-500" /> Book & Chapter Builder
            </Button>
          </div>
        )}

        {/* ──────── TAB: AUTOMATE ──────── */}
        {activeTab === 'automate' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenMailMergeModal}
              className="h-8 gap-1.5 px-2.5 font-bold text-xs bg-primary/5 text-primary border-primary/30"
            >
              <Wand2 className="h-3.5 w-3.5" /> Mail Merge & Variables
            </Button>

            <span className="text-[11px] text-muted-foreground">
              Embed placeholders <code className="bg-background px-1 py-0.5 rounded font-mono text-primary">&#123;&#123;name&#125;&#125;</code> and run batch generation from CSV datasets.
            </span>
          </div>
        )}

        {/* ──────── TAB: REVIEW ──────── */}
        {activeTab === 'review' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenQualityModal}
              className="h-8 gap-1.5 px-2.5 font-bold text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Quality & Health Audit
            </Button>

            <Button size="sm" variant="outline" onClick={onOpenDiffModal} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <GitCompare className="h-3.5 w-3.5 text-blue-500" /> Document Diff
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onOpenApprovalModal}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
            >
              <FileCheck className="h-3.5 w-3.5 text-indigo-500" /> Approval Workflow
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onOpenSignatureModal}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
            >
              <PenTool className="h-3.5 w-3.5 text-amber-500" /> Electronic Signature
            </Button>

            <div className="h-5 w-px bg-border mx-1" />

            <Button size="sm" variant="ghost" onClick={onOpenWordCount} className="h-8 gap-1.5 px-2 text-xs">
              <FileText className="h-3.5 w-3.5" /> Word Count
            </Button>

            <Button
              size="sm"
              variant={isCommentsOpen ? 'gradient' : 'ghost'}
              onClick={onToggleComments}
              className="h-8 gap-1.5 px-2 text-xs font-semibold"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Comments
            </Button>
          </div>
        )}

        {/* ──────── TAB: VIEW ──────── */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <Button size="sm" variant="outline" onClick={onOpenReadingMode} className="h-8 gap-1.5 px-2.5 font-bold text-xs">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Reading Mode
            </Button>

            <Button size="sm" variant="outline" onClick={onOpenPresentationMode} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <Play className="h-3.5 w-3.5 text-emerald-500" /> Presentation
            </Button>

            <Button size="sm" variant="outline" onClick={onToggleSplitView} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <Rows className="h-3.5 w-3.5 text-indigo-500" /> Split View
            </Button>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                className="px-2 py-1 rounded hover:bg-accent text-xs font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-xs font-mono font-semibold">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(2.0, zoomLevel + 0.1))}
                className="px-2 py-1 rounded hover:bg-accent text-xs font-bold"
                title="Zoom In"
              >
                +
              </button>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* View Toggles */}
            <button
              onClick={() => setShowRuler(!showRuler)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                showRuler ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-accent text-muted-foreground'
              }`}
            >
              Ruler
            </button>

            <button
              onClick={onToggleOutline}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                isOutlineOpen ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-accent text-muted-foreground'
              }`}
            >
              Outline
            </button>

            <button
              onClick={() => setIsDocDarkMode(!isDocDarkMode)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                isDocDarkMode ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-accent text-muted-foreground'
              }`}
            >
              Dark Sheet
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
