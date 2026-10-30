import {
  FileRecord,
  FolderRecord,
  ProfileRecord,
  StorageQuotaRecord,
  FileVersionRecord,
  ShareRecord,
  ShareLinkRecord,
  FileRequestRecord,
  CommentRecord,
  ActivityLogRecord,
  NotificationRecord,
  DeviceRecord,
} from '@/types/database';
import { FileItem, FolderItem, StorageBreakdown, DuplicateFileGroup } from '@/types/file';
import { calculateFileChecksum, getFileExtension, getFileCategory, generateSecureToken } from '@/lib/utils';
import { FREE_TEN_TB_BYTES } from '@/lib/constants';
import { CLOUD_SEED_FOLDERS, CLOUD_SEED_FILES, CLOUD_SEED_STATS, USER_SEED_DATA } from './cloudSeedData';

const DB_PREFIX = 'master_cloud_v3_';

// IndexedDB for binary storage with in-memory fallback
class BinaryStorage {
  private dbPromise: Promise<IDBDatabase | null>;
  private memoryFallback = new Map<string, Blob>();

  constructor() {
    this.dbPromise = new Promise((resolve) => {
      try {
        if (typeof window === 'undefined' || !window.indexedDB) {
          resolve(null);
          return;
        }
        const request = indexedDB.open('MasterCloudStorage', 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('blobs')) {
            db.createObjectStore('blobs');
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async saveBlob(key: string, blob: Blob): Promise<void> {
    try {
      const db = await this.dbPromise;
      if (!db) {
        this.memoryFallback.set(key, blob);
        return;
      }
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('blobs', 'readwrite');
          const store = tx.objectStore('blobs');
          const req = store.put(blob, key);
          req.onsuccess = () => resolve();
          req.onerror = () => {
            this.memoryFallback.set(key, blob);
            resolve();
          };
        } catch {
          this.memoryFallback.set(key, blob);
          resolve();
        }
      });
    } catch {
      this.memoryFallback.set(key, blob);
    }
  }

  async getBlob(key: string): Promise<Blob | null> {
    try {
      const db = await this.dbPromise;
      if (!db) {
        return this.memoryFallback.get(key) || null;
      }
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('blobs', 'readonly');
          const store = tx.objectStore('blobs');
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || this.memoryFallback.get(key) || null);
          req.onerror = () => resolve(this.memoryFallback.get(key) || null);
        } catch {
          resolve(this.memoryFallback.get(key) || null);
        }
      });
    } catch {
      return this.memoryFallback.get(key) || null;
    }
  }

  async deleteBlob(key: string): Promise<void> {
    try {
      this.memoryFallback.delete(key);
      const db = await this.dbPromise;
      if (!db) return;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('blobs', 'readwrite');
          const store = tx.objectStore('blobs');
          const req = store.delete(key);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    } catch {
      // Ignored
    }
  }
}

export const binaryStorage = new BinaryStorage();

// Storage helper with strict user partitioning
let currentDbUserEmail: string = 'immaster2024@gmail.com';

function getUserDbPrefix(email?: string | null): string {
  const clean = (email || currentDbUserEmail || '').trim().toLowerCase();
  if (!clean || clean === 'immaster2024@gmail.com') {
    return 'master_cloud_v3_master_';
  }
  const safe = clean.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `master_cloud_v3_user_${safe}_`;
}

function loadTable<T>(tableName: string, defaultData: T[]): T[] {
  try {
    const prefix = getUserDbPrefix(currentDbUserEmail);
    const saved = localStorage.getItem(prefix + tableName);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error('Failed to load table:', tableName, err);
  }
  return defaultData;
}

function saveTable<T>(tableName: string, data: T[]): void {
  try {
    const prefix = getUserDbPrefix(currentDbUserEmail);
    const json = JSON.stringify(data);
    if (json.length < 4 * 1024 * 1024) {
      localStorage.setItem(prefix + tableName, json);
    }
  } catch (err) {
    console.warn('Failed to save table:', tableName, err);
  }
}

// Default Seed Profile
export const DEFAULT_USER: ProfileRecord = {
  id: 'usr-inuka-minsara-master',
  email: 'immaster2024@gmail.com',
  display_name: 'Inuka Minsara',
  avatar_url: null,
  role: 'admin',
  created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

// Seed Folders and Files from Cloud Manifest
const SEED_FOLDERS: FolderRecord[] = CLOUD_SEED_FOLDERS;
const SEED_FILES: FileRecord[] = CLOUD_SEED_FILES;

function createSeedBlob(storagePath: string): Blob | null {
  if (storagePath.includes('banner.png') || storagePath.endsWith('.png') || storagePath.endsWith('.jpg')) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
        <linearGradient id="blueG" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <circle cx="600" cy="220" r="140" fill="#3b82f6" opacity="0.12"/>
      <g transform="translate(535, 140) scale(2.8)" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
      </g>
      <text x="600" y="360" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="46" fill="#ffffff" text-anchor="middle" letter-spacing="-1">MASTER CLOUD ULTRA</text>
      <text x="600" y="410" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="20" fill="#94a3b8" text-anchor="middle">10 TB Permanent Free Storage • High-Performance Multi-CDN Architecture</text>
      <rect x="430" y="460" width="340" height="48" rx="24" fill="url(#blueG)"/>
      <text x="600" y="491" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="15" fill="#ffffff" text-anchor="middle">AUTHENTICATED REAL ASSET</text>
    </svg>`;
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  if (storagePath.includes('architecture.pdf') || storagePath.endsWith('.pdf')) {
    const pdfText = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 380 >> stream
BT
/F1 20 Tf
50 720 Td
(MASTER CLOUD ARCHITECTURE & SYSTEM OVERVIEW) Tj
0 -40 Td
/F1 12 Tf
(Platform: Master Cloud 10 TB Dedicated Free Cloud) Tj
0 -22 Td
(Engine: Telegram Cloud + Multi-CDN Zero-Cost Hybrid Pipeline) Tj
0 -22 Td
(Storage Capacity: 10,240 GB per Registered User Account) Tj
0 -22 Td
(Security Protocol: Zero-Trust AES-256-GCM Sliced Streams) Tj
0 -22 Td
(File Slicing: Standard 19.5 MB Sub-Chunks with Reassembly) Tj
0 -22 Td
(Status: Fully Operational and Verified Live) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000676 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
745
%%EOF`;
    return new Blob([pdfText], { type: 'application/pdf' });
  }

  if (storagePath.includes('financials.xlsx') || storagePath.endsWith('.xlsx') || storagePath.endsWith('.csv')) {
    const csv = `Quarter,Operating Budget,Cloud Infrastructure,Multi-CDN Savings,Active Users,Growth Rate
Q1 2026,$250,000,$12,000,$238,000,14,500,+45%
Q2 2026,$380,000,$15,000,$365,000,28,900,+99%
Q3 2026,$510,000,$18,000,$492,000,52,400,+81%
Q4 2026,$720,000,$22,000,$698,000,98,200,+87%
Total 2026,$1,860,000,$67,000,$1,793,000,194,000,+78% Avg`;
    return new Blob([csv], { type: 'text/csv' });
  }

  if (storagePath.includes('ambient.mp3') || storagePath.endsWith('.mp3') || storagePath.endsWith('.wav')) {
    const sampleRate = 8000;
    const numSamples = sampleRate * 2;
    const buffer = new ArrayBuffer(44 + numSamples);
    const view = new DataView(buffer);
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples, true);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = 128 + Math.round(50 * Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t));
      view.setUint8(44 + i, sample);
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  return null;
}

const GLOBAL_PUBLIC_SHARES_KEY = 'master_cloud_v3_public_shares_registry';

function getGlobalPublicShares(): Record<string, { link: ShareLinkRecord; item: FileItem | FolderItem }> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(GLOBAL_PUBLIC_SHARES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveGlobalPublicShare(token: string, link: ShareLinkRecord, item: FileItem | FolderItem): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const all = getGlobalPublicShares();
    all[token] = { link, item };
    localStorage.setItem(GLOBAL_PUBLIC_SHARES_KEY, JSON.stringify(all));
  } catch {}
}

function encodeSharePayload(item: FileItem | FolderItem, link: ShareLinkRecord): string {
  const isFolder = link.resource_type === 'folder';
  const file = isFolder ? null : (item as FileItem);
  const payload = {
    t: link.token,
    rt: link.resource_type,
    id: item.id,
    n: item.name,
    sz: isFolder ? 0 : (file?.size_bytes || 0),
    ext: isFolder ? 'folder' : (file?.extension || ''),
    m: isFolder ? 'application/x-directory' : (file?.mime_type || 'application/octet-stream'),
    p: isFolder ? '' : (file?.storage_path || ''),
    o: item.owner?.display_name || 'MASTER CLOUD User',
    h: link.password_hash || undefined,
    hp: link.has_password ? 1 : 0,
    dl: link.allow_download ? 1 : 0,
    exp: link.expires_at ? new Date(link.expires_at).getTime() : null,
    c: new Date(link.created_at).getTime(),
  };
  try {
    return btoa(encodeURIComponent(JSON.stringify(payload)));
  } catch {
    return '';
  }
}

