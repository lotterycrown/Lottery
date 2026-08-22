import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { calculateLevel, calculateCrownTier } from '../services/user.service.js';
import { CONSTANTS } from '../config/constants.js';

const DB_AVAILABLE = !!process.env.DATABASE_URL;

describe('User Progression (unit tests - no DB required)', () => {
  it('should calculate level 1 for 0 XP', () => {
    expect(calculateLevel(BigInt(0))).toBe(1);
  });

  it('should calculate level 2 for 100 XP', () => {
    expect(calculateLevel(BigInt(100))).toBe(2);
  });

  it('should calculate level 3 for 250 XP', () => {
    expect(calculateLevel(BigInt(250))).toBe(3);
  });

  it('should calculate level 15 for 5000 XP', () => {
    expect(calculateLevel(BigInt(5000))).toBe(15);
  });

  it('should calculate level 30 for 17500 XP', () => {
    expect(calculateLevel(BigInt(17500))).toBe(30);
  });

  it('should calculate crown tier bronze_1 for level 1', () => {
    expect(calculateCrownTier(1)).toBe('bronze_1');
  });

  it('should calculate crown tier bronze_2 for level 5', () => {
    expect(calculateCrownTier(5)).toBe('bronze_2');
  });

  it('should calculate crown tier silver_1 for level 15', () => {
    expect(calculateCrownTier(15)).toBe('silver_1');
  });

  it('should calculate crown tier gold_1 for level 30', () => {
    expect(calculateCrownTier(30)).toBe('gold_1');
  });

  it('should have default tap reward in constants', () => {
    expect(CONSTANTS.DEFAULT_TAP_REWARD).toBe(1000);
  });

  it('should have referral status constants', () => {
    expect(CONSTANTS.REFERRAL_STATUS.PENDING).toBe('pending');
    expect(CONSTANTS.REFERRAL_STATUS.QUALIFIED).toBe('qualified');
    expect(CONSTANTS.REFERRAL_STATUS.REWARDED).toBe('rewarded');
  });
});

describe.skipIf(!DB_AVAILABLE)('Reward Service (requires PostgreSQL)', () => {
  let testUserId: string;

  beforeAll(async () => {
    const { prisma } = await import('../db/index.js');
    const user = await prisma.user.create({
      data: {
        telegramId: BigInt(Math.floor(Math.random() * 1_000_000_000)),
        balance: 0,
        xp: 0,
        level: 1,
        crownTier: 'bronze_1',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    const { prisma } = await import('../db/index.js');
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it('should process tap reward', async () => {
    const { processReward } = await import('../services/reward.service.js');
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
    const { processReward } = await import('../services/reward.service.js');
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
});
