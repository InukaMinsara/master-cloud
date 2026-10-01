import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Database,
  Activity,
  CheckCircle2,
  FileCheck,
  KeyRound,
  EyeOff,
  Server,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function PublicSecurityPage() {
  const pillars = [
    {
      title: 'AES-256 GCM Data Encryption',
      desc: 'All stored assets, chunks, and metadata are encrypted using industry-standard AES-256 in Galois/Counter Mode at rest, and transmitted exclusively via TLS 1.3 encrypted sockets.',
      icon: Lock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'PostgreSQL Row-Level Security (RLS)',
      desc: 'Database policies enforce cryptographic and relational boundaries at the database engine level. No tenant can ever query, read, or infer data belonging to another user.',
      icon: Database,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'SHA-256 Data Integrity Checksums',
      desc: 'Every file chunk is hashed with SHA-256 upon upload and verified before download. Bit-rot detection and chunk self-healing guarantee zero file corruption.',
      icon: FileCheck,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Zero-Knowledge Compartments',
      desc: 'Private directories and password-protected share tokens are isolated in separate cryptographic domains. Master Cloud engineers cannot view private customer files.',
      icon: EyeOff,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Immutable Audit Logging',
      desc: 'Every upload, read, share token generation, and deletion event is appended to an immutable transaction journal with user agent, IP hash, and timestamp.',
      icon: Activity,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
    {
      title: 'Zero Data Monetization Pledge',
      desc: 'We do not sell user data, run targeted advertisements, or train third-party machine learning models on your files. Your cloud storage is strictly private.',
      icon: Shield,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-24 select-none">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
          <Shield className="h-3.5 w-3.5" />
          <span>Trust & Security Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
          Zero-Trust Security. Private by Default.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Master Cloud is built from the ground up with defense-in-depth cryptography, PostgreSQL RLS isolation, and zero compromise on user data privacy.
        </p>
      </div>

      {/* Security Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="p-8 rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className={`h-12 w-12 rounded-2xl ${p.bg} ${p.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{p.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy Pledge Banner */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-blue-500/10 p-8 sm:p-12 space-y-6">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
            Our Core Privacy Commitment
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            No Ads. No Tracking. No AI Training on Your Files.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Unlike other platforms that monetize your personal photos, documents, and spreadsheets, MASTER CLOUD treats user data with strict privacy. Your 10 TB storage allocation is entirely yours.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Badge variant="outline" className="text-xs py-1 px-3 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
            ✓ 100% Private by Default
          </Badge>
          <Badge variant="outline" className="text-xs py-1 px-3 border-primary/40 text-primary">
            ✓ End-to-End TLS 1.3 Socket Protection
          </Badge>
          <Badge variant="outline" className="text-xs py-1 px-3 border-border text-muted-foreground">
            ✓ Full Tenant Encryption Separation
          </Badge>
        </div>
      </div>

      {/* CTA Bottom Banner */}
      <div className="text-center space-y-6 max-w-2xl mx-auto pt-8">
        <h2 className="text-3xl font-black text-foreground">
          Store your files on a platform you can trust
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button variant="gradient" size="lg" className="rounded-2xl text-xs font-bold gap-2">
              <span>Claim 10 TB Secure Free Storage</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/download">
            <Button variant="outline" size="lg" className="rounded-2xl text-xs font-bold">
              <span>Download Windows Local Drive</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
