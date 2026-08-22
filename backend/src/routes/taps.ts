import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { processReward, getUserTransactionHistory } from '../services/reward.service';
import { updateGameplayTaskProgress, updateSpecialTaskProgress } from '../services/task.service';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';
import { CONSTANTS } from '../config/constants';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

const TapRequestSchema = z.object({
  idempotencyKey: z.string().min(1, 'idempotencyKey is required'),
  clientTimestamp: z.number().int().positive('clientTimestamp must be positive'),
});

type TapRequest = z.infer<typeof TapRequestSchema>;

/**
 * POST /taps
 * Record a tap and award reward
 */
router.post(
  '/',
  authenticate,
  validateBody(TapRequestSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { idempotencyKey, clientTimestamp } = req.body as TapRequest;
    const userId = req.user!.id;

    // Get game config for current reward value
    const config = await prisma.gameConfig.findUnique({
      where: { id: 'default' },
    });

    const tapReward = config?.tapReward || BigInt(CONSTANTS.DEFAULT_TAP_REWARD);
    const xpReward = config?.xpPerTap || CONSTANTS.DEFAULT_XP_PER_TAP;

    // Rate limiting: Check taps in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const tapsThisHour = await prisma.tap.count({
      where: {
        userId,
        serverTimestamp: { gte: oneHourAgo },
      },
    });

    const maxTapsPerHour = config?.maxTapsPerHour || CONSTANTS.DEFAULT_MAX_TAPS_PER_HOUR;
    if (tapsThisHour >= maxTapsPerHour) {
      logger.warn(`User ${userId} exceeded tap rate limit`);
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT',
        timestamp: Date.now(),
      });
    }

    // Record tap
    const tap = await prisma.tap.create({
      data: {
        userId,
        reward: tapReward,
        xpReward,
        idempotencyKey,
        clientTimestamp: new Date(clientTimestamp),
        ipAddress: req.clientIp,
        userAgent: req.headers['user-agent'],
      },
    }).catch((error) => {
      // Duplicate key error
      if (error.code === 'P2002') {
        return null;
      }
      throw error;
    });

    // Process reward (server-authoritative)
    const reward = await processReward(
      userId,
      tapReward,
      xpReward,
      CONSTANTS.TRANSACTION_TYPES.TAP,
      idempotencyKey,
      { tapId: tap?.id }
    );

    // Update total taps counter
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { totalTaps: { increment: 1 }, lastTapAt: new Date() },
    });

    // Update server-side task progress (gameplay + level-based tasks)
    await updateGameplayTaskProgress(userId, updatedUser.totalTaps);
    await updateSpecialTaskProgress(userId, reward.newLevel);

    logger.info(`Tap recorded for user ${userId}`);

    res.json({
      success: true,
      data: {
        transactionId: reward.transactionId,
        reward: reward.amount.toString(),
        xp: reward.xp,
        newBalance: reward.newBalance.toString(),
        newLevel: reward.newLevel,
        leveledUp: reward.leveledUp,
      },
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /taps/history
 * Get tap history for current user
 */
router.get(
  '/history',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const transactions = await getUserTransactionHistory(userId, limit);

    res.json({
      success: true,
      data: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toString(),
        balanceBefore: t.balanceBefore.toString(),
        balanceAfter: t.balanceAfter.toString(),
        createdAt: t.createdAt,
      })),
      timestamp: Date.now(),
    });
  })
);

export default router;
