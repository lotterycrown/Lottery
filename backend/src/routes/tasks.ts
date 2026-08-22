import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { processReward } from '../services/reward.service';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';
import { CONSTANTS } from '../config/constants';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = Router();

const TaskClaimSchema = z.object({
  idempotencyKey: z.string().min(1),
});

type TaskClaimRequest = z.infer<typeof TaskClaimSchema>;

/**
 * GET /tasks
 * List available tasks for current user
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
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
        progress: progress ? {
          currentCount: progress.currentCount,
          completed: progress.completed,
          claimed: progress.claimed,
          completedAt: progress.completedAt,
          claimedAt: progress.claimedAt,
        } : null,
      };
    });

    res.json({
      success: true,
      data: tasksWithProgress,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tasks',
      timestamp: Date.now(),
    });
  }
});

/**
 * POST /tasks/:taskId/claim
 * Claim reward for completed task
 */
router.post('/:taskId/claim', authenticate, validateBody(TaskClaimSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { idempotencyKey } = req.body as TaskClaimRequest;
    const userId = req.user!.id;

    // Get task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    if (!task.isActive) {
      throw new ValidationError('Task is not available');
    }

    // Get task progress
    const progress = await prisma.taskProgress.findUnique({
      where: {
        userId_taskId: { userId, taskId },
      },
    });

    if (!progress) {
      throw new ValidationError('Task progress not found');
    }

    if (progress.claimed) {
      throw new ValidationError('Task already claimed');
    }

    if (!progress.completed) {
      throw new ValidationError('Task not completed');
    }

    // Check cooldown if applicable
    if (task.claimCooldownHours > 0 && progress.claimedAt) {
      const cooldownMs = task.claimCooldownHours * 60 * 60 * 1000;
      const timeSinceClaim = Date.now() - progress.claimedAt.getTime();
      if (timeSinceClaim < cooldownMs) {
        throw new ValidationError('Task claim cooldown not met');
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
  } catch (error) {
    logger.error('Claim task error:', error);
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        timestamp: Date.now(),
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to claim task',
      timestamp: Date.now(),
    });
  }
});

export default router;
