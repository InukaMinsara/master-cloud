import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Presentation,
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
import {
  SlideTemplates,
  SlideTemplateCatalogItem,
} from '@/features/master-canvas/slides/services/SlideTemplates';
import { SlidePptxService } from '@/features/master-canvas/slides/services/SlidePptxService';
import { SlideTemplateCard } from '@/features/master-canvas/slides/components/SlideTemplateCard';
import { MasterSlidesTemplatesModal } from '@/features/master-canvas/slides/components/MasterSlidesTemplatesModal';
import { useFileStore } from '@/stores/fileStore';
import { FileItem } from '@/types/file';
import { formatDateRelative, formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const SLIDE_HOME_TABS = ['Featured', 'Business', 'Pitch', 'Training', 'Photo & Creative'] as const;

export function SlidesHomePage() {
  const navigate = useNavigate();
  const { files, fetchItems } = useFileStore();
  const [slideFiles, setSlideFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof SLIDE_HOME_TABS)[number]>('Featured');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [importingPptx, setImportingPptx] = useState(false);
  const pptxInputRef = useRef<HTMLInputElement>(null);

  const catalog = useMemo(() => SlideTemplates.getTemplatesCatalog(), []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const validExtensions = ['mslide', 'pptx', 'ppt', 'potx'];
    const filtered = files.filter(
      (f) => !f.deleted_at && validExtensions.includes(f.extension.toLowerCase())
    );
    setSlideFiles(filtered);
  }, [files]);

  const handleOpenDeck = (file: FileItem) => {
    navigate(`/canvas/slides/${file.id}`);
  };

  const handleStartTemplate = async (item: SlideTemplateCatalogItem) => {
    if (item.id === 'blank') {
      navigate('/canvas/slides/new');
      return;
    }

    try {
      setCreatingTemplateId(item.id);
      const deck = item.createDeck();
      const { file } = await CanvasService.createCanvasDocument('slides', deck.title, null, deck);
      navigate(`/canvas/slides/${file.id}`);
    } catch {
      navigate('/canvas/slides/new');
    } finally {
      setCreatingTemplateId(null);
    }
  };

  const handleImportPptxFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportingPptx(true);
    try {
      const buffer = await file.arrayBuffer();
      const importedDeck = await SlidePptxService.importPptxBuffer(buffer, file.name);
      const { file: created } = await CanvasService.createCanvasDocument(
        'slides',
        importedDeck.title,
        null,
        importedDeck
      );
      toast.success(`Imported "${importedDeck.title}" (${importedDeck.slides.length} slides)`);
      navigate(`/canvas/slides/${created.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Could not import .pptx file');
    } finally {
      setImportingPptx(false);
    }
  };

  const visibleTemplates = useMemo(() => {
    if (activeTab === 'Featured') {
      return catalog.filter((t) => t.featured).slice(0, 5);
    }
    return catalog.filter((t) => t.category === activeTab).slice(0, 5);
  }, [activeTab, catalog]);

  const filteredDecks = useMemo(
    () => slideFiles.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [slideFiles, searchQuery]
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

        {/* 1. Clean PowerPoint Start Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="flex items-center gap-3.5">
            <img
              src="/slides-logo.png"
              alt="Slides Logo"
              className="h-11 w-11 rounded-xl object-cover shadow-sm shrink-0"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Slides</h1>
              <p className="text-xs text-muted-foreground">
                Build widescreen PowerPoint presentations with animations, presenter studio &amp; .pptx export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <input
              ref={pptxInputRef}
              type="file"
              accept=".pptx,.potx"
              onChange={handleImportPptxFile}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={importingPptx}
              onClick={() => pptxInputRef.current?.click()}
              className="h-9 px-3.5 rounded-lg gap-2 text-xs font-medium border-border/80"
            >
              <FileUp className="h-3.5 w-3.5 text-[#B7472A] dark:text-orange-400" />
              <span>{importingPptx ? 'Importing...' : 'Open .pptx'}</span>
            </Button>
            <Button
              onClick={() => navigate('/canvas/slides/new')}
              size="sm"
              className="h-9 px-4 rounded-lg gap-1.5 text-xs font-semibold bg-[#B7472A] hover:bg-[#9c3a20] text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Blank presentation</span>
            </Button>
          </div>
        </header>

        {/* 2. Start a New Presentation (Clean 5-Card PowerPoint Shelf) */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-sm font-semibold text-foreground">New</h2>
              <nav className="flex items-center gap-1" aria-label="Presentation categories">
                {SLIDE_HOME_TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#B7472A]/12 text-[#B7472A] dark:bg-orange-500/15 dark:text-orange-400'
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
              className="inline-flex items-center gap-1 text-xs font-medium text-[#B7472A] dark:text-orange-400 hover:underline self-start md:self-auto"
            >
              <span>More themes ({catalog.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {visibleTemplates.map((template) => (
              <SlideTemplateCard
                key={template.id}
                template={template}
                isCreating={creatingTemplateId === template.id}
                onSelect={handleStartTemplate}
              />
            ))}
          </div>
        </section>

        {/* 3. Recent Presentations */}
        <section className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#B7472A] dark:text-orange-400" />
              <span>Recent</span>
              <span className="text-xs font-normal text-muted-foreground">({filteredDecks.length})</span>
            </h2>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search presentations..."
                  className="w-full pl-8 pr-3 py-1.5 bg-card border border-border/70 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#B7472A]"
                />
              </div>

              <button
                type="button"
                onClick={() => navigate('/drive')}
                className="text-xs text-[#B7472A] dark:text-orange-400 hover:underline font-medium flex items-center gap-1 shrink-0"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Drive</span>
              </button>
            </div>
          </div>

          {filteredDecks.length === 0 ? (
            <div className="bg-card/50 border border-border/60 rounded-xl p-10 text-center space-y-3">
              <div className="h-11 w-11 rounded-xl bg-[#B7472A]/10 text-[#B7472A] dark:text-orange-400 mx-auto flex items-center justify-center">
                <Presentation className="h-5 w-5" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <p className="text-sm font-semibold text-foreground">
                  {searchQuery ? 'No matching presentations found' : 'No recent presentations'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? 'Try another search term or start a new deck above.'
                    : 'Choose Blank presentation or pick a PowerPoint template above to begin.'}
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
              {filteredDecks.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => handleOpenDeck(file)}
                  className="w-full text-left grid grid-cols-12 items-center px-4 py-2.5 hover:bg-accent/50 transition-colors group"
                >
                  <div className="col-span-9 sm:col-span-6 flex items-center gap-3 min-w-0 pr-3">
                    <div className="h-7 w-7 rounded-md bg-[#B7472A] text-white font-black text-xs flex items-center justify-center shrink-0">
                      P
                    </div>
                    <span className="font-medium text-xs text-foreground truncate group-hover:text-[#B7472A] dark:group-hover:text-orange-400 transition-colors">
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

      {templateModalOpen && (
        <MasterSlidesTemplatesModal
          onClose={() => setTemplateModalOpen(false)}
          onApplyTemplate={async (deck) => {
            try {
              const { file } = await CanvasService.createCanvasDocument(
                'slides',
                deck.title,
                null,
                deck
              );
              navigate(`/canvas/slides/${file.id}`);
            } catch {
              navigate('/canvas/slides/new');
            }
          }}
        />
      )}
    </div>
  );
}
