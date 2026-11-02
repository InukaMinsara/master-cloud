import { create } from 'zustand';
import { FileItem } from '@/types/file';

export type PreviewQuality = 'original' | '4k' | '1080p' | '720p' | '480p' | '360p';

export interface QualityOption {
  id: PreviewQuality;
  label: string;
  badge: string;
  resLabel: string;
  maxDim: number;
  jpegQuality: number;
  desc: string;
}

export const QUALITY_OPTIONS: QualityOption[] = [
  {
    id: 'original',
    label: 'Original Source (100%)',
    badge: 'RAW',
    resLabel: 'Native Source',
    maxDim: 99999,
    jpegQuality: 1.0,
    desc: 'Uncompressed pixel-perfect native quality',
  },
  {
    id: '4k',
    label: 'Ultra HD 4K (2160p)',
    badge: '4K',
    resLabel: '3840 × 2160',
    maxDim: 3840,
    jpegQuality: 0.95,
    desc: 'Ultra high density, cinema clarity',
  },
  {
    id: '1080p',
    label: 'Full HD (1080p)',
    badge: '1080p',
    resLabel: '1920 × 1080',
    maxDim: 1920,
    jpegQuality: 0.85,
    desc: 'Crisp, crystal clear & balanced',
  },
  {
    id: '720p',
    label: 'Standard HD (720p)',
    badge: '720p',
    resLabel: '1280 × 720',
    maxDim: 1280,
    jpegQuality: 0.75,
    desc: 'Fast loading & smooth streaming',
  },
  {
    id: '480p',
    label: 'Standard (480p)',
    badge: '480p',
    resLabel: '854 × 480',
    maxDim: 854,
    jpegQuality: 0.60,
    desc: 'Data saver & quick preview',
  },
  {
    id: '360p',
    label: 'Eco Potato (360p)',
    badge: '360p',
    resLabel: '640 × 360',
    maxDim: 640,
    jpegQuality: 0.40,
    desc: 'Ultra potato low-memory boost (<15MB RAM)',
  },
];

interface PreviewState {
  activeFile: FileItem | null;
  fileList: FileItem[];
  isOpen: boolean;
  previewQuality: PreviewQuality;
  openPreview: (file: FileItem, list?: FileItem[]) => void;
  closePreview: () => void;
  nextFile: () => void;
  prevFile: () => void;
  setPreviewQuality: (quality: PreviewQuality) => void;
}

export const usePreviewStore = create<PreviewState>((set, get) => ({
  activeFile: null,
  fileList: [],
  isOpen: false,
  previewQuality: (typeof window !== 'undefined' && (localStorage.getItem('mc_preview_quality') as PreviewQuality)) || 'original',

  setPreviewQuality: (quality: PreviewQuality) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc_preview_quality', quality);
    }
    set({ previewQuality: quality });
  },

  openPreview: (file, list = []) => {
    set({
      activeFile: file,
      fileList: list.length > 0 ? list : [file],
      isOpen: true,
    });
  },

  closePreview: () => {
    set({ activeFile: null, isOpen: false });
  },

  nextFile: () => {
    const { activeFile, fileList } = get();
    if (!activeFile || fileList.length <= 1) return;
    const currentIndex = fileList.findIndex(f => f.id === activeFile.id);
    if (currentIndex !== -1 && currentIndex < fileList.length - 1) {
      set({ activeFile: fileList[currentIndex + 1] });
    } else {
      set({ activeFile: fileList[0] }); // Wrap around
    }
  },

  prevFile: () => {
    const { activeFile, fileList } = get();
    if (!activeFile || fileList.length <= 1) return;
    const currentIndex = fileList.findIndex(f => f.id === activeFile.id);
    if (currentIndex > 0) {
      set({ activeFile: fileList[currentIndex - 1] });
    } else {
      set({ activeFile: fileList[fileList.length - 1] }); // Wrap around
    }
  },
}));
