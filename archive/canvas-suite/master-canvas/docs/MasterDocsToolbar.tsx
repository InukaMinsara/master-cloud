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
  Sparkles,
  Eraser,
  Calendar,
  Minus,
  Sigma,
  MessageSquare,
  Maximize2,
  Minimize2,
  Palette,
  Columns,
  BookOpen,
  FolderOpen,
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
  Undo2,
  Redo2,
  Paintbrush,
  IndentIncrease,
  IndentDecrease,
  Scissors,
  Camera,
  FileUp,
  Globe,
  FileSpreadsheet,
  SlidersHorizontal,
  MousePointer,
  Highlighter,
  Check,
  Trash2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { CanvasDocData } from '@/types/canvas';
import { WORD_FONT_FAMILIES, WORD_FONT_SIZES_PT } from './services/DocThemesService';

export interface ActiveCaretFormatting {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  subscript: boolean;
  superscript: boolean;
  align: 'left' | 'center' | 'right' | 'justify';
  fontFamily: string;
  fontSizePt: string;
}

export type RibbonTab =
  | 'file'
  | 'home'
  | 'insert'
  | 'draw'
  | 'design'
  | 'layout'
  | 'references'
  | 'automate'
  | 'review'
  | 'view'
  | 'table-design';

interface MasterDocsToolbarProps {
  activeTab: RibbonTab;
  setActiveTab: (tab: RibbonTab) => void;
  onOpenFileBackstage?: () => void;
  pageLayout: CanvasDocData['pageLayout'];
  onUpdateLayout: (updates: Partial<NonNullable<CanvasDocData['pageLayout']>>) => void;
  onExecCommand: (command: string, value?: string) => void;
  activeFormatting?: ActiveCaretFormatting;
  onSetFontSizePt: (pt: number) => void;
  onApplyQuickStyle: (styleId: string) => void;
  onTransformCase: (mode: 'sentence' | 'lower' | 'upper' | 'capitalize' | 'toggle') => void;
  onInsertCoverPage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isFormatPainterActive: boolean;
  onToggleFormatPainter: () => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertImage: (url: string) => void;
  onInsertLink: (url: string, text?: string) => void;
  onInsertTOC: () => void;
  onInsertFootnote: () => void;
  onInsertEquation: () => void;
  onInsertCallout: () => void;
  onInsertPageBreak: () => void;
  onInsertDivider: () => void;
  onInsertDateTime: () => void;
  onImportDocx: (file: File) => void;
  onOpenTemplates: () => void;
  onOpenWordCount: () => void;
  onToggleOutline: () => void;
  onToggleComments: () => void;
  onToggleFindReplace: () => void;
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
  onCreateSnapshot: () => void;
  onSave: () => void;
  onPrint: () => void;
  onExport: (format: 'pdf' | 'docx' | 'html' | 'txt' | 'md' | 'rtf' | 'json') => void;
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

  // Inking (Draw tab)
  drawTool?: 'select' | 'pen' | 'highlighter' | 'eraser';
  setDrawTool?: (tool: 'select' | 'pen' | 'highlighter' | 'eraser') => void;
  penColor?: string;
  setPenColor?: (color: string) => void;
  penWidth?: number;
  setPenWidth?: (width: number) => void;
  onClearInk?: () => void;

  // Contextual Table Design tab
  isTableCellFocused?: boolean;
  onInsertRowAbove?: () => void;
  onInsertRowBelow?: () => void;
  onInsertColLeft?: () => void;
  onInsertColRight?: () => void;
  onDeleteRow?: () => void;
  onDeleteCol?: () => void;
  onDeleteTable?: () => void;
  onToggleTableHeader?: () => void;
  onShadeCell?: (color: string) => void;
}

const RibbonGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col justify-between px-2 border-r border-black/[0.08] dark:border-border/80 last:border-r-0 shrink-0 self-stretch">
    <div className="flex items-center gap-1 flex-1">{children}</div>
    <div className="text-[9.5px] leading-none text-muted-foreground/85 text-center pt-1 select-none font-medium tracking-tight">
      {label}
    </div>
  </div>
);

