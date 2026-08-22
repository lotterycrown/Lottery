import { PrismaClient } from '@prisma/client';

export class RewardService {
  constructor(private readonly db: PrismaClient) {}

  async grantAdReward(input: {
    userId: string;
    adSessionId: string;
    amountMicro: number;
    xp: number;
  }) {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.rewardTransaction.findUnique({
        where: { sourceId: input.adSessionId },
      });

      if (existing) {
        throw new Error('Ad reward already granted for this session');
      }

      await tx.rewardTransaction.create({
        data: {
          userId: input.userId,
          type: 'AD_REWARD',
          source: 'rewarded_ad',
          sourceId: input.adSessionId,
          amount: BigInt(input.amountMicro),
          xp: input.xp,
        },
      });

      const progress = await tx.playerProgress.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          coinsMicro: BigInt(input.amountMicro),
          xp: input.xp,
        },
        update: {
          coinsMicro: { increment: BigInt(input.amountMicro) },
          xp: { increment: input.xp },
        },
      });

      return progress;
    });
  }
}