function decodeSharePayload(encoded: string): { link: ShareLinkRecord; item: FileItem | FolderItem } | null {
  try {
    const raw = decodeURIComponent(atob(encoded));
    const p = JSON.parse(raw);
    if (!p || !p.t || !p.n) return null;

    const isFolder = p.rt === 'folder';
    const link: ShareLinkRecord = {
      id: 'link-' + p.t,
      resource_type: p.rt,
      resource_id: p.id,
      creator_id: 'usr-share-creator',
      token: p.t,
      permission: 'viewer',
      password_hash: p.h || null,
      has_password: Boolean(p.hp && p.h),
      allow_download: p.dl !== 0,
      expires_at: p.exp ? new Date(p.exp).toISOString() : null,
      max_downloads: null,
      download_count: 0,
      view_count: 1,
      is_active: true,
      created_at: p.c ? new Date(p.c).toISOString() : new Date().toISOString(),
    };

    const item: FileItem | FolderItem = isFolder
      ? {
          id: p.id,
          name: p.n,
          owner_id: 'usr-share-creator',
          parent_folder_id: null,
          color: '#3b82f6',
          is_starred: false,
          deleted_at: null,
          created_at: link.created_at,
          updated_at: link.created_at,
          owner: {
            id: 'usr-share-creator',
            email: '',
            display_name: p.o || 'MASTER CLOUD User',
            avatar_url: null,
            role: 'user',
            created_at: link.created_at,
            updated_at: link.created_at,
          },
        }
      : {
          id: p.id,
          name: p.n,
          owner_id: 'usr-share-creator',
          parent_folder_id: null,
          storage_path: p.p,
          mime_type: p.m,
          size_bytes: p.sz,
          extension: p.ext,
          checksum: `share-${p.sz}-${p.c}`,
          is_starred: false,
          deleted_at: null,
          current_version_id: 'ver-' + p.id,
          created_at: link.created_at,
          updated_at: link.created_at,
          owner: {
            id: 'usr-share-creator',
            email: '',
            display_name: p.o || 'MASTER CLOUD User',
            avatar_url: null,
            role: 'user',
            created_at: link.created_at,
            updated_at: link.created_at,
          },
        };

    return { link, item };
  } catch (err) {
    console.warn('Failed to decode share payload:', err);
    return null;
  }
}

class LocalDatabaseService {
  private files: FileRecord[];
  private folders: FolderRecord[];
  private versions: FileVersionRecord[];
  private shares: ShareRecord[];
  private shareLinks: ShareLinkRecord[];
  public sharedWithMe: Array<{
    id: string;
    item_id: string;
    user_id: string;
    resource_type: 'file' | 'folder';
    item: FileItem | FolderItem;
    accessed_at: string;
  }>;
  private fileRequests: FileRequestRecord[];
  private comments: CommentRecord[];
  private activityLogs: ActivityLogRecord[];
  private notifications: NotificationRecord[];
  private devices: DeviceRecord[];
  private currentUser: ProfileRecord;

