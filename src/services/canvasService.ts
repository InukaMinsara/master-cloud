import { api } from './api';
import { FileItem } from '@/types/file';
import {
  CanvasAppType,
  CanvasDocData,
  CanvasSheetData,
  CanvasSlideData,
  CanvasFormData,
  CanvasDrawData,
  CanvasNotesData,
} from '@/types/canvas';

export const CANVAS_APP_CONFIG: Record<CanvasAppType, {
  name: string;
  ext: string;
  mime: string;
  iconName: string;
  color: string;
  description: string;
}> = {
  docs: {
    name: 'Master Docs',
    ext: 'mdoc',
    mime: 'application/x-master-doc',
    iconName: 'FileText',
    color: '#3b82f6',
    description: 'Document processor with markdown, rich formatting & cloud sync',
  },
  word: {
    name: 'Master Word',
    ext: 'docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    iconName: 'FileText',
    color: '#2563eb',
    description: 'Professional document processor with page layout, headers, footers & Word styles',
  },
  sheets: {
    name: 'Master Sheets',
    ext: 'msheet',
    mime: 'application/x-master-sheet',
    iconName: 'FileSpreadsheet',
    color: '#10b981',
    description: 'Intelligent spreadsheets with formula evaluation & grid computation',
  },
  excel: {
    name: 'Master Excel',
    ext: 'xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    iconName: 'FileSpreadsheet',
    color: '#059669',
    description: 'Advanced calculation engine with Excel-compatible workbooks & formulas',
  },
  slides: {
    name: 'Master Slides',
    ext: 'mslide',
    mime: 'application/x-master-slide',
    iconName: 'Presentation',
    color: '#f59e0b',
    description: 'Modern slide decks with presentation mode & custom slide layouts',
  },
  forms: {
    name: 'Master Forms',
    ext: 'mform',
    mime: 'application/x-master-form',
    iconName: 'CheckSquare',
    color: '#8b5cf6',
    description: 'Form builder with live responder view & real-time analytics',
  },
  draw: {
    name: 'Master Draw',
    ext: 'mdraw',
    mime: 'application/x-master-draw',
    iconName: 'Palette',
    color: '#ec4899',
    description: 'Vector diagramming and freehand sketching whiteboard',
  },
  notes: {
    name: 'Master Notes',
    ext: 'mnote',
    mime: 'application/x-master-note',
    iconName: 'BookOpen',
    color: '#6366f1',
    description: 'Organized notebook with sections, pages and checklists',
  },
  onenote: {
    name: 'Master OneNote',
    ext: 'monenote',
    mime: 'application/x-master-onenote',
    iconName: 'BookOpen',
    color: '#7c3aed',
    description: 'Hierarchical notebook organizer with rich media sections, outlines & checklists',
  },
  pics: {
    name: 'Master Pics Studio',
    ext: 'png',
    mime: 'image/png',
    iconName: 'Image',
    color: '#06b6d4',
    description: 'AI Image Studio with prompt synthesizer & cloud storage asset library',
  },
  vids: {
    name: 'Master Vids Studio',
    ext: 'mp4',
    mime: 'video/mp4',
    iconName: 'Video',
    color: '#ef4444',
    description: 'AI Video Storyboard studio with multi-scene rendering pipeline',
  },
  ai: {
    name: 'Master AI Intelligence',
    ext: 'mai',
    mime: 'application/x-master-ai',
    iconName: 'Sparkles',
    color: '#3b82f6',
    description: 'AI Copilot & Document Intelligence Gateway',
  },
};

export class CanvasService {
  // Default Initial Data Factories
  static getDefaultDocData(title = 'Untitled Document'): CanvasDocData {
    return {
      title,
      content: `# ${title}\n\nWelcome to **Master Docs** on Master Cloud.\n\nStart typing your content here. You can use markdown shortcuts, format lists, write tables, and collaborate seamlessly.\n\n### Key Features:\n- ⚡ Real-time automatic cloud save\n- 🔒 Backed by your free 10 TB Master Cloud storage\n- 📝 Rich markdown and formatting support\n- 📤 Export to Markdown, Plain Text, or Print to PDF`,
      version: 1,
      wordCount: 52,
      charCount: 320,
      lastSavedAt: new Date().toISOString(),
    };
  }

