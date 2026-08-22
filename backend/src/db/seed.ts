import { prisma } from '../db';
import { logger } from '../utils/logger';
import { CONSTANTS } from '../config/constants';

/**
 * Seed initial game configuration
 */
export const seedGameConfig = async () => {
  try {
    const existing = await prisma.gameConfig.findUnique({
      where: { id: 'default' },
    });

    if (existing) {
      logger.info('Game config already seeded');
      return;
    }

    // Build level thresholds
    const levelThresholds: Record<string, number> = {};
    Object.entries(CONSTANTS.XP_THRESHOLDS).forEach(([level, xp]) => {
      levelThresholds[level] = xp;
    });

    // Build crown progression
    const crownProgression: Record<string, number> = {};
    CONSTANTS.CROWN_TIERS.forEach((tier) => {
      crownProgression[tier.name] = tier.minLevel;
    });

    const config = await prisma.gameConfig.create({
      data: {
        id: 'default',
        tapReward: BigInt(CONSTANTS.DEFAULT_TAP_REWARD),
        taskRewardSmall: BigInt(CONSTANTS.DEFAULT_TASK_REWARD_SMALL),
        taskRewardMedium: BigInt(CONSTANTS.DEFAULT_TASK_REWARD_MEDIUM),
        taskRewardLarge: BigInt(CONSTANTS.DEFAULT_TASK_REWARD_LARGE),
        adReward: BigInt(CONSTANTS.DEFAULT_AD_REWARD),
        referralReward: BigInt(CONSTANTS.DEFAULT_REFERRAL_REWARD),
        referralBonusReward: BigInt(CONSTANTS.DEFAULT_REFERRAL_BONUS_REWARD),
        xpPerTap: CONSTANTS.DEFAULT_XP_PER_TAP,
        xpPerTaskSmall: CONSTANTS.DEFAULT_XP_PER_TASK_SMALL,
        xpPerTaskMedium: CONSTANTS.DEFAULT_XP_PER_TASK_MEDIUM,
        xpPerTaskLarge: CONSTANTS.DEFAULT_XP_PER_TASK_LARGE,
        xpPerAd: CONSTANTS.DEFAULT_XP_PER_AD,
        maxTapsPerHour: CONSTANTS.DEFAULT_MAX_TAPS_PER_HOUR,
        tapCooldownMs: CONSTANTS.DEFAULT_TAP_COOLDOWN_MS,
        taskClaimCooldownHours: CONSTANTS.DEFAULT_TASK_CLAIM_COOLDOWN_HOURS,
        levelThresholds,
        crownProgression,
      },
    });

    logger.info('✅ Game config seeded');
    return config;
  } catch (error) {
    logger.error('Failed to seed game config:', error);
    throw error;
  }
};

/**
 * Seed initial tasks
 */
export const seedTasks = async () => {
  try {
    const count = await prisma.task.count();
    if (count > 0) {
      logger.info('Tasks already seeded');
      return;
    }

    const tasks = await prisma.task.createMany({
      data: [
        {
          title: 'First Tap',
          description: 'Tap the crown once',
          type: CONSTANTS.TASK_TYPES.GAMEPLAY,
          requirement: 'Tap the crown 1 time',
          reward: BigInt(CONSTANTS.DEFAULT_TASK_REWARD_SMALL),
          xpReward: CONSTANTS.DEFAULT_XP_PER_TASK_SMALL,
          requiredLevel: 1,
          targetCount: 1,
        },
        {
          title: '100 Taps',
          description: 'Tap the crown 100 times',
          type: CONSTANTS.TASK_TYPES.GAMEPLAY,
          requirement: 'Tap the crown 100 times',
          reward: BigInt(CONSTANTS.DEFAULT_TASK_REWARD_MEDIUM),
          xpReward: CONSTANTS.DEFAULT_XP_PER_TASK_MEDIUM,
          requiredLevel: 1,
          targetCount: 100,
        },
        {
          title: 'Invite a Friend',
          description: 'Share your referral code with a friend',
          type: CONSTANTS.TASK_TYPES.REFERRAL,
          requirement: 'Get 1 successful referral',
          reward: BigInt(CONSTANTS.DEFAULT_TASK_REWARD_LARGE),
          xpReward: CONSTANTS.DEFAULT_XP_PER_TASK_LARGE,
          requiredLevel: 5,
          targetCount: 1,
        },
        {
          title: 'Silver Crown',
          description: 'Reach level 15',
          type: CONSTANTS.TASK_TYPES.SPECIAL,
          requirement: 'Reach level 15 (Silver Crown)',
          reward: BigInt(CONSTANTS.DEFAULT_TASK_REWARD_LARGE),
          xpReward: CONSTANTS.DEFAULT_XP_PER_TASK_LARGE,
          requiredLevel: 1,
          targetCount: 15,
        },
        {
          title: 'Gold Crown',
          description: 'Reach level 30',
          type: CONSTANTS.TASK_TYPES.SPECIAL,
          requirement: 'Reach level 30 (Gold Crown)',
          reward: BigInt(CONSTANTS.DEFAULT_TASK_REWARD_LARGE * 2),
          xpReward: CONSTANTS.DEFAULT_XP_PER_TASK_LARGE * 2,
          requiredLevel: 1,
          targetCount: 30,
        },
      ],
    });

    logger.info(`✅ Seeded ${tasks.count} tasks`);
    return tasks;
  } catch (error) {
    logger.error('Failed to seed tasks:', error);
    throw error;
  }
};

/**
 * Seed initial admin user
 * Requires ADMIN_TELEGRAM_ID environment variable.
 * Safe to run multiple times (idempotent).
 */
export const seedAdminUser = async () => {
  const adminTelegramId = process.env.ADMIN_TELEGRAM_ID;
  if (!adminTelegramId) {
    logger.info('ADMIN_TELEGRAM_ID not set — skipping admin user seed');
    return;
  }

  const telegramId = BigInt(adminTelegramId);

  const existing = await prisma.user.findUnique({ where: { telegramId } });
  if (existing) {
    if (existing.role !== 'admin') {
      await prisma.user.update({ where: { telegramId }, data: { role: 'admin' } });
      logger.info(`✅ Promoted user ${adminTelegramId} to admin`);
    } else {
      logger.info(`Admin user ${adminTelegramId} already exists`);
    }
    return;
  }

  await prisma.user.create({
    data: {
      telegramId,
      role: 'admin',
      balance: 0,
      xp: 0,
      level: 1,
      crownTier: 'bronze_1',
    },
  });

  logger.info(`✅ Admin user created for Telegram ID ${adminTelegramId}`);
};

/**
 * Run all seeds
 */
export const runSeeds = async () => {
  logger.info('🌱 Starting database seeds...');
  try {
    await seedGameConfig();
    await seedTasks();
    await seedAdminUser();
    logger.info('✅ All seeds completed');
  } catch (error) {
    logger.error('❌ Seed failed:', error);
    throw error;
  }
};
