import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Cloud,
  CheckCircle2,
  Clock,
  Share2,
  Sparkles,
  Search,
  BookOpen,
  History,
  Lock,
  Shield,
  FileCheck,
  Tag,
  Palette,
  Quote,
  GitCompare,
  PenTool,
  Wand2,
  Code2,
  Download,
  Printer,
  Save,
  Undo2,
  Redo2,
  Globe,
  FileSpreadsheet,
  PanelLeft,
} from 'lucide-react';
import { CanvasDocData } from '@/types/canvas';
import {
  ExtendedCanvasDocData,
  DocStyleItem,
  DocSnapshot,
} from './types';
import { CanvasService } from '@/services/canvasService';
import { FileItem } from '@/types/file';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Subcomponents & Modals
import { MasterDocsToolbar, RibbonTab, ActiveCaretFormatting } from './MasterDocsToolbar';
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

// Extended Modals & Panels
import { MasterDocsStylesModal } from './components/MasterDocsStylesModal';
import { MasterDocsThemesModal } from './components/MasterDocsThemesModal';
import { MasterDocsCitationModal } from './components/MasterDocsCitationModal';
import { MasterDocsDiffModal } from './components/MasterDocsDiffModal';
import { MasterDocsQualityModal } from './components/MasterDocsQualityModal';
import { MasterDocsApprovalModal } from './components/MasterDocsApprovalModal';
import { MasterDocsSignatureModal } from './components/MasterDocsSignatureModal';
import { MasterDocsFormBuilderModal } from './components/MasterDocsFormBuilderModal';
import { MasterDocsMailMergeModal } from './components/MasterDocsMailMergeModal';
import { MasterDocsBookBuilderModal } from './components/MasterDocsBookBuilderModal';
import { MasterDocsSecurityModal } from './components/MasterDocsSecurityModal';
import { MasterDocsPropertiesModal } from './components/MasterDocsPropertiesModal';
import { MasterDocsCodeBlockModal } from './components/MasterDocsCodeBlockModal';
import { MasterDocsReadingMode } from './components/MasterDocsReadingMode';
import { MasterDocsPresentationMode } from './components/MasterDocsPresentationMode';
import { MasterDocsSplitView } from './components/MasterDocsSplitView';
import { MasterDocsCommandPalette, CommandItem } from './components/MasterDocsCommandPalette';
import { MasterDocsContextMenu } from './components/MasterDocsContextMenu';
import { MasterDocsAICopilot } from './components/MasterDocsAICopilot';
import { MasterDocsFileBackstage } from './components/MasterDocsFileBackstage';

// Services
import { DocTableService } from './services/DocTableService';
import { DocSearchService } from './services/DocSearchService';
import { DocDocxService } from './services/DocDocxService';
import { DocThemesService, WORD_FONT_FAMILIES } from './services/DocThemesService';

interface MasterDocsEditorProps {
  initialFile?: FileItem | null;
  initialData?: CanvasDocData | null;
  onSave?: (data: CanvasDocData) => Promise<void>;
}

interface CopiedFormatStyle {
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  color: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: string;
}

