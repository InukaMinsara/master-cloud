import React from 'react';
import { Link } from 'react-router-dom';
import {
  Download, Laptop, Smartphone, HardDrive, CheckCircle2, Shield, Zap,
  ArrowRight, Monitor, Layers, Lock, Wifi, FolderOpen,
  Cloud, Copy, Check, FileCheck, QrCode, Camera, Film,
  Share2, PlusSquare, ExternalLink, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

// Apple Logo SVG Component
function AppleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 170" fill="currentColor" className={className}>
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.73-7.8-12.08-14.15-6.66-9.67-11.87-20.91-15.63-33.72-3.76-12.81-5.64-24.84-5.64-36.08 0-14.74 3.73-26.79 11.19-36.14 7.46-9.35 16.94-14.17 28.44-14.46 4.79 0 10.15 1.25 16.08 3.76 5.93 2.5 9.77 3.82 11.51 3.94 1.52-.12 5.58-1.5 12.18-4.14 6.6-2.63 12.09-3.78 16.48-3.46 12.75.87 22.84 5.72 30.29 14.54-11.13 6.74-16.59 16.08-16.39 28.02.2 9.54 3.82 17.5 10.87 23.88 7.05 6.38 15.35 10.05 24.9 11.01-2.17 6.74-4.78 13.48-7.83 20.22zM119.22 31.84c0-7.17 2.61-13.91 7.83-20.22 5.22-6.3 11.63-10.43 19.24-12.38.33 2.06.49 4.12.49 6.18 0 7.39-2.72 14.35-8.15 20.87-5.44 6.52-12.18 10.53-20.22 12.03-.43-2.17-.65-4.34-.65-6.47z" />
    </svg>
  );
}

// ── Windows Release Configuration ─────────────────────────────────────────────
const WINDOWS_EXE_URL   = 'https://github.com/InukaMinsara/master-cloud/releases/download/v1.0.0/MasterCloudSetup.exe';
const WINDOWS_MSI_URL   = '/releases/MasterCloudSetup-x64.msi';
const WINDOWS_SHA256    = 'D9D3CF4981148F130F56CCBD7020590CC1E48E45A1B2BB2E47E74E2BE48A7CB5';
const WINDOWS_VERSION   = '1.0.0';
const WINDOWS_SIZE      = '153.2 MB';

// ── Android Release Configuration ─────────────────────────────────────────────
const ANDROID_APK_URL   = '/releases/MasterCloud-Android-v1.0.apk';
const ANDROID_VERSION   = '1.0.0';
const ANDROID_SIZE      = '171.3 MB';
const ANDROID_MIN_OS    = 'Android 8.0+ (Oreo to Android 15)';

// ── iOS Release Configuration ─────────────────────────────────────────────────
const IOS_PROJECT_ZIP   = '/releases/MasterCloud-iOS-Xcode.zip';
const IOS_VERSION       = '1.0.0';
const IOS_SIZE          = '9.9 MB';
const IOS_MIN_OS        = 'iOS 15.0+ (iPhone & iPad)';

const INSTALL_STEPS = [
  { n: 1, icon: Download,    title: 'Choose Platform',    desc: 'Windows, Android, or iPhone' },
  { n: 2, icon: Monitor,     title: '1-Click Setup',      desc: 'Instant installation on PC or phone' },
  { n: 3, icon: Lock,        title: 'Sign In',            desc: 'Secure browser OAuth session' },
  { n: 4, icon: HardDrive,   title: 'Virtual Storage',    desc: 'Windows Z: drive or Mobile app' },
  { n: 5, icon: Layers,      title: 'Choose Mode',        desc: 'Stream (0-byte disk) / Hybrid' },
  { n: 6, icon: FolderOpen,  title: 'Storage Appears',    desc: 'Instant access to full 10 TB' },
  { n: 7, icon: Cloud,       title: 'Enjoy 10 TB Space',  desc: 'Unlimited media, backup & files' },
];

const COMPARISON = [
  { feature: '10 TB Free Cloud Storage',              web: true,  win: true,  android: true,  ios: true  },
  { feature: 'Stream Mode (0-byte local disk/phone)', web: false, win: true,  android: true,  ios: true  },
  { feature: 'Camera Auto-Backup & Quick Capture',    web: false, win: false, android: true,  ios: true  },
  { feature: 'Direct Mobile Bottom Navigation',       web: false, win: false, android: true,  ios: true  },
  { feature: 'Works with Apple "Files" App',          web: false, win: false, android: false, ios: true  },
  { feature: 'MASTER CLOUD (Z:) in Windows Explorer', web: false, win: true,  android: false, ios: false },
  { feature: 'WebDAV Virtual Drive Mount',            web: false, win: true,  android: true,  ios: true  },
  { feature: 'Make Available Offline',                 web: false, win: true,  android: true,  ios: true  },
  { feature: 'Crash-Safe Local SQLite Cache',          web: false, win: true,  android: true,  ios: true  },
  { feature: '1-Tap Standalone Home Screen App',      web: false, win: false, android: true,  ios: true  },
  { feature: 'Access from Any Web Browser',            web: true,  win: false, android: true,  ios: true  },
];

