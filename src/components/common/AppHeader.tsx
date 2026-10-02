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
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { api } from '@/services/api';
import { NotificationRecord } from '@/types/database';
import { formatDateRelative } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function AppHeader() {
  const navigate = useNavigate();
  const { theme, setTheme, setCommandPaletteOpen, setSmartCleanupModalOpen } = useUIStore();
  const { searchQuery, setSearchQuery, categoryFilter, setCategoryFilter } = useFileStore();
  const { user, logout } = useAuthStore();

  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const isSupabase = api.isConfiguredWithSupabase();

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
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files, folders, extensions, and tags..."
            className="pl-10 pr-24 h-10 w-full rounded-2xl bg-secondary/60 focus:bg-background border-border/60 transition-all text-sm"
          />
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm hover:bg-accent"
          >
            <Command className="h-3 w-3" />
            <span>K</span>
          </button>
        </div>

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
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user?.display_name || 'User'}
                  className="h-9 w-9 rounded-full object-cover border border-border shadow-sm"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-border shadow-sm">
                  {(user?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
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
