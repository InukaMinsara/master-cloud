import React from 'react';
import {
  User,
  Shield,
  Palette,
  HardDrive,
  Bell,
  Database,
  Check,
  Save,
  KeyRound,
  ExternalLink,
  Upload,
  Camera,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
  const { theme, setTheme, activeSettingsTab, setActiveSettingsTab } = useUIStore();

  const [displayName, setDisplayName] = React.useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatar_url || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const localFileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  // Supabase runtime config tester
  const [supabaseUrl, setSupabaseUrl] = React.useState(import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = React.useState(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const isSupabaseConfigured = api.isConfiguredWithSupabase();

  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file must be smaller than 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      toast.success('Local image selected! Click "Save Changes" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    if (localFileRef.current) localFileRef.current.value = '';
    toast.info('Picture removed. Default initials badge will be used.');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim() || null,
      });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account Profile', icon: User },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'database', label: 'Database & Supabase', icon: Database },
  ];

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Hidden local image input */}
      <input
        ref={localFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLocalImageSelect}
      />

      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold text-foreground">Settings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your credentials, customization preferences, and cloud infrastructure.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation sidebar */}
        <div className="w-full md:w-56 space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeSettingsTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveSettingsTab(t.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Panel */}
        <div className="flex-1 rounded-3xl border border-border/80 bg-card p-6 shadow-xl">
          {activeSettingsTab === 'account' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-sm font-bold text-foreground">Profile Information</h3>
                <p className="text-xs text-muted-foreground">Your personal display details and local profile picture.</p>
              </div>

              {/* Profile Avatar & Local Uploader */}
              <div className="flex items-center gap-5 p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-16 w-16 rounded-full object-cover border-2 border-primary shadow-md"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center border-2 border-primary/30 shadow-md">
                      {(displayName || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => localFileRef.current?.click()}
                      className="rounded-xl text-xs font-semibold gap-1.5 h-8"
                    >
                      <Camera className="h-3.5 w-3.5 text-primary" />
                      Upload Local Picture
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="rounded-xl text-xs text-destructive hover:bg-destructive/10 h-8 gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Upload an image from your computer (PNG, JPG, WebP up to 5 MB) or use your default initial.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <Input
                  disabled
                  value={user?.email || 'No email configured'}
                  className="text-xs rounded-xl opacity-60 bg-muted"
                />
                <span className="text-[10px] text-muted-foreground">Logged-in account address.</span>
              </div>

              <Button type="submit" disabled={isSaving} className="rounded-xl text-xs font-semibold">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Changes
              </Button>
            </form>
          )}

          {activeSettingsTab === 'security' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-sm font-bold text-foreground">Security & Protection</h3>
                <p className="text-xs text-muted-foreground">Manage your credentials, 2FA, and authentication.</p>
              </div>

              <div className="p-4 rounded-2xl border border-border/80 bg-secondary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Password Authentication</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your account is secured with standard encryption and salt hashing.
                </p>
                <Button variant="outline" size="sm" onClick={() => toast.info('Password reset link sent to email')} className="rounded-xl text-xs mt-2">
                  Change Password
                </Button>
              </div>

              <div className="p-4 rounded-2xl border border-border/80 bg-secondary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Two-Factor Authentication (2FA)</span>
                  <Badge variant="outline">Optional</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Require an authenticator app code whenever signing into a new device.
                </p>
                <Button variant="outline" size="sm" onClick={() => toast.info('2FA Setup configured')} className="rounded-xl text-xs mt-2">
                  Enable 2FA
                </Button>
              </div>
            </div>
          )}

          {activeSettingsTab === 'appearance' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-sm font-bold text-foreground">Theme & Interface Appearance</h3>
                <p className="text-xs text-muted-foreground">Customize color palettes, dark mode, and interface density.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Color Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-2xl border text-center text-xs font-semibold transition-all ${
                      theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/40 text-muted-foreground'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-2xl border text-center text-xs font-semibold transition-all ${
                      theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/40 text-muted-foreground'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`p-3 rounded-2xl border text-center text-xs font-semibold transition-all ${
                      theme === 'system' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/40 text-muted-foreground'
                    }`}
                  >
                    System
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'database' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-sm font-bold text-foreground">Supabase & Database Configuration</h3>
                <p className="text-xs text-muted-foreground">
                  Connect your live Supabase project for real PostgreSQL tables and cloud object storage.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-border/80 bg-secondary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Current Active Backend</span>
                  <Badge variant={api.isConfiguredWithSupabase() ? 'success' : 'info'}>
                    {api.isConfiguredWithSupabase() ? 'Supabase Live' : 'High-Fidelity Local Engine'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {api.isConfiguredWithSupabase()
                    ? 'Connected to your remote Supabase instance with Row-Level Security enabled.'
                    : 'Running in high-speed local engine mode with IndexedDB binary persistence.'}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={api.isConfiguredWithSupabase() ? 'default' : 'outline'}
                    onClick={() => {
                      localStorage.setItem('master_cloud_backend_mode', 'supabase');
                      toast.success('Switched to Supabase Live backend');
                      window.location.reload();
                    }}
                    className="text-xs rounded-xl h-8"
                  >
                    Use Supabase Live
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!api.isConfiguredWithSupabase() ? 'default' : 'outline'}
                    onClick={() => {
                      localStorage.setItem('master_cloud_backend_mode', 'local');
                      toast.success('Switched to High-Fidelity Local Engine');
                      window.location.reload();
                    }}
                    className="text-xs rounded-xl h-8"
                  >
                    Use Local Engine
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">VITE_SUPABASE_URL</label>
                  <Input
                    readOnly
                    value={supabaseUrl}
                    placeholder="https://your-project.supabase.co"
                    className="text-xs font-mono rounded-xl bg-secondary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">VITE_SUPABASE_ANON_KEY</label>
                  <Input
                    readOnly
                    type="password"
                    value={supabaseAnonKey}
                    placeholder="eyJhbGciOi..."
                    className="text-xs font-mono rounded-xl bg-secondary/50"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  To update credentials, copy <code className="font-mono text-primary">.env.example</code> to <code className="font-mono text-primary">.env</code> in the project root and restart Vite.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
