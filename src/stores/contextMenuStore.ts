import { create } from 'zustand';
import { FileItem, FolderItem } from '@/types/file';

export type ContextMenuType = 'file' | 'folder' | 'empty';

interface OpenContextMenuParams {
  x: number;
  y: number;
  type: ContextMenuType;
  targetFile?: FileItem | null;
  targetFolder?: FolderItem | null;
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  type: ContextMenuType;
  targetFile: FileItem | null;
  targetFolder: FolderItem | null;
  openContextMenu: (params: OpenContextMenuParams) => void;
  closeContextMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isOpen: false,
  x: 0,
  y: 0,
  type: 'empty',
  targetFile: null,
  targetFolder: null,

  openContextMenu: ({ x, y, type, targetFile = null, targetFolder = null }) =>
    set({
      isOpen: true,
      x,
      y,
      type,
      targetFile,
      targetFolder,
    }),

  closeContextMenu: () =>
    set({
      isOpen: false,
      targetFile: null,
      targetFolder: null,
    }),
}));
