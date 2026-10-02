import React, { useState } from 'react';
import { X, Wand2, Database, FileSpreadsheet, Play, Check, Copy } from 'lucide-react';
import { DocAutomationService } from '../services/DocAutomationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MasterDocsMailMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentHtml: string;
  onApplyMergedContent: (mergedHtml: string) => void;
  onInsertVariable: (varName: string) => void;
}

export function MasterDocsMailMergeModal({
  isOpen,
  onClose,
  contentHtml,
  onApplyMergedContent,
  onInsertVariable,
}: MasterDocsMailMergeModalProps) {
  const detectedVars = DocAutomationService.extractVariables(contentHtml);

  const sampleCsv = `name,company,title,amount,date
Alice Smith,Acme Corp,Senior Director,$14,500,2026-10-15
Bob Jones,Cyberdyne Systems,VP Engineering,$28,000,2026-10-20
Claire Vance,Initech Technologies,Product Lead,$9,800,2026-11-01`;

  const [csvData, setCsvData] = useState(sampleCsv);
  const [activeRecordIndex, setActiveRecordIndex] = useState(0);

  if (!isOpen) return null;

  const records = DocAutomationService.parseCsv(csvData);
  const currentRecord = records[activeRecordIndex] || records[0] || {};
  const previewHtml = DocAutomationService.interpolate(contentHtml, currentRecord);

  const handleApplySingle = () => {
    onApplyMergedContent(previewHtml);
    toast.success(`Merged data for ${currentRecord.name || 'Record 1'}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Document Automation & Mail Merge</h2>
              <p className="text-xs text-muted-foreground">Interpolate variables and generate batch personalized documents from datasets</p>
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
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Detected Variables Bar */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <div className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Detected Document Placeholders ({detectedVars.length})</span>
              <span className="text-[10px] text-muted-foreground">Click a variable to copy or insert</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {detectedVars.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  No variables found in document. Type <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary">&#123;&#123;name&#125;&#125;</code> or <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary">&#123;&#123;company&#125;&#125;</code> to add placeholders.
                </div>
              ) : (
                detectedVars.map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      onInsertVariable(v);
                      toast.info(`Inserted {{${v}}}`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-background border border-primary/30 text-xs font-mono font-semibold text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                  >
                    <span>&#123;&#123;{v}&#125;&#125;</span>
                    <Copy className="h-3 w-3 opacity-60" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CSV / Dataset Input & Live Preview Split */}
          <div className="grid grid-cols-2 gap-4 min-h-[260px]">
            {/* Left: CSV Source */}
            <div className="flex flex-col space-y-2">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                <span>Dataset (CSV / Spreadsheet Format)</span>
              </div>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                className="flex-1 font-mono text-xs rounded-xl bg-background border border-border p-3 focus:ring-1 focus:ring-primary focus:outline-none resize-none leading-relaxed"
                placeholder="name,company,amount..."
              />
              <div className="text-[11px] text-muted-foreground">
                Loaded {records.length} record(s). Columns: {Object.keys(currentRecord).join(', ')}
              </div>
            </div>

            {/* Right: Live Interpolated Preview */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Record #{activeRecordIndex + 1} Preview</span>
                <div className="flex items-center gap-1">
                  {records.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveRecordIndex(idx)}
                      className={`h-6 w-6 rounded-md text-[10px] font-bold transition-all ${
                        activeRecordIndex === idx
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 rounded-xl border border-border bg-background p-4 overflow-y-auto text-xs font-serif leading-relaxed shadow-inner">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleApplySingle}
            disabled={records.length === 0}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            Apply Merged Record #{activeRecordIndex + 1}
          </Button>
        </div>
      </div>
    </div>
  );
}
