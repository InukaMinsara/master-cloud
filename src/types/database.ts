export type UserRole = 'user' | 'admin';
export type StorageTier = 'free';
export type SharePermission = 'viewer' | 'commenter' | 'editor' | 'owner';
export type PublicLinkPermission = 'viewer' | 'editor';
export type ResourceType = 'file' | 'folder';
export type ActivityAction =
  | 'upload'
  | 'download'
  | 'rename'
  | 'move'
  | 'copy'
  | 'delete'
  | 'restore'
  | 'permanent_delete'
  | 'star'
  | 'unstar'
  | 'share'
  | 'unshare'
  | 'version_restore'
  | 'comment'
  | 'login'
  | 'logout'
  | 'device_revoked'
  | 'signup';

export interface ProfileRecord {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface StorageQuotaRecord {
  id: string;
  user_id: string;
  total_quota_bytes: number;
  used_storage_bytes: number;
  tier: StorageTier;
  updated_at: string;
}

export interface FolderRecord {
  id: string;
  owner_id: string;
  parent_folder_id: string | null;
  name: string;
  color: string | null;
  is_starred: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  owner_id: string;
  parent_folder_id: string | null;
  name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  extension: string;
  checksum: string | null;
  is_starred: boolean;
  deleted_at: string | null;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileVersionRecord {
  id: string;
  file_id: string;
  version_number: number;
  storage_path: string;
  size_bytes: number;
  checksum: string | null;
  created_by: string;
  notes: string | null;
  created_at: string;
}

export interface ShareRecord {
  id: string;
  resource_type: ResourceType;
  resource_id: string;
  granter_id: string;
  grantee_id: string | null;
  grantee_email: string | null;
  permission: SharePermission;
  created_at: string;
  updated_at: string;
}

export interface ShareLinkRecord {
  id: string;
  resource_type: ResourceType;
  resource_id: string;
  creator_id: string;
  token: string;
  permission: PublicLinkPermission;
  password_hash: string | null;
  has_password: boolean;
  allow_download: boolean;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number;
  view_count: number;
  is_active: boolean;
  created_at: string;
}

export interface FileRequestRecord {
  id: string;
  creator_id: string;
  target_folder_id: string;
  title: string;
  description: string | null;
  token: string;
  max_file_size_bytes: number | null;
  allowed_extensions: string[] | null;
  expires_at: string | null;
  is_active: boolean;
  upload_count: number;
  created_at: string;
}

export interface CommentRecord {
  id: string;
  file_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  user?: ProfileRecord;
}

export interface ActivityLogRecord {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  action: ActivityAction;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  actor_id: string | null;
  title: string;
  message: string;
  type: 'share' | 'comment' | 'upload' | 'system' | 'security' | 'quota';
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DeviceRecord {
  id: string;
  user_id: string;
  device_name: string;
  platform: string;
  browser: string;
  ip_address: string | null;
  last_active_at: string;
  is_current: boolean;
  is_revoked: boolean;
  created_at: string;
}
