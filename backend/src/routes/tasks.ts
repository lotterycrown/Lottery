import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { processReward } from '../services/reward.service.js';
import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../types/index.js';
import { CONSTANTS } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
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
 * Claim reward for completed task (idempotent, concurrent-safe)
 */
router.post(
  '/:taskId/claim',
  authenticate,
  validateBody(TaskClaimSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { taskId } = req.params;
    const { idempotencyKey } = req.body as TaskClaimRequest;
    const userId = req.user!.id;

    // Check for duplicate transaction first (idempotency: same key, return cached result)
    const existingTx = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingTx) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      res.json({
        success: true,
        data: {
          transactionId: existingTx.id,
          reward: existingTx.amount.toString(),
          xp: task?.xpReward ?? 0,
          newBalance: existingTx.balanceAfter.toString(),
          duplicate: true,
        },
        timestamp: Date.now(),
      });
      return;
    }

    // Get task
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: Date.now(),
      });
      return;
    }

    if (!task.isActive) {
      res.status(400).json({
        success: false,
        error: 'Task is not available',
        timestamp: Date.now(),
      });
      return;
    }

    // Atomically mark task as claimed using claimIdempotencyKey unique constraint.
    // updateMany with conditions on claimed=false + completed=true ensures:
    //   - Task must be completed to claim
    //   - Task must not already be claimed
    //   - Only one concurrent request can set claimIdempotencyKey (unique constraint enforces this)
    let claimResult: { count: number };
    try {
      claimResult = await prisma.taskProgress.updateMany({
        where: {
          userId,
          taskId,
          completed: true,
          claimed: false,
          claimIdempotencyKey: null, // Ensures no prior claim attempt racing
        },
        data: {
          claimed: true,
          claimedAt: new Date(),
          claimIdempotencyKey: idempotencyKey,
        },
      });
    } catch (error: any) {
      // Unique constraint violation on claimIdempotencyKey: another concurrent request claimed it
      if (error?.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: 'Task claim already in progress',
          timestamp: Date.now(),
        });
        return;
      }
      throw error;
    }

    if (claimResult.count === 0) {
      // No rows updated — check what state the task is in
      const progress = await prisma.taskProgress.findUnique({
        where: { userId_taskId: { userId, taskId } },
      });

      if (!progress) {
        res.status(400).json({
          success: false,
          error: 'Task progress not found. Complete the task first.',
          timestamp: Date.now(),
        });
        return;
      }

      if (progress.claimed) {
        res.status(400).json({
          success: false,
          error: 'Task already claimed',
          timestamp: Date.now(),
        });
        return;
      }

      if (!progress.completed) {
        res.status(400).json({
          success: false,
          error: 'Task not completed yet',
          timestamp: Date.now(),
        });
        return;
      }

      // Should not reach here
      res.status(409).json({
        success: false,
        error: 'Task claim failed. Please try again.',
        timestamp: Date.now(),
      });
      return;
    }

    // Process reward (server-authoritative — reward comes from task record, not client)
    let reward;
    try {
      reward = await processReward(
        userId,
        task.reward,
        task.xpReward,
        CONSTANTS.TRANSACTION_TYPES.TASK_CLAIM,
        idempotencyKey,
        { taskId }
      );
    } catch (rewardError) {
      // Roll back the claim mark so the user can retry
      await prisma.taskProgress.updateMany({
        where: { userId, taskId, claimIdempotencyKey: idempotencyKey },
        data: { claimed: false, claimedAt: null, claimIdempotencyKey: null },
      });
      throw rewardError;
    }

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
