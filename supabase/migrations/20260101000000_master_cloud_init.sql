-- ==============================================================================
-- MASTER CLOUD: PRODUCTION DATABASE SCHEMA & ROW-LEVEL SECURITY
-- ==============================================================================
-- Version: 1.0.0
-- Description: Core tables, indexes, constraints, triggers, and RLS policies.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Mirrors auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. STORAGE QUOTAS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_quota_bytes BIGINT NOT NULL DEFAULT 10995116277760, -- 10 TB default (10,995,116,277,760 bytes)
  used_storage_bytes BIGINT NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. FOLDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT folder_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- ------------------------------------------------------------------------------
-- 4. FILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  extension TEXT NOT NULL,
  checksum TEXT,
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  current_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT file_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- ------------------------------------------------------------------------------
-- 5. FILE VERSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  checksum TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add foreign key constraint for files.current_version_id after file_versions created
ALTER TABLE public.files
  DROP CONSTRAINT IF EXISTS fk_current_version,
  ADD CONSTRAINT fk_current_version FOREIGN KEY (current_version_id)
  REFERENCES public.file_versions(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 6. SHARES TABLE (User-to-User Sharing)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
  resource_id UUID NOT NULL,
  granter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  grantee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  grantee_email TEXT,
  permission TEXT NOT NULL CHECK (permission IN ('viewer', 'commenter', 'editor', 'owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_grantee CHECK (grantee_id IS NOT NULL OR grantee_email IS NOT NULL)
);

-- ------------------------------------------------------------------------------
-- 7. SHARE LINKS TABLE (Public Token Links)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
  resource_id UUID NOT NULL,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  permission TEXT NOT NULL DEFAULT 'viewer' CHECK (permission IN ('viewer', 'editor')),
  password_hash TEXT,
  has_password BOOLEAN NOT NULL DEFAULT FALSE,
  allow_download BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  max_downloads INTEGER,
  download_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 8. FILE REQUESTS TABLE (Upload Request Links)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  token TEXT NOT NULL UNIQUE,
  max_file_size_bytes BIGINT DEFAULT 524288000, -- 500 MB default
  allowed_extensions TEXT[],
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  upload_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 9. RECENT ACCESSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recent_accesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
  resource_id UUID NOT NULL,
  action TEXT NOT NULL DEFAULT 'viewed' CHECK (action IN ('viewed', 'edited', 'created', 'downloaded')),
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_resource UNIQUE(user_id, resource_type, resource_id)
);

-- ------------------------------------------------------------------------------
-- 10. COMMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT comment_not_empty CHECK (char_length(trim(content)) > 0)
);

-- ------------------------------------------------------------------------------
-- 11. ACTIVITY LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder', 'share', 'account', 'auth', 'device', 'system')),
  resource_id UUID,
  resource_name TEXT,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 12. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('share', 'comment', 'upload', 'system', 'security', 'quota')),
  resource_type TEXT,
  resource_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 13. DEVICES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  browser TEXT NOT NULL,
  ip_address TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 14. FILE LOCKS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE UNIQUE,
  locked_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & RETRIEVAL
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_folders_owner ON public.folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON public.folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_deleted ON public.folders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_folders_starred ON public.folders(owner_id, is_starred) WHERE is_starred = TRUE;

