import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Cloud,
  CheckCircle2,
  Clock,
  Share2,
  Sparkles,
  Users,
  Search,
  BookOpen,
  MessageSquare,
  History,
  Lock,
} from 'lucide-react';
import { CanvasDocData, DocComment } from '@/types/canvas';
import { CanvasService } from '@/services/canvasService';
import { FileItem } from '@/types/file';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Subcomponents
import { MasterDocsToolbar, RibbonTab } from './MasterDocsToolbar';
import { MasterDocsPageCanvas } from './MasterDocsPageCanvas';
import { MasterDocsRuler } from './MasterDocsRuler';
import { MasterDocsOutline } from './MasterDocsOutline';
import { MasterDocsComments } from './MasterDocsComments';
import { MasterDocsFindReplace } from './MasterDocsFindReplace';
import { MasterDocsEquationModal } from './MasterDocsEquationModal';
import { MasterDocsTemplateModal } from './MasterDocsTemplateModal';
import { MasterDocsWordCountModal } from './MasterDocsWordCountModal';
import { MasterDocsExportService } from './MasterDocsExport';
import { DocumentTemplate } from './MasterDocsTemplates';

interface MasterDocsEditorProps {
  initialFile?: FileItem | null;
  initialData?: CanvasDocData | null;
  onSave?: (data: CanvasDocData) => Promise<void>;
}

