import React, { useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Type,
  Square,
  Image as ImageIcon,
  Table as TableIcon,
  BarChart3,
  CircleDot,
  Edit2,
  Check,
  X,
  FolderTree,
} from 'lucide-react';
import { MasterSlide, MasterSlideObject } from '../types';

interface MasterSlidesLayersPanelProps {
  slide: MasterSlide;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (id: string, updates: Partial<MasterSlideObject>) => void;
  onDeleteObject: (id: string) => void;
  onDuplicateObject: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onClose: () => void;
}

export function MasterSlidesLayersPanel({
  slide,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onClose,
}: MasterSlidesLayersPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Sort objects by zIndex descending (highest on top)
  const sortedObjects = [...slide.objects].sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1));

  const getObjectIcon = (type: MasterSlideObject['type']) => {
    switch (type) {
      case 'text':
        return <Type className="h-3.5 w-3.5 text-blue-400" />;
      case 'shape':
        return <Square className="h-3.5 w-3.5 text-emerald-400" />;
      case 'image':
        return <ImageIcon className="h-3.5 w-3.5 text-purple-400" />;
      case 'table':
        return <TableIcon className="h-3.5 w-3.5 text-amber-400" />;
      case 'chart':
        return <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />;
      default:
        return <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const handleStartRename = (obj: MasterSlideObject) => {
    setEditingId(obj.id);
    setEditingName(obj.name || `${obj.type.toUpperCase()} Layer`);
  };

  const handleSaveRename = (id: string) => {
    onUpdateObject(id, { name: editingName.trim() || undefined });
    setEditingId(null);
  };

  return (
    <div className="w-72 border-l border-border bg-card/90 backdrop-blur-md flex flex-col shrink-0 select-none overflow-hidden animate-in slide-in-from-right-4 duration-150">
      {/* Header */}
      <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-card/60">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Layers &amp; Objects ({slide.objects.length})
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedObjects.length > 0 ? (
          sortedObjects.map((obj, idx) => {
            const isSelected = selectedObjectId === obj.id;
            const displayName =
              obj.name ||
              (obj.type === 'text'
                ? obj.content.slice(0, 20) || 'Text Box'
                : `${obj.type.toUpperCase()} Element`);

            return (
              <div
                key={obj.id}
                onClick={() => onSelectObject(obj.id)}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all cursor-pointer group ${
                  isSelected
                    ? 'border-primary ring-1 ring-primary bg-primary/10 shadow-sm'
                    : 'border-border/60 hover:border-border hover:bg-accent/40 bg-background/50'
                } ${obj.isHidden ? 'opacity-40' : ''}`}
              >
                {/* Left icon & name */}
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                  <span className="shrink-0">{getObjectIcon(obj.type)}</span>

                  {editingId === obj.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(obj.id);
                          else if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="w-full text-xs bg-background border border-primary rounded px-1 py-0.5 outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(obj.id)}
                        className="p-0.5 hover:text-emerald-400"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <span
                      onDoubleClick={() => handleStartRename(obj)}
                      className="truncate font-medium text-foreground"
                    >
                      {displayName}
                    </span>
                  )}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                  {/* Reorder buttons */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBringForward(obj.id);
                    }}
                    disabled={idx === 0}
                    className="p-1 hover:text-foreground disabled:opacity-20 rounded"
                    title="Bring Forward"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendBackward(obj.id);
                    }}
                    disabled={idx === sortedObjects.length - 1}
                    className="p-1 hover:text-foreground disabled:opacity-20 rounded"
                    title="Send Backward"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {/* Lock toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateObject(obj.id, { isLocked: !obj.isLocked });
                    }}
                    className={`p-1 rounded hover:bg-accent ${
                      obj.isLocked ? 'text-amber-400' : 'hover:text-foreground'
                    }`}
                    title={obj.isLocked ? 'Unlock Object' : 'Lock Object'}
                  >
                    {obj.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </button>

                  {/* Hide toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateObject(obj.id, { isHidden: !obj.isHidden });
                    }}
                    className={`p-1 rounded hover:bg-accent ${
                      obj.isHidden ? 'text-rose-400' : 'hover:text-foreground'
                    }`}
                    title={obj.isHidden ? 'Unhide Object' : 'Hide Object'}
                  >
                    {obj.isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteObject(obj.id);
                    }}
                    className="p-1 hover:text-destructive rounded"
                    title="Delete Object"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No objects on this slide. Use the Insert menu to add text, shapes, tables, or charts.
          </div>
        )}
      </div>

      {/* Layer quick order actions */}
      {selectedObjectId && (
        <div className="p-2 border-t border-border bg-card/60 grid grid-cols-2 gap-1 text-[10px] font-bold">
          <button
            onClick={() => onBringToFront(selectedObjectId)}
            className="px-2 py-1.5 rounded-lg bg-accent/60 hover:bg-accent text-foreground text-center"
          >
            Bring to Front
          </button>
          <button
            onClick={() => onSendToBack(selectedObjectId)}
            className="px-2 py-1.5 rounded-lg bg-accent/60 hover:bg-accent text-foreground text-center"
          >
            Send to Back
          </button>
        </div>
      )}
    </div>
  );
}