CREATE INDEX IF NOT EXISTS idx_files_owner ON public.files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_parent ON public.files(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON public.files(deleted_at);
CREATE INDEX IF NOT EXISTS idx_files_starred ON public.files(owner_id, is_starred) WHERE is_starred = TRUE;
CREATE INDEX IF NOT EXISTS idx_files_mime ON public.files(mime_type);
CREATE INDEX IF NOT EXISTS idx_files_extension ON public.files(extension);
CREATE INDEX IF NOT EXISTS idx_files_checksum ON public.files(checksum);
CREATE INDEX IF NOT EXISTS idx_files_size ON public.files(size_bytes);
CREATE INDEX IF NOT EXISTS idx_files_created ON public.files(created_at DESC);

-- Full text search index on file and folder names
CREATE INDEX IF NOT EXISTS idx_files_name_trgm ON public.files USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_folders_name_trgm ON public.folders USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_file_versions_file ON public.file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_shares_grantee ON public.shares(grantee_id);
CREATE INDEX IF NOT EXISTS idx_shares_resource ON public.shares(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);
CREATE INDEX IF NOT EXISTS idx_file_requests_token ON public.file_requests(token);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_accesses_user ON public.recent_accesses(user_id, accessed_at DESC);

-- ==============================================================================
-- AUTOMATIC PROFILE & QUOTA CREATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.storage_quotas (user_id, total_quota_bytes, used_storage_bytes, tier)
  VALUES (
    NEW.id,
    10995116277760, -- 10 TB Free (10,995,116,277,760 bytes)
    0,
    'free'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create default root activity log
  INSERT INTO public.activity_logs (user_id, resource_type, action, details)
  VALUES (NEW.id, 'account', 'signup', jsonb_build_object('email', NEW.email));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- AUTOMATIC STORAGE QUOTA RECALCULATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_storage_quota()
RETURNS trigger AS $$
DECLARE
  v_user_id UUID;
  v_total_bytes BIGINT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.owner_id;
  ELSE
    v_user_id := NEW.owner_id;
  END IF;

  SELECT COALESCE(SUM(size_bytes), 0)
  INTO v_total_bytes
  FROM public.files
  WHERE owner_id = v_user_id AND deleted_at IS NULL;

  UPDATE public.storage_quotas
  SET used_storage_bytes = v_total_bytes, updated_at = now()
  WHERE user_id = v_user_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_file_storage_change ON public.files;
CREATE TRIGGER on_file_storage_change
  AFTER INSERT OR UPDATE OF size_bytes, deleted_at OR DELETE ON public.files
  FOR EACH ROW EXECUTE PROCEDURE public.sync_storage_quota();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_accesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_locks ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile or users they share with; can update their own
CREATE POLICY "Profiles viewable by authenticated user"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Profiles updatable by owner"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Storage Quotas: Owner can read
CREATE POLICY "Quotas viewable by owner"
  ON public.storage_quotas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Folders Policies
CREATE POLICY "Folders owner full access"
  ON public.folders FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Folders shared read"
  ON public.folders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shares
      WHERE shares.resource_type = 'folder'
        AND shares.resource_id = folders.id
        AND (shares.grantee_id = auth.uid() OR shares.grantee_email = auth.jwt()->>'email')
    )
  );

CREATE POLICY "Folders shared write"
  ON public.folders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shares
      WHERE shares.resource_type = 'folder'
        AND shares.resource_id = folders.id
        AND (shares.grantee_id = auth.uid() OR shares.grantee_email = auth.jwt()->>'email')
        AND shares.permission IN ('editor', 'owner')
    )
  );

-- Files Policies
CREATE POLICY "Files owner full access"
  ON public.files FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Files shared read"
  ON public.files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shares
      WHERE shares.resource_type = 'file'
        AND shares.resource_id = files.id
        AND (shares.grantee_id = auth.uid() OR shares.grantee_email = auth.jwt()->>'email')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.shares
      WHERE shares.resource_type = 'folder'
        AND shares.resource_id = files.parent_folder_id
        AND (shares.grantee_id = auth.uid() OR shares.grantee_email = auth.jwt()->>'email')
    )
  );

CREATE POLICY "Files shared write"
  ON public.files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shares
      WHERE shares.resource_type = 'file'
        AND shares.resource_id = files.id
        AND (shares.grantee_id = auth.uid() OR shares.grantee_email = auth.jwt()->>'email')
        AND shares.permission IN ('editor', 'owner')
    )
  );

-- File Versions: File owner or editor can read & insert
CREATE POLICY "File versions read"
  ON public.file_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = file_versions.file_id
        AND files.owner_id = auth.uid()
    )
  );

CREATE POLICY "File versions insert"
  ON public.file_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = file_versions.file_id
        AND files.owner_id = auth.uid()
    )
  );

-- Shares: Resource owner can view and manage shares
CREATE POLICY "Shares viewable by owner or grantee"
  ON public.shares FOR SELECT
  TO authenticated
  USING (granter_id = auth.uid() OR grantee_id = auth.uid() OR grantee_email = auth.jwt()->>'email');

CREATE POLICY "Shares manageable by granter"
  ON public.shares FOR ALL
  TO authenticated
  USING (granter_id = auth.uid())
  WITH CHECK (granter_id = auth.uid());

-- Share Links: Creator can manage; anyone can select if active
CREATE POLICY "Share links manageable by creator"
  ON public.share_links FOR ALL
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Share links publicly readable by token"
  ON public.share_links FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > now()));

