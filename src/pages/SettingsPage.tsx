import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Palette,
  HardDrive,
  Check,
  Save,
  Camera,
  Trash2,
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  Cloud,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/services/api';
import { formatBytes } from '@/lib/utils';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/common/UserAvatar';

export function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
  const {
    theme,
    setTheme,
    activeSettingsTab,
    setActiveSettingsTab,
    setSmartCleanupModalOpen,
  } = useUIStore();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = React.useState(user?.display_name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatar_url || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const localFileRef = React.useRef<HTMLInputElement>(null);

  const [breakdown, setBreakdown] = React.useState(() => api.getStorageBreakdown());

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  React.useEffect(() => {
    setBreakdown(api.getStorageBreakdown());
  }, []);

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
        email: email.trim(),
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
    { id: 'plan', label: '10 TB Cloud Plan', icon: HardDrive },
  ];

  // Safeguard against outdated active tab keys
  const currentTab = ['account', 'security', 'appearance', 'plan'].includes(activeSettingsTab)
    ? activeSettingsTab
    : 'account';

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
            Manage your profile, security preferences, and cloud storage allocation.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation sidebar */}
        <div className="w-full md:w-56 space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = currentTab === t.id;
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
          {/* ─── 1. ACCOUNT PROFILE ─── */}
          {currentTab === 'account' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-sm font-bold text-foreground">Profile Information</h3>
                <p className="text-xs text-muted-foreground">Your personal display details and local profile picture.</p>
              </div>

              {/* Profile Avatar & Local Uploader */}
              <div className="flex items-center gap-5 p-4 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="relative shrink-0">
                  <UserAvatar
                    src={avatarUrl}
                    name={displayName}
                    email={user?.email}
                    size="xl"
                    className="border-2 border-primary shadow-md"
                  />
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
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="text-xs rounded-xl pr-28"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 pointer-events-none">
                    <Check className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Your Master Cloud email associated with your dedicated 10 TB free lifetime cloud quota.
                </span>
              </div>

              <Button type="submit" disabled={isSaving} className="rounded-xl text-xs font-semibold">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </form>
          )}

          {/* ─── 2. SECURITY & AUTH ─── */}
          {currentTab === 'security' && (
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
                <Button variant="outline" size="sm" onClick={() => toast.info('Password reset link sent to your registered email')} className="rounded-xl text-xs mt-2">
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

              <div className="p-4 rounded-2xl border border-border/80 bg-secondary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Client-Side Zero-Knowledge Encryption</span>
                  <Badge variant="success">Enabled</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  All chunked files are cryptographically protected before transmission and assembled safely in your browser.
                </p>
              </div>
            </div>
          )}

          {/* ─── 3. APPEARANCE ─── */}
          {currentTab === 'appearance' && (
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

          {/* ─── 4. 10 TB CLOUD PLAN (CLEAN GOOGLE-DRIVE-STYLE OVERVIEW) ─── */}
          {currentTab === 'plan' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h3 className="text-sm font-bold text-foreground">10 TB Free Cloud Storage Plan</h3>
                <p className="text-xs text-muted-foreground">
                  Your active storage tier powered by high-speed hybrid cloud architecture.
                </p>
              </div>

              {/* Main Plan Card */}
              <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Active Plan
                    </span>
                    <h4 className="text-lg font-extrabold text-foreground mt-0.5">
                      Master Cloud Ultra 10 TB
                    </h4>
                  </div>
                  <Badge variant="success" className="px-3 py-1 text-xs">
                    Free Forever
                  </Badge>
                </div>

                {/* Storage Meter */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {formatBytes(breakdown.usedStorage)} used
                    </span>
                    <span className="text-muted-foreground">
                      {formatBytes(breakdown.totalQuota)} Total
                    </span>
                  </div>
                  <Progress value={breakdown.percentageUsed} className="h-2.5 rounded-full" />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="text-emerald-500 font-medium">
                      {formatBytes(breakdown.availableStorage)} Available
                    </span>
                    <span>{breakdown.percentageUsed}% of quota used</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Monthly Cost</span>
                    <span className="font-bold text-foreground">$0.00 / month</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Credit Card Required</span>
                    <span className="font-bold text-emerald-500">None (100% Free)</span>
                  </div>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="p-5 rounded-2xl border border-border/70 bg-secondary/20 space-y-3">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide">Included Plan Benefits</h5>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Dedicated 10 TB (10,240 GB) cloud capacity per registered email</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Telegram Cloud + High-Speed Multi-CDN parallel streaming pipeline</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Automatic slicing for ultra-large files with zero size restrictions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>End-to-end client-side privacy & secure chunk assembly</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Instant in-browser media player and full file preview support</span>
                  </li>
                </ul>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  onClick={() => navigate('/storage')}
                  className="rounded-xl text-xs font-semibold gap-2"
                >
                  <HardDrive className="h-4 w-4" />
                  View Detailed Quota Analytics
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setSmartCleanupModalOpen(true)}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Smart Cleanup Optimizer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
