// ─── sync/cloud_api.rs ────────────────────────────────────────────────────────
// Cloud API client — wraps Supabase Storage REST API.
// Uses streaming for large files, range requests for partial downloads.

use anyhow::{Context, Result};
use futures::StreamExt;
use reqwest::Client;
use sha2::{Digest, Sha256};
use std::path::Path;
use tokio::io::AsyncWriteExt;

pub struct CloudApi {
    client:       Client,
    supabase_url: String,
    anon_key:     String,
    access_token: String,
    bucket:       String,
}

impl CloudApi {
    pub fn new(supabase_url: &str, anon_key: &str, access_token: &str) -> Self {
        Self {
            client:       Client::builder()
                .timeout(std::time::Duration::from_secs(300))
                .tcp_keepalive(std::time::Duration::from_secs(60))
                .build()
                .expect("HTTP client build failed"),
            supabase_url: supabase_url.to_string(),
            anon_key:     anon_key.to_string(),
            access_token: access_token.to_string(),
            bucket:       "master-cloud-files".to_string(),
        }
    }

    fn storage_url(&self, path: &str) -> String {
        format!(
            "{}/storage/v1/object/{}/{}",
            self.supabase_url, self.bucket, path.trim_start_matches('/')
        )
    }

    fn list_url(&self) -> String {
        format!("{}/storage/v1/object/list/{}", self.supabase_url, self.bucket)
    }

    // ── Upload (streaming, chunked) ───────────────────────────────────────────

    pub async fn upload_file(&self, local_path: &str, remote_path: &str) -> Result<String> {
        let path = Path::new(local_path);
        let file_size = tokio::fs::metadata(path).await?.len();

        let file = tokio::fs::File::open(path).await?;
        let stream = tokio_util::io::ReaderStream::new(file);
        let body = reqwest::Body::wrap_stream(stream);

        let resp = self.client
            .post(self.storage_url(remote_path))
            .bearer_auth(&self.access_token)
            .header("apikey", &self.anon_key)
            .header("content-type", mime_guess::from_path(path).first_or_octet_stream().as_ref())
            .header("content-length", file_size)
            .header("x-upsert", "true")
            .body(body)
            .send()
            .await
            .context("Upload HTTP request failed")?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body   = resp.text().await.unwrap_or_default();
            anyhow::bail!("Upload failed {}: {}", status, body);
        }

