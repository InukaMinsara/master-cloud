// ─── commands/drive.rs ───────────────────────────────────────────────────────

use tauri::State;
use crate::fs::{VirtualDrive, DriveStatus, pick_drive_letter};
use crate::db::Database;
use crate::sync::{SyncEngine, StorageMode};

#[tauri::command]
pub fn cmd_get_drive_status(drive: State<VirtualDrive>) -> serde_json::Value {
    match drive.status() {
        DriveStatus::Mounted { letter, label } => serde_json::json!({
            "status": "mounted",
            "letter": letter.to_string(),
            "label":  label,
        }),
        DriveStatus::Mounting => serde_json::json!({ "status": "mounting" }),
        DriveStatus::Error(e) => serde_json::json!({ "status": "error", "message": e }),
        DriveStatus::Unmounted => {
            // Suggest best available drive letter
            let suggested = pick_drive_letter(&['M', 'N', 'O', 'P']);
            serde_json::json!({
                "status":    "unmounted",
                "suggested": suggested.map(|c| c.to_string()),
            })
        }
    }
}

#[tauri::command]
pub async fn cmd_mount_drive(
    letter:  String,
    app:     tauri::AppHandle,
    drive:   State<'_, VirtualDrive>,
    db:      State<'_, Database>,
) -> Result<serde_json::Value, String> {
    let letter_char = letter.chars().next().unwrap_or('M').to_ascii_uppercase();

    // Check availability
    if !crate::fs::drive_letter::is_letter_available(letter_char) {
        return Err(format!("Drive letter {}:\\ is already in use", letter_char));
    }

    drive.mount(letter_char, app).await.map_err(|e| e.to_string())?;

    db.set_setting("drive_letter", &letter_char.to_string())
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "mounted": true,
        "letter":  letter_char.to_string(),
    }))
}

#[tauri::command]
pub fn cmd_unmount_drive(drive: State<VirtualDrive>) -> Result<(), String> {
    drive.unmount().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_set_drive_letter(
    letter: String,
    db:     State<Database>,
) -> Result<(), String> {
    db.set_setting("drive_letter", &letter).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_set_storage_mode(
    mode:   String,
    engine: State<SyncEngine>,
    db:     State<Database>,
) -> Result<(), String> {
    let m = match mode.as_str() {
        "mirror" => StorageMode::Mirror,
        "hybrid" => StorageMode::Hybrid,
        _        => StorageMode::Stream,
    };
    engine.set_mode(m, &db).map_err(|e| e.to_string())
}
