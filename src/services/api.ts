import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { localDb } from './localDb';
import { DownloadService } from './downloadService';
import { FileItem, FolderItem, StorageBreakdown, DuplicateFileGroup } from '@/types/file';
import {
  ProfileRecord,
  FolderRecord,
  FileRecord,
  FileVersionRecord,
  ShareRecord,
  ShareLinkRecord,
  FileRequestRecord,
  CommentRecord,
  ActivityLogRecord,
  NotificationRecord,
  DeviceRecord,
} from '@/types/database';

class UnifiedApiService {
  isConfiguredWithSupabase(): boolean {
    if (!isSupabaseConfigured) return false;
    if (typeof localStorage !== 'undefined') {
      const mode = localStorage.getItem('master_cloud_backend_mode');
      if (mode === 'local') return false;
    }
    return true;
  }

  // --- Auth & Profile ---
  async getCurrentUser(): Promise<ProfileRecord | null> {
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('master_cloud_backend_mode', 'supabase');
          }
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (profile && profile.email) return profile;

          const resolvedEmail =
            user.email ||
            user.user_metadata?.email ||
            user.user_metadata?.preferred_username ||
            user.user_metadata?.user_principal_name ||
            'user@mastercloud.io';

          const resolvedName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.user_name ||
            user.user_metadata?.handle ||
            user.user_metadata?.display_name ||
            resolvedEmail.split('@')[0] ||
            'Master Cloud User';

          const resolvedAvatar =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            user.user_metadata?.avatar ||
            null;

