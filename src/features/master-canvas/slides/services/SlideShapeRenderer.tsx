import React from 'react';
import {
  MasterSlideObject,
  ShapeKind,
  SlideLayoutKind,
  SlideThemeConfig,
} from '../types';

export interface SlideLayoutDefinition {
  id: SlideLayoutKind;
  label: string;
  description: string;
}

export const POWERPOINT_LAYOUTS: SlideLayoutDefinition[] = [
  { id: 'title', label: 'Title Slide', description: 'Centered deck title and subtitle' },
  { id: 'title-content', label: 'Title and Content', description: 'Top heading with body bullets' },
  { id: 'section-header', label: 'Section Header', description: 'Divider slide for new topics' },
  { id: 'two-columns', label: 'Two Content', description: 'Side-by-side content placeholders' },
  { id: 'comparison', label: 'Comparison', description: 'Labeled two-column comparison' },
  { id: 'image-text', label: 'Content with Caption', description: 'Left caption with visual frame' },
  { id: 'quote', label: 'Quote with Caption', description: 'Featured quotation & attribution' },
  { id: 'big-stat', label: 'Big Statistic', description: 'Large KPI metric spotlight' },
  { id: 'table-focus', label: 'Table Focus', description: 'Title with structured data table' },
  { id: 'chart-focus', label: 'Chart Focus', description: 'Title with editable column chart' },
  { id: 'blank', label: 'Blank', description: 'Empty canvas with no placeholders' },
];

export const PLACEHOLDER_STRINGS = new Set([
  'Click to add title',
  'Click to add subtitle',
  'Click to add text',
  'Click to add left content',
  'Click to add right content',
  'Click to add section header',
  'Click to add caption',
]);

export function createDefaultTableData(rows = 4, cols = 4) {
  const safeRows = Math.max(2, Math.min(10, rows));
  const safeCols = Math.max(2, Math.min(8, cols));
  const cells: string[][] = [];
  for (let r = 0; r < safeRows; r++) {
    const row: string[] = [];
    for (let c = 0; c < safeCols; c++) {
      if (r === 0) {
        row.push(c === 0 ? 'Item' : `Column ${c + 1}`);
      } else {
        row.push(c === 0 ? `Row ${r}` : `${(r * 12 + c * 7) % 95}%`);
      }
    }
    cells.push(row);
  }
  return { rows: safeRows, cols: safeCols, cells };
}

export function createDefaultChartData(
  chartType: 'column' | 'bar' | 'line' | 'area' | 'pie' | 'doughnut' = 'column'
) {
  return {
    type: chartType,
    title: 'Quarterly Performance Metrics',
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    values: [42, 68, 84, 96],
    colors: ['#156082', '#E97132', '#196B24', '#0F9ED5'],
  };
}

