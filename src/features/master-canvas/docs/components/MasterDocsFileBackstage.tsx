import React from 'react';
import {
  ArrowLeft,
  Save,
  FolderOpen,
  FileUp,
  Printer,
  Download,
  Tag,
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ExtendedCanvasDocData } from '../types';

interface MasterDocsFileBackstageProps {
  isOpen: boolean;
  onClose: () => void;
  docData: ExtendedCanvasDocData;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  onSave: () => void;
  onOpenTemplates: () => void;
  onImportDocx: (file: File) => void;
  onExport: (format: 'pdf' | 'docx' | 'html' | 'txt' | 'md' | 'rtf' | 'json') => void;
  onPrint: () => void;
  onOpenProperties: () => void;
  onOpenSecurity: () => void;
}

export function MasterDocsFileBackstage({
  isOpen,
  onClose,
  docData,
  saveStatus,
  onSave,
  onOpenTemplates,
  onImportDocx,
  onExport,
  onPrint,
  onOpenProperties,
  onOpenSecurity,
}: MasterDocsFileBackstageProps) {
  if (!isOpen) return null;

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportDocx(file);
      e.target.value = '';
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex bg-[#f3f2f1] dark:bg-slate-950 text-foreground animate-in fade-in duration-150">
      {/* Left Microsoft Word Blue Sidebar */}
      <aside className="w-56 bg-[#185abd] text-white flex flex-col justify-between py-4 shrink-0 shadow-xl">
        <div className="space-y-1">
          <div className="px-4 pb-4 flex items-center gap-3">
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/15 transition-colors"
              title="Back to Document (Esc)"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-sm tracking-tight">Back</span>
          </div>

          <button
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
            <span>Open Word (.docx)</span>
            <input type="file" accept=".docx" onChange={handleFilePick} className="hidden" />
          </label>

          <div className="my-2 border-t border-white/15 mx-4" />

          <button
            onClick={() => {
              onPrint();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-xs font-medium hover:bg-white/15 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>

          <button
            onClick={() => {
              onOpenProperties();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-xs font-medium hover:bg-white/15 transition-colors"
          >
            <Tag className="h-4 w-4" />
            <span>Properties & Info</span>
          </button>

          <button
            onClick={() => {
              onOpenSecurity();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-xs font-medium hover:bg-white/15 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Protect Document</span>
          </button>
        </div>

        <div className="px-5 pt-4 border-t border-white/15 text-[11px] text-white/75">
          Master Cloud Docs &bull; Word Engine
        </div>
      </aside>

      {/* Right Backstage Workspace */}
      <main className="flex-1 overflow-y-auto p-8 sm:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#185abd] text-white font-black text-base flex items-center justify-center shadow-sm">
                  W
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">{docData.title || 'Untitled Document'}</h1>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 pl-11">
                {saveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Saved to Master Cloud</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Unsaved edits queued for sync</span>
                  </>
                )}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              title="Close File Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Export As Grid */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Save a Copy / Export</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'docx', label: 'Word Document (.docx)', desc: 'Full OpenXML M365 Aptos styles & theme' },
                { id: 'pdf', label: 'Adobe PDF (.pdf)', desc: 'Print-ready paginated layout' },
                { id: 'rtf', label: 'Rich Text Format (.rtf)', desc: 'Cross-platform word processors' },
                { id: 'html', label: 'Web Page (.html)', desc: 'Clean standalone HTML5 document' },
                { id: 'md', label: 'Markdown (.md)', desc: 'Plain text structured headings & lists' },
                { id: 'txt', label: 'Plain Text (.txt)', desc: 'Unformatted raw text extract' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onExport(item.id as any);
                    onClose();
                  }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-card border border-black/10 dark:border-border hover:border-[#185abd] hover:shadow-md text-left transition-all group"
                >
                  <div className="p-2 rounded-lg bg-[#185abd]/10 text-[#185abd] shrink-0 group-hover:bg-[#185abd] group-hover:text-white transition-colors">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Document Summary Info */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Document Properties</h2>
            <div className="rounded-xl bg-white dark:bg-card border border-black/10 dark:border-border p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-muted-foreground text-[11px]">Words</div>
                <div className="font-semibold mt-0.5">{docData.wordCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[11px]">Characters</div>
                <div className="font-semibold mt-0.5">{docData.charCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[11px]">Page Size</div>
                <div className="font-semibold mt-0.5">
                  {docData.pageLayout?.size || 'A4'} ({docData.pageLayout?.orientation || 'portrait'})
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-[11px]">Margins & Theme</div>
                <div className="font-semibold mt-0.5 capitalize">
                  {docData.pageLayout?.margins || 'normal'} &bull; {docData.themeId || 'office-m365'}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
