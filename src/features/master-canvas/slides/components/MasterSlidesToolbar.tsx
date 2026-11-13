import React, { useState } from 'react';
import {
  Save,
  Download,
  Printer,
  Type,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Diamond,
  Cloud,
  Database,
  Image as ImageIcon,
  Table as TableIcon,
  BarChart3,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  Trash2,
  Copy,
  Layers,
  Clock,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  History,
  LayoutTemplate,
  FileSpreadsheet,
  ArrowLeft,
  Undo2,
  Redo2,
  Presentation,
  Play,
  MonitorPlay,
  Grid,
  Sparkles,
  ChevronDown,
  Scissors,
  Clipboard,
  Paintbrush,
  Search,
  Star,
  Heart,
  Palette,
  Maximize2,
  Check,
  PenTool,
  Eraser,
  Volume2,
  Sliders,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Move,
  Plus,
} from 'lucide-react';
import {
  MasterPresentationData,
  MasterSlide,
  MasterSlideObject,
  SlideAspect,
  SlideLayoutKind,
  SlideThemeId,
  ShapeKind,
  TransitionType,
  AnimationType,
} from '../types';
import { SlideTemplates } from '../services/SlideTemplates';
import { POWERPOINT_LAYOUTS } from '../services/SlideShapeRenderer';
import {
  SlideAnimationService,
  AnimationCatalogItem,
  TransitionCatalogItem,
} from '../services/SlideAnimationService';

export type SlideTabType =
  | 'HOME'
  | 'INSERT'
  | 'DRAW'
  | 'DESIGN'
  | 'TRANSITIONS'
  | 'ANIMATIONS'
  | 'SLIDESHOW'
  | 'REVIEW'
  | 'VIEW'
  | 'SHAPE_FORMAT'
  | 'TABLE_DESIGN'
  | 'FILE';

const PPT_FONTS = [
  { label: 'Aptos Display (Headings)', value: "'Aptos Display', 'Segoe UI', sans-serif" },
  { label: 'Aptos (Body)', value: "'Aptos', 'Segoe UI', sans-serif" },
  { label: 'Calibri', value: "'Calibri', 'Segoe UI', sans-serif" },
  { label: 'Bierstadt', value: "'Bierstadt', sans-serif" },
  { label: 'Segoe UI', value: "'Segoe UI', sans-serif" },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Georgia (Editorial)', value: 'Georgia, serif' },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
];

const PPT_FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 54, 60, 72, 80, 96];

const RibbonGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col justify-between px-2 border-r border-black/[0.08] dark:border-white/10 last:border-r-0 shrink-0 self-stretch">
    <div className="flex items-center gap-1 flex-1">{children}</div>
    <div className="text-[9.5px] leading-none text-muted-foreground/85 text-center pt-1 select-none font-medium tracking-tight">
      {label}
    </div>
  </div>
);

