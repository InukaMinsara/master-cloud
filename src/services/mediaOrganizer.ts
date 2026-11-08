/**
 * MASTER CLOUD - Smart Media Organizer
 * Fast incremental SHA-256 duplicate detection, media health diagnostics,
 * auto-categorization heuristics, and tag management.
 */

import { MediaLibraryItem, DuplicateGroup } from './mediaMetadataDb';

export const MEDIA_CATEGORIES = [
  'All',
  'Movies',
  'TV Shows',
  'Clips & Shorts',
  'Courses & Tutorials',
  'Music Videos',
  'Personal',
  'Uncategorized',
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

/**
 * Computes a fast SHA-256 hash using the file's first 64KB, last 64KB, and byte length.
 * Instantaneous even on multi-gigabyte 4K video files without full-file reading.
 */
export async function computeMediaChunkHash(file: File): Promise<string> {
  if (!file || file.size === 0) return 'empty_file';

  try {
    const CHUNK_SIZE = 64 * 1024; // 64 KB
    const headBlob = file.slice(0, Math.min(CHUNK_SIZE, file.size));
    const tailStart = Math.max(0, file.size - CHUNK_SIZE);
    const tailBlob = file.slice(tailStart, file.size);

    const [headBuf, tailBuf] = await Promise.all([
      headBlob.arrayBuffer(),
      tailBlob.arrayBuffer(),
    ]);

    // Combine head, tail, and size string
    const sizeStr = new TextEncoder().encode(`size:${file.size}_name:${file.name}`);
    const combined = new Uint8Array(headBuf.byteLength + tailBuf.byteLength + sizeStr.byteLength);

    combined.set(new Uint8Array(headBuf), 0);
    combined.set(new Uint8Array(tailBuf), headBuf.byteLength);
    combined.set(sizeStr, headBuf.byteLength + tailBuf.byteLength);

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const digestBuf = await crypto.subtle.digest('SHA-256', combined);
      const hashArray = Array.from(new Uint8Array(digestBuf));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback simple checksum if SubtleCrypto is unavailable
    let checksum = 0;
    for (let i = 0; i < combined.length; i++) {
      checksum = (checksum + combined[i] * (i + 1)) % 4294967296;
    }
    return `chk_${checksum.toString(16)}_${file.size}`;
  } catch (e) {
    return `fallback_${file.name}_${file.size}`;
  }
}

/**
 * Groups library items that share identical hashes or matching size & duration
 */
export function identifyDuplicateMedia(items: MediaLibraryItem[]): DuplicateGroup[] {
  const hashMap = new Map<string, MediaLibraryItem[]>();

  for (const item of items) {
    // Primary key: item.hash; secondary key: size + duration
    const key = item.hash || `${item.size}_${Math.round(item.duration)}`;
    if (!key || key === '0_0') continue;

    const list = hashMap.get(key) || [];
    list.push(item);
    hashMap.set(key, list);
  }

  const duplicates: DuplicateGroup[] = [];
  for (const [hash, group] of hashMap.entries()) {
    if (group.length > 1) {
      duplicates.push({
        hash,
        totalSize: group.reduce((acc, curr) => acc + (curr.size || 0), 0),
        items: group,
      });
    }
  }

  return duplicates;
}

/**
 * Heuristic auto-categorizer for incoming video files
 */
export function guessMediaCategory(name: string, durationSeconds?: number): string {
  const lower = name.toLowerCase();

  // Pattern checks
  if (/(s\d{1,2}e\d{1,2}|season|episode|ep\d{1,2})/i.test(lower)) {
    return 'TV Shows';
  }
  if (/(tutorial|course|lecture|class|learn|chapter|lesson)/i.test(lower)) {
    return 'Courses & Tutorials';
  }
  if (/(mv|music[\s_\-]*video|official[\s_\-]*video|official[\s_\-]*audio|remix|soundtrack|live[\s_\-]*performance)/i.test(lower)) {
    return 'Music Videos';
  }
  if (/(trailer|teaser|short|reel|clip|preview|highlight)/i.test(lower)) {
    return 'Clips & Shorts';
  }
  if (/(family|vacation|trip|vlog|party|birthday|home)/i.test(lower)) {
    return 'Personal';
  }

  // Duration-based checks
  if (durationSeconds && durationSeconds > 0) {
    if (durationSeconds >= 4800) return 'Movies'; // > 80 mins
    if (durationSeconds >= 1200 && durationSeconds <= 3600) return 'TV Shows'; // 20-60 mins
    if (durationSeconds < 180) return 'Clips & Shorts'; // < 3 mins
  }

  return 'Uncategorized';
}

/**
 * Probes local media file readability and codec viability
 */
export async function probeMediaHealth(file: File): Promise<{
  isReadable: boolean;
  issue?: string;
  duration?: number;
  width?: number;
  height?: number;
}> {
  if (!file || file.size === 0) {
    return { isReadable: false, issue: 'File is empty (0 bytes).' };
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.preload = 'metadata';

    const timer = setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve({
        isReadable: false,
        issue: 'Metadata loading timed out. The file container or stream index may be corrupted.',
      });
    }, 6000);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      const isDurationValid = !isNaN(video.duration) && video.duration > 0;
      const width = video.videoWidth;
      const height = video.videoHeight;
      URL.revokeObjectURL(url);

      if (!isDurationValid) {
        resolve({
          isReadable: false,
          issue: 'Invalid or missing media duration header.',
        });
      } else {
        resolve({
          isReadable: true,
          duration: video.duration,
          width,
          height,
        });
      }
    };

    video.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve({
        isReadable: false,
        issue: 'Browser video engine could not decode this container or codec.',
      });
    };
  });
}
