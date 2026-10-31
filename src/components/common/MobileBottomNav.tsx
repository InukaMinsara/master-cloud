import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HardDrive,
  Clock,
  Star,
  PieChart,
  Plus,
  Camera,
  Upload,
  FolderPlus,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useUploadStore } from '@/stores/uploadStore';
import { useFileStore } from '@/stores/fileStore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown';

export function MobileBottomNav() {
  const navigate = useNavigate();
  const { setNewFolderModalOpen } = useUIStore();
  const { addFiles } = useUploadStore();
  const { currentFolderId } = useFileStore();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files, currentFolderId);
    }
  };

  const navTabs = [
    { label: 'Drive', path: '/drive', icon: HardDrive },
    { label: 'Recent', path: '/recent', icon: Clock },
    { label: 'Starred', path: '/starred', icon: Star },
    { label: '10 TB', path: '/storage', icon: PieChart },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/80 px-3 py-2 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-around relative">
        {/* Tab 1: Drive */}
        <NavLink
          to="/drive"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-primary/15' : ''}`}>
                <HardDrive className="h-5 w-5" />
              </div>
              <span className="text-[11px] tracking-tight">Drive</span>
            </>
          )}
        </NavLink>

        {/* Tab 2: Recent */}
        <NavLink
          to="/recent"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-primary/15' : ''}`}>
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-[11px] tracking-tight">Recent</span>
            </>
          )}
        </NavLink>

        {/* Central Mobile Action Button (FAB) */}
        <div className="relative -top-5">
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full shadow-lg shadow-blue-600/30 ring-4 ring-background focus:outline-none">
              <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center active:scale-95 transition-transform">
                <Plus className="h-6 w-6" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56 mb-2">
              <DropdownMenuItem onClick={() => setNewFolderModalOpen(true)} className="gap-2.5 py-2.5">
                <FolderPlus className="h-4 w-4 text-blue-500" />
                <span className="font-medium">New folder</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2.5 py-2.5">
                <Upload className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">Upload file / photo</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => cameraInputRef.current?.click()} className="gap-2.5 py-2.5">
                <Camera className="h-4 w-4 text-violet-500" />
                <span className="font-medium">Take photo / video</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/mobile-drive')} className="gap-2.5 py-2.5 border-t border-border/60">
                <HardDrive className="h-4 w-4 text-cyan-500" />
                <span className="font-medium text-cyan-500">10 TB Phone Drive Companion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileUpload}
          />
          <input
            type="file"
            ref={cameraInputRef}
            className="hidden"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleFileUpload}
          />
        </div>

        {/* Tab 3: Starred */}
        <NavLink
          to="/starred"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-primary/15' : ''}`}>
                <Star className="h-5 w-5" />
              </div>
              <span className="text-[11px] tracking-tight">Starred</span>
            </>
          )}
        </NavLink>

        {/* Tab 4: 10 TB Storage */}
        <NavLink
          to="/storage"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-primary/15' : ''}`}>
                <PieChart className="h-5 w-5" />
              </div>
              <span className="text-[11px] tracking-tight">10 TB</span>
            </>
          )}
        </NavLink>
      </div>
    </div>
  );
}
