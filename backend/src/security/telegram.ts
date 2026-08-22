import crypto from 'node:crypto';
import { z } from 'zod';
import { ApiError } from '../utils/api';

const telegramUserSchema = z.object({
  id: z.union([z.number().int(), z.string().regex(/^\d+$/)]),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  photo_url: z.string().url().optional(),
});

export type TelegramAuthUser = {
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
};

const createSecretKey = (botToken: string) => crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

export const validateTelegramInitData = (initData: string, botToken: string): TelegramAuthUser => {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    throw new ApiError(401, 'AUTH_INVALID_INIT_DATA', 'Missing Telegram hash');
  }

  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const computed = crypto.createHmac('sha256', createSecretKey(botToken)).update(dataCheckString).digest('hex');

  if (computed !== hash) {
    throw new ApiError(401, 'AUTH_INVALID_SIGNATURE', 'Invalid Telegram auth signature');
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new ApiError(401, 'AUTH_NO_USER', 'Telegram user payload missing');
  }

  const parsed = telegramUserSchema.safeParse(JSON.parse(userRaw));
  if (!parsed.success) {
    throw new ApiError(401, 'AUTH_INVALID_USER', 'Invalid Telegram user payload');
  }

  return {
    telegramId: String(parsed.data.id),
    username: parsed.data.username ?? null,
    firstName: parsed.data.first_name ?? null,
    lastName: parsed.data.last_name ?? null,
    photoUrl: parsed.data.photo_url ?? null,
  };
};

export const validateTelegramOrDevInitData = (initData: string, botToken: string, isProduction: boolean): TelegramAuthUser => {
  if (!initData) {
    throw new ApiError(401, 'AUTH_MISSING_INIT_DATA', 'Telegram initData is required');
  }

  if (!isProduction && initData.startsWith('dev:')) {
    const [, id, username] = initData.split(':');
    if (!id || !/^\d+$/.test(id)) {
      throw new ApiError(401, 'AUTH_INVALID_DEV_INIT', 'Invalid development initData format');
    }

    return {
      telegramId: id,
      username: username || null,
      firstName: username || 'Dev',
      lastName: null,
      photoUrl: null,
    };
  }

  return validateTelegramInitData(initData, botToken);
};
