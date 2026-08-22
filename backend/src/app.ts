import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import { env } from './config';
import { authMiddleware } from './middleware/auth';
import { createSlidingWindowLimiter } from './middleware/rateLimiter';
import { prisma } from './prisma';
import { signAuthToken } from './security/authToken';
import { validateTelegramOrDevInitData } from './security/telegram';
import { applyMigrationIfEligible, claimTaskReward, getGameState, handleTap } from './services/gameService';
import { ApiError, fail, ok } from './utils/api';

const authSchema = z.object({
  initData: z.string().min(1).max(4096),
  migration: z
    .object({
      coins: z.number().nonnegative().max(1_000_000).optional(),
      xp: z.number().nonnegative().max(10_000_000).optional(),
      totalTaps: z.number().nonnegative().max(10_000_000).optional(),
      completed: z.boolean().optional(),
    })
    .optional(),
});

const tapSchema = z.object({
  requestId: z.string().min(8).max(128),
});

const claimSchema = z.object({
  taskId: z.string().cuid(),
});

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '64kb' }));

  const auth = authMiddleware(env.TELEGRAM_BOT_TOKEN);

  const authRouteLimiter = rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const readRouteLimiter = rateLimit({
    windowMs: 60_000,
    max: 240,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const tapRouteLimiter = rateLimit({
    windowMs: 60_000,
    max: 180,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const claimRouteLimiter = rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const tapIpLimiter = createSlidingWindowLimiter({
    limit: 180,
    windowMs: 60_000,
    keyPrefix: 'tap-ip',
    keyGenerator: (req) => req.ip ?? null,
    code: 'RATE_LIMITED',
    message: 'Too many tap requests from this IP',
  });

  const authIpLimiter = createSlidingWindowLimiter({
    limit: 30,
    windowMs: 60_000,
    keyPrefix: 'auth-ip',
    keyGenerator: (req) => req.ip ?? null,
    code: 'RATE_LIMITED',
    message: 'Too many authentication attempts from this IP',
  });

  const readIpLimiter = createSlidingWindowLimiter({
    limit: 240,
    windowMs: 60_000,
    keyPrefix: 'read-ip',
    keyGenerator: (req) => req.ip ?? null,
    code: 'RATE_LIMITED',
    message: 'Too many requests from this IP',
  });

  const readUserLimiter = createSlidingWindowLimiter({
    limit: 180,
    windowMs: 60_000,
    keyPrefix: 'read-user',
    keyGenerator: (req) => req.auth?.userId ?? null,
    code: 'RATE_LIMITED',
    message: 'Too many requests for this user',
  });

  const tapUserLimiter = createSlidingWindowLimiter({
    limit: 100,
    windowMs: 60_000,
    keyPrefix: 'tap-user',
    keyGenerator: (req) => req.auth?.userId ?? null,
    code: 'RATE_LIMITED',
    message: 'Too many tap requests for this user',
  });

  const claimIpLimiter = createSlidingWindowLimiter({
    limit: 60,
    windowMs: 60_000,
    keyPrefix: 'claim-ip',
    keyGenerator: (req) => req.ip ?? null,
    code: 'RATE_LIMITED',
    message: 'Too many claim requests from this IP',
  });

  const claimUserLimiter = createSlidingWindowLimiter({
    limit: 20,
    windowMs: 60_000,
    keyPrefix: 'claim-user',
    keyGenerator: (req) => req.auth?.userId ?? null,
    code: 'RATE_LIMITED',
    message: 'Too many claim requests for this user',
  });

  app.get('/api/health', (_req, res) => {
    ok(res, { status: 'ok' });
  });

  app.post('/api/auth/telegram', authRouteLimiter, authIpLimiter, async (req, res, next) => {
    try {
      const parsed = authSchema.parse(req.body);
      const telegramUser = validateTelegramOrDevInitData(
        parsed.initData,
        env.TELEGRAM_BOT_TOKEN,
        env.NODE_ENV === 'production',
      );

      const payload = await prisma.$transaction(async (tx) => {
        const user = await tx.user.upsert({
          where: { telegramId: telegramUser.telegramId },
          update: {
            username: telegramUser.username,
            firstName: telegramUser.firstName,
            lastName: telegramUser.lastName,
            photoUrl: telegramUser.photoUrl,
            lastActiveAt: new Date(),
          },
          create: {
            telegramId: telegramUser.telegramId,
            username: telegramUser.username,
            firstName: telegramUser.firstName,
            lastName: telegramUser.lastName,
            photoUrl: telegramUser.photoUrl,
          },
        });

        await applyMigrationIfEligible(tx, user, parsed.migration);
        const state = await getGameState(tx, user.id);

        return {
          user,
          state,
        };
      });

      const token = signAuthToken(
        {
          userId: payload.user.id,
          exp: Date.now() + 24 * 60 * 60 * 1000,
        },
        env.TELEGRAM_BOT_TOKEN,
      );

      ok(res, {
        token,
        user: {
          id: payload.user.id,
          telegramId: payload.user.telegramId,
          username: payload.user.username,
          firstName: payload.user.firstName,
          lastName: payload.user.lastName,
          photoUrl: payload.user.photoUrl,
        },
        state: payload.state,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/me', readRouteLimiter, readIpLimiter, auth, readUserLimiter, async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
      if (!user) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      }

      ok(res, {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/game/state', readRouteLimiter, readIpLimiter, auth, readUserLimiter, async (req, res, next) => {
    try {
      const state = await prisma.$transaction((tx) => getGameState(tx, req.auth!.userId));
      ok(res, state);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/game/config', readRouteLimiter, readIpLimiter, auth, readUserLimiter, async (req, res, next) => {
    try {
      const state = await prisma.$transaction((tx) => getGameState(tx, req.auth!.userId));
      ok(res, state.config);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/game/tap', tapRouteLimiter, tapIpLimiter, auth, tapUserLimiter, async (req, res, next) => {
    try {
      const { requestId } = tapSchema.parse(req.body);
      const state = await handleTap(prisma, req.auth!.userId, requestId);
      ok(res, state);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/tasks', readRouteLimiter, readIpLimiter, auth, readUserLimiter, async (req, res, next) => {
    try {
      const state = await prisma.$transaction((tx) => getGameState(tx, req.auth!.userId));
      ok(res, state.tasks);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/tasks/:taskId/claim', claimRouteLimiter, claimIpLimiter, auth, claimUserLimiter, async (req, res, next) => {
    try {
      const { taskId } = claimSchema.parse({ taskId: req.params.taskId });
      const state = await claimTaskReward(prisma, req.auth!.userId, taskId);
      ok(res, state);
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.issues[0]?.message ?? 'Invalid input');
    }

    if (error instanceof ApiError) {
      return fail(res, error.status, error.code, error.message);
    }

    if (error instanceof SyntaxError && 'body' in error) {
      return fail(res, 400, 'INVALID_JSON', 'Malformed JSON payload');
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return fail(res, 500, 'INTERNAL_ERROR', message);
  });

  return app;
};
