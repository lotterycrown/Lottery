import { Router, Response } from 'express';
import { prisma } from '../db/index.js';

const router = Router();

/**
 * GET /health
 * Liveness probe - always returns 200 so Render keeps the service alive.
 * Database status is reported in the body, not the HTTP status code.
 */
router.get('/', async (_req, res: Response) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
  }

  res.json({
    success: true,
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    database: dbStatus,
    timestamp: Date.now(),
    version: '1.0.0',
  });
});

export default router;
