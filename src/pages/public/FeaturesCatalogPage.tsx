import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid,
  HardDrive,
  Laptop,
  Smartphone,
  Sparkles,
  Share2,
  Shield,
  RefreshCw,
  Search,
  CheckCircle2,
  ArrowRight,
  Upload,
  History,
  Lock,
  Database,
  PieChart,
  WifiOff,
  FolderPlus,
  FileText,
  SlidersHorizontal,
  Film,
  Music,
  Eye,
  Download,
  QrCode,
  Camera,
  FolderOpen,
  Zap,
  Bot,
  Code,
  Archive,
  Play,
  Layers,
  FileCheck,
  CheckSquare,
  Palette,
  Key,
  FolderSync,
  Activity,
  Star,
  Clock,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

function AppleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 170" fill="currentColor" className={className}>
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.73-7.8-12.08-14.15-6.66-9.67-11.87-20.91-15.63-33.72-3.76-12.81-5.64-24.84-5.64-36.08 0-14.74 3.73-26.79 11.19-36.14 7.46-9.35 16.94-14.17 28.44-14.46 4.79 0 10.15 1.25 16.08 3.76 5.93 2.5 9.77 3.82 11.51 3.94 1.52-.12 5.58-1.5 12.18-4.14 6.6-2.63 12.09-3.78 16.48-3.46 12.75.87 22.84 5.72 30.29 14.54-11.13 6.74-16.59 16.08-16.39 28.02.2 9.54 3.82 17.5 10.87 23.88 7.05 6.38 15.35 10.05 24.9 11.01-2.17 6.74-4.78 13.48-7.83 20.22zM119.22 31.84c0-7.17 2.61-13.91 7.83-20.22 5.22-6.3 11.63-10.43 19.24-12.38.33 2.06.49 4.12.49 6.18 0 7.39-2.72 14.35-8.15 20.87-5.44 6.52-12.18 10.53-20.22 12.03-.43-2.17-.65-4.34-.65-6.47z" />
    </svg>
  );
}

