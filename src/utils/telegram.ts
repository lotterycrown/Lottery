/**
 * Telegram Mini App adapter.
 * Isolates Telegram WebApp API usage so the rest of the app
 * doesn't directly depend on Telegram APIs.
 */

interface TelegramWebApp {
  ready?: () => void;
  expand?: () => void;
  isExpanded?: boolean;
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id?: number;
      username?: string;
    };
  };
}

let telegramWebApp: TelegramWebApp | null = null;

/**
 * Initialize Telegram WebApp if available.
 */
export const initializeTelegram = (): void => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    const webApp = (window as any).Telegram.WebApp as TelegramWebApp;
    telegramWebApp = webApp;
    webApp.ready?.();
    webApp.expand?.();
  }
};

/**
 * Check if running inside Telegram Mini App.
 */
export const isTelegramMiniApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Telegram?.WebApp;
};

/**
 * Expand Telegram Mini App viewport.
 */
export const expandTelegramApp = (): void => {
  if (telegramWebApp?.expand) {
    telegramWebApp.expand();
  }
};

/**
 * Get Telegram mini app status.
 */
export const getTelegramStatus = () => ({
  isAvailable: isTelegramMiniApp(),
  isExpanded: telegramWebApp?.isExpanded ?? false,
});

export const getTelegramInitData = (): string => {
  if (telegramWebApp?.initData && telegramWebApp.initData.length > 0) {
    return telegramWebApp.initData;
  }

  if (import.meta.env.DEV) {
    const devId = telegramWebApp?.initDataUnsafe?.user?.id ?? 1;
    const devUsername = telegramWebApp?.initDataUnsafe?.user?.username ?? 'dev';
    return `dev:${devId}:${devUsername}`;
  }

  return '';
};
