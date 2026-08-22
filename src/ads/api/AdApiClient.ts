import { AdAvailability, AdConfig, AdRewardResponse, AdSessionResponse, AdProviderName } from '../types';

type SessionState = {
  id: string;
  provider: AdProviderName;
  placementId: string;
  createdAt: number;
  expiresAt: number;
  rewarded: boolean;
};

const MICRO_PER_COIN = 1_000_000;
const makeId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}`;

const envNumber = (name: string, fallback: number): number => {
  const value = Number(import.meta.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

const localConfig: AdConfig = {
  enabled: String(import.meta.env.VITE_AD_ENABLED ?? 'true') !== 'false',
  provider: (import.meta.env.VITE_AD_PROVIDER as AdProviderName) ?? 'mock',
  rewardMicro: envNumber('VITE_AD_REWARD_MICRO', 1000),
  rewardXp: envNumber('VITE_AD_REWARD_XP', 10),
  dailyUserLimit: envNumber('VITE_AD_DAILY_LIMIT', 50),
  cooldownSeconds: envNumber('VITE_AD_COOLDOWN_SECONDS', 30),
  placementId: (import.meta.env.VITE_TELEGRAM_AD_PLACEMENT_ID as string) || 'mock-placement',
};

const localSessions = new Map<string, SessionState>();
const rewardedTransactions = new Set<string>();
const rewardedSessionIds = new Set<string>();
let localLastRewardedAt: number | null = null;
const localDailyRewards = new Map<string, number>();

const todayKey = (): string => new Date().toISOString().slice(0, 10);

const getDailyRewardsCount = (): number => localDailyRewards.get(todayKey()) ?? 0;

const setDailyRewardsCount = (value: number): void => {
  localDailyRewards.set(todayKey(), value);
};

const getCooldownUntil = (): number | null => {
  if (!localLastRewardedAt) return null;
  return localLastRewardedAt + localConfig.cooldownSeconds * 1000;
};

const getLocalAvailability = (): AdAvailability => {
  const cooldownUntil = getCooldownUntil();
  const now = Date.now();
  const dailyRewardsCount = getDailyRewardsCount();
  const onCooldown = Boolean(cooldownUntil && cooldownUntil > now);
  const hasCapacity = dailyRewardsCount < localConfig.dailyUserLimit;

  return {
    cooldownUntil,
    dailyRewardsCount,
    dailyUserLimit: localConfig.dailyUserLimit,
    isAvailable: localConfig.enabled && hasCapacity && !onCooldown,
  };
};

export class AdApiClient {
  constructor(private readonly baseUrl = '/api/ads') {}

  private shouldUseFallback(): boolean {
    return import.meta.env.MODE !== 'production';
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `Request failed: ${response.status}` }));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async getConfig(): Promise<AdConfig> {
    try {
      return await this.request<AdConfig>('/config');
    } catch (error) {
      if (!this.shouldUseFallback()) {
        throw error;
      }

      if (localConfig.provider === 'mock' && import.meta.env.MODE === 'production') {
        throw new Error('Mock ad provider cannot be used in production mode');
      }

      return localConfig;
    }
  }

  async createSession(): Promise<AdSessionResponse> {
    try {
      return await this.request<AdSessionResponse>('/session', { method: 'POST' });
    } catch (error) {
      if (!this.shouldUseFallback()) {
        throw error;
      }

      const availability = getLocalAvailability();
      if (!localConfig.enabled) throw new Error('Ads are disabled');
      if (!availability.isAvailable) {
        if (availability.dailyRewardsCount >= availability.dailyUserLimit) {
          throw new Error('Daily ad limit reached');
        }
        throw new Error('Ad cooldown is active');
      }

      const adSessionId = `local_ad_session_${makeId()}`;
      const expiresAt = Date.now() + 10 * 60 * 1000;

      localSessions.set(adSessionId, {
        id: adSessionId,
        provider: localConfig.provider,
        placementId: localConfig.placementId,
        createdAt: Date.now(),
        expiresAt,
        rewarded: false,
      });

      return {
        adSessionId,
        provider: localConfig.provider,
        placementId: localConfig.placementId,
        expiresAt,
      };
    }
  }

  async submitReward(payload: {
    adSessionId: string;
    provider: AdProviderName;
    verificationToken?: string;
    transactionId?: string;
  }): Promise<AdRewardResponse> {
    try {
      return await this.request<AdRewardResponse>('/reward', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (!this.shouldUseFallback()) {
        throw error;
      }

      const session = localSessions.get(payload.adSessionId);
      if (!session) throw new Error('Ad session not found');
      if (session.rewarded || rewardedSessionIds.has(session.id)) throw new Error('Ad session already rewarded');
      if (session.expiresAt < Date.now()) throw new Error('Ad session expired');
      if (session.provider !== payload.provider) throw new Error('Provider mismatch');

      const transactionId = payload.transactionId || `local_txn_${makeId()}`;
      if (rewardedTransactions.has(transactionId)) throw new Error('Duplicate ad transaction');

      if (localConfig.provider === 'mock' && import.meta.env.MODE === 'production') {
        throw new Error('Mock ad provider cannot be verified in production mode');
      }

      rewardedTransactions.add(transactionId);
      rewardedSessionIds.add(session.id);
      session.rewarded = true;
      localLastRewardedAt = Date.now();
      setDailyRewardsCount(getDailyRewardsCount() + 1);

      return {
        adSessionId: session.id,
        rewardMicro: localConfig.rewardMicro,
        rewardXp: localConfig.rewardXp,
        transactionId,
      };
    }
  }

  async getStatus(): Promise<AdAvailability> {
    try {
      return await this.request<AdAvailability>('/status');
    } catch (error) {
      if (!this.shouldUseFallback()) {
        throw error;
      }
      return getLocalAvailability();
    }
  }

  static microToCoins(micro: number): number {
    return micro / MICRO_PER_COIN;
  }
}