  static getDefaultSheetData(title = 'Untitled Spreadsheet'): CanvasSheetData {
    const defaultCells: CanvasSheetData['cells'] = {
      A1: { value: 'Item Description', bold: true, bgColor: '#3b82f620' },
      B1: { value: 'Category', bold: true, bgColor: '#3b82f620' },
      C1: { value: 'Quantity', bold: true, bgColor: '#3b82f620', align: 'right' },
      D1: { value: 'Unit Price', bold: true, bgColor: '#3b82f620', align: 'right' },
      E1: { value: 'Total Cost', bold: true, bgColor: '#3b82f620', align: 'right' },

      A2: { value: 'Cloud Compute Instance' },
      B2: { value: 'Infrastructure' },
      C2: { value: '4' },
      D2: { value: '120' },
      E2: { value: '480', formula: '=C2*D2' },

      A3: { value: '10 TB Object Storage' },
      B3: { value: 'Storage' },
      C3: { value: '1' },
      D3: { value: '0' },
      E3: { value: '0', formula: '=C3*D3' },

      A4: { value: 'AI Gateway Tokens' },
      B4: { value: 'AI Workspace' },
      C4: { value: '500' },
      D4: { value: '0.05' },
      E4: { value: '25', formula: '=C4*D4' },

      A5: { value: 'Total Estimated Budget', bold: true },
      B5: { value: '' },
      C5: { value: '' },
      D5: { value: '' },
      E5: { value: '505', formula: '=SUM(E2:E4)', bold: true, bgColor: '#10b98120' },
    };

    return {
      title,
      rows: 35,
      cols: 16,
      cells: defaultCells,
      activeSheetName: 'Sheet1',
      sheets: ['Sheet1'],
      lastSavedAt: new Date().toISOString(),
    };
  }

  static getDefaultSlideData(title = 'Untitled Presentation'): CanvasSlideData {
    return {
      title,
      activeSlideIndex: 0,
      slides: [
        {
          id: 'slide-1',
          title: 'Master Cloud Architecture',
          layout: 'title',
          bgTheme: 'dark',
          elements: [
            {
              id: 'el-1',
              type: 'title',
              content: 'Master Cloud Platform',
              x: 10,
              y: 30,
              width: 80,
              height: 20,
              fontSize: 38,
              color: '#ffffff',
            },
            {
              id: 'el-2',
              type: 'text',
              content: 'Unified Cloud Storage & Next-Gen Productivity Suite',
              x: 10,
              y: 54,
              width: 80,
              height: 15,
              fontSize: 20,
              color: '#94a3b8',
            },
          ],
        },
        {
          id: 'slide-2',
          title: 'Core Platform Pillars',
          layout: 'title-content',
          bgTheme: 'ocean',
          elements: [
            {
              id: 'el-3',
              type: 'title',
              content: 'Built for Scale and Speed',
              x: 10,
              y: 12,
              width: 80,
              height: 15,
              fontSize: 32,
              color: '#ffffff',
            },
            {
              id: 'el-4',
              type: 'bullet',
              content: '• 10 TB Free Cloud Quota for Every Registered User\n• Seamless Master Canvas Suite (Docs, Sheets, Slides, Forms, Draw, Notes)\n• Native Master AI Workspace with File Context Reasoning\n• Resilient Dual-Engine Local & Supabase Architecture',
              x: 10,
              y: 35,
              width: 80,
              height: 50,
              fontSize: 18,
              color: '#e2e8f0',
            },
          ],
        },
      ],
      lastSavedAt: new Date().toISOString(),
    };
  }

