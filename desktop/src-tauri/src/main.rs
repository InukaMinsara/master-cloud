#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(dead_code)]

mod auth;
mod cache;
mod commands;
mod db;
mod fs;
mod sync;
mod tray;

use tauri::Manager;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "master_cloud=debug,warn".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Master Cloud Desktop v{} starting", env!("CARGO_PKG_VERSION"));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--background"]),
        ))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            let db = db::Database::open(&handle)?;
            app.manage(db);

            let auth_mgr = auth::AuthManager::new(&handle)?;
            app.manage(auth_mgr);

            let cache_mgr = cache::CacheManager::new(&handle)?;
            app.manage(cache_mgr);

            let virtual_drive = fs::VirtualDrive::new();
            app.manage(virtual_drive);

            let sync_engine = sync::SyncEngine::new(&handle)?;
            app.manage(sync_engine);

            tray::build_tray(&handle)?;

            let handle2 = handle.clone();
            tauri::async_runtime::spawn(async move {
                sync::run_background(&handle2).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth::cmd_get_auth_status,
            commands::auth::cmd_start_oauth,
            commands::auth::cmd_logout,
            commands::drive::cmd_get_drive_status,
            commands::drive::cmd_mount_drive,
            commands::drive::cmd_unmount_drive,
            commands::drive::cmd_set_drive_letter,
            commands::drive::cmd_set_storage_mode,
            commands::files::cmd_list_dir,
            commands::files::cmd_get_file_info,
            commands::files::cmd_create_folder,
            commands::files::cmd_delete_item,
            commands::files::cmd_rename_item,
            commands::files::cmd_move_item,
            commands::files::cmd_pin_offline,
            commands::files::cmd_unpin_offline,
            commands::sync::cmd_get_sync_status,
            commands::sync::cmd_pause_sync,
            commands::sync::cmd_resume_sync,
            commands::sync::cmd_get_queue,
            commands::settings::cmd_get_settings,
            commands::settings::cmd_save_settings,
            commands::diagnostics::cmd_run_diagnostics,
        ])
        .run(tauri::generate_context!())
        .expect("Master Cloud Desktop: failed to start");
}
