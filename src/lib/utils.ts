import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDateTime(dateStr: string | number | Date): string {
  try {
    const d = new Date(dateStr);
    return format(d, 'MMM d, yyyy h:mm a');
  } catch {
    return String(dateStr);
  }
}

export function formatDateRelative(dateStr: string | number | Date): string {
  try {
    const d = new Date(dateStr);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return String(dateStr);
  }
}

export function getFileExtension(filename: string): string {
  if (!filename || !filename.includes('.')) return '';
  return filename.split('.').pop()?.toLowerCase() || '';
}

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other';

export function getFileCategory(mimeType: string, extension: string): FileCategory {
  const ext = extension.toLowerCase();
  const mime = mimeType.toLowerCase();

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)) {
    return 'audio';
  }
  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('spreadsheet') ||
    mime.includes('presentation') ||
    mime.includes('text/plain') ||
    mime.includes('csv') ||
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'].includes(ext)
  ) {
    return 'document';
  }
  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('gzip') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return 'archive';
  }
  if (
    mime.includes('javascript') ||
    mime.includes('json') ||
    mime.includes('typescript') ||
    mime.includes('html') ||
    mime.includes('css') ||
    ['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'scss', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'php', 'sql', 'yaml', 'yml', 'md', 'xml', 'sh'].includes(ext)
  ) {
    return 'code';
  }
  return 'other';
}

export function generateSecureToken(length: number = 24): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      token += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}

export async function calculateFileChecksum(file: File): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const buffer = await file.slice(0, 1024 * 1024 * 2).arrayBuffer(); // hash first 2MB or full for quick integrity
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  return `${file.size}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}-${file.lastModified}`;
}
