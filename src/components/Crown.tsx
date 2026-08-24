/**
 * Crown rendered exactly like the Flutter CrownPainter:
 * 5-spike crown silhouette, tier-driven metal gradient, and level-based gems.
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { GAME_CONFIG } from '../game/gameConfig';

interface CrownProps {
  scale?: number;
  level?: number;
  crownTier?: string;
  onTap: (e: React.PointerEvent<HTMLDivElement>) => void;
  isAnimating?: boolean;
}

const METALS: Record<'bronze' | 'silver' | 'gold', [string, string]> = {
  bronze: ['#CD7F32', '#A0522D'],
  silver: ['#E0E0E0', '#757575'],
  gold: ['#FFD700', '#DAA520'],
};

const MYTHIC: [string, string, string] = ['#FFD700', '#FFF8DC', '#B8860B'];

const tierMetal = (name: string): 'bronze' | 'silver' | 'gold' => {
  if (name.startsWith('silver')) return 'silver';
  if (name.startsWith('gold')) return 'gold';
  return 'bronze';
};

const gemColorFor = (level: number): string | null => {
  if (level <= 30) return null;
  if (level <= 60) return '#DC143C';
  if (level <= 80) return '#1E90FF';
  return '#50C878';
};

const glowFor = (level: number, gemColor: string | null): string => {
  if (level <= 60 || !gemColor) return 'none';
  const radius = (level - 60) * 0.8;
  return `drop-shadow(0 0 ${radius}px ${gemColor})`;
};

export const Crown: React.FC<CrownProps> = ({
  scale = 1,
  level = 1,
  crownTier = 'bronze_1',
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

  const metal = tierMetal(crownTier);
  const gemColor = gemColorFor(level);
  const glow = glowFor(level, gemColor);

  const isMythic = level > 90;
  const stops = isMythic ? MYTHIC : METALS[metal];

  const crownPath =
    'M 10 80 L 15 35 L 35 55 L 50 20 L 65 55 L 85 35 L 90 80 Z';

  return (
    <motion.div
      ref={crownRef}
      className="cursor-pointer select-none focus:outline-none rounded-full"
      onPointerDown={handlePointerDown}
      role="button"
      tabIndex={0}
      aria-label="Tap the crown to earn coins"
      animate={{
        y: prefersReducedMotion ? 0 : [0, -8, 0],
        rotateZ: prefersReducedMotion ? 0 : [0, 1, -1, 0],
        scale,
      }}
      transition={{
        duration: GAME_CONFIG.idleAnimationDuration / 1000,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileHover={!isAnimating ? { scale: 1.05 } : {}}
      whileTap={isAnimating ? {} : { scale: GAME_CONFIG.crownTapScale }}
      style={{ filter: glow }}
    >
      <svg
        width="300"
        height="300"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="crownBody" x1="0" y1="0" x2="0" y2="1">
            {isMythic ? (
              <>
                <stop offset="0%" stopColor={stops[0]} />
                <stop offset="50%" stopColor={stops[1]} />
                <stop offset="100%" stopColor={stops[2]} />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={stops[0]} />
                <stop offset="100%" stopColor={stops[1]} />
              </>
            )}
          </linearGradient>
          <linearGradient id="crownShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={crownPath} fill="url(#crownBody)" stroke="#00000022" strokeWidth="0.5" />
        <path d={crownPath} fill="url(#crownShine)" />

        {gemColor && (
          <circle cx="50" cy="45" r="5" fill={gemColor} stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.8" />
        )}

        {level > 60 && gemColor && (
          <>
            <circle cx="30" cy="60" r="3.5" fill={gemColor} stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.6" />
            <circle cx="70" cy="60" r="3.5" fill={gemColor} stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.6" />
          </>
        )}
      </svg>
    </motion.div>
  );
};
