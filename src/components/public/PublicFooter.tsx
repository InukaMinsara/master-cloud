import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cloud,
  HardDrive,
  Shield,
  Laptop,
  CheckCircle2,
  Lock,
  Zap,
  Layers,
  ArrowRight,
  Download,
  Smartphone,
} from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t border-border/80 bg-card/60 backdrop-blur-xl select-none">
      {/* Pre-footer Callout */}
      <div className="border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-primary/10 border border-primary/20 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-extrabold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Permanent 10 TB Free Allocation
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                No credit card. No trials. No hidden fees.
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Mount your 10 TB virtual drive directly to Windows File Explorer, install on Android, or access your web workspace anywhere.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link to="/download">
                <button className="h-11 px-6 rounded-2xl bg-secondary hover:bg-accent text-foreground text-xs font-bold transition-all border border-border flex items-center gap-2 shadow-sm">
                  <Download className="h-4 w-4 text-blue-500" />
                  <span>Download Apps</span>
                </button>
              </Link>
              <Link to="/signup">
                <button className="h-11 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-lg shadow-primary/25 flex items-center gap-2">
                  <span>Get 10 TB Free</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo-icon.svg" alt="Master Cloud" className="h-10 w-10 shrink-0 drop-shadow" />
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                  MASTER CLOUD
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
                  Cloud OS & Windows Drive
                </span>
              </div>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              The high-performance cloud operating platform. Seamlessly integrates with Windows File Explorer via Stream Mode, Mirror Mode, and Smart Hybrid Cache, backed by permanent 10 TB free storage.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[11px] text-emerald-500 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational • 99.999% Durability</span>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Product</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/cloud" className="hover:text-primary transition-colors">
                  Cloud Web App
                </Link>
              </li>
              <li>
                <Link to="/local-drive" className="hover:text-primary transition-colors">
                  Windows Local Drive (M:)
                </Link>
              </li>
              <li>
                <Link to="/download" className="hover:text-primary transition-colors">
                  Windows &amp; Android Apps
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-primary transition-colors">
                  Features Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Technology</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/local-drive" className="hover:text-primary transition-colors">
                  Stream Mode (0-Byte Disk)
                </Link>
              </li>
              <li>
                <Link to="/local-drive" className="hover:text-primary transition-colors">
                  Smart Hybrid Cache (D:)
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-primary transition-colors">
                  AES-256 GCM Encryption
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-primary transition-colors">
                  PostgreSQL Row-Level Security
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-primary transition-colors">
                  Zero-Knowledge Isolation
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Resources</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Help Center & Support
                </Link>
              </li>
              <li>
                <Link to="/diagnostics" className="hover:text-primary transition-colors">
                  System Diagnostics
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Sign In to Workspace
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-primary transition-colors">
                  Create 10 TB Account
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-primary transition-colors">
                  Privacy & Data Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 MASTER CLOUD Operating Platform. 10 TB Permanent Free Storage Policy.</p>
          <div className="flex items-center gap-6">
            <Link to="/security" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/security" className="hover:text-foreground transition-colors">
              Security Architecture
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
