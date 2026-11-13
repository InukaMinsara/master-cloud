export type CellDataType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'time'
  | 'datetime'
  | 'boolean'
  | 'formula'
  | 'error'
  | 'empty';

export type CellHorizontalAlign = 'left' | 'center' | 'right';
export type CellVerticalAlign = 'top' | 'middle' | 'bottom';

export interface CellBorderConfig {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  style?: 'thin' | 'medium' | 'thick' | 'dashed' | 'double';
  color?: string;
}

export interface SheetCellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;
  fontSize?: number; // in pt (e.g. 10, 11, 12, 14, 18)
  textColor?: string;
  bgColor?: string;
  align?: CellHorizontalAlign;
  verticalAlign?: CellVerticalAlign;
  wrapText?: boolean;
  numberFormat?: 'general' | 'number' | 'currency' | 'percentage' | 'date' | 'time' | 'scientific' | 'text';
  decimalPlaces?: number;
  currencySymbol?: string;
  border?: CellBorderConfig;
}

export interface MasterSheetCell {
  value?: string; // User input or literal value
  formula?: string; // e.g. "=SUM(A1:A10)"
  calculatedValue?: string; // Evaluated display value
  dataType?: CellDataType;
  format?: SheetCellFormat;
  comment?: {
    id: string;
    author: string;
    text: string;
    createdAt: string;
    resolved?: boolean;
  };
  validation?: {
    type: 'list' | 'number' | 'date' | 'checkbox';
    options?: string[];
    min?: number;
    max?: number;
    allowBlank?: boolean;
    errorMessage?: string;
  };
  sparkline?: {
    type: 'line' | 'bar' | 'winloss';
    range: string;
  };
}

export interface ConditionalRule {
  id: string;
  range: string; // e.g. "B2:B20"
  type: 'cellValue' | 'colorScale' | 'dataBar';
  operator?: 'greaterThan' | 'lessThan' | 'between' | 'equalTo' | 'notEqualTo' | 'textContains';
  value1?: string;
  value2?: string;
  bgColor?: string;
  textColor?: string;
  bold?: boolean;
  minColor?: string;
  maxColor?: string;
}

export interface SheetChartConfig {
  id: string;
  title: string;
  type: 'column' | 'bar' | 'line' | 'area' | 'pie' | 'doughnut';
  dataRange: string; // e.g. "A1:B6"
  labelColumn: string; // e.g. "A"
  valueColumns: string[]; // e.g. ["B"]
  hasHeaders: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface PivotTableConfig {
  id: string;
  sourceRange: string; // e.g. "A1:E50"
  rowFields: string[];
  columnFields: string[];
  valueField: string;
  aggregation: 'SUM' | 'COUNT' | 'AVERAGE' | 'MIN' | 'MAX';
}

export interface SheetTableConfig {
  id: string;
  name: string;
  range: string; // e.g. "A1:D10"
  hasHeaderRow: boolean;
  hasTotalRow: boolean;
  style: 'blue' | 'slate' | 'emerald' | 'purple' | 'amber';
}

export interface SheetFilterState {
  range: string;
  activeColumnFilters: Record<number, string[]>; // colIndex -> allowed values
}

export interface MasterSingleSheet {
  id: string;
  name: string;
  tabColor?: string;
  isProtected?: boolean;
  rows: number;
  cols: number;
  cells: Record<string, MasterSheetCell>; // "A1" -> cell
  colWidths?: Record<number, number>; // colIndex -> px width
  rowHeights?: Record<number, number>; // rowIndex -> px height
  frozenRows?: number;
  frozenCols?: number;
  conditionalRules?: ConditionalRule[];
  charts?: SheetChartConfig[];
  pivotTables?: PivotTableConfig[];
  tables?: SheetTableConfig[];
  filter?: SheetFilterState;
  showGridlines?: boolean;
  showHeadings?: boolean;
}

export interface MasterWorkbookData {
  title: string;
  version: number;
  activeSheetId: string;
  sheets: MasterSingleSheet[];
  namedRanges?: Record<string, string>; // "SalesTotal" -> "Sheet1!B10"
  calculationMode?: 'automatic' | 'manual';
  lastSavedAt: string;
  theme?: 'modern-blue' | 'corporate' | 'emerald' | 'dark';
}

export interface CellRangeSelection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface FunctionDefinition {
  name: string;
  category: 'Math' | 'Logical' | 'Text' | 'Date & Time' | 'Lookup' | 'Statistical' | 'Array';
  syntax: string;
  description: string;
  example: string;
}
