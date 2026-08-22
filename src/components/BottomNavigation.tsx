/**
 * Bottom navigation bar component.
 * Displays navigation links (Crown, Tasks, Profile).
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export type NavItem = 'crown' | 'referrals' | 'tasks' | 'profile';

interface BottomNavigationProps {
  activeTab?: NavItem;
  onChange?: (tab: NavItem) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = 'crown',
  onChange,
}) => {
  const [active, setActive] = useState<NavItem>(activeTab);

  useEffect(() => {
    setActive(activeTab);
  }, [activeTab]);

  const navItems: { id: NavItem; label: string; enabled: boolean }[] = [
    { id: 'crown', label: 'Crown', enabled: true },
    { id: 'referrals', label: 'Referrals', enabled: true },
    { id: 'tasks', label: 'Tasks', enabled: false },
    { id: 'profile', label: 'Profile', enabled: false },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-dark-gray border-t border-gray-800 px-4 py-3"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => {
              if (item.enabled) {
                setActive(item.id);
                onChange?.(item.id);
              }
            }}
            className={`flex-1 py-2 text-xs font-semibold tracking-wider transition-colors ${
              active === item.id
                ? 'text-bronze-400'
                : item.enabled
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            whileHover={item.enabled ? { scale: 1.05 } : {}}
            whileTap={item.enabled ? { scale: 0.95 } : {}}
            disabled={!item.enabled}
          >
            {item.label}
            {!item.enabled && <span className="text-xs ml-1">●</span>}
          </motion.button>
        ))}
      </div>
    </motion.nav>
  );
};
