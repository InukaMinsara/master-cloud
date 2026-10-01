import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Save,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
  Printer,
  FileCode,
  Copy,
} from 'lucide-react';
import { CanvasDocData } from '@/types/canvas';
import { CanvasService } from '@/services/canvasService';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';

interface MasterDocsEditorProps {
  initialFile?: FileItem | null;
  initialData?: CanvasDocData | null;
  onSave?: (data: CanvasDocData) => Promise<void>;
}

export function MasterDocsEditor({ initialFile, initialData, onSave }: MasterDocsEditorProps) {
  const navigate = useNavigate();
  const [docData, setDocData] = useState<CanvasDocData>(() => initialData || CanvasService.getDefaultDocData());
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Sync if initialData changes
  useEffect(() => {
    if (initialData) {
      setDocData(initialData);
    }
  }, [initialData]);

  // Real-time calculation of word and character count
  const updateCounts = (text: string) => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    return { words, chars };
  };

  // Debounced auto-save
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
          toast.error('Failed to save to Master Cloud');
        }
      }
    }, 1500);
  };

  const handleTitleChange = (newTitle: string) => {
    const updated = { ...docData, title: newTitle };
    setDocData(updated);
    triggerAutoSave(updated);
  };

  const handleContentChange = (newContent: string) => {
    const { words, chars } = updateCounts(newContent);
    const updated: CanvasDocData = {
      ...docData,
      content: newContent,
      wordCount: words,
      charCount: chars,
      lastSavedAt: new Date().toISOString(),
    };
    setDocData(updated);
    triggerAutoSave(updated);
  };

  // Formatting helpers for the markdown/rich editor
  const applyFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);

    const replacement = `${prefix}${selectedText || 'Text'}${suffix}`;
    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);

    handleContentChange(newContent);

    // Restore focus and cursor selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 50);
  };

  const handleManualSave = async () => {
    if (onSave) {
      setSaveStatus('saving');
      try {
        await onSave(docData);
        setSaveStatus('saved');
        toast.success('Document saved to Master Cloud');
      } catch (err) {
        setSaveStatus('unsaved');
        toast.error('Failed to save document');
      }
    }
  };

  const handleExport = (type: 'md' | 'txt' | 'print') => {
    setIsExportMenuOpen(false);
    if (type === 'md') {
      CanvasService.exportToLocalFile(`${docData.title}.md`, docData.content, 'text/markdown');
      toast.success('Exported as Markdown');
    } else if (type === 'txt') {
      CanvasService.exportToLocalFile(`${docData.title}.txt`, docData.content, 'text/plain');
      toast.success('Exported as Plain Text');
    } else if (type === 'print') {
      window.print();
    }
  };

  // Estimated reading time in minutes
  const readingTimeMinutes = Math.max(1, Math.ceil(docData.wordCount / 200));

  return (
    <div className="flex flex-col h-full bg-background text-foreground select-none">
      {/* Top Navbar */}
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
            <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <input
                type="text"
                value={docData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="font-bold text-sm bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none px-1 py-0.5 max-w-xs transition-colors"
                placeholder="Untitled Document"
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
                  <span className="flex items-center gap-1 text-muted-foreground">
                    Unsaved edits
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 hover:bg-accent text-xs font-semibold transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 text-xs">
                <button
                  onClick={() => handleExport('md')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left transition-colors"
                >
                  <FileCode className="h-3.5 w-3.5 text-blue-500" />
                  <span>Markdown (.md)</span>
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Plain Text (.txt)</span>
                </button>
                <button
                  onClick={() => handleExport('print')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent text-left transition-colors"
                >
                  <Printer className="h-3.5 w-3.5 text-amber-500" />
                  <span>Print / PDF Document</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Formatting Ribbon */}
      <div className="h-11 border-b border-border/50 px-4 flex items-center gap-1 bg-card/20 overflow-x-auto shrink-0">
        <button
          onClick={() => applyFormatting('**', '**')}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => applyFormatting('*', '*')}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => applyFormatting('~~', '~~')}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-border/60 mx-1" />

        <button
          onClick={() => applyFormatting('# ')}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Heading 1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => applyFormatting('## ')}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => applyFormatting('### ')}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-border/60 mx-1" />

        <button
          onClick={() => applyFormatting('- ')}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => applyFormatting('1. ')}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => applyFormatting('> ')}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => applyFormatting('```\n', '\n```')}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Code Block"
        >
          <Code className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-border/60 mx-1" />

        <button
          onClick={() => applyFormatting('\n| Column 1 | Column 2 |\n|---|---|\n| Cell 1 | Cell 2 |\n')}
          className="px-2 py-1 rounded-md hover:bg-accent text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          + Table
        </button>
        <button
          onClick={() => applyFormatting('- [ ] ')}
          className="px-2 py-1 rounded-md hover:bg-accent text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          + Checklist
        </button>
      </div>

      {/* Editor Main Canvas Area */}
      <div className="flex-1 overflow-y-auto bg-secondary/15 p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-4xl bg-card border border-border/70 rounded-2xl shadow-xl flex flex-col min-h-[800px] p-8 sm:p-12">
          <textarea
            ref={textareaRef}
            value={docData.content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full flex-1 bg-transparent resize-none border-none outline-none font-sans text-sm sm:text-base leading-relaxed text-foreground placeholder:text-muted-foreground/50 select-text"
            placeholder="Type your document content here or use markdown formatting..."
            autoFocus
          />
        </div>
      </div>

      {/* Document Footer Analytics */}
      <footer className="h-8 border-t border-border/50 px-4 flex items-center justify-between text-[11px] text-muted-foreground bg-card/30 shrink-0">
        <div className="flex items-center gap-4">
          <span>{docData.wordCount.toLocaleString()} words</span>
          <span>{docData.charCount.toLocaleString()} characters</span>
          <span>~{readingTimeMinutes} min read</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Master Docs Engine v2.4</span>
        </div>
      </footer>
    </div>
  );
}
