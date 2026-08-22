import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';
import { ValidationError } from '../utils/errors';

const router = Router();

const UpdateConfigSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  reason: z.string().optional(),
});

type UpdateConfigRequest = z.infer<typeof UpdateConfigSchema>;

/**
 * GET /admin/config
 * Get current game configuration
 */
router.get('/config', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await prisma.gameConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      res.status(404).json({
        success: false,
        error: 'Config not found',
        timestamp: Date.now(),
      });
      return;
    }

    res.json({
      success: true,
      data: config,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Get config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get config',
      timestamp: Date.now(),
    });
  }
});

/**
 * PATCH /admin/config
 * Update game configuration
 */
router.patch(
  '/config',
  authenticate,
  requireAdmin,
  validateBody(UpdateConfigSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { key, value, reason } = req.body as UpdateConfigRequest;
      const adminId = req.user!.id;

      // Validate key
      const validKeys = [
        'tapReward',
        'taskRewardSmall',
        'taskRewardMedium',
        'taskRewardLarge',
        'adReward',
        'referralReward',
        'referralBonusReward',
        'xpPerTap',
        'xpPerTaskSmall',
        'xpPerTaskMedium',
        'xpPerTaskLarge',
        'xpPerAd',
        'maxTapsPerHour',
        'tapCooldownMs',
        'taskClaimCooldownHours',
      ];

      if (!validKeys.includes(key)) {
        throw new ValidationError(`Invalid config key: ${key}`);
      }

      // Get current config
      const currentConfig = await prisma.gameConfig.findUnique({
        where: { id: 'default' },
      });

      if (!currentConfig) {
        throw new ValidationError('Config not found');
      }

      const previousValue = (currentConfig as any)[key];

      // Update config
      const updated = await prisma.gameConfig.update({
        where: { id: 'default' },
        data: {
          [key]: value,
          updatedBy: adminId,
        },
      });

      // Log audit trail
      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'config_update',
          resourceType: 'config',
          resourceId: 'default',
          previousValue: { [key]: previousValue },
          newValue: { [key]: value },
          reason,
          ipAddress: req.clientIp,
          userAgent: req.headers['user-agent'],
        },
      });

      logger.info(`Admin ${adminId} updated config: ${key} = ${value}`);

      res.json({
        success: true,
        data: {
          key,
          previousValue,
          newValue: value,
          config: updated,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Update config error:', error);
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          timestamp: Date.now(),
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to update config',
        timestamp: Date.now(),
      });
    }
  }
);

/**
 * GET /admin/audit-logs
 * Get audit logs
 */
router.get('/audit-logs', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.auditLog.count();

    res.json({
      success: true,
      data: {
        logs,
        total,
        limit,
        offset,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit logs',
      timestamp: Date.now(),
    });
  }
});

/**
 * GET /admin/users
 * List users (paginated)
 */
router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        lastName: true,
        balance: true,
        xp: true,
        level: true,
        crownTier: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.user.count();

    res.json({
      success: true,
      data: {
        users: users.map((u) => ({
          ...u,
          telegramId: u.telegramId.toString(),
          balance: u.balance.toString(),
          xp: u.xp.toString(),
        })),
        total,
        limit,
        offset,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
      timestamp: Date.now(),
    });
  }
});

/**
 * POST /admin/analytics
 * Get analytics for date range
 */
router.get('/analytics', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const analytics = await prisma.dailyAnalytics.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const summary = {
      period: { startDate, endDate },
      newUsers: analytics.reduce((sum, a) => sum + a.newUsers, 0),
      activeUsers: Math.max(...analytics.map((a) => a.activeUsers), 0),
      totalUsers: analytics[analytics.length - 1]?.totalUsers || 0,
      totalTaps: analytics.reduce((sum, a) => sum + Number(a.totalTaps), 0),
      totalTasksClaimed: analytics.reduce((sum, a) => sum + Number(a.totalTasksClaimed), 0),
      totalAdsWatched: analytics.reduce((sum, a) => sum + Number(a.totalAdsWatched), 0),
      totalRewardsPaid: analytics.reduce((sum, a) => sum + Number(a.totalRewardsPaid), 0),
      averageBalance: analytics.reduce((sum, a) => sum + Number(a.averageBalance), 0) / analytics.length,
    };

    res.json({
      success: true,
      data: {
        summary,
        daily: analytics,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      timestamp: Date.now(),
    });
  }
});

export default router;
