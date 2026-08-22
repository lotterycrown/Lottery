export type RewardedAdResult = {
  status: 'completed' | 'closed' | 'failed' | 'unavailable';
  provider: string;
  placementId?: string;
  transactionId?: string;
};

export type AdStatus = {
  initialized: boolean;
  available: boolean;
  provider: string;
  reason?: string;
};

export interface AdProvider {
  initialize(): Promise<void>;
  isAvailable(): Promise<boolean>;
  showRewardedAd(placementId: string): Promise<RewardedAdResult>;
  getStatus(): AdStatus;
}

export type AdProviderName = 'mock' | 'telegram';

export type AdConfig = {
  enabled: boolean;
  provider: AdProviderName;
  rewardMicro: number;
  rewardXp: number;
  dailyUserLimit: number;
  cooldownSeconds: number;
  placementId: string;
};

export type AdAvailability = {
  cooldownUntil: number | null;
  dailyRewardsCount: number;
  dailyUserLimit: number;
  isAvailable: boolean;
};

export type AdSessionResponse = {
  adSessionId: string;
  provider: AdProviderName;
  placementId: string;
  expiresAt: number;
};

export type AdRewardResponse = {
  adSessionId: string;
  rewardMicro: number;
  rewardXp: number;
  transactionId: string;
};
