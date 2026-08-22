/**
 * Local storage layer for player state persistence.
 * Handles safe loading, saving, and error recovery.
 */

import { PlayerProgress, createInitialPlayerState } from '../game/playerState';

export const STORAGE_KEY = 'crown_tap_game_player_state';
const MIGRATION_KEY = 'crown_tap_game_migration_complete';

type LegacyState = {
  level?: number;
  xp?: number;
  coins?: number;
  totalTaps?: number;
  crownTier?: string;
};

/**
 * Load player state from localStorage.
 * Returns initial state if storage is corrupted or missing.
 */
export const loadPlayerState = (): PlayerProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createInitialPlayerState();
    }
    const parsed = JSON.parse(stored) as LegacyState & Partial<PlayerProgress>;
    if (
      typeof parsed.level === 'number' &&
      typeof parsed.xp === 'number' &&
      typeof parsed.coins === 'number' &&
      typeof parsed.totalTaps === 'number' &&
      typeof parsed.crownTier === 'string'
    ) {
      const coinsMicro =
        typeof parsed.coinsMicro === 'number'
          ? parsed.coinsMicro
          : Math.round(parsed.coins * 1_000_000);

      return {
        level: parsed.level,
        xp: parsed.xp,
        coins: parsed.coins,
        coinsMicro,
        totalTaps: parsed.totalTaps,
        crownTier: parsed.crownTier,
      };
    }
    return createInitialPlayerState();
  } catch (error) {
    console.warn('Failed to load player state from localStorage:', error);
    return createInitialPlayerState();
  }
};

/**
 * Save player state to localStorage.
 */
export const savePlayerState = (state: PlayerProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save player state to localStorage:', error);
  }
};

export const getMigrationCandidate = () => {
  try {
    if (localStorage.getItem(MIGRATION_KEY) === '1') {
      return undefined;
    }

    const state = loadPlayerState();
    return {
      coins: state.coins,
      xp: state.xp,
      totalTaps: state.totalTaps,
      completed: true,
    };
  } catch {
    return undefined;
  }
};

export const markMigrationComplete = (): void => {
  try {
    localStorage.setItem(MIGRATION_KEY, '1');
  } catch {
    // no-op
  }
};

/**
 * Reset player state to initial values.
 */
export const resetPlayerState = (): PlayerProgress => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset player state:', error);
  }
  return createInitialPlayerState();
};
