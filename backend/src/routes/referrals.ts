import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';

const router = Router();

/**
 * GET /referrals
 * Get referral info for current user
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: Date.now(),
      });
    }

    // Get referral statistics
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
    });

    const stats = {
      total: referrals.length,
      qualified: referrals.filter((r) => r.status === 'qualified').length,
      rewarded: referrals.filter((r) => r.status === 'rewarded').length,
    };

    const miniAppUrl = process.env.TELEGRAM_MINI_APP_URL || '';
    const referralLink = `${miniAppUrl}?startapp=${user.referralCode}`;

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink,
        stats,
        referrals: referrals.map((r) => ({
          id: r.id,
          status: r.status,
          qualifiedAt: r.qualifiedAt,
          rewardClaimedAt: r.rewardClaimedAt,
        })),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Get referrals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referrals',
      timestamp: Date.now(),
    });
  }
});

/**
 * POST /referrals/:referralCode/accept
 * Accept a referral (called by referred user during signup)
 */
router.post('/:referralCode/accept', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { referralCode } = req.params;
    const userId = req.user!.id;

    const referrer = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        error: 'Invalid referral code',
        timestamp: Date.now(),
      });
    }

    if (referrer.id === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot refer yourself',
        timestamp: Date.now(),
      });
    }

    // Link referrer and referred user
    await prisma.user.update({
      where: { id: userId },
      data: { referrerId: referrer.id },
    });

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: userId,
        status: 'pending',
      },
    });

    logger.info(`Referral created: ${referrer.id} -> ${userId}`);

    res.json({
      success: true,
      data: {
        referralId: referral.id,
        status: referral.status,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Accept referral error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept referral',
      timestamp: Date.now(),
    });
  }
});

/**
 * POST /referrals/claim-reward
 * Claim referral reward (after referred user qualifies)
 */
router.post('/claim-reward', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { idempotencyKey } = req.body as { idempotencyKey: string };

    // Find qualified referrals
    const referrals = await prisma.referral.findMany({
      where: {
        referrerId: userId,
        status: 'qualified',
      },
    });

    if (referrals.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No qualified referrals to reward',
        timestamp: Date.now(),
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Referral rewards are processed automatically when referrals qualify',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Claim referral reward error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim referral reward',
      timestamp: Date.now(),
    });
  }
});

export default router;
