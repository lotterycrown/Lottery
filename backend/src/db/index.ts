import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event' as const, level: 'error' as const },
      { emit: 'event' as const, level: 'warn' as const },
    ],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Log Prisma errors and warnings
(prisma as any).$on('error', (e: Prisma.LogEvent) => {
  logger.error('Prisma error:', e);
});

(prisma as any).$on('warn', (e: Prisma.LogEvent) => {
  logger.warn('Prisma warning:', e);
});
