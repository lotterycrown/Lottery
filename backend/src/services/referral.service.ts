import { prisma } from '../db';
import { logger } from '../utils/logger';
import { processReward } from './reward.service';
import { updateReferralTaskProgress } from './task.service';
import { CONSTANTS } from '../config/constants';

/**
 * Process referral qualification and reward for a single referral.
 * Idempotent: safe to call multiple times for the same referral.
 * Concurrent-safe: uses DB unique constraint on claimIdempotencyKey.
 */
export const processReferralQualification = async (referralId: string): Promise<void> => {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    include: { referred: true },
  });

  if (!referral || referral.status === 'rewarded') return;

  const referred = referral.referred;
  if (!referred) return;

  // Check qualification: referred user must have earned at least the threshold
  if (referred.balance < referral.qualificationThreshold) return;

  // Transition to qualified if still pending
  if (referral.status === 'pending') {
    await prisma.referral.updateMany({
      where: { id: referralId, status: 'pending' },
      data: { status: 'qualified', qualifiedAt: new Date(), qualificationMet: true },
    });
    // Update referral task progress for referrer
    await updateReferralTaskProgress(referral.referrerId);
  }

  // Get latest referral state
  const updated = await prisma.referral.findUnique({ where: { id: referralId } });
  if (!updated || updated.status !== 'qualified') return;

  // Generate stable idempotency key for the referral reward
  const idempotencyKey = `referral-reward-${referralId}`;

  // Prevent double-payment: check existing transaction
  const existingTx = await prisma.transaction.findUnique({
    where: { idempotencyKey },
  });
  if (existingTx) {
    // Reward was already paid — ensure status is rewarded
    await prisma.referral.updateMany({
      where: { id: referralId, status: 'qualified' },
      data: { status: 'rewarded', rewardClaimedAt: existingTx.createdAt },
    });
    return;
  }

  // Atomically set claimIdempotencyKey (unique) to prevent concurrent rewards
  let claimResult: { count: number };
  try {
    claimResult = await prisma.referral.updateMany({
      where: { id: referralId, status: 'qualified', claimIdempotencyKey: null },
      data: { claimIdempotencyKey: idempotencyKey },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') return; // Already being processed concurrently
    throw error;
  }

  if (claimResult.count === 0) return; // Another process is handling this

  // Get game config for reward amount
  const config = await prisma.gameConfig.findUnique({ where: { id: 'default' } });
  const referralReward = config?.referralReward ?? BigInt(CONSTANTS.DEFAULT_REFERRAL_REWARD);

  // Pay reward to referrer
  await processReward(
    referral.referrerId,
    referralReward,
    0,
    CONSTANTS.TRANSACTION_TYPES.REFERRAL_REWARD,
    idempotencyKey,
    { referralId }
  );

  // Mark referral as rewarded
  await prisma.referral.updateMany({
    where: { id: referralId, status: 'qualified' },
    data: { status: 'rewarded', rewardClaimedAt: new Date() },
  });

  logger.info(`Referral reward processed: referral ${referralId} -> referrer ${referral.referrerId}`);
};
