import React from 'react';
import { Link } from 'react-router-dom';
import {
  Laptop,
  HardDrive,
  Zap,
  Database,
  WifiOff,
  Download,
  CheckCircle2,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  Terminal,
  FolderSync,
  Sparkles,
  Smartphone,
  FolderOpen,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

function AppleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 170" fill="currentColor" className={className}>
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.73-7.8-12.08-14.15-6.66-9.67-11.87-20.91-15.63-33.72-3.76-12.81-5.64-24.84-5.64-36.08 0-14.74 3.73-26.79 11.19-36.14 7.46-9.35 16.94-14.17 28.44-14.46 4.79 0 10.15 1.25 16.08 3.76 5.93 2.5 9.77 3.82 11.51 3.94 1.52-.12 5.58-1.5 12.18-4.14 6.6-2.63 12.09-3.78 16.48-3.46 12.75.87 22.84 5.72 30.29 14.54-11.13 6.74-16.59 16.08-16.39 28.02.2 9.54 3.82 17.5 10.87 23.88 7.05 6.38 15.35 10.05 24.9 11.01-2.17 6.74-4.78 13.48-7.83 20.22zM119.22 31.84c0-7.17 2.61-13.91 7.83-20.22 5.22-6.3 11.63-10.43 19.24-12.38.33 2.06.49 4.12.49 6.18 0 7.39-2.72 14.35-8.15 20.87-5.44 6.52-12.18 10.53-20.22 12.03-.43-2.17-.65-4.34-.65-6.47z" />
    </svg>
  );
}

