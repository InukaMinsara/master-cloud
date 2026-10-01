// ─── auth/credential_store.rs ────────────────────────────────────────────────
// Windows Credential Manager integration via DPAPI.
// Tokens are stored encrypted in the OS keychain — never plaintext on disk.

use anyhow::{Context, Result};
use std::ffi::OsStr;
use super::StoredSession;

#[cfg(target_os = "windows")]
use windows::{
    core::PCWSTR,
    Win32::Security::Credentials::{
        CredDeleteW, CredReadW, CredWriteW, CREDENTIALW, CRED_FLAGS, CRED_PERSIST_LOCAL_MACHINE,
        CRED_TYPE_GENERIC,
    },
};

pub struct CredentialStore {
    target: String,
}

impl CredentialStore {
    pub fn new(app_name: &str) -> Result<Self> {
        Ok(Self {
            target: format!("{}/session", app_name),
        })
    }

    #[cfg(target_os = "windows")]
    pub fn save_session(&self, session: &StoredSession) -> Result<()> {
        let json = serde_json::to_vec(session)?;
        let target_w: Vec<u16> = self.target.encode_utf16().chain(std::iter::once(0)).collect();
        let username_w: Vec<u16> = session.email.encode_utf16().chain(std::iter::once(0)).collect();

        let cred = CREDENTIALW {
            Flags: CRED_FLAGS(0),
            Type: CRED_TYPE_GENERIC,
            TargetName: PCWSTR(target_w.as_ptr()),
            Comment: PCWSTR::null(),
            LastWritten: Default::default(),
            CredentialBlobSize: json.len() as u32,
            CredentialBlob: json.as_ptr() as *mut u8,
            Persist: CRED_PERSIST_LOCAL_MACHINE,
            AttributeCount: 0,
            Attributes: std::ptr::null_mut(),
            TargetAlias: PCWSTR::null(),
            UserName: PCWSTR(username_w.as_ptr()),
        };

        unsafe { CredWriteW(&cred, 0)? };
        tracing::debug!("Session saved to Windows Credential Manager");
        Ok(())
    }

    #[cfg(target_os = "windows")]
    pub fn load_session(&self) -> Result<Option<StoredSession>> {
        let target_w: Vec<u16> = self.target.encode_utf16().chain(std::iter::once(0)).collect();
        let mut pcred = std::ptr::null_mut();

        let result = unsafe {
            CredReadW(
                PCWSTR(target_w.as_ptr()),
                CRED_TYPE_GENERIC,
                0,
                &mut pcred,
            )
        };

        match result {
            Ok(_) => {
                let cred = unsafe { &*pcred };
                let blob_slice = unsafe {
                    std::slice::from_raw_parts(cred.CredentialBlob, cred.CredentialBlobSize as usize)
                };
                let session: StoredSession = serde_json::from_slice(blob_slice)
                    .context("Failed to deserialize stored session")?;
                Ok(Some(session))
            }
            Err(e) if e.code() == windows::Win32::Foundation::ERROR_NOT_FOUND.to_hresult() => {
                Ok(None)
            }
            Err(e) => Err(e.into()),
        }
    }

    #[cfg(target_os = "windows")]
    pub fn clear_session(&self) -> Result<()> {
        let target_w: Vec<u16> = self.target.encode_utf16().chain(std::iter::once(0)).collect();
        let _ = unsafe { CredDeleteW(PCWSTR(target_w.as_ptr()), CRED_TYPE_GENERIC, 0) };
        Ok(())
    }

    // ── Fallback for non-Windows builds (dev on Linux/macOS) ─────────────────
    #[cfg(not(target_os = "windows"))]
    pub fn save_session(&self, session: &StoredSession) -> Result<()> {
        let path = std::env::temp_dir().join("mc_session.json");
        let json = serde_json::to_string(session)?;
        std::fs::write(&path, json)?;
        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    pub fn load_session(&self) -> Result<Option<StoredSession>> {
        let path = std::env::temp_dir().join("mc_session.json");
        if !path.exists() { return Ok(None); }
        let json = std::fs::read_to_string(&path)?;
        Ok(Some(serde_json::from_str(&json)?))
    }

    #[cfg(not(target_os = "windows"))]
    pub fn clear_session(&self) -> Result<()> {
        let path = std::env::temp_dir().join("mc_session.json");
        let _ = std::fs::remove_file(path);
        Ok(())
    }
}