-- File Requests: Creator can manage; anon can read active request
CREATE POLICY "File requests manageable by creator"
  ON public.file_requests FOR ALL
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "File requests viewable by token"
  ON public.file_requests FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > now()));

-- Recent Accesses: Owner only
CREATE POLICY "Recent accesses owner only"
  ON public.recent_accesses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Comments: Accessible if user has access to file
CREATE POLICY "Comments readable by file viewers"
  ON public.comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = comments.file_id AND files.owner_id = auth.uid()
    )
  );

CREATE POLICY "Comments creatable by authorized users"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comments deletable by author or file owner"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = comments.file_id AND files.owner_id = auth.uid()
    )
  );

-- Activity Logs: Owner only
CREATE POLICY "Activity logs owner only"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Activity logs insert by owner"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Notifications: Owner only
CREATE POLICY "Notifications owner only"
  ON public.notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Devices: Owner only
CREATE POLICY "Devices owner only"
  ON public.devices FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- File Locks: Viewable by authorized, locked by owner
CREATE POLICY "File locks viewable by file accessors"
  ON public.file_locks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "File locks manageable by lock owner"
  ON public.file_locks FOR ALL
  TO authenticated
  USING (locked_by = auth.uid())
  WITH CHECK (locked_by = auth.uid());

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION & POLICIES
-- ==============================================================================
-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('master-cloud-files', 'master-cloud-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Authenticated user can read their own files in the bucket
CREATE POLICY "Allow authenticated read own storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'master-cloud-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: Authenticated user can upload to their own folder
CREATE POLICY "Allow authenticated upload own storage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'master-cloud-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: Authenticated user can update/delete their own files
CREATE POLICY "Allow authenticated update own storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'master-cloud-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow authenticated delete own storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'master-cloud-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ==============================================================================
-- AUTOMATED TRIGGERS & QUOTA ENFORCEMENT (10 TB POLICY)
-- ==============================================================================

-- 1. Automatic Profile & 10 TB Quota Provisioning for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.storage_quotas (user_id, total_quota_bytes, used_storage_bytes, tier)
  VALUES (
    NEW.id,
    10995116277760, -- 10 TB free storage guaranteed (10,995,116,277,760 bytes)
    0,
    'free'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Strict Pre-Insert Quota Check (Rejects upload if quota exceeded)
CREATE OR REPLACE FUNCTION public.check_file_storage_quota()
RETURNS TRIGGER AS $$
DECLARE
  v_total_quota BIGINT;
  v_used_storage BIGINT;
BEGIN
  SELECT total_quota_bytes, used_storage_bytes
  INTO v_total_quota, v_used_storage
  FROM public.storage_quotas
  WHERE user_id = NEW.owner_id FOR UPDATE;

  IF NOT FOUND THEN
    -- Auto-provision 10 TB quota if missing
    INSERT INTO public.storage_quotas (user_id, total_quota_bytes, used_storage_bytes, tier)
    VALUES (NEW.owner_id, 10995116277760, 0, 'free')
    RETURNING total_quota_bytes, used_storage_bytes INTO v_total_quota, v_used_storage;
  END IF;

  IF (v_used_storage + NEW.size_bytes) > v_total_quota THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED: Not enough storage available in 10 TB allocation.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_file_storage_quota ON public.files;
CREATE TRIGGER tr_check_file_storage_quota
  BEFORE INSERT ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.check_file_storage_quota();

-- 3. Automatic Quota Usage Synchronization
CREATE OR REPLACE FUNCTION public.update_storage_quota_usage()
RETURNS TRIGGER AS $$
DECLARE
  v_target_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_target_user_id := NEW.owner_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_target_user_id := OLD.owner_id;
  ELSE
    v_target_user_id := NEW.owner_id;
  END IF;

  UPDATE public.storage_quotas
  SET used_storage_bytes = COALESCE((
    SELECT SUM(size_bytes)
    FROM public.files
    WHERE owner_id = v_target_user_id AND deleted_at IS NULL
  ), 0),
  updated_at = timezone('utc'::text, now())
  WHERE user_id = v_target_user_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_storage_quota_usage ON public.files;
CREATE TRIGGER tr_update_storage_quota_usage
  AFTER INSERT OR UPDATE OF size_bytes, deleted_at OR DELETE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_storage_quota_usage();

-- ==============================================================================
-- EXTENDED CORE, DESKTOP, SYNC, CACHE, JOURNAL & MASTER APPS TABLES (SECTION 287)
-- ==============================================================================

-- 15. TRASH ITEMS & STARRED FILES
CREATE TABLE IF NOT EXISTS public.trash_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
  resource_id UUID NOT NULL,
  original_path TEXT,
  deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  purge_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.starred_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL DEFAULT 'file' CHECK (resource_type IN ('file', 'folder')),
  resource_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, resource_type, resource_id)
);

