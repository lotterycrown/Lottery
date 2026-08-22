export type RuntimeAdConfig = {
  enabled: boolean;
  provider: 'mock' | 'telegram';
  rewardMicro: number;
  rewardXp: number;
  dailyUserLimit: number;
  cooldownSeconds: number;
  placementId: string;
};

const toInt = (input: string | undefined, fallback: number): number => {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getRuntimeAdConfig = (): RuntimeAdConfig => {
  const provider = (process.env.AD_PROVIDER || 'mock') as RuntimeAdConfig['provider'];

  return {
    enabled: process.env.AD_ENABLED !== 'false',
    provider,
    rewardMicro: toInt(process.env.AD_REWARD_MICRO, 1000),
    rewardXp: toInt(process.env.AD_REWARD_XP, 10),
    dailyUserLimit: toInt(process.env.AD_DAILY_LIMIT, 50),
    cooldownSeconds: toInt(process.env.AD_COOLDOWN_SECONDS, 30),
    placementId: process.env.TELEGRAM_AD_PLACEMENT_ID || 'mock-placement',
  };
};

export const assertProviderAllowedForEnvironment = (provider: RuntimeAdConfig['provider']): void => {
  if (process.env.NODE_ENV === 'production' && provider === 'mock') {
    throw new Error('Mock ad provider is blocked in production');
  }
};
