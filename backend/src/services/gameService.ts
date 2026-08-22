import {
  Prisma,
  RewardType,
  TaskStatus,
  type GameConfig,
  type PlayerProgress,
  type PrismaClient,
  type User,
} from '@prisma/client';
import { crownTierFromLevel, levelFromXp, coinsMicroToCoins } from '../../../shared/game/progression';
import type { ClientTask, GameConfigDTO, GameStateDTO } from '../../../shared/types/api';
import { ApiError } from '../utils/api';

const MAX_MIGRATION_COINS_MICRO = 2_000_000_000;
const MAX_MIGRATION_XP = 150_000;
const MAX_MIGRATION_TAPS = 1_000_000;

type Tx = Prisma.TransactionClient;

export type MigrationPayload = {
  coins?: number;
  xp?: number;
  totalTaps?: number;
  completed?: boolean;
};

const normalizeMigration = (input?: MigrationPayload) => {
  if (!input) {
    return null;
  }

  const coinsMicro = Math.max(0, Math.min(MAX_MIGRATION_COINS_MICRO, Math.round((input.coins ?? 0) * 1_000_000)));
  const xp = Math.max(0, Math.min(MAX_MIGRATION_XP, Math.floor(input.xp ?? 0)));
  const totalTaps = Math.max(0, Math.min(MAX_MIGRATION_TAPS, Math.floor(input.totalTaps ?? 0)));

  return { coinsMicro, xp, totalTaps, completed: input.completed === true };
};

const taskStateFromTaps = (totalTaps: number, target: number, unlockAfterTaps: number) => {
  if (totalTaps < unlockAfterTaps) {
    return { progress: Math.min(totalTaps, target), status: TaskStatus.locked };
  }

  const progress = Math.min(totalTaps, target);
  if (progress >= target) {
    return { progress, status: TaskStatus.completed };
  }

  return { progress, status: TaskStatus.in_progress };
};

const ensureUserTasks = async (tx: Tx, userId: string, totalTaps: number) => {
  const definitions = await tx.taskDefinition.findMany({
    where: { isActive: true },
    orderBy: { target: 'asc' },
  });

  for (const definition of definitions) {
    const existing = await tx.userTask.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId: definition.id,
        },
      },
    });

    if (!existing) {
      const derived = taskStateFromTaps(totalTaps, definition.target, definition.unlockAfterTaps);
      await tx.userTask.create({
        data: {
          userId,
          taskId: definition.id,
          progress: derived.progress,
          status: derived.status,
          unlockedAt: derived.status === TaskStatus.locked ? null : new Date(),
          completedAt: derived.status === TaskStatus.completed ? new Date() : null,
        },
      });
      continue;
    }

    if (existing.status === TaskStatus.claimed) {
      continue;
    }

    const derived = taskStateFromTaps(totalTaps, definition.target, definition.unlockAfterTaps);
    await tx.userTask.update({
      where: { id: existing.id },
      data: {
        progress: derived.progress,
        status: derived.status,
        unlockedAt: existing.unlockedAt ?? (derived.status === TaskStatus.locked ? null : new Date()),
        completedAt: existing.completedAt ?? (derived.status === TaskStatus.completed ? new Date() : null),
      },
    });
  }
};

const ensureGameConfig = async (tx: Tx): Promise<GameConfig> => {
  return tx.gameConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      tapRewardMicro: 1000,
      xpPerTap: 1,
      tapsRequiredToUnlockTask: 25,
      percentageRewardEnabled: false,
      defaultPercentage: 100,
    },
  });
};

const ensureProgress = async (tx: Tx, userId: string): Promise<PlayerProgress> => {
  const existing = await tx.playerProgress.findUnique({ where: { userId } });
  if (existing) {
    return existing;
  }

  return tx.playerProgress.create({
    data: {
      userId,
      coinsMicro: 0,
      xp: 0,
      level: 1,
      crownTier: 'bronze_1',
      totalTaps: 0,
    },
  });
};

const toTaskDto = (task: Awaited<ReturnType<typeof fetchTasks>>[number]): ClientTask => ({
  id: task.task.id,
  title: task.task.title,
  description: task.task.description,
  type: task.task.type,
  target: task.task.target,
  rewardMicro: task.task.rewardMicro,
  rewardXp: task.task.rewardXp,
  progress: task.progress,
  status: task.status,
  unlockAfterTaps: task.task.unlockAfterTaps,
  unlockedAt: task.unlockedAt?.toISOString() ?? null,
  completedAt: task.completedAt?.toISOString() ?? null,
  claimedAt: task.claimedAt?.toISOString() ?? null,
});

const toConfigDto = (config: GameConfig): GameConfigDTO => ({
  tapRewardMicro: config.tapRewardMicro,
  xpPerTap: config.xpPerTap,
  tapsRequiredToUnlockTask: config.tapsRequiredToUnlockTask,
  percentageRewardEnabled: config.percentageRewardEnabled,
  defaultPercentage: config.defaultPercentage,
});

const fetchTasks = async (tx: Tx, userId: string) => {
  return tx.userTask.findMany({
    where: { userId },
    include: { task: true },
    orderBy: [{ task: { target: 'asc' } }],
  });
};

