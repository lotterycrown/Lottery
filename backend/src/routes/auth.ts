import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { findOrCreateUser, generateUserToken } from '../services/user.service';
import { getTelegramUserFromInitData } from '../utils/telegram';
import { AuthenticationError, ValidationError } from '../utils/errors';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';

const router = Router();

const LoginRequestSchema = z.object({
  initData: z.string().min(1),
});

type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * POST /auth/login
 * Authenticate user via Telegram Mini App initData
 */
router.post('/login', validateBody(LoginRequestSchema), async (req: Request, res: Response) => {
  try {
    const { initData } = req.body as LoginRequest;

    // Verify Telegram data
    const telegramUser = getTelegramUserFromInitData(initData);
    if (!telegramUser) {
      throw new AuthenticationError('Invalid Telegram data');
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
          balance: user.balance,
          xp: user.xp,
          level: user.level,
          crownTier: user.crownTier,
          referralCode: user.referralCode,
          role: user.role,
        },
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Login error:', error);
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        timestamp: Date.now(),
      });
    }
    res.status(500).json({
      success: false,
      error: 'Login failed',
      timestamp: Date.now(),
    });
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
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
        balance: user.balance,
        xp: user.xp,
        level: user.level,
        crownTier: user.crownTier,
        totalTaps: user.totalTaps,
        referralCode: user.referralCode,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      timestamp: Date.now(),
    });
  }
});

export default router;
