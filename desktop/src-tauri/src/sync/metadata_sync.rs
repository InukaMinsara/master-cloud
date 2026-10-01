// ─── sync/metadata_sync.rs ────────────────────────────────────────────────────
// Metadata-only sync — keeps the local SQLite file tree in sync with cloud
// without downloading file content. Enables fast directory enumeration.

use anyhow::Result;
use tauri::Manager;

use crate::auth::AuthManager;
use crate::db::{Database, FileMeta};
use crate::sync::cloud_api::CloudApi;

pub async fn sync_root_metadata(app: &tauri::AppHandle) -> Result<()> {
    let auth = app.state::<AuthManager>();
    let db   = app.state::<Database>();

    let token = match auth.access_token() {
        Some(t) => t,
        None    => return Ok(()),
    };

    let api = CloudApi::new(auth.supabase_url(), auth.supabase_anon(), &token);

    let virtual_roots = vec![
        ("My Drive",       None::<String>),
        ("Shared with me", None),
        ("Starred",        None),
        ("Recent",         None),
    ];

    for (name, parent) in virtual_roots {
        let meta = FileMeta {
            id:           format!("vroot:{}", name.replace(' ', "_")),
            parent_id:    parent,
            name:         name.to_string(),
            is_dir:       true,
            size:         0,
            mime_type:    None,
            cloud_url:    None,
            etag:         None,
            mtime:        None,
            created_at:   None,
            is_pinned:    false,
            is_offline:   false,
            local_path:   None,
            local_sha256: None,
            sync_state:   "synced".to_string(),
        };
        let _ = db.upsert_file_meta(&meta);
    }

    sync_prefix(app, &api, &db, "", Some("vroot:My_Drive"), 0).await?;

    Ok(())
}

/// Recursively sync a remote prefix into the local metadata DB.
/// Non-destructive: never deletes cloud or local files.
#[async_recursion::async_recursion]
pub async fn sync_prefix(
    app:       &tauri::AppHandle,
    api:       &CloudApi,
    db:        &Database,
    prefix:    &str,
    parent_id: Option<&str>,
    depth:     usize,
) -> Result<()> {
    if depth > 10 { return Ok(()); }

    let entries = api.list_folder(prefix).await?;

    for entry in entries {
        let full_path = if prefix.is_empty() {
            entry.name.clone()
        } else {
            format!("{}/{}", prefix, entry.name)
        };

        let id = format!("cloud:{}", full_path);

        let meta = FileMeta {
            id:           id.clone(),
            parent_id:    parent_id.map(str::to_string),
            name:         entry.name.clone(),
            is_dir:       entry.is_dir,
            size:         entry.size as i64,
            mime_type:    entry.mime_type.clone(),
            cloud_url:    if entry.is_dir { None } else {
                Some(full_path.clone())
            },
            etag:         entry.etag.clone(),
            mtime:        entry.updated_at.clone(),
            created_at:   entry.created_at.clone(),
            is_pinned:    false,
            is_offline:   false,
            local_path:   None,
            local_sha256: None,
            sync_state:   "cloud_only".to_string(),
        };

        db.upsert_file_meta(&meta)?;

        if entry.is_dir && depth < 3 {
            sync_prefix(app, api, db, &full_path, Some(&id), depth + 1).await?;
        }
    }

    Ok(())
}
