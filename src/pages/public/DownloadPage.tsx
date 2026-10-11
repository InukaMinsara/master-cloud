import React from 'react';
import { Link } from 'react-router-dom';
import {
  Download, Laptop, HardDrive, CheckCircle2, Shield, Zap,
  ArrowRight, Monitor, Layers, Lock, Wifi, FolderOpen,
  Cloud, Star, Copy, Check, FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// ── Official Release Configuration ───────────────────────────────────────────
const INSTALLER_URL     = '/releases/MasterCloudSetup.exe';
const INSTALLER_MSI_URL = '/releases/MasterCloudSetup-x64.msi';
const INSTALLER_SHA256  = 'DEA90F7540BC1DDBE3C6B34AB520741A0AF80A8C227DE42D956EFEFEE2F72186';
const INSTALLER_VERSION = '1.0.0';
const INSTALLER_DATE    = 'October 2026';
const INSTALLER_SIZE    = '149.5 MB';

const INSTALL_STEPS = [
  { n: 1, icon: Download,   title: 'Download',           desc: 'MasterCloudSetup.exe (149.5 MB)' },
  { n: 2, icon: Monitor,    title: 'Install',             desc: '1-click Windows NSIS installer' },
  { n: 3, icon: Lock,       title: 'Sign In',             desc: 'Secure browser OAuth session' },
  { n: 4, icon: HardDrive,  title: 'Choose Drive Letter', desc: 'M: N: O: P: — auto-detected' },
  { n: 5, icon: Layers,     title: 'Choose Storage Mode', desc: 'Stream / Mirror / Hybrid' },
  { n: 6, icon: FolderOpen, title: 'Drive Appears',       desc: 'MASTER CLOUD (M:) in This PC' },
  { n: 7, icon: Cloud,      title: 'Start Using 10 TB',   desc: 'Native Explorer filesystem' },
];

const COMPARISON = [
  { feature: '10 TB Free Cloud Storage',              web: true,  drive: true  },
  { feature: 'Stream Mode (0-byte local disk usage)', web: false, drive: true  },
  { feature: 'MASTER CLOUD (M:) in Windows Explorer', web: false, drive: true  },
  { feature: 'Windows Right-Click Context Menu',       web: false, drive: true  },
  { feature: 'Make Available Offline',                 web: false, drive: true  },
  { feature: 'Mirror & Hybrid Sync Modes',             web: false, drive: true  },
  { feature: 'Crash-Safe Local SQLite Journal',        web: false, drive: true  },
  { feature: 'System Tray & Auto-Reconnect',           web: false, drive: true  },
  { feature: 'Windows Credential Manager (DPAPI)',     web: false, drive: true  },
  { feature: 'Access from Any Web Browser',            web: true,  drive: false },
];

export function DownloadPage() {
  const [copied, setCopied] = React.useState(false);

  function handleDownloadExe() {
    const link = document.createElement('a');
    link.href     = INSTALLER_URL;
    link.download = 'MasterCloudSetup.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading Master Cloud for Windows (MasterCloudSetup.exe)...');
  }

  function handleDownloadMsi() {
    const link = document.createElement('a');
    link.href     = INSTALLER_MSI_URL;
    link.download = 'MasterCloudSetup-x64.msi';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading Master Cloud Windows MSI Package...');
  }

  function copyHash() {
    navigator.clipboard.writeText(INSTALLER_SHA256);
    setCopied(true);
    toast.success('SHA-256 checksum copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-24 select-none">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide border border-primary/20">
          <HardDrive className="h-3.5 w-3.5" />
          <span>MASTER CLOUD FOR WINDOWS</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
          Your cloud, directly<br className="hidden sm:block" /> inside File Explorer.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Install Master Cloud on Windows and your 10 TB free storage mounts as a real drive.
          Open, edit, drag &amp; drop files in File Explorer just like an internal SSD.
        </p>
      </div>

      {/* ── Windows Explorer Visual Simulation ────────────────────────────── */}
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <span className="text-xs text-muted-foreground mx-auto font-medium">This PC — Windows File Explorer</span>
          </div>

          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Local Disk (C:)', pct: 76, color: 'bg-slate-500', note: '24% free' },
              { label: 'Data (D:)',       pct: 35, color: 'bg-slate-500', note: '65% free' },
            ].map(d => (
              <div key={d.label} className="p-3 rounded-xl border border-border bg-background/60">
                <HardDrive className="h-7 w-7 text-muted-foreground mb-2" />
                <div className="text-xs font-medium text-foreground mb-1">{d.label}</div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${d.color}`} style={{ width: `${d.pct}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{d.note}</div>
              </div>
            ))}

            <div className="p-3 rounded-xl border border-border bg-background/60 opacity-60">
              <Monitor className="h-7 w-7 text-muted-foreground mb-2" />
              <div className="text-xs font-medium text-foreground">Network Locations</div>
              <div className="text-[10px] text-muted-foreground mt-2">Available</div>
            </div>

            {/* Real MASTER CLOUD drive card */}
            <div className="p-3 rounded-2xl border-2 border-primary bg-primary/10 relative shadow-lg">
              <div className="absolute -top-2 -right-2">
                <Badge className="text-[9px] px-1.5 py-0.5 bg-primary text-primary-foreground font-bold">MOUNTED</Badge>
              </div>
              <Cloud className="h-7 w-7 text-primary mb-2" />
              <div className="text-xs font-black text-foreground">MASTER CLOUD (M:)</div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary" style={{ width: '1%' }} />
              </div>
              <div className="text-[10px] text-primary mt-1 font-bold">10.0 TB Free · Stream Mode</div>
            </div>
          </div>

          <div className="border-t border-border px-6 pb-6 pt-4 bg-muted/10">
            <div className="text-xs font-bold text-muted-foreground mb-3 flex items-center justify-between">
              <span>MASTER CLOUD (M:) \ My Drive</span>
              <span className="text-[11px] text-primary font-medium">Virtual Filesystem Active</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[
                { name: 'Projects',    type: 'folder', state: '✅ Offline' },
                { name: 'Documents',   type: 'folder', state: '☁ Cloud-only' },
                { name: 'Media',       type: 'folder', state: '☁ Cloud-only' },
                { name: 'Report.docx', type: 'file',   state: '📌 Pinned' },
                { name: 'Dataset.zip', type: 'file',   state: '☁ Cloud-only' },
              ].map(f => (
                <div key={f.name} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-border/60 bg-background/80 hover:bg-muted/40 transition-colors cursor-pointer">
                  <span className="text-2xl">{f.type === 'folder' ? '📁' : '📄'}</span>
                  <span className="text-[11px] text-center text-foreground font-semibold truncate max-w-full">{f.name}</span>
                  <span className="text-[9px] text-muted-foreground">{f.state}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border px-6 py-3 flex flex-wrap gap-4 bg-muted/20 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-blue-500">
              <Zap className="h-3.5 w-3.5" /> 0-byte local disk usage
            </div>
            <div className="flex items-center gap-1.5 text-emerald-500">
              <Shield className="h-3.5 w-3.5" /> Windows Credential Manager DPAPI
            </div>
            <div className="flex items-center gap-1.5 text-purple-500">
              <Wifi className="h-3.5 w-3.5" /> Auto-reconnect &amp; SQLite journal
            </div>
          </div>
        </div>
      </div>

      {/* ── Real Download Card ────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto rounded-3xl border-2 border-primary bg-card p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Laptop className="h-8 w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-black text-foreground">Master Cloud for Windows</h3>
              <Badge className="text-[10px] bg-emerald-600 text-white font-bold">v{INSTALLER_VERSION} Stable</Badge>
              <Badge variant="outline" className="text-[10px]">x64</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Windows 10 / 11 (64-bit) · Native Virtual Drive · Tauri + Rust · {INSTALLER_SIZE}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Released: {INSTALLER_DATE} · SHA-256 verified
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleDownloadExe}
            size="lg"
            className="flex-1 h-14 text-base font-black gap-2 shadow-lg shadow-primary/20"
          >
            <Download className="h-5 w-5" />
            Download for Windows (.exe)
          </Button>
          <Button
            onClick={handleDownloadMsi}
            variant="outline"
            size="lg"
            className="h-14 font-bold gap-2"
          >
            <FileCheck className="h-4 w-4" />
            MSI Package (.msi)
          </Button>
        </div>

        {/* SHA-256 Checksum box */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-bold flex items-center gap-1">
              <Shield className="h-3 w-3 text-emerald-500" />
              SHA-256 Checksum (Verification)
            </span>
            <button
              onClick={copyHash}
              className="text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="font-mono text-[10px] text-foreground break-all select-all">
            {INSTALLER_SHA256}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs flex-wrap gap-2">
          <span className="text-muted-foreground">Already installed Master Cloud?</span>
          <a
            href="mastercloud://open-drive"
            className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline cursor-pointer"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Open in File Explorer (mastercloud://)</span>
          </a>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          Zero cloud secrets bundled. Tokens stored in Windows Credential Manager DPAPI.
        </div>
      </div>

      {/* ── 7-Step Install Flow ───────────────────────────────────────────── */}
      <div className="space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-foreground">How It Works</h2>
          <p className="text-sm text-muted-foreground">From download to browsing your 10 TB in File Explorer in under 2 minutes.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {INSTALL_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.n}>
                <div className="flex flex-col items-center text-center gap-2 p-3 rounded-2xl bg-muted/20 border border-border/60">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-wide">Step {step.n}</div>
                  <div className="text-xs font-bold text-foreground">{step.title}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{step.desc}</div>
                </div>
                {i < INSTALL_STEPS.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center text-muted-foreground/30">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Storage Modes ─────────────────────────────────────────────────── */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-foreground">Three Storage Modes</h2>
          <p className="text-sm text-muted-foreground">Choose how your local storage interacts with your 10 TB cloud.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20',
              title: 'Stream Mode', badge: 'Default · 0-byte local',
              desc: 'Browse and open your full 10 TB without using local disk space. Files stream on demand with range requests.',
            },
            {
              icon: Monitor, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20',
              title: 'Mirror Mode', badge: 'Bidirectional sync',
              desc: 'Keep selected files both locally and in the cloud. Changes synchronize bidirectionally with automatic conflict detection.',
            },
            {
              icon: Layers, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20',
              title: 'Hybrid Mode', badge: 'Smart LRU cache',
              desc: 'Frequently used files stay local. Rarely used files stay cloud-only. Right-click any file to make available offline.',
            },
          ].map(m => {
            const Icon = m.icon;
            return (
              <div key={m.title} className={`p-6 rounded-2xl border ${m.bg} space-y-3`}>
                <Icon className={`h-7 w-7 ${m.color}`} />
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-foreground">{m.title}</h3>
                  <Badge variant="secondary" className="text-[10px]">{m.badge}</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Web vs Desktop Comparison ─────────────────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black text-center text-foreground">Web App vs Desktop Client</h2>
        <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left p-4 font-bold text-foreground">Feature</th>
                <th className="text-center p-4 font-bold text-foreground w-32">Web Browser</th>
                <th className="text-center p-4 font-bold text-primary w-40">Desktop Client (M:)</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                  <td className="p-4 text-foreground font-medium">{row.feature}</td>
                  <td className="p-4 text-center">{row.web   ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="p-4 text-center">{row.drive ? <CheckCircle2 className="h-4 w-4 text-primary mx-auto" />    : <span className="text-muted-foreground">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── System Requirements ───────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto space-y-4">
        <h2 className="text-2xl font-black text-center text-foreground">System Requirements</h2>
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3 text-sm">
          {[
            ['Operating System', 'Windows 10 / Windows 11 (64-bit)'],
            ['Memory (RAM)',     '4 GB minimum (8 GB recommended)'],
            ['Disk Footprint',   '20 MB installed + user-configured cache'],
            ['Filesystem Driver','WinFsp (auto-detected / integrated)'],
            ['Authentication',   'OAuth 2.0 (Google, GitHub, Microsoft, Email)'],
            ['Storage Limit',    '10 TB Permanent Free Tier'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-1 border-b border-border/40 last:border-0">
              <span className="font-bold text-muted-foreground">{k}</span>
              <span className="text-foreground text-right font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <div className="text-center space-y-6 pt-4 pb-8">
        <h2 className="text-3xl sm:text-4xl font-black text-foreground">
          Mount your 10 TB Master Cloud drive now.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleDownloadExe} size="lg" className="h-14 px-10 text-base font-black gap-2 shadow-xl shadow-primary/20">
            <Download className="h-5 w-5" />
            Download Master Cloud (.exe)
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-8 gap-2" asChild>
            <Link to="/cloud">Open Web App <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Free · 10 TB Storage · No Credit Card Required · Full Windows Explorer Integration
        </p>
      </div>

    </div>
  );
}
