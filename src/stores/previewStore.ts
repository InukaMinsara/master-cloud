import { create } from 'zustand';
import { FileItem } from '@/types/file';

export type PreviewQuality = 'original' | '4k' | '1080p' | '720p' | '480p' | '360p';

export interface QualityOption {
  id: PreviewQuality;
  label: string;
  badge: string;
  scale: number;
  jpegQuality: number;
  desc: string;
}

export const QUALITY_OPTIONS: QualityOption[] = [
  {
    id: 'original',
    label: 'Original (100% Master)',
    badge: '100% RAW',
    scale: 1.0,
    jpegQuality: 1.0,
    desc: 'Uncompressed raw native source',
  },
  {
    id: '4k',
    label: 'Ultra High (85% Ultra)',
    badge: '85% Ultra',
    scale: 0.85,
    jpegQuality: 0.92,
    desc: 'Cinema sharpness & high density',
  },
  {
    id: '1080p',
    label: 'High (70% 1080p)',
    badge: '70% High',
    scale: 0.70,
    jpegQuality: 0.80,
    desc: 'Crisp Full HD streaming',
  },
  {
    id: '720p',
    label: 'Medium (50% 720p)',
    badge: '50% Med',
    scale: 0.50,
    jpegQuality: 0.60,
    desc: 'Balanced streaming & data saver',
  },
  {
    id: '480p',
    label: 'Low (35% 480p)',
    badge: '35% Low',
    scale: 0.35,
    jpegQuality: 0.40,
    desc: 'Low bandwidth, noticeable compression',
  },
  {
    id: '360p',
    label: 'Ultra Potato (18% Eco)',
    badge: '18% Potato',
    scale: 0.18,
    jpegQuality: 0.18,
    desc: 'Ultra low RAM (<10MB), pixelated turbo',
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
