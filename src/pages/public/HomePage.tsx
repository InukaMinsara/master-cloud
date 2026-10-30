import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HardDrive,
  Laptop,
  Cloud,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Folder,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckSquare,
  Palette,
  BookOpen,
  Eye,
  Download,
  Share2,
  Layers,
  Sparkles,
  Search,
  Lock,
  Wifi,
  WifiOff,
  Activity,
  Maximize2,
  ChevronRight,
  Database,
  Sliders,
  Check,
  Play,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function HomePage() {
  const [activeHeroTab, setActiveHeroTab] = useState<'windows' | 'web'>('windows');
  const [selectedExplorerItem, setSelectedExplorerItem] = useState<string>('folder-projects');

  const explorerItems = [
    { id: 'folder-documents', name: 'Documents & Reports', type: 'folder', size: '14.2 GB', status: 'Stream (0 B on disk)', date: 'Today, 2:40 PM' },
    { id: 'folder-projects', name: 'Software Projects', type: 'folder', size: '38.6 GB', status: 'Smart Cached (D:)', date: 'Yesterday' },
    { id: 'folder-media', name: 'Media & 4K Assets', type: 'folder', size: '124.8 GB', status: 'Stream (0 B on disk)', date: 'Sep 28, 2026' },
    { id: 'file-doc', name: 'Master_Platform_Spec.mdoc', type: 'doc', size: '4.2 MB', status: 'Offline Pinned', date: 'Just now' },
    { id: 'file-sheet', name: 'Financial_Projections_2027.msheet', type: 'sheet', size: '1.8 MB', status: 'Stream (0 B on disk)', date: 'Today, 11:15 AM' },
    { id: 'file-slide', name: 'Cloud_Architecture_Keynote.mslide', type: 'slide', size: '18.4 MB', status: 'Stream (0 B on disk)', date: 'Sep 25, 2026' },
  ];

  const storageModes = [
    {
      id: 'stream',
      title: 'Stream Mode (Default)',
      badge: '0-Byte Local Disk Footprint',
      desc: 'Browse your entire 10 TB cloud directly in Windows File Explorer without consuming local disk space. Files stream on demand instantly when opened.',
      icon: Zap,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      id: 'hybrid',
      title: 'Smart Hybrid Cache',
      badge: 'High-Speed NVMe & D: Isolation',
      desc: 'Frequently used files are automatically cached on D:\\MasterCloudCache. Cold files are safely evicted, ensuring your C: system drive never runs out of space.',
      icon: Database,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
    {
      id: 'mirror',
      title: 'Full Offline Mirror Mode',
      badge: '100% Offline Resilience',
      desc: 'Pin folders for full local replication. Edit and create files offline with seamless bi-directional atomic synchronization the moment you reconnect.',
      icon: WifiOff,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  const canvasApps = [
    { name: 'Master Docs', desc: 'Rich collaborative document editor with version snapshots.', icon: FileText, color: '#2563eb' },
    { name: 'Master Sheets', desc: 'High-speed spreadsheet engine with formula computing.', icon: FileSpreadsheet, color: '#059669' },
    { name: 'Master Slides', desc: 'Modern presentation deck builder with live transitions.', icon: Presentation, color: '#d97706' },
    { name: 'Master Forms', desc: 'Interactive forms and survey data collection suite.', icon: CheckSquare, color: '#7c3aed' },
    { name: 'Master Draw', desc: 'Vector diagramming and architectural whiteboard.', icon: Palette, color: '#e11d48' },
    { name: 'Master Notes', desc: 'Categorized markdown notebooks and knowledge base.', icon: BookOpen, color: '#4f46e5' },
  ];

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 overflow-hidden">
      {/* ─── 01. HERO SECTION ─── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12">
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide shadow-sm animate-in fade-in zoom-in duration-500">
            <Sparkles className="h-3.5 w-3.5" />
            <span>10 TB Permanent Free Storage • Windows &amp; Android Apps Available</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
            Your files. Your cloud.{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-primary">
              Your Windows Drive.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            The next-generation cloud operating platform. Mount your entire <strong className="text-foreground">10 TB free cloud</strong> directly into Windows File Explorer with zero local disk footprint, or access your workspace anywhere with real-time web productivity.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Link to="/signup">
              <Button
                variant="gradient"
                size="lg"
                className="h-14 px-8 rounded-2xl text-sm font-bold gap-2 shadow-xl shadow-primary/25 hover:scale-105 transition-transform"
              >
                <span>Claim 10 TB Free Cloud</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link to="/local-drive">
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-2xl text-sm font-bold gap-2.5 border-border hover:bg-secondary/80 hover:scale-105 transition-transform"
              >
                <Laptop className="h-4 w-4 text-blue-500" />
                <span>Explore Windows Local Drive (M:)</span>
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 10 TB Universal Allocation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Zero Disk Bloat (Stream Mode)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 256-Bit AES Encryption
            </span>
          </div>
        </div>

        {/* ─── 02. INTERACTIVE PRODUCT HERO SHOWCASE ─── */}
        <div className="mt-12 sm:mt-16">
          {/* Dual Toggle Bar */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex p-1.5 rounded-2xl bg-secondary/70 border border-border/80 backdrop-blur-xl shadow-lg">
              <button
                onClick={() => setActiveHeroTab('windows')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeHeroTab === 'windows'
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Laptop className="h-4 w-4" />
                <span>Windows File Explorer (M:)</span>
              </button>
              <button
                onClick={() => setActiveHeroTab('web')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeHeroTab === 'web'
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Cloud className="h-4 w-4" />
                <span>Web Operating System</span>
              </button>
            </div>
          </div>

          {/* Interactive Mockup Container */}
          <div className="relative rounded-3xl border border-border/90 bg-card/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Window Titlebar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-muted/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-3 font-semibold text-muted-foreground flex items-center gap-1.5 font-mono text-[11px]">
                  {activeHeroTab === 'windows' ? (
                    <>
                      <Laptop className="h-3.5 w-3.5 text-blue-500" />
                      <span>Windows File Explorer — MASTER CLOUD (M:) [10.0 TB Total]</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="h-3.5 w-3.5 text-primary" />
                      <span>https://app.mastercloud.io/drive — Enterprise Cloud OS</span>
                    </>
                  )}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
                <span className="flex items-center gap-1 text-emerald-500 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>VFS DRIVER ONLINE</span>
                </span>
                <span>Port 8766</span>
              </div>
            </div>

            {/* TAB CONTENT 1: WINDOWS FILE EXPLORER MOCKUP */}
            {activeHeroTab === 'windows' && (
              <div className="grid grid-cols-1 md:grid-cols-4 min-h-[480px]">
                {/* Left Navigation Tree */}
                <div className="border-r border-border/60 bg-secondary/20 p-4 space-y-4 hidden md:block select-none text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Access</span>
                    <div className="p-2 rounded-xl bg-primary/10 text-primary font-bold flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span>MASTER CLOUD (M:)</span>
                    </div>
                    <div className="px-2 py-1.5 text-muted-foreground flex items-center gap-2 hover:bg-accent rounded-lg">
                      <Folder className="h-3.5 w-3.5 text-amber-500" />
                      <span>Documents</span>
                    </div>
                    <div className="px-2 py-1.5 text-muted-foreground flex items-center gap-2 hover:bg-accent rounded-lg">
                      <Folder className="h-3.5 w-3.5 text-amber-500" />
                      <span>Projects</span>
                    </div>
                    <div className="px-2 py-1.5 text-muted-foreground flex items-center gap-2 hover:bg-accent rounded-lg">
                      <Folder className="h-3.5 w-3.5 text-amber-500" />
                      <span>Media Assets</span>
                    </div>
                  </div>

                  {/* Drive Capacity Meter */}
                  <div className="p-3.5 rounded-2xl bg-card border border-border/70 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-foreground">Drive (M:) Quota</span>
                      <span className="text-emerald-500 font-bold">10 TB Free</span>
                    </div>
                    <Progress value={1.5} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">
                      15.4 GB used of 10,240 GB (0% space consumed on local disk)
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-400 space-y-1">
                    <span className="font-bold block flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" /> Stream Mode Active
                    </span>
                    <span>Files take 0 bytes locally until you open them.</span>
                  </div>
                </div>

                {/* Right Explorer File Grid & Table */}
                <div className="col-span-3 p-4 sm:p-6 space-y-4">
                  {/* Explorer Top Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-semibold text-foreground">This PC</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="font-bold text-primary">MASTER CLOUD (M:)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-[11px] flex items-center gap-1">
                        <Check className="h-3 w-3" /> Synchronized
                      </span>
                    </div>
                  </div>

                  {/* File Items Table */}
                  <div className="rounded-2xl border border-border/70 overflow-hidden bg-card">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="px-4 py-2.5">Name</th>
                          <th className="px-4 py-2.5">Status & Mode</th>
                          <th className="px-4 py-2.5 hidden sm:table-cell">Size</th>
                          <th className="px-4 py-2.5 hidden md:table-cell">Date Modified</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {explorerItems.map((item) => {
                          const isSelected = selectedExplorerItem === item.id;
                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedExplorerItem(item.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent/40'
                              }`}
                            >
                              <td className="px-4 py-3 flex items-center gap-3">
                                {item.type === 'folder' ? (
                                  <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                                ) : item.type === 'doc' ? (
                                  <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                ) : item.type === 'sheet' ? (
                                  <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Presentation className="h-4 w-4 text-amber-500 shrink-0" />
                                )}
                                <span className="truncate">{item.name}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md ${
                                    item.status.includes('Stream')
                                      ? 'bg-blue-500/10 text-blue-500 font-bold'
                                      : item.status.includes('Offline')
                                      ? 'bg-emerald-500/10 text-emerald-500 font-bold'
                                      : 'bg-indigo-500/10 text-indigo-500 font-bold'
                                  }`}
                                >
                                  {item.status.includes('Stream') && <Zap className="h-3 w-3" />}
                                  {item.status.includes('Offline') && <CheckCircle2 className="h-3 w-3" />}
                                  {item.status.includes('Smart') && <Database className="h-3 w-3" />}
                                  <span>{item.status}</span>
                                </span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground font-mono hidden sm:table-cell">
                                {item.size}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                {item.date}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Windows Context Menu Simulation Callout */}
                  <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Laptop className="h-4 w-4" />
                      </span>
                      <span className="text-muted-foreground">
                        Right-click any file in Windows Explorer for <strong className="text-foreground">"Make available offline"</strong>, <strong className="text-foreground">"Free up space"</strong>, and <strong className="text-foreground">"Share via Master Cloud"</strong>.
                      </span>
                    </div>
                    <Link to="/local-drive" className="text-primary font-bold hover:underline shrink-0 flex items-center gap-1">
                      <span>See All Drive Modes</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: WEB OPERATING SYSTEM MOCKUP */}
            {activeHeroTab === 'web' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl border border-border/80 bg-secondary/30 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Storage Allocation</span>
                    <h3 className="text-3xl font-black text-foreground">10,240 GB</h3>
                    <p className="text-xs text-emerald-500 font-semibold">Universal 10 TB Free Quota Active</p>
                  </div>

                  <div className="p-5 rounded-2xl border border-border/80 bg-secondary/30 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Encryption & Isolation</span>
                    <h3 className="text-3xl font-black text-foreground">AES-256 GCM</h3>
                    <p className="text-xs text-primary font-semibold">PostgreSQL Row-Level Security Protected</p>
                  </div>

                  <div className="p-5 rounded-2xl border border-border/80 bg-secondary/30 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Productivity Suite</span>
                    <h3 className="text-3xl font-black text-foreground">Master Canvas</h3>
                    <p className="text-xs text-indigo-500 font-semibold">Docs, Sheets, Slides, Forms, Draw, Notes</p>
                  </div>
                </div>

                {/* Web Canvas Suite Apps Carousel */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Included Master Canvas Productivity Editors
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {canvasApps.map((app) => {
                      const Icon = app.icon;
                      return (
                        <div key={app.name} className="p-3.5 rounded-2xl border border-border/70 bg-card hover:border-primary/50 transition-colors space-y-2 text-center">
                          <div
                            className="h-10 w-10 mx-auto rounded-xl flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: `${app.color}15`, color: app.color }}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <h5 className="font-bold text-xs text-foreground">{app.name}</h5>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  <span>Web App runs on any browser with real-time IndexedDB & Supabase synchronization.</span>
                  <Link to="/cloud" className="text-primary font-bold hover:underline flex items-center gap-1">
                    <span>Explore Cloud Web Features</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 03. UNIVERSAL 10 TB FREE PROMISE SECTION ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card to-secondary/30 p-8 sm:p-12 lg:p-16 space-y-12">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
              Guaranteed Storage Policy
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              10 TB Free Storage for Every Human. No Exceptions.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Big tech gives you 15 GB and immediately badgers you for subscriptions. MASTER CLOUD gives every user a permanent <strong className="text-foreground">10,995,116,277,760 bytes (10 TB)</strong> of high-speed cloud storage. Zero trials, zero paywalls, and zero price hikes.
            </p>
          </div>

          {/* Comparison Cards: 15 GB vs 10,240 GB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Standard Big Tech Cloud */}
            <div className="p-8 rounded-3xl border border-border/60 bg-muted/20 space-y-6 opacity-75">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Standard Big Tech Cloud</h3>
                  <span className="text-xs text-muted-foreground">Google Drive / OneDrive / Dropbox</span>
                </div>
                <Badge variant="secondary" className="text-xs">15 GB Quota</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>Typical Storage:</span>
                  <span className="font-bold text-foreground">15 GB</span>
                </div>
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>Annual Subscription Cost:</span>
                  <span className="font-bold text-rose-500">$120 – $240 / yr</span>
                </div>
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>Stream Mode Support:</span>
                  <span className="text-muted-foreground">Paid Enterprise Only</span>
                </div>
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>Data Mining for Ads:</span>
                  <span className="text-rose-500 font-semibold">Yes</span>
                </div>
              </div>
            </div>

            {/* MASTER CLOUD Platform */}
            <div className="relative p-8 rounded-3xl border-2 border-primary bg-card shadow-2xl shadow-primary/10 space-y-6">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-black shadow-md">
                STANDARD FOR ALL USERS
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground">MASTER CLOUD</h3>
                  <span className="text-xs text-primary font-semibold">Universal Free Operating Platform</span>
                </div>
                <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
                  10,240 GB (10 TB)
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Guaranteed Free Storage:</span>
                  <span className="font-black text-emerald-500 text-sm">10 TB (Permanent)</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Subscription Fee:</span>
                  <span className="font-bold text-emerald-500">$0.00 Forever</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Windows Virtual Drive (M:):</span>
                  <span className="font-bold text-primary">Included (0-Byte Stream Mode)</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Privacy & Zero-Knowledge:</span>
                  <span className="font-bold text-foreground">Private by Default • No Ads</span>
                </div>
              </div>
            </div>
          </div>

          {/* 10 TB Capacity Infographic */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/60">
            <div className="space-y-1">
              <h4 className="text-2xl font-black text-foreground">2,500,000+</h4>
              <p className="text-xs text-muted-foreground">High-Resolution Photos</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-2xl font-black text-foreground">2,000+</h4>
              <p className="text-xs text-muted-foreground">Full HD 1080p Movies</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-2xl font-black text-foreground">100,000,000+</h4>
              <p className="text-xs text-muted-foreground">Source Code Lines & Docs</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-2xl font-black text-emerald-500">100% Free</h4>
              <p className="text-xs text-muted-foreground">Universal Cloud Access</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 04. WINDOWS LOCAL DRIVE EXPERIENCE ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Native Windows Integration
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Mounts as a Real Local Drive. Not Just a Sync Folder.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            MASTER CLOUD appears directly in Windows 10 and Windows 11 File Explorer as <strong className="text-foreground">MASTER CLOUD (M:)</strong>. It behaves exactly like an internal NVMe hard drive, supported by 3 intelligent storage modes.
          </p>
        </div>

        {/* 3 Storage Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {storageModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                className="rounded-3xl border border-border/80 bg-card p-8 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`h-12 w-12 rounded-2xl ${mode.bg} ${mode.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{mode.title}</h3>
                    <Badge variant="outline" className="text-[10px] mt-1 font-semibold">
                      {mode.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <Link
                    to="/local-drive"
                    className="text-xs font-bold text-primary hover:underline flex items-center justify-between"
                  >
                    <span>Read Technical Specification</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Windows Context Menu & Shell Showcase */}
        <div className="rounded-3xl border border-border/80 bg-secondary/20 p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <h3 className="text-xl font-bold text-foreground">
              Windows Context Menu & Right-Click Shell Integration
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Right-click any file or directory in Windows File Explorer to trigger Master Cloud actions. Toggle offline status, generate secure share links, inspect version history, or open assets in Master Canvas with zero context switching.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary" className="text-[11px]">Make Available Offline</Badge>
              <Badge variant="secondary" className="text-[11px]">Free Up Local Space</Badge>
              <Badge variant="secondary" className="text-[11px]">Share via Master Cloud</Badge>
              <Badge variant="secondary" className="text-[11px]">View Version History</Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link to="/download">
              <Button variant="gradient" size="lg" className="rounded-2xl text-xs font-bold gap-2 shrink-0">
                <Laptop className="h-4 w-4" />
                <span>Windows Desktop Client</span>
              </Button>
            </Link>
            <Link to="/download">
              <Button variant="outline" size="lg" className="rounded-2xl text-xs font-bold gap-2 shrink-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                <Smartphone className="h-4 w-4 text-emerald-500" />
                <span>Android Mobile App</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 05. MASTER CANVAS PRODUCTIVITY SUITE ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Productivity & Creation Suite
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Master Canvas. Create Everything in One Place.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Every file created in Master Canvas is automatically saved directly to your 10 TB Master Cloud Drive with instant auto-save and continuous version snapshots.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {canvasApps.map((app) => {
            const Icon = app.icon;
            return (
              <div
                key={app.name}
                className="p-6 rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-lg transition-all space-y-4 group"
              >
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                  style={{ backgroundColor: `${app.color}15`, color: app.color }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {app.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 06. ARCHITECTURE & ZERO-TRUST SECURITY ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/80 bg-card p-8 sm:p-12 space-y-10">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
              Security Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              Enterprise-Grade Protection & Zero-Trust Isolation
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your files belong to you. We apply defense-in-depth cryptographic compartmentalization across all storage nodes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 p-5 rounded-2xl bg-secondary/30 border border-border/60">
              <Shield className="h-5 w-5 text-blue-500" />
              <h4 className="font-bold text-sm text-foreground">AES-256 GCM Encryption</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Military-grade envelope encryption at rest and TLS 1.3 cryptographic tunnels in transit.
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-secondary/30 border border-border/60">
              <Lock className="h-5 w-5 text-emerald-500" />
              <h4 className="font-bold text-sm text-foreground">PostgreSQL RLS Isolation</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Database-enforced Row-Level Security policies guarantee total tenant separation.
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-secondary/30 border border-border/60">
              <Zap className="h-5 w-5 text-amber-500" />
              <h4 className="font-bold text-sm text-foreground">Resumable Chunk Engine</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multi-part parallel chunking with SHA-256 block hash validation and automatic retry.
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-secondary/30 border border-border/60">
              <Activity className="h-5 w-5 text-purple-500" />
              <h4 className="font-bold text-sm text-foreground">Zero Data Monetization</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No third-party trackers, no advertising algorithms, and zero unauthorized telemetry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 07. FINAL CALL TO ACTION ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-primary p-10 sm:p-16 text-center text-white shadow-2xl space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Ready to claim your 10 TB free cloud?
            </h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              Create your account in 30 seconds. Mount your Windows drive, install on Android, or start collaborating on the web.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/signup">
              <Button
                size="lg"
                className="h-14 px-8 rounded-2xl bg-white text-blue-600 hover:bg-white/95 font-black text-sm shadow-xl hover:scale-105 transition-transform"
              >
                <span>Get Started Free (10 TB)</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/download">
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-2xl border-white/40 text-white hover:bg-white/10 font-bold text-sm hover:scale-105 transition-transform"
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Download Apps (Windows &amp; Android)</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
