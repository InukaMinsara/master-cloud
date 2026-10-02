import React, { useState } from 'react';
import { X, GitCompare, Check, RotateCcw, ArrowRight, Sparkles, FileText } from 'lucide-react';
import { DocDiffService, DiffResult } from '../services/DocDiffService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MasterDocsDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContentHtml: string;
  previousVersionHtml?: string;
  onRestorePrevious?: (content: string) => void;
}

export function MasterDocsDiffModal({
  isOpen,
  onClose,
  currentContentHtml,
  previousVersionHtml = '',
  onRestorePrevious,
}: MasterDocsDiffModalProps) {
  const [compareContent, setCompareContent] = useState(previousVersionHtml);
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>('unified');

  if (!isOpen) return null;

  const diffResult: DiffResult = DocDiffService.computeDiff(
    compareContent || '<p>Original document baseline</p>',
    currentContentHtml
  );

  const handleRestore = () => {
    if (onRestorePrevious && compareContent) {
      onRestorePrevious(compareContent);
      toast.success('Document restored to compared version');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Document Comparison & Diff Engine</h2>
              <p className="text-xs text-muted-foreground">
                Inspect added, removed, and modified text compared with past versions or snapshots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Metrics Banner */}
        <div className="px-6 py-3 border-b border-border/80 bg-background/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-semibold text-foreground">
              Similarity: <span className="text-primary font-bold">{diffResult.similarityPercentage}%</span>
            </span>
            <span className="text-emerald-500 font-semibold">+{diffResult.addedWords} words added</span>
            <span className="text-destructive font-semibold">-{diffResult.removedWords} words removed</span>
            <span className="text-muted-foreground">{diffResult.unchangedWords} unchanged words</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
              <button
                onClick={() => setDiffMode('unified')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  diffMode === 'unified' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                Unified Diff
              </button>
              <button
                onClick={() => setDiffMode('split')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  diffMode === 'split' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                Side-by-Side
              </button>
            </div>
          </div>
        </div>

        {/* Body View */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-muted/10">
          {diffMode === 'unified' ? (
            <div className="p-6 rounded-xl border border-border bg-background shadow-xs text-xs font-serif leading-relaxed min-h-[300px]">
              <div dangerouslySetInnerHTML={{ __html: diffResult.diffHtml }} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="flex flex-col rounded-xl border border-border bg-background p-4 shadow-xs overflow-hidden">
                <div className="text-[11px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-1.5 pb-2 border-b border-border">
                  <FileText className="h-3.5 w-3.5" />
                  Baseline / Previous Version
                </div>
                <div
                  className="flex-1 overflow-y-auto text-xs text-muted-foreground font-serif leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: compareContent || '<p>No previous baseline content</p>' }}
                />
              </div>

              <div className="flex flex-col rounded-xl border border-primary/30 bg-background p-4 shadow-xs overflow-hidden">
                <div className="text-[11px] uppercase font-bold text-primary mb-2 flex items-center gap-1.5 pb-2 border-b border-primary/20">
                  <FileText className="h-3.5 w-3.5" />
                  Current Active Version
                </div>
                <div
                  className="flex-1 overflow-y-auto text-xs text-foreground font-serif leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: currentContentHtml }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <span className="text-xs text-muted-foreground">High-precision token level comparison</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
              Close
            </Button>
            {onRestorePrevious && compareContent && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRestore}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore Baseline
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
