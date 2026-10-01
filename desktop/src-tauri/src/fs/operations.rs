// ─── fs/operations.rs ────────────────────────────────────────────────────────
// WinFsp FileSystem implementation — handles all filesystem callbacks.
//
// Critical rules:
// 1. NEVER block on network inside a filesystem callback.
// 2. Return metadata from SQLite cache (fast, local).
// 3. For file reads: serve from cache if present; queue async download if not.
// 4. For writes: stage to local temp, queue async upload.

use anyhow::Result;
use std::sync::Arc;
use tauri::Manager;

use crate::auth::AuthManager;
use crate::cache::CacheManager;
use crate::db::{Database, FileMeta, QueuedOp};
use crate::sync::cloud_api::CloudApi;

/// The WinFsp FileSystem implementation.
/// In a real build this implements the winfsp_sys::FileSystem trait.
pub struct MasterCloudFileSystem {
    app: tauri::AppHandle,
}

impl MasterCloudFileSystem {
    pub fn new(app: tauri::AppHandle) -> Self {
        Self { app }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    fn db(&self)    -> tauri::State<Database>     { self.app.state() }
    fn cache(&self) -> tauri::State<CacheManager> { self.app.state() }
    fn auth(&self)  -> tauri::State<AuthManager>  { self.app.state() }

    /// Resolve a virtual drive path like "My Drive/Projects/file.txt"
    /// to a FileMeta entry in the local DB.
    fn resolve_path(&self, path: &str) -> Option<FileMeta> {
        let db  = self.db();
        let parts: Vec<&str> = path.trim_start_matches('\\')
            .split('\\')
            .filter(|s| !s.is_empty())
            .collect();

        if parts.is_empty() {
            return None; // root
        }

        // Walk the path segments through the DB tree
        let mut parent_id: Option<String> = None;
        let mut current: Option<FileMeta> = None;

        for part in &parts {
            let children = db.list_children(parent_id.as_deref()).ok()?;
            current = children.into_iter().find(|f| f.name.eq_ignore_ascii_case(part));
            match &current {
                Some(f) => parent_id = Some(f.id.clone()),
                None    => return None,
            }
        }
        current
    }

    // ── ReadDirectory ─────────────────────────────────────────────────────────
    // Returns directory entries from SQLite cache — NO network call.
    // Background task refreshes metadata asynchronously.

    pub fn read_directory(&self, path: &str) -> Vec<DirEntry> {
        let db = self.db();

        let parent_id = if path.trim_matches('\\').is_empty() {
            None // root
        } else {
            self.resolve_path(path).map(|f| f.id)
        };

        let metas = db.list_children(parent_id.as_deref()).unwrap_or_default();

        metas.into_iter().map(|m| DirEntry {
            name:    m.name,
            is_dir:  m.is_dir,
            size:    m.size as u64,
            mtime:   m.mtime.unwrap_or_default(),
            offline: m.is_offline,
            pinned:  m.is_pinned,
            state:   m.sync_state,
        }).collect()
    }

    // ── Open / Read ───────────────────────────────────────────────────────────
    // Returns the local cache path if file is cached.
    // Otherwise queues a download and returns an error — Explorer will retry.

    pub fn open_file(&self, path: &str) -> Result<Option<String>> {
        let meta = match self.resolve_path(path) {
            Some(m) => m,
            None    => anyhow::bail!("File not found: {}", path),
        };

        if meta.is_dir {
            return Ok(None);
        }

        let cache = self.cache();

        // Check if already in cache
        if let Some(local) = &meta.local_path {
            if std::path::Path::new(local).exists() {
                return Ok(Some(local.clone()));
            }
        }

        // Not cached — queue async download and return "not ready yet"
        let cloud_url = meta.cloud_url.clone().unwrap_or_default();
        let db        = self.db();
        let local_path = cache.cache_path_for(&meta.id);

        let op = QueuedOp {
            id:         uuid::Uuid::new_v4().to_string(),
            op_type:    "download".to_string(),
            item_id:    meta.id.clone(),
            payload:    Some(serde_json::json!({
                "cloud_url":  cloud_url,
                "local_path": local_path,
            }).to_string()),
            status:     "pending".to_string(),
            attempts:   0,
            last_error: None,
        };

        let _ = db.enqueue_op(&op);

        // Return None — caller (WinFsp callback) should return STATUS_PENDING or
        // indicate the file is not yet locally available.
        // WinFsp will allow a retry; in the interim Explorer shows a loading state.
        Ok(None)
    }

    // ── Write / Create ────────────────────────────────────────────────────────

    pub fn create_file(&self, path: &str, initial_data: &[u8]) -> Result<String> {
        let cache     = self.cache();
        let db        = self.db();
        let file_id   = uuid::Uuid::new_v4().to_string();
        let local_path = cache.stage_path_for(&file_id);

        // Write to staging area first
        if let Some(parent) = std::path::Path::new(&local_path).parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(&local_path, initial_data)?;

        // Extract name and parent from path
        let name = path.trim_start_matches('\\')
            .split('\\')
            .last()
            .unwrap_or("untitled")
            .to_string();

        let parent_path: String = path.trim_start_matches('\\')
            .split('\\')
            .rev()
            .skip(1)
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect::<Vec<_>>()
            .join("\\");

        let parent_meta = self.resolve_path(&parent_path);

        // Insert into local DB immediately
        let meta = FileMeta {
            id:           file_id.clone(),
            parent_id:    parent_meta.map(|m| m.id),
            name:         name.clone(),
            is_dir:       false,
            size:         initial_data.len() as i64,
            mime_type:    Some(mime_guess::from_path(&name).first_or_octet_stream().to_string()),
            cloud_url:    None,
            etag:         None,
            mtime:        Some(chrono::Utc::now().to_rfc3339()),
            created_at:   Some(chrono::Utc::now().to_rfc3339()),
            is_pinned:    false,
            is_offline:   true, // staging
            local_path:   Some(local_path.clone()),
            local_sha256: None,
            sync_state:   "uploading".to_string(),
        };
        db.upsert_file_meta(&meta)?;

        // Queue upload
        let op = QueuedOp {
            id:         uuid::Uuid::new_v4().to_string(),
            op_type:    "upload".to_string(),
            item_id:    file_id.clone(),
            payload:    Some(serde_json::json!({
                "local_path":  local_path,
                "remote_path": path.trim_start_matches('\\').replace('\\', "/"),
            }).to_string()),
            status:     "pending".to_string(),
            attempts:   0,
            last_error: None,
        };
        db.enqueue_op(&op)?;

        Ok(local_path)
    }

    pub fn create_directory(&self, path: &str) -> Result<()> {
        let db = self.db();
        let name = path.trim_start_matches('\\').split('\\').last().unwrap_or("").to_string();
        let remote_path = path.trim_start_matches('\\').replace('\\', "/");

        let meta = FileMeta {
            id:           format!("local:{}", uuid::Uuid::new_v4()),
            parent_id:    None, // TODO: resolve
            name,
            is_dir:       true,
            size:         0,
            mime_type:    None,
            cloud_url:    None,
            etag:         None,
            mtime:        Some(chrono::Utc::now().to_rfc3339()),
            created_at:   Some(chrono::Utc::now().to_rfc3339()),
            is_pinned:    false,
            is_offline:   false,
            local_path:   None,
            local_sha256: None,
            sync_state:   "pending_upload".to_string(),
        };
        db.upsert_file_meta(&meta)?;

        // Queue cloud folder creation
        let op = QueuedOp {
            id:         uuid::Uuid::new_v4().to_string(),
            op_type:    "mkdir".to_string(),
            item_id:    meta.id.clone(),
            payload:    Some(serde_json::json!({ "remote_path": remote_path }).to_string()),
            status:     "pending".to_string(),
            attempts:   0,
            last_error: None,
        };
        db.enqueue_op(&op)?;
        Ok(())
    }
}

// ── Data types returned to the filesystem callbacks ───────────────────────────

#[derive(Debug, Clone, serde::Serialize)]
pub struct DirEntry {
    pub name:    String,
    pub is_dir:  bool,
    pub size:    u64,
    pub mtime:   String,
    pub offline: bool,
    pub pinned:  bool,
    pub state:   String,
}
