/**
 * Root application component.
 */

import { useEffect } from 'react';
import { Home } from './pages/Home';
import { initializeTelegram } from './utils/telegram';

function App() {
  useEffect(() => {
    // Initialize Telegram Mini App if available
    initializeTelegram();
  }, []);

  return <Home />;
}

export default App;
