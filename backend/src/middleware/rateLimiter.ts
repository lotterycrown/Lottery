import type { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/api';

type LimiterOptions = {
  limit: number;
  windowMs: number;
  keyPrefix: string;
  keyGenerator: (req: Request) => string | null;
  code: string;
  message: string;
};

const stores = new Map<string, number[]>();

export const createSlidingWindowLimiter = ({
  limit,
  windowMs,
  keyPrefix,
  keyGenerator,
  code,
  message,
}: LimiterOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    if (!key) {
      return fail(res, 429, code, message);
    }

    const scopedKey = `${keyPrefix}:${key}`;
    const now = Date.now();
    const threshold = now - windowMs;
    const timestamps = (stores.get(scopedKey) ?? []).filter((value) => value > threshold);

    if (timestamps.length >= limit) {
      return fail(res, 429, code, message);
    }

    timestamps.push(now);
    stores.set(scopedKey, timestamps);
    next();
  };
};
