import { ReferralConfig } from './types';

export const DEFAULT_REFERRAL_CONFIG: Omit<ReferralConfig, 'id' | 'updatedAt' | 'updatedBy'> = {
  enabled: true,
  referrerRewardMicro: 50000,
  referredUserRewardMicro: 10000,
  referrerRewardXp: 100,
  referredUserRewardXp: 50,
  qualificationRequirement: {
    minimumTaps: 50,
    minimumLevel: 2,
    completeFirstTask: true,
  },
  maxReferralsPerDay: 100,
};
