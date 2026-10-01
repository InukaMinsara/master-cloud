import { LucideIcon, FileText, FileSpreadsheet, Presentation, CheckSquare, Palette, BookOpen, Image as ImageIcon, Video, Bot, Sparkles, FileCode } from 'lucide-react';
import { CanvasAppType } from '@/types/canvas';

export interface MasterModuleDefinition {
  id: CanvasAppType;
  name: string;
  tagline: string;
  description: string;
  icon: any;
  color: string;
  route: string;
  fileExtensions: string[];
  mimeTypes: string[];
  capabilities: string[];
  contextActions: {
    id: string;
    label: string;
    icon?: any;
    action: string;
  }[];
  defaultFileName: string;
}

export class MasterModuleRegistry {
  private static modules: Map<CanvasAppType, MasterModuleDefinition> = new Map();

  static register(module: MasterModuleDefinition) {
    this.modules.set(module.id, module);
  }

  static get(id: CanvasAppType): MasterModuleDefinition | undefined {
    return this.modules.get(id);
  }

  static getAll(): MasterModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  static getByExtension(ext: string): MasterModuleDefinition | undefined {
    const cleanExt = ext.toLowerCase().replace(/^\./, '');
    for (const mod of this.modules.values()) {
      if (mod.fileExtensions.includes(cleanExt)) {
        return mod;
      }
    }
    return undefined;
  }

  static getByMimeType(mime: string): MasterModuleDefinition | undefined {
    const cleanMime = mime.toLowerCase();
    for (const mod of this.modules.values()) {
      if (mod.mimeTypes.includes(cleanMime)) {
        return mod;
      }
    }
    return undefined;
  }
}

// Register all core Master Applications
MasterModuleRegistry.register({
  id: 'docs',
  name: 'Master Docs',
  tagline: 'Document Processor & Markdown Workspace',
  description: 'Rich text processing with markdown formatting, headings, tables, links, comments, autosave, and export.',
  icon: FileText,
  color: '#3b82f6',
  route: '/canvas/docs',
  fileExtensions: ['mdoc', 'md', 'txt'],
  mimeTypes: ['application/x-master-doc', 'text/markdown', 'text/plain'],
  capabilities: ['rich-text', 'markdown', 'tables', 'comments', 'version-history', 'export-pdf', 'export-md'],
  contextActions: [
    { id: 'open-docs', label: 'Open in Master Docs', action: 'open' },
    { id: 'summarize-docs', label: 'Summarize with Master AI', action: 'ai-summarize' },
    { id: 'export-docs', label: 'Export Document', action: 'export' },
  ],
  defaultFileName: 'Untitled Document.mdoc',
});

MasterModuleRegistry.register({
  id: 'word',
  name: 'Master Word',
  tagline: 'Professional Word Processing Suite',
  description: 'Full-featured document processor supporting page layouts, headers, footers, styles, and .docx compatibility.',
  icon: FileText,
  color: '#2563eb',
  route: '/canvas/word',
  fileExtensions: ['docx', 'doc', 'mword'],
  mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
  capabilities: ['page-layout', 'headers-footers', 'styles', 'tables', 'docx-import-export'],
  contextActions: [
    { id: 'open-word', label: 'Open in Master Word', action: 'open' },
    { id: 'summarize-word', label: 'Summarize with Master AI', action: 'ai-summarize' },
  ],
  defaultFileName: 'Document.docx',
});

MasterModuleRegistry.register({
  id: 'sheets',
  name: 'Master Sheets',
  tagline: 'High-Performance Grid & Formula Spreadsheet',
  description: 'Virtual grid computation engine supporting arithmetic, =SUM, =AVERAGE, sorting, filtering, cell styling, and CSV/XLSX.',
  icon: FileSpreadsheet,
  color: '#10b981',
  route: '/canvas/sheets',
  fileExtensions: ['msheet', 'csv'],
  mimeTypes: ['application/x-master-sheet', 'text/csv'],
  capabilities: ['formulas', 'grid-virtualization', 'sorting', 'filtering', 'freeze-panes', 'multi-sheet', 'csv-import-export'],
  contextActions: [
    { id: 'open-sheets', label: 'Open in Master Sheets', action: 'open' },
    { id: 'analyze-sheets', label: 'Analyze with Master AI', action: 'ai-analyze' },
  ],
  defaultFileName: 'Untitled Spreadsheet.msheet',
});

MasterModuleRegistry.register({
  id: 'excel',
  name: 'Master Excel',
  tagline: 'Advanced Excel Analytics & Workbook Suite',
  description: 'Enterprise spreadsheet workspace using the core grid calculation engine with full .xlsx compatibility.',
  icon: FileSpreadsheet,
  color: '#059669',
  route: '/canvas/excel',
  fileExtensions: ['xlsx', 'xls', 'mexcel'],
  mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
  capabilities: ['advanced-formulas', 'workbooks', 'data-tables', 'xlsx-import-export'],
  contextActions: [
    { id: 'open-excel', label: 'Open in Master Excel', action: 'open' },
    { id: 'analyze-excel', label: 'Formula Assistant with Master AI', action: 'ai-analyze' },
  ],
  defaultFileName: 'Workbook.xlsx',
});

