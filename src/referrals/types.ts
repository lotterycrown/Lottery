export type ReferralStatus = 'PENDING' | 'QUALIFIED' | 'REWARDED' | 'REJECTED';

export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCodeId: string;
  status: ReferralStatus;
  createdAt: Date;
  qualifiedAt: Date | null;
  rewardedAt: Date | null;
}

export interface ReferralQualificationRequirement {
  minimumTaps: number;
  minimumLevel: number;
  completeFirstTask: boolean;
}

export interface ReferralConfig {
  id: string;
  enabled: boolean;
  referrerRewardMicro: number;
  referredUserRewardMicro: number;
  referrerRewardXp: number;
  referredUserRewardXp: number;
  qualificationRequirement: ReferralQualificationRequirement;
  maxReferralsPerDay: number;
  updatedAt: Date;
  updatedBy: string;
}

export interface ReferralProgress {
  minimumTaps: number;
  currentTaps: number;
  minimumLevel: number;
  currentLevel: number;
  taskRequired: boolean;
  taskCompleted: boolean;
}

export interface RewardTransactionInput {
  userId: string;
  type: 'REFERRAL_REWARD';
  amountMicro: number;
  xpAmount: number;
  source: 'referral';
  sourceId: string;
}

export interface ReferralStats {
  totalInvites: number;
  pending: number;
  qualified: number;
  rewarded: number;
  rewardsEarned: number;
}
