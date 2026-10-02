import React from 'react';
import { Columns, Rows, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MasterDocsSplitViewProps {
  isOpen: boolean;
  onClose: () => void;
  orientation: 'horizontal' | 'vertical';
  onChangeOrientation: (ori: 'horizontal' | 'vertical') => void;
  contentHtml: string;
}

export function MasterDocsSplitView({
  isOpen,
  onClose,
  orientation,
  onChangeOrientation,
  contentHtml,
}: MasterDocsSplitViewProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-10 bg-background flex flex-col pointer-events-none">
      {/* Floating control */}
      <div className="pointer-events-auto absolute top-4 right-4 z-20 flex items-center gap-1 bg-card border border-border shadow-lg p-1 rounded-xl">
        <button
          onClick={() => onChangeOrientation('vertical')}
          className={`p-1.5 rounded-lg text-xs font-semibold ${
            orientation === 'vertical' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
          }`}
          title="Vertical Split"
        >
          <Columns className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onChangeOrientation('horizontal')}
          className={`p-1.5 rounded-lg text-xs font-semibold ${
            orientation === 'horizontal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
          title="Horizontal Split"
        >
          <Rows className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Close Split View"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
