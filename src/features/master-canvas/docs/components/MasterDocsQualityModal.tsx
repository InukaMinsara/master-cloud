import React from 'react';
import { X, ShieldCheck, AlertTriangle, AlertCircle, Info, CheckCircle2, Sparkles } from 'lucide-react';
import { DocQualityService, DocHealthMetrics } from '../services/DocQualityService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MasterDocsQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentHtml: string;
  unresolvedCommentsCount?: number;
  onOpenComments?: () => void;
}

export function MasterDocsQualityModal({
  isOpen,
  onClose,
  contentHtml,
  unresolvedCommentsCount = 0,
  onOpenComments,
}: MasterDocsQualityModalProps) {
  if (!isOpen) return null;

  const metrics: DocHealthMetrics = DocQualityService.analyze(contentHtml, unresolvedCommentsCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Document Health & Quality Inspector</h2>
              <p className="text-xs text-muted-foreground">
                Readability metrics, structure validation, and accessibility audit
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

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Health Score Overview Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-muted/20 text-center">
              <div className="text-3xl font-black text-primary mb-1">{metrics.score}/100</div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Health Score</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/20 text-center">
              <div className="text-3xl font-black text-emerald-500 mb-1">{metrics.readingEase}</div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Flesch Reading Ease</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/20 text-center">
              <div className="text-sm font-black text-foreground mb-1 mt-2">{metrics.gradeLevel}</div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Target Audience</div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-background border border-border/70">
              <div className="font-bold text-foreground">{metrics.headingCount}</div>
              <div className="text-[10px] text-muted-foreground">Headings</div>
            </div>
            <div className="p-2 rounded-lg bg-background border border-border/70">
              <div className="font-bold text-foreground">{metrics.imageCount}</div>
              <div className="text-[10px] text-muted-foreground">Images</div>
            </div>
            <div className="p-2 rounded-lg bg-background border border-border/70">
              <div className="font-bold text-foreground">{metrics.tableCount}</div>
              <div className="text-[10px] text-muted-foreground">Tables</div>
            </div>
            <div className="p-2 rounded-lg bg-background border border-border/70">
              <div className="font-bold text-foreground">{metrics.linkCount}</div>
              <div className="text-[10px] text-muted-foreground">Links</div>
            </div>
          </div>

          {/* Inspection Issues List */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Quality Diagnostics ({metrics.issues.length})</span>
            </div>

            {metrics.issues.length === 0 ? (
              <div className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <span className="text-xs font-bold text-foreground">Outstanding Document Quality!</span>
                <span className="text-[11px] text-muted-foreground">No structure, accessibility, or formatting problems detected.</span>
              </div>
            ) : (
              metrics.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    issue.type === 'error'
                      ? 'border-destructive/30 bg-destructive/5'
                      : issue.type === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-blue-500/30 bg-blue-500/5'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {issue.type === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                    {issue.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    {issue.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[9px] uppercase font-bold py-0">
                        {issue.category}
                      </Badge>
                      <span className="text-xs font-semibold text-foreground">{issue.message}</span>
                    </div>
                  </div>

                  {issue.fixActionLabel && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (issue.category === 'readability' && onOpenComments) {
                          onOpenComments();
                        }
                        toast.info(issue.message);
                        onClose();
                      }}
                      className="rounded-lg text-[11px] h-7 px-2.5 font-semibold shrink-0"
                    >
                      {issue.fixActionLabel}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
}
