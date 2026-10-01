import React from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Laptop,
  HardDrive,
  CheckCircle2,
  Terminal,
  Shield,
  Zap,
  ArrowRight,
  Monitor,
  Cpu,
  Layers,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function DownloadPage() {
  const handleDownloadLauncher = () => {
    toast.success('Starting download for Master Cloud Windows Client Companion...');
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'MasterCloud-Windows-Companion.zip';
    toast.info('Companion scripts (Start-MasterCloud-Drive.vbs, .bat) are ready in your repository root.');
  };

  const comparisonRows = [
    { feature: '10 TB Permanent Free Storage', web: true, drive: true },
    { feature: 'Stream Mode (0-byte local disk usage)', web: false, drive: true },
    { feature: 'Windows File Explorer Integration (M:)', web: false, drive: true },
    { feature: 'Smart Hybrid Cache on D:\\ Drive', web: false, drive: true },
    { feature: 'Windows Right-Click Context Menu Actions', web: false, drive: true },
    { feature: 'Master Canvas Productivity Suite (Docs, Sheets, Slides)', web: true, drive: true },
    { feature: 'Public Share Links & Password Walls', web: true, drive: true },
    { feature: 'File Request Dropboxes', web: true, drive: false },
    { feature: 'Continuous Version History Rollback', web: true, drive: true },
    { feature: 'Full Offline Working Mirror', web: false, drive: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-24 select-none">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
          <Download className="h-3.5 w-3.5" />
          <span>Windows Client & Virtual Drive Companion</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
          Download MASTER CLOUD for Windows.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Install the desktop companion to mount your 10 TB free cloud directly into Windows File Explorer with zero local disk footprint.
        </p>
      </div>

      {/* Main Download Card */}
      <div className="max-w-3xl mx-auto rounded-3xl border-2 border-primary bg-card p-8 sm:p-12 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Laptop className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="text-xl font-bold text-foreground">Master Cloud Windows Companion</h3>
                <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Windows 10 / Windows 11 (64-bit) â€¢ Native VFS & WebDAV Driver
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0">
            <Button
              disabled
              variant="outline"
              size="lg"
              className="rounded-2xl text-xs font-bold gap-2 px-8 h-12 cursor-not-allowed opacity-60"
              title="Desktop installer is not yet available."
            >
              <Download className="h-4 w-4" />
              <span>Download for Windows</span>
            </Button>
            <span className="text-[11px] text-amber-500 font-semibold">
              🚧 Desktop installer coming soon
            </span>
          </div>
        </div>

        {/* System Requirements & Quick Specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
            <span className="text-muted-foreground">Supported OS:</span>
            <p className="font-bold text-foreground">Windows 10 (20H2+) / Windows 11</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
            <span className="text-muted-foreground">Local Disk Required:</span>
            <p className="font-bold text-emerald-500">50 MB (0 B in Stream Mode)</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
            <span className="text-muted-foreground">Architecture:</span>
            <p className="font-bold text-foreground">x64 / ARM64 Compatible</p>
          </div>
        </div>

        {/* Quick Launch Scripts Info */}
        <div className="p-5 rounded-2xl bg-secondary/20 border border-border/60 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Terminal className="h-4 w-4" />
            <span>Companion Launchers Included in Workspace</span>
          </div>
          <p className="text-muted-foreground leading-relaxed text-[11px]">
            The repository includes automated background daemon scripts:
          </p>
          <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-foreground">
              Start-MasterCloud-Drive.vbs (Silent Background Mount)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-foreground">
              Start-MasterCloud-Drive.bat (Interactive Console)
            </span>
          </div>
        </div>
      </div>

      {/* 3-Step Setup Guide */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            Up and Running in 60 Seconds
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Three simple steps to connect your 10 TB cloud directly into Windows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
              01
            </div>
            <h3 className="font-bold text-base text-foreground">Create Account & Download</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sign up for your free 10 TB allocation and download the Master Cloud Windows Companion package.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-sm">
              02
            </div>
            <h3 className="font-bold text-base text-foreground">Launch Virtual Drive</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Run the background launcher. The VFS driver starts on port 8766 and mounts <strong className="text-foreground">MASTER CLOUD (M:)</strong>.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-sm">
              03
            </div>
            <h3 className="font-bold text-base text-foreground">Use in File Explorer</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Open Windows File Explorer and browse your 10 TB storage. Drag, drop, edit, and stream seamlessly.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            Web Experience vs Windows Local Drive
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Choose the interface that matches your daily workflow or use both seamlessly.
          </p>
        </div>

        <div className="rounded-3xl border border-border/80 overflow-hidden bg-card shadow-sm">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Feature & Capability</th>
                <th className="px-6 py-4 text-center">Master Cloud Web</th>
                <th className="px-6 py-4 text-center">Windows Local Drive (M:)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="hover:bg-accent/30 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-foreground">{row.feature}</td>
                  <td className="px-6 py-3.5 text-center">
                    {row.web ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground text-xs">â€”</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    {row.drive ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground text-xs">â€”</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

