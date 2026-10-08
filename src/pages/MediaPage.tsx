import React from 'react';
import { Film, Image as ImageIcon, Video, Music, Play, Upload } from 'lucide-react';
import { api } from '@/services/api';
import { TelegramCloudService } from '@/services/telegramCloudService';
import { FileItem } from '@/types/file';
import { usePreviewStore } from '@/stores/previewStore';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useFileStore } from '@/stores/fileStore';
import { useUploadStore } from '@/stores/uploadStore';
import { formatBytes, getFileCategory } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function MediaCard({ file, allFiles }: { file: FileItem; allFiles: FileItem[] }) {
  const { openPreview } = usePreviewStore();
  const { openContextMenu } = useContextMenuStore();
  const [thumbUrl, setThumbUrl] = React.useState<string | null>(null);
  const cat = getFileCategory(file.mime_type, file.extension);

  React.useEffect(() => {
    let active = true;
    let localBlobUrl: string | null = null;

    const loadThumb = async () => {
      // 1. Z-drive direct stream
      if (file.storage_path?.startsWith('zdrive:')) {
        const rel = file.storage_path.slice('zdrive:'.length);
        if (active) setThumbUrl(`/api/local-drive/read?path=${encodeURIComponent(rel)}`);
        return;
      }

      // 2. Telegram Cloud direct stream if single chunk
      if (file.storage_path?.startsWith('tgcloud:')) {
        const direct = TelegramCloudService.getDirectStreamUrl(file.storage_path);
        if (direct) {
          if (active) setThumbUrl(direct);
          return;
        }
      }

      // 3. Cached or dynamically generated Blob
      try {
        const blob = await api.getFileBlob(file.storage_path);
        if (blob && active) {
          localBlobUrl = URL.createObjectURL(blob);
          setThumbUrl(localBlobUrl);
        }
      } catch {}
    };

    loadThumb();

    return () => {
      active = false;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [file.id, file.storage_path]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'file',
      targetFile: file,
    });
  };

  return (
    <div
      onClick={() => openPreview(file, allFiles)}
      onContextMenu={handleContextMenu}
      className="group relative rounded-2xl border border-border/80 bg-card overflow-hidden hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none"
    >
      <div className="aspect-square bg-secondary/40 flex items-center justify-center relative overflow-hidden">
        {cat === 'image' ? (
          thumbUrl ? (
            <img
              src={thumbUrl}
              alt={file.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
              <ImageIcon className="h-8 w-8 text-blue-500/80 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{file.extension}</span>
            </div>
          )
        ) : cat === 'video' ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black/40">
            {thumbUrl && (
              <video
                src={thumbUrl}
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-2">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm shadow-md">
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Video</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Music className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Audio</span>
          </div>
        )}

        {/* Hover overlay button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-xs font-semibold text-white bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg">
            Quick Preview
          </span>
        </div>
      </div>

      <div className="p-2.5">
        <h4 className="text-xs font-semibold text-foreground truncate" title={file.name}>
          {file.name}
        </h4>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
          <span>{formatBytes(file.size_bytes)}</span>
          <span className="uppercase font-mono">{file.extension}</span>
        </div>
      </div>
    </div>
  );
}

export function MediaPage() {
  const [mediaType, setMediaType] = React.useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [files, setFiles] = React.useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { openContextMenu } = useContextMenuStore();
  const { files: storeFiles } = useFileStore();
  const { addFiles } = useUploadStore();
  const uploadInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setIsLoading(true);
    api.getMediaFiles(mediaType)
      .then(setFiles)
      .finally(() => setIsLoading(false));
  }, [mediaType, storeFiles]);

  const handleEmptyContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'empty',
    });
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files, null);
    }
  };

  return (
    <div
      onContextMenu={handleEmptyContextMenu}
      className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold text-foreground">Media Library</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dedicated photo gallery, video streaming, and audio workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Media filter tabs */}
          <div className="flex items-center rounded-2xl border border-border bg-secondary/50 p-1">
            <button
              onClick={() => setMediaType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mediaType === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Media
            </button>
            <button
              onClick={() => setMediaType('image')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mediaType === 'image' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5 text-blue-500" /> Photos
            </button>
            <button
              onClick={() => setMediaType('video')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mediaType === 'video' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Video className="h-3.5 w-3.5 text-purple-500" /> Videos
            </button>
            <button
              onClick={() => setMediaType('audio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mediaType === 'audio' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Music className="h-3.5 w-3.5 text-rose-500" /> Audio
            </button>
          </div>

          {/* Upload media button */}
          <Button
            onClick={() => uploadInputRef.current?.click()}
            variant="gradient"
            size="sm"
            className="rounded-xl h-9 gap-1.5 text-xs font-semibold shadow-blue-500/10 shrink-0"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Media</span>
          </Button>

          <input
            type="file"
            ref={uploadInputRef}
            className="hidden"
            accept="image/*,video/*,audio/*"
            multiple
            onChange={handleMediaUpload}
          />
        </div>
      </div>

      {files.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1 my-16 text-center">
          <div className="h-16 w-16 rounded-3xl bg-secondary/80 flex items-center justify-center text-muted-foreground mb-3">
            <Film className="h-8 w-8 text-purple-500" />
          </div>
          <h3 className="text-base font-bold text-foreground">No media assets found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Upload images, video clips, or audio tracks to view them in your media hub.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {files.map((file) => (
            <MediaCard key={file.id} file={file} allFiles={files} />
          ))}
        </div>
      )}
    </div>
  );
}
