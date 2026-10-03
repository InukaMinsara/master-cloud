import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, ShieldCheck, Cloud, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, loginWithOAuth } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showEmailSignup, setShowEmailSignup] = useState(false);

  // Email form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Custom Google prompt modal state
  const [showGooglePromptModal, setShowGooglePromptModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const handleGoogleSignUpClick = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const res = await loginWithOAuth('google');
        if (res.redirected) return;
        if (!res.success && res.error) {
          toast.error(res.error);
        }
      } else {
        setShowGooglePromptModal(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Google Sign-Up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) {
      toast.error('Please enter your Google Email address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithGoogle(customGoogleEmail.trim(), customGoogleName.trim() || undefined);
      if (res.success) {
        toast.success(`Account created! 10 TB Permanent Free Storage activated for ${customGoogleEmail}`);
        setShowGooglePromptModal(false);
        navigate('/drive');
      } else {
        toast.error(res.error || 'Failed to sign up with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !password) return;

    setIsLoading(true);
    try {
      const res = await signup(email.trim(), password, displayName.trim());
      if (res.success) {
        toast.success('Account created with 10 TB Free Storage! Welcome to MASTER CLOUD.');
        navigate('/drive');
      } else {
        toast.error(res.error || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img
              src="/logo-icon.svg"
              alt="Master Cloud"
              className="h-14 w-14 drop-shadow-md transition-transform group-hover:scale-105"
            />
          </Link>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Create Account</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
              10 TB FREE
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Get your 10 TB permanent free cloud storage workspace instantly with Google
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl shadow-black/10 space-y-6">
          {/* PRIMARY HERO: GOOGLE SIGN UP BUTTON */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignUpClick}
              disabled={isLoading}
              className="w-full h-14 rounded-2xl border-2 border-border/80 hover:border-primary/60 bg-background hover:bg-accent/60 text-foreground font-bold text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-98 group"
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
              <span>{isLoading ? 'Connecting to Google...' : 'Sign up with Google'}</span>
            </button>

            <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>1-Click Activation: Instant 10 TB free storage allocated on your Google account.</span>
            </div>
          </div>

          {/* Toggle for Standard Email Signup */}
          <div className="pt-2">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <button
                type="button"
                onClick={() => setShowEmailSignup(!showEmailSignup)}
                className="relative bg-card px-3 text-[11px] text-muted-foreground hover:text-foreground font-medium"
              >
                {showEmailSignup ? 'Hide standard email registration ▲' : 'Or register with email & password ▼'}
              </button>
            </div>

            {showEmailSignup && (
              <form onSubmit={handleEmailSubmit} className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Inuka Minsara"
                      className="pl-10 text-xs rounded-xl h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="pl-10 text-xs rounded-xl h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="pl-10 pr-10 text-xs rounded-xl h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl text-xs font-semibold"
                >
                  {isLoading ? 'Creating Account...' : 'Get Started Free (Instant 10 TB)'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>
            )}
          </div>

          <div className="text-center text-xs text-muted-foreground pt-1">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary hover:underline">
              Sign In
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
            <Cloud className="h-3.5 w-3.5 text-blue-500" /> 10 TB Zero-Knowledge Storage
          </span>
        </div>
      </div>

      {/* Google Sign-In Email Modal (when in local engine mode) */}
      {showGooglePromptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
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
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Sign up with Google Account</h3>
                <p className="text-xs text-muted-foreground">Enter your Google email to activate your 10 TB free storage</p>
              </div>
            </div>

            <form onSubmit={handleCustomGoogleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Your Google Email (Gmail)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    required
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="pl-10 text-xs rounded-xl h-11"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Your Display Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="e.g. Inuka Minsara"
                    className="pl-10 text-xs rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGooglePromptModal(false)}
                  className="rounded-xl text-xs h-10 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isLoading}
                  className="rounded-xl text-xs h-10 px-6 font-bold"
                >
                  {isLoading ? 'Creating...' : 'Activate 10 TB Free'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
