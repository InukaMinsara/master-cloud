import React, { useState } from 'react';
import { Plus, MoreVertical, Trash2, Copy, Edit2, Palette, Shield, ChevronRight } from 'lucide-react';
import { MasterSingleSheet, MasterWorkbookData, CellRangeSelection } from '../types';
import { SheetFormulaEngine } from '../services/SheetFormulaEngine';
import { toast } from 'sonner';

interface MasterSheetsTabsProps {
  workbook: MasterWorkbookData;
  activeSheetId: string;
  onSelectSheet: (sheetId: string) => void;
  onAddSheet: () => void;
  onDeleteSheet: (sheetId: string) => void;
  onRenameSheet: (sheetId: string, newName: string) => void;
  onDuplicateSheet: (sheetId: string) => void;
  selection?: CellRangeSelection | null;
  activeSheet: MasterSingleSheet;
}

export function MasterSheetsTabs({
  workbook,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  onDeleteSheet,
  onRenameSheet,
  onDuplicateSheet,
  selection,
  activeSheet,
}: MasterSheetsTabsProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Calculate live status bar metrics on selection
  const computeSelectionMetrics = () => {
    if (!selection) return null;
    const nums: number[] = [];
    let count = 0;

    for (let r = selection.startRow; r <= selection.endRow; r++) {
      for (let c = selection.startCol; c <= selection.endCol; c++) {
        const cellId = `${SheetFormulaEngine.colIndexToLabel(c)}${r + 1}`;
        const val = SheetFormulaEngine.evaluateCell(cellId, activeSheet, workbook);
        if (val !== '') {
          count++;
          const num = Number(val);
          if (!isNaN(num)) nums.push(num);
        }
      }
    }

    if (count === 0) return null;

    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = nums.length ? sum / nums.length : 0;
    const min = nums.length ? Math.min(...nums) : 0;
    const max = nums.length ? Math.max(...nums) : 0;

    return {
      count,
      numCount: nums.length,
      sum: Number(sum.toFixed(2)),
      avg: Number(avg.toFixed(2)),
      min,
      max,
    };
  };

  const metrics = computeSelectionMetrics();

  const handleStartRename = (sheet: MasterSingleSheet) => {
    setEditingTabId(sheet.id);
    setEditName(sheet.name);
  };

  const handleSaveRename = (sheetId: string) => {
    if (editName.trim()) {
      onRenameSheet(sheetId, editName.trim());
    }
    setEditingTabId(null);
  };

  return (
    <footer className="flex h-9 items-center justify-between px-3 border-t border-border/80 bg-card/90 text-xs text-muted-foreground z-30 shrink-0 select-none">
      {/* Left: Sheets Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto max-w-xl">
        <button
          onClick={onAddSheet}
          className="p-1 rounded-lg hover:bg-accent text-primary transition-colors"
          title="Add Sheet"
        >
          <Plus className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {workbook.sheets.map((s) => {
            const isActive = s.id === activeSheetId;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSheet(s.id)}
                className={`group flex items-center gap-1.5 px-3 py-1 rounded-t-lg border-t-2 text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-background text-primary border-primary shadow-xs'
                    : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-accent hover:text-foreground'
                }`}
              >
                {editingTabId === s.id ? (
                  <input
                    type="text"
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleSaveRename(s.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(s.id)}
                    className="w-20 bg-background border border-primary rounded px-1 py-0.5 text-xs text-foreground focus:outline-none"
                  />
                ) : (
                  <span onDoubleClick={() => handleStartRename(s)} className="truncate max-w-[120px]">
                    {s.name}
                  </span>
                )}

                {/* Sheet Actions Menu */}
                {isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const choice = prompt('Options: rename, duplicate, delete');
                      if (choice === 'rename') handleStartRename(s);
                      else if (choice === 'duplicate') onDuplicateSheet(s.id);
                      else if (choice === 'delete') {
                        if (workbook.sheets.length > 1) onDeleteSheet(s.id);
                        else toast.error('Workbook must contain at least one sheet');
                      }
                    }}
                    className="opacity-60 hover:opacity-100 p-0.5"
                    title="Sheet options"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Live Aggregation Summary */}
      <div className="flex items-center gap-4 text-[11px] font-mono font-medium">
        {metrics && (
          <div className="flex items-center gap-3 bg-muted/40 px-2.5 py-0.5 rounded-lg border border-border/60">
            {metrics.numCount > 0 && (
              <>
                <span>
                  SUM: <strong className="text-primary">{metrics.sum}</strong>
                </span>
                <span>
                  AVG: <strong className="text-foreground">{metrics.avg}</strong>
                </span>
                <span>
                  MIN: <strong className="text-foreground">{metrics.min}</strong>
                </span>
                <span>
                  MAX: <strong className="text-foreground">{metrics.max}</strong>
                </span>
              </>
            )}
            <span>
              COUNT: <strong className="text-foreground">{metrics.count}</strong>
            </span>
          </div>
        )}
        <span className="hidden sm:inline-block text-[10px] text-muted-foreground">Master Sheets Engine &bull; Ready</span>
      </div>
    </footer>
  );
}
