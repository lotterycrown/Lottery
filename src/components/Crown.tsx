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
      {/* Crown SVG - realistic tiered crown */}
      <svg
        width="300"
        height="300"
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-2xl"
        style={{ filter: `drop-shadow(0 0 40px ${tier.glowColor})` }}
      >
        <defs>
          {/* Metallic vertical gradient for the crown body */}
          <linearGradient id="crownMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={light} />
            <stop offset="55%" stopColor={mid} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
          {/* Radial sheen for 3D dome effect */}
          <radialGradient id="crownSheen" cx="0.38" cy="0.3" r="0.75">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* Band gradient (slightly darker, horizontal) */}
          <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mid} />
            <stop offset="50%" stopColor={dark} />
            <stop offset="100%" stopColor={mid} />
          </linearGradient>
          {/* Gem gradient */}
          <radialGradient id="gemGrad" cx="0.35" cy="0.35" r="0.8">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor={light} />
            <stop offset="100%" stopColor={dark} />
          </radialGradient>
          <filter id="crownShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.35" floodColor="#000000" />
          </filter>
        </defs>

        <g filter="url(#crownShadow)">
          {/* Base band */}
          <rect x="55" y="192" width="170" height="34" rx="10" fill="url(#bandGrad)" />
          {/* Band top rim highlight */}
          <rect x="55" y="192" width="170" height="6" rx="3" fill={light} opacity="0.7" />
          {/* Band bottom rim */}
          <rect x="55" y="220" width="170" height="6" rx="3" fill={dark} opacity="0.8" />

          {/* Crown body: smooth dome from band up to the peaks */}
          <path
            d="M 60 196
               C 60 150 78 128 98 120
               L 140 96
               L 182 120
               C 202 128 220 150 220 196
               Z"
            fill="url(#crownMetal)"
          />
          {/* 3D sheen overlay on body */}
          <path
            d="M 60 196
               C 60 150 78 128 98 120
               L 140 96
               L 182 120
               C 202 128 220 150 220 196
               Z"
            fill="url(#crownSheen)"
          />

          {/* Peaks (spires) with ball finials: left, mid-left, center, mid-right, right */}
          {/* Left spire */}
          <path d="M 74 196 L 88 118 L 104 128 L 96 196 Z" fill="url(#crownMetal)" />
          <circle cx="88" cy="112" r="9" fill="url(#crownMetal)" />
          <circle cx="85" cy="109" r="3" fill="#ffffff" opacity="0.55" />

          {/* Mid-left spire */}
          <path d="M 106 196 L 118 96 L 136 104 L 128 196 Z" fill="url(#crownMetal)" />
          <circle cx="120" cy="90" r="10" fill="url(#crownMetal)" />
          <circle cx="117" cy="87" r="3.2" fill="#ffffff" opacity="0.55" />

          {/* Center spire (tallest) */}
          <path d="M 132 196 L 140 74 L 150 196 Z" fill="url(#crownMetal)" />
          <circle cx="140" cy="66" r="11" fill="url(#crownMetal)" />
          <circle cx="137" cy="63" r="3.5" fill="#ffffff" opacity="0.6" />

          {/* Mid-right spire */}
          <path d="M 152 196 L 144 104 L 162 96 L 174 196 Z" fill="url(#crownMetal)" />
          <circle cx="160" cy="90" r="10" fill="url(#crownMetal)" />
          <circle cx="157" cy="87" r="3.2" fill="#ffffff" opacity="0.55" />

          {/* Right spire */}
          <path d="M 184 196 L 176 128 L 192 118 L 206 196 Z" fill="url(#crownMetal)" />
          <circle cx="192" cy="112" r="9" fill="url(#crownMetal)" />
          <circle cx="189" cy="109" r="3" fill="#ffffff" opacity="0.55" />

          {/* Center diamond jewel (always) */}
          <path
            d="M 140 128 L 156 150 L 140 176 L 124 150 Z"
            fill="url(#gemGrad)"
            stroke={dark}
            strokeWidth="1.5"
          />
          <path d="M 140 128 L 148 150 L 140 176 L 132 150 Z" fill="#ffffff" opacity="0.25" />

          {/* Tier 2: two side gems */}
          {tier.gems >= 2 && (
            <>
              <path d="M 96 148 L 106 162 L 96 178 L 86 162 Z" fill="url(#gemGrad)" stroke={dark} strokeWidth="1" />
              <path d="M 184 148 L 194 162 L 184 178 L 174 162 Z" fill="url(#gemGrad)" stroke={dark} strokeWidth="1" />
            </>
          )}

          {/* Tier 3: band studs + extra forehead gem */}
          {tier.gems >= 3 && (
            <>
              <circle cx="85" cy="209" r="5" fill="url(#gemGrad)" stroke={dark} strokeWidth="1" />
              <circle cx="118" cy="209" r="5" fill="url(#gemGrad)" stroke={dark} strokeWidth="1" />
              <circle cx="162" cy="209" r="5" fill="url(#gemGrad)" stroke={dark} strokeWidth="1" />
              <circle cx="195" cy="209" r="5" fill="url(#gemGrad)" stroke={dark} strokeWidth="1" />
              <path d="M 140 100 L 148 112 L 140 124 L 132 112 Z" fill="url(#gemGrad)" stroke={dark} strokeWidth="1" />
            </>
          )}
        </g>
      </svg>
    </motion.div>
  );
};