        let json: serde_json::Value = resp.json().await?;
        Ok(json["Key"].as_str().unwrap_or(remote_path).to_string())
    }

    // ── Download (streaming, range-capable) ──────────────────────────────────

    pub async fn download_file(
        &self,
        remote_path: &str,
        local_path:  &str,
        range:       Option<(u64, u64)>,
    ) -> Result<()> {
        let mut req = self.client
            .get(self.storage_url(remote_path))
            .bearer_auth(&self.access_token)
            .header("apikey", &self.anon_key);

        if let Some((start, end)) = range {
            req = req.header("Range", format!("bytes={}-{}", start, end));
        }

        let resp = req.send().await.context("Download request failed")?;
        if !resp.status().is_success() && resp.status().as_u16() != 206 {
            anyhow::bail!("Download failed: {}", resp.status());
        }

        let tmp_path = format!("{}.tmp", local_path);
        let tmp_p    = Path::new(&tmp_path);
        if let Some(parent) = tmp_p.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let mut file   = tokio::fs::File::create(&tmp_path).await?;
        let mut hasher = Sha256::new();
        let mut stream = resp.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.context("Stream read error")?;
            hasher.update(&chunk);
            file.write_all(&chunk).await.context("Write error")?;
        }

        file.flush().await?;
        drop(file);

        tokio::fs::rename(&tmp_path, local_path).await.context("Atomic rename failed")?;

        let sha256 = hex::encode(hasher.finalize());
        tracing::debug!("Downloaded {} → {} sha256={}", remote_path, local_path, &sha256[..8]);
        Ok(())
    }

    // ── List directory ────────────────────────────────────────────────────────

    pub async fn list_folder(&self, prefix: &str) -> Result<Vec<RemoteEntry>> {
        let resp: serde_json::Value = self.client
            .post(self.list_url())
            .bearer_auth(&self.access_token)
            .header("apikey", &self.anon_key)
            .json(&serde_json::json!({
                "prefix": prefix.trim_matches('/'),
                "limit": 1000,
                "offset": 0,
            }))
            .send()
            .await?
            .json()
            .await?;

        let arr = resp.as_array().cloned().unwrap_or_default();
        let entries = arr.iter().filter_map(|item| {
            let name = item["name"].as_str()?.to_string();
            let is_dir = item["id"].is_null();
            Some(RemoteEntry {
                name,
                is_dir,
                size:      item["metadata"]["size"].as_u64().unwrap_or(0),
                etag:      item["metadata"]["eTag"].as_str().map(str::to_string),
                mime_type: item["metadata"]["mimetype"].as_str().map(str::to_string),
                created_at: item["created_at"].as_str().map(str::to_string),
                updated_at: item["updated_at"].as_str().map(str::to_string),
            })
        }).collect();

        Ok(entries)
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    pub async fn delete_file(&self, remote_path: &str) -> Result<()> {
        let resp = self.client
            .delete(self.storage_url(remote_path))
            .bearer_auth(&self.access_token)
            .header("apikey", &self.anon_key)
            .send()
            .await?;

        if !resp.status().is_success() {
            anyhow::bail!("Delete failed: {}", resp.status());
        }
        Ok(())
    }

    // ── Create folder ─────────────────────────────────────────────────────────

    pub async fn create_folder(&self, remote_path: &str) -> Result<()> {
        let keep_path = format!("{}/.keep", remote_path.trim_end_matches('/'));
        self.client
            .post(self.storage_url(&keep_path))
            .bearer_auth(&self.access_token)
            .header("apikey", &self.anon_key)
            .header("content-type", "application/octet-stream")
            .body(b"" as &[u8])
            .send()
            .await?;
        Ok(())
    }

    // ── Move / copy (server-side — no download/re-upload) ─────────────────────

    pub async fn move_file(&self, from: &str, to: &str) -> Result<()> {
        let resp = self.client
            .post(format!("{}/storage/v1/object/move", self.supabase_url))
            .bearer_auth(&self.access_token)
            .header("apikey", &self.anon_key)
            .json(&serde_json::json!({
                "bucketId":       self.bucket,
                "sourceKey":      from,
                "destinationKey": to,
            }))
            .send()
            .await?;

        if !resp.status().is_success() {
            anyhow::bail!("Server-side move failed: {}", resp.status());
        }
        Ok(())
    }

    pub async fn copy_file(&self, from: &str, to: &str) -> Result<()> {
        let resp = self.client
            .post(format!("{}/storage/v1/object/copy", self.supabase_url))
            .bearer_auth(&self.access_token)
            .header("apikey", &self.anon_key)
            .json(&serde_json::json!({
                "bucketId":       self.bucket,
                "sourceKey":      from,
                "destinationKey": to,
            }))
            .send()
            .await?;

        if !resp.status().is_success() {
            anyhow::bail!("Server-side copy failed: {}", resp.status());
        }
        Ok(())
    }

    // ── Signed URL for streaming ──────────────────────────────────────────────

    pub async fn signed_url(&self, remote_path: &str, expires_in: u64) -> Result<String> {
        let resp: serde_json::Value = self.client
            .post(format!("{}/storage/v1/object/sign/{}/{}", self.supabase_url, self.bucket, remote_path))
            .bearer_auth(&self.access_token)
            .header("apikey", &self.anon_key)
            .json(&serde_json::json!({ "expiresIn": expires_in }))
            .send()
            .await?
            .json()
            .await?;

        resp["signedURL"].as_str().map(str::to_string).context("No signedURL in response")
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RemoteEntry {
    pub name:       String,
    pub is_dir:     bool,
    pub size:       u64,
    pub etag:       Option<String>,
    pub mime_type:  Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
