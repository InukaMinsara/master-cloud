import React, { useState } from 'react';
import {
  FileText,
  Home,
  PlusCircle,
  Palette,
  Sparkles,
  Play,
  MonitorPlay,
  Grid,
  Save,
  Download,
  Printer,
  Type,
  Square,
  Circle,
  Triangle,
  Star,
  ArrowRight,
  Heart,
  Image as ImageIcon,
  Table as TableIcon,
  BarChart3,
  PieChart,
  LineChart,
  Video,
  Music,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Trash2,
  Copy,
  Scissors,
  Layers,
  Clock,
  CheckCircle2,
  Maximize2,
  Sliders,
  MoveRight,
  Eye,
  Settings,
  HelpCircle,
  RotateCw,
  ShieldCheck,
  MessageSquare,
  History,
  LayoutTemplate,
  FileSpreadsheet,
  Workflow,
  MousePointer,
  Diamond,
  Hexagon,
  Cloud,
  Database,
  Share2,
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

interface MasterSlidesToolbarProps {
  presentation: MasterPresentationData;
  activeSlide: MasterSlide;
  selectedObject: MasterSlideObject | null;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'offline' | 'syncing' | 'conflict';
  onUpdateTitle: (title: string) => void;
  onAddSlide: (layout?: SlideLayoutKind) => void;
  onAddObject: (type: MasterSlideObject['type'], shapeKind?: ShapeKind) => void;
  onUpdateSelectedObject: (updates: Partial<MasterSlideObject>) => void;
  onDeleteSelectedObject: () => void;
  onDuplicateSelectedObject: () => void;
  onChangeSlideTheme: (theme: SlideThemeId) => void;
  onChangeSlideLayout: (layout: SlideLayoutKind) => void;
  onChangeTransition: (type: TransitionType, duration: number, applyAll?: boolean) => void;
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
}

export type SlideTabType =
  | 'HOME'
  | 'INSERT'
  | 'DESIGN'
  | 'TRANSITIONS'
  | 'ANIMATIONS'
  | 'SLIDESHOW'
  | 'REVIEW'
  | 'VIEW'
  | 'FILE';

export function MasterSlidesToolbar({
  presentation,
  activeSlide,
  selectedObject,
  saveStatus,
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
}: MasterSlidesToolbarProps) {
  const [activeTab, setActiveTab] = useState<SlideTabType>('HOME');

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

  return (
    <div className="flex flex-col border-b border-border/80 bg-card/60 backdrop-blur-md shrink-0 select-none">
      {/* Top Main App Title & Status Bar */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500 font-black">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <input
                type="text"
                value={presentation.title}
                onChange={(e) => onUpdateTitle(e.target.value)}
                className="font-bold text-sm bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none px-1 py-0.5 max-w-sm transition-colors text-foreground"
                placeholder="Untitled Presentation"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground px-2 border-l border-border/60">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-amber-500">
                <Clock className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Master Cloud Synced (10 TB Free)
              </span>
            )}
            {saveStatus === 'offline' && (
              <span className="flex items-center gap-1 text-amber-500">Offline (Draft Cached)</span>
            )}
            {saveStatus === 'unsaved' && <span className="text-muted-foreground">Unsaved edits</span>}
          </div>
        </div>

        {/* Quick Launch Presentation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTemplatesModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold transition-colors"
            title="Browse Presentation Templates"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          <button
            onClick={onOpenThemesModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
            title="Change Presentation Theme"
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Themes</span>
          </button>

          <button
            onClick={onOpenPresenterView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-accent text-foreground text-xs font-bold transition-colors border border-border"
            title="Open Presenter View Studio (Dual Monitor)"
          >
            <MonitorPlay className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Presenter Studio</span>
          </button>

          <button
            onClick={() => onStartPresentation(false)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95"
            title="Start Fullscreen Slideshow (F5)"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Present</span>
          </button>
        </div>
      </div>

      {/* Ribbon Tabs Header */}
      <div className="flex items-center gap-1 px-3 pt-1 border-b border-border/50 bg-muted/20">
        {(
          [
            'HOME',
            'INSERT',
            'DESIGN',
            'TRANSITIONS',
            'ANIMATIONS',
            'SLIDESHOW',
            'REVIEW',
            'VIEW',
            'FILE',
          ] as SlideTabType[]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-bold tracking-wide rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-card text-primary border-t-2 border-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ribbon Action Drawer Content */}
      <div className="h-16 px-4 flex items-center gap-4 overflow-x-auto bg-card/70 py-2">
        {/* TAB 1: HOME */}
        {activeTab === 'HOME' && (
          <div className="flex items-center gap-4">
            {/* Add Slide & Layouts */}
            <div className="flex items-center gap-1.5 pr-3 border-r border-border/60">
              <button
                onClick={() => onAddSlide('title-content')}
                className="flex flex-col items-center justify-center px-2 py-1 rounded-lg hover:bg-accent text-xs font-medium text-foreground transition-colors"
                title="Add New Slide"
              >
                <PlusCircle className="h-4 w-4 text-primary" />
                <span className="text-[10px] mt-0.5">New Slide</span>
              </button>

              <select
                value={activeSlide.layout}
                onChange={(e) => onChangeSlideLayout(e.target.value as SlideLayoutKind)}
                className="text-xs bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                title="Change Slide Layout"
              >
                <option value="title">Title Slide</option>
                <option value="title-content">Title + Content</option>
                <option value="two-columns">Two Columns</option>
                <option value="comparison">Comparison</option>
                <option value="section-header">Section Header</option>
                <option value="quote">Quote Banner</option>
                <option value="big-stat">Big Statistic</option>
                <option value="table-focus">Table Focus</option>
                <option value="chart-focus">Chart Focus</option>
                <option value="blank">Blank Slide</option>
              </select>
            </div>

            {/* Typography Formatting for Selected Object */}
            <div className="flex items-center gap-1.5 pr-3 border-r border-border/60">
              <select
                disabled={!selectedObject || selectedObject.type !== 'text'}
                value={format.fontFamily || 'Inter, sans-serif'}
                onChange={(e) =>
                  onUpdateSelectedObject({
                    format: { ...format, fontFamily: e.target.value },
                  })
                }
                className="text-xs bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[120px] disabled:opacity-40"
              >
                <option value="Inter, sans-serif">Inter (Modern)</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="Georgia, serif">Georgia (Editorial)</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
              </select>

              <select
                disabled={!selectedObject || selectedObject.type !== 'text'}
                value={format.fontSize || 20}
                onChange={(e) =>
                  onUpdateSelectedObject({
                    format: { ...format, fontSize: parseInt(e.target.value, 10) },
                  })
                }
                className="text-xs bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
              >
                {[12, 14, 16, 18, 20, 24, 28, 32, 36, 44, 52, 64, 72].map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>

              <button
                disabled={!selectedObject || selectedObject.type !== 'text'}
                onClick={() =>
                  onUpdateSelectedObject({
                    format: { ...format, bold: !format.bold },
                  })
                }
                className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                  format.bold ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-border'
                }`}
                title="Bold"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>

              <button
                disabled={!selectedObject || selectedObject.type !== 'text'}
                onClick={() =>
                  onUpdateSelectedObject({
                    format: { ...format, italic: !format.italic },
                  })
                }
                className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                  format.italic ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-border'
                }`}
                title="Italic"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>

              <button
                disabled={!selectedObject || selectedObject.type !== 'text'}
                onClick={() =>
                  onUpdateSelectedObject({
                    format: { ...format, underline: !format.underline },
                  })
                }
                className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                  format.underline ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-border'
                }`}
                title="Underline"
              >
                <Underline className="h-3.5 w-3.5" />
              </button>

              {/* Text Align */}
              <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border">
                <button
                  disabled={!selectedObject || selectedObject.type !== 'text'}
                  onClick={() => onUpdateSelectedObject({ format: { ...format, align: 'left' } })}
                  className={`p-1 rounded ${format.align === 'left' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  <AlignLeft className="h-3 w-3" />
                </button>
                <button
                  disabled={!selectedObject || selectedObject.type !== 'text'}
                  onClick={() => onUpdateSelectedObject({ format: { ...format, align: 'center' } })}
                  className={`p-1 rounded ${format.align === 'center' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  <AlignCenter className="h-3 w-3" />
                </button>
                <button
                  disabled={!selectedObject || selectedObject.type !== 'text'}
                  onClick={() => onUpdateSelectedObject({ format: { ...format, align: 'right' } })}
                  className={`p-1 rounded ${format.align === 'right' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  <AlignRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Colors & Object Actions */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs cursor-pointer" title="Text Color">
                <span className="text-[10px] text-muted-foreground font-medium">Text</span>
                <input
                  type="color"
                  value={format.textColor || '#ffffff'}
                  onChange={(e) =>
                    onUpdateSelectedObject({
                      format: { ...format, textColor: e.target.value },
                    })
                  }
                  className="w-6 h-6 rounded cursor-pointer border border-border bg-transparent"
                />
              </label>

              <label className="flex items-center gap-1 text-xs cursor-pointer" title="Fill Color">
                <span className="text-[10px] text-muted-foreground font-medium">Fill</span>
                <input
                  type="color"
                  value={format.fillColor || '#3b82f6'}
                  onChange={(e) =>
                    onUpdateSelectedObject({
                      format: { ...format, fillColor: e.target.value },
                    })
                  }
                  className="w-6 h-6 rounded cursor-pointer border border-border bg-transparent"
                />
              </label>

              {selectedObject && (
                <div className="flex items-center gap-1 pl-2 border-l border-border/60">
                  <button
                    onClick={onDuplicateSelectedObject}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground border border-border"
                    title="Duplicate Object"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={onDeleteSelectedObject}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive border border-destructive/20"
                    title="Delete Object"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INSERT */}
        {activeTab === 'INSERT' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onAddObject('text')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/60 hover:bg-accent text-xs font-semibold text-foreground border border-border transition-colors"
            >
              <Type className="h-4 w-4 text-primary" />
              <span>Text Box</span>
            </button>

            {/* Shape Choices */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
              <button
                onClick={() => onAddObject('shape', 'rectangle')}
                className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                title="Rectangle"
              >
                <Square className="h-4 w-4" />
              </button>
              <button
                onClick={() => onAddObject('shape', 'circle')}
                className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                title="Circle"
              >
                <Circle className="h-4 w-4" />
              </button>
              <button
                onClick={() => onAddObject('shape', 'triangle')}
                className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                title="Triangle"
              >
                <Triangle className="h-4 w-4" />
              </button>
              <button
                onClick={() => onAddObject('shape', 'diamond')}
                className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                title="Decision Diamond"
              >
                <Diamond className="h-4 w-4" />
              </button>
              <button
                onClick={() => onAddObject('shape', 'cloud')}
                className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                title="Cloud Node"
              >
                <Cloud className="h-4 w-4 text-sky-400" />
              </button>
              <button
                onClick={() => onAddObject('shape', 'database')}
                className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                title="Database Cylinder"
              >
                <Database className="h-4 w-4 text-amber-400" />
              </button>
              <button
                onClick={() => onAddObject('shape', 'arrow-right')}
                className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                title="Process Arrow"
              >
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </button>
            </div>

            {/* Media & Data */}
            <button
              onClick={() => onAddObject('image')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/60 hover:bg-accent text-xs font-semibold text-foreground border border-border transition-colors"
            >
              <ImageIcon className="h-4 w-4 text-emerald-500" />
              <span>Image</span>
            </button>

            <button
              onClick={() => onAddObject('table')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/60 hover:bg-accent text-xs font-semibold text-foreground border border-border transition-colors"
            >
              <TableIcon className="h-4 w-4 text-indigo-500" />
              <span>Table</span>
            </button>

            <button
              onClick={() => onAddObject('chart')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/60 hover:bg-accent text-xs font-semibold text-foreground border border-border transition-colors"
            >
              <BarChart3 className="h-4 w-4 text-cyan-500" />
              <span>Chart</span>
            </button>

            <button
              onClick={onOpenIntegrationsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold border border-primary/30 transition-colors shadow-sm"
              title="Insert live data from Master Sheets, Docs, and Canvas"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              <span>Master Cloud Apps Data</span>
            </button>
          </div>
        )}

        {/* TAB 3: DESIGN */}
        {activeTab === 'DESIGN' && (
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenThemesModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
            >
              <Palette className="h-4 w-4" />
              <span>Theme Studio</span>
            </button>

            <button
              onClick={onOpenMasterView}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs font-bold hover:bg-purple-500/25"
            >
              <LayoutTemplate className="h-4 w-4" />
              <span>Slide Master Studio</span>
            </button>

            {/* Quick Themes Swatches */}
            <div className="flex items-center gap-1.5 pr-3 border-r border-border/60">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onChangeSlideTheme(theme.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    activeSlide.bgTheme === theme.id
                      ? 'border-primary bg-primary/20 text-foreground font-bold'
                      : 'border-border/60 hover:border-border text-muted-foreground'
                  }`}
                >
                  {theme.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Aspect Ratio */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Ratio:</span>
              <button
                onClick={() => onChangeAspect('16:9')}
                className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                  presentation.aspectRatio === '16:9'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                16:9
              </button>
              <button
                onClick={() => onChangeAspect('4:3')}
                className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                  presentation.aspectRatio === '4:3'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                4:3
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: TRANSITIONS */}
        {activeTab === 'TRANSITIONS' && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">Slide Transition:</span>
            <select
              value={currentTransition.type}
              onChange={(e) =>
                onChangeTransition(
                  e.target.value as TransitionType,
                  currentTransition.durationSeconds || 0.5,
                  false
                )
              }
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
            >
              <option value="none">None (Instant)</option>
              <option value="fade">Smooth Crossfade</option>
              <option value="slide-left">Slide from Right to Left</option>
              <option value="slide-right">Slide from Left to Right</option>
              <option value="slide-up">Slide from Bottom to Top</option>
              <option value="slide-down">Slide from Top to Bottom</option>
              <option value="zoom">Zoom Scale In</option>
              <option value="flip">3D Y-Axis Flip</option>
              <option value="rotate">3D Spin &amp; Rotate</option>
              <option value="dissolve">Blur Dissolve</option>
            </select>

            <span className="text-xs text-muted-foreground font-medium ml-2">Duration:</span>
            <select
              value={currentTransition.durationSeconds || 0.5}
              onChange={(e) =>
                onChangeTransition(currentTransition.type, parseFloat(e.target.value), false)
              }
              className="text-xs bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="0.3">0.3s (Fast)</option>
              <option value="0.5">0.5s (Normal)</option>
              <option value="0.8">0.8s (Smooth)</option>
              <option value="1.0">1.0s (Slow)</option>
              <option value="1.5">1.5s (Cinematic)</option>
              <option value="2.0">2.0s (Deliberate)</option>
            </select>

            {/* Preview Button */}
            {onPreviewTransition && (
              <button
                onClick={onPreviewTransition}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-all"
                title="Preview Slide Transition Effect"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Preview</span>
              </button>
            )}

            <button
              onClick={() =>
                onChangeTransition(
                  currentTransition.type,
                  currentTransition.durationSeconds || 0.5,
                  true
                )
              }
              className="px-3 py-1 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-bold border border-border"
            >
              Apply to All Slides
            </button>
          </div>
        )}

        {/* TAB 5: ANIMATIONS */}
        {activeTab === 'ANIMATIONS' && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">Object Animation:</span>
            <select
              disabled={!selectedObject}
              value={currentAnim.type}
              onChange={(e) =>
                onChangeAnimation({
                  ...currentAnim,
                  type: e.target.value as AnimationType,
                })
              }
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold disabled:opacity-40"
            >
              <option value="none">None</option>
              <option value="appear">Appear Instantly</option>
              <option value="fade-in">Fade In</option>
              <option value="slide-up">Slide Up</option>
              <option value="slide-down">Slide Down</option>
              <option value="zoom-in">Zoom In</option>
              <option value="bounce">Bounce In</option>
              <option value="flip">3D Flip (X-Axis)</option>
              <option value="spin">Spin In</option>
            </select>

            <span className="text-xs text-muted-foreground font-medium ml-1">Trigger:</span>
            <select
              disabled={!selectedObject || currentAnim.type === 'none'}
              value={currentAnim.trigger || 'on-click'}
              onChange={(e) =>
                onChangeAnimation({
                  ...currentAnim,
                  trigger: e.target.value as 'on-click' | 'after-previous' | 'with-previous',
                })
              }
              className="text-xs bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
            >
              <option value="on-click">On Click (Step)</option>
              <option value="after-previous">After Previous</option>
              <option value="with-previous">With Previous</option>
            </select>

            {/* Preview Animation Button */}
            {onPreviewAnimation && (
              <button
                disabled={!selectedObject || currentAnim.type === 'none'}
                onClick={onPreviewAnimation}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-all disabled:opacity-40"
                title="Preview Object Animation"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Play</span>
              </button>
            )}

            <button
              onClick={onToggleAnimationPane}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-bold border border-border"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Animation Pane</span>
            </button>
          </div>
        )}

        {/* TAB 6: SLIDESHOW */}
        {activeTab === 'SLIDESHOW' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onStartPresentation(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>From Beginning (F5)</span>
            </button>

            <button
              onClick={() => onStartPresentation(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-bold border border-border"
            >
              <Play className="h-3.5 w-3.5" />
              <span>From Current Slide</span>
            </button>

            <button
              onClick={onOpenPresenterView}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              <span>Presenter Studio</span>
            </button>
          </div>
        )}

        {/* TAB 7: REVIEW */}
        {activeTab === 'REVIEW' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenHealthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Document Quality &amp; Accessibility Inspector</span>
            </button>

            <button
              onClick={onToggleComments}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-bold border border-border"
            >
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Slide Comments</span>
            </button>

            <button
              onClick={onOpenVersionHistoryModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-bold border border-border"
            >
              <History className="h-4 w-4 text-purple-400" />
              <span>Version History &amp; Snapshots</span>
            </button>
          </div>
        )}

        {/* TAB 8: VIEW */}
        {activeTab === 'VIEW' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSorterModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-bold border border-border"
            >
              <Grid className="h-4 w-4 text-primary" />
              <span>Slide Sorter</span>
            </button>

            <button
              onClick={onToggleLayersPanel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-bold border border-border"
            >
              <Layers className="h-4 w-4 text-blue-400" />
              <span>Layers Panel</span>
            </button>

            <button
              onClick={onToggleGrid}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                showGrid
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-accent text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              Grid Lines
            </button>

            <button
              onClick={onToggleRulers}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                showRulers
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-accent text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              Rulers
            </button>

            <div className="flex items-center gap-1.5 pl-3 border-l border-border/60">
              <span className="text-xs text-muted-foreground font-medium">Zoom:</span>
              {[50, 75, 100, 125, 150].map((level) => (
                <button
                  key={level}
                  onClick={() => onChangeZoom(level)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    zoomLevel === level
                      ? 'bg-primary text-primary-foreground border-primary font-bold'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {level}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: FILE */}
        {activeTab === 'FILE' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onSaveManual}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save (Ctrl+S)</span>
            </button>

            <button
              onClick={onExportHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-semibold border border-border"
            >
              <Download className="h-3.5 w-3.5 text-amber-500" />
              <span>HTML Deck</span>
            </button>

            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-semibold border border-border"
            >
              <Printer className="h-3.5 w-3.5 text-blue-500" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onOpenHandoutModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-semibold border border-border"
            >
              <FileText className="h-3.5 w-3.5 text-purple-400" />
              <span>Handouts</span>
            </button>

            <button
              onClick={onExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-semibold border border-border"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-500" />
              <span>JSON Package</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
