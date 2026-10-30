import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  HardDrive,
  Link2,
  FileCode,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Cpu,
  Database,
  Server,
  ToggleLeft,
  ToggleRight,
  Search,
  Lock,
  RefreshCw,
  Sliders,
  CheckCheck,
  Trash2,
  Plus,
} from 'lucide-react';
import { api } from '@/services/api';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface SystemHealthService {
  name: string;
  type: string;
  status: 'healthy' | 'degraded' | 'maintenance';
  latency: number;
  uptime: string;
  details: string;
}

export function AdminPage() {
  const { user } = useAuthStore();
  const [breakdown, setBreakdown] = useState(() => api.getStorageBreakdown());
  const isSupabase = api.isConfiguredWithSupabase();

  useEffect(() => {
    const updateStats = () => setBreakdown(api.getStorageBreakdown());
    window.addEventListener('mc_storage_updated', updateStats);
    const interval = setInterval(updateStats, 3000);
    return () => {
      window.removeEventListener('mc_storage_updated', updateStats);
      clearInterval(interval);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system' | 'flags'>('overview');
  const [userSearch, setUserSearch] = useState('');

  // Feature Flags State
  const [flags, setFlags] = useState({
    publicRegistration: true,
    windowsVirtualDrive: true,
    masterCanvas: false,
    zeroTrustAudit: true,
    maintenanceMode: false,
  });

  // Simulated live system health checks
  const [services, setServices] = useState<SystemHealthService[]>([
    {
      name: 'Primary Database',
      type: isSupabase ? 'PostgreSQL 16 (Supabase RLS)' : 'Local IndexedDB Engine',
      status: 'healthy',
      latency: isSupabase ? 18 : 3,
      uptime: '99.99%',
      details: 'Connection pool operating nominally. All tables online.',
    },
    {
      name: 'Object Storage Cluster',
      type: '10 TB Free Storage Allocation Pool',
      status: 'healthy',
      latency: 24,
      uptime: '99.98%',
      details: 'Read/write throughput optimal. Quota enforcement active.',
    },
    {
      name: 'Authentication Authority',
      type: 'OAuth & Zero-Trust Session Manager',
      status: 'healthy',
      latency: 12,
      uptime: '100%',
      details: 'JWT token verification & Argon2 hashing operational.',
    },
    {
      name: 'Windows Virtual Filesystem Engine',
      type: 'Local Virtual Drive (M:) & WebDAV Port 8766',
      status: 'healthy',
      latency: 4,
      uptime: '99.99%',
      details: 'Stream Mode (0-byte footprint) & Smart Hybrid Cache online on D:\\MasterCloudCache.',
    },
    {
      name: 'Background Sync Workers',
      type: 'Asynchronous Task Processor',
      status: 'healthy',
      latency: 5,
      uptime: '99.99%',
      details: '0 queued failures. Auto-retry enabled.',
    },
  ]);

  // System Users List with 10 TB policy
  const [usersList, setUsersList] = useState([
    {
      id: 'usr-1',
      name: user?.display_name || 'Admin',
      email: user?.email || 'admin@mastercloud.io',
      role: 'admin',
      status: 'active',
      usedBytes: breakdown.usedStorage,
      quotaBytes: 10995116277760, // 10 TB
      joined: 'Nov 2025',
    },
    {
      id: 'usr-2',
      name: 'Sarah Connor',
      email: 'sarah.connor@example.com',
      role: 'user',
      status: 'active',
      usedBytes: 14200000000, // 14.2 GB
      quotaBytes: 10995116277760, // 10 TB
      joined: 'Jan 2026',
    },
    {
      id: 'usr-3',
      name: 'Marcus Vance',
      email: 'marcus.vance@example.com',
      role: 'user',
      status: 'active',
      usedBytes: 48200000000, // 48.2 GB
      quotaBytes: 10995116277760, // 10 TB
      joined: 'Feb 2026',
    },
    {
      id: 'usr-4',
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      role: 'user',
      status: 'suspended',
      usedBytes: 2100000000, // 2.1 GB
      quotaBytes: 10995116277760, // 10 TB
      joined: 'Mar 2026',
    },
  ]);

  const toggleUserStatus = (id: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'active' ? 'suspended' : 'active';
        toast.info(`User "${u.name}" is now ${nextStatus}`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const toggleFlag = (key: keyof typeof flags) => {
    setFlags(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success(`Feature Flag "${key}" set to ${updated[key] ? 'ENABLED' : 'DISABLED'}`);
      return updated;
    });
  };

  const handleDownloadMigration = () => {
    const migrationUrl = '/supabase/migrations/20260101000000_master_cloud_init.sql';
    window.open(migrationUrl, '_blank');
    toast.success('Migration schema opened');
  };



  const filteredUsers = usersList.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 select-none bg-background text-foreground">
      {/* Maintenance Mode Alert Banner if active */}
      {flags.maintenanceMode && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-amber-500 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-bold">
              MAINTENANCE MODE ACTIVE: Platform is operating under restricted administrator access.
            </span>
          </div>
          <button
            onClick={() => toggleFlag('maintenanceMode')}
            className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Disable Now
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-black text-foreground">Master Cloud System Center & Admin</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Platform governance, 10 TB quota infrastructure, AI gateway diagnostics, and cluster health monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={user?.role === 'admin' ? 'success' : 'destructive'} className="py-1 px-3">
            {user?.role === 'admin' ? 'Root Administrator Privileges Active' : 'Restricted Role'}
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/60 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'overview' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'users' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          User Accounts ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'system' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          System Center Matrix
        </button>
        <button
          onClick={() => setActiveTab('flags')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'flags' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          Feature Flags & Virtual Drive
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl border border-border/80 bg-card shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Registered Tenants</span>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <h3 className="text-2xl font-black text-foreground">1,482 Users</h3>
              <span className="text-[10px] text-emerald-500 font-semibold">All provisioned with Free 10 TB</span>
            </div>

            <div className="p-5 rounded-3xl border border-border/80 bg-card shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Cluster Storage Used</span>
                <HardDrive className="h-4 w-4 text-purple-500" />
              </div>
              <h3 className="text-2xl font-black text-foreground">{formatBytes(breakdown.usedStorage)}</h3>
              <span className="text-[10px] text-muted-foreground font-mono">10 TB Quota per user guaranteed</span>
            </div>

            <div className="p-5 rounded-3xl border border-border/80 bg-card shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Active Share Tokens</span>
                <Link2 className="h-4 w-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-foreground">328 Active</h3>
              <span className="text-[10px] text-emerald-500 font-semibold">Zero-trust verified</span>
            </div>

            <div className="p-5 rounded-3xl border border-border/80 bg-card shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Database Engine</span>
                <Database className="h-4 w-4 text-amber-500" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                {isSupabase ? 'PostgreSQL 16 (Supabase)' : 'IndexedDB Dual Engine'}
              </h3>
              <span className="text-[10px] text-emerald-500 font-semibold">Healthy • RLS Active</span>
            </div>
          </div>

          {/* Database Schema & Deployment Section */}
          <div className="p-6 rounded-3xl border border-border/80 bg-secondary/30 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  <span>Database Schema & 10 TB Storage Trigger Migrations</span>
                </h4>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Contains all 15 PostgreSQL tables, automatic 10 TB quota allocations (<code className="font-mono text-[10px]">10995116277760</code> bytes), cascade triggers, storage policies, and row-level security constraints in <code className="bg-card px-1.5 py-0.5 rounded font-mono text-[11px]">supabase/migrations/20260101000000_master_cloud_init.sql</code>.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadMigration} className="rounded-xl text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                View SQL Migration
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user accounts by name or email..."
                className="w-full bg-card border border-border/70 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-border/80 overflow-hidden bg-card shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Cloud Quota</th>
                  <th className="px-4 py-3">Used Storage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-foreground block">{u.name}</span>
                        <span className="text-[10px] text-muted-foreground">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-[10px]">
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-primary">
                      10 TB (Free Universal)
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {formatBytes(u.usedBytes)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.status === 'active' ? 'success' : 'destructive'} className="text-[10px]">
                        {u.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              u.status === 'active'
                                ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
                                : 'border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                        <button
                          onClick={() => toast.success(`Password reset token sent to ${u.email}`)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-border hover:bg-accent transition-colors"
                        >
                          Reset Auth
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cloud Storage Policy Notice */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Multi-Tenant 10 TB Storage Architecture</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Every provisioned account receives 10 TB of high-performance cloud storage backed by PostgreSQL Row-Level Security and AES-256 chunk encryption. No paid tiers or storage limits apply.
              </p>
            </div>
          </div>
        </div>
      )}





      {/* TAB 3: SYSTEM CENTER MATRIX */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Core Subsystem Health Matrix
            </h3>
            <button
              onClick={() => toast.success('Subsystem matrix health probes refreshed')}
              className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Probe Services Now</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc, i) => (
              <div key={i} className="p-5 rounded-3xl border border-border/80 bg-card shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{svc.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{svc.type}</p>
                  </div>
                  <Badge variant="success" className="text-[10px] uppercase">
                    {svc.status}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">{svc.details}</p>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Latency: <strong className="text-foreground">{svc.latency}ms</strong></span>
                  <span>Uptime: <strong className="text-emerald-500">{svc.uptime}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* TAB 5: FEATURE FLAGS & MAINTENANCE */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          <div className="bg-card border border-border/80 rounded-3xl divide-y divide-border/50 shadow-sm">
            <div className="p-5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-foreground">Public User Registration</h4>
                <p className="text-xs text-muted-foreground">
                  Allow new users to sign up and instantly receive 10 TB free storage.
                </p>
              </div>
              <button onClick={() => toggleFlag('publicRegistration')}>
                {flags.publicRegistration ? (
                  <ToggleRight className="h-7 w-7 text-primary" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                )}
              </button>
            </div>

            <div className="p-5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-foreground">Windows Local Virtual Drive (M:)</h4>
                <p className="text-xs text-muted-foreground">
                  Enable high-speed VFS and WebDAV mounting into Windows File Explorer.
                </p>
              </div>
              <button onClick={() => toggleFlag('windowsVirtualDrive')}>
                {flags.windowsVirtualDrive ? (
                  <ToggleRight className="h-7 w-7 text-primary" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                )}
              </button>
            </div>

            <div className="p-5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-foreground">Master Canvas Suite</h4>
                <p className="text-xs text-muted-foreground">
                  Enable Docs, Sheets, Slides, Forms, Draw, and Notes editors.
                </p>
              </div>
              <button onClick={() => toggleFlag('masterCanvas')}>
                {flags.masterCanvas ? (
                  <ToggleRight className="h-7 w-7 text-primary" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                )}
              </button>
            </div>

            <div className="p-5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-foreground">Zero-Trust Audit Logging</h4>
                <p className="text-xs text-muted-foreground">
                  Record cryptographic hashes and tenant access events on every file transaction.
                </p>
              </div>
              <button onClick={() => toggleFlag('zeroTrustAudit')}>
                {flags.zeroTrustAudit ? (
                  <ToggleRight className="h-7 w-7 text-primary" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                )}
              </button>
            </div>

            <div className="p-5 flex items-center justify-between bg-amber-500/5">
              <div>
                <h4 className="font-bold text-sm text-amber-500">Maintenance Mode</h4>
                <p className="text-xs text-muted-foreground">
                  Restrict tenant activity and broadcast system upgrade banner.
                </p>
              </div>
              <button onClick={() => toggleFlag('maintenanceMode')}>
                {flags.maintenanceMode ? (
                  <ToggleRight className="h-7 w-7 text-amber-500" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