export function MasterDocsEditor({ initialFile, initialData, onSave }: MasterDocsEditorProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setShareModalItem, setVersionHistoryModalFile } = useUIStore();

  const [docData, setDocData] = useState<ExtendedCanvasDocData>(
    () => (initialData as ExtendedCanvasDocData) || CanvasService.getDefaultDocData(),
  );
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>('home');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isStarred, setIsStarred] = useState(false);

  // View States
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showRuler, setShowRuler] = useState(true);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDocDarkMode, setIsDocDarkMode] = useState(false);
  const [isFileBackstageOpen, setIsFileBackstageOpen] = useState(false);
  const [pageStats, setPageStats] = useState({ currentPage: 1, totalPages: 1 });

  // Undo / Redo Stack
  const historyPastRef = useRef<string[]>([]);
  const historyFutureRef = useRef<string[]>([]);
  const lastCommittedHtmlRef = useRef<string>(docData.content);
  const [historyTick, setHistoryTick] = useState(0);

  // Session Initial Baseline for Diff
  const initialBaselineRef = useRef<string>(initialData?.content || docData.content);

  // Format Painter State
  const [copiedFormat, setCopiedFormat] = useState<CopiedFormatStyle | null>(null);
  const [activeFormatting, setActiveFormatting] = useState<ActiveCaretFormatting>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    subscript: false,
    superscript: false,
    align: 'left',
    fontFamily: WORD_FONT_FAMILIES[0].value,
    fontSizePt: '12',
  });

  // Resolve active Word theme (supporting font-pair overrides saved in properties)
  const activeTheme = React.useMemo(() => {
    const base =
      DocThemesService.getBuiltinThemes().find((t) => t.id === (docData.themeId || 'office-m365')) ||
      DocThemesService.getBuiltinThemes()[0];
    const overrideHead = docData.properties?.customFields?.themeHeadingFont;
    const overrideBody = docData.properties?.customFields?.themeBodyFont;
    return overrideHead && overrideBody
      ? { ...base, headingFont: overrideHead, bodyFont: overrideBody }
      : base;
  }, [docData.themeId, docData.properties?.customFields]);

  // Extended Advanced Modals State
  const [isStylesModalOpen, setIsStylesModalOpen] = useState(false);
  const [isThemesModalOpen, setIsThemesModalOpen] = useState(false);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isFormBuilderModalOpen, setIsFormBuilderModalOpen] = useState(false);
  const [isMailMergeModalOpen, setIsMailMergeModalOpen] = useState(false);
  const [isBookBuilderModalOpen, setIsBookBuilderModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isPropertiesModalOpen, setIsPropertiesModalOpen] = useState(false);
  const [isCodeBlockModalOpen, setIsCodeBlockModalOpen] = useState(false);
  const [isReadingModeOpen, setIsReadingModeOpen] = useState(false);
  const [isPresentationModeOpen, setIsPresentationModeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);
  const [splitOrientation, setSplitOrientation] = useState<'horizontal' | 'vertical'>('vertical');

  // Core modals
  const [isEquationModalOpen, setIsEquationModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isWordCountModalOpen, setIsWordCountModalOpen] = useState(false);

  // Search tracking
  const searchIndexRef = useRef(0);
  const searchCountRef = useRef(0);

  // Active table cell tracking
  const activeTableCellRef = useRef<HTMLTableCellElement | null>(null);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    targetType: 'text' | 'table' | 'image' | 'general';
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    targetType: 'general',
  });

  const [activeSelectionText, setActiveSelectionText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Sync initialData
  useEffect(() => {
    if (initialData) {
      setDocData(initialData as ExtendedCanvasDocData);
      initialBaselineRef.current = initialData.content;
      lastCommittedHtmlRef.current = initialData.content;
      historyPastRef.current = [];
      historyFutureRef.current = [];
      if (editorRef.current && editorRef.current.innerHTML !== initialData.content) {
        editorRef.current.innerHTML = initialData.content;
      }
    }
  }, [initialData]);

  // Debounced auto-save to Master Cloud
  const triggerAutoSave = useCallback(
    (updated: ExtendedCanvasDocData) => {
      setSaveStatus('unsaved');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        if (onSave) {
          setSaveStatus('saving');
          try {
            const cleanData: ExtendedCanvasDocData = {
              ...updated,
              content: DocSearchService.stripHighlightMarksFromHtml(updated.content),
            };
            await onSave(cleanData);
            setSaveStatus('saved');
          } catch (err) {
            setSaveStatus('unsaved');
            toast.error('Failed to autosave to Master Cloud');
          }
        }
      }, 1200);
    },
    [onSave],
  );

  const pushHistory = (prevHtml: string, nextHtml: string) => {
    if (prevHtml === nextHtml) return;
    historyPastRef.current = [...historyPastRef.current.slice(-99), prevHtml];
    historyFutureRef.current = [];
    lastCommittedHtmlRef.current = nextHtml;
    setHistoryTick((t) => t + 1);
  };

  const applyHtmlToEditor = (html: string, recordHistory = true) => {
    const clean = DocSearchService.stripHighlightMarksFromHtml(html);
    if (recordHistory) {
      pushHistory(lastCommittedHtmlRef.current, clean);
    } else {
      lastCommittedHtmlRef.current = clean;
    }

    if (editorRef.current && editorRef.current.innerHTML !== clean) {
      editorRef.current.innerHTML = clean;
    }
    const temp = document.createElement('div');
    temp.innerHTML = clean;
    const text = temp.innerText || temp.textContent || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    const updated: ExtendedCanvasDocData = {
      ...docData,
      content: clean,
      wordCount: words,
      charCount: chars,
      lastSavedAt: new Date().toISOString(),
    };
    setDocData(updated);
    triggerAutoSave(updated);
  };

  const handleTitleChange = (newTitle: string) => {
    const updated = { ...docData, title: newTitle };
    setDocData(updated);
    triggerAutoSave(updated);
  };

  const handleContentChange = (newHtml: string) => {
    const clean = DocSearchService.stripHighlightMarksFromHtml(newHtml);
    if (clean !== lastCommittedHtmlRef.current) {
      pushHistory(lastCommittedHtmlRef.current, clean);
    }

    const temp = document.createElement('div');
    temp.innerHTML = clean;
    const text = temp.innerText || temp.textContent || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    const updated: ExtendedCanvasDocData = {
      ...docData,
      content: clean,
      wordCount: words,
      charCount: chars,
      lastSavedAt: new Date().toISOString(),
    };
    setDocData(updated);
    triggerAutoSave(updated);
  };

  const handleUndo = useCallback(() => {
    if (historyPastRef.current.length === 0) return;
    const previous = historyPastRef.current[historyPastRef.current.length - 1];
    historyPastRef.current = historyPastRef.current.slice(0, -1);
    historyFutureRef.current = [lastCommittedHtmlRef.current, ...historyFutureRef.current];
    setHistoryTick((t) => t + 1);
    applyHtmlToEditor(previous, false);
  }, [docData]);

  const handleRedo = useCallback(() => {
    if (historyFutureRef.current.length === 0) return;
    const next = historyFutureRef.current[0];
    historyFutureRef.current = historyFutureRef.current.slice(1);
    historyPastRef.current = [...historyPastRef.current, lastCommittedHtmlRef.current];
    setHistoryTick((t) => t + 1);
    applyHtmlToEditor(next, false);
  }, [docData]);

  // Snapshots
  const handleCreateSnapshot = (customName?: string) => {
    const clean = DocSearchService.stripHighlightMarksFromHtml(docData.content);
    const snap: DocSnapshot = {
      id: `snap-${Date.now()}`,
      name: customName || `Snapshot v${(docData.snapshots?.length || 0) + 1}`,
      timestamp: new Date().toISOString(),
      content: clean,
      wordCount: docData.wordCount,
    };
    const updated: ExtendedCanvasDocData = {
      ...docData,
      snapshots: [snap, ...(docData.snapshots || [])].slice(0, 25),
    };
    setDocData(updated);
    triggerAutoSave(updated);
    toast.success(`Saved "${snap.name}"`);
  };

  const handleManualSave = useCallback(async () => {
    if (!onSave) return;
    setSaveStatus('saving');
    try {
      const cleanContent = DocSearchService.stripHighlightMarksFromHtml(docData.content);
      const snap: DocSnapshot = {
        id: `snap-${Date.now()}`,
        name: `Saved v${(docData.snapshots?.length || 0) + 1}`,
        timestamp: new Date().toISOString(),
        content: cleanContent,
        wordCount: docData.wordCount,
      };
      const updated: ExtendedCanvasDocData = {
        ...docData,
        content: cleanContent,
        snapshots: [snap, ...(docData.snapshots || [])].slice(0, 25),
      };
      setDocData(updated);
      await onSave(updated);
      setSaveStatus('saved');
      toast.success('Document saved to Master Cloud');
    } catch {
      setSaveStatus('unsaved');
      toast.error('Failed to save document');
    }
  }, [docData, onSave]);

  // Keyboard Shortcuts (Ctrl+S, Ctrl+P, Ctrl+F, Ctrl+K, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        MasterDocsExportService.printDocument(docData.title, docData.content, docData.pageLayout);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'h')) {
        e.preventDefault();
        setIsFindReplaceOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (historyPastRef.current.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'Z' && e.shiftKey) || (e.key === 'z' && e.shiftKey))) {
        if (historyFutureRef.current.length > 0) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docData, handleManualSave, handleUndo, handleRedo]);

  // Sync Toolbar Formatting State from Caret Position
  const syncActiveFormatting = useCallback(() => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (!editorRef.current.contains(sel.anchorNode)) return;

    const bold = document.queryCommandState('bold');
    const italic = document.queryCommandState('italic');
    const underline = document.queryCommandState('underline');
    const strike = document.queryCommandState('strikeThrough');
    const subscript = document.queryCommandState('subscript');
    const superscript = document.queryCommandState('superscript');
    const align: ActiveCaretFormatting['align'] = document.queryCommandState('justifyCenter')
      ? 'center'
      : document.queryCommandState('justifyRight')
        ? 'right'
        : document.queryCommandState('justifyFull')
          ? 'justify'
          : 'left';

    const anchorEl =
      sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement;
    let fontFamily = activeFormatting.fontFamily;
    let fontSizePt = activeFormatting.fontSizePt;
    if (anchorEl) {
      const cs = window.getComputedStyle(anchorEl);
      const primaryFam = cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
      const matchedOpt = WORD_FONT_FAMILIES.find((f) =>
        f.value.toLowerCase().includes(primaryFam) || f.label.toLowerCase().startsWith(primaryFam),
      );
      if (matchedOpt) fontFamily = matchedOpt.value;
      const px = parseFloat(cs.fontSize);
      if (!Number.isNaN(px) && px > 0) {
        const pt = Math.round((px * 0.75) * 2) / 2;
        fontSizePt = String(Number.isInteger(pt) ? pt : pt);
      }
    }

    setActiveFormatting({
      bold,
      italic,
      underline,
      strike,
      subscript,
      superscript,
      align,
      fontFamily,
      fontSizePt,
    });
  }, [activeFormatting.fontFamily, activeFormatting.fontSizePt]);

  // Execute formatting commands on rich editor
  const handleExecCommand = (command: string, value: string = '') => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleContentChange(editorRef.current.innerHTML);
    }
    setTimeout(syncActiveFormatting, 0);
  };

  // Apply exact point font size (Word-accurate pt sizing without HTML <font size="1..7">)
  const handleSetFontSizePt = (pt: number) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      const span = document.createElement('span');
      span.style.fontSize = `${pt}pt`;
      span.innerHTML = '&#8203;';
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.setStart(span.firstChild || span, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } else {
      const span = document.createElement('span');
      span.style.fontSize = `${pt}pt`;
      try {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.removeAllRanges();
        sel.addRange(newRange);
      } catch {
        // Fallback when selection spans incompatible boundaries
        document.execCommand('fontSize', false, pt <= 10 ? '2' : pt <= 13 ? '3' : pt <= 16 ? '4' : pt <= 22 ? '5' : '6');
      }
    }
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
    setTimeout(syncActiveFormatting, 0);
  };

  // Word "Change Case" (Aa)
  const handleTransformCase = (mode: 'sentence' | 'lower' | 'upper' | 'capitalize' | 'toggle') => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      toast.info('Select text first to change case');
      return;
    }
    const text = sel.toString();
    let converted = text;
    if (mode === 'lower') converted = text.toLowerCase();
    else if (mode === 'upper') converted = text.toUpperCase();
    else if (mode === 'sentence') {
      converted = text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
    } else if (mode === 'capitalize') {
      converted = text.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    } else if (mode === 'toggle') {
      converted = Array.from(text)
        .map((ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()))
        .join('');
    }
    document.execCommand('insertText', false, converted);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  // Format Painter Toggle & Apply
  const handleToggleFormatPainter = () => {
    if (copiedFormat) {
      setCopiedFormat(null);
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      toast.info('Select formatted text first, then click Format Painter');
      return;
    }
    const anchorEl =
      sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement;
    if (!anchorEl) return;
    const cs = window.getComputedStyle(anchorEl);
    setCopiedFormat({
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      textDecoration: cs.textDecorationLine,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
    });
    toast.success('Format copied — select target text to apply');
  };

  const handleApplyFormatPainter = () => {
    if (!copiedFormat) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontWeight = copiedFormat.fontWeight;
    span.style.fontStyle = copiedFormat.fontStyle;
    span.style.textDecoration = copiedFormat.textDecoration;
    span.style.color = copiedFormat.color;
    if (copiedFormat.backgroundColor && copiedFormat.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      span.style.backgroundColor = copiedFormat.backgroundColor;
    }
    span.style.fontFamily = copiedFormat.fontFamily;
    span.style.fontSize = copiedFormat.fontSize;
    try {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
      if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
      toast.success('Formatting applied');
    } catch {
      // Fallback for cross-block selections
    } finally {
      setCopiedFormat(null);
    }
  };

  // Insert Table
  const handleInsertTable = (rows: number, cols: number) => {
    editorRef.current?.focus();
    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tbody>';
    for (let r = 0; r < rows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        if (r === 0) {
          tableHtml +=
            '<th data-header-row="true" style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #eff6ff; font-weight: 700;">Header</th>';
        } else {
          tableHtml += '<td style="border: 1px solid #cbd5e1; padding: 8px 12px;">&nbsp;</td>';
        }
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p></p>';
    document.execCommand('insertHTML', false, tableHtml);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  // Real Table Manipulation
  const handleTableAction = (action: () => boolean, label: string) => {
    const cell = DocTableService.getActiveCell(editorRef.current, activeTableCellRef.current);
    if (!cell) {
      toast.error('Place cursor inside a table cell first');
      return;
    }
    if (action() && editorRef.current) {
      handleContentChange(editorRef.current.innerHTML);
      toast.success(label);
    }
  };

  // Insert Image
  const handleInsertImage = (url: string) => {
    editorRef.current?.focus();
    const imgHtml = `<img src="${url}" alt="Inserted image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0;" /><p></p>`;
    document.execCommand('insertHTML', false, imgHtml);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  // Insert Hyperlink
  const handleInsertLink = (url: string, text?: string) => {
    editorRef.current?.focus();
    if (text) {
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #185abd; text-decoration: underline;">${text}</a>`;
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

    let tocHtml =
      '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 16px 0;">';
    tocHtml +=
      '<h3 style="margin-top: 0; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Table of Contents</h3><ul style="list-style-type: none; padding-left: 0;">';

    headings.forEach((h) => {
      const text = h.textContent || '';
      const level = parseInt(h.tagName.substring(1), 10);
      const indent = (level - 1) * 20;
      tocHtml += `<li style="padding-left: ${indent}px; margin: 6px 0;"><a href="#" style="color: #185abd; text-decoration: none;">&bull; ${text}</a></li>`;
    });

    tocHtml += '</ul></div><p></p>';
    editorRef.current?.focus();
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
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, fnRefHtml);

    const updatedFootnotes = [
      ...(docData.footnotes || []),
      { id: `fn-${Date.now()}`, number: fnNumber, text: fnPrompt },
    ];
    const updated = { ...docData, footnotes: updatedFootnotes };
    setDocData(updated);
    triggerAutoSave(updated);
    toast.success(`Footnote #${fnNumber} added`);
  };

  // Insert Callout Note Box
  const handleInsertCallout = () => {
    const calloutHtml = `
      <div style="background-color: #eff6ff; border-left: 4px solid #185abd; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; color: #1e3a8a;">
        <strong>Note:</strong> Enter callout text here.
      </div>
      <p></p>
    `;
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, calloutHtml);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  const handleInsertPageBreak = () => {
    editorRef.current?.focus();
    document.execCommand(
      'insertHTML',
      false,
      '<div data-page-break="true" class="docs-page-break" contenteditable="false"></div><p><br></p>',
    );
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
    toast.success('Page break inserted');
  };

  const handleInsertDivider = () => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, '<hr /><p></p>');
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  const handleInsertDateTime = () => {
    editorRef.current?.focus();
    const formatted = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    document.execCommand('insertText', false, formatted);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  // Insert Raw HTML Block
  const handleInsertHtmlBlock = (htmlBlock: string) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, htmlBlock);
    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
  };

  // Import real .docx file into editor
  const handleImportDocx = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const parsed = await DocDocxService.importDocxBuffer(buf, file.name.replace(/\.docx$/i, ''));
      const updated: ExtendedCanvasDocData = {
        ...docData,
        title: parsed.title || docData.title,
        content: parsed.html,
      };
      setDocData(updated);
      applyHtmlToEditor(parsed.html, true);
      toast.success(`Imported "${file.name}" into Docs`);
    } catch (err: any) {
      toast.error('Failed to import .docx: ' + (err?.message || 'Invalid Word file'));
    }
  };

  // Slash Command Runner
  const handleSlashCommand = (commandId: string) => {
    switch (commandId) {
      case 'copilot':
        setIsCopilotOpen(true);
        break;
      case 'h1':
        handleExecCommand('formatBlock', '<h1>');
        break;
      case 'h2':
        handleExecCommand('formatBlock', '<h2>');
        break;
      case 'h3':
        handleExecCommand('formatBlock', '<h3>');
        break;
      case 'bullet':
        handleExecCommand('insertUnorderedList');
        break;
      case 'numbered':
        handleExecCommand('insertOrderedList');
        break;
      case 'table':
        handleInsertTable(3, 3);
        break;
      case 'callout':
        handleInsertCallout();
        break;
      case 'quote':
        handleExecCommand('formatBlock', '<blockquote>');
        break;
      case 'code':
        setIsCodeBlockModalOpen(true);
        break;
      case 'pagebreak':
        handleInsertPageBreak();
        break;
      case 'divider':
        handleInsertDivider();
        break;
      default:
        break;
    }
  };

  // Select Template
  const handleSelectTemplate = (template: DocumentTemplate) => {
    const updated: ExtendedCanvasDocData = {
      ...docData,
      title: template.id !== 'blank' ? template.name : docData.title,
      content: template.content,
      lastSavedAt: new Date().toISOString(),
    };
    setDocData(updated);
    applyHtmlToEditor(template.content, true);
    toast.success(`Applied "${template.name}" template`);
  };

  // Update Page Layout
  const handleUpdateLayout = (updates: Partial<NonNullable<CanvasDocData['pageLayout']>>) => {
    const currentLayout = docData.pageLayout || {
      size: 'A4',
      orientation: 'portrait',
      margins: 'normal',
    };
    const updated: ExtendedCanvasDocData = {
      ...docData,
      pageLayout: { ...currentLayout, ...updates },
    };
    setDocData(updated);
    triggerAutoSave(updated);
  };

  // Comments CRUD
  const handleAddComment = (text: string, selected?: string) => {
    const newComment = {
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
      c.id === commentId ? { ...c, resolved: !c.resolved } : c,
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

  // Real Find & Replace Handlers (TreeWalker DOM Highlighting)
  const handleFind = (query: string, matchCase: boolean) => {
    const res = DocSearchService.highlightMatches(editorRef.current, query, matchCase);
    searchCountRef.current = res.count;
    searchIndexRef.current = res.activeIndex;
    return res;
  };

  const handleFindNext = () => {
    if (searchCountRef.current === 0) return { count: 0, activeIndex: 0 };
    const nextIdx = DocSearchService.setActiveMatch(editorRef.current, searchIndexRef.current + 1);
    searchIndexRef.current = nextIdx;
    return { count: searchCountRef.current, activeIndex: nextIdx };
  };

  const handleFindPrev = () => {
    if (searchCountRef.current === 0) return { count: 0, activeIndex: 0 };
    const nextIdx = DocSearchService.setActiveMatch(editorRef.current, searchIndexRef.current - 1);
    searchIndexRef.current = nextIdx;
    return { count: searchCountRef.current, activeIndex: nextIdx };
  };

  const handleReplace = (replacement: string, query: string, matchCase: boolean) => {
    const res = DocSearchService.replaceActiveMatch(
      editorRef.current,
      replacement,
      query,
      matchCase,
      searchIndexRef.current,
    );
    searchCountRef.current = res.count;
    searchIndexRef.current = res.activeIndex;
    if (editorRef.current) {
      handleContentChange(editorRef.current.innerHTML);
    }
    return res;
  };

  const handleReplaceAll = (query: string, replacement: string, matchCase: boolean) => {
    if (!editorRef.current || !query) return;
    DocSearchService.clearHighlights(editorRef.current);
    const currentHtml = editorRef.current.innerHTML;
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    // Replace only text outside HTML tags
    const replaced = currentHtml.replace(/>([^<]*)</g, (_, text) => `>${text.replace(regex, replacement)}<`);
    editorRef.current.innerHTML = replaced;
    handleContentChange(replaced);
    searchCountRef.current = 0;
    searchIndexRef.current = 0;
    toast.success('All instances replaced');
  };

  const handleCloseFindReplace = () => {
    DocSearchService.clearHighlights(editorRef.current);
    setIsFindReplaceOpen(false);
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

  // Apply Word Quick Style by ID (from Ribbon Gallery or Styles Modal)
  const handleApplyStyle = (style: DocStyleItem) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const styleClassMap: Record<string, string> = {
      'style-no-spacing': 'word-no-spacing',
      'style-title': 'word-title',
      'style-subtitle': 'word-subtitle',
      'style-intense-quote': 'word-intense-quote',
      'style-subtle-emphasis': 'word-subtle-emphasis',
      'style-intense-emphasis': 'word-intense-emphasis',
      'style-subtle-ref': 'word-subtle-ref',
      'style-intense-ref': 'word-intense-ref',
      'style-book-title': 'word-book-title',
    };

    const mappedClass = styleClassMap[style.id];
    if (style.tag !== 'span') {
      const targetTag =
        style.id === 'style-title' || style.id === 'style-subtitle' || style.id === 'style-no-spacing'
          ? 'p'
          : style.tag;
      document.execCommand('formatBlock', false, `<${targetTag}>`);
      const anchor = sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement;
      const block = anchor?.closest('p,h1,h2,h3,h4,h5,h6,blockquote,pre') as HTMLElement | null;
      if (block) {
        block.classList.remove('word-title', 'word-subtitle', 'word-no-spacing', 'word-intense-quote');
        if (mappedClass) block.classList.add(mappedClass);
        // Preserve custom inline overrides if user customized them in Styles modal
        const isDefaultThemeStyle = style.id.startsWith('style-');
        if (!isDefaultThemeStyle) {
          block.style.fontFamily = style.fontFamily;
          block.style.fontSize = style.fontSize;
          block.style.fontWeight = style.fontWeight;
          block.style.lineHeight = style.lineHeight;
          if (style.color) block.style.color = style.color;
        }
      }
      if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
      setTimeout(syncActiveFormatting, 0);
      return;
    }

    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    if (mappedClass) span.className = mappedClass;
    span.style.fontFamily = style.fontFamily;
    span.style.fontSize = style.fontSize;
    span.style.fontWeight = style.fontWeight;
    span.style.lineHeight = style.lineHeight;
    if (style.color) span.style.color = style.color;
    if (style.letterSpacing) span.style.letterSpacing = style.letterSpacing;
    if (style.isAllCaps) span.style.textTransform = 'uppercase';
    if (style.isSmallCaps) span.style.fontVariant = 'small-caps';

    if (range.collapsed) {
      span.innerHTML = '&#8203;';
      range.insertNode(span);
      const r = document.createRange();
      r.setStart(span.firstChild || span, 1);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    } else {
      const selectedContent = range.extractContents();
      span.appendChild(selectedContent);
      range.insertNode(span);
    }

    if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
    setTimeout(syncActiveFormatting, 0);
  };

  const handleApplyQuickStyle = (styleId: string) => {
    const allStyles =
      docData.customStyles && docData.customStyles.length > 0
        ? docData.customStyles
        : DocThemesService.getDefaultStyles();
    const found = allStyles.find((s) => s.id === styleId);
    if (found) handleApplyStyle(found);
  };

  // Word Built-In Cover Page Building Block
  const handleInsertCoverPage = () => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const author = user?.email?.split('@')[0] || 'Author';
    const coverHtml = `
      <div style="border-left: 6px solid ${activeTheme.primaryColor}; padding: 36px 28px; margin: 12px 0 24px 0; background: ${activeTheme.cardBg}; border-radius: 0 8px 8px 0;">
        <p style="font-size: 10pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: ${activeTheme.primaryColor}; margin-bottom: 12pt;">${docData.properties?.category || 'EXECUTIVE DOCUMENT'}</p>
        <p class="word-title" style="margin-bottom: 8pt;">${docData.title || 'Document Title'}</p>
        <p class="word-subtitle" style="margin-bottom: 24pt;">Prepared with Master Cloud Docs — Microsoft Word Compatible</p>
        <p style="font-size: 10.5pt; color: #595959; margin-bottom: 0;"><strong>Author:</strong> ${author} &nbsp;&bull;&nbsp; <strong>Date:</strong> ${today}</p>
      </div>
      <div data-page-break="true" class="docs-page-break" contenteditable="false"></div>
    `;
    if (editorRef.current) {
      editorRef.current.innerHTML = coverHtml + editorRef.current.innerHTML;
      handleContentChange(editorRef.current.innerHTML);
      toast.success('Cover Page inserted');
    }
  };

  // Context Menu Handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const cell = target.closest('td, th') as HTMLTableCellElement | null;
    if (cell) activeTableCellRef.current = cell;

    let type: 'text' | 'table' | 'image' | 'general' = 'general';
    if (target.closest('table')) type = 'table';
    else if (target.tagName === 'IMG') type = 'image';
    else if (window.getSelection()?.toString()) type = 'text';

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      targetType: type,
    });
  };

  // Command Palette Items
  const commandsList: CommandItem[] = [
    {
      id: 'cmd-copilot',
      title: 'Open Docs Copilot AI Assistant',
      category: 'AI',
      icon: <Sparkles className="h-4 w-4 text-[#185abd]" />,
      action: () => setIsCopilotOpen(true),
    },
    {
      id: 'cmd-save',
      title: 'Save Document to Master Cloud',
      category: 'File',
      icon: <Cloud className="h-4 w-4 text-primary" />,
      shortcut: 'Ctrl+S',
      action: handleManualSave,
    },
    {
      id: 'cmd-export-pdf',
      title: 'Export Document as PDF / Print',
      category: 'Export',
      icon: <Printer className="h-4 w-4 text-rose-500" />,
      shortcut: 'Ctrl+P',
      action: () => MasterDocsExportService.printDocument(docData.title, docData.content, docData.pageLayout),
    },
    {
      id: 'cmd-export-docx',
      title: 'Download as Microsoft Word (.docx)',
      category: 'Export',
      icon: <Download className="h-4 w-4 text-[#185abd]" />,
      action: () => MasterDocsExportService.exportToDocx(docData.title, docData.content, docData.pageLayout),
    },
    {
      id: 'cmd-page-break',
      title: 'Insert Page Break',
      category: 'Insert',
      icon: <FileCheck className="h-4 w-4 text-blue-500" />,
      action: handleInsertPageBreak,
    },
    {
      id: 'cmd-styles-modal',
      title: 'Open Advanced Typography & Styles Manager',
      category: 'Styles',
      icon: <Sparkles className="h-4 w-4 text-primary" />,
      action: () => setIsStylesModalOpen(true),
    },
    {
      id: 'cmd-themes-modal',
      title: 'Switch Document Themes & Color Palettes',
      category: 'Layout',
      icon: <Palette className="h-4 w-4 text-purple-500" />,
      action: () => setIsThemesModalOpen(true),
    },
    {
      id: 'cmd-citation-modal',
      title: 'Manage Citations & Bibliography (APA/MLA/IEEE)',
      category: 'References',
      icon: <Quote className="h-4 w-4 text-amber-500" />,
      action: () => setIsCitationModalOpen(true),
    },
    {
      id: 'cmd-diff-modal',
      title: 'Compare Document Versions & Snapshots',
      category: 'Review',
      icon: <GitCompare className="h-4 w-4 text-blue-500" />,
      action: () => setIsDiffModalOpen(true),
    },
    {
      id: 'cmd-quality-modal',
      title: 'Run Spelling & Quality Inspection',
      category: 'Review',
      icon: <Shield className="h-4 w-4 text-emerald-500" />,
      action: () => setIsQualityModalOpen(true),
    },
    {
      id: 'cmd-approval-modal',
      title: 'Manage Document Approval Workflow',
      category: 'Workflow',
      icon: <FileCheck className="h-4 w-4 text-indigo-500" />,
      action: () => setIsApprovalModalOpen(true),
    },
    {
      id: 'cmd-signature-modal',
      title: 'Insert Electronic Signature',
      category: 'Insert',
      icon: <PenTool className="h-4 w-4 text-amber-500" />,
      action: () => setIsSignatureModalOpen(true),
    },
    {
      id: 'cmd-form-builder-modal',
      title: 'Insert Interactive Form Controls',
      category: 'Insert',
      icon: <CheckCircle2 className="h-4 w-4 text-sky-500" />,
      action: () => setIsFormBuilderModalOpen(true),
    },
    {
      id: 'cmd-mail-merge-modal',
      title: 'Mail Merge & Dataset Runner',
      category: 'Mailings',
      icon: <Wand2 className="h-4 w-4 text-purple-500" />,
      action: () => setIsMailMergeModalOpen(true),
    },
    {
      id: 'cmd-code-block-modal',
      title: 'Insert Formatted Code Block',
      category: 'Insert',
      icon: <Code2 className="h-4 w-4 text-cyan-500" />,
      action: () => setIsCodeBlockModalOpen(true),
    },
    {
      id: 'cmd-reading-mode',
      title: 'Open Distraction-Free Reading Mode',
      category: 'View',
      icon: <BookOpen className="h-4 w-4 text-primary" />,
      action: () => setIsReadingModeOpen(true),
    },
    {
      id: 'cmd-security-modal',
      title: 'Manage Document Security & Access Rights',
      category: 'Security',
      icon: <Lock className="h-4 w-4 text-emerald-500" />,
      action: () => setIsSecurityModalOpen(true),
    },
  ];

  // Ensure tick triggers button enablement update
  void historyTick;
  const canUndo = historyPastRef.current.length > 0;
  const canRedo = historyFutureRef.current.length > 0;

  const pageWidthPx =
    docData.pageLayout?.size === 'Letter' || docData.pageLayout?.size === 'Legal'
      ? 816
      : docData.pageLayout?.size === 'A3'
        ? 1123
        : docData.pageLayout?.size === 'A5'
          ? 559
          : 794;
  const marginPx =
    docData.pageLayout?.margins === 'narrow'
      ? 48
      : docData.pageLayout?.margins === 'moderate'
        ? 72
        : docData.pageLayout?.margins === 'wide'
          ? 144
          : 96;

  return (
    <div
      className={`flex flex-col h-screen w-full bg-[#f3f2f1] dark:bg-slate-950 text-foreground overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* ── 1. Microsoft 365 Word Fluent Title Bar & QAT ─────────────────── */}
      <header className="flex h-10 items-center justify-between px-3 bg-[#f3f2f1] dark:bg-slate-900 text-foreground z-30 shrink-0 gap-3">
        {/* Left: Back + Docs App Icon + AutoSave + QAT + Doc Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => navigate('/docs')}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-black/[0.06] dark:hover:bg-white/10 hover:text-foreground transition-colors"
            title="Back to Docs Hub"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Master Cloud Docs App Icon */}
          <img
            src="/docs-logo.png"
            alt="Docs"
            className="h-6 w-6 rounded object-cover shadow-xs shrink-0"
          />

          {/* Quick Access Toolbar (QAT) */}
          <div className="hidden sm:flex items-center gap-0.5 px-1">
            <button
              onClick={handleManualSave}
              className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/10 text-foreground/80 transition-colors"
              title="Save (Ctrl+S)"
            >
              <Save className="h-3.5 w-3.5 text-[#185abd]" />
            </button>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/10 disabled:opacity-35 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/10 disabled:opacity-35 transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => MasterDocsExportService.printDocument(docData.title, docData.content, docData.pageLayout, activeTheme)}
              className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/10 transition-colors"
              title="Quick Print (Ctrl+P)"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-black/10 dark:bg-border mx-0.5 hidden sm:block" />

          {/* Document Title Pill */}
          <div className="flex items-center gap-1 min-w-0">
            <input
              type="text"
              value={docData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Document1"
              className="font-semibold text-xs bg-transparent hover:bg-black/[0.05] dark:hover:bg-white/10 focus:bg-white dark:focus:bg-slate-800 rounded px-2 py-1 max-w-[160px] sm:max-w-[210px] truncate focus:outline-none focus:ring-1 focus:ring-[#185abd] transition-colors"
            />
            <button
              onClick={() => setIsStarred(!isStarred)}
              className={`p-1 rounded transition-colors ${
                isStarred ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'
              }`}
              title="Pin / Star document"
            >
              <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Word AutoSave Cloud Status */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 dark:bg-card border border-black/[0.08] dark:border-border text-[10px] font-medium text-muted-foreground">
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <Clock className="h-3 w-3 animate-spin text-[#185abd]" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <Cloud className="h-3 w-3 text-amber-600" />
                <span>Editing</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Signature Microsoft 365 Word Search Bar */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1 w-64 lg:w-80 rounded-md bg-white/90 dark:bg-card border border-black/10 dark:border-border text-xs text-muted-foreground hover:border-[#185abd]/50 shadow-2xs transition-colors"
          title="Search commands & document (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5 text-[#185abd]" />
          <span className="truncate flex-1 text-left">Search (Ctrl+K)</span>
        </button>

        {/* Right: Collaborators, History, Word Blue Share Button */}
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:flex items-center mr-1">
            <div
              className="h-6 w-6 rounded-full bg-[#185abd] text-white text-[11px] font-bold flex items-center justify-center shadow-2xs"
              title={`${user?.display_name || 'You'} (Editing)`}
            >
              {(user?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          </div>

          {initialFile && (
            <button
              onClick={() => setVersionHistoryModalFile(initialFile)}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/[0.06] dark:hover:bg-white/10 text-xs font-medium text-foreground/80 transition-colors"
            >
              <History className="h-3.5 w-3.5" />
              <span>History</span>
            </button>
          )}

          <button
            onClick={() => {
              if (initialFile) setShareModalItem({ item: initialFile, isFolder: false });
              else setIsSecurityModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#185abd] hover:bg-[#144ea4] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* ── 2. Microsoft Word Ribbon Toolbar ──────────────────────────────── */}
      <MasterDocsToolbar
        activeTab={activeRibbonTab}
        setActiveTab={setActiveRibbonTab}
        onOpenFileBackstage={() => setIsFileBackstageOpen(true)}
        pageLayout={docData.pageLayout}
        onUpdateLayout={handleUpdateLayout}
        onExecCommand={handleExecCommand}
        activeFormatting={activeFormatting}
        onSetFontSizePt={handleSetFontSizePt}
        onApplyQuickStyle={handleApplyQuickStyle}
        onTransformCase={handleTransformCase}
        onInsertCoverPage={handleInsertCoverPage}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        isFormatPainterActive={Boolean(copiedFormat)}
        onToggleFormatPainter={handleToggleFormatPainter}
        onInsertTable={handleInsertTable}
        onInsertImage={handleInsertImage}
        onInsertLink={handleInsertLink}
        onInsertTOC={handleInsertTOC}
        onInsertFootnote={handleInsertFootnote}
        onInsertEquation={() => setIsEquationModalOpen(true)}
        onInsertCallout={handleInsertCallout}
        onInsertPageBreak={handleInsertPageBreak}
        onInsertDivider={handleInsertDivider}
        onInsertDateTime={handleInsertDateTime}
        onImportDocx={handleImportDocx}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenWordCount={() => setIsWordCountModalOpen(true)}
        onToggleOutline={() => setIsOutlineOpen(!isOutlineOpen)}
        onToggleComments={() => setIsCommentsOpen(!isCommentsOpen)}
        onToggleFindReplace={() => {
          if (isFindReplaceOpen) handleCloseFindReplace();
          else setIsFindReplaceOpen(true);
        }}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        isCopilotOpen={isCopilotOpen}
        onCreateSnapshot={() => handleCreateSnapshot()}
        onSave={handleManualSave}
        onPrint={() => MasterDocsExportService.printDocument(docData.title, docData.content, docData.pageLayout, activeTheme)}
        onExport={(fmt) => {
          if (fmt === 'docx') MasterDocsExportService.exportToDocx(docData.title, docData.content, docData.pageLayout, activeTheme);
          else if (fmt === 'pdf') MasterDocsExportService.printDocument(docData.title, docData.content, docData.pageLayout, activeTheme);
          else if (fmt === 'html') MasterDocsExportService.exportToHtml(docData.title, docData.content);
          else if (fmt === 'txt') MasterDocsExportService.exportToTxt(docData.title, docData.content);
          else if (fmt === 'md') MasterDocsExportService.exportToMarkdown(docData.title, docData.content);
          else if (fmt === 'rtf') MasterDocsExportService.exportToRtf(docData.title, docData.content);
          else if (fmt === 'json') MasterDocsExportService.exportToJson(docData.title, docData);
        }}
        onOpenStylesModal={() => setIsStylesModalOpen(true)}
        onOpenThemesModal={() => setIsThemesModalOpen(true)}
        onOpenCitationModal={() => setIsCitationModalOpen(true)}
        onOpenDiffModal={() => setIsDiffModalOpen(true)}
        onOpenQualityModal={() => setIsQualityModalOpen(true)}
        onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
        onOpenFormBuilderModal={() => setIsFormBuilderModalOpen(true)}
        onOpenMailMergeModal={() => setIsMailMergeModalOpen(true)}
        onOpenBookBuilderModal={() => setIsBookBuilderModalOpen(true)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenPropertiesModal={() => setIsPropertiesModalOpen(true)}
        onOpenCodeBlockModal={() => setIsCodeBlockModalOpen(true)}
        onOpenReadingMode={() => setIsReadingModeOpen(true)}
        onOpenPresentationMode={() => setIsPresentationModeOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleSplitView={() => setIsSplitViewOpen(!isSplitViewOpen)}
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

      {/* ── 3. Interactive Document Ruler ──────────────────────────────── */}
      {showRuler && docData.pageLayout?.viewMode !== 'web' && (
        <MasterDocsRuler
          pageWidth={pageWidthPx}
          leftMargin={marginPx}
          rightMargin={marginPx}
          zoomLevel={zoomLevel}
          currentMarginPreset={docData.pageLayout?.margins || 'normal'}
          onChangeMargins={(margins) => {
            handleUpdateLayout({ margins });
            toast.info(`Margins set to ${margins}`);
          }}
        />
      )}

      {/* ── 4. Main Work Area (Navigation Pane + Page Canvas + Comments + Copilot) ── */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Left: Navigation / Outline Sidebar */}
        {isOutlineOpen && (
          <aside className="w-64 border-r border-border/80 bg-card/70 backdrop-blur-md flex flex-col shrink-0 z-20">
            <MasterDocsOutline contentHtml={docData.content} onSelectHeading={handleSelectHeading} />
          </aside>
        )}

        {/* Center: Multi-Page Word Canvas */}
        <MasterDocsPageCanvas
          contentHtml={docData.content}
          onChangeContent={handleContentChange}
          pageLayout={docData.pageLayout}
          onUpdateLayout={handleUpdateLayout}
          activeTheme={activeTheme}
          zoomLevel={zoomLevel}
          isDocDarkMode={isDocDarkMode}
          onSelectionChange={setActiveSelectionText}
          onCaretFormatChange={syncActiveFormatting}
          editorRef={editorRef}
          shapes={docData.shapes || []}
          onUpdateShapes={(updatedShapes) => {
            const updated = { ...docData, shapes: updatedShapes };
            setDocData(updated);
            triggerAutoSave(updated);
          }}
          onContextMenu={handleContextMenu}
          onExecCommand={handleExecCommand}
          onInsertLink={() => {
            const url = prompt('Enter website URL:');
            if (url) handleInsertLink(url);
          }}
          onAddComment={() => {
            setIsCommentsOpen(true);
            const sel = window.getSelection()?.toString();
            if (sel) handleAddComment('Review note on selection', sel);
          }}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onSlashCommand={handleSlashCommand}
          onPageStatsChange={setPageStats}
          onActiveCellChange={(cell) => {
            activeTableCellRef.current = cell;
          }}
          isFormatPainterActive={Boolean(copiedFormat)}
          onApplyFormatPainter={handleApplyFormatPainter}
        />

        {/* Split Screen View (If enabled) */}
        <MasterDocsSplitView
          isOpen={isSplitViewOpen}
          onClose={() => setIsSplitViewOpen(false)}
          orientation={splitOrientation}
          onChangeOrientation={setSplitOrientation}
          contentHtml={docData.content}
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

        {/* Right: Docs Copilot AI Assistant Sidebar */}
        <MasterDocsAICopilot
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          documentTitle={docData.title}
          documentHtml={docData.content}
          selectedText={activeSelectionText}
          onInsertHtml={handleInsertHtmlBlock}
          onReplaceSelectionHtml={(html) => {
            editorRef.current?.focus();
            document.execCommand('insertHTML', false, html);
            if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
          }}
        />

        {/* Floating Find & Replace Bar */}
        <MasterDocsFindReplace
          isOpen={isFindReplaceOpen}
          onClose={handleCloseFindReplace}
          onFind={handleFind}
          onFindNext={handleFindNext}
          onFindPrev={handleFindPrev}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
        />

        {/* Right-Click Intelligent Word Context Menu */}
        <MasterDocsContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={contextMenu.isOpen}
          onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
          targetType={contextMenu.targetType}
          onExecCommand={handleExecCommand}
          onAddComment={() => {
            setIsCommentsOpen(true);
            const sel = window.getSelection()?.toString();
            if (sel) handleAddComment('Review note on selection', sel);
          }}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onInsertRowAbove={() =>
            handleTableAction(
              () => DocTableService.insertRow(activeTableCellRef.current!, 'above'),
              'Row inserted above',
            )
          }
          onInsertRowBelow={() =>
            handleTableAction(
              () => DocTableService.insertRow(activeTableCellRef.current!, 'below'),
              'Row inserted below',
            )
          }
          onInsertColumnLeft={() =>
            handleTableAction(
              () => DocTableService.insertColumn(activeTableCellRef.current!, 'left'),
              'Column inserted left',
            )
          }
          onInsertColumnRight={() =>
            handleTableAction(
              () => DocTableService.insertColumn(activeTableCellRef.current!, 'right'),
              'Column inserted right',
            )
          }
          onToggleTableHeader={() =>
            handleTableAction(
              () => DocTableService.toggleHeaderRow(activeTableCellRef.current!),
              'Toggled table header row',
            )
          }
          onShadeCell={(color) =>
            handleTableAction(
              () => DocTableService.setCellBackground(activeTableCellRef.current!, color),
              'Cell shading updated',
            )
          }
          onDeleteRow={() =>
            handleTableAction(
              () => DocTableService.deleteRow(activeTableCellRef.current!),
              'Row deleted',
            )
          }
          onDeleteColumn={() =>
            handleTableAction(
              () => DocTableService.deleteColumn(activeTableCellRef.current!),
              'Column deleted',
            )
          }
          onDeleteTable={() =>
            handleTableAction(
              () => DocTableService.deleteTable(activeTableCellRef.current!),
              'Table deleted',
            )
          }
        />
      </div>

      {/* ── 5. Microsoft Word Bottom Status Bar ──────────────────────────── */}
      <footer className="flex h-6 items-center justify-between px-3 border-t border-black/[0.08] dark:border-border/80 bg-[#f3f2f1] dark:bg-slate-900 text-[11px] text-muted-foreground z-30 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOutlineOpen(!isOutlineOpen)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            title="Toggle Navigation Pane"
          >
            <PanelLeft className="h-3 w-3" />
            <span className="font-medium text-foreground">
              Page {pageStats.currentPage} of {pageStats.totalPages}
            </span>
          </button>

          <button
            onClick={() => setIsWordCountModalOpen(true)}
            className="hover:text-[#185abd] transition-colors cursor-pointer font-medium"
          >
            {docData.wordCount.toLocaleString()} words
          </button>

          <span className="hidden md:inline text-[10.5px]">English (United States)</span>

          <button
            onClick={() => setIsQualityModalOpen(true)}
            className="hidden sm:flex items-center gap-1 hover:text-emerald-600 font-medium text-emerald-700 dark:text-emerald-400"
          >
            <Shield className="h-3 w-3" />
            <span>Proofing OK</span>
          </button>
        </div>

        {/* Right: Word View Mode Switcher + Zoom Slider */}
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-[10px]">
            ~{Math.max(1, Math.ceil(docData.wordCount / 200))} min read
          </span>

          <div className="flex items-center gap-0.5 border-x border-border/60 px-2">
            <button
              onClick={() => setIsReadingModeOpen(true)}
              className="p-1 rounded hover:bg-accent hover:text-foreground"
              title="Read Mode"
            >
              <BookOpen className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleUpdateLayout({ viewMode: 'print' })}
              className={`p-1 rounded ${
                (docData.pageLayout?.viewMode || 'print') === 'print'
                  ? 'bg-[#185abd]/15 text-[#185abd]'
                  : 'hover:bg-accent'
              }`}
              title="Print Layout"
            >
              <FileSpreadsheet className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleUpdateLayout({ viewMode: 'web' })}
              className={`p-1 rounded ${
                docData.pageLayout?.viewMode === 'web'
                  ? 'bg-[#185abd]/15 text-[#185abd]'
                  : 'hover:bg-accent'
              }`}
              title="Web Layout"
            >
              <Globe className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoomLevel(Math.max(0.5, Number((zoomLevel - 0.1).toFixed(2))))}
              className="px-1 hover:text-foreground font-bold"
              title="Zoom Out"
            >
              -
            </button>
            <input
              type="range"
              min={50}
              max={200}
              step={10}
              value={Math.round(zoomLevel * 100)}
              onChange={(e) => setZoomLevel(Number(e.target.value) / 100)}
              className="w-20 h-1 accent-[#185abd] cursor-pointer hidden sm:block"
              title="Zoom Slider"
            />
            <button
              onClick={() => setZoomLevel(Math.min(2.0, Number((zoomLevel + 0.1).toFixed(2))))}
              className="px-1 hover:text-foreground font-bold"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="font-mono text-[10px] font-semibold w-9 text-right hover:text-foreground"
              title="Reset to 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
          </div>
        </div>
      </footer>

      {/* ── 6. Microsoft Word Backstage & Advanced Modals ─────────────────── */}
      <MasterDocsFileBackstage
        isOpen={isFileBackstageOpen}
        onClose={() => setIsFileBackstageOpen(false)}
        docData={docData}
        saveStatus={saveStatus}
        onSave={handleManualSave}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onImportDocx={handleImportDocx}
        onExport={(fmt) => {
          if (fmt === 'docx') MasterDocsExportService.exportToDocx(docData.title, docData.content, docData.pageLayout, activeTheme);
          else if (fmt === 'pdf') MasterDocsExportService.printDocument(docData.title, docData.content, docData.pageLayout, activeTheme);
          else if (fmt === 'html') MasterDocsExportService.exportToHtml(docData.title, docData.content);
          else if (fmt === 'txt') MasterDocsExportService.exportToTxt(docData.title, docData.content);
          else if (fmt === 'md') MasterDocsExportService.exportToMarkdown(docData.title, docData.content);
          else if (fmt === 'rtf') MasterDocsExportService.exportToRtf(docData.title, docData.content);
          else if (fmt === 'json') MasterDocsExportService.exportToJson(docData.title, docData);
        }}
        onPrint={() => MasterDocsExportService.printDocument(docData.title, docData.content, docData.pageLayout, activeTheme)}
        onOpenProperties={() => setIsPropertiesModalOpen(true)}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
      />

      <MasterDocsStylesModal
        isOpen={isStylesModalOpen}
        onClose={() => setIsStylesModalOpen(false)}
        customStyles={docData.customStyles}
        onApplyStyle={handleApplyStyle}
        onSaveStyles={(styles) => {
          const updated = { ...docData, customStyles: styles };
          setDocData(updated);
          triggerAutoSave(updated);
        }}
      />

      <MasterDocsThemesModal
        isOpen={isThemesModalOpen}
        onClose={() => setIsThemesModalOpen(false)}
        activeThemeId={docData.themeId || 'office-m365'}
        onSelectTheme={(theme) => {
          const updated: ExtendedCanvasDocData = {
            ...docData,
            themeId: theme.id,
            properties: {
              ...(docData.properties || {}),
              customFields: {
                ...(docData.properties?.customFields || {}),
                themeHeadingFont: theme.headingFont,
                themeBodyFont: theme.bodyFont,
              },
            },
            pageLayout: {
              ...(docData.pageLayout || { size: 'A4', orientation: 'portrait', margins: 'normal' }),
              pageBgColor: theme.bgColor,
            },
          };
          setDocData(updated);
          triggerAutoSave(updated);
        }}
      />

      <MasterDocsCitationModal
        isOpen={isCitationModalOpen}
        onClose={() => setIsCitationModalOpen(false)}
        sources={docData.citations || []}
        activeStyle={docData.citationStyle || 'APA'}
        onInsertInTextCitation={(inTextStr) => {
          editorRef.current?.focus();
          document.execCommand('insertText', false, inTextStr);
          if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
        }}
        onInsertBibliography={(bibHtml) => handleInsertHtmlBlock(bibHtml)}
        onSaveSources={(sources, style) => {
          const updated = { ...docData, citations: sources, citationStyle: style };
          setDocData(updated);
          triggerAutoSave(updated);
        }}
      />

      <MasterDocsDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        currentContentHtml={docData.content}
        previousVersionHtml={initialBaselineRef.current}
        snapshots={docData.snapshots || []}
        onCreateSnapshot={() => handleCreateSnapshot()}
        onRestorePrevious={(content) => {
          applyHtmlToEditor(content, true);
        }}
      />

      <MasterDocsQualityModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        contentHtml={docData.content}
        unresolvedCommentsCount={(docData.comments || []).filter((c) => !c.resolved).length}
        onOpenComments={() => setIsCommentsOpen(true)}
      />

      <MasterDocsApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        approval={docData.approval}
        onUpdateApproval={(appr) => {
          const updated = { ...docData, approval: appr };
          setDocData(updated);
          triggerAutoSave(updated);
        }}
      />

      <MasterDocsSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onInsertSignatureHtml={(sigHtml) => handleInsertHtmlBlock(sigHtml)}
      />

      <MasterDocsFormBuilderModal
        isOpen={isFormBuilderModalOpen}
        onClose={() => setIsFormBuilderModalOpen(false)}
        onInsertFieldHtml={(fieldHtml) => handleInsertHtmlBlock(fieldHtml)}
      />

      <MasterDocsMailMergeModal
        isOpen={isMailMergeModalOpen}
        onClose={() => setIsMailMergeModalOpen(false)}
        contentHtml={docData.content}
        onApplyMergedContent={(merged) => {
          applyHtmlToEditor(merged, true);
        }}
        onInsertVariable={(varName) => {
          editorRef.current?.focus();
          document.execCommand('insertText', false, `{{${varName}}}`);
          if (editorRef.current) handleContentChange(editorRef.current.innerHTML);
        }}
      />

      <MasterDocsBookBuilderModal
        isOpen={isBookBuilderModalOpen}
        onClose={() => setIsBookBuilderModalOpen(false)}
        chapters={docData.bookChapters || []}
        onSaveChapters={(chapters) => {
          const updated = { ...docData, bookChapters: chapters, isBookMode: true };
          setDocData(updated);
          triggerAutoSave(updated);
        }}
      />

      <MasterDocsSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        documentTitle={docData.title}
        security={docData.security}
        onSaveSecurity={(sec) => {
          const updated = { ...docData, security: sec };
          setDocData(updated);
          triggerAutoSave(updated);
        }}
      />

      <MasterDocsPropertiesModal
        isOpen={isPropertiesModalOpen}
        onClose={() => setIsPropertiesModalOpen(false)}
        properties={docData.properties}
        onSaveProperties={(props) => {
          const updated = { ...docData, properties: props };
          setDocData(updated);
          triggerAutoSave(updated);
        }}
      />

      <MasterDocsCodeBlockModal
        isOpen={isCodeBlockModalOpen}
        onClose={() => setIsCodeBlockModalOpen(false)}
        onInsertCodeHtml={(codeHtml) => handleInsertHtmlBlock(codeHtml)}
      />

      <MasterDocsReadingMode
        isOpen={isReadingModeOpen}
        onClose={() => setIsReadingModeOpen(false)}
        title={docData.title}
        contentHtml={docData.content}
      />

      <MasterDocsPresentationMode
        isOpen={isPresentationModeOpen}
        onClose={() => setIsPresentationModeOpen(false)}
        title={docData.title}
        contentHtml={docData.content}
      />

      <MasterDocsEquationModal
        isOpen={isEquationModalOpen}
        onClose={() => setIsEquationModalOpen(false)}
        onInsertEquation={(latex) => {
          const eqHtml = `<span style="font-family: serif; font-style: italic; font-size: 1.1em; background-color: #f1f5f9; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0; display: inline-block; margin: 2px 4px;">${latex}</span>`;
          handleInsertHtmlBlock(eqHtml);
          toast.success('Equation inserted');
        }}
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

      <MasterDocsCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commandsList}
      />
    </div>
  );
}