export const getGameState = async (tx: Tx, userId: string): Promise<GameStateDTO> => {
  const [progress, config] = await Promise.all([ensureProgress(tx, userId), ensureGameConfig(tx)]);
  await ensureUserTasks(tx, userId, progress.totalTaps);
  const tasks = await fetchTasks(tx, userId);

  return {
    progress: {
      coinsMicro: progress.coinsMicro,
      coins: coinsMicroToCoins(progress.coinsMicro),
      xp: progress.xp,
      level: progress.level,
      totalTaps: progress.totalTaps,
      crownTier: progress.crownTier as ReturnType<typeof crownTierFromLevel>,
    },
    tasks: tasks.map(toTaskDto),
    config: toConfigDto(config),
  };
};

const calculateTapRewardMicro = (config: GameConfig): number => {
  if (!config.percentageRewardEnabled) {
    return config.tapRewardMicro;
  }

  return Math.floor((config.tapRewardMicro * config.defaultPercentage) / 100);
};

export const applyMigrationIfEligible = async (
  tx: Tx,
  user: User,
  migrationPayload?: MigrationPayload,
): Promise<void> => {
  const normalized = normalizeMigration(migrationPayload);
  if (!normalized || !normalized.completed) {
    return;
  }

  const progress = await ensureProgress(tx, user.id);
  if (progress.totalTaps > 0 || progress.coinsMicro > 0 || progress.xp > 0) {
    return;
  }

  const level = levelFromXp(normalized.xp);
  const crownTier = crownTierFromLevel(level);

  await tx.playerProgress.update({
    where: { id: progress.id },
    data: {
      coinsMicro: normalized.coinsMicro,
      xp: normalized.xp,
      totalTaps: normalized.totalTaps,
      level,
      crownTier,
    },
  });

  if (normalized.coinsMicro > 0 || normalized.xp > 0) {
    await tx.rewardTransaction.create({
      data: {
        userId: user.id,
        type: RewardType.migration,
        amountMicro: normalized.coinsMicro,
        xpAmount: normalized.xp,
        source: 'local_storage_migration',
        sourceId: 'step_1_3_migration',
      },
    });
  }

  await ensureUserTasks(tx, user.id, normalized.totalTaps);
};

export const handleTap = async (prisma: PrismaClient, userId: string, requestId: string): Promise<GameStateDTO> => {
  return prisma.$transaction(async (tx) => {
    const [config, progress] = await Promise.all([ensureGameConfig(tx), ensureProgress(tx, userId)]);

    try {
      await tx.tapRequest.create({
        data: {
          userId,
          requestId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiError(409, 'DUPLICATE_REQUEST_ID', 'Duplicate tap requestId');
      }
      throw error;
    }

    const rewardMicro = calculateTapRewardMicro(config);
    const xp = progress.xp + config.xpPerTap;
    const level = levelFromXp(xp);
    const crownTier = crownTierFromLevel(level);
    const totalTaps = progress.totalTaps + 1;

    await tx.playerProgress.update({
      where: { id: progress.id },
      data: {
        coinsMicro: progress.coinsMicro + rewardMicro,
        xp,
        level,
        crownTier,
        totalTaps,
      },
    });

    await tx.rewardTransaction.create({
      data: {
        userId,
        type: RewardType.tap,
        amountMicro: rewardMicro,
        xpAmount: config.xpPerTap,
        source: 'tap',
        sourceId: requestId,
      },
    });

    await ensureUserTasks(tx, userId, totalTaps);
    return getGameState(tx, userId);
  });
};

export const claimTaskReward = async (prisma: PrismaClient, userId: string, taskId: string): Promise<GameStateDTO> => {
  return prisma.$transaction(async (tx) => {
    const userTask = await tx.userTask.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId,
        },
      },
      include: {
        task: true,
      },
    });

    if (!userTask) {
      throw new ApiError(404, 'TASK_NOT_FOUND', 'Task not found for user');
    }

    if (userTask.status !== TaskStatus.completed) {
      if (userTask.status === TaskStatus.claimed || userTask.claimedAt) {
        throw new ApiError(409, 'TASK_ALREADY_CLAIMED', 'Task reward already claimed');
      }
      throw new ApiError(400, 'TASK_NOT_COMPLETED', 'Task must be completed before claiming');
    }

    const progress = await ensureProgress(tx, userId);
    const xp = progress.xp + userTask.task.rewardXp;
    const level = levelFromXp(xp);
    const crownTier = crownTierFromLevel(level);

    await tx.playerProgress.update({
      where: { id: progress.id },
      data: {
        coinsMicro: progress.coinsMicro + userTask.task.rewardMicro,
        xp,
        level,
        crownTier,
      },
    });

    await tx.userTask.update({
      where: { id: userTask.id },
      data: {
        status: TaskStatus.claimed,
        claimedAt: new Date(),
      },
    });

    await tx.rewardTransaction.create({
      data: {
        userId,
        type: RewardType.task_claim,
        amountMicro: userTask.task.rewardMicro,
        xpAmount: userTask.task.rewardXp,
        source: 'task_claim',
        sourceId: taskId,
      },
    });

    return getGameState(tx, userId);
  });
};
