// ─── sync/conflict.rs ─────────────────────────────────────────────────────────
// Conflict detection and resolution.
// Never silently overwrites — always surfaces conflicts to the user.

use anyhow::Result;
use serde::{Deserialize, Serialize};

use crate::db::{Database, FileMeta};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictResolution {
    KeepLocal,
    KeepCloud,
    KeepBoth,
    CreateCopy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conflict {
    pub id:          String,
    pub item_id:     String,
    pub name:        String,
    pub local_mtime: Option<String>,
    pub cloud_mtime: Option<String>,
    pub local_path:  Option<String>,
    pub cloud_url:   Option<String>,
}

/// Detect if a local change conflicts with a cloud change.
pub fn detect_conflict(meta: &FileMeta, local_mtime: &str) -> bool {
    // If cloud mtime is newer than what we last synced and local also changed
    if let (Some(cloud_mtime), Some(local_path)) = (&meta.mtime, &meta.local_path) {
        // Both sides changed since last sync → conflict
        return cloud_mtime.as_str() != local_mtime;
    }
    false
}

/// Record a detected conflict in the DB for user resolution.
pub fn record_conflict(db: &Database, conflict: &Conflict) -> Result<()> {
    let conn = db.conn();
    conn.execute(
        "INSERT OR REPLACE INTO conflicts (id,item_id,local_path,cloud_url,local_mtime,cloud_mtime,detected_at,resolution)
         VALUES (?1,?2,?3,?4,?5,?6,?7,'pending')",
        rusqlite::params![
            conflict.id,
            conflict.item_id,
            conflict.local_path,
            conflict.cloud_url,
            conflict.local_mtime,
            conflict.cloud_mtime,
            chrono::Utc::now().to_rfc3339(),
        ],
    )?;
    Ok(())
}

/// Resolve a conflict according to user choice.
/// - KeepLocal:  upload local version to cloud
/// - KeepCloud:  download cloud version, discard local
/// - KeepBoth:   rename local copy, keep cloud
/// - CreateCopy: create a timestamped copy of both
pub async fn resolve_conflict(
    db:         &Database,
    conflict_id: &str,
    resolution:  ConflictResolution,
) -> Result<()> {
    let resolution_str = match resolution {
        ConflictResolution::KeepLocal  => "keep_local",
        ConflictResolution::KeepCloud  => "keep_cloud",
        ConflictResolution::KeepBoth   => "keep_both",
        ConflictResolution::CreateCopy => "create_copy",
    };

    let conn = db.conn();
    conn.execute(
        "UPDATE conflicts SET resolution=?2 WHERE id=?1",
        rusqlite::params![conflict_id, resolution_str],
    )?;

    // Queue the actual operation based on resolution
    // (the sync engine will pick it up next cycle)
    Ok(())
}
