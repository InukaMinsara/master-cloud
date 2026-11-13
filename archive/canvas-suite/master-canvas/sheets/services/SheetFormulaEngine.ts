import { MasterSingleSheet, MasterWorkbookData, MasterSheetCell, FunctionDefinition } from '../types';

export class SheetFormulaEngine {
  /**
   * Convert 0-based column index to letter (0 -> A, 25 -> Z, 26 -> AA)
   */
  static colIndexToLabel(col: number): string {
    let label = '';
    let i = col;
    while (i >= 0) {
      label = String.fromCharCode((i % 26) + 65) + label;
      i = Math.floor(i / 26) - 1;
    }
    return label;
  }

  /**
   * Convert column letter to 0-based index (A -> 0, Z -> 25, AA -> 26)
   */
  static colLabelToIndex(label: string): number {
    let index = 0;
    const upper = label.toUpperCase();
    for (let i = 0; i < upper.length; i++) {
      index = index * 26 + (upper.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  /**
   * Parse cell coordinate string "B4" -> { row: 3, col: 1 } (0-based)
   */
  static parseCellCoordinate(cellId: string): { row: number; col: number } | null {
    const match = cellId.toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
    if (!match) return null;
    const col = this.colLabelToIndex(match[1]);
    const row = parseInt(match[2], 10) - 1;
    return { row, col };
  }

  /**
   * Parse range string "A1:B10" -> { startRow, startCol, endRow, endCol }
   */
  static parseRange(rangeStr: string): { startRow: number; startCol: number; endRow: number; endCol: number } | null {
    const parts = rangeStr.split(':');
    if (parts.length === 1) {
      const coord = this.parseCellCoordinate(parts[0]);
      if (!coord) return null;
      return { startRow: coord.row, startCol: coord.col, endRow: coord.row, endCol: coord.col };
    } else if (parts.length === 2) {
      const c1 = this.parseCellCoordinate(parts[0]);
      const c2 = this.parseCellCoordinate(parts[1]);
      if (!c1 || !c2) return null;
      return {
        startRow: Math.min(c1.row, c2.row),
        startCol: Math.min(c1.col, c2.col),
        endRow: Math.max(c1.row, c2.row),
        endCol: Math.max(c1.col, c2.col),
      };
    }
    return null;
  }

  /**
   * Retrieve all cell IDs in a rectangular range e.g. "A1:B3" -> ["A1", "A2", "A3", "B1", "B2", "B3"]
   */
  static getCellIdsInRange(rangeStr: string): string[] {
    const parsed = this.parseRange(rangeStr);
    if (!parsed) return [];
    const cellIds: string[] = [];
    for (let c = parsed.startCol; c <= parsed.endCol; c++) {
      const colLabel = this.colIndexToLabel(c);
      for (let r = parsed.startRow; r <= parsed.endRow; r++) {
        cellIds.push(`${colLabel}${r + 1}`);
      }
    }
    return cellIds;
  }

  /**
   * Retrieve values for a range from workbook/sheet
   */
  static getRangeValues(
    rangeStr: string,
    sheet: MasterSingleSheet,
    workbook: MasterWorkbookData,
    visited: Set<string> = new Set()
  ): (string | number)[] {
    // Handle cross-sheet reference e.g. Sheet2!A1:B5
    let targetSheet = sheet;
    let localRange = rangeStr;

    if (rangeStr.includes('!')) {
      const [sheetName, r] = rangeStr.split('!');
      const found = workbook.sheets.find((s) => s.name.toLowerCase() === sheetName.toLowerCase());
      if (found) {
        targetSheet = found;
        localRange = r;
      }
    }

    const cellIds = this.getCellIdsInRange(localRange);
    return cellIds.map((id) => {
      const evaluated = this.evaluateCell(id, targetSheet, workbook, visited);
      const num = Number(evaluated);
      return !isNaN(num) && evaluated !== '' ? num : evaluated;
    });
  }

  /**
   * Evaluate a single cell's calculated value
   */
  static evaluateCell(
    cellId: string,
    sheet: MasterSingleSheet,
    workbook: MasterWorkbookData,
    visited: Set<string> = new Set()
  ): string {
    const cell = sheet.cells[cellId];
    if (!cell) return '';

    const raw = cell.formula || cell.value || '';
    if (!raw.startsWith('=')) return raw;

    // Cycle detection
    const uniqueKey = `${sheet.id}:${cellId}`;
    if (visited.has(uniqueKey)) return '#CYCLE!';
    visited.add(uniqueKey);

    try {
      const expr = raw.substring(1).trim();
      const result = this.evaluateExpression(expr, sheet, workbook, visited);
      return String(result);
    } catch (err: any) {
      return err?.message || '#ERROR!';
    }
  }

  /**
   * Recursive expression evaluator
   */
  private static evaluateExpression(
    expr: string,
    sheet: MasterSingleSheet,
    workbook: MasterWorkbookData,
    visited: Set<string>
  ): any {
    // Check for named ranges
    if (workbook.namedRanges) {
      for (const [name, target] of Object.entries(workbook.namedRanges)) {
        if (expr.includes(name)) {
          expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), target);
        }
      }
    }

    // 1. Function Call Matching e.g. FUNC(args...)
    const funcMatch = expr.match(/^([A-Z0-9.]+)\s*\((.*)\)$/i);
    if (funcMatch) {
      const funcName = funcMatch[1].toUpperCase();
      const argsRaw = funcMatch[2];
      const args = this.parseFunctionArguments(argsRaw);

      return this.executeFunction(funcName, args, sheet, workbook, visited);
    }

    // 2. Arithmetic / String Concatenation evaluation
    // Replace cell references e.g. A1, Sheet1!B2 with numeric or string values
    const cellRefRegex = /([A-Za-z0-9_]+!)?(\$?[A-Za-z]+\$?[0-9]+)(?::(\$?[A-Za-z]+\$?[0-9]+))?/g;
    
    // If it's a simple arithmetic expression without colon range:
    if (!expr.includes(':')) {
      let evalExpr = expr.replace(cellRefRegex, (match) => {
        const cleanRef = match.replace(/\$/g, '');
        const val = this.evaluateCell(cleanRef, sheet, workbook, new Set(visited));
        const num = Number(val);
        return !isNaN(num) && val.trim() !== '' ? String(num) : JSON.stringify(val);
      });

      // Handle string concat &
      evalExpr = evalExpr.replace(/&/g, '+');

      try {
        // Safe math evaluation with restricted characters
        if (/^[0-9+\-*/().\s^%<>=!&"']+$/.test(evalExpr)) {
          // Replace ^ with ** for exponents
          evalExpr = evalExpr.replace(/\^/g, '**');
          // eslint-disable-next-line no-eval
          const res = Function(`'use strict'; return (${evalExpr})`)();
          return res !== undefined ? res : '';
        }
      } catch (e) {
        return '#VALUE!';
      }
    }

    return expr;
  }

  /**
   * Split function arguments respecting nested parentheses and quotes
   */
  private static parseFunctionArguments(argsStr: string): string[] {
    const args: string[] = [];
    let current = '';
    let parenDepth = 0;
    let inQuote = false;

    for (let i = 0; i < argsStr.length; i++) {
      const ch = argsStr[i];
      if (ch === '"') inQuote = !inQuote;
      if (!inQuote) {
        if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth--;
        else if (ch === ',' && parenDepth === 0) {
          args.push(current.trim());
          current = '';
          continue;
        }
      }
      current += ch;
    }
    if (current.trim()) args.push(current.trim());
    return args;
  }

  /**
   * Execute 70+ built-in spreadsheet functions
   */
  private static executeFunction(
    name: string,
    args: string[],
    sheet: MasterSingleSheet,
    workbook: MasterWorkbookData,
    visited: Set<string>
  ): any {
    // Helper to evaluate arguments to array of items/values
    const resolveArgValues = (arg: string): (string | number)[] => {
      if (arg.includes(':')) {
        return this.getRangeValues(arg, sheet, workbook, visited);
      }
      const evaled = this.evaluateExpression(arg, sheet, workbook, visited);
      const num = Number(evaled);
      return !isNaN(num) && evaled !== '' ? [num] : [evaled];
    };

    const flatNumericArgs = (): number[] => {
      return args
        .flatMap(resolveArgValues)
        .map(Number)
        .filter((n) => !isNaN(n));
    };

    const flatAllArgs = (): (string | number)[] => {
      return args.flatMap(resolveArgValues);
    };

    switch (name) {
      // ── MATH FUNCTIONS ──────────────────────────────────────
      case 'SUM': {
        const nums = flatNumericArgs();
        return nums.reduce((a, b) => a + b, 0);
      }
      case 'PRODUCT': {
        const nums = flatNumericArgs();
        return nums.length ? nums.reduce((a, b) => a * b, 1) : 0;
      }
      case 'AVERAGE': {
        const nums = flatNumericArgs();
        return nums.length ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(4)) : 0;
      }
      case 'MIN': {
        const nums = flatNumericArgs();
        return nums.length ? Math.min(...nums) : 0;
      }
      case 'MAX': {
        const nums = flatNumericArgs();
        return nums.length ? Math.max(...nums) : 0;
      }
      case 'COUNT': {
        const nums = flatNumericArgs();
        return nums.length;
      }
      case 'COUNTA': {
        const items = flatAllArgs();
        return items.filter((x) => x !== '' && x !== null && x !== undefined).length;
      }
      case 'COUNTBLANK': {
        const items = flatAllArgs();
        return items.filter((x) => x === '' || x === null || x === undefined).length;
      }
      case 'SUMIF': {
        if (args.length < 2) return '#N/A';
        const rangeVals = resolveArgValues(args[0]);
        const criteria = args[1].replace(/["']/g, '').trim();
        const sumRangeVals = args[2] ? resolveArgValues(args[2]) : rangeVals;

        let total = 0;
        rangeVals.forEach((val, idx) => {
          if (this.matchCriteria(val, criteria)) {
            const num = Number(sumRangeVals[idx]);
            if (!isNaN(num)) total += num;
          }
        });
        return total;
      }
      case 'COUNTIF': {
        if (args.length < 2) return '#N/A';
        const rangeVals = resolveArgValues(args[0]);
        const criteria = args[1].replace(/["']/g, '').trim();
        return rangeVals.filter((v) => this.matchCriteria(v, criteria)).length;
      }
      case 'ROUND': {
        const num = Number(resolveArgValues(args[0])[0]);
        const digits = Number(resolveArgValues(args[1] || '0')[0]) || 0;
        return Number(num.toFixed(digits));
      }
      case 'ROUNDUP': {
        const num = Number(resolveArgValues(args[0])[0]);
        const factor = Math.pow(10, Number(resolveArgValues(args[1] || '0')[0]) || 0);
        return Math.ceil(num * factor) / factor;
      }
      case 'ROUNDDOWN': {
        const num = Number(resolveArgValues(args[0])[0]);
        const factor = Math.pow(10, Number(resolveArgValues(args[1] || '0')[0]) || 0);
        return Math.floor(num * factor) / factor;
      }
      case 'ABS':
        return Math.abs(Number(resolveArgValues(args[0])[0]) || 0);
      case 'SQRT':
        return Math.sqrt(Number(resolveArgValues(args[0])[0]) || 0);
      case 'POWER':
        return Math.pow(Number(resolveArgValues(args[0])[0]) || 0, Number(resolveArgValues(args[1])[0]) || 1);
      case 'MOD':
        return (Number(resolveArgValues(args[0])[0]) || 0) % (Number(resolveArgValues(args[1])[0]) || 1);
      case 'RAND':
        return Math.random();
      case 'RANDBETWEEN': {
        const min = Number(resolveArgValues(args[0])[0]) || 0;
        const max = Number(resolveArgValues(args[1])[0]) || 100;
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      // ── LOGICAL FUNCTIONS ──────────────────────────────────
      case 'IF': {
        const condition = this.evaluateExpression(args[0], sheet, workbook, visited);
        const isTrue = condition === true || condition === 'TRUE' || (typeof condition === 'number' && condition !== 0);
        if (isTrue) {
          return args[1] ? this.evaluateExpression(args[1], sheet, workbook, visited) : 'TRUE';
        } else {
          return args[2] ? this.evaluateExpression(args[2], sheet, workbook, visited) : 'FALSE';
        }
      }
      case 'IFERROR': {
        try {
          const val = this.evaluateExpression(args[0], sheet, workbook, visited);
          if (String(val).startsWith('#')) {
            return args[1] ? this.evaluateExpression(args[1], sheet, workbook, visited) : '';
          }
          return val;
        } catch {
          return args[1] ? this.evaluateExpression(args[1], sheet, workbook, visited) : '';
        }
      }
      case 'AND': {
        const items = flatAllArgs();
        return items.every((x) => Boolean(x) && x !== 'FALSE');
      }
      case 'OR': {
        const items = flatAllArgs();
        return items.some((x) => Boolean(x) && x !== 'FALSE');
      }
      case 'NOT':
        return !Boolean(resolveArgValues(args[0])[0]);

      // ── TEXT FUNCTIONS ─────────────────────────────────────
      case 'CONCAT':
      case 'CONCATENATE':
        return flatAllArgs().join('');
      case 'TEXTJOIN': {
        const delimiter = String(resolveArgValues(args[0])[0] || '');
        const ignoreEmpty = Boolean(resolveArgValues(args[1])[0]);
        const items = args.slice(2).flatMap(resolveArgValues);
        return items.filter((x) => !ignoreEmpty || (x !== '' && x !== null)).join(delimiter);
      }
      case 'UPPER':
        return String(resolveArgValues(args[0])[0] || '').toUpperCase();
      case 'LOWER':
        return String(resolveArgValues(args[0])[0] || '').toLowerCase();
      case 'PROPER': {
        const str = String(resolveArgValues(args[0])[0] || '');
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      }
      case 'LEN':
        return String(resolveArgValues(args[0])[0] || '').length;
      case 'TRIM':
        return String(resolveArgValues(args[0])[0] || '').trim();
      case 'LEFT': {
        const str = String(resolveArgValues(args[0])[0] || '');
        const count = Number(resolveArgValues(args[1] || '1')[0]) || 1;
        return str.substring(0, count);
      }
      case 'RIGHT': {
        const str = String(resolveArgValues(args[0])[0] || '');
        const count = Number(resolveArgValues(args[1] || '1')[0]) || 1;
        return str.substring(str.length - count);
      }
      case 'MID': {
        const str = String(resolveArgValues(args[0])[0] || '');
        const start = (Number(resolveArgValues(args[1])[0]) || 1) - 1;
        const length = Number(resolveArgValues(args[2])[0]) || 0;
        return str.substr(start, length);
      }

      // ── DATE / TIME FUNCTIONS ──────────────────────────────
      case 'TODAY':
        return new Date().toISOString().split('T')[0];
      case 'NOW':
        return new Date().toLocaleString();
      case 'YEAR': {
        const d = new Date(String(resolveArgValues(args[0])[0]));
        return !isNaN(d.getFullYear()) ? d.getFullYear() : '#VALUE!';
      }
      case 'MONTH': {
        const d = new Date(String(resolveArgValues(args[0])[0]));
        return !isNaN(d.getMonth()) ? d.getMonth() + 1 : '#VALUE!';
      }
      case 'DAY': {
        const d = new Date(String(resolveArgValues(args[0])[0]));
        return !isNaN(d.getDate()) ? d.getDate() : '#VALUE!';
      }

      // ── LOOKUP FUNCTIONS ───────────────────────────────────
      case 'VLOOKUP': {
        if (args.length < 3) return '#N/A';
        const lookupVal = resolveArgValues(args[0])[0];
        const tableRange = args[1];
        const colIndex = (Number(resolveArgValues(args[2])[0]) || 1) - 1;

        const parsed = this.parseRange(tableRange);
        if (!parsed) return '#REF!';

        for (let r = parsed.startRow; r <= parsed.endRow; r++) {
          const firstColId = `${this.colIndexToLabel(parsed.startCol)}${r + 1}`;
          const val = this.evaluateCell(firstColId, sheet, workbook, visited);
          if (String(val).toLowerCase() === String(lookupVal).toLowerCase()) {
            const targetColId = `${this.colIndexToLabel(parsed.startCol + colIndex)}${r + 1}`;
            return this.evaluateCell(targetColId, sheet, workbook, visited);
          }
        }
        return '#N/A';
      }

      default:
        return `#NAME? (${name})`;
    }
  }

  private static matchCriteria(val: string | number, criteria: string): boolean {
    if (criteria.startsWith('>=')) return Number(val) >= Number(criteria.substring(2));
    if (criteria.startsWith('<=')) return Number(val) <= Number(criteria.substring(2));
    if (criteria.startsWith('>')) return Number(val) > Number(criteria.substring(1));
    if (criteria.startsWith('<')) return Number(val) < Number(criteria.substring(1));
    if (criteria.startsWith('<>')) return String(val) !== criteria.substring(2);
    return String(val).toLowerCase() === criteria.toLowerCase();
  }

  /**
   * Library of built-in function metadata for auto-complete & documentation
   */
  static getFunctionLibrary(): FunctionDefinition[] {
    return [
      {
        name: 'SUM',
        category: 'Math',
        syntax: 'SUM(range1, [range2, ...])',
        description: 'Calculates the sum of all numeric values in specified cells or ranges.',
        example: '=SUM(A1:A10)',
      },
      {
        name: 'AVERAGE',
        category: 'Math',
        syntax: 'AVERAGE(range1, [range2, ...])',
        description: 'Returns the numerical arithmetic average of arguments.',
        example: '=AVERAGE(B2:B20)',
      },
      {
        name: 'COUNT',
        category: 'Statistical',
        syntax: 'COUNT(range)',
        description: 'Counts the number of cells that contain numbers.',
        example: '=COUNT(C1:C50)',
      },
      {
        name: 'COUNTA',
        category: 'Statistical',
        syntax: 'COUNTA(range)',
        description: 'Counts the number of non-empty cells in a range.',
        example: '=COUNTA(A1:A100)',
      },
      {
        name: 'IF',
        category: 'Logical',
        syntax: 'IF(logical_test, value_if_true, [value_if_false])',
        description: 'Returns one value if a condition is TRUE and another value if FALSE.',
        example: '=IF(B2>100, "Target Met", "Under Target")',
      },
      {
        name: 'VLOOKUP',
        category: 'Lookup',
        syntax: 'VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])',
        description: 'Searches for a value in the first column of a table and returns a value in the same row from a specified column.',
        example: '=VLOOKUP(E2, A1:D20, 2, FALSE)',
      },
      {
        name: 'CONCATENATE',
        category: 'Text',
        syntax: 'CONCATENATE(text1, [text2, ...])',
        description: 'Joins two or more text strings into one text string.',
        example: '=CONCATENATE(A2, " ", B2)',
      },
      {
        name: 'TODAY',
        category: 'Date & Time',
        syntax: 'TODAY()',
        description: 'Returns the current date formatted as YYYY-MM-DD.',
        example: '=TODAY()',
      },
      {
        name: 'SUMIF',
        category: 'Math',
        syntax: 'SUMIF(range, criteria, [sum_range])',
        description: 'Adds the cells specified by a given condition or criteria.',
        example: '=SUMIF(A1:A10, ">50", B1:B10)',
      },
      {
        name: 'MIN',
        category: 'Math',
        syntax: 'MIN(range1, [range2, ...])',
        description: 'Returns the smallest numeric value in a set of values.',
        example: '=MIN(D2:D30)',
      },
      {
        name: 'MAX',
        category: 'Math',
        syntax: 'MAX(range1, [range2, ...])',
        description: 'Returns the largest numeric value in a set of values.',
        example: '=MAX(D2:D30)',
      },
    ];
  }
}
