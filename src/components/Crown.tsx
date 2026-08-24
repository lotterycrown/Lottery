/**
 * Premium bronze crown component.
 * 3D-looking metallic crown with idle animations.
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { GAME_CONFIG, getCrownTierInfo, CrownTierInfo } from '../game/gameConfig';

interface CrownProps {
  scale?: number;
  crownTier?: string;
  onTap: (e: React.PointerEvent<HTMLDivElement>) => void;
  isAnimating?: boolean;
}

export const Crown: React.FC<CrownProps> = ({
  scale = 1,
  crownTier = 'bronze_1',
  onTap,
  isAnimating = false,
}) => {
  const tier: CrownTierInfo = getCrownTierInfo(crownTier);
  const [light, mid, dark] = tier.gradient;
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

  return (
    <motion.div
      ref={crownRef}
      className="cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-bronze-400 rounded-full"
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
    >
      {/* Crown SVG */}
      <svg
        width="280"
        height="280"
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-2xl"
        style={{ filter: `drop-shadow(0 0 40px ${tier.glowColor})` }}
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="crownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: light, stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: mid, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: dark, stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id="crownHighlight" cx="35%" cy="35%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        {/* Base band */}
        <ellipse cx="140" cy="180" rx="110" ry="35" fill="url(#crownGradient)" />
        <ellipse
          cx="140"
          cy="175"
          rx="110"
          ry="30"
          fill="url(#crownHighlight)"
          opacity="0.4"
        />

        {/* Left peak */}
        <path
          d="M 70 180 L 50 80 L 90 160 Z"
          fill="url(#crownGradient)"
          filter="url(#shadow)"
        />

        {/* Center peak (tallest) */}
        <path
          d="M 140 180 L 120 40 L 160 40 L 140 180 Z"
          fill="url(#crownGradient)"
          filter="url(#shadow)"
        />

        {/* Right peak */}
        <path
          d="M 210 180 L 190 160 L 230 80 Z"
          fill="url(#crownGradient)"
          filter="url(#shadow)"
        />

        {/* Center highlight on main peak */}
        <ellipse
          cx="140"
          cy="70"
          rx="12"
          ry="30"
          fill="url(#crownHighlight)"
          opacity="0.5"
        />

        {/* Jewel-like accent on center peak (always present) */}
        <circle cx="140" cy="50" r="8" fill={light} opacity="0.85" />
        <circle cx="140" cy="50" r="5" fill="#ffffff" opacity="0.6" />

        {/* Tier gems: 2nd sub-tier adds side gems */}
        {tier.gems >= 2 && (
          <>
            <circle cx="110" cy="100" r="6" fill={mid} opacity="0.85" />
            <circle cx="110" cy="100" r="3.5" fill="#ffffff" opacity="0.6" />
            <circle cx="170" cy="100" r="6" fill={mid} opacity="0.85" />
            <circle cx="170" cy="100" r="3.5" fill="#ffffff" opacity="0.6" />
          </>
        )}

        {/* Tier gems: 3rd sub-tier adds a large center gem + band studs */}
        {tier.gems >= 3 && (
          <>
            <circle cx="140" cy="120" r="9" fill={light} opacity="0.9" />
            <circle cx="140" cy="120" r="5.5" fill="#ffffff" opacity="0.65" />
            <circle cx="95" cy="178" r="4" fill={light} opacity="0.8" />
            <circle cx="140" cy="183" r="4" fill={light} opacity="0.8" />
            <circle cx="185" cy="178" r="4" fill={light} opacity="0.8" />
          </>
        )}

        {/* Shadow filter */}
        <filter id="shadow">
          <feDropShadow
            dx="2"
            dy="4"
            stdDeviation="3"
            floodOpacity="0.3"
            floodColor="#000000"
          />
        </filter>
      </svg>
    </motion.div>
  );
};
