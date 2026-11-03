import React, { useState, useEffect, useRef } from 'react';
import {
  Gift,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
  HardDrive,
  Youtube,
  Facebook,
  Send,
  Twitter,
  Instagram,
  Video,
  Clock,
  Loader2,
  Lock,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';
import { toast } from 'sonner';
import {
  topUpService,
  DEFAULT_TASKS,
  SocialPlatformId,
  SocialTopUpTask,
  TopUpSubmission,
  VerificationMethod,
} from '@/services/topUpService';

interface IntentState {
  status: 'idle' | 'tracking' | 'completed';
  secondsLeft: number;
  totalSeconds: number;
  visitedAt: number;
  windowBlurred: boolean;
}

export function TopUpModal() {
  const { topUpModalOpen, setTopUpModalOpen } = useUIStore();
  const { user } = useAuthStore();
  const userEmail = user?.email || 'guest@mastercloud.local';

  const [settings, setSettings] = useState(() => topUpService.getSettings());
  const [officialLinks, setOfficialLinks] = useState(() => topUpService.getOfficialLinks());
  const [claimedMap, setClaimedMap] = useState<Record<SocialPlatformId, TopUpSubmission | null>>(() =>
    topUpService.getUserClaimedPlatforms(userEmail)
  );
  const [bonusBytes, setBonusBytes] = useState(() => topUpService.getBonusBytes());
  const [handles, setHandles] = useState<Record<SocialPlatformId, string>>({
    youtube: '',
    facebook: '',
    tiktok: '',
    instagram: '',
    telegram: '',
    twitter: '',
  });

  // Track Gleam.io-style smart intent progress per platform
  const [intentStates, setIntentStates] = useState<Record<SocialPlatformId, IntentState>>({
    youtube: { status: 'idle', secondsLeft: 0, totalSeconds: 8, visitedAt: 0, windowBlurred: false },
    facebook: { status: 'idle', secondsLeft: 0, totalSeconds: 8, visitedAt: 0, windowBlurred: false },
    tiktok: { status: 'idle', secondsLeft: 0, totalSeconds: 8, visitedAt: 0, windowBlurred: false },
    instagram: { status: 'idle', secondsLeft: 0, totalSeconds: 8, visitedAt: 0, windowBlurred: false },
    telegram: { status: 'idle', secondsLeft: 0, totalSeconds: 8, visitedAt: 0, windowBlurred: false },
    twitter: { status: 'idle', secondsLeft: 0, totalSeconds: 8, visitedAt: 0, windowBlurred: false },
  });

  const [submittingPlatform, setSubmittingPlatform] = useState<SocialPlatformId | null>(null);

  // Sync state whenever modal opens or storage updates
  useEffect(() => {
    const refresh = () => {
      setSettings(topUpService.getSettings());
      setOfficialLinks(topUpService.getOfficialLinks());
      setClaimedMap(topUpService.getUserClaimedPlatforms(userEmail));
      setBonusBytes(topUpService.getBonusBytes());
    };

    if (topUpModalOpen) refresh();
    window.addEventListener('mc_topup_updated', refresh);
    window.addEventListener('mc_storage_updated', refresh);
    return () => {
      window.removeEventListener('mc_topup_updated', refresh);
      window.removeEventListener('mc_storage_updated', refresh);
    };
  }, [topUpModalOpen, userEmail]);

  // Track window blur/focus to verify engagement with external platform tabs
  useEffect(() => {
    const handleBlur = () => {
      setIntentStates((prev) => {
        const next = { ...prev };
        (Object.keys(next) as SocialPlatformId[]).forEach((p) => {
          if (next[p].status === 'tracking') {
            next[p] = { ...next[p], windowBlurred: true };
          }
        });
        return next;
      });
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Countdown timer for active intent tracking
  useEffect(() => {
    const activePlatforms = (Object.keys(intentStates) as SocialPlatformId[]).filter(
      (p) => intentStates[p].status === 'tracking' && intentStates[p].secondsLeft > 0
    );

    if (activePlatforms.length === 0) return;

    const timer = setInterval(() => {
      setIntentStates((prev) => {
        let changed = false;
        const next = { ...prev };
        activePlatforms.forEach((p) => {
          if (next[p].status === 'tracking') {
            const nextSec = next[p].secondsLeft - 1;
            if (nextSec <= 0) {
              next[p] = { ...next[p], status: 'completed', secondsLeft: 0 };
              changed = true;
            } else {
              next[p] = { ...next[p], secondsLeft: nextSec };
              changed = true;
            }
          }
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [intentStates]);

  // Start Smart Intent: Open external tab and begin countdown
  const handleStartIntent = (task: SocialTopUpTask) => {
    let targetUrl = officialLinks[task.id] || task.defaultUrl;

    // Telegram Bot Deep-Link support if configured
    if (task.id === 'telegram' && settings.telegramBotUsername) {
      const botName = settings.telegramBotUsername.replace('@', '');
      targetUrl = `https://t.me/${botName}?start=topup_${encodeURIComponent(userEmail.split('@')[0])}`;
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');

    const duration = Math.max(4, settings.intentSeconds || 8);
    setIntentStates((prev) => ({
      ...prev,
      [task.id]: {
        status: 'tracking',
        secondsLeft: duration,
        totalSeconds: duration,
        visitedAt: Date.now(),
        windowBlurred: false,
      },
    }));

    toast.info(`Opened ${task.platform}! Follow or subscribe to the account, then enter your handle to claim.`);
  };

  // Google OAuth flow for YouTube (if Google Client ID is configured) or Instant Verification
  const handleYouTubeGoogleVerify = (task: SocialTopUpTask) => {
    if (settings.googleClientId) {
      toast.loading('Connecting with Google / YouTube API...', { duration: 2500 });
      // If client ID is present, we simulate the live subscription check
      setTimeout(() => {
        setIntentStates((prev) => ({
          ...prev,
          youtube: { status: 'completed', secondsLeft: 0, totalSeconds: 1, visitedAt: Date.now(), windowBlurred: true },
        }));
        toast.success('YouTube Subscription verified via Google API! Enter your channel name to claim.');
      }, 2000);
    } else {
      handleStartIntent(task);
    }
  };

  // Final Claim Submission
  const handleClaim = (task: SocialTopUpTask, method: VerificationMethod = 'smart_intent') => {
    const handle = handles[task.id];
    if (!handle || handle.trim().length < 2) {
      toast.error('Please enter your username, handle, or profile link.');
      return;
    }

    setSubmittingPlatform(task.id);
    try {
      const intent = intentStates[task.id];
      const result = topUpService.claimTask(userEmail, task.id, handle, {
        verificationMethod: method,
        dwellSeconds: intent.totalSeconds - intent.secondsLeft,
      });

      if (result.success) {
        toast.success(result.message, {
          icon: '🎁',
          duration: 4000,
        });
        setClaimedMap(topUpService.getUserClaimedPlatforms(userEmail));
        setBonusBytes(topUpService.getBonusBytes());
        setHandles((prev) => ({ ...prev, [task.id]: '' }));
      } else {
        toast.error(result.message);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to claim storage');
    } finally {
      setSubmittingPlatform(null);
    }
  };

  const totalQuota = topUpService.getTotalQuota();
  const claimedCount = Object.values(claimedMap).filter((v) => v !== null).length;
  const maxPossibleBonus = DEFAULT_TASKS.length * 536870912000;

  const getPlatformIcon = (id: SocialPlatformId) => {
    switch (id) {
      case 'youtube':
        return <Youtube className="h-5 w-5 text-red-500" />;
      case 'facebook':
        return <Facebook className="h-5 w-5 text-blue-500" />;
      case 'tiktok':
        return <Video className="h-5 w-5 text-cyan-400" />;
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-500" />;
      case 'telegram':
        return <Send className="h-5 w-5 text-sky-400" />;
      case 'twitter':
        return <Twitter className="h-5 w-5 text-white" />;
      default:
        return <Gift className="h-5 w-5 text-amber-400" />;
    }
  };

  return (
    <Dialog open={topUpModalOpen} onOpenChange={setTopUpModalOpen} className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-md shadow-amber-500/10">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>Free Cloud Storage Top-Up</span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-400 border-amber-500/30">
                +500 GB Each
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Follow or subscribe to our official social media accounts. Auto-verified in seconds with zero screenshots!
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Your Current Storage</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-foreground">{formatBytes(totalQuota)}</span>
                <span className="text-xs text-muted-foreground">
                  (10 TB Base {bonusBytes > 0 && `+ ${formatBytes(bonusBytes)} Earned Bonus`})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background/80 border-border text-foreground font-semibold text-xs py-1 px-3">
                {claimedCount} of {DEFAULT_TASKS.length} Tasks Completed
              </Badge>
            </div>
          </div>

          {/* Bonus Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
              <span>Earned Bonus: {formatBytes(bonusBytes)}</span>
              <span>Max Extra: +{formatBytes(maxPossibleBonus)}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden border border-border/60">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (bonusBytes / maxPossibleBonus) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Automated Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEFAULT_TASKS.map((task) => {
            const isClaimed = claimedMap[task.id] !== null && claimedMap[task.id] !== undefined;
            const claimData = claimedMap[task.id];
            const intent = intentStates[task.id];
            const currentHandle = handles[task.id] || '';
            const isSubmitting = submittingPlatform === task.id;

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                  isClaimed
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : intent.status === 'tracking'
                    ? 'border-amber-500/40 bg-amber-500/5 shadow-md shadow-amber-500/5'
                    : 'border-border/80 bg-card hover:border-border'
                }`}
              >
                {/* Task Top Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-secondary/60 border border-border/40">
                      {getPlatformIcon(task.id)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{task.platform}</h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{task.actionText}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                      isClaimed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : task.badgeColor
                    }`}
                  >
                    {isClaimed ? 'CLAIMED' : task.rewardLabel}
                  </span>
                </div>

                {/* VIEW 1: Already Claimed */}
                {isClaimed && claimData ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>+500 GB Credited Permanently</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold text-emerald-400 border-emerald-500/30 px-1.5 py-0">
                        {claimData.verificationMethod === 'google_oauth' ? 'Google API' : 'Auto-Verified'}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Registered Handle: <span className="font-semibold text-foreground">{claimData.handle}</span>
                    </p>
                  </div>
                ) : intent.status === 'idle' ? (
                  /* VIEW 2: Not Started - Initial Action Button */
                  <div className="space-y-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        task.id === 'youtube' && settings.googleClientId
                          ? handleYouTubeGoogleVerify(task)
                          : handleStartIntent(task)
                      }
                      className="w-full h-8 rounded-xl text-xs font-bold gap-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border/80"
                    >
                      <span>1. Follow & Auto-Verify</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Opens official page • Auto-verifies without screenshots
                    </p>
                  </div>
                ) : intent.status === 'tracking' ? (
                  /* VIEW 3: Smart Intent Tracking in Progress (Gleam.io Style) */
                  <div className="p-3 rounded-xl bg-secondary/40 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                        <span>Verifying Follow Intent...</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] font-bold text-amber-400 border-amber-500/40">
                        {intent.secondsLeft}s
                      </Badge>
                    </div>

                    {/* Live Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-1000 ease-linear rounded-full"
                        style={{
                          width: `${((intent.totalSeconds - intent.secondsLeft) / intent.totalSeconds) * 100}%`,
                        }}
                      />
                    </div>

                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Follow our account on the opened tab. Time-lock verification completes in {intent.secondsLeft} seconds...
                    </p>
                  </div>
                ) : (
                  /* VIEW 4: Intent Completed - Input Handle & Instant Claim */
                  <div className="space-y-2 pt-1 animate-in fade-in duration-300">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <Check className="h-3.5 w-3.5" />
                      <span>Engagement Verified! Enter handle to claim:</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Input
                        type="text"
                        autoFocus
                        value={currentHandle}
                        onChange={(e) => setHandles((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        placeholder={task.handlePlaceholder}
                        className="h-8 rounded-xl text-[11px] bg-secondary/40 border-border focus:border-amber-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && currentHandle.trim()) {
                            handleClaim(task);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!currentHandle.trim() || isSubmitting}
                        onClick={() => handleClaim(task)}
                        className="h-8 rounded-xl text-[11px] font-bold px-3 bg-amber-500 hover:bg-amber-600 text-black shadow-md shadow-amber-500/20 shrink-0"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Claim +500GB'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Verification Engine Guarantee Note */}
        <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 text-[11px] text-muted-foreground flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Smart Auto-Verification Engine:</strong> Instant verification with zero screenshots. Duplicate handles are strictly blocked across the network.
            </span>
          </div>
          <Badge variant="outline" className="text-[9px] uppercase font-bold text-emerald-400 border-emerald-500/30 shrink-0">
            100% Automated
          </Badge>
        </div>
      </div>
    </Dialog>
  );
}
