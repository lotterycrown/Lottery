import { useEffect, useState } from 'react';
import { useAuthStore } from './useAuthStore';
import { getTelegramInitData, initializeTelegram } from '../utils/telegram';

/**
 * Hook to initialize Telegram authentication
 */
export const useTelegramAuth = () => {
  const { login, token, user } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initTelegram = async () => {
      if (token || user) {
        setIsInitializing(false);
        return;
      }

      try {
        const webApp = initializeTelegram();
        if (!webApp) {
          setIsInitializing(false);
          return;
        }

        const initData = getTelegramInitData();
        if (!initData) {
          setError('Missing Telegram init data');
          setIsInitializing(false);
          return;
        }

        await login(initData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Telegram authentication failed');
      } finally {
        setIsInitializing(false);
      }
    };

    void initTelegram();
  }, [login, token, user]);

  return { isInitializing, error };
};
