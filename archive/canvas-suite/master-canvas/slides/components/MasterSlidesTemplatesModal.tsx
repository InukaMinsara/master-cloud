import React, { useMemo, useState } from 'react';
import { X, LayoutTemplate, Search } from 'lucide-react';
import { MasterPresentationData } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';
import { SlideTemplateCard } from './SlideTemplateCard';

interface MasterSlidesTemplatesModalProps {
  onClose: () => void;
  onApplyTemplate: (deck: MasterPresentationData) => void;
}

export function MasterSlidesTemplatesModal({
  onClose,
  onApplyTemplate,
}: MasterSlidesTemplatesModalProps) {
  const catalog = useMemo(() => SlideTemplates.getTemplatesCatalog(), []);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(catalog.map((t) => t.category)))],
    [catalog]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((t) => {
      const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [catalog, selectedCategory, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-5xl rounded-2xl border border-border bg-card shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Top PowerPoint Gallery Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#B7472A] text-white flex items-center justify-center shadow-sm">
              <LayoutTemplate className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">PowerPoint Template Gallery</h3>
              <p className="text-xs text-muted-foreground">
                {catalog.length} built-in widescreen PowerPoint decks ready to customize
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#B7472A]"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Clean Category Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-border/50 overflow-x-auto bg-background/40">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#B7472A] text-white'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Thumbnail Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No templates match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((tpl) => (
                <SlideTemplateCard
                  key={tpl.id}
                  template={tpl}
                  onSelect={(item) => {
                    onApplyTemplate(item.createDeck());
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
