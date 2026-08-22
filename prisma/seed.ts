import { PrismaClient } from '@prisma/client';
import { getRuntimeAdConfig } from '../server/src/config/adConfig';

const prisma = new PrismaClient();

const run = async () => {
  const config = getRuntimeAdConfig();

  await prisma.adConfig.upsert({
    where: { id: 'default-ad-config' },
    update: {
      enabled: config.enabled,
      provider: config.provider,
      rewardMicro: config.rewardMicro,
      rewardXp: config.rewardXp,
      dailyUserLimit: config.dailyUserLimit,
      cooldownSeconds: config.cooldownSeconds,
    },
    create: {
      id: 'default-ad-config',
      enabled: config.enabled,
      provider: config.provider,
      rewardMicro: config.rewardMicro,
      rewardXp: config.rewardXp,
      dailyUserLimit: config.dailyUserLimit,
      cooldownSeconds: config.cooldownSeconds,
    },
  });
};

run()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
