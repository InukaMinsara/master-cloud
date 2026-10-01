import JSZip from 'jszip';
import { FileItem, FolderItem } from '@/types/file';
import { binaryStorage } from './localDb';

export class DownloadService {
  /**
   * Triggers browser download for a single FileItem or Blob
   */
  static async downloadSingleFile(file: FileItem): Promise<void> {
    try {
      let blob: Blob | null = null;

      // 1. Try local binary store
      if (file.storage_path) {
        blob = await binaryStorage.getBlob(file.storage_path);
      }

      // 2. Fallback to dummy realistic content if seed binary not populated yet
      if (!blob) {
        blob = this.generateSampleBlob(file);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Download single file failed:', err);
      throw err;
    }
  }

  /**
   * Bundles multiple files into a clean ZIP archive and triggers download
   */
  static async downloadMultipleFiles(files: FileItem[], zipName: string = 'master-cloud-download.zip'): Promise<void> {
    const zip = new JSZip();

    for (const file of files) {
      let blob = await binaryStorage.getBlob(file.storage_path);
      if (!blob) {
        blob = this.generateSampleBlob(file);
      }
      zip.file(file.name, blob);
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /**
   * Downloads an entire folder hierarchy packaged into a ZIP
   */
  static async downloadFolder(
    folder: FolderItem,
    allFiles: FileItem[],
    allFolders: FolderItem[]
  ): Promise<void> {
    const zip = new JSZip();

    // Helper recursive packer
    const packFolder = async (currentFolderId: string, currentZipFolder: JSZip) => {
      // Add files in this folder
      const folderFiles = allFiles.filter(f => f.parent_folder_id === currentFolderId && !f.deleted_at);
      for (const file of folderFiles) {
        let blob = await binaryStorage.getBlob(file.storage_path);
        if (!blob) {
          blob = this.generateSampleBlob(file);
        }
        currentZipFolder.file(file.name, blob);
      }

      // Add child folders
      const childFolders = allFolders.filter(f => f.parent_folder_id === currentFolderId && !f.deleted_at);
      for (const sub of childFolders) {
        const subZip = currentZipFolder.folder(sub.name);
        if (subZip) {
          await packFolder(sub.id, subZip);
        }
      }
    };

    const rootFolderInZip = zip.folder(folder.name) || zip;
    await packFolder(folder.id, rootFolderInZip);

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folder.name}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  private static generateSampleBlob(file: FileItem): Blob {
    if (file.extension === 'txt' || file.extension === 'yaml' || file.extension === 'json') {
      return new Blob([`# ${file.name}\nGenerated from MASTER CLOUD storage platform.\nFile ID: ${file.id}\nSize: ${file.size_bytes} bytes\nTimestamp: ${new Date().toISOString()}`], { type: file.mime_type });
    }
    // Generic binary payload representation
    const sample = new Uint8Array(Math.min(file.size_bytes || 1024, 64 * 1024));
    return new Blob([sample], { type: file.mime_type });
  }
}
