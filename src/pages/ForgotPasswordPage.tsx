import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await api.resetPassword(email.trim());
      setIsSubmitted(true);
      toast.success('Password reset email dispatched');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background select-none">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/cloud-logo.svg" alt="Master Cloud" className="h-12 w-12 drop-shadow-md" />
          </Link>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Reset Password</h1>
          <p className="text-xs text-muted-foreground">Receive a secure recovery link to access your account</p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-8 shadow-2xl space-y-6">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Account Email</label>
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

              <Button
                type="submit"
                variant="gradient"
                disabled={isLoading}
                className="w-full h-11 rounded-xl text-xs font-semibold"
              >
                {isLoading ? 'Sending...' : 'Send Recovery Link'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-foreground">Check your inbox</h4>
              <p className="text-xs text-muted-foreground">
                We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
              </p>
            </div>
          )}

          <div className="text-center pt-2">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
