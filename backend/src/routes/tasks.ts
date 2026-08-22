import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { processReward } from '../services/reward.service';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';
import { CONSTANTS } from '../config/constants';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

const TaskClaimSchema = z.object({
  idempotencyKey: z.string().min(1, 'idempotencyKey is required'),
});

type TaskClaimRequest = z.infer<typeof TaskClaimSchema>;

/**
 * GET /tasks
 * List available tasks for current user
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const tasks = await prisma.task.findMany({
      where: { isActive: true },
    });

    // Get user progress for each task
    const userProgress = await prisma.taskProgress.findMany({
      where: {
        userId,
        taskId: { in: tasks.map((t) => t.id) },
      },
    });

    const progressMap = new Map(userProgress.map((p) => [p.taskId, p]));

    const tasksWithProgress = tasks.map((task) => {
      const progress = progressMap.get(task.id);
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        requirement: task.requirement,
        reward: task.reward.toString(),
        xpReward: task.xpReward,
        targetCount: task.targetCount,
        progress: progress
          ? {
              currentCount: progress.currentCount,
              completed: progress.completed,
              claimed: progress.claimed,
              completedAt: progress.completedAt,
              claimedAt: progress.claimedAt,
            }
          : null,
      };
    });

    res.json({
      success: true,
      data: tasksWithProgress,
      timestamp: Date.now(),
    });
  })
);

/**
 * POST /tasks/:taskId/claim
 * Claim reward for completed task
 */
router.post(
  '/:taskId/claim',
  authenticate,
  validateBody(TaskClaimSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { taskId } = req.params;
    const { idempotencyKey } = req.body as TaskClaimRequest;
    const userId = req.user!.id;

    // Get task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: Date.now(),
      });
    }

    if (!task.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Task is not available',
        timestamp: Date.now(),
      });
    }

    // Get task progress
    const progress = await prisma.taskProgress.findUnique({
      where: {
        userId_taskId: { userId, taskId },
      },
    });

    if (!progress) {
      return res.status(400).json({
        success: false,
        error: 'Task progress not found',
        timestamp: Date.now(),
      });
    }

    if (progress.claimed) {
      return res.status(400).json({
        success: false,
        error: 'Task already claimed',
        timestamp: Date.now(),
      });
    }

    if (!progress.completed) {
      return res.status(400).json({
        success: false,
        error: 'Task not completed',
        timestamp: Date.now(),
      });
    }

    // Check cooldown if applicable
    if (task.claimCooldownHours > 0 && progress.claimedAt) {
      const cooldownMs = task.claimCooldownHours * 60 * 60 * 1000;
      const timeSinceClaim = Date.now() - progress.claimedAt.getTime();
      if (timeSinceClaim < cooldownMs) {
        return res.status(400).json({
          success: false,
          error: 'Task claim cooldown not met',
          timestamp: Date.now(),
        });
      }
    }

    // Check for duplicate claim (idempotency)
    const existingClaim = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingClaim) {
      return res.json({
        success: true,
        data: {
          transactionId: existingClaim.id,
          reward: existingClaim.amount.toString(),
          xp: task.xpReward,
          newBalance: existingClaim.balanceAfter.toString(),
          duplicate: true,
        },
        timestamp: Date.now(),
      });
    }

    // Process reward
    const reward = await processReward(
      userId,
      task.reward,
      task.xpReward,
      CONSTANTS.TRANSACTION_TYPES.TASK_CLAIM,
      idempotencyKey,
      { taskId }
    );

    // Mark task as claimed
    await prisma.taskProgress.update({
      where: { userId_taskId: { userId, taskId } },
      data: {
        claimed: true,
        claimedAt: new Date(),
        claimIdempotencyKey: idempotencyKey,
      },
    });

    logger.info(`Task claimed by user ${userId}: ${taskId}`);

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

export default router;
