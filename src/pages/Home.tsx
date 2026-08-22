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
import { useGameState } from '../hooks/useGameState';
import { useTapEffect } from '../hooks/useTapEffect';

export const Home: React.FC = () => {
  const { playerState, handleTap, isLoading, error } = useGameState();
  const { tapEffect, triggerTap, updateParticles } = useTapEffect();

  // Update particles every frame
  useEffect(() => {
    const interval = setInterval(() => {
      updateParticles();
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [updateParticles]);

  const handleCrownTap = async (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    triggerTap(x, y);
    await handleTap();
  };

  if (isLoading || !playerState) {
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
        />
      )}

      {/* Header */}
      <Header level={playerState.level} balance={playerState.coins} />

      {error && (
        <div className="px-4 py-2 text-center text-xs text-red-300 bg-red-950/30 border border-red-900/60 mx-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 pb-24">
        {/* Crown */}
        <Crown
          scale={tapEffect.isTapping ? 0.96 : 1}
          onTap={handleCrownTap}
          isAnimating={tapEffect.isTapping}
        />

        {/* Balance */}
        <Balance coins={playerState.coins} />
      </div>

      {/* Bottom navigation */}
      <BottomNavigation activeTab="crown" />
    </div>
  );
};
