import { Request, Response } from 'express';
import { z } from 'zod';
import { AdService } from '../services/AdService';
import { prisma } from '../lib/prisma';

const rewardSchema = z.object({
  adSessionId: z.string().min(1),
  provider: z.enum(['mock', 'telegram']),
  verificationToken: z.string().optional(),
  transactionId: z.string().optional(),
});

const adService = new AdService(prisma);

const handleError = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: 'Invalid payload', issues: error.flatten() });
  }

  if (error instanceof Error) {
    const message = error.message;
    if (
      message.includes('limit') ||
      message.includes('cooldown') ||
      message.includes('expired') ||
      message.includes('already') ||
      message.includes('ownership') ||
      message.includes('Verification') ||
      message.includes('unverifiable')
    ) {
      return res.status(400).json({ message });
    }

    return res.status(500).json({ message });
  }

  return res.status(500).json({ message: 'Unexpected error' });
};

export const getAdConfig = async (_req: Request, res: Response) => {
  try {
    const config = await adService.getConfig();
    res.json({
      enabled: config.enabled,
      provider: config.provider,
      rewardMicro: config.rewardMicro,
      rewardXp: config.rewardXp,
      dailyUserLimit: config.dailyUserLimit,
      cooldownSeconds: config.cooldownSeconds,
      placementId: config.placementId,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const createAdSession = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const session = await adService.createSession(userId);
    res.status(201).json(session);
  } catch (error) {
    handleError(res, error);
  }
};

export const postAdReward = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const payload = rewardSchema.parse(req.body);
    const reward = await adService.reward(userId, payload);
    res.json(reward);
  } catch (error) {
    handleError(res, error);
  }
};

export const getAdStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const status = await adService.getStatus(userId);
    res.json(status);
  } catch (error) {
    handleError(res, error);
  }
};
