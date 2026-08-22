import { Router } from 'express';
import { createAdSession, getAdConfig, getAdStatus, postAdReward } from '../controllers/AdController';
import { requireUser } from '../middleware/auth';
import { createPerUserRateLimiter } from '../middleware/rateLimit';

export const adRouter = Router();

adRouter.use(requireUser);
adRouter.get('/config', getAdConfig);
adRouter.post('/session', createPerUserRateLimiter(5000, 1), createAdSession);
adRouter.post('/reward', createPerUserRateLimiter(30000, 1), postAdReward);
adRouter.get('/status', getAdStatus);
