import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  HardDrive,
  Cloud,
  Laptop,
  Shield,
  Download,
  Grid,
  Mail,
  Menu,
  X,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

export function PublicNavbar() {
  const location = useLocation();
  const { theme, setTheme } = useUIStore();
  const { user } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Cloud Storage', path: '/cloud', icon: Cloud },
    { label: 'Local Drive (Z:)', path: '/local-drive', icon: Laptop },
    { label: 'Download App', path: '/download', icon: Download },
    { label: 'Security', path: '/security', icon: Shield },
    { label: 'All Features', path: '/features', icon: Grid },
    { label: 'Support', path: '/contact', icon: Mail },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/85 backdrop-blur-xl border-b border-border/80 shadow-lg shadow-black/5 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* Icon-only logo — use full logo when there's more room */}
            <div className="relative shrink-0">
              <img
                src="/logo-icon.svg"
                alt="Master Cloud"
                className="h-10 w-10 drop-shadow-md transition-transform group-hover:scale-105"
              />
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            {/* Full wordmark shown on ≥sm screens */}
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-sky-400">
                  MASTER CLOUD
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                  10 TB FREE
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
                Cloud OS • PC, Android &amp; iPhone
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-secondary/50 border border-border/60 rounded-full px-3 py-1.5 backdrop-blur-md">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full border border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <Link to="/drive">
                <Button variant="gradient" size="sm" className="rounded-full px-5 text-xs font-bold gap-1.5 shadow-md">
                  <HardDrive className="h-3.5 w-3.5" />
                  <span>Open 10 TB Drive</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-full px-4 text-xs font-semibold">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    variant="gradient"
                    size="sm"
                    className="rounded-full px-5 text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
                  >
                    <span>Get 10 TB Free</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-border bg-card text-foreground hover:bg-accent"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border/80 bg-card/95 backdrop-blur-2xl px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-4">
          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
            {user ? (
              <Link to="/drive" className="w-full">
                <Button variant="gradient" className="w-full rounded-2xl text-xs font-bold gap-2">
                  <HardDrive className="h-4 w-4" />
                  <span>Open 10 TB Workspace</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup" className="w-full">
                  <Button variant="gradient" className="w-full rounded-2xl text-xs font-bold gap-2">
                    <span>Create Free Account (10 TB)</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full rounded-2xl text-xs font-semibold">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
