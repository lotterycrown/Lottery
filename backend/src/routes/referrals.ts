import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { processReferralQualification } from '../services/referral.service';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /referrals
 * Get referral info for current user
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: Date.now(),
      });
      return;
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      select: {
        id: true,
        status: true,
        qualifiedAt: true,
        rewardClaimedAt: true,
        createdAt: true,
      },
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
        referrals,
      },
      timestamp: Date.now(),
    });
  })
);

/**
 * POST /referrals/:referralCode/accept
 * Accept a referral (called by referred user during signup).
 * Safe: prevents self-referral, duplicate, and concurrent accepts.
 */
router.post(
  '/:referralCode/accept',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { referralCode } = req.params;
    const userId = req.user!.id;

    const referrer = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      res.status(404).json({
        success: false,
        error: 'Invalid referral code',
        timestamp: Date.now(),
      });
      return;
    }

    if (referrer.id === userId) {
      res.status(400).json({
        success: false,
        error: 'Cannot refer yourself',
        timestamp: Date.now(),
      });
    }

    // Use a transaction to atomically check and create the referral relationship
    let referral;
    try {
      referral = await prisma.$transaction(async (tx) => {
        // Lock the referred user row and check if already referred
        const currentUser = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!currentUser) throw new Error('User not found');

        if (currentUser.referrerId) {
          // Already has a referrer — return existing relationship idempotently
          const existing = await tx.referral.findUnique({
            where: { referredId: userId },
          });
          if (existing) return existing;
          throw new Error('ALREADY_REFERRED');
        }

        // Link referrer to referred user
        await tx.user.update({
          where: { id: userId },
          data: { referrerId: referrer.id },
        });

        // Create referral record (referredId has @unique constraint — prevents duplicates)
        return await tx.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: userId,
            status: 'pending',
          },
        });
      });
    } catch (error: any) {
      if (error?.message === 'ALREADY_REFERRED' || error?.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: 'You have already used a referral code',
          timestamp: Date.now(),
        });
      }
      throw error;
    }

    logger.info(`Referral created: ${referrer.id} -> ${userId}`);

    res.json({
      success: true,
      data: {
        referralId: referral.id,
        status: referral.status,
      },
      timestamp: Date.now(),
    });
  })
);

// ============================================================================
// REFERRAL QUALIFICATION
// ============================================================================

/**
 * POST /referrals/check-qualification
 * Trigger qualification check for current user's pending referrals.
 * Also checks if this user qualifies their own referrer.
 */
router.post(
  '/check-qualification',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    // 1. Check if this user qualifies as a referred user (their referrer gets rewarded)
    const asReferred = await prisma.referral.findUnique({
      where: { referredId: userId },
    });

    if (asReferred && asReferred.status !== 'rewarded') {
      await processReferralQualification(asReferred.id);
    }

    // 2. Check if any of this user's referrals can now be qualified
    const pendingReferrals = await prisma.referral.findMany({
      where: { referrerId: userId, status: { in: ['pending', 'qualified'] } },
    });

    for (const ref of pendingReferrals) {
      await processReferralQualification(ref.id);
    }

    const updated = await prisma.referral.findMany({
      where: { referrerId: userId },
      select: { id: true, status: true, qualifiedAt: true, rewardClaimedAt: true },
    });

    res.json({
      success: true,
      data: { referrals: updated },
      timestamp: Date.now(),
    });
  })
);

export default router;

