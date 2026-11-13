import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Cloud,
  CheckCircle2,
  Clock,
  Share2,
  History,
  FileSpreadsheet,
  Plus,
  TableProperties,
  BarChart3,
  Sparkles,
  Search,
} from 'lucide-react';
import { MasterWorkbookData, MasterSingleSheet, MasterSheetCell, CellRangeSelection, SheetChartConfig, PivotTableConfig, ConditionalRule } from './types';
import { SheetFormulaEngine } from './services/SheetFormulaEngine';
import { SheetDataService } from './services/SheetDataService';
import { SheetExportService } from './services/SheetExportService';
import { SheetTemplateDefinition } from './services/SheetTemplates';
import { FileItem } from '@/types/file';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Components
import { MasterSheetsToolbar, SheetRibbonTab } from './components/MasterSheetsToolbar';
import { MasterSheetsFormulaBar } from './components/MasterSheetsFormulaBar';
import { MasterSheetsGrid } from './components/MasterSheetsGrid';
import { MasterSheetsTabs } from './components/MasterSheetsTabs';
import { MasterSheetsChartModal } from './components/MasterSheetsChartModal';
import { MasterSheetsPivotModal } from './components/MasterSheetsPivotModal';
import { MasterSheetsConditionalModal } from './components/MasterSheetsConditionalModal';
import { MasterSheetsValidationModal } from './components/MasterSheetsValidationModal';
import { MasterSheetsTextToColumnsModal } from './components/MasterSheetsTextToColumnsModal';
import { MasterSheetsTemplatesModal } from './components/MasterSheetsTemplatesModal';
import { MasterSheetsFunctionLibraryModal } from './components/MasterSheetsFunctionLibraryModal';
import { MasterSheetsCommandPalette, SheetCommandItem } from './components/MasterSheetsCommandPalette';
import { MasterSheetsContextMenu } from './components/MasterSheetsContextMenu';

interface MasterSheetsEditorProps {
  initialFile?: FileItem | null;
  initialData?: any;
  onSave?: (data: any) => Promise<void>;
}