export function LocalDriveExperiencePage() {
  const modes = [
    {
      title: '1. Stream Mode (Default)',
      subtitle: '0-Byte Local Disk Footprint',
      desc: 'All 10 TB of your cloud files are visible in Windows File Explorer without consuming local hard drive space. Files are streamed on-the-fly directly from the cloud whenever an application reads or opens them.',
      icon: Zap,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      benefits: ['Consumes 0 bytes of local drive space', 'Instant directory listing for 100,000+ files', 'On-demand stream cache'],
    },
    {
      title: '2. Smart Hybrid Mode',
      subtitle: 'Intelligent D: Cache Offloading',
      desc: 'Frequently used files and active projects are cached on high-speed secondary storage (D:\\MasterCloudCache). Cold files are safely evicted when disk thresholds are reached, completely protecting your primary C: drive from bloat.',
      icon: Database,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      benefits: ['Guarantees zero bloat on Windows C: drive', 'High-speed read/write access from NVMe/HDD cache', 'Automatic background LRU cache eviction'],
    },
    {
      title: '3. Full Offline Mirror Mode',
      subtitle: '100% Offline Travel & Disconnected Work',
      desc: 'Pin specific folders or entire directories to keep full local mirrors. Work offline in airplanes, remote areas, or disconnected environments with automatic bi-directional synchronization upon reconnecting.',
      icon: WifiOff,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      benefits: ['Full offline access without Internet', 'Background atomic journal synchronization', 'Automatic conflict detection and resolution'],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-24 select-none">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
          <Laptop className="h-3.5 w-3.5" />
          <span>Windows Local Drive Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
          Mount 10 TB directly into Windows File Explorer.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          MASTER CLOUD transforms your cloud storage into a high-performance Windows virtual drive (<strong className="text-foreground">MASTER CLOUD M:</strong>) with native Explorer integration and zero local disk waste.
        </p>
      </div>

      {/* 3 Storage Modes Breakdown */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            3 Intelligent Virtual Filesystem Modes
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Choose how your files are cached and synchronized on your Windows system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.title}
                className="p-8 rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`h-12 w-12 rounded-2xl ${mode.bg} ${mode.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{mode.title}</h3>
                    <span className="text-xs font-semibold text-primary">{mode.subtitle}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {mode.desc}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    {mode.benefits.map((b) => (
                      <div key={b} className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Windows Context Menu Feature Callout */}
      <div className="rounded-3xl border border-border/80 bg-card p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Shell Integration
          </span>
          <h3 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Windows Right-Click Context Menu
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Manage your cloud assets straight from Windows File Explorer. Right-click any file or directory to pin it offline, free up space, generate secure share links, or inspect version history without opening a web browser.
          </p>
          <div className="space-y-2.5 pt-2">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs font-mono flex items-center justify-between">
              <span>Make available offline (Mirror)</span>
              <span className="text-emerald-500 font-bold">1-Click</span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs font-mono flex items-center justify-between">
              <span>Free up local disk space (Stream)</span>
              <span className="text-blue-500 font-bold">0-Byte Local</span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs font-mono flex items-center justify-between">
              <span>Copy Master Cloud Share Link</span>
              <span className="text-purple-500 font-bold">Instant</span>
            </div>
          </div>
        </div>

        {/* Visual Mockup Box */}
        <div className="p-6 rounded-2xl bg-secondary/30 border border-border/80 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="font-bold text-foreground">Virtual Drive Status (M:)</span>
            <Badge variant="success">ONLINE</Badge>
          </div>
          <div className="space-y-2 text-[11px] text-muted-foreground">
            <div className="flex justify-between">
              <span>Mount Point:</span>
              <span className="font-bold text-foreground">M:\ (or Z:\)</span>
            </div>
            <div className="flex justify-between">
              <span>VFS Protocol:</span>
              <span className="font-bold text-foreground">WebDAV HTTP/1.1 Port 8766</span>
            </div>
            <div className="flex justify-between">
              <span>Active Cache Directory:</span>
              <span className="font-bold text-primary">D:\MasterCloudCache</span>
            </div>
            <div className="flex justify-between">
              <span>Primary C: Drive Impact:</span>
              <span className="font-bold text-emerald-500">0 MB (Completely Isolated)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Apple iPhone & iOS Files Virtual Drive Showcase ── */}
      <div className="rounded-3xl border-2 border-purple-500/40 bg-card p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-xl">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold tracking-wide border border-purple-500/20">
            <AppleIcon className="h-3.5 w-3.5" />
            <span>Apple iOS Native Files Integration</span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Mount 10 TB directly into the iPhone "Files" App
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Turn your iPhone or iPad into a 10 TB powerhouse. Connect directly via WebDAV to mount Master Cloud side-by-side with iCloud Drive and "On My iPhone". Browse, stream 4K movies, and save files from Safari, WhatsApp, and Photos with 0-byte local memory consumption!
          </p>
          <div className="space-y-2.5 pt-2">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs font-mono flex items-center justify-between">
              <span>Apple Files "Connect to Server"</span>
              <span className="text-purple-400 font-bold">Native iOS</span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs font-mono flex items-center justify-between">
              <span>Server Address</span>
              <span className="text-primary font-bold">http://192.168.1.164:8766</span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs font-mono flex items-center justify-between">
              <span>Authentication</span>
              <span className="text-emerald-500 font-bold">Guest (No Password)</span>
            </div>
          </div>
        </div>

        {/* Visual Mockup Box: Apple Files App Simulation */}
        <div className="p-6 rounded-2xl bg-secondary/30 border border-purple-500/30 space-y-4 text-xs shadow-lg">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-purple-400" />
              <span className="font-bold text-foreground">iPhone Files App — Locations</span>
            </div>
            <Badge className="bg-purple-600 text-white text-[10px]">CONNECTED</Badge>
          </div>
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center gap-2.5">
                <span className="text-base">☁️</span>
                <span className="font-medium text-foreground">iCloud Drive</span>
              </div>
              <span className="text-[11px] text-muted-foreground">5 GB Quota</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📱</span>
                <span className="font-medium text-foreground">On My iPhone</span>
              </div>
              <span className="text-[11px] text-muted-foreground">64 GB Internal</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/15 border-2 border-purple-500/40 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🚀</span>
                <div>
                  <div className="font-black text-foreground">MASTER CLOUD</div>
                  <div className="text-[10px] text-purple-400 font-bold">Virtual Network Volume</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-500 block">10.0 TB Free</span>
                <span className="text-[10px] text-muted-foreground">0-Byte Local</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Bottom Banner */}
      <div className="text-center space-y-6 max-w-2xl mx-auto pt-8">
        <h2 className="text-3xl font-black text-foreground">
          Ready to mount 10 TB storage on your devices?
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/download">
            <Button variant="gradient" size="lg" className="rounded-2xl text-xs font-bold gap-2">
              <Download className="h-4 w-4" />
              <span>Download for Windows, Android &amp; iPhone</span>
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="outline" size="lg" className="rounded-2xl text-xs font-bold">
              <span>Get 10 TB Free Account</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
