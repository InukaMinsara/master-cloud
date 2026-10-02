import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Save,
  Download,
  Upload,
  Printer,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  Table as TableIcon,
  BarChart3,
  Filter,
  ArrowUpDown,
  Search,
  Sigma,
  Sparkles,
  Columns,
  Maximize2,
  Minimize2,
  Layers,
  Palette,
  Eye,
  Lock,
  Grid,
  Percent,
  DollarSign,
  Hash,
  Share2,
  FolderOpen,
  Scissors,
  Copy,
  Clipboard,
  TableProperties,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MasterSingleSheet, MasterWorkbookData, SheetCellFormat } from '../types';

export type SheetRibbonTab = 'file' | 'home' | 'insert' | 'formulas' | 'data' | 'review' | 'view';

interface MasterSheetsToolbarProps {
  activeTab: SheetRibbonTab;
  setActiveTab: (tab: SheetRibbonTab) => void;
  activeFormat?: SheetCellFormat;
  onUpdateFormat: (format: Partial<SheetCellFormat>) => void;
  onSave: () => void;
  onPrint: () => void;
  onExport: (format: 'csv' | 'xlsx' | 'tsv' | 'json') => void;
  onOpenTemplates: () => void;
  onOpenChartModal: () => void;
  onOpenPivotModal: () => void;
  onOpenConditionalModal: () => void;
  onOpenValidationModal: () => void;
  onOpenTextToColumnsModal: () => void;
  onOpenFunctionLibraryModal: () => void;
  onOpenCommandPalette: () => void;
  onSort: (direction: 'asc' | 'desc') => void;
  onRemoveDuplicates: () => void;
  onToggleGridlines: () => void;
  onToggleHeadings: () => void;
  onInsertRow: () => void;
  onInsertCol: () => void;
  onDeleteRow: () => void;
  onDeleteCol: () => void;
  showGridlines: boolean;
  showHeadings: boolean;
}

