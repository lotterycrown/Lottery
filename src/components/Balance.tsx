/**
 * Balance display component.
 * Shows current coin balance and tap reward info.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { GAME_CONFIG } from '../game/gameConfig';

interface BalanceProps {
  coins: number;
}

export const Balance: React.FC<BalanceProps> = ({ coins }) => {
  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.div
        className="text-3xl font-bold text-white"
        key={coins}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {coins.toFixed(3)}
      </motion.div>
      <div className="text-xs text-gray-500">
        +{GAME_CONFIG.tapReward.toFixed(3)} per tap
      </div>
    </motion.div>
  );
};
