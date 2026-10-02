import React, { useState } from 'react';
import { DocShapeElement } from '../types';
import { Move, RotateCw, Trash2 } from 'lucide-react';

interface MasterDocsShapesLayerProps {
  shapes: DocShapeElement[];
  onUpdateShapes: (shapes: DocShapeElement[]) => void;
  isReadOnly?: boolean;
}

export function MasterDocsShapesLayer({
  shapes = [],
  onUpdateShapes,
  isReadOnly = false,
}: MasterDocsShapesLayerProps) {
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  if (shapes.length === 0) return null;

  const handleDragStart = (id: string, e: React.DragEvent) => {
    if (isReadOnly) return;
    e.dataTransfer.setData('shape-id', id);
  };

  const handleDeleteShape = (id: string) => {
    onUpdateShapes(shapes.filter((s) => s.id !== id));
    setSelectedShapeId(null);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {shapes.map((shape) => {
        const isSelected = shape.id === selectedShapeId;

        return (
          <div
            key={shape.id}
            onClick={(e) => {
              e.stopPropagation();
              if (!isReadOnly) setSelectedShapeId(shape.id);
            }}
            style={{
              position: 'absolute',
              top: `${shape.y}px`,
              left: `${shape.x}px`,
              width: `${shape.width}px`,
              height: `${shape.height}px`,
              zIndex: shape.zIndex,
              transform: shape.rotation ? `rotate(${shape.rotation}deg)` : 'none',
              pointerEvents: 'auto',
            }}
            className={`group select-none transition-shadow ${
              isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
            }`}
          >
            {/* Shape Body Rendering */}
            {shape.type === 'rectangle' && (
              <div
                style={{
                  backgroundColor: shape.fillColor,
                  border: `${shape.strokeWidth}px solid ${shape.strokeColor}`,
                }}
                className="w-full h-full rounded-sm flex items-center justify-center p-2 text-xs font-semibold"
              >
                {shape.text}
              </div>
            )}

            {shape.type === 'rounded' && (
              <div
                style={{
                  backgroundColor: shape.fillColor,
                  border: `${shape.strokeWidth}px solid ${shape.strokeColor}`,
                }}
                className="w-full h-full rounded-2xl flex items-center justify-center p-2 text-xs font-semibold"
              >
                {shape.text}
              </div>
            )}

            {shape.type === 'circle' && (
              <div
                style={{
                  backgroundColor: shape.fillColor,
                  border: `${shape.strokeWidth}px solid ${shape.strokeColor}`,
                }}
                className="w-full h-full rounded-full flex items-center justify-center p-2 text-xs font-semibold"
              >
                {shape.text}
              </div>
            )}

            {shape.type === 'textbox' && (
              <div
                style={{
                  backgroundColor: shape.fillColor || 'transparent',
                  border: `${shape.strokeWidth}px dashed ${shape.strokeColor}`,
                  color: shape.textColor || 'inherit',
                  fontSize: shape.fontSize ? `${shape.fontSize}px` : '13px',
                }}
                className="w-full h-full p-3 rounded-lg flex items-center justify-center text-center font-medium"
              >
                {shape.text || 'Type in text box'}
              </div>
            )}

            {shape.type === 'callout' && (
              <div
                style={{
                  backgroundColor: shape.fillColor,
                  border: `${shape.strokeWidth}px solid ${shape.strokeColor}`,
                }}
                className="w-full h-full rounded-xl p-3 shadow-md flex items-center justify-center text-xs font-bold"
              >
                {shape.text || 'Callout Note'}
              </div>
            )}

            {/* Selected Shape Controls */}
            {isSelected && !isReadOnly && (
              <div className="absolute -top-7 right-0 flex items-center gap-1 bg-card border border-border shadow-md rounded-lg p-0.5 z-20">
                <button
                  onClick={() => handleDeleteShape(shape.id)}
                  className="p-1 rounded text-destructive hover:bg-destructive/10"
                  title="Delete Shape"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
