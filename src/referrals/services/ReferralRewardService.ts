import { Referral, ReferralConfig, RewardTransactionInput } from '../types';

export interface ReferralRewardStore {
  runInTransaction<T>(runner: (store: ReferralRewardStore) => Promise<T>): Promise<T>;
  createRewardTransaction(input: RewardTransactionInput): Promise<void>;
}

export class ReferralRewardService {
  constructor(private readonly store: ReferralRewardStore) {}

  async distributeRewards(referral: Referral, config: ReferralConfig): Promise<void> {
    await this.store.runInTransaction(async (tx) => {
      const referrerTransaction: RewardTransactionInput = {
        userId: referral.referrerId,
        type: 'REFERRAL_REWARD',
        amountMicro: config.referrerRewardMicro,
        xpAmount: config.referrerRewardXp,
        source: 'referral',
        sourceId: referral.id,
      };

      const referredTransaction: RewardTransactionInput = {
        userId: referral.referredUserId,
        type: 'REFERRAL_REWARD',
        amountMicro: config.referredUserRewardMicro,
        xpAmount: config.referredUserRewardXp,
        source: 'referral',
        sourceId: referral.id,
      };

      await tx.createRewardTransaction(referrerTransaction);
      await tx.createRewardTransaction(referredTransaction);
    });
  }
}
