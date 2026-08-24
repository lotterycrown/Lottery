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
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

let telegramWebApp: TelegramWebApp | null = null;

/**
 * Get the Telegram WebApp object if running inside Telegram.
 */
export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? telegramWebApp;
};

/**
 * Initialize Telegram WebApp if available.
 */
export const initializeTelegram = (): void => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    telegramWebApp = window.Telegram.WebApp;
    telegramWebApp.ready?.();
    telegramWebApp.expand?.();
  }
};

/**
 * Check if running inside Telegram Mini App.
 */
export const isTelegramMiniApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!window.Telegram?.WebApp;
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
