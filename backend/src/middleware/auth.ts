import type { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../security/authToken';
import { fail } from '../utils/api';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
      };
    }
  }
}

export const authMiddleware = (secret: string) => (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 401, 'AUTH_REQUIRED', 'Authentication required');
  }

  try {
    const token = authHeader.slice('Bearer '.length).trim();
    const payload = verifyAuthToken(token, secret);
    req.auth = { userId: payload.userId };
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return fail(res, 401, 'AUTH_INVALID', message);
  }
};
