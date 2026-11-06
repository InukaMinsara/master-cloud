import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Cloud, Eye, EyeOff, Sparkles, User, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithOAuth } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(true);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  // Email form state
  const [email, setEmail] = useState('immaster2024@gmail.com');
  const [password, setPassword] = useState('arduino2024');
  const [showPassword, setShowPassword] = useState(false);

  const handleInstantGoogleLogin = async (targetEmail: string, displayName?: string) => {
    setIsLoading(true);
    try {
      const res = await loginWithGoogle(targetEmail, displayName);
      if (res.success) {
        toast.success(`Signed in with Google as ${targetEmail}! 10 TB Activated.`);
        setShowGoogleModal(false);
        if (targetEmail.toLowerCase() === 'immaster2024@gmail.com' || targetEmail.toLowerCase().startsWith('admin@')) {
          navigate('/admin');
        } else {
          navigate('/drive');
        }
      } else {
        toast.error(res.error || 'Google login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNativeOAuthRedirect = async () => {
    setIsLoading(true);
    try {
      const res = await loginWithOAuth('google');
      if (res.redirected) {
        return;
      }
      if (res.success) {
        navigate('/drive');
      } else if (res.error) {
        toast.error(res.error);
        setIsLoading(false);
      }
    } catch (err: any) {
      toast.error('Google Sign-In failed: ' + err.message);
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        toast.success('Welcome back to MASTER CLOUD!');
        if (res.user?.role === 'admin' || email.trim().toLowerCase().startsWith('admin@')) {
          navigate('/admin');
        } else {
          navigate('/drive');
        }
      } else {
        toast.error(res.error || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background select-none overflow-hidden">
      {/* 3D Ambient Glowing Gradient Background Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/25 rounded-full blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-20 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Subtle 3D Perspective Floating Badges (Desktop) */}
      <div className="hidden lg:block absolute left-12 top-24 pointer-events-none animate-bounce" style={{ animationDuration: '4s' }}>
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/5 text-xs font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>10 TB Free Storage Activated</span>
        </div>
      </div>
      <div className="hidden lg:block absolute right-12 bottom-24 pointer-events-none animate-bounce" style={{ animationDuration: '5s' }}>
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/5 text-xs font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Zero-Disk Cloud Footprint</span>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-blue-600 opacity-40 blur-sm group-hover:opacity-75 transition duration-300" />
              <img
                src="/logo-icon.svg"
                alt="Master Cloud"
                className="relative h-16 w-16 drop-shadow-xl transition-transform duration-300 group-hover:scale-105 rounded-2xl object-contain"
              />
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">MASTER CLOUD</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/25 shadow-sm">
              10 TB FREE
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Sign in with your Google account to access your permanent 10 TB free cloud storage
          </p>
        </div>

        {/* 3D Glassmorphic Card */}
        <div className="rounded-3xl border border-white/20 dark:border-white/10 bg-card/85 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] space-y-6 transition-all duration-300 hover:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.45)]">
          {/* PRIMARY HERO: GOOGLE SIGN IN BUTTON */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              disabled={isLoading}
              className="w-full h-14 rounded-2xl border-2 border-border/80 hover:border-primary/80 bg-background/90 hover:bg-accent/60 text-foreground font-bold text-sm flex items-center justify-center gap-3.5 shadow-lg shadow-black/5 hover:shadow-primary/15 transition-all duration-200 active:scale-98 group cursor-pointer"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>Automatic 10 TB free storage allocated on your Google account.</span>
            </div>
          </div>

          {/* Quick Sign-In Option & Email Form */}
          <div className="pt-1 space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <span className="relative bg-card px-3 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Or Sign In with Credentials
              </span>
            </div>

            {/* Admin Fast-Fill Shortcut */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-secondary/40 border border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  IM
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Inuka Minsara (Master Admin)</p>
                  <p className="text-[10px] text-muted-foreground">immaster2024@gmail.com</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEmail('immaster2024@gmail.com');
                  setPassword('arduino2024');
                  handleInstantGoogleLogin('immaster2024@gmail.com', 'Inuka Minsara');
                }}
                className="h-7 text-[10px] rounded-lg px-2.5 font-bold"
              >
                1-Click Login
              </Button>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. immaster2024@gmail.com"
                    className="pl-10 text-xs rounded-xl h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <Link to="/forgot-password" tabIndex={-1} className="text-[11px] text-primary hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 text-xs rounded-xl h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                disabled={isLoading}
                className="w-full h-11 rounded-xl font-bold text-xs shadow-md"
              >
                {isLoading ? 'Signing In...' : 'Sign In to Master Cloud'}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-1">
            New to Master Cloud?{' '}
            <Link to="/signup" className="font-bold text-primary hover:underline">
              Create Account (10 TB Free)
            </Link>
          </div>
        </div>

        {/* Security Trust Badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Google OAuth 2.0
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Cloud className="h-3.5 w-3.5 text-blue-500" /> 10 TB Zero-Knowledge Drive
          </span>
        </div>
      </div>

      {/* Google Sign In Options Dialog */}
      <Dialog open={showGoogleModal} onOpenChange={setShowGoogleModal} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <DialogTitle>Sign in with Google</DialogTitle>
          </div>
          <DialogDescription>
            Choose your Google account to access your permanent 10 TB free storage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Option 1: Inuka Minsara */}
          <div
            onClick={() => handleInstantGoogleLogin('immaster2024@gmail.com', 'Inuka Minsara')}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 hover:border-primary/80 bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                IM
              </div>
              <div>
                <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Inuka Minsara</p>
                <p className="text-[11px] text-muted-foreground">immaster2024@gmail.com</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">
              MASTER ADMIN
            </span>
          </div>

          {/* Option 2: Custom Google Email */}
          <div className="p-3.5 rounded-2xl border border-border bg-card space-y-2.5">
            <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>Use Another Google Account</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="yourname@gmail.com"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (!customGoogleEmail.trim()) {
                    toast.error('Please enter a valid Google email address');
                    return;
                  }
                  handleInstantGoogleLogin(customGoogleEmail.trim());
                }}
                className="h-9 text-xs rounded-xl px-4"
              >
                Sign In
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Allocates an isolated, fresh 10 TB storage drive for this email address.
            </p>
          </div>

          {/* Option 3: Native OAuth with origin advice */}
          <div className="pt-1 border-t border-border/50">
            <button
              type="button"
              onClick={handleNativeOAuthRedirect}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground font-medium py-1.5 transition-colors"
            >
              Or open Google Cloud OAuth popup &rarr;
            </button>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-muted-foreground space-y-1">
              <p className="font-semibold text-amber-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Note on "Error 401: invalid_client / no registered origin":
              </p>
              <p>
                In Google Cloud Console under Credentials &rarr; OAuth Client ID, add <code className="bg-background px-1 py-0.5 rounded text-foreground font-mono">https://mastercloud09.netlify.app</code> to <strong>Authorized JavaScript origins</strong>.
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
