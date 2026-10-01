// ─── commands/auth.rs ────────────────────────────────────────────────────────

use tauri::State;
use crate::auth::{AuthManager, AuthState};

#[tauri::command]
pub fn cmd_get_auth_status(auth: State<AuthManager>) -> serde_json::Value {
    match auth.state() {
        AuthState::LoggedIn { user_id, email, .. } => serde_json::json!({
            "status": "logged_in",
            "user_id": user_id,
            "email": email,
        }),
        AuthState::LoggingIn => serde_json::json!({ "status": "logging_in" }),
        AuthState::Error(e)  => serde_json::json!({ "status": "error", "message": e }),
        AuthState::LoggedOut => serde_json::json!({ "status": "logged_out" }),
    }
}

#[tauri::command]
pub fn cmd_start_oauth(
    provider: String,
    auth: State<AuthManager>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let url = auth.start_oauth_url(&provider).map_err(|e| e.to_string())?;

    // Open URL in default browser
    open::that(&url).map_err(|e| e.to_string())?;

    Ok(url)
}

#[tauri::command]
pub fn cmd_logout(auth: State<AuthManager>) -> Result<(), String> {
    auth.logout().map_err(|e| e.to_string())
}
