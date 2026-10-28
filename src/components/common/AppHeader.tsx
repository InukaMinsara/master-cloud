import React from 'react';
import {
  Search,
  Command,
  Sun,
  Moon,
  Laptop,
  Bell,
  CheckCheck,
  LogOut,
  User,
  SlidersHorizontal,
  Cloud,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  X,
  Folder,
  File,
  Film,
  Image as ImageIcon,
  Music,
  FileText,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { usePreviewStore } from '@/stores/previewStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { api } from '@/services/api';
import { NotificationRecord } from '@/types/database';
import { FileItem, FolderItem } from '@/types/file';
import { formatDateRelative, formatBytes, getFileCategory } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '@/components/common/UserAvatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function AppHeader() {
  const navigate = useNavigate();
  const { theme, setTheme, setCommandPaletteOpen, setSmartCleanupModalOpen } = useUIStore();
  const { searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, setCurrentFolderId } = useFileStore();
  const { openPreview } = usePreviewStore();
  const { user, logout } = useAuthStore();

  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const isSupabase = api.isConfiguredWithSupabase();

  const [searchResults, setSearchResults] = React.useState<{ files: FileItem[]; folders: FolderItem[] }>({ files: [], folders: [] });
  const [isSearching, setIsSearching] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // Real-time search across entire account when query or categoryFilter changes
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ files: [], folders: [] });
      setIsDropdownOpen(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    setIsDropdownOpen(true);

    const timer = setTimeout(() => {
      api.search(searchQuery, categoryFilter)
        .then((res) => {
          if (active) {
            setSearchResults(res);
            setIsSearching(false);
          }
        })
        .catch(() => {
          if (active) setIsSearching(false);
        });
    }, 40);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, categoryFilter]);

  // Click outside to close search dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsDropdownOpen(false);
    navigate('/drive');
  };

  const handleSelectFile = (file: FileItem) => {
    setIsDropdownOpen(false);
    openPreview(file, searchResults.files);
  };

  const handleSelectFolder = (folder: FolderItem) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    setCurrentFolderId(folder.id);
    navigate('/drive');
  };

  const fetchNotifs = React.useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // Ignored
    }
  }, []);

  React.useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    fetchNotifs();
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const handleConnectZDrive = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!user?.email) return;
    const cleanEmail = user.email.trim().toLowerCase();
    let token = user.id;
    let accessToken = '';
    try {
      const sess = (await supabase.auth.getSession()).data.session;
      if (sess?.access_token) accessToken = sess.access_token;
    } catch {}

    // 1. Direct background user switch for local daemon
    try {
      fetch('http://127.0.0.1:8766/api/user/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: cleanEmail, accessToken, id: token }),
      }).catch(() => {});
    } catch {}

    // 2. Deep link protocol activation
    const deepLink = `mastercloud://auth?email=${encodeURIComponent(cleanEmail)}&token=${encodeURIComponent(token)}&accessToken=${encodeURIComponent(accessToken)}`;
    window.location.href = deepLink;
    toast.success('Connecting local Z: Drive...', {
      description: `MASTER CLOUD (Z:) connected to ${cleanEmail}`,
    });
  };

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'image', label: 'Images' },
    { id: 'video', label: 'Videos' },
    { id: 'document', label: 'Documents' },
    { id: 'audio', label: 'Audio' },
    { id: 'code', label: 'Code' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/75 backdrop-blur-xl px-4 lg:px-6">
      {/* Search Input & Command trigger */}
      <div ref={searchContainerRef} className="relative flex items-center gap-3 flex-1 max-w-2xl">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsDropdownOpen(false);
              if (e.key === 'Enter') handleSearchSubmit();
            }}
            placeholder="Search files, folders, extensions, and tags..."
            className="pl-10 pr-24 h-10 w-full rounded-2xl bg-secondary/60 focus:bg-background border-border/60 transition-all text-sm"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsDropdownOpen(false);
                }}
                className="h-5 w-5 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm hover:bg-accent"
            >
              <Command className="h-3 w-3" />
              <span>K</span>
            </button>
          </div>
        </form>

        {/* Category Filter Dropdown / Quick filter */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1.5 rounded-xl h-9">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="capitalize">{categoryFilter}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="left" className="w-40">
            {categories.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={categoryFilter === c.id ? 'bg-primary/10 text-primary font-semibold' : ''}
              >
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ─── Instant Google Drive-style Search Results Dropdown ─── */}
        {isDropdownOpen && searchQuery.trim() && (
          <div className="absolute top-12 left-0 right-0 z-50 rounded-2xl border border-border/80 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden max-h-[70vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="p-3 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground bg-secondary/30">
              <span className="font-medium">
                {isSearching ? 'Searching...' : `Found ${searchResults.folders.length + searchResults.files.length} results`}
              </span>
              <button
                type="button"
                onClick={() => handleSearchSubmit()}
                className="text-primary hover:underline flex items-center gap-1 text-[11px] font-semibold"
              >
                View all in Drive <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-border/40">
              {/* Folders */}
              {searchResults.folders.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Folders ({searchResults.folders.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {searchResults.folders.slice(0, 5).map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => handleSelectFolder(folder)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-accent/70 cursor-pointer transition-colors group"
                      >
                        <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                          <Folder className="h-4 w-4 fill-current" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary">
                            {folder.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Folder</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {searchResults.files.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Files ({searchResults.files.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {searchResults.files.slice(0, 10).map((file) => {
                      const cat = getFileCategory(file.mime_type, file.extension);
                      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                      const thumbSrc = isLocal && (cat === 'video' || cat === 'image')
                        ? `/api/local-drive/thumbnail?name=${encodeURIComponent(file.name)}&path=${encodeURIComponent(file.storage_path || '')}`
                        : null;

                      return (
                        <div
                          key={file.id}
                          onClick={() => handleSelectFile(file)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent/70 cursor-pointer transition-colors group"
                        >
                          <div className="h-9 w-9 rounded-lg bg-secondary/80 border border-border/50 flex items-center justify-center shrink-0 overflow-hidden relative">
                            {thumbSrc ? (
                              <img
                                src={thumbSrc}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : null}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              {cat === 'image' ? (
                                <ImageIcon className="h-4 w-4 text-blue-500" />
                              ) : cat === 'video' ? (
                                <Film className="h-4 w-4 text-red-500" />
                              ) : cat === 'audio' ? (
                                <Music className="h-4 w-4 text-rose-500" />
                              ) : (
                                <FileText className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary">
                              {file.name}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              <span className="font-mono uppercase font-semibold">{file.extension}</span>
                              <span>•</span>
                              <span>{formatBytes(file.size_bytes)}</span>
                            </div>
                          </div>

                          <div className="text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            Preview
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No results */}
              {!isSearching && searchResults.files.length === 0 && searchResults.folders.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-foreground">No matching files or folders</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Try another keyword or extension</p>
                </div>
              )}
            </div>

            {/* Dropdown Footer */}
            <div
              onClick={() => handleSearchSubmit()}
              className="p-2.5 bg-secondary/40 hover:bg-primary/10 border-t border-border/60 text-center cursor-pointer transition-colors text-xs font-semibold text-primary flex items-center justify-center gap-1.5"
            >
              <span>See all results in My Drive</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 ml-4">
        {/* Backend Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/80 bg-secondary/50 text-[11px]">
          {isSupabase ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-muted-foreground">Supabase Live</span>
            </>
          ) : (
            <>
              <Cloud className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-muted-foreground">High-Speed Local Engine</span>
            </>
          )}
        </div>

        {/* Smart Storage Optimizer Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSmartCleanupModalOpen(true)}
          className="hidden lg:flex items-center gap-1.5 rounded-xl border-border/80 h-9 text-xs"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cleanup</span>
        </Button>

        {/* Connect Z: Virtual Drive Button */}
        {user?.email && (
          <button
            onClick={handleConnectZDrive}
            title="Connect local Windows Explorer Z: Drive directly to this account"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition-all shadow-sm shadow-blue-500/5 cursor-pointer"
          >
            <HardDrive className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Connect Z: Drive</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="relative rounded-xl h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="right" className="w-80 p-2">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60 px-2">
              <span className="text-xs font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">No notifications yet</div>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => api.markNotificationRead(n.id).then(fetchNotifs)}
                    className={`p-2.5 rounded-xl text-left cursor-pointer transition-colors ${
                      n.is_read ? 'hover:bg-accent/60 opacity-80' : 'bg-primary/5 hover:bg-primary/10 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{n.title}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDateRelative(n.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : theme === 'light' ? <Sun className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="right" className="w-36">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="h-4 w-4 mr-2" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="h-4 w-4 mr-2" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Laptop className="h-4 w-4 mr-2" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="flex items-center gap-2 rounded-full ring-2 ring-transparent hover:ring-primary/40 transition-all focus:outline-none">
              <UserAvatar user={user} size="md" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="right" className="w-56 p-2">
            <div className="px-2 py-1.5 border-b border-border/60 mb-1">
              <p className="text-xs font-bold text-foreground truncate">{user?.display_name || user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email || ''}</p>
              <Badge variant="success" className="mt-1 text-[10px] py-0 px-2">
                {user?.role === 'admin' ? 'Administrator' : 'Standard Member'}
              </Badge>
            </div>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="h-4 w-4 mr-2" /> Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/storage')}>
              <Cloud className="h-4 w-4 mr-2" /> Storage Quota (10 TB)
            </DropdownMenuItem>
            {user?.email && (
              <DropdownMenuItem onClick={handleConnectZDrive}>
                <HardDrive className="h-4 w-4 mr-2 text-blue-400" /> Connect Local Z: Drive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} destructive>
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