  constructor() {
    this.files = loadTable('files', SEED_FILES);
    this.folders = loadTable('folders', SEED_FOLDERS);
    this.versions = loadTable('versions', [
      {
        id: 'ver-1',
        file_id: 'file-1',
        version_number: 1,
        storage_path: 'seed/architecture.pdf',
        size_bytes: 4280000,
        checksum: 'a8b7c6d5e4f3a2b1',
        created_by: DEFAULT_USER.id,
        notes: 'Initial release',
        created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
      {
        id: 'ver-2',
        file_id: 'file-1',
        version_number: 2,
        storage_path: 'seed/architecture_v2.pdf',
        size_bytes: 4320000,
        checksum: 'a8b7c6d5e4f3a2b2',
        created_by: DEFAULT_USER.id,
        notes: 'Updated zero-trust encryption spec',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ]);
    this.shares = loadTable('shares', [
      {
        id: 'share-1',
        resource_type: 'folder',
        resource_id: 'folder-1',
        granter_id: DEFAULT_USER.id,
        grantee_id: null,
        grantee_email: 'sarah.connor@example.com',
        permission: 'editor',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ]);
    this.shareLinks = loadTable('share_links', [
      {
        id: 'link-1',
        resource_type: 'file',
        resource_id: 'file-1',
        creator_id: DEFAULT_USER.id,
        token: 'sec_arch_demo_2026',
        permission: 'viewer',
        password_hash: null,
        has_password: false,
        allow_download: true,
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        max_downloads: 100,
        download_count: 14,
        view_count: 48,
        is_active: true,
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
    ]);
    this.sharedWithMe = loadTable('shared_with_me', []);
    this.fileRequests = loadTable('file_requests', [
      {
        id: 'req-1',
        creator_id: DEFAULT_USER.id,
        target_folder_id: 'folder-1',
        title: 'Submit Q3 Expense Receipts',
        description: 'Please upload scanned invoices or PDF receipts here for audit processing.',
        token: 'req_expenses_q3',
        max_file_size_bytes: 52428800, // 50MB
        allowed_extensions: ['pdf', 'png', 'jpg'],
        expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        is_active: true,
        upload_count: 3,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ]);
    this.comments = loadTable('comments', [
      {
        id: 'comm-1',
        file_id: 'file-1',
        user_id: DEFAULT_USER.id,
        parent_comment_id: null,
        content: 'Please verify the RLS security policies on page 14 before final sign-off.',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        user: DEFAULT_USER,
      },
    ]);
    this.activityLogs = loadTable('activity_logs', [
      {
        id: 'act-1',
        user_id: DEFAULT_USER.id,
        resource_type: 'file',
        resource_id: 'file-1',
        resource_name: 'Master Cloud Architecture & Security Overview.pdf',
        action: 'upload',
        details: { size: 4280000 },
        ip_address: '192.168.1.100',
        user_agent: 'Chrome 122.0.0.0 (Windows)',
        created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
      {
        id: 'act-2',
        user_id: DEFAULT_USER.id,
        resource_type: 'folder',
        resource_id: 'folder-1',
        resource_name: 'Work Documents',
        action: 'share',
        details: { sharedWith: 'sarah.connor@example.com', permission: 'editor' },
        ip_address: '192.168.1.100',
        user_agent: 'Chrome 122.0.0.0 (Windows)',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ]);
    this.notifications = loadTable('notifications', [
      {
        id: 'notif-1',
        user_id: DEFAULT_USER.id,
        actor_id: null,
        title: 'Welcome to Master Cloud',
        message: 'Your production-grade cloud storage is ready with 15 GB free quota.',
        type: 'system',
        resource_type: null,
        resource_id: null,
        is_read: false,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'notif-2',
        user_id: DEFAULT_USER.id,
        actor_id: null,
        title: 'Folder Shared',
        message: 'Work Documents was shared with sarah.connor@example.com',
        type: 'share',
        resource_type: 'folder',
        resource_id: 'folder-1',
        is_read: true,
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ]);
    this.devices = loadTable('devices', [
      {
        id: 'dev-1',
        user_id: DEFAULT_USER.id,
        device_name: 'Windows Workstation (Primary)',
        platform: 'Windows 11',
        browser: 'Chrome 122',
        ip_address: '192.168.1.100',
        last_active_at: new Date().toISOString(),
        is_current: true,
        is_revoked: false,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'dev-2',
        user_id: DEFAULT_USER.id,
        device_name: 'MacBook Pro 16"',
        platform: 'macOS Sonoma',
        browser: 'Safari 17',
        ip_address: '198.51.100.42',
        last_active_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        is_current: false,
        is_revoked: false,
        created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      },
    ]);

    let savedUser = localStorage.getItem(DB_PREFIX + 'current_user');
    if (!savedUser) {
      // Migrate existing session from previous version
      savedUser = localStorage.getItem('master_cloud_current_user');
      if (savedUser) {
        try {
          localStorage.setItem(DB_PREFIX + 'current_user', savedUser);
        } catch { /* ignore */ }
      }
    }
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (
          parsed &&
          parsed.email &&
          parsed.email !== 'azure.user@outlook.com' &&
          parsed.display_name !== 'Microsoft User' &&
          !(parsed.avatar_url && parsed.avatar_url.includes('unsplash.com'))
        ) {
          this.currentUser = parsed;
          currentDbUserEmail = parsed.email;
        } else {
          localStorage.removeItem(DB_PREFIX + 'current_user');
          this.currentUser = DEFAULT_USER;
          currentDbUserEmail = DEFAULT_USER.email;
        }
      } catch {
        localStorage.removeItem(DB_PREFIX + 'current_user');
        this.currentUser = DEFAULT_USER;
        currentDbUserEmail = DEFAULT_USER.email;
      }
    } else {
      this.currentUser = DEFAULT_USER;
      currentDbUserEmail = DEFAULT_USER.email;
    }

    const isMaster = currentDbUserEmail.toLowerCase() === 'immaster2024@gmail.com';
    const currentPrefix = currentDbUserEmail.split('@')[0].toLowerCase();
    const userSeed = USER_SEED_DATA[currentDbUserEmail.toLowerCase()] || (currentPrefix ? USER_SEED_DATA[`${currentPrefix}@gmail.com`] : null);
    const initialFiles = isMaster ? SEED_FILES : (userSeed ? userSeed.files : []);
    const initialFolders = isMaster ? SEED_FOLDERS : (userSeed ? userSeed.folders : []);

    this.files = loadTable('files', initialFiles);
    this.folders = loadTable('folders', initialFolders);
    this.sharedWithMe = loadTable('shared_with_me', []);

    if (isMaster) {
      if (!this.files || this.files.length === 0) {
        this.files = [...SEED_FILES];
      }
      if (!this.folders || this.folders.length === 0) {
        this.folders = [...SEED_FOLDERS];
      }
      // Ensure all existing master files and folders belong to immaster2024@gmail.com
      this.folders.forEach(f => {
        if (!f.owner_id || f.owner_id === 'usr-1' || f.owner_id === 'usr-local') {
          f.owner_id = DEFAULT_USER.id;
        }
      });
      this.files.forEach(f => {
        if (!f.owner_id || f.owner_id === 'usr-1' || f.owner_id === 'usr-local') {
          f.owner_id = DEFAULT_USER.id;
        }
      });
      saveTable('folders', this.folders);
      saveTable('files', this.files);
    } else if (userSeed) {
      if (!this.files || this.files.length === 0) {
        this.files = [...initialFiles];
      }
      if (!this.folders || this.folders.length === 0) {
        this.folders = [...initialFolders];
      }
      saveTable('folders', this.folders);
      saveTable('files', this.files);
    }
  }

  isItemVisible(ownerId?: string | null, storagePath?: string): boolean {
    const activeUserId = this.currentUser?.id;
    const activeEmail = (this.currentUser?.email || '').trim().toLowerCase();

    // If no active user profile set yet, keep visible
    if (!activeUserId) return true;

    // Master account & admins see everything
    const isMasterUser = activeEmail === 'immaster2024@gmail.com' || activeEmail.startsWith('admin@');
    if (isMasterUser) {
      return true;
    }

    // Direct ownership match
    if (ownerId && (ownerId === activeUserId || ownerId === this.currentUser?.id)) return true;

    // Email or prefix match for this user
    const currentPrefix = activeEmail.split('@')[0].toLowerCase();
    if (ownerId) {
      const lowerOwner = ownerId.toLowerCase();
      if (lowerOwner.includes(activeEmail) || (currentPrefix && lowerOwner.includes(currentPrefix))) return true;
    }

    // Cloud files (Catbox, Telegram Cloud, HTTP) are shared cloud assets available across accounts
    if (storagePath && (storagePath.startsWith('http://') || storagePath.startsWith('https://') || storagePath.startsWith('tgcloud:'))) {
      return true;
    }

    // Seed & common workspace files
    if (!ownerId || ownerId === 'usr-1' || ownerId === 'usr-local' || ownerId === 'usr-inuka-minsara-master') {
      return true;
    }

    // Local Z: drive files
    if (storagePath && storagePath.startsWith('zdrive:')) {
      return true;
    }

    return true;
  }

  // --- Auth / Profile ---
  getCurrentUser(): ProfileRecord {
    return this.currentUser;
  }

  setCurrentUser(user: ProfileRecord | null): void {
    if (!user || !user.email) {
      this.currentUser = null as any;
      currentDbUserEmail = '';
      localStorage.removeItem(DB_PREFIX + 'current_user');
      this.files = [];
      this.folders = [];
      return;
    }

    const newEmail = (user.email || '').trim().toLowerCase();
    currentDbUserEmail = newEmail;
    this.currentUser = user;
    localStorage.setItem(DB_PREFIX + 'current_user', JSON.stringify(user));

    // Reload tables for this user from their isolated localStorage partition!
    const isMaster = newEmail === 'immaster2024@gmail.com';
    const currentPrefix = newEmail.split('@')[0].toLowerCase();
    const userSeed = USER_SEED_DATA[newEmail] || (currentPrefix ? USER_SEED_DATA[`${currentPrefix}@gmail.com`] : null);

    const initialFiles = isMaster ? SEED_FILES : (userSeed ? userSeed.files : SEED_FILES);
    const initialFolders = isMaster ? SEED_FOLDERS : (userSeed ? userSeed.folders : SEED_FOLDERS);

    this.files = loadTable('files', initialFiles);
    this.folders = loadTable('folders', initialFolders);
    this.sharedWithMe = loadTable('shared_with_me', []);

    if (isMaster) {
      if (!this.files || this.files.length === 0) {
        this.files = [...SEED_FILES];
      }
      if (!this.folders || this.folders.length === 0) {
        this.folders = [...SEED_FOLDERS];
      }
      this.folders.forEach(f => {
        if (!f.owner_id || f.owner_id === 'usr-1' || f.owner_id === 'usr-local') {
          f.owner_id = DEFAULT_USER.id;
        }
      });
      this.files.forEach(f => {
        if (!f.owner_id || f.owner_id === 'usr-1' || f.owner_id === 'usr-local') {
          f.owner_id = DEFAULT_USER.id;
        }
      });
      saveTable('folders', this.folders);
      saveTable('files', this.files);
    } else {
      if (!this.folders || this.folders.length === 0) {
        this.folders = [...initialFolders];
      }
      if (userSeed && (!this.files || this.files.length === 0)) {
        this.files = [...initialFiles];
      }
      // Guarantee ownership for active user
      this.folders.forEach(f => {
        if (!f.owner_id || f.owner_id.includes(currentPrefix)) {
          f.owner_id = user.id;
        }
      });
      this.files.forEach(f => {
        if (!f.owner_id || f.owner_id.includes(currentPrefix)) {
          f.owner_id = user.id;
        }
      });
      saveTable('folders', this.folders);
      saveTable('files', this.files);
    }
    this.versions = loadTable('versions', []);
    this.shares = loadTable('shares', []);
    this.shareLinks = loadTable('share_links', []);
    this.fileRequests = loadTable('file_requests', []);
    this.comments = loadTable('comments', []);
    this.activityLogs = loadTable('activity_logs', []);
    this.notifications = loadTable('notifications', []);
    this.devices = loadTable('devices', []);

    this.syncCacheTimestamps.clear();
    this.syncWithLocalDrive(null).catch(() => {});
  }

  async updateProfile(updates: Partial<ProfileRecord>): Promise<ProfileRecord> {
    this.currentUser = { ...this.currentUser, ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(DB_PREFIX + 'current_user', JSON.stringify(this.currentUser));
    return this.currentUser;
  }

  // --- Local Drive (Z:\ / D:\MasterCloudDrive) Two-Way Sync Helpers ---
  private getFolderRelPath(folderId: string | null): string {
    if (!folderId) return '';
    const parts: string[] = [];
    let currId: string | null = folderId;
    let safety = 0;
    while (currId && safety++ < 30) {
      const folder = this.folders.find(f => f.id === currId);
      if (!folder) break;
      parts.unshift(folder.name);
      currId = folder.parent_folder_id;
    }
    return parts.join('/');
  }

  private guessMimeType(ext: string): string {
    const map: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      mp4: 'video/mp4',
      mkv: 'video/x-matroska',
      webm: 'video/webm',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      txt: 'text/plain',
      md: 'text/markdown',
      json: 'application/json',
      js: 'text/javascript',
      ts: 'text/typescript',
      html: 'text/html',
      css: 'text/css',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      zip: 'application/zip',
    };
    return map[ext.toLowerCase()] || 'application/octet-stream';
  }

  notifyStorageUpdated(): void {
    if (typeof window !== 'undefined') {
      try {
        const breakdown = this.getStorageBreakdown();
        window.dispatchEvent(new CustomEvent('mc_storage_updated', { detail: breakdown }));
      } catch {}
    }
  }

  private syncCacheTimestamps = new Map<string, number>();

  async syncWithLocalDrive(parentFolderId: string | null = null): Promise<void> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;

    const cacheKey = parentFolderId || '__root__';
    const now = Date.now();
    const lastSync = this.syncCacheTimestamps.get(cacheKey) || 0;
    if (now - lastSync < 3000) {
      return;
    }
    this.syncCacheTimestamps.set(cacheKey, now);

    try {
      const parentRel = this.getFolderRelPath(parentFolderId);
      const queryParam = parentRel ? encodeURIComponent(parentRel) : '__root__';
      const currentEmail = (this.currentUser?.email || '').trim().toLowerCase();
      if (!currentEmail) return;

      let res: Response | null = null;
      try {
        res = await fetch(`http://127.0.0.1:8766/api/local-drive/list?parent=${queryParam}&user=${encodeURIComponent(currentEmail)}`);
        if (!res.ok) throw new Error();
      } catch {
        try {
          res = await fetch(`/api/local-drive/list?parent=${queryParam}&user=${encodeURIComponent(currentEmail)}`);
          if (!res.ok) throw new Error();
        } catch {
          // Local background daemon offline or on Netlify without daemon — return gracefully
          return;
        }
      }
      const data = await res.json().catch(() => null);
      if (!data?.ok || data?.isMounted === false || !Array.isArray(data.items)) return;

      const driveUser = (data.user || '').trim().toLowerCase();
      if (!driveUser || driveUser !== currentEmail) {
        // Drive does not match this user! Request background user switch
        try {
          fetch('http://127.0.0.1:8766/api/user/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: currentEmail }),
          }).catch(() => {});
        } catch { /* ignore */ }
        // STRICT ACCOUNT ISOLATION: Purge stale zdrive items and DO NOT ingest items from other user!
        this.files = this.files.filter(f => !f.storage_path.startsWith('zdrive:'));
        this.folders = this.folders.filter(f => !f.id.startsWith('zfolder-'));
        saveTable('folders', this.folders);
        saveTable('files', this.files);
        this.notifyStorageUpdated();
        return;
      }

      const diskItems: Array<{
        relPath: string;
        name: string;
        isDir: boolean;
        parentRelPath: string | null;
        size: number;
        mtime: string;
        birthtime: string;
      }> = data.items;

      // Build folder lookup maps: relPath -> folder.id
      const folderMapByRel = new Map<string, string>();
      for (const f of this.folders) {
        if (!f.deleted_at) {
          const rel = this.getFolderRelPath(f.id);
          folderMapByRel.set(rel, f.id);
        }
      }

      const existingFileByPath = new Map<string, FileRecord>();
      for (const f of this.files) {
        if (!f.deleted_at && f.storage_path) {
          existingFileByPath.set(f.storage_path, f);
        }
      }

      let changed = false;

      // 1. Sync folders in order of shortest relPath (root folders first)
      const diskFolders = diskItems.filter(i => i.isDir).sort((a, b) => a.relPath.length - b.relPath.length);
      for (const item of diskFolders) {
        let folderId = folderMapByRel.get(item.relPath);
        if (!folderId) {
          const parentFolderRel = item.parentRelPath || '';
          const parentFid = parentFolderRel ? (folderMapByRel.get(parentFolderRel) || null) : null;
          const newFolderId = 'zfolder-' + item.relPath.replace(/[^a-zA-Z0-9_-]/g, '_');
          const newFolder: FolderRecord = {
            id: newFolderId,
            owner_id: this.currentUser.id,
            parent_folder_id: parentFid,
            name: item.name,
            color: '#3b82f6',
            is_starred: false,
            deleted_at: null,
            created_at: item.birthtime || new Date().toISOString(),
            updated_at: item.mtime || new Date().toISOString(),
          };
          this.folders.push(newFolder);
          folderMapByRel.set(item.relPath, newFolderId);
          changed = true;
        }
      }

      // 2. Sync all files across the drive
      const diskFiles = diskItems.filter(i => !i.isDir);
      for (const item of diskFiles) {
        const itemStoragePath = (item as any).storagePath || ((item as any).cloudUrls && (item as any).cloudUrls[0]) || `zdrive:${item.relPath}`;
        const existing = existingFileByPath.get(itemStoragePath) || existingFileByPath.get(`zdrive:${item.relPath}`);
        const parentFolderRel = item.parentRelPath || '';
        const parentFid = parentFolderRel ? (folderMapByRel.get(parentFolderRel) || null) : null;

        if (!existing) {
          const ext = getFileExtension(item.name);
          const newFile: FileRecord = {
            id: 'zfile-' + item.relPath.replace(/[^a-zA-Z0-9_-]/g, '_'),
            owner_id: this.currentUser.id,
            parent_folder_id: parentFid,
            name: item.name,
            storage_path: itemStoragePath,
            mime_type: this.guessMimeType(ext),
            size_bytes: item.size,
            extension: ext,
            checksum: `z-${item.size}-${new Date(item.mtime).getTime()}`,
            is_starred: false,
            deleted_at: null,
            current_version_id: 'zver-' + Date.now(),
            created_at: item.birthtime || new Date().toISOString(),
            updated_at: item.mtime || new Date().toISOString(),
          };
          this.files.push(newFile);
          existingFileByPath.set(itemStoragePath, newFile);
          changed = true;
        } else {
          if (existing.size_bytes !== item.size) {
            existing.size_bytes = item.size;
            existing.updated_at = item.mtime;
            changed = true;
          }
          if (existing.storage_path !== itemStoragePath && itemStoragePath.startsWith('http')) {
            existing.storage_path = itemStoragePath;
            changed = true;
          }
          if (existing.parent_folder_id !== parentFid) {
            existing.parent_folder_id = parentFid;
            changed = true;
          }
        }
      }

      if (changed) {
        saveTable('folders', this.folders);
        saveTable('files', this.files);
        this.notifyStorageUpdated();
      }
    } catch {
      // Offline or Vite middleware not running — ignore gracefully
    }
  }

  // --- Folders ---
  async getFolders(parentFolderId: string | null = null, includeDeleted: boolean = false): Promise<FolderItem[]> {
    await this.syncWithLocalDrive(parentFolderId);
    const targetFolders = this.folders
      .filter(f => (includeDeleted ? f.deleted_at !== null : f.deleted_at === null))
      .filter(f => (includeDeleted ? true : f.parent_folder_id === parentFolderId))
      .filter(f => this.isItemVisible(f.owner_id));

    // Fast O(N) pre-aggregated counts
    const counts = new Map<string, number>();
    for (const f of this.files) {
      if (!f.deleted_at && f.parent_folder_id && this.isItemVisible(f.owner_id)) {
        counts.set(f.parent_folder_id, (counts.get(f.parent_folder_id) || 0) + 1);
      }
    }
    for (const s of this.folders) {
      if (!s.deleted_at && s.parent_folder_id && this.isItemVisible(s.owner_id)) {
        counts.set(s.parent_folder_id, (counts.get(s.parent_folder_id) || 0) + 1);
      }
    }

    return targetFolders.map(f => ({
      ...f,
      item_count: counts.get(f.id) || 0,
    }));
  }

  async getFolderById(id: string): Promise<FolderRecord | null> {
    return this.folders.find(f => f.id === id) || null;
  }

  async getFolderAncestors(folderId: string | null): Promise<FolderRecord[]> {
    const ancestors: FolderRecord[] = [];
    let currentId = folderId;
    while (currentId) {
      const folder = this.folders.find(f => f.id === currentId);
      if (!folder) break;
      ancestors.unshift(folder);
      currentId = folder.parent_folder_id;
    }
    return ancestors;
  }

  async createFolder(name: string, parentFolderId: string | null = null, color?: string): Promise<FolderRecord> {
    const cleanName = name.trim();
    const parentRel = this.getFolderRelPath(parentFolderId);
    const relPath = parentRel ? `${parentRel}/${cleanName}` : cleanName;

    const newFolder: FolderRecord = {
      id: 'folder-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      owner_id: this.currentUser.id,
      parent_folder_id: parentFolderId,
      name: cleanName,
      color: color || '#3b82f6',
      is_starred: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.folders.push(newFolder);
    saveTable('folders', this.folders);

    // Also create the real folder on Z:\ (D:\MasterCloudDrive)
    if (typeof fetch !== 'undefined') {
      fetch('/api/local-drive/fs-op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'mkdir', relPath }),
      }).catch(() => {});
    }

    await this.logActivity('folder', newFolder.id, newFolder.name, 'copy', { action: 'create' });
    return newFolder;
  }

  getFolderDescendants(folderId: string): { files: FileRecord[]; folders: FolderRecord[] } {
    const resultFiles: FileRecord[] = [];
    const resultFolders: FolderRecord[] = [];

    const queue: string[] = [folderId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // Add direct child files (not deleted)
      const childrenFiles = this.files.filter(f => f.parent_folder_id === currentId && !f.deleted_at);
      resultFiles.push(...childrenFiles);

      // Add direct child folders (not deleted)
      const childrenFolders = this.folders.filter(f => f.parent_folder_id === currentId && !f.deleted_at);
      resultFolders.push(...childrenFolders);
      for (const cf of childrenFolders) {
        queue.push(cf.id);
      }
    }

    return { files: resultFiles, folders: resultFolders };
  }

  async renameFolder(id: string, newName: string): Promise<FolderRecord> {
    const folder = this.folders.find(f => f.id === id);
    if (!folder) throw new Error('Folder not found');
    const oldRelPath = this.getFolderRelPath(folder.id);
    folder.name = newName.trim();
    folder.updated_at = new Date().toISOString();
    const newRelPath = this.getFolderRelPath(folder.id);
    saveTable('folders', this.folders);

    if (typeof fetch !== 'undefined' && oldRelPath) {
      fetch('/api/local-drive/fs-op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'rename', relPath: oldRelPath, newRelPath }),
      }).catch(() => {});
    }

    await this.logActivity('folder', folder.id, folder.name, 'rename', { newName });
    return folder;
  }

  async moveFolder(id: string, newParentFolderId: string | null): Promise<FolderRecord> {
    const folder = this.folders.find(f => f.id === id);
    if (!folder) throw new Error('Folder not found');
    if (id === newParentFolderId) throw new Error('Cannot move folder into itself');
    const oldRelPath = this.getFolderRelPath(folder.id);
    folder.parent_folder_id = newParentFolderId;
    folder.updated_at = new Date().toISOString();
    const newRelPath = this.getFolderRelPath(folder.id);
    saveTable('folders', this.folders);

    if (typeof fetch !== 'undefined' && oldRelPath) {
      fetch('/api/local-drive/fs-op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'rename', relPath: oldRelPath, newRelPath }),
      }).catch(() => {});
    }

    await this.logActivity('folder', folder.id, folder.name, 'move', { newParentFolderId });
    return folder;
  }

  async softDeleteFolder(id: string): Promise<void> {
    const folder = this.folders.find(f => f.id === id);
    if (!folder) return;
    const relPath = this.getFolderRelPath(folder.id);
    const now = new Date().toISOString();
    folder.deleted_at = now;

    // Cascade delete descendants
    const markDescendants = (parentId: string) => {
      this.folders.filter(f => f.parent_folder_id === parentId).forEach(child => {
        child.deleted_at = now;
        markDescendants(child.id);
      });
      this.files.filter(f => f.parent_folder_id === parentId).forEach(f => {
        f.deleted_at = now;
      });
    };
    markDescendants(id);

    if (typeof fetch !== 'undefined' && relPath) {
      fetch('/api/local-drive/fs-op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'trash', relPath }),
      }).catch(() => {});
    }

    saveTable('folders', this.folders);
    saveTable('files', this.files);
    await this.logActivity('folder', folder.id, folder.name, 'delete', {});
    this.notifyStorageUpdated();
  }

  async restoreFolder(id: string): Promise<void> {
    const folder = this.folders.find(f => f.id === id);
    if (!folder) return;
    const relPath = this.getFolderRelPath(folder.id);
    folder.deleted_at = null;

    const restoreDescendants = (parentId: string) => {
      this.folders.filter(f => f.parent_folder_id === parentId).forEach(child => {
        child.deleted_at = null;
        restoreDescendants(child.id);
      });
      this.files.filter(f => f.parent_folder_id === parentId).forEach(f => {
        f.deleted_at = null;
      });
    };
    restoreDescendants(id);

    if (typeof fetch !== 'undefined' && relPath) {
      fetch('/api/local-drive/fs-op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'restore', relPath }),
      }).catch(() => {});
    }

    saveTable('folders', this.folders);
    saveTable('files', this.files);
    await this.logActivity('folder', folder.id, folder.name, 'restore', {});
    this.notifyStorageUpdated();
  }

