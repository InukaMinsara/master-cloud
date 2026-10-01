// ─── commands/settings.rs ────────────────────────────────────────────────────

use tauri::State;
use crate::db::Database;
use crate::cache::CacheManager;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettings {
    pub drive_letter:   String,
    pub storage_mode:   String,
    pub cache_path:     String,
    pub cache_limit_gb: u64,
    pub start_on_boot:  bool,
    pub notifications:  bool,
}

#[tauri::command]
pub fn cmd_get_settings(
    db:    State<Database>,
    cache: State<CacheManager>,
) -> AppSettings {
    AppSettings {
        drive_letter:   db.get_setting("drive_letter").ok().flatten().unwrap_or_else(|| "M".into()),
        storage_mode:   db.get_setting("storage_mode").ok().flatten().unwrap_or_else(|| "stream".into()),
        cache_path:     cache.cache_dir.to_string_lossy().into_owned(),
        cache_limit_gb: cache.max_bytes() / 1024 / 1024 / 1024,
        start_on_boot:  db.get_setting("start_on_boot").ok().flatten().map(|v| v == "true").unwrap_or(true),
        notifications:  db.get_setting("notifications").ok().flatten().map(|v| v == "true").unwrap_or(true),
    }
}

#[tauri::command]
pub fn cmd_save_settings(
    settings: AppSettings,
    db:       State<Database>,
    cache:    State<CacheManager>,
) -> Result<(), String> {
    db.set_setting("drive_letter",  &settings.drive_letter).map_err(|e| e.to_string())?;
    db.set_setting("storage_mode",  &settings.storage_mode).map_err(|e| e.to_string())?;
    db.set_setting("start_on_boot", if settings.start_on_boot { "true" } else { "false" }).map_err(|e| e.to_string())?;
    db.set_setting("notifications", if settings.notifications { "true" } else { "false" }).map_err(|e| e.to_string())?;

    cache.set_max_bytes(settings.cache_limit_gb * 1024 * 1024 * 1024);
    Ok(())
}
