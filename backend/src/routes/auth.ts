import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { findOrCreateUser, generateUserToken } from '../services/user.service';
import { getTelegramUserFromInitData } from '../utils/telegram';
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
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { initData } = req.body as LoginRequest;

    // Verify Telegram data
    const telegramUser = getTelegramUserFromInitData(initData);
    if (!telegramUser) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Telegram data',
        code: 'AUTHENTICATION_ERROR',
        timestamp: Date.now(),
      });
    }

    const telegramId = BigInt(telegramUser.id);

    // Find or create user
    const user = await findOrCreateUser(telegramId, telegramUser);

    // Generate JWT token
    const token = generateUserToken(user.id, user.telegramId, user.role);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

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
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: Date.now(),
      });
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
