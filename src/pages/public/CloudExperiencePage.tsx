import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cloud,
  HardDrive,
  Upload,
  Search,
  Share2,
  Lock,
  Clock,
  Trash2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  History,
  FolderOpen,
  PieChart,
  Shield,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CloudExperiencePage() {
  const features = [
    {
      title: 'High-Throughput Chunked Upload Engine',
      desc: 'Upload 100 GB+ media files, disk images, and massive archive packages with resumable multi-part parallel chunking and SHA-256 integrity validation.',
      icon: Upload,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Global Instant Search & Category Filtering',
      desc: 'Search across 100,000+ files in sub-millisecond speeds. Filter seamlessly by Documents, Images, Videos, Audio, Code, and Archives.',
      icon: Search,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
    {
      title: 'Granular Share Controls & Expiring Links',
      desc: 'Generate secure public links with optional password protection, expiration dates, view-only modes, and download quota limiters.',
      icon: Share2,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'File Request Inflow Portals',
      desc: 'Create secure dropboxes allowing clients and external collaborators to upload files directly into your Master Cloud Drive without needing an account.',
      icon: FolderOpen,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Continuous Version History Rollback',
      desc: 'Never lose work. Inspect every saved revision, compare timestamps, preview previous iterations, and restore any previous version in one click.',
      icon: History,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Smart Storage Cleanup Optimizer',
      desc: 'Real-time telemetry identifying large obsolete files, duplicate hashes, and temporary caches to keep your 10 TB allocation perfectly organized.',
      icon: PieChart,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-24 select-none">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
          <Cloud className="h-3.5 w-3.5" />
          <span>Master Cloud Web Experience</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
          Every file. Accessible anywhere with zero friction.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          The Master Cloud Web Application provides an ultra-responsive, desktop-class operating experience directly in your browser, backed by 10 TB free storage.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="p-8 rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className={`h-12 w-12 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-dive Upload & Security Callout */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-primary/10 p-8 sm:p-12 space-y-6">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            High Performance Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Engineered for Massive File Datasets & Media
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Whether you are uploading a 50 GB 4K video reel, raw camera files, virtual machine images, or thousands of documents, Master Cloud's stream pipeline handles parallel chunk buffers with automatic paused-network recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <span className="text-xs text-muted-foreground">Maximum File Size</span>
            <h4 className="text-xl font-black text-foreground">Unlimited</h4>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <span className="text-xs text-muted-foreground">Standard Allocation</span>
            <h4 className="text-xl font-black text-primary">10 TB Free</h4>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <span className="text-xs text-muted-foreground">Data Integrity</span>
            <h4 className="text-xl font-black text-emerald-500">SHA-256 Verified</h4>
          </div>
        </div>
      </div>

      {/* CTA Bottom Banner */}
      <div className="text-center space-y-6 max-w-2xl mx-auto pt-8">
        <h2 className="text-3xl font-black text-foreground">
          Access your files on any device with Master Cloud Web
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button variant="gradient" size="lg" className="rounded-2xl text-xs font-bold gap-2">
              <span>Claim 10 TB Free Cloud</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/local-drive">
            <Button variant="outline" size="lg" className="rounded-2xl text-xs font-bold">
              <span>Explore Windows Local Drive</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
