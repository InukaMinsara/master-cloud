export type CanvasAppType = 
  | 'docs' 
  | 'sheets' 
  | 'slides' 
  | 'forms' 
  | 'draw' 
  | 'notes' 
  | 'word'
  | 'excel'
  | 'onenote'
  | 'pics' 
  | 'vids'
  | 'ai';

// 1. MASTER DOCS & MASTER WORD (Shared Document Core)
export interface CanvasDocData {
  title: string;
  content: string; // Markdown or HTML
  version: number;
  wordCount: number;
  charCount: number;
  lastSavedAt: string;
  pageLayout?: {
    size: 'A4' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
    margins: 'normal' | 'narrow' | 'wide';
    headerText?: string;
    footerText?: string;
  };
  comments?: Array<{
    id: string;
    author: string;
    text: string;
    createdAt: string;
  }>;
}

// 2. MASTER SHEETS
export interface SheetCell {
  value: string;
  formula?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  bgColor?: string;
  textColor?: string;
}

export interface CanvasSheetData {
  title: string;
  rows: number;
  cols: number;
  cells: Record<string, SheetCell>; // key is e.g. "A1", "B4"
  colWidths?: Record<number, number>;
  activeSheetName: string;
  sheets: string[];
  lastSavedAt: string;
}

// 3. MASTER SLIDES
export interface SlideElement {
  id: string;
  type: 'title' | 'text' | 'bullet' | 'shape' | 'image';
  content: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  bgColor?: string;
}

export interface SlideItem {
  id: string;
  title: string;
  layout: 'title' | 'title-content' | 'two-columns' | 'stat-quote' | 'blank';
  elements: SlideElement[];
  bgTheme: 'dark' | 'light' | 'ocean' | 'corporate' | 'midnight';
}

export interface CanvasSlideData {
  title: string;
  slides: SlideItem[];
  activeSlideIndex: number;
  lastSavedAt: string;
}

// 4. MASTER FORMS
export interface FormQuestion {
  id: string;
  title: string;
  type: 'short-text' | 'paragraph' | 'multiple-choice' | 'checkbox' | 'dropdown' | 'rating';
  options?: string[];
  required: boolean;
}

export interface FormResponse {
  id: string;
  submittedAt: string;
  answers: Record<string, any>;
}

export interface CanvasFormData {
  title: string;
  description: string;
  questions: FormQuestion[];
  responses: FormResponse[];
  isAcceptingResponses: boolean;
  lastSavedAt: string;
}

// 5. MASTER DRAW
export interface DrawElement {
  id: string;
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'freehand' | 'text' | 'sticky';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[]; // For freehand
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  text?: string;
}

export interface CanvasDrawData {
  title: string;
  elements: DrawElement[];
  backgroundColor: string;
  lastSavedAt: string;
}

// 6. MASTER NOTES
export interface NoteChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NotePage {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  tags: string[];
  checklist: NoteChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteSection {
  id: string;
  name: string;
  color: string;
  pages: NotePage[];
}

export interface CanvasNotesData {
  title: string;
  activeNotebookName: string;
  sections: NoteSection[];
  lastSavedAt: string;
}

// 7. MASTER PICS STUDIO
export interface GeneratedPic {
  id: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:2';
  style: string;
  imageUrl: string;
  createdAt: string;
  cloudFileId?: string;
}

// 8. MASTER VIDS STUDIO
export interface VideoScene {
  id: string;
  sceneNumber: number;
  description: string;
  cameraMovement: 'static' | 'pan-left' | 'pan-right' | 'zoom-in' | 'orbit';
  durationSeconds: number;
}

export interface GeneratedVid {
  id: string;
  title: string;
  prompt: string;
  scenes: VideoScene[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  fps: 24 | 30 | 60;
  durationSeconds: number;
  videoUrl: string;
  thumbnailUrl: string;
  status: 'rendering' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  cloudFileId?: string;
}