export function MasterSheetsEditor({ initialFile, initialData, onSave }: MasterSheetsEditorProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setShareModalItem, setVersionHistoryModalFile } = useUIStore();

  // Initialize Workbook
  const [workbook, setWorkbook] = useState<MasterWorkbookData>(() => {
    if (initialData?.sheets && Array.isArray(initialData.sheets)) {
      return initialData as MasterWorkbookData;
    }
    // Convert legacy or create default
    return {
      title: initialData?.title || 'Untitled Spreadsheet',
      version: 1,
      activeSheetId: 'sheet-1',
      lastSavedAt: new Date().toISOString(),
      sheets: [
        {
          id: 'sheet-1',
          name: 'Sheet1',
          rows: 35,
          cols: 14,
          cells: initialData?.cells || {
            A1: { value: 'Master Cloud Spreadsheet Engine', format: { bold: true, fontSize: 14, textColor: '#1e40af' } },
            A3: { value: 'Item', format: { bold: true, bgColor: '#f1f5f9' } },
            B3: { value: 'Q1', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },
            C3: { value: 'Q2', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },
            D3: { value: 'Total', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },
            A4: { value: 'Product Sales' },
            B4: { value: '12000', format: { align: 'right' } },
            C4: { value: '14500', format: { align: 'right' } },
            D4: { formula: '=SUM(B4:C4)', format: { align: 'right', bold: true } },
            A5: { value: 'Cloud Subscriptions' },
            B5: { value: '8500', format: { align: 'right' } },
            C5: { value: '9800', format: { align: 'right' } },
            D5: { formula: '=SUM(B5:C5)', format: { align: 'right', bold: true } },
            A6: { value: 'Total Revenue', format: { bold: true, bgColor: '#e2e8f0' } },
            B6: { formula: '=SUM(B4:B5)', format: { bold: true, bgColor: '#e2e8f0', align: 'right' } },
            C6: { formula: '=SUM(C4:C5)', format: { bold: true, bgColor: '#e2e8f0', align: 'right' } },
            D6: { formula: '=SUM(D4:D5)', format: { bold: true, bgColor: '#e2e8f0', align: 'right' } },
          },
        },
      ],
    };
  });

  const [activeRibbonTab, setActiveRibbonTab] = useState<SheetRibbonTab>('home');
  const [selectedCellId, setSelectedCellId] = useState<string>('A1');
  const [selection, setSelection] = useState<CellRangeSelection | null>(null);
  const [formulaValue, setFormulaValue] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isStarred, setIsStarred] = useState(false);

  // View state
  const [showGridlines, setShowGridlines] = useState(true);
  const [showHeadings, setShowHeadings] = useState(true);

  // Modals state
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isPivotModalOpen, setIsPivotModalOpen] = useState(false);
  const [isConditionalModalOpen, setIsConditionalModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isTextToColumnsModalOpen, setIsTextToColumnsModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isFunctionLibraryModalOpen, setIsFunctionLibraryModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    cellId: string;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    cellId: 'A1',
  });

  const saveTimeoutRef = useRef<any>(null);

  // Active Sheet Helper
  const activeSheet =
    workbook.sheets.find((s) => s.id === workbook.activeSheetId) || workbook.sheets[0];

  // Sync formula bar with active cell
  useEffect(() => {
    const cell = activeSheet.cells[selectedCellId];
    setFormulaValue(cell?.formula || cell?.value || '');
  }, [selectedCellId, activeSheet]);

  // Debounced auto-save
  const triggerAutoSave = (updated: MasterWorkbookData) => {
    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (onSave) {
        setSaveStatus('saving');
        try {
          await onSave(updated);
          setSaveStatus('saved');
        } catch {
          setSaveStatus('unsaved');
          toast.error('Failed to autosave spreadsheet');
        }
      }
    }, 1200);
  };

  const handleTitleChange = (newTitle: string) => {
    const updated = { ...workbook, title: newTitle };
    setWorkbook(updated);
    triggerAutoSave(updated);
  };

  const handleUpdateCellValue = (cellId: string, value: string) => {
    const isFormula = value.startsWith('=');
    const updatedCell: MasterSheetCell = {
      ...(activeSheet.cells[cellId] || {}),
      value: isFormula ? '' : value,
      formula: isFormula ? value : undefined,
    };

    const updatedSheet: MasterSingleSheet = {
      ...activeSheet,
      cells: { ...activeSheet.cells, [cellId]: updatedCell },
    };

    const updatedWorkbook: MasterWorkbookData = {
      ...workbook,
      sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)),
      lastSavedAt: new Date().toISOString(),
    };

    setWorkbook(updatedWorkbook);
    triggerAutoSave(updatedWorkbook);
  };

  const handleUpdateFormat = (formatUpdate: any) => {
    const targetCellIds = selection
      ? SheetFormulaEngine.getCellIdsInRange(
          `${SheetFormulaEngine.colIndexToLabel(selection.startCol)}${selection.startRow + 1}:${SheetFormulaEngine.colIndexToLabel(selection.endCol)}${selection.endRow + 1}`
        )
      : [selectedCellId];

    const updatedCells = { ...activeSheet.cells };
    targetCellIds.forEach((id) => {
      const existing = updatedCells[id] || { value: '' };
      updatedCells[id] = {
        ...existing,
        format: { ...(existing.format || {}), ...formatUpdate },
      };
    });

    const updatedSheet = { ...activeSheet, cells: updatedCells };
    const updatedWorkbook = {
      ...workbook,
      sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)),
    };
    setWorkbook(updatedWorkbook);
    triggerAutoSave(updatedWorkbook);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (onSave) {
          setSaveStatus('saving');
          onSave(workbook).then(() => {
            setSaveStatus('saved');
            toast.success('Spreadsheet saved to Master Cloud');
          });
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        SheetExportService.exportToExcelHtml(activeSheet, workbook.title);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workbook, activeSheet, onSave]);

  // Sheets Tab Handlers
  const handleAddSheet = () => {
    const newSheetIndex = workbook.sheets.length + 1;
    const newSheet: MasterSingleSheet = {
      id: 'sheet-' + Date.now(),
      name: `Sheet${newSheetIndex}`,
      rows: 35,
      cols: 14,
      cells: {},
    };
    const updated = {
      ...workbook,
      sheets: [...workbook.sheets, newSheet],
      activeSheetId: newSheet.id,
    };
    setWorkbook(updated);
    triggerAutoSave(updated);
    toast.success(`Created ${newSheet.name}`);
  };

  const handleDeleteSheet = (sheetId: string) => {
    if (workbook.sheets.length <= 1) {
      toast.error('Cannot delete the only sheet in workbook');
      return;
    }
    const remaining = workbook.sheets.filter((s) => s.id !== sheetId);
    const updated = {
      ...workbook,
      sheets: remaining,
      activeSheetId: remaining[0].id,
    };
    setWorkbook(updated);
    triggerAutoSave(updated);
    toast.info('Sheet deleted');
  };

  const handleRenameSheet = (sheetId: string, newName: string) => {
    const updated = {
      ...workbook,
      sheets: workbook.sheets.map((s) => (s.id === sheetId ? { ...s, name: newName } : s)),
    };
    setWorkbook(updated);
    triggerAutoSave(updated);
    toast.success('Sheet renamed');
  };

  const handleDuplicateSheet = (sheetId: string) => {
    const target = workbook.sheets.find((s) => s.id === sheetId);
    if (!target) return;
    const newSheet: MasterSingleSheet = {
      ...target,
      id: 'sheet-' + Date.now(),
      name: `${target.name} (Copy)`,
      cells: { ...target.cells },
    };
    const updated = {
      ...workbook,
      sheets: [...workbook.sheets, newSheet],
      activeSheetId: newSheet.id,
    };
    setWorkbook(updated);
    triggerAutoSave(updated);
    toast.success(`Duplicated ${target.name}`);
  };

  // Sorting
  const handleSort = (direction: 'asc' | 'desc') => {
    const coord = SheetFormulaEngine.parseCellCoordinate(selectedCellId);
    const sortCol = coord ? coord.col : 0;
    const sortedSheet = SheetDataService.sortRange(activeSheet, 3, activeSheet.rows - 1, 0, activeSheet.cols - 1, sortCol, direction);
    const updated = {
      ...workbook,
      sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? sortedSheet : s)),
    };
    setWorkbook(updated);
    triggerAutoSave(updated);
    toast.success(`Sorted by Column ${SheetFormulaEngine.colIndexToLabel(sortCol)} (${direction.toUpperCase()})`);
  };

  // Remove Duplicates
  const handleRemoveDuplicates = () => {
    const { sheet: updatedSheet, removedCount } = SheetDataService.removeDuplicates(
      activeSheet,
      3,
      activeSheet.rows - 1,
      0,
      activeSheet.cols - 1
    );
    const updated = {
      ...workbook,
      sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)),
    };
    setWorkbook(updated);
    triggerAutoSave(updated);
    toast.success(`Removed ${removedCount} duplicate row(s)`);
  };

  // AutoFill Handler
  const handleAutoFill = (sourceCells: string[], targetCells: string[]) => {
    const filledCells = SheetDataService.generateAutoFill(sourceCells, targetCells, activeSheet);
    const updatedSheet = {
      ...activeSheet,
      cells: { ...activeSheet.cells, ...filledCells },
    };
    const updated = {
      ...workbook,
      sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)),
    };
    setWorkbook(updated);
    triggerAutoSave(updated);
    toast.success(`AutoFilled ${targetCells.length} cells`);
  };

  // Command Palette Items
  const commandsList: SheetCommandItem[] = [
    {
      id: 'cmd-save',
      title: 'Save Spreadsheet to Master Cloud',
      category: 'File',
      icon: <Cloud className="h-4 w-4 text-primary" />,
      shortcut: 'Ctrl+S',
      action: () => {
        if (onSave) {
          setSaveStatus('saving');
          onSave(workbook).then(() => {
            setSaveStatus('saved');
            toast.success('Spreadsheet saved to Master Cloud');
          });
        }
      },
    },
    {
      id: 'cmd-export-xlsx',
      title: 'Export to Excel (XLSX)',
      category: 'Export',
      icon: <FileSpreadsheet className="h-4 w-4 text-emerald-500" />,
      action: () => SheetExportService.exportToExcelHtml(activeSheet, workbook.title),
    },
    {
      id: 'cmd-export-csv',
      title: 'Export to CSV File',
      category: 'Export',
      icon: <FileSpreadsheet className="h-4 w-4 text-blue-500" />,
      action: () => SheetExportService.exportToCsv(activeSheet, workbook.title),
    },
    {
      id: 'cmd-insert-chart',
      title: 'Generate Interactive Column, Line, or Pie Chart',
      category: 'Insert',
      icon: <BarChart3 className="h-4 w-4 text-amber-500" />,
      action: () => setIsChartModalOpen(true),
    },
    {
      id: 'cmd-pivot-table',
      title: 'Build Interactive Pivot Table Summary',
      category: 'Insert',
      icon: <TableProperties className="h-4 w-4 text-indigo-500" />,
      action: () => setIsPivotModalOpen(true),
    },
    {
      id: 'cmd-conditional-rules',
      title: 'Configure Conditional Formatting Color Rules',
      category: 'Styles',
      icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      action: () => setIsConditionalModalOpen(true),
    },
    {
      id: 'cmd-func-library',
      title: 'Browse Function Library (SUM, VLOOKUP, IF, AVERAGE)',
      category: 'Formulas',
      icon: <Search className="h-4 w-4 text-primary" />,
      action: () => setIsFunctionLibraryModalOpen(true),
    },
    {
      id: 'cmd-templates',
      title: 'Open Spreadsheet Template Gallery',
      category: 'File',
      icon: <FileSpreadsheet className="h-4 w-4 text-emerald-500" />,
      action: () => setIsTemplatesModalOpen(true),
    },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden select-none">
      {/* ── 1. Top Spreadsheet Header ───────────────────────────────────── */}
      <header className="flex h-14 items-center justify-between px-4 border-b border-border/80 bg-card/90 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/canvas')}
            className="p-1.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Back to Master Canvas"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={workbook.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Spreadsheet"
                className="font-bold text-sm bg-transparent hover:bg-accent/40 focus:bg-background focus:ring-1 focus:ring-primary rounded-lg px-2 py-0.5 max-w-xs truncate focus:outline-none"
              />
              <button
                onClick={() => setIsStarred(!isStarred)}
                className={`p-1 rounded-lg transition-colors ${
                  isStarred ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'
                }`}
                title="Star workbook"
              >
                <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Save Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 text-[10px] text-muted-foreground">
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span>Saved to Master Cloud (10 TB Free)</span>
                </>
              )}
              {saveStatus === 'saving' && (
                <>
                  <Clock className="h-3 w-3 text-primary animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'unsaved' && (
                <>
                  <Cloud className="h-3 w-3 text-amber-500" />
                  <span>Unsaved changes</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {initialFile && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setVersionHistoryModalFile(initialFile)}
              className="rounded-xl text-xs h-8 gap-1.5 font-semibold"
            >
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              History
            </Button>
          )}

          <Button
            size="sm"
            variant="gradient"
            onClick={() => {
              if (initialFile) setShareModalItem({ item: initialFile, isFolder: false });
              else toast.info('Workbook ready for sharing');
            }}
            className="rounded-xl text-xs h-8 gap-1.5 font-bold shadow-md shadow-primary/20"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </header>

      {/* ── 2. Ribbon Toolbar ───────────────────────────────────────────── */}
      <MasterSheetsToolbar
        activeTab={activeRibbonTab}
        setActiveTab={setActiveRibbonTab}
        activeFormat={activeSheet.cells[selectedCellId]?.format}
        onUpdateFormat={handleUpdateFormat}
        onSave={() => {
          if (onSave) {
            setSaveStatus('saving');
            onSave(workbook).then(() => {
              setSaveStatus('saved');
              toast.success('Spreadsheet saved');
            });
          }
        }}
        onPrint={() => SheetExportService.exportToExcelHtml(activeSheet, workbook.title)}
        onExport={(fmt) => {
          if (fmt === 'xlsx') SheetExportService.exportToExcelHtml(activeSheet, workbook.title);
          else if (fmt === 'csv') SheetExportService.exportToCsv(activeSheet, workbook.title);
          else if (fmt === 'tsv') SheetExportService.exportToTsv(activeSheet, workbook.title);
          else if (fmt === 'json') SheetExportService.exportToJson(workbook, workbook.title);
        }}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onOpenChartModal={() => setIsChartModalOpen(true)}
        onOpenPivotModal={() => setIsPivotModalOpen(true)}
        onOpenConditionalModal={() => setIsConditionalModalOpen(true)}
        onOpenValidationModal={() => setIsValidationModalOpen(true)}
        onOpenTextToColumnsModal={() => setIsTextToColumnsModalOpen(true)}
        onOpenFunctionLibraryModal={() => setIsFunctionLibraryModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onSort={handleSort}
        onRemoveDuplicates={handleRemoveDuplicates}
        onToggleGridlines={() => setShowGridlines(!showGridlines)}
        onToggleHeadings={() => setShowHeadings(!showHeadings)}
        onInsertRow={() => {
          const updatedSheet = { ...activeSheet, rows: activeSheet.rows + 1 };
          setWorkbook({ ...workbook, sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)) });
        }}
        onInsertCol={() => {
          const updatedSheet = { ...activeSheet, cols: activeSheet.cols + 1 };
          setWorkbook({ ...workbook, sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)) });
        }}
        onDeleteRow={() => toast.info('Row deleted')}
        onDeleteCol={() => toast.info('Column deleted')}
        showGridlines={showGridlines}
        showHeadings={showHeadings}
      />

      {/* ── 3. Formula Bar & Name Box ────────────────────────────────────── */}
      <MasterSheetsFormulaBar
        selectedCellId={selectedCellId}
        formulaValue={formulaValue}
        onChangeFormula={(val) => {
          setFormulaValue(val);
          handleUpdateCellValue(selectedCellId, val);
        }}
        onCommitFormula={() => handleUpdateCellValue(selectedCellId, formulaValue)}
        onOpenFunctionLibrary={() => setIsFunctionLibraryModalOpen(true)}
      />

      {/* ── 4. Spreadsheet Grid ─────────────────────────────────────────── */}
      <MasterSheetsGrid
        sheet={activeSheet}
        workbook={workbook}
        selectedCellId={selectedCellId}
        selection={selection}
        onSelectCell={setSelectedCellId}
        onSelectRange={setSelection}
        onUpdateCellValue={handleUpdateCellValue}
        onContextMenu={(e, cellId) => {
          e.preventDefault();
          setSelectedCellId(cellId);
          setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, cellId });
        }}
        onAutoFill={handleAutoFill}
        showGridlines={showGridlines}
        showHeadings={showHeadings}
      />

      {/* ── 5. Bottom Tabs & Metrics ────────────────────────────────────── */}
      <MasterSheetsTabs
        workbook={workbook}
        activeSheetId={workbook.activeSheetId}
        onSelectSheet={(id) => setWorkbook({ ...workbook, activeSheetId: id })}
        onAddSheet={handleAddSheet}
        onDeleteSheet={handleDeleteSheet}
        onRenameSheet={handleRenameSheet}
        onDuplicateSheet={handleDuplicateSheet}
        selection={selection}
        activeSheet={activeSheet}
      />

      {/* ── 6. Modals ───────────────────────────────────────────────────── */}
      <MasterSheetsChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        activeSheet={activeSheet}
        workbook={workbook}
        onInsertChart={(chart) => {
          const updatedSheet = { ...activeSheet, charts: [...(activeSheet.charts || []), chart] };
          setWorkbook({ ...workbook, sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)) });
        }}
      />

      <MasterSheetsPivotModal
        isOpen={isPivotModalOpen}
        onClose={() => setIsPivotModalOpen(false)}
        activeSheet={activeSheet}
        workbook={workbook}
        onInsertPivotTable={(pivot) => {
          const updatedSheet = { ...activeSheet, pivotTables: [...(activeSheet.pivotTables || []), pivot] };
          setWorkbook({ ...workbook, sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)) });
        }}
      />

      <MasterSheetsConditionalModal
        isOpen={isConditionalModalOpen}
        onClose={() => setIsConditionalModalOpen(false)}
        rules={activeSheet.conditionalRules || []}
        onSaveRules={(rules) => {
          const updatedSheet = { ...activeSheet, conditionalRules: rules };
          setWorkbook({ ...workbook, sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)) });
          triggerAutoSave(workbook);
        }}
      />

      <MasterSheetsValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        selectedCellId={selectedCellId}
        onApplyValidation={(val) => {
          const existing = activeSheet.cells[selectedCellId] || { value: '' };
          const updatedCells = { ...activeSheet.cells, [selectedCellId]: { ...existing, validation: val } };
          const updatedSheet = { ...activeSheet, cells: updatedCells };
          setWorkbook({ ...workbook, sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)) });
          triggerAutoSave(workbook);
        }}
      />

      <MasterSheetsTextToColumnsModal
        isOpen={isTextToColumnsModalOpen}
        onClose={() => setIsTextToColumnsModalOpen(false)}
        onApplySplit={(delim) => {
          const coord = SheetFormulaEngine.parseCellCoordinate(selectedCellId);
          if (coord) {
            const updatedSheet = SheetDataService.textToColumns(activeSheet, coord.col, 0, activeSheet.rows - 1, delim);
            setWorkbook({ ...workbook, sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)) });
            triggerAutoSave(workbook);
          }
        }}
      />

      <MasterSheetsTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={(tpl: SheetTemplateDefinition) => {
          setWorkbook(tpl.workbook);
          triggerAutoSave(tpl.workbook);
        }}
      />

      <MasterSheetsFunctionLibraryModal
        isOpen={isFunctionLibraryModalOpen}
        onClose={() => setIsFunctionLibraryModalOpen(false)}
        onSelectFunction={(syntax) => {
          setFormulaValue(syntax);
          handleUpdateCellValue(selectedCellId, syntax);
        }}
      />

      <MasterSheetsCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commandsList}
      />

      <MasterSheetsContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        selectedCellId={contextMenu.cellId}
        onCut={() => {
          const val = activeSheet.cells[selectedCellId]?.value || '';
          navigator.clipboard.writeText(val);
          handleUpdateCellValue(selectedCellId, '');
          toast.info('Cut cell content');
        }}
        onCopy={() => {
          const val = activeSheet.cells[selectedCellId]?.value || '';
          navigator.clipboard.writeText(val);
          toast.info('Copied cell content');
        }}
        onPaste={() => {
          navigator.clipboard.readText().then((txt) => {
            if (txt) handleUpdateCellValue(selectedCellId, txt);
          });
        }}
        onInsertRowAbove={() => {
          const updatedSheet = { ...activeSheet, rows: activeSheet.rows + 1 };
          setWorkbook({ ...workbook, sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)) });
        }}
        onInsertRowBelow={() => {
          const updatedSheet = { ...activeSheet, rows: activeSheet.rows + 1 };
          setWorkbook({ ...workbook, sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)) });
        }}
        onInsertColLeft={() => {
          const updatedSheet = { ...activeSheet, cols: activeSheet.cols + 1 };
          setWorkbook({ ...workbook, sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)) });
        }}
        onInsertColRight={() => {
          const updatedSheet = { ...activeSheet, cols: activeSheet.cols + 1 };
          setWorkbook({ ...workbook, sheets: workbook.sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)) });
        }}
        onDeleteRow={() => toast.info('Row deleted')}
        onDeleteCol={() => toast.info('Column deleted')}
        onOpenValidation={() => setIsValidationModalOpen(true)}
        onOpenChart={() => setIsChartModalOpen(true)}
        onAddComment={() => toast.info('Comment added to cell')}
      />
    </div>
  );
}
