import React, { useState } from 'react';
import { X, CheckSquare, Check } from 'lucide-react';
import { MasterSheetCell } from '../types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MasterSheetsValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCellId: string;
  onApplyValidation: (validation: MasterSheetCell['validation']) => void;
}

export function MasterSheetsValidationModal({
  isOpen,
  onClose,
  selectedCellId,
  onApplyValidation,
}: MasterSheetsValidationModalProps) {
  const [valType, setValType] = useState<'list' | 'number' | 'checkbox'>('list');
  const [optionsStr, setOptionsStr] = useState('High, Medium, Low, In Progress, Completed');
  const [minVal, setMinVal] = useState('0');
  const [maxVal, setMaxVal] = useState('100');

  if (!isOpen) return null;

  const handleApply = () => {
    let validation: MasterSheetCell['validation'];
    if (valType === 'list') {
      const opts = optionsStr.split(',').map((o) => o.trim()).filter(Boolean);
      validation = {
        type: 'list',
        options: opts,
      };
    } else if (valType === 'number') {
      validation = {
        type: 'number',
        min: Number(minVal) || 0,
        max: Number(maxVal) || 100,
      };
    } else {
      validation = {
        type: 'checkbox',
      };
    }

    onApplyValidation(validation);
    toast.success(`Data validation applied to ${selectedCellId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Data Validation & Criteria</h2>
              <p className="text-xs text-muted-foreground">Restrict cell inputs to dropdown choices, number limits, or checkboxes</p>
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
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Target Cell / Range</label>
            <input
              type="text"
              readOnly
              value={selectedCellId}
              className="w-full text-xs rounded-xl bg-muted/40 border border-border px-3 py-2 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Validation Type</label>
            <select
              value={valType}
              onChange={(e) => setValType(e.target.value as any)}
              className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="list">Dropdown List from Items</option>
              <option value="number">Numeric Range (Min / Max)</option>
              <option value="checkbox">Checkbox Cell (TRUE / FALSE)</option>
            </select>
          </div>

          {valType === 'list' && (
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Dropdown Items (comma-separated)</label>
              <textarea
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                rows={3}
                className="w-full text-xs rounded-xl bg-background border border-border p-3 focus:ring-1 focus:ring-primary focus:outline-none leading-relaxed"
              />
            </div>
          )}

          {valType === 'number' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Minimum</label>
                <input
                  type="number"
                  value={minVal}
                  onChange={(e) => setMinVal(e.target.value)}
                  className="w-full text-xs rounded-xl bg-background border border-border px-3 py-1.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Maximum</label>
                <input
                  type="number"
                  value={maxVal}
                  onChange={(e) => setMaxVal(e.target.value)}
                  className="w-full text-xs rounded-xl bg-background border border-border px-3 py-1.5 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button variant="gradient" size="sm" onClick={handleApply} className="rounded-xl text-xs font-bold gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Apply Validation
          </Button>
        </div>
      </div>
    </div>
  );
}
