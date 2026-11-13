import React, { useState } from 'react';
import { X, TableProperties, Sparkles, Check, Database, RefreshCw } from 'lucide-react';
import { MasterSingleSheet, MasterWorkbookData, PivotTableConfig } from '../types';
import { SheetFormulaEngine } from '../services/SheetFormulaEngine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MasterSheetsPivotModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSheet: MasterSingleSheet;
  workbook: MasterWorkbookData;
  initialRange?: string;
  onInsertPivotTable: (config: PivotTableConfig) => void;
}

export function MasterSheetsPivotModal({
  isOpen,
  onClose,
  activeSheet,
  workbook,
  initialRange = 'A3:E20',
  onInsertPivotTable,
}: MasterSheetsPivotModalProps) {
  const [sourceRange, setSourceRange] = useState(initialRange);
  const [rowField, setRowField] = useState('Category / Owner');
  const [valueField, setValueField] = useState('Actual / Value');
  const [aggregation, setAggregation] = useState<PivotTableConfig['aggregation']>('SUM');

  if (!isOpen) return null;

  const handleCreate = () => {
    const config: PivotTableConfig = {
      id: 'pivot-' + Date.now(),
      sourceRange,
      rowFields: [rowField],
      columnFields: [],
      valueField,
      aggregation,
    };
    onInsertPivotTable(config);
    toast.success('Pivot Table generated');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <TableProperties className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Interactive Pivot Table Builder</h2>
              <p className="text-xs text-muted-foreground">Summarize and aggregate complex multidimensional spreadsheet records</p>
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
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Source Table Range</label>
            <input
              type="text"
              value={sourceRange}
              onChange={(e) => setSourceRange(e.target.value)}
              className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 font-mono focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Row Dimension</label>
              <input
                type="text"
                value={rowField}
                onChange={(e) => setRowField(e.target.value)}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Value Field</label>
              <input
                type="text"
                value={valueField}
                onChange={(e) => setValueField(e.target.value)}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Aggregation Function</label>
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value as any)}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="SUM">SUM</option>
                <option value="COUNT">COUNT</option>
                <option value="AVERAGE">AVERAGE</option>
                <option value="MIN">MIN</option>
                <option value="MAX">MAX</option>
              </select>
            </div>
          </div>

          {/* Pivot Table Mock Preview */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-2 shadow-inner">
            <div className="text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
              <span>Pivot Summary Output Preview</span>
              <Badge variant="outline" className="text-[9px] uppercase">
                {aggregation}
              </Badge>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left p-2 font-semibold text-foreground">{rowField}</th>
                  <th className="text-right p-2 font-semibold text-foreground">
                    {aggregation} of {valueField}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="p-2 text-foreground font-medium">Group Alpha</td>
                  <td className="p-2 text-right font-mono text-primary font-bold">14,250</td>
                </tr>
                <tr>
                  <td className="p-2 text-foreground font-medium">Group Beta</td>
                  <td className="p-2 text-right font-mono text-primary font-bold">9,800</td>
                </tr>
                <tr className="bg-muted/30 font-bold">
                  <td className="p-2 text-foreground">Grand Total</td>
                  <td className="p-2 text-right font-mono text-primary">24,050</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button variant="gradient" size="sm" onClick={handleCreate} className="rounded-xl text-xs font-bold gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Build Pivot Table
          </Button>
        </div>
      </div>
    </div>
  );
}
