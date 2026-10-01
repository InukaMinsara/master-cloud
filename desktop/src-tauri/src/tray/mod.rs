// ─── tray/mod.rs ──────────────────────────────────────────────────────────────
// Windows system tray application.

use anyhow::Result;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Manager,
};

pub fn build_tray(app: &tauri::AppHandle) -> Result<()> {
    let open   = MenuItem::with_id(app, "open",         "Open Master Cloud", true, None::<&str>)?;
    let drive  = MenuItem::with_id(app, "drive",        "Open Drive (M:)",   true, None::<&str>)?;
    let status = MenuItem::with_id(app, "status",       "⟳  Synced",         false, None::<&str>)?;
    let sep1   = PredefinedMenuItem::separator(app)?;
    let pause  = MenuItem::with_id(app, "pause",        "Pause Sync",        true, None::<&str>)?;
    let resume = MenuItem::with_id(app, "resume",       "Resume Sync",       true, None::<&str>)?;
    let sep2   = PredefinedMenuItem::separator(app)?;
    let settings = MenuItem::with_id(app, "settings",  "Settings",          true, None::<&str>)?;
    let sep3   = PredefinedMenuItem::separator(app)?;
    let web    = MenuItem::with_id(app, "web",          "Open Web App",      true, None::<&str>)?;
    let sep4   = PredefinedMenuItem::separator(app)?;
    let signout = MenuItem::with_id(app, "signout",     "Sign Out",          true, None::<&str>)?;
    let quit   = MenuItem::with_id(app, "quit",         "Quit Master Cloud", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[
        &open, &drive, &status, &sep1,
        &pause, &resume, &sep2,
        &settings, &sep3,
        &web, &sep4,
        &signout, &quit,
    ])?;

    TrayIconBuilder::with_id("main-tray")
        .tooltip("Master Cloud")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "open" => {
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
                "drive" => {
                    let _ = std::process::Command::new("explorer.exe")
                        .arg("M:\\")
                        .spawn();
                }
                "web" => {
                    let _ = open::that("https://master-cloud.netlify.app");
                }
                "pause" => {
                    let engine = app.state::<crate::sync::SyncEngine>();
                    engine.pause();
                }
                "resume" => {
                    let engine = app.state::<crate::sync::SyncEngine>();
                    engine.resume();
                }
                "settings" => {
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.show();
                        let _ = w.eval("window.location.hash = '#settings'");
                    }
                }
                "signout" => {
                    let auth = app.state::<crate::auth::AuthManager>();
                    let _ = auth.logout();
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}
