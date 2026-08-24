/**
 * Centralized game configuration.
 * Avoid hardcoding values throughout the application.
 */

export const GAME_CONFIG = {
  // Tap mechanics
  tapReward: 0.001,
  
  // Player progression
  initialLevel: 1,
  initialXP: 0,
  initialCoins: 0,
  initialTaps: 0,
  initialCrownTier: 'bronze_1',
  
  // Particle system
  maxParticles: 80,
  particleLifetime: 1000, // ms
  particleGravity: 0.005,
  
  // Animation durations
  crownTapDuration: 300, // ms
  rewardTextDuration: 1500, // ms
  idleAnimationDuration: 4000, // ms
  
  // Crown visual settings
  crownIdleScale: 1.0,
  crownTapScale: 0.96,
  crownIdleRotation: 2, // degrees
  
  // Performance
  targetFPS: 60,
  enableMotionReducedSupport: true,
} as const;

export type GameConfig = typeof GAME_CONFIG;

/**
 * Crown tier progression: bronze -> silver -> gold cycles.
 * Each cycle has 3 sub-tiers; gems are added per sub-tier and crowns
 * get fancier each cycle. Matches backend CONSTANTS.CROWN_TIERS ranges.
 */
export interface CrownTierInfo {
  name: string;
  metal: 'bronze' | 'silver' | 'gold';
  cycle: number; // 1 = plain, 2 = +gems, 3 = +more gems/fancier
  gems: number; // number of decorative gems on the crown
  minLevel: number;
  maxLevel: number;
  gradient: [string, string, string]; // light, mid, dark
  glowColor: string;
  label: string;
}

export const CROWN_TIERS: CrownTierInfo[] = [
  { name: 'bronze_1', metal: 'bronze', cycle: 1, gems: 0, minLevel: 1,  maxLevel: 4,   gradient: ['#e8a25e', '#b87333', '#7a4a1f'], glowColor: 'rgba(184,115,51,0.35)', label: 'BRONZE' },
  { name: 'bronze_2', metal: 'bronze', cycle: 2, gems: 2, minLevel: 5,  maxLevel: 9,   gradient: ['#f0ae6c', '#c47f3f', '#8a5426'], glowColor: 'rgba(184,115,51,0.45)', label: 'BRONZE' },
  { name: 'bronze_3', metal: 'bronze', cycle: 3, gems: 3, minLevel: 10, maxLevel: 14,  gradient: ['#f8ba7a', '#d08b4b', '#9a5e2d'], glowColor: 'rgba(184,115,51,0.55)', label: 'BRONZE' },
  { name: 'silver_1', metal: 'silver', cycle: 1, gems: 0, minLevel: 15, maxLevel: 19,  gradient: ['#f5f5f5', '#c0c0c0', '#808080'], glowColor: 'rgba(192,192,192,0.35)', label: 'SILVER' },
  { name: 'silver_2', metal: 'silver', cycle: 2, gems: 2, minLevel: 20, maxLevel: 24,  gradient: ['#ffffff', '#cdcdcd', '#909090'], glowColor: 'rgba(192,192,192,0.45)', label: 'SILVER' },
  { name: 'silver_3', metal: 'silver', cycle: 3, gems: 3, minLevel: 25, maxLevel: 29,  gradient: ['#ffffff', '#dadada', '#a0a0a0'], glowColor: 'rgba(192,192,192,0.55)', label: 'SILVER' },
  { name: 'gold_1',   metal: 'gold',   cycle: 1, gems: 0, minLevel: 30, maxLevel: 39,  gradient: ['#ffe97a', '#d4af37', '#a67c00'], glowColor: 'rgba(212,175,55,0.40)', label: 'GOLD' },
  { name: 'gold_2',   metal: 'gold',   cycle: 2, gems: 2, minLevel: 40, maxLevel: 49,  gradient: ['#ffef94', '#e0be45', '#b08a0e'], glowColor: 'rgba(212,175,55,0.55)', label: 'GOLD' },
  { name: 'gold_3',   metal: 'gold',   cycle: 3, gems: 3, minLevel: 50, maxLevel: 100, gradient: ['#fff7ae', '#eccd53', '#ba981c'], glowColor: 'rgba(212,175,55,0.70)', label: 'GOLD' },
];

export const getCrownTierInfo = (crownTier: string): CrownTierInfo =>
  CROWN_TIERS.find((t) => t.name === crownTier) || CROWN_TIERS[0];
