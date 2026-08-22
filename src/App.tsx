import { useEffect } from 'react';
import { Home } from './pages/Home';
import { useAuthStore } from './hooks/useAuthStore';
import { useGameStore } from './hooks/useGameStore';
import { useTelegramAuth } from './hooks/useTelegramAuth';
import { initializeTelegram } from './utils/telegram';

function App() {
  const { token, user, loading, error, loadUser } = useAuthStore();
  const syncBalance = useGameStore((state) => state.syncBalance);
  const { isInitializing, error: telegramError } = useTelegramAuth();

  useEffect(() => {
    initializeTelegram();
  }, []);

  useEffect(() => {
    if (token && !user && !loading) {
      void loadUser();
    }
  }, [token, user, loading, loadUser]);

  useEffect(() => {
    if (!user) {
      return;
    }

    syncBalance(user.balance, user.xp, user.level, user.crownTier, user.totalTaps);
  }, [user, syncBalance]);

  const isAuthenticating = isInitializing || loading || (Boolean(token) && !user);

  if (isAuthenticating) {
    return <div className="w-full h-screen bg-matte-black" />;
  }

  if (!user) {
    return (
      <div className="w-full h-screen bg-matte-black text-white flex items-center justify-center p-6 text-center">
        {telegramError || error || 'Authentication required. Open this app in Telegram Mini App or login first.'}
      </div>
    );
  }

  return <Home />;
}

export default App;