  static getDefaultFormData(title = 'Untitled Form'): CanvasFormData {
    return {
      title,
      description: 'Please submit your responses below. All responses are saved directly to Master Cloud.',
      questions: [
        {
          id: 'q-1',
          title: 'Full Name',
          type: 'short-text',
          required: true,
        },
        {
          id: 'q-2',
          title: 'Email Address',
          type: 'short-text',
          required: true,
        },
        {
          id: 'q-3',
          title: 'Which Master Cloud features do you use most?',
          type: 'checkbox',
          options: ['10 TB Cloud Storage', 'Master Canvas Suite', 'Master AI Workspace', 'Media Library & Streaming'],
          required: false,
        },
        {
          id: 'q-4',
          title: 'Overall Satisfaction Rating',
          type: 'rating',
          required: true,
        },
        {
          id: 'q-5',
          title: 'Feedback or Suggestions',
          type: 'paragraph',
          required: false,
        },
      ],
      responses: [
        {
          id: 'resp-1',
          submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          answers: {
            'q-1': 'Sarah Connor',
            'q-2': 'sarah@example.com',
            'q-3': ['10 TB Cloud Storage', 'Master AI Workspace'],
            'q-4': 5,
            'q-5': 'The 10 TB storage policy is incredible. Master Canvas is super smooth!',
          },
        },
      ],
      isAcceptingResponses: true,
      lastSavedAt: new Date().toISOString(),
    };
  }