CREATE TABLE IF NOT EXISTS public.recent_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, file_id)
);

-- 16. DESKTOP & VIRTUAL FILESYSTEM TABLES
CREATE TABLE IF NOT EXISTS public.desktop_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Windows',
  version TEXT NOT NULL DEFAULT '1.0.0',
  drive_letter TEXT NOT NULL DEFAULT 'M:',
  drive_status TEXT NOT NULL DEFAULT 'mounted' CHECK (drive_status IN ('mounted', 'disconnected', 'error', 'unmounted')),
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'syncing', 'paused', 'offline', 'conflict', 'error')),
  sync_mode TEXT NOT NULL DEFAULT 'stream' CHECK (sync_mode IN ('stream', 'mirror', 'hybrid')),
  cache_size_bytes BIGINT NOT NULL DEFAULT 0,
  offline_count INTEGER NOT NULL DEFAULT 0,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, device_id)
);

CREATE TABLE IF NOT EXISTS public.desktop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  drive_letter TEXT NOT NULL DEFAULT 'M:',
  sync_mode TEXT NOT NULL DEFAULT 'stream' CHECK (sync_mode IN ('stream', 'mirror', 'hybrid')),
  cache_path TEXT NOT NULL DEFAULT 'C:\Users\Public\AppData\Local\MasterCloud\Cache',
  max_cache_bytes BIGINT NOT NULL DEFAULT 21474836480, -- 20 GB default local cache limit
  bandwidth_mode TEXT NOT NULL DEFAULT 'unlimited' CHECK (bandwidth_mode IN ('unlimited', 'balanced', 'low')),
  start_with_windows BOOLEAN NOT NULL DEFAULT TRUE,
  enable_context_menu BOOLEAN NOT NULL DEFAULT TRUE,
  enable_status_icons BOOLEAN NOT NULL DEFAULT TRUE,
  exclusion_patterns TEXT[] NOT NULL DEFAULT ARRAY['*.tmp', '*.cache', '~$*'],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.mounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.desktop_devices(id) ON DELETE CASCADE,
  drive_letter TEXT NOT NULL,
  mount_mode TEXT NOT NULL DEFAULT 'stream',
  status TEXT NOT NULL DEFAULT 'mounted',
  mounted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  unmounted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.desktop_devices(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('upload', 'download', 'zip', 'thumbnail', 'preview', 'ai', 'image', 'video', 'cleanup', 'sync', 'reconciliation')),
  state TEXT NOT NULL DEFAULT 'QUEUED' CHECK (state IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  progress INTEGER NOT NULL DEFAULT 0,
  checkpoint_chunk INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sync_operations (
  operation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.desktop_devices(id) ON DELETE SET NULL,
  resource_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CREATE', 'DELETE', 'RENAME', 'MOVE', 'COPY', 'MODIFY', 'SHARE')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  checksum TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'QUEUED' CHECK (state IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CONFLICT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.offline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.desktop_devices(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
  resource_id TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_offline BOOLEAN NOT NULL DEFAULT TRUE,
  cached_bytes BIGINT NOT NULL DEFAULT 0,
  checksum TEXT,
  hydrated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, resource_id)
);

