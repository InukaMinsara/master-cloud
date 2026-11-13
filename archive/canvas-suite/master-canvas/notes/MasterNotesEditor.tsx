import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Trash2,
  Pin,
  Tag,
  CheckCircle2,
  Clock,
  Search,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { CanvasNotesData, NoteSection, NotePage, NoteChecklistItem } from '@/types/canvas';
import { CanvasService } from '@/services/canvasService';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';

interface MasterNotesEditorProps {
  initialFile?: FileItem | null;
  initialData?: CanvasNotesData | null;
  onSave?: (data: CanvasNotesData) => Promise<void>;
}

export function MasterNotesEditor({ initialFile, initialData, onSave }: MasterNotesEditorProps) {
  const navigate = useNavigate();
  const [notesData, setNotesData] = useState<CanvasNotesData>(() => initialData || CanvasService.getDefaultNotesData());
  const [activeSectionId, setActiveSectionId] = useState<string>(() => notesData.sections[0]?.id || '');
  const [activePageId, setActivePageId] = useState<string>(() => notesData.sections[0]?.pages[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (initialData) {
      setNotesData(initialData);
      if (initialData.sections[0]) {
        setActiveSectionId(initialData.sections[0].id);
        if (initialData.sections[0].pages[0]) {
          setActivePageId(initialData.sections[0].pages[0].id);
        }
      }
    }
  }, [initialData]);

  // Debounced auto-save
  const triggerAutoSave = (updated: CanvasNotesData) => {
    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (onSave) {
        setSaveStatus('saving');
        try {
          await onSave(updated);
          setSaveStatus('saved');
        } catch (err) {
          setSaveStatus('unsaved');
          toast.error('Failed to save notebook');
        }
      }
    }, 1500);
  };

  const handleTitleChange = (newTitle: string) => {
    const updated = { ...notesData, title: newTitle };
    setNotesData(updated);
    triggerAutoSave(updated);
  };

  const activeSection = notesData.sections.find(s => s.id === activeSectionId) || notesData.sections[0];
  const activePage = activeSection?.pages.find(p => p.id === activePageId) || activeSection?.pages[0];

  // Section CRUD
  const addSection = () => {
    const name = prompt('Enter new section name:', 'New Section');
    if (!name || !name.trim()) return;
    const newSec: NoteSection = {
      id: 'sec-' + Date.now(),
      name: name.trim(),
      color: '#3b82f6',
      pages: [
        {
          id: 'pg-' + Date.now(),
          title: 'Untitled Page',
          content: '',
          color: '#3b82f6',
          isPinned: false,
          tags: [],
          checklist: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
    const updatedSections = [...notesData.sections, newSec];
    const updated = { ...notesData, sections: updatedSections };
    setNotesData(updated);
    setActiveSectionId(newSec.id);
    setActivePageId(newSec.pages[0].id);
    triggerAutoSave(updated);
    toast.success('Section created');
  };

  // Page CRUD
  const addPage = () => {
    if (!activeSection) return;
    const newPage: NotePage = {
      id: 'pg-' + Date.now(),
      title: 'Untitled Page',
      content: '',
      color: activeSection.color,
      isPinned: false,
      tags: [],
      checklist: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedSections = notesData.sections.map(s => {
      if (s.id === activeSection.id) {
        return { ...s, pages: [newPage, ...s.pages] };
      }
      return s;
    });
    const updated = { ...notesData, sections: updatedSections };
    setNotesData(updated);
    setActivePageId(newPage.id);
    triggerAutoSave(updated);
  };

  const updateActivePage = (updates: Partial<NotePage>) => {
    if (!activeSection || !activePage) return;
    const updatedSections = notesData.sections.map(s => {
      if (s.id === activeSection.id) {
        const pages = s.pages.map(p => p.id === activePage.id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
        return { ...s, pages };
      }
      return s;
    });
    const updated = { ...notesData, sections: updatedSections };
    setNotesData(updated);
    triggerAutoSave(updated);
  };

  const deleteActivePage = () => {
    if (!activeSection || activeSection.pages.length <= 1) {
      toast.warning('A section must have at least one page.');
      return;
    }
    const updatedPages = activeSection.pages.filter(p => p.id !== activePage.id);
    const updatedSections = notesData.sections.map(s => s.id === activeSection.id ? { ...s, pages: updatedPages } : s);
    const updated = { ...notesData, sections: updatedSections };
    setNotesData(updated);
    setActivePageId(updatedPages[0].id);
    triggerAutoSave(updated);
    toast.success('Page deleted');
  };

  // Checklist Actions
  const addChecklistItem = () => {
    if (!newChecklistText.trim() || !activePage) return;
    const item: NoteChecklistItem = {
      id: 'chk-' + Date.now(),
      text: newChecklistText.trim(),
      completed: false,
    };
    updateActivePage({ checklist: [...activePage.checklist, item] });
    setNewChecklistText('');
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!activePage) return;
    const updatedList = activePage.checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateActivePage({ checklist: updatedList });
  };

  const removeChecklistItem = (itemId: string) => {
    if (!activePage) return;
    const updatedList = activePage.checklist.filter(item => item.id !== itemId);
    updateActivePage({ checklist: updatedList });
  };

  // Filtered pages
  const filteredPages = (activeSection?.pages || []).filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background text-foreground select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-border/60 px-4 flex items-center justify-between bg-card/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/canvas')}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Master Canvas"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-500">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <input
                type="text"
                value={notesData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="font-bold text-sm bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none px-1 py-0.5 max-w-xs transition-colors"
                placeholder="Master Notebook"
              />
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Clock className="h-3 w-3 animate-spin" /> Saving to Master Cloud...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle2 className="h-3 w-3" /> All changes saved in Master Cloud
                  </span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="flex items-center gap-1 text-muted-foreground">Unsaved edits</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Column OneNote Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Sections */}
        <div className="w-48 border-r border-border/60 bg-card/20 flex flex-col shrink-0">
          <div className="p-3 border-b border-border/50 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Sections
            </span>
            <button
              onClick={addSection}
              className="p-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              title="Add Section"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {notesData.sections.map(s => {
              const isSelected = activeSectionId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSectionId(s.id);
                    if (s.pages[0]) setActivePageId(s.pages[0].id);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  <span className="text-[10px] opacity-60">{s.pages.length}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Pages list */}
        <div className="w-60 border-r border-border/60 bg-card/40 flex flex-col shrink-0">
          <div className="p-3 border-b border-border/50 flex items-center justify-between">
            <div className="relative flex-1 mr-2">
              <Search className="h-3 w-3 absolute left-2.5 top-2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages..."
                className="w-full bg-background border border-border/60 rounded-lg pl-7 pr-2 py-1 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={addPage}
              className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-colors"
              title="Add Page"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredPages.map(p => {
              const isSelected = activePageId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePageId(p.id)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                      : 'border-border/50 hover:border-border hover:bg-accent/40'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-foreground truncate mb-1">
                    <span className="truncate">{p.title || 'Untitled'}</span>
                    {p.isPinned && <Pin className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.content ? p.content.slice(0, 50) : 'No extra text...'}
                  </p>
                  {p.checklist.length > 0 && (
                    <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                      <span>✓ {p.checklist.filter(c => c.completed).length}/{p.checklist.length} tasks</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Active Page Content Editor */}
        {activePage ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col bg-secondary/10">
            <div className="max-w-3xl w-full mx-auto space-y-6">
              {/* Page Title & Controls */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <input
                  type="text"
                  value={activePage.title}
                  onChange={(e) => updateActivePage({ title: e.target.value })}
                  className="text-2xl sm:text-3xl font-extrabold bg-transparent border-none outline-none flex-1 text-foreground"
                  placeholder="Page Title..."
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateActivePage({ isPinned: !activePage.isPinned })}
                    className={`p-1.5 rounded-lg border border-border/70 hover:bg-accent transition-colors ${
                      activePage.isPinned ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'
                    }`}
                    title={activePage.isPinned ? 'Unpin Note' : 'Pin Note'}
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={deleteActivePage}
                    className="p-1.5 rounded-lg border border-border/70 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete Page"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Note Content Textarea */}
              <textarea
                value={activePage.content}
                onChange={(e) => updateActivePage({ content: e.target.value })}
                rows={8}
                className="w-full bg-transparent resize-none border-none outline-none font-sans text-sm sm:text-base leading-relaxed text-foreground placeholder:text-muted-foreground/40"
                placeholder="Write your note thoughts, ideas, or meeting notes here..."
              />

              {/* Checklist Section */}
              <div className="border-t border-border/60 pt-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4 text-indigo-500" />
                  <span>Tasks & Checklist</span>
                </h3>

                <div className="space-y-2">
                  {activePage.checklist.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 group hover:border-border transition-colors text-xs"
                    >
                      <button
                        onClick={() => toggleChecklistItem(item.id)}
                        className="flex items-center gap-2.5 flex-1 text-left"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                          {item.text}
                        </span>
                      </button>

                      <button
                        onClick={() => removeChecklistItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add task input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                    placeholder="Add a new checklist item (press Enter)..."
                    className="flex-1 bg-card border border-border/70 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={addChecklistItem}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select or create a page to view notes
          </div>
        )}
      </div>
    </div>
  );
}