  static getDefaultDrawData(title = 'Untitled Diagram'): CanvasDrawData {
    return {
      title,
      backgroundColor: '#0f172a',
      elements: [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 220,
          height: 100,
          strokeColor: '#3b82f6',
          fillColor: '#1e3a8a30',
          strokeWidth: 2,
          text: 'Master Cloud Client',
        },
        {
          id: 'shape-2',
          type: 'arrow',
          x: 320,
          y: 150,
          width: 120,
          height: 0,
          strokeColor: '#60a5fa',
          strokeWidth: 2,
        },
        {
          id: 'shape-3',
          type: 'rectangle',
          x: 440,
          y: 100,
          width: 220,
          height: 100,
          strokeColor: '#10b981',
          fillColor: '#064e3b30',
          strokeWidth: 2,
          text: '10 TB Storage Gateway',
        },
        {
          id: 'shape-4',
          type: 'sticky',
          x: 220,
          y: 250,
          width: 200,
          height: 120,
          strokeColor: '#f59e0b',
          fillColor: '#fef3c7',
          strokeWidth: 1,
          text: 'Zero-Trust Architecture\nDirect stream encryption',
        },
      ],
      lastSavedAt: new Date().toISOString(),
    };
  }

  static getDefaultNotesData(title = 'Master Notebook'): CanvasNotesData {
    return {
      title,
      activeNotebookName: 'General Notes',
      sections: [
        {
          id: 'sec-1',
          name: 'Quick Ideas',
          color: '#3b82f6',
          pages: [
            {
              id: 'pg-1',
              title: 'Getting Started with Master Notes',
              content: 'Welcome to your unified notebook.\n\nOrganize pages into sections, create interactive to-do lists, and keep your thoughts synchronized with your Master Cloud drive.',
              color: '#3b82f6',
              isPinned: true,
              tags: ['intro', 'guide'],
              checklist: [
                { id: 'chk-1', text: 'Create my first Master Doc', completed: true },
                { id: 'chk-2', text: 'Organize files into folders', completed: true },
                { id: 'chk-3', text: 'Test AI Workspace file summarization', completed: false },
                { id: 'chk-4', text: 'Check storage quota status (10 TB)', completed: true },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
        {
          id: 'sec-2',
          name: 'Project Milestones',
          color: '#10b981',
          pages: [
            {
              id: 'pg-2',
              title: 'Q4 Release Plan',
              content: 'Comprehensive timeline for Master Cloud production readiness.',
              color: '#10b981',
              isPinned: false,
              tags: ['planning', 'q4'],
              checklist: [
                { id: 'chk-21', text: 'Deploy Context Menu system', completed: true },
                { id: 'chk-22', text: 'Deploy Master Canvas suite', completed: true },
                { id: 'chk-23', text: 'Enable AI Gateway aliases', completed: true },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ],
      lastSavedAt: new Date().toISOString(),
    };
  }

  // Create a brand new file in Master Cloud
  static async createCanvasDocument(
    type: CanvasAppType,
    title = 'Untitled',
    parentFolderId: string | null = null
  ): Promise<{ file: FileItem; initialData: any }> {
    const config = CANVAS_APP_CONFIG[type];
    const filename = `${title.trim() || 'Untitled'}.${config.ext}`;

    let initialData: any = {};
    if (type === 'docs' || type === 'word') initialData = this.getDefaultDocData(title);
    else if (type === 'sheets' || type === 'excel') initialData = this.getDefaultSheetData(title);
    else if (type === 'slides') initialData = this.getDefaultSlideData(title);
    else if (type === 'forms') initialData = this.getDefaultFormData(title);
    else if (type === 'draw') initialData = this.getDefaultDrawData(title);
    else if (type === 'notes' || type === 'onenote') initialData = this.getDefaultNotesData(title);

    const jsonString = JSON.stringify(initialData, null, 2);
    const fileBlob = new File([jsonString], filename, { type: 'application/json' });

    const createdFile = await api.uploadFile(fileBlob, parentFolderId);
    return { file: createdFile, initialData };
  }

  // Load an existing file
  static async loadCanvasDocument<T>(fileId: string, type: CanvasAppType): Promise<{ file: FileItem; data: T }> {
    const file = await api.getFileById(fileId);
    if (!file) {
      throw new Error('Document not found in Master Cloud');
    }

    const textContent = await api.getFileContentText(fileId);
    let data: T;

    if (textContent) {
      try {
        data = JSON.parse(textContent);
      } catch (err) {
        // Fallback if plain text / markdown file
        if (type === 'docs' || type === 'word') {
          data = {
            title: file.name.replace(/\.[^.]+$/, ''),
            content: textContent,
            version: 1,
            wordCount: textContent.split(/\s+/).length,
            charCount: textContent.length,
            lastSavedAt: file.updated_at,
          } as unknown as T;
        } else {
          throw new Error('Failed to parse document data.');
        }
      }
    } else {
      // If empty or missing, provide defaults
      if (type === 'docs' || type === 'word') data = this.getDefaultDocData(file.name.replace(/\.[^.]+$/, '')) as unknown as T;
      else if (type === 'sheets' || type === 'excel') data = this.getDefaultSheetData(file.name.replace(/\.[^.]+$/, '')) as unknown as T;
      else if (type === 'slides') data = this.getDefaultSlideData(file.name.replace(/\.[^.]+$/, '')) as unknown as T;
      else if (type === 'forms') data = this.getDefaultFormData(file.name.replace(/\.[^.]+$/, '')) as unknown as T;
      else if (type === 'draw') data = this.getDefaultDrawData(file.name.replace(/\.[^.]+$/, '')) as unknown as T;
      else if (type === 'notes' || type === 'onenote') data = this.getDefaultNotesData(file.name.replace(/\.[^.]+$/, '')) as unknown as T;
      else data = {} as unknown as T;
    }

    return { file, data };
  }

  // Save an existing document to Master Cloud
  static async saveCanvasDocument<T extends { lastSavedAt?: string }>(fileId: string, data: T): Promise<FileItem> {
    const payload = {
      ...data,
      lastSavedAt: new Date().toISOString(),
    };
    const jsonString = JSON.stringify(payload, null, 2);
    return await api.updateFileContent(fileId, jsonString, 'application/json');
  }

  // Export to local disk
  static exportToLocalFile(filename: string, content: string | Blob, mimeType = 'text/plain') {
    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
