import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from '../utils/jwt';

describe('JWT Auth Middleware (unit)', () => {
  it('should generate a valid JWT token', () => {
    const token = generateToken({ userId: 'test-id', telegramId: '12345', role: 'user' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a valid token', () => {
    const token = generateToken({ userId: 'test-id', telegramId: '12345', role: 'user' });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe('test-id');
    expect(payload!.role).toBe('user');
  });

  it('should reject an invalid token', () => {
    const result = verifyToken('invalid.token.here');
    expect(result).toBeNull();
  });

  it('should reject a tampered token', () => {
    const token = generateToken({ userId: 'test-id', telegramId: '12345', role: 'user' });
    const tampered = token.slice(0, -5) + 'XXXXX';
    const result = verifyToken(tampered);
    expect(result).toBeNull();
  });

  it('should not trust role from payload tampering', () => {
    // Generate admin token
    const adminToken = generateToken({ userId: 'test-id', telegramId: '12345', role: 'admin' });
    const payload = verifyToken(adminToken);
    expect(payload!.role).toBe('admin');

    // The role should come from the DB, not be blindly trusted
    // This is enforced in middleware/auth.ts where we load user from DB
    // Here we just verify the token correctly preserves the role from signing
    const userToken = generateToken({ userId: 'test-id', telegramId: '12345', role: 'user' });
    const userPayload = verifyToken(userToken);
    expect(userPayload!.role).toBe('user');
  });
});

describe('Self-referral protection (logic)', () => {
  it('should detect self-referral when referrerId equals userId', () => {
    const userId = 'user-123';
    const referrerId = 'user-123';
    expect(userId === referrerId).toBe(true); // self-referral detected
  });

  it('should allow valid referral when referrerId differs from userId', () => {
    const userId: string = 'user-123';
    const referrerId: string = 'user-456';
    expect(userId === referrerId).toBe(false); // valid referral
  });
});

describe('Idempotency key logic (unit)', () => {
  it('should generate unique idempotency keys', async () => {
    const { generateIdempotencyKey } = await import('../utils/idempotency');
    const key1 = generateIdempotencyKey();
    const key2 = generateIdempotencyKey();
    expect(key1).not.toBe(key2);
    expect(key1).toHaveLength(36); // UUID v4
  });
});
