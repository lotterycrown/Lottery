import { generateReferralCode } from './generateReferralCode';
import { secureId } from './random';
import { Referral, ReferralCode, ReferralStats } from './types';

const REFERRAL_CODES_KEY = 'crown_referral_codes';
const REFERRALS_KEY = 'crown_referrals';
const REFERRAL_USER_KEY = 'crown_local_user_id';

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const nowIso = () => new Date().toISOString();

const createId = (prefix: string) => secureId(prefix);

const parseDate = (value: string | null): Date | null => (value ? new Date(value) : null);

interface StoredReferralCode {
  id: string;
  userId: string;
  code: string;
  createdAt: string;
  isActive: boolean;
}

interface StoredReferral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCodeId: string;
  status: Referral['status'];
  createdAt: string;
  qualifiedAt: string | null;
  rewardedAt: string | null;
}

const toReferralCode = (stored: StoredReferralCode): ReferralCode => ({
  ...stored,
  createdAt: new Date(stored.createdAt),
});

const toReferral = (stored: StoredReferral): Referral => ({
  ...stored,
  createdAt: new Date(stored.createdAt),
  qualifiedAt: parseDate(stored.qualifiedAt),
  rewardedAt: parseDate(stored.rewardedAt),
});

export const getLocalUserId = (): string => {
  const current = localStorage.getItem(REFERRAL_USER_KEY);
  if (current) {
    return current;
  }

  const generated = createId('user');
  localStorage.setItem(REFERRAL_USER_KEY, generated);
  return generated;
};

export const getOrCreateReferralCode = async (userId: string): Promise<ReferralCode> => {
  const codes = readJson<StoredReferralCode[]>(REFERRAL_CODES_KEY, []);
  const existing = codes.find((item) => item.userId === userId);
  if (existing) {
    return toReferralCode(existing);
  }

  const code = await generateReferralCode(async (candidate) => !codes.some((item) => item.code === candidate));
  const created: StoredReferralCode = {
    id: createId('refcode'),
    userId,
    code,
    createdAt: nowIso(),
    isActive: true,
  };
  codes.push(created);
  writeJson(REFERRAL_CODES_KEY, codes);
  return toReferralCode(created);
};

export const getReferralsByReferrer = (referrerId: string): Referral[] => {
  const referrals = readJson<StoredReferral[]>(REFERRALS_KEY, []);
  return referrals
    .filter((item) => item.referrerId === referrerId)
    .map(toReferral)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
};

export const getReferralStats = (userId: string): ReferralStats => {
  const history = getReferralsByReferrer(userId);
  const pending = history.filter((item) => item.status === 'PENDING').length;
  const qualified = history.filter((item) => item.status === 'QUALIFIED').length;
  const rewarded = history.filter((item) => item.status === 'REWARDED').length;

  return {
    totalInvites: history.length,
    pending,
    qualified,
    rewarded,
    rewardsEarned: rewarded * 50000,
  };
};
