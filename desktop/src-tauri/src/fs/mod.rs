// ─── fs/mod.rs ────────────────────────────────────────────────────────────────
// WinFsp Virtual Filesystem — mounts MASTER CLOUD as a real Windows drive.
//
// Architecture:
//   - WinFsp provides the Windows filesystem driver
//   - Our FileSystem impl handles callbacks: Open, Read, Write, ReadDirectory, etc.
//   - File content is served from cache (if cached) or streamed from cloud
//   - Heavy async work is dispatched to Tokio, callbacks return quickly
//   - Explorer stability: callbacks NEVER block on slow network in the hot path

pub mod mount;
pub mod operations;
pub mod drive_letter;

pub use mount::{VirtualDrive, DriveStatus};
pub use drive_letter::pick_drive_letter;
