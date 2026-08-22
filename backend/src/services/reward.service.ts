import { prisma } from '../db';
import { logger } from '../utils/logger';
import { RewardResult } from '../types';
import { updateUserProgression } from './user.service';

/**
 * Process reward for user
 * Server-authoritative, validates idempotency key to prevent duplicates
 */
export const processReward = async (
  userId: string,
  amount: bigint,
  xp: number,
  type: string,
  idempotencyKey: string,
  metadata?: any
): Promise<RewardResult> => {
  try {
    // Check if reward already processed (idempotency)
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      logger.info(`Duplicate reward detected for idempotency key: ${idempotencyKey}`);
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new Error('User not found');
      return {
        success: true,
        amount: existing.amount,
        xp,
        newBalance: existing.balanceAfter,
        newLevel: user.level,
        leveledUp: false,
        transactionId: existing.id,
      };
    }

    // Process reward in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current user state
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new Error('User not found');

      const balanceBefore = user.balance;
      const balanceAfter = balanceBefore + amount;
      const newXp = user.xp + BigInt(xp);

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          idempotencyKey,
          metadata: metadata || {},
        },
      });

      // Update user balance and XP
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: balanceAfter,
          xp: newXp,
        },
      });

      return {
        transaction,
        user: updatedUser,
        balanceBefore,
        balanceAfter,
      };
    });

    // Update level and crown tier outside of transaction
    const userBefore = await prisma.user.findUnique({ where: { id: userId } });
    const updatedUser = await updateUserProgression(userId);
    const leveledUp = updatedUser.level > (userBefore?.level || 1);

    logger.info(`Reward processed for user ${userId}: +${amount} balance, +${xp} XP`);

    return {
      success: true,
      amount,
      xp,
      newBalance: result.balanceAfter,
      newLevel: updatedUser.level,
      leveledUp,
      transactionId: result.transaction.id,
    };
  } catch (error) {
    logger.error(`Failed to process reward for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get transaction history for user
 */
export const getUserTransactionHistory = async (userId: string, limit: number = 50) => {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};
