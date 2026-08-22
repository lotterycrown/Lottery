import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { findOrCreateUser, generateUserToken } from '../services/user.service';
import { getTelegramUserFromInitData, getStartParamFromInitData } from '../utils/telegram';
import { processReferralQualification } from '../services/referral.service';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

const LoginRequestSchema = z.object({
  initData: z.string().min(1, 'initData is required'),
});

type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * POST /auth/login
 * Authenticate user via Telegram Mini App initData
 */
router.post(
  '/login',
  validateBody(LoginRequestSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { initData } = req.body as LoginRequest;

    // Verify Telegram data
    const telegramUser = getTelegramUserFromInitData(initData);
    if (!telegramUser) {
      res.status(401).json({
        success: false,
        error: 'Invalid Telegram data',
        code: 'AUTHENTICATION_ERROR',
        timestamp: Date.now(),
      });
      return;
    }

    const telegramId = BigInt(telegramUser.id);

    // Find or create user
    const user = await findOrCreateUser(telegramId, telegramUser);

    // Handle Telegram startapp referral code (safe, server-authoritative)
    const startParam = getStartParamFromInitData(initData);
    if (startParam && !user.referrerId) {
      // Validate and apply referral — cannot refer yourself, cannot re-refer
      const referrer = await prisma.user.findUnique({
        where: { referralCode: startParam },
      });

      if (referrer && referrer.id !== user.id) {
        // Check not already referred
        const existing = await prisma.referral.findUnique({
          where: { referredId: user.id },
        });

        if (!existing) {
          try {
            await prisma.$transaction(async (tx) => {
              await tx.user.update({
                where: { id: user.id },
                data: { referrerId: referrer.id },
              });
              await tx.referral.create({
                data: {
                  referrerId: referrer.id,
                  referredId: user.id,
                  status: 'pending',
                },
              });
            });
            logger.info(`Startapp referral: ${referrer.id} -> ${user.id}`);
          } catch (refError: any) {
            // Unique constraint on referredId — safe to ignore
            if (refError?.code !== 'P2002') {
              logger.error('Startapp referral error:', refError);
            }
          }
        }
      }
    }

    // Generate JWT token
    const token = generateUserToken(user.id, user.telegramId, user.role);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Trigger qualification check for any pending referral where this user is the referred party
    const pendingReferral = await prisma.referral.findUnique({
      where: { referredId: user.id },
    });
    if (pendingReferral && pendingReferral.status !== 'rewarded') {
      processReferralQualification(pendingReferral.id).catch((e) =>
        logger.error('Qualification check error on login:', e)
      );
    }

    logger.info(`User logged in: ${user.id}`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          telegramId: user.telegramId.toString(),
          balance: user.balance.toString(),
          xp: user.xp.toString(),
          level: user.level,
          crownTier: user.crownTier,
          referralCode: user.referralCode,
          role: user.role,
        },
      },
      timestamp: Date.now(),
    });
  })
);

/**
 * GET /auth/me
 * Get current user info
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: Date.now(),
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.balance.toString(),
        xp: user.xp.toString(),
        level: user.level,
        crownTier: user.crownTier,
        totalTaps: user.totalTaps.toString(),
        referralCode: user.referralCode,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      timestamp: Date.now(),
    });
  })
);

export default router;
