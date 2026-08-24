import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';

type LogLevel = 'error' | 'warn';
type PrismaEventClient = PrismaClient<Prisma.PrismaClientOptions, LogLevel>;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaEventClient };

export const prisma: PrismaEventClient =
  globalForPrisma.prisma ||
  new PrismaClient<Prisma.PrismaClientOptions, LogLevel>({
    log: [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Log Prisma errors and warnings
prisma.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma warning:', e);
});
