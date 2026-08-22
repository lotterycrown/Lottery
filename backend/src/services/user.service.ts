import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { generateToken } from '../utils/jwt.js';
import { NotFoundError } from '../utils/errors.js';
import { CONSTANTS } from '../config/constants.js';

/**
 * Find or create user from Telegram
 */
export const findOrCreateUser = async (telegramId: bigint, userData?: any) => {
  let user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    logger.info(`Creating new user for Telegram ID: ${telegramId}`);
    user = await prisma.user.create({
      data: {
        telegramId,
        telegramUsername: userData?.username,
        firstName: userData?.first_name,
        lastName: userData?.last_name,
        balance: 0,
        xp: 0,
        level: 1,
        crownTier: 'bronze_1',
      },
    });
  }

  return user;
};

/**
 * Get user by ID
 */
export const getUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
};

/**
 * Generate auth token for user
 */
export const generateUserToken = (userId: string, telegramId: bigint, role: string) => {
  return generateToken({
    userId,
    telegramId: telegramId.toString(),
    role: role as 'user' | 'admin',
  });
};

/**
 * Calculate current level from XP
 */
export const calculateLevel = (xp: bigint): number => {
  const thresholds = CONSTANTS.XP_THRESHOLDS;
  const xpNum = Number(xp);

  let level = 1;
  for (const [lvl, requiredXp] of Object.entries(thresholds).map(([k, v]) => [
    Number(k),
    v,
  ])) {
    if (xpNum >= requiredXp) {
      level = lvl as number;
    } else {
      break;
    }
  }

  return level;
};

/**
 * Calculate crown tier from level
 */
export const calculateCrownTier = (level: number): string => {
  for (const tier of CONSTANTS.CROWN_TIERS) {
    if (level >= tier.minLevel && level <= tier.maxLevel) {
      return tier.name;
    }
  }
  return 'bronze_1';
};

/**
 * Update user level and crown tier based on XP
 */
export const updateUserProgression = async (userId: string) => {
  const user = await getUser(userId);
  const newLevel = calculateLevel(user.xp);
  const newTier = calculateCrownTier(newLevel);

  if (newLevel !== user.level || newTier !== user.crownTier) {
    logger.info(`User ${userId} leveled up: ${user.level} -> ${newLevel}`);
    return await prisma.user.update({
      where: { id: userId },
      data: {
        level: newLevel,
        crownTier: newTier,
      },
    });
  }

  return user;
};
