import React from 'react';
import { Link } from 'react-router-dom';
import {
  Download, Laptop, Smartphone, HardDrive, CheckCircle2, Shield, Zap,
  ArrowRight, Monitor, Layers, Lock, Wifi, FolderOpen,
  Cloud, Copy, Check, FileCheck, QrCode, Camera, Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

// ── Windows Release Configuration ─────────────────────────────────────────────
const WINDOWS_EXE_URL   = 'https://github.com/InukaMinsara/master-cloud/releases/download/v1.0.0/MasterCloudSetup.exe';
const WINDOWS_MSI_URL   = '/releases/MasterCloudSetup-x64.msi';
const WINDOWS_SHA256    = 'D9D3CF4981148F130F56CCBD7020590CC1E48E45A1B2BB2E47E74E2BE48A7CB5';
const WINDOWS_VERSION   = '1.0.0';
const WINDOWS_DATE      = 'October 2026';
const WINDOWS_SIZE      = '153.2 MB';

// ── Android Release Configuration ─────────────────────────────────────────────
const ANDROID_APK_URL   = '/releases/MasterCloud-Android-v1.0.apk';
const ANDROID_VERSION   = '1.0.0';
const ANDROID_DATE      = 'October 2026';
const ANDROID_SIZE      = '171.3 MB';
const ANDROID_MIN_OS    = 'Android 8.0+ (Oreo to Android 15)';

const INSTALL_STEPS = [
  { n: 1, icon: Download,    title: 'Download App',       desc: 'Windows (.exe) or Android (.apk)' },
  { n: 2, icon: Monitor,     title: '1-Click Install',    desc: 'Instant setup with zero configuration' },
  { n: 3, icon: Lock,        title: 'Sign In',            desc: 'Secure browser OAuth session' },
  { n: 4, icon: HardDrive,   title: 'Virtual Storage',    desc: 'Windows Z: drive or Android App' },
  { n: 5, icon: Layers,      title: 'Choose Mode',        desc: 'Stream (0-byte disk) / Hybrid' },
  { n: 6, icon: FolderOpen,  title: 'Storage Appears',    desc: 'Instant access to full 10 TB' },
  { n: 7, icon: Cloud,       title: 'Enjoy 10 TB Space',  desc: 'Unlimited media, backup & files' },
];

const COMPARISON = [
  { feature: '10 TB Free Cloud Storage',              web: true,  win: true,  android: true  },
  { feature: 'Stream Mode (0-byte local disk/phone)', web: false, win: true,  android: true  },
  { feature: 'Camera Auto-Backup & Quick Capture',    web: false, win: false, android: true  },
  { feature: 'Direct Mobile Bottom Navigation',       web: false, win: false, android: true  },
  { feature: 'MASTER CLOUD (Z:) in Windows Explorer', web: false, win: true,  android: false },
  { feature: 'WebDAV Virtual Drive Mount',            web: false, win: true,  android: true  },
  { feature: 'Windows Right-Click Context Menu',       web: false, win: true,  android: false },
  { feature: 'Make Available Offline',                 web: false, win: true,  android: true  },
  { feature: 'Crash-Safe Local SQLite Journal',        web: false, win: true,  android: true  },
  { feature: 'System Hardware Back Button Handling',   web: false, win: false, android: true  },
  { feature: 'Access from Any Web Browser',            web: true,  win: false, android: true  },
];

export function DownloadPage() {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'all' | 'windows' | 'android'>('all');
  const [showAndroidQr, setShowAndroidQr] = React.useState(false);

  // Compute QR download link based on hostname or standard portal
  const qrDownloadUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8899/download`
    : 'http://192.168.1.164:8899/download';

  function handleDownloadWindowsExe() {
    window.location.href = WINDOWS_EXE_URL;
    toast.success('Downloading Master Cloud for Windows (MasterCloudSetup.exe)...');
  }

  function handleDownloadWindowsMsi() {
    const link = document.createElement('a');
    link.href     = WINDOWS_MSI_URL;
    link.download = 'MasterCloudSetup-x64.msi';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading Master Cloud Windows MSI Package...');
  }

  function handleDownloadAndroidApk() {
    const link = document.createElement('a');
    link.href     = ANDROID_APK_URL;
    link.download = 'MasterCloud-Android-v1.0.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading Master Cloud for Android (MasterCloud-Android-v1.0.apk)...');
  }

  function copyHash() {
    navigator.clipboard.writeText(WINDOWS_SHA256);
    setCopied(true);
    toast.success('SHA-256 checksum copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-24 select-none">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide border border-primary/20">
          <Cloud className="h-3.5 w-3.5" />
          <span>MASTER CLOUD CLIENTS &amp; APPS</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
          Your 10 TB storage on<br className="hidden sm:block" /> PC and Phone.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Install Master Cloud on Windows to mount a virtual 10 TB drive in File Explorer, or install the Android App to access, stream, and backup your phone with zero storage used.
        </p>

        {/* Platform Selector Buttons */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            All Platforms
          </button>
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'windows'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>Windows PC</span>
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'android'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-105'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Android Phone</span>
          </button>
        </div>
      </div>

      {/* ── Dual App Cards: Windows & Android ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
        
        {/* CARD 1: Windows Client */}
        {(activeTab === 'all' || activeTab === 'windows') && (
          <div className="rounded-3xl border-2 border-blue-500/40 hover:border-blue-500 bg-card p-6 sm:p-8 shadow-xl space-y-6 flex flex-col justify-between transition-all relative overflow-hidden">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-inner">
                    <Laptop className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-foreground">Windows Client</h3>
                      <Badge className="text-[10px] bg-blue-600 text-white font-bold">v{WINDOWS_VERSION} Stable</Badge>
                      <Badge variant="outline" className="text-[10px]">x64</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Windows 10 &amp; 11 (64-bit) · {WINDOWS_SIZE}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Mounts as a real <b>Z: virtual network drive</b> inside Windows File Explorer. Browse, drag &amp; drop, and stream your full 10 TB with 0-byte local disk usage.
              </p>

              {/* Windows feature chips */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Zap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>0-byte local disk usage</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <HardDrive className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>Z: Drive in This PC</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>DPAPI Credential vault</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Wifi className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span>Offline cache &amp; sync</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button
                  onClick={handleDownloadWindowsExe}
                  size="lg"
                  className="flex-1 h-12 text-sm font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
                >
                  <Download className="h-4 w-4" />
                  Download for Windows (.exe)
                </Button>
                <Button
                  onClick={handleDownloadWindowsMsi}
                  variant="outline"
                  size="lg"
                  className="h-12 text-xs font-bold gap-1.5"
                >
                  <FileCheck className="h-4 w-4" />
                  MSI (.msi)
                </Button>
              </div>

              {/* SHA-256 Checksum box */}
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-mono truncate mr-2">SHA-256: {WINDOWS_SHA256.substring(0, 20)}...</span>
                <button
                  onClick={copyHash}
                  className="text-primary hover:underline flex items-center gap-1 font-semibold shrink-0"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CARD 2: Android App */}
        {(activeTab === 'all' || activeTab === 'android') && (
          <div className="rounded-3xl border-2 border-emerald-500/40 hover:border-emerald-500 bg-card p-6 sm:p-8 shadow-xl space-y-6 flex flex-col justify-between transition-all relative overflow-hidden">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-inner">
                    <Smartphone className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-foreground">Android Mobile App</h3>
                      <Badge className="text-[10px] bg-emerald-600 text-white font-bold">v{ANDROID_VERSION} Stable</Badge>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">APK</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ANDROID_MIN_OS} · {ANDROID_SIZE}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Connects your smartphone directly to your <b>10 TB Virtual Cloud Storage</b>. Stream 4K videos, play music, and auto-backup photos with zero phone memory used!
              </p>

              {/* Android feature chips */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Camera className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Instant Camera auto-backup</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Film className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>On-demand 4K stream</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <HardDrive className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>10 TB Virtual Space</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Shield className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span>Native Mobile Bottom Bar</span>
                </div>
              </div>
            </div>

            {/* Action Buttons & QR Option */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button
                  onClick={handleDownloadAndroidApk}
                  size="lg"
                  className="flex-1 h-12 text-sm font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25"
                >
                  <Download className="h-4 w-4" />
                  Download Android APK (.apk)
                </Button>
                <Button
                  onClick={() => setShowAndroidQr(!showAndroidQr)}
                  variant="outline"
                  size="lg"
                  className="h-12 text-xs font-bold gap-1.5 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <QrCode className="h-4 w-4 text-emerald-500" />
                  <span>{showAndroidQr ? 'Hide QR' : 'Phone QR Code'}</span>
                </Button>
              </div>

              {/* Interactive Phone QR Scanner Box */}
              {showAndroidQr && (
                <div className="p-4 rounded-2xl bg-muted/50 border border-emerald-500/30 flex flex-col items-center text-center space-y-2 animate-in fade-in zoom-in-95">
                  <div className="p-2.5 bg-white rounded-xl shadow-md">
                    <QRCodeSVG value={qrDownloadUrl} size={130} level="M" />
                  </div>
                  <div className="text-xs font-bold text-foreground">Scan with your Phone Camera</div>
                  <p className="text-[11px] text-muted-foreground">
                    Connect your phone to Wi-Fi and scan to download <span className="font-mono text-emerald-500">MasterCloud.apk</span> instantly.
                  </p>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Direct package installation · Works on Samsung, Xiaomi, Pixel &amp; all Androids</span>
                <span className="font-bold text-emerald-500">Free</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Windows Explorer Visual Simulation ────────────────────────────── */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-foreground">How Master Cloud Mounts</h2>
          <p className="text-xs text-muted-foreground">Appears natively in Windows This PC as well as your Android Filesystem.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <span className="text-xs text-muted-foreground mx-auto font-medium">This PC — Virtual Cloud Drive (Z:)</span>
          </div>

          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Local Disk (C:)', pct: 76, color: 'bg-slate-500', note: '24% free' },
              { label: 'Data Disk (D:)', pct: 54, color: 'bg-slate-500', note: '46% free' },
              { label: 'System (E:)',    pct: 88, color: 'bg-slate-500', note: '12% free' },
            ].map(d => (
              <div key={d.label} className="p-3 rounded-2xl border border-border/60 bg-muted/20 space-y-1">
                <HardDrive className="h-6 w-6 text-muted-foreground mb-2" />
                <div className="text-xs font-bold text-foreground truncate">{d.label}</div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${d.color}`} style={{ width: `${d.pct}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground">{d.note}</div>
              </div>
            ))}

            <div className="p-3 rounded-2xl border-2 border-primary bg-primary/10 relative shadow-lg">
              <div className="absolute -top-2 -right-2">
                <Badge className="text-[9px] px-1.5 py-0.5 bg-primary text-primary-foreground font-bold">10 TB MOUNTED</Badge>
              </div>
              <Cloud className="h-7 w-7 text-primary mb-2" />
              <div className="text-xs font-black text-foreground">MASTER CLOUD (Z:)</div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary" style={{ width: '1%' }} />
              </div>
              <div className="text-[10px] text-primary mt-1 font-bold">10.0 TB Free · Stream Mode</div>
            </div>
          </div>

          <div className="border-t border-border px-6 pb-6 pt-4 bg-muted/10">
            <div className="text-xs font-bold text-muted-foreground mb-3 flex items-center justify-between">
              <span>MASTER CLOUD (Z:) \ My Drive</span>
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
        </div>
      </div>

      {/* ── 7-Step Install Flow ───────────────────────────────────────────── */}
      <div className="space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-foreground">How It Works</h2>
          <p className="text-sm text-muted-foreground">From download to browsing your 10 TB in under 2 minutes on PC or Mobile.</p>
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

      {/* ── Web vs Windows vs Android Comparison ──────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black text-center text-foreground">Platform Comparison</h2>
        <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left p-4 font-bold text-foreground">Feature</th>
                <th className="text-center p-4 font-bold text-foreground w-28">Web Browser</th>
                <th className="text-center p-4 font-bold text-blue-500 w-36">Windows (Z:)</th>
                <th className="text-center p-4 font-bold text-emerald-500 w-36">Android App</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                  <td className="p-4 text-foreground font-medium">{row.feature}</td>
                  <td className="p-4 text-center">{row.web     ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="p-4 text-center">{row.win     ? <CheckCircle2 className="h-4 w-4 text-blue-500 mx-auto" />    : <span className="text-muted-foreground">—</span>}</td>
                  <td className="p-4 text-center">{row.android ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom Dual CTA ────────────────────────────────────────────────── */}
      <div className="text-center space-y-6 pt-4 pb-8">
        <h2 className="text-3xl sm:text-4xl font-black text-foreground">
          Mount your 10 TB Master Cloud storage today.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleDownloadWindowsExe} size="lg" className="h-14 px-8 text-base font-black gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20">
            <Laptop className="h-5 w-5" />
            Download for Windows (.exe)
          </Button>
          <Button onClick={handleDownloadAndroidApk} size="lg" className="h-14 px-8 text-base font-black gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20">
            <Smartphone className="h-5 w-5" />
            Download for Android (.apk)
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-8 gap-2" asChild>
            <Link to="/cloud">Open Web App <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Free · 10 TB Storage · No Credit Card Required · Windows 10/11 &amp; Android Supported
        </p>
      </div>

    </div>
  );
}