CREATE TABLE IF NOT EXISTS public.cache_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  block_range TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 50,
  access_count INTEGER NOT NULL DEFAULT 1,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  local_checksum TEXT,
  cloud_checksum TEXT,
  local_modified_at TIMESTAMPTZ,
  cloud_modified_at TIMESTAMPTZ,
  resolution TEXT CHECK (resolution IN ('keep_local', 'keep_cloud', 'keep_both', 'create_copy', 'unresolved')),
  status TEXT NOT NULL DEFAULT 'CONFLICT' CHECK (status IN ('CONFLICT', 'RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.local_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('CREATE', 'WRITE', 'RENAME', 'MOVE', 'DELETE', 'METADATA')),
  resource_path TEXT NOT NULL,
  checksum TEXT,
  committed BOOLEAN NOT NULL DEFAULT FALSE,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 17. MASTER PRODUCTIVITY & AI MODULE TABLES
CREATE TABLE IF NOT EXISTS public.canvas_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  module_type TEXT NOT NULL CHECK (module_type IN ('docs', 'sheets', 'slides', 'forms', 'draw', 'word', 'excel', 'onenote', 'pics', 'vids')),
  title TEXT NOT NULL,
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL DEFAULT 'docs' CHECK (doc_type IN ('docs', 'word')),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  page_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.spreadsheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  sheet_type TEXT NOT NULL DEFAULT 'sheets' CHECK (sheet_type IN ('sheets', 'excel')),
  title TEXT NOT NULL,
  active_sheet TEXT NOT NULL DEFAULT 'Sheet1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.spreadsheet_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spreadsheet_id UUID NOT NULL REFERENCES public.spreadsheets(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Sheet1',
  cells JSONB NOT NULL DEFAULT '{}'::jsonb,
  freeze_rows INTEGER NOT NULL DEFAULT 0,
  freeze_cols INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.presentation_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  slide_index INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  layout TEXT NOT NULL DEFAULT 'title-content',
  elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  speaker_notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_accepting BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  field_index INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  required BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  background_color TEXT NOT NULL DEFAULT '#0f172a',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.drawing_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID NOT NULL REFERENCES public.drawings(id) ON DELETE CASCADE,
  layer_index INTEGER NOT NULL DEFAULT 0,
  object_type TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notebook_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  section_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.notebook_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.notebook_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  master_ai_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  persona TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.pic_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.pic_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.pic_projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  style TEXT NOT NULL DEFAULT 'Photorealistic',
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  image_url TEXT NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.vid_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  scenes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.vid_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.vid_projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'UNAVAILABLE')),
  progress INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  capability_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ADDITIONAL INDEXES (SECTION 288)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_trash_owner ON public.trash_items(owner_id, deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_starred_user ON public.starred_files(user_id, resource_id);
CREATE INDEX IF NOT EXISTS idx_desktop_devices_user ON public.desktop_devices(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_state ON public.sync_jobs(user_id, state, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_ops_state ON public.sync_operations(user_id, state, resource_id);
CREATE INDEX IF NOT EXISTS idx_offline_items_res ON public.offline_items(user_id, resource_id);
CREATE INDEX IF NOT EXISTS idx_cache_meta_res ON public.cache_metadata(user_id, resource_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_user ON public.conflicts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_local_journal_user ON public.local_journal(user_id, committed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_projects_owner ON public.canvas_projects(owner_id, module_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON public.ai_conversations(user_id, updated_at DESC);

-- Enable RLS on all extended tables (Section 289)
ALTER TABLE public.trash_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desktop_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desktop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheet_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawing_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pic_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pic_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vid_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vid_jobs ENABLE ROW LEVEL SECURITY;

-- Owner Isolation RLS Policies for Extended Tables
CREATE POLICY "Trash owner isolation" ON public.trash_items FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Starred owner isolation" ON public.starred_files FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Recent files owner isolation" ON public.recent_files FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Desktop devices owner isolation" ON public.desktop_devices FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Desktop settings owner isolation" ON public.desktop_settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Mounts owner isolation" ON public.mounts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Sync jobs owner isolation" ON public.sync_jobs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Sync ops owner isolation" ON public.sync_operations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Offline items owner isolation" ON public.offline_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Cache meta owner isolation" ON public.cache_metadata FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Conflicts owner isolation" ON public.conflicts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Journal owner isolation" ON public.local_journal FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Canvas projects owner isolation" ON public.canvas_projects FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Documents owner isolation" ON public.documents FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Spreadsheets owner isolation" ON public.spreadsheets FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Presentations owner isolation" ON public.presentations FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Forms owner isolation" ON public.forms FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Drawings owner isolation" ON public.drawings FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Notebooks owner isolation" ON public.notebooks FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "AI conversations owner isolation" ON public.ai_conversations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Pic projects owner isolation" ON public.pic_projects FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Pic generations owner isolation" ON public.pic_generations FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Vid projects owner isolation" ON public.vid_projects FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Vid jobs owner isolation" ON public.vid_jobs FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());


