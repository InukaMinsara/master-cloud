import React, { useState, useEffect } from 'react';
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
  Zap,
  Bot,
  Timer,
  Clock,
  KeyRound,
  Lock,
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
} from '@/services/topUpService';

export function TopUpModal() {
  const { topUpModalOpen, setTopUpModalOpen } = useUIStore();
  const { user } = useAuthStore();
  const userEmail = user?.email || 'guest@mastercloud.local';

  const [officialLinks, setOfficialLinks] = useState(() => topUpService.getOfficialLinks());
  const [claimedMap, setClaimedMap] = useState<Record<SocialPlatformId, TopUpSubmission | null>>(() =>
    topUpService.getUserClaimedPlatforms(userEmail)
  );
  const [bonusBytes, setBonusBytes] = useState(() => topUpService.getBonusBytes());
  const [handles, setHandles] = useState<Record<SocialPlatformId, string>>({
    youtube: '',
    youtube_2: '',
    facebook: '',
    tiktok: '',
    instagram: '',
    telegram: '',
    twitter: '',
  });

  const [secretCodes, setSecretCodes] = useState<Record<SocialPlatformId, string>>({
    youtube: '',
    youtube_2: '',
    facebook: '',
    tiktok: '',
    instagram: '',
    telegram: '',
    twitter: '',
  });

  // Track visit timers
  const [visitedTimers, setVisitedTimers] = useState<Record<SocialPlatformId, number>>({
    youtube: 0,
    youtube_2: 0,
    facebook: 0,
    tiktok: 0,
    instagram: 0,
    telegram: 0,
    twitter: 0,
  });
  const [submittingPlatform, setSubmittingPlatform] = useState<SocialPlatformId | null>(null);

  // Sync state whenever modal opens or storage updates
  useEffect(() => {
    const refresh = () => {
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

  // Handle opening link and countdown timer
  const handleOpenLink = (platform: SocialPlatformId, url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    const apiConfig = topUpService.getApiConfig();
    const waitSeconds = apiConfig.intentVerifySeconds || 6;

    setVisitedTimers((prev) => ({ ...prev, [platform]: waitSeconds }));
    toast.info(`Opened ${platform.toUpperCase()}. Visiting official channel... Find the secret code and enter your handle below!`);

    const interval = setInterval(() => {
      setVisitedTimers((prev) => {
        const current = prev[platform];
        if (current <= 1) {
          clearInterval(interval);
          return { ...prev, [platform]: -1 }; // -1 indicates completed visit countdown
        }
        return { ...prev, [platform]: current - 1 };
      });
    }, 1000);
  };

  const handleClaim = async (task: SocialTopUpTask) => {
    const handle = handles[task.id];
    const code = secretCodes[task.id];
    const hasVisited = visitedTimers[task.id] === -1;

    if (!hasVisited) {
      toast.error('Please click "1. Visit Channel" first and wait for the countdown before claiming!');
      return;
    }

    if (!handle || handle.trim().length < 3) {
      toast.error('Please enter a valid handle (minimum 3 characters, e.g. @yourname).');
      return;
    }

    setSubmittingPlatform(task.id);
    try {
      const result = await topUpService.claimTask(userEmail, task.id, handle, code, hasVisited);
      if (result.success) {
        toast.success(result.message);
        setClaimedMap(topUpService.getUserClaimedPlatforms(userEmail));
        setBonusBytes(topUpService.getBonusBytes());
        setHandles((prev) => ({ ...prev, [task.id]: '' }));
        setSecretCodes((prev) => ({ ...prev, [task.id]: '' }));
      } else {
        toast.error(result.message);
      }
    } catch (e: any) {
      toast.error(e.message || 'Verification failed. Please check your details.');
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
      case 'youtube_2':
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

  const getVerificationIcon = (id: SocialPlatformId) => {
    if (id === 'youtube' || id === 'youtube_2') return <Zap className="h-3 w-3 text-red-400" />;
    if (id === 'telegram') return <Bot className="h-3 w-3 text-sky-400" />;
    return <Timer className="h-3 w-3 text-emerald-400" />;
  };

  return (
    <Dialog open={topUpModalOpen} onOpenChange={setTopUpModalOpen} className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-md shadow-amber-500/10">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>Automated Cloud Storage Top-Up</span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-400 border-amber-500/30">
                +500 GB Each (Up to +3.5 TB)
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Follow our official accounts to earn +500 GB per platform. Strictly verified via Google YouTube API & Channel Secret Codes.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Total Cloud Vault Quota</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-foreground">{formatBytes(totalQuota)}</span>
                <span className="text-xs text-muted-foreground">
                  (10 TB Base {bonusBytes > 0 && `+ ${formatBytes(bonusBytes)} Earned Bonus`})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background/80 border-border text-foreground font-semibold text-xs py-1 px-3">
                {claimedCount} of {DEFAULT_TASKS.length} Accounts Connected
              </Badge>
            </div>
          </div>

          {/* Bonus Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
              <span>Earned Bonus: {formatBytes(bonusBytes)}</span>
              <span>Available to Claim: +{formatBytes(maxPossibleBonus - bonusBytes)}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden border border-border/60">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (bonusBytes / maxPossibleBonus) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEFAULT_TASKS.map((task) => {
            const isClaimed = claimedMap[task.id] !== null && claimedMap[task.id] !== undefined;
            const claimData = claimedMap[task.id];
            const targetUrl = officialLinks[task.id] || task.defaultUrl;
            const currentTimer = visitedTimers[task.id];
            const currentHandle = handles[task.id] || '';
            const currentCode = secretCodes[task.id] || '';
            const isSubmitting = submittingPlatform === task.id;
            const hasVisited = currentTimer === -1;

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                  isClaimed
                    ? 'border-emerald-500/30 bg-emerald-500/5'
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
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-foreground">{task.platform}</h4>
                        <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-secondary text-muted-foreground border border-border/60">
                          {getVerificationIcon(task.id)}
                          <span>{task.verificationBadge}</span>
                        </span>
                      </div>
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

                {/* Claimed View */}
                {isClaimed && claimData ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>+500 GB Credited Permanently</span>
                      </div>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {claimData.verificationMethod.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Account Handle: <span className="font-semibold text-foreground">{claimData.handle}</span>
                    </p>
                  </div>
                ) : (
                  /* Active Claim Form */
                  <div className="space-y-2.5 pt-1">
                    {/* Step 1: Visit Channel Button with countdown indicator */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenLink(task.id, targetUrl)}
                      className={`w-full h-8 rounded-xl text-[11px] font-semibold gap-1.5 border-border transition-colors ${
                        currentTimer > 0
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                          : hasVisited
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      {currentTimer > 0 ? (
                        <>
                          <Clock className="h-3 w-3 animate-spin text-amber-400" />
                          <span>1. Visiting Channel... ({currentTimer}s)</span>
                        </>
                      ) : hasVisited ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>1. Visited Official Account (Unlocked)</span>
                        </>
                      ) : (
                        <>
                          <span>1. Visit Official {task.platform}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </>
                      )}
                    </Button>

                    {/* Step 2: Input User Handle + Secret Code & Claim */}
                    <div className="space-y-1.5">
                      <div className="relative">
                        <Input
                          type="text"
                          disabled={!hasVisited || isSubmitting}
                          value={currentHandle}
                          onChange={(e) => setHandles((prev) => ({ ...prev, [task.id]: e.target.value }))}
                          placeholder={hasVisited ? task.handlePlaceholder : 'Visit channel above to unlock handle input'}
                          className={`h-8 rounded-xl text-[11px] bg-secondary/40 border-border ${
                            !hasVisited ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        />
                        {!hasVisited && (
                          <Lock className="absolute right-2.5 top-2.5 h-3 w-3 text-muted-foreground/60" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <Input
                            type="text"
                            disabled={!hasVisited || isSubmitting}
                            value={currentCode}
                            onChange={(e) => setSecretCodes((prev) => ({ ...prev, [task.id]: e.target.value.toUpperCase() }))}
                            placeholder={hasVisited ? 'Channel Secret Code (e.g. MC-...)' : 'Locked'}
                            className={`h-8 rounded-xl text-[11px] bg-secondary/40 border-border font-mono uppercase pr-7 ${
                              !hasVisited ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                          <KeyRound className="absolute right-2.5 top-2.5 h-3 w-3 text-muted-foreground pointer-events-none" />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!hasVisited || !currentHandle.trim() || !currentCode.trim() || isSubmitting}
                          onClick={() => handleClaim(task)}
                          className="h-8 rounded-xl text-[11px] font-bold px-3 bg-amber-500 hover:bg-amber-600 text-black shadow-sm shrink-0 disabled:opacity-40"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-black animate-ping" />
                              <span>Verifying...</span>
                            </span>
                          ) : (
                            'Verify +500GB'
                          )}
                        </Button>
                      </div>

                      {!hasVisited ? (
                        <p className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>Click "1. Visit" above first to find the secret code and unlock Step 2.</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">
                          Enter your real handle and the secret code found in our channel's Pinned Comment or Bio.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Verification Note for Users */}
        <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 text-[11px] text-muted-foreground flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>
              <strong>Strict Anti-Fraud Protection:</strong> Fake handles and wrong secret codes are instantly rejected by the Google YouTube API & Fraud Engine. No cheat submissions allowed.
            </span>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
