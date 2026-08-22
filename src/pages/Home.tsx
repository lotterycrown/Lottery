/**
 * Main game screen.
 */

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown } from '../components/Crown';
import { Header } from '../components/Header';
import { Balance } from '../components/Balance';
import { CoinParticles } from '../components/CoinParticles';
import { TapReward } from '../components/TapReward';
import { useTapEffect } from '../hooks/useTapEffect';

interface HomeProps {
  level: number;
  coins: number;
  latestUnlockedTaskId: string | null;
  onClearUnlockToast: () => void;
  onTap: () => void;
}

export const Home: React.FC<HomeProps> = ({
  level,
  coins,
  latestUnlockedTaskId,
  onClearUnlockToast,
  onTap,
}) => {
  const { tapEffect, triggerTap, updateParticles } = useTapEffect();

  useEffect(() => {
    const interval = setInterval(() => {
      updateParticles();
    }, 16);

    return () => clearInterval(interval);
  }, [updateParticles]);

  useEffect(() => {
    if (!latestUnlockedTaskId) {
      return;
    }

    const timeout = setTimeout(() => {
      onClearUnlockToast();
    }, 2500);

    return () => clearTimeout(timeout);
  }, [latestUnlockedTaskId, onClearUnlockToast]);

  const handleCrownTap = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    triggerTap(x, y);
    onTap();
  };

  return (
    <div className="w-full h-screen bg-matte-black flex flex-col overflow-hidden relative">
      <AnimatePresence>
        {latestUnlockedTaskId && (
          <>
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.22, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              style={{
                background:
                  'radial-gradient(circle at center, rgba(205,127,50,0.18) 0%, rgba(10,10,10,0) 60%)',
              }}
            />
            <motion.div
              className="absolute top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-3 bg-dark-gray border border-bronze-500/40 rounded-xl shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <motion.div
                className="text-bronze-400 text-xs tracking-[0.2em] text-center"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 0.45 }}
              >
                NEW TASK
              </motion.div>
              <div className="text-white text-xs mt-1 text-center">
                Complete this task to earn rewards.
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CoinParticles particles={tapEffect.particles} onAnimationFrame={updateParticles} />

      {tapEffect.rewardPosition && (
        <TapReward
          x={tapEffect.rewardPosition.x}
          y={tapEffect.rewardPosition.y}
          opacity={tapEffect.rewardPosition.opacity}
        />
      )}

      <Header level={level} balance={coins} />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 pb-24">
        <Crown scale={tapEffect.isTapping ? 0.96 : 1} onTap={handleCrownTap} isAnimating={tapEffect.isTapping} />
        <Balance coins={coins} />
      </div>
    </div>
  );
};
