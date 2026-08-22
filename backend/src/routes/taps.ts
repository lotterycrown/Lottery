import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { processReward, getUserTransactionHistory } from '../services/reward.service';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';
import { CONSTANTS } from '../config/constants';
import { RateLimitError, ValidationError } from '../utils/errors';

const router = Router();

const TapRequestSchema = z.object({
  idempotencyKey: z.string().min(1),
  clientTimestamp: z.number(),
});

type TapRequest = z.infer<typeof TapRequestSchema>;

/**
 * POST /taps
 * Record a tap and award reward
 */
router.post('/', authenticate, validateBody(TapRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
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
      throw new RateLimitError();
    }

    // Check tap cooldown
    const lastTap = await prisma.tap.findFirst({
      where: { userId },
      orderBy: { serverTimestamp: 'desc' },
      take: 1,
    });

    const tapCooldownMs = config?.tapCooldownMs || CONSTANTS.DEFAULT_TAP_COOLDOWN_MS;
    if (lastTap) {
      const timeSinceLastTap = Date.now() - lastTap.serverTimestamp.getTime();
      if (timeSinceLastTap < tapCooldownMs) {
        logger.warn(`User ${userId} tapped too quickly`);
        throw new ValidationError('Tap cooldown not met');
      }
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
    });

    // Process reward (server-authoritative)
    const reward = await processReward(
      userId,
      tapReward,
      xpReward,
      CONSTANTS.TRANSACTION_TYPES.TAP,
      idempotencyKey,
      { tapId: tap.id }
    );

    // Update total taps counter
    await prisma.user.update({
      where: { id: userId },
      data: { totalTaps: { increment: 1 }, lastTapAt: new Date() },
    });

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
  } catch (error) {
    logger.error('Tap error:', error);
    if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        error: error.message,
        timestamp: Date.now(),
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
        timestamp: Date.now(),
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to process tap',
      timestamp: Date.now(),
    });
  }
});

/**
 * GET /taps/history
 * Get tap history for current user
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    logger.error('Get tap history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tap history',
      timestamp: Date.now(),
    });
  }
});

export default router;
