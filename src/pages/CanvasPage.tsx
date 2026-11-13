import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CanvasPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto bg-background">
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-8 select-none">
        {/* Master Canvas Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-blue-600/15 text-blue-500 border border-blue-500/25 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Master Canvas</h1>
              <p className="text-xs text-muted-foreground">
                Select a workspace app to create, format, and save files directly to your 10 TB Master Cloud Drive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/drive')}
              className="h-9 px-3.5 rounded-lg gap-2 text-xs font-medium border-border/80"
            >
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Drive Files</span>
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

        {/* Master Canvas Apps Grid (Docs + Slides) */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Available Apps
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Docs Card */}
            <button
              type="button"
              onClick={() => navigate('/docs')}
              className="group text-left rounded-2xl border border-border/70 bg-card/85 hover:bg-card hover:border-[#185abd]/60 hover:shadow-xl transition-all duration-200 p-6 flex flex-col justify-between gap-6 focus:outline-none focus:ring-2 focus:ring-[#185abd]/50"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <img
                    src="/docs-logo.png"
                    alt="Docs Logo"
                    className="h-14 w-14 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform duration-200"
                  />
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#185abd]/12 text-[#185abd] dark:bg-blue-500/15 dark:text-blue-400">
                    Word Engine
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-[#185abd] dark:group-hover:text-blue-400 transition-colors">
                    Docs
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Microsoft Word–compatible document studio with 21 built-in Word templates, Aptos fonts, Fluent ribbon, and .docx import/export.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-[#185abd] dark:text-blue-400">
                <span>Open Docs &amp; Templates</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            {/* Slides Card (PowerPoint Clone) */}
            <button
              type="button"
              onClick={() => navigate('/slides')}
              className="group text-left rounded-2xl border border-border/70 bg-card/85 hover:bg-card hover:border-[#B7472A]/60 hover:shadow-xl transition-all duration-200 p-6 flex flex-col justify-between gap-6 focus:outline-none focus:ring-2 focus:ring-[#B7472A]/50"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <img
                    src="/slides-logo.png"
                    alt="Slides Logo"
                    className="h-14 w-14 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform duration-200"
                  />
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#B7472A]/12 text-[#B7472A] dark:bg-orange-500/15 dark:text-orange-400">
                    PowerPoint Engine
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-[#B7472A] dark:group-hover:text-orange-400 transition-colors">
                    Slides
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Microsoft PowerPoint–compatible presentation studio with .potx themes, animations, Presenter Studio, and .pptx import/export.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-[#B7472A] dark:text-orange-400">
                <span>Open Slides &amp; Templates</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
