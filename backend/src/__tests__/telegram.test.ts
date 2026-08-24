import { describe, it, expect } from 'vitest';
import { verifyTelegramWebAppData } from '../utils/telegram.js';

describe('Telegram Utils', () => {
  it('should reject invalid signatures', () => {
    const invalidData = 'query_id=123&user=%7B%22id%22%3A123%7D&auth_date=12345&hash=invalid';
    const result = verifyTelegramWebAppData(invalidData);
    expect(result).toBeNull();
  });

  it('should reject expired auth dates', () => {
    // Create data with old timestamp (more than 5 minutes ago)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const data = `auth_date=${oldTimestamp}`;
    const result = verifyTelegramWebAppData(data);
    expect(result).toBeNull();
  });
});
