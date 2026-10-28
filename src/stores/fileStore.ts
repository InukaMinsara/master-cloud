import { create } from 'zustand';
import { FileItem, FolderItem, ViewMode, SortField, SortOrder, BreadcrumbItem } from '@/types/file';
import { api } from '@/services/api';
import { getFileCategory } from '@/lib/utils';

interface FileState {
  currentFolderId: string | null;
  files: FileItem[];
  folders: FolderItem[];
  breadcrumbs: BreadcrumbItem[];
  selectedItemIds: string[]; // Can contain file IDs or folder IDs
  viewMode: ViewMode;
  sortField: SortField;
  sortOrder: SortOrder;
  searchQuery: string;
  categoryFilter: string; // 'all' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive'
  isLoading: boolean;
  activeDetailsItem: (FileItem & { isFolder?: boolean }) | (FolderItem & { isFolder: true }) | null;

  // Actions
  setCurrentFolderId: (folderId: string | null) => Promise<void>;
  fetchItems: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setSort: (field: SortField, order: SortOrder) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  selectItem: (id: string, isMulti: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setActiveDetailsItem: (item: any) => void;

  // File & Folder operations
  createFolder: (name: string, color?: string) => Promise<void>;
  renameItem: (id: string, isFolder: boolean, newName: string) => Promise<void>;
  moveItem: (id: string, isFolder: boolean, newParentId: string | null) => Promise<void>;
  deleteItem: (id: string, isFolder: boolean) => Promise<void>;
  restoreItem: (id: string, isFolder: boolean) => Promise<void>;
  permanentDeleteItem: (id: string, isFolder: boolean) => Promise<void>;
  toggleStar: (id: string, isFolder: boolean) => Promise<void>;
  copyFile: (id: string) => Promise<void>;
  bulkDelete: () => Promise<void>;
  bulkDownload: () => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  currentFolderId: null,
  files: [],
  folders: [],
  breadcrumbs: [{ id: null, name: 'My Drive' }],
  selectedItemIds: [],
  viewMode: (localStorage.getItem('mc_view_mode') as ViewMode) || 'grid',
  sortField: 'updated_at',
  sortOrder: 'desc',
  searchQuery: '',
  categoryFilter: 'all',
  isLoading: false,
  activeDetailsItem: null,

  setCurrentFolderId: async (folderId) => {
    set({ currentFolderId: folderId, selectedItemIds: [], isLoading: true });
    try {
      const ancestors = await api.getFolderAncestors(folderId);
      const crumbs: BreadcrumbItem[] = [
        { id: null, name: 'My Drive' },
        ...ancestors.map(a => ({ id: a.id, name: a.name })),
      ];
      set({ breadcrumbs: crumbs });
      await get().fetchItems();
    } finally {
      set({ isLoading: false });
    }
  },

  fetchItems: async () => {
    const { currentFolderId, searchQuery, categoryFilter } = get();
    set({ isLoading: true });
    try {
      if (searchQuery.trim()) {
        const results = await api.search(searchQuery, categoryFilter);
        set({ folders: results.folders, files: results.files, isLoading: false });
        return;
      }
      const [folders, files] = await Promise.all([
        api.getFolders(currentFolderId, false),
        api.getFiles(currentFolderId, false),
      ]);
      set({ folders, files, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch items:', err);
      set({ isLoading: false });
    }
  },

  setViewMode: (mode) => {
    localStorage.setItem('mc_view_mode', mode);
    set({ viewMode: mode });
  },

  setSort: (sortField, sortOrder) => set({ sortField, sortOrder }),
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().fetchItems();
  },
  setCategoryFilter: (categoryFilter) => {
    set({ categoryFilter });
    get().fetchItems();
  },

  selectItem: (id, isMulti) => {
    set(state => {
      if (isMulti) {
        const exists = state.selectedItemIds.includes(id);
        return {
          selectedItemIds: exists
            ? state.selectedItemIds.filter(item => item !== id)
            : [...state.selectedItemIds, id],
        };
      }
      return { selectedItemIds: [id] };
    });
  },

  selectAll: () => {
    const { files, folders } = get();
    const allIds = [...folders.map(f => f.id), ...files.map(f => f.id)];
    set({ selectedItemIds: allIds });
  },

  clearSelection: () => set({ selectedItemIds: [] }),

  setActiveDetailsItem: (item) => set({ activeDetailsItem: item }),

  createFolder: async (name, color) => {
    const { currentFolderId } = get();
    await api.createFolder(name, currentFolderId, color);
    await get().fetchItems();
  },

  renameItem: async (id, isFolder, newName) => {
    if (isFolder) {
      await api.renameFolder(id, newName);
    } else {
      await api.renameFile(id, newName);
    }
    await get().fetchItems();
    const { activeDetailsItem } = get();
    if (activeDetailsItem && activeDetailsItem.id === id) {
      set({ activeDetailsItem: { ...activeDetailsItem, name: newName } });
    }
  },

  moveItem: async (id, isFolder, newParentId) => {
    if (isFolder) {
      await api.moveFolder(id, newParentId);
    } else {
      await api.moveFile(id, newParentId);
    }
    await get().fetchItems();
  },

  deleteItem: async (id, isFolder) => {
    if (isFolder) {
      await api.softDeleteFolder(id);
    } else {
      await api.softDeleteFile(id);
    }
    set(state => ({
      selectedItemIds: state.selectedItemIds.filter(itemId => itemId !== id),
      activeDetailsItem: state.activeDetailsItem?.id === id ? null : state.activeDetailsItem,
    }));
    await get().fetchItems();
  },

  restoreItem: async (id, isFolder) => {
    if (isFolder) {
      await api.restoreFolder(id);
    } else {
      await api.restoreFile(id);
    }
    await get().fetchItems();
  },

  permanentDeleteItem: async (id, isFolder) => {
    if (isFolder) {
      await api.permanentDeleteFolder(id);
    } else {
      await api.permanentDeleteFile(id);
    }
    await get().fetchItems();
  },

  toggleStar: async (id, isFolder) => {
    if (isFolder) {
      await api.toggleStarFolder(id);
    } else {
      await api.toggleStarFile(id);
    }
    await get().fetchItems();
  },

  copyFile: async (id) => {
    await api.copyFile(id);
    await get().fetchItems();
  },

  bulkDelete: async () => {
    const { selectedItemIds, files, folders } = get();
    for (const id of selectedItemIds) {
      const isFolder = folders.some(f => f.id === id);
      if (isFolder) {
        await api.softDeleteFolder(id);
      } else {
        await api.softDeleteFile(id);
      }
    }
    set({ selectedItemIds: [], activeDetailsItem: null });
    await get().fetchItems();
  },

  bulkDownload: async () => {
    const { selectedItemIds, files } = get();
    const selectedFiles = files.filter(f => selectedItemIds.includes(f.id));
    if (selectedFiles.length === 1) {
      await api.downloadFile(selectedFiles[0]);
    } else if (selectedFiles.length > 1) {
      await api.downloadMultiple(selectedFiles);
    }
  },
}));

// Selectors for sorted and filtered items
export const getFilteredDriveItems = (state: FileState) => {
  const { files, folders, searchQuery, categoryFilter, sortField, sortOrder } = state;

  let filteredFolders = folders;
  let filteredFiles = files;

  // Filter by category
  if (categoryFilter !== 'all') {
    filteredFolders = []; // Folders hidden when specific file type filtered
    filteredFiles = filteredFiles.filter(f => getFileCategory(f.mime_type, f.extension) === categoryFilter);
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredFolders = filteredFolders.filter(f => f.name.toLowerCase().includes(q));
    filteredFiles = filteredFiles.filter(f => f.name.toLowerCase().includes(q) || f.extension.toLowerCase().includes(q));
  }

  // Sort
  const compare = (a: any, b: any) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'name') {
      valA = (valA || '').toLowerCase();
      valB = (valB || '').toLowerCase();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    if (sortField === 'size_bytes') {
      valA = valA || 0;
      valB = valB || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    const timeA = new Date(valA || 0).getTime();
    const timeB = new Date(valB || 0).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  };

  return {
    folders: [...filteredFolders].sort(compare),
    files: [...filteredFiles].sort(compare),
  };
};
