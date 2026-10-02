import React, { useState } from 'react';
import {
  X,
  History,
  Clock,
  Plus,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { MasterPresentationData, SlideVersionHistoryItem } from '../types';

interface MasterSlidesVersionHistoryModalProps {
  presentation: MasterPresentationData;
  onClose: () => void;
  onCreateSnapshot: (title: string, description: string) => void;
  onRestoreVersion: (snapshot: MasterPresentationData) => void;
}

export function MasterSlidesVersionHistoryModal({
  presentation,
  onClose,
  onCreateSnapshot,
  onRestoreVersion,
}: MasterSlidesVersionHistoryModalProps) {
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    presentation.versions?.[0]?.id || null
  );

  const versions = presentation.versions || [];
  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  const handleSaveSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotTitle.trim()) return;
    onCreateSnapshot(snapshotTitle.trim(), snapshotDesc.trim());
    setSnapshotTitle('');
    setSnapshotDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-5xl h-[85vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Version History &amp; Snapshots
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Browse past revisions, inspect changes, and restore prior states safely.
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

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Timeline Panel */}
          <div className="w-80 border-r border-border bg-card/40 flex flex-col">
            {/* Create Snapshot Form */}
            <form onSubmit={handleSaveSnapshot} className="p-4 border-b border-border bg-card/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-primary" /> Create Named Snapshot
              </h3>
              <input
                type="text"
                value={snapshotTitle}
                onChange={(e) => setSnapshotTitle(e.target.value)}
                placeholder="Snapshot Name (e.g., Final Client Review)"
                className="w-full text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 mb-2 outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
              <button
                type="submit"
                disabled={!snapshotTitle.trim()}
                className="w-full py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors disabled:opacity-30 shadow-sm"
              >
                Save Version Snapshot
              </button>
            </form>

            {/* Versions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {versions.length > 0 ? (
                versions.map((v) => {
                  const isSelected = selectedVersionId === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVersionId(v.id)}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary ring-1 ring-primary bg-primary/10 shadow-sm'
                          : 'border-border/70 hover:border-border bg-card/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-foreground truncate">{v.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mb-1">
                        {v.description || `Snapshot by ${v.author}`}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {new Date(v.timestamp).toLocaleDateString()}
                        </span>
                        <span>&bull;</span>
                        <span>{v.slideCount} slides</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No previous version snapshots saved. Use the form above to record your first revision.
                </div>
              )}
            </div>
          </div>

          {/* Right Version Preview Panel */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-muted/20">
            {selectedVersion ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {selectedVersion.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Created by {selectedVersion.author} on {new Date(selectedVersion.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onRestoreVersion(selectedVersion.snapshotData);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md transition-all"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Restore This Version</span>
                  </button>
                </div>

                {/* Slides Overview of Snapshot */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Slides in this Version ({selectedVersion.snapshotData.slides.length})
                  </h4>

                  <div className="grid grid-cols-3 gap-4">
                    {selectedVersion.snapshotData.slides.map((s, idx) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl border border-border bg-card shadow-sm aspect-video flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold">
                          <span>Slide #{idx + 1}</span>
                          <span className="capitalize">{s.layout}</span>
                        </div>
                        <p className="text-xs font-bold text-foreground text-center truncate my-auto">
                          {s.title || 'Untitled Slide'}
                        </p>
                        <span className="text-[9px] text-muted-foreground text-right">
                          {s.objects.length} elements
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="m-auto text-center text-muted-foreground">
                <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-medium">Select a version from the left panel to inspect.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
