import { create } from 'zustand';
import { FileItem, FolderItem } from '@/types/file';

export type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  newFolderModalOpen: boolean;
  shareModalItem: { item: FileItem | FolderItem; isFolder: boolean } | null;
  fileRequestModalOpen: boolean;
  versionHistoryModalFile: FileItem | null;
  smartCleanupModalOpen: boolean;
  activeSettingsTab: string;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setNewFolderModalOpen: (open: boolean) => void;
  setShareModalItem: (item: { item: FileItem | FolderItem; isFolder: boolean } | null) => void;
  setFileRequestModalOpen: (open: boolean) => void;
  setVersionHistoryModalFile: (file: FileItem | null) => void;
  setSmartCleanupModalOpen: (open: boolean) => void;
  setActiveSettingsTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: (localStorage.getItem('mc_theme') as Theme) || 'system',
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  newFolderModalOpen: false,
  shareModalItem: null,
  fileRequestModalOpen: false,
  versionHistoryModalFile: null,
  smartCleanupModalOpen: false,
  activeSettingsTab: 'account',

  setTheme: (theme) => {
    localStorage.setItem('mc_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    set({ theme });
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setNewFolderModalOpen: (open) => set({ newFolderModalOpen: open }),
  setShareModalItem: (item) => set({ shareModalItem: item }),
  setFileRequestModalOpen: (open) => set({ fileRequestModalOpen: open }),
  setVersionHistoryModalFile: (file) => set({ versionHistoryModalFile: file }),
  setSmartCleanupModalOpen: (open) => set({ smartCleanupModalOpen: open }),
  setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),
}));
