import React, { useRef, useEffect } from 'react';
import { CanvasDocData } from '@/types/canvas';

interface MasterDocsPageCanvasProps {
  contentHtml: string;
  onChangeContent: (newHtml: string) => void;
  pageLayout?: CanvasDocData['pageLayout'];
  zoomLevel: number;
  isDocDarkMode: boolean;
  onSelectionChange?: (selectedText: string) => void;
  editorRef: React.RefObject<HTMLDivElement>;
}

export function MasterDocsPageCanvas({
  contentHtml,
  onChangeContent,
  pageLayout,
  zoomLevel,
  isDocDarkMode,
  onSelectionChange,
  editorRef,
}: MasterDocsPageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine physical page dimensions in pixels at 96 DPI
  const getPageDimensions = () => {
    const size = pageLayout?.size || 'A4';
    const orientation = pageLayout?.orientation || 'portrait';

    let width = 794; // A4 portrait width in px
    let height = 1123; // A4 portrait height in px

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
        return '48px'; // 0.5 in
      case 'moderate':
        return '72px'; // 0.75 in
      case 'wide':
        return '144px'; // 1.5 in
      default:
        return '96px'; // 1.0 in
    }
  };

  const { width: pageWidth, height: pageMinHeight } = getPageDimensions();
  const padding = getMarginPadding();
  const columnCount = pageLayout?.columns || 1;

  // Initialize content on first load without overwriting cursor
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== contentHtml) {
      editorRef.current.innerHTML = contentHtml;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      onChangeContent(newHtml);
    }
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && onSelectionChange) {
      onSelectionChange(sel.toString().trim());
    }
  };

  const handleKeyUp = () => {
    const sel = window.getSelection();
    if (sel && onSelectionChange) {
      onSelectionChange(sel.toString().trim());
    }
  };

  // Handle image drag-and-drop or pasting directly into document
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
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-muted/40 p-4 sm:p-8 flex justify-center items-start min-h-0 relative"
      onClick={() => editorRef.current?.focus()}
    >
      {/* Zoom transform container */}
      <div
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
        }}
        className="pb-20"
      >
        {/* Realistic Page Sheet */}
        <div
          style={{
            width: `${pageWidth}px`,
            minHeight: `${pageMinHeight}px`,
            paddingTop: padding,
            paddingBottom: padding,
            paddingLeft: padding,
            paddingRight: padding,
            backgroundColor: isDocDarkMode ? '#0f172a' : (pageLayout?.pageBgColor || '#ffffff'),
            color: isDocDarkMode ? '#f8fafc' : '#1e293b',
          }}
          className="rounded-sm shadow-2xl border border-border/80 relative flex flex-col justify-between transition-colors"
        >
          {/* Header Area */}
          {pageLayout?.headerText && (
            <div
              style={{ top: `${parseInt(padding) / 3}px`, left: padding, right: padding }}
              className="absolute text-[11px] text-muted-foreground border-b border-border/40 pb-1 flex justify-between items-center select-none"
            >
              <span>{pageLayout.headerText}</span>
              <span className="text-[10px] font-mono">MASTER CLOUD DOCS</span>
            </div>
          )}

          {/* Editable Document Body */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onMouseUp={handleMouseUp}
            onKeyUp={handleKeyUp}
            onPaste={handlePaste}
            style={{
              columnCount: columnCount > 1 ? columnCount : undefined,
              columnGap: '32px',
              outline: 'none',
              minHeight: `${pageMinHeight - parseInt(padding) * 2}px`,
            }}
            className="master-docs-content prose max-w-none focus:outline-none flex-1 leading-relaxed"
          />

          {/* Footer Area */}
          <div
            style={{ bottom: `${parseInt(padding) / 3}px`, left: padding, right: padding }}
            className="absolute text-[11px] text-muted-foreground border-t border-border/40 pt-1 flex justify-between items-center select-none"
          >
            <span>{pageLayout?.footerText || ''}</span>
            <span className="font-mono text-[10px]">Page 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
