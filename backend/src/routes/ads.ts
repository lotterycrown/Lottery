import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { prisma } from '../db';
import { processReward } from '../services/reward.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';
import { CONSTANTS } from '../config/constants';
import { ValidationError } from '../utils/errors';

const router = Router();

const AdViewSchema = z.object({
  provider: z.string().min(1),
  adUnitId: z.string().optional(),
  clientVerificationToken: z.string().optional(),
  idempotencyKey: z.string().min(1),
});

type AdViewRequest = z.infer<typeof AdViewSchema>;

/**
 * POST /ads/view
 * Record ad view and award reward
 * Provider verification happens server-side
 */
router.post('/view', authenticate, validateBody(AdViewSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { provider, adUnitId, clientVerificationToken, idempotencyKey } = req.body as AdViewRequest;
    const userId = req.user!.id;

    // Check for duplicate ad view
    const existing = await prisma.adView.findFirst({
      where: {
        userId,
        // In production, would also check provider response data
      },
      orderBy: { watchedAt: 'desc' },
      take: 1,
    });

    // Prevent multiple ads in quick succession (simple rate limiting)
    if (existing && Date.now() - existing.watchedAt.getTime() < 5000) {
      throw new ValidationError('Please wait before watching another ad');
    }

    // Get game config for ad reward
    const config = await prisma.gameConfig.findUnique({
      where: { id: 'default' },
    });

    const adReward = config?.adReward || BigInt(CONSTANTS.DEFAULT_AD_REWARD);
    const xpReward = config?.xpPerAd || CONSTANTS.DEFAULT_XP_PER_AD;

    // Create ad view record
    const adView = await prisma.adView.create({
      data: {
        userId,
        reward: adReward,
        provider,
        adUnitId,
        verified: false, // Will be verified asynchronously
        clientVerificationToken,
      },
    });

    // Award reward (pending verification)
    const reward = await processReward(
      userId,
      adReward,
      xpReward,
      CONSTANTS.TRANSACTION_TYPES.AD_VIEW,
      idempotencyKey,
      { adViewId: adView.id, provider }
    );

    // TODO: In production, verify ad with provider here
    // For now, mark as verified since no provider is configured
    await prisma.adView.update({
      where: { id: adView.id },
      data: {
        verified: true,
        verificationTimestamp: new Date(),
      },
    });

    logger.info(`Ad view recorded for user ${userId}: ${provider}`);

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
    logger.error('Ad view error:', error);
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: Date.now(),
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to record ad view',
      timestamp: Date.now(),
    });
  }
});

/**
 * GET /ads/config
 * Get ad provider configuration
 */
router.get('/config', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const provider = process.env.AD_PROVIDER || CONSTANTS.AD_PROVIDERS.NONE;

    res.json({
      success: true,
      data: {
        provider,
        configured: provider !== CONSTANTS.AD_PROVIDERS.NONE,
        note: provider === CONSTANTS.AD_PROVIDERS.NONE ? 'No ad provider configured' : `Using ${provider}`,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Get ad config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ad config',
      timestamp: Date.now(),
    });
  }
});

export default router;
