import { AdSessionStatus, PrismaClient } from '@prisma/client';
import { assertProviderAllowedForEnvironment, getRuntimeAdConfig } from '../config/adConfig';
import { RewardService } from './RewardService';
import { VerificationService } from './VerificationService';
import { RewardRequest } from '../types/ads';

const sessionLifetimeMs = 10 * 60 * 1000;

const getDateKey = (date = new Date()): string => date.toISOString().slice(0, 10);

export class AdService {
  private readonly rewardService: RewardService;
  private readonly verificationService: VerificationService;

  constructor(private readonly db: PrismaClient) {
    this.rewardService = new RewardService(db);
    this.verificationService = new VerificationService();
  }

  async getConfig() {
    const runtime = getRuntimeAdConfig();
    assertProviderAllowedForEnvironment(runtime.provider);

    const config = await this.db.adConfig.findFirst();
    if (config) {
      return {
        ...config,
        placementId: runtime.placementId,
      };
    }

    return this.db.adConfig.create({
      data: {
        enabled: runtime.enabled,
        provider: runtime.provider,
        rewardMicro: runtime.rewardMicro,
        rewardXp: runtime.rewardXp,
        dailyUserLimit: runtime.dailyUserLimit,
        cooldownSeconds: runtime.cooldownSeconds,
      },
    }).then((created) => ({ ...created, placementId: runtime.placementId }));
  }

  async getStatus(userId: string) {
    const config = await this.getConfig();
    const usage = await this.db.adDailyUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: getDateKey(),
        },
      },
    });

    const latestRewarded = await this.db.adSession.findFirst({
      where: { userId, status: 'REWARDED' },
      orderBy: { rewardedAt: 'desc' },
      select: { rewardedAt: true },
    });

    const cooldownUntil = latestRewarded?.rewardedAt
      ? new Date(latestRewarded.rewardedAt.getTime() + config.cooldownSeconds * 1000)
      : null;

    const now = new Date();
    const onCooldown = Boolean(cooldownUntil && cooldownUntil > now);
    const dailyRewardsCount = usage?.rewardedAds ?? 0;

    return {
      cooldownUntil: cooldownUntil ? cooldownUntil.getTime() : null,
      dailyRewardsCount,
      dailyUserLimit: config.dailyUserLimit,
      isAvailable: config.enabled && !onCooldown && dailyRewardsCount < config.dailyUserLimit,
    };
  }

  async createSession(userId: string) {
    const config = await this.getConfig();
    if (!config.enabled) {
      throw new Error('Rewarded ads are disabled');
    }

    assertProviderAllowedForEnvironment(config.provider as 'mock' | 'telegram');

    const status = await this.getStatus(userId);
    if (!status.isAvailable) {
      if (status.dailyRewardsCount >= status.dailyUserLimit) {
        throw new Error('Daily ad limit reached');
      }
      throw new Error('Ad cooldown active');
    }

    await this.db.user.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });

    const session = await this.db.adSession.create({
      data: {
        userId,
        provider: config.provider,
        placementId: config.placementId,
        status: AdSessionStatus.CREATED,
        expiresAt: new Date(Date.now() + sessionLifetimeMs),
      },
    });

    await this.db.adEvent.create({
      data: {
        userId,
        adSessionId: session.id,
        eventType: 'SESSION_CREATED',
        provider: session.provider,
        placementId: session.placementId,
      },
    });

    return {
      adSessionId: session.id,
      provider: session.provider,
      placementId: session.placementId,
      expiresAt: session.expiresAt.getTime(),
    };
  }

  async reward(userId: string, payload: RewardRequest) {
    const config = await this.getConfig();
    const session = await this.db.adSession.findUnique({ where: { id: payload.adSessionId } });

    if (!session) throw new Error('Ad session not found');
    if (session.userId !== userId) throw new Error('Ad session ownership mismatch');
    if (session.expiresAt.getTime() < Date.now()) {
      await this.db.adSession.update({ where: { id: session.id }, data: { status: 'EXPIRED' } });
      throw new Error('Ad session expired');
    }
    if (session.status === 'REWARDED') throw new Error('Ad session already rewarded');
    if (session.provider !== payload.provider) throw new Error('Provider mismatch');

    const verification = await this.verificationService.verifyRewardedAd({
      provider: payload.provider,
      verificationToken: payload.verificationToken,
      transactionId: payload.transactionId,
    });

    if (verification.status !== 'valid') {
      await this.db.adSession.update({
        where: { id: session.id },
        data: {
          status: 'FAILED',
          verificationData: JSON.stringify(verification),
          completedAt: new Date(),
        },
      });
      throw new Error(
        verification.status === 'unverifiable'
          ? `Provider unverifiable: ${verification.reason}`
          : `Verification failed: ${verification.reason}`
      );
    }

    const daily = await this.db.adDailyUsage.upsert({
      where: { userId_date: { userId, date: getDateKey() } },
      create: { userId, date: getDateKey(), completedAds: 0, rewardedAds: 0 },
      update: {},
    });

    if (daily.rewardedAds >= config.dailyUserLimit) {
      throw new Error('Daily ad limit reached');
    }

    const progress = await this.rewardService.grantAdReward({
      userId,
      adSessionId: session.id,
      amountMicro: config.rewardMicro,
      xp: config.rewardXp,
    });

    await this.db.$transaction([
      this.db.adSession.update({
        where: { id: session.id },
        data: {
          status: 'REWARDED',
          rewardedAt: new Date(),
          completedAt: new Date(),
          transactionId: payload.transactionId,
          verificationData: JSON.stringify(verification.raw ?? {}),
        },
      }),
      this.db.adDailyUsage.upsert({
        where: { userId_date: { userId, date: getDateKey() } },
        create: { userId, date: getDateKey(), completedAds: 1, rewardedAds: 1 },
        update: { completedAds: { increment: 1 }, rewardedAds: { increment: 1 } },
      }),
      this.db.adEvent.create({
        data: {
          userId,
          adSessionId: session.id,
          eventType: 'REWARDED',
          provider: session.provider,
          placementId: session.placementId,
          metadata: JSON.stringify({ transactionId: payload.transactionId }),
        },
      }),
    ]);

    return {
      adSessionId: session.id,
      rewardMicro: config.rewardMicro,
      rewardXp: config.rewardXp,
      transactionId: payload.transactionId || `reward_${session.id}`,
      playerProgress: {
        coinsMicro: progress.coinsMicro.toString(),
        xp: progress.xp,
        level: progress.level,
      },
    };
  }
}
