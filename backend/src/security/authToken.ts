import crypto from 'node:crypto';
import { ApiError } from '../utils/api';

type AuthPayload = {
  userId: string;
  exp: number;
};

const encode = (value: string): string => Buffer.from(value, 'utf8').toString('base64url');
const decode = (value: string): string => Buffer.from(value, 'base64url').toString('utf8');

const signRaw = (value: string, secret: string): string =>
  crypto.createHmac('sha256', secret).update(value).digest('base64url');

export const signAuthToken = (payload: AuthPayload, secret: string): string => {
  const encodedPayload = encode(JSON.stringify(payload));
  const signature = signRaw(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

export const verifyAuthToken = (token: string, secret: string): AuthPayload => {
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) {
    throw new ApiError(401, 'AUTH_TOKEN_INVALID', 'Malformed auth token');
  }

  const expectedSig = signRaw(payloadPart, secret);
  if (expectedSig !== signaturePart) {
    throw new ApiError(401, 'AUTH_TOKEN_INVALID', 'Invalid auth token signature');
  }

  const payload = JSON.parse(decode(payloadPart)) as AuthPayload;
  if (!payload.userId || typeof payload.exp !== 'number') {
    throw new ApiError(401, 'AUTH_TOKEN_INVALID', 'Invalid auth token payload');
  }

  if (payload.exp < Date.now()) {
    throw new ApiError(401, 'AUTH_TOKEN_EXPIRED', 'Auth token expired');
  }

  return payload;
};
