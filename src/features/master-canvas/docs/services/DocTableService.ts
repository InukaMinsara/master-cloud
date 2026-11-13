/**
 * DocTableService.ts
 * Real DOM-level Microsoft Word table operations inside a contentEditable document.
 */

export class DocTableService {
  /**
   * Resolves the closest table cell (TD or TH) from the current selection or fallback cell.
   */
  static getActiveCell(editorEl: HTMLElement | null, fallbackCell?: HTMLTableCellElement | null): HTMLTableCellElement | null {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.anchorNode;
      while (node && node !== editorEl) {
        if (node instanceof HTMLTableCellElement) {
          return node;
        }
        node = node.parentNode;
      }
    }
    if (fallbackCell && editorEl && editorEl.contains(fallbackCell)) {
      return fallbackCell;
    }
    return null;
  }

  /**
   * Inserts a row above or below the active cell's row.
   */
  static insertRow(cell: HTMLTableCellElement, position: 'above' | 'below'): boolean {
    const row = cell.closest('tr');
    const table = cell.closest('table');
    if (!row || !table) return false;

    const colCount = row.cells.length;
    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement('td');
      td.style.border = '1px solid #cbd5e1';
      td.style.padding = '8px 12px';
      td.innerHTML = '&nbsp;';
      newRow.appendChild(td);
    }

    if (position === 'above') {
      row.parentNode?.insertBefore(newRow, row);
    } else {
      row.parentNode?.insertBefore(newRow, row.nextSibling);
    }
    return true;
  }

  /**
   * Inserts a column to the left or right of the active cell's column.
   */
  static insertColumn(cell: HTMLTableCellElement, position: 'left' | 'right'): boolean {
    const row = cell.closest('tr');
    const table = cell.closest('table');
    if (!row || !table) return false;

    const colIndex = cell.cellIndex;
    const rows = Array.from(table.rows);

    rows.forEach((r) => {
      const refCell = r.cells[colIndex];
      const isHeader = refCell?.tagName === 'TH' || Boolean(r.closest('thead'));
      const newCell = document.createElement(isHeader ? 'th' : 'td');
      newCell.style.border = '1px solid #cbd5e1';
      newCell.style.padding = '8px 12px';
      if (isHeader) {
        newCell.style.backgroundColor = '#eff6ff';
        newCell.style.fontWeight = '700';
      }
      newCell.innerHTML = '&nbsp;';

      if (!refCell) {
        r.appendChild(newCell);
      } else if (position === 'left') {
        r.insertBefore(newCell, refCell);
      } else {
        r.insertBefore(newCell, refCell.nextSibling);
      }
    });
    return true;
  }

  /**
   * Deletes the row containing the active cell (or the whole table if it's the last row).
   */
  static deleteRow(cell: HTMLTableCellElement): boolean {
    const row = cell.closest('tr');
    const table = cell.closest('table');
    if (!row || !table) return false;

    if (table.rows.length <= 1) {
      table.remove();
    } else {
      row.remove();
    }
    return true;
  }

  /**
   * Deletes the column containing the active cell (or the whole table if it's the last column).
   */
  static deleteColumn(cell: HTMLTableCellElement): boolean {
    const row = cell.closest('tr');
    const table = cell.closest('table');
    if (!row || !table) return false;

    const colIndex = cell.cellIndex;
    if (row.cells.length <= 1) {
      table.remove();
      return true;
    }

    Array.from(table.rows).forEach((r) => {
      if (r.cells[colIndex]) {
        r.deleteCell(colIndex);
      }
    });
    return true;
  }

  /**
   * Deletes the entire table.
   */
  static deleteTable(cell: HTMLTableCellElement): boolean {
    const table = cell.closest('table');
    if (!table) return false;
    table.remove();
    return true;
  }

  /**
   * Toggles header styling on the first row of the table.
   */
  static toggleHeaderRow(cell: HTMLTableCellElement): boolean {
    const table = cell.closest('table');
    if (!table || table.rows.length === 0) return false;

    const firstRow = table.rows[0];
    const isAlreadyStyled = firstRow.cells[0]?.getAttribute('data-header-row') === 'true';

    Array.from(firstRow.cells).forEach((c) => {
      if (isAlreadyStyled) {
        c.removeAttribute('data-header-row');
        c.style.backgroundColor = '';
        c.style.fontWeight = '';
        c.style.color = '';
      } else {
        c.setAttribute('data-header-row', 'true');
        c.style.backgroundColor = '#185abd';
        c.style.color = '#ffffff';
        c.style.fontWeight = '700';
      }
    });
    return true;
  }

  /**
   * Sets background shading color on the active cell.
   */
  static setCellBackground(cell: HTMLTableCellElement, color: string): boolean {
    cell.style.backgroundColor = color;
    return true;
  }
}
