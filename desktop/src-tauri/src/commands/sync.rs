// ─── commands/sync.rs ────────────────────────────────────────────────────────

use tauri::State;
use crate::sync::SyncEngine;
use crate::db::Database;

#[tauri::command]
pub fn cmd_get_sync_status(
    engine: State<SyncEngine>,
    db:     State<Database>,
) -> crate::sync::SyncStatus {
    engine.status(&db)
}

#[tauri::command]
pub fn cmd_pause_sync(engine: State<SyncEngine>) {
    engine.pause();
}

#[tauri::command]
pub fn cmd_resume_sync(engine: State<SyncEngine>) {
    engine.resume();
}

#[tauri::command]
pub fn cmd_get_queue(db: State<Database>) -> Result<Vec<crate::db::QueuedOp>, String> {
    db.get_pending_ops(50).map_err(|e| e.to_string())
}
