import { FREE_TEN_TB_BYTES } from '@/lib/constants';

export const FIVE_HUNDRED_GB_BYTES = 536870912000; // 500 GiB (536,870,912,000 bytes)

export type SocialPlatformId = 'youtube' | 'facebook' | 'tiktok' | 'instagram' | 'telegram' | 'twitter';

export type VerificationMethod = 'smart_intent' | 'google_oauth' | 'telegram_bot' | 'manual';

export interface SocialTopUpTask {
  id: SocialPlatformId;
  platform: string;
  actionText: string;
  rewardLabel: string;
  rewardBytes: number;
  defaultUrl: string;
  handlePlaceholder: string;
  brandColor: string;
  bgLight: string;
  badgeColor: string;
  supportsGoogleOAuth?: boolean;
  supportsTelegramBot?: boolean;
}

export interface TopUpSubmission {
  id: string;
  userEmail: string;
  platform: SocialPlatformId;
  platformName: string;
  handle: string;
  rewardBytes: number;
  rewardLabel: string;
  claimedAt: string;
  status: 'verified' | 'pending' | 'revoked';
  verificationMethod: VerificationMethod;
  dwellSeconds?: number;
}

export interface TopUpSettings {
  intentSeconds: number; // default: 8 seconds (Gleam.io style)
  youtubeChannelId: string;
  googleClientId: string;
  telegramBotUsername: string;
  telegramChannelUsername: string;
}

export const DEFAULT_TASKS: SocialTopUpTask[] = [
  {
    id: 'youtube',
    platform: 'YouTube',
    actionText: 'Subscribe to our official YouTube channel',
    rewardLabel: '+500 GB',
    rewardBytes: FIVE_HUNDRED_GB_BYTES,
    defaultUrl: 'https://youtube.com',
    handlePlaceholder: '@your_youtube_channel or channel link',
    brandColor: '#FF0000',
    bgLight: 'bg-red-500/10 border-red-500/20 text-red-500',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    supportsGoogleOAuth: true,
  },
  {
    id: 'facebook',
    platform: 'Facebook',
    actionText: 'Follow and like our official Facebook page',
    rewardLabel: '+500 GB',
    rewardBytes: FIVE_HUNDRED_GB_BYTES,
    defaultUrl: 'https://facebook.com',
    handlePlaceholder: 'Facebook profile name or profile link',
    brandColor: '#1877F2',
    bgLight: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    id: 'tiktok',
    platform: 'TikTok',
    actionText: 'Follow our official TikTok account',
    rewardLabel: '+500 GB',
    rewardBytes: FIVE_HUNDRED_GB_BYTES,
    defaultUrl: 'https://tiktok.com',
    handlePlaceholder: '@your_tiktok_username',
    brandColor: '#00F2FE',
    bgLight: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'instagram',
    platform: 'Instagram',
    actionText: 'Follow our official Instagram profile',
    rewardLabel: '+500 GB',
    rewardBytes: FIVE_HUNDRED_GB_BYTES,
    defaultUrl: 'https://instagram.com',
    handlePlaceholder: '@your_instagram_handle',
    brandColor: '#E1306C',
    bgLight: 'bg-pink-500/10 border-pink-500/20 text-pink-500',
    badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  },
  {
    id: 'telegram',
    platform: 'Telegram',
    actionText: 'Join our official Telegram VIP community',
    rewardLabel: '+500 GB',
    rewardBytes: FIVE_HUNDRED_GB_BYTES,
    defaultUrl: 'https://t.me',
    handlePlaceholder: '@your_telegram_username',
    brandColor: '#229ED9',
    bgLight: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    supportsTelegramBot: true,
  },
  {
    id: 'twitter',
    platform: 'X (Twitter)',
    actionText: 'Follow our official X (Twitter) account',
    rewardLabel: '+500 GB',
    rewardBytes: FIVE_HUNDRED_GB_BYTES,
    defaultUrl: 'https://x.com',
    handlePlaceholder: '@your_x_handle',
    brandColor: '#FFFFFF',
    bgLight: 'bg-zinc-500/10 border-zinc-500/20 text-white',
    badgeColor: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  },
];

class TopUpService {
  private STORAGE_KEY_BONUS = 'mc_bonus_quota_bytes';
  private STORAGE_KEY_SUBMISSIONS = 'mc_topup_submissions';
  private STORAGE_KEY_LINKS = 'mc_topup_official_links';
  private STORAGE_KEY_SETTINGS = 'mc_topup_settings';

  // Get user bonus bytes
  getBonusBytes(): number {
    if (typeof localStorage === 'undefined') return 0;
    return Number(localStorage.getItem(this.STORAGE_KEY_BONUS)) || 0;
  }

  // Get total quota including base 10 TB + earned bonus
  getTotalQuota(): number {
    return FREE_TEN_TB_BYTES + this.getBonusBytes();
  }

