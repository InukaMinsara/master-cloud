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
    facebook: '',
    tiktok: '',
    instagram: '',
    telegram: '',
    twitter: '',
  });
  const [visited, setVisited] = useState<Record<SocialPlatformId, boolean>>({
    youtube: false,
    facebook: false,
    tiktok: false,
    instagram: false,
    telegram: false,
    twitter: false,
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

  const handleOpenLink = (platform: SocialPlatformId, url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setVisited((prev) => ({ ...prev, [platform]: true }));
    toast.info(`Opened ${platform.toUpperCase()} in a new tab. Follow and paste your handle below to claim!`);
  };

  const handleClaim = (task: SocialTopUpTask) => {
    const handle = handles[task.id];
    if (!handle || handle.trim().length < 2) {
      toast.error('Please enter your username, channel name, or profile link.');
      return;
    }

    setSubmittingPlatform(task.id);
    try {
      const result = topUpService.claimTask(userEmail, task.id, handle);
      if (result.success) {
        toast.success(result.message);
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
              Follow our official social media accounts to earn +500 GB permanent storage per account!
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
              <span>Bonus Progress: {formatBytes(bonusBytes)}</span>
              <span>Max Available: +{formatBytes(maxPossibleBonus)}</span>
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
            const hasVisited = visited[task.id];
            const currentHandle = handles[task.id] || '';
            const isSubmitting = submittingPlatform === task.id;

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

                {/* Claimed View */}
                {isClaimed && claimData ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>+500 GB Credited Permanently</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Registered Handle: <span className="font-semibold text-foreground">{claimData.handle}</span>
                    </p>
                  </div>
                ) : (
                  /* Active Claim Form */
                  <div className="space-y-2 pt-1">
                    {/* Step 1: Visit Channel Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenLink(task.id, targetUrl)}
                      className="w-full h-8 rounded-xl text-[11px] font-semibold gap-1.5 border-border hover:bg-secondary"
                    >
                      <span>1. Visit {task.platform}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Button>

                    {/* Step 2: Input User Handle & Claim */}
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="text"
                        value={currentHandle}
                        onChange={(e) => setHandles((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        placeholder={task.handlePlaceholder}
                        className="h-8 rounded-xl text-[11px] bg-secondary/40 border-border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!currentHandle.trim() || isSubmitting}
                        onClick={() => handleClaim(task)}
                        className="h-8 rounded-xl text-[11px] font-bold px-3 bg-amber-500 hover:bg-amber-600 text-black shadow-sm shrink-0"
                      >
                        {isSubmitting ? 'Verifying...' : 'Claim'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Verification Note for Users */}
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/60 text-[11px] text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>
            <strong>Anti-Fraud Protection:</strong> Each social handle can only be claimed once across the network. All submissions are verified against official follow lists.
          </span>
        </div>
      </div>
    </Dialog>
  );
}