export function DownloadPage() {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'all' | 'windows' | 'android' | 'ios'>('all');
  const [showAndroidQr, setShowAndroidQr] = React.useState(false);
  const [showIosQr, setShowIosQr] = React.useState(false);
  const [showIosGuide, setShowIosGuide] = React.useState(false);
  const [iosModalTab, setIosModalTab] = React.useState<'files' | 'homescreen'>('files');
  const [copiedWebdav, setCopiedWebdav] = React.useState(false);

  // Compute QR download link based on hostname or standard portal
  const qrAndroidUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8899/download`
    : 'http://192.168.1.164:8899/download';

  const qrIosUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/drive`
    : 'https://mastercloud09.netlify.app/drive';

  const webdavServerUrl = typeof window !== 'undefined'
    ? `http://${window.location.hostname}:8766`
    : 'http://192.168.1.164:8766';

  function copyWebdavUrl() {
    navigator.clipboard.writeText(webdavServerUrl);
    setCopiedWebdav(true);
    toast.success('Apple Files / WebDAV Server URL copied to clipboard!');
    setTimeout(() => setCopiedWebdav(false), 2000);
  }

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

  function handleDownloadIosXcode() {
    const link = document.createElement('a');
    link.href     = IOS_PROJECT_ZIP;
    link.download = 'MasterCloud-iOS-Xcode.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading Master Cloud iOS Xcode Project (.zip)...');
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
          Your 10 TB storage on<br className="hidden sm:block" /> PC, Android &amp; iPhone.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Install Master Cloud on Windows to mount a virtual 10 TB drive in File Explorer, or install on Android and iPhone to access, stream, and backup your phone with zero memory used.
        </p>

        {/* Platform Selector Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
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
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'ios'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 scale-105'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <AppleIcon className="h-3.5 w-3.5" />
            <span>Apple iPhone (iOS)</span>
          </button>
        </div>
      </div>

      {/* ── App Cards: Windows, Android & iOS ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
        
        {/* CARD 1: Windows Client */}
        {(activeTab === 'all' || activeTab === 'windows') && (
          <div className="rounded-3xl border-2 border-blue-500/40 hover:border-blue-500 bg-card p-6 shadow-xl space-y-6 flex flex-col justify-between transition-all relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-inner">
                    <Laptop className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-lg font-black text-foreground">Windows PC</h3>
                      <Badge className="text-[10px] bg-blue-600 text-white font-bold">v{WINDOWS_VERSION}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Windows 10 &amp; 11 · {WINDOWS_SIZE}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Mounts as a real <b>Z: virtual network drive</b> inside Windows File Explorer. Browse, drag &amp; drop, and stream your full 10 TB with 0-byte local disk footprint.
              </p>

              {/* Windows feature chips */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-medium">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Zap className="h-3 w-3 text-blue-500 shrink-0" />
                  <span>0-byte local disk</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <HardDrive className="h-3 w-3 text-indigo-500 shrink-0" />
                  <span>Z: Drive in This PC</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Shield className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>DPAPI vault</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Wifi className="h-3 w-3 text-purple-500 shrink-0" />
                  <span>Offline cache</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-border/60">
              <Button
                onClick={handleDownloadWindowsExe}
                size="lg"
                className="w-full h-11 text-xs font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
              >
                <Download className="h-4 w-4" />
                Download Windows (.exe)
              </Button>
              <Button
                onClick={handleDownloadWindowsMsi}
                variant="outline"
                size="sm"
                className="w-full h-9 text-[11px] font-bold gap-1.5"
              >
                <FileCheck className="h-3.5 w-3.5" />
                Enterprise MSI (.msi)
              </Button>

              {/* SHA-256 Checksum box */}
              <div className="p-2 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-mono truncate mr-2">SHA: {WINDOWS_SHA256.substring(0, 16)}...</span>
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
          <div className="rounded-3xl border-2 border-emerald-500/40 hover:border-emerald-500 bg-card p-6 shadow-xl space-y-6 flex flex-col justify-between transition-all relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-inner">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-lg font-black text-foreground">Android Phone</h3>
                      <Badge className="text-[10px] bg-emerald-600 text-white font-bold">v{ANDROID_VERSION}</Badge>
                      <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">APK</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {ANDROID_MIN_OS} · {ANDROID_SIZE}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Connects your smartphone directly to your <b>10 TB Virtual Cloud Storage</b>. Stream 4K videos, play music, and auto-backup photos with zero phone memory used!
              </p>

              {/* Android feature chips */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-medium">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Camera className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>Camera auto-backup</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Film className="h-3 w-3 text-blue-500 shrink-0" />
                  <span>On-demand 4K stream</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <HardDrive className="h-3 w-3 text-indigo-500 shrink-0" />
                  <span>10 TB Virtual Drive</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Shield className="h-3 w-3 text-purple-500 shrink-0" />
                  <span>Native Mobile Bottom Bar</span>
                </div>
              </div>
            </div>

            {/* Action Buttons & QR Option */}
            <div className="space-y-2.5 pt-2 border-t border-border/60">
              <Button
                onClick={handleDownloadAndroidApk}
                size="lg"
                className="w-full h-11 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25"
              >
                <Download className="h-4 w-4" />
                Download Android APK (.apk)
              </Button>
              <Button
                onClick={() => setShowAndroidQr(!showAndroidQr)}
                variant="outline"
                size="sm"
                className="w-full h-9 text-[11px] font-bold gap-1.5 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <QrCode className="h-3.5 w-3.5 text-emerald-500" />
                <span>{showAndroidQr ? 'Hide QR' : 'Phone QR Code'}</span>
              </Button>

              {/* Interactive Phone QR Scanner Box */}
              {showAndroidQr && (
                <div className="p-3 rounded-2xl bg-muted/50 border border-emerald-500/30 flex flex-col items-center text-center space-y-2 animate-in fade-in zoom-in-95">
                  <div className="p-2 bg-white rounded-xl shadow-md">
                    <QRCodeSVG value={qrAndroidUrl} size={110} level="M" />
                  </div>
                  <div className="text-[11px] font-bold text-foreground">Scan with Phone Camera</div>
                  <p className="text-[10px] text-muted-foreground">
                    Connect phone to Wi-Fi and scan to download APK directly.
                  </p>
                </div>
              )}

              <div className="p-2 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Samsung, Xiaomi, Pixel &amp; all Androids</span>
                <span className="font-bold text-emerald-500">Free</span>
              </div>
            </div>
          </div>
        )}

        {/* CARD 3: Apple iPhone & iPad (iOS) */}
        {(activeTab === 'all' || activeTab === 'ios') && (
          <div className="rounded-3xl border-2 border-purple-500/40 hover:border-purple-500 bg-card p-6 shadow-xl space-y-6 flex flex-col justify-between transition-all relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                    <AppleIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-lg font-black text-foreground">Apple iPhone</h3>
                      <Badge className="text-[10px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold">iOS 15+</Badge>
                      <Badge variant="outline" className="text-[9px] border-purple-500/40 text-purple-400">PWA &amp; App</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      iPhone &amp; iPad · Files App Ready
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Connects your iPhone or iPad directly to your <b>10 TB Cloud Storage</b>. Works seamlessly with Apple Safari, Home Screen Web App, and the native <b>Apple Files App</b>!
              </p>

              {/* iOS feature chips */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-medium">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <FolderOpen className="h-3 w-3 text-purple-400 shrink-0" />
                  <span>Apple "Files" App Ready</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Camera className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>iOS Photos Auto-Backup</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <PlusSquare className="h-3 w-3 text-blue-400 shrink-0" />
                  <span>1-Tap Home Screen App</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                  <Zap className="h-3 w-3 text-indigo-400 shrink-0" />
                  <span>0-byte iPhone storage</span>
                </div>
              </div>
            </div>

            {/* Action Buttons & QR Option */}
            <div className="space-y-2.5 pt-2 border-t border-border/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={() => { setIosModalTab('files'); setShowIosGuide(true); }}
                  size="lg"
                  className="h-11 text-xs font-bold gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-600/25"
                >
                  <FolderOpen className="h-4 w-4" />
                  Mount in Apple Files (10 TB)
                </Button>
                <Button
                  onClick={() => { setIosModalTab('homescreen'); setShowIosGuide(true); }}
                  variant="outline"
                  size="lg"
                  className="h-11 text-xs font-bold gap-1.5 border-purple-500/30 hover:bg-purple-500/10 text-foreground"
                >
                  <PlusSquare className="h-4 w-4 text-purple-400" />
                  Add to Home Screen
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setShowIosQr(!showIosQr)}
                  variant="outline"
                  size="sm"
                  className="h-9 text-[11px] font-bold gap-1 border-purple-500/30 hover:bg-purple-500/10"
                >
                  <QrCode className="h-3.5 w-3.5 text-purple-400" />
                  <span>{showIosQr ? 'Hide QR' : 'iPhone QR'}</span>
                </Button>
                <Button
                  onClick={handleDownloadIosXcode}
                  variant="outline"
                  size="sm"
                  className="h-9 text-[11px] font-bold gap-1 border-purple-500/30 hover:bg-purple-500/10"
                  title="Download complete Xcode native project for Mac/TestFlight"
                >
                  <Download className="h-3.5 w-3.5 text-purple-400" />
                  <span>Xcode (.zip)</span>
                </Button>
              </div>

              {/* Interactive iPhone QR Scanner Box */}
              {showIosQr && (
                <div className="p-3 rounded-2xl bg-muted/50 border border-purple-500/30 flex flex-col items-center text-center space-y-2 animate-in fade-in zoom-in-95">
                  <div className="p-2 bg-white rounded-xl shadow-md">
                    <QRCodeSVG value={qrIosUrl} size={110} level="M" />
                  </div>
                  <div className="text-[11px] font-bold text-foreground">Scan with iPhone Camera</div>
                  <p className="text-[10px] text-muted-foreground">
                    Opens Master Cloud in Safari to mount storage in 1-tap.
                  </p>
                </div>
              )}

              <div className="p-2 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>iOS 15.0+ · iPhone 11 to iPhone 16 Pro</span>
                <span className="font-bold text-purple-400">10 TB Free</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Modal: iPhone 10 TB Storage Mount & Files Integration ──────────── */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-card border border-purple-500/40 p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
                <AppleIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">iPhone 10 TB Storage Setup</h3>
                <p className="text-xs text-muted-foreground">Give your iPhone a 10 TB Virtual Drive with zero local storage waste</p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex rounded-2xl bg-muted/60 p-1 border border-border/60">
              <button
                onClick={() => setIosModalTab('files')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  iosModalTab === 'files'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>1. Apple "Files" App (10 TB)</span>
              </button>
              <button
                onClick={() => setIosModalTab('homescreen')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  iosModalTab === 'homescreen'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PlusSquare className="h-3.5 w-3.5" />
                <span>2. Home Screen App</span>
              </button>
            </div>

            {/* TAB 1: APPLE FILES APP MOUNT */}
            {iosModalTab === 'files' && (
              <div className="space-y-4 text-xs animate-in fade-in">
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                  <div className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Server Connection Address:</span>
                    <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/40">WebDAV</Badge>
                  </div>
                  <div className="p-2.5 rounded-xl bg-background border border-border/70 flex items-center justify-between font-mono text-[11px]">
                    <span className="truncate mr-2 text-foreground font-bold">{webdavServerUrl}</span>
                    <Button
                      onClick={copyWebdavUrl}
                      size="sm"
                      className="h-7 px-3 text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                    >
                      {copiedWebdav ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      {copiedWebdav ? 'Copied!' : 'Copy Address'}
                    </Button>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    💡 Connect with <b>Guest</b> mode. No password required!
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border">
                    <div className="h-7 w-7 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">1</div>
                    <div>
                      <div className="font-bold text-foreground">Open Apple "Files" (ගොනු) App</div>
                      <div className="text-muted-foreground mt-0.5">Open the built-in <b>Files</b> app on your iPhone and go to the <b>Browse</b> tab.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border">
                    <div className="h-7 w-7 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">2</div>
                    <div>
                      <div className="font-bold text-foreground">Tap "..." Menu in Top Right</div>
                      <div className="text-muted-foreground mt-0.5">Tap the three dots icon in the top right corner and select <b>"Connect to Server" (සර්වර් එකට සම්බන්ධ වන්න)</b>.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border">
                    <div className="h-7 w-7 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">3</div>
                    <div>
                      <div className="font-bold text-foreground">Paste Address &amp; Connect as Guest</div>
                      <div className="text-muted-foreground mt-0.5">Paste <code className="text-primary font-bold">{webdavServerUrl}</code>, tap <b>Connect</b>, choose <b>Guest</b>, and tap <b>Next</b>.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-500/15 border-2 border-purple-500/40">
                    <div className="h-7 w-7 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">✓</div>
                    <div>
                      <div className="font-bold text-foreground">10 TB Storage Appears on iPhone!</div>
                      <div className="text-muted-foreground mt-0.5"><b>MASTER CLOUD</b> appears right beside iCloud Drive with <b>10.0 TB Free Space</b>. Stream 4K videos, save WhatsApp files, and browse with 0-byte iPhone storage used!</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HOME SCREEN APP */}
            {iosModalTab === 'homescreen' && (
              <div className="space-y-3 text-xs animate-in fade-in">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border">
                  <div className="h-7 w-7 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">1</div>
                  <div>
                    <div className="font-bold text-foreground">Open in Safari</div>
                    <div className="text-muted-foreground mt-0.5">Open <b>Safari</b> on your iPhone and go to Master Cloud.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border">
                  <div className="h-7 w-7 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">2</div>
                  <div>
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      Tap the Share Button <Share2 className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <div className="text-muted-foreground mt-0.5">Tap the <b>Share</b> icon (the square with an arrow pointing up at the bottom).</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border">
                  <div className="h-7 w-7 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">3</div>
                  <div>
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      Tap "Add to Home Screen" <PlusSquare className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="text-muted-foreground mt-0.5">Scroll down in the share sheet and tap <b>"Add to Home Screen"</b> (මුල් තිරයට එක් කරන්න).</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border">
                  <div className="h-7 w-7 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">4</div>
                  <div>
                    <div className="font-bold text-foreground">Tap "Add" in Top Right</div>
                    <div className="text-muted-foreground mt-0.5">Tap <b>Add</b>. Master Cloud runs as a standalone app with native camera auto-backup and 10 TB storage!</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                asChild
                className="w-full h-11 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
              >
                <a href="/drive" target="_blank" rel="noopener noreferrer">
                  <span>Open Master Cloud Now</span>
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </a>
              </Button>
              <Button
                onClick={() => setShowIosGuide(false)}
                variant="ghost"
                className="w-full h-9 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Windows Explorer Visual Simulation ────────────────────────────── */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-foreground">How Master Cloud Mounts</h2>
          <p className="text-xs text-muted-foreground">Appears natively in Windows This PC, Android Filesystem, and iPhone Files app.</p>
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
          <p className="text-sm text-muted-foreground">From download to browsing your 10 TB in under 2 minutes on PC or Phone.</p>
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

      {/* ── Web vs Windows vs Android vs iOS Comparison ──────────────────── */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black text-center text-foreground">Platform Comparison</h2>
        <div className="rounded-2xl border border-border overflow-x-auto shadow-sm">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left p-4 font-bold text-foreground">Feature</th>
                <th className="text-center p-4 font-bold text-foreground w-24">Web Browser</th>
                <th className="text-center p-4 font-bold text-blue-500 w-32">Windows (Z:)</th>
                <th className="text-center p-4 font-bold text-emerald-500 w-32">Android App</th>
                <th className="text-center p-4 font-bold text-purple-400 w-32">iPhone (iOS)</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                  <td className="p-4 text-foreground font-medium">{row.feature}</td>
                  <td className="p-4 text-center">{row.web     ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="p-4 text-center">{row.win     ? <CheckCircle2 className="h-4 w-4 text-blue-500 mx-auto" />    : <span className="text-muted-foreground">—</span>}</td>
                  <td className="p-4 text-center">{row.android ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="p-4 text-center">{row.ios     ? <CheckCircle2 className="h-4 w-4 text-purple-400 mx-auto" />  : <span className="text-muted-foreground">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom Triple CTA ──────────────────────────────────────────────── */}
      <div className="text-center space-y-6 pt-4 pb-8">
        <h2 className="text-3xl sm:text-4xl font-black text-foreground">
          Mount your 10 TB Master Cloud storage today.
        </h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={handleDownloadWindowsExe} size="lg" className="h-14 px-7 text-sm font-black gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20">
            <Laptop className="h-5 w-5" />
            Windows (.exe)
          </Button>
          <Button onClick={handleDownloadAndroidApk} size="lg" className="h-14 px-7 text-sm font-black gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20">
            <Smartphone className="h-5 w-5" />
            Android (.apk)
          </Button>
          <Button onClick={() => setShowIosGuide(true)} size="lg" className="h-14 px-7 text-sm font-black gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl shadow-purple-500/20">
            <AppleIcon className="h-5 w-5" />
            Apple iPhone (iOS)
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-6 gap-2" asChild>
            <Link to="/cloud">Open Web App <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Free · 10 TB Storage · No Credit Card Required · Windows 10/11, Android &amp; iPhone Supported
        </p>
      </div>

    </div>
  );
}
