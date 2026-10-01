import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  HelpCircle,
  Activity,
  Laptop,
  HardDrive,
  FileQuestion,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      toast.success('Thank you! Your message has been sent to Master Cloud support.');
    }, 800);
  };

  const faqs = [
    {
      q: 'Is the 10 TB free storage really permanent?',
      a: 'Yes. Every registered Master Cloud user is allocated a permanent 10 TB (10,995,116,277,760 bytes) quota. There are no trials, subscription tiers, or surprise fees.',
    },
    {
      q: 'How does Stream Mode work on Windows without taking hard drive space?',
      a: 'Stream Mode uses our virtual filesystem driver (WebDAV / VFS) on port 8766. File metadata is mounted directly into Windows File Explorer, but file data blocks are only fetched on demand when opened.',
    },
    {
      q: 'Will Master Cloud fill up my Windows C: drive?',
      a: 'No. The local caching engine specifically isolates cache files to D:\\MasterCloudCache. Even in heavy write operations, your C: system volume remains completely untouched.',
    },
    {
      q: 'Can I use Master Cloud both in the browser and as a Windows virtual drive?',
      a: 'Yes. Both interfaces are connected to the same underlying high-performance cloud engine with real-time state synchronization.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-24 select-none">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
          <Mail className="h-3.5 w-3.5" />
          <span>Support & Community Center</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
          We are here to help you get the most out of Master Cloud.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Reach out to our engineering team, browse frequently asked questions, or check real-time platform system telemetry.
        </p>
      </div>

      {/* Main Grid: Contact Form + Platform Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Support Ticket Form */}
        <div className="lg:col-span-7 p-8 rounded-3xl border border-border/80 bg-card shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">Send a Message</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Have questions about mounting the virtual drive or enterprise deployment? Let us know.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Your Name</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Virtual Drive Mounting / Storage Question"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we assist your workflow today?"
                className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl text-xs font-bold gap-2 px-8"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Sending...' : 'Submit Message'}</span>
            </Button>
          </form>
        </div>

        {/* Status & Quick Channels */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Status Card */}
          <div className="p-6 rounded-3xl border border-border/80 bg-secondary/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-xs text-foreground">All Systems Operational</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">99.999% UPTIME</span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-border/40">
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Cloud Storage Nodes:</span>
                <span className="font-bold text-emerald-500">100% Online</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Windows VFS Gateway (8766):</span>
                <span className="font-bold text-emerald-500">Active</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">PostgreSQL Database Engine:</span>
                <span className="font-bold text-emerald-500">Healthy</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Master Canvas Suite:</span>
                <span className="font-bold text-emerald-500">Operational</span>
              </div>
            </div>
          </div>

          {/* Quick Channels Card */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card space-y-4">
            <h4 className="font-bold text-sm text-foreground">Direct Resources</h4>
            <div className="space-y-3 text-xs">
              <Link to="/download" className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40 hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <Laptop className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">Download Windows Client</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link to="/local-drive" className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40 hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold text-foreground">Virtual Drive Documentation</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link to="/security" className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40 hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-foreground">Security Architecture & Privacy</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Common questions about storage quotas, Windows integration, and security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="p-6 rounded-3xl border border-border/80 bg-card space-y-2">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
