import { MasterSingleSheet, MasterWorkbookData, MasterSheetCell } from '../types';
import { SheetFormulaEngine } from './SheetFormulaEngine';

export class SheetExportService {
  /**
   * Export active sheet as standard CSV
   */
  static exportToCsv(sheet: MasterSingleSheet, filename: string = 'spreadsheet.csv') {
    const lines: string[] = [];

    // Find bounding box
    let maxR = 0;
    let maxC = 0;
    Object.keys(sheet.cells).forEach((cellId) => {
      const coord = SheetFormulaEngine.parseCellCoordinate(cellId);
      if (coord) {
        maxR = Math.max(maxR, coord.row);
        maxC = Math.max(maxC, coord.col);
      }
    });

    for (let r = 0; r <= maxR; r++) {
      const rowVals: string[] = [];
      for (let c = 0; c <= maxC; c++) {
        const cellId = `${SheetFormulaEngine.colIndexToLabel(c)}${r + 1}`;
        const val = sheet.cells[cellId]?.value || '';
        // Escape quotes
        const escaped = val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
        rowVals.push(escaped);
      }
      lines.push(rowVals.join(','));
    }

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
  }

  /**
   * Export active sheet as TSV
   */
  static exportToTsv(sheet: MasterSingleSheet, filename: string = 'spreadsheet.tsv') {
    const lines: string[] = [];
    let maxR = 0;
    let maxC = 0;
    Object.keys(sheet.cells).forEach((cellId) => {
      const coord = SheetFormulaEngine.parseCellCoordinate(cellId);
      if (coord) {
        maxR = Math.max(maxR, coord.row);
        maxC = Math.max(maxC, coord.col);
      }
    });

    for (let r = 0; r <= maxR; r++) {
      const rowVals: string[] = [];
      for (let c = 0; c <= maxC; c++) {
        const cellId = `${SheetFormulaEngine.colIndexToLabel(c)}${r + 1}`;
        const val = sheet.cells[cellId]?.value || '';
        rowVals.push(val.replace(/\t/g, ' '));
      }
      lines.push(rowVals.join('\t'));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/tab-separated-values;charset=utf-8;' });
    this.downloadBlob(blob, filename.endsWith('.tsv') ? filename : `${filename}.tsv`);
  }

  /**
   * Export as Excel-compatible HTML Spreadsheet wrapper
   */
  static exportToExcelHtml(sheet: MasterSingleSheet, filename: string = 'workbook.xls') {
    let tableHtml = '<table border="1"><tbody>';
    let maxR = 0;
    let maxC = 0;
    Object.keys(sheet.cells).forEach((cellId) => {
      const coord = SheetFormulaEngine.parseCellCoordinate(cellId);
      if (coord) {
        maxR = Math.max(maxR, coord.row);
        maxC = Math.max(maxC, coord.col);
      }
    });

    for (let r = 0; r <= maxR; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c <= maxC; c++) {
        const cellId = `${SheetFormulaEngine.colIndexToLabel(c)}${r + 1}`;
        const cell = sheet.cells[cellId];
        const val = cell?.value || '';
        const isBold = cell?.format?.bold ? 'font-weight: bold;' : '';
        const bgColor = cell?.format?.bgColor ? `background-color: ${cell.format.bgColor};` : '';
        tableHtml += `<td style="${isBold} ${bgColor}">${escapeHtml(val)}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';

    const fullHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8" /></head>
        <body>${tableHtml}</body>
      </html>
    `;

    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/vnd.ms-excel' });
    this.downloadBlob(blob, filename.endsWith('.xls') || filename.endsWith('.xlsx') ? filename : `${filename}.xls`);
  }

  /**
   * Export complete workbook structure as JSON
   */
  static exportToJson(workbook: MasterWorkbookData, filename: string = 'workbook.json') {
    const jsonStr = JSON.stringify(workbook, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    this.downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
  }

  /**
   * Parse uploaded CSV or TSV text into sheet cells
   */
  static parseCsvToSheet(text: string): { cells: Record<string, MasterSheetCell>; maxRow: number; maxCol: number } {
    const isTsv = text.includes('\t') && !text.includes(',');
    const delimiter = isTsv ? '\t' : ',';
    const lines = text.trim().split(/\r?\n/);
    const cells: Record<string, MasterSheetCell> = {};

    let maxCol = 0;
    lines.forEach((line, r) => {
      const parts = isTsv ? line.split('\t') : this.parseCsvLine(line);
      maxCol = Math.max(maxCol, parts.length);
      parts.forEach((val, c) => {
        const cellId = `${SheetFormulaEngine.colIndexToLabel(c)}${r + 1}`;
        cells[cellId] = {
          value: val.trim(),
          formula: val.startsWith('=') ? val : undefined,
          format: r === 0 ? { bold: true, bgColor: '#f1f5f9' } : undefined,
        };
      });
    });

    return { cells, maxRow: lines.length, maxCol };
  }

  private static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === ',' && !inQuote) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  private static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
