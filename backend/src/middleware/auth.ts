import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../db';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { AuthRequest, AuthenticatedUser } from '../types';
import { logger } from '../utils/logger';

/**
 * Extract JWT from Authorization header
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
};

/**
 * Authenticate user from JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Load user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      telegramId: user.telegramId,
      role: user.role as 'user' | 'admin',
      balance: user.balance,
      xp: user.xp,
      level: user.level,
      crownTier: user.crownTier,
    };

    req.clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: Date.now(),
      });
    }
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now(),
    });
  }
};

/**
 * Require admin role
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      timestamp: Date.now(),
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      timestamp: Date.now(),
    });
  }

  next();
};

/**
 * Optional authentication (user attached if token valid, but not required)
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (user) {
      req.user = {
        id: user.id,
        telegramId: user.telegramId,
        role: user.role as 'user' | 'admin',
        balance: user.balance,
        xp: user.xp,
        level: user.level,
        crownTier: user.crownTier,
      };
    }

    req.clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};
