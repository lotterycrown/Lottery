/**
 * Root application component.
 */

import React, { useEffect } from 'react';
import { Home } from './pages/Home';
import { Referrals } from './pages/Referrals';
import { NavItem } from './components/BottomNavigation';
import { initializeTelegram } from './utils/telegram';

function App() {
  const [activeTab, setActiveTab] = React.useState<'crown' | 'referrals'>('crown');

  useEffect(() => {
    // Initialize Telegram Mini App if available
    initializeTelegram();
  }, []);

  const handleNavigation = (tab: NavItem): void => {
    if (tab === 'crown' || tab === 'referrals') {
      setActiveTab(tab);
    }
  };

  if (activeTab === 'referrals') {
    return <Referrals onNavigate={handleNavigation} />;
  }

  return <Home onNavigate={handleNavigation} />;
}

export default App;