  async permanentDeleteFolder(id: string): Promise<void> {
    const relPath = this.getFolderRelPath(id);
    const collectIds = (parentId: string, folderIds: string[], fileIds: string[]) => {
      folderIds.push(parentId);
      this.files.filter(f => f.parent_folder_id === parentId).forEach(f => fileIds.push(f.id));
      this.folders.filter(f => f.parent_folder_id === parentId).forEach(child => {
        collectIds(child.id, folderIds, fileIds);
      });
    };
    const folderIds: string[] = [];
    const fileIds: string[] = [];
    collectIds(id, folderIds, fileIds);

    if (typeof fetch !== 'undefined' && relPath) {
      fetch('/api/local-drive/fs-op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'delete', relPath }),
      }).catch(() => {});
    }

    this.folders = this.folders.filter(f => !folderIds.includes(f.id));
    this.files = this.files.filter(f => !fileIds.includes(f.id));
    saveTable('folders', this.folders);
    saveTable('files', this.files);
    this.notifyStorageUpdated();
  }

  async toggleStarFolder(id: string): Promise<boolean> {
    const folder = this.folders.find(f => f.id === id);
    if (!folder) return false;
    folder.is_starred = !folder.is_starred;
    saveTable('folders', this.folders);
    return folder.is_starred;
  }

  // --- Files ---
  async getFiles(parentFolderId: string | null = null, includeDeleted: boolean = false): Promise<FileItem[]> {
    await this.syncWithLocalDrive(parentFolderId);
    return this.files
      .filter(f => (includeDeleted ? f.deleted_at !== null : f.deleted_at === null))
      .filter(f => (includeDeleted ? true : f.parent_folder_id === parentFolderId))
      .filter(f => this.isItemVisible(f.owner_id, f.storage_path))
      .map(f => ({
        ...f,
        owner: this.currentUser,
      }));
  }

  async getFileById(id: string): Promise<FileItem | null> {
    const file = this.files.find(f => f.id === id);
    if (!file) return null;
    return {
      ...file,
      owner: this.currentUser,
      versions: this.versions.filter(v => v.file_id === id),
    };
  }

  async uploadFile(
    file: File,
    parentFolderId: string | null = null,
    onProgress?: (progress: number, bytesUploaded: number) => void
  ): Promise<FileItem> {
    // Quota Enforcement: Verify (current_used_storage + incoming_file_size) <= 10 TB
    const breakdown = this.getStorageBreakdown();
    if (breakdown.usedStorage + file.size > breakdown.totalQuota) {
      throw new Error('Not enough storage available.');
    }

    const checksum = await calculateFileChecksum(file);
    const ext = getFileExtension(file.name);
    const folderRel = this.getFolderRelPath(parentFolderId);
    const relPath = folderRel ? `${folderRel}/${file.name}` : file.name;
    const storagePath = `zdrive:${relPath}`;

    // Simulate realistic chunked progress if large
    const chunkSize = 256 * 1024; // 256KB chunks
    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
    let bytesUploaded = 0;

    for (let i = 0; i < totalChunks; i++) {
      await new Promise(resolve => setTimeout(resolve, 15));
      bytesUploaded = Math.min(file.size, (i + 1) * chunkSize);
      const progress = file.size > 0 ? Math.round((bytesUploaded / file.size) * 100) : 100;
      onProgress?.(progress, bytesUploaded);
    }

    // 1. Write actual file directly to Z:\ (D:\MasterCloudDrive) via Vite Local Drive Bridge
    if (typeof fetch !== 'undefined') {
      try {
        await fetch('/api/local-drive/upload', {
          method: 'POST',
          headers: {
            'x-file-path': encodeURIComponent(relPath),
          },
          body: file,
        });
      } catch {
        // Fallback if offline
      }
    }

    // 2. Also cache in IndexedDB for instant offline access
    await binaryStorage.saveBlob(storagePath, file);

    const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newVersion: FileVersionRecord = {
      id: 'ver-' + Date.now(),
      file_id: fileId,
      version_number: 1,
      storage_path: storagePath,
      size_bytes: file.size,
      checksum,
      created_by: this.currentUser.id,
      notes: 'Saved to Z: Drive (D:\\MasterCloudDrive)',
      created_at: new Date().toISOString(),
    };

    const newFile: FileRecord = {
      id: fileId,
      owner_id: this.currentUser.id,
      parent_folder_id: parentFolderId,
      name: file.name,
      storage_path: storagePath,
      mime_type: file.type || this.guessMimeType(ext),
      size_bytes: file.size,
      extension: ext,
      checksum,
      is_starred: false,
      deleted_at: null,
      current_version_id: newVersion.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Replace if same path already existed
    this.files = this.files.filter(f => f.storage_path !== storagePath);
    this.files.push(newFile);
    this.versions.push(newVersion);
    saveTable('files', this.files);
    saveTable('versions', this.versions);
    this.notifyStorageUpdated();

    await this.logActivity('file', newFile.id, newFile.name, 'upload', {
      size: file.size,
      mimeType: file.type,
      drivePath: `Z:\\${relPath.replace(/\//g, '\\')}`,
    });

    return {
      ...newFile,
      owner: this.currentUser,
      versions: [newVersion],
    };
  }

  async createDocumentFile(
    name: string,
    content: string,
    mimeType: string,
    extension: string,
    parentFolderId: string | null = null
  ): Promise<FileItem> {
    const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const storagePath = `canvas/${this.currentUser.id}/${fileId}-${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const blob = new Blob([content], { type: mimeType });
    await binaryStorage.saveBlob(storagePath, blob);

    const newVersion: FileVersionRecord = {
      id: 'ver-' + Date.now(),
      file_id: fileId,
      version_number: 1,
      storage_path: storagePath,
      size_bytes: blob.size,
      checksum: 'ck-' + Date.now(),
      created_by: this.currentUser.id,
      notes: 'Created in Master Canvas',
      created_at: new Date().toISOString(),
    };

    const newFile: FileRecord = {
      id: fileId,
      owner_id: this.currentUser.id,
      parent_folder_id: parentFolderId,
      name,
      storage_path: storagePath,
      mime_type: mimeType,
      size_bytes: blob.size,
      extension,
      checksum: newVersion.checksum,
      is_starred: false,
      deleted_at: null,
      current_version_id: newVersion.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.files.unshift(newFile);
    this.versions.unshift(newVersion);
    saveTable('files', this.files);
    saveTable('versions', this.versions);
    this.notifyStorageUpdated();

    await this.logActivity('file', newFile.id, newFile.name, 'create', {
      canvas: true,
      size: blob.size,
    });

    return {
      ...newFile,
      owner: this.currentUser,
      versions: [newVersion],
    };
  }

  async getFileBlob(storagePath: string): Promise<Blob | null> {
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      try {
        const res = await fetch(storagePath);
        if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
          return await res.blob();
        }
      } catch {
        // Fallback
      }
    }
    if (storagePath.startsWith('zdrive:') && typeof fetch !== 'undefined') {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocal) {
        try {
          const relPath = storagePath.slice('zdrive:'.length);
          const res = await fetch(`/api/local-drive/read?path=${encodeURIComponent(relPath)}`);
          if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
            return await res.blob();
          }
        } catch {
          // Fallback to IndexedDB
        }
      }
    }
    const stored = await binaryStorage.getBlob(storagePath);
    if (stored) return stored;

    if (storagePath.startsWith('seed/')) {
      const generated = createSeedBlob(storagePath);
      if (generated) {
        await binaryStorage.saveBlob(storagePath, generated);
        return generated;
      }
    }
    return null;
  }

  async renameFile(id: string, newName: string): Promise<FileRecord> {
    const file = this.files.find(f => f.id === id);
    if (!file) throw new Error('File not found');
    const cleanNewName = newName.trim();
    if (file.storage_path.startsWith('zdrive:') && typeof fetch !== 'undefined') {
      const oldRel = file.storage_path.slice('zdrive:'.length);
      const folderRel = this.getFolderRelPath(file.parent_folder_id);
      const newRel = folderRel ? `${folderRel}/${cleanNewName}` : cleanNewName;
      file.storage_path = `zdrive:${newRel}`;
      fetch('/api/local-drive/fs-op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'rename', relPath: oldRel, newRelPath: newRel }),
      }).catch(() => {});
    }
    file.name = cleanNewName;
    file.extension = getFileExtension(cleanNewName);
    file.updated_at = new Date().toISOString();
    saveTable('files', this.files);
    await this.logActivity('file', file.id, file.name, 'rename', { newName: cleanNewName });
    return file;
  }

  async moveFile(id: string, newParentFolderId: string | null): Promise<FileRecord> {
    const file = this.files.find(f => f.id === id);
    if (!file) throw new Error('File not found');
    if (file.storage_path.startsWith('zdrive:') && typeof fetch !== 'undefined') {
      const oldRel = file.storage_path.slice('zdrive:'.length);
      const folderRel = this.getFolderRelPath(newParentFolderId);
      const newRel = folderRel ? `${folderRel}/${file.name}` : file.name;
      file.storage_path = `zdrive:${newRel}`;
      fetch('/api/local-drive/fs-op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'rename', relPath: oldRel, newRelPath: newRel }),
      }).catch(() => {});
    }
    file.parent_folder_id = newParentFolderId;
    file.updated_at = new Date().toISOString();
    saveTable('files', this.files);
    await this.logActivity('file', file.id, file.name, 'move', { newParentFolderId });
    return file;
  }

  async copyFile(id: string, targetFolderId: string | null = null): Promise<FileItem> {
    const file = this.files.find(f => f.id === id);
    if (!file) throw new Error('File not found');

    const copyId = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const copyName = file.name.includes('.')
      ? file.name.replace(/\.([^.]+)$/, ' (Copy).$1')
      : `${file.name} (Copy)`;

    const newFile: FileRecord = {
      ...file,
      id: copyId,
      name: copyName,
      parent_folder_id: targetFolderId !== undefined ? targetFolderId : file.parent_folder_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.files.push(newFile);
    saveTable('files', this.files);
    await this.logActivity('file', newFile.id, newFile.name, 'copy', { originalId: id });
    return { ...newFile, owner: this.currentUser };
  }

  async softDeleteFile(id: string): Promise<void> {
    const file = this.files.find(f => f.id === id);
    if (!file) return;
    if (file.storage_path.startsWith('zdrive:') && typeof fetch !== 'undefined') {
      const relPath = file.storage_path.slice('zdrive:'.length);
      fetch('/api/local-drive/fs-op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'trash', relPath }),
      }).catch(() => {});
    }
    file.deleted_at = new Date().toISOString();
    saveTable('files', this.files);
    await this.logActivity('file', file.id, file.name, 'delete', {});
    this.notifyStorageUpdated();
  }

  async restoreFile(id: string): Promise<void> {
    const file = this.files.find(f => f.id === id);
    if (!file) return;
    file.deleted_at = null;
    saveTable('files', this.files);

    if (typeof fetch !== 'undefined') {
      try {
        let restoredFromDiskTrash = false;
        if (file.storage_path.startsWith('zdrive:')) {
          const relPath = file.storage_path.slice('zdrive:'.length);
          const res = await fetch('/api/local-drive/fs-op', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ op: 'restore', relPath }),
          });
          if (res.ok) {
            restoredFromDiskTrash = true;
          }
        }

        // If not restored from disk trash (e.g. uploaded via web or was in binaryStorage),
        // write it directly to Z: so it is physically present on the local drive!
        if (!restoredFromDiskTrash || !file.storage_path.startsWith('zdrive:')) {
          const folderRel = this.getFolderRelPath(file.parent_folder_id);
          const targetRel = folderRel ? `${folderRel}/${file.name}` : file.name;
          const blob = await binaryStorage.getBlob(file.storage_path);
          if (blob) {
            await fetch('/api/local-drive/upload', {
              method: 'POST',
              headers: {
                'x-file-path': encodeURIComponent(targetRel),
                'Content-Type': 'application/octet-stream',
              },
              body: blob,
            });
            file.storage_path = `zdrive:${targetRel}`;
            saveTable('files', this.files);
          }
        }
      } catch {}
    }

    await this.logActivity('file', file.id, file.name, 'restore', {});
    this.notifyStorageUpdated();
  }

  async permanentDeleteFile(id: string): Promise<void> {
    const file = this.files.find(f => f.id === id);
    if (file) {
      if (file.storage_path.startsWith('zdrive:') && typeof fetch !== 'undefined') {
        const relPath = file.storage_path.slice('zdrive:'.length);
        fetch('/api/local-drive/fs-op', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'delete', relPath }),
        }).catch(() => {});
      }
      await binaryStorage.deleteBlob(file.storage_path);
    }
    this.files = this.files.filter(f => f.id !== id);
    this.versions = this.versions.filter(v => v.file_id !== id);
    saveTable('files', this.files);
    saveTable('versions', this.versions);
    this.notifyStorageUpdated();
  }

  async emptyTrash(): Promise<void> {
    const deletedFiles = this.files.filter(f => f.deleted_at !== null);
    for (const f of deletedFiles) {
      if (f.storage_path.startsWith('zdrive:') && typeof fetch !== 'undefined') {
        const relPath = f.storage_path.slice('zdrive:'.length);
        fetch('/api/local-drive/fs-op', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'delete', relPath }),
        }).catch(() => {});
      }
      await binaryStorage.deleteBlob(f.storage_path);
    }
    const deletedFolders = this.folders.filter(f => f.deleted_at !== null);
    for (const folder of deletedFolders) {
      const relPath = this.getFolderRelPath(folder.id);
      if (typeof fetch !== 'undefined' && relPath) {
        fetch('/api/local-drive/fs-op', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'delete', relPath }),
        }).catch(() => {});
      }
    }
    this.files = this.files.filter(f => f.deleted_at === null);
    this.folders = this.folders.filter(f => f.deleted_at === null);
    saveTable('files', this.files);
    saveTable('folders', this.folders);
    await this.logActivity('system', null, 'Trash', 'permanent_delete', { action: 'empty_trash' });
    this.notifyStorageUpdated();
  }

  async toggleStarFile(id: string): Promise<boolean> {
    const file = this.files.find(f => f.id === id);
    if (!file) return false;
    file.is_starred = !file.is_starred;
    saveTable('files', this.files);
    await this.logActivity('file', file.id, file.name, file.is_starred ? 'star' : 'unstar', {});
    return file.is_starred;
  }

  // --- Starred & Recent ---
  async getStarredItems(): Promise<{ files: FileItem[]; folders: FolderItem[] }> {
    await this.syncWithLocalDrive(null);
    const files = this.files
      .filter(f => Boolean(f.is_starred) && !f.deleted_at)
      .map(f => ({ ...f, owner: f.owner || this.currentUser }));
    const folders = this.folders
      .filter(f => Boolean(f.is_starred) && !f.deleted_at)
      .map(f => ({ ...f, owner: f.owner || this.currentUser }));
    return { files, folders };
  }

  async getRecentItems(limit: number = 24): Promise<FileItem[]> {
    await this.syncWithLocalDrive(null);
    return this.files
      .filter(f => !f.deleted_at)
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())
      .slice(0, limit)
      .map(f => ({ ...f, owner: f.owner || this.currentUser }));
  }

  // --- Media Library ---
  async getMediaFiles(type: 'all' | 'image' | 'video' | 'audio' = 'all'): Promise<FileItem[]> {
    await this.syncWithLocalDrive(null);
    return this.files
      .filter(f => !f.deleted_at && this.isItemVisible(f.owner_id, f.storage_path))
      .filter(f => {
        const cat = getFileCategory(f.mime_type, f.extension);
        if (type === 'all') return ['image', 'video', 'audio'].includes(cat);
        return cat === type;
      })
      .map(f => ({ ...f, owner: this.currentUser }));
  }

  // --- Global Search across all folders and files ---
  async search(query: string, category: string = 'all'): Promise<{ files: FileItem[]; folders: FolderItem[] }> {
    const q = (query || '').toLowerCase().trim();
    if (!q) return { files: [], folders: [] };

    await this.syncWithLocalDrive(null);

    const matchedFiles = this.files
      .filter(f => !f.deleted_at && this.isItemVisible(f.owner_id, f.storage_path))
      .filter(f => {
        if (category && category !== 'all') {
          const cat = getFileCategory(f.mime_type, f.extension);
          if (cat !== category) return false;
        }
        return (
          f.name.toLowerCase().includes(q) ||
          f.extension.toLowerCase().includes(q) ||
          (f.storage_path && f.storage_path.toLowerCase().includes(q))
        );
      })
      .map(f => ({ ...f, owner: this.currentUser }));

    const matchedFolders = (!category || category === 'all')
      ? this.folders
          .filter(fd => !fd.deleted_at && this.isItemVisible(fd.owner_id))
          .filter(fd => fd.name.toLowerCase().includes(q))
      : [];

    return { files: matchedFiles, folders: matchedFolders };
  }

  // --- Version History ---
  async getFileVersions(fileId: string): Promise<FileVersionRecord[]> {
    return this.versions
      .filter(v => v.file_id === fileId)
      .sort((a, b) => b.version_number - a.version_number);
  }

  async restoreFileVersion(fileId: string, versionId: string): Promise<FileRecord> {
    const file = this.files.find(f => f.id === fileId);
    const ver = this.versions.find(v => v.id === versionId && v.file_id === fileId);
    if (!file || !ver) throw new Error('File or version not found');

    file.storage_path = ver.storage_path;
    file.size_bytes = ver.size_bytes;
    file.checksum = ver.checksum;
    file.current_version_id = ver.id;
    file.updated_at = new Date().toISOString();

    saveTable('files', this.files);
    await this.logActivity('file', file.id, file.name, 'version_restore', {
      restoredVersion: ver.version_number,
    });
    return file;
  }

  async updateFileContent(fileId: string, content: string | Blob, mimeType?: string): Promise<FileItem> {
    const file = this.files.find(f => f.id === fileId);
    if (!file) throw new Error('File not found');

    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType || 'application/json' }) : content;
    const size = blob.size;
    const storagePath = `uploads/${this.currentUser.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    await binaryStorage.saveBlob(storagePath, blob);

    file.storage_path = storagePath;
    file.size_bytes = size;
    file.updated_at = new Date().toISOString();

    const newVer: FileVersionRecord = {
      id: 'ver-' + Date.now(),
      file_id: fileId,
      version_number: (this.versions.filter(v => v.file_id === fileId).length || 1) + 1,
      storage_path: storagePath,
      size_bytes: size,
      checksum: 'ck-' + Date.now(),
      created_by: this.currentUser.id,
      notes: 'Document update',
      created_at: new Date().toISOString(),
    };
    this.versions.push(newVer);
    file.current_version_id = newVer.id;

    saveTable('files', this.files);
    saveTable('versions', this.versions);
    await this.logActivity('file', file.id, file.name, 'update', { size });

    return { ...file, owner: this.currentUser };
  }

  async getFileContentText(fileId: string): Promise<string | null> {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return null;
    const blob = await this.getFileBlob(file.storage_path);
    if (!blob) return null;
    return await blob.text();
  }

  // --- Sharing & Links ---
  async getShares(resourceId: string): Promise<ShareRecord[]> {
    return this.shares.filter(s => s.resource_id === resourceId);
  }

  async createShare(
    resourceType: 'file' | 'folder',
    resourceId: string,
    email: string,
    permission: 'viewer' | 'commenter' | 'editor'
  ): Promise<ShareRecord> {
    const newShare: ShareRecord = {
      id: 'share-' + Date.now(),
      resource_type: resourceType,
      resource_id: resourceId,
      granter_id: this.currentUser.id,
      grantee_id: null,
      grantee_email: email,
      permission,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.shares.push(newShare);
    saveTable('shares', this.shares);
    await this.logActivity(resourceType, resourceId, email, 'share', { permission });
    return newShare;
  }

  async deleteShare(shareId: string): Promise<void> {
    this.shares = this.shares.filter(s => s.id !== shareId);
    saveTable('shares', this.shares);
  }

  async getShareLinks(resourceId: string): Promise<ShareLinkRecord[]> {
    return this.shareLinks.filter(s => s.resource_id === resourceId && s.is_active);
  }

  async createShareLink(options: {
    resourceType: 'file' | 'folder';
    resourceId: string;
    item?: FileItem | FolderItem;
    permission?: 'viewer' | 'editor';
    hasPassword?: boolean;
    password?: string;
    allowDownload?: boolean;
    expiresAt?: string | null;
  }): Promise<ShareLinkRecord & { share_url?: string; encoded_data?: string }> {
    const token = generateSecureToken(16);
    const newLink: ShareLinkRecord & { share_url?: string; encoded_data?: string } = {
      id: 'link-' + Date.now(),
      resource_type: options.resourceType,
      resource_id: options.resourceId,
      creator_id: this.currentUser?.id || 'usr-master',
      token,
      permission: options.permission || 'viewer',
      password_hash: options.password ? btoa(options.password) : null,
      has_password: Boolean(options.hasPassword && options.password),
      allow_download: options.allowDownload ?? true,
      expires_at: options.expiresAt || null,
      max_downloads: null,
      download_count: 0,
      view_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // Find the item snapshot
    const item = options.item || (options.resourceType === 'file'
      ? this.files.find(f => f.id === options.resourceId)
      : this.folders.find(f => f.id === options.resourceId));

    if (item) {
      const fullItem = { ...item, owner: item.owner || this.currentUser };
      const encoded = encodeSharePayload(fullItem, newLink);
      newLink.encoded_data = encoded;
      newLink.share_url = typeof window !== 'undefined'
        ? `${window.location.origin}/share/${token}${encoded ? `?d=${encoded}` : ''}`
        : `/share/${token}${encoded ? `?d=${encoded}` : ''}`;

      // Save to unpartitioned global public shares registry in localStorage
      saveGlobalPublicShare(token, newLink, fullItem);

      // Also sync to local backend (if Vite plugin or daemon running)
      if (typeof fetch !== 'undefined') {
        const payload = { link: newLink, item: fullItem, token };
        fetch('/api/shares/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
        fetch('http://127.0.0.1:8766/api/shares/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }
    }

    this.shareLinks.push(newLink);
    saveTable('share_links', this.shareLinks);
    return newLink;
  }

  async getShareLinkByToken(token: string, encodedData?: string | null): Promise<{ link: ShareLinkRecord; item: FileItem | FolderItem } | null> {
    if (!token) return null;

    // 1. If encoded data URL param is present, decode directly!
    if (encodedData) {
      const decoded = decodeSharePayload(encodedData);
      if (decoded && decoded.link.token === token) {
        if (decoded.link.expires_at && new Date(decoded.link.expires_at) < new Date()) {
          return null;
        }
        // Cache in global registry
        saveGlobalPublicShare(token, decoded.link, decoded.item);
        return decoded;
      }
    }

    // 2. Check global public shares registry
    const globalShares = getGlobalPublicShares();
    if (globalShares[token]) {
      const entry = globalShares[token];
      if (entry.link.is_active && (!entry.link.expires_at || new Date(entry.link.expires_at) >= new Date())) {
        entry.link.view_count = (entry.link.view_count || 0) + 1;
        saveGlobalPublicShare(token, entry.link, entry.item);
        return entry;
      }
    }

    // 3. Check memory share links (e.g. seed demo or current user)
    const memLink = this.shareLinks.find(s => s.token === token && s.is_active);
    if (memLink) {
      if (memLink.expires_at && new Date(memLink.expires_at) < new Date()) {
        return null;
      }
      memLink.view_count += 1;
      saveTable('share_links', this.shareLinks);
      const foundItem = memLink.resource_type === 'file'
        ? this.files.find(f => f.id === memLink.resource_id)
        : this.folders.find(f => f.id === memLink.resource_id);
      if (foundItem) {
        return { link: memLink, item: { ...foundItem, owner: foundItem.owner || this.currentUser } };
      }
    }

    // 4. Check backend API (/api/shares/get)
    if (typeof fetch !== 'undefined') {
      const endpoints = [
        `/api/shares/get?token=${encodeURIComponent(token)}`,
        `http://127.0.0.1:8766/api/shares/get?token=${encodeURIComponent(token)}`,
      ];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep);
          if (res.ok) {
            const json = await res.json();
            if (json?.ok && json?.data?.link && json?.data?.item) {
              const { link, item } = json.data;
              if (link.is_active && (!link.expires_at || new Date(link.expires_at) >= new Date())) {
                saveGlobalPublicShare(token, link, item);
                return { link, item };
              }
            }
          }
        } catch {}
      }
    }

    return null;
  }

  async revokeShareLink(linkId: string): Promise<void> {
    const link = this.shareLinks.find(s => s.id === linkId);
    if (link) {
      link.is_active = false;
      saveTable('share_links', this.shareLinks);
    }
  }

  async recordSharedAccess(item: FileItem | FolderItem, link: ShareLinkRecord): Promise<void> {
    const activeUserId = this.currentUser?.id;
    if (!activeUserId) return;

    // Do not mark item as "Shared with me" if it belongs to current user
    if (item.owner_id === activeUserId || (this.currentUser?.email && item.owner_id?.toLowerCase().includes(this.currentUser.email.toLowerCase()))) {
      return;
    }

    const existingIdx = this.sharedWithMe.findIndex(s => s.item_id === item.id && s.user_id === activeUserId);
    const entry = {
      id: `swm-${item.id}-${activeUserId}`,
      item_id: item.id,
      user_id: activeUserId,
      resource_type: link.resource_type,
      item: { ...item, owner: item.owner || { display_name: 'Collaborator', email: '' } },
      accessed_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      this.sharedWithMe[existingIdx] = entry;
    } else {
      this.sharedWithMe.unshift(entry);
    }
    saveTable('shared_with_me', this.sharedWithMe);
  }

  async getSharedWithMe(): Promise<{ files: FileItem[]; folders: FolderItem[] }> {
    await this.syncWithLocalDrive(null);
    const activeUserId = this.currentUser?.id;
    const activeEmail = (this.currentUser?.email || '').trim().toLowerCase();

    const resultFiles: FileItem[] = [];
    const resultFolders: FolderItem[] = [];
    const seenIds = new Set<string>();

    // 1. Explicit email shares (ShareDialog invite)
    const matchingShares = this.shares.filter(s =>
      (s.grantee_email && s.grantee_email.toLowerCase() === activeEmail) ||
      (s.grantee_id && s.grantee_id === activeUserId)
    );

    for (const sh of matchingShares) {
      if (sh.resource_type === 'file') {
        const f = this.files.find(item => item.id === sh.resource_id) ||
                  CLOUD_SEED_FILES.find(item => item.id === sh.resource_id);
        if (f && !seenIds.has(f.id)) {
          seenIds.add(f.id);
          resultFiles.push({ ...f, owner: f.owner || { display_name: 'Collaborator' } });
        }
      } else {
        const fd = this.folders.find(item => item.id === sh.resource_id) ||
                   CLOUD_SEED_FOLDERS.find(item => item.id === sh.resource_id);
        if (fd && !seenIds.has(fd.id)) {
          seenIds.add(fd.id);
          resultFolders.push({ ...fd, owner: fd.owner || { display_name: 'Collaborator' } });
        }
      }
    }

    // 2. Shared links accessed while signed in
    for (const record of this.sharedWithMe) {
      if (record.user_id === activeUserId && record.item && !seenIds.has(record.item.id)) {
        seenIds.add(record.item.id);
        if (record.resource_type === 'file') {
          resultFiles.push(record.item as FileItem);
        } else {
          resultFolders.push(record.item as FolderItem);
        }
      }
    }

    return { files: resultFiles, folders: resultFolders };
  }

  async isItemInMyDrive(itemId: string): Promise<boolean> {
    const activeUserId = this.currentUser?.id;
    if (!activeUserId) return false;
    return this.files.some(f => !f.deleted_at && (f.id === itemId || f.name === itemId) && f.owner_id === activeUserId) ||
           this.folders.some(fd => !fd.deleted_at && (fd.id === itemId || fd.name === itemId) && fd.owner_id === activeUserId);
  }

  async saveSharedItemToDrive(item: FileItem | FolderItem, isFolder: boolean): Promise<FileItem | FolderItem> {
    const activeUserId = this.currentUser?.id || 'usr-master';

    if (isFolder) {
      const existing = this.folders.find(f => !f.deleted_at && f.name.toLowerCase() === item.name.toLowerCase() && f.owner_id === activeUserId);
      if (existing) return existing;

      const newFolder = await this.createFolder(item.name, null, (item as FolderItem).color);
      return newFolder;
    } else {
      const file = item as FileItem;
      const existing = this.files.find(f => !f.deleted_at && (f.storage_path === file.storage_path || f.name === file.name) && f.owner_id === activeUserId);
      if (existing) return existing;

      const newFile: FileRecord = {
        id: 'f-saved-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        owner_id: activeUserId,
        parent_folder_id: null,
        name: file.name,
        storage_path: file.storage_path,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        extension: file.extension,
        is_starred: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner: this.currentUser,
      };

      this.files.unshift(newFile);
      saveTable('files', this.files);
      await this.logActivity('file', newFile.id, newFile.name, 'upload', { source: 'shared_import' });
      this.notifyStorageUpdated();
      return newFile;
    }
  }

  // --- File Requests ---
  async getFileRequests(): Promise<FileRequestRecord[]> {
    return this.fileRequests.filter(r => r.is_active);
  }

  async createFileRequest(options: {
    targetFolderId: string;
    title: string;
    description?: string;
    maxFileSizeBytes?: number;
    allowedExtensions?: string[];
    expiresAt?: string;
  }): Promise<FileRequestRecord> {
    const newReq: FileRequestRecord = {
      id: 'req-' + Date.now(),
      creator_id: this.currentUser.id,
      target_folder_id: options.targetFolderId,
      title: options.title,
      description: options.description || null,
      token: 'req_' + generateSecureToken(12),
      max_file_size_bytes: options.maxFileSizeBytes || 524288000,
      allowed_extensions: options.allowedExtensions || null,
      expires_at: options.expiresAt || null,
      is_active: true,
      upload_count: 0,
      created_at: new Date().toISOString(),
    };
    this.fileRequests.push(newReq);
    saveTable('file_requests', this.fileRequests);
    return newReq;
  }

  async getFileRequestByToken(token: string): Promise<FileRequestRecord | null> {
    const req = this.fileRequests.find(r => r.token === token && r.is_active);
    if (!req) return null;
    if (req.expires_at && new Date(req.expires_at) < new Date()) return null;
    return req;
  }

  // --- Comments ---
  async getComments(fileId: string): Promise<CommentRecord[]> {
    return this.comments
      .filter(c => c.file_id === fileId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async addComment(fileId: string, content: string, parentCommentId: string | null = null): Promise<CommentRecord> {
    const newComment: CommentRecord = {
      id: 'comm-' + Date.now(),
      file_id: fileId,
      user_id: this.currentUser.id,
      parent_comment_id: parentCommentId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: this.currentUser,
    };
    this.comments.push(newComment);
    saveTable('comments', this.comments);
    await this.logActivity('file', fileId, content.substring(0, 30), 'comment', {});
    return newComment;
  }

  async deleteComment(commentId: string): Promise<void> {
    this.comments = this.comments.filter(c => c.id !== commentId && c.parent_comment_id !== commentId);
    saveTable('comments', this.comments);
  }

  // --- Activity & Notifications ---
  async getActivityLogs(limit: number = 50): Promise<ActivityLogRecord[]> {
    return this.activityLogs
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  async logActivity(
    resourceType: any,
    resourceId: string | null,
    resourceName: string | null,
    action: any,
    details: Record<string, any> = {}
  ): Promise<void> {
    const log: ActivityLogRecord = {
      id: 'act-' + Date.now(),
      user_id: this.currentUser.id,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      action,
      details,
      ip_address: '127.0.0.1',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      created_at: new Date().toISOString(),
    };
    this.activityLogs.unshift(log);
    if (this.activityLogs.length > 200) this.activityLogs.pop();
    saveTable('activity_logs', this.activityLogs);
  }

  async getNotifications(): Promise<NotificationRecord[]> {
    return this.notifications
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async markNotificationRead(id: string): Promise<void> {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.is_read = true;
      saveTable('notifications', this.notifications);
    }
  }

  async markAllNotificationsRead(): Promise<void> {
    this.notifications.forEach(n => (n.is_read = true));
    saveTable('notifications', this.notifications);
  }

  // --- Devices ---
  async getDevices(): Promise<DeviceRecord[]> {
    return this.devices.filter(d => !d.is_revoked);
  }

  async revokeDevice(id: string): Promise<void> {
    const dev = this.devices.find(d => d.id === id);
    if (dev) {
      dev.is_revoked = true;
      saveTable('devices', this.devices);
      await this.logActivity('device', dev.id, dev.device_name, 'device_revoked', {});
    }
  }

  // --- Storage Analytics & Smart Cleanup ---
  getStorageBreakdown(): StorageBreakdown {
    const isMasterAdmin = (this.currentUser?.email || '').trim().toLowerCase() === 'immaster2024@gmail.com';

    const activeFiles = this.files.filter(f => f.deleted_at === null && this.isItemVisible(f.owner_id, f.storage_path));
    const trashFiles = this.files.filter(f => f.deleted_at !== null && this.isItemVisible(f.owner_id, f.storage_path));

    let imagesBytes = 0;
    let videosBytes = 0;
    let audioBytes = 0;
    let documentsBytes = 0;
    let codeBytes = 0;
    let otherBytes = 0;
    let usedStorage = 0;

    for (const f of activeFiles) {
      usedStorage += f.size_bytes;
      const cat = getFileCategory(f.mime_type, f.extension);
      switch (cat) {
        case 'image':
          imagesBytes += f.size_bytes;
          break;
        case 'video':
          videosBytes += f.size_bytes;
          break;
        case 'audio':
          audioBytes += f.size_bytes;
          break;
        case 'document':
          documentsBytes += f.size_bytes;
          break;
        case 'code':
          codeBytes += f.size_bytes;
          break;
        default:
          otherBytes += f.size_bytes;
          break;
      }
    }

    let trashBytes = 0;
    for (const f of trashFiles) {
      trashBytes += f.size_bytes;
    }

    const totalQuota = FREE_TEN_TB_BYTES; // 10 TB FREE
    const availableStorage = Math.max(0, totalQuota - usedStorage);
    const percentageUsed = Math.min(100, Number(((usedStorage / totalQuota) * 100).toFixed(2)));
    const fileCount = activeFiles.length;
    const folderCount = this.folders.filter(f => f.deleted_at === null && this.isItemVisible(f.owner_id)).length;

    return {
      totalQuota,
      usedStorage,
      availableStorage,
      percentageUsed,
      imagesBytes,
      videosBytes,
      audioBytes,
      documentsBytes,
      codeBytes,
      otherBytes,
      trashBytes,
      fileCount,
      folderCount,
    };
  }

  getStorageCleanupSuggestions(): {
    largeFiles: FileItem[];
    oldFiles: FileItem[];
    duplicateGroups: DuplicateFileGroup[];
    trashCount: number;
    trashBytes: number;
  } {
    const activeFiles = this.files
      .filter(f => f.deleted_at === null)
      .map(f => ({ ...f, owner: this.currentUser }));

    // Large files: > 5MB sorted descending
    const largeFiles = activeFiles
      .filter(f => f.size_bytes > 5 * 1024 * 1024)
      .sort((a, b) => b.size_bytes - a.size_bytes)
      .slice(0, 10);

    // Old files: older than 180 days (or older in test dataset)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
    const oldFiles = activeFiles
      .filter(f => f.updated_at < ninetyDaysAgo)
      .slice(0, 10);

    // Duplicates by checksum or same name + size
    const checksumMap: Record<string, FileItem[]> = {};
    for (const f of activeFiles) {
      const key = f.checksum || `${f.name}-${f.size_bytes}`;
      if (!checksumMap[key]) checksumMap[key] = [];
      checksumMap[key].push(f);
    }

    const duplicateGroups: DuplicateFileGroup[] = Object.entries(checksumMap)
      .filter(([, group]) => group.length > 1)
      .map(([key, group]) => ({
        checksum: key,
        name: group[0].name,
        size: group[0].size_bytes,
        files: group,
      }));

    const trashFiles = this.files.filter(f => f.deleted_at !== null);
    const trashBytes = trashFiles.reduce((acc, f) => acc + f.size_bytes, 0);

    return {
      largeFiles,
      oldFiles,
      duplicateGroups,
      trashCount: trashFiles.length,
      trashBytes,
    };
  }
}

export const localDb = new LocalDatabaseService();
