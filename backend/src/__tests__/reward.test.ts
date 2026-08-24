import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../db/index.js';
import { processReward } from '../services/reward.service.js';
import { calculateLevel, calculateCrownTier } from '../services/user.service.js';
import { CONSTANTS } from '../config/constants.js';

describe('Reward Service', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        telegramId: BigInt(Math.floor(Math.random() * 1000000)),
        balance: 0,
        xp: 0,
        level: 1,
        crownTier: 'bronze_1',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it('should process tap reward', async () => {
    const idempotencyKey = `tap-${Date.now()}`;
    const result = await processReward(
      testUserId,
      BigInt(CONSTANTS.DEFAULT_TAP_REWARD),
      1,
      CONSTANTS.TRANSACTION_TYPES.TAP,
      idempotencyKey
    );

    expect(result.success).toBe(true);
    expect(result.amount).toBe(BigInt(CONSTANTS.DEFAULT_TAP_REWARD));
    expect(result.xp).toBe(1);
  });

  it('should prevent duplicate rewards via idempotency key', async () => {
    const idempotencyKey = `duplicate-${Date.now()}`;

    const result1 = await processReward(
      testUserId,
      BigInt(1000),
      1,
      CONSTANTS.TRANSACTION_TYPES.TAP,
      idempotencyKey
    );

    const result2 = await processReward(
      testUserId,
      BigInt(1000),
      1,
      CONSTANTS.TRANSACTION_TYPES.TAP,
      idempotencyKey
    );

    expect(result1.transactionId).toBe(result2.transactionId);
  });

  it('should calculate level correctly from XP', () => {
    expect(calculateLevel(BigInt(0))).toBe(1);
    expect(calculateLevel(BigInt(100))).toBe(2);
    expect(calculateLevel(BigInt(250))).toBe(3);
    expect(calculateLevel(BigInt(5000))).toBe(15);
  });

  it('should calculate crown tier correctly', () => {
    expect(calculateCrownTier(1)).toBe('bronze_1');
    expect(calculateCrownTier(5)).toBe('bronze_2');
    expect(calculateCrownTier(15)).toBe('silver_1');
    expect(calculateCrownTier(30)).toBe('gold_1');
  });
});
