import { prisma } from '../db';
import { logger } from '../utils/logger';

/**
 * Update task progress for gameplay tasks (tap-based).
 * Called after each tap to advance "total taps" style tasks.
 * Idempotent: only increments progress up to targetCount.
 */
export const updateGameplayTaskProgress = async (
  userId: string,
  totalTaps: bigint
): Promise<void> => {
  try {
    const gameplayTasks = await prisma.task.findMany({
      where: { isActive: true, type: 'gameplay' },
    });

    for (const task of gameplayTasks) {
      const tapCount = Number(totalTaps);
      const newCount = Math.min(tapCount, task.targetCount);

      const existing = await prisma.taskProgress.findUnique({
        where: { userId_taskId: { userId, taskId: task.id } },
      });

      if (existing?.completed) continue; // already done

      if (existing) {
        if (existing.currentCount >= task.targetCount) {
          // Mark completed if not already
          await prisma.taskProgress.update({
            where: { userId_taskId: { userId, taskId: task.id } },
            data: {
              currentCount: task.targetCount,
              completed: true,
              completedAt: existing.completedAt ?? new Date(),
            },
          });
        } else if (newCount > existing.currentCount) {
          const completed = newCount >= task.targetCount;
          await prisma.taskProgress.update({
            where: { userId_taskId: { userId, taskId: task.id } },
            data: {
              currentCount: newCount,
              completed,
              completedAt: completed ? new Date() : undefined,
            },
          });
        }
      } else {
        const completed = newCount >= task.targetCount;
        await prisma.taskProgress.create({
          data: {
            userId,
            taskId: task.id,
            currentCount: newCount,
            completed,
            completedAt: completed ? new Date() : null,
          },
        });
      }
    }
  } catch (error) {
    logger.error(`Failed to update gameplay task progress for user ${userId}:`, error);
    // Non-fatal: do not throw
  }
};

/**
 * Update task progress for level/special tasks.
 * Called after user level changes.
 */
export const updateSpecialTaskProgress = async (
  userId: string,
  level: number
): Promise<void> => {
  try {
    const specialTasks = await prisma.task.findMany({
      where: { isActive: true, type: 'special' },
    });

    for (const task of specialTasks) {
      const newCount = Math.min(level, task.targetCount);

      const existing = await prisma.taskProgress.findUnique({
        where: { userId_taskId: { userId, taskId: task.id } },
      });

      if (existing?.completed) continue;

      if (existing) {
        if (newCount > existing.currentCount) {
          const completed = newCount >= task.targetCount;
          await prisma.taskProgress.update({
            where: { userId_taskId: { userId, taskId: task.id } },
            data: {
              currentCount: newCount,
              completed,
              completedAt: completed ? new Date() : undefined,
            },
          });
        }
      } else {
        const completed = newCount >= task.targetCount;
        await prisma.taskProgress.create({
          data: {
            userId,
            taskId: task.id,
            currentCount: newCount,
            completed,
            completedAt: completed ? new Date() : null,
          },
        });
      }
    }
  } catch (error) {
    logger.error(`Failed to update special task progress for user ${userId}:`, error);
  }
};

/**
 * Update task progress for referral tasks.
 * Called after a referral qualifies.
 */
export const updateReferralTaskProgress = async (
  referrerId: string
): Promise<void> => {
  try {
    const referralTasks = await prisma.task.findMany({
      where: { isActive: true, type: 'referral' },
    });

    // Count qualified referrals for this user
    const qualifiedCount = await prisma.referral.count({
      where: {
        referrerId,
        status: { in: ['qualified', 'rewarded'] },
      },
    });

    for (const task of referralTasks) {
      const newCount = Math.min(qualifiedCount, task.targetCount);

      const existing = await prisma.taskProgress.findUnique({
        where: { userId_taskId: { userId: referrerId, taskId: task.id } },
      });

      if (existing?.completed) continue;

      if (existing) {
        if (newCount > existing.currentCount) {
          const completed = newCount >= task.targetCount;
          await prisma.taskProgress.update({
            where: { userId_taskId: { userId: referrerId, taskId: task.id } },
            data: {
              currentCount: newCount,
              completed,
              completedAt: completed ? new Date() : undefined,
            },
          });
        }
      } else {
        const completed = newCount >= task.targetCount;
        await prisma.taskProgress.create({
          data: {
            userId: referrerId,
            taskId: task.id,
            currentCount: newCount,
            completed,
            completedAt: completed ? new Date() : null,
          },
        });
      }
    }
  } catch (error) {
    logger.error(`Failed to update referral task progress for user ${referrerId}:`, error);
  }
};