export function FeaturesCatalogPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Capabilities' },
    { id: 'platforms', label: 'Windows, Android & iPhone' },
    { id: 'cloud', label: 'Cloud Storage & Quota' },
    { id: 'media', label: 'Media Stream & Downloads' },
    { id: 'ai', label: 'Master AI Intelligence' },
    { id: 'canvas', label: 'Master Canvas Suite' },
    { id: 'sharing', label: 'Sharing & Inflow' },
    { id: 'security', label: 'Security & Zero-Trust' },
  ];

  const features = [
    // ── 1. MULTI-PLATFORM (Windows, Android & iPhone) ─────────────────────────
    {
      category: 'platforms',
      title: 'Native Windows File Explorer Virtual Drive (Z:)',
      desc: 'Mounts MASTER CLOUD (Z:) directly into Windows 10 & 11 File Explorer with zero local disk waste. Drag and drop files like an internal NVMe hard drive.',
      icon: Laptop,
      badge: 'Windows PC',
      highlight: true,
    },
    {
      category: 'platforms',
      title: 'Stream Mode (0-Byte Local Disk Footprint)',
      desc: 'Browse and open your entire 10 TB storage library in Windows Explorer or on mobile without consuming local storage space until files are read.',
      icon: Zap,
      badge: 'Windows & Mobile',
    },
    {
      category: 'platforms',
      title: 'Apple iPhone & iPad Native "Files" App Mount',
      desc: 'Mounts directly into the built-in Apple "Files" (ගොනු) App on iOS via WebDAV. MASTER CLOUD appears right beside iCloud Drive with 10.0 TB Free Storage.',
      icon: AppleIcon,
      badge: 'Apple iOS',
      highlight: true,
    },
    {
      category: 'platforms',
      title: 'Native Android Mobile App (Capacitor 8)',
      desc: 'Dedicated Master Cloud Android APK with hardware back-button handling, status-bar dark theme, and mobile bottom navigation.',
      icon: Smartphone,
      badge: 'Android Phone',
      highlight: true,
    },
    {
      category: 'platforms',
      title: 'Mobile Camera Auto-Backup & Quick Capture',
      desc: 'Instantly take photos or record 4K videos directly from the mobile floating action button (FAB) and upload directly to your 10 TB cloud.',
      icon: Camera,
      badge: 'Android & iOS',
    },
    {
      category: 'platforms',
      title: 'Windows Right-Click Shell Context Menu',
      desc: 'Trigger "Make available offline", "Free up space", and "Share via Master Cloud" straight from Windows File Explorer context menus.',
      icon: SlidersHorizontal,
      badge: 'Windows PC',
    },
    {
      category: 'platforms',
      title: 'Smart Hybrid Cache on D:\\ Storage',
      desc: 'Automatically offloads active staging and cache files to secondary drive D:\\MasterCloudCache, keeping primary Windows C: drive free of bloat.',
      icon: Database,
      badge: 'Windows PC',
    },
    {
      category: 'platforms',
      title: 'Local Wi-Fi Mobile Download Portal & QR Scanner',
      desc: 'Built-in local download server on port 8899 with interactive QR codes for scanning with phone camera to download APK or mount Apple Files instantly.',
      icon: QrCode,
      badge: 'All Devices',
    },

    // ── 2. CLOUD STORAGE & QUOTA ──────────────────────────────────────────────
    {
      category: 'cloud',
      title: '10 TB Permanent Free Storage Allocation',
      desc: '10,995,116,277,760 bytes provisioned for every registered user account with no expiration date, no trial periods, and no credit card required.',
      icon: HardDrive,
      badge: 'Universal',
      highlight: true,
    },
    {
      category: 'cloud',
      title: 'Parallel Multi-Part Chunk Upload Engine',
      desc: 'High-speed chunked upload engine supporting massive files up to 100 GB+ with automatic pause, retry, and resume on connection drops.',
      icon: Upload,
      badge: 'Core Engine',
    },
    {
      category: 'cloud',
      title: 'Instant Global Search & Path Indexing',
      desc: 'Sub-millisecond real-time search indexing across file names, tags, MIME types, extensions, and directory paths for instant asset retrieval.',
      icon: Search,
      badge: 'Productivity',
    },
    {
      category: 'cloud',
      title: 'Continuous Version History & Rollback',
      desc: 'Automatic revision snapshots for every file edit or overwrite, with side-by-side preview and 1-click restoration to any historical state.',
      icon: History,
      badge: 'Data Safety',
    },
    {
      category: 'cloud',
      title: 'Smart Storage Telemetry & Cleanup Optimizer',
      desc: 'Visual storage breakdown charts analyzing large obsolete files, temporary caches, and duplicate files by hash with 1-click cleanup.',
      icon: PieChart,
      badge: 'Analytics',
    },
    {
      category: 'cloud',
      title: 'Duplicate File Detection by Checksum',
      desc: 'Smart scanning engine that detects identical files regardless of file names using SHA-256 content hashes to eliminate wasted storage.',
      icon: FileCheck,
      badge: 'Optimization',
    },
    {
      category: 'cloud',
      title: 'Starred Items & Priority Bookmarks',
      desc: 'Pin critical folders and files for instantaneous access from both desktop sidebar and mobile bottom navigation bar.',
      icon: Star,
      badge: 'Organization',
    },
    {
      category: 'cloud',
      title: 'Recent Activity & Chronological Timeline',
      desc: 'Track recent uploads, edits, shares, and deletions with granular timestamps and file badges.',
      icon: Clock,
      badge: 'Telemetry',
    },
    {
      category: 'cloud',
      title: 'Protected Trash Bin with 30-Day Recovery',
      desc: 'Safe soft-deletion prevents accidental data loss with 1-click restoration or permanent destruction.',
      icon: Trash2,
      badge: 'Safety',
    },
    {
      category: 'cloud',
      title: 'In-Browser ZIP Archiving & Extraction',
      desc: 'Compress multiple files or entire folders into high-speed ZIP archives or extract them directly in the browser without third-party software.',
      icon: Archive,
      badge: 'Utility',
    },

    // ── 3. MEDIA STREAMING & DOWNLOAD CENTER ──────────────────────────────────
    {
      category: 'media',
      title: '4K Ultra-HD Video Streaming Player',
      desc: 'Native video player supporting MP4, WebM, MKV, and MOV with playback speed control, picture-in-picture, and zero buffering.',
      icon: Film,
      badge: 'Streaming',
      highlight: true,
    },
    {
      category: 'media',
      title: 'Hi-Fi Audio Waveform Player',
      desc: 'Play MP3, WAV, FLAC, and AAC audio files with interactive audio waveforms, queue management, and background playback.',
      icon: Music,
      badge: 'Audio',
    },
    {
      category: 'media',
      title: 'High-Resolution Image Gallery & Lightbox',
      desc: 'Full-screen zoom, pan, thumbnail ribbon, and slideshow viewer for PNG, JPG, WebP, SVG, and RAW photo assets.',
      icon: Eye,
      badge: 'Gallery',
    },
    {
      category: 'media',
      title: 'Universal PDF & Document Reader',
      desc: 'In-app document viewer with text search, page navigation, print, and continuous scroll for PDF, TXT, and Markdown files.',
      icon: FileText,
      badge: 'Documents',
    },
    {
      category: 'media',
      title: 'Advanced Download Center Drawer',
      desc: 'Dockable download manager with live speed indicators, progress percentage, pause/resume controls, and multi-file batch downloading.',
      icon: Download,
      badge: 'Downloads',
      highlight: true,
    },

    // ── 4. MASTER AI INTELLIGENCE ─────────────────────────────────────────────
    {
      category: 'ai',
      title: 'Master AI Workspace Assistant',
      desc: 'Context-aware AI assistant integrated directly into your drive. Ask questions about your documents, generate summaries, or draft content.',
      icon: Bot,
      badge: 'Artificial Intelligence',
      highlight: true,
    },
    {
      category: 'ai',
      title: 'Natural Language Search & Querying',
      desc: 'Search your storage using conversational queries like "find invoice from last week" or "show photos from my trip".',
      icon: Sparkles,
      badge: 'AI Search',
    },
    {
      category: 'ai',
      title: 'Automated Document Summarization',
      desc: 'Generate instant executive summaries and bulleted key points from lengthy PDFs, reports, and text documents in seconds.',
      icon: FileText,
      badge: 'AI Summary',
    },
    {
      category: 'ai',
      title: 'Smart Content Tagging & Classification',
      desc: 'Master AI automatically categorizes uploaded documents and media by topic, industry, and file type for zero-effort organization.',
      icon: Sparkles,
      badge: 'AI Tagging',
    },

    // ── 5. MASTER CANVAS PRODUCTIVITY SUITE ───────────────────────────────────
    {
      category: 'canvas',
      title: 'Master Docs Rich Document Editor',
      desc: 'Full-featured collaborative word processor with rich typography, headings, tables, blockquotes, and automatic cloud saving.',
      icon: FileText,
      badge: 'Office Suite',
    },
    {
      category: 'canvas',
      title: 'Master Sheets Formula Spreadsheet',
      desc: 'High-speed tabular computation engine with formulas (SUM, AVG, IF), cell styling, mathematical calculations, and CSV export.',
      icon: Grid,
      badge: 'Office Suite',
    },
    {
      category: 'canvas',
      title: 'Master Slides Presentation Deck Builder',
      desc: 'Craft professional presentations with slide layouts, rich text, vector shapes, animations, and full-screen presentation mode.',
      icon: Sparkles,
      badge: 'Office Suite',
    },
    {
      category: 'canvas',
      title: 'Master Draw Infinite Vector Canvas',
      desc: 'Infinite architectural whiteboard for system flowcharts, software architecture diagrams, mind maps, and wireframing.',
      icon: Palette,
      badge: 'Whiteboard',
    },
    {
      category: 'canvas',
      title: 'Master Code In-Browser IDE',
      desc: 'Developer code editor with syntax highlighting for 30+ languages (JS, TS, Python, HTML, CSS, Rust, Go), line numbers, and dark theme.',
      icon: Code,
      badge: 'Developer IDE',
    },

    // ── 6. SHARING, COLLABORATION & INFLOW ────────────────────────────────────
    {
      category: 'sharing',
      title: 'Password-Protected Public Share Links',
      desc: 'Create secure public links for any file or folder protected with custom secret PIN passwords and view-only permissions.',
      icon: Share2,
      badge: 'Sharing',
      highlight: true,
    },
    {
      category: 'sharing',
      title: 'Link Expiration Timers (Auto-Revoke)',
      desc: 'Set automatic expiration times on shared links (1 Hour, 24 Hours, 7 Days, or 30 Days) after which links automatically self-destruct.',
      icon: Clock,
      badge: 'Sharing Security',
    },
    {
      category: 'sharing',
      title: 'Client File Request Inflow Portals',
      desc: 'Generate a public file request link that allows clients or friends to upload files directly into your selected folder with zero account required.',
      icon: FolderPlus,
      badge: 'Inflow Portal',
      highlight: true,
    },
    {
      category: 'sharing',
      title: 'QR Code Sharing & Mobile Transfers',
      desc: 'Instant QR code generation for any share link so people can scan with their smartphone camera to open or download assets on the go.',
      icon: QrCode,
      badge: 'Mobile Sharing',
    },
    {
      category: 'sharing',
      title: 'View-Only & Download Prevention Mode',
      desc: 'Lock public shares to view-only mode, disabling the download button to protect sensitive presentations and creative assets.',
      icon: Lock,
      badge: 'DRM & Privacy',
    },

    // ── 7. SECURITY & ZERO-TRUST ARCHITECTURE ─────────────────────────────────
    {
      category: 'security',
      title: 'AES-256 GCM Envelope Encryption',
      desc: 'All stored assets and multi-part chunks are encrypted with AES-256 in Galois/Counter Mode at rest and TLS 1.3 in transit.',
      icon: Lock,
      badge: 'Encryption',
      highlight: true,
    },
    {
      category: 'security',
      title: 'PostgreSQL Row-Level Security (RLS)',
      desc: 'Hardware-enforced database isolation guarantees that each tenant can only ever read and query their own cryptographically authenticated assets.',
      icon: Shield,
      badge: 'Database Isolation',
    },
    {
      category: 'security',
      title: 'SHA-256 Bit-Rot & Integrity Verification',
      desc: 'Every file chunk is validated against cryptographic SHA-256 hashes during transfer and storage to guarantee 100% data integrity.',
      icon: CheckCircle2,
      badge: 'Bit-Rot Shield',
    },
    {
      category: 'security',
      title: 'Windows DPAPI Secure Credential Vault',
      desc: 'Local desktop companion tokens and session credentials are encrypted using Microsoft Data Protection API (DPAPI) with machine-level isolation.',
      icon: Key,
      badge: 'Endpoint Security',
    },
    {
      category: 'security',
      title: 'Live Security Telemetry & Session Management',
      desc: 'Monitor active sessions, inspect client IP addresses, browser agents, and revoke unwanted logins with 1-click remote logout.',
      icon: Activity,
      badge: 'Zero-Trust Audit',
    },
    {
      category: 'security',
      title: 'Crash-Safe SQLite VFS Local Journal',
      desc: 'Local desktop drive operations are recorded in an atomic SQLite WAL journal to guarantee recovery without data loss across power outages.',
      icon: Database,
      badge: 'Crash Resilience',
    },
  ];

  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.badge && f.badge.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-12 select-none">
      
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide border border-primary/20">
          <Grid className="h-3.5 w-3.5" />
          <span>{features.length} ENTERPRISE CAPABILITIES</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
          Everything you need in a modern cloud operating system.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Explore the full architectural capabilities of Master Cloud across Windows (Z:), Apple iPhone (Files App), Android APK, Cloud Workspace, and Security.
        </p>

        {/* Live Search Bar */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all features (e.g., iPhone, Z: Drive, AI, 10 TB, Backup)..."
            className="pl-10 h-12 rounded-2xl bg-secondary/40 border-border/70 text-xs font-medium focus-visible:ring-primary shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Category Filter Pills ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((c) => {
          const count = c.id === 'all'
            ? features.length
            : features.filter(f => f.category === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === c.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span>{c.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeCategory === c.id ? 'bg-primary-foreground/20 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      {filteredFeatures.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-secondary/20 border border-border space-y-3">
          <Search className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-bold text-foreground">No features matched "{searchQuery}"</h3>
          <p className="text-xs text-muted-foreground">Try searching for keywords like "Windows", "iPhone", "Storage", or "AI".</p>
          <Button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} variant="outline" size="sm" className="rounded-xl">
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`p-6 rounded-3xl border transition-all space-y-4 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 duration-200 ${
                  f.highlight
                    ? 'border-primary/50 bg-gradient-to-b from-primary/5 via-card to-card shadow-md'
                    : 'border-border/80 bg-card shadow-sm hover:border-primary/30'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
                      <Icon className="h-5 w-5" />
                    </div>
                    {f.badge && (
                      <Badge variant="outline" className="text-[10px] font-bold border-border/80">
                        {f.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-extrabold text-base text-foreground leading-snug">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CTA Bottom Banner ─────────────────────────────────────────────── */}
      <div className="text-center space-y-6 max-w-3xl mx-auto pt-10 pb-6 border-t border-border/60">
        <h2 className="text-3xl sm:text-4xl font-black text-foreground">
          Ready to experience the future of cloud storage?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
          Get started in under 30 seconds with 10 TB permanent free storage across Web, Windows, Android, and iPhone.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/signup">
            <Button variant="gradient" size="lg" className="h-12 px-7 rounded-2xl text-xs font-bold gap-2 shadow-lg shadow-primary/25">
              <span>Claim 10 TB Free Storage</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/download">
            <Button variant="outline" size="lg" className="h-12 px-7 rounded-2xl text-xs font-bold gap-2">
              <Download className="h-4 w-4" />
              <span>Download for PC &amp; Mobile</span>
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