          return {
            id: user.id,
            email: resolvedEmail,
            display_name: resolvedName,
            avatar_url: resolvedAvatar,
            role: 'user',
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at,
          };
        }
      } catch (err) {
        console.warn('Supabase getSession fallback:', err);
      }
    }
    return localDb.getCurrentUser();
  }

  async login(email: string, password: string): Promise<{ user: ProfileRecord | null; error?: string }> {
    if (this.isConfiguredWithSupabase()) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return {
            user: null,
            error: 'Email not confirmed. Please check your inbox to verify your email, or disable email confirmation in your Supabase Auth settings.',
          };
        }
        return { user: null, error: error.message };
      }
      if (data.user) {
        localStorage.setItem('master_cloud_backend_mode', 'supabase');
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        return { user: profile || {
          id: data.user.id,
          email: data.user.email || email.trim(),
          display_name: data.user.user_metadata?.full_name || email.trim().split('@')[0] || 'User',
          avatar_url: null,
          role: 'user',
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        }};
      }
    }
    // Local mode fallback
    const user: ProfileRecord = {
      id: 'usr-' + Date.now(),
      email: email.trim(),
      display_name: email.trim().split('@')[0],
      avatar_url: null,
      role: email.trim().toLowerCase().startsWith('admin@') ? 'admin' : 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localDb.setCurrentUser(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('master_cloud_backend_mode', 'local');
    }
    await localDb.logActivity('auth', user.id, email.trim(), 'login', {});
    return { user };
  }

  async loginWithOAuth(provider: 'google' | 'github' | 'azure' | 'figma'): Promise<{ user: ProfileRecord | null; redirected?: boolean; error?: string }> {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('oauth_pending_provider', provider);
      sessionStorage.setItem('oauth_pending_time', Date.now().toString());
    }

    if (provider === 'figma') {
      // Figma instant direct OAuth profile connection
      return this.createLocalOAuthUser('figma');
    }

    if (isSupabaseConfigured) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('master_cloud_backend_mode', 'supabase');
        }
        const redirectTo = `${window.location.origin}/drive`;
        
        let options: any = {
          redirectTo,
        };

        if (provider === 'azure') {
          options = {
            redirectTo,
            scopes: 'openid profile email offline_access',
            queryParams: {
              prompt: 'select_account',
            },
          };
        } else if (provider === 'github') {
          options = {
            redirectTo,
            scopes: 'read:user user:email',
          };
        } else if (provider === 'google') {
          options = {
            redirectTo,
            scopes: 'openid profile email',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          };
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider as any,
          options,
        });

        if (error) {
          console.warn(`[Supabase OAuth Error] ${provider}:`, error);
          return this.createLocalOAuthUser(provider);
        }

        if (data?.url) {
          window.location.href = data.url;
          return { user: null, redirected: true };
        }

        return this.createLocalOAuthUser(provider);
      } catch (err: any) {
        console.warn(`[Supabase OAuth Exception] ${provider}:`, err);
        return this.createLocalOAuthUser(provider);
      }
    }

    // Local / Offline mode fallback
    return this.createLocalOAuthUser(provider);
  }

  public createLocalOAuthUser(provider: 'google' | 'github' | 'azure' | 'figma'): { user: ProfileRecord; redirected: false } {
    const domain = provider === 'azure' ? 'outlook.com' : provider === 'google' ? 'gmail.com' : provider === 'github' ? 'github.com' : 'figma.com';
    const providerTitle = provider === 'azure' ? 'Microsoft User' : provider === 'google' ? 'Google User' : provider === 'github' ? 'GitHub Developer' : 'Figma Designer';
    const defaultEmail = `${provider}.user@${domain}`;
    const avatar =
      provider === 'azure'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
        : provider === 'github'
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
        : provider === 'figma'
        ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80';
    
    const localUser: ProfileRecord = {
      id: `usr-${provider}-${Date.now()}`,
      email: defaultEmail,
      display_name: providerTitle,
      avatar_url: avatar,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localDb.setCurrentUser(localUser);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('master_cloud_backend_mode', 'local');
    }
    localDb.logActivity('auth', localUser.id, localUser.email, 'login', { provider });
    return { user: localUser, redirected: false };
  }

  async signup(email: string, password: string, displayName: string): Promise<{ user: ProfileRecord | null; error?: string }> {
    if (this.isConfiguredWithSupabase()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: displayName, display_name: displayName },
          emailRedirectTo: `${window.location.origin}/drive`,
        },
      });
      if (error) return { user: null, error: error.message };
      if (!data.user) return { user: null, error: 'Registration pending verification' };
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      return { user: profile || {
        id: data.user.id,
        email: data.user.email || email,
        display_name: displayName.trim() || data.user.email?.split('@')[0] || 'User',
        avatar_url: null,
        role: 'user',
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      }};
    }
    // Local mode signup
    const newUser: ProfileRecord = {
      id: 'usr-' + Date.now(),
      email: email.trim(),
      display_name: displayName.trim() || email.trim().split('@')[0],
      avatar_url: null,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localDb.setCurrentUser(newUser);
    await localDb.logActivity('account', newUser.id, displayName.trim(), 'signup', { email: email.trim() });
    return { user: newUser };
  }

  async logout(): Promise<void> {
    if (this.isConfiguredWithSupabase()) {
      await supabase.auth.signOut();
    }
    await localDb.logActivity('auth', null, 'Current User', 'logout', {});
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (this.isConfiguredWithSupabase()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    await new Promise(r => setTimeout(r, 600));
    return { success: true };
  }

  async updateProfile(updates: Partial<ProfileRecord>): Promise<ProfileRecord> {
    if (this.isConfiguredWithSupabase()) {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', user.id)
            .select()
            .single();
          if (!error && data) return data;
        }
      } catch (err) {
        console.warn('Supabase updateProfile fallback:', err);
      }
    }
    return localDb.updateProfile(updates);
  }

  async deleteAccount(): Promise<void> {
    if (this.isConfiguredWithSupabase()) {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await supabase.from('profiles').delete().eq('id', user.id);
        await supabase.auth.signOut();
      }
      return;
    }
    localStorage.clear();
  }

  async getFolders(parentFolderId: string | null = null, includeDeleted: boolean = false): Promise<FolderItem[]> {
    if (this.isConfiguredWithSupabase()) {
      try {
        let query = supabase.from('folders').select('*, owner:profiles(*)');
        if (includeDeleted) {
          query = query.not('deleted_at', 'is', null);
        } else {
          query = query.is('deleted_at', null);
          if (parentFolderId === null) {
            query = query.is('parent_folder_id', null);
          } else {
            query = query.eq('parent_folder_id', parentFolderId);
          }
        }
        const { data, error } = await query.order('name');
        if (!error && data) return data as FolderItem[];
      } catch (err) {
        console.warn('Supabase getFolders fallback:', err);
      }
    }
    return localDb.getFolders(parentFolderId, includeDeleted);
  }

  async getFolderById(id: string): Promise<FolderRecord | null> {
    if (this.isConfiguredWithSupabase()) {
      const { data, error } = await supabase.from('folders').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    }
    return localDb.getFolderById(id);
  }

  async getFolderAncestors(folderId: string | null): Promise<FolderRecord[]> {
    return localDb.getFolderAncestors(folderId);
  }

  async createFolder(name: string, parentFolderId: string | null = null, color?: string): Promise<FolderRecord> {
    if (this.isConfiguredWithSupabase()) {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          const { data, error } = await supabase
            .from('folders')
            .insert({
              owner_id: user.id,
              parent_folder_id: parentFolderId,
              name: name.trim(),
              color: color || '#3b82f6',
            })
            .select()
            .single();
          if (!error && data) return data;
          console.warn('Supabase createFolder insert error:', error);
        }
      } catch (err) {
        console.warn('Supabase createFolder fallback to localDb:', err);
      }
    }
    return localDb.createFolder(name, parentFolderId, color);
  }

  async renameFolder(id: string, newName: string): Promise<FolderRecord> {
    if (this.isConfiguredWithSupabase()) {
      const { data, error } = await supabase
        .from('folders')
        .update({ name: newName.trim(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    return localDb.renameFolder(id, newName);
  }

  async moveFolder(id: string, newParentFolderId: string | null): Promise<FolderRecord> {
    if (this.isConfiguredWithSupabase()) {
      const { data, error } = await supabase
        .from('folders')
        .update({ parent_folder_id: newParentFolderId, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    return localDb.moveFolder(id, newParentFolderId);
  }

  async softDeleteFolder(id: string): Promise<void> {
    if (this.isConfiguredWithSupabase()) {
      const now = new Date().toISOString();
      await supabase.from('folders').update({ deleted_at: now }).eq('id', id);
      return;
    }
    return localDb.softDeleteFolder(id);
  }

  async restoreFolder(id: string): Promise<void> {
    if (this.isConfiguredWithSupabase()) {
      await supabase.from('folders').update({ deleted_at: null }).eq('id', id);
      return;
    }
    return localDb.restoreFolder(id);
  }

  async permanentDeleteFolder(id: string): Promise<void> {
    if (this.isConfiguredWithSupabase()) {
      await supabase.from('folders').delete().eq('id', id);
      return;
    }
    return localDb.permanentDeleteFolder(id);
  }

  async toggleStarFolder(id: string): Promise<boolean> {
    return localDb.toggleStarFolder(id);
  }

  // --- Files ---
  async getFiles(parentFolderId: string | null = null, includeDeleted: boolean = false): Promise<FileItem[]> {
    if (this.isConfiguredWithSupabase()) {
      try {
        let query = supabase.from('files').select('*, owner:profiles(*)');
        if (includeDeleted) {
          query = query.not('deleted_at', 'is', null);
        } else {
          query = query.is('deleted_at', null);
          if (parentFolderId === null) {
            query = query.is('parent_folder_id', null);
          } else {
            query = query.eq('parent_folder_id', parentFolderId);
          }
        }
        const { data, error } = await query.order('name');
        if (!error && data) return data as FileItem[];
      } catch (err) {
        console.warn('Supabase getFiles fallback:', err);
      }
    }
    return localDb.getFiles(parentFolderId, includeDeleted);
  }

  async getFileById(id: string): Promise<FileItem | null> {
    if (this.isConfiguredWithSupabase()) {
      const { data, error } = await supabase
        .from('files')
        .select('*, owner:profiles(*), versions:file_versions(*)')
        .eq('id', id)
        .single();
      if (error) return null;
      return data as FileItem;
    }
    return localDb.getFileById(id);
  }

  async uploadFile(
    file: File,
    parentFolderId: string | null = null,
    onProgress?: (progress: number, bytesUploaded: number) => void
  ): Promise<FileItem> {
    if (this.isConfiguredWithSupabase()) {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          // Server-side Quota Enforcement: Verify (used + incoming) <= 10 TB
          const { data: quota } = await supabase
            .from('storage_quotas')
            .select('total_quota_bytes, used_storage_bytes')
            .eq('user_id', user.id)
            .single();
          if (quota && (quota.used_storage_bytes + file.size > quota.total_quota_bytes)) {
            throw new Error('Not enough storage available.');
          }

          const storagePath = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

          // Upload to Supabase Storage Bucket
          const { error: uploadErr } = await supabase.storage
            .from('master-cloud-files')
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (!uploadErr) {
            onProgress?.(100, file.size);

            const ext = file.name.split('.').pop() || '';
            const { data: fileData, error: dbErr } = await supabase
              .from('files')
              .insert({
                owner_id: user.id,
                parent_folder_id: parentFolderId,
                name: file.name,
                storage_path: storagePath,
                mime_type: file.type || 'application/octet-stream',
                size_bytes: file.size,
                extension: ext,
              })
              .select('*, owner:profiles(*)')
              .single();

            if (!dbErr && fileData) return fileData as FileItem;
          }
        }
      } catch (err: any) {
        if (err.message === 'Not enough storage available.') throw err;
        console.warn('Supabase uploadFile fallback to localDb:', err);
      }
    }
    return localDb.uploadFile(file, parentFolderId, onProgress);
  }

  async getFileBlob(storagePath: string): Promise<Blob | null> {
    if (this.isConfiguredWithSupabase()) {
      const { data, error } = await supabase.storage
        .from('master-cloud-files')
        .download(storagePath);
      if (error) {
        console.error('Storage download error:', error);
        return null;
      }
      return data;
    }
    return localDb.getFileBlob(storagePath);
  }

  async renameFile(id: string, newName: string): Promise<FileRecord> {
    return localDb.renameFile(id, newName);
  }

  async moveFile(id: string, newParentFolderId: string | null): Promise<FileRecord> {
    return localDb.moveFile(id, newParentFolderId);
  }

  async copyFile(id: string, targetFolderId: string | null = null): Promise<FileItem> {
    return localDb.copyFile(id, targetFolderId);
  }

  async updateFileContent(fileId: string, content: string | Blob, mimeType?: string): Promise<FileItem> {
    if (this.isConfiguredWithSupabase()) {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          const blob = typeof content === 'string' ? new Blob([content], { type: mimeType || 'application/json' }) : content;
          const storagePath = `${user.id}/${Date.now()}_canvas_doc`;
          const { error: uploadErr } = await supabase.storage
            .from('master-cloud-files')
            .upload(storagePath, blob, { upsert: true });
          if (!uploadErr) {
            const { data: updated, error: dbErr } = await supabase
              .from('files')
              .update({
                storage_path: storagePath,
                size_bytes: blob.size,
                updated_at: new Date().toISOString(),
              })
              .eq('id', fileId)
              .select('*, owner:profiles(*)')
              .single();
            if (!dbErr && updated) return updated as FileItem;
          }
        }
      } catch (err) {
        console.warn('Supabase updateFileContent fallback to localDb:', err);
      }
    }
    return localDb.updateFileContent(fileId, content, mimeType);
  }

  async getFileContentText(fileId: string): Promise<string | null> {
    if (this.isConfiguredWithSupabase()) {
      try {
        const file = await this.getFileById(fileId);
        if (file) {
          const blob = await this.getFileBlob(file.storage_path);
          if (blob) return await blob.text();
        }
      } catch (err) {
        console.warn('Supabase getFileContentText fallback:', err);
      }
    }
    return localDb.getFileContentText(fileId);
  }

  async softDeleteFile(id: string): Promise<void> {
    return localDb.softDeleteFile(id);
  }

  async restoreFile(id: string): Promise<void> {
    return localDb.restoreFile(id);
  }

  async permanentDeleteFile(id: string): Promise<void> {
    return localDb.permanentDeleteFile(id);
  }

  async emptyTrash(): Promise<void> {
    return localDb.emptyTrash();
  }

  async toggleStarFile(id: string): Promise<boolean> {
    return localDb.toggleStarFile(id);
  }

  // --- Downloads ---
  async downloadFile(file: FileItem): Promise<void> {
    return DownloadService.downloadSingleFile(file);
  }

  async downloadMultiple(files: FileItem[]): Promise<void> {
    return DownloadService.downloadMultipleFiles(files);
  }

  async downloadFolder(folder: FolderItem, allFiles: FileItem[], allFolders: FolderItem[]): Promise<void> {
    return DownloadService.downloadFolder(folder, allFiles, allFolders);
  }

  // --- Starred & Recent ---
  async getStarredItems(): Promise<{ files: FileItem[]; folders: FolderItem[] }> {
    return localDb.getStarredItems();
  }

  async getRecentItems(limit: number = 20): Promise<FileItem[]> {
    return localDb.getRecentItems(limit);
  }

  // --- Media ---
  async getMediaFiles(type: 'all' | 'image' | 'video' | 'audio' = 'all'): Promise<FileItem[]> {
    return localDb.getMediaFiles(type);
  }

  // --- Versions ---
  async getFileVersions(fileId: string): Promise<FileVersionRecord[]> {
    return localDb.getFileVersions(fileId);
  }

  async restoreFileVersion(fileId: string, versionId: string): Promise<FileRecord> {
    return localDb.restoreFileVersion(fileId, versionId);
  }

  // --- Shares & Links ---
  async getShares(resourceId: string): Promise<ShareRecord[]> {
    return localDb.getShares(resourceId);
  }

  async createShare(
    resourceType: 'file' | 'folder',
    resourceId: string,
    email: string,
    permission: 'viewer' | 'commenter' | 'editor'
  ): Promise<ShareRecord> {
    return localDb.createShare(resourceType, resourceId, email, permission);
  }

  async deleteShare(shareId: string): Promise<void> {
    return localDb.deleteShare(shareId);
  }

  async getShareLinks(resourceId: string): Promise<ShareLinkRecord[]> {
    return localDb.getShareLinks(resourceId);
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
    return localDb.createShareLink(options);
  }

  async getShareLinkByToken(token: string): Promise<{ link: ShareLinkRecord; item: FileItem | FolderItem } | null> {
    return localDb.getShareLinkByToken(token);
  }

  async revokeShareLink(linkId: string): Promise<void> {
    return localDb.revokeShareLink(linkId);
  }

  // --- File Requests ---
  async getFileRequests(): Promise<FileRequestRecord[]> {
    return localDb.getFileRequests();
  }

  async createFileRequest(options: {
    targetFolderId: string;
    title: string;
    description?: string;
    maxFileSizeBytes?: number;
    allowedExtensions?: string[];
    expiresAt?: string;
  }): Promise<FileRequestRecord> {
    return localDb.createFileRequest(options);
  }

  async getFileRequestByToken(token: string): Promise<FileRequestRecord | null> {
    return localDb.getFileRequestByToken(token);
  }

  // --- Comments ---
  async getComments(fileId: string): Promise<CommentRecord[]> {
    return localDb.getComments(fileId);
  }

  async addComment(fileId: string, content: string, parentCommentId: string | null = null): Promise<CommentRecord> {
    return localDb.addComment(fileId, content, parentCommentId);
  }

  async deleteComment(commentId: string): Promise<void> {
    return localDb.deleteComment(commentId);
  }

  // --- Activity & Notifications ---
  async getActivityLogs(limit: number = 50): Promise<ActivityLogRecord[]> {
    return localDb.getActivityLogs(limit);
  }

  async logActivity(
    resourceType: any,
    resourceId: string | null,
    resourceName: string | null,
    action: any,
    details: Record<string, any> = {}
  ): Promise<void> {
    return localDb.logActivity(resourceType, resourceId, resourceName, action, details);
  }

  async getNotifications(): Promise<NotificationRecord[]> {
    return localDb.getNotifications();
  }

  async markNotificationRead(id: string): Promise<void> {
    return localDb.markNotificationRead(id);
  }

  async markAllNotificationsRead(): Promise<void> {
    return localDb.markAllNotificationsRead();
  }

  // --- Devices ---
  async getDevices(): Promise<DeviceRecord[]> {
    return localDb.getDevices();
  }

  async revokeDevice(id: string): Promise<void> {
    return localDb.revokeDevice(id);
  }

  // --- Analytics & Cleanup ---
  getStorageBreakdown(): StorageBreakdown {
    return localDb.getStorageBreakdown();
  }

  getStorageCleanupSuggestions(): {
    largeFiles: FileItem[];
    oldFiles: FileItem[];
    duplicateGroups: DuplicateFileGroup[];
    trashCount: number;
    trashBytes: number;
  } {
    return localDb.getStorageCleanupSuggestions();
  }
}

export const api = new UnifiedApiService();
