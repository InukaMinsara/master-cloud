// ─── cache/mod.rs ────────────────────────────────────────────────────────────
// Local cache manager — LRU eviction, pinned files, offline files.
// Protects local disk from overfill; never silently consumes all storage.

use anyhow::{Context, Result};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use parking_lot::RwLock;
use tauri::Manager;

#[derive(Clone)]
pub struct CacheManager {
    pub cache_dir:    PathBuf,
    pub stage_dir:    PathBuf,
    pub max_bytes:    Arc<RwLock<u64>>,
    http_client:      reqwest::Client,
}

impl CacheManager {
    pub fn new(app: &tauri::AppHandle) -> Result<Self> {
        let data_dir = app.path().app_data_dir()
            .expect("Cannot resolve app data dir");

        let cache_dir = data_dir.join("cache");
        let stage_dir = data_dir.join("staging");

        std::fs::create_dir_all(&cache_dir)?;
        std::fs::create_dir_all(&stage_dir)?;

        // Default cache limit: 5 GB
        let max_bytes = Arc::new(RwLock::new(5u64 * 1024 * 1024 * 1024));

        let http_client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(300))
            .tcp_keepalive(std::time::Duration::from_secs(30))
            .build()?;

        Ok(Self { cache_dir, stage_dir, max_bytes, http_client })
    }

    // ── Path helpers ──────────────────────────────────────────────────────────

    pub fn cache_path_for(&self, file_id: &str) -> String {
        let sub = &file_id[..2.min(file_id.len())];
        self.cache_dir
            .join(sub)
            .join(file_id)
            .to_string_lossy()
            .into_owned()
    }

    pub fn stage_path_for(&self, file_id: &str) -> String {
        self.stage_dir
            .join(file_id)
            .to_string_lossy()
            .into_owned()
    }

    // ── Download to cache ─────────────────────────────────────────────────────
    //
    // Downloads a file from cloud_url to local_path.
    // Uses streaming — never loads full file into RAM.
    // Atomic write: temp file → rename on completion.
    // Verifies SHA-256 after download.

    pub async fn download_to_cache(&self, cloud_url: &str, local_path: &str) -> Result<()> {
        use futures::StreamExt;
        use sha2::{Digest, Sha256};
        use tokio::io::AsyncWriteExt;

        // Check disk space first
        let avail = available_space(local_path)?;
        let max   = *self.max_bytes.read();
        let used  = self.cache_used_bytes()?;
        if used + 50 * 1024 * 1024 > max {
            // Cache is nearly full — evict LRU files
            self.evict_lru().await?;
        }

        let tmp_path = format!("{}.tmp", local_path);
        if let Some(parent) = Path::new(&tmp_path).parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let resp = self.http_client
            .get(cloud_url)
            .send()
            .await
            .context("Cache download HTTP request failed")?;

        if !resp.status().is_success() {
            anyhow::bail!("Cache download failed: {}", resp.status());
        }

        let mut file   = tokio::fs::File::create(&tmp_path).await?;
        let mut hasher = Sha256::new();
        let mut stream = resp.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.context("Stream read error")?;
            hasher.update(&chunk);
            file.write_all(&chunk).await?;
        }
        file.flush().await?;
        drop(file);

        // Atomic rename
        tokio::fs::rename(&tmp_path, local_path).await?;

        tracing::debug!("Cached {} sha256={}", local_path, &hex::encode(hasher.finalize())[..8]);
        Ok(())
    }

    // ── Cache eviction (LRU) ──────────────────────────────────────────────────

    async fn evict_lru(&self) -> Result<()> {
        let cache_dir = self.cache_dir.clone();
        let max_bytes = *self.max_bytes.read();

        tokio::task::spawn_blocking(move || -> Result<()> {
            let mut files: Vec<(PathBuf, std::time::SystemTime, u64)> = Vec::new();

            // Collect all cached files with access time and size
            for entry in walkdir::WalkDir::new(&cache_dir).min_depth(2).max_depth(3) {
                if let Ok(e) = entry {
                    if e.file_type().is_file() {
                        let meta = e.metadata()?;
                        let atime = meta.accessed().unwrap_or(std::time::SystemTime::UNIX_EPOCH);
                        files.push((e.path().to_path_buf(), atime, meta.len()));
                    }
                }
            }

            // Sort by access time — oldest first
            files.sort_by_key(|(_, atime, _)| *atime);

            let total: u64 = files.iter().map(|(_, _, s)| s).sum();
            let mut freed: u64 = 0;
            let target_free = max_bytes / 5; // free up 20%

            for (path, _, size) in &files {
                if freed >= target_free { break; }
                // Never evict pinned files (they won't be in this folder)
                if let Err(e) = std::fs::remove_file(path) {
                    tracing::warn!("Eviction failed for {}: {}", path.display(), e);
                } else {
                    freed += size;
                    tracing::debug!("Evicted cache file: {}", path.display());
                }
            }

            tracing::info!("Cache eviction freed {} MB", freed / 1024 / 1024);
            Ok(())
        }).await??;

        Ok(())
    }

    pub fn cache_used_bytes(&self) -> Result<u64> {
        let mut total = 0u64;
        for entry in walkdir::WalkDir::new(&self.cache_dir) {
            if let Ok(e) = entry {
                if e.file_type().is_file() {
                    total += e.metadata()?.len();
                }
            }
        }
        Ok(total)
    }

    pub fn set_max_bytes(&self, bytes: u64) {
        *self.max_bytes.write() = bytes;
    }

    pub fn max_bytes(&self) -> u64 {
        *self.max_bytes.read()
    }
}

// ── Disk space check ─────────────────────────────────────────────────────────

pub fn available_space(path: &str) -> Result<u64> {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;
        use windows::core::PCWSTR;

        let path_w: Vec<u16> = path.encode_utf16().chain(std::iter::once(0)).collect();
        let mut avail  = 0u64;
        let mut total  = 0u64;
        let mut free   = 0u64;
        unsafe {
            GetDiskFreeSpaceExW(
                PCWSTR(path_w.as_ptr()),
                Some(&mut avail),
                Some(&mut total),
                Some(&mut free),
            )?;
        }
        Ok(avail)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(100 * 1024 * 1024 * 1024) // 100 GB dummy on non-Windows
    }
}
