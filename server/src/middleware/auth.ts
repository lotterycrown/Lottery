import { NextFunction, Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireUser = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.header('x-user-id');
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  req.userId = userId;
  next();
};
