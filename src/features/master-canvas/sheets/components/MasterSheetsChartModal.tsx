import React, { useState } from 'react';
import { X, BarChart3, PieChart, LineChart, Plus, Check } from 'lucide-react';
import { MasterSingleSheet, MasterWorkbookData, SheetChartConfig } from '../types';
import { SheetFormulaEngine } from '../services/SheetFormulaEngine';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MasterSheetsChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSheet: MasterSingleSheet;
  workbook: MasterWorkbookData;
  initialRange?: string;
  onInsertChart: (chart: SheetChartConfig) => void;
}

export function MasterSheetsChartModal({
  isOpen,
  onClose,
  activeSheet,
  workbook,
  initialRange = 'A3:D7',
  onInsertChart,
}: MasterSheetsChartModalProps) {
  const [chartType, setChartType] = useState<SheetChartConfig['type']>('column');
  const [chartTitle, setChartTitle] = useState('Data Distribution Chart');
  const [dataRange, setDataRange] = useState(initialRange);

  if (!isOpen) return null;

  // Evaluate range data for live preview
  const parsedRange = SheetFormulaEngine.parseRange(dataRange) || {
    startRow: 0,
    endRow: 4,
    startCol: 0,
    endCol: 1,
  };

  const labels: string[] = [];
  const seriesValues: number[] = [];

  for (let r = parsedRange.startRow; r <= parsedRange.endRow; r++) {
    const labelCellId = `${SheetFormulaEngine.colIndexToLabel(parsedRange.startCol)}${r + 1}`;
    const valueCellId = `${SheetFormulaEngine.colIndexToLabel(parsedRange.startCol + 1)}${r + 1}`;

    const label = SheetFormulaEngine.evaluateCell(labelCellId, activeSheet, workbook);
    const val = Number(SheetFormulaEngine.evaluateCell(valueCellId, activeSheet, workbook)) || 0;

    labels.push(label || `Item ${r + 1}`);
    seriesValues.push(val);
  }

  const maxValue = Math.max(...seriesValues, 10);

  const handleCreate = () => {
    const newChart: SheetChartConfig = {
      id: 'chart-' + Date.now(),
      title: chartTitle,
      type: chartType,
      dataRange,
      labelColumn: SheetFormulaEngine.colIndexToLabel(parsedRange.startCol),
      valueColumns: [SheetFormulaEngine.colIndexToLabel(parsedRange.startCol + 1)],
      hasHeaders: true,
      x: 100,
      y: 100,
      width: 480,
      height: 300,
    };
    onInsertChart(newChart);
    toast.success(`Inserted ${chartType} chart`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Interactive Chart Engine</h2>
              <p className="text-xs text-muted-foreground">Generate column, line, area, and pie charts from spreadsheet cells</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Chart Title</label>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Data Range (e.g. A3:B7)</label>
              <input
                type="text"
                value={dataRange}
                onChange={(e) => setDataRange(e.target.value)}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 font-mono focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Chart Type Selector */}
          <div className="flex gap-2 pt-1">
            {(
              [
                { id: 'column', label: 'Column Chart', icon: BarChart3 },
                { id: 'line', label: 'Line Trend', icon: LineChart },
                { id: 'pie', label: 'Pie Chart', icon: PieChart },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setChartType(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  chartType === t.id
                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Chart Live Preview Box */}
          <div className="rounded-xl border border-border bg-background p-6 space-y-4 shadow-inner min-h-[220px] flex flex-col justify-between">
            <div className="font-bold text-sm text-foreground text-center">{chartTitle}</div>

            {chartType === 'column' && (
              <div className="flex items-end justify-around h-36 pt-4 gap-2 border-b border-border/80">
                {seriesValues.map((val, idx) => {
                  const heightPercent = Math.max(12, Math.round((val / maxValue) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 max-w-[60px]">
                      <span className="text-[10px] font-mono font-bold text-primary">{val}</span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-md transition-all shadow-xs"
                      />
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                        {labels[idx]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {chartType === 'line' && (
              <div className="flex items-center justify-around h-36 pt-4 gap-2 border-b border-border/80">
                {seriesValues.map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                      {idx + 1}
                    </div>
                    <span className="text-xs font-bold text-foreground">${val}</span>
                    <span className="text-[10px] text-muted-foreground">{labels[idx]}</span>
                  </div>
                ))}
              </div>
            )}

            {chartType === 'pie' && (
              <div className="flex items-center justify-center gap-6 py-2">
                <div className="h-28 w-28 rounded-full border-4 border-card shadow-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400" />
                <div className="space-y-1 text-xs">
                  {labels.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{l}:</span>
                      <span className="font-bold text-foreground">{seriesValues[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button variant="gradient" size="sm" onClick={handleCreate} className="rounded-xl text-xs font-bold gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Insert Chart to Sheet
          </Button>
        </div>
      </div>
    </div>
  );
}
