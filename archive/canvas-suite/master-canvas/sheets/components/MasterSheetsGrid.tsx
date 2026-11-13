import React, { useState, useRef, useEffect } from 'react';
import { MasterSingleSheet, MasterWorkbookData, MasterSheetCell, CellRangeSelection } from '../types';
import { SheetFormulaEngine } from '../services/SheetFormulaEngine';
import { SheetDataService } from '../services/SheetDataService';

interface MasterSheetsGridProps {
  sheet: MasterSingleSheet;
  workbook: MasterWorkbookData;
  selectedCellId: string;
  selection: CellRangeSelection | null;
  onSelectCell: (cellId: string) => void;
  onSelectRange: (range: CellRangeSelection | null) => void;
  onUpdateCellValue: (cellId: string, value: string) => void;
  onContextMenu: (e: React.MouseEvent, cellId: string) => void;
  onAutoFill: (sourceCells: string[], targetCells: string[]) => void;
  showGridlines: boolean;
  showHeadings: boolean;
}

export function MasterSheetsGrid({
  sheet,
  workbook,
  selectedCellId,
  selection,
  onSelectCell,
  onSelectRange,
  onUpdateCellValue,
  onContextMenu,
  onAutoFill,
  showGridlines,
  showHeadings,
}: MasterSheetsGridProps) {
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStartCoord, setDragStartCoord] = useState<{ row: number; col: number } | null>(null);
  const [isDraggingFillHandle, setIsDraggingFillHandle] = useState(false);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const numRows = Math.max(sheet.rows || 30, 30);
  const numCols = Math.max(sheet.cols || 12, 12);

  // Focus inline input on edit
  useEffect(() => {
    if (editingCellId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCellId]);

  const handleCellMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    const cellId = `${SheetFormulaEngine.colIndexToLabel(c)}${r + 1}`;
    onSelectCell(cellId);
    setDragStartCoord({ row: r, col: c });
    setIsMouseDown(true);
    onSelectRange({ startRow: r, startCol: c, endRow: r, endCol: c });

    // If already editing another cell, commit it
    if (editingCellId && editingCellId !== cellId) {
      onUpdateCellValue(editingCellId, editValue);
      setEditingCellId(null);
    }
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (!isMouseDown || !dragStartCoord) return;

    const startRow = Math.min(dragStartCoord.row, r);
    const endRow = Math.max(dragStartCoord.row, r);
    const startCol = Math.min(dragStartCoord.col, c);
    const endCol = Math.max(dragStartCoord.col, c);

    onSelectRange({ startRow, startCol, endRow, endCol });
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    if (isDraggingFillHandle && selection) {
      setIsDraggingFillHandle(false);
      // AutoFill logic trigger
      const sourceCells = [selectedCellId];
      const targetCells = SheetFormulaEngine.getCellIdsInRange(
        `${SheetFormulaEngine.colIndexToLabel(selection.startCol)}${selection.startRow + 1}:${SheetFormulaEngine.colIndexToLabel(selection.endCol)}${selection.endRow + 1}`
      ).filter((id) => id !== selectedCellId);

      if (targetCells.length > 0) {
        onAutoFill(sourceCells, targetCells);
      }
    }
  };

  const handleCellDoubleClick = (r: number, c: number) => {
    const cellId = `${SheetFormulaEngine.colIndexToLabel(c)}${r + 1}`;
    const rawVal = sheet.cells[cellId]?.formula || sheet.cells[cellId]?.value || '';
    setEditingCellId(cellId);
    setEditValue(rawVal);
  };

  const handleCommitEdit = () => {
    if (editingCellId) {
      onUpdateCellValue(editingCellId, editValue);
      setEditingCellId(null);
    }
  };

  const isCellInSelection = (r: number, c: number): boolean => {
    if (!selection) return false;
    return (
      r >= selection.startRow &&
      r <= selection.endRow &&
      c >= selection.startCol &&
      c <= selection.endCol
    );
  };

  return (
    <div
      ref={gridContainerRef}
      onMouseUp={handleMouseUp}
      className="flex-1 overflow-auto bg-background min-h-0 relative select-none"
    >
      <table className={`border-collapse table-fixed w-max text-xs ${showGridlines ? '' : 'border-0'}`}>
        {/* Column Headers (A, B, C...) */}
        {showHeadings && (
          <thead>
            <tr className="bg-muted/70 sticky top-0 z-20">
              <th className="w-12 h-7 bg-muted border-b border-r border-border/80 sticky left-0 z-30 text-[10px] text-muted-foreground font-mono text-center">
                #
              </th>
              {Array.from({ length: numCols }).map((_, c) => {
                const colLabel = SheetFormulaEngine.colIndexToLabel(c);
                const isColSelected =
                  selection && c >= selection.startCol && c <= selection.endCol;
                return (
                  <th
                    key={c}
                    style={{ width: `${sheet.colWidths?.[c] || 100}px` }}
                    className={`h-7 border-b border-r border-border/80 font-mono text-[11px] font-bold transition-colors ${
                      isColSelected ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {colLabel}
                  </th>
                );
              })}
            </tr>
          </thead>
        )}

        {/* Rows & Cells */}
        <tbody>
          {Array.from({ length: numRows }).map((_, r) => {
            const isRowSelected =
              selection && r >= selection.startRow && r <= selection.endRow;
            return (
              <tr key={r} className="h-7">
                {/* Row Header (1, 2, 3...) */}
                {showHeadings && (
                  <td
                    className={`w-12 bg-muted/70 border-b border-r border-border/80 sticky left-0 z-10 text-[10px] font-mono font-bold text-center transition-colors ${
                      isRowSelected ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {r + 1}
                  </td>
                )}

                {/* Cells */}
                {Array.from({ length: numCols }).map((_, c) => {
                  const cellId = `${SheetFormulaEngine.colIndexToLabel(c)}${r + 1}`;
                  const cell = sheet.cells[cellId];
                  const isSelected = cellId === selectedCellId;
                  const inRange = isCellInSelection(r, c);
                  const isEditing = editingCellId === cellId;

                  // Evaluate display value
                  const displayValue = SheetFormulaEngine.evaluateCell(cellId, sheet, workbook);

                  // Conditional Formatting style
                  const condStyle = SheetDataService.getConditionalStyle(
                    cellId,
                    displayValue,
                    sheet.conditionalRules || []
                  );

                  const bgColor = condStyle.bgColor || cell?.format?.bgColor || 'transparent';
                  const textColor = condStyle.textColor || cell?.format?.textColor || 'inherit';
                  const isBold = condStyle.bold || cell?.format?.bold;

                  return (
                    <td
                      key={c}
                      onMouseDown={(e) => handleCellMouseDown(r, c, e)}
                      onMouseEnter={() => handleCellMouseEnter(r, c)}
                      onDoubleClick={() => handleCellDoubleClick(r, c)}
                      onContextMenu={(e) => onContextMenu(e, cellId)}
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(37, 99, 235, 0.08)'
                          : inRange
                          ? 'rgba(37, 99, 235, 0.04)'
                          : bgColor,
                        color: textColor,
                        fontWeight: isBold ? 'bold' : 'normal',
                        fontStyle: cell?.format?.italic ? 'italic' : 'normal',
                        textDecoration: cell?.format?.underline ? 'underline' : 'none',
                        textAlign: cell?.format?.align || 'left',
                      }}
                      className={`relative px-2 py-1 text-xs truncate transition-shadow ${
                        showGridlines ? 'border-b border-r border-border/60' : ''
                      } ${
                        isSelected
                          ? 'ring-2 ring-primary ring-inset z-10'
                          : inRange
                          ? 'ring-1 ring-primary/40 ring-inset'
                          : ''
                      }`}
                    >
                      {/* Cell Inline Input when active edit */}
                      {isEditing ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCommitEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitEdit();
                            else if (e.key === 'Escape') setEditingCellId(null);
                          }}
                          className="absolute inset-0 w-full h-full bg-background text-foreground px-2 font-mono text-xs border-2 border-primary focus:outline-none z-20"
                        />
                      ) : cell?.validation?.type === 'checkbox' ? (
                        <div className="flex items-center justify-center h-full">
                          <input
                            type="checkbox"
                            checked={cell.value === 'TRUE' || cell.value === 'true'}
                            onChange={(e) => onUpdateCellValue(cellId, e.target.checked ? 'TRUE' : 'FALSE')}
                            className="h-3.5 w-3.5 rounded text-primary cursor-pointer"
                          />
                        </div>
                      ) : cell?.validation?.type === 'list' && cell.validation.options ? (
                        <div className="flex items-center justify-between">
                          <span>{displayValue}</span>
                          <select
                            value={cell.value || ''}
                            onChange={(e) => onUpdateCellValue(cellId, e.target.value)}
                            className="opacity-40 hover:opacity-100 bg-transparent text-[10px] cursor-pointer ml-1"
                          >
                            {cell.validation.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span>{displayValue}</span>
                      )}

                      {/* AutoFill square drag handle on active single cell */}
                      {isSelected && !isEditing && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsDraggingFillHandle(true);
                            setIsMouseDown(true);
                          }}
                          className="absolute bottom-0 right-0 w-2 h-2 bg-primary cursor-crosshair z-20"
                          title="Drag to AutoFill"
                        />
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
  );
}
