/**
 * Header component displaying title, level, and balance.
 */

import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  level: number;
  balance: number;
}

export const Header: React.FC<HeaderProps> = ({ level, balance }) => {
  return (
    <header className="w-full px-4 pt-4 pb-2 flex justify-between items-start">
      {/* Title */}
      <motion.h1
        className="text-white text-sm font-bold tracking-wider"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        CROWN
      </motion.h1>

      {/* Balance and Level */}
      <motion.div
        className="text-right"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="text-xs text-gray-400 mb-1">
          LEVEL {level}
        </div>
        <div className="text-sm text-white font-semibold">
          {balance.toFixed(3)} coins
        </div>
      </motion.div>
    </header>
  );
};
