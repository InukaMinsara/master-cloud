import React from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { useFileStore } from '@/stores/fileStore';

export function Breadcrumbs() {
  const { breadcrumbs, setCurrentFolderId, moveItem, folders } = useFileStore();
  const [dragOverCrumbId, setDragOverCrumbId] = React.useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, crumbId: string | null) => {
    e.preventDefault();
    setDragOverCrumbId(crumbId || 'root');
  };

  const handleDragLeave = () => {
    setDragOverCrumbId(null);
  };

  const handleDrop = async (e: React.DragEvent, crumbId: string | null) => {
    e.preventDefault();
    setDragOverCrumbId(null);
    const draggedItemId = e.dataTransfer.getData('text/plain');
    if (draggedItemId && draggedItemId !== crumbId) {
      const isDraggedFolder = folders.some(f => f.id === draggedItemId);
      await moveItem(draggedItemId, isDraggedFolder, crumbId);
    }
  };

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground py-2 select-none overflow-x-auto">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        const isDragOver = dragOverCrumbId === (crumb.id || 'root');

        return (
          <React.Fragment key={crumb.id || 'root'}>
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
            <button
              onClick={() => setCurrentFolderId(crumb.id)}
              onDragOver={(e) => handleDragOver(e, crumb.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, crumb.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                isDragOver
                  ? 'bg-primary/20 text-primary ring-2 ring-primary'
                  : isLast
                  ? 'bg-secondary text-foreground font-semibold'
                  : 'hover:bg-accent hover:text-foreground'
              }`}
            >
              {idx === 0 ? <Home className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />}
              <span className="truncate max-w-[150px]">{crumb.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
