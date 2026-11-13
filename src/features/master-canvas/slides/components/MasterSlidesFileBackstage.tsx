import React from 'react';
import {
  ArrowLeft,
  Save,
  FolderOpen,
  FileUp,
  Printer,
  Download,
  ShieldCheck,
  LayoutTemplate,
  FileText,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';
import { MasterPresentationData } from '../types';

interface MasterSlidesFileBackstageProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: MasterPresentationData;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'offline' | 'syncing' | 'conflict';
  onSave: () => void;
  onOpenTemplates: () => void;
  onImportPptx: (file: File) => void;
  onExportPptx: () => void;
  onExportHtml: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onOpenHandoutModal: () => void;
  onOpenMasterView: () => void;
  onOpenHealthModal: () => void;
}

export function MasterSlidesFileBackstage({
  isOpen,
  onClose,
  presentation,
  saveStatus,
  onSave,
  onOpenTemplates,
  onImportPptx,
  onExportPptx,
  onExportHtml,
  onExportPdf,
  onExportJson,
  onOpenHandoutModal,
  onOpenMasterView,
  onOpenHealthModal,
}: MasterSlidesFileBackstageProps) {
  if (!isOpen) return null;

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportPptx(file);
      e.target.value = '';
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex bg-[#f3f2f1] dark:bg-slate-950 text-foreground animate-in fade-in duration-150 select-none">
      {/* Left Microsoft PowerPoint Burnt Orange-Red Sidebar */}
      <aside className="w-56 bg-[#B7472A] text-white flex flex-col justify-between py-4 shrink-0 shadow-xl">
        <div className="space-y-1">
          <div className="px-4 pb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/15 transition-colors"
              title="Back to Presentation (Esc)"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-sm tracking-tight">Back</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onSave();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-xs font-medium hover:bg-white/15 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save to Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenTemplates();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-xs font-medium hover:bg-white/15 transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            <span>New / Templates</span>
          </button>

          <label className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-xs font-medium hover:bg-white/15 transition-colors cursor-pointer">
            <FileUp className="h-4 w-4" />
            <span>Open PowerPoint (.pptx)</span>
            <input type="file" accept=".pptx,.potx" onChange={handleFilePick} className="hidden" />
          </label>

          <div className="my-2 border-t border-white/15 mx-4" />

          <button
            type="button"
            onClick={() => {
              onExportPdf();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-xs font-medium hover:bg-white/15 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenHandoutModal();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-xs font-medium hover:bg-white/15 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Print Handouts</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenMasterView();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-xs font-medium hover:bg-white/15 transition-colors"
          >
            <LayoutTemplate className="h-4 w-4" />
            <span>Slide Master</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenHealthModal();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-xs font-medium hover:bg-white/15 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Inspect Presentation</span>
          </button>
        </div>

        <div className="px-5 pt-4 border-t border-white/15 text-[11px] text-white/75">
          Master Cloud Slides &bull; PowerPoint Engine
        </div>
      </aside>

      {/* Right Backstage Workspace */}
      <main className="flex-1 overflow-y-auto p-8 md:p-12">
        <div className="max-w-4xl space-y-8">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div>
              <h1 className="text-2xl font-light text-foreground">
                {presentation.title || 'Untitled Presentation'}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  {saveStatus === 'saved' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  {saveStatus === 'saved' ? 'Saved to Master Cloud (10 TB Free)' : 'Unsaved changes'}
                </span>
                <span>&bull;</span>
                <span>{presentation.slides.length} slides ({presentation.aspectRatio})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
              title="Close Backstage"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Export Presentation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  onExportPptx();
                  onClose();
                }}
                className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-white dark:bg-slate-900 hover:border-[#B7472A] hover:shadow-sm transition-all text-left"
              >
                <div className="h-9 w-9 rounded bg-[#B7472A] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  PPTX
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">PowerPoint Deck (.pptx)</div>
                  <div className="text-[10px] text-muted-foreground">
                    Standard Microsoft PowerPoint OpenXML
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportHtml();
                  onClose();
                }}
                className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-white dark:bg-slate-900 hover:border-[#B7472A] hover:shadow-sm transition-all text-left"
              >
                <div className="h-9 w-9 rounded bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  HTML
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">Interactive Web Deck</div>
                  <div className="text-[10px] text-muted-foreground">
                    Standalone browser slideshow with animations
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportPdf();
                  onClose();
                }}
                className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-white dark:bg-slate-900 hover:border-[#B7472A] hover:shadow-sm transition-all text-left"
              >
                <div className="h-9 w-9 rounded bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  PDF
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">PDF Document</div>
                  <div className="text-[10px] text-muted-foreground">Print &amp; share fixed-layout slides</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportJson();
                  onClose();
                }}
                className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-white dark:bg-slate-900 hover:border-[#B7472A] hover:shadow-sm transition-all text-left"
              >
                <div className="h-9 w-9 rounded bg-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  JSON
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">Deck Package (.json)</div>
                  <div className="text-[10px] text-muted-foreground">Portable structured slide backup</div>
                </div>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
