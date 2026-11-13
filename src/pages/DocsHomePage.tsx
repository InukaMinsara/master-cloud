import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Clock,
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  Search,
  FileUp,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { CanvasService } from '@/services/canvasService';
import { DocDocxService } from '@/features/master-canvas/docs/services/DocDocxService';
import { useFileStore } from '@/stores/fileStore';
import { FileItem } from '@/types/file';
import { formatDateRelative, formatBytes } from '@/lib/utils';
import {
  MASTER_DOCS_TEMPLATES,
  DocumentTemplate,
} from '@/features/master-canvas/docs/MasterDocsTemplates';
import { DocTemplateCard } from '@/features/master-canvas/docs/components/DocTemplateCard';
import { MasterDocsTemplateModal } from '@/features/master-canvas/docs/MasterDocsTemplateModal';
import { Button } from '@/components/ui/button';

const HOME_TABS = ['Featured', 'Reports', 'Resumes', 'Letters', 'Business', 'Academic'] as const;

export function DocsHomePage() {
  const navigate = useNavigate();
  const { files, fetchItems } = useFileStore();
  const [docFiles, setDocFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof HOME_TABS)[number]>('Featured');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [importingDocx, setImportingDocx] = useState(false);
  const docxInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const validExtensions = ['mdoc', 'docx', 'doc', 'mword'];
    const filtered = files.filter(
      (f) => !f.deleted_at && validExtensions.includes(f.extension.toLowerCase())
    );
    setDocFiles(filtered);
  }, [files]);

  const handleOpenDoc = (file: FileItem) => {
    navigate(`/canvas/docs/${file.id}`);
  };

  const handleStartTemplate = async (template: DocumentTemplate) => {
    if (template.id === 'blank') {
      navigate('/canvas/docs/new');
      return;
    }

    try {
      setCreatingTemplateId(template.id);
      const { file } = await CanvasService.createCanvasDocument(
        'docs',
        template.name,
        null,
        template.content
      );
      navigate(`/canvas/docs/${file.id}`);
    } catch {
      navigate('/canvas/docs/new');
    } finally {
      setCreatingTemplateId(null);
    }
  };

  const handleImportDocxFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportingDocx(true);
    try {
      const buffer = await file.arrayBuffer();
      const docTitle = file.name.replace(/\.docx$/i, '') || 'Imported Word Document';
      const parsed = await DocDocxService.importDocxBuffer(buffer, docTitle);
      const { file: created } = await CanvasService.createCanvasDocument(
        'docs',
        parsed.title || docTitle,
        null,
        parsed.html
      );
      toast.success(`Imported "${parsed.title || docTitle}" into Docs`);
      navigate(`/canvas/docs/${created.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Could not import .docx file');
    } finally {
      setImportingDocx(false);
    }
  };

  const visibleTemplates = useMemo(() => {
    if (activeTab === 'Featured') {
      return MASTER_DOCS_TEMPLATES.filter((t) => t.featured).slice(0, 5);
    }
    return MASTER_DOCS_TEMPLATES.filter((t) => t.category === activeTab).slice(0, 5);
  }, [activeTab]);

  const filteredDocs = useMemo(
    () => docFiles.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [docFiles, searchQuery]
  );

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto bg-background">
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-7 space-y-8 select-none">
        {/* Back Breadcrumb to Drive */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/drive')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Drive</span>
          </button>
        </div>

        {/* ── 1. Clean Docs Header ─────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="flex items-center gap-3.5">
            <img
              src="/docs-logo.png"
              alt="Master Cloud Docs"
              className="h-11 w-11 rounded-xl object-cover shadow-sm shrink-0"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Docs</h1>
              <p className="text-xs text-muted-foreground">
                Create, edit, and export Microsoft Word–compatible documents with 10 TB cloud autosave
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <input
              ref={docxInputRef}
              type="file"
              accept=".docx"
              onChange={handleImportDocxFile}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={importingDocx}
              onClick={() => docxInputRef.current?.click()}
              className="h-9 px-3.5 rounded-lg gap-2 text-xs font-medium border-border/80"
            >
              <FileUp className="h-3.5 w-3.5 text-[#185abd] dark:text-blue-400" />
              <span>{importingDocx ? 'Importing...' : 'Open .docx'}</span>
            </Button>
            <Button
              onClick={() => navigate('/canvas/docs/new')}
              size="sm"
              className="h-9 px-4 rounded-lg gap-1.5 text-xs font-semibold bg-[#185abd] hover:bg-[#115ea3] text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Blank document</span>
            </Button>
          </div>
        </header>

        {/* ── 2. Start a New Document (Clean 5-Card Word Shelf) ──────── */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-sm font-semibold text-foreground">New</h2>
              <nav className="flex items-center gap-1" aria-label="Template categories">
                {HOME_TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#185abd]/12 text-[#185abd] dark:bg-blue-500/15 dark:text-blue-400'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              type="button"
              onClick={() => setTemplateModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#185abd] dark:text-blue-400 hover:underline self-start md:self-auto"
            >
              <span>More templates ({MASTER_DOCS_TEMPLATES.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {visibleTemplates.map((template) => (
              <DocTemplateCard
                key={template.id}
                template={template}
                isCreating={creatingTemplateId === template.id}
                onSelect={handleStartTemplate}
              />
            ))}
          </div>
        </section>

        {/* ── 3. Recent Documents (Clean Word List View) ─────────────── */}
        <section className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#185abd] dark:text-blue-400" />
              <span>Recent</span>
              <span className="text-xs font-normal text-muted-foreground">({filteredDocs.length})</span>
            </h2>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full pl-8 pr-3 py-1.5 bg-card border border-border/70 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#185abd]"
                />
              </div>

              <button
                type="button"
                onClick={() => navigate('/drive')}
                className="text-xs text-[#185abd] dark:text-blue-400 hover:underline font-medium flex items-center gap-1 shrink-0"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Drive</span>
              </button>
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="bg-card/50 border border-border/60 rounded-xl p-10 text-center space-y-3">
              <div className="h-11 w-11 rounded-xl bg-[#185abd]/10 text-[#185abd] dark:text-blue-400 mx-auto flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <p className="text-sm font-semibold text-foreground">
                  {searchQuery ? 'No matching documents found' : 'No recent documents'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? 'Try another search term or start a new document above.'
                    : 'Choose Blank document or pick a Word template above to begin.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/70 bg-card/70 divide-y divide-border/50 overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 px-4 py-2 text-[11px] font-medium text-muted-foreground bg-muted/25">
                <span className="col-span-6">Name</span>
                <span className="col-span-3">Modified</span>
                <span className="col-span-2">Size</span>
                <span className="col-span-1 text-right">Open</span>
              </div>
              {filteredDocs.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => handleOpenDoc(file)}
                  className="w-full text-left grid grid-cols-12 items-center px-4 py-2.5 hover:bg-accent/50 transition-colors group"
                >
                  <div className="col-span-9 sm:col-span-6 flex items-center gap-3 min-w-0 pr-3">
                    <img
                      src="/docs-logo.png"
                      alt="Doc"
                      className="h-7 w-7 rounded-md object-cover shrink-0"
                    />
                    <span className="font-medium text-xs text-foreground truncate group-hover:text-[#185abd] dark:group-hover:text-blue-400 transition-colors">
                      {file.name}
                    </span>
                  </div>
                  <div className="hidden sm:block col-span-3 text-xs text-muted-foreground">
                    {formatDateRelative(file.updated_at)}
                  </div>
                  <div className="hidden sm:block col-span-2 text-xs text-muted-foreground">
                    {formatBytes(file.size_bytes)}
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex justify-end">
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <MasterDocsTemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSelectTemplate={handleStartTemplate}
      />
    </div>
  );
}
