import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileSpreadsheet,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CanvasSheetData, SheetCell } from '@/types/canvas';
import { CanvasService } from '@/services/canvasService';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';

interface MasterSheetsEditorProps {
  initialFile?: FileItem | null;
  initialData?: CanvasSheetData | null;
  onSave?: (data: CanvasSheetData) => Promise<void>;
}

// Convert column index (0-based) to letter: 0 -> A, 25 -> Z, 26 -> AA
function getColLabel(index: number): string {
  let label = '';
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode((i % 26) + 65) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
}

// Convert column letter to 0-based index: A -> 0, Z -> 25
function getColIndex(label: string): number {
  let index = 0;
  for (let i = 0; i < label.length; i++) {
    index = index * 26 + (label.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function MasterSheetsEditor({ initialFile, initialData, onSave }: MasterSheetsEditorProps) {
  const navigate = useNavigate();
  const [sheetData, setSheetData] = useState<CanvasSheetData>(() => initialData || CanvasService.getDefaultSheetData());
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setSheetData(initialData);
    }
  }, [initialData]);

  // Debounced auto-save
  const triggerAutoSave = (updated: CanvasSheetData) => {
    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (onSave) {
        setSaveStatus('saving');
        try {
          await onSave(updated);
          setSaveStatus('saved');
        } catch (err) {
          setSaveStatus('unsaved');
          toast.error('Failed to save spreadsheet');
        }
      }
    }, 1500);
  };

  const handleTitleChange = (newTitle: string) => {
    const updated = { ...sheetData, title: newTitle };
    setSheetData(updated);
    triggerAutoSave(updated);
  };

  // Safe formula evaluator
  const evaluateCellValue = (cellId: string, cells: Record<string, SheetCell>, visited = new Set<string>()): string => {
    const cell = cells[cellId];
    if (!cell) return '';

    const raw = cell.formula || cell.value || '';
    if (!raw.startsWith('=')) return raw;

    // Cycle detection
    if (visited.has(cellId)) return '#CYCLE!';
    visited.add(cellId);

    const expr = raw.substring(1).trim().toUpperCase();

    // 1. =SUM(A1:A5)
    const sumMatch = expr.match(/^SUM\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)$/);
    if (sumMatch) {
      const [, start, end] = sumMatch;
      const values = getRangeValues(start, end, cells, visited);
      const sum = values.reduce((acc, v) => acc + (isNaN(Number(v)) ? 0 : Number(v)), 0);
      return String(sum);
    }

    // 2. =AVERAGE(A1:A5)
    const avgMatch = expr.match(/^AVERAGE\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)$/);
    if (avgMatch) {
      const [, start, end] = avgMatch;
      const values = getRangeValues(start, end, cells, visited);
      const numeric = values.map(Number).filter(v => !isNaN(v));
      if (numeric.length === 0) return '0';
      const avg = numeric.reduce((acc, v) => acc + v, 0) / numeric.length;
      return String(Number(avg.toFixed(2)));
    }

    // 3. =COUNT(A1:A5)
    const countMatch = expr.match(/^COUNT\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)$/);
    if (countMatch) {
      const [, start, end] = countMatch;
      const values = getRangeValues(start, end, cells, visited);
      const count = values.filter(v => v !== '').length;
      return String(count);
    }

    // 4. =MIN(A1:A5), =MAX(A1:A5)
    const minMatch = expr.match(/^MIN\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)$/);
    if (minMatch) {
      const values = getRangeValues(minMatch[1], minMatch[2], cells, visited).map(Number).filter(v => !isNaN(v));
      return values.length ? String(Math.min(...values)) : '0';
    }
    const maxMatch = expr.match(/^MAX\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)$/);
    if (maxMatch) {
      const values = getRangeValues(maxMatch[1], maxMatch[2], cells, visited).map(Number).filter(v => !isNaN(v));
      return values.length ? String(Math.max(...values)) : '0';
    }

    // 5. Basic arithmetic like =A1+B1 or =C2*D2
    try {
      const replaced = expr.replace(/[A-Z]+[0-9]+/g, (match) => {
        const val = evaluateCellValue(match, cells, new Set(visited));
        return isNaN(Number(val)) ? '0' : val;
      });
      // Sanitize before Function
      if (/^[0-9+\-*/().\s]+$/.test(replaced)) {
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict"; return (${replaced})`)();
        return String(Number(Number(res).toFixed(2)));
      }
    } catch (e) {
      return '#ERROR!';
    }

    return raw;
  };

  const getRangeValues = (
    start: string,
    end: string,
    cells: Record<string, SheetCell>,
    visited: Set<string>
  ): string[] => {
    const startColLetter = start.match(/[A-Z]+/)?.[0] || 'A';
    const startRow = parseInt(start.match(/[0-9]+/)?.[0] || '1', 10);
    const endColLetter = end.match(/[A-Z]+/)?.[0] || 'A';
    const endRow = parseInt(end.match(/[0-9]+/)?.[0] || '1', 10);

    const startCol = getColIndex(startColLetter);
    const endCol = getColIndex(endColLetter);

    const values: string[] = [];
    for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
      for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
        const id = `${getColLabel(c)}${r}`;
        values.push(evaluateCellValue(id, cells, visited));
      }
    }
    return values;
  };

  // Cell Updates
  const updateCell = (cellId: string, updates: Partial<SheetCell>) => {
    const existing = sheetData.cells[cellId] || { value: '' };
    const updatedCells = {
      ...sheetData.cells,
      [cellId]: {
        ...existing,
        ...updates,
      },
    };
    const updated: CanvasSheetData = {
      ...sheetData,
      cells: updatedCells,
      lastSavedAt: new Date().toISOString(),
    };
    setSheetData(updated);
    triggerAutoSave(updated);
  };

  const handleCellClick = (cellId: string) => {
    if (editingCell && editingCell !== cellId) {
      finishEditing();
    }
    setSelectedCell(cellId);
  };

  const handleCellDoubleClick = (cellId: string) => {
    setSelectedCell(cellId);
    setEditingCell(cellId);
    const cell = sheetData.cells[cellId];
    setEditValue(cell?.formula || cell?.value || '');
  };

  const finishEditing = () => {
    if (!editingCell) return;
    const isFormula = editValue.startsWith('=');
    updateCell(editingCell, {
      value: editValue,
      formula: isFormula ? editValue : undefined,
    });
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        finishEditing();
        // Move selection down
        const col = selectedCell.match(/[A-Z]+/)?.[0] || 'A';
        const row = parseInt(selectedCell.match(/[0-9]+/)?.[0] || '1', 10);
        setSelectedCell(`${col}${Math.min(sheetData.rows, row + 1)}`);
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
      return;
    }

    const colLetter = selectedCell.match(/[A-Z]+/)?.[0] || 'A';
    const row = parseInt(selectedCell.match(/[0-9]+/)?.[0] || '1', 10);
    const col = getColIndex(colLetter);

    if (e.key === 'ArrowUp' && row > 1) {
      setSelectedCell(`${colLetter}${row - 1}`);
    } else if (e.key === 'ArrowDown' && row < sheetData.rows) {
      setSelectedCell(`${colLetter}${row + 1}`);
    } else if (e.key === 'ArrowLeft' && col > 0) {
      setSelectedCell(`${getColLabel(col - 1)}${row}`);
    } else if (e.key === 'ArrowRight' && col < sheetData.cols - 1) {
      setSelectedCell(`${getColLabel(col + 1)}${row}`);
    } else if (e.key === 'Enter' || e.key === 'F2') {
      handleCellDoubleClick(selectedCell);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      updateCell(selectedCell, { value: '', formula: undefined });
    }
  };

  // Styling Actions
  const toggleStyle = (style: 'bold' | 'italic') => {
    const current = sheetData.cells[selectedCell]?.[style];
    updateCell(selectedCell, { [style]: !current });
  };

  const setAlign = (align: 'left' | 'center' | 'right') => {
    updateCell(selectedCell, { align });
  };

  // Add Row & Column
  const addRow = () => {
    const updated = { ...sheetData, rows: sheetData.rows + 5 };
    setSheetData(updated);
    triggerAutoSave(updated);
    toast.success('Added 5 rows');
  };

  const addCol = () => {
    const updated = { ...sheetData, cols: Math.min(26, sheetData.cols + 3) };
    setSheetData(updated);
    triggerAutoSave(updated);
    toast.success('Added 3 columns');
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows: string[] = [];
    for (let r = 1; r <= sheetData.rows; r++) {
      const rowValues: string[] = [];
      let hasData = false;
      for (let c = 0; c < sheetData.cols; c++) {
        const id = `${getColLabel(c)}${r}`;
        const val = evaluateCellValue(id, sheetData.cells);
        if (val) hasData = true;
        // Escape quotes
        rowValues.push(`"${String(val).replace(/"/g, '""')}"`);
      }
      if (hasData || r <= 10) {
        rows.push(rowValues.join(','));
      }
    }
    const csvContent = rows.join('\n');
    CanvasService.exportToLocalFile(`${sheetData.title}.csv`, csvContent, 'text/csv');
    toast.success('Spreadsheet exported as CSV');
  };

  // Selected cell display
  const currentCellObj = sheetData.cells[selectedCell];
  const currentFormula = currentCellObj?.formula || currentCellObj?.value || '';

  return (
    <div className="flex flex-col h-full bg-background text-foreground select-none" onKeyDown={handleKeyDown}>
      {/* Top Header */}
      <header className="h-14 border-b border-border/60 px-4 flex items-center justify-between bg-card/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/canvas')}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Master Canvas"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <input
                type="text"
                value={sheetData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="font-bold text-sm bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none px-1 py-0.5 max-w-xs transition-colors"
                placeholder="Untitled Spreadsheet"
              />
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Clock className="h-3 w-3 animate-spin" /> Saving to Master Cloud...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle2 className="h-3 w-3" /> All changes saved in Master Cloud
                  </span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="flex items-center gap-1 text-muted-foreground">Unsaved edits</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/70 hover:bg-accent text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Row</span>
          </button>
          <button
            onClick={addCol}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/70 hover:bg-accent text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Col</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/70 hover:bg-accent text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Toolbar & Formula Bar */}
      <div className="h-11 border-b border-border/50 px-4 flex items-center gap-2 bg-card/20 shrink-0">
        <div className="flex items-center gap-1 border-r border-border/50 pr-2">
          <button
            onClick={() => toggleStyle('bold')}
            className={`p-1.5 rounded-md hover:bg-accent ${currentCellObj?.bold ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => toggleStyle('italic')}
            className={`p-1.5 rounded-md hover:bg-accent ${currentCellObj?.italic ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-border/50 pr-2">
          <button
            onClick={() => setAlign('left')}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
            title="Align Left"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setAlign('center')}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
            title="Align Center"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setAlign('right')}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
            title="Align Right"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Selected Cell Badge */}
        <div className="flex items-center gap-2 flex-1">
          <div className="w-14 text-center font-mono font-bold text-xs bg-muted/60 py-1 rounded-md border border-border/50">
            {selectedCell}
          </div>
          <span className="font-mono text-xs text-muted-foreground font-bold italic">fx</span>
          <input
            type="text"
            value={editingCell === selectedCell ? editValue : currentFormula}
            onChange={(e) => {
              setEditValue(e.target.value);
              if (!editingCell) setEditingCell(selectedCell);
            }}
            onFocus={() => {
              setEditingCell(selectedCell);
              setEditValue(currentFormula);
            }}
            onBlur={finishEditing}
            className="flex-1 bg-background border border-border/70 rounded-md px-2.5 py-1 text-xs font-mono focus:border-primary focus:outline-none"
            placeholder="Type value or formula (e.g. =SUM(A1:A5), =A1*B1)"
          />
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto bg-card">
        <table className="border-collapse table-fixed w-full text-xs font-sans">
          {/* Header row with column letters */}
          <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur-sm shadow-sm">
            <tr>
              <th className="w-12 h-7 border border-border/60 bg-muted/90 text-center font-mono text-[10px] text-muted-foreground"></th>
              {Array.from({ length: sheetData.cols }).map((_, c) => (
                <th
                  key={c}
                  className="w-28 h-7 border border-border/60 bg-muted/90 text-center font-mono font-semibold text-[11px] text-muted-foreground"
                >
                  {getColLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: sheetData.rows }).map((_, r) => {
              const rowNum = r + 1;
              return (
                <tr key={rowNum} className="h-7">
                  {/* Row header */}
                  <td className="w-12 border border-border/60 bg-muted/70 text-center font-mono text-[10px] font-medium text-muted-foreground select-none sticky left-0 z-10">
                    {rowNum}
                  </td>
                  {/* Cells */}
                  {Array.from({ length: sheetData.cols }).map((_, c) => {
                    const colLetter = getColLabel(c);
                    const cellId = `${colLetter}${rowNum}`;
                    const cell = sheetData.cells[cellId];
                    const isSelected = selectedCell === cellId;
                    const isEditing = editingCell === cellId;
                    const displayVal = evaluateCellValue(cellId, sheetData.cells);

                    return (
                      <td
                        key={cellId}
                        onClick={() => handleCellClick(cellId)}
                        onDoubleClick={() => handleCellDoubleClick(cellId)}
                        style={{
                          backgroundColor: cell?.bgColor,
                          color: cell?.textColor,
                          textAlign: cell?.align || (isNaN(Number(displayVal)) ? 'left' : 'right'),
                          fontWeight: cell?.bold ? 'bold' : 'normal',
                          fontStyle: cell?.italic ? 'italic' : 'normal',
                        }}
                        className={`px-2 py-1 border border-border/40 truncate cursor-cell transition-all relative ${
                          isSelected ? 'outline outline-2 outline-primary z-10 bg-primary/10' : 'hover:bg-accent/30'
                        }`}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={finishEditing}
                            autoFocus
                            className="w-full h-full bg-background border-none outline-none font-mono text-xs p-0 m-0"
                          />
                        ) : (
                          displayVal
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <footer className="h-8 border-t border-border/50 px-4 flex items-center justify-between text-[11px] text-muted-foreground bg-card/30 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">Cell: {selectedCell}</span>
          <span>Rows: {sheetData.rows}</span>
          <span>Cols: {sheetData.cols}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Master Sheets Engine v2.4</span>
        </div>
      </footer>
    </div>
  );
}
