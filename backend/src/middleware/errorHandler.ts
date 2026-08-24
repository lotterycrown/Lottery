import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  // Express identifies error-handling middleware by its 4-argument signature
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  logger.error('Error handler:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      timestamp: Date.now(),
    });
  }

  // Unhandled error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: Date.now(),
  });
};

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

// Async error wrapper
export const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
