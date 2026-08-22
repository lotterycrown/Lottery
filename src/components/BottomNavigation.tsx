/**
 * Bottom navigation bar component.
 */

import React from 'react';
import { motion } from 'framer-motion';

export type NavItem = 'crown' | 'tasks' | 'profile';

interface BottomNavigationProps {
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  hasTaskNotification?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  hasTaskNotification = false,
}) => {
  const navItems: { id: NavItem; label: string; enabled: boolean }[] = [
    { id: 'crown', label: 'Crown', enabled: true },
    { id: 'tasks', label: 'Tasks', enabled: true },
    { id: 'profile', label: 'Profile', enabled: true },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-dark-gray border-t border-gray-800 px-4 py-3 z-30"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex justify-around items-center gap-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const showBadge = item.id === 'tasks' && hasTaskNotification && activeTab !== 'tasks';

          return (
            <motion.button
              key={item.id}
              onClick={() => {
                if (item.enabled) {
                  onTabChange(item.id);
                }
              }}
              className={`relative flex-1 py-2 text-xs font-semibold tracking-wider transition-colors rounded-md ${
                isActive
                  ? 'text-bronze-400'
                  : item.enabled
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              whileHover={item.enabled ? { scale: 1.03 } : {}}
              whileTap={item.enabled ? { scale: 0.96 } : {}}
              disabled={!item.enabled}
            >
              {item.label}
              {showBadge ? (
                <motion.span
                  className="absolute top-1/2 ml-1 -translate-y-1/2 text-bronze-400"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  ●
                </motion.span>
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};
