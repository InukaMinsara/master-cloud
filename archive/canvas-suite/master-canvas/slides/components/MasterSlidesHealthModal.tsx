import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Eye,
  Type,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { MasterPresentationData, SlideDocumentHealthIssue } from '../types';

interface MasterSlidesHealthModalProps {
  presentation: MasterPresentationData;
  onClose: () => void;
  onJumpToSlide: (slideIndex: number, objectId?: string) => void;
}

export function MasterSlidesHealthModal({
  presentation,
  onClose,
  onJumpToSlide,
}: MasterSlidesHealthModalProps) {
  // Run real deterministic presentation inspection
  const issues: SlideDocumentHealthIssue[] = [];

  presentation.slides.forEach((slide, sIdx) => {
    // 1. Check Slide Title
    if (!slide.title || slide.title.trim() === 'Untitled Slide' || slide.title.trim() === '') {
      issues.push({
        id: `issue-title-${slide.id}`,
        severity: 'warning',
        category: 'layout',
        slideIndex: sIdx,
        slideId: slide.id,
        message: `Slide #${sIdx + 1} has no descriptive title.`,
        fixSuggestion: 'Add a clear slide title to aid screen readers and navigation outline.',
      });
    }

    // 2. Check Objects on Slide
    slide.objects.forEach((obj) => {
      // Out of bounds check
      if (obj.x < 0 || obj.y < 0 || obj.x + obj.width > 102 || obj.y + obj.height > 102) {
        issues.push({
          id: `issue-bounds-${obj.id}`,
          severity: 'warning',
          category: 'layout',
          slideIndex: sIdx,
          slideId: slide.id,
          objectId: obj.id,
          message: `Object "${obj.name || obj.type}" is partially outside slide canvas boundaries.`,
          fixSuggestion: 'Move or resize the object to fit completely within the slide frame.',
        });
      }

      // Accessibility Alt Text on Images
      if (obj.type === 'image' && !obj.altText) {
        issues.push({
          id: `issue-alt-${obj.id}`,
          severity: 'info',
          category: 'accessibility',
          slideIndex: sIdx,
          slideId: slide.id,
          objectId: obj.id,
          message: `Image on Slide #${sIdx + 1} is missing accessibility Alt Text.`,
          fixSuggestion: 'Add a brief description of this visual for screen readers.',
        });
      }

      // Empty Text Placeholders
      if (obj.type === 'text' && (!obj.content || obj.content.trim() === '')) {
        issues.push({
          id: `issue-empty-text-${obj.id}`,
          severity: 'error',
          category: 'typography',
          slideIndex: sIdx,
          slideId: slide.id,
          objectId: obj.id,
          message: `Empty text box found on Slide #${sIdx + 1}.`,
          fixSuggestion: 'Add content or remove the empty text container.',
        });
      }

      // Broken Hyperlinks
      if (obj.format?.linkUrl && !obj.format.linkUrl.startsWith('http') && !obj.format.linkUrl.startsWith('/')) {
        issues.push({
          id: `issue-link-${obj.id}`,
          severity: 'warning',
          category: 'links',
          slideIndex: sIdx,
          slideId: slide.id,
          objectId: obj.id,
          message: `Hyperlink "${obj.format.linkUrl}" may be invalid or malformed.`,
          fixSuggestion: 'Ensure the link starts with https:// or is a valid URL.',
        });
      }
    });
  });

  const totalObjects = presentation.slides.reduce((acc, s) => acc + s.objects.length, 0);
  const totalWords = presentation.slides.reduce(
    (acc, s) =>
      acc +
      s.objects
        .filter((o) => o.type === 'text')
        .reduce((w, o) => w + o.content.split(/\s+/).filter(Boolean).length, 0),
    0
  );

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const getSeverityBadge = (sev: SlideDocumentHealthIssue['severity']) => {
    switch (sev) {
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-3 w-3" /> Error
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-3 w-3" /> Warning
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
            <Info className="h-3 w-3" /> Suggestion
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Document Health &amp; Accessibility Inspector
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Automated validation of layout bounds, typography, accessibility, and link health.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Presentation Metrics Cards */}
        <div className="p-6 pb-2 grid grid-cols-4 gap-4">
          <div className="bg-card/50 border border-border rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Total Slides
            </span>
            <p className="text-xl font-bold text-foreground mt-0.5">{presentation.slides.length}</p>
          </div>
          <div className="bg-card/50 border border-border rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Total Elements
            </span>
            <p className="text-xl font-bold text-foreground mt-0.5">{totalObjects}</p>
          </div>
          <div className="bg-card/50 border border-border rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Word Count
            </span>
            <p className="text-xl font-bold text-foreground mt-0.5">{totalWords}</p>
          </div>
          <div className="bg-card/50 border border-border rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Health Status
            </span>
            <p
              className={`text-xl font-bold mt-0.5 ${
                errorCount > 0 ? 'text-rose-500' : warningCount > 0 ? 'text-amber-500' : 'text-emerald-500'
              }`}
            >
              {errorCount === 0 && warningCount === 0 ? 'Optimal' : `${issues.length} Issues`}
            </p>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {issues.length > 0 ? (
            issues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-2xl border border-border/80 bg-card/60 flex items-start justify-between gap-4 shadow-sm hover:border-border transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(issue.severity)}
                    <span className="text-xs font-bold text-foreground">
                      Slide #{issue.slideIndex + 1}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase px-1.5 py-0.2 rounded bg-muted/60">
                      {issue.category}
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{issue.message}</p>
                  <p className="text-[11px] text-muted-foreground">{issue.fixSuggestion}</p>
                </div>

                <button
                  onClick={() => {
                    onJumpToSlide(issue.slideIndex, issue.objectId);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground text-xs font-bold shrink-0 transition-colors border border-border"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  <span>Inspect</span>
                </button>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-foreground">Presentation Quality Optimal</h3>
              <p className="text-xs">
                No layout violations, out-of-bounds objects, or accessibility issues detected.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