export function buildSlideLayoutObjects(
  layout: SlideLayoutKind,
  theme: SlideThemeConfig
): MasterSlideObject[] {
  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const fontHeading = `'Aptos Display', ${theme.fontFamily}`;
  const fontBody = theme.fontFamily || "'Aptos', 'Segoe UI', sans-serif";
  const textColor = theme.textColor || '#0E2841';
  const subColor = theme.subtextColor || '#595959';
  const accent = theme.accentColor || '#156082';

  switch (layout) {
    case 'title':
      return [
        {
          id: `obj-title-${uid()}`,
          name: 'Title Placeholder',
          type: 'text',
          content: 'Click to add title',
          x: 10,
          y: 28,
          width: 80,
          height: 18,
          zIndex: 1,
          format: {
            bold: true,
            fontSize: 44,
            fontFamily: fontHeading,
            textColor,
            align: 'center',
            verticalAlign: 'middle',
          },
        },
        {
          id: `obj-sub-${uid()}`,
          name: 'Subtitle Placeholder',
          type: 'text',
          content: 'Click to add subtitle',
          x: 16,
          y: 50,
          width: 68,
          height: 14,
          zIndex: 2,
          format: {
            fontSize: 20,
            fontFamily: fontBody,
            textColor: subColor,
            align: 'center',
            verticalAlign: 'top',
          },
        },
      ];

    case 'section-header':
      return [
        {
          id: `obj-bar-${uid()}`,
          name: 'Section Accent',
          type: 'shape',
          shapeKind: 'rectangle',
          content: '',
          x: 8,
          y: 35,
          width: 1.4,
          height: 28,
          zIndex: 1,
          format: { fillColor: accent, borderRadius: 2 },
        },
        {
          id: `obj-sec-title-${uid()}`,
          name: 'Section Header',
          type: 'text',
          content: 'Click to add section header',
          x: 12,
          y: 34,
          width: 78,
          height: 16,
          zIndex: 2,
          format: {
            bold: true,
            fontSize: 40,
            fontFamily: fontHeading,
            textColor,
            align: 'left',
            verticalAlign: 'bottom',
          },
        },
        {
          id: `obj-sec-sub-${uid()}`,
          name: 'Section Subtitle',
          type: 'text',
          content: 'Click to add subtitle',
          x: 12,
          y: 52,
          width: 74,
          height: 12,
          zIndex: 3,
          format: { fontSize: 18, fontFamily: fontBody, textColor: subColor, align: 'left' },
        },
      ];

    case 'two-columns':
      return [
        {
          id: `obj-title-${uid()}`,
          name: 'Slide Title',
          type: 'text',
          content: 'Click to add title',
          x: 7,
          y: 7,
          width: 86,
          height: 13,
          zIndex: 1,
          format: { bold: true, fontSize: 32, fontFamily: fontHeading, textColor, align: 'left' },
        },
        {
          id: `obj-left-${uid()}`,
          name: 'Left Content',
          type: 'text',
          content: '• Click to add left content\n• Key supporting insight\n• Implementation detail',
          x: 7,
          y: 24,
          width: 41,
          height: 64,
          zIndex: 2,
          format: {
            fontSize: 18,
            fontFamily: fontBody,
            textColor,
            align: 'left',
            verticalAlign: 'top',
          },
        },
        {
          id: `obj-right-${uid()}`,
          name: 'Right Content',
          type: 'text',
          content: '• Click to add right content\n• Outcome or comparison\n• Target metric',
          x: 52,
          y: 24,
          width: 41,
          height: 64,
          zIndex: 3,
          format: {
            fontSize: 18,
            fontFamily: fontBody,
            textColor,
            align: 'left',
            verticalAlign: 'top',
          },
        },
      ];

    case 'comparison':
      return [
        {
          id: `obj-title-${uid()}`,
          name: 'Slide Title',
          type: 'text',
          content: 'Click to add title',
          x: 7,
          y: 7,
          width: 86,
          height: 13,
          zIndex: 1,
          format: { bold: true, fontSize: 32, fontFamily: fontHeading, textColor, align: 'left' },
        },
        {
          id: `obj-lhdr-${uid()}`,
          name: 'Left Header',
          type: 'text',
          content: 'Option A',
          x: 7,
          y: 23,
          width: 41,
          height: 9,
          zIndex: 2,
          format: {
            bold: true,
            fontSize: 20,
            fontFamily: fontHeading,
            textColor: '#ffffff',
            fillColor: accent,
            borderRadius: 4,
            align: 'center',
            verticalAlign: 'middle',
          },
        },
        {
          id: `obj-rhdr-${uid()}`,
          name: 'Right Header',
          type: 'text',
          content: 'Option B',
          x: 52,
          y: 23,
          width: 41,
          height: 9,
          zIndex: 3,
          format: {
            bold: true,
            fontSize: 20,
            fontFamily: fontHeading,
            textColor: '#ffffff',
            fillColor: '#475569',
            borderRadius: 4,
            align: 'center',
            verticalAlign: 'middle',
          },
        },
        {
          id: `obj-lbody-${uid()}`,
          name: 'Left Comparison',
          type: 'text',
          content: '• Click to add text\n• Key advantage\n• Cost & timeline',
          x: 7,
          y: 35,
          width: 41,
          height: 52,
          zIndex: 4,
          format: { fontSize: 17, fontFamily: fontBody, textColor, align: 'left', verticalAlign: 'top' },
        },
        {
          id: `obj-rbody-${uid()}`,
          name: 'Right Comparison',
          type: 'text',
          content: '• Click to add text\n• Alternative trade-off\n• Estimated impact',
          x: 52,
          y: 35,
          width: 41,
          height: 52,
          zIndex: 5,
          format: { fontSize: 17, fontFamily: fontBody, textColor, align: 'left', verticalAlign: 'top' },
        },
      ];

    case 'image-text':
      return [
        {
          id: `obj-title-${uid()}`,
          name: 'Caption Title',
          type: 'text',
          content: 'Click to add title',
          x: 7,
          y: 12,
          width: 34,
          height: 18,
          zIndex: 1,
          format: { bold: true, fontSize: 28, fontFamily: fontHeading, textColor, align: 'left' },
        },
        {
          id: `obj-cap-${uid()}`,
          name: 'Caption Body',
          type: 'text',
          content: 'Click to add caption describing the visual showcase and supporting takeaway.',
          x: 7,
          y: 33,
          width: 34,
          height: 50,
          zIndex: 2,
          format: { fontSize: 16, fontFamily: fontBody, textColor: subColor, align: 'left', verticalAlign: 'top' },
        },
        {
          id: `obj-frame-${uid()}`,
          name: 'Visual Frame',
          type: 'shape',
          shapeKind: 'rounded',
          content: 'Visual / Diagram Frame',
          x: 45,
          y: 12,
          width: 48,
          height: 75,
          zIndex: 3,
          format: {
            fillColor: accent,
            textColor: '#ffffff',
            fontSize: 18,
            bold: true,
            borderRadius: 10,
          },
        },
      ];

    case 'quote':
      return [
        {
          id: `obj-qmark-${uid()}`,
          name: 'Quote Mark',
          type: 'text',
          content: '“',
          x: 10,
          y: 16,
          width: 12,
          height: 18,
          zIndex: 1,
          format: { bold: true, fontSize: 72, fontFamily: 'Georgia, serif', textColor: accent, align: 'left' },
        },
        {
          id: `obj-qtext-${uid()}`,
          name: 'Quote Text',
          type: 'text',
          content: '“Design is not just what it looks like and feels like. Design is how it works.”',
          x: 12,
          y: 30,
          width: 76,
          height: 30,
          zIndex: 2,
          format: { italic: true, fontSize: 28, fontFamily: 'Georgia, serif', textColor, align: 'left', verticalAlign: 'middle' },
        },
        {
          id: `obj-qauth-${uid()}`,
          name: 'Quote Attribution',
          type: 'text',
          content: '— Speaker Name, Title',
          x: 12,
          y: 64,
          width: 76,
          height: 10,
          zIndex: 3,
          format: { bold: true, fontSize: 16, fontFamily: fontBody, textColor: subColor, align: 'left' },
        },
      ];

    case 'big-stat':
      return [
        {
          id: `obj-title-${uid()}`,
          name: 'Stat Heading',
          type: 'text',
          content: 'Click to add title',
          x: 10,
          y: 10,
          width: 80,
          height: 12,
          zIndex: 1,
          format: { bold: true, fontSize: 28, fontFamily: fontHeading, textColor, align: 'center' },
        },
        {
          id: `obj-stat-${uid()}`,
          name: 'Big KPI Metric',
          type: 'text',
          content: '98.4%',
          x: 15,
          y: 30,
          width: 70,
          height: 28,
          zIndex: 2,
          format: { bold: true, fontSize: 72, fontFamily: fontHeading, textColor: accent, align: 'center', verticalAlign: 'middle' },
        },
        {
          id: `obj-stat-desc-${uid()}`,
          name: 'Metric Explanation',
          type: 'text',
          content: 'Click to add key takeaway explaining what drives this performance milestone.',
          x: 20,
          y: 62,
          width: 60,
          height: 16,
          zIndex: 3,
          format: { fontSize: 18, fontFamily: fontBody, textColor: subColor, align: 'center', verticalAlign: 'top' },
        },
      ];

    case 'table-focus':
      return [
        {
          id: `obj-title-${uid()}`,
          name: 'Table Slide Title',
          type: 'text',
          content: 'Click to add title',
          x: 7,
          y: 7,
          width: 86,
          height: 12,
          zIndex: 1,
          format: { bold: true, fontSize: 30, fontFamily: fontHeading, textColor, align: 'left' },
        },
        {
          id: `obj-tbl-${uid()}`,
          name: 'Data Table',
          type: 'table',
          content: 'Data Table',
          x: 7,
          y: 23,
          width: 86,
          height: 64,
          zIndex: 2,
          tableData: createDefaultTableData(4, 4),
          format: { fontSize: 13 },
        },
      ];

    case 'chart-focus':
      return [
        {
          id: `obj-title-${uid()}`,
          name: 'Chart Slide Title',
          type: 'text',
          content: 'Click to add title',
          x: 7,
          y: 7,
          width: 86,
          height: 12,
          zIndex: 1,
          format: { bold: true, fontSize: 30, fontFamily: fontHeading, textColor, align: 'left' },
        },
        {
          id: `obj-cht-${uid()}`,
          name: 'Performance Chart',
          type: 'chart',
          content: 'Quarterly Performance Metrics',
          x: 10,
          y: 23,
          width: 80,
          height: 64,
          zIndex: 2,
          chartData: createDefaultChartData('column'),
        },
      ];

    case 'blank':
      return [];

    case 'title-content':
    default:
      return [
        {
          id: `obj-title-${uid()}`,
          name: 'Slide Title',
          type: 'text',
          content: 'Click to add title',
          x: 7,
          y: 7,
          width: 86,
          height: 13,
          zIndex: 1,
          format: { bold: true, fontSize: 34, fontFamily: fontHeading, textColor, align: 'left', verticalAlign: 'middle' },
        },
        {
          id: `obj-body-${uid()}`,
          name: 'Content Placeholder',
          type: 'text',
          content: '• Click to add text',
          x: 7,
          y: 23,
          width: 86,
          height: 65,
          zIndex: 2,
          format: { fontSize: 20, fontFamily: fontBody, textColor, align: 'left', verticalAlign: 'top' },
        },
      ];
  }
}

