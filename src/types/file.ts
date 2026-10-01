import { FileRecord, FolderRecord, ProfileRecord, FileVersionRecord } from './database';

export type ViewMode = 'grid' | 'list';
export type SortField = 'name' | 'updated_at' | 'size_bytes' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface FileItem extends FileRecord {
  owner?: ProfileRecord;
  versions?: FileVersionRecord[];
  download_url?: string;
  blob_url?: string;
}

export interface FolderItem extends FolderRecord {
  owner?: ProfileRecord;
  item_count?: number;
}

export type DriveItem = 
  | ({ itemType: 'folder' } & FolderItem)
  | ({ itemType: 'file' } & FileItem);

export interface BreadcrumbItem {
  id: string | null; // null for root "My Drive"
  name: string;
}

export interface FileFilterOptions {
  query?: string;
  type?: 'all' | 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code';
  folderId?: string | null;
  isStarred?: boolean;
  minSize?: number;
  maxSize?: number;
  startDate?: string;
  endDate?: string;
}

export interface UploadProgressItem {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  parentFolderId: string | null;
  progress: number; // 0 to 100
  bytesUploaded: number;
  speedBytesPerSec: number;
  status: 'queued' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled';
  errorMessage?: string;
  startedAt?: number;
  completedAt?: number;
  storagePath?: string;
}

export interface StorageBreakdown {
  totalQuota: number;
  usedStorage: number;
  availableStorage: number;
  percentageUsed: number;
  imagesBytes: number;
  videosBytes: number;
  audioBytes: number;
  documentsBytes: number;
  codeBytes: number;
  otherBytes: number;
  trashBytes: number;
  fileCount: number;
  folderCount: number;
}

export interface DuplicateFileGroup {
  checksum: string;
  name: string;
  size: number;
  files: FileItem[];
}
