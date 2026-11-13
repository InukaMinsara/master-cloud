import React, { useEffect, useState } from 'react';
import { ListTree, Hash, ChevronRight, FileText } from 'lucide-react';

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

interface MasterDocsOutlineProps {
  contentHtml: string;
  onSelectHeading: (headingText: string) => void;
}

export function MasterDocsOutline({ contentHtml, onSelectHeading }: MasterDocsOutlineProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    const nodes = doc.querySelectorAll('h1, h2, h3');
    
    const parsed: HeadingItem[] = [];
    nodes.forEach((node, index) => {
      const text = node.textContent?.trim();
      if (text) {
        parsed.push({
          id: `heading-${index}`,
          text,
          level: parseInt(node.tagName.substring(1), 10),
        });
      }
    });
    setHeadings(parsed);
  }, [contentHtml]);

  if (headings.length === 0) {
    return (
      <div className="p-4 text-center space-y-2 select-none">
        <ListTree className="h-8 w-8 text-muted-foreground/50 mx-auto" />
        <p className="text-xs font-semibold text-muted-foreground">No headings detected</p>
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
          Add Headings (H1, H2, H3) to your document to generate an automatic navigation outline.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1 select-none overflow-y-auto max-h-full">
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <ListTree className="h-3.5 w-3.5" />
        <span>Document Outline</span>
      </div>

      <div className="space-y-0.5 pt-1">
        {headings.map((h) => {
          const paddingLeft = h.level === 1 ? 'pl-2' : h.level === 2 ? 'pl-5' : 'pl-8';
          const textSize = h.level === 1 ? 'text-xs font-bold' : h.level === 2 ? 'text-[11px] font-medium' : 'text-[10px] text-muted-foreground';

          return (
            <button
              key={h.id}
              onClick={() => onSelectHeading(h.text)}
              className={`w-full text-left py-1.5 pr-2 rounded-lg hover:bg-accent/60 transition-colors flex items-center gap-1.5 group ${paddingLeft} ${textSize}`}
            >
              <Hash className="h-3 w-3 text-muted-foreground/60 shrink-0 group-hover:text-primary transition-colors" />
              <span className="truncate">{h.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
