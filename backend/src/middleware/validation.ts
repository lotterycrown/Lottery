import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors[0]?.message || 'Invalid request body';
        res.status(400).json({
          success: false,
          error: message,
          code: 'VALIDATION_ERROR',
          timestamp: Date.now(),
        });
        return;
      }
      throw error;
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors[0]?.message || 'Invalid query parameters';
        res.status(400).json({
          success: false,
          error: message,
          code: 'VALIDATION_ERROR',
          timestamp: Date.now(),
        });
        return;
      }
      throw error;
    }
  };
};
