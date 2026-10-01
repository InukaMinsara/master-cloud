/**
 * ==============================================================================
 * MASTER CLOUD: EXTENSION ARCHITECTURE & FUTURE MODULE INTERFACES
 * ==============================================================================
 * This module establishes isolated, production-grade boundaries for future
 * modules (Cloud-to-Cloud Sync, Multi-Device Sync, Offline Conflict Resolution,
 * Automated Backups, External AI Engine, and Developer APIs).
 *
 * NOTE: The core storage, RLS, auth, and permissions remain completely
 * decoupled from these extensions.
 * ==============================================================================
 */

// 1. CLOUD-TO-CLOUD ADAPTER INTERFACE (Google Drive, Dropbox, OneDrive)
export interface CloudProviderAccount {
  provider: 'google_drive' | 'dropbox' | 'onedrive';
  accountId: string;
  accountEmail: string;
  connectedAt: string;
}

export interface CloudSyncAdapter {
  provider: 'google_drive' | 'dropbox' | 'onedrive';
  connect(authCode: string): Promise<CloudProviderAccount>;
  disconnect(accountId: string): Promise<void>;
  listExternalFiles(accountId: string, path?: string): Promise<any[]>;
  importFile(accountId: string, externalFileId: string, targetFolderId: string | null): Promise<string>;
  exportFile(accountId: string, fileId: string, externalPath: string): Promise<void>;
}

export const CloudToCloudService = {
  isConfigured(): boolean {
    return false;
  },
  getProviders(): Array<{ id: string; name: string; icon: string; status: 'available' | 'coming_soon' }> {
    return [
      { id: 'google_drive', name: 'Google Drive', icon: 'GoogleDrive', status: 'coming_soon' },
      { id: 'dropbox', name: 'Dropbox', icon: 'Dropbox', status: 'coming_soon' },
      { id: 'onedrive', name: 'Microsoft OneDrive', icon: 'OneDrive', status: 'coming_soon' },
    ];
  },
};

// 2. MULTI-DEVICE SYNC & CONFLICT RESOLUTION INTERFACE
export interface SyncConflict {
  fileId: string;
  localVersion: { size: number; checksum: string; modifiedAt: string };
  remoteVersion: { size: number; checksum: string; modifiedAt: string };
  strategy: 'keep_local' | 'keep_remote' | 'keep_both';
}

export interface SyncEngineInterface {
  startDaemon(): Promise<void>;
  pauseSync(): Promise<void>;
  resolveConflict(conflict: SyncConflict): Promise<void>;
  getPendingSyncCount(): number;
}

// 3. BACKUP & RECOVERY SNAPSHOT ARCHITECTURE
export interface BackupJob {
  id: string;
  name: string;
  targetFolderIds: string[];
  schedule: 'daily' | 'weekly' | 'manual';
  retentionDays: number;
  lastRunAt: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface BackupSnapshot {
  id: string;
  jobId: string;
  snapshotTime: string;
  totalSizeBytes: number;
  fileCount: number;
}

export const BackupService = {
  listJobs(): BackupJob[] {
    return [];
  },
  triggerSnapshot(jobId: string): Promise<BackupSnapshot> {
    throw new Error(`Backup snapshot for ${jobId} requires Backup Agent Daemon (Future Module).`);
  },
};

// 4. FUTURE AI MODULE INTERFACE
// Strictly decoupled so core works without AI.
export interface AIServiceInterface {
  summarizeDocument?(fileId: string, content: string): Promise<string>;
  autoTagFile?(fileName: string, mimeType: string): Promise<string[]>;
  naturalLanguageSearch?(prompt: string): Promise<string[]>;
  describeImage?(imageBlob: Blob): Promise<string>;
}

export const AIModule: AIServiceInterface = {
  // Safe empty stub until user enables LLM service key
};

// 5. DEVELOPER API KEYS
export interface DeveloperApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: Array<'read' | 'write' | 'delete' | 'share'>;
  createdAt: string;
  lastUsedAt: string | null;
}
