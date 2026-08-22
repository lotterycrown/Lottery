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
