import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Palette,
  Square,
  Circle,
  Minus,
  ArrowRight,
  PenTool,
  Type,
  StickyNote,
  Eraser,
  Undo2,
  Redo2,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Save,
  MousePointer,
} from 'lucide-react';
import { CanvasDrawData, DrawElement } from '@/types/canvas';
import { CanvasService } from '@/services/canvasService';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';

interface MasterDrawEditorProps {
  initialFile?: FileItem | null;
  initialData?: CanvasDrawData | null;
  onSave?: (data: CanvasDrawData) => Promise<void>;
}

type ToolMode = 'select' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'freehand' | 'sticky' | 'eraser';

const COLOR_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ffffff', // White
  '#94a3b8', // Slate
];

export function MasterDrawEditor({ initialFile, initialData, onSave }: MasterDrawEditorProps) {
  const navigate = useNavigate();
  const [drawData, setDrawData] = useState<CanvasDrawData>(() => initialData || CanvasService.getDefaultDrawData());
  const [tool, setTool] = useState<ToolMode>('rectangle');
  const [strokeColor, setStrokeColor] = useState<string>('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStart, setCurrentStart] = useState<{ x: number; y: number } | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<{ x: number; y: number }[]>([]);
  const [history, setHistory] = useState<DrawElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<SVGSVGElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (initialData) {
      setDrawData(initialData);
      setHistory([initialData.elements]);
      setHistoryIndex(0);
    }
  }, [initialData]);

  // Debounced auto-save
  const triggerAutoSave = (updated: CanvasDrawData) => {
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
          toast.error('Failed to save drawing');
        }
      }
    }, 1500);
  };

  const handleTitleChange = (newTitle: string) => {
    const updated = { ...drawData, title: newTitle };
    setDrawData(updated);
    triggerAutoSave(updated);
  };

  const getCanvasCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = canvasRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setCurrentStart(coords);

    if (tool === 'freehand') {
      setFreehandPoints([coords]);
    } else if (tool === 'eraser') {
      // Find element under cursor and remove
      removeElementAt(coords.x, coords.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);

    if (tool === 'freehand') {
      setFreehandPoints(prev => [...prev, coords]);
    } else if (tool === 'eraser') {
      removeElementAt(coords.x, coords.y);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentStart) return;
    const coords = getCanvasCoords(e);
    setIsDrawing(false);

    let newElement: DrawElement | null = null;
    const width = Math.abs(coords.x - currentStart.x);
    const height = Math.abs(coords.y - currentStart.y);
    const x = Math.min(coords.x, currentStart.x);
    const y = Math.min(coords.y, currentStart.y);

    if (tool === 'rectangle' && width > 5 && height > 5) {
      newElement = {
        id: 'el-' + Date.now(),
        type: 'rectangle',
        x,
        y,
        width,
        height,
        strokeColor,
        fillColor: `${strokeColor}20`,
        strokeWidth,
      };
    } else if (tool === 'ellipse' && width > 5 && height > 5) {
      newElement = {
        id: 'el-' + Date.now(),
        type: 'ellipse',
        x,
        y,
        width,
        height,
        strokeColor,
        fillColor: `${strokeColor}20`,
        strokeWidth,
      };
    } else if (tool === 'line' && (width > 5 || height > 5)) {
      newElement = {
        id: 'el-' + Date.now(),
        type: 'line',
        x: currentStart.x,
        y: currentStart.y,
        width: coords.x - currentStart.x,
        height: coords.y - currentStart.y,
        strokeColor,
        strokeWidth,
      };
    } else if (tool === 'arrow' && (width > 5 || height > 5)) {
      newElement = {
        id: 'el-' + Date.now(),
        type: 'arrow',
        x: currentStart.x,
        y: currentStart.y,
        width: coords.x - currentStart.x,
        height: coords.y - currentStart.y,
        strokeColor,
        strokeWidth,
      };
    } else if (tool === 'freehand' && freehandPoints.length > 2) {
      newElement = {
        id: 'el-' + Date.now(),
        type: 'freehand',
        x: 0,
        y: 0,
        points: freehandPoints,
        strokeColor,
        strokeWidth,
      };
      setFreehandPoints([]);
    } else if (tool === 'sticky') {
      const noteText = prompt('Enter note text:') || 'Note';
      newElement = {
        id: 'el-' + Date.now(),
        type: 'sticky',
        x: coords.x,
        y: coords.y,
        width: 160,
        height: 100,
        strokeColor: '#f59e0b',
        fillColor: '#fef3c7',
        strokeWidth: 1,
        text: noteText,
      };
    }

    if (newElement) {
      const updatedElements = [...drawData.elements, newElement];
      updateElementsWithHistory(updatedElements);
    }
  };

  const removeElementAt = (x: number, y: number) => {
    // Delete topmost element containing x,y
    const found = [...drawData.elements].reverse().find(el => {
      if (el.width && el.height) {
        return x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height;
      }
      return false;
    });
    if (found) {
      const updated = drawData.elements.filter(el => el.id !== found.id);
      updateElementsWithHistory(updated);
    }
  };

  const updateElementsWithHistory = (newElements: DrawElement[]) => {
    const updated = { ...drawData, elements: newElements };
    setDrawData(updated);
    triggerAutoSave(updated);

    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newElements]);
    setHistoryIndex(newHistory.length);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const prevElements = history[prevIdx];
      setHistoryIndex(prevIdx);
      const updated = { ...drawData, elements: prevElements };
      setDrawData(updated);
      triggerAutoSave(updated);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextElements = history[nextIdx];
      setHistoryIndex(nextIdx);
      const updated = { ...drawData, elements: nextElements };
      setDrawData(updated);
      triggerAutoSave(updated);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all drawings on this canvas?')) {
      updateElementsWithHistory([]);
      toast.success('Canvas cleared');
    }
  };

  const exportSVG = () => {
    const svgEl = canvasRef.current;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    CanvasService.exportToLocalFile(`${drawData.title}.svg`, svgData, 'image/svg+xml');
    toast.success('Drawing exported as SVG');
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground select-none">
      {/* Top Header */}
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
            <div className="h-8 w-8 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-500">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <input
                type="text"
                value={drawData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="font-bold text-sm bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none px-1 py-0.5 max-w-xs transition-colors"
                placeholder="Untitled Diagram"
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
                  <span className="flex items-center gap-1 text-muted-foreground">Unsaved edits</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-accent text-muted-foreground disabled:opacity-30"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-accent text-muted-foreground disabled:opacity-30"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="Clear Canvas"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={exportSVG}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border/80 hover:bg-accent text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export SVG</span>
          </button>
        </div>
      </header>

      {/* Floating Toolbar */}
      <div className="h-11 border-b border-border/50 px-4 flex items-center justify-between bg-card/20 shrink-0">
        {/* Tool selectors */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
          <button
            onClick={() => setTool('rectangle')}
            className={`p-1.5 rounded-lg ${tool === 'rectangle' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title="Rectangle"
          >
            <Square className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool('ellipse')}
            className={`p-1.5 rounded-lg ${tool === 'ellipse' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title="Ellipse"
          >
            <Circle className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool('line')}
            className={`p-1.5 rounded-lg ${tool === 'line' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title="Line"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool('arrow')}
            className={`p-1.5 rounded-lg ${tool === 'arrow' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title="Arrow"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool('freehand')}
            className={`p-1.5 rounded-lg ${tool === 'freehand' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title="Pen / Freehand"
          >
            <PenTool className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool('sticky')}
            className={`p-1.5 rounded-lg ${tool === 'sticky' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title="Sticky Note"
          >
            <StickyNote className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-lg ${tool === 'eraser' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title="Eraser"
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>

        {/* Colors & Width */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setStrokeColor(c)}
                style={{ backgroundColor: c }}
                className={`h-4 w-4 rounded-full border transition-transform ${strokeColor === c ? 'scale-125 border-primary ring-2 ring-primary/40' : 'border-border/60 hover:scale-110'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
            {[1, 2, 4, 6].map(w => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${strokeWidth === w ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Board */}
      <div className="flex-1 overflow-hidden bg-slate-950 relative cursor-crosshair">
        <svg
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Grid pattern background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
            </pattern>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Render Elements */}
          {drawData.elements.map(el => {
            if (el.type === 'rectangle') {
              return (
                <g key={el.id}>
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    stroke={el.strokeColor}
                    fill={el.fillColor || 'transparent'}
                    strokeWidth={el.strokeWidth}
                    rx="8"
                  />
                  {el.text && (
                    <text
                      x={el.x + (el.width || 0) / 2}
                      y={el.y + (el.height || 0) / 2 + 4}
                      fill={el.strokeColor}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {el.text}
                    </text>
                  )}
                </g>
              );
            }
            if (el.type === 'ellipse') {
              return (
                <ellipse
                  key={el.id}
                  cx={el.x + (el.width || 0) / 2}
                  cy={el.y + (el.height || 0) / 2}
                  rx={(el.width || 0) / 2}
                  ry={(el.height || 0) / 2}
                  stroke={el.strokeColor}
                  fill={el.fillColor || 'transparent'}
                  strokeWidth={el.strokeWidth}
                />
              );
            }
            if (el.type === 'line') {
              return (
                <line
                  key={el.id}
                  x1={el.x}
                  y1={el.y}
                  x2={el.x + (el.width || 0)}
                  y2={el.y + (el.height || 0)}
                  stroke={el.strokeColor}
                  strokeWidth={el.strokeWidth}
                />
              );
            }
            if (el.type === 'arrow') {
              return (
                <line
                  key={el.id}
                  x1={el.x}
                  y1={el.y}
                  x2={el.x + (el.width || 0)}
                  y2={el.y + (el.height || 0)}
                  stroke={el.strokeColor}
                  strokeWidth={el.strokeWidth}
                  markerEnd="url(#arrowhead)"
                />
              );
            }
            if (el.type === 'freehand' && el.points && el.points.length > 1) {
              const d = el.points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
              return (
                <path
                  key={el.id}
                  d={d}
                  fill="none"
                  stroke={el.strokeColor}
                  strokeWidth={el.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }
            if (el.type === 'sticky') {
              return (
                <g key={el.id}>
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill={el.fillColor || '#fef3c7'}
                    stroke={el.strokeColor}
                    strokeWidth={el.strokeWidth}
                    rx="6"
                    className="drop-shadow-lg"
                  />
                  <text
                    x={el.x + 12}
                    y={el.y + 24}
                    fill="#1e293b"
                    fontSize="12"
                    fontWeight="500"
                    width={140}
                  >
                    {el.text}
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* Current freehand drawing line */}
          {tool === 'freehand' && freehandPoints.length > 1 && (
            <path
              d={freehandPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
