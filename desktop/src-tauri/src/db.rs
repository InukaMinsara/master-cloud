// ─── db.rs ───────────────────────────────────────────────────────────────────
// SQLite-backed journal, queue, and metadata cache.
// Used for crash recovery, power-loss protection, and operation resumption.

use anyhow::Result;
use rusqlite::{Connection, params};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::Manager;

#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn open(app: &tauri::AppHandle) -> Result<Self> {
        let data_dir = app
            .path()
            .app_data_dir()
            .expect("Could not resolve app data dir");
        std::fs::create_dir_all(&data_dir)?;

        let db_path: PathBuf = data_dir.join("master-cloud.db");
        tracing::info!("Opening database at {}", db_path.display());

        let conn = Connection::open(&db_path)?;

        // WAL mode for crash-safe concurrent writes
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON;")?;

        let db = Database {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.migrate()?;
        Ok(db)
    }

    fn migrate(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute_batch("
            -- File metadata cache (mirrors cloud state)
            CREATE TABLE IF NOT EXISTS file_meta (
                id            TEXT PRIMARY KEY,
                parent_id     TEXT,
                name          TEXT NOT NULL,
                is_dir        INTEGER NOT NULL DEFAULT 0,
                size          INTEGER NOT NULL DEFAULT 0,
                mime_type     TEXT,
                cloud_url     TEXT,
                etag          TEXT,
                mtime         TEXT,
                created_at    TEXT,
                is_pinned     INTEGER NOT NULL DEFAULT 0,
                is_offline    INTEGER NOT NULL DEFAULT 0,
                local_path    TEXT,
                local_sha256  TEXT,
                sync_state    TEXT NOT NULL DEFAULT 'cloud_only'
            );

            -- Operation journal — persisted queue surviving restarts
            CREATE TABLE IF NOT EXISTS op_queue (
                id            TEXT PRIMARY KEY,
                op_type       TEXT NOT NULL,  -- upload|download|delete|move|copy|mkdir
                item_id       TEXT NOT NULL,
                payload       TEXT,           -- JSON
                status        TEXT NOT NULL DEFAULT 'pending',  -- pending|running|done|error
                attempts      INTEGER NOT NULL DEFAULT 0,
                last_error    TEXT,
                created_at    TEXT NOT NULL,
                updated_at    TEXT NOT NULL
            );

            -- Conflict log
            CREATE TABLE IF NOT EXISTS conflicts (
                id            TEXT PRIMARY KEY,
                item_id       TEXT NOT NULL,
                local_path    TEXT,
                cloud_url     TEXT,
                local_mtime   TEXT,
                cloud_mtime   TEXT,
                detected_at   TEXT NOT NULL,
                resolution    TEXT           -- keep_local|keep_cloud|keep_both|pending
            );

            -- Settings KV
            CREATE TABLE IF NOT EXISTS settings (
                key           TEXT PRIMARY KEY,
                value         TEXT NOT NULL
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_file_meta_parent ON file_meta(parent_id);
            CREATE INDEX IF NOT EXISTS idx_op_queue_status  ON op_queue(status);
        ")?;

        Ok(())
    }

    pub fn conn(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap()
    }

    // ── File metadata ─────────────────────────────────────────────────────────

    pub fn upsert_file_meta(&self, meta: &FileMeta) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO file_meta
             (id, parent_id, name, is_dir, size, mime_type, cloud_url, etag,
              mtime, created_at, is_pinned, is_offline, local_path, local_sha256, sync_state)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)",
            params![
                meta.id, meta.parent_id, meta.name,
                meta.is_dir as i64, meta.size,
                meta.mime_type, meta.cloud_url, meta.etag,
                meta.mtime, meta.created_at,
                meta.is_pinned as i64, meta.is_offline as i64,
                meta.local_path, meta.local_sha256, meta.sync_state,
            ],
        )?;
        Ok(())
    }

    pub fn list_children(&self, parent_id: Option<&str>) -> Result<Vec<FileMeta>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id,parent_id,name,is_dir,size,mime_type,cloud_url,etag,
                    mtime,created_at,is_pinned,is_offline,local_path,local_sha256,sync_state
             FROM file_meta WHERE parent_id IS ?1 ORDER BY is_dir DESC, name ASC",
        )?;
        let rows = stmt.query_map([parent_id], |row| {
            Ok(FileMeta {
                id:          row.get(0)?,
                parent_id:   row.get(1)?,
                name:        row.get(2)?,
                is_dir:      row.get::<_, i64>(3)? != 0,
                size:        row.get(4)?,
                mime_type:   row.get(5)?,
                cloud_url:   row.get(6)?,
                etag:        row.get(7)?,
                mtime:       row.get(8)?,
                created_at:  row.get(9)?,
                is_pinned:   row.get::<_, i64>(10)? != 0,
                is_offline:  row.get::<_, i64>(11)? != 0,
                local_path:  row.get(12)?,
                local_sha256:row.get(13)?,
                sync_state:  row.get(14)?,
            })
        })?;
        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
    }

    pub fn get_file_meta(&self, id: &str) -> Result<Option<FileMeta>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id,parent_id,name,is_dir,size,mime_type,cloud_url,etag,
                    mtime,created_at,is_pinned,is_offline,local_path,local_sha256,sync_state
             FROM file_meta WHERE id=?1",
        )?;
        let mut rows = stmt.query([id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(FileMeta {
                id:          row.get(0)?,
                parent_id:   row.get(1)?,
                name:        row.get(2)?,
                is_dir:      row.get::<_, i64>(3)? != 0,
                size:        row.get(4)?,
                mime_type:   row.get(5)?,
                cloud_url:   row.get(6)?,
                etag:        row.get(7)?,
                mtime:       row.get(8)?,
                created_at:  row.get(9)?,
                is_pinned:   row.get::<_, i64>(10)? != 0,
                is_offline:  row.get::<_, i64>(11)? != 0,
                local_path:  row.get(12)?,
                local_sha256:row.get(13)?,
                sync_state:  row.get(14)?,
            }))
        } else {
            Ok(None)
        }
    }

    // ── Operation queue ───────────────────────────────────────────────────────

    pub fn enqueue_op(&self, op: &QueuedOp) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR IGNORE INTO op_queue
             (id,op_type,item_id,payload,status,attempts,created_at,updated_at)
             VALUES (?1,?2,?3,?4,'pending',0,?5,?5)",
            params![op.id, op.op_type, op.item_id, op.payload,
                    chrono::Utc::now().to_rfc3339()],
        )?;
        Ok(())
    }

    pub fn get_pending_ops(&self, limit: usize) -> Result<Vec<QueuedOp>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id,op_type,item_id,payload,status,attempts,last_error,created_at,updated_at
             FROM op_queue WHERE status IN ('pending','error') AND attempts < 10
             ORDER BY created_at ASC LIMIT ?1",
        )?;
        let rows = stmt.query_map([limit as i64], |row| {
            Ok(QueuedOp {
                id:         row.get(0)?,
                op_type:    row.get(1)?,
                item_id:    row.get(2)?,
                payload:    row.get(3)?,
                status:     row.get(4)?,
                attempts:   row.get(5)?,
                last_error: row.get(6)?,
            })
        })?;
        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
    }

    pub fn mark_op_done(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE op_queue SET status='done', updated_at=?2 WHERE id=?1",
            params![id, chrono::Utc::now().to_rfc3339()],
        )?;
        Ok(())
    }

    pub fn mark_op_error(&self, id: &str, err: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE op_queue SET status='error', attempts=attempts+1, last_error=?2, updated_at=?3 WHERE id=?1",
            params![id, err, chrono::Utc::now().to_rfc3339()],
        )?;
        Ok(())
    }

    // ── Settings ──────────────────────────────────────────────────────────────

    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let result = conn.query_row(
            "SELECT value FROM settings WHERE key=?1",
            [key],
            |row| row.get(0),
        );
        match result {
            Ok(v) => Ok(Some(v)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings(key,value) VALUES(?1,?2)",
            params![key, value],
        )?;
        Ok(())
    }
}

// ── Data types ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FileMeta {
    pub id:           String,
    pub parent_id:    Option<String>,
    pub name:         String,
    pub is_dir:       bool,
    pub size:         i64,
    pub mime_type:    Option<String>,
    pub cloud_url:    Option<String>,
    pub etag:         Option<String>,
    pub mtime:        Option<String>,
    pub created_at:   Option<String>,
    pub is_pinned:    bool,
    pub is_offline:   bool,
    pub local_path:   Option<String>,
    pub local_sha256: Option<String>,
    pub sync_state:   String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct QueuedOp {
    pub id:         String,
    pub op_type:    String,
    pub item_id:    String,
    pub payload:    Option<String>,
    pub status:     String,
    pub attempts:   i64,
    pub last_error: Option<String>,
}