  // Get all official links (customized by admin or defaults)
  getOfficialLinks(): Record<SocialPlatformId, string> {
    const defaults: Record<SocialPlatformId, string> = {
      youtube: 'https://youtube.com',
      facebook: 'https://facebook.com',
      tiktok: 'https://tiktok.com',
      instagram: 'https://instagram.com',
      telegram: 'https://t.me',
      twitter: 'https://x.com',
    };

    if (typeof localStorage === 'undefined') return defaults;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_LINKS);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  }

  // Update official link for a platform (Admin action)
  updateOfficialLink(platform: SocialPlatformId, url: string): void {
    if (typeof localStorage === 'undefined') return;
    const current = this.getOfficialLinks();
    current[platform] = url;
    localStorage.setItem(this.STORAGE_KEY_LINKS, JSON.stringify(current));
    this.notifyUpdate();
  }

  // Get Top-Up Settings
  getSettings(): TopUpSettings {
    const defaults: TopUpSettings = {
      intentSeconds: 8,
      youtubeChannelId: '',
      googleClientId: '',
      telegramBotUsername: '',
      telegramChannelUsername: '',
    };
    if (typeof localStorage === 'undefined') return defaults;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_SETTINGS);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  }

  // Update Top-Up Settings
  updateSettings(newSettings: Partial<TopUpSettings>): void {
    if (typeof localStorage === 'undefined') return;
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    this.notifyUpdate();
  }

  // Get all recorded claims (for Admin review)
  getAllSubmissions(): TopUpSubmission[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_SUBMISSIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Get claimed platform IDs for a specific user
  getUserClaimedPlatforms(userEmail: string): Record<SocialPlatformId, TopUpSubmission | null> {
    const submissions = this.getAllSubmissions();
    const result: Record<SocialPlatformId, TopUpSubmission | null> = {
      youtube: null,
      facebook: null,
      tiktok: null,
      instagram: null,
      telegram: null,
      twitter: null,
    };

    for (const sub of submissions) {
      if (sub.userEmail.toLowerCase() === userEmail.toLowerCase() && sub.status !== 'revoked') {
        result[sub.platform] = sub;
      }
    }
    return result;
  }

  // Claim +500 GB for a task
  claimTask(
    userEmail: string,
    platform: SocialPlatformId,
    handle: string,
    options?: {
      verificationMethod?: VerificationMethod;
      dwellSeconds?: number;
    }
  ): { success: boolean; message: string; newBonusTotal: number } {
    if (!handle || handle.trim().length < 2) {
      return { success: false, message: 'Please provide a valid handle, username, or profile link.', newBonusTotal: this.getBonusBytes() };
    }

    const cleanHandle = handle.trim();
    const submissions = this.getAllSubmissions();

    // Check if current user already claimed this platform
    const alreadyClaimedByUser = submissions.some(
      (s) => s.userEmail.toLowerCase() === userEmail.toLowerCase() && s.platform === platform && s.status !== 'revoked'
    );
    if (alreadyClaimedByUser) {
      return { success: false, message: `You have already claimed +500 GB for this platform!`, newBonusTotal: this.getBonusBytes() };
    }

    // Anti-fraud check: Check if this specific handle was already submitted for this platform by anyone
    const handleReused = submissions.some(
      (s) => s.platform === platform && s.handle.toLowerCase() === cleanHandle.toLowerCase() && s.status !== 'revoked'
    );
    if (handleReused) {
      return {
        success: false,
        message: `This social handle (${cleanHandle}) is already registered by another user. Each account can only claim once.`,
        newBonusTotal: this.getBonusBytes(),
      };
    }

    const taskMeta = DEFAULT_TASKS.find((t) => t.id === platform);
    const newSubmission: TopUpSubmission = {
      id: 'claim_' + Math.random().toString(36).substring(2, 11),
      userEmail,
      platform,
      platformName: taskMeta?.platform || platform,
      handle: cleanHandle,
      rewardBytes: FIVE_HUNDRED_GB_BYTES,
      rewardLabel: '+500 GB',
      claimedAt: new Date().toISOString(),
      status: 'verified',
      verificationMethod: options?.verificationMethod || 'smart_intent',
      dwellSeconds: options?.dwellSeconds || this.getSettings().intentSeconds,
    };

    submissions.unshift(newSubmission);
    localStorage.setItem(this.STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));

    // Credit bonus bytes
    const currentBonus = this.getBonusBytes();
    const newBonus = currentBonus + FIVE_HUNDRED_GB_BYTES;
    localStorage.setItem(this.STORAGE_KEY_BONUS, String(newBonus));

    this.notifyUpdate();

    return {
      success: true,
      message: `🎉 Success! +500 GB has been added to your Master Cloud vault!`,
      newBonusTotal: newBonus,
    };
  }

  // Admin action: Revoke a fraudulent claim
  revokeClaim(submissionId: string): boolean {
    if (typeof localStorage === 'undefined') return false;
    const submissions = this.getAllSubmissions();
    const idx = submissions.findIndex((s) => s.id === submissionId);
    if (idx === -1) return false;

    const sub = submissions[idx];
    if (sub.status === 'revoked') return true;

    sub.status = 'revoked';
    submissions[idx] = sub;
    localStorage.setItem(this.STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));

    // Deduct bonus bytes
    const currentBonus = this.getBonusBytes();
    const newBonus = Math.max(0, currentBonus - sub.rewardBytes);
    localStorage.setItem(this.STORAGE_KEY_BONUS, String(newBonus));

    this.notifyUpdate();
    return true;
  }

  private notifyUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mc_storage_updated'));
      window.dispatchEvent(new CustomEvent('mc_topup_updated'));
    }
  }
}

export const topUpService = new TopUpService();
