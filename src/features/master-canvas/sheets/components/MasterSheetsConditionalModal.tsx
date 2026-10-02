import React, { useState } from 'react';
import { X, Sparkles, Check, Palette, Plus, Trash2 } from 'lucide-react';
import { ConditionalRule } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MasterSheetsConditionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules?: ConditionalRule[];
  activeRange?: string;
  onSaveRules: (rules: ConditionalRule[]) => void;
}

export function MasterSheetsConditionalModal({
  isOpen,
  onClose,
  rules = [],
  activeRange = 'B4:D14',
  onSaveRules,
}: MasterSheetsConditionalModalProps) {
  const [rulesList, setRulesList] = useState<ConditionalRule[]>(rules);
  const [range, setRange] = useState(activeRange);
  const [operator, setOperator] = useState<ConditionalRule['operator']>('greaterThan');
  const [value1, setValue1] = useState('1000');
  const [bgColor, setBgColor] = useState('#dcfce7');
  const [textColor, setTextColor] = useState('#15803d');

  if (!isOpen) return null;

  const handleAddRule = () => {
    const newRule: ConditionalRule = {
      id: 'rule-' + Date.now(),
      range,
      type: 'cellValue',
      operator,
      value1,
      bgColor,
      textColor,
      bold: true,
    };
    const updated = [...rulesList, newRule];
    setRulesList(updated);
    onSaveRules(updated);
    toast.success('Conditional formatting rule added');
  };

  const handleDeleteRule = (id: string) => {
    const updated = rulesList.filter((r) => r.id !== id);
    setRulesList(updated);
    onSaveRules(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Conditional Formatting Rules</h2>
              <p className="text-xs text-muted-foreground">Highlight cells based on threshold values, text matches, and colors</p>
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
          {/* Add Rule Form */}
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
            <div className="text-xs font-bold text-foreground">Add New Formatting Rule</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Apply to Range</label>
                <input
                  type="text"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="w-full text-xs rounded-xl bg-background border border-border px-3 py-1.5 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Condition</label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as any)}
                  className="w-full text-xs rounded-xl bg-background border border-border px-3 py-1.5 focus:outline-none"
                >
                  <option value="greaterThan">Greater Than (&gt;)</option>
                  <option value="lessThan">Less Than (&lt;)</option>
                  <option value="equalTo">Equal To (=)</option>
                  <option value="textContains">Text Contains</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Threshold Value</label>
                <input
                  type="text"
                  value={value1}
                  onChange={(e) => setValue1(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full text-xs rounded-xl bg-background border border-border px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Format Style</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 w-10 rounded border p-0.5 bg-background cursor-pointer"
                    title="Fill Color"
                  />
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-8 w-10 rounded border p-0.5 bg-background cursor-pointer"
                    title="Text Color"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button size="sm" variant="gradient" onClick={handleAddRule} className="text-xs font-bold gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Rule
              </Button>
            </div>
          </div>

          {/* Existing Rules List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-foreground">Active Rules ({rulesList.length})</div>
            {rulesList.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                No conditional formatting rules set on this sheet.
              </div>
            ) : (
              rulesList.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">
                      {r.range} &bull; <span className="capitalize">{r.operator}</span> {r.value1}
                    </div>
                    <div
                      style={{ backgroundColor: r.bgColor, color: r.textColor }}
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold"
                    >
                      Sample Formatted Cell
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRule(r.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
