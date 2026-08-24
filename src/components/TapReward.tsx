/**
 * Floating reward text component.
 * Shows "+0.001" text that floats up and fades out.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { GAME_CONFIG } from '../game/gameConfig';

interface TapRewardProps {
  x: number;
  y: number;
}

export const TapReward: React.FC<TapRewardProps> = ({ x, y }) => {
  return (
    <motion.div
      className="fixed pointer-events-none text-sm font-bold text-bronze-400"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      initial={{ opacity: 1, y: 0 }}
      animate={{
        opacity: 0,
        y: -60,
      }}
      transition={{
        duration: GAME_CONFIG.rewardTextDuration / 1000,
        ease: 'easeOut',
      }}
    >
      +{GAME_CONFIG.tapReward.toFixed(3)}
    </motion.div>
  );
};
