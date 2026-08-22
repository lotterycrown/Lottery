import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { validateTelegramInitData } from '../../backend/src/security/telegram';

const buildInitData = (botToken: string, userJson: string) => {
  const params = new URLSearchParams();
  params.set('auth_date', '1700000000');
  params.set('query_id', 'AAEAAAE');
  params.set('user', userJson);

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  params.set('hash', hash);

  return params.toString();
};

describe('validateTelegramInitData', () => {
  it('accepts valid signed initData', () => {
    const botToken = '123:ABC';
    const initData = buildInitData(botToken, JSON.stringify({ id: 42, username: 'alice' }));

    const user = validateTelegramInitData(initData, botToken);

    expect(user.telegramId).toBe('42');
    expect(user.username).toBe('alice');
  });

  it('rejects invalid signature', () => {
    const botToken = '123:ABC';
    const initData = `${buildInitData(botToken, JSON.stringify({ id: 42 }))}broken`;

    expect(() => validateTelegramInitData(initData, botToken)).toThrow('Invalid Telegram auth signature');
  });
});
