// ─── fs/drive_letter.rs ──────────────────────────────────────────────────────
// Finds an available drive letter, checking existing mounts first.

#[cfg(target_os = "windows")]
use windows::Win32::Storage::FileSystem::GetLogicalDrives;

/// Returns a list of drive letters currently in use.
#[cfg(target_os = "windows")]
pub fn used_drive_letters() -> Vec<char> {
    let mask = unsafe { GetLogicalDrives() };
    ('A'..='Z')
        .filter(|&c| mask & (1 << (c as u32 - 'A' as u32)) != 0)
        .collect()
}

#[cfg(not(target_os = "windows"))]
pub fn used_drive_letters() -> Vec<char> { vec![] }

/// Pick the first available drive letter from a preferred list.
/// Falls back to any unused letter if all preferred ones are taken.
pub fn pick_drive_letter(preferred: &[char]) -> Option<char> {
    let used = used_drive_letters();
    for &letter in preferred {
        if !used.contains(&letter) {
            return Some(letter);
        }
    }
    // Fallback scan E..Z
    for letter in 'E'..='Z' {
        if !used.contains(&letter) {
            return Some(letter);
        }
    }
    None
}

/// Check if a specific drive letter is available.
pub fn is_letter_available(letter: char) -> bool {
    !used_drive_letters().contains(&letter.to_ascii_uppercase())
}