export function MasterDocsEditor({ initialFile, initialData, onSave }: MasterDocsEditorProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setShareModalItem, setVersionHistoryModalFile } = useUIStore();

  const [docData, setDocData] = useState<CanvasDocData>(() => initialData || CanvasService.getDefaultDocData());
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>('home');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isStarred, setIsStarred] = useState(false);

  // View States
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showRuler, setShowRuler] = useState(true);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDocDarkMode, setIsDocDarkMode] = useState(false);

  // Modals
  const [isEquationModalOpen, setIsEquationModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isWordCountModalOpen, setIsWordCountModalOpen] = useState(false);

  const [activeSelectionText, setActiveSelectionText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Sync initialData
  useEffect(() => {
    if (initialData) {
      setDocData(initialData);
      if (editorRef.current && editorRef.current.innerHTML !== initialData.content) {
        editorRef.current.innerHTML = initialData.content;
      }
    }
  }, [initialData]);

  // Debounced auto-save to Master Cloud
  const triggerAutoSave = (updated: CanvasDocData) => {
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
          toast.error('Failed to autosave to Master Cloud');
        }
      }
    }, 1200);
  };

  const handleTitleChange = (newTitle: string) => {
    const updated = { ...docData, title: newTitle };
    setDocData(updated);
    triggerAutoSave(updated);
  };

  const handleContentChange = (newHtml: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = newHtml;
    const text = temp.innerText || temp.textContent || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    const updated: CanvasDocData = {
      ...docData,
      content: newHtml,
      wordCount: words,
      charCount: chars,
      lastSavedAt: new Date().toISOString(),
    };
    setDocData(updated);
    triggerAutoSave(updated);
  };

  // Keyboard Shortcuts (Ctrl+S, Ctrl+P, Ctrl+F, Ctrl+B, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          if (onSave) {
            setSaveStatus('saving');
            onSave(docData).then(() => {
              setSaveStatus('saved');
              toast.success('Document saved to Master Cloud');
            });
          }
        } else if (e.key === 'p') {
          e.preventDefault();
          MasterDocsExportService.printDocument(docData.title, docData.content, docData.pageLayout);
        } else if (e.key === 'f' || e.key === 'h') {
          e.preventDefault();
          setIsFindReplaceOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docData, onSave]);

  // Execute formatting commands on rich editor
  const handleExecCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleContentChange(editorRef.current.innerHTML);
    }
  };

  // Insert Table
  const handleInsertTable = (rows: number, cols: number) => {
    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tbody>';
    for (let r = 0; r < rows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        tableHtml += '<td style="border: 1px solid #cbd5e1; padding: 8px 12px;">&nbsp;</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p></p>';
    document.execCommand('insertHTML', false, tableHtml);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  // Insert Image
  const handleInsertImage = (url: string) => {
    const imgHtml = `<img src="${url}" alt="Inserted image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0;" /><p></p>`;
    document.execCommand('insertHTML', false, imgHtml);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  // Insert Hyperlink
  const handleInsertLink = (url: string, text?: string) => {
    if (text) {
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${text}</a>`;
      document.execCommand('insertHTML', false, linkHtml);
    } else {
      document.execCommand('createLink', false, url);
    }
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  // Insert Table of Contents
  const handleInsertTOC = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = docData.content;
    const headings = tempDiv.querySelectorAll('h1, h2, h3');

    let tocHtml = '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 16px 0;">';
    tocHtml += '<h3 style="margin-top: 0; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Table of Contents</h3><ul style="list-style-type: none; padding-left: 0;">';

    headings.forEach((h) => {
      const text = h.textContent || '';
      const level = parseInt(h.tagName.substring(1), 10);
      const indent = (level - 1) * 20;
      tocHtml += `<li style="padding-left: ${indent}px; margin: 6px 0;"><a href="#" style="color: #2563eb; text-decoration: none;">&bull; ${text}</a></li>`;
    });

    tocHtml += '</ul></div><p></p>';
    document.execCommand('insertHTML', false, tocHtml);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
    toast.success('Table of Contents generated');
  };

  // Insert Footnote
  const handleInsertFootnote = () => {
    const fnNumber = (docData.footnotes?.length || 0) + 1;
    const fnPrompt = prompt(`Enter footnote #${fnNumber} text:`);
    if (!fnPrompt) return;

    const fnRefHtml = `<sup>[${fnNumber}]</sup>`;
    document.execCommand('insertHTML', false, fnRefHtml);

    const updatedFootnotes = [...(docData.footnotes || []), { id: `fn-${Date.now()}`, number: fnNumber, text: fnPrompt }];
    const updated = { ...docData, footnotes: updatedFootnotes };
    setDocData(updated);
    triggerAutoSave(updated);
    toast.success(`Footnote #${fnNumber} added`);
  };

  // Insert Callout Note Box
  const handleInsertCallout = () => {
    const calloutHtml = `
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; color: #1e40af;">
        <strong>Note:</strong> Enter important callout note here.
      </div>
      <p></p>
    `;
    document.execCommand('insertHTML', false, calloutHtml);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  // Insert Equation
  const handleInsertEquationLatex = (latex: string) => {
    const eqHtml = `
      <span style="font-family: serif; font-style: italic; font-size: 1.1em; background-color: #f1f5f9; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0; display: inline-block; margin: 2px 4px;">
        ${latex}
      </span>
    `;
    document.execCommand('insertHTML', false, eqHtml);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
    toast.success('Equation inserted');
  };

  // Select Template
  const handleSelectTemplate = (template: DocumentTemplate) => {
    const updated: CanvasDocData = {
      ...docData,
      title: template.id !== 'blank' ? template.name : docData.title,
      content: template.content,
      lastSavedAt: new Date().toISOString(),
    };
    setDocData(updated);
    if (editorRef.current) editorRef.current.innerHTML = template.content;
    triggerAutoSave(updated);
    toast.success(`Applied "${template.name}" template`);
  };

  // Update Page Layout
  const handleUpdateLayout = (updates: Partial<NonNullable<CanvasDocData['pageLayout']>>) => {
    const currentLayout = docData.pageLayout || {
      size: 'A4',
      orientation: 'portrait',
      margins: 'normal',
    };
    const updated: CanvasDocData = {
      ...docData,
      pageLayout: { ...currentLayout, ...updates },
    };
    setDocData(updated);
    triggerAutoSave(updated);
    toast.success('Page layout updated');
  };

  // Comments CRUD
  const handleAddComment = (text: string, selected?: string) => {
    const newComment: DocComment = {
      id: 'comm-' + Date.now(),
      author: user?.display_name || user?.email?.split('@')[0] || 'Author',
      text,
      selectedText: selected,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    const updated = { ...docData, comments: [newComment, ...(docData.comments || [])] };
    setDocData(updated);
    triggerAutoSave(updated);
    toast.success('Comment posted');
  };

  const handleReplyComment = (commentId: string, text: string) => {
    const updatedComments = (docData.comments || []).map((c) => {
      if (c.id === commentId) {
        const reply = {
          id: 'rep-' + Date.now(),
          author: user?.display_name || user?.email?.split('@')[0] || 'User',
          text,
          createdAt: new Date().toISOString(),
        };
        return { ...c, replies: [...(c.replies || []), reply] };
      }
      return c;
    });
    const updated = { ...docData, comments: updatedComments };
    setDocData(updated);
    triggerAutoSave(updated);
  };

  const handleResolveComment = (commentId: string) => {
    const updatedComments = (docData.comments || []).map((c) =>
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    );
    const updated = { ...docData, comments: updatedComments };
    setDocData(updated);
    triggerAutoSave(updated);
  };

  const handleDeleteComment = (commentId: string) => {
    const updatedComments = (docData.comments || []).filter((c) => c.id !== commentId);
    const updated = { ...docData, comments: updatedComments };
    setDocData(updated);
    triggerAutoSave(updated);
    toast.info('Comment removed');
  };

  // Find and Replace Handlers
  const handleFind = (query: string, matchCase: boolean) => {
    if (!editorRef.current || !query) return { count: 0, activeIndex: 0 };
    const text = editorRef.current.innerText || '';
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    const matches = text.match(regex);
    return { count: matches ? matches.length : 0, activeIndex: 0 };
  };

  const handleReplace = (replacement: string) => {
    document.execCommand('insertText', false, replacement);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  const handleReplaceAll = (query: string, replacement: string, matchCase: boolean) => {
    if (!editorRef.current || !query) return;
    const currentHtml = editorRef.current.innerHTML;
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    const replaced = currentHtml.replace(regex, replacement);
    editorRef.current.innerHTML = replaced;
    handleContentChange(replaced);
    toast.success('All instances replaced');
  };

  // Scroll to heading from outline
  const handleSelectHeading = (headingText: string) => {
    if (!editorRef.current) return;
    const headings = editorRef.current.querySelectorAll('h1, h2, h3');
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].textContent?.trim() === headingText.trim()) {
        headings[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        headings[i].classList.add('bg-primary/20');
        setTimeout(() => headings[i].classList.remove('bg-primary/20'), 1500);
        break;
      }
    }
  };

  return (
    <div className={`flex flex-col h-screen w-full bg-background text-foreground overflow-hidden select-none ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* ── 1. Top Document Header ──────────────────────────────────────── */}
      <header className="flex h-14 items-center justify-between px-4 border-b border-border/80 bg-card/90 backdrop-blur-md z-30 shrink-0">
        {/* Left: Back + Title + Save Indicator */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/canvas')}
            className="p-1.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Back to Master Canvas"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={docData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Document"
                className="font-bold text-sm bg-transparent hover:bg-accent/40 focus:bg-background focus:ring-1 focus:ring-primary rounded-lg px-2 py-0.5 max-w-xs truncate focus:outline-none"
              />
              <button
                onClick={() => setIsStarred(!isStarred)}
                className={`p-1 rounded-lg transition-colors ${
                  isStarred ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'
                }`}
                title="Star document"
              >
                <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Save Telemetry Indicator */}
            <div className="flex items-center gap-1.5 px-2 text-[10px] text-muted-foreground">
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span>Saved to Master Cloud</span>
                </>
              )}
              {saveStatus === 'saving' && (
                <>
                  <Clock className="h-3 w-3 text-primary animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'unsaved' && (
                <>
                  <Cloud className="h-3 w-3 text-amber-500" />
                  <span>Unsaved changes</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions (Version History, Share, Collaboration) */}
        <div className="flex items-center gap-2">
          {/* Active Collaborators Presence */}
          <div className="flex items-center -space-x-1.5 mr-2">
            <div
              className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center border-2 border-card shadow-sm"
              title={`${user?.display_name || 'You'} (Active Editor)`}
            >
              {(user?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div
              className="h-7 w-7 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center border-2 border-card shadow-sm"
              title="Master Cloud Real-Time Sync Active"
            >
              <Cloud className="h-3.5 w-3.5" />
            </div>
          </div>

          {initialFile && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setVersionHistoryModalFile(initialFile)}
              className="rounded-xl text-xs h-8 gap-1.5 font-semibold"
            >
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              History
            </Button>
          )}

          <Button
            size="sm"
            variant="gradient"
            onClick={() => {
              if (initialFile) setShareModalItem({ item: initialFile, isFolder: false });
              else toast.info('Save document to enable link sharing');
            }}
            className="rounded-xl text-xs h-8 gap-1.5 font-bold shadow-md shadow-primary/20"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </header>

      {/* ── 2. Ribbon Toolbar ───────────────────────────────────────────── */}
      <MasterDocsToolbar
        activeTab={activeRibbonTab}
        setActiveTab={setActiveRibbonTab}
        pageLayout={docData.pageLayout}
        onUpdateLayout={handleUpdateLayout}
        onExecCommand={handleExecCommand}
        onInsertTable={handleInsertTable}
        onInsertImage={handleInsertImage}
        onInsertLink={handleInsertLink}
        onInsertTOC={handleInsertTOC}
        onInsertFootnote={handleInsertFootnote}
        onInsertEquation={() => setIsEquationModalOpen(true)}
        onInsertCallout={handleInsertCallout}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenWordCount={() => setIsWordCountModalOpen(true)}
        onToggleOutline={() => setIsOutlineOpen(!isOutlineOpen)}
        onToggleComments={() => setIsCommentsOpen(!isCommentsOpen)}
        onToggleFindReplace={() => setIsFindReplaceOpen(!isFindReplaceOpen)}
        onSave={() => {
          if (onSave) {
            setSaveStatus('saving');
            onSave(docData).then(() => {
              setSaveStatus('saved');
              toast.success('Document saved');
            });
          }
        }}
        onPrint={() => MasterDocsExportService.printDocument(docData.title, docData.content, docData.pageLayout)}
        onExport={(fmt) => {
          if (fmt === 'docx') MasterDocsExportService.exportToDocx(docData.title, docData.content);
          else if (fmt === 'pdf') MasterDocsExportService.printDocument(docData.title, docData.content, docData.pageLayout);
          else if (fmt === 'html') MasterDocsExportService.exportToHtml(docData.title, docData.content);
          else if (fmt === 'txt') MasterDocsExportService.exportToTxt(docData.title, docData.content);
          else if (fmt === 'md') MasterDocsExportService.exportToMarkdown(docData.title, docData.content);
        }}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        showRuler={showRuler}
        setShowRuler={setShowRuler}
        isOutlineOpen={isOutlineOpen}
        isCommentsOpen={isCommentsOpen}
        isFullscreen={isFullscreen}
        setIsFullscreen={setIsFullscreen}
        isDocDarkMode={isDocDarkMode}
        setIsDocDarkMode={setIsDocDarkMode}
      />

      {/* ── 3. Horizontal Document Ruler (Optional) ─────────────────────── */}
      {showRuler && (
        <MasterDocsRuler
          pageWidth={docData.pageLayout?.size === 'Letter' ? 816 : 794}
          leftMargin={docData.pageLayout?.margins === 'narrow' ? 48 : 96}
          rightMargin={docData.pageLayout?.margins === 'narrow' ? 48 : 96}
          zoomLevel={zoomLevel}
        />
      )}

      {/* ── 4. Main Work Area (Outline + Page Canvas + Comments) ─────────── */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Left: Outline Sidebar */}
        {isOutlineOpen && (
          <aside className="w-64 border-r border-border/80 bg-card/70 backdrop-blur-md flex flex-col shrink-0 z-20">
            <MasterDocsOutline contentHtml={docData.content} onSelectHeading={handleSelectHeading} />
          </aside>
        )}

        {/* Center: Real Page-Based Canvas */}
        <MasterDocsPageCanvas
          contentHtml={docData.content}
          onChangeContent={handleContentChange}
          pageLayout={docData.pageLayout}
          zoomLevel={zoomLevel}
          isDocDarkMode={isDocDarkMode}
          onSelectionChange={setActiveSelectionText}
          editorRef={editorRef}
        />

        {/* Right: Comments Sidebar */}
        {isCommentsOpen && (
          <aside className="w-80 border-l border-border/80 bg-card/70 backdrop-blur-md flex flex-col shrink-0 z-20">
            <MasterDocsComments
              comments={docData.comments || []}
              selectedText={activeSelectionText}
              onAddComment={handleAddComment}
              onReplyComment={handleReplyComment}
              onResolveComment={handleResolveComment}
              onDeleteComment={handleDeleteComment}
            />
          </aside>
        )}

        {/* Floating Find & Replace Bar */}
        <MasterDocsFindReplace
          isOpen={isFindReplaceOpen}
          onClose={() => setIsFindReplaceOpen(false)}
          onFind={handleFind}
          onFindNext={() => toast.info('Highlighting next match')}
          onFindPrev={() => toast.info('Highlighting previous match')}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
        />
      </div>

      {/* ── 5. Bottom Status Bar ────────────────────────────────────────── */}
      <footer className="flex h-8 items-center justify-between px-4 border-t border-border/80 bg-card/90 text-[11px] text-muted-foreground z-30 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="font-medium text-foreground">Page 1 of 1</span>
          <button
            onClick={() => setIsWordCountModalOpen(true)}
            className="hover:text-primary transition-colors cursor-pointer font-medium"
          >
            {docData.wordCount.toLocaleString()} words &bull; {docData.charCount.toLocaleString()} characters
          </button>
          <span className="hidden sm:inline-block">English (United States)</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsWordCountModalOpen(true)}
            className="hover:underline font-semibold text-primary"
          >
            Reading Time: ~{Math.max(1, Math.ceil(docData.wordCount / 200))} min
          </button>
          <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
        </div>
      </footer>

      {/* ── 6. Modals ───────────────────────────────────────────────────── */}
      <MasterDocsEquationModal
        isOpen={isEquationModalOpen}
        onClose={() => setIsEquationModalOpen(false)}
        onInsertEquation={handleInsertEquationLatex}
      />

      <MasterDocsTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <MasterDocsWordCountModal
        isOpen={isWordCountModalOpen}
        onClose={() => setIsWordCountModalOpen(false)}
        contentHtml={docData.content}
      />
    </div>
  );
}
