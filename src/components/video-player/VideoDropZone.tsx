import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileVideo, Music, Disc3 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoDropZoneProps {
  onFileSelect: (file: File) => void;
}

const ACCEPTED_MEDIA_TYPES =
  'video/*,audio/*,.mp4,.webm,.mov,.avi,.mkv,.ogg,.ogv,.m4v,.3gp,.flv,.wmv,.ts,.m2ts,.mp3,.wav,.flac,.aac,.m4a,.opus,.wma,.alac,.aiff';

function isMediaFile(file: File): boolean {
  if (file.type.startsWith('video/') || file.type.startsWith('audio/')) return true;

  const ext = file.name.split('.').pop()?.toLowerCase();
  const mediaExtensions = [
    'mp4', 'webm', 'mov', 'avi', 'mkv', 'ogg', 'ogv',
    'm4v', '3gp', 'flv', 'wmv', 'ts', 'm2ts',
    'mp3', 'wav', 'flac', 'aac', 'm4a', 'opus', 'wma', 'alac', 'aiff',
  ];
  return !!ext && mediaExtensions.includes(ext);
}

export function VideoDropZone({ onFileSelect }: VideoDropZoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleFile = useCallback(
    (file: File) => {
      if (!isMediaFile(file)) {
        toast.error('Invalid media file type', {
          description: `"${file.name}" is not a supported video or audio file.`,
        });
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDraggingOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      // Reset so the same file can be selected again
      e.target.value = '';
    },
    [handleFile],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-4
        w-full min-h-[320px] rounded-2xl cursor-pointer
        transition-all duration-300 ease-in-out
        outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60
        ${
          isDraggingOver
            ? 'border-2 border-cyan-400 bg-cyan-500/10 shadow-[inset_0_0_40px_rgba(6,182,212,0.08),0_0_24px_rgba(6,182,212,0.12)]'
            : 'border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        }
      `}
    >
      {/* Icon */}
      <div
        className={`
          flex items-center justify-center w-16 h-16 rounded-2xl
          transition-all duration-300
          ${
            isDraggingOver
              ? 'bg-cyan-500/20 text-cyan-300 scale-110 shadow-lg shadow-cyan-500/20 border border-cyan-400/40'
              : 'bg-white/5 text-white/50 border border-white/10'
          }
        `}
      >
        {isDraggingOver ? (
          <Disc3 className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
        ) : (
          <div className="flex items-center gap-1">
            <FileVideo className="w-5 h-5 text-cyan-400" />
            <Music className="w-5 h-5 text-purple-400" />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p
          className={`
            text-base font-medium transition-colors duration-300
            ${isDraggingOver ? 'text-cyan-300' : 'text-white/80'}
          `}
        >
          {isDraggingOver ? 'Drop your video or audio file here' : 'Drag and drop any video or audio file here'}
        </p>
        <p className="text-xs text-white/40">
          Supports MP4, WebM, MKV, MP3, WAV, FLAC, AAC, M4A & more
        </p>
        <p className="text-xs text-white/30 mt-1">
          or{' '}
          <span className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-medium">
            click to browse files
          </span>
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_MEDIA_TYPES}
        onChange={handleInputChange}
        className="hidden"
        tabIndex={-1}
      />
    </div>
  );
}
