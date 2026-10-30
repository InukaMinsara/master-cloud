import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2,
  Film,
  PieChart,
  Plus,
  FolderPlus,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useUploadStore } from '@/stores/uploadStore';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { UserAvatar } from '@/components/common/UserAvatar';

export function Sidebar() {
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, setNewFolderModalOpen } = useUIStore();
  const { addFiles } = useUploadStore();
  const { currentFolderId } = useFileStore();
  const { user } = useAuthStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  const [storageBreakdown, setStorageBreakdown] = React.useState(() => api.getStorageBreakdown());

  React.useEffect(() => {
    const updateStats = () => setStorageBreakdown(api.getStorageBreakdown());
    window.addEventListener('mc_storage_updated', updateStats);
    const interval = setInterval(updateStats, 3000);
    return () => {
      window.removeEventListener('mc_storage_updated', updateStats);
      clearInterval(interval);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files, currentFolderId);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Drive', path: '/drive', icon: HardDrive },
    { label: 'Shared with me', path: '/shared', icon: Users },
    { label: 'Recent', path: '/recent', icon: Clock },
    { label: 'Starred', path: '/starred', icon: Star },
    { label: 'Media Library', path: '/media', icon: Film },
    { label: 'Storage Analytics', path: '/storage', icon: PieChart },
    { label: 'Trash', path: '/trash', icon: Trash2 },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-all duration-300 select-none z-20 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/60">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <img src="/logo-icon.svg" alt="Master Cloud" className="h-9 w-9 shrink-0 drop-shadow" />
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                MASTER CLOUD
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
                Enterprise Cloud
              </span>
            </div>
          )}
        </NavLink>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Action "+ New" Button */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <Button
              variant="gradient"
              className={`w-full justify-center shadow-blue-500/20 ${
                sidebarCollapsed ? 'px-0 h-10 w-10 mx-auto rounded-xl' : 'h-11 gap-2 rounded-xl text-sm font-semibold'
              }`}
            >
              <Plus className="h-5 w-5" />
              {!sidebarCollapsed && <span>New Item</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="left" className="w-56">
            <DropdownMenuItem onClick={() => setNewFolderModalOpen(true)}>
              <FolderPlus className="h-4 w-4 text-primary" />
              <span>New folder</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 text-emerald-500" />
              <span>Upload files</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => folderInputRef.current?.click()}>
              <HardDrive className="h-4 w-4 text-amber-500" />
              <span>Upload folder</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hidden native file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileUpload}
        />
        <input
          type="file"
          ref={folderInputRef}
          className="hidden"
          {...({ webkitdirectory: '', directory: '' } as any)}
          onChange={handleFileUpload}
        />
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>{item.label}</span>
                  {(item as any).badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                      {(item as any).badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Storage Quota Footer Widget */}
      {!sidebarCollapsed && (
        <div className="p-3 m-3 rounded-2xl bg-secondary/50 border border-border/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Storage</span>
            <span className="text-muted-foreground">{storageBreakdown.percentageUsed}% used</span>
          </div>
          <Progress value={storageBreakdown.percentageUsed} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground">
            {formatBytes(storageBreakdown.usedStorage)} of {formatBytes(storageBreakdown.totalQuota)}
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
            <NavLink
              to="/storage"
              className="font-semibold text-primary hover:underline"
            >
              Analytics
            </NavLink>
            <a
              href="mastercloud://open-drive"
              onClick={() => {
                toast.info('Opening MASTER CLOUD (Z:) in File Explorer...', {
                  description: 'Ensure Master Cloud for Windows is installed.',
                  action: {
                    label: 'Get App',
                    onClick: () => navigate('/download'),
                  },
                });
              }}
              className="inline-flex items-center gap-1 font-semibold text-emerald-500 hover:text-emerald-400 hover:underline cursor-pointer"
              title="Open Virtual Drive in File Explorer"
            >
              <HardDrive className="h-3 w-3" />
              <span>Open Z:</span>
            </a>
          </div>
        </div>
      )}

      {/* User Profile Mini Bar */}
      {!sidebarCollapsed && user && (
        <div className="px-3 pb-3">
          <NavLink
            to="/settings"
            className="flex items-center gap-2.5 p-2 rounded-2xl bg-secondary/40 hover:bg-secondary/70 border border-border/50 transition-colors group"
            title="Open Account Settings"
          >
            <UserAvatar user={user} size="sm" className="border border-primary/30" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {user.display_name || user.email?.split('@')[0] || 'User'}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {user.email || 'Google Account'}
              </span>
            </div>
          </NavLink>
        </div>
      )}
    </aside>
  );
}
