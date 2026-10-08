import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckSquare,
  Palette,
  BookOpen,
  Image as ImageIcon,
  Video,
  Sparkles,
  Plus,
  Clock,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import { CANVAS_APP_CONFIG, CanvasService } from '@/services/canvasService';
import { CanvasAppType } from '@/types/canvas';
import { useFileStore } from '@/stores/fileStore';
import { FileItem } from '@/types/file';
import { formatDateRelative, formatBytes } from '@/lib/utils';

export function CanvasPage() {
  const navigate = useNavigate();
  const { files, fetchItems } = useFileStore();
  const [canvasFiles, setCanvasFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const validExtensions = ['mdoc', 'docx', 'doc', 'mword', 'msheet', 'xlsx', 'xls', 'mexcel', 'mslide', 'pptx', 'mform', 'mdraw', 'svg', 'mnote', 'monenote'];
    const filtered = files.filter(f => !f.deleted_at && validExtensions.includes(f.extension.toLowerCase()));
    setCanvasFiles(filtered);
  }, [files]);

  const appCards: { type: CanvasAppType; icon: any }[] = [
    { type: 'docs', icon: FileText },
    { type: 'word', icon: FileText },
    { type: 'sheets', icon: FileSpreadsheet },
    { type: 'excel', icon: FileSpreadsheet },
    { type: 'slides', icon: Presentation },
    { type: 'forms', icon: CheckSquare },
    { type: 'draw', icon: Palette },
    { type: 'notes', icon: BookOpen },
    { type: 'onenote', icon: BookOpen },
    { type: 'pics', icon: ImageIcon },
    { type: 'vids', icon: Video },
  ];

  const handleOpenApp = (type: CanvasAppType) => {
    if (type === 'pics' || type === 'vids') {
      navigate(`/canvas/${type}`);
    } else {
      navigate(`/canvas/${type}/new`);
    }
  };

  const handleOpenFile = (file: FileItem) => {
    const ext = file.extension.toLowerCase();
    let app: CanvasAppType = 'docs';
    if (ext === 'docx' || ext === 'doc' || ext === 'mword') app = 'word';
    else if (ext === 'msheet') app = 'sheets';
    else if (ext === 'xlsx' || ext === 'xls' || ext === 'mexcel') app = 'excel';
    else if (ext === 'mslide' || ext === 'pptx') app = 'slides';
    else if (ext === 'mform') app = 'forms';
    else if (ext === 'mdraw' || ext === 'svg') app = 'draw';
    else if (ext === 'mnote') app = 'notes';
    else if (ext === 'monenote') app = 'onenote';

    navigate(`/canvas/${app}/${file.id}`);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto bg-background p-6 sm:p-10 space-y-8 select-none">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-border/80 p-8 sm:p-12 shadow-xl">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Master Canvas Productivity Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Create without limits. Backed by 10 TB free storage.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Build docs, spreadsheets, slide presentations, surveys, diagrams, and notebooks — saved automatically to your Master Cloud Drive.
          </p>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Creation Applications
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {appCards.map(({ type, icon: Icon }) => {
            const config = CANVAS_APP_CONFIG[type];
            return (
              <div
                key={type}
                onClick={() => handleOpenApp(type)}
                className="group relative bg-card border border-border/70 hover:border-primary/50 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                    style={{ backgroundColor: `${config.color}15`, color: config.color }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {config.name}
                      </h3>
                      {type === 'vids' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/15 text-red-500 border border-red-500/20">
                          Qwen 3.8 Omni
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {config.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Start New</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Canvas Documents */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Recent Canvas Documents ({canvasFiles.length})</span>
          </h2>
          <button
            onClick={() => navigate('/drive')}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>View All in Drive</span>
          </button>
        </div>

        {canvasFiles.length === 0 ? (
          <div className="bg-card/50 border border-border/60 rounded-2xl p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">No Canvas documents created yet</p>
            <p className="text-xs text-muted-foreground">
              Choose one of the creation applications above to create your first Master Document, Sheet, Slide, or Drawing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {canvasFiles.map(file => (
              <div
                key={file.id}
                onClick={() => handleOpenFile(file)}
                className="bg-card border border-border/70 hover:border-primary/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <h4 className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
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
