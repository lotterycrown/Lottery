import React, { useEffect } from 'react';
import { useAuthStore } from './useAuthStore';
import { getTelegramWebApp } from '../utils/telegram';

/**
 * Hook to initialize Telegram authentication
 */
export const useTelegramAuth = () => {
  const { login } = useAuthStore();
  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    const initTelegram = async () => {
      try {
        const webApp = getTelegramWebApp();
        if (!webApp) {
          console.warn('Telegram WebApp not available');
          setIsInitializing(false);
          return;
        }

        webApp.ready();
        webApp.expand();

        // Get initData from WebApp
        const initData = webApp.initData;
        if (initData) {
          await login(initData);
        }
      } catch (error) {
        console.error('Telegram auth failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initTelegram();
  }, [login]);

  return { isInitializing };
};
