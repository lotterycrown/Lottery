import { PrismaClient, TaskType } from '@prisma/client';

const prisma = new PrismaClient();

const initialTasks = [
  { title: 'Tap 25', description: 'Reach 25 total taps', target: 25, rewardMicro: 25_000, rewardXp: 10, unlockAfterTaps: 0 },
  { title: 'Tap 100', description: 'Reach 100 total taps', target: 100, rewardMicro: 120_000, rewardXp: 30, unlockAfterTaps: 25 },
  { title: 'Tap 500', description: 'Reach 500 total taps', target: 500, rewardMicro: 700_000, rewardXp: 120, unlockAfterTaps: 100 },
  { title: 'Tap 1000', description: 'Reach 1000 total taps', target: 1000, rewardMicro: 1_500_000, rewardXp: 260, unlockAfterTaps: 500 },
];

async function main() {
  await prisma.gameConfig.upsert({
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

  for (const task of initialTasks) {
    await prisma.taskDefinition.upsert({
      where: { title: task.title },
      update: {
        description: task.description,
        type: TaskType.tap_count,
        target: task.target,
        rewardMicro: task.rewardMicro,
        rewardXp: task.rewardXp,
        unlockAfterTaps: task.unlockAfterTaps,
        isActive: true,
      },
      create: {
        ...task,
        type: TaskType.tap_count,
        isActive: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