MasterModuleRegistry.register({
  id: 'slides',
  name: 'Master Slides',
  tagline: 'Modern Pitch Deck & Slide Studio',
  description: 'Interactive presentation deck builder with customizable layouts, rich elements, speaker notes, and presentation mode.',
  icon: Presentation,
  color: '#f59e0b',
  route: '/canvas/slides',
  fileExtensions: ['mslide', 'pptx', 'ppt'],
  mimeTypes: ['application/x-master-slide', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  capabilities: ['slide-deck', 'layouts', 'speaker-notes', 'presentation-mode', 'themes'],
  contextActions: [
    { id: 'open-slides', label: 'Open in Master Slides', action: 'open' },
    { id: 'present-slides', label: 'Start Presentation', action: 'present' },
  ],
  defaultFileName: 'Untitled Presentation.mslide',
});

MasterModuleRegistry.register({
  id: 'forms',
  name: 'Master Forms',
  tagline: 'Interactive Questionnaire & Survey Builder',
  description: 'Responsive multi-field form creation with live responder mode, real-time analytics, and automatic cloud response storage.',
  icon: CheckSquare,
  color: '#8b5cf6',
  route: '/canvas/forms',
  fileExtensions: ['mform'],
  mimeTypes: ['application/x-master-form'],
  capabilities: ['questionnaire', 'responder-view', 'analytics', 'response-export', 'multiple-field-types'],
  contextActions: [
    { id: 'open-forms', label: 'Open in Master Forms', action: 'open' },
    { id: 'view-responses', label: 'View Form Responses', action: 'responses' },
  ],
  defaultFileName: 'Untitled Form.mform',
});

MasterModuleRegistry.register({
  id: 'draw',
  name: 'Master Draw',
  tagline: 'Vector Whiteboard & Diagram Studio',
  description: 'Vector diagramming and sketching with shapes, arrows, connectors, text, sticky notes, layers, grid, and SVG export.',
  icon: Palette,
  color: '#ec4899',
  route: '/canvas/draw',
  fileExtensions: ['mdraw', 'svg'],
  mimeTypes: ['application/x-master-draw', 'image/svg+xml'],
  capabilities: ['vector-shapes', 'freehand', 'connectors', 'sticky-notes', 'svg-export', 'layers'],
  contextActions: [
    { id: 'open-draw', label: 'Open in Master Draw', action: 'open' },
    { id: 'export-svg', label: 'Export as SVG', action: 'export-svg' },
  ],
  defaultFileName: 'Untitled Diagram.mdraw',
});

MasterModuleRegistry.register({
  id: 'notes',
  name: 'Master Notes',
  tagline: 'OneNote-Style Hierarchical Notebook',
  description: 'Notebook > Section > Page hierarchy with interactive to-do checklists, tags, pinned notes, and cloud synchronization.',
  icon: BookOpen,
  color: '#6366f1',
  route: '/canvas/notes',
  fileExtensions: ['mnote'],
  mimeTypes: ['application/x-master-note'],
  capabilities: ['notebooks', 'sections', 'pages', 'checklists', 'tags', 'pinning'],
  contextActions: [
    { id: 'open-notes', label: 'Open in Master Notes', action: 'open' },
  ],
  defaultFileName: 'Master Notebook.mnote',
});

MasterModuleRegistry.register({
  id: 'onenote',
  name: 'Master OneNote',
  tagline: 'Dedicated Notebook Workspace',
  description: 'Rich multi-section notebook organizer with drawing blocks, rich media attachments, and structured thought outlines.',
  icon: BookOpen,
  color: '#7c3aed',
  route: '/canvas/onenote',
  fileExtensions: ['monenote', 'one'],
  mimeTypes: ['application/x-master-onenote'],
  capabilities: ['notebooks', 'sections', 'pages', 'media-blocks', 'checklists'],
  contextActions: [
    { id: 'open-onenote', label: 'Open in Master OneNote', action: 'open' },
  ],
  defaultFileName: 'Notebook.monenote',
});

MasterModuleRegistry.register({
  id: 'pics',
  name: 'Master Pics Studio',
  tagline: 'AI Image Synthesis & Asset Studio',
  description: 'Generative AI visual studio with semantic prompt synthesizer, style presets, aspect ratios, filters, and cloud saving.',
  icon: ImageIcon,
  color: '#06b6d4',
  route: '/canvas/pics',
  fileExtensions: ['png', 'jpg', 'jpeg', 'webp'],
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  capabilities: ['image-synthesis', 'style-presets', 'aspect-ratios', 'color-grading', 'save-to-cloud'],
  contextActions: [
    { id: 'open-pics', label: 'Open in Master Pics', action: 'open' },
    { id: 'generate-variation', label: 'Generate Variation with Master Pics', action: 'variation' },
  ],
  defaultFileName: 'Generated Asset.png',
});

MasterModuleRegistry.register({
  id: 'vids',
  name: 'Master Vids Studio',
  tagline: 'AI Video Storyboard & Director Studio',
  description: 'AI Video Director and multi-scene storyboard composer with camera movement paths, framerate control, and video rendering.',
  icon: Video,
  color: '#ef4444',
  route: '/canvas/vids',
  fileExtensions: ['mp4', 'webm', 'mov'],
  mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  capabilities: ['storyboard-scenes', 'camera-movement', 'temporal-render', 'save-to-cloud', 'video-player'],
  contextActions: [
    { id: 'open-vids', label: 'Open in Master Vids', action: 'open' },
    { id: 'storyboard', label: 'Create Storyboard with Master Vids', action: 'storyboard' },
  ],
  defaultFileName: 'Storyboard Project.mp4',
});