export function MasterSheetsToolbar({
  activeTab,
  setActiveTab,
  activeFormat = {},
  onUpdateFormat,
  onSave,
  onPrint,
  onExport,
  onOpenTemplates,
  onOpenChartModal,
  onOpenPivotModal,
  onOpenConditionalModal,
  onOpenValidationModal,
  onOpenTextToColumnsModal,
  onOpenFunctionLibraryModal,
  onOpenCommandPalette,
  onSort,
  onRemoveDuplicates,
  onToggleGridlines,
  onToggleHeadings,
  onInsertRow,
  onInsertCol,
  onDeleteRow,
  onDeleteCol,
  showGridlines,
  showHeadings,
}: MasterSheetsToolbarProps) {
  return (
    <div className="flex flex-col border-b border-border/80 bg-card/70 backdrop-blur-md shrink-0 select-none z-20">
      {/* Ribbon Tabs Header */}
      <div className="flex items-center justify-between px-3 pt-1 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {(
            [
              { id: 'file', label: 'File' },
              { id: 'home', label: 'Home' },
              { id: 'insert', label: 'Insert' },
              { id: 'formulas', label: 'Formulas' },
              { id: 'data', label: 'Data' },
              { id: 'review', label: 'Review' },
              { id: 'view', label: 'View' },
            ] as { id: SheetRibbonTab; label: string }[]
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

        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground border border-border/60 bg-background/50 transition-colors"
          title="Command Palette (Ctrl+Shift+P)"
        >
          <Search className="h-3 w-3" />
          <span className="hidden md:inline">Command Palette</span>
          <kbd className="text-[9px] bg-muted px-1 rounded font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Active Tab Ribbon Actions */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto min-h-[44px] text-xs">
        {/* ── TAB: FILE ── */}
        {activeTab === 'file' && (
          <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
            <Button size="sm" variant="ghost" onClick={onSave} className="h-8 gap-1.5 px-2.5 font-semibold text-xs">
              <Save className="h-3.5 w-3.5 text-primary" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onOpenTemplates} className="h-8 gap-1.5 px-2.5 font-semibold text-xs">
              <FolderOpen className="h-3.5 w-3.5 text-amber-500" /> Templates Gallery
            </Button>

            <div className="h-5 w-px bg-border mx-1" />

            <Button size="sm" variant="ghost" onClick={() => onExport('xlsx')} className="h-8 gap-1 px-2 text-xs">
              <Download className="h-3.5 w-3.5 text-emerald-500" /> Excel (XLSX)
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onExport('csv')} className="h-8 gap-1 px-2 text-xs">
              <Download className="h-3.5 w-3.5 text-blue-500" /> CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onExport('tsv')} className="h-8 gap-1 px-2 text-xs">
              <Download className="h-3.5 w-3.5 text-purple-500" /> TSV
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onExport('json')} className="h-8 gap-1 px-2 text-xs">
              <Download className="h-3.5 w-3.5 text-amber-500" /> JSON
            </Button>

            <div className="h-5 w-px bg-border mx-1" />

            <Button size="sm" variant="ghost" onClick={onPrint} className="h-8 gap-1.5 px-2.5 font-semibold text-xs">
              <Printer className="h-3.5 w-3.5" /> Print Sheet
            </Button>
          </div>
        )}

        {/* ── TAB: HOME ── */}
        {activeTab === 'home' && (
          <div className="flex items-center gap-1 animate-in fade-in duration-150">
            {/* Formatting Tools */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onUpdateFormat({ bold: !activeFormat.bold })}
                className={`p-1.5 rounded-lg transition-colors ${
                  activeFormat.bold ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-accent text-muted-foreground'
                }`}
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={() => onUpdateFormat({ italic: !activeFormat.italic })}
                className={`p-1.5 rounded-lg transition-colors ${
                  activeFormat.italic ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'
                }`}
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                onClick={() => onUpdateFormat({ underline: !activeFormat.underline })}
                className={`p-1.5 rounded-lg transition-colors ${
                  activeFormat.underline ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'
                }`}
                title="Underline (Ctrl+U)"
              >
                <Underline className="h-4 w-4" />
              </button>
              <button
                onClick={() => onUpdateFormat({ strikethrough: !activeFormat.strikethrough })}
                className={`p-1.5 rounded-lg transition-colors ${
                  activeFormat.strikethrough ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'
                }`}
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Colors */}
            <div className="flex items-center gap-1">
              <label className="flex items-center gap-1 cursor-pointer p-1 rounded-lg hover:bg-accent text-[11px]" title="Text Color">
                <span className="font-bold text-xs">A</span>
                <input
                  type="color"
                  value={activeFormat.textColor || '#1e293b'}
                  onChange={(e) => onUpdateFormat({ textColor: e.target.value })}
                  className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                />
              </label>

              <label className="flex items-center gap-1 cursor-pointer p-1 rounded-lg hover:bg-accent text-[11px]" title="Fill Color">
                <span className="p-0.5 bg-yellow-300 rounded text-slate-900 font-bold text-[10px]">F</span>
                <input
                  type="color"
                  value={activeFormat.bgColor || '#ffffff'}
                  onChange={(e) => onUpdateFormat({ bgColor: e.target.value })}
                  className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                />
              </label>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Alignment */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onUpdateFormat({ align: 'left' })}
                className={`p-1.5 rounded-lg ${activeFormat.align === 'left' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => onUpdateFormat({ align: 'center' })}
                className={`p-1.5 rounded-lg ${activeFormat.align === 'center' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                onClick={() => onUpdateFormat({ align: 'right' })}
                className={`p-1.5 rounded-lg ${activeFormat.align === 'right' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Number Formats */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onUpdateFormat({ numberFormat: 'currency' })}
                className="p-1.5 rounded-lg hover:bg-accent font-bold text-xs"
                title="Currency Format ($)"
              >
                <DollarSign className="h-4 w-4" />
              </button>
              <button
                onClick={() => onUpdateFormat({ numberFormat: 'percentage' })}
                className="p-1.5 rounded-lg hover:bg-accent font-bold text-xs"
                title="Percent Format (%)"
              >
                <Percent className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Row / Col Insert/Delete */}
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={onInsertRow} className="h-7 px-2 text-[11px]">
                + Row
              </Button>
              <Button size="sm" variant="outline" onClick={onInsertCol} className="h-7 px-2 text-[11px]">
                + Col
              </Button>
            </div>

            <div className="h-5 w-px bg-border mx-1" />

            <Button
              size="sm"
              variant="outline"
              onClick={onOpenConditionalModal}
              className="h-8 gap-1.5 px-2.5 font-bold text-xs bg-primary/5 text-primary border-primary/30"
            >
              <Sparkles className="h-3.5 w-3.5" /> Conditional Rules
            </Button>
          </div>
        )}

        {/* ── TAB: INSERT ── */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <Button size="sm" variant="outline" onClick={onOpenChartModal} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <BarChart3 className="h-3.5 w-3.5 text-primary" /> Interactive Chart
            </Button>
            <Button size="sm" variant="outline" onClick={onOpenPivotModal} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <TableProperties className="h-3.5 w-3.5 text-indigo-500" /> Pivot Table
            </Button>
            <Button size="sm" variant="outline" onClick={onOpenValidationModal} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-500" /> Data Validation
            </Button>
          </div>
        )}

        {/* ── TAB: FORMULAS ── */}
        {activeTab === 'formulas' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenFunctionLibraryModal}
              className="h-8 gap-1.5 px-2.5 font-bold text-xs bg-primary/5 text-primary border-primary/30"
            >
              <Sigma className="h-3.5 w-3.5" /> Function Library (70+ Functions)
            </Button>
          </div>
        )}

        {/* ── TAB: DATA ── */}
        {activeTab === 'data' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <Button size="sm" variant="outline" onClick={() => onSort('asc')} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <ArrowUpDown className="h-3.5 w-3.5 text-blue-500" /> Sort A &rarr; Z
            </Button>
            <Button size="sm" variant="outline" onClick={() => onSort('desc')} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <ArrowUpDown className="h-3.5 w-3.5 text-blue-500" /> Sort Z &rarr; A
            </Button>
            <Button size="sm" variant="outline" onClick={onOpenTextToColumnsModal} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <Columns className="h-3.5 w-3.5 text-indigo-500" /> Text to Columns
            </Button>
            <Button size="sm" variant="outline" onClick={onRemoveDuplicates} className="h-8 gap-1.5 px-2.5 text-xs font-semibold">
              <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Remove Duplicates
            </Button>
          </div>
        )}

        {/* ── TAB: REVIEW ── */}
        {activeTab === 'review' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <span className="text-xs text-muted-foreground font-semibold">
              Spreadsheet collaboration, cell comments, and change tracking are active in Master Cloud.
            </span>
          </div>
        )}

        {/* ── TAB: VIEW ── */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <button
              onClick={onToggleGridlines}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                showGridlines ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'
              }`}
            >
              Gridlines: {showGridlines ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={onToggleHeadings}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                showHeadings ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'
              }`}
            >
              Headings: {showHeadings ? 'ON' : 'OFF'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