export function MasterDocsToolbar({
  activeTab,
  setActiveTab,
  onOpenFileBackstage,
  pageLayout,
  onUpdateLayout,
  onExecCommand,
  activeFormatting,
  onSetFontSizePt,
  onApplyQuickStyle,
  onTransformCase,
  onInsertCoverPage,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isFormatPainterActive,
  onToggleFormatPainter,
  onInsertTable,
  onInsertImage,
  onInsertLink,
  onInsertTOC,
  onInsertFootnote,
  onInsertEquation,
  onInsertCallout,
  onInsertPageBreak,
  onInsertDivider,
  onInsertDateTime,
  onImportDocx,
  onOpenTemplates,
  onOpenWordCount,
  onToggleOutline,
  onToggleComments,
  onToggleFindReplace,
  onToggleCopilot,
  isCopilotOpen,
  onCreateSnapshot,
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
  drawTool = 'select',
  setDrawTool,
  penColor = '#111827',
  setPenColor,
  penWidth = 2,
  setPenWidth,
  onClearInk,
  isTableCellFocused = false,
  onInsertRowAbove,
  onInsertRowBelow,
  onInsertColLeft,
  onInsertColRight,
  onDeleteRow,
  onDeleteCol,
  onDeleteTable,
  onToggleTableHeader,
  onShadeCell,
}: MasterDocsToolbarProps) {
  const [selectedFont, setSelectedFont] = useState(WORD_FONT_FAMILIES[0].value);
  const [selectedFontSizePt, setSelectedFontSizePt] = useState('12');
  const [tableGridHover, setTableGridHover] = useState({ r: 3, c: 3 });
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [isCaseMenuOpen, setIsCaseMenuOpen] = useState(false);
  const [activeQuickStyleId, setActiveQuickStyleId] = useState('style-normal');

  const displayedFont = activeFormatting?.fontFamily || selectedFont;
  const displayedFontSizePt = activeFormatting?.fontSizePt || selectedFontSizePt;

  const handleFontChange = (val: string) => {
    setSelectedFont(val);
    onExecCommand('fontName', val);
  };

  const handleFontSizeChange = (ptStr: string) => {
    setSelectedFontSizePt(ptStr);
    const pt = parseFloat(ptStr);
    if (!Number.isNaN(pt) && pt > 0) {
      onSetFontSizePt(pt);
    }
  };

  const stepFontSize = (delta: number) => {
    const current = parseFloat(displayedFontSizePt) || 12;
    const idx = WORD_FONT_SIZES_PT.findIndex((s) => s >= current);
    const safeIdx = idx === -1 ? WORD_FONT_SIZES_PT.indexOf(12) : idx;
    const nextIdx = Math.max(0, Math.min(WORD_FONT_SIZES_PT.length - 1, safeIdx + delta));
    const nextPt = WORD_FONT_SIZES_PT[nextIdx];
    setSelectedFontSizePt(String(nextPt));
    onSetFontSizePt(nextPt);
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

  const handleDocxFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportDocx(file);
      e.target.value = '';
    }
  };

  const wordBtn = (active = false) =>
    `p-1 rounded-md transition-colors ${
      active
        ? 'bg-[#cfe4fa] text-[#185abd] dark:bg-[#185abd]/25 dark:text-sky-300'
        : 'hover:bg-black/[0.06] dark:hover:bg-accent text-foreground/80 hover:text-foreground'
    }`;

  const quickStyleCards = [
    { id: 'style-normal', label: 'Normal', previewStyle: { fontFamily: 'Aptos, sans-serif', fontSize: '11px', fontWeight: 400 } },
    { id: 'style-no-spacing', label: 'No Spacing', previewStyle: { fontFamily: 'Aptos, sans-serif', fontSize: '11px', fontWeight: 400, letterSpacing: '-0.02em' } },
    { id: 'style-h1', label: 'Heading 1', previewStyle: { fontFamily: '"Aptos Display", sans-serif', fontSize: '13px', fontWeight: 500, color: '#0F4761' } },
    { id: 'style-h2', label: 'Heading 2', previewStyle: { fontFamily: '"Aptos Display", sans-serif', fontSize: '12px', fontWeight: 500, color: '#156082' } },
    { id: 'style-h3', label: 'Heading 3', previewStyle: { fontFamily: 'Aptos, sans-serif', fontSize: '11px', fontWeight: 600, color: '#0F4761' } },
    { id: 'style-title', label: 'Title', previewStyle: { fontFamily: '"Aptos Display", sans-serif', fontSize: '14px', fontWeight: 600 } },
    { id: 'style-subtitle', label: 'Subtitle', previewStyle: { fontFamily: 'Aptos, sans-serif', fontSize: '11px', color: '#595959' } },
    { id: 'style-quote', label: 'Quote', previewStyle: { fontFamily: 'Aptos, sans-serif', fontSize: '11px', fontStyle: 'italic', color: '#404040' } },
  ];

  return (
    <div className="flex flex-col bg-[#f3f2f1] dark:bg-slate-900 border-b border-black/[0.08] dark:border-border shrink-0 select-none z-20">
      {/* ── 1. Microsoft 365 Word Fluent Ribbon Tab Bar ───────────────────── */}
      <div className="flex items-center justify-between px-3 pt-0.5 pb-1">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              if (onOpenFileBackstage) onOpenFileBackstage();
              else setActiveTab('file');
            }}
            className="px-3.5 py-1 text-xs font-semibold rounded-md bg-[#185abd] hover:bg-[#144ea4] text-white shadow-xs mr-1.5 transition-colors"
          >
            File
          </button>

          {(
            [
              { id: 'home', label: 'Home' },
              { id: 'insert', label: 'Insert' },
              { id: 'draw', label: 'Draw' },
              { id: 'design', label: 'Design' },
              { id: 'layout', label: 'Layout' },
              { id: 'references', label: 'References' },
              { id: 'automate', label: 'Mailings' },
              { id: 'review', label: 'Review' },
              { id: 'view', label: 'View' },
            ] as { id: RibbonTab; label: string }[]
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-xs rounded-md transition-all relative ${
                  isActive
                    ? 'font-semibold text-foreground after:absolute after:bottom-0 after:left-2.5 after:right-2.5 after:h-[2.5px] after:bg-[#185abd] after:rounded-full'
                    : 'font-normal text-foreground/75 hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {/* Contextual Table Design Tab */}
          {(isTableCellFocused || activeTab === 'table-design') && (
            <button
              onClick={() => setActiveTab('table-design')}
              className={`px-3 py-1 text-xs rounded-md transition-all relative font-semibold ${
                activeTab === 'table-design'
                  ? 'bg-[#185abd]/15 text-[#185abd] dark:text-sky-300 after:absolute after:bottom-0 after:left-2.5 after:right-2.5 after:h-[2.5px] after:bg-[#185abd] after:rounded-full'
                  : 'text-[#185abd] dark:text-sky-400 hover:bg-[#185abd]/10'
              }`}
            >
              Table Design
            </button>
          )}
        </div>

        {/* Right Quick Controls: Copilot + Comments + Editing */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleCopilot}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
              isCopilotOpen
                ? 'bg-[#185abd] text-white border-[#185abd] shadow-xs'
                : 'bg-white dark:bg-card text-[#185abd] dark:text-sky-400 border-black/10 dark:border-border hover:bg-blue-50/70'
            }`}
            title="Docs Copilot AI Assistant"
          >
            <Sparkles className="h-3 w-3" />
            <span className="hidden sm:inline">Copilot</span>
          </button>

          <button
            onClick={onToggleComments}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
              isCommentsOpen
                ? 'bg-[#185abd] text-white border-[#185abd]'
                : 'bg-white dark:bg-card text-foreground/80 border-black/10 dark:border-border hover:bg-accent'
            }`}
          >
            <MessageSquare className="h-3 w-3" />
            <span>Comments</span>
          </button>

          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-white dark:hover:bg-card hover:text-foreground border border-black/10 dark:border-border bg-white/70 dark:bg-card/60 transition-colors"
            title="Tell me what you want to do (Ctrl+K)"
          >
            <Search className="h-3 w-3" />
            <kbd className="text-[9px] font-mono opacity-80">Ctrl+K</kbd>
          </button>
        </div>
      </div>

      {/* ── 2. Elevated Microsoft Word Fluent Ribbon Card ────────────────── */}
      <div className="mx-2.5 mb-2 rounded-xl bg-white dark:bg-card border border-black/[0.08] dark:border-border shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-1.5 py-1.5 flex items-stretch overflow-x-auto min-h-[76px]">
        {/* ──────── TAB: FILE (Fallback inline if Backstage closed) ──────── */}
        {activeTab === 'file' && (
          <>
            <RibbonGroup label="Document">
              <button onClick={onSave} className="flex flex-col items-center gap-1 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <Save className="h-4 w-4 text-[#185abd]" /> Save
              </button>
              <button onClick={onOpenTemplates} className="flex flex-col items-center gap-1 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <FolderOpen className="h-4 w-4 text-amber-600" /> Templates
              </button>
              <label className="flex flex-col items-center gap-1 px-2.5 py-1 rounded-md hover:bg-black/[0.05] cursor-pointer text-[11px] font-medium">
                <FileUp className="h-4 w-4 text-[#185abd]" /> Import .docx
                <input type="file" accept=".docx" onChange={handleDocxFileSelect} className="hidden" />
              </label>
            </RibbonGroup>
            <RibbonGroup label="Export & Print">
              <button onClick={() => onExport('docx')} className="flex flex-col items-center gap-1 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-semibold">
                <Download className="h-4 w-4 text-[#185abd]" /> Word (.docx)
              </button>
              <button onClick={() => onExport('pdf')} className="flex flex-col items-center gap-1 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px]">
                <Download className="h-4 w-4 text-rose-600" /> PDF
              </button>
              <button onClick={onPrint} className="flex flex-col items-center gap-1 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px]">
                <Printer className="h-4 w-4" /> Print
              </button>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: HOME ──────── */}
        {activeTab === 'home' && (
          <>
            {/* Group 1: Undo / Clipboard */}
            <RibbonGroup label="Undo">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`${wordBtn(false)} disabled:opacity-35`}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`${wordBtn(false)} disabled:opacity-35`}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={onToggleFormatPainter}
                    className={wordBtn(isFormatPainterActive)}
                    title="Format Painter"
                  >
                    <Paintbrush className="h-3.5 w-3.5 text-amber-600" />
                  </button>
                  <button
                    onClick={() => onExecCommand('removeFormat')}
                    className={wordBtn(false)}
                    title="Clear All Formatting"
                  >
                    <Eraser className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </RibbonGroup>

            {/* Group 2: Font (2-row authentic Word stack) */}
            <RibbonGroup label="Font">
              <div className="flex flex-col gap-1">
                {/* Row 1: Font + Size + Grow/Shrink + Case */}
                <div className="flex items-center gap-1">
                  <select
                    value={displayedFont}
                    onChange={(e) => handleFontChange(e.target.value)}
                    className="h-6 px-1.5 rounded border border-black/15 dark:border-border bg-white dark:bg-background text-[11px] focus:outline-none focus:border-[#185abd] w-[148px]"
                    title="Font"
                  >
                    {WORD_FONT_FAMILIES.map((f) => (
                      <option key={f.label} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={displayedFontSizePt}
                    onChange={(e) => handleFontSizeChange(e.target.value)}
                    className="h-6 px-1 rounded border border-black/15 dark:border-border bg-white dark:bg-background text-[11px] focus:outline-none focus:border-[#185abd] w-[62px]"
                    title="Font Size"
                  >
                    {WORD_FONT_SIZES_PT.map((pt) => (
                      <option key={pt} value={String(pt)}>
                        {pt} pt
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => stepFontSize(1)}
                    className="px-1.5 py-0.5 rounded hover:bg-black/[0.06] text-[11px] font-semibold"
                    title="Increase Font Size"
                  >
                    A<sup className="text-[8px]">▲</sup>
                  </button>
                  <button
                    onClick={() => stepFontSize(-1)}
                    className="px-1.5 py-0.5 rounded hover:bg-black/[0.06] text-[10px] font-semibold"
                    title="Decrease Font Size"
                  >
                    A<sup className="text-[7px]">▼</sup>
                  </button>

                  {/* Change Case (Aa) */}
                  <div className="relative">
                    <button
                      onClick={() => setIsCaseMenuOpen(!isCaseMenuOpen)}
                      className="px-1.5 py-0.5 rounded hover:bg-black/[0.06] text-[11px] font-medium flex items-center gap-0.5"
                      title="Change Case"
                    >
                      <span>Aa</span>
                      <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                    </button>
                    {isCaseMenuOpen && (
                      <div className="absolute top-7 left-0 z-50 w-44 rounded-lg bg-white dark:bg-card border border-black/10 dark:border-border shadow-xl py-1 text-xs">
                        {(
                          [
                            { id: 'sentence', label: 'Sentence case.' },
                            { id: 'lower', label: 'lowercase' },
                            { id: 'upper', label: 'UPPERCASE' },
                            { id: 'capitalize', label: 'Capitalize Each Word' },
                            { id: 'toggle', label: 'tOGGLE cASE' },
                          ] as const
                        ).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              onTransformCase(item.id);
                              setIsCaseMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#f3f2f1] dark:hover:bg-accent text-foreground"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: B I U S x2 x^2 Highlight Color */}
                <div className="flex items-center gap-0.5">
                  <button onClick={() => onExecCommand('bold')} className={wordBtn(activeFormatting?.bold)} title="Bold (Ctrl+B)">
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onExecCommand('italic')} className={wordBtn(activeFormatting?.italic)} title="Italic (Ctrl+I)">
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onExecCommand('underline')} className={wordBtn(activeFormatting?.underline)} title="Underline (Ctrl+U)">
                    <Underline className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onExecCommand('strikeThrough')} className={wordBtn(activeFormatting?.strike)} title="Strikethrough">
                    <Strikethrough className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onExecCommand('subscript')} className={wordBtn(activeFormatting?.subscript)} title="Subscript">
                    <Subscript className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onExecCommand('superscript')} className={wordBtn(activeFormatting?.superscript)} title="Superscript">
                    <Superscript className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-4 w-px bg-black/10 mx-1" />

                  <label className="flex items-center gap-0.5 cursor-pointer px-1 py-0.5 rounded hover:bg-black/[0.06]" title="Text Highlight Color">
                    <span className="px-1 bg-yellow-300 rounded text-slate-900 font-bold text-[10px]">ab</span>
                    <input
                      type="color"
                      defaultValue="#fef08a"
                      onChange={(e) => onExecCommand('hiliteColor', e.target.value)}
                      className="w-3 h-3 rounded cursor-pointer border-0 p-0"
                    />
                  </label>

                  <label className="flex items-center gap-0.5 cursor-pointer px-1 py-0.5 rounded hover:bg-black/[0.06]" title="Font Color">
                    <span className="font-bold text-xs text-foreground border-b-2 border-[#c00000] leading-none">A</span>
                    <input
                      type="color"
                      defaultValue="#0F4761"
                      onChange={(e) => onExecCommand('foreColor', e.target.value)}
                      className="w-3 h-3 rounded cursor-pointer border-0 p-0"
                    />
                  </label>
                </div>
              </div>
            </RibbonGroup>

            {/* Group 3: Paragraph (2-row authentic Word stack) */}
            <RibbonGroup label="Paragraph">
              <div className="flex flex-col gap-1">
                {/* Row 1: Lists, Indent, Line Spacing */}
                <div className="flex items-center gap-0.5">
                  <button onClick={() => onExecCommand('insertUnorderedList')} className={wordBtn(false)} title="Bullets">
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onExecCommand('insertOrderedList')} className={wordBtn(false)} title="Numbering">
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onExecCommand('outdent')} className={wordBtn(false)} title="Decrease Indent">
                    <IndentDecrease className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onExecCommand('indent')} className={wordBtn(false)} title="Increase Indent">
                    <IndentIncrease className="h-3.5 w-3.5" />
                  </button>
                  <select
                    value={String(pageLayout?.lineSpacing || 1.16)}
                    onChange={(e) => onUpdateLayout({ lineSpacing: parseFloat(e.target.value) })}
                    className="h-6 px-1 ml-1 rounded border border-black/15 dark:border-border bg-white dark:bg-background text-[10.5px] focus:outline-none"
                    title="Line & Paragraph Spacing"
                  >
                    <option value="1">1.0</option>
                    <option value="1.15">1.15</option>
                    <option value="1.16">1.16 (Word)</option>
                    <option value="1.5">1.5</option>
                    <option value="2">2.0</option>
                    <option value="2.5">2.5</option>
                  </select>
                </div>

                {/* Row 2: Alignments */}
                <div className="flex items-center gap-0.5">
                  <button onClick={() => onExecCommand('justifyLeft')} className={wordBtn(activeFormatting?.align === 'left')} title="Align Left">
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onExecCommand('justifyCenter')} className={wordBtn(activeFormatting?.align === 'center')} title="Center">
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onExecCommand('justifyRight')} className={wordBtn(activeFormatting?.align === 'right')} title="Align Right">
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onExecCommand('justifyFull')} className={wordBtn(activeFormatting?.align === 'justify')} title="Justify">
                    <AlignJustify className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </RibbonGroup>

            {/* Group 4: Authentic Visual Styles Gallery */}
            <RibbonGroup label="Styles">
              <div className="flex items-center gap-1 bg-[#f8f8f7] dark:bg-background/60 border border-black/[0.08] dark:border-border rounded-lg p-1 max-w-[460px] overflow-x-auto scrollbar-none">
                {quickStyleCards.map((st) => {
                  const selected = activeQuickStyleId === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        setActiveQuickStyleId(st.id);
                        onApplyQuickStyle(st.id);
                      }}
                      className={`flex flex-col items-center justify-between w-[62px] h-[44px] px-1 py-1 rounded bg-white dark:bg-card border shrink-0 transition-all ${
                        selected
                          ? 'border-[#185abd] ring-1 ring-[#185abd]/40 shadow-xs'
                          : 'border-black/10 dark:border-border hover:border-[#185abd]/60'
                      }`}
                      title={`Apply ${st.label}`}
                    >
                      <span className="truncate max-w-full leading-none pt-0.5" style={st.previewStyle}>
                        AaBbCc
                      </span>
                      <span className="text-[9px] text-muted-foreground truncate max-w-full leading-none">
                        {st.label}
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={onOpenStylesModal}
                  className="flex flex-col items-center justify-center w-9 h-[44px] rounded bg-white dark:bg-card border border-black/10 dark:border-border hover:border-[#185abd] text-[9px] font-semibold text-[#185abd] shrink-0"
                  title="Open All 19 Word Quick Styles"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 mb-0.5" />
                  More
                </button>
              </div>
            </RibbonGroup>

            {/* Group 5: Editing */}
            <RibbonGroup label="Editing">
              <button
                onClick={onToggleFindReplace}
                className="flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium"
                title="Find & Replace (Ctrl+F)"
              >
                <Search className="h-4 w-4 text-[#185abd]" />
                <span>Find</span>
              </button>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: INSERT ──────── */}
        {activeTab === 'insert' && (
          <>
            <RibbonGroup label="Pages">
              <button onClick={onInsertCoverPage} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <Book className="h-4 w-4 text-[#156082]" /> Cover Page
              </button>
              <button onClick={onInsertPageBreak} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <Scissors className="h-4 w-4 text-[#185abd]" /> Page Break
              </button>
            </RibbonGroup>

            <RibbonGroup label="Tables">
              <div className="relative">
                <button
                  onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
                  className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium"
                >
                  <TableIcon className="h-4 w-4 text-[#185abd]" />
                  <span className="flex items-center gap-0.5">Table <ChevronDown className="h-2.5 w-2.5" /></span>
                </button>
                {isTableDropdownOpen && (
                  <div className="absolute top-12 left-0 z-50 p-3 bg-white dark:bg-card border border-border shadow-xl rounded-xl w-52 space-y-2">
                    <div className="text-[11px] font-bold text-foreground">
                      Insert Table ({tableGridHover.r} &times; {tableGridHover.c})
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {Array.from({ length: 6 }).map((_, r) =>
                        Array.from({ length: 6 }).map((_, c) => (
                          <div
                            key={`${r}-${c}`}
                            onMouseEnter={() => setTableGridHover({ r: r + 1, c: c + 1 })}
                            onClick={() => {
                              onInsertTable(r + 1, c + 1);
                              setIsTableDropdownOpen(false);
                            }}
                            className={`h-5 rounded-xs border cursor-pointer transition-colors ${
                              r < tableGridHover.r && c < tableGridHover.c
                                ? 'bg-[#185abd]/40 border-[#185abd]'
                                : 'bg-muted border-border hover:bg-accent'
                            }`}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Illustrations">
              <label className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] cursor-pointer text-[11px] font-medium">
                <ImageIcon className="h-4 w-4 text-emerald-600" /> Pictures
                <input type="file" accept="image/*" onChange={handleLocalImageUpload} className="hidden" />
              </label>
              <button onClick={onInsertCallout} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <FileText className="h-4 w-4 text-amber-600" /> Text Box
              </button>
            </RibbonGroup>

            <RibbonGroup label="Links & Blocks">
              <button
                onClick={() => {
                  const url = prompt('Enter website URL:');
                  if (url) onInsertLink(url);
                }}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium"
              >
                <LinkIcon className="h-4 w-4 text-sky-600" /> Link
              </button>
              <button onClick={onInsertDivider} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <Minus className="h-4 w-4" /> Divider
              </button>
              <button onClick={onInsertDateTime} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <Calendar className="h-4 w-4 text-teal-600" /> Date & Time
              </button>
            </RibbonGroup>

            <RibbonGroup label="Symbols & Controls">
              <button onClick={onInsertEquation} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <Sigma className="h-4 w-4 text-purple-600" /> Equation
              </button>
              <button onClick={onOpenFormBuilderModal} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <CheckSquare className="h-4 w-4 text-indigo-600" /> Controls
              </button>
              <button onClick={onOpenCodeBlockModal} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <Code className="h-4 w-4 text-cyan-600" /> Code
              </button>
              <button onClick={onInsertFootnote} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <Quote className="h-4 w-4 text-rose-600" /> Footnote
              </button>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: DRAW (Word 365 Inking) ──────── */}
        {activeTab === 'draw' && (
          <>
            <RibbonGroup label="Tools">
              <button
                onClick={() => setDrawTool?.('select')}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  drawTool === 'select'
                    ? 'bg-[#185abd]/15 text-[#185abd] dark:text-sky-300 font-semibold'
                    : 'hover:bg-black/[0.05]'
                }`}
                title="Select Mode (Cursor)"
              >
                <MousePointer className="h-4 w-4" />
                <span>Select</span>
              </button>
              <button
                onClick={() => setDrawTool?.('eraser')}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  drawTool === 'eraser'
                    ? 'bg-[#185abd]/15 text-[#185abd] dark:text-sky-300 font-semibold'
                    : 'hover:bg-black/[0.05]'
                }`}
                title="Eraser (Erase drawing strokes)"
              >
                <Eraser className="h-4 w-4 text-rose-500" />
                <span>Eraser</span>
              </button>
            </RibbonGroup>

            <RibbonGroup label="Pens">
              <div className="flex items-center gap-1.5 px-1">
                {/* Black Pen 0.5mm */}
                <button
                  onClick={() => {
                    setDrawTool?.('pen');
                    setPenColor?.('#111827');
                    setPenWidth?.(2);
                  }}
                  className={`flex flex-col items-center justify-between w-9 h-11 py-1 rounded border transition-all ${
                    drawTool === 'pen' && penColor === '#111827'
                      ? 'border-[#185abd] bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-[#185abd]'
                      : 'border-black/10 dark:border-border hover:bg-black/[0.04]'
                  }`}
                  title="Black Ballpoint Pen (0.5mm)"
                >
                  <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />
                  <span className="text-[9px] font-bold">0.5</span>
                </button>

                {/* Word Blue Pen 1mm */}
                <button
                  onClick={() => {
                    setDrawTool?.('pen');
                    setPenColor?.('#185abd');
                    setPenWidth?.(3);
                  }}
                  className={`flex flex-col items-center justify-between w-9 h-11 py-1 rounded border transition-all ${
                    drawTool === 'pen' && penColor === '#185abd'
                      ? 'border-[#185abd] bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-[#185abd]'
                      : 'border-black/10 dark:border-border hover:bg-black/[0.04]'
                  }`}
                  title="Word Blue Pen (1mm)"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#185abd]" />
                  <span className="text-[9px] font-bold text-[#185abd]">Blue</span>
                </button>

                {/* Red Pen 1mm */}
                <button
                  onClick={() => {
                    setDrawTool?.('pen');
                    setPenColor?.('#dc2626');
                    setPenWidth?.(3);
                  }}
                  className={`flex flex-col items-center justify-between w-9 h-11 py-1 rounded border transition-all ${
                    drawTool === 'pen' && penColor === '#dc2626'
                      ? 'border-[#185abd] bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-[#185abd]'
                      : 'border-black/10 dark:border-border hover:bg-black/[0.04]'
                  }`}
                  title="Red Annotation Pen (1mm)"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span className="text-[9px] font-bold text-red-600">Red</span>
                </button>

                {/* Emerald Green Pen 1mm */}
                <button
                  onClick={() => {
                    setDrawTool?.('pen');
                    setPenColor?.('#16a34a');
                    setPenWidth?.(3);
                  }}
                  className={`flex flex-col items-center justify-between w-9 h-11 py-1 rounded border transition-all ${
                    drawTool === 'pen' && penColor === '#16a34a'
                      ? 'border-[#185abd] bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-[#185abd]'
                      : 'border-black/10 dark:border-border hover:bg-black/[0.04]'
                  }`}
                  title="Emerald Green Pen (1mm)"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="text-[9px] font-bold text-emerald-600">Green</span>
                </button>

                {/* Galaxy Pen (Gradient / Shimmer) */}
                <button
                  onClick={() => {
                    setDrawTool?.('pen');
                    setPenColor?.('galaxy');
                    setPenWidth?.(4);
                  }}
                  className={`flex flex-col items-center justify-between w-9 h-11 py-1 rounded border transition-all ${
                    drawTool === 'pen' && penColor === 'galaxy'
                      ? 'border-[#185abd] bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-[#185abd]'
                      : 'border-black/10 dark:border-border hover:bg-black/[0.04]'
                  }`}
                  title="Office Galaxy Shimmer Pen"
                >
                  <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-400 shadow-xs" />
                  <span className="text-[8.5px] font-bold text-purple-600">Galaxy</span>
                </button>

                {/* Yellow Highlighter */}
                <button
                  onClick={() => {
                    setDrawTool?.('highlighter');
                    setPenColor?.('#fde047');
                    setPenWidth?.(16);
                  }}
                  className={`flex flex-col items-center justify-between w-9 h-11 py-1 rounded border transition-all ${
                    drawTool === 'highlighter' && penColor === '#fde047'
                      ? 'border-[#185abd] bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-[#185abd]'
                      : 'border-black/10 dark:border-border hover:bg-black/[0.04]'
                  }`}
                  title="Yellow Highlighter (16pt)"
                >
                  <span className="w-3 h-3 rounded bg-yellow-300" />
                  <span className="text-[8.5px] font-bold text-amber-700">Highlite</span>
                </button>

                {/* Neon Green Highlighter */}
                <button
                  onClick={() => {
                    setDrawTool?.('highlighter');
                    setPenColor?.('#86efac');
                    setPenWidth?.(16);
                  }}
                  className={`flex flex-col items-center justify-between w-9 h-11 py-1 rounded border transition-all ${
                    drawTool === 'highlighter' && penColor === '#86efac'
                      ? 'border-[#185abd] bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-[#185abd]'
                      : 'border-black/10 dark:border-border hover:bg-black/[0.04]'
                  }`}
                  title="Neon Green Highlighter"
                >
                  <span className="w-3 h-3 rounded bg-green-300" />
                  <span className="text-[8.5px] font-bold text-green-700">Neon</span>
                </button>

                {/* Clear All Inks */}
                {onClearInk && (
                  <button
                    onClick={onClearInk}
                    className="flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-rose-50 text-rose-600 text-[10px] font-medium transition-colors"
                    title="Clear all inking on document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Ink</span>
                  </button>
                )}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Convert">
              <button
                onClick={onInsertEquation}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium"
                title="Ink to Math"
              >
                <Sigma className="h-4 w-4 text-purple-600" />
                <span>Ink to Math</span>
              </button>
              <button
                onClick={() => {
                  setDrawTool?.('pen');
                  toast.info('Draw any shape: ink strokes will be preserved on document pages');
                }}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium"
                title="Draw Canvas"
              >
                <PenTool className="h-4 w-4 text-[#185abd]" />
                <span>Draw Canvas</span>
              </button>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: DESIGN ──────── */}
        {activeTab === 'design' && (
          <>
            <RibbonGroup label="Document Formatting">
              <button
                onClick={onOpenThemesModal}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md bg-[#185abd]/10 text-[#185abd] hover:bg-[#185abd]/15 text-[11px] font-semibold"
              >
                <Palette className="h-4 w-4" /> Themes & Colors
              </button>
              <button
                onClick={onOpenStylesModal}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium"
              >
                <SlidersHorizontal className="h-4 w-4 text-[#156082]" /> Style Sets
              </button>
            </RibbonGroup>

            <RibbonGroup label="Page Background">
              <div className="flex items-center gap-2 px-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-semibold">Watermark</span>
                  <select
                    value={pageLayout?.watermarkText || ''}
                    onChange={(e) => onUpdateLayout({ watermarkText: e.target.value })}
                    className="h-7 px-2 rounded border border-black/15 dark:border-border bg-white dark:bg-background text-xs focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="DO NOT COPY">DO NOT COPY</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="SAMPLE">SAMPLE</option>
                    <option value="URGENT">URGENT</option>
                    <option value="ASAP">ASAP</option>
                  </select>
                </div>

                <label className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md hover:bg-black/[0.05] cursor-pointer text-[11px] font-medium">
                  <input
                    type="color"
                    value={pageLayout?.pageBgColor || '#ffffff'}
                    onChange={(e) => onUpdateLayout({ pageBgColor: e.target.value })}
                    className="w-5 h-4 rounded border border-border cursor-pointer p-0"
                  />
                  <span>Page Color</span>
                </label>
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: LAYOUT ──────── */}
        {activeTab === 'layout' && (
          <>
            <RibbonGroup label="Margins">
              <div className="flex items-center gap-1">
                {(['normal', 'narrow', 'moderate', 'wide'] as const).map((mg) => (
                  <button
                    key={mg}
                    onClick={() => onUpdateLayout({ margins: mg })}
                    className={`px-2 py-1 rounded text-xs capitalize font-medium ${
                      (pageLayout?.margins || 'normal') === mg
                        ? 'bg-[#185abd] text-white font-semibold'
                        : 'hover:bg-black/[0.06]'
                    }`}
                  >
                    {mg}
                  </button>
                ))}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Orientation">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateLayout({ orientation: 'portrait' })}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    (pageLayout?.orientation || 'portrait') === 'portrait'
                      ? 'bg-[#185abd] text-white font-semibold'
                      : 'hover:bg-black/[0.06]'
                  }`}
                >
                  Portrait
                </button>
                <button
                  onClick={() => onUpdateLayout({ orientation: 'landscape' })}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    pageLayout?.orientation === 'landscape'
                      ? 'bg-[#185abd] text-white font-semibold'
                      : 'hover:bg-black/[0.06]'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Page Size">
              <div className="flex items-center gap-1">
                {(['A4', 'Letter', 'Legal', 'A3', 'A5'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => onUpdateLayout({ size: sz })}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      (pageLayout?.size || 'A4') === sz ? 'bg-[#185abd] text-white font-semibold' : 'hover:bg-black/[0.06]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Columns">
              <div className="flex items-center gap-1">
                <Columns className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
                {[1, 2, 3].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => onUpdateLayout({ columns: cols as any })}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      (pageLayout?.columns || 1) === cols ? 'bg-[#185abd] text-white font-semibold' : 'hover:bg-black/[0.06]'
                    }`}
                  >
                    {cols} Col
                  </button>
                ))}
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: REFERENCES ──────── */}
        {activeTab === 'references' && (
          <>
            <RibbonGroup label="Table of Contents">
              <button onClick={onInsertTOC} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <BookOpen className="h-4 w-4 text-[#185abd]" /> Table of Contents
              </button>
            </RibbonGroup>
            <RibbonGroup label="Footnotes & Citations">
              <button onClick={onInsertFootnote} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <Quote className="h-4 w-4 text-amber-600" /> Insert Footnote
              </button>
              <button onClick={onOpenCitationModal} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md bg-[#185abd]/10 text-[#185abd] hover:bg-[#185abd]/15 text-[11px] font-semibold">
                <Quote className="h-4 w-4" /> Citations (APA/IEEE)
              </button>
            </RibbonGroup>
            <RibbonGroup label="Manuscript">
              <button onClick={onOpenBookBuilderModal} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <Book className="h-4 w-4 text-indigo-600" /> Chapter Builder
              </button>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: MAILINGS ──────── */}
        {activeTab === 'automate' && (
          <RibbonGroup label="Start Mail Merge">
            <div className="flex items-center gap-3 px-1">
              <button
                onClick={onOpenMailMergeModal}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md bg-[#185abd]/10 text-[#185abd] hover:bg-[#185abd]/15 text-[11px] font-semibold"
              >
                <Wand2 className="h-4 w-4" /> Start Mail Merge
              </button>
              <span className="text-[11px] text-muted-foreground">
                Embed merge fields <code className="bg-muted px-1 py-0.5 rounded font-mono text-[#185abd]">&#123;&#123;name&#125;&#125;</code> and batch-generate documents from CSV datasets.
              </span>
            </div>
          </RibbonGroup>
        )}

        {/* ──────── TAB: REVIEW ──────── */}
        {activeTab === 'review' && (
          <>
            <RibbonGroup label="Proofing">
              <button onClick={onOpenQualityModal} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" /> Editor Audit
              </button>
              <button onClick={onOpenWordCount} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <FileText className="h-4 w-4" /> Word Count
              </button>
            </RibbonGroup>

            <RibbonGroup label="Tracking & Compare">
              <button onClick={onCreateSnapshot} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <Camera className="h-4 w-4 text-sky-600" /> Snapshot
              </button>
              <button onClick={onOpenDiffModal} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <GitCompare className="h-4 w-4 text-[#185abd]" /> Compare
              </button>
            </RibbonGroup>

            <RibbonGroup label="Comments & Signatures">
              <button
                onClick={onToggleComments}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                  isCommentsOpen ? 'bg-[#185abd] text-white' : 'hover:bg-black/[0.05]'
                }`}
              >
                <MessageSquare className="h-4 w-4" /> Comments
              </button>
              <button onClick={onOpenApprovalModal} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <FileCheck className="h-4 w-4 text-indigo-600" /> Approvals
              </button>
              <button onClick={onOpenSignatureModal} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                <PenTool className="h-4 w-4 text-amber-600" /> Sign
              </button>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: VIEW ──────── */}
        {activeTab === 'view' && (
          <>
            <RibbonGroup label="Views">
              <div className="flex items-center gap-1">
                <button onClick={onOpenReadingMode} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                  <BookOpen className="h-4 w-4 text-[#185abd]" /> Read Mode
                </button>
                <button
                  onClick={() => onUpdateLayout({ viewMode: 'print' })}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                    (pageLayout?.viewMode || 'print') === 'print' ? 'bg-[#cfe4fa] text-[#185abd]' : 'hover:bg-black/[0.05]'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" /> Print Layout
                </button>
                <button
                  onClick={() => onUpdateLayout({ viewMode: 'web' })}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                    pageLayout?.viewMode === 'web' ? 'bg-[#cfe4fa] text-[#185abd]' : 'hover:bg-black/[0.05]'
                  }`}
                >
                  <Globe className="h-4 w-4" /> Web Layout
                </button>
                <button onClick={onOpenPresentationMode} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                  <Play className="h-4 w-4 text-emerald-600" /> Present
                </button>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Show">
              <label className="flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer">
                <input type="checkbox" checked={showRuler} onChange={(e) => setShowRuler(e.target.checked)} className="accent-[#185abd]" />
                <span>Ruler</span>
              </label>
              <label className="flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer">
                <input type="checkbox" checked={isOutlineOpen} onChange={onToggleOutline} className="accent-[#185abd]" />
                <span>Navigation Pane</span>
              </label>
              <label className="flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer">
                <input type="checkbox" checked={isDocDarkMode} onChange={(e) => setIsDocDarkMode(e.target.checked)} className="accent-[#185abd]" />
                <span>Dark Page</span>
              </label>
            </RibbonGroup>

            <RibbonGroup label="Zoom & Window">
              <div className="flex items-center gap-1">
                <button onClick={() => setZoomLevel(Math.max(0.5, Number((zoomLevel - 0.1).toFixed(2))))} className="px-2 py-1 rounded hover:bg-black/[0.06] text-xs font-bold">-</button>
                <span className="text-xs font-mono font-semibold w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(Math.min(2.0, Number((zoomLevel + 0.1).toFixed(2))))} className="px-2 py-1 rounded hover:bg-black/[0.06] text-xs font-bold">+</button>
                <button onClick={onToggleSplitView} className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md hover:bg-black/[0.05] text-[11px] font-medium">
                  <Rows className="h-4 w-4 text-indigo-600" /> Split
                </button>
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 rounded-md hover:bg-black/[0.06]" title="Focus Mode / Fullscreen">
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: TABLE DESIGN (Word 365 Contextual) ──────── */}
        {activeTab === 'table-design' && (
          <>
            <RibbonGroup label="Table Style Options">
              <button
                onClick={onToggleTableHeader}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-black/[0.05] text-xs font-medium"
                title="Toggle Table Header Row"
              >
                <Check className="h-3.5 w-3.5 text-[#185abd]" />
                <span>Header Row</span>
              </button>
            </RibbonGroup>

            <RibbonGroup label="Shading">
              <div className="flex items-center gap-1 px-1">
                {[
                  { label: 'Blue', color: '#eff6ff' },
                  { label: 'Slate', color: '#f1f5f9' },
                  { label: 'Emerald', color: '#ecfdf5' },
                  { label: 'Amber', color: '#fffbeb' },
                  { label: 'Rose', color: '#fff1f2' },
                  { label: 'Clear', color: 'transparent' },
                ].map((shade) => (
                  <button
                    key={shade.label}
                    onClick={() => onShadeCell?.(shade.color)}
                    style={{ backgroundColor: shade.color === 'transparent' ? '#ffffff' : shade.color }}
                    className="w-5 h-5 rounded border border-black/20 hover:scale-110 transition-transform shadow-2xs"
                    title={`Shade Cell: ${shade.label}`}
                  />
                ))}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Rows & Columns">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={onInsertRowAbove}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-black/[0.05] text-[10.5px] font-medium"
                  title="Insert Row Above"
                >
                  <Plus className="h-3.5 w-3.5 text-[#185abd]" />
                  <span>Insert Above</span>
                </button>
                <button
                  onClick={onInsertRowBelow}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-black/[0.05] text-[10.5px] font-medium"
                  title="Insert Row Below"
                >
                  <Plus className="h-3.5 w-3.5 text-[#185abd]" />
                  <span>Insert Below</span>
                </button>
                <button
                  onClick={onInsertColLeft}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-black/[0.05] text-[10.5px] font-medium"
                  title="Insert Column Left"
                >
                  <Plus className="h-3.5 w-3.5 text-[#185abd]" />
                  <span>Insert Left</span>
                </button>
                <button
                  onClick={onInsertColRight}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-black/[0.05] text-[10.5px] font-medium"
                  title="Insert Column Right"
                >
                  <Plus className="h-3.5 w-3.5 text-[#185abd]" />
                  <span>Insert Right</span>
                </button>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Delete">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={onDeleteRow}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-rose-50 text-rose-600 text-[10.5px] font-medium"
                  title="Delete Selected Row"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Row</span>
                </button>
                <button
                  onClick={onDeleteCol}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-rose-50 text-rose-600 text-[10.5px] font-medium"
                  title="Delete Selected Column"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Col</span>
                </button>
                <button
                  onClick={onDeleteTable}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-rose-50 text-rose-600 text-[10.5px] font-bold"
                  title="Delete Entire Table"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Table</span>
                </button>
              </div>
            </RibbonGroup>
          </>
        )}
      </div>
    </div>
  );
}
