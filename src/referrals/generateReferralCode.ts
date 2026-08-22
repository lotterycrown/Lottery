import { referralCodeSchema } from './validation';
import { secureRandomInt } from './random';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const PREFIX = 'CROWN-';

const buildRandomSegment = (): string => {
  let segment = '';
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    const randomIndex = secureRandomInt(ALPHABET.length);
    segment += ALPHABET[randomIndex];
  }
  return segment;
};

export const generateReferralCode = async (
  isUnique?: (code: string) => Promise<boolean>,
  maxAttempts = 20,
): Promise<string> => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = `${PREFIX}${buildRandomSegment()}`;
    if (!referralCodeSchema.safeParse(candidate).success) {
      continue;
    }

    if (!isUnique) {
      return candidate;
    }

    const unique = await isUnique(candidate);
    if (unique) {
      return candidate;
    }
  }

  throw new Error('Unable to generate unique referral code after retry limit');
};
