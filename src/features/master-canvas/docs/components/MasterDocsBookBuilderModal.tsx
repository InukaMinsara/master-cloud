import React, { useState } from 'react';
import { X, Book, Plus, Trash2, ArrowUp, ArrowDown, FileText, Check } from 'lucide-react';
import { DocBookChapter } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MasterDocsBookBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters?: DocBookChapter[];
  onSaveChapters: (chapters: DocBookChapter[]) => void;
}

export function MasterDocsBookBuilderModal({
  isOpen,
  onClose,
  chapters = [],
  onSaveChapters,
}: MasterDocsBookBuilderModalProps) {
  const defaultChapters: DocBookChapter[] =
    chapters.length > 0
      ? chapters
      : [
          {
            id: 'chap-cover',
            title: 'Front Cover & Title Page',
            order: 1,
            type: 'cover',
            contentHtml: '<h1>Master Cloud Architecture Guide</h1><p>A comprehensive treatise</p>',
          },
          {
            id: 'chap-preface',
            title: 'Preface & Executive Summary',
            order: 2,
            type: 'preface',
            contentHtml: '<h2>Preface</h2><p>Introduction to the principles and foundations.</p>',
          },
          {
            id: 'chap-1',
            title: 'Chapter 1: System Foundations',
            order: 3,
            type: 'chapter',
            contentHtml: '<h2>Chapter 1</h2><p>Deep dive into the core engine.</p>',
          },
          {
            id: 'chap-appendix',
            title: 'Appendix: Benchmark Specifications',
            order: 4,
            type: 'appendix',
            contentHtml: '<h2>Appendix A</h2><p>Performance metrics and telemetry.</p>',
          },
        ];

  const [chapList, setChapList] = useState<DocBookChapter[]>(defaultChapters);
  const [selectedChapId, setSelectedChapId] = useState<string>(defaultChapters[0]?.id || '');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<DocBookChapter['type']>('chapter');

  if (!isOpen) return null;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= chapList.length) return;

    const updated = [...chapList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // re-index order
    updated.forEach((c, idx) => {
      c.order = idx + 1;
    });

    setChapList(updated);
    onSaveChapters(updated);
  };

  const handleAddChapter = () => {
    if (!newTitle.trim()) return;
    const newChap: DocBookChapter = {
      id: 'chap-' + Date.now(),
      title: newTitle.trim(),
      order: chapList.length + 1,
      type: newType,
      contentHtml: `<h2>${newTitle.trim()}</h2><p>Chapter body begins here.</p>`,
    };
    const updated = [...chapList, newChap];
    setChapList(updated);
    onSaveChapters(updated);
    setNewTitle('');
    toast.success(`Added ${newTitle}`);
  };

  const handleDeleteChapter = (id: string) => {
    const updated = chapList.filter((c) => c.id !== id);
    updated.forEach((c, idx) => {
      c.order = idx + 1;
    });
    setChapList(updated);
    onSaveChapters(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Book className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Long Document & Master Book Builder</h2>
              <p className="text-xs text-muted-foreground">
                Organize Front Matter, Chapters, Appendices, and Index for publications and theses
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

        {/* Body Split */}
        <div className="flex flex-1 min-h-0 divide-x divide-border/80">
          {/* Left: Chapters Order Manager */}
          <div className="w-80 p-4 overflow-y-auto space-y-4 bg-muted/20">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Document Structure ({chapList.length} Sections)
            </div>

            <div className="space-y-2">
              {chapList.map((chap, idx) => (
                <div
                  key={chap.id}
                  onClick={() => setSelectedChapId(chap.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    chap.id === selectedChapId
                      ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                      : 'border-border/80 bg-card hover:bg-accent/40'
                  }`}
                >
                  <div className="min-w-0">
                    <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 mb-1">
                      {chap.type}
                    </Badge>
                    <div className="text-xs font-bold text-foreground truncate">{chap.title}</div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(idx, 'up');
                      }}
                      className="p-1 rounded hover:bg-accent disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      disabled={idx === chapList.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(idx, 'down');
                      }}
                      className="p-1 rounded hover:bg-accent disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChapter(chap.id);
                      }}
                      className="p-1 rounded hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Section */}
            <div className="pt-2 border-t border-border/80 space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New Chapter / Section Title"
                className="w-full text-xs rounded-lg bg-background border border-border px-3 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <div className="flex gap-2">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="flex-1 text-xs rounded-lg bg-background border border-border px-2 py-1.5 focus:outline-none"
                >
                  <option value="chapter">Chapter</option>
                  <option value="preface">Preface / Intro</option>
                  <option value="appendix">Appendix</option>
                  <option value="index">Index</option>
                </select>
                <Button size="sm" variant="gradient" onClick={handleAddChapter} className="text-xs font-bold px-3">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Section Preview */}
          <div className="flex-1 p-6 overflow-y-auto">
            {chapList.find((c) => c.id === selectedChapId) ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">
                    {chapList.find((c) => c.id === selectedChapId)?.title}
                  </h3>
                  <Badge variant="outline" className="text-xs capitalize font-semibold">
                    {chapList.find((c) => c.id === selectedChapId)?.type}
                  </Badge>
                </div>
                <div className="rounded-xl border border-border bg-background p-6 text-xs font-serif leading-relaxed shadow-inner min-h-[300px]">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: chapList.find((c) => c.id === selectedChapId)?.contentHtml || '<p>No content</p>',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-muted-foreground">Select a section to preview</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <span className="text-xs text-muted-foreground">Preserves chapter hierarchy and automated pagination</span>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
