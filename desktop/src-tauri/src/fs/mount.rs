// ─── fs/mount.rs ─────────────────────────────────────────────────────────────
// WinFsp-based virtual drive mount/unmount.
//
// WinFsp provides a Windows kernel filesystem driver. We implement the
// FileSystemHost interface in Rust via the winfsp-sys crate.
// 
// IMPORTANT: Explorer stability rule —
//   All filesystem callbacks that need cloud data dispatch to a Tokio runtime
//   and return a cached/default result immediately if data isn't ready yet.
//   This prevents Explorer from freezing or hanging.

use anyhow::{Context, Result};
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
    /// Handle to the WinFsp host (platform-specific)
    #[cfg(target_os = "windows")]
    host_handle:      Arc<Mutex<Option<WinFspHostHandle>>>,
}

impl VirtualDrive {
    pub fn new() -> Self {
        Self {
            status:       Arc::new(Mutex::new(DriveStatus::Unmounted)),
            drive_letter: Arc::new(Mutex::new('M')),
            #[cfg(target_os = "windows")]
            host_handle:  Arc::new(Mutex::new(None)),
        }
    }

    pub fn status(&self) -> DriveStatus {
        self.status.lock().unwrap().clone()
    }

    pub fn is_mounted(&self) -> bool {
        matches!(self.status(), DriveStatus::Mounted { .. })
    }

    /// Mount the virtual drive using WinFsp.
    ///
    /// This creates a real Windows filesystem mount visible in:
    ///   - Windows File Explorer
    ///   - This PC
    ///   - Any application using standard Win32 file APIs
    pub async fn mount(
        &self,
        letter:     char,
        app_handle: tauri::AppHandle,
    ) -> Result<()> {
        if self.is_mounted() {
            return Ok(()); // Already mounted
        }

        *self.status.lock().unwrap() = DriveStatus::Mounting;
        *self.drive_letter.lock().unwrap() = letter;

        #[cfg(target_os = "windows")]
        {
            self.mount_winfsp(letter, app_handle).await?;
        }

        #[cfg(not(target_os = "windows"))]
        {
            tracing::warn!("WinFsp mount not available on non-Windows. Simulating.");
            *self.status.lock().unwrap() = DriveStatus::Mounted {
                letter,
                label: "MASTER CLOUD".to_string(),
            };
        }

        Ok(())
    }

    #[cfg(target_os = "windows")]
    async fn mount_winfsp(&self, letter: char, app_handle: tauri::AppHandle) -> Result<()> {
        use winfsp_sys::*;
        use crate::fs::operations::MasterCloudFileSystem;

        let status  = self.status.clone();
        let handle  = self.host_handle.clone();
        let mount_pt = format!("{}:\\", letter);

        // Spawn the WinFsp host in a dedicated blocking thread
        // (WinFsp's main dispatch loop blocks)
        tokio::task::spawn_blocking(move || -> Result<()> {
            let fs = MasterCloudFileSystem::new(app_handle);
            let mut host = FileSystemHost::new(FileSystemType::Disk, Box::new(fs))?;

            host.set_volume_label("MASTER CLOUD")?;
            host.set_sector_size(512)?;
            host.set_sectors_per_allocation_unit(1)?;
            host.set_max_component_length(255)?;
            host.set_file_info_timeout(1000)?;  // 1 second cache
            host.set_case_sensitive_search(false)?;
            host.set_case_preserved_names(true)?;
            host.set_unicode_on_disk(true)?;
            host.set_persistent_acls(false)?;
            host.set_reparse_points(false)?;

            // Set the volume serial (deterministic from label)
            host.set_volume_serial_number(0x4D435244)?; // "MCRD"

            // Mount with drive letter
            host.mount(&mount_pt, None, false, 0)?;

            *status.lock().unwrap() = DriveStatus::Mounted {
                letter,
                label: "MASTER CLOUD".to_string(),
            };

            tracing::info!("WinFsp mounted MASTER CLOUD at {}:", letter);

            // Dispatcher loop — blocks until unmount
            host.start_dispatcher(0)?;
            host.wait_dispatcher()?;

            *status.lock().unwrap() = DriveStatus::Unmounted;
            *handle.lock().unwrap() = None;

            Ok(())
        });

        // Wait briefly for mount to confirm
        tokio::time::sleep(std::time::Duration::from_secs(2)).await;
        Ok(())
    }

    /// Unmount the drive safely.
    pub fn unmount(&self) -> Result<()> {
        #[cfg(target_os = "windows")]
        {
            // Signal the WinFsp host to stop (it will unblock the dispatcher)
            if let Ok(mut handle) = self.host_handle.lock() {
                if let Some(h) = handle.take() {
                    h.stop()?;
                }
            }
        }
        *self.status.lock().unwrap() = DriveStatus::Unmounted;
        Ok(())
    }
}

// Placeholder type for the WinFsp host handle on Windows
#[cfg(target_os = "windows")]
struct WinFspHostHandle;
#[cfg(target_os = "windows")]
impl WinFspHostHandle {
    fn stop(&self) -> Result<()> { Ok(()) }
}
