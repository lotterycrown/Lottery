/**
 * Crown displayed on the main game screen.
 *
 * Single source of truth: current user level -> /crowns/crown_level_NNN.png
 * No procedural/SVG crown rendering exists in this project anymore.
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { GAME_CONFIG } from '../game/gameConfig';

interface CrownProps {
  scale?: number;
  level?: number;
  onTap: (e: React.PointerEvent<HTMLDivElement>) => void;
  isAnimating?: boolean;
}

export const crownAssetForLevel = (level: number): string => {
  const clamped = Math.min(100, Math.max(1, Math.floor(level)));
  return `/crowns/crown_level_${String(clamped).padStart(3, '0')}.png`;
};

export const Crown: React.FC<CrownProps> = ({
  scale = 1,
  level = 1,
  onTap,
  isAnimating = false,
}) => {
  const crownRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (crownRef.current) {
      const rect = crownRef.current.getBoundingClientRect();
      onTap(
        Object.assign(e, {
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        })
      );
    }
  };

  const src = crownAssetForLevel(level);

  return (
    <motion.div
      ref={crownRef}
      className="cursor-pointer select-none focus:outline-none rounded-full"
      onPointerDown={handlePointerDown}
      role="button"
      tabIndex={0}
      aria-label={`Tap the crown (level ${level}) to earn coins`}
      animate={{
        y: prefersReducedMotion ? 0 : [0, -8, 0],
        scale,
      }}
      transition={{
        duration: GAME_CONFIG.idleAnimationDuration / 1000,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileHover={!isAnimating ? { scale: 1.05 } : {}}
      whileTap={isAnimating ? {} : { scale: GAME_CONFIG.crownTapScale }}
    >
      <img
        src={src}
        width={300}
        height={300}
        alt={`Crown level ${level}`}
        draggable={false}
        onError={() => {
          console.error(`[Crown] Missing crown asset for level ${level}: ${src}`);
        }}
      />
    </motion.div>
  );
};
