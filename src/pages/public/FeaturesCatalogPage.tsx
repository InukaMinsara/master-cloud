import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid,
  HardDrive,
  Laptop,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function FeaturesCatalogPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Capabilities' },
    { id: 'cloud', label: 'Cloud Storage & Quota' },
    { id: 'windows', label: 'Windows Local Drive (M:)' },
    { id: 'canvas', label: 'Master Canvas Suite' },
    { id: 'sharing', label: 'Sharing & Inflow' },
    { id: 'security', label: 'Security & Zero-Trust' },
  ];

  const features = [
    {
      category: 'cloud',
      title: '10 TB Permanent Free Storage Allocation',
      desc: '10,995,116,277,760 bytes provisioned for every registered user account with no expiration and no credit card required.',
      icon: HardDrive,
    },
    {
      category: 'cloud',
      title: 'Parallel Multi-Part Chunk Uploads',
      desc: 'High-speed chunked upload engine supporting massive files up to 100 GB+ with auto-resume on network interruption.',
      icon: Upload,
    },
    {
      category: 'cloud',
      title: 'Global Instant Search & Tag Resolution',
      desc: 'Sub-millisecond indexing across file names, tags, file types, and directory paths for seamless asset retrieval.',
      icon: Search,
    },
    {
      category: 'cloud',
      title: 'Continuous Version History Rollback',
      desc: 'Automatic revision snapshots for every modification, with instant preview and 1-click restoration.',
      icon: History,
    },
    {
      category: 'cloud',
      title: 'Smart Storage Cleanup Optimizer',
      desc: 'Automated telemetry detecting large obsolete assets, temporary caches, and duplicate files by hash.',
      icon: PieChart,
    },
    {
      category: 'windows',
      title: 'Native Windows File Explorer Virtual Drive',
      desc: 'Mounts directly to MASTER CLOUD (M:) in Windows 10 & 11, behaving like a local NVMe drive.',
      icon: Laptop,
    },
    {
      category: 'windows',
      title: 'Stream Mode (0-Byte Local Disk Footprint)',
      desc: 'Browse and open your entire 10 TB storage without consuming local drive space until files are read.',
      icon: HardDrive,
    },
    {
      category: 'windows',
      title: 'Smart Hybrid Cache on D:\\ Storage',
      desc: 'Offloads active cache files to secondary drive D:\\MasterCloudCache, keeping primary C: drive clean.',
      icon: Database,
    },
    {
      category: 'windows',
      title: 'Windows Right-Click Shell Context Menu',
      desc: 'Trigger "Make available offline", "Free up space", and "Share via Master Cloud" straight from File Explorer.',
      icon: SlidersHorizontal,
    },
    {
      category: 'canvas',
      title: 'Master Docs & Word Editor',
      desc: 'Collaborative rich document editor with typography formatting, tables, and cloud auto-save.',
      icon: FileText,
    },
    {
      category: 'canvas',
      title: 'Master Sheets & Excel Spreadsheet',
      desc: 'High-speed tabular computation engine with mathematical formulas, cell formatting, and CSV export.',
      icon: Grid,
    },
    {
      category: 'canvas',
      title: 'Master Slides Presentation Deck Builder',
      desc: 'Build presentation decks with rich slides, layouts, vector elements, and fullscreen presentation mode.',
      icon: Sparkles,
    },
    {
      category: 'canvas',
      title: 'Master Draw Architectural Whiteboard',
      desc: 'Infinite vector diagramming canvas for system architecture diagrams, flowcharts, and sketches.',
      icon: Grid,
    },
    {
      category: 'sharing',
      title: 'Password-Protected Public Share Links',
      desc: 'Distribute assets with secret password verification, view-only locks, and expiration timers.',
      icon: Share2,
    },
    {
      category: 'sharing',
      title: 'File Request Inflow Portals',
      desc: 'Collect files directly into any selected Master Cloud folder from clients without requiring accounts.',
      icon: FolderPlus,
    },
    {
      category: 'security',
      title: 'AES-256 GCM Envelope Encryption',
      desc: 'All stored assets and chunks encrypted with AES-256 in Galois/Counter Mode at rest and TLS 1.3 in transit.',
      icon: Lock,
    },
    {
      category: 'security',
      title: 'PostgreSQL Row-Level Security (RLS)',
      desc: 'Database-enforced isolation ensuring zero data cross-contamination between tenants.',
      icon: Shield,
    },
    {
      category: 'security',
      title: 'SHA-256 Bit-Rot & Integrity Verification',
      desc: 'Every file chunk is validated against SHA-256 hashes to prevent file corruption.',
      icon: CheckCircle2,
    },
  ];

  const filteredFeatures = activeCategory === 'all'
    ? features
    : features.filter(f => f.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16 select-none">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
          <Grid className="h-3.5 w-3.5" />
          <span>Complete Feature Directory</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
          Everything you need in a modern cloud operating system.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Explore the full architectural capabilities of Master Cloud across web, Windows local drive, productivity, and security.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeCategory === c.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'bg-secondary/60 text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="p-6 rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-lg transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Bottom Banner */}
      <div className="text-center space-y-6 max-w-2xl mx-auto pt-8">
        <h2 className="text-3xl font-black text-foreground">
          Ready to experience the future of cloud storage?
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button variant="gradient" size="lg" className="rounded-2xl text-xs font-bold gap-2">
              <span>Claim 10 TB Free Storage</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/download">
            <Button variant="outline" size="lg" className="rounded-2xl text-xs font-bold">
              <span>Download Windows Client</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
