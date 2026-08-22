import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db';
import { logger } from './logger';

/**
 * Process idempotent transaction
 * Returns cached result if idempotency key already processed
 */
export const processIdempotent = async <T>(
  idempotencyKey: string,
  processor: () => Promise<T>,
  cacheKey: string // Transaction or TaskProgress field to check
): Promise<{ result: T; isDuplicate: boolean }> => {
  // Check if already processed (would need to check existing transaction)
  const existing = await (prisma.transaction as any).findUnique({
    where: { idempotencyKey },
  }).catch(() => null);
  
  if (existing) {
    logger.info(`Idempotent request detected: ${idempotencyKey}`);
    return { result: existing as T, isDuplicate: true };
  }
  
  // Process new request
  const result = await processor();
  
  return { result, isDuplicate: false };
};

/**
 * Generate idempotency key (client-side)
 */
export const generateIdempotencyKey = (): string => {
  return uuidv4();
};