interface MasterSlidesToolbarProps {
  presentation: MasterPresentationData;
  activeSlide: MasterSlide;
  selectedObject: MasterSlideObject | null;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'offline' | 'syncing' | 'conflict';
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onBackToHome?: () => void;
  onOpenFileBackstage?: () => void;
  onUpdateTitle: (title: string) => void;
  onAddSlide: (layout?: SlideLayoutKind) => void;
  onAddObject: (type: MasterSlideObject['type'], shapeKind?: ShapeKind) => void;
  onUpdateSelectedObject: (updates: Partial<MasterSlideObject>) => void;
  onDeleteSelectedObject: () => void;
  onDuplicateSelectedObject: () => void;
  onChangeSlideTheme: (theme: SlideThemeId) => void;
  onChangeSlideLayout: (layout: SlideLayoutKind) => void;
  onChangeTransition: (type: TransitionType, duration: number, applyAll?: boolean, sound?: string) => void;
  onChangeAnimation: (animation: {
    type: AnimationType;
    trigger: 'on-click' | 'after-previous' | 'with-previous';
    durationMs?: number;
    delayMs?: number;
  }) => void;
  onChangeAspect: (aspect: SlideAspect) => void;
  onStartPresentation: (startFromCurrent?: boolean) => void;
  onOpenPresenterView: () => void;
  onOpenThemesModal: () => void;
  onOpenTemplatesModal: () => void;
  onOpenSorterModal: () => void;
  onOpenMasterView: () => void;
  onOpenHealthModal: () => void;
  onOpenVersionHistoryModal: () => void;
  onOpenHandoutModal: () => void;
  onOpenIntegrationsModal: () => void;
  onToggleLayersPanel: () => void;
  onToggleAnimationPane: () => void;
  onToggleComments: () => void;
  onToggleDesigner?: () => void;
  onExportPptx?: () => void;
  onExportHtml: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onSaveManual: () => void;
  onPreviewTransition?: () => void;
  onPreviewAnimation?: () => void;
  zoomLevel: number;
  onChangeZoom: (level: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showRulers: boolean;
  onToggleRulers: () => void;
  showNotesDrawer?: boolean;
  onToggleNotesDrawer?: () => void;

  // Draw Tab Props
  drawTool?: 'select' | 'pen' | 'highlighter' | 'eraser';
  onChangeDrawTool?: (tool: 'select' | 'pen' | 'highlighter' | 'eraser', color?: string, width?: number) => void;
  penColor?: string;
  penWidth?: number;
  onClearSlideInks?: () => void;

  // Animation Painter Props
  isAnimationPainterActive?: boolean;
  onToggleAnimationPainter?: () => void;

  // Contextual Arrange & Table Tools
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onRotateObject?: (deltaDeg: number) => void;
  onAlignObject?: (align: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onInsertTableRow?: (pos: 'above' | 'below') => void;
  onInsertTableCol?: (pos: 'left' | 'right') => void;
  onDeleteTableRow?: () => void;
  onDeleteTableCol?: () => void;
}

export function MasterSlidesToolbar({
  presentation,
  activeSlide,
  selectedObject,
  saveStatus,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onBackToHome,
  onOpenFileBackstage,
  onUpdateTitle,
  onAddSlide,
  onAddObject,
  onUpdateSelectedObject,
  onDeleteSelectedObject,
  onDuplicateSelectedObject,
  onChangeSlideTheme,
  onChangeSlideLayout,
  onChangeTransition,
  onChangeAnimation,
  onChangeAspect,
  onStartPresentation,
  onOpenPresenterView,
  onOpenThemesModal,
  onOpenTemplatesModal,
  onOpenSorterModal,
  onOpenMasterView,
  onOpenHealthModal,
  onOpenVersionHistoryModal,
  onOpenHandoutModal,
  onOpenIntegrationsModal,
  onToggleLayersPanel,
  onToggleAnimationPane,
  onToggleComments,
  onToggleDesigner,
  onExportPptx,
  onExportHtml,
  onExportPdf,
  onExportJson,
  onSaveManual,
  onPreviewTransition,
  onPreviewAnimation,
  zoomLevel,
  onChangeZoom,
  showGrid,
  onToggleGrid,
  showRulers,
  onToggleRulers,
  showNotesDrawer,
  onToggleNotesDrawer,
  drawTool = 'select',
  onChangeDrawTool,
  penColor = '#B7472A',
  penWidth = 2,
  onClearSlideInks,
  isAnimationPainterActive = false,
  onToggleAnimationPainter,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onRotateObject,
  onAlignObject,
  onInsertTableRow,
  onInsertTableCol,
  onDeleteTableRow,
  onDeleteTableCol,
}: MasterSlidesToolbarProps) {
  const [activeTab, setActiveTab] = useState<SlideTabType>('HOME');
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [isCaseMenuOpen, setIsCaseMenuOpen] = useState(false);
  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);
  const [tableGridHover, setTableGridHover] = useState({ r: 3, c: 3 });

  // Filter tabs for animations and transitions
  const [animCategoryFilter, setAnimCategoryFilter] = useState<'All' | 'Entrance' | 'Emphasis' | 'Exit' | 'Motion Paths'>('All');
  const [transCategoryFilter, setTransCategoryFilter] = useState<'All' | 'Subtle' | 'Exciting' | 'Dynamic Content'>('All');

  const themes = SlideTemplates.getThemes();
  const format = selectedObject?.format || {};
  const currentAnim = selectedObject?.animation || {
    type: 'none',
    trigger: 'on-click',
    durationMs: 500,
    delayMs: 0,
  };
  const currentTransition = activeSlide.transition || {
    type: 'fade',
    durationSeconds: 0.5,
  };

  const animCatalog = SlideAnimationService.getAnimationCatalog();
  const transCatalog = SlideAnimationService.getTransitionCatalog();

  const filteredAnimations =
    animCategoryFilter === 'All'
      ? animCatalog
      : animCatalog.filter((a) => a.category === animCategoryFilter);

  const filteredTransitions =
    transCategoryFilter === 'All'
      ? transCatalog
      : transCatalog.filter((t) => t.category === transCategoryFilter);

  const standardTabs: { id: SlideTabType; label: string }[] = [
    { id: 'HOME', label: 'Home' },
    { id: 'INSERT', label: 'Insert' },
    { id: 'DRAW', label: 'Draw' },
    { id: 'DESIGN', label: 'Design' },
    { id: 'TRANSITIONS', label: 'Transitions' },
    { id: 'ANIMATIONS', label: 'Animations' },
    { id: 'SLIDESHOW', label: 'Slide Show' },
    { id: 'REVIEW', label: 'Review' },
    { id: 'VIEW', label: 'View' },
  ];

  const wordBtn = (active = false) =>
    `p-1 rounded transition-colors ${
      active
        ? 'bg-[#fadad1] text-[#B7472A] dark:bg-[#B7472A]/30 dark:text-orange-300 font-semibold'
        : 'hover:bg-black/[0.06] dark:hover:bg-white/10 text-foreground/80 hover:text-foreground'
    }`;

  const stepFontSize = (delta: number) => {
    const current = format.fontSize || 20;
    const idx = PPT_FONT_SIZES.findIndex((s) => s >= current);
    const safeIdx = idx === -1 ? PPT_FONT_SIZES.indexOf(20) : idx;
    const nextIdx = Math.max(0, Math.min(PPT_FONT_SIZES.length - 1, safeIdx + delta));
    onUpdateSelectedObject({ format: { ...format, fontSize: PPT_FONT_SIZES[nextIdx] } });
  };

  const handleTransformCase = (mode: 'sentence' | 'lower' | 'upper' | 'capitalize') => {
    if (!selectedObject || selectedObject.type !== 'text') return;
    const text = selectedObject.content;
    let transformed = text;
    if (mode === 'lower') transformed = text.toLowerCase();
    else if (mode === 'upper') transformed = text.toUpperCase();
    else if (mode === 'capitalize') {
      transformed = text.replace(/\b\w/g, (c) => c.toUpperCase());
    } else if (mode === 'sentence') {
      transformed = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
    onUpdateSelectedObject({ content: transformed });
    setIsCaseMenuOpen(false);
  };

  return (
    <div className="flex flex-col bg-[#f3f2f1] dark:bg-slate-900 border-b border-black/[0.08] dark:border-border shrink-0 select-none z-20">
      {/* ── 1. PowerPoint 365 Windows 11 Title Bar & QAT ─────────────── */}
      <header className="h-9 px-3 flex items-center justify-between gap-3">
        {/* Left: Back + PowerPoint 'P' Badge + QAT + Document Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="p-1 rounded-md text-muted-foreground hover:bg-black/[0.06] dark:hover:bg-white/10 hover:text-foreground transition-colors"
              title="Back to Slides Home"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}

          <div
            className="h-6 w-6 rounded bg-[#B7472A] text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 select-none"
            title="Microsoft PowerPoint Engine (Master Cloud)"
          >
            P
          </div>

          {/* Quick Access Toolbar */}
          <div className="flex items-center gap-0.5 px-1 border-r border-black/[0.08] dark:border-border/80 pr-2">
            <button
              type="button"
              onClick={onSaveManual}
              className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/10 transition-colors"
              title="Save (Ctrl+S)"
            >
              <Save className="h-3.5 w-3.5 text-[#B7472A] dark:text-orange-400" />
            </button>
            {onUndo && (
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
            )}
            {onRedo && (
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onStartPresentation(false)}
              className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/10 transition-colors"
              title="Start From Beginning (F5)"
            >
              <Presentation className="h-3.5 w-3.5 text-[#B7472A] dark:text-orange-400" />
            </button>
          </div>

          <input
            type="text"
            value={presentation.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="font-semibold text-xs sm:text-sm bg-transparent border border-transparent hover:border-black/15 focus:border-[#B7472A] focus:bg-white dark:focus:bg-slate-800 rounded px-1.5 py-0.5 max-w-[200px] sm:max-w-xs transition-colors text-foreground truncate"
            placeholder="Untitled Presentation"
          />

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground pl-1">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Clock className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Saved
              </span>
            )}
            {saveStatus === 'offline' && (
              <span className="text-amber-600 dark:text-amber-400">Offline Draft</span>
            )}
          </div>
        </div>

        {/* Right: Designer / Presenter / Present F5 */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleDesigner && (
            <button
              type="button"
              onClick={onToggleDesigner}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-card border border-black/10 dark:border-border text-xs font-semibold text-[#B7472A] dark:text-orange-400 hover:bg-orange-50/70 transition-colors shadow-2xs"
              title="PowerPoint Designer (Slide Ideas)"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Designer</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPresenterView}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium hover:bg-black/[0.05] dark:hover:bg-white/10 text-foreground transition-colors"
            title="Presenter Studio View"
          >
            <MonitorPlay className="h-3.5 w-3.5" />
            <span>Presenter View</span>
          </button>

          {onExportPptx && (
            <button
              type="button"
              onClick={onExportPptx}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-md border border-black/10 dark:border-border bg-white/80 dark:bg-slate-800 hover:bg-white text-xs font-medium text-foreground transition-colors"
              title="Download PowerPoint (.pptx)"
            >
              <Download className="h-3.5 w-3.5 text-[#B7472A]" />
              <span>.pptx</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onStartPresentation(false)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#B7472A] hover:bg-[#9c3a20] text-white text-xs font-semibold transition-all shadow-2xs active:scale-95"
            title="Start Slide Show (F5)"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Present</span>
          </button>
        </div>
      </header>

      {/* ── 2. PowerPoint Ribbon Tabs Strip ─────────────────────────── */}
      <div className="flex items-center gap-0.5 px-3 pt-0.5 pb-1">
        <button
          type="button"
          onClick={() => (onOpenFileBackstage ? onOpenFileBackstage() : setActiveTab('FILE'))}
          className="px-3.5 py-1 rounded bg-[#B7472A] hover:bg-[#9c3a20] text-white text-xs font-bold mr-1.5 transition-colors shadow-2xs"
        >
          File
        </button>

        {standardTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-xs rounded transition-all relative ${
                isActive
                  ? 'font-semibold text-foreground after:absolute after:bottom-0 after:left-2.5 after:right-2.5 after:h-[2.5px] after:bg-[#B7472A] after:rounded-full'
                  : 'font-normal text-foreground/75 hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Contextual Tab 1: Shape Format */}
        {selectedObject && (selectedObject.type === 'shape' || selectedObject.type === 'text' || selectedObject.type === 'button') && (
          <button
            type="button"
            onClick={() => setActiveTab('SHAPE_FORMAT')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all border ${
              activeTab === 'SHAPE_FORMAT'
                ? 'bg-[#B7472A] text-white border-[#B7472A]'
                : 'text-[#B7472A] dark:text-orange-400 border-[#B7472A]/40 bg-[#B7472A]/10 hover:bg-[#B7472A]/20'
            }`}
          >
            Shape Format
          </button>
        )}

        {/* Contextual Tab 2: Table Design */}
        {selectedObject && selectedObject.type === 'table' && (
          <button
            type="button"
            onClick={() => setActiveTab('TABLE_DESIGN')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all border ${
              activeTab === 'TABLE_DESIGN'
                ? 'bg-[#156082] text-white border-[#156082]'
                : 'text-[#156082] dark:text-cyan-400 border-[#156082]/40 bg-[#156082]/10 hover:bg-[#156082]/20'
            }`}
          >
            Table Design
          </button>
        )}
      </div>

      {/* ── 3. Authentic Fluent Ribbon Group Cards ───────────────────── */}
      <div className="mx-2 mb-2 rounded-xl bg-white dark:bg-card border border-black/[0.08] dark:border-border shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-1.5 py-1.5 flex items-stretch overflow-x-auto min-h-[78px]">
        {/* ──────── TAB: HOME ──────── */}
        {activeTab === 'HOME' && (
          <>
            <RibbonGroup label="Clipboard">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`${wordBtn(false)} disabled:opacity-30`}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`${wordBtn(false)} disabled:opacity-30`}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="h-4 w-4" />
                </button>
                {selectedObject && (
                  <button
                    type="button"
                    onClick={onDuplicateSelectedObject}
                    className={wordBtn(false)}
                    title="Duplicate (Ctrl+D)"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Slides">
              <div className="flex items-center gap-1.5 relative">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => onAddSlide('title-content')}
                    className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-black/[0.05] dark:hover:bg-white/10 text-foreground transition-colors"
                    title="Add Slide (Ctrl+M)"
                  >
                    <div className="w-5 h-4 border border-[#B7472A] rounded-xs flex items-center justify-center bg-[#B7472A]/10 text-[#B7472A] font-bold text-[9px]">
                      +
                    </div>
                    <span className="text-[10px] font-semibold mt-0.5">New Slide</span>
                  </button>
                </div>

                <div className="relative flex flex-col justify-center">
                  <button
                    type="button"
                    onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-black/10 dark:border-border hover:bg-accent text-[11px] font-medium"
                    title="Change Slide Layout"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5 text-[#B7472A]" />
                    <span>Layout</span>
                    <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                  </button>

                  {isLayoutMenuOpen && (
                    <div className="absolute top-10 left-0 z-50 w-72 p-2 bg-white dark:bg-slate-900 border border-black/15 dark:border-white/15 rounded-xl shadow-2xl grid grid-cols-2 gap-1.5 text-xs">
                      {POWERPOINT_LAYOUTS.map((layout) => (
                        <button
                          key={layout.id}
                          type="button"
                          onClick={() => {
                            onChangeSlideLayout(layout.id);
                            setIsLayoutMenuOpen(false);
                          }}
                          className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all ${
                            activeSlide.layout === layout.id
                              ? 'border-[#B7472A] bg-[#B7472A]/10 font-bold'
                              : 'border-black/10 dark:border-white/10 hover:bg-accent'
                          }`}
                        >
                          <span className="text-[11px] font-semibold text-foreground truncate w-full">
                            {layout.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground line-clamp-1">
                            {layout.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Font">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <select
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    value={format.fontFamily || "'Aptos', 'Segoe UI', sans-serif"}
                    onChange={(e) =>
                      onUpdateSelectedObject({
                        format: { ...format, fontFamily: e.target.value },
                      })
                    }
                    className="h-6 px-1.5 rounded border border-black/15 dark:border-border bg-white dark:bg-background text-[11px] focus:outline-none focus:border-[#B7472A] w-[140px] disabled:opacity-40"
                    title="Font"
                  >
                    {PPT_FONTS.map((f) => (
                      <option key={f.label} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <select
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    value={format.fontSize || 20}
                    onChange={(e) =>
                      onUpdateSelectedObject({
                        format: { ...format, fontSize: parseInt(e.target.value, 10) },
                      })
                    }
                    className="h-6 px-1 rounded border border-black/15 dark:border-border bg-white dark:bg-background text-[11px] focus:outline-none focus:border-[#B7472A] w-[56px] disabled:opacity-40"
                    title="Font Size"
                  >
                    {PPT_FONT_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size} pt
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => stepFontSize(1)}
                    className="px-1.5 py-0.5 rounded hover:bg-black/[0.06] text-[11px] font-bold disabled:opacity-40"
                    title="Increase Font Size"
                  >
                    A<sup className="text-[8px]">▲</sup>
                  </button>
                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => stepFontSize(-1)}
                    className="px-1.5 py-0.5 rounded hover:bg-black/[0.06] text-[10px] font-bold disabled:opacity-40"
                    title="Decrease Font Size"
                  >
                    A<sup className="text-[7px]">▼</sup>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      disabled={!selectedObject || selectedObject.type !== 'text'}
                      onClick={() => setIsCaseMenuOpen(!isCaseMenuOpen)}
                      className="px-1.5 py-0.5 rounded hover:bg-black/[0.06] text-[11px] font-medium flex items-center gap-0.5 disabled:opacity-40"
                      title="Change Case"
                    >
                      <span>Aa</span>
                      <ChevronDown className="h-2 w-2 opacity-60" />
                    </button>
                    {isCaseMenuOpen && (
                      <div className="absolute top-7 left-0 z-50 w-40 rounded-lg bg-white dark:bg-card border border-black/10 dark:border-border shadow-xl py-1 text-xs">
                        <button type="button" onClick={() => handleTransformCase('sentence')} className="w-full text-left px-3 py-1 hover:bg-accent text-foreground">Sentence case.</button>
                        <button type="button" onClick={() => handleTransformCase('lower')} className="w-full text-left px-3 py-1 hover:bg-accent text-foreground">lowercase</button>
                        <button type="button" onClick={() => handleTransformCase('upper')} className="w-full text-left px-3 py-1 hover:bg-accent text-foreground">UPPERCASE</button>
                        <button type="button" onClick={() => handleTransformCase('capitalize')} className="w-full text-left px-3 py-1 hover:bg-accent text-foreground">Capitalize Each Word</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => onUpdateSelectedObject({ format: { ...format, bold: !format.bold } })}
                    className={`${wordBtn(format.bold)} disabled:opacity-40`}
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => onUpdateSelectedObject({ format: { ...format, italic: !format.italic } })}
                    className={`${wordBtn(format.italic)} disabled:opacity-40`}
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => onUpdateSelectedObject({ format: { ...format, underline: !format.underline } })}
                    className={`${wordBtn(format.underline)} disabled:opacity-40`}
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => onUpdateSelectedObject({ format: { ...format, strikethrough: !format.strikethrough } })}
                    className={`${wordBtn(format.strikethrough)} disabled:opacity-40`}
                    title="Strikethrough"
                  >
                    <Strikethrough className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => onUpdateSelectedObject({ format: { ...format, shadow: !format.shadow } })}
                    className={`${wordBtn(format.shadow)} font-bold font-serif text-xs px-1.5 disabled:opacity-40`}
                    title="Text Shadow (PowerPoint S)"
                  >
                    S
                  </button>

                  <div className="h-4 w-px bg-black/10 mx-1" />

                  <label className="flex items-center gap-0.5 cursor-pointer px-1 py-0.5 rounded hover:bg-black/[0.06]" title="Font Color">
                    <span className="font-bold text-xs text-foreground border-b-2 border-[#B7472A] leading-none">A</span>
                    <input
                      type="color"
                      value={format.textColor || '#0E2841'}
                      onChange={(e) => onUpdateSelectedObject({ format: { ...format, textColor: e.target.value } })}
                      className="w-3.5 h-3.5 rounded cursor-pointer border-0 p-0"
                    />
                  </label>

                  <label className="flex items-center gap-0.5 cursor-pointer px-1 py-0.5 rounded hover:bg-black/[0.06]" title="Highlight Color">
                    <span className="px-1 bg-yellow-300 rounded text-slate-900 font-bold text-[9px]">ab</span>
                    <input
                      type="color"
                      value={format.highlightColor || '#fef08a'}
                      onChange={(e) => onUpdateSelectedObject({ format: { ...format, highlightColor: e.target.value } })}
                      className="w-3.5 h-3.5 rounded cursor-pointer border-0 p-0"
                    />
                  </label>
                </div>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Paragraph">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => {
                      if (!selectedObject) return;
                      const lines = selectedObject.content.split('\n');
                      const bulleted = lines.map((l) => (l.startsWith('• ') ? l.slice(2) : `• ${l}`)).join('\n');
                      onUpdateSelectedObject({ content: bulleted });
                    }}
                    className={`${wordBtn(false)} disabled:opacity-40`}
                    title="Bullets"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => {
                      if (!selectedObject) return;
                      const lines = selectedObject.content.split('\n');
                      const numbered = lines.map((l, i) => `${i + 1}. ${l.replace(/^\d+\.\s*/, '').replace(/^•\s*/, '')}`).join('\n');
                      onUpdateSelectedObject({ content: numbered });
                    }}
                    className={`${wordBtn(false)} disabled:opacity-40`}
                    title="Numbering"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" disabled={!selectedObject || selectedObject.type !== 'text'} className={`${wordBtn(false)} disabled:opacity-40`} title="Decrease List Level">
                    <IndentDecrease className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" disabled={!selectedObject || selectedObject.type !== 'text'} className={`${wordBtn(false)} disabled:opacity-40`} title="Increase List Level">
                    <IndentIncrease className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => onUpdateSelectedObject({ format: { ...format, align: 'left' } })}
                    className={`${wordBtn(format.align === 'left' || !format.align)} disabled:opacity-40`}
                    title="Align Left"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => onUpdateSelectedObject({ format: { ...format, align: 'center' } })}
                    className={`${wordBtn(format.align === 'center')} disabled:opacity-40`}
                    title="Center"
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => onUpdateSelectedObject({ format: { ...format, align: 'right' } })}
                    className={`${wordBtn(format.align === 'right')} disabled:opacity-40`}
                    title="Align Right"
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!selectedObject || selectedObject.type !== 'text'}
                    onClick={() => onUpdateSelectedObject({ format: { ...format, align: 'justify' } })}
                    className={`${wordBtn(format.align === 'justify')} disabled:opacity-40`}
                    title="Justify"
                  >
                    <AlignJustify className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Drawing">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAddObject('text')}
                  className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-black/[0.05] dark:hover:bg-white/10 text-xs font-medium"
                  title="Draw Text Box"
                >
                  <Type className="h-4 w-4 text-[#B7472A]" />
                  <span className="text-[10px] mt-0.5">Text Box</span>
                </button>

                <div className="grid grid-cols-4 gap-0.5 p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded border border-black/10 dark:border-border">
                  <button type="button" onClick={() => onAddObject('shape', 'rectangle')} className="p-1 hover:bg-accent rounded" title="Rectangle"><Square className="h-3 w-3" /></button>
                  <button type="button" onClick={() => onAddObject('shape', 'circle')} className="p-1 hover:bg-accent rounded" title="Oval / Circle"><Circle className="h-3 w-3" /></button>
                  <button type="button" onClick={() => onAddObject('shape', 'triangle')} className="p-1 hover:bg-accent rounded" title="Triangle"><Triangle className="h-3 w-3" /></button>
                  <button type="button" onClick={() => onAddObject('shape', 'diamond')} className="p-1 hover:bg-accent rounded" title="Diamond"><Diamond className="h-3 w-3" /></button>
                  <button type="button" onClick={() => onAddObject('shape', 'arrow-right')} className="p-1 hover:bg-accent rounded" title="Arrow Right"><ArrowRight className="h-3 w-3 text-emerald-500" /></button>
                  <button type="button" onClick={() => onAddObject('shape', 'star')} className="p-1 hover:bg-accent rounded" title="5-Point Star"><Star className="h-3 w-3 text-amber-500" /></button>
                  <button type="button" onClick={() => onAddObject('shape', 'cloud')} className="p-1 hover:bg-accent rounded" title="Cloud"><Cloud className="h-3 w-3 text-sky-500" /></button>
                  <button type="button" onClick={() => onAddObject('shape', 'database')} className="p-1 hover:bg-accent rounded" title="Cylinder"><Database className="h-3 w-3 text-indigo-500" /></button>
                </div>

                <div className="flex flex-col gap-1 text-[10px]">
                  <label className="flex items-center gap-1 cursor-pointer" title="Shape Fill Color">
                    <span className="w-9 font-medium text-muted-foreground">Fill:</span>
                    <input
                      type="color"
                      value={format.fillColor || '#156082'}
                      onChange={(e) => onUpdateSelectedObject({ format: { ...format, fillColor: e.target.value } })}
                      className="w-4 h-4 rounded cursor-pointer border border-black/20 p-0"
                    />
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer" title="Shape Outline Color">
                    <span className="w-9 font-medium text-muted-foreground">Outline:</span>
                    <input
                      type="color"
                      value={format.strokeColor || '#0E2841'}
                      onChange={(e) =>
                        onUpdateSelectedObject({
                          format: { ...format, strokeColor: e.target.value, strokeWidth: format.strokeWidth || 1 },
                        })
                      }
                      className="w-4 h-4 rounded cursor-pointer border border-black/20 p-0"
                    />
                  </label>
                </div>

                {selectedObject && (
                  <div className="flex items-center gap-1 pl-1 border-l border-black/10">
                    <button
                      type="button"
                      onClick={onDeleteSelectedObject}
                      className="p-1.5 rounded hover:bg-rose-50 text-rose-600 border border-rose-200"
                      title="Delete Object"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Editing">
              <button
                type="button"
                onClick={onToggleLayersPanel}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent text-xs font-medium text-foreground"
                title="Selection Pane"
              >
                <Layers className="h-3.5 w-3.5 text-blue-500" />
                <span>Select</span>
              </button>
            </RibbonGroup>

            {onToggleDesigner && (
              <RibbonGroup label="Designer">
                <button
                  type="button"
                  onClick={onToggleDesigner}
                  className="flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-orange-50/70 text-[#B7472A] transition-colors"
                  title="Design Ideas"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[10px] font-bold mt-0.5">Design Ideas</span>
                </button>
              </RibbonGroup>
            )}
          </>
        )}

        {/* ──────── TAB: INSERT ──────── */}
        {activeTab === 'INSERT' && (
          <>
            <RibbonGroup label="Slides">
              <button
                type="button"
                onClick={() => onAddSlide('title-content')}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs font-medium"
              >
                <div className="w-5 h-4 border border-[#B7472A] rounded-xs flex items-center justify-center bg-[#B7472A]/10 text-[#B7472A] font-bold text-[9px]">+</div>
                <span className="text-[10px] mt-0.5">New Slide</span>
              </button>
            </RibbonGroup>

            <RibbonGroup label="Tables">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTablePickerOpen(!isTablePickerOpen)}
                  className="flex flex-col items-center px-2.5 py-1 rounded hover:bg-accent text-xs font-medium"
                >
                  <TableIcon className="h-4 w-4 text-indigo-500" />
                  <span className="text-[10px] mt-0.5">Table</span>
                </button>

                {isTablePickerOpen && (
                  <div className="absolute top-12 left-0 z-50 p-3 bg-white dark:bg-slate-900 border border-black/15 dark:border-white/15 rounded-xl shadow-2xl flex flex-col gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Insert Table ({tableGridHover.c}x{tableGridHover.r})
                    </span>
                    <div className="grid grid-cols-6 gap-1">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const r = Math.floor(i / 6) + 1;
                        const c = (i % 6) + 1;
                        const active = r <= tableGridHover.r && c <= tableGridHover.c;
                        return (
                          <div
                            key={i}
                            onMouseEnter={() => setTableGridHover({ r, c })}
                            onClick={() => {
                              onAddObject('table');
                              setIsTablePickerOpen(false);
                            }}
                            className={`w-4 h-4 border rounded-xs cursor-pointer transition-colors ${
                              active
                                ? 'bg-[#156082] border-[#156082]'
                                : 'border-black/20 hover:border-[#156082]'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Images">
              <button
                type="button"
                onClick={() => onAddObject('image')}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs font-medium"
              >
                <ImageIcon className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] mt-0.5">Pictures</span>
              </button>
            </RibbonGroup>

            <RibbonGroup label="Illustrations">
              <button
                type="button"
                onClick={() => onAddObject('shape', 'rectangle')}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs font-medium"
              >
                <Square className="h-4 w-4 text-blue-500" />
                <span className="text-[10px] mt-0.5">Shapes</span>
              </button>
              <button
                type="button"
                onClick={() => onAddObject('chart')}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs font-medium"
              >
                <BarChart3 className="h-4 w-4 text-cyan-500" />
                <span className="text-[10px] mt-0.5">Chart</span>
              </button>
            </RibbonGroup>

            <RibbonGroup label="Text">
              <button
                type="button"
                onClick={() => onAddObject('text')}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs font-medium"
              >
                <Type className="h-4 w-4 text-[#B7472A]" />
                <span className="text-[10px] mt-0.5">Text Box</span>
              </button>
              <button
                type="button"
                onClick={onOpenIntegrationsModal}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs font-medium text-[#B7472A]"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="text-[10px] mt-0.5">Cloud Data</span>
              </button>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: DRAW (PowerPoint Inking Studio) ──────── */}
        {activeTab === 'DRAW' && (
          <>
            <RibbonGroup label="Tools">
              <button
                type="button"
                onClick={() => onChangeDrawTool && onChangeDrawTool('select')}
                className={`p-1.5 rounded flex flex-col items-center ${
                  drawTool === 'select' ? 'bg-[#fadad1] text-[#B7472A] font-bold' : 'hover:bg-accent'
                }`}
                title="Select Mode"
              >
                <Move className="h-4 w-4" />
                <span className="text-[9px] mt-0.5">Select</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeDrawTool && onChangeDrawTool('eraser')}
                className={`p-1.5 rounded flex flex-col items-center ${
                  drawTool === 'eraser' ? 'bg-[#fadad1] text-[#B7472A] font-bold' : 'hover:bg-accent'
                }`}
                title="Eraser"
              >
                <Eraser className="h-4 w-4 text-amber-600" />
                <span className="text-[9px] mt-0.5">Eraser</span>
              </button>
            </RibbonGroup>

            <RibbonGroup label="Pens">
              <div className="flex items-center gap-1.5">
                {/* Black Pen */}
                <button
                  type="button"
                  onClick={() => onChangeDrawTool && onChangeDrawTool('pen', '#0F172A', 2)}
                  className={`flex flex-col items-center p-1 rounded border ${
                    drawTool === 'pen' && penColor === '#0F172A' ? 'border-[#B7472A] bg-[#B7472A]/10 font-bold' : 'border-transparent hover:bg-accent'
                  }`}
                  title="Black Pen"
                >
                  <div className="w-3.5 h-6 rounded-t bg-slate-900 border border-slate-700 shadow-2xs" />
                  <span className="text-[8.5px] mt-0.5">Black</span>
                </button>

                {/* Red / PowerPoint Pen */}
                <button
                  type="button"
                  onClick={() => onChangeDrawTool && onChangeDrawTool('pen', '#B7472A', 2)}
                  className={`flex flex-col items-center p-1 rounded border ${
                    drawTool === 'pen' && penColor === '#B7472A' ? 'border-[#B7472A] bg-[#B7472A]/10 font-bold' : 'border-transparent hover:bg-accent'
                  }`}
                  title="PowerPoint Red Pen"
                >
                  <div className="w-3.5 h-6 rounded-t bg-[#B7472A] border border-red-700 shadow-2xs" />
                  <span className="text-[8.5px] mt-0.5">Red</span>
                </button>

                {/* Blue Pen */}
                <button
                  type="button"
                  onClick={() => onChangeDrawTool && onChangeDrawTool('pen', '#2563eb', 2)}
                  className={`flex flex-col items-center p-1 rounded border ${
                    drawTool === 'pen' && penColor === '#2563eb' ? 'border-[#B7472A] bg-[#B7472A]/10 font-bold' : 'border-transparent hover:bg-accent'
                  }`}
                  title="Blue Pen"
                >
                  <div className="w-3.5 h-6 rounded-t bg-blue-600 border border-blue-700 shadow-2xs" />
                  <span className="text-[8.5px] mt-0.5">Blue</span>
                </button>

                {/* Galaxy Pen */}
                <button
                  type="button"
                  onClick={() => onChangeDrawTool && onChangeDrawTool('pen', '#8b5cf6', 3)}
                  className={`flex flex-col items-center p-1 rounded border ${
                    drawTool === 'pen' && penColor === '#8b5cf6' ? 'border-[#B7472A] bg-[#B7472A]/10 font-bold' : 'border-transparent hover:bg-accent'
                  }`}
                  title="Galaxy Pen"
                >
                  <div className="w-3.5 h-6 rounded-t bg-gradient-to-b from-purple-500 via-pink-500 to-cyan-400 border border-purple-600 shadow-2xs" />
                  <span className="text-[8.5px] mt-0.5">Galaxy</span>
                </button>

                {/* Yellow Highlighter */}
                <button
                  type="button"
                  onClick={() => onChangeDrawTool && onChangeDrawTool('highlighter', '#fde047', 12)}
                  className={`flex flex-col items-center p-1 rounded border ${
                    drawTool === 'highlighter' ? 'border-[#B7472A] bg-[#B7472A]/10 font-bold' : 'border-transparent hover:bg-accent'
                  }`}
                  title="Yellow Highlighter"
                >
                  <div className="w-4 h-6 rounded-t bg-yellow-300 border border-yellow-500 opacity-80 shadow-2xs" />
                  <span className="text-[8.5px] mt-0.5">Highlighter</span>
                </button>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Stroke">
              <div className="flex flex-col gap-1 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Width:</span>
                  {[1, 2, 4, 8].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => onChangeDrawTool && onChangeDrawTool(drawTool, penColor, w)}
                      className={`px-1.5 py-0.5 rounded border text-[9.5px] ${
                        penWidth === w ? 'bg-[#B7472A] text-white border-[#B7472A] font-bold' : 'border-black/10 hover:bg-accent'
                      }`}
                    >
                      {w}px
                    </button>
                  ))}
                </div>
                {onClearSlideInks && (
                  <button
                    type="button"
                    onClick={onClearSlideInks}
                    className="text-left text-rose-600 hover:underline text-[9.5px] font-medium"
                  >
                    Clear All Inks on Slide
                  </button>
                )}
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: DESIGN ──────── */}
        {activeTab === 'DESIGN' && (
          <>
            <RibbonGroup label="Themes">
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-0.5">
                {themes.map((theme) => {
                  const isActive = activeSlide.bgTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => onChangeSlideTheme(theme.id)}
                      className={`flex flex-col items-center p-1 rounded-md border transition-all ${
                        isActive
                          ? 'border-[#B7472A] ring-2 ring-[#B7472A]/30 font-bold bg-[#B7472A]/5'
                          : 'border-black/10 dark:border-white/10 hover:border-black/30'
                      }`}
                    >
                      <div className={`w-14 h-8 rounded-xs ${theme.bgGradient} border border-black/10 shadow-2xs flex flex-col justify-between p-1`}>
                        <div className="h-1.5 w-6 rounded-2xs" style={{ backgroundColor: theme.accentColor }} />
                        <div className="h-1 w-8 rounded-2xs opacity-60" style={{ backgroundColor: theme.textColor }} />
                      </div>
                      <span className="text-[9px] truncate max-w-[56px] mt-0.5 text-foreground">{theme.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Customize">
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Size:</span>
                  <button
                    type="button"
                    onClick={() => onChangeAspect('16:9')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      presentation.aspectRatio === '16:9' ? 'bg-[#B7472A] text-white border-[#B7472A]' : 'border-border text-muted-foreground'
                    }`}
                  >
                    16:9 Widescreen
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeAspect('4:3')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      presentation.aspectRatio === '4:3' ? 'bg-[#B7472A] text-white border-[#B7472A]' : 'border-border text-muted-foreground'
                    }`}
                  >
                    4:3 Standard
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onOpenMasterView}
                  className="flex items-center gap-1 text-[11px] font-medium text-foreground hover:text-[#B7472A]"
                >
                  <LayoutTemplate className="h-3 w-3 text-[#B7472A]" />
                  <span>Edit Slide Master</span>
                </button>
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: TRANSITIONS (Full PowerPoint Gallery Strip) ──────── */}
        {activeTab === 'TRANSITIONS' && (
          <>
            <RibbonGroup label="Preview">
              <button
                type="button"
                onClick={onPreviewTransition}
                className="flex flex-col items-center px-3 py-1 rounded bg-[#B7472A] hover:bg-[#9c3a20] text-white text-xs font-semibold shadow-2xs"
              >
                <Play className="h-4 w-4 fill-current" />
                <span className="text-[10px] mt-0.5">Preview</span>
              </button>
            </RibbonGroup>

            <RibbonGroup label="Transition to This Slide">
              <div className="flex flex-col gap-1">
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 text-[9px] mb-0.5">
                  {(['All', 'Subtle', 'Exciting', 'Dynamic Content'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTransCategoryFilter(cat)}
                      className={`px-1.5 py-0.5 rounded-xs transition-colors ${
                        transCategoryFilter === cat
                          ? 'bg-[#B7472A] text-white font-bold'
                          : 'bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Gallery Cards Strip */}
                <div className="flex items-center gap-1 overflow-x-auto max-w-xl pb-1 scrollbar-thin">
                  {filteredTransitions.map((t) => {
                    const isActive = currentTransition.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onChangeTransition(t.id, currentTransition.durationSeconds || 0.5, false);
                          onPreviewTransition && onPreviewTransition();
                        }}
                        className={`px-2 py-1.5 rounded-md border text-center transition-all shrink-0 flex flex-col items-center min-w-[70px] ${
                          isActive
                            ? 'border-[#B7472A] bg-[#B7472A]/10 text-[#B7472A] font-bold shadow-2xs'
                            : 'border-black/10 dark:border-white/10 hover:border-black/25 bg-card'
                        }`}
                        title={t.description}
                      >
                        <Sparkles className={`h-3.5 w-3.5 mb-0.5 ${isActive ? 'text-[#B7472A]' : 'text-muted-foreground'}`} />
                        <span className="text-[10px] truncate max-w-[64px] font-medium leading-none">
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Timing & Options">
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-[10px]">Duration:</span>
                  <select
                    value={currentTransition.durationSeconds || 0.5}
                    onChange={(e) =>
                      onChangeTransition(currentTransition.type, parseFloat(e.target.value), false)
                    }
                    className="h-5 px-1 rounded border border-black/15 bg-background text-[10px]"
                  >
                    <option value="0.25">0.25s</option>
                    <option value="0.5">0.50s</option>
                    <option value="0.75">0.75s</option>
                    <option value="1.0">1.00s</option>
                    <option value="1.5">1.50s</option>
                    <option value="2.0">2.00s</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChangeTransition(
                      currentTransition.type,
                      currentTransition.durationSeconds || 0.5,
                      true
                    )
                  }
                  className="px-2 py-0.5 rounded border border-black/15 hover:bg-accent text-[10px] font-medium"
                >
                  Apply To All Slides
                </button>
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: ANIMATIONS (Full Categorized Star Gallery) ──────── */}
        {activeTab === 'ANIMATIONS' && (
          <>
            <RibbonGroup label="Preview">
              <button
                type="button"
                disabled={!selectedObject || currentAnim.type === 'none'}
                onClick={onPreviewAnimation}
                className="flex flex-col items-center px-3 py-1 rounded bg-[#B7472A] hover:bg-[#9c3a20] text-white text-xs font-semibold shadow-2xs disabled:opacity-40"
              >
                <Play className="h-4 w-4 fill-current" />
                <span className="text-[10px] mt-0.5">Preview</span>
              </button>
            </RibbonGroup>

            {/* Animation Star Gallery Strip */}
            <RibbonGroup label="Animation Gallery">
              <div className="flex flex-col gap-1">
                {/* Category Pills */}
                <div className="flex items-center gap-1 text-[9px] mb-0.5">
                  {(['All', 'Entrance', 'Emphasis', 'Exit', 'Motion Paths'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAnimCategoryFilter(cat)}
                      className={`px-1.5 py-0.5 rounded-xs transition-colors ${
                        animCategoryFilter === cat
                          ? 'bg-[#B7472A] text-white font-bold'
                          : 'bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Horizontal Scrollable Star Cards */}
                <div className="flex items-center gap-1 overflow-x-auto max-w-xl pb-1 scrollbar-thin">
                  {filteredAnimations.map((anim) => {
                    const isActive = currentAnim.type === anim.id;
                    return (
                      <button
                        key={anim.id}
                        type="button"
                        disabled={!selectedObject}
                        onClick={() => {
                          onChangeAnimation({
                            ...currentAnim,
                            type: anim.id,
                          });
                          onPreviewAnimation && onPreviewAnimation();
                        }}
                        className={`px-2 py-1.5 rounded-md border text-center transition-all shrink-0 flex flex-col items-center min-w-[70px] disabled:opacity-35 ${
                          isActive
                            ? 'border-[#B7472A] bg-[#B7472A]/10 text-[#B7472A] font-bold shadow-2xs'
                            : 'border-black/10 dark:border-white/10 hover:border-black/25 bg-card'
                        }`}
                        title={`${anim.label} (${anim.category}) - ${anim.description}`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full text-white text-[8px] font-black flex items-center justify-center mb-0.5"
                          style={{ backgroundColor: anim.starColor }}
                        >
                          ★
                        </span>
                        <span className="text-[10px] truncate max-w-[64px] font-medium leading-none">
                          {anim.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </RibbonGroup>

            {/* Advanced Animation & Timing */}
            <RibbonGroup label="Advanced Animation">
              <div className="flex flex-col gap-1 text-xs">
                {onToggleAnimationPainter && (
                  <button
                    type="button"
                    onClick={onToggleAnimationPainter}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium border ${
                      isAnimationPainterActive
                        ? 'bg-[#B7472A] text-white border-[#B7472A]'
                        : 'border-black/15 hover:bg-accent'
                    }`}
                    title="Animation Painter"
                  >
                    <Paintbrush className="h-3 w-3 text-amber-600" />
                    <span>Painter</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onToggleAnimationPane}
                  className="flex items-center gap-1 px-2 py-0.5 rounded border border-black/15 hover:bg-accent text-[10.5px] font-medium"
                >
                  <Sparkles className="h-3 w-3 text-[#B7472A]" />
                  <span>Animation Pane</span>
                </button>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Timing">
              <div className="flex flex-col gap-1 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Start:</span>
                  <select
                    disabled={!selectedObject || currentAnim.type === 'none'}
                    value={currentAnim.trigger || 'on-click'}
                    onChange={(e) =>
                      onChangeAnimation({
                        ...currentAnim,
                        trigger: e.target.value as 'on-click' | 'after-previous' | 'with-previous',
                      })
                    }
                    className="h-5 px-1 rounded border border-black/15 bg-background text-[10px] disabled:opacity-40"
                  >
                    <option value="on-click">On Click</option>
                    <option value="after-previous">After Previous</option>
                    <option value="with-previous">With Previous</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Duration:</span>
                  <select
                    disabled={!selectedObject || currentAnim.type === 'none'}
                    value={String(currentAnim.durationMs || 500)}
                    onChange={(e) =>
                      onChangeAnimation({
                        ...currentAnim,
                        durationMs: parseInt(e.target.value, 10),
                      })
                    }
                    className="h-5 px-1 rounded border border-black/15 bg-background text-[10px] disabled:opacity-40"
                  >
                    <option value="250">0.25s</option>
                    <option value="500">0.50s</option>
                    <option value="750">0.75s</option>
                    <option value="1000">1.00s</option>
                    <option value="1500">1.50s</option>
                    <option value="2000">2.00s</option>
                  </select>
                </div>
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ──────── CONTEXTUAL TAB: SHAPE FORMAT ──────── */}
        {activeTab === 'SHAPE_FORMAT' && selectedObject && (
          <>
            <RibbonGroup label="Insert Shapes">
              <button
                type="button"
                onClick={() => onAddObject('shape', 'rectangle')}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs"
              >
                <Square className="h-4 w-4 text-blue-500" />
                <span className="text-[10px]">Edit Shape</span>
              </button>
            </RibbonGroup>

            <RibbonGroup label="Shape Styles">
              <div className="flex items-center gap-1.5">
                {[
                  { name: 'Accent Blue', fill: '#156082', text: '#ffffff' },
                  { name: 'Warm Orange', fill: '#B7472A', text: '#ffffff' },
                  { name: 'Forest Green', fill: '#196B24', text: '#ffffff' },
                  { name: 'Charcoal Slate', fill: '#1E293B', text: '#ffffff' },
                  { name: 'Light Card', fill: '#F1F5F9', text: '#0F172A', border: '#CBD5E1' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      onUpdateSelectedObject({
                        format: {
                          ...format,
                          fillColor: preset.fill,
                          textColor: preset.text,
                          strokeColor: preset.border || 'transparent',
                          strokeWidth: preset.border ? 1 : 0,
                        },
                      })
                    }
                    style={{ backgroundColor: preset.fill, borderColor: preset.border || preset.fill }}
                    className="w-7 h-7 rounded border shadow-2xs hover:scale-110 transition-transform"
                    title={preset.name}
                  />
                ))}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Arrange">
              <div className="flex flex-col gap-1 text-[10px]">
                <div className="flex items-center gap-1">
                  {onBringForward && (
                    <button type="button" onClick={onBringForward} className="p-1 rounded hover:bg-accent" title="Bring Forward">
                      <ArrowUp className="h-3 w-3" />
                    </button>
                  )}
                  {onSendBackward && (
                    <button type="button" onClick={onSendBackward} className="p-1 rounded hover:bg-accent" title="Send Backward">
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  )}
                  {onRotateObject && (
                    <button type="button" onClick={() => onRotateObject(90)} className="p-1 rounded hover:bg-accent" title="Rotate 90°">
                      <RotateCw className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {onAlignObject && (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => onAlignObject('left')} className="p-0.5 hover:bg-accent rounded text-[9px]">Left</button>
                    <button type="button" onClick={() => onAlignObject('center')} className="p-0.5 hover:bg-accent rounded text-[9px]">Center</button>
                    <button type="button" onClick={() => onAlignObject('right')} className="p-0.5 hover:bg-accent rounded text-[9px]">Right</button>
                  </div>
                )}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Size">
              <div className="flex flex-col gap-1 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground w-6">W:</span>
                  <input
                    type="number"
                    value={Math.round(selectedObject.width)}
                    onChange={(e) => onUpdateSelectedObject({ width: Math.max(5, Math.min(100, parseInt(e.target.value, 10) || 10)) })}
                    className="w-12 h-5 px-1 rounded border border-black/15 bg-background text-[10px]"
                  />
                  <span>%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground w-6">H:</span>
                  <input
                    type="number"
                    value={Math.round(selectedObject.height)}
                    onChange={(e) => onUpdateSelectedObject({ height: Math.max(5, Math.min(100, parseInt(e.target.value, 10) || 10)) })}
                    className="w-12 h-5 px-1 rounded border border-black/15 bg-background text-[10px]"
                  />
                  <span>%</span>
                </div>
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ──────── CONTEXTUAL TAB: TABLE DESIGN ──────── */}
        {activeTab === 'TABLE_DESIGN' && selectedObject && selectedObject.type === 'table' && (
          <>
            <RibbonGroup label="Rows & Columns">
              <div className="flex flex-col gap-1 text-[10px]">
                <div className="flex items-center gap-1">
                  {onInsertTableRow && (
                    <button type="button" onClick={() => onInsertTableRow('below')} className="px-1.5 py-0.5 rounded border hover:bg-accent text-[9.5px]">
                      + Row
                    </button>
                  )}
                  {onInsertTableCol && (
                    <button type="button" onClick={() => onInsertTableCol('right')} className="px-1.5 py-0.5 rounded border hover:bg-accent text-[9.5px]">
                      + Col
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {onDeleteTableRow && (
                    <button type="button" onClick={onDeleteTableRow} className="px-1.5 py-0.5 rounded border hover:bg-rose-50 text-rose-600 text-[9.5px]">
                      - Row
                    </button>
                  )}
                  {onDeleteTableCol && (
                    <button type="button" onClick={onDeleteTableCol} className="px-1.5 py-0.5 rounded border hover:bg-rose-50 text-rose-600 text-[9.5px]">
                      - Col
                    </button>
                  )}
                </div>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Table Styles">
              <div className="flex items-center gap-1.5">
                {[
                  { name: 'Office Blue', hdr: '#156082' },
                  { name: 'PowerPoint Amber', hdr: '#B7472A' },
                  { name: 'Emerald', hdr: '#196B24' },
                  { name: 'Charcoal', hdr: '#334155' },
                ].map((tbl) => (
                  <button
                    key={tbl.name}
                    type="button"
                    onClick={() => onUpdateSelectedObject({ format: { ...format, fillColor: tbl.hdr } })}
                    className="w-8 h-6 rounded border border-black/10 overflow-hidden flex flex-col shadow-2xs hover:scale-105"
                    title={tbl.name}
                  >
                    <div className="h-2 w-full" style={{ backgroundColor: tbl.hdr }} />
                    <div className="flex-1 bg-white" />
                  </button>
                ))}
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: SLIDESHOW ──────── */}
        {activeTab === 'SLIDESHOW' && (
          <>
            <RibbonGroup label="Start Slide Show">
              <button
                type="button"
                onClick={() => onStartPresentation(false)}
                className="flex flex-col items-center px-3 py-1 rounded bg-[#B7472A] hover:bg-[#9c3a20] text-white text-xs font-semibold shadow-2xs"
              >
                <Play className="h-4 w-4 fill-current" />
                <span className="text-[10px] mt-0.5">From Beginning (F5)</span>
              </button>
              <button
                type="button"
                onClick={() => onStartPresentation(true)}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs font-medium"
              >
                <Play className="h-4 w-4" />
                <span className="text-[10px] mt-0.5">From Current</span>
              </button>
              <button
                type="button"
                onClick={onOpenPresenterView}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs font-medium"
              >
                <MonitorPlay className="h-4 w-4 text-[#B7472A]" />
                <span className="text-[10px] mt-0.5">Presenter View</span>
              </button>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: REVIEW ──────── */}
        {activeTab === 'REVIEW' && (
          <>
            <RibbonGroup label="Accessibility">
              <button
                type="button"
                onClick={onOpenHealthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Check Accessibility</span>
              </button>
            </RibbonGroup>

            <RibbonGroup label="Comments">
              <button
                type="button"
                onClick={onToggleComments}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-accent text-xs font-medium text-foreground border border-black/10"
              >
                <MessageSquare className="h-4 w-4 text-[#B7472A]" />
                <span>Show Comments</span>
              </button>
            </RibbonGroup>

            <RibbonGroup label="History">
              <button
                type="button"
                onClick={onOpenVersionHistoryModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-accent text-xs font-medium text-foreground border border-black/10"
              >
                <History className="h-4 w-4 text-purple-600" />
                <span>Version History</span>
              </button>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: VIEW ──────── */}
        {activeTab === 'VIEW' && (
          <>
            <RibbonGroup label="Presentation Views">
              <button
                type="button"
                className="flex flex-col items-center px-2.5 py-1 rounded bg-[#fadad1] text-[#B7472A] font-semibold text-xs"
              >
                <Presentation className="h-4 w-4" />
                <span className="text-[10px] mt-0.5">Normal</span>
              </button>
              <button
                type="button"
                onClick={onOpenSorterModal}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs font-medium"
              >
                <Grid className="h-4 w-4" />
                <span className="text-[10px] mt-0.5">Slide Sorter</span>
              </button>
              <button
                type="button"
                onClick={onOpenMasterView}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs font-medium"
              >
                <LayoutTemplate className="h-4 w-4" />
                <span className="text-[10px] mt-0.5">Slide Master</span>
              </button>
            </RibbonGroup>

            <RibbonGroup label="Show">
              <div className="flex flex-col gap-0.5 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRulers}
                    onChange={onToggleRulers}
                    className="accent-[#B7472A] rounded-xs"
                  />
                  <span className="text-[11px]">Ruler</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={onToggleGrid}
                    className="accent-[#B7472A] rounded-xs"
                  />
                  <span className="text-[11px]">Gridlines</span>
                </label>
                {onToggleNotesDrawer && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showNotesDrawer}
                      onChange={onToggleNotesDrawer}
                      className="accent-[#B7472A] rounded-xs"
                    />
                    <span className="text-[11px]">Notes</span>
                  </label>
                )}
              </div>
            </RibbonGroup>

            <RibbonGroup label="Zoom">
              <div className="flex items-center gap-1">
                {[50, 75, 100, 125, 150].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onChangeZoom(level)}
                    className={`px-1.5 py-0.5 text-[11px] rounded border ${
                      zoomLevel === level
                        ? 'bg-[#B7472A] text-white border-[#B7472A] font-bold'
                        : 'border-black/10 hover:bg-accent'
                    }`}
                  >
                    {level}%
                  </button>
                ))}
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ──────── TAB: FILE ──────── */}
        {activeTab === 'FILE' && (
          <>
            <RibbonGroup label="Document">
              <button
                type="button"
                onClick={onSaveManual}
                className="flex flex-col items-center px-3 py-1 rounded hover:bg-accent text-xs font-semibold"
              >
                <Save className="h-4 w-4 text-[#B7472A]" />
                <span className="text-[10px] mt-0.5">Save</span>
              </button>
              <button
                type="button"
                onClick={onOpenTemplatesModal}
                className="flex flex-col items-center px-3 py-1 rounded hover:bg-accent text-xs font-medium"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-[10px] mt-0.5">Templates</span>
              </button>
            </RibbonGroup>
            <RibbonGroup label="Export">
              {onExportPptx && (
                <button
                  type="button"
                  onClick={onExportPptx}
                  className="flex flex-col items-center px-3 py-1 rounded hover:bg-accent text-xs font-semibold"
                >
                  <Download className="h-4 w-4 text-[#B7472A]" />
                  <span className="text-[10px] mt-0.5">PowerPoint (.pptx)</span>
                </button>
              )}
              <button
                type="button"
                onClick={onExportPdf}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs"
              >
                <Printer className="h-4 w-4" />
                <span className="text-[10px] mt-0.5">Print / PDF</span>
              </button>
              <button
                type="button"
                onClick={onExportHtml}
                className="flex flex-col items-center px-2 py-1 rounded hover:bg-accent text-xs"
              >
                <Download className="h-4 w-4 text-sky-600" />
                <span className="text-[10px] mt-0.5">HTML Deck</span>
              </button>
            </RibbonGroup>
          </>
        )}
      </div>
    </div>
  );
}
