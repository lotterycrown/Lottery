import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/index.js';
import { logger } from './logger.js';

/**
 * Process idempotent transaction
 * Returns cached result if idempotency key already processed
 */
export const processIdempotent = async <T>(
  idempotencyKey: string,
  processor: () => Promise<T>
): Promise<{ result: T; isDuplicate: boolean }> => {
  // Check if already processed (would need to check existing transaction)
  const existing = await prisma.transaction
    .findUnique({
      where: { idempotencyKey },
    })
    .catch((): null => null);

  if (existing) {
    logger.info(`Idempotent request detected: ${idempotencyKey}`);
    return { result: existing as unknown as T, isDuplicate: true };
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
