import { create } from 'zustand';

export interface DownloadPreparationItem {
  id: string;
  title: string; // e.g. "Zipping 1 file", "Zipping 58 files"
  fileName: string; // e.g. "AudioFlow Pro.zip"
  itemCount: number;
  processedCount: number;
  progress: number; // 0 to 100
  status: 'preparing' | 'zipping' | 'completed' | 'error';
  errorMessage?: string;
  isArchive: boolean;
  startedAt: number;
  completedAt?: number;
}

interface DownloadState {
  items: DownloadPreparationItem[];
  isOpen: boolean;
  isMinimized: boolean;

  setIsOpen: (isOpen: boolean) => void;
  setIsMinimized: (isMinimized: boolean) => void;
  toggleMinimized: () => void;

  startDownload: (params: {
    id: string;
    title: string;
    fileName: string;
    itemCount: number;
    isArchive?: boolean;
  }) => void;
  updateProgress: (id: string, progress: number, processedCount?: number) => void;
  completeDownload: (id: string) => void;
  failDownload: (id: string, errorMessage?: string) => void;
  removeItem: (id: string) => void;
  clearCompleted: () => void;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  items: [],
  isOpen: false,
  isMinimized: false,

  setIsOpen: (isOpen: boolean) => set({ isOpen }),
  setIsMinimized: (isMinimized: boolean) => set({ isMinimized }),
  toggleMinimized: () => set(state => ({ isMinimized: !state.isMinimized })),

  startDownload: ({ id, title, fileName, itemCount, isArchive = true }) => {
    const newItem: DownloadPreparationItem = {
      id,
      title,
      fileName,
      itemCount,
      processedCount: 0,
      progress: 5,
      status: isArchive ? 'zipping' : 'preparing',
      isArchive,
      startedAt: Date.now(),
    };

    set(state => ({
      items: [newItem, ...state.items.filter(i => i.id !== id)],
      isOpen: true,
      isMinimized: false,
    }));
  },

  updateProgress: (id: string, progress: number, processedCount?: number) => {
    set(state => ({
      items: state.items.map(item =>
        item.id === id
          ? {
              ...item,
              progress: Math.min(100, Math.max(item.progress, progress)),
              processedCount: processedCount !== undefined ? processedCount : item.processedCount,
              status: item.isArchive ? 'zipping' : 'preparing',
            }
          : item
      ),
    }));
  },

  completeDownload: (id: string) => {
    set(state => ({
      items: state.items.map(item =>
        item.id === id
          ? {
              ...item,
              progress: 100,
              status: 'completed',
              completedAt: Date.now(),
            }
          : item
      ),
    }));

    // Auto-dismiss after 8 seconds if all downloads are completed and user hasn't closed it
    setTimeout(() => {
      const currentItems = get().items;
      const allDone = currentItems.length > 0 && currentItems.every(i => i.status === 'completed');
      if (allDone) {
        set({ isOpen: false });
      }
    }, 8000);
  },

  failDownload: (id: string, errorMessage?: string) => {
    set(state => ({
      items: state.items.map(item =>
        item.id === id
          ? {
              ...item,
              status: 'error',
              errorMessage: errorMessage || 'Preparation failed',
            }
          : item
      ),
    }));
  },

  removeItem: (id: string) => {
    set(state => {
      const remaining = state.items.filter(i => i.id !== id);
      return {
        items: remaining,
        isOpen: remaining.length > 0,
      };
    });
  },

  clearCompleted: () => {
    set(state => {
      const remaining = state.items.filter(i => i.status !== 'completed');
      return {
        items: remaining,
        isOpen: remaining.length > 0,
      };
    });
  },
}));
