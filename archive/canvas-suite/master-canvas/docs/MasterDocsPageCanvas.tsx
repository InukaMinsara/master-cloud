import React, { useRef, useEffect, useState } from 'react';
import { CanvasDocData } from '@/types/canvas';
import { DocShapeElement, DocTheme } from './types';
import { DocThemesService } from './services/DocThemesService';
import { MasterDocsShapesLayer } from './components/MasterDocsShapesLayer';
import { MasterDocsFloatingToolbar } from './components/MasterDocsFloatingToolbar';
import { MasterDocsSlashMenu } from './components/MasterDocsSlashMenu';

interface MasterDocsPageCanvasProps {
  contentHtml: string;
  onChangeContent: (newHtml: string) => void;
  pageLayout?: CanvasDocData['pageLayout'];
  onUpdateLayout?: (updates: Partial<NonNullable<CanvasDocData['pageLayout']>>) => void;
  activeTheme?: DocTheme;
  zoomLevel: number;
  isDocDarkMode: boolean;
  onSelectionChange?: (selectedText: string) => void;
  onCaretFormatChange?: () => void;
  editorRef: React.RefObject<HTMLDivElement>;
  shapes?: DocShapeElement[];
  onUpdateShapes?: (shapes: DocShapeElement[]) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onExecCommand: (command: string, value?: string) => void;
  onInsertLink: () => void;
  onAddComment: () => void;
  onOpenCopilot: () => void;
  onSlashCommand: (commandId: string) => void;
  onPageStatsChange?: (stats: { currentPage: number; totalPages: number }) => void;
  onActiveCellChange?: (cell: HTMLTableCellElement | null) => void;
  isFormatPainterActive?: boolean;
  onApplyFormatPainter?: () => void;
  drawTool?: 'select' | 'pen' | 'highlighter' | 'eraser';
  penColor?: string;
  penWidth?: number;
}

