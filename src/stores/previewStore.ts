import { create } from 'zustand';
import { FileItem } from '@/types/file';

interface PreviewState {
  activeFile: FileItem | null;
  fileList: FileItem[];
  isOpen: boolean;
  openPreview: (file: FileItem, list?: FileItem[]) => void;
  closePreview: () => void;
  nextFile: () => void;
  prevFile: () => void;
}

export const usePreviewStore = create<PreviewState>((set, get) => ({
  activeFile: null,
  fileList: [],
  isOpen: false,

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
