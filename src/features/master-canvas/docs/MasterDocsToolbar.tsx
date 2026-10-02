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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { CanvasDocData } from '@/types/canvas';

export type RibbonTab = 'file' | 'home' | 'insert' | 'layout' | 'references' | 'review' | 'view';

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
  onExport: (format: 'pdf' | 'docx' | 'html' | 'txt' | 'md') => void;
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
  const [selectedFontSize, setSelectedFontSize] = useState('3'); // HTML fontSize 1-7
  const [tableGridHover, setTableGridHover] = useState({ r: 2, c: 2 });
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);

  const fontFamilies = [
    { label: 'Inter (Modern Sans)', value: 'Inter, sans-serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Calibri', value: 'Calibri, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'JetBrains Mono (Code)', value: '"JetBrains Mono", monospace' },
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

  const handleSizeChange = (val: string) => {
    setSelectedFontSize(val);
    onExecCommand('fontSize', val);
  };

  const handleInsertDate = () => {
    const today = new Date().toLocaleDateString(undefined, { dateStyle: 'long' });
    onExecCommand('insertText', today);
  };

  const handleInsertDivider = () => {
    onExecCommand('insertHorizontalRule');
  };

  return (
    <div className="flex flex-col border-b border-border/80 bg-card/95 backdrop-blur-md select-none shrink-0">
      {/* ── 1. Top Ribbon Navigation Tabs ──────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 pt-1.5 border-b border-border/60 bg-muted/20">
        {(['file', 'home', 'insert', 'layout', 'references', 'review', 'view'] as RibbonTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab
                ? 'bg-card text-primary border-t-2 border-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── 2. Active Tab Toolbar Actions ───────────────────────────────── */}
      <div className="flex items-center gap-2 p-2 overflow-x-auto min-h-[52px]">

        {/* ── TAB: FILE ─────────────────────────────────────────────────── */}
        {activeTab === 'file' && (
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" onClick={onSave} className="rounded-xl text-xs h-8 gap-1.5 font-bold text-primary">
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onOpenTemplates} className="rounded-xl text-xs h-8 gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Templates
            </Button>
            <div className="h-4 w-px bg-border mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button size="sm" variant="ghost" className="rounded-xl text-xs h-8 gap-1.5">
                  <Download className="h-3.5 w-3.5 text-blue-500" /> Download As <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="left" className="w-48">
                <DropdownMenuItem onClick={() => onExport('docx')}>
                  <FileText className="h-4 w-4 mr-2 text-blue-600" /> Word Document (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('pdf')}>
                  <Printer className="h-4 w-4 mr-2 text-rose-500" /> PDF Document (.pdf)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('html')}>
                  <FileDown className="h-4 w-4 mr-2 text-indigo-500" /> Web Page (.html)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('txt')}>
                  <FileDown className="h-4 w-4 mr-2 text-muted-foreground" /> Plain Text (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('md')}>
                  <FileDown className="h-4 w-4 mr-2 text-emerald-500" /> Markdown (.md)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" variant="ghost" onClick={onPrint} className="rounded-xl text-xs h-8 gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        )}

        {/* ── TAB: HOME ─────────────────────────────────────────────────── */}
        {activeTab === 'home' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Font Family */}
            <select
              value={selectedFont}
              onChange={(e) => handleFontChange(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-primary font-medium"
            >
              {fontFamilies.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            {/* Font Size */}
            <select
              value={selectedFontSize}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="h-8 px-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-primary"
            >
              {fontSizes.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Basic Styles */}
            <button
              onClick={() => onExecCommand('bold')}
              title="Bold (Ctrl+B)"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => onExecCommand('italic')}
              title="Italic (Ctrl+I)"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => onExecCommand('underline')}
              title="Underline (Ctrl+U)"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              onClick={() => onExecCommand('strikeThrough')}
              title="Strikethrough"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              onClick={() => onExecCommand('subscript')}
              title="Subscript"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Subscript className="h-4 w-4" />
            </button>
            <button
              onClick={() => onExecCommand('superscript')}
              title="Superscript"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Superscript className="h-4 w-4" />
            </button>

            {/* Text Color Picker */}
            <div className="relative flex items-center">
              <input
                type="color"
                title="Text Color"
                onChange={(e) => onExecCommand('foreColor', e.target.value)}
                className="w-7 h-7 p-0.5 rounded-lg border border-border bg-background cursor-pointer"
              />
            </div>

            {/* Highlight Color Picker */}
            <div className="relative flex items-center">
              <input
                type="color"
                defaultValue="#fef08a"
                title="Highlight Background Color"
                onChange={(e) => onExecCommand('hiliteColor', e.target.value)}
                className="w-7 h-7 p-0.5 rounded-lg border border-border bg-background cursor-pointer"
              />
            </div>

            <button
              onClick={() => onExecCommand('removeFormat')}
              title="Clear Formatting"
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Eraser className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Alignment */}
            <button
              onClick={() => onExecCommand('justifyLeft')}
              title="Align Left (Ctrl+L)"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onExecCommand('justifyCenter')}
              title="Center (Ctrl+E)"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              onClick={() => onExecCommand('justifyRight')}
              title="Align Right (Ctrl+R)"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <AlignRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onExecCommand('justifyFull')}
              title="Justify (Ctrl+J)"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <AlignJustify className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Lists */}
            <button
              onClick={() => onExecCommand('insertUnorderedList')}
              title="Bulleted List"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => onExecCommand('insertOrderedList')}
              title="Numbered List"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              onClick={() => onExecCommand('formatBlock', 'blockquote')}
              title="Quote Block"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              onClick={() => onExecCommand('formatBlock', 'pre')}
              title="Code Block"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Code className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Heading Presets */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 gap-1 font-semibold">
                  Styles <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="left" className="w-44">
                <DropdownMenuItem onClick={() => onExecCommand('formatBlock', 'p')}>
                  Normal Text (Paragraph)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExecCommand('formatBlock', 'h1')} className="font-bold text-base">
                  Heading 1 (H1)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExecCommand('formatBlock', 'h2')} className="font-bold text-sm">
                  Heading 2 (H2)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExecCommand('formatBlock', 'h3')} className="font-bold text-xs">
                  Heading 3 (H3)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Find & Replace Toggle */}
            <button
              onClick={onToggleFindReplace}
              title="Find & Replace (Ctrl+F / Ctrl+H)"
              className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── TAB: INSERT ───────────────────────────────────────────────── */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Insert Image */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const url = prompt('Enter image URL (or paste image directly into document):');
                if (url) onInsertImage(url);
              }}
              className="rounded-xl text-xs h-8 gap-1.5 font-semibold"
            >
              <ImageIcon className="h-3.5 w-3.5 text-blue-500" /> Image
            </Button>

            {/* Insert Table Grid Picker */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 gap-1.5 font-semibold">
                  <TableIcon className="h-3.5 w-3.5 text-emerald-500" /> Table <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="left" className="p-3">
                <p className="text-[11px] font-bold text-muted-foreground mb-2">
                  Insert Table ({tableGridHover.r} &times; {tableGridHover.c})
                </p>
                <div className="grid grid-cols-6 gap-1 bg-muted/40 p-2 rounded-xl border border-border">
                  {[1, 2, 3, 4, 5, 6].map((r) =>
                    [1, 2, 3, 4, 5, 6].map((c) => {
                      const isHovered = r <= tableGridHover.r && c <= tableGridHover.c;
                      return (
                        <div
                          key={`${r}-${c}`}
                          onMouseEnter={() => setTableGridHover({ r, c })}
                          onClick={() => {
                            onInsertTable(r, c);
                            setIsTableDropdownOpen(false);
                          }}
                          className={`w-4 h-4 rounded border transition-colors cursor-pointer ${
                            isHovered ? 'bg-primary border-primary' : 'bg-background border-border hover:border-primary'
                          }`}
                        />
                      );
                    })
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Insert Link */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const url = prompt('Enter Hyperlink URL (e.g. https://example.com):');
                if (url) onInsertLink(url);
              }}
              className="rounded-xl text-xs h-8 gap-1.5 font-semibold"
            >
              <LinkIcon className="h-3.5 w-3.5 text-purple-500" /> Link
            </Button>

            {/* Insert Math / LaTeX Equation */}
            <Button
              size="sm"
              variant="outline"
              onClick={onInsertEquation}
              className="rounded-xl text-xs h-8 gap-1.5 font-semibold"
            >
              <Sigma className="h-3.5 w-3.5 text-indigo-500" /> Equation
            </Button>

            {/* Insert Callout Note Box */}
            <Button
              size="sm"
              variant="outline"
              onClick={onInsertCallout}
              className="rounded-xl text-xs h-8 gap-1.5 font-semibold"
            >
              <Quote className="h-3.5 w-3.5 text-amber-500" /> Callout Note
            </Button>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Special Elements */}
            <Button size="sm" variant="ghost" onClick={handleInsertDivider} className="rounded-xl text-xs h-8 gap-1">
              <Minus className="h-3.5 w-3.5" /> Divider
            </Button>
            <Button size="sm" variant="ghost" onClick={handleInsertDate} className="rounded-xl text-xs h-8 gap-1">
              <Calendar className="h-3.5 w-3.5" /> Date
            </Button>
          </div>
        )}

        {/* ── TAB: LAYOUT ───────────────────────────────────────────────── */}
        {activeTab === 'layout' && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Page Size */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Size:</span>
              <select
                value={pageLayout?.size || 'A4'}
                onChange={(e) => onUpdateLayout({ size: e.target.value as any })}
                className="h-8 px-2 text-xs rounded-xl border border-border bg-background font-medium"
              >
                <option value="A4">A4 (210 &times; 297 mm)</option>
                <option value="Letter">Letter (8.5 &times; 11 in)</option>
                <option value="Legal">Legal (8.5 &times; 14 in)</option>
                <option value="A3">A3 (297 &times; 420 mm)</option>
                <option value="A5">A5 (148 &times; 210 mm)</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Orientation:</span>
              <select
                value={pageLayout?.orientation || 'portrait'}
                onChange={(e) => onUpdateLayout({ orientation: e.target.value as any })}
                className="h-8 px-2 text-xs rounded-xl border border-border bg-background font-medium"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            {/* Margins */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Margins:</span>
              <select
                value={pageLayout?.margins || 'normal'}
                onChange={(e) => onUpdateLayout({ margins: e.target.value as any })}
                className="h-8 px-2 text-xs rounded-xl border border-border bg-background font-medium"
              >
                <option value="normal">Normal (1.0 in)</option>
                <option value="narrow">Narrow (0.5 in)</option>
                <option value="moderate">Moderate (0.75 in)</option>
                <option value="wide">Wide (1.5 in)</option>
              </select>
            </div>

            {/* Columns */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Columns:</span>
              <select
                value={pageLayout?.columns || 1}
                onChange={(e) => onUpdateLayout({ columns: parseInt(e.target.value, 10) as any })}
                className="h-8 px-2 text-xs rounded-xl border border-border bg-background font-medium"
              >
                <option value="1">1 Column</option>
                <option value="2">2 Columns</option>
                <option value="3">3 Columns</option>
              </select>
            </div>
          </div>
        )}

        {/* ── TAB: REFERENCES ───────────────────────────────────────────── */}
        {activeTab === 'references' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onInsertTOC}
              className="rounded-xl text-xs h-8 gap-1.5 font-semibold text-primary"
            >
              <BookOpen className="h-3.5 w-3.5" /> Insert Table of Contents
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onInsertFootnote}
              className="rounded-xl text-xs h-8 gap-1.5 font-semibold"
            >
              <FileText className="h-3.5 w-3.5" /> Insert Footnote
            </Button>
          </div>
        )}

        {/* ── TAB: REVIEW ───────────────────────────────────────────────── */}
        {activeTab === 'review' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenWordCount}
              className="rounded-xl text-xs h-8 gap-1.5 font-semibold"
            >
              <FileText className="h-3.5 w-3.5 text-blue-500" /> Word Count Statistics
            </Button>
            <Button
              size="sm"
              variant={isCommentsOpen ? 'default' : 'outline'}
              onClick={onToggleComments}
              className="rounded-xl text-xs h-8 gap-1.5 font-semibold"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Comments &amp; Review
            </Button>
          </div>
        )}

        {/* ── TAB: VIEW ─────────────────────────────────────────────────── */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Zoom:</span>
              <select
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="h-8 px-2 text-xs rounded-xl border border-border bg-background font-medium"
              >
                <option value="0.5">50%</option>
                <option value="0.75">75%</option>
                <option value="1">100% (Normal)</option>
                <option value="1.25">125%</option>
                <option value="1.5">150%</option>
                <option value="2">200%</option>
              </select>
            </div>

            <div className="h-4 w-px bg-border mx-1" />

            <Button
              size="sm"
              variant={showRuler ? 'default' : 'outline'}
              onClick={() => setShowRuler(!showRuler)}
              className="rounded-xl text-xs h-8 gap-1 font-semibold"
            >
              Ruler: {showRuler ? 'ON' : 'OFF'}
            </Button>

            <Button
              size="sm"
              variant={isOutlineOpen ? 'default' : 'outline'}
              onClick={onToggleOutline}
              className="rounded-xl text-xs h-8 gap-1 font-semibold"
            >
              Document Outline
            </Button>

            <Button
              size="sm"
              variant={isDocDarkMode ? 'default' : 'outline'}
              onClick={() => setIsDocDarkMode(!isDocDarkMode)}
              className="rounded-xl text-xs h-8 gap-1 font-semibold"
            >
              Dark Sheet Mode
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-xl text-xs h-8 gap-1 font-semibold"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
