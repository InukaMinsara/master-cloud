use tauri::State;
use crate::db::{Database, FileMeta, QueuedOp};
use crate::auth::AuthManager;

#[tauri::command]
pub fn cmd_list_dir(
    parent_id: Option<String>,
    db:        State<Database>,
) -> Result<Vec<FileMeta>, String> {
    db.list_children(parent_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_get_file_info(
    id: String,
    db: State<Database>,
) -> Result<Option<FileMeta>, String> {
    db.get_file_meta(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_create_folder(
    parent_id:   Option<String>,
    name:        String,
    db:          State<Database>,
) -> Result<FileMeta, String> {
    let meta = FileMeta {
        id:           format!("local:{}", uuid::Uuid::new_v4()),
        parent_id,
        name:         name.clone(),
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
    db.upsert_file_meta(&meta).map_err(|e| e.to_string())?;

    let op = QueuedOp {
        id:         uuid::Uuid::new_v4().to_string(),
        op_type:    "mkdir".to_string(),
        item_id:    meta.id.clone(),
        payload:    Some(serde_json::json!({ "remote_path": name }).to_string()),
        status:     "pending".to_string(),
        attempts:   0,
        last_error: None,
    };
    db.enqueue_op(&op).map_err(|e| e.to_string())?;

    Ok(meta)
}

#[tauri::command]
pub async fn cmd_delete_item(
    id:    String,
    db:    State<'_, Database>,
    _auth: State<'_, AuthManager>,
) -> Result<(), String> {
    let meta = db.get_file_meta(&id).map_err(|e| e.to_string())?
        .ok_or_else(|| "File not found".to_string())?;

    {
        let conn = db.conn();
        conn.execute("DELETE FROM file_meta WHERE id=?1", rusqlite::params![id])
            .map_err(|e| e.to_string())?;
    }

    if meta.cloud_url.is_some() {
        let op = QueuedOp {
            id:         uuid::Uuid::new_v4().to_string(),
            op_type:    "delete_cloud".to_string(),
            item_id:    id,
            payload:    Some(serde_json::json!({
                "remote_path": meta.cloud_url.unwrap_or_default()
            }).to_string()),
            status:     "pending".to_string(),
            attempts:   0,
            last_error: None,
        };
        db.enqueue_op(&op).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn cmd_rename_item(
    id:       String,
    new_name: String,
    db:       State<Database>,
) -> Result<(), String> {
    let conn = db.conn();
    conn.execute(
        "UPDATE file_meta SET name=?2, mtime=?3 WHERE id=?1",
        rusqlite::params![id, new_name, chrono::Utc::now().to_rfc3339()],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_move_item(
    id:            String,
    new_parent_id: Option<String>,
    db:            State<Database>,
) -> Result<(), String> {
    let conn = db.conn();
    conn.execute(
        "UPDATE file_meta SET parent_id=?2, mtime=?3 WHERE id=?1",
        rusqlite::params![id, new_parent_id, chrono::Utc::now().to_rfc3339()],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_pin_offline(id: String, db: State<Database>) -> Result<(), String> {
    let conn = db.conn();
    conn.execute(
        "UPDATE file_meta SET is_pinned=1, is_offline=1, sync_state='pinned' WHERE id=?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    if let Ok(Some(meta)) = db.get_file_meta(&id) {
        if meta.local_path.is_none() {
            let op = QueuedOp {
                id:         uuid::Uuid::new_v4().to_string(),
                op_type:    "download".to_string(),
                item_id:    id,
                payload:    Some(serde_json::json!({
                    "cloud_url":  meta.cloud_url.unwrap_or_default(),
                    "local_path": "pending",
                }).to_string()),
                status:     "pending".to_string(),
                attempts:   0,
                last_error: None,
            };
            let _ = db.enqueue_op(&op);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn cmd_unpin_offline(id: String, db: State<Database>) -> Result<(), String> {
    if let Ok(Some(meta)) = db.get_file_meta(&id) {
        if let Some(local) = meta.local_path {
            if !meta.is_pinned {
                let _ = std::fs::remove_file(&local);
            }
        }
    }
    let conn = db.conn();
    conn.execute(
        "UPDATE file_meta SET is_pinned=0, is_offline=0, local_path=NULL, sync_state='cloud_only' WHERE id=?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