export function MasterDocsPageCanvas({
  contentHtml,
  onChangeContent,
  pageLayout,
  onUpdateLayout,
  activeTheme,
  zoomLevel,
  isDocDarkMode,
  onSelectionChange,
  onCaretFormatChange,
  editorRef,
  shapes = [],
  onUpdateShapes,
  onContextMenu,
  onExecCommand,
  onInsertLink,
  onAddComment,
  onOpenCopilot,
  onSlashCommand,
  onPageStatsChange,
  onActiveCellChange,
  isFormatPainterActive,
  onApplyFormatPainter,
  drawTool = 'select',
  penColor = '#111827',
  penWidth = 2,
}: MasterDocsPageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentInkStroke, setCurrentInkStroke] = useState<{ x: number; y: number }[] | null>(null);

  // Header & Footer inline edit states
  const [editingHeader, setEditingHeader] = useState(false);
  const [editingFooter, setEditingFooter] = useState(false);
  const [headerDraft, setHeaderDraft] = useState(pageLayout?.headerText || '');
  const [footerDraft, setFooterDraft] = useState(pageLayout?.footerText || '');

  // Floating Mini Toolbar state
  const [floatingBar, setFloatingBar] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // Slash Menu state
  const [slashMenu, setSlashMenu] = useState<{ visible: boolean; x: number; y: number; filter: string }>({
    visible: false,
    x: 0,
    y: 0,
    filter: '',
  });

  useEffect(() => {
    setHeaderDraft(pageLayout?.headerText || '');
    setFooterDraft(pageLayout?.footerText || '');
  }, [pageLayout?.headerText, pageLayout?.footerText]);

  const getPageDimensions = () => {
    const size = pageLayout?.size || 'A4';
    const orientation = pageLayout?.orientation || 'portrait';

    let width = 794;
    let height = 1123;

    if (size === 'Letter') {
      width = 816;
      height = 1056;
    } else if (size === 'Legal') {
      width = 816;
      height = 1344;
    } else if (size === 'A3') {
      width = 1123;
      height = 1587;
    } else if (size === 'A5') {
      width = 559;
      height = 794;
    }

    if (orientation === 'landscape') {
      const temp = width;
      width = height;
      height = temp;
    }

    return { width, height };
  };

  const getMarginPadding = () => {
    const margins = pageLayout?.margins || 'normal';
    switch (margins) {
      case 'narrow':
        return '48px';
      case 'moderate':
        return '72px';
      case 'wide':
        return '144px';
      default:
        return '96px';
    }
  };

  const { width: pageWidth, height: pageMinHeight } = getPageDimensions();
  const padding = getMarginPadding();
  const columnCount = pageLayout?.columns || 1;
  const isWebLayout = pageLayout?.viewMode === 'web';
  const lineSpacing = pageLayout?.lineSpacing || 1.16;
  const resolvedTheme = activeTheme || DocThemesService.getBuiltinThemes()[0];
  const headingDarkAccent = isDocDarkMode
    ? resolvedTheme.primaryColor
    : DocThemesService.darkenHex(resolvedTheme.primaryColor, 0.74);
  const tableHeaderBg = isDocDarkMode
    ? '#1e293b'
    : resolvedTheme.tableHeaderBg || DocThemesService.lightenHexTint(resolvedTheme.primaryColor, 0.9);

  // Initialize content on mount without overwriting cursor
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== contentHtml) {
      editorRef.current.innerHTML = contentHtml;
    }
  }, []);

  // Recompute totalPages from sheet height & explicit page breaks
  useEffect(() => {
    const recomputePages = () => {
      if (!sheetRef.current || !editorRef.current) return;
      const explicitBreaks = editorRef.current.querySelectorAll('.docs-page-break').length;
      const heightPages = Math.max(1, Math.ceil(sheetRef.current.scrollHeight / pageMinHeight));
      const nextTotal = Math.max(heightPages, explicitBreaks + 1);
      setTotalPages(nextTotal);
      onPageStatsChange?.({ currentPage, totalPages: nextTotal });
    };

    recomputePages();
    const observer = new ResizeObserver(recomputePages);
    if (sheetRef.current) observer.observe(sheetRef.current);
    return () => observer.disconnect();
  }, [pageMinHeight, contentHtml, currentPage, onPageStatsChange]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const pageIdx = Math.min(totalPages, Math.max(1, Math.floor(scrollTop / (pageMinHeight * zoomLevel)) + 1));
    if (pageIdx !== currentPage) {
      setCurrentPage(pageIdx);
      onPageStatsChange?.({ currentPage: pageIdx, totalPages });
    }
    setFloatingBar((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  };

  const detectActiveTableCell = () => {
    if (!onActiveCellChange || !editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      onActiveCellChange(null);
      return;
    }
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node instanceof HTMLTableCellElement) {
        onActiveCellChange(node);
        return;
      }
      node = node.parentNode;
    }
    onActiveCellChange(null);
  };

  const getSheetCoords = (clientX: number, clientY: number) => {
    if (!sheetRef.current) return null;
    const rect = sheetRef.current.getBoundingClientRect();
    const effectiveZoom = isWebLayout ? 1 : zoomLevel;
    return {
      x: Math.round((clientX - rect.left) / effectiveZoom),
      y: Math.round((clientY - rect.top) / effectiveZoom),
    };
  };

  const handleSheetMouseDown = (e: React.MouseEvent) => {
    if (drawTool === 'pen' || drawTool === 'highlighter') {
      const coords = getSheetCoords(e.clientX, e.clientY);
      if (coords) {
        setCurrentInkStroke([coords]);
      }
      return;
    }
    if (drawTool === 'eraser' && onUpdateShapes) {
      const coords = getSheetCoords(e.clientX, e.clientY);
      if (coords) {
        const remaining = shapes.filter((s) => {
          if (s.type !== 'ink' || !s.points) return true;
          return !s.points.some((p) => Math.hypot(p.x - coords.x, p.y - coords.y) < 28);
        });
        if (remaining.length !== shapes.length) {
          onUpdateShapes(remaining);
        }
      }
    }
  };

  const handleSheetMouseMove = (e: React.MouseEvent) => {
    if (currentInkStroke && (drawTool === 'pen' || drawTool === 'highlighter')) {
      const coords = getSheetCoords(e.clientX, e.clientY);
      if (coords) {
        setCurrentInkStroke((prev) => (prev ? [...prev, coords] : [coords]));
      }
    }
  };

  const handleSheetMouseUp = () => {
    if (currentInkStroke && currentInkStroke.length > 1 && onUpdateShapes) {
      const isHighlighter = drawTool === 'highlighter';
      const newInk: DocShapeElement = {
        id: `ink-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'ink',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        strokeColor: penColor || '#111827',
        fillColor: isHighlighter ? 'highlighter' : 'transparent',
        strokeWidth: isHighlighter ? (penWidth || 16) : (penWidth || 2),
        zIndex: isHighlighter ? 1 : 15,
        pageIndex: 0,
        points: currentInkStroke,
      };
      onUpdateShapes([...shapes, newInk]);
    }
    setCurrentInkStroke(null);
  };

  const updateFloatingToolbar = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim() || !editorRef.current?.contains(sel.anchorNode)) {
      setFloatingBar((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0) {
      setFloatingBar({
        visible: true,
        x: rect.left + rect.width / 2 - 150,
        y: rect.top - 48,
      });
    }
  };

  const checkSlashTrigger = () => {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || sel.rangeCount === 0) {
      if (slashMenu.visible) setSlashMenu((prev) => ({ ...prev, visible: false }));
      return;
    }
    const node = sel.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE) {
      if (slashMenu.visible) setSlashMenu((prev) => ({ ...prev, visible: false }));
      return;
    }
    const textBefore = (node.textContent || '').slice(0, sel.anchorOffset);
    const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/);
    if (match) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSlashMenu({
        visible: true,
        x: rect.left,
        y: rect.bottom + 8,
        filter: match[1] || '',
      });
    } else if (slashMenu.visible) {
      setSlashMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  const handleSelectSlashCommand = (commandId: string) => {
    // Delete the typed `/query` token before running the command
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.anchorNode?.nodeType === Node.TEXT_NODE) {
      const node = sel.anchorNode as Text;
      const offset = sel.anchorOffset;
      const textBefore = (node.textContent || '').slice(0, offset);
      const match = textBefore.match(/\/([a-zA-Z0-9]*)$/);
      if (match && match.index !== undefined) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, offset);
        range.deleteContents();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    setSlashMenu({ visible: false, x: 0, y: 0, filter: '' });
    onSlashCommand(commandId);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChangeContent(editorRef.current.innerHTML);
      checkSlashTrigger();
    }
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && onSelectionChange) {
      onSelectionChange(sel.toString().trim());
    }
    detectActiveTableCell();
    onCaretFormatChange?.();
    if (isFormatPainterActive && sel && !sel.isCollapsed) {
      onApplyFormatPainter?.();
    }
    setTimeout(updateFloatingToolbar, 10);
  };

  const handleKeyUp = () => {
    const sel = window.getSelection();
    if (sel && onSelectionChange) {
      onSelectionChange(sel.toString().trim());
    }
    detectActiveTableCell();
    onCaretFormatChange?.();
    updateFloatingToolbar();
  };

  // Support Tab indentation inside paragraphs & table cells
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        document.execCommand('outdent', false);
      } else {
        document.execCommand('indent', false);
      }
      if (editorRef.current) onChangeContent(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Url = event.target?.result as string;
            document.execCommand('insertImage', false, base64Url);
            if (editorRef.current) onChangeContent(editorRef.current.innerHTML);
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target?.result as string;
          document.execCommand('insertImage', false, base64Url);
          handleInput();
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const commitHeader = () => {
    setEditingHeader(false);
    onUpdateLayout?.({ headerText: headerDraft });
  };

  const commitFooter = () => {
    setEditingFooter(false);
    onUpdateLayout?.({ footerText: footerDraft });
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onContextMenu={onContextMenu}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`flex-1 overflow-auto bg-[#f3f2f1] dark:bg-slate-950 p-4 sm:p-8 flex justify-center items-start min-h-0 relative ${
        isFormatPainterActive ? 'cursor-crosshair' : ''
      }`}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          editorRef.current?.focus();
        }
      }}
    >
      {/* Floating Word Mini Toolbar */}
      <MasterDocsFloatingToolbar
        visible={floatingBar.visible}
        x={floatingBar.x}
        y={floatingBar.y}
        onExecCommand={onExecCommand}
        onInsertLink={() => {
          setFloatingBar((p) => ({ ...p, visible: false }));
          onInsertLink();
        }}
        onAddComment={() => {
          setFloatingBar((p) => ({ ...p, visible: false }));
          onAddComment();
        }}
        onOpenCopilot={() => {
          setFloatingBar((p) => ({ ...p, visible: false }));
          onOpenCopilot();
        }}
      />

      {/* Quick Insert Slash Menu */}
      <MasterDocsSlashMenu
        visible={slashMenu.visible}
        x={slashMenu.x}
        y={slashMenu.y}
        filterText={slashMenu.filter}
        onSelect={handleSelectSlashCommand}
        onClose={() => setSlashMenu({ visible: false, x: 0, y: 0, filter: '' })}
      />

      {/* Zoom transform container */}
      <div
        style={{
          transform: isWebLayout ? undefined : `scale(${zoomLevel})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
          width: isWebLayout ? '100%' : undefined,
          maxWidth: isWebLayout ? '1100px' : undefined,
        }}
        className="pb-20 relative"
      >
        {/* Realistic Word Page Sheet */}
        <div
          ref={sheetRef}
          onMouseDown={handleSheetMouseDown}
          onMouseMove={handleSheetMouseMove}
          onMouseUp={handleSheetMouseUp}
          onMouseLeave={handleSheetMouseUp}
          style={{
            width: isWebLayout ? '100%' : `${pageWidth}px`,
            minHeight: `${pageMinHeight}px`,
            paddingTop: padding,
            paddingBottom: padding,
            paddingLeft: isWebLayout ? '48px' : padding,
            paddingRight: isWebLayout ? '48px' : padding,
            backgroundColor: isDocDarkMode ? '#0f172a' : pageLayout?.pageBgColor || '#ffffff',
            color: isDocDarkMode ? '#f8fafc' : '#1e293b',
            cursor: drawTool !== 'select' ? (drawTool === 'eraser' ? 'cell' : 'crosshair') : undefined,
          }}
          className="rounded-none shadow-[0_2px_12px_rgba(0,0,0,0.09)] border border-[#d2d0ce] dark:border-border/80 relative flex flex-col justify-between transition-colors overflow-hidden"
        >
          {/* Optional Diagonal Watermark Layer */}
          {pageLayout?.watermarkText && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-0">
              <span
                className="text-6xl sm:text-7xl font-black uppercase tracking-[0.25em] -rotate-45 select-none opacity-[0.07]"
                style={{ color: isDocDarkMode ? '#ffffff' : '#1e293b' }}
              >
                {pageLayout.watermarkText}
              </span>
            </div>
          )}

          {/* Subtle Page Break Boundaries for multi-page print layout */}
          {!isWebLayout &&
            totalPages > 1 &&
            Array.from({ length: totalPages - 1 }).map((_, idx) => (
              <div
                key={idx}
                style={{ top: `${(idx + 1) * pageMinHeight}px` }}
                className="pointer-events-none absolute left-0 right-0 border-t-2 border-dashed border-blue-400/40 flex justify-end pr-4 z-10"
              >
                <span className="-mt-2.5 bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  Page {idx + 2}
                </span>
              </div>
            ))}

          {/* Editable Header Area */}
          <div
            onDoubleClick={() => setEditingHeader(true)}
            onClick={() => !editingHeader && setEditingHeader(true)}
            style={{ top: `${parseInt(padding) / 3}px`, left: isWebLayout ? '48px' : padding, right: isWebLayout ? '48px' : padding }}
            className="absolute text-[11px] text-muted-foreground border-b border-transparent hover:border-border/60 pb-1 flex justify-between items-center select-none cursor-text group z-10"
            title="Click to edit document header"
          >
            {editingHeader ? (
              <input
                type="text"
                value={headerDraft}
                onChange={(e) => setHeaderDraft(e.target.value)}
                onBlur={commitHeader}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitHeader();
                }}
                placeholder="Type document header..."
                autoFocus
                className="w-full bg-background/90 text-foreground px-2 py-0.5 rounded border border-primary/50 text-[11px] focus:outline-none"
              />
            ) : (
              <>
                <span className="truncate opacity-70 group-hover:opacity-100">
                  {pageLayout?.headerText || 'Click to add header...'}
                </span>
                <span className="text-[9px] font-mono opacity-0 group-hover:opacity-70 transition-opacity">
                  HEADER
                </span>
              </>
            )}
          </div>

          {/* Embedded Drawing Shapes Layer */}
          {shapes && onUpdateShapes && (
            <MasterDocsShapesLayer shapes={shapes} onUpdateShapes={onUpdateShapes} />
          )}

          {/* Active Ink Stroke Preview */}
          {currentInkStroke && currentInkStroke.length > 1 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
              style={{ position: 'absolute', inset: 0 }}
            >
              <path
                d={currentInkStroke.reduce(
                  (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                  ''
                )}
                fill="none"
                stroke={penColor === 'galaxy' ? '#ec4899' : penColor}
                strokeWidth={drawTool === 'highlighter' ? (penWidth || 16) : (penWidth || 2)}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={drawTool === 'highlighter' ? 0.45 : 1}
              />
            </svg>
          )}

          {/* Editable Document Body */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onMouseUp={handleMouseUp}
            onKeyUp={handleKeyUp}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            style={{
              columnCount: columnCount > 1 ? columnCount : undefined,
              columnGap: '32px',
              outline: 'none',
              lineHeight: String(lineSpacing),
              minHeight: `${pageMinHeight - parseInt(padding) * 2}px`,
              ['--doc-heading-font' as any]: resolvedTheme.headingFont,
              ['--doc-body-font' as any]: resolvedTheme.bodyFont,
              ['--doc-accent1' as any]: resolvedTheme.primaryColor,
              ['--doc-accent1-dark' as any]: headingDarkAccent,
              ['--doc-accent2' as any]: resolvedTheme.accentColor,
              ['--doc-table-header-bg' as any]: tableHeaderBg,
            } as React.CSSProperties}
            className="master-docs-content focus:outline-none flex-1 z-0"
          />

          {/* Editable Footer Area */}
          <div
            onDoubleClick={() => setEditingFooter(true)}
            onClick={() => !editingFooter && setEditingFooter(true)}
            style={{ bottom: `${parseInt(padding) / 3}px`, left: isWebLayout ? '48px' : padding, right: isWebLayout ? '48px' : padding }}
            className="absolute text-[11px] text-muted-foreground border-t border-transparent hover:border-border/60 pt-1 flex justify-between items-center select-none cursor-text group z-10"
            title="Click to edit document footer"
          >
            {editingFooter ? (
              <input
                type="text"
                value={footerDraft}
                onChange={(e) => setFooterDraft(e.target.value)}
                onBlur={commitFooter}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitFooter();
                }}
                placeholder="Type document footer..."
                autoFocus
                className="flex-1 mr-3 bg-background/90 text-foreground px-2 py-0.5 rounded border border-primary/50 text-[11px] focus:outline-none"
              />
            ) : (
              <span className="truncate opacity-70 group-hover:opacity-100">
                {pageLayout?.footerText || 'Click to add footer...'}
              </span>
            )}
            {pageLayout?.showPageNumbers !== false && (
              <span className="font-mono text-[10px] shrink-0">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
