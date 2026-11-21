/**
 * src/features/ai/components/MasterAi2PromptTemplatesModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — PROMPT TEMPLATE LIBRARY & BUILDER
 * Searchable, category-based prompt library with 1-click insertion,
 * variable substitution, and custom template creation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookTemplate,
  Star,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Code2,
  PenTool,
  Brain,
  Lightbulb,
  Workflow,
  Copy,
} from 'lucide-react';
import { useAiChatStore } from '../stores/aiChatStore';
import { PromptTemplate } from '../types/aiTypes';
import { toast } from 'sonner';

interface PromptTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (content: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: BookTemplate },
  { id: 'coding', label: 'Coding & Dev', icon: Code2 },
  { id: 'writing', label: 'Writing & Content', icon: PenTool },
  { id: 'analysis', label: 'Analysis & Data', icon: Brain },
  { id: 'brainstorming', label: 'Brainstorming', icon: Lightbulb },
  { id: 'productivity', label: 'Productivity', icon: Workflow },
  { id: 'custom', label: 'My Custom', icon: Sparkles },
] as const;

export function MasterAi2PromptTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: PromptTemplatesModalProps) {
  const promptTemplates = useAiChatStore((s) => s.promptTemplates);
  const addPromptTemplate = useAiChatStore((s) => s.addPromptTemplate);
  const deletePromptTemplate = useAiChatStore((s) => s.deletePromptTemplate);
  const toggleFavoriteTemplate = useAiChatStore((s) => s.toggleFavoriteTemplate);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // New Template Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<PromptTemplate['category']>('custom');
  const [newContent, setNewContent] = useState('');

  const filteredTemplates = useMemo(() => {
    return promptTemplates.filter((t) => {
      const matchesCat =
        selectedCategory === 'all' ||
        (selectedCategory === 'favorites' ? t.isFavorite : t.category === selectedCategory);
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description ? t.description.toLowerCase().includes(q) : false) ||
        t.prompt.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [promptTemplates, selectedCategory, search]);

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and template content are required.');
      return;
    }

    addPromptTemplate({
      title: newTitle.trim(),
      description: newDescription.trim() || 'Custom prompt template',
      category: newCategory,
      prompt: newContent.trim(),
    });

    setNewTitle('');
    setNewDescription('');
    setNewContent('');
    setIsCreating(false);
    toast.success('Prompt template saved to your library!');
  };

  const handleApply = (tpl: PromptTemplate) => {
    onSelectTemplate(tpl.prompt);
    toast.success(`Applied template: "${tpl.title}"`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <BookTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Prompt Template Library
                <span className="text-xs font-mono font-normal text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-full">
                  {promptTemplates.length} templates
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                1-click insert curated and custom prompts designed for expert-tier outputs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors cursor-pointer shadow-sm shadow-orange-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'View Library' : 'Create Template'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isCreating ? (
          /* Create Template Form */
          <form onSubmit={handleCreateTemplate} className="p-6 space-y-4 overflow-y-auto">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Create New Prompt Template</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">Template Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Senior TypeScript Reviewer"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="coding">Coding & Dev</option>
                  <option value="writing">Writing & Content</option>
                  <option value="analysis">Analysis & Data</option>
                  <option value="brainstorming">Brainstorming</option>
                  <option value="productivity">Productivity</option>
                  <option value="custom">My Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1">Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief summary of what this prompt accomplishes..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1">
                Prompt Content *
                <span className="text-[10px] text-zinc-500 ml-2">Tip: Use brackets like [language] for variables</span>
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Act as a staff software architect. Review the following code for..."
                rows={6}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500 resize-none font-mono"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
              >
                Save Template
              </button>
            </div>
          </form>
        ) : (
          /* Template Explorer */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search and Category Strip */}
            <div className="p-4 border-b border-white/[0.08] bg-zinc-900/30 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates by keyword, language, or task..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none placeholder-zinc-500 focus:border-orange-500/50"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 space-y-2">
                  <BookTemplate className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-sm font-medium">No prompt templates match your criteria.</p>
                  <p className="text-xs">Create a new template using the button above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-orange-500/30 transition-all duration-200 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                            {tpl.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleFavoriteTemplate(tpl.id)}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                tpl.isFavorite
                                  ? 'text-amber-400 bg-amber-400/10'
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                              title={tpl.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Star className={`w-3.5 h-3.5 ${tpl.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                            {tpl.category === 'custom' && (
                              <button
                                type="button"
                                onClick={() => deletePromptTemplate(tpl.id)}
                                className="p-1 rounded-lg text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                                title="Delete template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                          {tpl.description}
                        </p>

                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.04] text-[11px] font-mono text-zinc-300 line-clamp-3">
                          {tpl.prompt}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-white/[0.04] flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400/80 bg-orange-500/10 px-2 py-0.5 rounded-md">
                          {tpl.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(tpl.prompt);
                              toast.success('Prompt copied to clipboard!');
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Copy prompt text"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApply(tpl)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <span>Use Template</span>
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
