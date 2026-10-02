import { MasterSingleSheet, MasterWorkbookData, MasterSheetCell, ConditionalRule, CellRangeSelection } from '../types';
import { SheetFormulaEngine } from './SheetFormulaEngine';

export class SheetDataService {
  /**
   * Sort a range or entire sheet by a specific column
   */
  static sortRange(
    sheet: MasterSingleSheet,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number,
    sortCol: number,
    direction: 'asc' | 'desc'
  ): MasterSingleSheet {
    const updated = { ...sheet, cells: { ...sheet.cells } };

    // Extract rows data
    const rowsData: { rowIndex: number; sortVal: string | number; cells: Record<number, MasterSheetCell> }[] = [];

    for (let r = startRow; r <= endRow; r++) {
      const rowObj: Record<number, MasterSheetCell> = {};
      const sortCellId = `${SheetFormulaEngine.colIndexToLabel(sortCol)}${r + 1}`;
      const sortVal = sheet.cells[sortCellId]?.value || '';

      for (let c = startCol; c <= endCol; c++) {
        const cellId = `${SheetFormulaEngine.colIndexToLabel(c)}${r + 1}`;
        if (sheet.cells[cellId]) {
          rowObj[c] = sheet.cells[cellId];
        }
      }
      rowsData.push({
        rowIndex: r,
        sortVal: !isNaN(Number(sortVal)) && sortVal !== '' ? Number(sortVal) : String(sortVal).toLowerCase(),
        cells: rowObj,
      });
    }

    // Sort rows
    rowsData.sort((a, b) => {
      if (a.sortVal < b.sortVal) return direction === 'asc' ? -1 : 1;
      if (a.sortVal > b.sortVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    // Write back
    rowsData.forEach((item, targetIdx) => {
      const targetRow = startRow + targetIdx;
      for (let c = startCol; c <= endCol; c++) {
        const targetCellId = `${SheetFormulaEngine.colIndexToLabel(c)}${targetRow + 1}`;
        if (item.cells[c]) {
          updated.cells[targetCellId] = item.cells[c];
        } else {
          delete updated.cells[targetCellId];
        }
      }
    });

    return updated;
  }

  /**
   * Remove duplicate rows in a selected range
   */
  static removeDuplicates(
    sheet: MasterSingleSheet,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ): { sheet: MasterSingleSheet; removedCount: number } {
    const updated = { ...sheet, cells: { ...sheet.cells } };
    const seenSignatures = new Set<string>();
    const uniqueRows: Record<number, MasterSheetCell>[] = [];
    let removedCount = 0;

    for (let r = startRow; r <= endRow; r++) {
      const rowValues: string[] = [];
      const rowObj: Record<number, MasterSheetCell> = {};

      for (let c = startCol; c <= endCol; c++) {
        const cellId = `${SheetFormulaEngine.colIndexToLabel(c)}${r + 1}`;
        const cell = sheet.cells[cellId];
        rowValues.push(cell?.value || '');
        if (cell) rowObj[c] = cell;
      }

      const sig = rowValues.join('|||');
      if (seenSignatures.has(sig)) {
        removedCount++;
      } else {
        seenSignatures.add(sig);
        uniqueRows.push(rowObj);
      }
    }

    // Clear old range
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        delete updated.cells[`${SheetFormulaEngine.colIndexToLabel(c)}${r + 1}`];
      }
    }

    // Write back unique rows
    uniqueRows.forEach((rowObj, targetIdx) => {
      const targetRow = startRow + targetIdx;
      for (let c = startCol; c <= endCol; c++) {
        if (rowObj[c]) {
          updated.cells[`${SheetFormulaEngine.colIndexToLabel(c)}${targetRow + 1}`] = rowObj[c];
        }
      }
    });

    return { sheet: updated, removedCount };
  }

  /**
   * Split a column using Text to Columns
   */
  static textToColumns(
    sheet: MasterSingleSheet,
    colIndex: number,
    startRow: number,
    endRow: number,
    delimiter: string
  ): MasterSingleSheet {
    const updated = { ...sheet, cells: { ...sheet.cells } };
    const colLabel = SheetFormulaEngine.colIndexToLabel(colIndex);

    for (let r = startRow; r <= endRow; r++) {
      const cellId = `${colLabel}${r + 1}`;
      const text = sheet.cells[cellId]?.value || '';
      if (!text) continue;

      const parts = text.split(delimiter);
      parts.forEach((part, partIdx) => {
        const targetCol = colIndex + partIdx;
        const targetCellId = `${SheetFormulaEngine.colIndexToLabel(targetCol)}${r + 1}`;
        updated.cells[targetCellId] = {
          ...(updated.cells[targetCellId] || {}),
          value: part.trim(),
        };
      });
    }

    return updated;
  }

  /**
   * Evaluate Conditional Formatting rules for a cell
   */
  static getConditionalStyle(
    cellId: string,
    cellValue: string,
    rules: ConditionalRule[] = []
  ): { bgColor?: string; textColor?: string; bold?: boolean } {
    const num = Number(cellValue);
    const isNum = !isNaN(num) && cellValue !== '';

    for (const rule of rules) {
      const cellIds = SheetFormulaEngine.getCellIdsInRange(rule.range);
      if (!cellIds.includes(cellId)) continue;

      if (rule.type === 'cellValue') {
        const targetVal = Number(rule.value1);
        if (rule.operator === 'greaterThan' && isNum && num > targetVal) {
          return { bgColor: rule.bgColor || '#dcfce7', textColor: rule.textColor || '#15803d', bold: rule.bold };
        }
        if (rule.operator === 'lessThan' && isNum && num < targetVal) {
          return { bgColor: rule.bgColor || '#fee2e2', textColor: rule.textColor || '#b91c1c', bold: rule.bold };
        }
        if (rule.operator === 'equalTo' && cellValue.toLowerCase() === (rule.value1 || '').toLowerCase()) {
          return { bgColor: rule.bgColor || '#dbeafe', textColor: rule.textColor || '#1d4ed8', bold: rule.bold };
        }
        if (rule.operator === 'textContains' && cellValue.toLowerCase().includes((rule.value1 || '').toLowerCase())) {
          return { bgColor: rule.bgColor || '#fef3c7', textColor: rule.textColor || '#b45309', bold: rule.bold };
        }
      }
    }

    return {};
  }

  /**
   * Generate drag AutoFill series
   */
  static generateAutoFill(
    sourceCells: string[],
    targetCells: string[],
    sheet: MasterSingleSheet
  ): Record<string, MasterSheetCell> {
    const result: Record<string, MasterSheetCell> = {};
    if (sourceCells.length === 0 || targetCells.length === 0) return result;

    const firstVal = sheet.cells[sourceCells[0]]?.value || '';
    const num = Number(firstVal);

    if (!isNaN(num) && firstVal.trim() !== '') {
      // Step detection if 2+ source cells
      let step = 1;
      if (sourceCells.length >= 2) {
        const secondVal = Number(sheet.cells[sourceCells[1]]?.value || '');
        if (!isNaN(secondVal)) step = secondVal - num;
      }

      targetCells.forEach((cellId, idx) => {
        const nextVal = num + step * (idx + 1);
        result[cellId] = {
          ...(sheet.cells[sourceCells[0]] || {}),
          value: String(nextVal),
          formula: undefined,
        };
      });
    } else {
      // Repeat/copy pattern
      targetCells.forEach((cellId, idx) => {
        const srcId = sourceCells[idx % sourceCells.length];
        const srcCell = sheet.cells[srcId];
        result[cellId] = srcCell ? { ...srcCell } : { value: '' };
      });
    }

    return result;
  }
}
