import { NextFunction, Request, Response } from 'express';

type KeyState = {
  count: number;
  resetAt: number;
};

export const createPerUserRateLimiter = (windowMs: number, maxRequests: number) => {
  const buckets = new Map<string, KeyState>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userKey = req.userId || req.ip || 'anonymous';
    const now = Date.now();
    const current = buckets.get(userKey);

    if (!current || now >= current.resetAt) {
      buckets.set(userKey, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      return res.status(429).json({
        message: 'Rate limit exceeded',
        retryAfterMs: current.resetAt - now,
      });
    }

    current.count += 1;
    buckets.set(userKey, current);
    next();
  };
};
