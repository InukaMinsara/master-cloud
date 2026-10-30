import { create } from 'zustand';
import { UploadProgressItem } from '@/types/file';
import { api } from '@/services/api';
import { useFileStore } from '@/stores/fileStore';

interface UploadState {
  queue: UploadProgressItem[];
  isOpen: boolean;
  isDraggingOver: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setIsDraggingOver: (isDragging: boolean) => void;
  addFiles: (files: FileList | File[], parentFolderId?: string | null) => Promise<void>;
  processUploadItem: (itemId: string) => Promise<void>;
  cancelUpload: (id: string) => void;
  clearCompleted: () => void;
  retryUpload: (id: string) => Promise<void>;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  queue: [],
  isOpen: false,
  isDraggingOver: false,

  setIsOpen: (isOpen: boolean) => set({ isOpen }),
  setIsDraggingOver: (isDraggingOver: boolean) => set({ isDraggingOver }),

  addFiles: async (fileList: FileList | File[], parentFolderId: string | null = null) => {
    const filesArray: File[] = Array.from(fileList as ArrayLike<File>);
    if (filesArray.length === 0) return;

    const newItems: UploadProgressItem[] = filesArray.map((file: File) => ({
      id: 'upl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      file,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      parentFolderId,
      progress: 0,
      bytesUploaded: 0,
      speedBytesPerSec: 0,
      status: 'queued',
      startedAt: Date.now(),
    }));

    set(state => ({
      queue: [...newItems, ...state.queue],
      isOpen: true,
    }));

    // Process uploads
    for (const item of newItems) {
      get().processUploadItem(item.id);
    }
  },

  processUploadItem: async (itemId: string) => {
    const item = get().queue.find(q => q.id === itemId);
    if (!item || item.status === 'cancelled') return;

    set(state => ({
      queue: state.queue.map(q => q.id === itemId ? { ...q, status: 'uploading', startedAt: Date.now() } : q)
    }));

    let lastBytes = 0;
    let lastTime = Date.now();

    try {
      await api.uploadFile(
        item.file,
        item.parentFolderId,
        (progress, bytesUploaded) => {
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          const bytesDiff = bytesUploaded - lastBytes;
          const speed = timeDiff > 0 ? Math.round(bytesDiff / timeDiff) : 0;

          lastBytes = bytesUploaded;
          lastTime = now;

          set(state => ({
            queue: state.queue.map(q =>
              q.id === itemId
                ? {
                    ...q,
                    progress,
                    bytesUploaded,
                    speedBytesPerSec: speed,
                  }
                : q
            ),
          }));
        }
      );

      set(state => ({
        queue: state.queue.map(q =>
          q.id === itemId
            ? { ...q, status: 'completed', progress: 100, completedAt: Date.now(), speedBytesPerSec: 0 }
            : q
        ),
      }));

      // Immediately refresh the file listing in Drive and Media library
      try {
        useFileStore.getState().fetchItems().catch(() => {});
      } catch {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mc_storage_updated'));
      }
    } catch (err: any) {
      console.error('Upload failed for item:', itemId, err);
      set(state => ({
        queue: state.queue.map(q =>
          q.id === itemId
            ? { ...q, status: 'error', errorMessage: err.message || 'Upload failed' }
            : q
        ),
      }));
    }
  },

  cancelUpload: (id: string) => {
    set(state => ({
      queue: state.queue.map(q => q.id === id ? { ...q, status: 'cancelled', speedBytesPerSec: 0 } : q)
    }));
  },

  retryUpload: async (id: string) => {
    const item = get().queue.find(q => q.id === id);
    if (!item) return;

    set(state => ({
      queue: state.queue.map(q =>
        q.id === id ? { ...q, status: 'queued', progress: 0, bytesUploaded: 0, errorMessage: undefined } : q
      ),
    }));

    get().processUploadItem(id);
  },

  clearCompleted: () => {
    set(state => ({
      queue: state.queue.filter(q => q.status !== 'completed' && q.status !== 'cancelled'),
    }));
  },
}));
