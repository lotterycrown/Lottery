import { referralCodeSchema } from './validation';

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME;
const MINI_APP_NAME = import.meta.env.VITE_MINI_APP_NAME;

export const buildReferralLink = (code: string): string => {
  if (!referralCodeSchema.safeParse(code).success) {
    throw new Error('Invalid referral code format');
  }

  if (!BOT_USERNAME || !MINI_APP_NAME) {
    return `https://t.me/your_bot_username/your_app_name?startapp=ref_${code}`;
  }

  return `https://t.me/${BOT_USERNAME}/${MINI_APP_NAME}?startapp=ref_${code}`;
};
