import { runSeeds } from './seed';
import { prisma } from './index';
import { logger } from '../utils/logger';

runSeeds()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
