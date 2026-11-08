import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileVideo } from 'lucide-react';
import { toast } from 'sonner';

interface VideoDropZoneProps {
  onFileSelect: (file: File) => void;
}

const ACCEPTED_VIDEO_TYPES = 'video/*,.mp4,.webm,.mov,.avi,.mkv,.ogg,.ogv,.m4v,.3gp,.flv,.wmv,.ts,.m2ts';

function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true;

  const ext = file.name.split('.').pop()?.toLowerCase();
  const videoExtensions = [
    'mp4', 'webm', 'mov', 'avi', 'mkv', 'ogg', 'ogv',
    'm4v', '3gp', 'flv', 'wmv', 'ts', 'm2ts',
  ];
  return !!ext && videoExtensions.includes(ext);
}

export function VideoDropZone({ onFileSelect }: VideoDropZoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleFile = useCallback(
    (file: File) => {
      if (!isVideoFile(file)) {
        toast.error('Invalid file type', {
          description: `"${file.name}" is not a supported video file.`,
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
          flex items-center justify-center w-16 h-16 rounded-xl
          transition-all duration-300
          ${
            isDraggingOver
              ? 'bg-cyan-500/15 text-cyan-400 scale-110'
              : 'bg-white/5 text-white/40'
          }
        `}
      >
        {isDraggingOver ? (
          <FileVideo className="w-8 h-8" />
        ) : (
          <Upload className="w-8 h-8" />
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p
          className={`
            text-base font-medium transition-colors duration-300
            ${isDraggingOver ? 'text-cyan-300' : 'text-white/60'}
          `}
        >
          {isDraggingOver ? 'Drop your video here' : 'Drag and drop a video file here'}
        </p>
        <p className="text-sm text-white/30">
          or{' '}
          <span className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            click to browse
          </span>
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_VIDEO_TYPES}
        onChange={handleInputChange}
        className="hidden"
        tabIndex={-1}
      />
    </div>
  );
}
