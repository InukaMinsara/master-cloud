import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Cloud, HardDrive, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithOAuth } = useAuthStore();

  const [email, setEmail] = React.useState('admin@mastercloud.io');
  const [password, setPassword] = React.useState('Password123!');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success('Welcome back to MASTER CLOUD!');
        navigate('/drive');
      } else {
        toast.error(res.error || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'azure') => {
    setIsLoading(true);
    try {
      const res = await loginWithOAuth(provider);
      if (res.redirected) {
        return;
      }
      if (res.success) {
        const providerName = provider === 'azure' ? 'Microsoft' : provider === 'google' ? 'Google' : 'GitHub';
        toast.success(`Signed in with ${providerName} (10 TB Free Storage)`);
        navigate('/drive');
      } else {
        toast.error(res.error || `Failed to sign in with ${provider}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalLogin = async () => {
    localStorage.setItem('master_cloud_backend_mode', 'local');
    const res = await login('admin@mastercloud.io', 'Password123!');
    if (res.success) {
      toast.success('Signed in with Local Engine (10 TB Free Storage)');
      navigate('/drive');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/logo-icon.svg" alt="Master Cloud" className="h-12 w-12 drop-shadow-md" />
          </Link>
          <h1 className="text-2xl font-black text-foreground tracking-tight">MASTER CLOUD</h1>
          <p className="text-xs text-muted-foreground">Sign in to your intelligent cloud storage workspace</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-8 shadow-2xl shadow-black/10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="pl-10 text-xs rounded-xl h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
              className="w-full h-11 rounded-xl text-xs font-semibold mt-2"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          {/* Social OAuth Sign In */}
          <div className="space-y-3 pt-1">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <span className="relative bg-card px-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                Or continue with OAuth
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="flex items-center justify-center py-2 px-3 rounded-xl border border-border/70 hover:bg-accent text-xs font-semibold gap-1.5 transition-colors"
                title="Sign in with Google"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                className="flex items-center justify-center py-2 px-3 rounded-xl border border-border/70 hover:bg-accent text-xs font-semibold gap-1.5 transition-colors"
                title="Sign in with GitHub"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('azure')}
                className="flex items-center justify-center py-2 px-3 rounded-xl border border-border/70 hover:bg-accent text-xs font-semibold gap-1.5 transition-colors"
                title="Sign in with Microsoft"
              >
                <svg className="h-4 w-4" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                <span>Microsoft</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <span className="relative bg-card px-3 text-[10px] uppercase tracking-wider text-muted-foreground">
              Instant Access
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/60 text-[11px] text-muted-foreground space-y-2">
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground block">Quick Development Credentials:</span>
              <span>Email: <code className="text-primary font-mono">admin@mastercloud.io</code></span>
              <span className="block">Password: <code className="text-primary font-mono">Password123!</code></span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLocalLogin}
              className="w-full rounded-xl text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
            >
              <HardDrive className="h-3.5 w-3.5" />
              Continue with Local Engine (Instant 10 TB Workspace)
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Create Account
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> 256-bit AES
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Cloud className="h-3.5 w-3.5 text-blue-500" /> 99.99% Durability
          </span>
        </div>
      </div>
    </div>
  );
}