export function SlideShapeSvg({
  shapeKind = 'rectangle',
  fillColor = '#156082',
  strokeColor = 'transparent',
  strokeWidth = 0,
  strokeStyle = 'solid',
  borderRadius = 8,
}: {
  shapeKind?: ShapeKind;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
}) {
  const dashArray =
    strokeStyle === 'dashed' ? '6 4' : strokeStyle === 'dotted' ? '2 3' : undefined;
  const sw = strokeWidth || 0;
  const sc = strokeColor || 'transparent';

  switch (shapeKind) {
    case 'circle':
    case 'ellipse':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <ellipse cx="50" cy="50" rx="48" ry="48" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'triangle':
    case 'process':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <polygon points="50,3 97,96 3,96" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'diamond':
    case 'decision':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <polygon points="50,2 98,50 50,98 2,50" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'arrow':
    case 'arrow-right':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <polygon points="2,28 62,28 62,8 98,50 62,92 62,72 2,72" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'arrow-double':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <polygon points="2,50 28,12 28,32 72,32 72,12 98,50 72,88 72,68 28,68 28,88" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'chevron':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <polygon points="4,8 76,8 96,50 76,92 4,92 22,50" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <polygon points="50,3 63,35 97,38 71,61 79,95 50,77 21,95 29,61 3,38 37,35" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <polygon points="25,4 75,4 97,50 75,96 25,96 3,50" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <path d="M50 90 C20 68 4 50 4 30 C4 14 17 5 31 5 C41 5 47 11 50 18 C53 11 59 5 69 5 C83 5 96 14 96 30 C96 50 80 68 50 90 Z" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'cloud':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <path d="M25 82 H78 C90 82 96 73 96 63 C96 53 89 45 80 44 C78 24 62 12 45 16 C31 19 22 30 20 43 C10 45 4 54 4 64 C4 75 13 82 25 82 Z" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'database':
    case 'cylinder':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <path d="M6 20 C6 8 94 8 94 20 L94 80 C94 92 6 92 6 80 Z" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} vectorEffect="non-scaling-stroke" />
          <ellipse cx="50" cy="20" rx="44" ry="11" fill="rgba(255,255,255,0.18)" stroke={sc === 'transparent' ? 'rgba(255,255,255,0.35)' : sc} strokeWidth={Math.max(1, sw)} vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'callout':
    case 'banner':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
          <path d="M8 6 H92 A5 5 0 0 1 97 11 V68 A5 5 0 0 1 92 73 H42 L20 94 L25 73 H8 A5 5 0 0 1 3 68 V11 A5 5 0 0 1 8 6 Z" fill={fillColor} stroke={sc} strokeWidth={sw} strokeDasharray={dashArray} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case 'rectangle':
      return (
        <div
          style={{
            backgroundColor: fillColor,
            border: sw ? `${sw}px ${strokeStyle} ${sc}` : 'none',
            borderRadius: `${Math.min(borderRadius, 4)}px`,
          }}
          className="w-full h-full"
        />
      );
    case 'rounded':
    default:
      return (
        <div
          style={{
            backgroundColor: fillColor,
            border: sw ? `${sw}px ${strokeStyle} ${sc}` : 'none',
            borderRadius: `${Math.max(borderRadius, 12)}px`,
          }}
          className="w-full h-full"
        />
      );
  }
}

