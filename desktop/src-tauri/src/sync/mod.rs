// ─── sync/mod.rs ─────────────────────────────────────────────────────────────
// Sync Engine — bidirectional synchronization between cloud and local cache.
// 
// Architecture:
//   - Background Tokio tasks handle upload/download queues
//   - Operations are persisted in SQLite before execution (crash-safe)
//   - Exponential backoff + bounded retries on errors
//   - Conflict detection before any overwrite
//   - Idempotency via operation IDs

use anyhow::{Context, Result};
use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
use std::time::Duration;
use tokio::sync::Semaphore;
use tauri::Manager;

use crate::auth::AuthManager;
use crate::cache::CacheManager;
use crate::db::{Database, QueuedOp};

pub mod cloud_api;
pub mod conflict;
pub mod metadata_sync;

use cloud_api::CloudApi;

// ── Public types ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
pub enum StorageMode {
    Stream,   // Cloud-first, stream on demand
    Mirror,   // Full local copy of selected items
    Hybrid,   // Pinned + frequently used local; rest cloud-only
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SyncStatus {
    pub mode:          StorageMode,
    pub is_paused:     bool,
    pub upload_queue:  usize,
    pub download_queue: usize,
    pub upload_speed:  u64,    // bytes/sec
    pub download_speed: u64,
    pub last_sync:     Option<String>,
    pub conflicts:     usize,
}

// ── Engine ────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct SyncEngine {
    pub is_paused: Arc<AtomicBool>,
    pub mode:      Arc<parking_lot::RwLock<StorageMode>>,
    upload_sem:    Arc<Semaphore>,
    download_sem:  Arc<Semaphore>,
}

impl SyncEngine {
    pub fn new(app: &tauri::AppHandle) -> Result<Self> {
        let db = app.state::<Database>();
        let mode_str = db.get_setting("storage_mode")?.unwrap_or_else(|| "stream".into());
        let mode = match mode_str.as_str() {
            "mirror" => StorageMode::Mirror,
            "hybrid" => StorageMode::Hybrid,
            _        => StorageMode::Stream,
        };

        Ok(Self {
            is_paused:    Arc::new(AtomicBool::new(false)),
            mode:         Arc::new(parking_lot::RwLock::new(mode)),
            upload_sem:   Arc::new(Semaphore::new(4)),
            download_sem: Arc::new(Semaphore::new(6)),
        })
    }

    pub fn pause(&self)  { self.is_paused.store(true,  Ordering::Relaxed); }
    pub fn resume(&self) { self.is_paused.store(false, Ordering::Relaxed); }
    pub fn paused(&self) -> bool { self.is_paused.load(Ordering::Relaxed) }

    pub fn set_mode(&self, mode: StorageMode, db: &Database) -> Result<()> {
        let mode_str = match &mode {
            StorageMode::Stream => "stream",
            StorageMode::Mirror => "mirror",
            StorageMode::Hybrid => "hybrid",
        };
        db.set_setting("storage_mode", mode_str)?;
        *self.mode.write() = mode;
        Ok(())
    }

    pub fn current_mode(&self) -> StorageMode {
        self.mode.read().clone()
    }

    pub fn status(&self, db: &Database) -> SyncStatus {
        let ops       = db.get_pending_ops(1000).unwrap_or_default();
        let uploads   = ops.iter().filter(|o| o.op_type == "upload").count();
        let downloads = ops.iter().filter(|o| o.op_type == "download").count();
        SyncStatus {
            mode:           self.current_mode(),
            is_paused:      self.paused(),
            upload_queue:   uploads,
            download_queue: downloads,
            upload_speed:   0,
            download_speed: 0,
            last_sync:      db.get_setting("last_sync").ok().flatten(),
            conflicts:      0,
        }
    }
}

// ── Background task loop ──────────────────────────────────────────────────────

pub async fn run_background(app: &tauri::AppHandle) {
    tracing::info!("Sync background worker started");

    let mut interval = tokio::time::interval(Duration::from_secs(5));

    loop {
        interval.tick().await;

        let engine = app.state::<SyncEngine>();
        if engine.paused() {
            continue;
        }

        let db   = app.state::<Database>();
        let auth = app.state::<AuthManager>();

        let token = match auth.access_token() {
            Some(t) => t,
            None    => continue,
        };

        let ops = match db.get_pending_ops(20) {
            Ok(ops) => ops,
            Err(e)  => { tracing::error!("Queue read error: {}", e); continue; }
        };

        for op in ops {
            let db_clone     = db.inner().clone();
            let token_clone  = token.clone();
            let app_clone    = app.clone();
            let sem          = match op.op_type.as_str() {
                "upload"   => engine.upload_sem.clone(),
                "download" => engine.download_sem.clone(),
                _          => engine.upload_sem.clone(),
            };

            tauri::async_runtime::spawn(async move {
                let _permit = sem.acquire().await.unwrap();
                let result = execute_op(&app_clone, &op, &token_clone).await;
                match result {
                    Ok(_)  => {
                        let _ = db_clone.mark_op_done(&op.id);
                        tracing::debug!("Op {} ({}) done", op.id, op.op_type);
                    }
                    Err(e) => {
                        let _ = db_clone.mark_op_error(&op.id, &e.to_string());
                        tracing::warn!("Op {} ({}) failed: {}", op.id, op.op_type, e);
                    }
                }
            });
        }

        let _ = metadata_sync::sync_root_metadata(app).await;
        let _ = db.set_setting("last_sync", &chrono::Utc::now().to_rfc3339());
    }
}

async fn execute_op(app: &tauri::AppHandle, op: &QueuedOp, token: &str) -> Result<()> {
    let auth  = app.state::<AuthManager>();
    let cache = app.state::<CacheManager>();
    let api   = CloudApi::new(auth.supabase_url(), auth.supabase_anon(), token);

    if op.attempts > 0 {
        let delay = Duration::from_millis(500 * (1u64 << op.attempts.min(8)));
        tokio::time::sleep(delay).await;
    }

    match op.op_type.as_str() {
        "upload" => {
            let payload: serde_json::Value = serde_json::from_str(op.payload.as_deref().unwrap_or("{}"))?;
            let local_path = payload["local_path"].as_str().context("No local_path")?;
            let remote_path = payload["remote_path"].as_str().context("No remote_path")?;
            api.upload_file(local_path, remote_path).await?;
        }
        "download" => {
            let payload: serde_json::Value = serde_json::from_str(op.payload.as_deref().unwrap_or("{}"))?;
            let cloud_url  = payload["cloud_url"].as_str().context("No cloud_url")?;
            let local_path = payload["local_path"].as_str().context("No local_path")?;
            cache.download_to_cache(cloud_url, local_path).await?;
        }
        "delete_cloud" => {
            let payload: serde_json::Value = serde_json::from_str(op.payload.as_deref().unwrap_or("{}"))?;
            let remote_path = payload["remote_path"].as_str().context("No remote_path")?;
            api.delete_file(remote_path).await?;
        }
        "mkdir" => {
            let payload: serde_json::Value = serde_json::from_str(op.payload.as_deref().unwrap_or("{}"))?;
            let remote_path = payload["remote_path"].as_str().context("No remote_path")?;
            api.create_folder(remote_path).await?;
        }
        other => tracing::warn!("Unknown op type: {}", other),
    }

    Ok(())
}
