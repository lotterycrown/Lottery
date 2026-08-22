/**
 * Main game screen.
 */

import React, { useEffect } from 'react';
import { Crown } from '../components/Crown';
import { Header } from '../components/Header';
import { Balance } from '../components/Balance';
import { CoinParticles } from '../components/CoinParticles';
import { TapReward } from '../components/TapReward';
import { BottomNavigation } from '../components/BottomNavigation';
import { AdCard } from '../components/AdCard';
import { useGameState } from '../hooks/useGameState';
import { useAdRewards } from '../hooks/useAdRewards';
import { useTapEffect } from '../hooks/useTapEffect';

export const Home: React.FC = () => {
  const { playerState, handleTap, addCoins, addXp } = useGameState();
  const { tapEffect, triggerTap, updateParticles } = useTapEffect();
  const { config, status, loading, watching, message, initialize, refreshStatus, watchAd } = useAdRewards();

  // Update particles every frame
  useEffect(() => {
    const interval = setInterval(() => {
      updateParticles();
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [updateParticles]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshStatus]);

  const handleCrownTap = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    triggerTap(x, y);
    handleTap();
  };

  const handleWatchAd = async () => {
    const reward = await watchAd();
    if (!reward || !reward.rewardCoins) return;

    addCoins(reward.rewardCoins);
    if (reward.rewardXp > 0) {
      addXp(reward.rewardXp);
    }
    triggerTap(window.innerWidth / 2, window.innerHeight - 180, `+${reward.rewardCoins.toFixed(3)} CROWN • +${reward.rewardXp} XP`);
  };

  if (!playerState) {
    return <div className="w-full h-screen bg-matte-black" />;
  }

  return (
    <div className="w-full h-screen bg-matte-black flex flex-col overflow-hidden">
      {/* Particles layer */}
      <CoinParticles
        particles={tapEffect.particles}
        onAnimationFrame={updateParticles}
      />

      {/* Floating reward text */}
      {tapEffect.rewardPosition && (
        <TapReward
          x={tapEffect.rewardPosition.x}
          y={tapEffect.rewardPosition.y}
          opacity={tapEffect.rewardPosition.opacity}
          text={tapEffect.rewardText}
        />
      )}

      {/* Header */}
      <Header level={playerState.level} balance={playerState.coins} />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 pb-24 px-4">
        {/* Crown */}
        <Crown
          scale={tapEffect.isTapping ? 0.96 : 1}
          onTap={handleCrownTap}
          isAnimating={tapEffect.isTapping}
        />

        {/* Balance */}
        <Balance coins={playerState.coins} />

        <AdCard
          config={config}
          status={status}
          loading={loading}
          watching={watching}
          message={message}
          onWatch={handleWatchAd}
        />
      </div>

      {/* Bottom navigation */}
      <BottomNavigation activeTab="crown" />
    </div>
  );
};