export function SlideChartVisual({
  chartData,
  accentColor = '#156082',
  isDarkTheme = false,
  compact = false,
}: {
  chartData: NonNullable<MasterSlideObject['chartData']>;
  accentColor?: string;
  isDarkTheme?: boolean;
  compact?: boolean;
}) {
  const palette = chartData.colors?.length
    ? chartData.colors
    : [accentColor, '#E97132', '#196B24', '#0F9ED5', '#A02B93'];
  const values = chartData.values.length ? chartData.values : [40, 65, 80];
  const labels = chartData.labels.length ? chartData.labels : values.map((_, i) => `C${i + 1}`);
  const max = Math.max(...values, 1);

  const boxBg = isDarkTheme
    ? 'bg-slate-900/85 border-white/15 text-slate-100'
    : 'bg-white/95 border-slate-200 text-slate-800';
  const subTxt = isDarkTheme ? 'text-slate-300' : 'text-slate-500';
  const axisBorder = isDarkTheme ? 'border-slate-700' : 'border-slate-300';

  if (chartData.type === 'pie' || chartData.type === 'doughnut') {
    const total = values.reduce((a, b) => a + Math.max(0, b), 0) || 1;
    let accum = 0;
    const segments = values.map((v, idx) => {
      const start = (accum / total) * 100;
      accum += Math.max(0, v);
      const end = (accum / total) * 100;
      return `${palette[idx % palette.length]} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
    });

    return (
      <div className={`w-full h-full rounded border p-2.5 flex flex-col justify-between shadow-sm ${boxBg}`}>
        {!compact && (
          <div className="text-[11px] font-semibold truncate text-center">
            {chartData.title || 'Chart'}
          </div>
        )}
        <div className="flex-1 flex items-center justify-center gap-3 min-h-0">
          <div
            className="relative aspect-square h-[82%] max-h-40 rounded-full shrink-0 shadow-inner"
            style={{ background: `conic-gradient(${segments.join(', ')})` }}
          >
            {chartData.type === 'doughnut' && (
              <div
                className={`absolute inset-[28%] rounded-full ${
                  isDarkTheme ? 'bg-slate-900' : 'bg-white'
                }`}
              />
            )}
          </div>
          {!compact && (
            <div className="flex flex-col gap-1 text-[10px] min-w-0">
              {labels.map((lbl, idx) => (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2 w-2 rounded-xs shrink-0"
                    style={{ backgroundColor: palette[idx % palette.length] }}
                  />
                  <span className="truncate font-medium">{lbl}:</span>
                  <span className={subTxt}>{values[idx]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (chartData.type === 'line' || chartData.type === 'area') {
    const pts = values.map((v, idx) => {
      const x = values.length === 1 ? 50 : (idx / (values.length - 1)) * 88 + 6;
      const y = 86 - (Math.max(0, v) / max) * 72;
      return { x, y, v, label: labels[idx] };
    });
    const polylinePts = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPts = `6,86 ${polylinePts} ${pts[pts.length - 1]?.x || 94},86`;

    return (
      <div className={`w-full h-full rounded border p-2.5 flex flex-col justify-between shadow-sm ${boxBg}`}>
        {!compact && (
          <div className="text-[11px] font-semibold truncate">{chartData.title || 'Chart'}</div>
        )}
        <div className="flex-1 min-h-0 relative">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <line x1="6" y1="86" x2="94" y2="86" stroke={isDarkTheme ? '#475569' : '#cbd5e1'} strokeWidth="1" />
            {chartData.type === 'area' && (
              <polygon points={areaPts} fill={accentColor} fillOpacity="0.2" />
            )}
            <polyline fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinejoin="round" points={polylinePts} />
            {pts.map((p, idx) => (
              <circle key={idx} cx={p.x} cy={p.y} r="2.8" fill={accentColor} stroke="#fff" strokeWidth="1" />
            ))}
          </svg>
        </div>
        {!compact && (
          <div className="flex justify-between px-1 text-[9px] font-medium opacity-75">
            {labels.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (chartData.type === 'bar') {
    return (
      <div className={`w-full h-full rounded border p-2.5 flex flex-col justify-between shadow-sm ${boxBg}`}>
        {!compact && (
          <div className="text-[11px] font-semibold truncate mb-1">{chartData.title || 'Chart'}</div>
        )}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-h-0">
          {labels.map((label, idx) => {
            const val = values[idx] || 0;
            const wPct = Math.max(8, (val / max) * 100);
            return (
              <div key={idx} className="flex items-center gap-2 text-[9px]">
                <span className={`w-10 truncate text-right ${subTxt}`}>{label}</span>
                <div className="flex-1 h-3.5 bg-black/[0.06] dark:bg-white/10 rounded-r overflow-hidden flex items-center">
                  <div
                    style={{
                      width: `${wPct}%`,
                      backgroundColor: palette[idx % palette.length],
                    }}
                    className="h-full rounded-r transition-all"
                  />
                </div>
                {!compact && <span className="w-7 text-[9px] font-semibold">{val}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full rounded border p-2.5 flex flex-col justify-between shadow-sm ${boxBg}`}>
      {!compact && (
        <div className="text-[11px] font-semibold truncate mb-1">{chartData.title || 'Chart'}</div>
      )}
      <div className={`flex-1 flex items-end gap-2 px-2 pb-1 border-b ${axisBorder} min-h-0`}>
        {labels.map((label, idx) => {
          const val = values[idx] || 0;
          const heightPercent = Math.max(8, (val / max) * 100);
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
              {!compact && <span className={`text-[9px] font-semibold ${subTxt}`}>{val}</span>}
              <div
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: palette[idx % palette.length],
                }}
                className="w-full max-w-[42px] rounded-t transition-all shadow-xs"
              />
              {!compact && (
                <span className={`text-[9px] truncate w-full text-center ${subTxt}`}>{label}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
