/**
 * Telegram Mini App adapter.
 * Isolates Telegram WebApp API usage so the rest of the app
 * doesn't directly depend on Telegram APIs.
 */

export interface TelegramWebApp {
  initData: string;
  ready?: () => void;
  expand?: () => void;
  isExpanded?: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

let telegramWebApp: TelegramWebApp | null = null;

export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (telegramWebApp) {
    return telegramWebApp;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  telegramWebApp = window.Telegram?.WebApp ?? null;
  return telegramWebApp;
};

/**
 * Initialize Telegram WebApp if available.
 */
export const initializeTelegram = (): TelegramWebApp | null => {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    return null;
  }

  webApp.ready?.();
  webApp.expand?.();
  return webApp;
};

/**
 * Check if running inside Telegram Mini App.
 */
export const isTelegramMiniApp = (): boolean => !!getTelegramWebApp();

/**
 * Expand Telegram Mini App viewport.
 */
export const expandTelegramApp = (): void => {
  getTelegramWebApp()?.expand?.();
};

/**
 * Get Telegram init data string for backend auth.
 */
export const getTelegramInitData = (): string | null => {
  const initData = getTelegramWebApp()?.initData;
  return initData && initData.length > 0 ? initData : null;
};

/**
 * Get Telegram mini app status.
 */
export const getTelegramStatus = () => {
  const webApp = getTelegramWebApp();

  return {
    isAvailable: !!webApp,
    isExpanded: webApp?.isExpanded ?? false,
  };
};
