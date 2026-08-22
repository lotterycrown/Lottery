import crypto from 'crypto';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

interface TelegramWebAppData {
  user?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  auth_date: number;
  hash: string;
}

/**
 * Verify Telegram Mini App data signature
 * https://core.telegram.org/bots/webapps#validating-data-received-from-the-web-app
 */
export const verifyTelegramWebAppData = (initData: string): TelegramWebAppData | null => {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) return null;
    
    // Remove hash from params
    params.delete('hash');
    
    // Create data check string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create HMAC
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();
    
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Verify hash matches
    if (calculatedHash !== hash) return null;
    
    // Verify timestamp (prevent replay attacks)
    const authDate = parseInt(params.get('auth_date') || '0');
    const now = Math.floor(Date.now() / 1000);
    
    // Allow 5 minute window
    if (now - authDate > 300) return null;
    
    // Parse user data
    const userStr = params.get('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    
    return {
      user,
      auth_date: authDate,
      hash,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Extract Telegram user ID from init data
 */
export const getTelegramUserIdFromInitData = (initData: string): bigint | null => {
  const data = verifyTelegramWebAppData(initData);
  if (!data?.user) return null;
  return BigInt(data.user.id);
};

/**
 * Extract Telegram user info from init data
 */
export const getTelegramUserFromInitData = (initData: string) => {
  const data = verifyTelegramWebAppData(initData);
  return data?.user || null;
};
