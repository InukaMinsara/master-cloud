// ─── auth/mod.rs ─────────────────────────────────────────────────────────────
// Authentication Manager — OAuth via Supabase, secure token storage via
// Windows Credential Manager (DPAPI). Never stores plaintext password.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};
use tauri::Manager;

pub mod credential_store;

use credential_store::CredentialStore;

// ── Public types ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AuthState {
    LoggedOut,
    LoggingIn,
    LoggedIn { user_id: String, email: String, access_token: String },
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub id:    String,
    pub email: String,
    pub name:  Option<String>,
}

// ── Manager ───────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct AuthManager {
    state:     Arc<RwLock<AuthState>>,
    cred:      CredentialStore,
    supabase_url:  String,
    supabase_anon: String,
}

impl AuthManager {
    pub fn new(app: &tauri::AppHandle) -> Result<Self> {
        // Read Supabase config from tauri config (bundled at build time)
        let config = app.config();
        let supabase_url  = std::env::var("MASTER_CLOUD_SUPABASE_URL")
            .unwrap_or_else(|_| config.product_name.clone().unwrap_or_default());
        let supabase_anon = std::env::var("MASTER_CLOUD_SUPABASE_ANON_KEY")
            .unwrap_or_default();

        let cred = CredentialStore::new("MasterCloud")?;

        // Try to restore session from credential store
        let state = match cred.load_session()? {
            Some(session) => {
                tracing::info!("Restored session for {}", session.email);
                AuthState::LoggedIn {
                    user_id:      session.user_id.clone(),
                    email:        session.email.clone(),
                    access_token: session.access_token.clone(),
                }
            }
            None => AuthState::LoggedOut,
        };

        Ok(Self {
            state: Arc::new(RwLock::new(state)),
            cred,
            supabase_url,
            supabase_anon,
        })
    }

    pub fn state(&self) -> AuthState {
        self.state.read().unwrap().clone()
    }

    pub fn access_token(&self) -> Option<String> {
        match self.state.read().unwrap().clone() {
            AuthState::LoggedIn { access_token, .. } => Some(access_token),
            _ => None,
        }
    }

    /// Start OAuth flow — returns the browser URL to open
    pub fn start_oauth_url(&self, provider: &str) -> Result<String> {
        let url = format!(
            "{}/auth/v1/authorize?provider={}&redirect_to=mastercloud://auth/callback",
            self.supabase_url, provider
        );
        Ok(url)
    }

    /// Handle OAuth callback — exchange code for session
    pub async fn handle_oauth_callback(&self, url: &str) -> Result<UserInfo> {
        // Parse access_token from fragment or query
        let parsed = reqwest::Url::parse(url)?;
        let fragment = parsed.fragment().unwrap_or("");
        let params: std::collections::HashMap<_, _> = fragment
            .split('&')
            .filter_map(|p| {
                let mut it = p.splitn(2, '=');
                Some((it.next()?.to_string(), it.next()?.to_string()))
            })
            .collect();

        let access_token = params
            .get("access_token")
            .context("No access_token in callback")?
            .clone();
        let refresh_token = params
            .get("refresh_token")
            .cloned()
            .unwrap_or_default();

        // Fetch user info from Supabase
        let client = reqwest::Client::new();
        let resp: serde_json::Value = client
            .get(format!("{}/auth/v1/user", self.supabase_url))
            .bearer_auth(&access_token)
            .header("apikey", &self.supabase_anon)
            .send()
            .await?
            .json()
            .await?;

        let user_id = resp["id"].as_str().unwrap_or("").to_string();
        let email   = resp["email"].as_str().unwrap_or("").to_string();
        let name    = resp["user_metadata"]["full_name"].as_str().map(str::to_string);

        // Persist session securely
        self.cred.save_session(&StoredSession {
            user_id:       user_id.clone(),
            email:         email.clone(),
            access_token:  access_token.clone(),
            refresh_token,
        })?;

        *self.state.write().unwrap() = AuthState::LoggedIn {
            user_id:      user_id.clone(),
            email:        email.clone(),
            access_token,
        };

        Ok(UserInfo { id: user_id, email, name })
    }

    /// Logout — clear credential store
    pub fn logout(&self) -> Result<()> {
        self.cred.clear_session()?;
        *self.state.write().unwrap() = AuthState::LoggedOut;
        Ok(())
    }

    /// Refresh access token using stored refresh token
    pub async fn refresh_token(&self) -> Result<()> {
        let stored = self.cred.load_session()?.context("No stored session")?;
        let client = reqwest::Client::new();
        let resp: serde_json::Value = client
            .post(format!("{}/auth/v1/token?grant_type=refresh_token", self.supabase_url))
            .header("apikey", &self.supabase_anon)
            .json(&serde_json::json!({ "refresh_token": stored.refresh_token }))
            .send()
            .await?
            .json()
            .await?;

        let new_access  = resp["access_token"].as_str().unwrap_or("").to_string();
        let new_refresh = resp["refresh_token"].as_str().unwrap_or(&stored.refresh_token).to_string();

        self.cred.save_session(&StoredSession {
            access_token:  new_access.clone(),
            refresh_token: new_refresh,
            ..stored
        })?;

        let mut state = self.state.write().unwrap();
        if let AuthState::LoggedIn { ref mut access_token, .. } = *state {
            *access_token = new_access;
        }

        Ok(())
    }

    pub fn supabase_url(&self) -> &str { &self.supabase_url }
    pub fn supabase_anon(&self) -> &str { &self.supabase_anon }
}

// ── Internal session type ─────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredSession {
    pub user_id:       String,
    pub email:         String,
    pub access_token:  String,
    pub refresh_token: String,
}
