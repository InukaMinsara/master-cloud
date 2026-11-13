import React, { useState } from 'react';
import { X, BookOpen, Plus, Trash2, Quote, ExternalLink, Sparkles } from 'lucide-react';
import { DocCitationSource, CitationStyle } from '../types';
import { DocCitationService } from '../services/DocCitationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MasterDocsCitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources?: DocCitationSource[];
  activeStyle?: CitationStyle;
  onInsertInTextCitation: (inTextStr: string) => void;
  onInsertBibliography: (bibHtml: string) => void;
  onSaveSources: (sources: DocCitationSource[], style: CitationStyle) => void;
}

export function MasterDocsCitationModal({
  isOpen,
  onClose,
  sources = [],
  activeStyle = 'APA',
  onInsertInTextCitation,
  onInsertBibliography,
  onSaveSources,
}: MasterDocsCitationModalProps) {
  const [sourcesList, setSourcesList] = useState<DocCitationSource[]>(sources);
  const [citationStyle, setCitationStyle] = useState<CitationStyle>(activeStyle);

  // New source form state
  const [isAdding, setIsAdding] = useState(false);
  const [sourceType, setSourceType] = useState<DocCitationSource['type']>('journal');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [publisherOrJournal, setPublisherOrJournal] = useState('');
  const [volume, setVolume] = useState('');
  const [issue, setIssue] = useState('');
  const [pages, setPages] = useState('');
  const [doi, setDoi] = useState('');
  const [url, setUrl] = useState('');

  if (!isOpen) return null;

  const handleAddSource = () => {
    if (!title.trim()) {
      toast.error('Source title is required');
      return;
    }

    const authorArray = authors
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const newSource: DocCitationSource = {
      id: 'cit-' + Date.now(),
      type: sourceType,
      title: title.trim(),
      authors: authorArray.length > 0 ? authorArray : ['Anonymous'],
      year: parseInt(year, 10) || new Date().getFullYear(),
      publisherOrJournal: publisherOrJournal.trim() || undefined,
      volume: volume.trim() || undefined,
      issue: issue.trim() || undefined,
      pages: pages.trim() || undefined,
      doi: doi.trim() || undefined,
      url: url.trim() || undefined,
    };

    const updated = [...sourcesList, newSource];
    setSourcesList(updated);
    onSaveSources(updated, citationStyle);

    // Reset Form
    setTitle('');
    setAuthors('');
    setPublisherOrJournal('');
    setVolume('');
    setIssue('');
    setPages('');
    setDoi('');
    setUrl('');
    setIsAdding(false);
    toast.success('Citation source added');
  };

  const handleDeleteSource = (id: string) => {
    const updated = sourcesList.filter((s) => s.id !== id);
    setSourcesList(updated);
    onSaveSources(updated, citationStyle);
    toast.info('Citation source removed');
  };

  const handleInsertCitation = (source: DocCitationSource, idx: number) => {
    const inText = DocCitationService.formatInText(source, idx, citationStyle);
    onInsertInTextCitation(inText);
    toast.success(`Inserted ${inText}`);
    onClose();
  };

  const handleGenerateBib = () => {
    const bibHtml = DocCitationService.generateBibliographyHtml(sourcesList, citationStyle);
    onInsertBibliography(bibHtml);
    toast.success('Bibliography generated & inserted');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Quote className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Citation & Bibliography Manager</h2>
              <p className="text-xs text-muted-foreground">Manage references, APA/MLA/IEEE styles, and auto-generated bibliographies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Style Selector Toolbar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Citation Style:</span>
              {(['APA', 'MLA', 'Chicago', 'IEEE'] as CitationStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setCitationStyle(style);
                    onSaveSources(sourcesList, style);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    citationStyle === style
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAdding(!isAdding)}
              className="rounded-xl text-xs gap-1.5 h-8 font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              {isAdding ? 'Cancel' : 'Add Source'}
            </Button>
          </div>

          {/* New Source Form */}
          {isAdding && (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4 animate-in fade-in">
              <div className="text-xs font-bold text-foreground">Add New Citation Source</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-foreground block mb-1">Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as any)}
                    className="w-full text-xs rounded-lg bg-background border border-border px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="journal">Journal Article</option>
                    <option value="book">Book</option>
                    <option value="website">Website / Online Resource</option>
                    <option value="article">Magazine / Newspaper Article</option>
                    <option value="conference">Conference Proceeding</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground block mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full text-xs rounded-lg bg-background border border-border px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-foreground block mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Attention Is All You Need"
                    className="w-full text-xs rounded-lg bg-background border border-border px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-foreground block mb-1">
                    Authors (comma separated)
                  </label>
                  <input
                    type="text"
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    placeholder="e.g. Vaswani, A., Shazeer, N., Parmar, N."
                    className="w-full text-xs rounded-lg bg-background border border-border px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground block mb-1">
                    Journal / Publisher
                  </label>
                  <input
                    type="text"
                    value={publisherOrJournal}
                    onChange={(e) => setPublisherOrJournal(e.target.value)}
                    placeholder="e.g. Advances in Neural Information Processing Systems"
                    className="w-full text-xs rounded-lg bg-background border border-border px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground block mb-1">DOI / URL</label>
                  <input
                    type="text"
                    value={doi || url}
                    onChange={(e) => {
                      if (e.target.value.startsWith('10.')) setDoi(e.target.value);
                      else setUrl(e.target.value);
                    }}
                    placeholder="e.g. 10.1145/3318464.3389700"
                    className="w-full text-xs rounded-lg bg-background border border-border px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setIsAdding(false)} className="rounded-lg text-xs">
                  Cancel
                </Button>
                <Button size="sm" variant="gradient" onClick={handleAddSource} className="rounded-lg text-xs font-bold">
                  Save Source
                </Button>
              </div>
            </div>
          )}

          {/* Sources List */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Configured Sources ({sourcesList.length})</span>
            </div>

            {sourcesList.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                No citation sources added yet. Click &quot;Add Source&quot; to build your bibliography.
              </div>
            ) : (
              sourcesList.map((source, idx) => (
                <div
                  key={source.id}
                  className="p-3.5 rounded-xl border border-border bg-card hover:bg-accent/30 transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">
                        {source.type}
                      </Badge>
                      <span className="text-xs font-bold text-foreground truncate">{source.title}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {source.authors.join(', ')} ({source.year}) &bull; {source.publisherOrJournal || 'N/A'}
                    </div>
                    <div className="text-[11px] font-mono text-primary/80 pt-0.5">
                      Preview: {DocCitationService.formatInText(source, idx, citationStyle)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInsertCitation(source, idx)}
                      className="rounded-lg text-xs h-7 px-2.5 font-semibold"
                    >
                      Insert In-Text
                    </Button>
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                      title="Delete source"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <span className="text-xs text-muted-foreground">{sourcesList.length} sources indexed in document</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
              Close
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleGenerateBib}
              disabled={sourcesList.length === 0}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Generate Bibliography Section
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
