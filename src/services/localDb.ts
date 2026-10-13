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

const DB_PREFIX = 'master_cloud_';

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

// Storage helper
function loadTable<T>(tableName: string, defaultData: T[]): T[] {
  try {
    const saved = localStorage.getItem(DB_PREFIX + tableName);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error('Failed to load table:', tableName, err);
  }
  return defaultData;
}

function saveTable<T>(tableName: string, data: T[]): void {
  try {
    localStorage.setItem(DB_PREFIX + tableName, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save table:', tableName, err);
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

// Seed Folders
const SEED_FOLDERS: FolderRecord[] = [
  { id: 'f-asphalt', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'Asphalt', color: '#3b82f6', is_starred: false, deleted_at: null, created_at: '2026-09-27T19:22:00.000Z', updated_at: '2026-09-27T19:22:00.000Z' },
  { id: 'f-audioflow', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'AudioFlow Pro', color: '#8b5cf6', is_starred: false, deleted_at: null, created_at: '2026-09-27T19:34:00.000Z', updated_at: '2026-09-27T19:34:00.000Z' },
  { id: 'f-avengers', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'Avengers all', color: '#ef4444', is_starred: false, deleted_at: null, created_at: '2026-09-27T15:05:00.000Z', updated_at: '2026-09-27T15:05:00.000Z' },
  { id: 'f-codex', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'CODEX', color: '#10b981', is_starred: false, deleted_at: null, created_at: '2026-09-27T15:15:00.000Z', updated_at: '2026-09-27T15:15:00.000Z' },
  { id: 'f-chatapp', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'Chat App', color: '#06b6d4', is_starred: false, deleted_at: null, created_at: '2026-09-28T22:02:00.000Z', updated_at: '2026-09-28T22:02:00.000Z' },
  { id: 'f-esp32', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'ESP32 V2.0.11', color: '#f59e0b', is_starred: false, deleted_at: null, created_at: '2026-09-27T22:21:00.000Z', updated_at: '2026-09-27T22:21:00.000Z' },
  { id: 'f-media', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'Media & Videos', color: '#ec4899', is_starred: false, deleted_at: null, created_at: '2026-09-27T14:16:00.000Z', updated_at: '2026-09-27T14:16:00.000Z' },
  { id: 'f-mg', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'Mg', color: '#6366f1', is_starred: true, deleted_at: null, created_at: '2026-10-05T18:39:00.000Z', updated_at: '2026-10-05T18:39:00.000Z' },
  { id: 'f-shared', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'Shared Projects', color: '#14b8a6', is_starred: false, deleted_at: null, created_at: '2026-09-27T14:16:00.000Z', updated_at: '2026-09-27T14:16:00.000Z' },
  { id: 'f-video', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'VIDEO', color: '#f43f5e', is_starred: true, deleted_at: null, created_at: '2026-09-26T22:32:00.000Z', updated_at: '2026-09-26T22:32:00.000Z' },
  { id: 'f-work', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'Work Documents', color: '#3b82f6', is_starred: true, deleted_at: null, created_at: '2026-09-29T20:24:00.000Z', updated_at: '2026-09-29T20:24:00.000Z' },
  { id: 'f-capcu', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'capcu v', color: '#a855f7', is_starred: false, deleted_at: null, created_at: '2026-09-28T22:02:00.000Z', updated_at: '2026-09-28T22:02:00.000Z' },
  { id: 'f-cleanup', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'cleanup', color: '#64748b', is_starred: false, deleted_at: null, created_at: '2026-09-27T15:08:00.000Z', updated_at: '2026-09-27T15:08:00.000Z' },
  { id: 'f-cursor', owner_id: DEFAULT_USER.id, parent_folder_id: null, name: 'cursor', color: '#0ea5e9', is_starred: false, deleted_at: null, created_at: '2026-09-28T22:03:00.000Z', updated_at: '2026-09-28T22:03:00.000Z' },
];

// Seed Files
const SEED_FILES: FileRecord[] = [
  {
    id: 'file-sinhala-song',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: '2024 Hit Sinhala Song Collection - 2024 Silun Music - Copy.mp4',
    storage_path: 'seed/sinhala_song.mp4',
    mime_type: 'video/mp4',
    size_bytes: 39183767,
    extension: 'mp4',
    checksum: 'sinhala_song_2024_hash',
    is_starred: true,
    deleted_at: null,
    current_version_id: 'ver-s1',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
  {
    id: 'file-capcut-logo',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: '1664284836cap-cut-logo-png.png',
    storage_path: 'seed/capcut_logo.png',
    mime_type: 'image/png',
    size_bytes: 15281,
    extension: 'png',
    checksum: 'capcut_logo_hash',
    is_starred: false,
    deleted_at: null,
    current_version_id: 'ver-c1',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
  {
    id: 'file-1',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: 'Master Cloud Architecture & Security Overview.pdf',
    storage_path: 'seed/architecture.pdf',
    mime_type: 'application/pdf',
    size_bytes: 4280000,
    extension: 'pdf',
    checksum: 'a8b7c6d5e4f3a2b1',
    is_starred: true,
    deleted_at: null,
    current_version_id: 'ver-1',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
  {
    id: 'file-brand-fig',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: 'Brand Identity Guidelines 2026.fig',
    storage_path: 'seed/brand.fig',
    mime_type: 'application/octet-stream',
    size_bytes: 65,
    extension: 'fig',
    checksum: 'brand_fig_hash',
    is_starred: false,
    deleted_at: null,
    current_version_id: 'ver-b1',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
  {
    id: 'file-6',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: 'Kubernetes Cluster Config.yaml',
    storage_path: 'seed/cluster.yaml',
    mime_type: 'text/yaml',
    size_bytes: 93,
    extension: 'yaml',
    checksum: '9876543210abcdef',
    is_starred: true,
    deleted_at: null,
    current_version_id: 'ver-6',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
  {
    id: 'file-readme',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: 'MASTER CLOUD - README.txt',
    storage_path: 'seed/readme.txt',
    mime_type: 'text/plain',
    size_bytes: 455,
    extension: 'txt',
    checksum: 'readme_txt_hash',
    is_starred: false,
    deleted_at: null,
    current_version_id: 'ver-r1',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
  {
    id: 'file-5',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: 'System Ambient Focus.mp3',
    storage_path: 'seed/ambient.mp3',
    mime_type: 'audio/mpeg',
    size_bytes: 43,
    extension: 'mp3',
    checksum: 'b2c3d4e5f6a7b8c9',
    is_starred: false,
    deleted_at: null,
    current_version_id: 'ver-5',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
  {
    id: 'file-docs',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: 'Untitled Docs.mdoc',
    storage_path: 'seed/untitled.mdoc',
    mime_type: 'application/json',
    size_bytes: 547,
    extension: 'mdoc',
    checksum: 'mdoc_hash',
    is_starred: false,
    deleted_at: null,
    current_version_id: 'ver-doc1',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
  {
    id: 'file-draw',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: 'Untitled Draw.mdraw',
    storage_path: 'seed/untitled.mdraw',
    mime_type: 'application/json',
    size_bytes: 1119,
    extension: 'mdraw',
    checksum: 'mdraw_hash',
    is_starred: false,
    deleted_at: null,
    current_version_id: 'ver-draw1',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
  {
    id: 'file-forms',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: 'Untitled Forms.mform',
    storage_path: 'seed/untitled.mform',
    mime_type: 'application/json',
    size_bytes: 1411,
    extension: 'mform',
    checksum: 'mform_hash',
    is_starred: false,
    deleted_at: null,
    current_version_id: 'ver-form1',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
  {
    id: 'file-notes',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: 'Untitled Notes.mnote',
    storage_path: 'seed/untitled.mnote',
    mime_type: 'application/json',
    size_bytes: 2386,
    extension: 'mnote',
    checksum: 'mnote_hash',
    is_starred: false,
    deleted_at: null,
    current_version_id: 'ver-note1',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
  {
    id: 'file-sheets',
    owner_id: DEFAULT_USER.id,
    parent_folder_id: null,
    name: 'Untitled Sheets.msheet',
    storage_path: 'seed/untitled.msheet',
    mime_type: 'application/json',
    size_bytes: 1803,
    extension: 'msheet',
    checksum: 'msheet_hash',
    is_starred: false,
    deleted_at: null,
    current_version_id: 'ver-sheet1',
    created_at: '2026-10-13T18:57:00.000Z',
    updated_at: '2026-10-13T18:57:00.000Z',
  },
];

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

class LocalDatabaseService {
  private files: FileRecord[];
  private folders: FolderRecord[];
  private versions: FileVersionRecord[];
  private shares: ShareRecord[];
  private shareLinks: ShareLinkRecord[];
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

    const savedUser = localStorage.getItem(DB_PREFIX + 'current_user');
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
        } else {
          localStorage.removeItem(DB_PREFIX + 'current_user');
          this.currentUser = DEFAULT_USER;
        }
      } catch {
        localStorage.removeItem(DB_PREFIX + 'current_user');
        this.currentUser = DEFAULT_USER;
      }
    } else {
      this.currentUser = DEFAULT_USER;
    }

    // Ensure all existing files and folders belong to immaster2024@gmail.com
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
  }

  isItemVisible(ownerId?: string | null): boolean {
    const isMasterAdmin =
      this.currentUser.email.toLowerCase() === 'immaster2024@gmail.com' ||
      this.currentUser.role === 'admin';
    if (isMasterAdmin) return true;
    return ownerId === this.currentUser.id;
  }

  // --- Auth / Profile ---
  getCurrentUser(): ProfileRecord {
    return this.currentUser;
  }

  setCurrentUser(user: ProfileRecord): void {
    this.currentUser = user;
    localStorage.setItem(DB_PREFIX + 'current_user', JSON.stringify(user));
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

  async syncWithLocalDrive(): Promise<void> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    try {
      let res: Response | null = null;
      try {
        res = await fetch('http://127.0.0.1:8766/api/local-drive/list');
        if (!res.ok) throw new Error();
      } catch {
        res = await fetch('/api/local-drive/list');
      }
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.ok || data?.isMounted === false || !Array.isArray(data.items)) return;

      const diskItems: Array<{
        relPath: string;
        name: string;
        isDir: boolean;
        parentRelPath: string | null;
        size: number;
        mtime: string;
        birthtime: string;
      }> = data.items;

      const seenDiskFolderPaths = new Set<string>();
      const seenDiskFilePaths = new Set<string>();
      let changed = false;

      // 1. Sync folders from Z:\ in topological order (parents before children)
      const dirItems = diskItems
        .filter(i => i.isDir)
        .sort((a, b) => a.relPath.split('/').length - b.relPath.split('/').length);

      for (const d of dirItems) {
        seenDiskFolderPaths.add(d.relPath);
        const parentId = d.parentRelPath
          ? (this.folders.find(f => !f.deleted_at && this.getFolderRelPath(f.id) === d.parentRelPath)?.id ?? null)
          : null;

        const existing = this.folders.find(
          f => !f.deleted_at && f.parent_folder_id === parentId && f.name.toLowerCase() === d.name.toLowerCase()
        );
        if (!existing) {
          this.folders.push({
            id: 'zfolder-' + d.relPath.replace(/[^a-zA-Z0-9_-]/g, '_'),
            owner_id: this.currentUser.id,
            parent_folder_id: parentId,
            name: d.name,
            color: '#3b82f6',
            is_starred: false,
            deleted_at: null,
            created_at: d.birthtime,
            updated_at: d.mtime,
          });
          changed = true;
        }
      }

      // 2. Sync files from Z:\
      const fileItems = diskItems.filter(i => !i.isDir);
      for (const item of fileItems) {
        const zStoragePath = `zdrive:${item.relPath}`;
        seenDiskFilePaths.add(zStoragePath);

        const parentId = item.parentRelPath
          ? (this.folders.find(f => !f.deleted_at && this.getFolderRelPath(f.id) === item.parentRelPath)?.id ?? null)
          : null;

        const existing = this.files.find(
          f => !f.deleted_at && (f.storage_path === zStoragePath || (f.parent_folder_id === parentId && f.name.toLowerCase() === item.name.toLowerCase()))
        );

        if (!existing) {
          const ext = getFileExtension(item.name);
          const fileId = 'zfile-' + item.relPath.replace(/[^a-zA-Z0-9_-]/g, '_');
          const verId = 'zver-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
          this.files.push({
            id: fileId,
            owner_id: this.currentUser.id,
            parent_folder_id: parentId,
            name: item.name,
            storage_path: zStoragePath,
            mime_type: this.guessMimeType(ext),
            size_bytes: item.size,
            extension: ext,
            checksum: `z-${item.size}-${new Date(item.mtime).getTime()}`,
            is_starred: false,
            deleted_at: null,
            current_version_id: verId,
            created_at: item.birthtime,
            updated_at: item.mtime,
          });
          changed = true;
        } else if (existing.storage_path.startsWith('zdrive:') && existing.size_bytes !== item.size) {
          existing.size_bytes = item.size;
          existing.updated_at = item.mtime;
          changed = true;
        }
      }

      // 3. Remove any zdrive-synced items that were deleted from Windows Explorer (Z:\)
      const beforeFilesLen = this.files.length;
      this.files = this.files.filter(f => !f.storage_path.startsWith('zdrive:') || seenDiskFilePaths.has(f.storage_path));
      if (this.files.length !== beforeFilesLen) changed = true;

      const beforeFoldersLen = this.folders.length;
      this.folders = this.folders.filter(f => !f.id.startsWith('zfolder-') || seenDiskFolderPaths.has(this.getFolderRelPath(f.id)));
      if (this.folders.length !== beforeFoldersLen) changed = true;

      if (changed) {
        saveTable('folders', this.folders);
        saveTable('files', this.files);
      }
    } catch {
      // Offline or Vite middleware not running — ignore gracefully
    }
  }

  // --- Folders ---
  async getFolders(parentFolderId: string | null = null, includeDeleted: boolean = false): Promise<FolderItem[]> {
    await this.syncWithLocalDrive();
    return this.folders
      .filter(f => (includeDeleted ? f.deleted_at !== null : f.deleted_at === null))
      .filter(f => (includeDeleted ? true : f.parent_folder_id === parentFolderId))
      .filter(f => this.isItemVisible(f.owner_id))
      .map(f => ({
        ...f,
        item_count: this.files.filter(file => file.parent_folder_id === f.id && !file.deleted_at && this.isItemVisible(file.owner_id)).length +
          this.folders.filter(sub => sub.parent_folder_id === f.id && !sub.deleted_at && this.isItemVisible(sub.owner_id)).length,
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
        body: JSON.stringify({ op: 'delete', relPath }),
      }).catch(() => {});
    }

    saveTable('folders', this.folders);
    saveTable('files', this.files);
    await this.logActivity('folder', folder.id, folder.name, 'delete', {});
  }

  async restoreFolder(id: string): Promise<void> {
    const folder = this.folders.find(f => f.id === id);
    if (!folder) return;
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

    saveTable('folders', this.folders);
    saveTable('files', this.files);
    await this.logActivity('folder', folder.id, folder.name, 'restore', {});
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
    await this.syncWithLocalDrive();
    return this.files
      .filter(f => (includeDeleted ? f.deleted_at !== null : f.deleted_at === null))
      .filter(f => (includeDeleted ? true : f.parent_folder_id === parentFolderId))
      .filter(f => this.isItemVisible(f.owner_id))
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
    if (storagePath.startsWith('zdrive:') && typeof fetch !== 'undefined') {
      try {
        const relPath = storagePath.slice('zdrive:'.length);
        const res = await fetch(`/api/local-drive/read?path=${encodeURIComponent(relPath)}`);
        if (res.ok) {
          return await res.blob();
        }
      } catch {
        // Fallback to IndexedDB
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
        body: JSON.stringify({ op: 'delete', relPath }),
      }).catch(() => {});
    }
    file.deleted_at = new Date().toISOString();
    saveTable('files', this.files);
    await this.logActivity('file', file.id, file.name, 'delete', {});
  }

  async restoreFile(id: string): Promise<void> {
    const file = this.files.find(f => f.id === id);
    if (!file) return;
    file.deleted_at = null;
    saveTable('files', this.files);
    await this.logActivity('file', file.id, file.name, 'restore', {});
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
  }

  async emptyTrash(): Promise<void> {
    const deletedFiles = this.files.filter(f => f.deleted_at !== null);
    for (const f of deletedFiles) {
      await binaryStorage.deleteBlob(f.storage_path);
    }
    this.files = this.files.filter(f => f.deleted_at === null);
    this.folders = this.folders.filter(f => f.deleted_at === null);
    saveTable('files', this.files);
    saveTable('folders', this.folders);
    await this.logActivity('system', null, 'Trash', 'permanent_delete', { action: 'empty_trash' });
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
    const files = this.files.filter(f => f.is_starred && !f.deleted_at && this.isItemVisible(f.owner_id)).map(f => ({ ...f, owner: this.currentUser }));
    const folders = this.folders.filter(f => f.is_starred && !f.deleted_at && this.isItemVisible(f.owner_id)).map(f => ({ ...f, owner: this.currentUser }));
    return { files, folders };
  }

  async getRecentItems(limit: number = 20): Promise<FileItem[]> {
    return this.files
      .filter(f => !f.deleted_at && this.isItemVisible(f.owner_id))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, limit)
      .map(f => ({ ...f, owner: this.currentUser }));
  }

  // --- Media Library ---
  async getMediaFiles(type: 'all' | 'image' | 'video' | 'audio' = 'all'): Promise<FileItem[]> {
    return this.files
      .filter(f => !f.deleted_at && this.isItemVisible(f.owner_id))
      .filter(f => {
        const cat = getFileCategory(f.mime_type, f.extension);
        if (type === 'all') return ['image', 'video', 'audio'].includes(cat);
        return cat === type;
      })
      .map(f => ({ ...f, owner: this.currentUser }));
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
    permission?: 'viewer' | 'editor';
    hasPassword?: boolean;
    password?: string;
    allowDownload?: boolean;
    expiresAt?: string | null;
  }): Promise<ShareLinkRecord> {
    const token = generateSecureToken(16);
    const newLink: ShareLinkRecord = {
      id: 'link-' + Date.now(),
      resource_type: options.resourceType,
      resource_id: options.resourceId,
      creator_id: this.currentUser.id,
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
    this.shareLinks.push(newLink);
    saveTable('share_links', this.shareLinks);
    return newLink;
  }

  async getShareLinkByToken(token: string): Promise<{ link: ShareLinkRecord; item: FileItem | FolderItem } | null> {
    const link = this.shareLinks.find(s => s.token === token && s.is_active);
    if (!link) return null;

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return null;
    }

    link.view_count += 1;
    saveTable('share_links', this.shareLinks);

    if (link.resource_type === 'file') {
      const file = this.files.find(f => f.id === link.resource_id);
      if (!file) return null;
      return { link, item: { ...file, owner: this.currentUser } };
    } else {
      const folder = this.folders.find(f => f.id === link.resource_id);
      if (!folder) return null;
      return { link, item: { ...folder, owner: this.currentUser } };
    }
  }

  async revokeShareLink(linkId: string): Promise<void> {
    const link = this.shareLinks.find(s => s.id === linkId);
    if (link) {
      link.is_active = false;
      saveTable('share_links', this.shareLinks);
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
    const activeFiles = this.files.filter(f => f.deleted_at === null && this.isItemVisible(f.owner_id));
    const trashFiles = this.files.filter(f => f.deleted_at !== null && this.isItemVisible(f.owner_id));

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
    const percentageUsed = Math.min(100, Math.round((usedStorage / totalQuota) * 100));

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
      fileCount: activeFiles.length,
      folderCount: this.folders.filter(f => f.deleted_at === null).length,
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
