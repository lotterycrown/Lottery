import { ReferralConfig } from '../types';
import { ReferralRewardService } from './ReferralRewardService';

export interface PendingReferralRecord {
  id: string;
  status: 'PENDING' | 'QUALIFIED' | 'REWARDED' | 'REJECTED';
  referredUserId: string;
  referrerId: string;
  referralCodeId: string;
  createdAt: Date;
  qualifiedAt: Date | null;
  rewardedAt: Date | null;
}

export interface ReferralQualificationStore {
  runInTransaction<T>(runner: (store: ReferralQualificationStore) => Promise<T>): Promise<T>;
  findPendingReferralsByReferredUserId(userId: string): Promise<PendingReferralRecord[]>;
  updateReferral(referralId: string, patch: Partial<PendingReferralRecord>): Promise<PendingReferralRecord>;
  getProgress(userId: string): Promise<{ taps: number; level: number; firstTaskCompleted: boolean }>;
}

export class ReferralQualificationService {
  constructor(
    private readonly store: ReferralQualificationStore,
    private readonly rewardService: ReferralRewardService,
    private readonly configProvider: () => Promise<ReferralConfig>,
  ) {}

  async checkPendingReferrals(userId: string): Promise<number> {
    const pending = await this.store.findPendingReferralsByReferredUserId(userId);
    if (!pending.length) {
      return 0;
    }

    const config = await this.configProvider();
    const progress = await this.store.getProgress(userId);
    let rewardedCount = 0;

    for (const referral of pending) {
      if (referral.status !== 'PENDING') {
        continue;
      }

      const req = config.qualificationRequirement;
      const qualifies =
        progress.taps >= req.minimumTaps &&
        progress.level >= req.minimumLevel &&
        (!req.completeFirstTask || progress.firstTaskCompleted);

      if (!qualifies) {
        continue;
      }

      await this.store.runInTransaction(async (tx) => {
        const qualifiedReferral = await tx.updateReferral(referral.id, {
          status: 'QUALIFIED',
          qualifiedAt: new Date(),
        });

        await this.rewardService.distributeRewards(qualifiedReferral, config);

        await tx.updateReferral(referral.id, {
          status: 'REWARDED',
          rewardedAt: new Date(),
        });
      });

      rewardedCount += 1;
    }

    return rewardedCount;
  }
}
