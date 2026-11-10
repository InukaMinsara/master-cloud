import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Clock,
  ArrowRight,
  FolderOpen,
  Search,
  Sparkles,
  FileCheck,
  FileCode,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { CanvasService } from '@/services/canvasService';
import { useFileStore } from '@/stores/fileStore';
import { FileItem } from '@/types/file';
import { formatDateRelative, formatBytes } from '@/lib/utils';
import { MASTER_DOCS_TEMPLATES } from '@/features/master-canvas/docs/MasterDocsTemplates';
import { Button } from '@/components/ui/button';

export function CanvasPage() {
  const navigate = useNavigate();
  const { files, fetchItems } = useFileStore();
  const [docFiles, setDocFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);

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

  const handleStartTemplate = async (templateId: string) => {
    if (templateId === 'blank') {
      navigate('/canvas/docs/new');
      return;
    }

    const template = MASTER_DOCS_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      navigate('/canvas/docs/new');
      return;
    }

    try {
      setCreatingTemplateId(templateId);
      const { file } = await CanvasService.createCanvasDocument(
        'docs',
        template.name,
        null,
        template.content
      );
      navigate(`/canvas/docs/${file.id}`);
    } catch (err) {
      navigate('/canvas/docs/new');
    } finally {
      setCreatingTemplateId(null);
    }
  };

  const filteredDocs = docFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredTemplates = [
    {
      id: 'blank',
      name: 'Blank Document',
      category: 'Start Fresh',
      description: 'Clean document page ready for rich writing.',
      icon: Plus,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    },
    {
      id: 'project-proposal',
      name: 'Executive Proposal',
      category: 'Business',
      description: 'Project charter with objectives, milestones and budget tables.',
      icon: FileCheck,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'software-spec',
      name: 'Architecture Spec',
      category: 'Engineering',
      description: 'Technical spec with subsystems, architecture, and contracts.',
      icon: FileCode,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
    },
    {
      id: 'research-paper',
      name: 'Academic Paper',
      category: 'Academic',
      description: 'Formal academic publication template with abstract and citations.',
      icon: GraduationCap,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    },
  ];

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto bg-background p-6 sm:p-10 space-y-8 select-none">
      {/* ── 1. Hero Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-primary/10 border border-border/80 p-8 sm:p-10 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide">
              <FileText className="h-3.5 w-3.5" />
              <span>Docs Workspace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Docs
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Create, format, and edit rich documents with Word-grade typography, real-time autosave, and universal exports — backed by your free 10 TB Master Cloud storage.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Button
              onClick={() => navigate('/canvas/docs/new')}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl gap-2 font-bold shadow-lg shadow-blue-500/25 h-12 px-6"
            >
              <Plus className="h-5 w-5" />
              <span>New Document</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Start a New Document (Templates Gallery) ─────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-500" />
            <span>Start a New Document</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredTemplates.map((template) => {
            const Icon = template.icon;
            const isCreating = creatingTemplateId === template.id;

            return (
              <div
                key={template.id}
                onClick={() => !isCreating && handleStartTemplate(template.id)}
                className="group relative bg-card border border-border/70 hover:border-blue-500/50 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border ${template.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-foreground group-hover:text-blue-500 transition-colors">
                        {template.name}
                      </h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-blue-500">
                  <span>{isCreating ? 'Creating...' : 'Use Template'}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Recent Documents ────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Recent Documents ({filteredDocs.length})</span>
          </h2>

          <div className="flex items-center gap-3">
            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-9 pr-3 py-1.5 bg-card border border-border/70 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => navigate('/drive')}
              className="text-xs text-blue-500 hover:underline font-semibold flex items-center gap-1 shrink-0"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>All in Drive</span>
            </button>
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="bg-card/50 border border-border/60 rounded-2xl p-10 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="text-sm font-semibold text-foreground">
                {searchQuery ? 'No matching documents found' : 'No documents created yet'}
              </p>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? 'Try searching with a different keyword or create a new document.'
                  : 'Start typing your first document using Blank Document or one of the templates above.'}
              </p>
            </div>
            {!searchQuery && (
              <Button
                onClick={() => navigate('/canvas/docs/new')}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 text-xs font-semibold"
              >
                <Plus className="h-4 w-4" />
                <span>Create Document</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDocs.map((file) => (
              <div
                key={file.id}
                onClick={() => handleOpenDoc(file)}
                className="bg-card border border-border/70 hover:border-blue-500/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <h4 className="font-semibold text-xs text-foreground truncate group-hover:text-blue-500 transition-colors">
                      {file.name}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      Updated {formatDateRelative(file.updated_at)} • {formatBytes(file.size_bytes)}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
