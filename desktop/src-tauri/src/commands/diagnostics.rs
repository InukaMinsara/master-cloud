// ─── commands/diagnostics.rs ─────────────────────────────────────────────────

use tauri::State;
use crate::db::Database;
use crate::cache::CacheManager;
use crate::auth::AuthManager;
use crate::fs::VirtualDrive;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct DiagnosticsReport {
    pub version:        String,
    pub drive_status:   String,
    pub auth_status:    String,
    pub cache_used_gb:  f64,
    pub cache_max_gb:   f64,
    pub pending_ops:    usize,
    pub winfsp_present: bool,
    pub db_path:        String,
}

#[tauri::command]
pub fn cmd_run_diagnostics(
    db:    State<Database>,
    cache: State<CacheManager>,
    auth:  State<AuthManager>,
    drive: State<VirtualDrive>,
) -> DiagnosticsReport {
    let cache_used = cache.cache_used_bytes().unwrap_or(0);
    let pending    = db.get_pending_ops(1000).map(|v| v.len()).unwrap_or(0);

    let winfsp = {
        #[cfg(target_os = "windows")]
        { std::path::Path::new("C:\\Program Files (x86)\\WinFsp").exists()
          || std::path::Path::new("C:\\Program Files\\WinFsp").exists() }
        #[cfg(not(target_os = "windows"))]
        { false }
    };

    DiagnosticsReport {
        version:        env!("CARGO_PKG_VERSION").to_string(),
        drive_status:   format!("{:?}", drive.status()),
        auth_status:    format!("{:?}", auth.state()),
        cache_used_gb:  cache_used as f64 / 1e9,
        cache_max_gb:   cache.max_bytes() as f64 / 1e9,
        pending_ops:    pending,
        winfsp_present: winfsp,
        db_path:        cache.cache_dir.to_string_lossy().into_owned(),
    }
}
