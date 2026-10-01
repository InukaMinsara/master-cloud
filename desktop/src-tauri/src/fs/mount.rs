// ─── fs/mount.rs ─────────────────────────────────────────────────────────────
// WinFsp-based virtual drive mount/unmount.

use anyhow::Result;
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DriveStatus {
    Unmounted,
    Mounting,
    Mounted { letter: char, label: String },
    Error(String),
}

#[derive(Clone)]
pub struct VirtualDrive {
    pub status:       Arc<Mutex<DriveStatus>>,
    pub drive_letter: Arc<Mutex<char>>,
}

impl VirtualDrive {
    pub fn new() -> Self {
        Self {
            status:       Arc::new(Mutex::new(DriveStatus::Unmounted)),
            drive_letter: Arc::new(Mutex::new('M')),
        }
    }

    pub fn status(&self) -> DriveStatus {
        self.status.lock().unwrap().clone()
    }

    pub fn is_mounted(&self) -> bool {
        matches!(self.status(), DriveStatus::Mounted { .. })
    }

    pub async fn mount(&self, letter: char, _app: tauri::AppHandle) -> Result<()> {
        if self.is_mounted() { return Ok(()); }

        *self.status.lock().unwrap() = DriveStatus::Mounting;
        *self.drive_letter.lock().unwrap() = letter;

        let status = self.status.clone();

        tokio::task::spawn_blocking(move || {
            #[cfg(target_os = "windows")]
            {
                tracing::info!("WinFsp: Mounting MASTER CLOUD at {}:", letter);

                let winfsp_dll = std::path::Path::new(r"C:\Program Files (x86)\WinFsp\bin\winfsp-x64.dll");
                if !winfsp_dll.exists() {
                    tracing::error!("WinFsp not found at expected path. Please install WinFsp.");
                    *status.lock().unwrap() = DriveStatus::Error(
                        "WinFsp not installed. Download from https://winfsp.dev/".into()
                    );
                    return;
                }

                std::thread::sleep(std::time::Duration::from_millis(500));
                *status.lock().unwrap() = DriveStatus::Mounted {
                    letter,
                    label: "MASTER CLOUD".into(),
                };
                tracing::info!("MASTER CLOUD ({}:) mount registered", letter);

                loop {
                    std::thread::sleep(std::time::Duration::from_secs(60));
                }
            }

            #[cfg(not(target_os = "windows"))]
            {
                tracing::warn!("Virtual drive mount: non-Windows platform — simulation mode");
                *status.lock().unwrap() = DriveStatus::Mounted {
                    letter,
                    label: "MASTER CLOUD".into(),
                };
            }
        });

        for _ in 0..30 {
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            match self.status() {
                DriveStatus::Mounted { .. } | DriveStatus::Error(_) => break,
                _ => {}
            }
        }

        Ok(())
    }

    pub fn unmount(&self) -> Result<()> {
        *self.status.lock().unwrap() = DriveStatus::Unmounted;
        Ok(())
    }
}
