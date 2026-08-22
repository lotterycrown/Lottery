/**
 * Telegram Mini App adapter.
 * Isolates Telegram WebApp API usage so the rest of the app
 * doesn't directly depend on Telegram APIs.
 */

interface TelegramWebApp {
  ready?: () => void;
  expand?: () => void;
  isExpanded?: boolean;
}

let telegramWebApp: TelegramWebApp | null = null;

/**
 * Initialize Telegram WebApp if available.
 */
export const initializeTelegram = (): void => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    telegramWebApp = (window as any).Telegram.WebApp;
    telegramWebApp.ready?.();
    telegramWebApp.expand?.();
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
