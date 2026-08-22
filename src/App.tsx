/**
 * Root application component.
 */

import { useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { Tasks } from './pages/Tasks';
import { Profile } from './pages/Profile';
import { initializeTelegram } from './utils/telegram';
import { BottomNavigation, NavItem } from './components/BottomNavigation';
import { useGameState } from './hooks/useGameState';

function App() {
  const [activeTab, setActiveTab] = useState<NavItem>('crown');
  const {
    playerState,
    availableTasks,
    inProgressTasks,
    completedTasks,
    claimedTasks,
    latestUnlockedTaskId,
    hasUnreadTaskUnlock,
    handleTap,
    claimTaskReward,
    markTasksPageOpened,
    clearUnlockToast,
  } = useGameState();

  useEffect(() => {
    initializeTelegram();
  }, []);

  useEffect(() => {
    if (activeTab === 'tasks') {
      markTasksPageOpened();
    }
  }, [activeTab, markTasksPageOpened]);

  if (!playerState) {
    return <div className="w-full h-screen bg-matte-black" />;
  }

  return (
    <div className="w-full h-screen bg-matte-black overflow-hidden">
      {activeTab === 'crown' ? (
        <Home
          level={playerState.level}
          coins={playerState.coins}
          latestUnlockedTaskId={latestUnlockedTaskId}
          onClearUnlockToast={clearUnlockToast}
          onTap={handleTap}
        />
      ) : null}

      {activeTab === 'tasks' ? (
        <Tasks
          availableTasks={availableTasks}
          inProgressTasks={inProgressTasks}
          completedTasks={completedTasks}
          claimedTasks={claimedTasks}
          onClaimReward={claimTaskReward}
        />
      ) : null}

      {activeTab === 'profile' ? <Profile /> : null}

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasTaskNotification={hasUnreadTaskUnlock}
      />
    </div>
  );
}

export default App;
